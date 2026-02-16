import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../Layout/Layout';
import Modal from '../Modal';
import { notesAPI, type Note } from '../../services/apiService';
import { decryptNote } from '../../services/cryptoService';

interface DecryptedNote {
  id: number;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  // Modal state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; noteId: number | null }>({
    isOpen: false,
    noteId: null,
  });
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });
  
  const { user, token, getMasterKey, logout } = useAuth();
  const navigate = useNavigate();

  // Helper function to strip Markdown syntax
  const stripMarkdown = (text: string): string => {
    return text
      // Remove headings (# ## ###)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold (**text** or __text__)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      // Remove italic (*text* or _text_)
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove strikethrough (~~text~~)
      .replace(/~~(.*?)~~/g, '$1')
      // Remove inline code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove links [text](url)
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
      // Remove bullet list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      // Remove numbered list markers
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove checkbox markers
      .replace(/^\s*-\s*\[([ x])\]\s+/gm, '')
      // Remove blockquotes
      .replace(/^\s*>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const loadNotes = async () => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const masterKey = getMasterKey();
      if (!masterKey) {
        setError('Master key not found. Please log in again.');
        logout();
        navigate('/login');
        return;
      }

      const response = await notesAPI.getAll(token);
      
      // Decrypt all notes
      const decryptedNotes: DecryptedNote[] = await Promise.all(
        response.notes.map(async (note: Note) => {
          try {
            const plaintext = await decryptNote(
              {
                ciphertext: note.ciphertext,
                iv: note.iv,
                authTag: note.authTag,
              },
              masterKey,
              user.id
            );

            // Extract title and preview
            const lines = plaintext.split('\n');
            const rawTitle = lines[0] || 'Untitled Note';
            const rawPreview = lines.slice(1).join(' ');
            
            // Strip Markdown syntax for display
            const title = stripMarkdown(rawTitle) || 'Untitled Note';
            const preview = stripMarkdown(rawPreview).substring(0, 100);

            return {
              id: note.id,
              title,
              preview,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            };
          } catch (err) {
            console.error(`Failed to decrypt note ${note.id}:`, err);
            return {
              id: note.id,
              title: '⚠️ Decryption Failed',
              preview: 'This note could not be decrypted. It may be corrupted.',
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            };
          }
        })
      );

      setNotes(decryptedNotes);
    } catch (err: any) {
      console.error('Failed to load notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = (noteId: number) => {
    if (!token) return;
    
    setDeleteConfirmModal({
      isOpen: true,
      noteId,
    });
  };

  const confirmDelete = async () => {
    if (!token || !deleteConfirmModal.noteId) return;
    
    try {
      await notesAPI.delete(token, deleteConfirmModal.noteId);
      setNotes(notes.filter((note) => note.id !== deleteConfirmModal.noteId));
      setDeleteConfirmModal({ isOpen: false, noteId: null });
    } catch (err: any) {
      setDeleteConfirmModal({ isOpen: false, noteId: null });
      setErrorModal({
        isOpen: true,
        message: err.message || 'Failed to delete note. Please try again.',
      });
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-background-light dark:bg-[#0a0f16] text-text-main-light dark:text-white transition-colors duration-200">
        {/* Page Header */}
        <div className="sticky top-0 z-10 backdrop-blur-md px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-white whitespace-nowrap">
                  My Secure Notes
                </h1>
                <p className="text-text-sub-light dark:text-gray-400 text-sm pt-1">
                  Your vault is protected with zero-knowledge encryption.
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="relative group flex-1 max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-sub-light dark:text-gray-500 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Search encrypted notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light dark:border-[#1a2332] bg-white dark:bg-[#0a0f16] text-text-main-light dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <button
                onClick={() => navigate('/notes/new')}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 font-semibold text-sm whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                New Note
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-8 py-0 pb-6">

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">
                progress_activity
              </span>
              <p className="text-text-sub-light dark:text-gray-400">Decrypting your notes...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
              <span className="material-symbols-outlined text-5xl">{searchQuery ? 'search_off' : 'note_add'}</span>
            </div>
            <h3 className="text-xl font-bold text-text-main-light dark:text-white mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-text-sub-light dark:text-gray-400 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first encrypted note to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/notes/new')}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                <span className="material-symbols-outlined">add</span>
                Create Note
              </button>
            )}
          </div>
        )}

        {/* Notes Grid */}
        {!isLoading && filteredNotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-surface-light dark:bg-[#0f1419] border border-border-light dark:border-[#1a2332] rounded-xl p-6 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 transition-all cursor-pointer group flex flex-col"
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                  <h3 className="text-lg font-bold text-text-main-light dark:text-white line-clamp-1 flex-1">
                    {note.title}
                  </h3>
                </div>
                <p className="text-sm text-text-sub-light dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                  {note.preview || 'Empty note'}
                </p>
                <div className="flex items-center justify-between text-xs text-text-sub-light dark:text-gray-500 mt-auto pt-3 border-t border-border-light dark:border-[#1a2332]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>Modified {formatDate(note.updatedAt)}</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === note.id ? null : note.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#1a2332] text-text-sub-light dark:text-gray-400 hover:text-text-main-light dark:hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px] rotate-90">more_vert</span>
                    </button>
                    {openMenuId === note.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-30 bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#1a2332] rounded-lg shadow-xl z-10 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/notes/${note.id}`);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-text-main-light dark:text-white hover:bg-gray-100 dark:hover:bg-[#1a2332] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          <span className="text-sm font-medium">Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          <span className="text-sm font-medium">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Create New Note Card */}
            <div
              onClick={() => navigate('/notes/new')}
              className="bg-surface-light dark:bg-[#0f1419] border-2 border-dashed border-border-light dark:border-[#1a2332] rounded-xl p-6 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-[#111820] transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px] group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-3xl text-primary">add</span>
              </div>
              <p className="text-text-sub-light dark:text-gray-400 font-medium">Create New Note</p>
            </div>
          </div>
        )}

        {/* Footer Info */}
        {!isLoading && notes.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border-light dark:border-[#1a2332] flex items-center justify-center gap-8 text-xs text-text-sub-light dark:text-gray-600">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Zero-knowledge architecture</span>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, noteId: null })}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        type="confirm"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
      />

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title="Error"
        message={errorModal.message}
        type="error"
        confirmText="OK"
      />
    </Layout>
  );
}

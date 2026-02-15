import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  
  const { user, token, getMasterKey, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotes();
  }, []);

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
            const title = lines[0] || 'Untitled Note';
            const preview = lines.slice(1).join(' ').substring(0, 100);

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

  const handleDeleteNote = async (noteId: number) => {
    if (!token || !confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notesAPI.delete(token, noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (err: any) {
      alert('Failed to delete note: ' + err.message);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const parts = user.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

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
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display text-text-main-light dark:text-text-main-dark transition-colors duration-200">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                encrypted
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
              Secure Notes
            </h1>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={logout}
              className="hidden md:flex items-center gap-2 text-sm font-medium text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Logout
            </button>
            <div className="h-6 w-px bg-border-light dark:bg-border-dark hidden md:block"></div>
            <button className="group flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-background-light dark:hover:bg-background-dark transition-colors">
              <span className="text-sm font-semibold hidden sm:block">{user?.email}</span>
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent-teal flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-background-dark group-hover:ring-primary/30 transition-all">
                <span className="text-sm font-bold">{getUserInitials()}</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-text-main-light dark:text-text-main-dark mb-1">
              My Secure Notes
            </h2>
            <p className="text-text-sub-light dark:text-text-sub-dark text-sm">
              Your private vault is synced and up to date.
            </p>
          </div>
          <button
            onClick={() => navigate('/notes/new')}
            className="flex items-center justify-center gap-2 bg-accent-teal hover:bg-accent-teal-hover text-white px-5 py-2.5 rounded-lg shadow-md shadow-accent-teal/20 transition-all active:scale-95 font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Note
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-sub-light dark:text-text-sub-dark group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-main-light dark:text-text-main-dark placeholder:text-text-sub-light dark:placeholder:text-text-sub-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
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
              <p className="text-text-sub-light dark:text-text-sub-dark">Loading your notes...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
              <span className="material-symbols-outlined text-5xl">note_add</span>
            </div>
            <h3 className="text-xl font-bold text-text-main-light dark:text-text-main-dark mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-text-sub-light dark:text-text-sub-dark mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first encrypted note to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/notes/new')}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-all"
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
                className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark line-clamp-2 flex-1">
                    {note.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark line-clamp-3 mb-4">
                  {note.preview || 'Empty note'}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-sub-light dark:text-text-sub-dark">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

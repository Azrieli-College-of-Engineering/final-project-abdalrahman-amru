import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notesAPI } from '../../services/apiService';
import { encryptNote, decryptNote } from '../../services/cryptoService';

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const isNewNote = id === 'new';
  const noteId = isNewNote ? 0 : parseInt(id || '0');

  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(!isNewNote);

  const { user, token, getMasterKey } = useAuth();
  const navigate = useNavigate();
  const autoSaveTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isNewNote) {
      loadNote();
    }
  }, [id]);

  useEffect(() => {
    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (content && !isNewNote) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content]);

  const loadNote = async () => {
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
        navigate('/login');
        return;
      }

      const note = await notesAPI.getOne(token, noteId);
      
      // Decrypt note
      const plaintext = await decryptNote(
        {
          ciphertext: note.ciphertext,
          iv: note.iv,
          authTag: note.authTag,
        },
        masterKey,
        user.id
      );

      setContent(plaintext);
    } catch (err: any) {
      console.error('Failed to load note:', err);
      setError(err.message || 'Failed to load note');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !user || !content.trim()) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const masterKey = getMasterKey();
      if (!masterKey) {
        setError('Master key not found. Please log in again.');
        navigate('/login');
        return;
      }

      // Encrypt note content
      const encryptedData = await encryptNote(
        content,
        masterKey,
        user.id
      );

      if (isNewNote) {
        // Create new note
        const response = await notesAPI.create(token, encryptedData);
        // Redirect to edit mode with the new note ID
        navigate(`/notes/${response.noteId}`, { replace: true });
      } else {
        // Update existing note
        await notesAPI.update(token, noteId, encryptedData);
      }

      setLastSaved(new Date());
    } catch (err: any) {
      console.error('Failed to save note:', err);
      setError(err.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const getTitle = () => {
    const lines = content.split('\n');
    return lines[0] || 'Untitled Note';
  };

  const getBody = () => {
    const lines = content.split('\n');
    return lines.slice(1).join('\n');
  };

  const handleTitleChange = (newTitle: string) => {
    const lines = content.split('\n');
    lines[0] = newTitle;
    setContent(lines.join('\n'));
  };

  const handleBodyChange = (newBody: string) => {
    const lines = content.split('\n');
    lines[0] = getTitle();
    setContent([lines[0], newBody].join('\n'));
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved yet';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes === 0) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] dark:border-[#2d3748] bg-white/90 dark:bg-[#101922]/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[#617589] dark:text-[#a0aec0] hover:text-primary transition-colors text-sm font-medium leading-normal group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span>All Notes</span>
          </button>
          <div className="h-6 w-px bg-[#e5e7eb] dark:bg-[#2d3748] mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              Secure Notes
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="hidden sm:inline-flex text-xs text-[#617589] dark:text-[#a0aec0] font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full items-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              Auto-saving...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span className="hidden sm:inline-flex text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="truncate">Save</span>
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-auto w-full max-w-[800px] px-4 py-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">
              progress_activity
            </span>
            <p className="text-text-sub-light dark:text-text-sub-dark">Loading note...</p>
          </div>
        </div>
      )}

      {/* Main Editor Container */}
      {!isLoading && (
        <main className="flex-1 flex justify-center w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <div className="w-full max-w-[800px] flex flex-col h-full bg-white dark:bg-[#1a202c] shadow-sm rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] min-h-[calc(100vh-180px)]">
            {/* Title Input */}
            <div className="px-8 pt-10 pb-4">
              <input
                className="w-full bg-transparent border-none p-0 text-3xl sm:text-4xl font-bold text-[#111418] dark:text-white placeholder:text-[#9aaebf] dark:placeholder:text-[#4a5568] focus:ring-0 focus:outline-none"
                placeholder="Note Title"
                type="text"
                value={getTitle()}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            {/* Divider (subtle) */}
            <div className="px-8">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#e5e7eb] dark:via-[#2d3748] to-transparent"></div>
            </div>

            {/* Note Body */}
            <div className="flex-1 px-8 py-6">
              <textarea
                className="w-full h-full min-h-[400px] resize-none bg-transparent border-none p-0 text-lg leading-relaxed text-[#374151] dark:text-[#cbd5e0] placeholder:text-[#9aaebf] dark:placeholder:text-[#4a5568] focus:ring-0 focus:outline-none font-normal"
                placeholder="Start writing..."
                value={getBody()}
                onChange={(e) => handleBodyChange(e.target.value)}
              />
            </div>

            {/* Status Bar / Footer */}
            <div className="mt-auto border-t border-[#f0f2f4] dark:border-[#2d3748] bg-[#fafafa] dark:bg-[#171923] px-6 py-3 rounded-b-xl flex flex-wrap gap-x-6 gap-y-2 items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-6 text-[#617589] dark:text-[#a0aec0]">
                <div className="flex items-center gap-2" title="Your data is encrypted locally before sending">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="font-medium">Encrypted with AES-256-GCM</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span className="font-medium">Last saved {formatLastSaved()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="font-medium hidden sm:inline">Synced</span>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

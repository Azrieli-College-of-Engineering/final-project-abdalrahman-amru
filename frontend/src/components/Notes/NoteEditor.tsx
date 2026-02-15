import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../context/AuthContext';
import { notesAPI } from '../../services/apiService';
import { encryptNote, decryptNote } from '../../services/cryptoService';
import MarkdownToolbar from './MarkdownToolbar';
import Sidebar from '../Layout/Sidebar';

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const isNewNote = id === 'new';
  const noteId = isNewNote ? 0 : parseInt(id || '0');

  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(!isNewNote);
  const [isPreviewMode, setIsPreviewMode] = useState(!isNewNote);

  const { user, token, getMasterKey } = useAuth();
  const navigate = useNavigate();
  const autoSaveTimeoutRef = useRef<number | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleToolbarInsert = (before: string, after: string, defaultText?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || defaultText || '';
    
    const newContent = 
      content.substring(0, start) +
      before +
      textToInsert +
      after +
      content.substring(end);
    
    setContent(newContent);
    
    // Restore focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Action Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] dark:border-[#2d3748] bg-white/90 dark:bg-[#0f1419]/90 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-[#111418] dark:text-white text-lg font-semibold">Note Editor</h1>
            {isSaving && (
              <span className="inline-flex text-xs text-[#617589] dark:text-[#a0aec0] font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span className="hidden sm:inline">Auto-saving...</span>
              </span>
            )}
            {!isSaving && lastSaved && (
              <span className="inline-flex text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d3748] hover:bg-gray-50 dark:hover:bg-[#1a202c] text-[#617589] dark:text-[#a0aec0] transition-colors text-sm font-medium"
              title={isPreviewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPreviewMode ? 'edit' : 'visibility'}
              </span>
              <span className="hidden sm:inline">{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-5 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="w-full max-w-[1200px] flex flex-col h-full bg-white dark:bg-[#1a202c] shadow-sm rounded-xl border border-[#e5e7eb] dark:border-[#2d3748] min-h-[calc(100vh-180px)]">
            
            {/* Markdown Toolbar (only in edit mode) */}
            {!isPreviewMode && (
              <MarkdownToolbar onInsert={handleToolbarInsert} />
            )}

            {/* Editor/Preview Content */}
            <div className="flex-1 overflow-y-auto">
              {isPreviewMode ? (
                /* Preview Mode */
                <div className="px-8 py-10">
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-lg prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-100 dark:prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-primary">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom checkbox rendering to ensure they're interactive
                        input: ({ node, ...props }) => {
                          if (props.type === 'checkbox') {
                            return (
                              <input
                                {...props}
                                className="mr-2 w-4 h-4 text-primary bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                disabled={false}
                                onChange={(e) => {
                                  // Handle checkbox toggle
                                  const checked = e.target.checked;
                                  const checkboxIndex = Array.from(
                                    document.querySelectorAll('input[type="checkbox"]')
                                  ).indexOf(e.target as HTMLInputElement);
                                  
                                  const lines = content.split('\n');
                                  let currentCheckbox = 0;
                                  
                                  for (let i = 0; i < lines.length; i++) {
                                    const checkboxMatch = lines[i].match(/^(\s*-\s+)\[([ x])\]\s/);
                                    if (checkboxMatch) {
                                      if (currentCheckbox === checkboxIndex) {
                                        lines[i] = lines[i].replace(
                                          /(\s*-\s+)\[([ x])\]/,
                                          `$1[${checked ? 'x' : ' '}]`
                                        );
                                        break;
                                      }
                                      currentCheckbox++;
                                    }
                                  }
                                  
                                  setContent(lines.join('\n'));
                                }}
                              />
                            );
                          }
                          return <input {...props} />;
                        },
                      }}
                    >
                      {content || '*Start writing in edit mode...*'}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="flex-1 px-8 py-10">
                  <textarea
                    ref={textareaRef}
                    className="w-full h-full min-h-[500px] resize-none bg-transparent border-none p-0 text-lg leading-relaxed text-[#374151] dark:text-[#cbd5e0] placeholder:text-[#9aaebf] dark:placeholder:text-[#4a5568] focus:ring-0 focus:outline-none font-mono"
                    placeholder="# Note Title&#10;&#10;Start writing your note here...&#10;&#10;**Use Markdown formatting:**&#10;- Bullet lists&#10;- [ ] Checklists&#10;- **Bold** and _italic_ text&#10;- `code` and more!"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              )}
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
    </div>
  );
}

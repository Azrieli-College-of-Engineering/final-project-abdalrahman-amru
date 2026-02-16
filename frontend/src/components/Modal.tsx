import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
}: ModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'error',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        };
      case 'success':
        return {
          icon: 'check_circle',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
        };
      case 'confirm':
        return {
          icon: 'help',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        };
      default:
        return {
          icon: 'info',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();
  const isConfirmDialog = type === 'confirm' && onConfirm;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-card-dark rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light dark:border-border-darker">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <span className={`material-symbols-outlined ${color} text-2xl`}>
                {icon}
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main-light dark:text-white">
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-text-main-light dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#1a1a1a] border-t border-border-light dark:border-border-darker flex justify-end gap-3">
          {isConfirmDialog && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border-light dark:border-border-darker text-text-main-light dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              type === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : type === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import { authAPI, notesAPI } from '../services/apiService';
import { 
  deriveKey, 
  generateSalt, 
  arrayBufferToBase64,
  decryptNote,
  encryptNote
} from '../services/cryptoService';

export default function AccountSettings() {
  const { user, token, getMasterKey, login } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (!user || !token) {
      setError('Not authenticated');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Step 1: Derive current password verifier to verify current password
      const currentPasswordSalt = new TextEncoder().encode(user.email.toLowerCase());
      const currentPasswordVerifierKey = await deriveKey(currentPassword, currentPasswordSalt, 10000, true);
      const currentKeyData = await crypto.subtle.exportKey('raw', currentPasswordVerifierKey);
      const currentPasswordVerifier = btoa(String.fromCharCode(...new Uint8Array(currentKeyData)));

      // Step 2: Get current master key and verify it works
      const currentMasterKey = getMasterKey();
      if (!currentMasterKey) {
        setError('Session expired. Please log in again.');
        return;
      }

      // Step 3: Fetch all notes
      const { notes } = await notesAPI.getAll(token);

      // Step 4: Decrypt all notes with current master key
      const decryptedNotes: Array<{ id: number; plaintext: string }> = [];
      for (const note of notes) {
        try {
          const plaintext = await decryptNote(
            {
              ciphertext: note.ciphertext,
              iv: note.iv,
              authTag: note.authTag,
            },
            currentMasterKey,
            user.id
          );
          decryptedNotes.push({ id: note.id, plaintext });
        } catch (err) {
          console.error(`Failed to decrypt note ${note.id}:`, err);
          setError('Failed to decrypt notes. Please check your current password.');
          setIsChangingPassword(false);
          return;
        }
      }

      // Step 5: Generate new salt and derive new master key
      const newSaltLoginArray = generateSalt(16);
      const newSaltLogin = arrayBufferToBase64(newSaltLoginArray as unknown as ArrayBuffer);
      const newMasterKey = await deriveKey(newPassword, newSaltLoginArray, 100000);

      // Step 6: Derive new password verifier
      const newPasswordSalt = new TextEncoder().encode(user.email.toLowerCase());
      const newPasswordVerifierKey = await deriveKey(newPassword, newPasswordSalt, 10000, true);
      const newKeyData = await crypto.subtle.exportKey('raw', newPasswordVerifierKey);
      const newPasswordVerifier = btoa(String.fromCharCode(...new Uint8Array(newKeyData)));

      // Step 7: Re-encrypt all notes with new master key
      for (const { id, plaintext } of decryptedNotes) {
        const encryptedData = await encryptNote(plaintext, newMasterKey, user.id);
        await notesAPI.update(token, id, encryptedData);
      }

      // Step 8: Update password on server
      await authAPI.changePassword(token, {
        currentPasswordVerifier,
        newPasswordVerifier,
        newSaltLogin,
      });

      // Step 9: Update master key in auth context
      login(user, token, newMasterKey);

      // Success!
      setSuccess('Password changed successfully! All notes have been re-encrypted.');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const memberSince = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Layout showFooter={false}>
      <div className="w-full max-w-[960px] mx-auto p-4 md:p-8 lg:p-10">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-text-main-light dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
            Account & Security
          </h1>
          <p className="text-text-sub-light dark:text-slate-400 text-base font-normal">
            Manage your identity, encryption keys, and session preferences.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="grid gap-8">
          {/* Account Information Section */}
          <section className="bg-surface-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-darker shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-border-light dark:border-border-darker flex items-center gap-3">
              <span className="material-symbols-outlined text-text-sub-light dark:text-slate-400">
                badge
              </span>
              <h2 className="text-text-main-light dark:text-white text-lg font-bold">
                Account Information
              </h2>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-text-sub-light dark:text-slate-400 text-sm font-medium">
                  Email Address
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-border-light dark:border-[#333] bg-gray-100 dark:bg-[#262626] text-text-main-light dark:text-slate-300 p-3 pl-10 text-sm font-medium cursor-not-allowed select-none focus:ring-0 focus:border-border-light dark:focus:border-[#333]"
                    disabled
                    value={user?.email || 'user@example.com'}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-text-sub-light dark:text-slate-500 text-[20px]">
                    lock
                  </span>
                </div>
                <span className="text-xs text-text-sub-light dark:text-slate-500">
                  Email cannot be changed for security reasons.
                </span>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-text-sub-light dark:text-slate-400 text-sm font-medium">
                  Member Since
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-border-light dark:border-[#333] bg-gray-100 dark:bg-[#262626] text-text-main-light dark:text-slate-300 p-3 pl-10 text-sm font-medium cursor-not-allowed select-none focus:ring-0 focus:border-border-light dark:focus:border-[#333]"
                    disabled
                    value={memberSince}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-text-sub-light dark:text-slate-500 text-[20px]">
                    calendar_month
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* Security & Encryption Section */}
          <section className="bg-surface-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-darker shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-border-light dark:border-border-darker flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">security</span>
                <h2 className="text-text-main-light dark:text-white text-lg font-bold">
                  Security & Encryption
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold border border-teal-200 dark:border-teal-900/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Encrypted
              </span>
            </div>
            <div className="p-6 space-y-8">
              {/* Master Password */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border-light dark:border-border-darker">
                <div className="max-w-lg">
                  <h3 className="text-text-main-light dark:text-white text-base font-semibold mb-1">
                    Master Password
                  </h3>
                  <p className="text-text-sub-light dark:text-slate-400 text-sm leading-relaxed">
                    Your Master Password is the key to your data. We use zero-knowledge encryption,
                    meaning we never store or have access to your password.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordForm(!showPasswordForm);
                    setError('');
                    setSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 dark:bg-primary/10 hover:bg-primary/20 dark:hover:bg-primary/20 text-primary text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                  Change Password
                </button>
              </div>

              {/* Password Change Form */}
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="space-y-4 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-border-light dark:border-border-darker">
                  {isChangingPassword && (
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                        Re-encrypting all notes with new password... This may take a moment.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-main-light dark:text-slate-300">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-border-light dark:border-input-border bg-white dark:bg-input-bg text-text-main-light dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="Enter current password"
                      required
                      disabled={isChangingPassword}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-main-light dark:text-slate-300">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-border-light dark:border-input-border bg-white dark:bg-input-bg text-text-main-light dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="Enter new password (min 8 characters)"
                      required
                      disabled={isChangingPassword}
                      minLength={8}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-main-light dark:text-slate-300">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-border-light dark:border-input-border bg-white dark:bg-input-bg text-text-main-light dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="Confirm new password"
                      required
                      disabled={isChangingPassword}
                      minLength={8}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          Changing...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setError('');
                        setSuccess('');
                      }}
                      disabled={isChangingPassword}
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#262626] hover:bg-gray-300 dark:hover:bg-[#333] text-text-main-light dark:text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>⚠️ Important:</strong> Changing your password will re-encrypt all your notes with the new password. 
                      This process may take a few moments depending on how many notes you have.
                    </p>
                  </div>
                </form>
              )}

              {/* Two-Factor Authentication */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border-light dark:border-border-darker">
                <div className="max-w-lg">
                  <h3 className="text-text-main-light dark:text-white text-base font-semibold mb-1">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-text-sub-light dark:text-slate-400 text-sm leading-relaxed">
                    Add an extra layer of security to your account with 2FA using an authenticator app.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#262626] hover:bg-gray-300 dark:hover:bg-[#333] text-text-main-light dark:text-slate-300 text-sm font-semibold transition-colors whitespace-nowrap">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  Enable 2FA
                </button>
              </div>

              {/* Active Sessions */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="max-w-lg">
                  <h3 className="text-text-main-light dark:text-white text-base font-semibold mb-1">
                    Active Sessions
                  </h3>
                  <p className="text-text-sub-light dark:text-slate-400 text-sm leading-relaxed">
                    Manage devices and sessions where you're currently logged in. Log out from unfamiliar devices.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#262626] hover:bg-gray-300 dark:hover:bg-[#333] text-text-main-light dark:text-slate-300 text-sm font-semibold transition-colors whitespace-nowrap">
                  <span className="material-symbols-outlined text-[20px]">devices</span>
                  View Sessions
                </button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-surface-light dark:bg-card-dark rounded-xl border border-red-200 dark:border-red-900/50 shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-red-200 dark:border-red-900/50 flex items-center gap-3">
              <span className="material-symbols-outlined text-danger-red">warning</span>
              <h2 className="text-text-main-light dark:text-white text-lg font-bold">Danger Zone</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="max-w-lg">
                  <h3 className="text-text-main-light dark:text-white text-base font-semibold mb-1">
                    Delete Account
                  </h3>
                  <p className="text-text-sub-light dark:text-slate-400 text-sm leading-relaxed">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-red/10 hover:bg-danger-red hover:text-white text-danger-red text-sm font-semibold transition-colors whitespace-nowrap border border-danger-red">
                  <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

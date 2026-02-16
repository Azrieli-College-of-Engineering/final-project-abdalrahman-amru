import { useState } from 'react';
import Layout from '../components/Layout/Layout';
import { deriveKey, generateSalt, encryptNote, decryptNote, arrayBufferToBase64 } from '../services/cryptoService';

export default function CryptoTest() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function testCrypto() {
    setLoading(true);
    setResult('Running tests...');
    
    try {
      // Test parameters
      const password = 'test-password-123';
      const plaintext = 'This is a secret note!';
      const userId = 1;
      
      // Generate salt and derive key
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      
      // Encrypt
      const encrypted = await encryptNote(plaintext, key, userId);
      
      // Decrypt
      const decrypted = await decryptNote(encrypted, key, userId);
      
      // Verify
      if (decrypted === plaintext) {
        setResult(`✅ SUCCESS!
                
        Original: ${plaintext}
        Decrypted: ${decrypted}

        Ciphertext: ${encrypted.ciphertext}
        IV: ${encrypted.iv}
        Auth Tag: ${encrypted.authTag}

        Salt: ${arrayBufferToBase64(salt as unknown as ArrayBuffer)}`);
      } else {
        setResult('❌ FAILED: Decrypted text does not match');
      }
      
    } catch (error) {
      const err = error as Error;
      setResult(`❌ ERROR: ${err.message}\n\n${err.stack}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function testTampering() {
    setLoading(true);
    setResult('Testing tampering detection...');
    
    try {
      const password = 'test-password-123';
      const plaintext = 'Secret message';
      const userId = 1;
      
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      
      // Encrypt
      const encrypted = await encryptNote(plaintext, key, userId);
      
      // Tamper with ciphertext
      const tamperedCiphertext = encrypted.ciphertext.slice(0, -5) + 'AAAAA';
      
      // Try to decrypt tampered data
      try {
        await decryptNote(
          { ...encrypted, ciphertext: tamperedCiphertext },
          key,
          userId
        );
        setResult('❌ FAILED: Tampering was not detected!');
      } catch (error) {
        const err = error as Error;
        setResult(`✅ SUCCESS: Tampering detected!
        
        Error message: ${err.message}

        This proves that any modification to the ciphertext will be detected.`);
      }
      
    } catch (error) {
      const err = error as Error;
      setResult(`❌ ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function testWrongKey() {
    setLoading(true);
    setResult('Testing wrong key decryption...');
    
    try {
      const password1 = 'correct-password';
      const password2 = 'wrong-password';
      const plaintext = 'Secret message';
      const userId = 1;
      
      const salt = generateSalt();
      const key1 = await deriveKey(password1, salt);
      const key2 = await deriveKey(password2, salt);
      
      // Encrypt with key1
      const encrypted = await encryptNote(plaintext, key1, userId);
      
      // Try to decrypt with key2
      try {
        await decryptNote(encrypted, key2, userId);
        setResult('❌ FAILED: Wrong key was accepted!');
      } catch (error) {
        const err = error as Error;
        setResult(`✅ SUCCESS: Wrong key rejected!
        
          Error message: ${err.message}

          This proves that only the correct key can decrypt the data.`);
      }
      
    } catch (error) {
      const err = error as Error;
      setResult(`❌ ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-background-light dark:bg-[#0a0f16] text-text-main-light dark:text-white transition-colors duration-200">
        {/* Page Header */}
        <div className="sticky top-0 z-10 backdrop-blur-md px-8 py-6 border-b border-border-light dark:border-border-darker">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">lock</span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-white">
                  Cryptography Tests
                </h1>
                <p className="text-text-sub-light dark:text-gray-400 text-sm pt-1">
                  Test encryption, decryption, and security features
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Test Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Test 1: Encryption/Decryption */}
              <button 
                onClick={testCrypto} 
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-6 hover:shadow-lg hover:border-primary dark:hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">encrypted</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">
                      Encryption/Decryption
                    </h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Test AES-256-GCM encryption and decryption
                    </p>
                  </div>
                </div>
              </button>

              {/* Test 2: Tampering Detection */}
              <button 
                onClick={testTampering} 
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-6 hover:shadow-lg hover:border-red-500 dark:hover:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 group-hover:bg-red-200 dark:group-hover:bg-red-900/30 transition-colors">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">
                      Tampering Detection
                    </h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Verify integrity protection with auth tags
                    </p>
                  </div>
                </div>
              </button>

              {/* Test 3: Wrong Key */}
              <button 
                onClick={testWrongKey} 
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-6 hover:shadow-lg hover:border-yellow-500 dark:hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/30 transition-colors">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-2xl">key_off</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">
                      Wrong Key Detection
                    </h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Test decryption with incorrect key
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Results Display */}
            <div className="bg-surface-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-darker shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-darker flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-text-sub-light dark:text-gray-400">terminal</span>
                  <h2 className="text-lg font-bold text-text-main-light dark:text-white">Test Results</h2>
                </div>
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-text-sub-light dark:text-gray-400">Running...</span>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-900 min-h-[400px]">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {result || '> Cryptography testing terminal ready\n> Click a test button above to begin...'}
                </pre>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">info</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">About These Tests</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• <strong>Encryption/Decryption:</strong> Verifies AES-256-GCM symmetric encryption works correctly</li>
                    <li>• <strong>Tampering Detection:</strong> Ensures any modification to ciphertext is detected via auth tags</li>
                    <li>• <strong>Wrong Key Detection:</strong> Confirms only the correct key can decrypt data</li>
                    <li>• All tests use PBKDF2 for key derivation with 100,000 iterations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

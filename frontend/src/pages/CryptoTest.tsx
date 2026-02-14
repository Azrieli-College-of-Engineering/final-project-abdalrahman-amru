import { useState } from 'react';
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
      const noteId = 1;
      
      // Generate salt and derive key
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      
      // Encrypt
      const encrypted = await encryptNote(plaintext, key, userId, noteId);
      
      // Decrypt
      const decrypted = await decryptNote(encrypted, key, userId, noteId);
      
      // Verify
      if (decrypted === plaintext) {
        setResult(`✅ SUCCESS!
        
Original: ${plaintext}
Decrypted: ${decrypted}

Ciphertext: ${encrypted.ciphertext.slice(0, 50)}...
IV: ${encrypted.iv}
Auth Tag: ${encrypted.authTag.slice(0, 30)}...

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
      const noteId = 1;
      
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      
      // Encrypt
      const encrypted = await encryptNote(plaintext, key, userId, noteId);
      
      // Tamper with ciphertext
      const tamperedCiphertext = encrypted.ciphertext.slice(0, -5) + 'AAAAA';
      
      // Try to decrypt tampered data
      try {
        await decryptNote(
          { ...encrypted, ciphertext: tamperedCiphertext },
          key,
          userId,
          noteId
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
      const noteId = 1;
      
      const salt = generateSalt();
      const key1 = await deriveKey(password1, salt);
      const key2 = await deriveKey(password2, salt);
      
      // Encrypt with key1
      const encrypted = await encryptNote(plaintext, key1, userId, noteId);
      
      // Try to decrypt with key2
      try {
        await decryptNote(encrypted, key2, userId, noteId);
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
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Crypto Test Page</h1>
      <p className="text-gray-600 mb-8">
        Test the encryption/decryption functionality and security features.
      </p>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={testCrypto} 
          disabled={loading}
          className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Running...' : 'Test Encryption/Decryption'}
        </button>
        
        <button 
          onClick={testTampering} 
          disabled={loading}
          className="px-6 py-3 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Tampering Detection
        </button>
        
        <button 
          onClick={testWrongKey} 
          disabled={loading}
          className="px-6 py-3 text-base font-medium text-black bg-yellow-400 rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Wrong Key
        </button>
      </div>
      
      <pre className="mt-6 bg-gray-100 p-6 rounded-lg border border-gray-300 min-h-[200px] whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {result || 'Click a test button to begin...'}
      </pre>
    </div>
  );
}

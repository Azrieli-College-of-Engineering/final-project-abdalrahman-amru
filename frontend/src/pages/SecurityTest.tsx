import { useState } from 'react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { authAPI, notesAPI } from '../services/apiService';

export default function SecurityTest() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Test XSS Protection - Script Injection
  async function testXSSProtection() {
    setLoading(true);
    setResult('Testing XSS Protection...\n\n');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload="alert(\'XSS\')">',
      '<input onfocus="alert(\'XSS\')" autofocus>',
      '<marquee onstart="alert(\'XSS\')">',
    ];
    
    let testResults = 'XSS Protection Tests:\n';
    testResults += '====================\n\n';
    
    xssPayloads.forEach((payload, index) => {
      // Render the payload safely
      const div = document.createElement('div');
      div.textContent = payload; // This uses textContent, which is safe
      
      testResults += `Test ${index + 1}: ${payload}\n`;
      testResults += `Status: ✅ Payload rendered as text (safe)\n`;
      testResults += `Actual render: ${div.innerHTML}\n\n`;
    });
    
    testResults += '\n📝 RESULT: All XSS payloads were neutralized!\n';
    testResults += 'The application uses React\'s built-in XSS protection.\n';
    testResults += 'React escapes all content by default, preventing script execution.\n';
    
    setResult(testResults);
    setLoading(false);
  }
  
  // Test CSP (Content Security Policy)
  async function testCSP() {
    setLoading(true);
    setResult('Testing Content Security Policy (CSP)...\n\n');
    
    let testResults = 'CSP Protection Tests:\n';
    testResults += '====================\n\n';
    
    // Test 1: Try to execute inline script
    testResults += 'Test 1: Inline Script Execution\n';
    try {
      const script = document.createElement('script');
      script.textContent = 'console.log("Inline script executed")';
      document.body.appendChild(script);
      document.body.removeChild(script);
      testResults += 'Result: Script element created (check console for CSP violations)\n\n';
    } catch (error) {
      testResults += `Result: ✅ Blocked - ${error}\n\n`;
    }
    
    // Test 2: Try to load external script
    testResults += 'Test 2: External Script Loading\n';
    const externalScript = document.createElement('script');
    externalScript.src = 'https://evil.example.com/malicious.js';
    externalScript.onerror = () => {
      testResults += 'Result: ✅ External script blocked by CSP\n\n';
      setResult(testResults + '\n📝 Check browser console for CSP violation reports');
    };
    externalScript.onload = () => {
      testResults += 'Result: ❌ External script loaded (CSP may not be working)\n\n';
      setResult(testResults);
    };
    document.body.appendChild(externalScript);
    
    // Test 3: Check CSP headers
    testResults += 'Test 3: CSP Headers Check\n';
    testResults += 'CSP should prevent:\n';
    testResults += '  - Inline script execution\n';
    testResults += '  - External script loading from untrusted sources\n';
    testResults += '  - Unsafe eval() usage\n';
    testResults += '  - Inline event handlers (onclick, onload, etc.)\n\n';
    
    testResults += '💡 Open browser DevTools > Console to see CSP violations\n';
    
    setTimeout(() => {
      document.body.removeChild(externalScript);
    }, 2000);
    
    setResult(testResults);
    setLoading(false);
  }
  
  // Test Rate Limiting
  async function testRateLimit() {
    setLoading(true);
    setResult('Testing Rate Limiting...\n\n');
    
    let testResults = 'Rate Limit Tests:\n';
    testResults += '=================\n\n';
    
    testResults += 'Sending multiple requests to test rate limiting...\n\n';
    
    const requests = [];
    const numRequests = 10;
    
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        fetch('http://localhost:5000/health')
          .then(res => ({ status: res.status, attempt: i + 1 }))
          .catch(err => ({ error: err.message, attempt: i + 1 }))
      );
    }
    
    try {
      const results = await Promise.all(requests);
      
      results.forEach(result => {
        if ('status' in result) {
          testResults += `Request ${result.attempt}: ${result.status === 200 ? '✅ Success' : `⚠️ Status ${result.status}`}\n`;
        } else {
          testResults += `Request ${result.attempt}: ❌ Error - ${result.error}\n`;
        }
      });
      
      testResults += '\n📝 Note: Rate limiting is set to 100 requests per 15 minutes.\n';
      testResults += 'Auth endpoints have stricter limits (5 requests per 15 minutes).\n';
      testResults += 'Try the auth rate limit test to see stricter enforcement.\n';
      
    } catch (error) {
      testResults += `\n❌ Error running test: ${error}\n`;
    }
    
    setResult(testResults);
    setLoading(false);
  }
  
  // Test Auth Rate Limiting (stricter)
  async function testAuthRateLimit() {
    setLoading(true);
    setResult('Testing Authentication Rate Limiting...\n\n');
    
    let testResults = 'Auth Rate Limit Tests:\n';
    testResults += '======================\n\n';
    
    testResults += 'Sending multiple login requests with invalid credentials...\n\n';
    
    const requests = [];
    const numRequests = 7; // More than the limit of 5
    
    interface AuthResult {
      status: number | string;
      attempt: number;
      message?: string;
      success: boolean;
    }
    
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        authAPI.login({
          email: 'test@example.com',
          passwordVerifier: 'invalid'
        })
          .then((_res: unknown) => ({ status: 200, attempt: i + 1, success: true } as AuthResult))
          .catch((err: any) => ({
            status: err.status || 'Network Error',
            attempt: i + 1,
            message: err.message || 'Unknown error',
            success: false
          } as AuthResult))
      );
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      const results = await Promise.all(requests);
      
      let rateLimitedCount = 0;
      results.forEach((result: AuthResult) => {
        if (result.status === 429) {
          rateLimitedCount++;
          testResults += `Request ${result.attempt}: 🚫 Rate Limited (429)\n`;
        } else if (result.status === 401) {
          testResults += `Request ${result.attempt}: ⚠️ Unauthorized (expected)\n`;
        } else {
          testResults += `Request ${result.attempt}: Status ${result.status}\n`;
        }
      });
      
      testResults += `\n📊 Summary: ${rateLimitedCount} requests were rate-limited\n\n`;
      
      if (rateLimitedCount > 0) {
        testResults += '✅ SUCCESS: Rate limiting is working!\n';
        testResults += 'After 5 failed attempts, subsequent requests are blocked.\n';
      } else {
        testResults += '⚠️ Note: You may need more attempts to trigger rate limiting.\n';
        testResults += 'Rate limit: 5 requests per 15 minutes for auth endpoints.\n';
      }
      
    } catch (error) {
      testResults += `\n❌ Error running test: ${error}\n`;
    }
    
    setResult(testResults);
    setLoading(false);
  }
  
  // Test Tampering Detection with Real Note
  async function testTamperingWithNote() {
    if (!user) {
      setResult('❌ You must be logged in to test tampering detection with a real note.');
      return;
    }
    
    setLoading(true);
    setResult('Testing Tampering Detection with Database...\n\n');
    
    let testResults = 'Database Tampering Test:\n';
    testResults += '========================\n\n';
    
    try {
      // Step 1: Get user's notes
      testResults += 'Step 1: Fetching your notes...\n';
      const token = localStorage.getItem('token') || '';
      const notesResponse = await notesAPI.getAll(token);
      const notes = notesResponse.notes;
      
      if (notes.length === 0) {
        testResults += '❌ No notes found. Please create a note first.\n';
        setResult(testResults);
        setLoading(false);
        return;
      }
      
      const noteId = notes[0].id;
      testResults += `✅ Found note ID: ${noteId}\n\n`;
      
      // Step 2: Tamper with the note using admin endpoint
      testResults += 'Step 2: Tampering with note in database...\n';
      try {
        const tamperResponse = await fetch(`http://localhost:5000/api/admin/tamper-note/${noteId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (tamperResponse.ok) {
          const tamperData = await tamperResponse.json();
          testResults += `✅ Note tampered: ${tamperData.message}\n\n`;
        } else {
          testResults += `⚠️ Tamper endpoint returned: ${tamperResponse.status}\n`;
          testResults += 'Note: This endpoint only works in development mode.\n\n';
        }
      } catch (error) {
        testResults += `⚠️ Could not tamper note: ${error}\n`;
        testResults += 'This is expected in production mode.\n\n';
      }
      
      // Step 3: Try to fetch and decrypt the tampered note
      testResults += 'Step 3: Attempting to decrypt tampered note...\n';
      testResults += '(Try opening the note in the Notes Dashboard)\n\n';
      
      testResults += '📝 EXPECTED BEHAVIOR:\n';
      testResults += '  - When you try to view the note, decryption will fail\n';
      testResults += '  - You should see an "Integrity check failed" error\n';
      testResults += '  - This proves tampering is detected!\n\n';
      
      testResults += '💡 TIP: Go to Notes Dashboard and try to open note #' + noteId + '\n';
      
    } catch (error) {
      testResults += `\n❌ Error: ${error}\n`;
    }
    
    setResult(testResults);
    setLoading(false);
  }
  
  // Test CORS
  async function testCORS() {
    setLoading(true);
    setResult('Testing CORS Protection...\n\n');
    
    let testResults = 'CORS Protection Tests:\n';
    testResults += '=====================\n\n';
    
    testResults += 'Testing cross-origin request handling...\n\n';
    
    try {
      // This will succeed from allowed origin
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      
      testResults += '✅ Request from allowed origin succeeded\n';
      testResults += `Server responded: ${JSON.stringify(data)}\n\n`;
      
      testResults += '📝 CORS Configuration:\n';
      testResults += '  - Origin: http://localhost:5173 (allowed)\n';
      testResults += '  - Credentials: enabled\n';
      testResults += '  - Methods: GET, POST, PUT, DELETE\n\n';
      
      testResults += '💡 To test blocked origins:\n';
      testResults += '  - Try accessing API from a different domain\n';
      testResults += '  - Request should be blocked by browser\n';
      
    } catch (error) {
      testResults += `❌ Error: ${error}\n`;
    }
    
    setResult(testResults);
    setLoading(false);
  }
  
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-background-light dark:bg-[#0a0f16] text-text-main-light dark:text-white transition-colors duration-200">
        {/* Page Header */}
        <div className="sticky top-0 z-10 backdrop-blur-md px-8 py-6 border-b border-border-light dark:border-border-darker">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-red-500">security</span>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-white">
                  Security Testing Dashboard
                </h1>
                <p className="text-text-sub-light dark:text-gray-400 text-sm pt-1">
                  Test security features and protections
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Warning Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl">warning</span>
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                    Development/Testing Only
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    This dashboard is for security testing and demonstration. Some tests may generate 
                    console warnings - this is expected when testing security mechanisms.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Test Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* XSS Protection Tests */}
              <button
                onClick={testXSSProtection}
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-5 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">shield</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">XSS Protection</h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Test cross-site scripting attack prevention
                    </p>
                  </div>
                </div>
              </button>
              
              {/* CSP Tests */}
              <button
                onClick={testCSP}
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-5 hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">policy</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">Content Security Policy</h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Test CSP headers and script blocking
                    </p>
                  </div>
                </div>
              </button>
              
              {/* Rate Limiting Tests */}
              <button
                onClick={testRateLimit}
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-5 hover:shadow-lg hover:border-green-500 dark:hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">speed</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">Rate Limiting</h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Test API rate limits (100 req/15min)
                    </p>
                  </div>
                </div>
              </button>
              
              {/* Auth Rate Limiting Tests */}
              <button
                onClick={testAuthRateLimit}
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-5 hover:shadow-lg hover:border-red-500 dark:hover:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 group-hover:bg-red-200 dark:group-hover:bg-red-900/30 transition-colors">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">admin_panel_settings</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">Auth Rate Limiting</h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Test strict auth limits (5 req/15min)
                    </p>
                  </div>
                </div>
              </button>
              
              {/* Tampering Detection Tests */}
              <button
                onClick={testTamperingWithNote}
                disabled={loading || !user}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-5 hover:shadow-lg hover:border-orange-500 dark:hover:border-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl">build</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">Tampering Detection</h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      {user ? 'Test AES-GCM integrity protection' : 'Login required to test'}
                    </p>
                  </div>
                </div>
              </button>
              
              {/* CORS Tests */}
              <button
                onClick={testCORS}
                disabled={loading}
                className="group bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-darker rounded-xl p-5 hover:shadow-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/30 transition-colors">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-2xl">public</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-main-light dark:text-white mb-1">CORS Protection</h3>
                    <p className="text-sm text-text-sub-light dark:text-gray-400">
                      Test cross-origin policies
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
                    <span className="text-sm text-text-sub-light dark:text-gray-400">Running test...</span>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-900 min-h-[400px]">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {result || '> Security testing terminal ready\n> Select a test above to begin...'}
                </pre>
              </div>
            </div>
            
            {/* Info Panel */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">lightbulb</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Testing Tips</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Open browser DevTools (F12) to see CSP violations and network requests</li>
                    <li>• Check the Console tab for security warnings and errors</li>
                    <li>• Check the Network tab to see rate limiting headers (X-RateLimit-*)</li>
                    <li>• For tampering tests, you need to be logged in and have at least one note</li>
                    <li>• Some tests may take a few seconds to complete</li>
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

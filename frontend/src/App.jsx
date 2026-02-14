import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔐 Secure Notes</h1>
        <p>Zero-Knowledge Encrypted Notes Application</p>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Environment is set up! Ready to build the application.
          </p>
        </div>
      </header>
    </div>
  )
}

export default App

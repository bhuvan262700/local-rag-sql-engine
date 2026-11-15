import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  
  // Load history from localStorage on initial render
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('sql_session_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Save to localStorage automatically whenever history changes
  useEffect(() => {
    localStorage.setItem('sql_session_history', JSON.stringify(history));
  }, [history]);

  // Reduced to 2 sample questions
  const sampleQuestions = [
    "Show me the first name, last name, and salary of all employees who make more than 10,000.",
    "What is the total number of employees and the average salary for each department?"
  ];

  const generateSQL = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const webhookUrl = 'http://localhost:5678/webhook/generate-sql';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question }) 
      });

      if (!response.ok) {
        throw new Error(`Connection Error: ${response.status}`);
      }

      const data = await response.json();
      
      let dbRows = [];
      let sqlString = '';

      if (Array.isArray(data) && data.length > 0) {
        dbRows = data;
        sqlString = data[0].cleaned_sql || '';
      } else if (data && typeof data === 'object') {
        dbRows = data.results || data.data || [data];
        sqlString = data.cleaned_sql || data.query || '';
      }

      const newSession = {
        id: Date.now(),
        question: question,
        sql: sqlString,
        results: dbRows,
        time: new Date().toLocaleTimeString()
      };

      setCurrentSession(newSession);
      setHistory(prevHistory => [newSession, ...prevHistory]);
      setQuestion('');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHeaders = (rows) => {
    if (!rows || rows.length === 0) return [];
    return Object.keys(rows[0]).filter(key => key !== 'cleaned_sql');
  };

  const loadPastSession = (session) => {
    setCurrentSession(session);
    setError('');
  };

  const clearChat = () => {
    setHistory([]);
    setCurrentSession(null);
    setError('');
    localStorage.removeItem('sql_session_history');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>Text to SQL Generation</h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>Table-Level Semantic RAG (ChromaDB) • Qwen2.5-Coder • n8n Pipeline</p>
          </div>
          <div style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
            ● Pipeline Active
          </div>
        </div>

        {/* Display Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {error && <div style={{ color: '#ef4444', padding: '1rem', backgroundColor: '#7f1d1d33', borderRadius: '0.5rem' }}>{error}</div>}

          {!currentSession && history.length === 0 && (
             <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#64748b', flexDirection: 'column', gap: '1rem' }}>
               <h2 style={{ margin: 0 }}>Welcome to the AI Database Assistant</h2>
               <p>Ask a question below, or select a sample to get started.</p>
             </div>
          )}

          {currentSession && (
            <>
              {/* User Question Bubble */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#3b82f6', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>U</div>
                <div style={{ backgroundColor: '#1e293b', padding: '1rem 1.5rem', borderRadius: '0 1rem 1rem 1rem', border: '1px solid #334155', maxWidth: '80%' }}>
                  {currentSession.question}
                </div>
              </div>

              {/* AI Response Block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#f59e0b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', flexShrink: 0 }}>✨</div>
                
                <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', width: '100%', overflow: 'hidden' }}>
                  
                  {/* SQL Block */}
                  {currentSession.sql && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1.5rem', backgroundColor: '#0f172a', borderBottom: '1px solid #334155', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8' }}>
                        <span>GENERATED SQL</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <span style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(currentSession.sql)}>📋 Copy SQL</span>
                        </div>
                      </div>
                      <div style={{ padding: '1.5rem', backgroundColor: '#18181b', overflowX: 'auto' }}>
                        <pre style={{ margin: 0, color: '#e5e7eb', fontFamily: 'monospace' }}>
                          <code>{currentSession.sql}</code>
                        </pre>
                      </div>
                    </>
                  )}

                  {/* Data Results Table */}
                  {currentSession.results && currentSession.results.length > 0 && (
                    <div style={{ padding: '1.5rem', borderTop: '1px solid #334155' }}>
                      <h3 style={{ marginTop: 0, fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>ORACLE DATABASE RESULTS</h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                              {getHeaders(currentSession.results).map((header) => (
                                <th key={header} style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: '600', whiteSpace: 'nowrap' }}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentSession.results.map((row, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                                {getHeaders(currentSession.results).map((header) => (
                                  <td key={header} style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                                    {typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Input Area with Sample Questions */}
        <div style={{ marginTop: '2rem' }}>
          
          {/* Sample Questions Chips */}
          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column', marginBottom: '1rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Try asking:</span>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {sampleQuestions.map((sq, index) => (
                <button 
                  key={index}
                  onClick={() => setQuestion(sq)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '0.6rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', cursor: 'pointer', transition: 'border-color 0.2s', textAlign: 'left', lineHeight: '1.4' }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
                >
                  {/* Removed truncation so the full question shows */}
                  {sq}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={generateSQL} style={{ position: 'relative' }}>
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateSQL(e); } }}
              placeholder="Ask any analytical question to generate a SQL query (Shift + Enter for new line)..."
              style={{ width: '100%', width: '-webkit-fill-available', padding: '1.5rem', paddingRight: '150px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', resize: 'none', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <button 
              type="submit" 
              disabled={loading || !question.trim()}
              style={{ position: 'absolute', right: '1rem', bottom: '1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: (loading || !question.trim()) ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: (loading || !question.trim()) ? 0.6 : 1 }}
            >
              {loading ? 'Processing...' : '⚡ Generate SQL'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Session History */}
      <div style={{ width: '320px', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}>
            <span style={{ color: '#94a3b8' }}>⏱</span> Session History
          </h2>
          {/* Changed from span to a styled button for Clear Chat */}
          <button 
            onClick={clearChat} 
            style={{ 
              backgroundColor: '#7f1d1d', 
              color: '#fca5a5', 
              border: 'none',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#991b1b'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7f1d1d'}
          >
            Clear Chat
          </button>
        </div>
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.length === 0 && (
            <div style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
              No previous queries yet.
            </div>
          )}
          {history.map(item => (
            <div 
              key={item.id} 
              onClick={() => loadPastSession(item)}
              style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>{item.time}</div>
              <div style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                {item.question.length > 60 ? item.question.substring(0, 60) + '...' : item.question}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
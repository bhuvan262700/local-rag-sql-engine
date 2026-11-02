
import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ⚠️ PASTE YOUR EXACT n8n WEBHOOK URL HERE:
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/generate-sql';

// --- SQL ANALYZER HELPERS ---
const extractTablesUsed = (sql) => {
  if (!sql) return [];
  const hrTables = [
    'REGIONS',
    'COUNTRIES',
    'LOCATIONS',
    'DEPARTMENTS',
    'JOBS',
    'EMPLOYEES',
    'JOB_HISTORY',
  ];
  const upperSql = sql.toUpperCase();
  return hrTables.filter((table) => {
    const regex = new RegExp(`\\b${table}\\b`, 'i');
    return regex.test(upperSql);
  });
};

const analyzeQueryComplexity = (sql) => {
  if (!sql) return [];
  const badges = [];
  const upperSql = sql.toUpperCase();

  const joinMatches = upperSql.match(/\bJOIN\b/g);
  const joinCount = joinMatches ? joinMatches.length : 0;
  if (joinCount > 0) {
    badges.push(`${joinCount + 1}-Table Traversal (${joinCount} Joins)`);
  }

  const empMatches = upperSql.match(/\bEMPLOYEES\b/g);
  if (empMatches && empMatches.length >= 2) {
    badges.push('Manager Self-Join');
  }

  if (/\bWITH\b[\s\S]+?\bAS\s*\(/i.test(upperSql)) {
    badges.push('CTE (WITH Clause)');
  }

  if (/\b(ROW_NUMBER|RANK|DENSE_RANK|OVER\s*\()\b/i.test(upperSql)) {
    badges.push('Window Function');
  }

  if (/\bGROUP\s+BY\b/i.test(upperSql)) {
    badges.push(
      /\bHAVING\b/i.test(upperSql) ? 'GROUP BY + HAVING' : 'Aggregation (GROUP BY)'
    );
  }

  if (/\bJOB_HISTORY\b/i.test(upperSql)) {
    badges.push('Historical State (JOB_HISTORY)');
  }

  return badges;
};

// --- MAIN COMPONENT ---
export default function App() {
  const [question, setQuestion] = useState('');
  const [sqlOutput, setSqlOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('oracle_hr_sql_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('oracle_hr_sql_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async (promptText = question) => {
    if (!promptText.trim()) return;
    setQuestion(promptText);
    setLoading(true);
    setCopied(false);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: promptText,
          chatInput: promptText,
          query: promptText,
          prompt: promptText,
        }),
      });

      const data = await response.json();
      const rawSql = (
        data.sql_query || 
        data.sql ||
        data.output ||
        data.text ||
        data.response ||
        (typeof data === 'string' ? data : JSON.stringify(data, null, 2))
      ).trim();

      setSqlOutput(rawSql);

      setHistory((prev) => [
        {
          id: Date.now(),
          question: promptText,
          sql: rawSql,
          tables: extractTablesUsed(rawSql),
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 14),
      ]);
    } catch (err) {
      setSqlOutput(`-- Error communicating with n8n webhook:\n-- ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!sqlOutput) return;
    navigator.clipboard.writeText(sqlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    if (!sqlOutput) return;
    const blob = new Blob([`-- Prompt: ${question}\n\n${sqlOutput}\n`], {
      type: 'application/sql',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_query_${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tablesUsed = extractTablesUsed(sqlOutput);
  const complexityBadges = analyzeQueryComplexity(sqlOutput);

  return (
    <div style={styles.container}>
      {/* Left / Main Workspace */}
      <div style={styles.mainPanel}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Text to SQL Generation</h1>
            <p style={styles.subtitle}>
              Table-Level Semantic RAG (ChromaDB) • Qwen2.5-Coder • n8n Pipeline
            </p>
          </div>
          <span style={styles.statusPill}>🟢 Pipeline Active</span>
        </header>

        {/* Reference Examples */}
        <div style={styles.referenceContainer}>
          <span style={styles.referenceHeader}>Need inspiration? Click a reference example to try it out:</span>
          <div 
            style={styles.referenceItem} 
            onClick={() => setQuestion("Find the top 2 highest-paid employees in each region based on their total annual compensation.")}
          >
            💡 "Find the top 2 highest-paid employees in each region based on their total annual compensation."
          </div>
          <div 
            style={styles.referenceItem} 
            onClick={() => setQuestion("List all employees working in the city of 'Seattle' along with their job title and their manager's full name.")}
          >
            💡 "List all employees working in the city of 'Seattle' along with their job title and their manager's full name."
          </div>
        </div>

        {/* Prompt Input Box */}
        <div style={styles.inputCard}>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any analytical question to generate a SQL query..."
            style={styles.textarea}
          />
          <div style={styles.inputFooter}>
            <div style={styles.spacer}></div>
            <button
              onClick={() => handleGenerate(question)}
              disabled={loading || !question.trim()}
              style={styles.generateBtn}
            >
              {loading ? '⏳ Generating...' : '⚡ Generate SQL'}
            </button>
          </div>
        </div>

        {/* Output Card */}
        {sqlOutput && (
          <div style={styles.outputCard}>
            <div style={styles.transparencyBar}>
              <div style={styles.badgeGroup}>
                <span style={styles.badgeLabel}>Tables Linked:</span>
                {tablesUsed.length > 0 ? (
                  tablesUsed.map((tbl, i) => (
                    <React.Fragment key={tbl}>
                      <span style={styles.tableBadge}>{tbl}</span>
                      {i < tablesUsed.length - 1 && (
                        <span style={styles.linkArrow}>🔗</span>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <span style={styles.neutralBadge}>None Detected</span>
                )}
              </div>

              <div style={styles.badgeGroup}>
                <span style={styles.badgeLabel}>SQL Constructs:</span>
                {complexityBadges.map((tag) => (
                  <span key={tag} style={styles.complexityBadge}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={styles.codeHeader}>
              <span style={styles.codeTitle}>GENERATED SQL</span>
              <div style={styles.actionBtnGroup}>
                <button onClick={handleCopy} style={styles.actionBtn}>
                  {copied ? '✅ Copied!' : '📋 Copy SQL'}
                </button>
                <button onClick={handleDownloadSql} style={styles.actionBtn}>
                  💾 Download .sql
                </button>
              </div>
            </div>

            <SyntaxHighlighter
              language="sql"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '18px',
                fontSize: '14px',
                lineHeight: '1.6',
                borderRadius: '0 0 10px 10px',
              }}
              wrapLongLines={true}
            >
              {sqlOutput}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {/* Right Sidebar: Query History */}
      <aside style={styles.historyDrawer}>
        <div style={styles.historyHeader}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>🕘 Query History</h3>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              style={styles.clearHistoryBtn}
            >
              Clear
            </button>
          )}
        </div>
        <div style={styles.historyList}>
          {history.length === 0 ? (
            <p style={styles.emptyHistory}>
              Your generated SQL queries will appear here.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setQuestion(item.question);
                  setSqlOutput(item.sql);
                }}
                style={styles.historyItem}
              >
                <div style={styles.historyTime}>{item.timestamp}</div>
                <div style={styles.historyPrompt}>{item.question}</div>
                <div style={styles.historyTables}>
                  {item.tables?.map((t) => (
                    <span key={t} style={styles.miniTableTag}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    boxSizing: 'border-box',
  },
  mainPanel: {
    flex: 1,
    padding: '28px 36px',
    maxWidth: '960px',
    margin: '0 auto',
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '16px',
  },
  title: { margin: 0, fontSize: '24px', fontWeight: 700, color: '#f8fafc' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' },
  statusPill: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #047857',
  },
  referenceContainer: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  referenceHeader: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  referenceItem: {
    fontSize: '13px',
    color: '#cbd5e1',
    backgroundColor: '#1e293b',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #334155',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  inputCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
  },
  inputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  spacer: { flex: 1 },
  generateBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  outputCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  transparencyBar: {
    padding: '14px 18px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  badgeGroup: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
  },
  badgeLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 600,
    marginRight: '4px',
  },
  tableBadge: {
    backgroundColor: '#1e3a8a',
    color: '#93c5fd',
    border: '1px solid #1d4ed8',
    padding: '3px 9px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  linkArrow: { fontSize: '11px', opacity: 0.7 },
  complexityBadge: {
    backgroundColor: '#3b0764',
    color: '#d8b4fe',
    border: '1px solid #6b21a8',
    padding: '3px 9px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  neutralBadge: { fontSize: '12px', color: '#64748b' },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 18px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  codeTitle: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#94a3b8',
  },
  actionBtnGroup: { display: 'flex', gap: '8px' },
  actionBtn: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  historyDrawer: {
    width: '320px',
    backgroundColor: '#1e293b',
    borderLeft: '1px solid #334155',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #334155',
  },
  clearHistoryBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  emptyHistory: { fontSize: '13px', color: '#64748b', lineHeight: 1.5 },
  historyItem: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  historyTime: { fontSize: '11px', color: '#64748b', marginBottom: '6px' },
  historyPrompt: {
    fontSize: '13px',
    color: '#e2e8f0',
    marginBottom: '10px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.4,
  },
  historyTables: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  miniTableTag: {
    backgroundColor: '#1e293b',
    color: '#93c5fd',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
};
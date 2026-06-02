import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function cleanOutput(text) {
  if (!text) return ''
  if (typeof text !== 'string') return JSON.stringify(text, null, 2)
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
}

function fmtTs(d) {
  if (!d) return '—'
  return new (globalThis['Date'])(d).toLocaleTimeString()
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

const mdComponents = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || '')
    const code = String(children).replace(/\n$/, '')
    if (!match) {
      return <code className="bg-gray-700 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    }
    return (
      <div className="relative rounded-lg overflow-hidden border border-gray-700 my-3">
        <div className="flex items-center justify-between bg-gray-900 px-4 py-2 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
          <CopyBtn text={code} />
        </div>
        <SyntaxHighlighter language={match[1]} style={oneDark} customStyle={{ margin: 0, borderRadius: 0, background: '#1a1b1e', fontSize: '0.8rem' }} showLineNumbers wrapLines>
          {code}
        </SyntaxHighlighter>
      </div>
    )
  },
  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-3 border-b border-gray-700 pb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-5 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-100 mt-4 mb-2">{children}</h3>,
  p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1 ml-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1 ml-2">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 my-3 text-gray-400 italic">{children}</blockquote>,
  table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full border border-gray-700 rounded-lg overflow-hidden text-sm">{children}</table></div>,
  th: ({ children }) => <th className="bg-gray-700/80 text-white px-4 py-2 text-left font-semibold border-b border-gray-600">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2 text-gray-300 border-t border-gray-700">{children}</td>,
  a: ({ href, children }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-gray-200 italic">{children}</em>,
  hr: () => <hr className="border-gray-700 my-4" />,
}

const TABS = ['Final Output', 'Raw JSON', 'Agent Trace', 'Logs']

export default function OutputTabs({ workflow }) {
  const [active, setActive] = useState('Final Output')
  const rawDoc = workflow?.final_output?.document ?? workflow?.final_output ?? ''
  const cleaned = cleanOutput(typeof rawDoc === 'string' ? rawDoc : JSON.stringify(rawDoc, null, 2))
  const messages = workflow?.messages || []
  const results = workflow?.results || []
  const rawJson = JSON.stringify({ request_id: workflow?.request_id, status: workflow?.status, approval_status: workflow?.approval_status, retry_count: workflow?.retry_count, task_type: workflow?.task_type, final_output: workflow?.final_output, results: workflow?.results, error: workflow?.error, started_at: workflow?.started_at, ended_at: workflow?.ended_at }, null, 2)

  const logs = [
    workflow?.started_at && { t: workflow.started_at, lvl: 'INFO', msg: 'Workflow started — ID: ' + workflow.request_id },
    ...messages.map((m) => ({ t: m.timestamp, lvl: 'INFO', msg: '[' + m.agent + '] ' + m.content })),
    ...results.map((r) => ({ t: r.timestamp, lvl: r.success ? 'INFO' : 'ERROR', msg: '[' + r.agent + '] ' + (r.success ? 'Completed' : 'Failed: ' + (r.error || '')) })),
    workflow?.error && { t: workflow.ended_at, lvl: 'ERROR', msg: workflow.error },
    workflow?.ended_at && { t: workflow.ended_at, lvl: 'INFO', msg: 'Workflow ended — Status: ' + workflow.status },
  ].filter(Boolean).sort((a, b) => (a.t > b.t ? 1 : -1))

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-4">
      <div className="flex border-b border-gray-700 bg-gray-900/40 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActive(tab)} className={'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ' + (active === tab ? 'text-white border-blue-500' : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600')}>
            {tab}
          </button>
        ))}
      </div>
      <div className="p-5 max-h-[560px] overflow-y-auto">
        {active === 'Final Output' && (
          cleaned
            ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{cleaned}</ReactMarkdown>
            : <div className="flex flex-col items-center justify-center h-32 text-gray-500"><div className="text-3xl mb-2 animate-pulse">⏳</div><p className="text-sm">Waiting for output...</p></div>
        )}
        {active === 'Raw JSON' && (
          <div className="relative">
            <div className="absolute top-2 right-2"><CopyBtn text={rawJson} /></div>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto bg-gray-900 rounded-lg p-4 pt-10 leading-relaxed">{rawJson}</pre>
          </div>
        )}
        {active === 'Agent Trace' && (
          <div className="space-y-2">
            {messages.length > 0 ? messages.map((msg, i) => (
              <div key={i} className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{msg.agent}</span>
                  {msg.timestamp && <span className="text-xs text-gray-500 font-mono">{fmtTs(msg.timestamp)}</span>}
                </div>
                <p className="text-gray-300 text-sm">{msg.content}</p>
                {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                  <pre className="text-xs text-gray-500 mt-2 font-mono whitespace-pre-wrap">{JSON.stringify(msg.metadata, null, 2)}</pre>
                )}
              </div>
            )) : <p className="text-gray-500 text-sm">No agent trace data available.</p>}
          </div>
        )}
        {active === 'Logs' && (
          <div className="font-mono text-xs space-y-1">
            {logs.length > 0 ? logs.map((e, i) => (
              <div key={i} className="flex gap-3 py-0.5">
                <span className="text-gray-500 flex-shrink-0 w-20">{fmtTs(e.t)}</span>
                <span className={'w-12 flex-shrink-0 font-semibold ' + (e.lvl === 'ERROR' ? 'text-red-400' : 'text-green-400')}>{e.lvl}</span>
                <span className="text-gray-300 break-all">{e.msg}</span>
              </div>
            )) : <p className="text-gray-500">No logs available.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

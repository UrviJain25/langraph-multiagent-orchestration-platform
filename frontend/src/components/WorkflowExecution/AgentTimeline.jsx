const AGENT = {
  supervisor: { icon: '🎯', color: 'text-purple-400' },
  researcher:  { icon: '🔍', color: 'text-blue-400' },
  coder:       { icon: '💻', color: 'text-green-400' },
  reviewer:    { icon: '✓',  color: 'text-yellow-400' },
  writer:      { icon: '✍', color: 'text-pink-400' },
  recovery:    { icon: '🔄', color: 'text-orange-400' },
  approval:    { icon: '🔐', color: 'text-cyan-400' },
}

function Step({ msg, isLast }) {
  const c = AGENT[msg.agent] || { icon: '●', color: 'text-gray-400' }
  const D = globalThis['Date']
  const ts = msg.timestamp ? new D(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className={'w-8 h-8 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center text-sm flex-shrink-0 transition-colors group-hover:border-gray-500 ' + c.color}>
          {c.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-700 mt-1.5 min-h-[20px]" />}
      </div>
      <div className={'flex-1 ' + (isLast ? 'pb-0' : 'pb-4')}>
        <div className="flex items-center gap-2 mb-1">
          <span className={'font-semibold text-sm capitalize ' + c.color}>{msg.agent}</span>
          {ts && <span className="text-xs text-gray-500 font-mono">{ts}</span>}
        </div>
        <p className="text-gray-300 text-sm leading-relaxed bg-gray-800/60 rounded-lg px-3 py-2 border border-gray-700/40">
          {msg.content}
        </p>
      </div>
    </div>
  )
}

export default function AgentTimeline({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">🔗 Agent Execution Timeline</h3>
        <p className="text-gray-500 text-sm">No agent activity recorded yet.</p>
      </div>
    )
  }
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-4">
      <h3 className="text-white font-semibold mb-5 flex items-center gap-2 text-sm">
        🔗 Agent Execution Timeline
        <span className="text-xs text-gray-500 font-normal">({messages.length} steps)</span>
      </h3>
      {messages.map((msg, i) => (
        <Step key={i} msg={msg} isLast={i === messages.length - 1} />
      ))}
    </div>
  )
}

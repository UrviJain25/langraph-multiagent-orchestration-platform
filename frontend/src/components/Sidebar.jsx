export default function Sidebar({ workflows, currentRequestId, onSelect, onNew }) {
  return (
    <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-screen flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-lg">⚡</span>
          <h2 className="text-white font-semibold text-sm">LangGraph</h2>
        </div>
        <button onClick={onNew} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
          + New
        </button>
      </div>
      <p className="text-gray-500 text-xs px-4 pt-3 pb-1 font-medium uppercase tracking-wider">Workflows</p>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {workflows.length === 0 && (
          <div className="text-center text-gray-600 text-sm pt-10">
            <div className="text-2xl mb-2">📋</div>
            <p>No workflows yet</p>
          </div>
        )}
        {[...workflows].reverse().map((wf) => (
          <button
            key={wf.request_id}
            onClick={() => onSelect(wf.request_id)}
            className={'w-full text-left p-3 rounded-xl border transition-all ' + (
              wf.request_id === currentRequestId
                ? 'bg-blue-600/20 border-blue-500/40 text-white'
                : 'bg-gray-800/40 border-gray-700/60 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
            )}
          >
            <div className="font-medium text-sm truncate mb-1">
              {wf.query ? (wf.query.length > 48 ? wf.query.slice(0, 45) + '...' : wf.query) : 'Untitled'}
            </div>
            <div className="text-xs text-gray-500 font-mono">{wf.request_id?.slice(0, 8)}...</div>
          </button>
        ))}
      </div>
    </aside>
  )
}

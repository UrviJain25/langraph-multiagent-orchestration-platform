import StatusBadge from '../StatusBadge.jsx'

function fmtTime(d) {
  if (!d) return '—'
  const dt = new (globalThis['Date'])(d)
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function WorkflowHeader({ workflow, query }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold text-white mb-1.5 truncate">
          {query || 'Workflow Execution'}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
          <span>
            Workflow ID:{' '}
            <span className="font-mono text-gray-300 text-xs bg-gray-800 px-1.5 py-0.5 rounded">
              {workflow?.request_id?.slice(0, 12)}...
            </span>
          </span>
          {workflow?.started_at && (
            <span>Created: <span className="text-gray-300">{fmtTime(workflow.started_at)}</span></span>
          )}
          {workflow?.ended_at && (
            <span>Ended: <span className="text-gray-300">{fmtTime(workflow.ended_at)}</span></span>
          )}
        </div>
      </div>
      <StatusBadge status={workflow?.status} approvalStatus={workflow?.approval_status} />
    </div>
  )
}

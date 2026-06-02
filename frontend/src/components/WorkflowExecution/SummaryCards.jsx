function Card({ icon, label, value, sub, highlight }) {
  return (
    <div className={'bg-gray-800 border rounded-xl p-4 flex flex-col gap-1.5 transition-all cursor-default hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 ' + (highlight ? 'border-orange-500/40' : 'border-gray-700 hover:border-gray-600')}>
      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
        <span>{icon}</span>{label}
      </div>
      <div className="text-white font-semibold text-lg leading-tight">{value}</div>
      {sub && <div className="text-gray-500 text-xs">{sub}</div>}
    </div>
  )
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—' }

function effectiveStatus(status, approvalStatus) {
  if (status === 'completed' && approvalStatus === 'pending') return 'Awaiting Approval'
  return { running: 'Running', completed: 'Completed', failed: 'Failed', pending: 'Pending', waiting_approval: 'Awaiting Approval' }[status] || (status || '—')
}

export default function SummaryCards({ workflow }) {
  const s = workflow?.status
  const a = workflow?.approval_status
  const retries = workflow?.retry_count ?? 0
  let execTime = '—'
  if (workflow?.started_at && workflow?.ended_at) {
    const D = globalThis['Date']
    const ms = new D(workflow.ended_at) - new D(workflow.started_at)
    execTime = (ms / 1000).toFixed(1) + 's'
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <Card icon="⚡" label="Status" value={effectiveStatus(s, a)} highlight={s === 'completed' && a === 'pending'} />
      <Card icon="✓" label="Approval" value={cap(a)} highlight={a === 'pending'} />
      <Card icon="↺" label="Retries" value={retries} sub={retries > 0 ? 'attempts made' : 'no retries needed'} />
      <Card icon="⏱" label="Exec Time" value={execTime} />
    </div>
  )
}

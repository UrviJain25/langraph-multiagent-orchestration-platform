const CFG = {
  running:          { label: 'Running',          cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    dot: 'bg-blue-400 animate-pulse' },
  completed:        { label: 'Completed',         cls: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400' },
  failed:           { label: 'Failed',            cls: 'bg-red-500/20 text-red-400 border-red-500/30',       dot: 'bg-red-400' },
  pending:          { label: 'Pending',           cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30',    dot: 'bg-gray-400' },
  waiting_approval: { label: 'Awaiting Approval', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
  awaiting:         { label: 'Awaiting Approval', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
}

export default function StatusBadge({ status, approvalStatus }) {
  const key = status === 'completed' && approvalStatus === 'pending' ? 'awaiting' : (status || 'pending')
  const c = CFG[key] || CFG.pending
  return (
    <span className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ' + c.cls}>
      <span className={'w-1.5 h-1.5 rounded-full ' + c.dot} />
      {c.label}
    </span>
  )
}

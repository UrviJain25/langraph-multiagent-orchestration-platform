export default function ApprovalActions({ workflow, onApprove, onReject }) {
  const needs = workflow?.requires_approval &&
    workflow?.approval_status === 'pending' &&
    (workflow?.status === 'waiting_approval' || workflow?.status === 'completed')
  if (!needs) return null
  return (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-orange-400 text-xl mt-0.5">🔐</span>
        <div>
          <h4 className="text-orange-400 font-semibold text-sm">Human Approval Required</h4>
          <p className="text-gray-400 text-xs mt-0.5">Review the workflow output and approve or reject to continue</p>
        </div>
      </div>
      {workflow?.approval_reason && (
        <p className="text-gray-300 text-sm mb-4 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">{workflow.approval_reason}</p>
      )}
      <div className="flex gap-3">
        <button onClick={onApprove} className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5">
          <span>✓</span> Approve
        </button>
        <button onClick={onReject} className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5">
          <span>✗</span> Reject
        </button>
      </div>
    </div>
  )
}

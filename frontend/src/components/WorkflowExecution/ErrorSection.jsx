export default function ErrorSection({ error, retryCount }) {
  if (!error) {
    return (
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
        <span className="text-green-400 text-base">✓</span>
        <span className="text-green-400 text-sm font-medium">No Errors Detected</span>
      </div>
    )
  }
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-400 text-lg">⚠</span>
        <span className="text-red-400 font-semibold text-sm">Execution Failed</span>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Reason</p>
          <p className="text-red-300 text-sm bg-red-900/20 rounded px-3 py-2">{error}</p>
        </div>
        {retryCount > 0 && (
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Retry Count</p>
            <p className="text-red-300 text-sm">{retryCount}</p>
          </div>
        )}
      </div>
    </div>
  )
}

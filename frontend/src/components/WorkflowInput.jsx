import { useState } from 'react'

export default function WorkflowInput({ onStart, loading }) {
  const [query, setQuery] = useState('')
  const submit = () => { if (query.trim()) { onStart(query.trim()); setQuery('') } }
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚡</span>
          <h1 className="text-4xl font-bold text-white">Workflow Console</h1>
        </div>
        <p className="text-gray-400 ml-12 text-sm">Orchestrate AI agents with LangGraph multi-agent pipelines</p>
      </div>
      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-5 shadow-2xl">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit() }}
          placeholder="Describe your workflow... e.g. Write a Python function to merge two sorted lists"
          className="w-full bg-transparent text-white placeholder-gray-500 text-base resize-none outline-none min-h-[130px] leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
          <span className="text-gray-600 text-xs">Ctrl+Enter to submit</span>
          <button
            onClick={submit}
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
          >
            {loading ? <><span className="animate-spin inline-block">↺</span> Starting...</> : <><span>▶</span> Start Workflow</>}
          </button>
        </div>
      </div>
    </div>
  )
}

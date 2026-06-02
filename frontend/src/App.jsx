import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import WorkflowInput from './components/WorkflowInput.jsx'
import WorkflowHeader from './components/WorkflowExecution/WorkflowHeader.jsx'
import SummaryCards from './components/WorkflowExecution/SummaryCards.jsx'
import OutputTabs from './components/WorkflowExecution/OutputTabs.jsx'
import AgentTimeline from './components/WorkflowExecution/AgentTimeline.jsx'
import ErrorSection from './components/WorkflowExecution/ErrorSection.jsx'
import ApprovalActions from './components/WorkflowExecution/ApprovalActions.jsx'
import { useWorkflow } from './hooks/useWorkflow.js'

export default function App() {
  const { workflows, currentWorkflow, currentRequestId, loading, start, loadWorkflow, approve, reject } = useWorkflow()
  const [view, setView] = useState('input')
  const currentMeta = workflows.find((w) => w.request_id === currentRequestId)

  async function handleStart(query) {
    setView('execution')
    await start(query)
  }

  function handleSelect(id) {
    setView('execution')
    loadWorkflow(id)
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar workflows={workflows} currentRequestId={currentRequestId} onSelect={handleSelect} onNew={() => setView('input')} />
      <main className="flex-1 overflow-y-auto min-w-0">
        {view === 'input' ? (
          <WorkflowInput onStart={handleStart} loading={loading} />
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <div className="text-5xl animate-spin">↺</div>
                <p className="text-sm">Loading workflow...</p>
              </div>
            ) : currentWorkflow ? (
              <>
                <WorkflowHeader workflow={currentWorkflow} query={currentMeta?.query} />
                <SummaryCards workflow={currentWorkflow} />
                <ApprovalActions workflow={currentWorkflow} onApprove={approve} onReject={reject} />
                <OutputTabs workflow={currentWorkflow} />
                <AgentTimeline messages={currentWorkflow.messages} />
                <ErrorSection error={currentWorkflow.error} retryCount={currentWorkflow.retry_count} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
                <div className="text-4xl">📋</div>
                <p className="text-sm">Select a workflow or start a new one.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

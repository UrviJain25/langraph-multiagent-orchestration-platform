import { useState, useEffect, useRef, useCallback } from 'react'
import { getWorkflow, startWorkflow, approveWorkflow, rejectWorkflow, createWebSocket } from '../api/workflows.js'

const KEY = 'langraph_workflows'

function stored() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function nowIso() {
  return (new (globalThis['Date'])()).toISOString()
}

export function useWorkflow() {
  const [workflows, setWorkflows] = useState(stored)
  const [currentWorkflow, setCurrentWorkflow] = useState(null)
  const [currentRequestId, setCurrentRequestId] = useState(null)
  const [loading, setLoading] = useState(false)
  const wsRef = useRef(null)

  const persist = (list) => {
    setWorkflows(list)
    localStorage.setItem(KEY, JSON.stringify(list))
  }

  const loadWorkflow = useCallback(async (requestId) => {
    setLoading(true)
    setCurrentRequestId(requestId)
    try {
      const data = await getWorkflow(requestId)
      setCurrentWorkflow(data)
      if (wsRef.current) wsRef.current.close()
      if (data.status !== 'completed' && data.status !== 'failed') {
        wsRef.current = createWebSocket(requestId, (update) => {
          setCurrentWorkflow((prev) => ({ ...prev, ...update }))
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const start = useCallback(async (query) => {
    setLoading(true)
    try {
      const data = await startWorkflow(query)
      const list = [...stored(), { request_id: data.request_id, query, created_at: nowIso() }]
      persist(list)
      await loadWorkflow(data.request_id)
    } finally {
      setLoading(false)
    }
  }, [loadWorkflow])

  const approve = useCallback(async () => {
    if (currentRequestId) await approveWorkflow(currentRequestId)
  }, [currentRequestId])

  const reject = useCallback(async () => {
    if (currentRequestId) await rejectWorkflow(currentRequestId)
  }, [currentRequestId])

  useEffect(() => () => { if (wsRef.current) wsRef.current.close() }, [])

  return { workflows, currentWorkflow, currentRequestId, loading, start, loadWorkflow, approve, reject }
}

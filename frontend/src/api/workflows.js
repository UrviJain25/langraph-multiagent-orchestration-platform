const API_BASE = 'http://localhost:8000'

export async function startWorkflow(query) {
  const res = await fetch(API_BASE + '/workflow/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error('Failed to start workflow')
  return res.json()
}

export async function getWorkflow(requestId) {
  const res = await fetch(API_BASE + '/workflow/' + requestId)
  if (!res.ok) throw new Error('Workflow not found')
  return res.json()
}

export async function approveWorkflow(requestId) {
  await fetch(API_BASE + '/workflow/' + requestId + '/approve', { method: 'POST' })
}

export async function rejectWorkflow(requestId) {
  await fetch(API_BASE + '/workflow/' + requestId + '/reject', { method: 'POST' })
}

export function createWebSocket(requestId, onMessage) {
  const ws = new WebSocket('ws://localhost:8000/ws/' + requestId)
  ws.onmessage = (e) => onMessage(JSON.parse(e.data))
  return ws
}

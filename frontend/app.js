const API_BASE = "http://localhost:8000";

let socket = null;
let currentRequestId = null;

// ─── DOM refs ───────────────────────────────────────────────
const queryInput      = document.getElementById("queryInput");
const startBtn        = document.getElementById("startBtn");
const btnSpinner      = document.getElementById("btnSpinner");
const btnText         = document.getElementById("btnText");
const inlineError     = document.getElementById("inlineError");
const workflowList    = document.getElementById("workflowList");
const workflowSection = document.getElementById("workflowSection");
const requestIdText   = document.getElementById("requestIdText");
const workflowTitle   = document.getElementById("workflowTitle");
const statusBadge     = document.getElementById("statusBadge");
const agentBadge      = document.getElementById("agentBadge");
const statusText      = document.getElementById("statusText");
const agentText       = document.getElementById("agentText");
const approvalStatus  = document.getElementById("approvalStatus");
const retryCount      = document.getElementById("retryCount");
const finalOutput     = document.getElementById("finalOutput");
const copyOutputBtn   = document.getElementById("copyOutputBtn");
const errorCard       = document.getElementById("errorCard");
const errorOutput     = document.getElementById("errorOutput");
const actionButtons   = document.getElementById("actionButtons");
const approveBtn      = document.getElementById("approveBtn");
const rejectBtn       = document.getElementById("rejectBtn");


// ─── LOCAL STORAGE ──────────────────────────────────────────

function getStoredWorkflows() {
  return JSON.parse(localStorage.getItem("workflows") || "[]");
}

function saveStoredWorkflows(workflows) {
  localStorage.setItem("workflows", JSON.stringify(workflows));
}


// ─── HELPERS ────────────────────────────────────────────────

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function taskTypeToAgent(taskType) {
  const map = {
    research: "researcher",
    coding:   "coder",
    review:   "reviewer",
    writing:  "writer",
  };
  return map[taskType] || null;
}

function setLoading(loading) {
  startBtn.disabled = loading;
  btnSpinner.style.display = loading ? "block" : "none";
  btnText.textContent = loading ? "Starting..." : "Start Workflow";
}

function showInlineError(msg) {
  inlineError.textContent = msg;
  inlineError.classList.remove("hidden");
}

function clearInlineError() {
  inlineError.textContent = "";
  inlineError.classList.add("hidden");
}


// ─── SIDEBAR ────────────────────────────────────────────────

function renderWorkflowSidebar() {
  const workflows = getStoredWorkflows();

  if (workflows.length === 0) {
    workflowList.innerHTML = `
      <div class="empty-state">
        <p>🗂️</p>
        <p>No workflows yet.<br>Start one on the right.</p>
      </div>`;
    return;
  }

  workflowList.innerHTML = "";

  [...workflows].reverse().forEach((workflow) => {
    const agentName = taskTypeToAgent(workflow.task_type);
    const agentClass = agentName ? `agent-${agentName}` : "agent-unknown";
    const agentLabel = agentName || "unknown";

    const item = document.createElement("div");
    item.className = "workflow-item" + (workflow.request_id === currentRequestId ? " active" : "");

    item.innerHTML = `
      <div class="workflow-item-title">${workflow.query}</div>
      <div class="workflow-item-meta">
        <span class="agent-badge ${agentClass}">${agentLabel}</span>
        <span class="workflow-item-time">${timeAgo(workflow.created_at)}</span>
      </div>`;

    item.addEventListener("click", () => loadWorkflow(workflow.request_id));
    workflowList.appendChild(item);
  });
}


// ─── START WORKFLOW ─────────────────────────────────────────

startBtn.addEventListener("click", async () => {
  const query = queryInput.value.trim();

  clearInlineError();

  if (!query) {
    showInlineError("Please enter a task before starting.");
    return;
  }
  if (query.length > 2000) {
    showInlineError("Query is too long (max 2000 characters).");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/workflow/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Server error");
    }

    const data = await response.json();
    currentRequestId = data.request_id;

    const workflows = getStoredWorkflows();
    workflows.push({
      request_id: data.request_id,
      query,
      task_type: null,
      created_at: new Date().toISOString(),
    });
    saveStoredWorkflows(workflows);

    renderWorkflowSidebar();
    loadWorkflow(data.request_id);
    queryInput.value = "";
  } catch (error) {
    showInlineError(error.message || "Failed to start workflow. Is the server running?");
  } finally {
    setLoading(false);
  }
});


// ─── LOAD WORKFLOW ───────────────────────────────────────────

async function loadWorkflow(requestId) {
  try {
    currentRequestId = requestId;
    renderWorkflowSidebar();

    const response = await fetch(`${API_BASE}/workflow/${requestId}`);
    if (!response.ok) throw new Error("Workflow not found");

    const workflow = await response.json();
    workflowSection.classList.remove("hidden");
    updateUI(workflow);
    connectWebSocket(requestId);
  } catch (error) {
    console.error(error);
  }
}


// ─── UPDATE UI ───────────────────────────────────────────────

function updateUI(workflow) {
  // Title: use first ~60 chars of the user's request
  const title = workflow.user_request
    ? workflow.user_request.slice(0, 60) + (workflow.user_request.length > 60 ? "…" : "")
    : "Workflow Execution";
  workflowTitle.textContent = title;
  requestIdText.textContent = workflow.request_id;

  // Status badge — dynamic color class
  const status = workflow.status || "pending";
  statusBadge.textContent = status.replace("_", " ");
  statusBadge.className = `status-badge status-${status}`;
  statusText.textContent = status.replace("_", " ");

  // Agent badge
  const agentName = taskTypeToAgent(workflow.task_type) || workflow.task_type;
  if (agentName && agentName !== "unknown") {
    agentBadge.textContent = agentName;
    agentBadge.className = `agent-badge agent-${agentName}`;
    agentBadge.classList.remove("hidden");
    agentText.textContent = agentName;
  } else {
    agentBadge.classList.add("hidden");
    agentText.textContent = "—";
  }

  approvalStatus.textContent = workflow.approval_status || "—";
  retryCount.textContent     = workflow.retry_count ?? 0;

  // Output: show ALL keys from final_output, not just "document"
  const output = workflow.final_output;
  if (output && Object.keys(output).length > 0) {
    finalOutput.textContent = Object.entries(output)
      .map(([k, v]) => (Object.keys(output).length > 1 ? `[${k}]\n${v}` : v))
      .join("\n\n");
  } else {
    finalOutput.textContent = "No output yet";
  }

  // Error card — show only if there is an actual error
  if (workflow.error) {
    errorOutput.textContent = workflow.error;
    errorCard.classList.remove("hidden");
  } else {
    errorCard.classList.add("hidden");
  }

  // Approve / Reject — show only when waiting for human approval
  if (status === "waiting_approval") {
    actionButtons.classList.remove("hidden");
  } else {
    actionButtons.classList.add("hidden");
  }

  // Sync task_type back to localStorage so sidebar badges update
  const stored = getStoredWorkflows();
  const idx = stored.findIndex(w => w.request_id === workflow.request_id);
  if (idx !== -1 && workflow.task_type) {
    stored[idx].task_type = workflow.task_type;
    saveStoredWorkflows(stored);
    renderWorkflowSidebar();
  }
}


// ─── WEBSOCKET ───────────────────────────────────────────────

function connectWebSocket(requestId) {
  if (socket) socket.close();

  socket = new WebSocket(`ws://localhost:8000/ws/${requestId}`);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateUI(data);
  };

  socket.onerror = () => console.warn("WebSocket error — falling back to polling");
}


// ─── COPY OUTPUT ─────────────────────────────────────────────

copyOutputBtn.addEventListener("click", () => {
  const text = finalOutput.textContent;
  if (!text || text === "No output yet") return;

  navigator.clipboard.writeText(text).then(() => {
    copyOutputBtn.textContent = "Copied!";
    setTimeout(() => { copyOutputBtn.textContent = "Copy"; }, 2000);
  });
});


// ─── NEW WORKFLOW ────────────────────────────────────────────

document.getElementById("newWorkflowBtn").addEventListener("click", () => {
  workflowSection.classList.add("hidden");
  queryInput.focus();
  clearInlineError();
  if (socket) { socket.close(); socket = null; }
  currentRequestId = null;
  renderWorkflowSidebar();
});


// ─── APPROVE ────────────────────────────────────────────────

approveBtn.addEventListener("click", async () => {
  if (!currentRequestId) return;
  try {
    await fetch(`${API_BASE}/workflow/${currentRequestId}/approve`, { method: "POST" });
  } catch (error) {
    console.error(error);
  }
});


// ─── REJECT ─────────────────────────────────────────────────

rejectBtn.addEventListener("click", async () => {
  if (!currentRequestId) return;
  try {
    await fetch(`${API_BASE}/workflow/${currentRequestId}/reject`, { method: "POST" });
  } catch (error) {
    console.error(error);
  }
});


// ─── INIT ────────────────────────────────────────────────────

renderWorkflowSidebar();

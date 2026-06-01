const API_BASE = "http://localhost:8000";

let socket = null;
let currentRequestId = null;

const queryInput = document.getElementById("queryInput");
const startBtn = document.getElementById("startBtn");

const workflowList =
  document.getElementById("workflowList");

const workflowSection =
  document.getElementById("workflowSection");

const requestIdText =
  document.getElementById("requestIdText");

const workflowTitle =
  document.getElementById("workflowTitle");

const statusBadge =
  document.getElementById("statusBadge");

const statusText =
  document.getElementById("statusText");

const approvalStatus =
  document.getElementById("approvalStatus");

const retryCount =
  document.getElementById("retryCount");

const finalOutput =
  document.getElementById("finalOutput");

const errorOutput =
  document.getElementById("errorOutput");

const approveBtn =
  document.getElementById("approveBtn");

const rejectBtn =
  document.getElementById("rejectBtn");


/* =========================
   LOCAL STORAGE
========================= */

function getStoredWorkflows() {
  return JSON.parse(
    localStorage.getItem("workflows") || "[]"
  );
}

function saveStoredWorkflows(workflows) {
  localStorage.setItem(
    "workflows",
    JSON.stringify(workflows)
  );
}


/* =========================
   SIDEBAR
========================= */

function renderWorkflowSidebar() {

  const workflows = getStoredWorkflows();

  workflowList.innerHTML = "";

  workflows.reverse().forEach((workflow) => {

    const item = document.createElement("div");

    item.className = "workflow-item";

    if (workflow.request_id === currentRequestId) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <h4>${workflow.query}</h4>
      <p>${workflow.request_id}</p>
    `;

    item.addEventListener("click", () => {
      loadWorkflow(workflow.request_id);
    });

    workflowList.appendChild(item);

  });

}


/* =========================
   START WORKFLOW
========================= */

startBtn.addEventListener("click", async () => {

  const query = queryInput.value.trim();

  if (!query) {
    alert("Enter workflow query");
    return;
  }

  try {

    const response = await fetch(
      `${API_BASE}/workflow/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      }
    );

    const data = await response.json();

    currentRequestId = data.request_id;

    const workflows = getStoredWorkflows();

    workflows.push({
      request_id: data.request_id,
      query
    });

    saveStoredWorkflows(workflows);

    renderWorkflowSidebar();

    loadWorkflow(data.request_id);

    queryInput.value = "";

  } catch (error) {
    console.error(error);
    alert("Failed to start workflow");
  }

});


/* =========================
   LOAD WORKFLOW
========================= */

async function loadWorkflow(requestId) {

  try {

    currentRequestId = requestId;

    renderWorkflowSidebar();

    const response = await fetch(
      `${API_BASE}/workflow/${requestId}`
    );

    if (!response.ok) {
      throw new Error("Workflow not found");
    }

    const workflow = await response.json();

    workflowSection.classList.remove("hidden");

    updateUI(workflow);

    connectWebSocket(requestId);

  } catch (error) {
    console.error(error);
  }

}


/* =========================
   UPDATE UI
========================= */

function updateUI(workflow) {

  workflowTitle.textContent =
    "Workflow Execution";

  requestIdText.textContent =
    workflow.request_id;

  statusBadge.textContent =
    workflow.status || "-";

  statusText.textContent =
    workflow.status || "-";

  approvalStatus.textContent =
    workflow.approval_status || "-";

  retryCount.textContent =
    workflow.retry_count || 0;

  finalOutput.textContent =
    workflow.final_output
      ? JSON.stringify(
          workflow.final_output["document"],
          null,
          2
        )
      : "No output yet";

  errorOutput.textContent =
    workflow.error || "No errors";

}


/* =========================
   WEBSOCKET
========================= */

function connectWebSocket(requestId) {

  if (socket) {
    socket.close();
  }

  socket = new WebSocket(
    `ws://localhost:8000/ws/${requestId}`
  );

  socket.onmessage = (event) => {

    const data = JSON.parse(event.data);

    updateUI(data);

  };

}


/* =========================
   APPROVE
========================= */

approveBtn.addEventListener("click", async () => {

  if (!currentRequestId) return;

  try {

    await fetch(
      `${API_BASE}/workflow/${currentRequestId}/approve`,
      {
        method: "POST"
      }
    );

  } catch (error) {
    console.error(error);
  }

});


/* =========================
   REJECT
========================= */

rejectBtn.addEventListener("click", async () => {

  if (!currentRequestId) return;

  try {

    await fetch(
      `${API_BASE}/workflow/${currentRequestId}/reject`,
      {
        method: "POST"
      }
    );

  } catch (error) {
    console.error(error);
  }

});


/* =========================
   INIT
========================= */

renderWorkflowSidebar();
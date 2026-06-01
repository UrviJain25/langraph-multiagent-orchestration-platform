import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from core.workflow import run
from core.state import SharedState
from agents.specialists import writer_node
from storage.repository import save_workflow, get_workflow, list_workflows
from observability.metrics import workflow_success, workflow_failure

router = APIRouter()


class WorkflowRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


def _apply_node_result(state: SharedState, result: dict) -> SharedState:
    """Merge a node's returned dict back onto a SharedState, handling list fields."""
    data = state.model_dump()
    for key, value in result.items():
        if key in ("results", "messages") and isinstance(value, list):
            data[key] = data.get(key, []) + value
        else:
            data[key] = value
    return SharedState(**data)


async def _run_workflow_background(request_id: str, query: str):
    try:
        await asyncio.to_thread(run, query, request_id)
    except Exception as e:
        workflow = get_workflow(request_id)
        if workflow:
            workflow.status = "failed"
            workflow.error = str(e)
            workflow.ended_at = datetime.now(timezone.utc)
            save_workflow(workflow)
        workflow_failure.inc()


@router.post("/workflow/start")
async def start_workflow(
    payload: WorkflowRequest,
    background_tasks: BackgroundTasks,
):
    query = payload.query.strip()

    # Persist a pending record immediately so the WebSocket can find it right away
    initial_state = SharedState(user_request=query, status="pending")
    save_workflow(initial_state)

    background_tasks.add_task(
        _run_workflow_background,
        initial_state.request_id,
        query,
    )

    return {
        "message": "Workflow started",
        "request_id": initial_state.request_id,
        "status": "pending",
    }


@router.get("/workflows")
def list_all_workflows():
    return list_workflows()


@router.get("/workflow/{request_id}")
def workflow_status(request_id: str):
    workflow = get_workflow(request_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("/workflow/{request_id}/approve")
def approve_workflow(request_id: str):
    workflow = get_workflow(request_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow.approval_status = "approved"
    workflow.status = "running"
    save_workflow(workflow)

    # Resume execution: run the writer node on the approved state
    try:
        result = writer_node(workflow)
        workflow = _apply_node_result(workflow, result)
        workflow.status = "completed"
        save_workflow(workflow)
        workflow_success.inc()
    except Exception as e:
        workflow.status = "failed"
        workflow.error = str(e)
        workflow.ended_at = datetime.now(timezone.utc)
        save_workflow(workflow)
        workflow_failure.inc()

    return {"message": "Workflow approved", "request_id": request_id}


@router.post("/workflow/{request_id}/reject")
def reject_workflow(request_id: str):
    workflow = get_workflow(request_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow.approval_status = "rejected"
    workflow.status = "failed"
    workflow.ended_at = datetime.now(timezone.utc)
    save_workflow(workflow)

    return {"message": "Workflow rejected", "request_id": request_id}

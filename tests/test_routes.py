import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# Import your router. Adjust the import path based on your project structure.
from api.routes import router

# Setup the TestClient with an isolated FastAPI app instance
app = FastAPI()
app.include_router(router)
client = TestClient(app)


# --- Helper Mock Objects ---
class MockWorkflowResult:
    def __init__(
        self,
        request_id="070c487a-1616-4308-b371-98d396d395d3",
        status="pending",
        approval_status="pending",
    ):
        self.request_id = request_id
        self.status = status
        self.approval_status = approval_status
        # Mocking any extra fields that might be returned or serialized
        self.query = "test query"


# --- Tests for POST /workflow/start ---


@patch("routes.run")
@patch("routes.save_workflow")
def test_start_workflow_success(mock_save, mock_run):
    # Arrange
    mock_result = MockWorkflowResult()
    mock_run.return_value = mock_result
    payload = {"query": "Execute database migration"}

    # Act
    response = client.post("/workflow/start", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Workflow started"
    assert data["request_id"] == "070c487a-1616-4308-b371-98d396d395d3"
    assert data["status"] == "pending"

    mock_run.assert_called_once_with("Execute database migration")
    mock_save.assert_called_once_with(mock_result)


def test_start_workflow_invalid_payload():
    # Act: Missing the required 'query' field
    response = client.post("/workflow/start", json={})

    # Assert
    assert (
        response.status_code == 422
    )  # Unprocessable Entity (Pydantic validation failure)


# --- Tests for GET /workflow/{request_id} ---


@patch("routes.get_workflow")
def test_get_workflow_status_success(mock_get):
    # Arrange
    mock_workflow = MockWorkflowResult(
        request_id="070c487a-1616-4308-b371-98d396d395d4", status="running"
    )
    # Simulating what FastAPI's encoders do to object properties when returned
    mock_get.return_value = {
        "request_id": "070c487a-1616-4308-b371-98d396d395d4",
        "status": "running",
    }

    # Act
    response = client.get("/workflow/070c487a-1616-4308-b371-98d396d395d4")

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "request_id": "070c487a-1616-4308-b371-98d396d395d4",
        "status": "running",
    }
    mock_get.assert_called_once_with("070c487a-1616-4308-b371-98d396d395d4")


@patch("routes.get_workflow")
def test_get_workflow_status_not_found(mock_get):
    # Arrange
    mock_get.return_value = None

    # Act
    response = client.get("/workflow/missing-id")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Workflow not found"


# --- Tests for POST /workflow/{request_id}/approve ---


@patch("routes.save_workflow")
@patch("routes.get_workflow")
def test_approve_workflow_success(mock_get, mock_save):
    # Arrange
    mock_workflow = MockWorkflowResult(
        request_id="070c487a-1616-4308-b371-98d396d395d5", status="pending"
    )
    mock_get.return_value = mock_workflow

    # Act
    response = client.post("/workflow/070c487a-1616-4308-b371-98d396d395d5/approve")

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "message": "Workflow approved",
        "request_id": "070c487a-1616-4308-b371-98d396d395d5",
    }

    # Verify object state mutations before save
    assert mock_workflow.approval_status == "approved"
    assert mock_workflow.status == "running"
    mock_save.assert_called_once_with(mock_workflow)


@patch("routes.get_workflow")
def test_approve_workflow_not_found(mock_get):
    # Arrange
    mock_get.return_value = None

    # Act
    response = client.post("/workflow/missing-id/approve")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Workflow not found"


# --- Tests for POST /workflow/{request_id}/reject ---


@patch("routes.save_workflow")
@patch("routes.get_workflow")
def test_reject_workflow_success(mock_get, mock_save):
    # Arrange
    mock_workflow = MockWorkflowResult(
        request_id="070c487a-1616-4308-b371-98d396d395d6", status="pending"
    )
    mock_get.return_value = mock_workflow

    # Act
    response = client.post("/workflow/070c487a-1616-4308-b371-98d396d395d6/reject")

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "message": "Workflow rejected",
        "request_id": "070c487a-1616-4308-b371-98d396d395d6",
    }

    # Verify object state mutations before save
    assert mock_workflow.approval_status == "rejected"
    assert mock_workflow.status == "failed"
    mock_save.assert_called_once_with(mock_workflow)


@patch("routes.get_workflow")
def test_reject_workflow_not_found(mock_get):
    # Arrange
    mock_get.return_value = None

    # Act
    response = client.post("/workflow/070c487a-1616-4308-b371-98d396d295d9/reject")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Workflow not found"

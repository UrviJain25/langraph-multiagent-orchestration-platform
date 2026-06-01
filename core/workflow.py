from langgraph.graph import StateGraph, END

from core.persistence import persist_state
from core.state import SharedState

from agents.supervisor import (
    supervisor_node,
    supervisor_router
)

from agents.specialists import (
    researcher_node,
    coder_node,
    reviewer_node,
    writer_node
)

from observability.metrics import (
    workflow_success,
    workflow_failure,
    workflow_retry
)

from core.recovery import recovery_node
from core.approval import approval_node


def should_recover(state: SharedState):

    if state.error:
        return "recovery"

    return "continue"


def review_router(state: SharedState):

    if state.error:
        return "recovery"

    # Route to approval checkpoint if the workflow requires human sign-off
    if state.requires_approval:
        return "approval"

    return "writer"


def recovery_router(state: SharedState):

    # current_agent is now set by each specialist on both success and failure,
    # so recovery can retry the exact agent that failed.
    agent = state.current_agent or state.next_agent or "writer"
    return agent


def build_graph():

    graph = StateGraph(SharedState)

    # Nodes
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("coder", coder_node)
    graph.add_node("reviewer", reviewer_node)
    graph.add_node("writer", writer_node)
    graph.add_node("recovery", recovery_node)
    graph.add_node("approval", approval_node)

    # Entry point
    graph.set_entry_point("supervisor")

    # Supervisor Routing
    graph.add_conditional_edges(
        "supervisor",
        supervisor_router,
        {
            "researcher": "researcher",
            "coder": "coder",
            "reviewer": "reviewer",
            "writer": "writer"
        }
    )

    # Research Flow — ends immediately
    graph.add_edge("researcher", END)

    # Coding Flow — coder → recovery check → reviewer
    graph.add_conditional_edges(
        "coder",
        should_recover,
        {
            "recovery": "recovery",
            "continue": "reviewer"
        }
    )

    # Review Flow — reviewer → recovery / approval checkpoint / writer
    graph.add_conditional_edges(
        "reviewer",
        review_router,
        {
            "recovery": "recovery",
            "approval": "approval",
            "writer": "writer"
        }
    )

    # Approval pauses execution; the API resumes it by manually calling writer_node
    graph.add_edge("approval", END)

    # Writer ends the workflow
    graph.add_edge("writer", END)

    # Recovery retries the agent that originally failed
    graph.add_conditional_edges(
        "recovery",
        recovery_router,
        {
            "coder": "coder",
            "reviewer": "reviewer",
            "writer": "writer",
            "researcher": "researcher",
        }
    )

    return graph.compile()


# Compile Graph
orchestrator = build_graph()


def run(user_request: str, request_id: str = None):

    kwargs: dict = {"user_request": user_request}
    if request_id:
        kwargs["request_id"] = request_id

    initial_state = SharedState(**kwargs)

    try:

        result = orchestrator.invoke(initial_state)
        final_state = SharedState(**result)

        persist_state(final_state)

        if final_state.status == "completed":
            workflow_success.inc()

        return final_state

    except Exception as e:

        workflow_failure.inc()
        raise e

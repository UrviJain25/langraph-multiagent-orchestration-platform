#Us-5,6,7,8: Researcher Agent, Coder Agent, Reviewer Agent, Writer Agent

import sys
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from core.state import SharedState, AgentMessage, TaskResult
from langsmith import traceable

# Load environment variables
load_dotenv()

#Mock fallback LLM(in case api key expires)

def _default_llm_call(system_prompt: str, user_message: str) -> str:
    return (
        f"[MOCK RESPONSE]\n"
        f"System: {system_prompt[:60]}...\n"
        f"User:   {user_message[:80]}...\n"
        f"(Enable USE_REAL_LLM=true and fix api key)"
    )

#Real Groq LLM Setup
USE_REAL_LLM = os.getenv("USE_REAL_LLM", "false").lower() == "true"
_llm_fn = _default_llm_call
if USE_REAL_LLM:
    try:
        print("USE_REAL_LLM =", USE_REAL_LLM)
        print("GROQ_API_KEY exists =", bool(os.getenv("GROQ_API_KEY")))
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

        def real_llm_call(system_prompt: str, user_message: str) -> str:
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ])
            return response.content
        _llm_fn = real_llm_call
        print("Groq LLM Loaded")

    except Exception as e:
        print(f"Failed to initialize Groq LLM: {e}")
        print("Falling back to MOCK LLM")


# Optional Runtime Override
def set_llm_function(fn):
    global _llm_fn
    _llm_fn = fn

@traceable(name="execute_agent")
# Shared Agent Execution Helper
def execute_agent(
    *,
    state: SharedState,
    agent_name: str,
    task_type: str,
    system_prompt: str,
    output_key: str,
    success_message: str,
    input_text: str,
) -> dict:
    try:
        full_prompt = f"""
        Request ID: {state.request_id}    
        User Request:{input_text}
        """

        response = _llm_fn(system_prompt, full_prompt)
        result = TaskResult(
            agent=agent_name,
            task_type=task_type,
            output=response,
            success=True,
        )

        message = AgentMessage(
            agent=agent_name,
            content=success_message,
        )

        return {
            "results": [result],
            "messages": [message],
            "final_output": {output_key: response},
            "status": "completed",
            "current_agent": agent_name,
            "ended_at": datetime.now(timezone.utc),
        }

    except Exception as e:

        print("\n AGENT EXECUTION ERROR !!")
        print("Agent:", agent_name)
        print("Error:", str(e))
        print()

        result = TaskResult(
            agent=agent_name,
            task_type=task_type,
            output="",
            success=False,
            error=str(e),
        )

        message = AgentMessage(
            agent=agent_name,
            content=f"{agent_name.capitalize()} agent failed.",
        )

        return {
            "results": [result],
            "messages": [message],
            "status": "failed",
            "error": str(e),
            "current_agent": agent_name,
            "ended_at": datetime.now(timezone.utc),
        }


#Researcher Agent

RESEARCHER_SYSTEM = """
You are a specialist research agent.
Your job is to:
- Gather relevant information
- Summarize findings
- Provide factual and structured responses
Be concise but thorough.
"""


def researcher_node(state: SharedState) -> dict:

    return execute_agent(
        state=state,
        agent_name="researcher",
        task_type="research",
        system_prompt=RESEARCHER_SYSTEM,
        output_key="research",
        success_message="Research completed.",
        input_text=state.user_request,
    )


#Coder Agent
CODER_SYSTEM = """
You are a specialist coding agent.

Write:
- Clean code
- Production-ready solutions
- Type hints
- Comments
- Docstrings

Return code inside markdown triple backticks.
"""


def coder_node(state: SharedState) -> dict:
    
    return execute_agent(
        state=state,
        agent_name="coder",
        task_type="coding",
        system_prompt=CODER_SYSTEM,
        output_key="code",
        success_message="Code generation completed.",
        input_text=state.user_request,
    )


#Reviewer Agent
REVIEWER_SYSTEM = """
You are a specialist reviewer agent.

Review the provided content.

Structure:
✅ Strengths
❌ Issues
💡 Suggestions
📊 Overall Score
"""


def reviewer_node(state: SharedState) -> dict:
    previous_output = ""
    if state.results:
        previous_output = str(state.results[-1].output)
    review_input = (
        f"Original Request:\n{state.user_request}\n\n"
        f"Content To Review:\n{previous_output or state.user_request}"
    )
    return execute_agent(
        state=state,
        agent_name="reviewer",
        task_type="review",
        system_prompt=REVIEWER_SYSTEM,
        output_key="review",
        success_message="Review completed.",
        input_text=review_input,
    )


#Writer Agent

WRITER_SYSTEM = """
You are a specialist writer agent.

Generate:
- Reports
- Documentation
- Articles
- README files

Use Markdown formatting.
"""


def writer_node(state: SharedState) -> dict:

    return execute_agent(
        state=state,
        agent_name="writer",
        task_type="writing",
        system_prompt=WRITER_SYSTEM,
        output_key="document",
        success_message="Writing completed.",
        input_text=state.user_request,
    )

from prometheus_client import Counter, Histogram, Gauge

workflow_success = Counter(
    "workflow_success_total",
    "Successful workflows"
)

workflow_failure = Counter(
    "workflow_failure_total",
    "Failed workflows"
)

workflow_retry = Counter(
    "workflow_retry_total",
    "Workflow retries"
)

workflow_duration = Histogram(
    "workflow_duration_seconds",
    "Time from workflow start to completion",
    buckets=[1, 2, 5, 10, 30, 60, 120]
)

workflow_active = Gauge(
    "workflow_active_count",
    "Number of workflows currently running"
)

agent_invocations = Counter(
    "agent_invocations_total",
    "Total agent invocations by agent type",
    labelnames=["agent"]
)

agent_failures = Counter(
    "agent_failures_total",
    "Agent failures by agent type",
    labelnames=["agent"]
)

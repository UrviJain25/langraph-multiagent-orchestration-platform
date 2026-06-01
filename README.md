# AI-Powered Multi-Agent Workflow Orchestration Platform

A collaborative multi-agent orchestration system built using LangGraph, FastAPI, Groq LLMs, LangSmith, and OpenTelemetry.

The platform intelligently routes user requests between specialized AI agents while supporting workflow persistence, recovery systems, approval checkpoints, observability, and real-time monitoring.

---

# Core Features

- Multi-Agent Workflow Orchestration
- Supervisor-Based Task Routing
- Researcher, Coder, Reviewer & Writer Agents
- Shared Workflow State Management
- Error Recovery & Retry Logic
- Human Approval Checkpoints
- Workflow Persistence using SQLite
- LangSmith Tracing
- Prometheus/OpenTelemetry Metrics
- FastAPI REST APIs
- WebSocket Real-Time Updates

---

# Architecture

```text
User
 ↓
FastAPI API Layer
 ↓
Supervisor Agent
 ├── Researcher Agent
 ├── Coder Agent
 ├── Reviewer Agent
 └── Writer Agent
 ↓
Recovery & Approval System
 ↓
Persistence Layer
 ↓
Observability Layer
```

---

# Tech Stack

- Python
- LangGraph
- LangChain
- FastAPI
- Groq LLM
- SQLite
- LangSmith
- OpenTelemetry
- Prometheus

---

# Project Structure

```text
project/
│
├── agents/
├── api/
├── core/
├── observability/
├── storage/
├── tests/
│
├── requirements.txt
├── README.md
└── .env.example
```

---

# Setup Instructions

## Clone Repository

```bash
git clone <repo_url>
cd <project_name>
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Create Environment File

Copy:

```text
.env.example → .env
```

---

## Add Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
USE_REAL_LLM=true

LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=multi-agent-platform
```

---

# Run Application

```bash
uvicorn api.main:app --reload
```

---

# API Documentation

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

---

# APIs

## Start Workflow

```http
POST /workflow/start
```

## Get Workflow Status

```http
GET /workflow/{request_id}
```

## Approve Workflow

```http
POST /workflow/{request_id}/approve
```

## Reject Workflow

```http
POST /workflow/{request_id}/reject
```

---

# WebSocket Support

```text
ws://127.0.0.1:8000/ws/{request_id}
```

Provides real-time workflow updates.

---

# Metrics Endpoint

```text
http://127.0.0.1:8000/metrics
```

---

# Testing

```bash
pytest
```

# Load Testing

```bash
cd load_testing
locust
```

---

# Contributors

- Urvi Jain
- Shruti Mandal
- Srinidhi P Rao

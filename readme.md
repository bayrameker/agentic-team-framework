# Agentic Teams

Multi-Agent Team Management System - A framework enabling LLM-based agents to work together in teams.

## Overview

Agentic Teams is a system that enables different LLM models to work together as multi-agents within a team. Agents in different roles can break down tasks, collaborate, and solve complex problems.

## Features

- Create agents using different LLM models
- Organize agents into teams
- Break down tasks into subtasks and assign to appropriate agents
- Utilize models with different capabilities
- Iterate on tasks with feedback

## System Requirements

- Python 3.8+
- [Ollama](https://ollama.com/) installed and running
- Required LLM models loaded into Ollama (llama3, mistral, mixtral, gemma, phi3, etc.)

## Installation

1. Install requirements:
```bash
pip install -r requirements.txt
```

2. Install and run Ollama:
```bash
# Start the Ollama service
ollama serve

# Pull required models
ollama pull llama3
ollama pull mistral
ollama pull mixtral
ollama pull phi3
ollama pull gemma
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env file as needed
```

## Usage

### Running the Example Application

```bash
python example.py
```

This example application:
1. Checks Ollama models
2. Creates a software development team
3. Adds agents with different roles to the team
4. Creates a task and breaks it down into subtasks
5. Distributes the task to the team and shows results
6. Improves the solution with feedback

### Starting the API Server

```bash
python app.py
```

The API server will be available at:
- API: http://localhost:8000/api
- Documentation: http://localhost:8000/api/docs
- Web UI: http://localhost:8000

## API Endpoints

- `GET /api/models`: Lists available models
- `GET /api/model/{model_name}/capabilities`: Returns model capabilities
- `GET /api/teams`: Lists all teams
- `GET /api/teams/{team_id}`: Returns details of a specific team
- `POST /api/teams`: Creates a new team
- `POST /api/teams/{team_id}/agents`: Adds a new agent to a team
- `GET /api/tasks`: Lists all tasks
- `GET /api/tasks/{task_id}`: Returns details of a specific task
- `POST /api/tasks`: Creates a new task
- `POST /api/tasks/{task_id}/execute`: Executes a task
- `POST /api/tasks/{task_id}/iterate`: Iterates on a task based on feedback

## Customization

- `src/agents/agent.py`: Defines agent class and behaviors
- `src/models/ollama.py`: Ollama API adapter
- `src/models/team.py`: Team and task models
- `src/teams/team_manager.py`: Team management and task distribution

## License

MIT

## Contact

Contribute by opening an issue or sending a pull request on GitHub.






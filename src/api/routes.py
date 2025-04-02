from typing import Any, Dict, List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.core.manager import TeamManager
from src.models.base import ModelCapability
from src.models.team import AgentRole, TeamType
from src.api.schemas import (
    AddAgentRequest, AddAgentResponse, CreateSubtaskRequest, CreateSubtaskResponse,
    CreateTaskRequest, CreateTaskResponse, CreateTeamRequest, CreateTeamResponse,
    IterateTaskRequest, TeamResponse, TaskResponse, TaskDetailResponse, ModelCapabilityResponse
)

# Router oluşturma
router = APIRouter(prefix="/api", tags=["Agentic Teams API"])


# Bağımlılık (Dependency)
def get_team_manager() -> TeamManager:
    """TeamManager singleton nesnesi sağlar"""
    # Bu fonksiyon, gerçek uygulamada daha karmaşık olabilir
    # Ama şimdilik main.py'deki team_manager nesnesini kullanıyoruz
    from src.api.app import team_manager
    return team_manager


@router.get("/")
async def root():
    """Kök endpoint"""
    return {
        "message": "Agentic Teams API çalışıyor!",
        "version": "0.2.0",
        "docs": "/docs"
    }


@router.get("/models", response_model=Dict[str, List[str]])
async def list_models(team_manager: TeamManager = Depends(get_team_manager)):
    """Mevcut modelleri listeler"""
    models = await team_manager.refresh_available_models()
    return {"models": models}


@router.get("/models/{model_name}/capabilities", response_model=ModelCapabilityResponse)
async def get_model_capabilities(
    model_name: str, team_manager: TeamManager = Depends(get_team_manager)
):
    """Model yeteneklerini döndürür"""
    if model_name not in team_manager.available_models:
        raise HTTPException(status_code=404, detail=f"Model bulunamadı: {model_name}")
        
    capabilities = await team_manager.get_model_capabilities(model_name)
    return {
        "model": model_name, 
        "capabilities": capabilities
    }


@router.post("/teams", response_model=CreateTeamResponse)
async def create_team(
    request: CreateTeamRequest, team_manager: TeamManager = Depends(get_team_manager)
):
    """Yeni bir ekip oluşturur"""
    team_id = team_manager.create_team(
        name=request.name,
        team_type=request.type,
        description=request.description
    )
    return {"team_id": team_id}


@router.get("/teams", response_model=Dict[str, List[TeamResponse]])
async def list_teams(team_manager: TeamManager = Depends(get_team_manager)):
    """Tüm ekipleri listeler"""
    teams_info = team_manager.get_all_teams()
    teams_list = [
        TeamResponse(
            id=info["id"],
            name=info["name"],
            type=info["type"],
            description=info["description"],
            agent_count=info["agent_count"]
        ) for info in teams_info.values()
    ]
    return {"teams": teams_list}


@router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: str, team_manager: TeamManager = Depends(get_team_manager)):
    """Belirli bir ekibin detaylarını döndürür"""
    team = team_manager.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail=f"Ekip bulunamadı: {team_id}")
        
    agents = []
    for agent_config in team.agents:
        agents.append({
            "id": agent_config.id,
            "name": agent_config.name,
            "role": agent_config.role.value,
            "model_name": agent_config.model_name
        })
        
    return TeamResponse(
        id=team.id,
        name=team.name,
        type=team.type.value,
        description=team.description,
        agent_count=len(team.agents),
        agents=agents
    )


@router.post("/teams/{team_id}/agents", response_model=AddAgentResponse)
async def add_agent_to_team(
    team_id: str, 
    request: AddAgentRequest, 
    team_manager: TeamManager = Depends(get_team_manager)
):
    """Ekibe yeni bir ajan ekler"""
    try:
        agent_id = team_manager.add_agent_to_team(
            team_id=team_id,
            name=request.name,
            role=request.role,
            model_name=request.model_name,
            system_prompt=request.system_prompt,
            required_capabilities=request.required_capabilities
        )
        return {"agent_id": agent_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/teams/{team_id}")
async def delete_team(
    team_id: str, team_manager: TeamManager = Depends(get_team_manager)
):
    """Bir ekibi siler"""
    success = team_manager.delete_team(team_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Ekip bulunamadı: {team_id}")
    return {"message": f"Ekip silindi: {team_id}"}


@router.post("/tasks", response_model=CreateTaskResponse)
async def create_task(
    request: CreateTaskRequest, team_manager: TeamManager = Depends(get_team_manager)
):
    """Yeni bir görev oluşturur"""
    try:
        task_id = team_manager.create_task(
            title=request.title,
            description=request.description,
            team_id=request.team_id
        )
        return {"task_id": task_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/subtasks", response_model=CreateSubtaskResponse)
async def create_subtask(
    task_id: str, 
    request: CreateSubtaskRequest, 
    team_manager: TeamManager = Depends(get_team_manager)
):
    """Yeni bir alt görev oluşturur"""
    try:
        subtask_id = team_manager.create_subtask(
            parent_task_id=request.parent_task_id,
            title=request.title,
            description=request.description,
            assigned_agent_id=request.assigned_agent_id,
            dependencies=request.dependencies
        )
        return {"subtask_id": subtask_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/execute")
async def execute_task(
    task_id: str, team_manager: TeamManager = Depends(get_team_manager)
):
    """Görevi yürütür"""
    try:
        result = await team_manager.execute_task(task_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/iterate")
async def iterate_task(
    task_id: str, 
    request: IterateTaskRequest, 
    team_manager: TeamManager = Depends(get_team_manager)
):
    """Görevi geribildirime göre yineler"""
    try:
        result = await team_manager.iterate_on_task(
            task_id=task_id,
            feedback=request.feedback
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tasks", response_model=Dict[str, List[TaskResponse]])
async def list_tasks(team_manager: TeamManager = Depends(get_team_manager)):
    """Tüm görevleri listeler"""
    tasks_info = team_manager.get_all_tasks()
    tasks_list = [
        TaskResponse(
            id=info["id"],
            title=info["title"],
            status=info["status"],
            team_id=info["team_id"],
            iterations=info["iterations"]
        ) for info in tasks_info.values()
    ]
    return {"tasks": tasks_list}


@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
async def get_task(task_id: str, team_manager: TeamManager = Depends(get_team_manager)):
    """Belirli bir görevin detaylarını döndürür"""
    try:
        task_details = team_manager.get_task_details(task_id)
        return TaskDetailResponse(**task_details)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str, team_manager: TeamManager = Depends(get_team_manager)
):
    """Bir görevi siler"""
    success = team_manager.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Görev bulunamadı: {task_id}")
    return {"message": f"Görev silindi: {task_id}"} 
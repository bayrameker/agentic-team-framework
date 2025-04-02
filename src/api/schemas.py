from typing import Dict, List, Optional, Set, Any

from pydantic import BaseModel, Field

from src.models.base import ModelCapability
from src.models.team import AgentRole, TeamType


# Ortak şemalar
class AgentInfo(BaseModel):
    """Ajan bilgisi"""
    id: str = Field(..., description="Ajan ID'si")
    name: str = Field(..., description="Ajan adı")
    role: str = Field(..., description="Ajan rolü")
    model_name: str = Field(..., description="Kullanılan model adı")


class SubtaskInfo(BaseModel):
    """Alt görev bilgisi"""
    id: str = Field(..., description="Alt görev ID'si")
    title: str = Field(..., description="Alt görev başlığı")
    status: str = Field(..., description="Alt görev durumu")
    assigned_agent_id: Optional[str] = Field(None, description="Atanan ajan ID'si")
    agent_name: Optional[str] = Field(None, description="Atanan ajan adı")
    agent_role: Optional[str] = Field(None, description="Atanan ajan rolü")


# İstek (Request) şemaları
class CreateTeamRequest(BaseModel):
    """Ekip oluşturma isteği"""
    name: str = Field(..., description="Ekip adı")
    type: TeamType = Field(..., description="Ekip türü")
    description: Optional[str] = Field(None, description="Ekip açıklaması")


class AddAgentRequest(BaseModel):
    """Ajan ekleme isteği"""
    name: str = Field(..., description="Ajan adı")
    role: AgentRole = Field(..., description="Ajan rolü")
    model_name: str = Field(..., description="Kullanılacak LLM modeli")
    system_prompt: Optional[str] = Field(None, description="Özel sistem komutu")
    required_capabilities: Optional[Set[ModelCapability]] = Field(
        None, description="Gerekli model yetenekleri"
    )


class CreateTaskRequest(BaseModel):
    """Görev oluşturma isteği"""
    title: str = Field(..., description="Görev başlığı")
    description: str = Field(..., description="Görev açıklaması")
    team_id: str = Field(..., description="Atanacak ekip ID'si")


class CreateSubtaskRequest(BaseModel):
    """Alt görev oluşturma isteği"""
    parent_task_id: str = Field(..., description="Üst görev ID'si")
    title: str = Field(..., description="Alt görev başlığı")
    description: str = Field(..., description="Alt görev açıklaması")
    assigned_agent_id: Optional[str] = Field(None, description="Atanacak ajan ID'si")
    dependencies: Optional[List[str]] = Field(
        None, description="Bağımlı alt görev ID'leri"
    )


class IterateTaskRequest(BaseModel):
    """Görev yineleme isteği"""
    feedback: str = Field(..., description="Geribildirim")


# Yanıt (Response) şemaları
class CreateTeamResponse(BaseModel):
    """Ekip oluşturma yanıtı"""
    team_id: str = Field(..., description="Oluşturulan ekip ID'si")


class AddAgentResponse(BaseModel):
    """Ajan ekleme yanıtı"""
    agent_id: str = Field(..., description="Oluşturulan ajan ID'si")


class CreateTaskResponse(BaseModel):
    """Görev oluşturma yanıtı"""
    task_id: str = Field(..., description="Oluşturulan görev ID'si")


class CreateSubtaskResponse(BaseModel):
    """Alt görev oluşturma yanıtı"""
    subtask_id: str = Field(..., description="Oluşturulan alt görev ID'si")


class TeamResponse(BaseModel):
    """Ekip bilgisi yanıtı"""
    id: str = Field(..., description="Ekip ID'si")
    name: str = Field(..., description="Ekip adı")
    type: str = Field(..., description="Ekip türü")
    description: Optional[str] = Field(None, description="Ekip açıklaması")
    agent_count: int = Field(..., description="Ekipteki ajan sayısı")
    agents: Optional[List[Dict[str, Any]]] = Field(None, description="Ajan listesi")


class TaskResponse(BaseModel):
    """Görev özet bilgisi yanıtı"""
    id: str = Field(..., description="Görev ID'si")
    title: str = Field(..., description="Görev başlığı")
    status: str = Field(..., description="Görev durumu")
    team_id: str = Field(..., description="Ekip ID'si")
    iterations: int = Field(..., description="Yineleme sayısı")


class TaskDetailResponse(BaseModel):
    """Görev detaylı bilgi yanıtı"""
    id: str = Field(..., description="Görev ID'si")
    title: str = Field(..., description="Görev başlığı")
    description: str = Field(..., description="Görev açıklaması")
    status: str = Field(..., description="Görev durumu")
    team_id: str = Field(..., description="Ekip ID'si")
    team_name: str = Field(..., description="Ekip adı")
    iterations: int = Field(..., description="Yineleme sayısı")
    feedback: Optional[str] = Field(None, description="Geribildirim")
    result: Optional[str] = Field(None, description="Görev sonucu")
    subtasks: List[SubtaskInfo] = Field(default_factory=list, description="Alt görevler")


class ModelCapabilityResponse(BaseModel):
    """Model yetenek bilgisi yanıtı"""
    model: str = Field(..., description="Model adı")
    capabilities: Dict[str, float] = Field(..., description="Model yetenekleri") 
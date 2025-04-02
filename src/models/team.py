from enum import Enum
from typing import Dict, List, Optional, Set
from datetime import datetime
import uuid

from pydantic import BaseModel, Field

from src.models.base import ModelCapability
from .agent import Agent


class AgentRole(str, Enum):
    """Ajan rolleri"""
    DEVELOPER = "developer"  # Yazılım geliştirici
    TESTER = "tester"  # Test uzmanı
    DESIGNER = "designer"  # Tasarımcı
    PRODUCT_MANAGER = "product_manager"  # Ürün yöneticisi
    MARKETING_SPECIALIST = "marketing_specialist"  # Pazarlama uzmanı
    DATA_SCIENTIST = "data_scientist"  # Veri bilimci
    SECURITY_SPECIALIST = "security_specialist"  # Güvenlik uzmanı
    TECHNICAL_WRITER = "technical_writer"  # Teknik yazar
    ARCHITECT = "architect"  # Yazılım mimarı
    DEVOPS_ENGINEER = "devops_engineer"  # DevOps mühendisi


class TeamType(str, Enum):
    """Ekip türleri"""
    SOFTWARE_DEVELOPMENT = "software_development"  # Yazılım geliştirme
    DATA_SCIENCE = "data_science"  # Veri bilimi
    MARKETING = "marketing"  # Pazarlama
    DESIGN = "design"  # Tasarım
    RESEARCH = "research"  # Araştırma
    CONTENT_CREATION = "content_creation"  # İçerik oluşturma
    TESTING = "testing"  # Test
    SECURITY = "security"  # Güvenlik
    CUSTOM = "custom"  # Özel


class AgentConfig(BaseModel):
    """Ajan yapılandırması"""
    id: str = Field(..., description="Ajan benzersiz kimliği")
    name: str = Field(..., description="Ajan adı")
    role: AgentRole = Field(..., description="Ajan rolü")
    model_name: str = Field(..., description="Kullanılan LLM modeli")
    system_prompt: str = Field(..., description="Sistem komutu")
    required_capabilities: Set[ModelCapability] = Field(
        default_factory=set, description="Gerekli model yetenekleri"
    )


class TeamConfig(BaseModel):
    """Ekip yapılandırması"""
    id: str = Field(..., description="Ekip benzersiz kimliği")
    name: str = Field(..., description="Ekip adı")
    type: TeamType = Field(..., description="Ekip türü")
    description: Optional[str] = Field(None, description="Ekip açıklaması")
    agents: List[AgentConfig] = Field(
        default_factory=list, description="Ekip üyesi ajanlar"
    )

    def get_agent_by_id(self, agent_id: str) -> Optional[AgentConfig]:
        """ID'ye göre ajanı bulur"""
        for agent in self.agents:
            if agent.id == agent_id:
                return agent
        return None

    def get_agents_by_role(self, role: AgentRole) -> List[AgentConfig]:
        """Role göre ajanları filtreler"""
        return [agent for agent in self.agents if agent.role == role]


class TaskStatus(str, Enum):
    """Görev durumları"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Görev öncelikleri"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(BaseModel):
    """Görevi temsil eden model"""
    id: str = Field(..., description="Görev benzersiz kimliği")
    title: str = Field(..., description="Görev başlığı")
    description: str = Field(..., description="Görev açıklaması")
    team_id: str = Field(..., description="Atanan ekip ID'si")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Görev önceliği")
    agent_assignments: Optional[Dict[str, List[str]]] = Field(
        None, description="Alt görev - ajan ID eşleştirmeleri"
    )
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Görev durumu")
    result: Optional[str] = Field(None, description="Görev sonucu")
    iterations: int = Field(default=0, description="Görev yineleme sayısı")
    feedback: Optional[str] = Field(None, description="Görev geribildirimi")


class SubTask(BaseModel):
    """Alt görevi temsil eden model"""
    id: str = Field(..., description="Alt görev benzersiz kimliği")
    parent_task_id: str = Field(..., description="Üst görev ID'si")
    title: str = Field(..., description="Alt görev başlığı")
    description: str = Field(..., description="Alt görev açıklaması")
    assigned_agent_id: Optional[str] = Field(None, description="Atanan ajan ID'si")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Alt görev durumu")
    result: Optional[str] = Field(None, description="Alt görev sonucu")
    dependencies: List[str] = Field(
        default_factory=list, description="Bağımlı olduğu alt görev ID'leri"
    )


class Team:
    def __init__(self, name: str, description: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.agents: List[Agent] = []
        self.task_ids: List[str] = []
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()

    def add_agent(self, agent: Agent):
        """Takıma ajan ekle"""
        self.agents.append(agent)
        self.updated_at = datetime.now().isoformat()

    def remove_agent(self, agent_id: str):
        """Takımdan ajan çıkar"""
        self.agents = [agent for agent in self.agents if agent.id != agent_id]
        self.updated_at = datetime.now().isoformat()

    def add_task(self, task_id: str):
        """Takıma görev ekle"""
        if task_id not in self.task_ids:
            self.task_ids.append(task_id)
            self.updated_at = datetime.now().isoformat()

    def remove_task(self, task_id: str):
        """Takımdan görev çıkar"""
        if task_id in self.task_ids:
            self.task_ids.remove(task_id)
            self.updated_at = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        """Nesneyi sözlüğe dönüştür"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "agents": [agent.to_dict() for agent in self.agents],
            "task_ids": self.task_ids,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'Team':
        """Sözlükten nesne oluştur"""
        # Temel takım nesnesini oluştur
        team = cls(
            name=data["name"],
            description=data["description"]
        )
        # ID ve diğer temel alanları ayarla
        team.id = data["id"]
        team.task_ids = data.get("task_ids", [])
        team.created_at = data.get("created_at", datetime.now().isoformat())
        team.updated_at = data.get("updated_at", datetime.now().isoformat())
        
        # Ajanları ekle (eğer varsa)
        if "agents" in data and data["agents"]:
            try:
                team.agents = [Agent.from_dict(agent_data) for agent_data in data["agents"]]
            except Exception as e:
                print(f"Ajanlar yüklenirken hata: {e}")
                team.agents = []
        
        return team 
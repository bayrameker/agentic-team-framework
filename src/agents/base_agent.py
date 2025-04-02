from typing import Dict, List, Any, Optional
from abc import ABC, abstractmethod
import json
import time
import uuid

class BaseAgent(ABC):
    """Tüm ajanlar için temel sınıf. Ajan davranışlarını ve özelliklerini tanımlar."""
    
    def __init__(self, agent_id: Optional[str] = None, name: str = "Anonim Ajan", 
                 description: str = "", model: str = "llama3", 
                 capabilities: List[str] = None, team_id: Optional[str] = None):
        """
        Ajan temel özelliklerini başlatır.
        
        Args:
            agent_id: Ajan benzersiz kimliği. Eğer None ise otomatik UUID oluşturulur.
            name: Ajan adı
            description: Ajan açıklaması
            model: Kullanılacak LLM modeli
            capabilities: Ajanın yeteneklerinin listesi
            team_id: Ajanın ait olduğu takım ID'si
        """
        self.agent_id = agent_id if agent_id else str(uuid.uuid4())
        self.name = name
        self.description = description
        self.model = model
        self.capabilities = capabilities or []
        self.team_id = team_id
        self.created_at = time.time()
        self.metadata = {}
        self.state = "idle"  # idle, working, completed, error
        
    def to_dict(self) -> Dict[str, Any]:
        """Ajan bilgilerini sözlük formatında döndürür."""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "model": self.model,
            "capabilities": self.capabilities,
            "team_id": self.team_id,
            "created_at": self.created_at,
            "state": self.state,
            "metadata": self.metadata
        }
    
    def to_json(self) -> str:
        """Ajan bilgilerini JSON formatında döndürür."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseAgent':
        """Sözlük formatından ajan oluşturur."""
        agent = cls(
            agent_id=data.get("agent_id"),
            name=data.get("name", "Anonim Ajan"),
            description=data.get("description", ""),
            model=data.get("model", "llama3"),
            capabilities=data.get("capabilities", []),
            team_id=data.get("team_id")
        )
        agent.created_at = data.get("created_at", time.time())
        agent.state = data.get("state", "idle")
        agent.metadata = data.get("metadata", {})
        return agent
    
    @classmethod
    def from_json(cls, json_str: str) -> 'BaseAgent':
        """JSON formatından ajan oluşturur."""
        return cls.from_dict(json.loads(json_str))
    
    def update_state(self, new_state: str) -> None:
        """Ajanın durumunu günceller."""
        valid_states = ["idle", "working", "completed", "error"]
        if new_state not in valid_states:
            raise ValueError(f"Geçersiz durum: {new_state}. Geçerli durumlar: {valid_states}")
        
        self.state = new_state
        print(f"Ajan {self.name} durumu güncellendi: {new_state}")
    
    def add_capability(self, capability: str) -> None:
        """Ajana yeni bir yetenek ekler."""
        if capability not in self.capabilities:
            self.capabilities.append(capability)
    
    def remove_capability(self, capability: str) -> None:
        """Ajandan bir yeteneği kaldırır."""
        if capability in self.capabilities:
            self.capabilities.remove(capability)
    
    def add_metadata(self, key: str, value: Any) -> None:
        """Ajana metadata ekler."""
        self.metadata[key] = value
    
    @abstractmethod
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Görevi işler. Alt sınıflar tarafından uygulanmalıdır.
        
        Args:
            task: İşlenecek görev bilgileri
            
        Returns:
            Görev sonuçları
        """
        pass
    
    @abstractmethod
    async def collaborate(self, target_agent_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Diğer ajanlarla işbirliği yapar. Alt sınıflar tarafından uygulanmalıdır.
        
        Args:
            target_agent_id: İşbirliği yapılacak ajan ID'si
            message: İletilecek mesaj
            
        Returns:
            İşbirliği sonuçları
        """
        pass 
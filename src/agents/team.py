from typing import Dict, List, Any, Optional
import time
import uuid
import json
import asyncio

from src.agents.base_agent import BaseAgent

class Team:
    """Birden fazla ajanı içeren bir takımı temsil eder."""
    
    def __init__(self, team_id: Optional[str] = None, name: str = "Yeni Takım",
                 description: str = "", team_type: str = "GENERAL"):
        """
        Takım nesnesini başlatır.
        
        Args:
            team_id: Takım benzersiz kimliği. Eğer None ise otomatik UUID oluşturulur.
            name: Takım adı
            description: Takım açıklaması
            team_type: Takım tipi (GENERAL, SOFTWARE_DEVELOPMENT, TESTING, MARKETING, vb.)
        """
        self.team_id = team_id if team_id else str(uuid.uuid4())
        self.name = name
        self.description = description
        self.team_type = team_type
        self.created_at = time.time()
        self.agents: List[BaseAgent] = []
        self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Takım bilgilerini sözlük formatında döndürür."""
        return {
            "team_id": self.team_id,
            "name": self.name,
            "description": self.description,
            "team_type": self.team_type,
            "created_at": self.created_at,
            "agent_count": len(self.agents),
            "agent_ids": [agent.agent_id for agent in self.agents],
            "metadata": self.metadata
        }
    
    def to_json(self) -> str:
        """Takım bilgilerini JSON formatında döndürür."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Team':
        """Sözlük formatından takım oluşturur."""
        team = cls(
            team_id=data.get("team_id"),
            name=data.get("name", "Yeni Takım"),
            description=data.get("description", ""),
            team_type=data.get("team_type", "GENERAL")
        )
        team.created_at = data.get("created_at", time.time())
        team.metadata = data.get("metadata", {})
        return team
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Team':
        """JSON formatından takım oluşturur."""
        return cls.from_dict(json.loads(json_str))
    
    def add_agent(self, agent: BaseAgent) -> None:
        """
        Takıma bir ajan ekler.
        
        Args:
            agent: Eklenecek ajan
        """
        # Ajanın team_id'sini güncelle
        agent.team_id = self.team_id
        
        # Ajana takım ID'si eklendiğine dair bir log mesajı
        print(f"Ajan {agent.name} ({agent.agent_id}) takıma eklendi: {self.name} ({self.team_id})")
        
        # Ajanı takıma ekle
        self.agents.append(agent)
    
    def remove_agent(self, agent_id: str) -> bool:
        """
        Takımdan bir ajanı kaldırır.
        
        Args:
            agent_id: Kaldırılacak ajanın ID'si
            
        Returns:
            İşlemin başarılı olup olmadığı
        """
        for i, agent in enumerate(self.agents):
            if agent.agent_id == agent_id:
                # Ajanın team_id'sini temizle
                self.agents[i].team_id = None
                
                # Ajanı takımdan çıkar
                removed_agent = self.agents.pop(i)
                print(f"Ajan {removed_agent.name} ({agent_id}) takımdan çıkarıldı: {self.name}")
                return True
        
        print(f"Ajan {agent_id} takımda bulunamadı: {self.name}")
        return False
    
    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """
        Takımdaki belirli bir ajanı döndürür.
        
        Args:
            agent_id: Aranacak ajanın ID'si
            
        Returns:
            Bulunan ajan veya None
        """
        for agent in self.agents:
            if agent.agent_id == agent_id:
                return agent
        return None
    
    def get_agents_by_capability(self, capability: str) -> List[BaseAgent]:
        """
        Belirli bir yeteneğe sahip tüm ajanları döndürür.
        
        Args:
            capability: Aranacak yetenek
            
        Returns:
            Yeteneğe sahip ajanların listesi
        """
        return [agent for agent in self.agents if capability in agent.capabilities]
    
    async def distribute_task(self, task: Dict[str, Any], agent_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Görevi belirli ajanlara dağıtır ve sonuçları toplar.
        
        Args:
            task: Dağıtılacak görev
            agent_ids: Görevin dağıtılacağı ajanların ID'leri. None ise tüm ajanlara dağıtılır.
            
        Returns:
            Ajanlardan toplanan sonuçlar
        """
        if agent_ids is None:
            # Tüm ajanlara dağıt
            target_agents = self.agents
        else:
            # Belirli ajanlara dağıt
            target_agents = [agent for agent in self.agents if agent.agent_id in agent_ids]
        
        if not target_agents:
            return {
                "status": "error",
                "message": "Hedef ajan bulunamadı",
                "task_id": task.get("task_id", "unknown")
            }
        
        # Görevin her ajan tarafından işlenmesi için asenkron görevler oluştur
        tasks = [agent.process_task(task) for agent in target_agents]
        
        # Tüm görevleri paralel olarak çalıştır ve sonuçları bekle
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Sonuçları agent_id'ye göre düzenle
        processed_results = {}
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                # Hata durumunda
                processed_results[target_agents[i].agent_id] = {
                    "status": "error",
                    "error": str(result),
                    "agent_name": target_agents[i].name
                }
            else:
                # Başarılı sonuç
                processed_results[target_agents[i].agent_id] = result
        
        return {
            "task_id": task.get("task_id", "unknown"),
            "team_id": self.team_id,
            "status": "completed",
            "agent_count": len(target_agents),
            "results": processed_results
        }
    
    async def facilitate_collaboration(self, source_agent_id: str, target_agent_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        İki ajan arasında işbirliğini kolaylaştırır.
        
        Args:
            source_agent_id: Kaynak ajan ID'si
            target_agent_id: Hedef ajan ID'si
            message: İletilecek mesaj
            
        Returns:
            İşbirliği sonuçları
        """
        # Kaynağı ve hedefi bul
        source_agent = self.get_agent(source_agent_id)
        target_agent = self.get_agent(target_agent_id)
        
        if not source_agent:
            return {
                "status": "error",
                "message": f"Kaynak ajan bulunamadı: {source_agent_id}"
            }
        
        if not target_agent:
            return {
                "status": "error",
                "message": f"Hedef ajan bulunamadı: {target_agent_id}"
            }
        
        # İşbirliğini başlat
        try:
            result = await source_agent.collaborate(target_agent_id, message)
            return {
                "status": "success",
                "source_agent": source_agent.name,
                "target_agent": target_agent.name,
                "result": result
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"İşbirliği sırasında hata: {str(e)}",
                "source_agent": source_agent.name,
                "target_agent": target_agent.name
            }
    
    def add_metadata(self, key: str, value: Any) -> None:
        """Takıma metadata ekler."""
        self.metadata[key] = value 
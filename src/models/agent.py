from datetime import datetime
from typing import Dict, Optional
import uuid

class Agent:
    def __init__(self, name: str, role: str, model: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.role = role  # developer, tester, product_manager, project_manager
        self.model = model
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        """Nesneyi sözlüğe dönüştür"""
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "model": self.model,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'Agent':
        """Sözlükten nesne oluştur"""
        agent = cls(
            name=data["name"],
            role=data["role"],
            model=data["model"]
        )
        agent.id = data["id"]
        agent.created_at = data["created_at"]
        agent.updated_at = data["updated_at"]
        return agent 
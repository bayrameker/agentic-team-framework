from datetime import datetime
from typing import List, Dict, Optional, Any
import uuid

class Task:
    """Takım tarafından gerçekleştirilecek görev"""
    
    def __init__(self, title: str, description: str, team_id: str):
        """
        Yeni bir görev oluşturur
        
        Args:
            title (str): Görev başlığı
            description (str): Görev açıklaması
            team_id (str): Görevi alan takımın ID'si
        """
        self.id = str(uuid.uuid4())
        self.title = title
        self.description = description
        self.team_id = team_id
        self.status = "new"  # new, in_progress, completed, failed
        self.subtasks: List[Dict] = []
        self.result: Optional[str] = None
        self.subtask_results: Dict[str, str] = {}
        self.team_evaluation: Optional[Dict] = None
        self.iterations: List[Dict] = []
        self.documents: List[Dict] = []
        self.document_evaluations: Dict[str, List[Dict]] = {}
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
        self.logs = []  # İşlem logları
        self.progress = 0  # İlerleme yüzdesi
        self.status_message = None  # Durum açıklaması
        self.is_active = False  # Aktif olup olmadığı

    def add_subtask(self, subtask_id: str, title: str, description: str, assigned_agent_id: Optional[str] = None):
        """Alt görev ekle"""
        subtask = {
            "id": subtask_id,
            "title": title,
            "description": description,
            "assigned_agent_id": assigned_agent_id,
            "status": "new",
            "created_at": datetime.now().isoformat()
        }
        self.subtasks.append(subtask)
        self.updated_at = datetime.now().isoformat()

    def update_subtask_status(self, subtask_id: str, status: str):
        """Alt görev durumunu güncelle"""
        for subtask in self.subtasks:
            if subtask["id"] == subtask_id:
                subtask["status"] = status
                subtask["updated_at"] = datetime.now().isoformat()
                self.updated_at = datetime.now().isoformat()
                break

    def add_document(self, title: str, content: str, doc_type: str = "code") -> str:
        """Doküman ekle"""
        document_id = str(uuid.uuid4())
        document = {
            "id": document_id,
            "title": title,
            "content": content,
            "type": doc_type,
            "created_at": datetime.now().isoformat()
        }
        self.documents.append(document)
        self.updated_at = datetime.now().isoformat()
        return document_id

    def to_dict(self) -> Dict:
        """Nesneyi sözlüğe dönüştür"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "team_id": self.team_id,
            "status": self.status,
            "subtasks": self.subtasks,
            "result": self.result,
            "subtask_results": self.subtask_results,
            "team_evaluation": self.team_evaluation,
            "iterations": self.iterations,
            "documents": self.documents,
            "document_evaluations": self.document_evaluations,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "logs": self.logs,
            "progress": self.progress,
            "status_message": self.status_message,
            "is_active": self.is_active
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'Task':
        """Sözlükten nesne oluştur"""
        task = cls(
            title=data["title"],
            description=data["description"],
            team_id=data["team_id"]
        )
        task.id = data["id"]
        task.status = data["status"]
        task.subtasks = data["subtasks"]
        task.result = data["result"]
        task.subtask_results = data["subtask_results"]
        task.team_evaluation = data["team_evaluation"]
        task.iterations = data["iterations"]
        task.documents = data["documents"]
        task.document_evaluations = data["document_evaluations"]
        task.created_at = data["created_at"]
        task.updated_at = data["updated_at"]
        task.logs = data["logs"]
        task.progress = data["progress"]
        task.status_message = data["status_message"]
        task.is_active = data["is_active"]
        return task 
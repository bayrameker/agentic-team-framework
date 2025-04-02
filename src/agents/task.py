from typing import Dict, List, Any, Optional
import time
import uuid
import json
from enum import Enum

class TaskStatus(str, Enum):
    """Görev durumunu temsil eden enum."""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class TaskPriority(str, Enum):
    """Görev önceliğini temsil eden enum."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Task:
    """Ajanlar tarafından gerçekleştirilecek bir görevi temsil eder."""
    
    def __init__(self, task_id: Optional[str] = None, title: str = "Yeni Görev",
                 description: str = "", status: TaskStatus = TaskStatus.PENDING,
                 priority: TaskPriority = TaskPriority.MEDIUM,
                 team_id: Optional[str] = None, assigned_agent_ids: Optional[List[str]] = None,
                 parent_task_id: Optional[str] = None):
        """
        Görev nesnesini başlatır.
        
        Args:
            task_id: Görev benzersiz kimliği. Eğer None ise otomatik UUID oluşturulur.
            title: Görev başlığı
            description: Görev açıklaması
            status: Görev durumu
            priority: Görev önceliği
            team_id: Görevin atandığı takım ID'si
            assigned_agent_ids: Göreve atanan ajanların ID'leri
            parent_task_id: Varsa, üst görevin ID'si
        """
        self.task_id = task_id if task_id else str(uuid.uuid4())
        self.title = title
        self.description = description
        self.status = status
        self.priority = priority
        self.team_id = team_id
        self.assigned_agent_ids = assigned_agent_ids or []
        self.parent_task_id = parent_task_id
        
        self.created_at = time.time()
        self.updated_at = self.created_at
        self.started_at: Optional[float] = None
        self.completed_at: Optional[float] = None
        
        self.subtasks: List[str] = []  # Alt görev ID'lerini tutar
        self.iterations = 0  # Görev kaç kez yeniden çalıştırıldı
        self.max_iterations = 3  # Maksimum yeniden deneme sayısı
        
        self.results: Dict[str, Any] = {}  # Her bir ajanın sonuçlarını tutar
        self.feedback: List[Dict[str, Any]] = []  # Göreve verilen geri bildirimleri tutar
        self.metadata: Dict[str, Any] = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Görev bilgilerini sözlük formatında döndürür."""
        return {
            "task_id": self.task_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "team_id": self.team_id,
            "assigned_agent_ids": self.assigned_agent_ids,
            "parent_task_id": self.parent_task_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "subtasks": self.subtasks,
            "iterations": self.iterations,
            "max_iterations": self.max_iterations,
            "results": self.results,
            "feedback": self.feedback,
            "metadata": self.metadata
        }
    
    def to_json(self) -> str:
        """Görev bilgilerini JSON formatında döndürür."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Sözlük formatından görev oluşturur."""
        task = cls(
            task_id=data.get("task_id"),
            title=data.get("title", "Yeni Görev"),
            description=data.get("description", ""),
            status=data.get("status", TaskStatus.PENDING),
            priority=data.get("priority", TaskPriority.MEDIUM),
            team_id=data.get("team_id"),
            assigned_agent_ids=data.get("assigned_agent_ids", []),
            parent_task_id=data.get("parent_task_id")
        )
        
        # Diğer alanları ayarla
        task.created_at = data.get("created_at", time.time())
        task.updated_at = data.get("updated_at", task.created_at)
        task.started_at = data.get("started_at")
        task.completed_at = data.get("completed_at")
        task.subtasks = data.get("subtasks", [])
        task.iterations = data.get("iterations", 0)
        task.max_iterations = data.get("max_iterations", 3)
        task.results = data.get("results", {})
        task.feedback = data.get("feedback", [])
        task.metadata = data.get("metadata", {})
        
        return task
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Task':
        """JSON formatından görev oluşturur."""
        return cls.from_dict(json.loads(json_str))
    
    def update_status(self, new_status: TaskStatus) -> None:
        """
        Görev durumunu günceller ve zaman damgalarını ayarlar.
        
        Args:
            new_status: Yeni görev durumu
        """
        old_status = self.status
        self.status = new_status
        self.updated_at = time.time()
        
        # Durum değişikliğine göre zaman damgalarını güncelle
        if new_status == TaskStatus.IN_PROGRESS and old_status != TaskStatus.IN_PROGRESS:
            self.started_at = self.updated_at
        elif new_status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
            self.completed_at = self.updated_at
        
        print(f"Görev {self.task_id} durumu güncellendi: {old_status} -> {new_status}")
    
    def assign_agent(self, agent_id: str) -> None:
        """
        Göreve bir ajan atar.
        
        Args:
            agent_id: Atanacak ajanın ID'si
        """
        if agent_id not in self.assigned_agent_ids:
            self.assigned_agent_ids.append(agent_id)
            self.updated_at = time.time()
            print(f"Ajan {agent_id} göreve atandı: {self.task_id}")
    
    def unassign_agent(self, agent_id: str) -> bool:
        """
        Görevden bir ajanı kaldırır.
        
        Args:
            agent_id: Kaldırılacak ajanın ID'si
            
        Returns:
            İşlemin başarılı olup olmadığı
        """
        if agent_id in self.assigned_agent_ids:
            self.assigned_agent_ids.remove(agent_id)
            self.updated_at = time.time()
            print(f"Ajan {agent_id} görevden çıkarıldı: {self.task_id}")
            return True
        return False
    
    def add_subtask(self, subtask_id: str) -> None:
        """
        Göreve bir alt görev ekler.
        
        Args:
            subtask_id: Eklenecek alt görevin ID'si
        """
        if subtask_id not in self.subtasks:
            self.subtasks.append(subtask_id)
            self.updated_at = time.time()
    
    def remove_subtask(self, subtask_id: str) -> bool:
        """
        Görevden bir alt görevi kaldırır.
        
        Args:
            subtask_id: Kaldırılacak alt görevin ID'si
            
        Returns:
            İşlemin başarılı olup olmadığı
        """
        if subtask_id in self.subtasks:
            self.subtasks.remove(subtask_id)
            self.updated_at = time.time()
            return True
        return False
    
    def add_result(self, agent_id: str, result: Dict[str, Any]) -> None:
        """
        Görev sonucunu ekler.
        
        Args:
            agent_id: Sonucu üreten ajanın ID'si
            result: Sonuç verileri
        """
        self.results[agent_id] = result
        self.updated_at = time.time()
        
        # Tüm sonuçlar toplandıysa ve görev devam ediyorsa, tamamlandı olarak işaretle
        if (self.status == TaskStatus.IN_PROGRESS and 
            all(aid in self.results for aid in self.assigned_agent_ids)):
            self.update_status(TaskStatus.COMPLETED)
    
    def add_feedback(self, feedback: str, rating: Optional[int] = None, 
                    source: Optional[str] = None) -> None:
        """
        Göreve geri bildirim ekler.
        
        Args:
            feedback: Geri bildirim metni
            rating: Varsa, geri bildirim puanı (1-5)
            source: Geri bildirimin kaynağı (kullanıcı, ajan, sistem)
        """
        feedback_obj = {
            "feedback": feedback,
            "timestamp": time.time(),
            "source": source or "unknown"
        }
        
        if rating is not None:
            feedback_obj["rating"] = max(1, min(5, rating))  # 1-5 arasında sınırla
            
        self.feedback.append(feedback_obj)
        self.updated_at = time.time()
    
    def increment_iteration(self) -> bool:
        """
        Yineleme sayısını artırır. Maksimum yineleme sayısına ulaşıldığında False döndürür.
        
        Returns:
            İşlemin başarılı olup olmadığı
        """
        if self.iterations < self.max_iterations:
            self.iterations += 1
            self.updated_at = time.time()
            return True
        return False
    
    def add_metadata(self, key: str, value: Any) -> None:
        """
        Göreve metadata ekler.
        
        Args:
            key: Metadata anahtarı
            value: Metadata değeri
        """
        self.metadata[key] = value
        self.updated_at = time.time()
    
    def get_elapsed_time(self) -> Optional[float]:
        """
        Görevin çalışma süresini döndürür (saniye cinsinden).
        Eğer görev başlamadıysa None döndürür.
        
        Returns:
            Görev süresi (saniye) veya None
        """
        if self.started_at is None:
            return None
        
        if self.completed_at is not None:
            return self.completed_at - self.started_at
        
        return time.time() - self.started_at 
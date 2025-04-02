from enum import Enum
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field


class ModelCapability(str, Enum):
    """Model yetenekleri"""
    CODING = "coding"  # Kod yazma ve düzenleme
    REASONING = "reasoning"  # Mantıksal düşünme ve problem çözme
    CREATIVITY = "creativity"  # Yaratıcı içerik üretme
    MATHEMATICS = "mathematics"  # Matematiksel işlemler
    LINGUISTICS = "linguistics"  # Dil ve dilbilgisi
    RESEARCH = "research"  # Araştırma ve bilgi toplama
    PLANNING = "planning"  # Planlama ve strateji geliştirme
    TESTING = "testing"  # Test ve hata ayıklama
    MARKETING = "marketing"  # Pazarlama içeriği oluşturma
    SUMMARIZATION = "summarization"  # Özetleme


class ModelInfo(BaseModel):
    """LLM model bilgisi"""
    name: str = Field(..., description="Model adı")
    description: Optional[str] = Field(None, description="Model açıklaması")
    capabilities: List[ModelCapability] = Field(
        ..., description="Model yetenekleri listesi"
    )
    capability_scores: Dict[ModelCapability, float] = Field(
        ..., description="Her bir yetenek için 0-1 arası skor"
    )
    context_length: int = Field(..., description="Maksimum bağlam uzunluğu")
    parameters: Optional[Dict[str, Union[str, int, float, bool]]] = Field(
        None, description="Model parametreleri"
    )

    def get_capability_score(self, capability: ModelCapability) -> float:
        """Belirli bir yetenek için skoru döndürür"""
        return self.capability_scores.get(capability, 0.0)

    def has_capability(self, capability: ModelCapability) -> bool:
        """Modelin belirli bir yeteneğe sahip olup olmadığını kontrol eder"""
        return capability in self.capabilities


class Message(BaseModel):
    """Mesaj modeli"""
    role: str = Field(..., description="Mesaj rolü: system, user, assistant")
    content: str = Field(..., description="Mesaj içeriği")


class Conversation(BaseModel):
    """Sohbet geçmişi modeli"""
    messages: List[Message] = Field(default_factory=list, description="Mesaj listesi")

    def add_message(self, role: str, content: str) -> None:
        """Sohbete yeni mesaj ekler"""
        self.messages.append(Message(role=role, content=content))

    def get_history(self) -> List[Dict[str, str]]:
        """Sohbet geçmişini API için uygun formatta döndürür"""
        return [message.model_dump() for message in self.messages]

    def clear(self) -> None:
        """Sohbet geçmişini temizler"""
        self.messages = [] 
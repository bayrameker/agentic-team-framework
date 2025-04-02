from typing import Dict, List, Any, Optional
import asyncio
import json

from src.agents.base_agent import BaseAgent

class LLMAgent(BaseAgent):
    """LLM tabanlı bir ajanı temsil eder. BaseAgent'dan türetilmiştir."""
    
    def __init__(self, 
                 agent_id: Optional[str] = None,
                 name: str = "LLM Ajan",
                 description: str = "Büyük dil modelini kullanan bir ajan",
                 model: str = "llama3",
                 capabilities: List[str] = None,
                 team_id: Optional[str] = None,
                 system_prompt: str = "",
                 temperature: float = 0.7,
                 max_tokens: int = 1024):
        """
        LLM Ajanını başlatır.
        
        Args:
            agent_id: Ajan benzersiz kimliği
            name: Ajan adı
            description: Ajan açıklaması
            model: Kullanılacak LLM modeli
            capabilities: Ajanın yeteneklerinin listesi
            team_id: Ajanın ait olduğu takım ID'si
            system_prompt: Ajana verilecek sistem yönergesi
            temperature: LLM sıcaklık değeri
            max_tokens: Maksimum token sayısı
        """
        # Ana sınıf başlatıcısını çağır
        super().__init__(
            agent_id=agent_id,
            name=name,
            description=description,
            model=model,
            capabilities=capabilities or ["text_generation", "reasoning"],
            team_id=team_id
        )
        
        # LLM'e özgü özellikler
        self.system_prompt = system_prompt or f"Sen {name} adlı bir ajansın. {description}"
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.conversation_history = []
        
        # Metadata'ya LLM özelliklerini ekle
        self.metadata.update({
            "model_type": "llm",
            "temperature": temperature,
            "max_tokens": max_tokens
        })
    
    async def generate_response(self, prompt: str) -> str:
        """
        LLM'den yanıt üretir. 
        
        Not: Gerçek uygulamada burada model API'si çağrılmalıdır.
        Bu örnekte simüle edilmiştir.
        
        Args:
            prompt: LLM'e gönderilecek girdi metni
            
        Returns:
            LLM'den alınan yanıt
        """
        # Gerçek uygulamada, burada bir LLM API'si çağrılacak
        # Şimdilik bunu simüle edelim
        
        self.update_state("working")
        
        # Çalışıyor görüntüsü vermek için kısa bir bekleme ekleyelim
        await asyncio.sleep(1)
        
        # Basit bir simülasyon yanıtı
        response = f"Ajan '{self.name}' yanıtı: Prompt '{prompt[:30]}...' analiz edildi. " \
                 f"Model '{self.model}' kullanılarak yanıt oluşturuldu."
        
        # Konuşma geçmişini güncelle
        self.conversation_history.append({
            "role": "user",
            "content": prompt
        })
        self.conversation_history.append({
            "role": "assistant",
            "content": response
        })
        
        self.update_state("idle")
        return response
    
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Görevi işler ve sonuç döndürür.
        
        Args:
            task: İşlenecek görev bilgileri
                - task_id: Görev ID'si
                - description: Görev açıklaması
                - data: Görevle ilgili veriler
                
        Returns:
            Görev sonuçları
        """
        self.update_state("working")
        
        task_id = task.get("task_id", "unknown")
        description = task.get("description", "")
        data = task.get("data", {})
        
        # Task açıklamasını ve verileri birleştirerek bir prompt oluştur
        combined_prompt = f"Görev #{task_id}: {description}\n\nVeriler: {json.dumps(data, ensure_ascii=False)}"
        
        try:
            # LLM yanıtını al
            response = await self.generate_response(combined_prompt)
            
            # Sonuç oluştur
            result = {
                "task_id": task_id,
                "agent_id": self.agent_id,
                "status": "completed",
                "output": response,
                "metadata": {
                    "model_used": self.model,
                    "temperature": self.temperature
                }
            }
            
            self.update_state("completed")
            return result
            
        except Exception as e:
            # Hata durumunda
            self.update_state("error")
            return {
                "task_id": task_id,
                "agent_id": self.agent_id,
                "status": "error",
                "error": str(e),
                "metadata": {
                    "model_used": self.model
                }
            }
    
    async def collaborate(self, target_agent_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Diğer ajanlarla işbirliği yapar.
        
        Args:
            target_agent_id: İşbirliği yapılacak ajan ID'si
            message: İletilecek mesaj
                - content: Mesaj içeriği
                - context: İşbirliği bağlamı
                
        Returns:
            İşbirliği sonuçları
        """
        content = message.get("content", "")
        context = message.get("context", {})
        
        # İşbirliği için bir prompt oluştur
        collaboration_prompt = f"Ajan {target_agent_id} ile işbirliği yapıyorsun.\n\n" \
                             f"Mesaj: {content}\n\n" \
                             f"Bağlam: {json.dumps(context, ensure_ascii=False)}"
        
        # İşbirliği yanıtını üret
        response = await self.generate_response(collaboration_prompt)
        
        return {
            "target_agent_id": target_agent_id,
            "source_agent_id": self.agent_id,
            "status": "success",
            "response": response,
            "metadata": {
                "model_used": self.model,
                "collaboration_type": "text_exchange"
            }
        }
    
    def update_system_prompt(self, new_prompt: str) -> None:
        """
        Ajanın sistem yönergesini günceller.
        
        Args:
            new_prompt: Yeni sistem yönergesi
        """
        self.system_prompt = new_prompt
        print(f"Ajan {self.name} sistem yönergesi güncellendi")
    
    def clear_conversation_history(self) -> None:
        """Konuşma geçmişini temizler."""
        self.conversation_history = []
        print(f"Ajan {self.name} konuşma geçmişi temizlendi")
        
    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Konuşma geçmişini döndürür."""
        return self.conversation_history 
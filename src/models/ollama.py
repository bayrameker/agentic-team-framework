import json
import os
import asyncio
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

from src.models.base import Conversation, Message, ModelCapability, ModelInfo

# Varsayılan modeller
DEFAULT_MODELS = [
    "llama3.2:latest", 
    "phi4:latest", 
    "gemma3:12b", 
    "gemma3:4b", 
    "gemma3:1b", 
    "llama3.1:latest"
]

class OllamaConfig(BaseModel):
    """Ollama API yapılandırması"""
    base_url: str
    timeout: int = 300


class OllamaAdapter:
    """Ollama API bağdaştırıcısı"""

    def __init__(self, base_url: str = None, timeout: int = 300, config: Optional[OllamaConfig] = None):
        if config:
            self.config = config
        else:
            base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            self.config = OllamaConfig(
                base_url=base_url,
                timeout=timeout
            )

        self.client = httpx.Client(base_url=self.config.base_url, timeout=self.config.timeout)
        print(f"Ollama API başlatıldı: {self.config.base_url}")

    def _handle_response(self, response: httpx.Response) -> Dict[str, Any]:
        """HTTP yanıtını işler"""
        response.raise_for_status()
        return response.json()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    async def list_models(self) -> List[str]:
        """Mevcut modelleri listeler"""
        loop = asyncio.get_event_loop()
        try:
            # Senkron API çağrısını asenkron olarak çalıştır
            response = await loop.run_in_executor(
                None, lambda: self.client.get("/api/tags")
            )
            data = self._handle_response(response)
            models = [model["name"] for model in data.get("models", [])]
            
            if not models:
                print("Ollama API'den model bulunamadı, varsayılan modeller kullanılacak")
                return DEFAULT_MODELS
                
            print(f"Bulunan modeller: {models}")
            return models
        except Exception as e:
            print(f"Modeller listelenirken hata: {e}")
            print(f"Varsayılan modeller kullanılıyor: {DEFAULT_MODELS}")
            return DEFAULT_MODELS

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    async def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Model hakkında bilgi döndürür"""
        loop = asyncio.get_event_loop()
        try:
            response = await loop.run_in_executor(
                None, lambda: self.client.get(f"/api/show?name={model_name}")
            )
            return self._handle_response(response)
        except Exception as e:
            print(f"Model bilgisi alınırken hata: {e}")
            return {}

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    async def generate(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        conversation: Optional[Conversation] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """Metni tamamlar"""
        try:
            loop = asyncio.get_event_loop()
            
            # Parametreleri doğrula
            if not model or not isinstance(model, str):
                raise TypeError(f"Geçersiz model parametresi: {type(model)}")
            
            if not prompt or not isinstance(prompt, str):
                raise TypeError(f"Geçersiz prompt parametresi: {type(prompt)}")
            
            if system_prompt is not None and not isinstance(system_prompt, str):
                raise TypeError(f"Geçersiz system_prompt parametresi: {type(system_prompt)}")
            
            # Sohbet geçmişi kullanılıyorsa chat API'ını kullan
            if conversation and conversation.messages:
                # İstek içeriği için debug bilgisi yazdır
                print(f"[DEBUG] Chat API kullanılıyor. Mesaj sayısı: {len(conversation.messages)}")
                for i, msg in enumerate(conversation.messages):
                    print(f"[DEBUG] Mesaj {i+1}: {msg.role} - {msg.content[:20]}...")
                
                # Ollama beklediği formatta mesajları oluştur
                messages = []
                for msg in conversation.messages:
                    messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
                
                payload = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": False  # Stream'i her zaman false olarak ayarla
                }
                
                if max_tokens:
                    payload["max_tokens"] = max_tokens
                    
                # İstek içeriğini logla
                print(f"[DEBUG] Chat API isteği: {model} modeline gönderiliyor")
                endpoint = "/api/chat"
            else:
                # Doğrudan metin oluşturma API'ını kullan
                print(f"[DEBUG] Generate API kullanılıyor. Prompt uzunluğu: {len(prompt)}")
                
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "stream": False  # Stream'i her zaman false olarak ayarla
                }
                
                if system_prompt:
                    payload["system"] = system_prompt
                    
                if max_tokens:
                    payload["max_tokens"] = max_tokens
                    
                # İstek içeriğini logla
                print(f"[DEBUG] Generate API isteği: {model} modeline gönderiliyor")
                endpoint = "/api/generate"

            try:
                # Senkron API çağrısını asenkron olarak çalıştır
                # API isteklerini ayrıntılı logla
                print(f"[DEBUG] API endpoint: {endpoint}")
                print(f"[DEBUG] Payload: {payload}")
                
                response = await loop.run_in_executor(
                    None, lambda: self.client.post(endpoint, json=payload)
                )
                # Yanıtı logla
                print(f"[DEBUG] API yanıt statüsü: {response.status_code}")
                
                data = self._handle_response(response)
                
                # Yanıt içeriğini logla
                print(f"[DEBUG] API yanıt içeriği: {data}")
                
                # Chat API'ı kullanıldıysa ilgili alanı al
                if endpoint == "/api/chat":
                    result = data.get("message", {}).get("content", "")
                else:
                    result = data.get("response", "")
                
                # Sonuç uzunluğunu logla
                print(f"[DEBUG] API yanıtı: {len(result)} karakter uzunluğunda")
                if result:
                    print(f"[DEBUG] İlk 100 karakter: {result[:100]}...")
                
                return result
            except TypeError as te:
                print(f"[ERROR] TypeError: API çağrısında bir tip hatası oluştu: {str(te)}")
                # Daha tanımlayıcı hata mesajı döndür
                return f"Üzgünüm, bir tip hatası oluştu: {str(te)}. Lütfen girdi parametrelerini kontrol edin."
            except Exception as e:
                print(f"[ERROR] API çağrısı sırasında bir hata oluştu: {str(e)}")
                error_msg = f"Üzgünüm, API çağrısı sırasında bir hata oluştu: {str(e)}. Lütfen tekrar deneyin."
                return error_msg
        except TypeError as te:
            print(f"[CRITICAL] Temel parametre kontrolü sırasında TypeError: {str(te)}")
            return f"Kritik bir tip hatası oluştu: {str(te)}. Gerekli parametrelerin doğru tipte olduğundan emin olun."
        except Exception as e:
            print(f"Metin oluşturulurken beklenmeyen hata: {str(e)}")
            error_msg = f"Beklenmeyen bir hata oluştu: {str(e)}. Lütfen tekrar deneyin."
            return error_msg

    def close(self) -> None:
        """HTTP istemcisini kapatır"""
        self.client.close()

    def __enter__(self):
        """Context yöneticisi girişi"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context yöneticisi çıkışı"""
        self.close()


# Modeller için yetenek haritası (manuel tanımlanmış)
MODEL_CAPABILITY_MAP = {
    "llama3.2:latest": {
        ModelCapability.CODING: 0.85,
        ModelCapability.REASONING: 0.9,
        ModelCapability.CREATIVITY: 0.8,
        ModelCapability.MATHEMATICS: 0.7,
        ModelCapability.LINGUISTICS: 0.9,
        ModelCapability.RESEARCH: 0.85,
        ModelCapability.PLANNING: 0.85,
        ModelCapability.TESTING: 0.8,
        ModelCapability.MARKETING: 0.75,
        ModelCapability.SUMMARIZATION: 0.9
    },
    "phi4:latest": {
        ModelCapability.CODING: 0.8,
        ModelCapability.REASONING: 0.85,
        ModelCapability.CREATIVITY: 0.75,
        ModelCapability.MATHEMATICS: 0.8,
        ModelCapability.LINGUISTICS: 0.85,
        ModelCapability.RESEARCH: 0.8,
        ModelCapability.PLANNING: 0.8,
        ModelCapability.TESTING: 0.75,
        ModelCapability.MARKETING: 0.7,
        ModelCapability.SUMMARIZATION: 0.85
    },
    "gemma3:12b": {
        ModelCapability.CODING: 0.9,
        ModelCapability.REASONING: 0.9,
        ModelCapability.CREATIVITY: 0.8,
        ModelCapability.MATHEMATICS: 0.85,
        ModelCapability.LINGUISTICS: 0.9,
        ModelCapability.RESEARCH: 0.9,
        ModelCapability.PLANNING: 0.9,
        ModelCapability.TESTING: 0.85,
        ModelCapability.MARKETING: 0.8,
        ModelCapability.SUMMARIZATION: 0.95
    },
    "gemma3:4b": {
        ModelCapability.CODING: 0.7,
        ModelCapability.REASONING: 0.8,
        ModelCapability.CREATIVITY: 0.75,
        ModelCapability.MATHEMATICS: 0.7,
        ModelCapability.LINGUISTICS: 0.8,
        ModelCapability.RESEARCH: 0.75,
        ModelCapability.PLANNING: 0.75,
        ModelCapability.TESTING: 0.7,
        ModelCapability.MARKETING: 0.7,
        ModelCapability.SUMMARIZATION: 0.8
    },
    "gemma3:1b": {
        ModelCapability.CODING: 0.75,
        ModelCapability.REASONING: 0.8,
        ModelCapability.CREATIVITY: 0.7,
        ModelCapability.MATHEMATICS: 0.75,
        ModelCapability.LINGUISTICS: 0.8,
        ModelCapability.RESEARCH: 0.75,
        ModelCapability.PLANNING: 0.75,
        ModelCapability.TESTING: 0.7,
        ModelCapability.MARKETING: 0.65,
        ModelCapability.SUMMARIZATION: 0.8
    },
    "llama3.1:latest": {
        ModelCapability.CODING: 0.8,
        ModelCapability.REASONING: 0.85,
        ModelCapability.CREATIVITY: 0.8,
        ModelCapability.MATHEMATICS: 0.75,
        ModelCapability.LINGUISTICS: 0.85,
        ModelCapability.RESEARCH: 0.8,
        ModelCapability.PLANNING: 0.8,
        ModelCapability.TESTING: 0.75,
        ModelCapability.MARKETING: 0.75,
        ModelCapability.SUMMARIZATION: 0.85
    }
}


def get_model_info_from_map(model_name: str) -> ModelInfo:
    """Model yetenek haritasından model bilgisini oluşturur"""
    # Model adından temel adı çıkar (örneğin llama3:latest -> llama3)
    base_name = model_name.split(":")[0].lower()
    
    for name in MODEL_CAPABILITY_MAP.keys():
        if name in base_name:  # llama3 -> llama3:8b, llama3.1, llama3:instruct
            capability_scores = MODEL_CAPABILITY_MAP[name]
            capabilities = list(capability_scores.keys())
    
            return ModelInfo(
                name=model_name,
                description=f"{model_name} modeli",
                capabilities=capabilities,
                capability_scores=capability_scores,
                context_length=8192  # Varsayılan bağlam uzunluğu
            )
    
    # Haritada yoksa varsayılan yetenekler ata
    return ModelInfo(
        name=model_name,
        description=f"{model_name} modeli",
        capabilities=list(ModelCapability),
        capability_scores={cap: 0.5 for cap in ModelCapability},
        context_length=4096
    ) 
import asyncio
import os
import httpx

async def test_ollama_chat_api():
    """Ollama Chat API'ını test eder"""
    print("Ollama Chat API Testi")
    print("=" * 50)
    
    # Yapılandırma
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    timeout = 300
    
    print(f"Ollama API URL: {base_url}")
    
    try:
        # HTTP istemcisi oluştur
        async with httpx.AsyncClient(base_url=base_url, timeout=timeout) as client:
            # Mevcut modelleri listele
            print("\n1. Mevcut modelleri listeleme:")
            models_response = await client.get("/api/tags")
            models_response.raise_for_status()
            models_data = models_response.json()
            
            models = [model["name"] for model in models_data.get("models", [])]
            print(f"  Bulunan modeller: {', '.join(models)}")
            
            if not models:
                print("  Hata: Hiçbir model bulunamadı!")
                return
                
            # Test için bir model seç
            test_model = models[0]
            print(f"\n2. Test için seçilen model: {test_model}")
            
            # Chat API için istek gönder
            print("\n3. Chat API kullanarak mesaj gönderme:")
            chat_payload = {
                "model": test_model,
                "messages": [
                    {"role": "system", "content": "Sen yardımcı bir asistansın."},
                    {"role": "user", "content": "Basit bir To-Do uygulaması nasıl oluşturabilirim?"}
                ],
                "temperature": 0.7,
                "stream": False
            }
            
            print(f"  İstek gönderiliyor: {chat_payload}")
            chat_response = await client.post("/api/chat", json=chat_payload)
            chat_response.raise_for_status()
            chat_data = chat_response.json()
            
            print(f"  Yanıt içeriği: {chat_data}")
            
            message = chat_data.get("message", {})
            message_content = message.get("content", "")
            
            print(f"\n  Yanıt:\n{message_content[:500]}...")
            
            print("\nOllama Chat API testi başarıyla tamamlandı!")
            
    except httpx.RequestError as e:
        print(f"Bağlantı hatası: {e}")
    except httpx.HTTPStatusError as e:
        print(f"HTTP hatası: {e}")
    except Exception as e:
        print(f"Beklenmeyen hata: {e}")

if __name__ == "__main__":
    asyncio.run(test_ollama_chat_api()) 
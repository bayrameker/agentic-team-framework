import asyncio
import os
import httpx

async def test_ollama_api():
    """Ollama API'ını test eder"""
    print("Ollama API Testi")
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
            
            # Basit bir komut gönder
            print("\n3. Basit bir metin tamamlama isteği gönderme:")
            generate_payload = {
                "model": test_model,
                "prompt": "Merhaba, ben bir yapay zeka asistanıyım.",
                "temperature": 0.7,
                "stream": False
            }
            
            print(f"  İstek gönderiliyor: {generate_payload}")
            generate_response = await client.post("/api/generate", json=generate_payload)
            generate_response.raise_for_status()
            generate_data = generate_response.json()
            
            response_text = generate_data.get("response", "")
            print(f"\n  Yanıt:\n{response_text}")
            
            # Sohbet formatında istek
            print("\n4. Sohbet formatında istek gönderme:")
            chat_payload = {
                "model": test_model,
                "messages": [
                    {"role": "system", "content": "Sen yardımcı bir asistansın."},
                    {"role": "user", "content": "Basit bir To-Do uygulaması nasıl oluşturabilirim?"}
                ],
                "temperature": 0.7,
                "stream": False
            }
            
            print(f"  İstek gönderiliyor (sohbet formatı)")
            chat_response = await client.post("/api/generate", json=chat_payload)
            chat_response.raise_for_status()
            chat_data = chat_response.json()
            
            chat_text = chat_data.get("response", "")
            print(f"\n  Yanıt:\n{chat_text[:500]}...")
            
            print("\nOllama API testi başarıyla tamamlandı!")
            
    except httpx.RequestError as e:
        print(f"Bağlantı hatası: {e}")
    except httpx.HTTPStatusError as e:
        print(f"HTTP hatası: {e}")
    except Exception as e:
        print(f"Beklenmeyen hata: {e}")

if __name__ == "__main__":
    asyncio.run(test_ollama_api())
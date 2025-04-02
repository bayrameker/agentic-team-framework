import asyncio
import httpx
import json

async def basit_ollama_sorgusu():
    """Temel Ollama API kullanım örneği"""
    print("Ollama API Basit Örnek")
    print("=" * 60)
    
    # Kullanacağımız modeller
    tercih_edilen_modeller = [
        "llama3.2:latest",
        "phi4:latest", 
        "gemma3:12b", 
        "gemma3:4b", 
        "gemma3:1b", 
        "llama3.1:latest"
    ]
    
    base_url = "http://localhost:11434"
    
    # Asenkron HTTP istemci başlat
    async with httpx.AsyncClient(base_url=base_url, timeout=300) as client:
        print("Mevcut modelleri kontrol ediyorum...")
        
        try:
            response = await client.get("/api/tags")
            data = response.json()
            models = [model["name"] for model in data.get("models", [])]
            
            print(f"Mevcut modeller: {', '.join(models)}")
            
            # Tercih edilen modelleri mevcut olanlarla karşılaştır
            for model in tercih_edilen_modeller:
                if model in models:
                    secilen_model = model
                    print(f"Kullanılacak model: {secilen_model}")
                    break
            else:
                secilen_model = models[0] if models else "phi4:latest"
                print(f"Tercih edilen modeller mevcut değil. Kullanılacak model: {secilen_model}")
            
            # Basit bir istek gönder
            print("\nTo-Do uygulaması geliştirme tavsiyesi için istek gönderiyorum...\n")
            
            payload = {
                "model": secilen_model,
                "prompt": """Basit bir To-Do uygulaması geliştirmek istiyorum. 
                
Bana şunları açıklar mısın:
1. Hangi teknolojileri kullanmalıyım?
2. Temel özellikler neler olmalı?
3. Basit bir mimari tasarım nasıl olabilir?

Lütfen kapsamlı ve yararlı bir yanıt ver.""",
                "system": "Sen deneyimli bir yazılım geliştirme danışmanısın. Kullanıcılara yazılım geliştirme konusunda pratik ve yararlı tavsiyeler verirsin.",
                "temperature": 0.7
            }
            
            generate_response = await client.post("/api/generate", json=payload)
            generate_response.raise_for_status()
            
            result = generate_response.json()
            response_text = result.get("response", "")
            
            print("-" * 60)
            print(response_text)
            print("-" * 60)
            
            print("\nYapay zeka yanıtı alındı!")
            
        except Exception as e:
            print(f"Hata oluştu: {e}")
            
if __name__ == "__main__":
    asyncio.run(basit_ollama_sorgusu()) 
import requests
import json

def basit_ollama_sorgusu():
    """Temel Ollama API kullanım örneği - requests kütüphanesi ile"""
    print("Ollama API Çok Basit Örnek")
    print("=" * 60)
    
    base_url = "http://localhost:11434"
    
    # Mevcut modelleri kontrol et
    try:
        response = requests.get(f"{base_url}/api/tags")
        response.raise_for_status()
        data = response.json()
        
        models = [model["name"] for model in data.get("models", [])]
        print(f"Mevcut modeller: {', '.join(models)}")
        
        if not models:
            print("Hiçbir model bulunamadı!")
            return
            
        # İlk modeli kullan
        model_name = models[0]
        print(f"Kullanılacak model: {model_name}")
        
        # Basit bir istek gönder
        print("\nBasit bir soru için istek gönderiyorum...\n")
        
        prompt = "Merhaba, bana bir To-Do uygulaması nasıl oluşturabileceğimi kısaca anlatır mısın?"
        
        payload = {
            "model": model_name,
            "prompt": prompt
        }
        
        print(f"İstek: {payload}")
        
        response = requests.post(f"{base_url}/api/generate", json=payload)
        response.raise_for_status()
        
        print(f"Yanıt durumu: {response.status_code}")
        print(f"Yanıt içeriği: {response.text[:100]}...")
        
        result = response.json()
        response_text = result.get("response", "")
        
        print("-" * 60)
        print(response_text)
        print("-" * 60)
        
    except Exception as e:
        print(f"Hata oluştu: {e}")
            
if __name__ == "__main__":
    basit_ollama_sorgusu() 
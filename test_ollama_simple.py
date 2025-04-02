import requests
import json

def main():
    """En basit Ollama API kullanımı"""
    print("Ollama API Testi")
    print("=" * 40)
    
    # API endpoint
    api_url = "http://localhost:11434/api/generate"
    
    # Kullanacağımız modeller
    models_to_try = [
        "llama3.2:latest",
        "phi4:latest", 
        "gemma3:1b", 
        "llama3.1:latest"
    ]
    
    # Modelleri kontrol et
    try:
        response = requests.get("http://localhost:11434/api/tags")
        response.raise_for_status()
        
        available_models = [model["name"] for model in response.json().get("models", [])]
        print(f"Mevcut modeller: {', '.join(available_models)}")
        
        # Kullanılabilir bir model seç
        model_to_use = None
        for model in models_to_try:
            if model in available_models:
                model_to_use = model
                break
                
        if not model_to_use:
            model_to_use = available_models[0] if available_models else "phi4:latest"
            
        print(f"Kullanılacak model: {model_to_use}")
        
        # API isteği hazırla
        data = {
            "model": model_to_use,
            "prompt": "Merhaba, To-Do uygulaması nasıl oluşturabilirim?",
            "stream": False  # Önemli: Akışı kapatarak tek bir yanıt al
        }
        
        print(f"\nİstek gönderiliyor: {json.dumps(data, ensure_ascii=False)}")
        
        # İsteği gönder
        response = requests.post(api_url, json=data)
        response.raise_for_status()
        
        # Yanıtı işle
        result = response.json()
        model_response = result.get("response", "")
        
        print("\nYanıt:")
        print("-" * 40)
        print(model_response)
        print("-" * 40)
        
    except Exception as e:
        print(f"Hata: {e}")
        
if __name__ == "__main__":
    main() 
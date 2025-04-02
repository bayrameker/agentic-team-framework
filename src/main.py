#!/usr/bin/env python
"""
Agentic Teams Ana Modül
"""
import os
import sys
import uvicorn

# Çevre değişkenlerinin ayarlanması
def load_environment():
    # API yapılandırması
    os.environ.setdefault("API_HOST", "0.0.0.0")
    os.environ.setdefault("API_PORT", "8000")
    os.environ.setdefault("DEBUG", "True")

    # Ollama yapılandırması
    os.environ.setdefault("OLLAMA_BASE_URL", "http://localhost:11434")
    os.environ.setdefault("OLLAMA_TIMEOUT", "300")

    # Kullanılabilir model listesi - virgülle ayrılmış
    os.environ.setdefault("AVAILABLE_MODELS", "llama3,mistral,mixtral,phi3,gemma")


if __name__ == "__main__":
    # Çevre değişkenlerini yükle
    load_environment()
    
    # API ayarlarını al
    from src.api.app import get_app_settings
    settings = get_app_settings()
    
    # Uygulamayı başlat
    print(f"Agentic Teams API başlatılıyor: http://{settings['host']}:{settings['port']}")
    print(f"API Dökümantasyonu: http://{settings['host']}:{settings['port']}/docs")
    print(f"UI Erişimi: http://{settings['host']}:{settings['port']}/ui")
    print("Çıkmak için Ctrl+C tuşlarına basın.")
    
    uvicorn.run("src.api.app:app", 
                host=settings["host"], 
                port=settings["port"], 
                reload=settings["reload"])

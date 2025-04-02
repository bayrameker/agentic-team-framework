#!/usr/bin/env python
"""
Agentic Teams API Sunucusu Başlatma Komut Dosyası
"""
import os
import sys
import uvicorn

# Çevre değişkenlerini ayarla
os.environ.setdefault("API_HOST", "0.0.0.0")
os.environ.setdefault("API_PORT", "8000")
os.environ.setdefault("DEBUG", "True")

# Ollama yapılandırması
os.environ.setdefault("OLLAMA_BASE_URL", "http://localhost:11434")
os.environ.setdefault("OLLAMA_TIMEOUT", "300")

# Kullanılabilir model listesi - virgülle ayrılmış
os.environ.setdefault("AVAILABLE_MODELS", "llama3,mistral,mixtral,phi3,gemma")

if __name__ == "__main__":
    # API sunucusunu başlat
    host = os.environ.get("API_HOST")
    port = int(os.environ.get("API_PORT"))
    reload = os.environ.get("DEBUG").lower() == "true"
    
    print(f"Agentic Teams API başlatılıyor: http://{host}:{port}")
    print(f"API Dökümantasyonu: http://{host}:{port}/docs")
    print("Çıkmak için Ctrl+C tuşlarına basın.")
    
    uvicorn.run("src.main:app", host=host, port=port, reload=reload) 
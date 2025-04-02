import os
from typing import Any, Dict, List, Optional, Set

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.api.routes import router
from src.models.ollama import OllamaAdapter
from src.core.manager import TeamManager

# FastAPI uygulaması oluştur
app = FastAPI(
    title="Agentic Teams API",
    description="Çoklu ajan ekip sistemi için API",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme için * kullanılabilir, prodüksiyonda özel değerlerle değiştirilmeli
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama bağdaştırıcısı ve ekip yöneticisi (singleton)
ollama_adapter = OllamaAdapter()
team_manager = TeamManager(ollama_adapter)

# API rotalarını ekle
app.include_router(router)

# Kök endpoint için yönlendirme
@app.get("/")
async def redirect_to_docs():
    """Ana sayfadan dokümantasyona yönlendirir"""
    return {
        "message": "Agentic Teams API çalışıyor",
        "docs": "/docs",
        "redoc": "/redoc",
        "api": "/api"
    }

# Statik dosyaları ekle (UI için)
app.mount("/ui", StaticFiles(directory="src/ui/build", html=True), name="ui")

# Uygulama başlatma ayarları
def get_app_settings():
    """Uygulama ayarlarını döndürür"""
    return {
        "host": os.getenv("API_HOST", "0.0.0.0"),
        "port": int(os.getenv("API_PORT", "8000")),
        "reload": os.getenv("DEBUG", "False").lower() == "true"
    } 
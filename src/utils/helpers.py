import os
import uuid
from typing import Any, Dict, List, Optional, Set, Union

from src.models.base import ModelCapability


def generate_id(prefix: str = "") -> str:
    """Benzersiz bir ID oluşturur"""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def load_env_models() -> List[str]:
    """Çevre değişkeninden modelleri yükler"""
    models_str = os.getenv("AVAILABLE_MODELS", "")
    if models_str:
        return [model.strip() for model in models_str.split(",")]
    return []


def select_best_model(available_models: List[str], preferences: List[str]) -> str:
    """Tercih edilen model listesine göre en uygun modeli seçer"""
    for model in preferences:
        for available in available_models:
            if model in available:
                return available
                
    # Hiçbir tercih bulunamazsa, mevcut ilk modeli kullan
    if available_models:
        return available_models[0]
    
    # Son çare olarak varsayılan bir model döndür
    return "llama3"


def filter_capabilities_for_role(role: str) -> Set[ModelCapability]:
    """Belirli bir rol için uygun yetenekleri döndürür"""
    if role == "developer":
        return {ModelCapability.CODING, ModelCapability.REASONING}
    elif role == "tester":
        return {ModelCapability.TESTING, ModelCapability.REASONING}
    elif role == "designer":
        return {ModelCapability.CREATIVITY, ModelCapability.REASONING}
    elif role == "marketing_specialist":
        return {ModelCapability.MARKETING, ModelCapability.CREATIVITY}
    elif role == "technical_writer":
        return {ModelCapability.LINGUISTICS, ModelCapability.SUMMARIZATION}
    elif role == "architect":
        return {ModelCapability.PLANNING, ModelCapability.REASONING}
    elif role == "data_scientist":
        return {ModelCapability.MATHEMATICS, ModelCapability.REASONING}
    else:
        # Varsayılan olarak mantıksal düşünme yeteneği gerekli
        return {ModelCapability.REASONING}


def format_markdown_result(title: str, results: Dict[str, Any]) -> str:
    """Sonuçları Markdown formatında biçimlendirir"""
    markdown = f"# {title}\n\n"
    
    if "status" in results:
        markdown += f"**Durum:** {results['status']}\n\n"
    
    if "result" in results:
        markdown += results["result"]
    
    return markdown


def get_model_preferences_for_role(role: str) -> List[str]:
    """Belirli bir rol için uygun model tercihlerini döndürür"""
    preferences = {
        "developer": ["llama3", "mixtral", "mistral"],
        "tester": ["mistral", "llama3", "phi3"],
        "designer": ["phi3", "gemma", "mistral"],
        "marketing_specialist": ["mixtral", "llama3", "mistral"],
        "technical_writer": ["mistral", "gemma", "llama3"],
        "architect": ["mixtral", "llama3", "mistral"],
        "data_scientist": ["mixtral", "llama3", "mistral"],
        "security_specialist": ["mistral", "llama3", "mixtral"],
        "product_manager": ["llama3", "mistral", "gemma"],
        "devops_engineer": ["mixtral", "llama3", "mistral"]
    }
    
    return preferences.get(role, ["llama3", "mistral", "mixtral"]) 
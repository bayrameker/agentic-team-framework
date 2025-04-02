import asyncio
import os
import sys

# Modül yolunu ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.models.base import ModelCapability
from src.models.ollama import OllamaAdapter
from src.models.team import AgentRole, TeamType
from src.teams.team_manager import TeamManager


async def main():
    """Örnek bir yazılım ekibi oluşturur ve bir görev çalıştırır"""
    print("Agentic Teams - Yazılım Ekibi Örneği")
    print("-" * 50)

    # Ollama bağdaştırıcısı oluştur
    ollama_adapter = OllamaAdapter()
    team_manager = TeamManager(ollama_adapter)

    # Mevcut modelleri kontrol et
    print("Mevcut modelleri kontrol ediliyor...")
    models = await team_manager.refresh_available_models()
    if not models:
        print("Hiçbir model bulunamadı! Varsayılan yapılandırma kullanılacak.")
        # Varsayılan modelleri ekle (Ollama API çalışmıyorsa)
        team_manager.available_models = ["llama3", "mistral", "phi3", "gemma", "mixtral"]

    print(f"Kullanılabilir modeller: {', '.join(team_manager.available_models)}")
    print("-" * 50)

    # Yazılım ekibi oluştur
    print("Yazılım ekibi oluşturuluyor...")
    team_id = team_manager.create_team(
        name="Yazılım Geliştirme Ekibi",
        team_type=TeamType.SOFTWARE_DEVELOPMENT,
        description="Çeşitli geliştiricilerden oluşan yazılım ekibi"
    )
    
    # Ekibe ajanlar ekle
    print("Ekibe ajanlar ekleniyor...")
    
    # Uygun modeller varsa kullan, yoksa varsayılan kullan
    # Gerçek bir senaryoda Ollama'daki mevcut modellere göre seçim yapılmalı
    architect_model = select_best_model(team_manager.available_models, ["mixtral", "llama3", "mistral"])
    developer_model = select_best_model(team_manager.available_models, ["llama3", "mixtral", "mistral"])
    tester_model = select_best_model(team_manager.available_models, ["mistral", "llama3", "phi3"])
    ui_model = select_best_model(team_manager.available_models, ["phi3", "gemma", "mistral"])
    
    # Sistem mimarı
    architect_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Ali Mimar",
        role=AgentRole.ARCHITECT,
        model_name=architect_model,
        required_capabilities={ModelCapability.PLANNING, ModelCapability.REASONING}
    )
    
    # Yazılım geliştiricisi
    developer_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Ayşe Geliştirici",
        role=AgentRole.DEVELOPER,
        model_name=developer_model,
        required_capabilities={ModelCapability.CODING, ModelCapability.REASONING}
    )
    
    # Test uzmanı
    tester_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Mehmet Test",
        role=AgentRole.TESTER,
        model_name=tester_model,
        required_capabilities={ModelCapability.TESTING, ModelCapability.REASONING}
    )
    
    # UI tasarımcısı
    designer_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Zeynep Tasarımcı",
        role=AgentRole.DESIGNER,
        model_name=ui_model,
        required_capabilities={ModelCapability.CREATIVITY, ModelCapability.REASONING}
    )
    
    print(f"Ekip oluşturuldu: {team_id}")
    print(f"Ajanlar: Mimar ({architect_id}), Geliştirici ({developer_id}), Test Uzmanı ({tester_id}), Tasarımcı ({designer_id})")
    print("-" * 50)
    
    # Görev oluştur
    print("Görev oluşturuluyor...")
    task_id = team_manager.create_task(
        title="Basit ToDo Uygulaması Geliştir",
        description="""
        Aşağıdaki özelliklere sahip basit bir ToDo uygulaması tasarla ve geliştir:
        
        1. Kullanıcılar yeni görevler ekleyebilmeli
        2. Görevleri tamamlandı olarak işaretleyebilmeli
        3. Görevleri silebilmeli
        4. Görevleri kategorilere göre filtreleyebilmeli
        
        Mimariden başlayarak, kullanıcı arayüzü ve uygulamanın nasıl çalışacağına dair detayları belirleyin.
        Ardından temel kod örnekleri, test planları ve olası iyileştirmeler sunun.
        """,
        team_id=team_id
    )
    
    # Görev çalıştır
    print(f"Görev oluşturuldu: {task_id}")
    print("Görev yürütülüyor (bu biraz zaman alabilir)...")
    result = await team_manager.execute_task(task_id)
    
    print("\nGörev Sonuçları:")
    print(f"Durum: {result['status']}")
    print("=" * 50)
    print(result["result"])
    print("=" * 50)
    
    # Geribildirim ver ve yeniden çalıştır
    print("\nGeribildirim vererek görevi iyileştirme...")
    feedback = """
    Teşekkürler, güzel bir başlangıç olmuş. Şimdi şu konuları da ele alabilir misiniz:
    
    1. Görevlerin son teslim tarihleri olmalı
    2. Görevler için öncelik seviyeleri eklenebilmeli
    3. Mobil cihazlarda da iyi çalışacak bir tasarım yapılmalı
    4. LocalStorage kullanarak verilerin kaydedilmesi sağlanmalı
    """
    
    iteration_result = await team_manager.iterate_on_task(task_id, feedback)
    
    print("\nİyileştirilmiş Görev Sonuçları:")
    print(f"Durum: {iteration_result['status']}")
    print(f"Yineleme: {team_manager.tasks[task_id].iterations}")
    print("=" * 50)
    print(iteration_result["result"])
    print("=" * 50)

    # Temizlik
    print("\nKaynakları temizleme...")
    ollama_adapter.close()
    print("Tamamlandı!")


def select_best_model(available_models, preferences):
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


if __name__ == "__main__":
    asyncio.run(main()) 
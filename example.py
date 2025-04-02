import asyncio
import os
import sys

# Modül yolunu ekle
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from src.models.base import ModelCapability
from src.models.ollama import OllamaAdapter
from src.models.team import AgentRole, TeamType, Task, TaskStatus, TaskPriority
from src.teams.team_manager import TeamManager

# Kullanılabilir modeller
AVAILABLE_MODELS = [
    "llama3.2:latest", 
    "phi4:latest", 
    "gemma3:12b", 
    "gemma3:4b", 
    "gemma3:1b", 
    "llama3.1:latest"
]

async def main():
    """
    Çoklu-Ajan Takım Yönetim Sistemi için örnek bir uygulama.
    
    Örnek akış:
    1. Ollama modellerini kontrol et
    2. Bir takım oluştur ve farklı modellere sahip ajanlar ekle
    3. Bir görev oluştur
    4. Görevi takıma dağıt
    5. Sonuçları göster
    """
    print("Çoklu-Ajan Takım Yönetim Sistemi - Örnek Uygulama")
    print("=" * 60)
    
    # 1. Ollama modellerini kontrol et
    print("\n[1] Ollama modelleri kontrol ediliyor...")
    
    # Ollama bağdaştırıcısı oluştur
    ollama_adapter = OllamaAdapter()
    
    try:
        # Mevcut modelleri kontrol et
        models = await ollama_adapter.list_models()
        if not models:
            print("Dikkat: Hiçbir Ollama modeli bulunamadı!")
            print("Ollama servisinin çalıştığından emin olun ve modelleri yükleyin.")
            models = AVAILABLE_MODELS
            print(f"Varsayılan modeller kullanılacak: {', '.join(models)}")
        else:
            print(f"Mevcut modeller: {', '.join(models)}")
            # Sadece belirtilen modelleri kullan
            models = [model for model in models if model in AVAILABLE_MODELS]
            if not models:
                print("İstenen modeller mevcut değil, varsayılanlar kullanılacak.")
                models = AVAILABLE_MODELS
            else:
                print(f"Kullanılacak modeller: {', '.join(models)}")
            
    except Exception as e:
        print(f"Ollama API'sine bağlanırken hata: {e}")
        print("Ollama servisinin çalıştığından emin olun.")
        print("Varsayılan modeller kullanılacak.")
        models = AVAILABLE_MODELS
    
    # TeamManager oluştur
    team_manager = TeamManager(ollama_adapter)
    team_manager.available_models = models
    
    # 2. Yazılım takımı oluştur
    print("\n[2] Takım oluşturuluyor...")
    
    team_id = team_manager.create_team(
        name="Yazılım Geliştirme Takımı",
        team_type=TeamType.SOFTWARE_DEVELOPMENT,
        description="Yazılım geliştirme ve test için özelleştirilmiş ajan takımı"
    )
    
    print(f"- {team_manager.get_team(team_id).name} takımı oluşturuldu (ID: {team_id})")
    
    # Uygun modeller seç
    def select_best_model(available_models, preferred_models):
        """Tercih edilen modeller listesinden mevcut olan ilk modeli seçer"""
        for model in preferred_models:
            if model in available_models:
                return model
        return available_models[0] if available_models else "phi4:latest"  # Varsayılan
    
    # Ajanları ekle
    print("\n[3] Takıma ajanlar ekleniyor...")
    
    # Farklı roller için ajanlar ekle
    architect_model = select_best_model(models, ["phi4:latest", "llama3.1:latest", "gemma3:12b"])
    architect_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Yazılım Mimarı",
        role=AgentRole.ARCHITECT,
        model_name=architect_model,
        system_prompt="Sen deneyimli bir yazılım mimarısın. Proje mimarisi tasarlamak, teknik kararlar almak ve genel çözüm yaklaşımı belirlemek senin görevin."
    )
    
    developer_model = select_best_model(models, ["llama3.2:latest", "phi4:latest", "gemma3:4b"])
    developer_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Kod Geliştiricisi",
        role=AgentRole.DEVELOPER,
        model_name=developer_model,
        system_prompt="Sen yetenekli bir yazılım geliştiricisisin. Temiz, verimli ve iyi yapılandırılmış kod yazarsın. Verilen görevleri ve tasarım şemalarını uygulamak senin görevin."
    )
    
    tester_model = select_best_model(models, ["gemma3:1b", "llama3.1:latest", "phi4:latest"])
    tester_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Test Uzmanı",
        role=AgentRole.TESTER,
        model_name=tester_model,
        system_prompt="Sen dikkatli bir test uzmanısın. Yazılımları test etmek, hataları bulmak ve kaliteyi artırmak senin görevin."
    )
    
    team = team_manager.get_team(team_id)
    print(f"- Takımda {len(team.agents)} ajan var:")
    for agent_config in team.agents:
        agent = team_manager.get_agent(agent_config.id)
        print(f"  * {agent_config.name} ({agent_config.role.value}) - Model: {agent_config.model_name}")
    
    # 3. Görev oluştur
    print("\n[4] Görev oluşturuluyor...")
    
    task_id = team_manager.create_task(
        title="To-Do Uygulaması Geliştirme",
        description="""
        Basit bir To-Do uygulaması geliştirilmesi:
        
        1. Görevleri listeleyen bir web uygulaması
        2. Yeni görev ekleme, düzenleme ve silme özellikleri
        3. React frontend ve basit bir API
        4. Kod kalitesi ve testlerin yazılması
        
        Beklenen çıktılar:
        - Mimari tasarım
        - Temel kod yapısı
        - Test senaryoları
        """,
        team_id=team_id
    )
    
    print(f"- '{team_manager.tasks[task_id].title}' görevi oluşturuldu (ID: {task_id})")
    
    # 4. Alt görevler oluştur ve ata
    print("\n[5] Alt görevler oluşturuluyor...")
    
    # Mimar için alt görev
    arch_subtask_id = team_manager.create_subtask(
        parent_task_id=task_id,
        title="To-Do Uygulaması Mimari Tasarımı",
        description="To-Do uygulaması için genel mimari yapıyı, kullanılacak teknolojileri ve veri modelini tasarla.",
        assigned_agent_id=architect_id
    )
    
    # Geliştirici için alt görev
    dev_subtask_id = team_manager.create_subtask(
        parent_task_id=task_id,
        title="To-Do Uygulaması Kodlaması",
        description="To-Do uygulamasının temel kod yapısını oluştur. React componentleri ve basit bir API implementasyonu yap.",
        assigned_agent_id=developer_id,
        dependencies=[arch_subtask_id]  # Mimari tasarıma bağımlı
    )
    
    # Test uzmanı için alt görev
    test_subtask_id = team_manager.create_subtask(
        parent_task_id=task_id,
        title="To-Do Uygulaması Test Senaryoları",
        description="To-Do uygulaması için test senaryoları hazırla ve temel testleri yaz.",
        assigned_agent_id=tester_id,
        dependencies=[dev_subtask_id]  # Koda bağımlı
    )
    
    print(f"- 3 alt görev oluşturuldu ve ajanlara atandı")
    
    # 5. Görevi yürüt
    print("\n[6] Görev yürütülüyor...")
    print("Bu işlem birkaç dakika sürebilir, lütfen bekleyin...")
    
    try:
        result = await team_manager.execute_task(task_id)
        
        print("\n[7] Görev sonuçları:")
        
        # Görev durumunu göster
        task = team_manager.tasks[task_id]
        print(f"Görev durumu: {task.status}")
        
        # Alt görev sonuçlarını göster
        print("\nAlt görev sonuçları:")
        
        for subtask_id, subtask_result in result["subtask_results"].items():
            subtask = team_manager.subtasks[subtask_id]
            agent = team_manager.get_agent(subtask.assigned_agent_id)
            
            print(f"\n[{agent.name} - {subtask.title}]")
            print("-" * 40)
            print(subtask_result[:500] + "..." if len(subtask_result) > 500 else subtask_result)
            print("-" * 40)
        
        # 8. İterasyon için geri bildirim ekle
        print("\n[8] Geri bildirim ile görev yineleniyor...")
        
        feedback = """
        Harika iş! Şu geliştirmeleri yapalım:
        1. Görevlerin tamamlandı olarak işaretlenebilmesi gerekiyor
        2. Görevlere öncelik ekleyebilmeliyiz (düşük, orta, yüksek)
        3. Arayüz daha modern ve kullanıcı dostu olmalı
        """
        
        print("Geri bildirim gönderiliyor...")
        
        try:
            iteration_result = await team_manager.iterate_on_task(task_id, feedback)
            
            print("\n[9] İyileştirme sonuçları:")
            
            # Güncellenmiş görev durumunu göster
            task = team_manager.tasks[task_id]
            print(f"Görev iterasyon sayısı: {task.iterations}")
            print(f"Güncellenmiş görev durumu: {task.status}")
            
            # İyileştirme sonuçlarını göster
            if "result" in iteration_result:
                improved_result = iteration_result["result"]
                print("\nİyileştirilmiş çözüm:")
                print("-" * 40)
                print(improved_result[:500] + "..." if len(improved_result) > 500 else improved_result)
                print("-" * 40)
            
        except Exception as e:
            print(f"İterasyon sırasında hata: {e}")
        
    except Exception as e:
        print(f"Görev yürütme sırasında hata: {e}")
    
    # Ollama adapter'ı kapat
    ollama_adapter.close()
    
    print("\nÖrnek uygulama tamamlandı!")

if __name__ == "__main__":
    # Asenkron ana fonksiyonu çalıştır
    asyncio.run(main()) 
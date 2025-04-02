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
    """Örnek bir pazarlama ekibi oluşturur ve bir görev çalıştırır"""
    print("Agentic Teams - Pazarlama Ekibi Örneği")
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

    # Pazarlama ekibi oluştur
    print("Pazarlama ekibi oluşturuluyor...")
    team_id = team_manager.create_team(
        name="Dijital Pazarlama Ekibi",
        team_type=TeamType.MARKETING,
        description="Çeşitli pazarlama uzmanlarından oluşan ekip"
    )
    
    # Ekibe ajanlar ekle
    print("Ekibe ajanlar ekleniyor...")
    
    # Uygun modeller varsa kullan, yoksa varsayılan kullan
    marketing_model = select_best_model(team_manager.available_models, ["mixtral", "llama3", "mistral"])
    creative_model = select_best_model(team_manager.available_models, ["llama3", "mixtral", "phi3"])
    content_model = select_best_model(team_manager.available_models, ["mistral", "gemma", "llama3"])
    
    # Pazarlama stratejisti
    strategist_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Deniz Stratejist",
        role=AgentRole.MARKETING_SPECIALIST,
        model_name=marketing_model,
        system_prompt="""Sen yaratıcı bir pazarlama stratejistisin. Verileri analiz eder, hedef kitleyi belirler ve 
        etkili pazarlama stratejileri geliştirirsin. Trendleri takip eder, rakip analizleri yapar ve 
        markaların pazar payını artırmak için özgün fikirler üretirsin.""",
        required_capabilities={ModelCapability.MARKETING, ModelCapability.PLANNING, ModelCapability.REASONING}
    )
    
    # İçerik uzmanı
    content_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Elif İçerik",
        role=AgentRole.TECHNICAL_WRITER,
        model_name=content_model,
        system_prompt="""Sen yetenekli bir içerik yazarısın. SEO uyumlu, ilgi çekici ve hedef kitleye 
        hitap eden içerikler oluşturursun. Blog yazıları, sosyal medya paylaşımları, e-posta bültenleri 
        ve web sitesi içerikleri konusunda uzmansın.""",
        required_capabilities={ModelCapability.LINGUISTICS, ModelCapability.MARKETING, ModelCapability.CREATIVITY}
    )
    
    # Yaratıcı tasarımcı
    designer_id = team_manager.add_agent_to_team(
        team_id=team_id,
        name="Can Tasarımcı",
        role=AgentRole.DESIGNER,
        model_name=creative_model,
        system_prompt="""Sen yetenekli bir yaratıcı tasarımcısın. Marka kimliğine uygun, dikkat çekici 
        ve etkileyici görsel tasarımlar oluşturursun. Reklam görselleri, sosyal medya içerikleri, 
        web siteleri ve diğer dijital varlıklar için tasarım önerileri sunabilirsin.""",
        required_capabilities={ModelCapability.CREATIVITY, ModelCapability.REASONING}
    )
    
    print(f"Ekip oluşturuldu: {team_id}")
    print(f"Ajanlar: Stratejist ({strategist_id}), İçerik Uzmanı ({content_id}), Tasarımcı ({designer_id})")
    print("-" * 50)
    
    # Görev oluştur
    print("Görev oluşturuluyor...")
    task_id = team_manager.create_task(
        title="Yeni Bir Mobil Uygulama için Pazarlama Kampanyası",
        description="""
        Fitness ve sağlıklı yaşam odaklı yeni bir mobil uygulama için kapsamlı bir pazarlama kampanyası 
        geliştirmeniz gerekiyor. Uygulama, kullanıcıların egzersiz rutinlerini takip etmelerine, 
        beslenme alışkanlıklarını iyileştirmelerine ve sağlık hedeflerine ulaşmalarına yardımcı oluyor.
        
        Hedef kitle: 25-45 yaş arası, sağlıklı yaşam konusunda bilinçli, akıllı telefon kullanan bireyler.
        
        Kampanya için şunları oluşturun:
        1. Pazarlama stratejisi ve hedef kitle analizi
        2. Lansman planı ve zamanlama
        3. Dijital pazarlama taktikleri (sosyal medya, e-posta, içerik pazarlama)
        4. Örnek içerikler (sosyal medya paylaşımları, blog yazısı fikirleri)
        5. Görsel tasarım önerileri ve marka mesajlaşma konsepti
        
        Uygulamanın adı "FitLife" ve slogan önerileri de sunabilirsiniz.
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
    Harika bir başlangıç, ancak şu konulara daha fazla odaklanabilir misiniz:
    
    1. Influencer pazarlama stratejisi ekleyin
    2. Kullanıcı katılımını artırmak için gamification öğeleri önerin
    3. Ücretli reklam stratejisi detaylandırın (Google Ads, Facebook/Instagram Ads)
    4. Uygulama içi satın alma ve premium abonelik için pazarlama taktikleri geliştirin
    5. Örnek slogan ve reklam metinlerini daha çeşitlendirin
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
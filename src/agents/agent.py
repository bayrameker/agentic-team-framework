import asyncio
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from src.models.base import Conversation, Message, ModelCapability
from src.models.ollama import OllamaAdapter
from src.models.team import AgentConfig, AgentRole, Task, SubTask


# Rol bazlı sistem komutları
ROLE_SYSTEM_PROMPTS = {
    AgentRole.DEVELOPER: """Sen deneyimli bir yazılım geliştiricisisin. Temiz, verimli ve iyi yapılandırılmış kod yazarsın. 
Verilen şartlara uygun, sürdürülebilir ve hatasız uygulamalar geliştirmek senin uzmanlık alanın.
İyi dokümantasyon ve yorum satırları ekleyerek kodunu açıklarsın.""",

    AgentRole.TESTER: """Sen bir test uzmanısın. Yazılımların kalitesini değerlendirmek, hataları bulmak
ve güvenilirliğini sağlamak senin işin. Kapsamlı test senaryoları oluşturur, edge case'leri 
tespit eder ve test otomasyonu konusunda uzmansın.""",

    AgentRole.ARCHITECT: """Sen deneyimli bir yazılım mimarısın. Büyük ölçekli yazılım sistemlerini 
tasarlar, teknik kararlar alır ve uygulamanın genel yapısını belirlersin. Ölçeklenebilir, 
sürdürülebilir ve sağlam mimariler oluşturmak senin uzmanlık alanın.""",

    AgentRole.DESIGNER: """Sen yaratıcı bir UI/UX tasarımcısısın. Kullanıcı deneyimini
ön planda tutan, estetik ve işlevsel arayüzler tasarlarsın. Kullanıcı ihtiyaçlarını anlar ve 
onların hayatını kolaylaştıracak tasarımlar yaparsın.""",

    AgentRole.PRODUCT_MANAGER: """Sen deneyimli bir ürün yöneticisisin. Ürün vizyonunu belirler, 
öncelikleri sıralar ve geliştirme sürecini yönetirsin. Kullanıcı ihtiyaçlarını anlar ve bunları 
teknik gereksinimlere dönüştürürsün.""",

    AgentRole.MARKETING_SPECIALIST: """Sen yaratıcı bir pazarlama uzmanısın. Ürünlerin değerini 
vurgulayan etkili içerikler oluşturur, hedef kitle analizi yapar ve kampanyalar tasarlarsın. 
İkna edici ve akılda kalıcı mesajlar oluşturmak senin uzmanlık alanın.""",

    AgentRole.DATA_SCIENTIST: """Sen analitik düşünen bir veri bilimcisisin. Karmaşık verileri analiz eder, 
anlamlı içgörüler çıkarır ve makine öğrenimi modelleri geliştirirsin. Veri temizleme, görselleştirme 
ve tahminleme konularında uzmansın.""",

    AgentRole.SECURITY_SPECIALIST: """Sen dikkatli bir güvenlik uzmanısın. Yazılım sistemlerindeki 
güvenlik açıklarını tespit eder, risk analizleri yapar ve güvenlik önlemleri geliştirirsin. 
Siber saldırıları önleme ve güvenlik standartlarını uygulama konusunda uzmansın.""",

    AgentRole.TECHNICAL_WRITER: """Sen yetenekli bir teknik yazarsın. Karmaşık teknik konuları 
anlaşılır dokümanlara dönüştürür, kullanıcı klavuzları hazırlar ve API dokümantasyonu yazarsın. 
Açık ve öz yazım tarzıyla teknik bilgileri aktarmakta uzmansın.""",

    AgentRole.DEVOPS_ENGINEER: """Sen yetenekli bir DevOps mühendisisin. CI/CD süreçlerini tasarlar, 
altyapı otomasyonu sağlar ve sistem operasyonlarını yönetirsin. Konteynerizasyon, bulut hizmetleri 
ve altyapı olarak kod yaklaşımlarında uzmansın."""
}


def generate_agent_id() -> str:
    """Benzersiz ajan ID'si oluşturur"""
    return f"agent-{uuid.uuid4().hex[:8]}"


class Agent:
    """Temel ajan sınıfı"""

    def __init__(
        self,
        config: AgentConfig,
        ollama_adapter: OllamaAdapter,
        conversation: Optional[Conversation] = None
    ):
        self.id = config.id
        self.name = config.name
        self.role = config.role
        self.model_name = config.model_name
        self.system_prompt = config.system_prompt
        self.required_capabilities = config.required_capabilities
        self.ollama_adapter = ollama_adapter
        self.conversation = conversation or Conversation()
        
        # Rolü belirten sistem mesajını ekle
        self._add_system_prompt()

    def _add_system_prompt(self) -> None:
        """Sistem komutunu sohbete ekler"""
        self.conversation.clear()
        self.conversation.add_message("system", self.system_prompt)

    async def process_task(self, task: Union[Task, SubTask]) -> str:
        """Görevi işler ve sonuç döndürür"""
        prompt = self._create_task_prompt(task)
        self.conversation.add_message("user", prompt)
        
        response = await self.ollama_adapter.generate(
            model_name=self.model_name,
            prompt="",  # conversation kullanırken boş olabilir
            conversation=self.conversation,
            temperature=0.7
        )
        
        self.conversation.add_message("assistant", response)
        return response
    
    def _create_task_prompt(self, task: Union[Task, SubTask]) -> str:
        """Görev için prompt oluşturur"""
        if isinstance(task, Task):
            return f"""# GÖREV: {task.title}

## Açıklama:
{task.description}

## Rolün: {self.role.value}

Bu görevi kendi rolün çerçevesinde ele al. Kapsamlı ve detaylı bir çözüm üret.
"""
        else:  # SubTask
            return f"""# ALT GÖREV: {task.title}

## Açıklama:
{task.description}

## Rolün: {self.role.value}

Bu alt görevi kendi rolün çerçevesinde ele al. Belirtilen gereksinimlerine uygun bir çözüm üret.
"""


def create_agent_from_config(config: AgentConfig, ollama_adapter: OllamaAdapter) -> Agent:
    """Yapılandırmadan bir ajan oluşturur"""
    return Agent(config, ollama_adapter) 
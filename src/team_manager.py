import uuid
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
import json
import os

from src.models.ollama import OllamaAdapter
from src.models.agent import Agent
from src.models.task import Task
from src.models.team import Team
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

# Görev durumlarını tanımla
TASK_STATUS = {
    "new": "Yeni",
    "in_progress": "Devam Ediyor",
    "completed": "Tamamlandı",
    "failed": "Başarısız",
    "waiting": "Bekliyor",
    "cancelled": "İptal Edildi"
}

class TeamManager:
    """Takım yönetim sınıfı"""
    
    def __init__(self, ollama_adapter=None):
        """
        TeamManager sınıfının yapıcı metodu
        
        Args:
            ollama_adapter: OllamaAdapter nesnesi
        """
        self.teams = {}
        self.tasks = {}
        self.subtasks = {}
        self.documents = {}
        self.bugs = []
        self.messages = []
        self.ollama_adapter = ollama_adapter
        self.available_models = []
        
        # Aktif görevler için izleme sistemi
        self.active_tasks = {}
        
        # Verileri yükle
        self.load_data()
        
        logger.info("TeamManager başlatıldı")

    def load_data(self):
        """Kayıtlı verileri yükle"""
        try:
            # Veri klasörünü oluştur
            os.makedirs('data', exist_ok=True)
            
            # Takımları yükle
            if os.path.exists('data/teams.json'):
                try:
                    with open('data/teams.json', 'r') as f:
                        teams_data = json.load(f)
                        for team_id, team_data in teams_data.items():
                            try:
                                team = Team(
                                    name=team_data["name"], 
                                    description=team_data.get("description", "")
                                )
                                team.id = team_id
                                team.task_ids = team_data.get("task_ids", [])
                                team.created_at = team_data.get("created_at", datetime.now().isoformat())
                                team.updated_at = team_data.get("updated_at", datetime.now().isoformat())
                                
                                # Ajanları ekle
                                if "agents" in team_data and team_data["agents"]:
                                    for agent_data in team_data["agents"]:
                                        try:
                                            agent = Agent(
                                                name=agent_data["name"],
                                                role=agent_data["role"],
                                                model=agent_data["model"]
                                            )
                                            agent.id = agent_data["id"]
                                            team.agents.append(agent)
                                        except Exception as e:
                                            logger.error(f"Ajan yüklenirken hata: {str(e)}")
                                        
                                self.teams[team_id] = team
                            except Exception as e:
                                logger.error(f"Takım {team_id} yüklenirken hata: {str(e)}")
                except Exception as e:
                    logger.error(f"Takımlar dosyası okuma hatası: {str(e)}")
            
            # Görevleri yükle
            if os.path.exists('data/tasks.json'):
                try:
                    with open('data/tasks.json', 'r') as f:
                        tasks_data = json.load(f)
                        for task_id, task_data in tasks_data.items():
                            try:
                                task = Task(
                                    title=task_data["title"],
                                    description=task_data["description"],
                                    team_id=task_data["team_id"]
                                )
                                task.id = task_id
                                task.status = task_data.get("status", "new")
                                task.subtasks = task_data.get("subtasks", [])
                                task.result = task_data.get("result")
                                task.created_at = task_data.get("created_at", datetime.now().isoformat())
                                task.updated_at = task_data.get("updated_at", datetime.now().isoformat())
                                
                                self.tasks[task_id] = task
                            except Exception as e:
                                logger.error(f"Görev {task_id} yüklenirken hata: {str(e)}")
                except Exception as e:
                    logger.error(f"Görevler dosyası okuma hatası: {str(e)}")
            
            # Hataları yükle
            if os.path.exists('data/bugs.json'):
                try:
                    with open('data/bugs.json', 'r') as f:
                        self.bugs = json.load(f)
                except Exception as e:
                    logger.error(f"Hatalar dosyası okuma hatası: {str(e)}")
                    self.bugs = []
            
            # Mesajları yükle
            if os.path.exists('data/messages.json'):
                try:
                    with open('data/messages.json', 'r') as f:
                        self.messages = json.load(f)
                except Exception as e:
                    logger.error(f"Mesajlar dosyası okuma hatası: {str(e)}")
                    self.messages = []
            
            logger.info(f"Veri yükleme tamamlandı: {len(self.teams)} takım, {len(self.tasks)} görev, {len(self.bugs)} hata, {len(self.messages)} mesaj")
        
        except Exception as e:
            logger.error(f"Veri yükleme hatası: {str(e)}")
            # Başlangıç değerlerini ayarla
            self.teams = {}
            self.tasks = {}
            self.bugs = []
            self.messages = []

    def save_data(self):
        """Verileri kaydet"""
        try:
            os.makedirs('data', exist_ok=True)
            
            with open('data/teams.json', 'w') as f:
                json.dump({team_id: team.to_dict() for team_id, team in self.teams.items()}, f)
            
            with open('data/tasks.json', 'w') as f:
                json.dump({task_id: task.to_dict() for task_id, task in self.tasks.items()}, f)
            
            with open('data/bugs.json', 'w') as f:
                json.dump(self.bugs, f)
            
            with open('data/messages.json', 'w') as f:
                json.dump(self.messages, f)
        except Exception as e:
            logger.error(f"Veri kaydetme hatası: {str(e)}")

    def create_team(self, name: str, description: str = None) -> str:
        """Yeni takım oluştur"""
        if description is None:
            description = f"{name} için açıklama"
        
        team = Team(name=name, description=description)
        self.teams[team.id] = team
        self.save_data()
        return team.id

    def add_agent_to_team(self, team_id: str, name: str, role: str, model_name: str, system_prompt: str = None) -> str:
        """Takıma yeni ajan ekle"""
        if team_id not in self.teams:
            logger.error(f"Ajan eklenirken hata: Takım bulunamadı (ID: {team_id})")
            raise ValueError("Takım bulunamadı")
        
        # Ajan adı kontrolü
        if not name or not name.strip():
            logger.error("Ajan eklenirken hata: Ajan adı boş olamaz")
            raise ValueError("Ajan adı boş olamaz")
            
        # Model adı kontrolü  
        if not model_name or not model_name.strip():
            logger.error("Ajan eklenirken hata: Model adı boş olamaz")
            raise ValueError("Model adı boş olamaz")
        
        # Varsayılan bir sistem prompt oluştur
        if not system_prompt:
            system_prompt = f"Sen bir {role} olarak görev yapıyorsun. Bu role uygun şekilde davran."
        
        try:
            agent = Agent(name=name.strip(), role=role, model=model_name.strip())
            self.teams[team_id].add_agent(agent)
            self.save_data()
            
            logger.info(f"Ajan {name} ({agent.id}) takıma eklendi: {team_id}")
            return agent.id
        except Exception as e:
            logger.error(f"Ajan eklenirken hata: {str(e)}")
            raise ValueError(f"Ajan eklenemedi: {str(e)}")

    def create_task(self, title: str, description: str, team_id: str) -> str:
        """Yeni görev oluştur"""
        if team_id not in self.teams:
            raise ValueError("Takım bulunamadı")
        
        task = Task(title=title, description=description, team_id=team_id)
        self.tasks[task.id] = task
        self.teams[team_id].add_task(task.id)
        self.save_data()
        return task.id

    async def execute_task(self, task_id: str):
        """Görevi çalıştırır ve sonuçları döndürür"""
        try:
            # Görevi ve takımı kontrol et
            task = self.tasks.get(task_id)
            if not task:
                return {"error": "Görev bulunamadı"}
            
            team_id = task.team_id
            team = self.teams.get(team_id)
            if not team:
                return {"error": "Takım bulunamadı"}
            
            # Görevin zaten çalışmıyor olduğunu kontrol et
            if task.status == "in_progress":
                return {"error": "Görev zaten çalışıyor"}
            
            # Takımda en az bir ajan olduğunu kontrol et
            if not team.agents or len(team.agents) == 0:
                return {"error": "Takımda çalışacak ajan bulunmuyor"}
            
            # Bu görev ilk kez çalıştırılıyorsa gerekli alanları ekle
            if not hasattr(task, 'progress'):
                task.progress = 0
            if not hasattr(task, 'status_message'):
                task.status_message = "Başlatılıyor..."
            if not hasattr(task, 'logs'):
                task.logs = []
            if not hasattr(task, 'documents'):
                task.documents = []
            if not hasattr(task, 'subtasks'):
                task.subtasks = []
            
            # Aktif görevlere ekle
            self.active_tasks[task_id] = {
                "start_time": datetime.now().isoformat(),
                "last_update": datetime.now().isoformat(),
                "heartbeat": True
            }
            
            # Görev izleme thread'ini başlat
            asyncio.create_task(self._task_monitor(task_id))
            
            # Görevi başlat
            task.status = "in_progress"
            task.is_active = True
            task.updated_at = datetime.now().isoformat()
            
            # İlk log kaydı
            task.logs.append({
                'timestamp': datetime.now().isoformat(),
                'message': f'Görev başlatıldı - "{task.title}"'
            })
            
            # Takım liderini bul (ilk ajan varsayılan olarak lider)
            team_leader = team.agents[0]
            for agent in team.agents:
                if agent.role.lower() in ["lead", "leader", "lead developer", "team lead", "senior"]:
                    team_leader = agent
                    break
            
            # Takım üyelerini rollere göre sınıflandır
            team_members = {}
            for agent in team.agents:
                role = agent.role.lower()
                if "architect" in role:
                    team_members["architect"] = agent
                elif "develop" in role or "program" in role or "engineer" in role or "coder" in role:
                    team_members["developer"] = agent
                elif "test" in role or "qa" in role:
                    team_members["tester"] = agent
                elif "ui" in role or "design" in role or "ux" in role:
                    team_members["ui_designer"] = agent
            
            # İlerleme log kaydı
            self.update_task_progress(task_id, 10, f"Görev başlatıldı. Takım lideri: {team_leader.name}")
            task.logs.append({
                'timestamp': datetime.now().isoformat(),
                'message': f'Takım lideri {team_leader.name} görev koordinasyonunu üstlendi'
            })
            
            # Mevcut alt görevleri kontrol et
            existing_subtasks = []
            if hasattr(task, 'subtasks') and task.subtasks:
                existing_subtasks = task.subtasks
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': f'Mevcut {len(existing_subtasks)} alt görev bulundu'
                })
                
                # Tüm alt görevleri sıfırla ve yeniden başlat
                for subtask in existing_subtasks:
                    subtask['status'] = 'waiting'
                    if 'result' in subtask:
                        subtask['previous_result'] = subtask['result']
                        subtask.pop('result', None)
                    subtask['updated_at'] = datetime.now().isoformat()
            
            # Alt görevler mevcut değilse, rollere göre oluştur
            if not existing_subtasks:
                # Alt görevler oluştur - ekip üyelerine göre
                subtasks = []
                
                # Mimari planlama alt görevi
                if "architect" in team_members:
                    subtask_id_arch = str(uuid.uuid4())
                    subtasks.append({
                        "id": subtask_id_arch,
                        "title": "Mimari Planlama",
                        "description": f"'{task.title}' projesi için mimari tasarım yapılması",
                        "assigned_agent_id": team_members["architect"].id,
                        "assigned_agent_name": team_members["architect"].name,
                        "assigned_agent_role": team_members["architect"].role,
                        "status": "waiting",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    })
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f'Alt görev oluşturuldu: "Mimari Planlama" - Ajan: {team_members["architect"].name}'
                    })
                
                # Kod geliştirme alt görevi
                if "developer" in team_members:
                    subtask_id_dev = str(uuid.uuid4())
                    subtasks.append({
                        "id": subtask_id_dev,
                        "title": "Kod Geliştirme",
                        "description": f"'{task.title}' projesi için kod geliştirilmesi",
                        "assigned_agent_id": team_members["developer"].id,
                        "assigned_agent_name": team_members["developer"].name,
                        "assigned_agent_role": team_members["developer"].role,
                        "status": "waiting",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    })
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f'Alt görev oluşturuldu: "Kod Geliştirme" - Ajan: {team_members["developer"].name}'
                    })
                
                # Test alt görevi
                if "tester" in team_members:
                    subtask_id_test = str(uuid.uuid4())
                    subtasks.append({
                        "id": subtask_id_test,
                        "title": "Test Senaryoları",
                        "description": f"'{task.title}' projesi için test senaryoları hazırlanması",
                        "assigned_agent_id": team_members["tester"].id,
                        "assigned_agent_name": team_members["tester"].name,
                        "assigned_agent_role": team_members["tester"].role,
                        "status": "waiting",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    })
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f'Alt görev oluşturuldu: "Test Senaryoları" - Ajan: {team_members["tester"].name}'
                    })
                
                # UI tasarım alt görevi
                if "ui_designer" in team_members:
                    subtask_id_ui = str(uuid.uuid4())
                    subtasks.append({
                        "id": subtask_id_ui,
                        "title": "Kullanıcı Arayüzü Tasarımı",
                        "description": f"'{task.title}' projesi için kullanıcı arayüzü tasarımı yapılması",
                        "assigned_agent_id": team_members["ui_designer"].id,
                        "assigned_agent_name": team_members["ui_designer"].name,
                        "assigned_agent_role": team_members["ui_designer"].role,
                        "status": "waiting",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    })
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f'Alt görev oluşturuldu: "Kullanıcı Arayüzü Tasarımı" - Ajan: {team_members["ui_designer"].name}'
                    })
                
                # Eğer hiç alt görev oluşturulmamışsa (özel rol var demektir), takım liderini kullanalım
                if len(subtasks) == 0:
                    subtask_id_gen = str(uuid.uuid4())
                    subtasks.append({
                        "id": subtask_id_gen,
                        "title": "Genel Geliştirme",
                        "description": f"'{task.title}' projesi için genel geliştirme",
                        "assigned_agent_id": team_leader.id,
                        "assigned_agent_name": team_leader.name,
                        "assigned_agent_role": team_leader.role,
                        "status": "waiting",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    })
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f'Alt görev oluşturuldu: "Genel Geliştirme" - Ajan: {team_leader.name}'
                    })
                
                # Alt görevleri task'a ekleyelim
                task.subtasks = subtasks
                self.save_data()
            else:
                # Mevcut alt görevleri kullan
                subtasks = existing_subtasks
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': f'Mevcut alt görevler yeniden başlatıldı: {len(subtasks)} adet'
                })
            
            # Görev durumunu güncelle
            self.update_task_progress(task_id, 20, "Alt görevler hazırlandı, ajanlar çalışmaya başlıyor")
            self.save_data()
            
            # ----- ANA ÇALIŞMA SÜRECİ -----
            
            # 1. Önce takım lideri görev açıklamasını analiz ederek ana planı belirler
            leader_subtask = None
            for subtask in task.subtasks:
                if subtask["assigned_agent_id"] == team_leader.id:
                    leader_subtask = subtask
                    break
            
            if not leader_subtask:
                # Eğer takım liderinin alt görevi yoksa bir tane oluştur
                leader_subtask_id = str(uuid.uuid4())
                leader_subtask = {
                    "id": leader_subtask_id,
                    "title": "Görev Analizi ve Koordinasyon",
                    "description": f"'{task.title}' projesinin analizi ve koordinasyonu",
                    "assigned_agent_id": team_leader.id,
                    "assigned_agent_name": team_leader.name,
                    "assigned_agent_role": team_leader.role,
                    "status": "waiting",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                task.subtasks.append(leader_subtask)
                self.save_data()
                
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': f'Takım lideri için alt görev oluşturuldu: "Görev Analizi ve Koordinasyon"'
                })
            
            # Liderin alt görevini in_progress olarak işaretle
            leader_subtask["status"] = "in_progress"
            leader_subtask["updated_at"] = datetime.now().isoformat()
            task.logs.append({
                'timestamp': datetime.now().isoformat(),
                'message': f'Takım lideri ({team_leader.name}) görev üzerinde çalışmaya başladı'
            })
            self.save_data()
            
            # Görev durumunu güncelle
            self.update_task_progress(task_id, 30, f"Takım lideri ({team_leader.name}) görev analizi yapıyor")
            
            # Takım liderinin görev analizi için prompt'u hazırla
            prompt = f"""
                # KOD GELİŞTİRME GÖREVİ
                
                {task.description}
                
                Lütfen şu adımları izle:
                
                1. Önce proje mimarisi planla
                2. Gerekli dosyaları ve klasörleri belirle
                3. Her dosyada bulunması gereken kodları detaylı olarak yaz
                4. Örnek kullanımlar göster
                5. Her dosyanın başına açıklama yorum satırları ekle
                
                NOT: Cevabın tam ve çalışır kod içermeli. Kodlar "```dosya_adı.uzantı" formatında belirtilmeli.
                Örneğin: ```app.js, ```index.html gibi.
                
                # UZUN ÇALIŞMA SÜRESİ
                Bu görev için yeterli zamanın var. Adım adım ilerle ve kapsamlı bir çözüm üret.
                Her adımı detaylı olarak açıkla.
                """
            
            system_prompt = """Sen deneyimli bir developer rolünde uzmansın. 
                    Senin görevin detaylı kod yazmak ve çözüm üretmek. 
                    Her zaman tam, çalışan ve kaliteli kod üretmelisin.
                    Görevi adım adım çöz ve her dosyayı ayrı ayrı kodla.
                    Düşünme sürecini ve mimarini açıkla."""
            
            # Debug bilgisi ekle
            task.logs.append({
                'timestamp': datetime.now().isoformat(),
                'message': f'"{team_leader.model}" modeli kullanılarak görev analizi yapılıyor'
            })
            self.save_data()
            
            try:
                # Takım liderinin yanıtını al
                self.update_task_progress(task_id, 35, "AI modeli yanıt üretiyor...")
                leader_response = await self.ollama_adapter.generate(
                    model=team_leader.model,
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=0.7,
                    stream=False
                )
                
                # Yanıt kontrolü
                if not leader_response or isinstance(leader_response, dict) and "error" in leader_response:
                    error_message = leader_response.get("error", "AI modelinden yanıt alınamadı") if isinstance(leader_response, dict) else "AI modelinden yanıt alınamadı"
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f'HATA: Model yanıtı alınamadı: {error_message}'
                    })
                    raise ValueError(f"Model yanıt vermedi: {error_message}")
                
                # İlerleme güncellemesi
                self.update_task_progress(task_id, 50, f"Takım lideri ({team_leader.name}) yanıt üretti, kod çıkarılıyor")
                
                # Takım liderinin yanıtını işle ve subtask'ına ekle
                leader_subtask["result"] = leader_response
                leader_subtask["status"] = "completed"
                leader_subtask["completed_at"] = datetime.now().isoformat()
                
                # Yanıtı loglara ekle (kısaltılmış olarak)
                response_summary = leader_response[:150] + "..." if len(leader_response) > 150 else leader_response
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': f'Takım lideri yanıtı: {response_summary}'
                })
                
                # AI yanıtından kod dosyalarını çıkar
                code_files = self._extract_code_files(leader_response)
                
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': f'{len(code_files)} adet kod dosyası çıkarıldı'
                })
                
                # Açıklamayı çıkar
                explanation = self._extract_explanation(leader_response, code_files)
                
                # Sonucu hazırla
                result = {
                    "explanation": explanation,
                    "code_files": code_files
                }
                
                # Her bir dosya için bir doküman oluştur
                self.update_task_progress(task_id, 60, "Kod dosyaları oluşturuluyor...")
                for file_name, file_content in code_files.items():
                    # Dosya türünü belirle
                    file_type = "code"
                    if file_name.endswith(('.txt', '.md')):
                        file_type = "text"
                    
                    # Doküman nesnesini oluştur
                    document_id = str(uuid.uuid4())
                    document = {
                        "id": document_id,
                        "title": file_name,
                        "content": file_content,
                        "type": file_type,
                        "uploaded_at": datetime.now().isoformat()
                    }
                    
                    # Dokümanı task'a ekle
                    task.documents.append(document)
                    
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': f'Doküman oluşturuldu: {file_name} ({file_type})'
                    })
                    
                    # Kısa bir bekleme - throttling için
                    await asyncio.sleep(0.1)
                
                # İlerleme güncellemesi
                self.update_task_progress(task_id, 70, "Kod dosyaları oluşturuldu, diğer ekip üyeleri görevlere başlıyor")
                self.save_data()
                
                # 2. Diğer ekip üyelerinin görevlerini işle
                remaining_subtasks = [s for s in task.subtasks if s["status"] != "completed"]
                
                for i, subtask in enumerate(remaining_subtasks):
                    # İlgili ekip üyesinin ID'sini al
                    agent_id = subtask["assigned_agent_id"]
                    
                    # Ekip üyesini bul
                    agent = None
                    for a in team.agents:
                        if a.id == agent_id:
                            agent = a
                            break
                    
                    if agent and agent.id != team_leader.id:  # Lideri atlayalım, o zaten işini bitirdi
                        # Alt görev durumunu güncelle
                        subtask["status"] = "in_progress"
                        subtask["updated_at"] = datetime.now().isoformat()
                        
                        progress = 70 + (20 * (i + 1) // len(remaining_subtasks))
                        self.update_task_progress(task_id, progress, f"{subtask['title']} alt görevi işleniyor - {agent.name} çalışıyor")
                        
                        task.logs.append({
                            'timestamp': datetime.now().isoformat(),
                            'message': f'"{subtask["title"]}" alt görevi başlatıldı - Ajan: {agent.name} ({agent.role})'
                        })
                        self.save_data()
                        
                        # Her role özel prompt oluştur
                        role_prompt = ""
                        if "architect" in agent.role.lower():
                            role_prompt = f"""
                            # MİMARİ DEĞERLENDİRME
                            
                            Aşağıdaki kod taslağını ve açıklamayı mimari açıdan değerlendir.
                            Güçlü ve zayıf yanlarını belirt, daha iyi bir mimari için öneriler sun.
                            
                            # AÇIKLAMA
                            {explanation}
                            
                            # KODLAR
                            {str(code_files)[:1000]}...
                            
                            # DEĞERLENDİRME FORMATI
                            1. Genel Mimari Değerlendirmesi
                            2. Güçlü Yönler
                            3. Zayıf Yönler
                            4. İyileştirme Önerileri
                            5. Mimari Diyagram (metin formatında)
                            """
                        elif "test" in agent.role.lower():
                            role_prompt = f"""
                            # TEST PLANI OLUŞTURMA
                            
                            Aşağıdaki kod taslağı için kapsamlı bir test planı hazırla.
                            Birim testleri, entegrasyon testleri ve uçtan uca testler için senaryolar oluştur.
                            
                            # AÇIKLAMA
                            {explanation}
                            
                            # KODLAR
                            {str(code_files)[:1000]}...
                            
                            # TEST PLANI FORMATI
                            1. Test Stratejisi
                            2. Birim Test Senaryoları
                            3. Entegrasyon Test Senaryoları
                            4. Uçtan Uca Test Senaryoları
                            5. Performans Testleri
                            6. Örnek Test Kodları
                            """
                        elif "ui" in agent.role.lower() or "design" in agent.role.lower():
                            role_prompt = f"""
                            # KULLANICI ARAYÜZÜ TASARIMI
                            
                            Aşağıdaki kod taslağı için kullanıcı arayüzü tasarım önerileri hazırla.
                            Mockup'lar yerine detaylı CSS ve HTML komponentleri oluştur.
                            
                            # AÇIKLAMA
                            {explanation}
                            
                            # KODLAR
                            {str(code_files)[:1000]}...
                            
                            # UI TASARIM FORMATI
                            1. Genel Tasarım İlkeleri
                            2. Renk Paleti
                            3. Tipografi
                            4. Komponentler
                            5. Sayfa Düzenleri
                            6. Örnek HTML/CSS Kodları (tam çalışır)
                            """
                        else:
                            role_prompt = f"""
                            # KOD DEĞERLENDİRME VE İYİLEŞTİRME
                            
                            Aşağıdaki kod taslağını {agent.role} rolünde değerlendir ve iyileştir.
                            Kod kalitesi, güvenlik, performans açısından değerlendir ve somut öneriler sun.
                            
                            # AÇIKLAMA
                            {explanation}
                            
                            # KODLAR
                            {str(code_files)[:1000]}...
                            
                            # DEĞERLENDİRME FORMATI
                            1. Genel Değerlendirme
                            2. Güçlü Yönler
                            3. İyileştirilmesi Gereken Yerler
                            4. İyileştirme Önerileri
                            5. Örnek İyileştirilmiş Kod Parçaları
                            """
                        
                        task.logs.append({
                            'timestamp': datetime.now().isoformat(),
                            'message': f'"{agent.name}" için prompt oluşturuldu, "{agent.model}" modeli yanıt üretiyor'
                        })
                        self.save_data()
                        
                        # Ajan model yanıtı
                        agent_response = await self.ollama_adapter.generate(
                            model=agent.model,
                            prompt=role_prompt,
                            system_prompt=f"Sen bir {agent.role} olarak görevlendirildin. Bu rolde verilen görevi en iyi şekilde yapman gerekiyor.",
                            temperature=0.7,
                            stream=False
                        )
                        
                        # Yanıtı alt göreve ekle
                        subtask["result"] = agent_response
                        subtask["status"] = "completed"
                        subtask["completed_at"] = datetime.now().isoformat()
                        
                        # İlgili ajanın çıktısını belge olarak kaydet
                        document_id = str(uuid.uuid4())
                        document = {
                            "id": document_id,
                            "title": f"{agent.role}_ciktisi.md",
                            "content": agent_response,
                            "type": "text",
                            "uploaded_at": datetime.now().isoformat()
                        }
                        task.documents.append(document)
                        
                        task.logs.append({
                            'timestamp': datetime.now().isoformat(),
                            'message': f'"{agent.name}" yanıt üretti ve doküman oluşturuldu'
                        })
                        self.save_data()
                        
                        # Biraz bekle
                        await asyncio.sleep(0.2)
                
                # Ana açıklama dokümanı
                if explanation:
                    document_id = str(uuid.uuid4())
                    document = {
                        "id": document_id,
                        "title": "README.md",
                        "content": explanation,
                        "type": "text",
                        "uploaded_at": datetime.now().isoformat()
                    }
                    task.documents.append(document)
                    
                    task.logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'message': 'README dokümanı oluşturuldu'
                    })
                
                # Proje yapısı dokümanı
                document_id = str(uuid.uuid4())
                project_structure = "# Proje Yapısı\n\n"
                project_structure += "```\n"
                for file_name in code_files.keys():
                    project_structure += f"├── {file_name}\n"
                project_structure += "```\n"
                document = {
                    "id": document_id,
                    "title": "proje_yapisi.md",
                    "content": project_structure,
                    "type": "text",
                    "uploaded_at": datetime.now().isoformat()
                }
                task.documents.append(document)
                
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': 'Proje yapısı dokümanı oluşturuldu'
                })
                
                # Görevi tamamlandı olarak işaretle
                self.complete_task(task_id, json.dumps(result, ensure_ascii=False))
                
                # İlerleme güncellemesi
                self.update_task_progress(task_id, 100, "Görev başarıyla tamamlandı")
                
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': 'Tüm alt görevler tamamlandı, görev başarıyla sonuçlandı'
                })
                self.save_data()
                
                return {
                    "success": True,
                    "result": result
                }
            except Exception as e:
                logger.error(f"Görev çalıştırılırken hata: {str(e)}")
                task.logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': f'HATA: {str(e)}'
                })
                self.fail_task(task_id, f"Görev çalıştırılırken hata: {str(e)}")
                self.save_data()
                return {"error": f"Görev çalıştırılırken hata: {str(e)}"}
                
        except Exception as e:
            logger.error(f"Görev çalıştırılırken beklenmeyen hata: {str(e)}")
            try:
                self.tasks[task_id].logs.append({
                    'timestamp': datetime.now().isoformat(),
                    'message': f'HATA: Beklenmeyen hata - {str(e)}'
                })
                self.fail_task(task_id, f"Beklenmeyen hata: {str(e)}")
            except:
                pass
            return {"error": f"Görev çalıştırılırken beklenmeyen hata: {str(e)}"}

    def _extract_code_files(self, text: str) -> Dict[str, str]:
        """Metinden kod parçalarını çıkarır"""
        code_files = {}
        
        # ```dosya_adı.uzantı formatını ara
        import re
        pattern = r"```([a-zA-Z0-9_\-\.\/]+)[\r\n]+(.+?)```"
        matches = re.finditer(pattern, text, re.DOTALL)
        
        for match in matches:
            file_name = match.group(1).strip()
            code_content = match.group(2).strip()
            code_files[file_name] = code_content
        
        return code_files

    def _extract_explanation(self, text: str, code_files: Dict[str, str]) -> str:
        """Kod parçaları dışındaki açıklamaları çıkarır"""
        explanation = text
        
        # Kod parçalarını çıkar
        for file_name, code_content in code_files.items():
            explanation = explanation.replace(f"```{file_name}\n{code_content}```", "")
        
        # Diğer kod bloklarını da çıkar
        import re
        explanation = re.sub(r"```.*?```", "", explanation, flags=re.DOTALL)
        
        # Temizle ve formatla
        explanation = explanation.strip()
        
        return explanation

    def iterate_task(self, task_id: str, feedback: str) -> Dict:
        """Görev iterasyonu yap"""
        if task_id not in self.tasks:
            raise ValueError("Görev bulunamadı")
        
        task = self.tasks[task_id]
        team = self.teams[task.team_id]
        
        # İterasyon yap ve sonuçları kaydet
        result = task.iterate(team, feedback)
        self.save_data()
        return result

    def add_bug(self, bug_data: Dict) -> Dict:
        """Yeni hata ekle"""
        bug_data['id'] = str(len(self.bugs) + 1)
        bug_data['created_at'] = datetime.now().isoformat()
        self.bugs.append(bug_data)
        self.save_data()
        return bug_data

    def update_bug_status(self, bug_id: str, status: str) -> Dict:
        """Hata durumunu güncelle"""
        for bug in self.bugs:
            if bug['id'] == bug_id:
                bug['status'] = status
                bug['updated_at'] = datetime.now().isoformat()
                self.save_data()
                return bug
        raise ValueError("Hata bulunamadı")

    def add_message(self, message_data: Dict) -> Dict:
        """Yeni mesaj ekle"""
        message_data['id'] = str(len(self.messages) + 1)
        message_data['timestamp'] = datetime.now().isoformat()
        self.messages.append(message_data)
        self.save_data()
        return message_data

    def get_team_tasks(self, team_id: str) -> list:
        """Takıma ait görevleri listele"""
        if team_id not in self.teams:
            raise ValueError("Takım bulunamadı")
        
        team = self.teams[team_id]
        tasks = []
        
        if hasattr(team, 'task_ids') and team.task_ids:
            for task_id in team.task_ids:
                task = self.get_task(task_id)
                if task:
                    tasks.append(task)
        
        return tasks

    def get_team_agents(self, team_id: str) -> List[Dict]:
        """Takımın ajanlarını getir"""
        if team_id not in self.teams:
            raise ValueError("Takım bulunamadı")
        return [agent.to_dict() for agent in self.teams[team_id].agents]

    def get_team_bugs(self, team_id: str) -> List[Dict]:
        """Takımın hatalarını getir"""
        return [bug for bug in self.bugs if bug.get('team_id') == team_id]

    def get_team_messages(self, team_id: str) -> List[Dict]:
        """Takımın mesajlarını getir"""
        return [msg for msg in self.messages if msg.get('team_id') == team_id]

    def execute_code(self, task_id: str, code: str) -> Dict:
        """Kodu çalıştır"""
        if task_id not in self.tasks:
            raise ValueError("Görev bulunamadı")
        
        task = self.tasks[task_id]
        team = self.teams[task.team_id]
        
        # Kodu çalıştır ve sonuçları kaydet
        result = task.execute_code(team, code)
        self.save_data()
        return result

    def get_team(self, team_id):
        """Bir takımın tüm detaylarını döndürür"""
        if team_id not in self.teams:
            return None
        
        team_data = self.teams[team_id].to_dict()
        # Takıma ait ajanları ekle
        team_data["agents"] = [agent.to_dict() for agent in self.teams[team_id].agents]
        # Takıma ait görevleri ekle
        team_data["tasks"] = [self.tasks[task_id].to_dict() for task_id in self.teams[team_id].task_ids if task_id in self.tasks]
        
        return team_data
    
    def list_teams(self):
        """Tüm takımları döndürür"""
        teams_list = []
        for team_id in self.teams:
            team_data = self.get_team(team_id)
            if team_data:
                teams_list.append(team_data)
        return teams_list
    
    def delete_team(self, team_id):
        """Bir takımı siler"""
        if team_id not in self.teams:
            return False
        
        # Takıma ait ajanları temizle
        self.teams[team_id].agents = []
        
        # Takıma ait görevleri temizle
        tasks_to_remove = [tid for tid, task in self.tasks.items() if task.team_id == team_id]
        for task_id in tasks_to_remove:
            # Göreve ait alt görevleri temizle
            self.tasks = {sid: subtask for sid, subtask in self.tasks.items() if subtask.task_id != task_id}
            # Görevi sil
            if task_id in self.tasks:
                del self.tasks[task_id]
        
        # Takımı sil
        del self.teams[team_id]
        self.save_data()
        return True
    
    def get_agent(self, agent_id):
        """Bir ajanın detaylarını döndürür"""
        for team_id, team in self.teams.items():
            for agent in team.agents:
                if agent.id == agent_id:
                    return agent
        return None
    
    def list_agents(self, team_id=None):
        """Takımdaki veya tüm ajanları listeler"""
        if team_id:
            return [agent for agent in self.get_team_agents(team_id)]
        return list(self.get_team_agents(None))
    
    def get_task(self, task_id):
        """Bir görevin tüm detaylarını döndürür"""
        if task_id not in self.tasks:
            return None
        
        task_data = self.tasks[task_id].to_dict()
        
        # Görevin aktif olup olmadığını ekle
        task_data["is_active"] = task_id in self.active_tasks
        
        # Son aktivite zamanını ekle
        if task_id in self.active_tasks:
            task_data["last_activity"] = self.active_tasks[task_id]["last_update"]
        
        return task_data
    
    def list_tasks(self, team_id=None):
        """Takımdaki veya tüm görevleri listeler"""
        if team_id:
            return [task for task in self.get_team_tasks(team_id)]
        return list(self.get_team_tasks(None))
    
    def delete_task(self, task_id):
        """Bir görevi siler"""
        if task_id not in self.tasks:
            return False
        
        # Göreve ait alt görevleri temizle
        self.tasks = {sid: subtask for sid, subtask in self.tasks.items() if subtask.task_id != task_id}
        
        # Görevi sil
        del self.tasks[task_id]
        self.save_data()
        return True
    
    def add_subtask(self, task_id, description, title=None, assigned_agent_id=None):
        """Göreve alt görev ekler"""
        if task_id not in self.tasks:
            return None
        
        subtask_id = str(uuid.uuid4())
        subtask = {
            "id": subtask_id,
            "title": title or f"Alt görev #{len(self.tasks[task_id].subtasks) + 1}",
            "description": description,
            "task_id": task_id,
            "assigned_agent_id": assigned_agent_id,
            "completed": False,
            "created_at": datetime.now().isoformat()
        }
        self.tasks[task_id].add_subtask(subtask_id, subtask["title"], subtask["description"], subtask["assigned_agent_id"])
        self.save_data()
        
        return subtask_id
    
    def complete_subtask(self, subtask_id):
        """Alt görevi tamamlar"""
        if subtask_id not in self.tasks:
            return False
        
        self.tasks[subtask_id].completed = True
        self.save_data()
        
        return True
    
    # Doküman yükleme
    def upload_document(self, task_id, document_title, document_content, document_type="text"):
        """Görev için doküman yükler"""
        if task_id not in self.tasks:
            return None
            
        task = self.tasks[task_id]
        
        # Dokümantasyon sistemini hazırla
        if "documents" not in task:
            task.documents = []
            
        document_id = str(uuid.uuid4())
        document = {
            "id": document_id,
            "title": document_title,
            "content": document_content,
            "type": document_type,
            "uploaded_at": datetime.now().isoformat()
        }
        
        task.documents.append(document)
        task.updated_at = datetime.now().isoformat()
        
        return document_id
    
    # Dokümanı al
    def get_document(self, task_id, document_id):
        """Bir görevdeki dokümanı alır"""
        if task_id not in self.tasks:
            return None
            
        task = self.tasks[task_id]
        
        if "documents" not in task:
            return None
            
        for document in task.documents:
            if document["id"] == document_id:
                return document
                
        return None
        
    # Doküman listesini al
    def list_documents(self, task_id):
        """Görev için belgelerin listesini döndürür"""
        try:
            task = self.get_task(task_id)
            if task is None:
                return []
            
            # Görev nesnesinde documents özelliği yoksa veya boş ise boş liste döndür
            if not hasattr(task, 'documents') or task.documents is None:
                return []
            
            return task.documents
        except Exception as e:
            self.logger.error(f"Doküman listeleme hatası: {e}")
            return []
            
    # Dokümanı değerlendir
    async def evaluate_document(self, task_id, document_id):
        """Bir dokümanı takım üyeleri tarafından değerlendirir"""
        if task_id not in self.tasks:
            return None
            
        task = self.tasks[task_id]
        team = self.teams[task.team_id]
        
        # Dokümanı al
        document = None
        if "documents" in task:
            for doc in task.documents:
                if doc["id"] == document_id:
                    document = doc
                    break
        
        if not document:
            return {"error": "Doküman bulunamadı"}
            
        # Takım üyelerini al
        agents = [agent for agent in self.get_team_agents(task.team_id)]
        
        if not agents:
            return {"error": "Takımda ajan yok"}
            
        # Her ajan için değerlendirme yap
        evaluations = []
        
        for agent in agents:
            # Ajanın görev tanımını oluştur
            prompt = f"""
            # DOKÜMAN DEĞERLENDİRME
            
            Doküman Başlığı: {document["title"]}
            Doküman Tipi: {document["type"]}
            
            İçerik:
            {document["content"]}
            
            Lütfen bu dokümanı {agent.role} perspektifinden değerlendir.
            Dokümanın ana noktalarını, güçlü ve zayıf yanlarını ve önerilerini belirt.
            """
            
            # Ajanın modeli ile değerlendirme yap
            evaluation_result = await self.model_adapter.generate(
                model=agent.model,
                prompt=prompt,
                system_prompt=f"Sen {agent.role} rolünde bir uzmansın. Bu dokümanı kendi uzmanlık alanın perspektifinden değerlendir."
            )
            
            # Değerlendirmeyi kaydet
            evaluations.append({
                "agent_id": agent.id,
                "agent_name": agent.name,
                "agent_role": agent.role,
                "evaluation": evaluation_result,
                "timestamp": datetime.now().isoformat()
            })
        
        # Değerlendirmeleri kaydet
        if "document_evaluations" not in task:
            task.document_evaluations = {}
            
        task.document_evaluations[document_id] = evaluations
        task.updated_at = datetime.now().isoformat()
        
        # Tüm değerlendirmeleri birleştir
        consolidated_evaluation = ""
        
        for i, evaluation in enumerate(evaluations):
            consolidated_evaluation += f"## {evaluation['agent_name']} ({evaluation['agent_role']}) Değerlendirmesi\n\n"
            consolidated_evaluation += f"{evaluation['evaluation']}\n\n"
            
            if i < len(evaluations) - 1:
                consolidated_evaluation += "---\n\n"
                
        return {
            "success": True,
            "document_id": document_id,
            "evaluations": evaluations,
            "consolidated_evaluation": consolidated_evaluation
        }
    
    async def iterate_task(self, task_id, feedback=None):
        """Görev üzerinde yineleme yapar ve geri bildirim ekler"""
        if task_id not in self.tasks:
            return None
            
        task = self.tasks[task_id]
        
        if task.status != "completed":
            return {"error": "Sadece tamamlanmış görevler üzerinde yineleme yapılabilir"}
        
        previous_result = task.result
        
        if not previous_result:
            return {"error": "Önceki sonuç bulunamadı"}
        
        # Bir yineleme ekle
        iteration = {
            "id": str(uuid.uuid4()),
            "feedback": feedback,
            "previous_result": previous_result,
            "new_result": None,
            "timestamp": datetime.now().isoformat()
        }
        
        # Task nesnesinin iterations özelliğini kontrol et ve gerekirse oluştur
        if not hasattr(task, 'iterations'):
            task.iterations = []
        
        task.iterations.append(iteration)
        task.status = "in_progress"
        task.updated_at = datetime.now().isoformat()
        
        try:
            # Takımdaki ilk ajanı al
            team = self.teams[task.team_id]
            agents = [agent for agent in self.get_team_agents(task.team_id)]
            
            if not agents:
                return {"error": "Takımda ajan yok"}
                
            agent = agents[0]
            
            # Geri bildirim ile birlikte prompt oluştur
            prompt = f"""
            # ÖNCEKİ ÇÖZÜM
            
            {previous_result}
            
            # GERİ BİLDİRİM
            
            {feedback or "Bu çözümü geliştir ve daha ayrıntılı açıkla."}
            
            # YENİ ÇÖZÜM
            
            Önceki çözümü geri bildirim doğrultusunda geliştir.
            """
            
            # Ajanın modeli ile metin üret
            result = await self.model_adapter.generate(
                model=agent.model,
                prompt=prompt,
                system_prompt=f"Sen {agent.role} rolünde bir uzmansın. Önceki çözümü geri bildirim doğrultusunda geliştir."
            )
            
            # Sonucu kaydet
            iteration["new_result"] = result
            task.result = result  # En son sonucu ana sonuç olarak güncelle
            task.status = "completed"
            task.updated_at = datetime.now().isoformat()
            
            return {
                "success": True,
                "message": "Görev başarıyla yinelendi",
                "result": result
            }
            
        except Exception as e:
            # Hata durumunda
            task.status = "failed"
            task.updated_at = datetime.now().isoformat()
            
            return {
                "success": False,
                "message": f"Görev yinelemesi başarısız oldu: {str(e)}",
                "error": str(e)
            }

    @property
    def model_adapter(self):
        """Model adaptörünü döndürür"""
        if self.ollama_adapter:
            return self.ollama_adapter
        raise ValueError("Model adapter not initialized")

    # Görev izleme metodu ekle
    async def _task_monitor(self, task_id: str, interval_seconds: int = 10, timeout_minutes: int = 30) -> None:
        """Görevi belirli aralıklarla kontrol eder ve hala çalışıp çalışmadığını doğrular"""
        if task_id not in self.tasks:
            logger.warning(f"İzlenecek görev bulunamadı: {task_id}")
            return
        
        if task_id not in self.active_tasks:
            logger.warning(f"Görev {task_id} aktif görevler listesinde değil")
            return
        
        task = self.tasks[task_id]
        timeout_seconds = timeout_minutes * 60
        elapsed_seconds = 0
        
        try:
            while task_id in self.active_tasks and elapsed_seconds < timeout_seconds:
                await asyncio.sleep(interval_seconds)
                elapsed_seconds += interval_seconds
                
                # Görev hala aktif görevler listesinde mi kontrol et
                if task_id not in self.active_tasks:
                    logger.info(f"Görev {task_id} artık aktif değil, izleme sonlandırılıyor")
                    return
                
                try:
                    # Görevi kontrol et
                    active_info = self.active_tasks[task_id]
                    last_update = datetime.fromisoformat(active_info["last_update"])
                    current_time = datetime.now()
                    
                    # Son güncellemeden bu yana 2 dakikadan fazla zaman geçti mi?
                    if (current_time - last_update).total_seconds() > 120:
                        # Heartbeat kontrolü yap
                        if not active_info["heartbeat"]:
                            # İki kez üst üste heartbeat alamadık, görev takılmış olabilir
                            logger.warning(f"Görev {task_id} yanıt vermiyor, durduruluyor...")
                            
                            # Görevin durumunu güncelle
                            task.status = "failed"
                            task.updated_at = datetime.now().isoformat()
                            task.logs.append({
                                'timestamp': datetime.now().isoformat(),
                                'message': 'HATA: Görev yanıt vermiyor, otomatik olarak durduruldu.'
                            })
                            self.save_data()
                            
                            # Aktif görevlerden kaldır
                            if task_id in self.active_tasks:
                                del self.active_tasks[task_id]
                            
                            return
                        
                        # Heartbeat'i sıfırla
                        active_info["heartbeat"] = False
                except KeyError as ke:
                    logger.error(f"Görev izleme sırasında KeyError: {ke}. Görev ID: {task_id}")
                    # Görev aktif görevlerden çıkarılmış olabilir, izlemeyi sonlandır
                    return
                except Exception as e:
                    logger.error(f"Görev izleme sırasında hata: {e}. Görev ID: {task_id}")
                    # Kritik bir hata oluştu, ama izlemeye devam et
            
            # Timeout kontrolü
            if task_id in self.active_tasks and elapsed_seconds >= timeout_seconds:
                logger.warning(f"Görev {task_id} zaman aşımına uğradı, durduruluyor...")
                
                try:
                    # Görevin durumunu güncelle
                    task = self.tasks[task_id]
                    if task.status == "in_progress":
                        task.status = "failed"
                        task.updated_at = datetime.now().isoformat()
                        task.logs.append({
                            'timestamp': datetime.now().isoformat(),
                            'message': f'HATA: Görev {timeout_minutes} dakika içinde tamamlanamadı ve zaman aşımına uğradı.'
                        })
                        self.save_data()
                    
                    # Aktif görevlerden kaldır
                    if task_id in self.active_tasks:
                        del self.active_tasks[task_id]
                except Exception as e:
                    logger.error(f"Görev zaman aşımı işlemi sırasında hata: {e}. Görev ID: {task_id}")
        except Exception as e:
            logger.error(f"Görev izleme döngüsünde beklenmeyen hata: {e}. Görev ID: {task_id}")
            # Hata durumunda temizlik yap
            try:
                if task_id in self.active_tasks:
                    del self.active_tasks[task_id]
            except:
                pass

    # Görev durumu güncelleme metodu
    def update_task_progress(self, task_id: str, progress: int, status_message: str) -> bool:
        """Görevin ilerleme durumunu günceller ve son güncelleme zamanını yeniler"""
        if task_id not in self.tasks or task_id not in self.active_tasks:
            return False
        
        task = self.tasks[task_id]
        
        # İlerleme durumunu güncelle
        task.progress = progress
        task.status_message = status_message
        task.updated_at = datetime.now().isoformat()
        
        # Log ekle
        task.logs.append({
            'timestamp': datetime.now().isoformat(),
            'message': f'İlerleme: {status_message} (%{progress})'
        })
        
        # Aktif görev bilgisini güncelle
        self.active_tasks[task_id]["last_update"] = datetime.now().isoformat()
        self.active_tasks[task_id]["heartbeat"] = True
        
        self.save_data()
        return True

    # Görev tamamlama metodu
    def complete_task(self, task_id: str, result: str) -> bool:
        """Görevi başarıyla tamamlar"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        
        # Görev sonucunu kaydet
        task.result = result
        task.status = "completed"
        task.progress = 100
        task.status_message = "Tamamlandı"
        task.updated_at = datetime.now().isoformat()
        task.is_active = False  # Görev artık aktif değil
        
        # Log ekle - tamamlandı bildirimini kaldırdık
        task.logs.append({
            'timestamp': datetime.now().isoformat(),
            'message': 'Görev tamamlandı.'
        })
        
        # Aktif görevlerden kaldır
        if task_id in self.active_tasks:
            del self.active_tasks[task_id]
        
        self.save_data()
        return True

    # Görev başarısız olarak işaretleme metodu
    def fail_task(self, task_id: str, error_message: str) -> bool:
        """Görevi başarısız olarak işaretler"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        
        # Görevi başarısız olarak işaretle
        task.status = "failed"
        task.status_message = "Başarısız: " + error_message
        task.updated_at = datetime.now().isoformat()
        task.is_active = False  # Görev artık aktif değil
        
        # Log ekle
        task.logs.append({
            'timestamp': datetime.now().isoformat(),
            'message': f'HATA: {error_message}'
        })
        
        # Aktif görevlerden kaldır
        if task_id in self.active_tasks:
            del self.active_tasks[task_id]
        
        self.save_data()
        return True

    # Görev durum kontrolü
    def check_task_status(self, task_id: str) -> Dict:
        """Görevin güncel durumunu döndürür"""
        if task_id not in self.tasks:
            return {"error": "Görev bulunamadı"}
        
        task = self.tasks[task_id]
        is_active = task_id in self.active_tasks
        
        # task.is_active özelliğini güncelle
        task.is_active = is_active
        
        # Log kayıtları için alanı kontrol et
        if not hasattr(task, 'logs'):
            task.logs = []
        
        return {
            "id": task_id,
            "status": task.status,
            "progress": task.progress if hasattr(task, "progress") else 0,
            "status_message": task.status_message if hasattr(task, "status_message") else "",
            "is_active": is_active,
            "logs": task.logs,
            "last_update": task.updated_at
        }

    # Aktif görevleri listele
    def list_active_tasks(self) -> List[Dict]:
        """Sistemdeki aktif görevleri listeler"""
        active_task_details = []
        
        for task_id in self.active_tasks:
            if task_id in self.tasks:
                task = self.tasks[task_id]
                active_info = self.active_tasks[task_id]
                
                active_task_details.append({
                    "id": task_id,
                    "title": task.title,
                    "status": task.status,
                    "progress": task.progress if hasattr(task, "progress") else 0,
                    "status_message": task.status_message if hasattr(task, "status_message") else "",
                    "start_time": active_info["start_time"],
                    "last_update": active_info["last_update"],
                    "team_id": task.team_id
                })
        
        return active_task_details

    # Görevi iptal et
    def cancel_task(self, task_id: str) -> bool:
        """Çalışan bir görevi iptal eder"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        
        # Görevi iptal et
        if task.status == "in_progress":
            task.status = "cancelled"
            task.updated_at = datetime.now().isoformat()
            
            # logs özelliği yoksa ekle
            if not hasattr(task, 'logs'):
                task.logs = []
            
            # Log ekle
            task.logs.append({
                'timestamp': datetime.now().isoformat(),
                'message': 'Görev kullanıcı tarafından iptal edildi.'
            })
            
            # Aktif görevlerden kaldır
            if task_id in self.active_tasks:
                del self.active_tasks[task_id]
            
            self.save_data()
            return True
        
        return False 
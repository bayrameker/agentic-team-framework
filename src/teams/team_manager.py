import asyncio
import json
import os
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from pydantic import BaseModel, Field

from src.agents.agent import Agent, ROLE_SYSTEM_PROMPTS, create_agent_from_config, generate_agent_id
from src.models.base import ModelCapability
from src.models.ollama import OllamaAdapter, get_model_info_from_map
from src.models.team import AgentConfig, AgentRole, SubTask, Task, TeamConfig, TeamType, TaskStatus


class TeamManager:
    """Ekip yönetimi ve görev atama sınıfı"""

    def __init__(self, ollama_adapter: OllamaAdapter):
        self.ollama_adapter = ollama_adapter
        self.teams: Dict[str, Dict[str, Any]] = {}  # team_id -> team bilgileri
        self.agents: Dict[str, Agent] = {}  # agent_id -> Agent nesnesi
        self.tasks: Dict[str, Task] = {}  # task_id -> Task nesnesi
        self.subtasks: Dict[str, SubTask] = {}  # subtask_id -> SubTask nesnesi
        self.available_models: List[str] = []
        
        # Mevcut modelleri yükle
        self._load_available_models()

    def _load_available_models(self) -> None:
        """Kullanılabilir modelleri çevre değişkeninden yükler"""
        models_str = os.getenv("AVAILABLE_MODELS", "")
        if models_str:
            self.available_models = [model.strip() for model in models_str.split(",")]
        
    async def refresh_available_models(self) -> List[str]:
        """Mevcut modelleri Ollama'dan sorgular ve günceller"""
        try:
            self.available_models = await self.ollama_adapter.list_models()
            return self.available_models
        except Exception as e:
            print(f"Modeller yüklenirken hata oluştu: {e}")
            return self.available_models

    def create_team(
        self, 
        name: str, 
        team_type: TeamType, 
        description: Optional[str] = None
    ) -> str:
        """Yeni bir ekip oluşturur"""
        team_id = f"team-{uuid.uuid4().hex[:8]}"
        
        team_config = TeamConfig(
            id=team_id,
            name=name,
            type=team_type,
            description=description,
            agents=[]
        )
        
        self.teams[team_id] = {
            "config": team_config,
            "agent_instances": {}
        }
        
        return team_id

    def add_agent_to_team(
        self,
        team_id: str,
        name: str,
        role: AgentRole,
        model_name: str,
        system_prompt: Optional[str] = None,
        required_capabilities: Optional[Set[ModelCapability]] = None
    ) -> str:
        """Ekibe yeni bir ajan ekler"""
        if team_id not in self.teams:
            raise ValueError(f"Ekip bulunamadı: {team_id}")
            
        if model_name not in self.available_models:
            available_models_str = ", ".join(self.available_models)
            raise ValueError(f"Model mevcut değil. Mevcut modeller: {available_models_str}")
        
        # Rolün varsayılan sistem komutunu kullan veya özel komutu al
        if system_prompt is None:
            system_prompt = ROLE_SYSTEM_PROMPTS.get(
                role, 
                f"Sen {role.value} rolünde profesyonel bir uzmansın. Görevleri analiz eder ve yüksek kalitede sonuçlar üretirsin."
            )
        
        # Rol için gerekli yetenekler yoksa varsayılan değerleri belirle
        if required_capabilities is None:
            required_capabilities = set()
            if role == AgentRole.DEVELOPER:
                required_capabilities = {ModelCapability.CODING, ModelCapability.REASONING}
            elif role == AgentRole.TESTER:
                required_capabilities = {ModelCapability.TESTING, ModelCapability.REASONING}
            elif role == AgentRole.DESIGNER:
                required_capabilities = {ModelCapability.CREATIVITY, ModelCapability.REASONING}
            elif role == AgentRole.MARKETING_SPECIALIST:
                required_capabilities = {ModelCapability.MARKETING, ModelCapability.CREATIVITY}
            elif role == AgentRole.TECHNICAL_WRITER:
                required_capabilities = {ModelCapability.LINGUISTICS, ModelCapability.SUMMARIZATION}
            else:
                # Varsayılan olarak mantıksal düşünme yeteneği gerekli
                required_capabilities = {ModelCapability.REASONING}
        
        agent_id = generate_agent_id()
        
        agent_config = AgentConfig(
            id=agent_id,
            name=name,
            role=role,
            model_name=model_name,
            system_prompt=system_prompt,
            required_capabilities=required_capabilities
        )
        
        # Ajan nesnesini oluştur
        agent = create_agent_from_config(agent_config, self.ollama_adapter)
        
        # Ekip yapılandırmasına ekle
        team_config = self.teams[team_id]["config"]
        team_config.agents.append(agent_config)
        
        # Agent nesnelerini kaydet
        self.agents[agent_id] = agent
        self.teams[team_id]["agent_instances"][agent_id] = agent
        
        return agent_id

    def get_team(self, team_id: str) -> Optional[TeamConfig]:
        """Ekip yapılandırmasını döndürür"""
        if team_id in self.teams:
            return self.teams[team_id]["config"]
        return None

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Ajan nesnesini döndürür"""
        return self.agents.get(agent_id)

    def create_task(
        self, 
        title: str, 
        description: str, 
        team_id: str
    ) -> str:
        """Yeni bir görev oluşturur"""
        if team_id not in self.teams:
            raise ValueError(f"Ekip bulunamadı: {team_id}")
            
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        
        task = Task(
            id=task_id,
            title=title,
            description=description,
            team_id=team_id
        )
        
        self.tasks[task_id] = task
        return task_id

    def create_subtask(
        self,
        parent_task_id: str,
        title: str,
        description: str,
        assigned_agent_id: Optional[str] = None,
        dependencies: Optional[List[str]] = None
    ) -> str:
        """Alt görev oluşturur"""
        if parent_task_id not in self.tasks:
            raise ValueError(f"Üst görev bulunamadı: {parent_task_id}")
        
        if assigned_agent_id and assigned_agent_id not in self.agents:
            raise ValueError(f"Ajan bulunamadı: {assigned_agent_id}")
            
        subtask_id = f"subtask-{uuid.uuid4().hex[:8]}"
        
        subtask = SubTask(
            id=subtask_id,
            parent_task_id=parent_task_id,
            title=title,
            description=description,
            assigned_agent_id=assigned_agent_id,
            dependencies=dependencies or []
        )
        
        self.subtasks[subtask_id] = subtask
        
        # Üst görev için alt görev atamalarını güncelle
        task = self.tasks[parent_task_id]
        if task.agent_assignments is None:
            task.agent_assignments = {}
            
        if assigned_agent_id:
            if assigned_agent_id not in task.agent_assignments:
                task.agent_assignments[assigned_agent_id] = []
            task.agent_assignments[assigned_agent_id].append(subtask_id)
            
        return subtask_id

    async def execute_task(self, task_id: str) -> Dict[str, Any]:
        """Görevi yürütür"""
        if task_id not in self.tasks:
            raise ValueError(f"Görev bulunamadı: {task_id}")
            
        task = self.tasks[task_id]
        team_id = task.team_id
        
        if team_id not in self.teams:
            raise ValueError(f"Ekip bulunamadı: {team_id}")
        
        # Görevi başladı olarak işaretle
        task.status = TaskStatus.IN_PROGRESS
        
        # Ekibe atanmış alt görevleri çıkar
        team_subtasks = [
            st for st in self.subtasks.values() 
            if st.parent_task_id == task_id
        ]
        
        # Alt görev yoksa, otomatik olarak görev tanımına dayalı alt görevler oluştur
        if not team_subtasks:
            await self._auto_create_subtasks(task)
            team_subtasks = [
                st for st in self.subtasks.values() 
                if st.parent_task_id == task_id
            ]
        
        # Bağımlılık yapısına göre alt görevleri sırala
        sorted_subtasks = self._sort_subtasks_by_dependencies(team_subtasks)
        
        # Tüm alt görevleri yürüt
        results = {}
        for subtask in sorted_subtasks:
            subtask_result = await self._execute_subtask(subtask)
            results[subtask.id] = subtask_result
        
        # Tüm sonuçları birleştir
        final_result = self._combine_results(task, results)
        task.result = final_result
        task.status = TaskStatus.COMPLETED
        
        return {
            "task_id": task_id,
            "status": task.status,
            "result": task.result,
            "subtask_results": results
        }

    async def _auto_create_subtasks(self, task: Task) -> None:
        """Görev tanımına dayalı alt görevler oluşturur"""
        team_config = self.teams[task.team_id]["config"]
        
        # Ekipteki tüm ajanlar için alt görevler oluştur
        for agent_config in team_config.agents:
            agent_id = agent_config.id
            role_name = agent_config.role.value.replace("_", " ").capitalize()
            
            subtask_title = f"{task.title} - {role_name} işi"
            subtask_description = f"{task.description}\n\n{role_name} perspektifi ile bu görevi ele al."
            
            self.create_subtask(
                parent_task_id=task.id,
                title=subtask_title,
                description=subtask_description,
                assigned_agent_id=agent_id
            )

    async def _execute_subtask(self, subtask: SubTask) -> str:
        """Alt görevi yürütür"""
        if not subtask.assigned_agent_id:
            return "Bu alt görev hiçbir ajana atanmamış."
            
        agent = self.agents.get(subtask.assigned_agent_id)
        if not agent:
            return f"Ajan bulunamadı: {subtask.assigned_agent_id}"
            
        # Bağımlılıkları kontrol et
        all_dependencies_completed = True
        pending_dependencies = []
        
        for dep_id in subtask.dependencies:
            dep_subtask = self.subtasks.get(dep_id)
            if not dep_subtask:
                continue
                
            if dep_subtask.status != TaskStatus.COMPLETED:
                all_dependencies_completed = False
                pending_dependencies.append(dep_id)
        
        if not all_dependencies_completed:
            # Uyarı döndür, ancak görevin çalıştırılmasını engelleme
            warning = f"Uyarı: {len(pending_dependencies)} bağımlılık henüz tamamlanmadı: {', '.join(pending_dependencies)}. Yine de görev yürütülecek."
            print(warning)
            
        # Alt görevi devam ediyor olarak işaretle
        subtask.status = TaskStatus.IN_PROGRESS
        print(f"Alt görev çalıştırılıyor: {subtask.title} (Ajan: {agent.name})")
        
        try:
            # Alt görevi işle
            result = await agent.process_task(subtask)
            
            # Alt görevi tamamlandı olarak işaretle
            subtask.status = TaskStatus.COMPLETED
            subtask.result = result
            
            return result
        except Exception as e:
            # Hata durumunda
            subtask.status = TaskStatus.FAILED
            error_msg = f"Hata: {str(e)}"
            subtask.result = error_msg
            print(error_msg)
            return error_msg

    def _combine_results(self, task: Task, subtask_results: Dict[str, str]) -> str:
        """Alt görev sonuçlarını birleştirir"""
        combined = f"# {task.title} - Sonuçlar\n\n"
        
        for subtask_id, result in subtask_results.items():
            subtask = self.subtasks.get(subtask_id)
            if not subtask:
                continue
                
            agent = self.agents.get(subtask.assigned_agent_id) if subtask.assigned_agent_id else None
            agent_info = f"{agent.name} ({agent.role.value})" if agent else "Atanmamış"
            
            combined += f"## {subtask.title}\n\n"
            combined += f"**Ajan:** {agent_info}\n\n"
            combined += f"{result}\n\n---\n\n"
            
        return combined

    async def iterate_on_task(self, task_id: str, feedback: str) -> Dict[str, Any]:
        """Geri bildirim ile görevi yineler"""
        if task_id not in self.tasks:
            raise ValueError(f"Görev bulunamadı: {task_id}")
            
        task = self.tasks[task_id]
        
        if not task.result:
            raise ValueError("Görev henüz hiç sonuç üretmemiş. Önce 'execute_task' yöntemini çağırın.")
            
        # İterasyon sayısını artır
        task.iterations += 1
        
        # Geribildirim ekle
        task.feedback = feedback
        
        # Görevi iyileştirmek için yeni bir prompt oluştur
        improvement_prompt = f"""# İyileştirme İsteği
        
## Orijinal Görev
{task.title}

{task.description}

## Mevcut Çözüm
{task.result}

## Geri Bildirim
{feedback}

## İstek
Lütfen geri bildirimi dikkate alarak mevcut çözümü iyileştir ve güncellenmiş bir çözüm sağla.
"""
        
        # En yetenekli ajanı seç (basit yaklaşım)
        team_config = self.teams[task.team_id]["config"]
        selected_agent = None
        
        # Önce mimar veya ürün yöneticisi var mı diye bak
        for role in [AgentRole.ARCHITECT, AgentRole.PRODUCT_MANAGER]:
            agents = team_config.get_agents_by_role(role)
            if agents:
                selected_agent = self.agents[agents[0].id]
                break
                
        # Yoksa herhangi bir ajanı seç
        if not selected_agent and team_config.agents:
            selected_agent = self.agents[team_config.agents[0].id]
            
        if not selected_agent:
            raise ValueError("Ekipte iyileştirme yapabilecek ajan bulunamadı.")
            
        # İyileştirme isteğini işle
        selected_agent.conversation.add_message("user", improvement_prompt)
        
        improved_result = await selected_agent.ollama_adapter.generate(
            model_name=selected_agent.model_name,
            prompt="",
            conversation=selected_agent.conversation,
            temperature=0.7
        )
        
        selected_agent.conversation.add_message("assistant", improved_result)
        
        # Görevi güncelle
        task.result = improved_result
        
        return {
            "task_id": task_id,
            "iteration": task.iterations,
            "result": improved_result,
            "agent_id": selected_agent.id,
            "agent_name": selected_agent.name
        }

    async def get_model_capabilities(self, model_name: str) -> Dict[str, float]:
        """Model yeteneklerini döndürür"""
        # Model bilgisi al
        model_info = get_model_info_from_map(model_name)
        
        # Yeteneklerini çıkar
        capabilities = {
            cap.value: model_info.capability_scores.get(cap, 0.0) 
            for cap in ModelCapability
        }
        
        return capabilities 

    def _sort_subtasks_by_dependencies(self, subtasks: List[SubTask]) -> List[SubTask]:
        """Bağımlılıklara göre alt görevleri sıralar"""
        result = []
        processed_ids = set()
        
        def process_subtask(subtask):
            if subtask.id in processed_ids:
                return
            
            # Önce bağımlılıkları işle
            for dep_id in subtask.dependencies:
                for st in subtasks:
                    if st.id == dep_id:
                        process_subtask(st)
            
            if subtask.id not in processed_ids:
                result.append(subtask)
                processed_ids.add(subtask.id)
        
        # Tüm alt görevleri işle
        for subtask in subtasks:
            process_subtask(subtask)
            
        return result 
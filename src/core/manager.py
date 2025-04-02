import asyncio
import json
import os
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from pydantic import BaseModel, Field

from src.agents.agent import Agent, ROLE_SYSTEM_PROMPTS, create_agent_from_config
from src.models.base import ModelCapability
from src.models.ollama import OllamaAdapter, get_model_info_from_map
from src.models.team import AgentConfig, AgentRole, SubTask, Task, TeamConfig, TeamType
from src.utils.helpers import generate_id, load_env_models


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
        self.available_models = load_env_models()
        
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
        team_id = generate_id("team")
        
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
            
        if not model_name in self.available_models:
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
        
        agent_id = generate_id("agent")
        
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
            
        task_id = generate_id("task")
        
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
            
        subtask_id = generate_id("subtask")
        
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
        
        # Görevi henüz başlamadı olarak işaretle
        task.status = "in_progress"
        
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
        
        # Tüm alt görevleri yürüt
        results = {}
        for subtask in team_subtasks:
            subtask_result = await self._execute_subtask(subtask)
            results[subtask.id] = subtask_result
        
        # Tüm sonuçları birleştir
        final_result = self._combine_results(task, results)
        task.result = final_result
        task.status = "completed"
        
        return {
            "task_id": task_id,
            "status": task.status,
            "result": task.result,
            "subtask_results": results
        }

    async def _auto_create_subtasks(self, task: Task) -> None:
        """Göreve dayalı olarak otomatik alt görevler oluşturur"""
        team_config = self.teams[task.team_id]["config"]
        agents = team_config.agents
        
        # Ekipteki her rol için otomatik bir alt görev oluştur
        for agent_config in agents:
            subtask_title = f"{agent_config.role.value.capitalize()} görevi"
            subtask_description = f"{task.description}\n\nBu alt görevi {agent_config.role.value} olarak tamamlayın."
            
            self.create_subtask(
                parent_task_id=task.id,
                title=subtask_title,
                description=subtask_description,
                assigned_agent_id=agent_config.id
            )

    async def _execute_subtask(self, subtask: SubTask) -> str:
        """Alt görevi yürütür"""
        if not subtask.assigned_agent_id:
            raise ValueError(f"Alt görev hiçbir ajana atanmamış: {subtask.id}")
            
        agent = self.agents.get(subtask.assigned_agent_id)
        if not agent:
            raise ValueError(f"Ajan bulunamadı: {subtask.assigned_agent_id}")
        
        # Bağımlılıkları kontrol et
        for dep_id in subtask.dependencies:
            dep_subtask = self.subtasks.get(dep_id)
            if not dep_subtask or dep_subtask.status != "completed":
                raise ValueError(f"Bağımlı alt görev tamamlanmamış: {dep_id}")
        
        # Alt görevi yürüt
        subtask.status = "in_progress"
        result = await agent.process_task(subtask)
        subtask.result = result
        subtask.status = "completed"
        
        return result

    def _combine_results(self, task: Task, subtask_results: Dict[str, str]) -> str:
        """Alt görev sonuçlarını birleştirir"""
        combined = f"## {task.title} - Birleştirilmiş Sonuçlar\n\n"
        
        # Tüm alt görev sonuçlarını ekle
        for subtask_id, result in subtask_results.items():
            subtask = self.subtasks[subtask_id]
            agent = self.agents.get(subtask.assigned_agent_id) if subtask.assigned_agent_id else None
            
            combined += f"### {subtask.title}"
            if agent:
                combined += f" ({agent.name} - {agent.role.value})"
            combined += "\n\n"
            combined += result
            combined += "\n\n---\n\n"
            
        return combined

    async def iterate_on_task(self, task_id: str, feedback: str) -> Dict[str, Any]:
        """Görevi geribildirime göre yeniden çalıştırır"""
        if task_id not in self.tasks:
            raise ValueError(f"Görev bulunamadı: {task_id}")
            
        task = self.tasks[task_id]
        
        # Geribildirim ekle
        task.feedback = feedback
        task.iterations += 1
        
        # Alt görevlerin durumunu sıfırla
        for subtask_id in self.subtasks:
            subtask = self.subtasks[subtask_id]
            if subtask.parent_task_id == task_id:
                # Sonuçları koru ama durumu sıfırla
                subtask.status = "pending"
        
        # Görevi tekrar yürüt
        return await self.execute_task(task_id)

    async def get_model_capabilities(self, model_name: str) -> Dict[str, float]:
        """Model yeteneklerini döndürür"""
        model_info = get_model_info_from_map(model_name)
        return {cap.value: score for cap, score in model_info.capability_scores.items()}
    
    def get_all_teams(self) -> Dict[str, Dict[str, Any]]:
        """Tüm ekiplerin özet bilgilerini döndürür"""
        teams_info = {}
        for team_id, team_data in self.teams.items():
            teams_info[team_id] = {
                "id": team_id,
                "name": team_data["config"].name,
                "type": team_data["config"].type.value,
                "description": team_data["config"].description,
                "agent_count": len(team_data["config"].agents)
            }
        return teams_info
    
    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """Tüm görevlerin özet bilgilerini döndürür"""
        tasks_info = {}
        for task_id, task in self.tasks.items():
            tasks_info[task_id] = {
                "id": task_id,
                "title": task.title,
                "status": task.status,
                "team_id": task.team_id,
                "iterations": task.iterations
            }
        return tasks_info
    
    def get_task_details(self, task_id: str) -> Dict[str, Any]:
        """Belirli bir görevin detaylı bilgilerini döndürür"""
        if task_id not in self.tasks:
            raise ValueError(f"Görev bulunamadı: {task_id}")
            
        task = self.tasks[task_id]
        
        # Alt görevleri ekle
        subtasks = []
        for subtask_id, subtask in self.subtasks.items():
            if subtask.parent_task_id == task_id:
                agent = self.agents.get(subtask.assigned_agent_id) if subtask.assigned_agent_id else None
                agent_name = agent.name if agent else "Atanmamış"
                agent_role = agent.role.value if agent else "Bilinmiyor"
                
                subtasks.append({
                    "id": subtask.id,
                    "title": subtask.title,
                    "status": subtask.status,
                    "assigned_agent_id": subtask.assigned_agent_id,
                    "agent_name": agent_name,
                    "agent_role": agent_role
                })
        
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "team_id": task.team_id,
            "team_name": self.teams[task.team_id]["config"].name if task.team_id in self.teams else "Bilinmiyor",
            "iterations": task.iterations,
            "feedback": task.feedback,
            "result": task.result,
            "subtasks": subtasks
        }
    
    def delete_team(self, team_id: str) -> bool:
        """Bir ekibi ve ilişkili tüm ajanları siler"""
        if team_id not in self.teams:
            return False
        
        # Önce ilişkili ajanları sil
        agents_to_delete = []
        for agent_id, agent in self.agents.items():
            if agent_id in self.teams[team_id]["agent_instances"]:
                agents_to_delete.append(agent_id)
        
        for agent_id in agents_to_delete:
            del self.agents[agent_id]
        
        # Ekibi sil
        del self.teams[team_id]
        return True
    
    def delete_task(self, task_id: str) -> bool:
        """Bir görevi ve ilişkili tüm alt görevleri siler"""
        if task_id not in self.tasks:
            return False
        
        # Önce ilişkili alt görevleri sil
        subtasks_to_delete = []
        for subtask_id, subtask in self.subtasks.items():
            if subtask.parent_task_id == task_id:
                subtasks_to_delete.append(subtask_id)
        
        for subtask_id in subtasks_to_delete:
            del self.subtasks[subtask_id]
        
        # Görevi sil
        del self.tasks[task_id]
        return True 
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from src.schemas import AgentCreate, AgentResponse
from src.services import TeamManager
from src.utils import get_team_manager
from src.utils import logger

router = APIRouter()

@router.post("/{team_id}/agents/add", response_model=AgentResponse)
async def add_agent_to_team(team_id: str, agent: AgentCreate, team_manager: TeamManager = Depends(get_team_manager)):
    """Takıma ajan ekler"""
    try:
        agent_id = team_manager.add_agent_to_team(
            team_id=team_id,
            name=agent.name,
            role=agent.role,
            model_name=agent.model
        )
        
        # Ajanı bul
        agent_obj = None
        for a in team_manager.teams[team_id].agents:
            if a.id == agent_id:
                agent_obj = a
                break
        
        if not agent_obj:
            raise HTTPException(status_code=404, detail="Eklenen ajan bulunamadı")
            
        return {"id": agent_id, "name": agent_obj.name, "role": agent_obj.role, "model": agent_obj.model}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Ajan eklenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ajan eklenemedi: {str(e)}") 
import React from 'react';
import { Link } from 'react-router-dom';

function TeamCard({ team }) {
  return (
    <div className="team-card card h-100 shadow-sm border-0 animate__animated animate__fadeIn">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0 fw-bold">
            <i className="bi bi-people-fill text-primary me-2"></i>
            {team.name}
          </h5>
          <span className="badge bg-primary-light text-primary rounded-pill">
            {team.agents ? team.agents.length : 0} Ajan
          </span>
        </div>
        
        <p className="card-text text-muted mb-3">{team.description || "Bu takım için açıklama bulunmuyor."}</p>
        
        {team.agents && team.agents.length > 0 ? (
          <div className="mb-3">
            <h6 className="card-subtitle mb-2 text-muted fw-bold">
              <i className="bi bi-robot me-1"></i> Ajanlar
            </h6>
            <div className="agent-list">
              {team.agents.slice(0, 3).map((agent, index) => (
                <div key={index} className="agent-item mb-2 d-flex align-items-center">
                  <div className="agent-icon me-2">
                    <i className="bi bi-cpu-fill text-secondary"></i>
                  </div>
                  <div>
                    <div className="agent-name fw-medium">{agent.name}</div>
                    <div className="agent-role small text-muted">{agent.role}</div>
                  </div>
                </div>
              ))}
              {team.agents.length > 3 && (
                <div className="text-muted small">+{team.agents.length - 3} daha fazla ajan</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-muted fst-italic mb-3">Henüz ajan eklenmemiş</div>
        )}
        
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="text-muted small">
            <i className="bi bi-calendar3 me-1"></i> 
            {new Date(team.created_at || Date.now()).toLocaleDateString('tr-TR')}
          </span>
          <Link to={`/teams/${team.id}`} className="btn btn-sm btn-primary">
            <i className="bi bi-eye me-1"></i> Detaylar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TeamCard; 
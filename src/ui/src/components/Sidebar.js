import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ models, teams, tasks, loading }) {
  const location = useLocation();
  
  // Aktif link kontrolü
  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active fw-bold bg-light' : '';
  };
  
  return (
    <div className="sidebar-sticky p-3">
      {/* Takımlar Bölümü */}
      <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-2 mb-2 text-muted">
        <span>Takımlar</span>
        <Link to="/teams" className="text-decoration-none" title="Tüm takımları görüntüle">
          <i className="bi bi-people"></i>
        </Link>
      </h6>
      <ul className="nav flex-column mb-3">
        {loading ? (
          <li className="nav-item">
            <span className="nav-link text-muted">
              <i className="bi bi-hourglass me-2"></i>
              Yükleniyor...
            </span>
          </li>
        ) : teams && teams.length > 0 ? (
          teams.slice(0, 5).map((team) => (
            <li className="nav-item" key={team.id}>
              <Link to={`/teams/${team.id}`} className={`nav-link text-truncate ${isActive(`/teams/${team.id}`)}`}>
                <i className="bi bi-people-fill me-2"></i>
                {team.name}
              </Link>
            </li>
          ))
        ) : (
          <li className="nav-item">
            <span className="nav-link text-muted">
              <i className="bi bi-info-circle me-2"></i>
              Takım bulunmuyor
            </span>
          </li>
        )}
        <li className="nav-item mt-1">
          <Link to="/teams" className={`nav-link text-primary ${isActive('/teams')}`}>
            <i className="bi bi-arrow-right-circle me-2"></i>
            Tümünü Gör
          </Link>
        </li>
      </ul>
      
      {/* Görevler Bölümü */}
      <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-3 mb-2 text-muted">
        <span>Görevler</span>
        <Link to="/tasks" className="text-decoration-none" title="Tüm görevleri görüntüle">
          <i className="bi bi-list-task"></i>
        </Link>
      </h6>
      <ul className="nav flex-column mb-3">
        {loading ? (
          <li className="nav-item">
            <span className="nav-link text-muted">
              <i className="bi bi-hourglass me-2"></i>
              Yükleniyor...
            </span>
          </li>
        ) : tasks && tasks.length > 0 ? (
          tasks.slice(0, 5).map((task) => (
            <li className="nav-item" key={task.id}>
              <Link to={`/tasks/${task.id}`} className={`nav-link text-truncate ${isActive(`/tasks/${task.id}`)}`}>
                <i className="bi bi-check2-square me-2"></i>
                {task.title}
              </Link>
            </li>
          ))
        ) : (
          <li className="nav-item">
            <span className="nav-link text-muted">
              <i className="bi bi-info-circle me-2"></i>
              Görev bulunmuyor
            </span>
          </li>
        )}
        <li className="nav-item mt-1">
          <Link to="/tasks" className={`nav-link text-primary ${isActive('/tasks')}`}>
            <i className="bi bi-arrow-right-circle me-2"></i>
            Tümünü Gör
          </Link>
        </li>
      </ul>
      
      {/* Modeller Bölümü */}
      <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-3 mb-2 text-muted">
        <span>Modeller</span>
        <i className="bi bi-cpu"></i>
      </h6>
      <ul className="nav flex-column">
        {models && models.length > 0 ? (
          models.slice(0, 5).map((model, index) => (
            <li className="nav-item" key={index}>
              <span className="nav-link text-truncate">
                <i className="bi bi-cpu-fill me-2 text-success"></i>
                {model}
              </span>
            </li>
          ))
        ) : (
          <li className="nav-item">
            <span className="nav-link text-muted">
              <i className="bi bi-hourglass me-2"></i>
              Model yükleniyor...
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar; 
import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { taskId } = useParams();
  
  // Geçerli sayfanın aktif olup olmadığını kontrol et
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  const isTaskPage = location.pathname.includes('/tasks/');
  const currentTaskId = taskId || location.pathname.split('/').pop();
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-robot me-2"></i>
          Agentic Teams
        </Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/')}`} to="/">
                <i className="bi bi-house-door me-1"></i> Ana Sayfa
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/teams')}`} to="/teams">
                <i className="bi bi-people me-1"></i> Takımlar
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/tasks')}`} to="/tasks">
                <i className="bi bi-list-task me-1"></i> Görevler
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/agents')}`} to="/agents">
                <i className="bi bi-person-badge me-1"></i> Ajanlar
              </Link>
            </li>
            
            {isTaskPage && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive(`/code-base/${currentTaskId}`)}`} to={`/code-base/${currentTaskId}`}>
                    <i className="bi bi-code-slash me-1"></i> Kod Temeli
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive(`/code-output/${currentTaskId}`)}`} to={`/code-output/${currentTaskId}`}>
                    <i className="bi bi-terminal me-1"></i> Çıktılar
                  </Link>
                </li>
              </>
            )}
          </ul>
          
          <form className="d-flex">
            <input 
              className="form-control me-2" 
              type="search" 
              placeholder="Ara..." 
              aria-label="Search"
            />
            <button className="btn btn-outline-light" type="submit">Ara</button>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
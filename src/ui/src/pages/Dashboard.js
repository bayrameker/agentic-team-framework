import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard({ teams, tasks, models, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="h2 mb-4">Gösterge Paneli</h1>
      
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Takımlar</h5>
              <h2 className="display-4">{teams ? teams.length : 0}</h2>
              <p className="card-text">Toplam takım sayısı</p>
              <Link to="/teams" className="btn btn-primary">Takımları Görüntüle</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Görevler</h5>
              <h2 className="display-4">{tasks ? tasks.length : 0}</h2>
              <p className="card-text">Toplam görev sayısı</p>
              <Link to="/tasks" className="btn btn-primary">Görevleri Görüntüle</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Modeller</h5>
              <h2 className="display-4">{models ? models.length : 0}</h2>
              <p className="card-text">Kullanılabilir model sayısı</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              Son Takımlar
            </div>
            <ul className="list-group list-group-flush">
              {teams && teams.length > 0 ? (
                teams.slice(0, 5).map((team, index) => (
                  <li className="list-group-item" key={index}>
                    <Link to={`/teams/${team.id}`} className="text-decoration-none">
                      {team.name}
                    </Link>
                    <span className="badge bg-info float-end">{team.agents?.length || 0} ajan</span>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted">Henüz takım oluşturulmadı</li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              Son Görevler
            </div>
            <ul className="list-group list-group-flush">
              {tasks && tasks.length > 0 ? (
                tasks.slice(0, 5).map((task, index) => (
                  <li className="list-group-item" key={index}>
                    <Link to={`/tasks/${task.id}`} className="text-decoration-none">
                      {task.name || task.description}
                    </Link>
                    <span className="badge bg-secondary float-end">
                      {task.status || 'Yeni'}
                    </span>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted">Henüz görev oluşturulmadı</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 
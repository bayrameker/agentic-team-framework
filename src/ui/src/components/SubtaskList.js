import React, { useState } from 'react';

const SubtaskList = ({ subtasks, onStatusChange, onAdd }) => {
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Alt görev durumuna göre renk belirleme
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="badge bg-success">Tamamlandı</span>;
      case 'in_progress':
        return <span className="badge bg-warning text-dark">Devam Ediyor</span>;
      case 'pending':
        return <span className="badge bg-info text-dark">Bekliyor</span>;
      case 'failed':
        return <span className="badge bg-danger">Başarısız</span>;
      default:
        return <span className="badge bg-secondary">Bilinmiyor</span>;
    }
  };

  // Durum değiştirme fonksiyonu
  const handleStatusChange = (subtaskId, newStatus) => {
    if (onStatusChange) {
      onStatusChange(subtaskId, newStatus);
    }
  };

  // Yeni alt görev ekleme
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (onAdd && newSubtask.title.trim()) {
      onAdd({
        title: newSubtask.title,
        description: newSubtask.description
      });
      
      // Formu sıfırla
      setNewSubtask({ title: '', description: '' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="subtask-list">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-list-check text-primary me-2"></i>
          Alt Görevler
        </h5>
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            <>
              <i className="bi bi-x-circle me-1"></i> İptal
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle me-1"></i> Alt Görev Ekle
            </>
          )}
        </button>
      </div>

      {/* Yeni alt görev formu */}
      {showAddForm && (
        <div className="card border-0 shadow-sm mb-4 animate__animated animate__fadeIn">
          <div className="card-body">
            <h6 className="card-title mb-3">
              <i className="bi bi-plus-circle text-primary me-2"></i>
              Yeni Alt Görev
            </h6>
            <form onSubmit={handleAddSubtask}>
              <div className="mb-3">
                <label htmlFor="subtaskTitle" className="form-label">Başlık</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="subtaskTitle"
                  placeholder="Alt görev başlığı" 
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({...newSubtask, title: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="subtaskDescription" className="form-label">Açıklama</label>
                <textarea 
                  className="form-control" 
                  id="subtaskDescription" 
                  rows="3"
                  placeholder="Alt görev açıklaması"
                  value={newSubtask.description}
                  onChange={(e) => setNewSubtask({...newSubtask, description: e.target.value})}
                ></textarea>
              </div>
              <div className="d-flex justify-content-end">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary me-2"
                  onClick={() => setShowAddForm(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-1"></i>
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alt görevler listesi */}
      {subtasks && subtasks.length > 0 ? (
        <div className="accordion" id="subtasksAccordion">
          {subtasks.map((subtask, index) => (
            <div className="accordion-item border-0 shadow-sm mb-3" key={subtask.id || index}>
              <h2 className="accordion-header" id={`heading-${subtask.id || index}`}>
                <button 
                  className="accordion-button collapsed" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target={`#collapse-${subtask.id || index}`} 
                  aria-expanded="false" 
                  aria-controls={`collapse-${subtask.id || index}`}
                >
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div>
                      <i className="bi bi-check2-square me-2"></i>
                      <span className="fw-medium">{subtask.title}</span>
                    </div>
                    {getStatusBadge(subtask.status)}
                  </div>
                </button>
              </h2>
              <div 
                id={`collapse-${subtask.id || index}`} 
                className="accordion-collapse collapse" 
                aria-labelledby={`heading-${subtask.id || index}`}
                data-bs-parent="#subtasksAccordion"
              >
                <div className="accordion-body">
                  <p>{subtask.description || 'Bu alt görev için açıklama bulunmuyor.'}</p>
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted small">
                      {subtask.created_at && (
                        <span className="me-3">
                          <i className="bi bi-calendar3 me-1"></i> 
                          {new Date(subtask.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      {subtask.assigned_to && (
                        <span>
                          <i className="bi bi-person me-1"></i> 
                          {subtask.assigned_to}
                        </span>
                      )}
                    </div>
                    <div className="btn-group">
                      <button 
                        className={`btn btn-sm btn-outline-info ${subtask.status === 'pending' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(subtask.id || index, 'pending')}
                      >
                        <i className="bi bi-hourglass me-1"></i> Bekliyor
                      </button>
                      <button 
                        className={`btn btn-sm btn-outline-warning ${subtask.status === 'in_progress' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(subtask.id || index, 'in_progress')}
                      >
                        <i className="bi bi-play-fill me-1"></i> Devam Ediyor
                      </button>
                      <button 
                        className={`btn btn-sm btn-outline-success ${subtask.status === 'completed' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(subtask.id || index, 'completed')}
                      >
                        <i className="bi bi-check-circle me-1"></i> Tamamlandı
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <i className="bi bi-list-check text-muted display-4"></i>
          <p className="mt-3">Henüz alt görev bulunmuyor.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Alt Görev Ekle
          </button>
        </div>
      )}
      
      {/* İlerleme çubuğu */}
      {subtasks && subtasks.length > 0 && (
        <div className="progress-section mt-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">İlerleme</h6>
            <span className="text-muted small">
              {subtasks.filter(st => st.status === 'completed').length} / {subtasks.length} tamamlandı (
              {Math.round((subtasks.filter(st => st.status === 'completed').length / subtasks.length) * 100)}%)
            </span>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ 
                width: `${(subtasks.filter(st => st.status === 'completed').length / subtasks.length) * 100}%` 
              }} 
              aria-valuenow={subtasks.filter(st => st.status === 'completed').length} 
              aria-valuemin="0" 
              aria-valuemax={subtasks.length}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtaskList; 
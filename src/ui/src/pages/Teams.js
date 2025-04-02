import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { createTeam } from '../services/api';

function Teams({ refreshTeams, isLoading }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localTeams, setLocalTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Takımları getir
  useEffect(() => {
    fetchTeamsFromApi();
  }, []);

  // API'den takımları direkt getir
  const fetchTeamsFromApi = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teams');
      if (response.data && response.data.teams) {
        setLocalTeams(response.data.teams);
      }
    } catch (error) {
      console.error('Takımlar direkt getirilirken hata:', error);
      toast.error('Takımlar yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeam({ ...newTeam, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newTeam.name.trim()) {
      toast.error('Takım adı gereklidir!');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Takım oluşturma isteği gönderiliyor:', newTeam);
      const createdTeam = await createTeam(newTeam);
      console.log('Oluşturulan takım:', createdTeam);
      
      // Takımları yeniden yükle
      await fetchTeamsFromApi();
      
      toast.success('Takım başarıyla oluşturuldu!');
      setNewTeam({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Takım oluştururken hata:', error);
      toast.error(`Takım oluşturulamadı: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Takımlar</h1>
        <div>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={fetchTeamsFromApi}
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Yenile
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? (
              <>
                <i className="bi bi-x-circle me-1"></i> İptal
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-1"></i> Yeni Takım Oluştur
              </>
            )}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header">
            <h5 className="mb-0">Yeni Takım Oluştur</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Takım Adı <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={newTeam.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  value={newTeam.description}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={() => setShowCreateForm(false)}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <><i className="bi bi-check-circle me-1"></i> Takım Oluştur</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {localTeams.length > 0 ? (
        <div className="row">
          {localTeams.map((team, index) => (
            <div className="col-md-4 mb-4" key={team.id || index}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{team.name}</h5>
                  <p className="card-text text-muted">{team.description || 'Açıklama bulunmamaktadır.'}</p>
                  <p>
                    <span className="badge bg-info me-2">{team.agents?.length || 0} Ajan</span>
                    <span className="badge bg-secondary">{team.tasks?.length || 0} Görev</span>
                  </p>
                </div>
                <div className="card-footer bg-white">
                  <Link to={`/teams/${team.id}`} className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-eye me-1"></i> Detayları Görüntüle
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Henüz takım bulunmamaktadır. Yeni bir takım oluşturmak için yukarıdaki butonu kullanabilirsiniz.
        </div>
      )}
    </div>
  );
}

export default Teams; 
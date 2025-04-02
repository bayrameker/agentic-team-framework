import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import TaskList from '../components/TaskList';
import api from '../services/api';

function Tasks({ api, tasks, teams, models, refreshTasks, isLoading }) {
  const [activeTasks, setActiveTasks] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    team_id: ''
  });
  
  // Aktif görevleri düzenli olarak kontrol etmek için polling
  const [pollingActive, setPollingActive] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Komponent yüklendiğinde
  useEffect(() => {
    // Aktif görevleri kontrol etmeye başla
    startActiveTasksPolling();
    
    // Komponent unmount olduğunda polling'i temizle
    return () => {
      stopActiveTasksPolling();
    };
  }, []); 
  
  // Aktif görevleri periyodik olarak kontrol et
  const startActiveTasksPolling = () => {
    if (!pollingInterval) {
      const interval = setInterval(() => {
        fetchActiveTasks();
      }, 10000); // 10 saniyede bir kontrol et
      
      setPollingInterval(interval);
      setPollingActive(true);
      
      // İlk kontrol
      fetchActiveTasks();
    }
  };
  
  // Polling'i durdur
  const stopActiveTasksPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setPollingActive(false);
    }
  };
  
  // Aktif görevleri getir
  const fetchActiveTasks = async () => {
    try {
      const response = await api.get('/api/tasks/active');
      const activeTasksList = response.data.active_tasks || [];
      
      // Aktif görevlerde değişiklik olup olmadığını kontrol et
      if (JSON.stringify(activeTasks) !== JSON.stringify(activeTasksList)) {
        setActiveTasks(activeTasksList);
        
        // Eğer aktif görevler varsa, bildirim göster
        if (activeTasksList.length > 0) {
          const newActiveTasks = activeTasksList.filter(
            at => !activeTasks.some(t => t.id === at.id)
          );
          
          if (newActiveTasks.length > 0) {
            toast.success(`${newActiveTasks.length} görev aktif olarak çalışıyor!`);
          }
        }
        
        // Görevleri yenile
        if (refreshTasks) refreshTasks();
      }
    } catch (err) {
      console.error('Aktif görevler alınırken hata:', err);
      // Hata durumunda polling'i durdurma, sessizce devam et
    }
  };
  
  // Form girdisi değişikliği
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };
  
  // Yeni görev oluştur
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.team_id) {
      toast.error('Lütfen bir takım seçin!');
      return;
    }
    
    if (!newTask.description) {
      toast.error('Lütfen bir görev açıklaması girin!');
      return;
    }
    
    setCreating(true);
    
    try {
      await api.post('/api/tasks/create', newTask);
      toast.success('Görev başarıyla oluşturuldu!');
      
      // Formu sıfırla
      setNewTask({
        name: '',
        description: '',
        team_id: ''
      });
      
      // Görevleri yenile
      if (refreshTasks) refreshTasks();
    } catch (err) {
      console.error('Görev oluşturulurken hata:', err);
      toast.error('Görev oluşturulamadı!');
    } finally {
      setCreating(false);
    }
  };

  // Takımdan model seç - yardımcı fonksiyon
  const getModelFromTeam = (teamId) => {
    const team = teams?.find(t => t.id === teamId);
    if (!team || !team.agents || team.agents.length === 0) return null;
    return team.agents[0]?.model || null;
  };
  
  // Aktif görevleri görüntüle
  const renderActiveTasks = () => {
    if (activeTasks.length === 0) {
      return null;
    }
    
    return (
      <Card className="mb-4 border-primary">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Aktif Görevler</h5>
          <span className="badge bg-light text-primary">{activeTasks.length} görev çalışıyor</span>
        </Card.Header>
        <Card.Body>
          <div className="list-group">
            {activeTasks.map(task => (
              <Link 
                to={`/tasks/${task.id}`} 
                key={task.id}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              >
                <div>
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                      <span className="visually-hidden">İşleniyor...</span>
                    </div>
                    <h6 className="mb-0">{task.title}</h6>
                  </div>
                  <div className="small text-muted mt-1">
                    {task.status_message || 'İşleniyor...'}
                  </div>
                </div>
                <div className="text-end">
                  <div className="progress" style={{width: '100px', height: '10px'}}>
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated" 
                      role="progressbar" 
                      style={{width: `${task.progress || 0}%`}}
                    ></div>
                  </div>
                  <small className="d-block mt-1">
                    %{task.progress || 0} tamamlandı
                  </small>
                </div>
              </Link>
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }
  
  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Görevler</h1>
              <p className="text-muted">
                Takımlara atanmış görevleri görüntüleyin ve yönetin.
                {pollingActive && (
                  <span className="ms-2 text-success small">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Otomatik güncelleniyor
                  </span>
                )}
              </p>
            </div>
            <Button 
              variant="primary"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              <i className="bi bi-plus-lg me-1"></i>
              Yeni Görev
            </Button>
          </div>
        </Col>
      </Row>
      
      {/* Aktif görevler bölümü */}
      {renderActiveTasks()}

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Yeni Görev Oluştur</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleCreateTask}>
                <Form.Group className="mb-3">
                  <Form.Label>Takım Seçin</Form.Label>
                  <Form.Select 
                    name="team_id"
                    value={newTask.team_id}
                    onChange={handleInputChange}
                    disabled={creating}
                    required
                  >
                    <option value="">Takım seçin...</option>
                    {teams?.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.agents?.length || 0} ajan)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Görev Adı (Opsiyonel)</Form.Label>
                  <Form.Control 
                    type="text"
                    name="name"
                    value={newTask.name}
                    onChange={handleInputChange}
                    disabled={creating}
                    placeholder="Görev için bir isim girin"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Görev Açıklaması</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={5}
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    disabled={creating}
                    placeholder="Görev açıklamasını detaylı olarak girin"
                    required
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={creating}
                  className="w-100"
                >
                  {creating ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-1"></i>
                      Görev Oluştur
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Tüm Görevler</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {tasks && tasks.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" style={{ width: '40%' }}>Görev</th>
                        <th scope="col">Takım</th>
                        <th scope="col">Durum</th>
                        <th scope="col">İlerleme</th>
                        <th scope="col" style={{ width: '120px' }}>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => {
                        // İlgili takımı bul
                        const team = teams?.find(t => t.id === task.team_id);
                        
                        return (
                          <tr key={task.id}>
                            <td>
                              <Link to={`/tasks/${task.id}`} className="text-decoration-none fw-semibold">
                                {task.title || task.description.substring(0, 60) + '...'}
                              </Link>
                              {task.status_message && (
                                <small className="d-block text-muted">{task.status_message}</small>
                              )}
                            </td>
                            <td>
                              {team ? (
                                <Link to={`/teams/${team.id}`} className="text-decoration-none">
                                  {team.name}
                                </Link>
                              ) : (
                                <span className="text-muted">Bilinmiyor</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${
                                task.status === 'completed' ? 'bg-success' : 
                                task.status === 'in_progress' ? 'bg-primary' :
                                task.status === 'failed' ? 'bg-danger' :
                                task.status === 'cancelled' ? 'bg-warning' : 'bg-secondary'
                              }`}>
                                {task.status === 'completed' ? 'Tamamlandı' : 
                                 task.status === 'in_progress' ? 'Devam Ediyor' :
                                 task.status === 'failed' ? 'Başarısız' :
                                 task.status === 'cancelled' ? 'İptal Edildi' : 'Yeni'}
                              </span>
                            </td>
                            <td>
                              <div className="progress" style={{height: '8px'}}>
                                <div 
                                  className={`progress-bar ${
                                    task.status === 'completed' ? 'bg-success' : 
                                    task.status === 'failed' ? 'bg-danger' : 
                                    task.status === 'cancelled' ? 'bg-warning' : 'bg-primary'
                                  }`}
                                  role="progressbar" 
                                  style={{width: `${task.progress || 0}%`}} 
                                  aria-valuenow={task.progress || 0} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100"
                                ></div>
                              </div>
                              <small className="d-block text-muted mt-1">%{task.progress || 0}</small>
                            </td>
                            <td>
                              <Link to={`/tasks/${task.id}`} className="btn btn-sm btn-outline-primary">
                                Görüntüle
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-clipboard-check fs-1 text-muted"></i>
                  <p className="mt-3 text-muted">Henüz görev bulunmuyor.</p>
                  <p className="text-muted small">Yeni bir görev oluşturmak için sol paneli kullanın.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Tasks; 
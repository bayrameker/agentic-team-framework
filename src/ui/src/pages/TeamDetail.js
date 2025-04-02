import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
import Agents from '../components/Agents';
import TaskList from '../components/TaskList';
import { toast } from 'react-hot-toast';

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId, retryCount]);

  const addToLogs = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now(),
      message,
      type,
      timestamp
    };
    setLogs(prev => [...prev, logEntry]);
    console.log(`[${type.toUpperCase()}][${timestamp}] ${message}`);
  };

  const fetchTeamDetails = async () => {
    if (!teamId) {
      setError('Takım ID bilgisi eksik');
      addToLogs('Takım ID bilgisi eksik', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      addToLogs(`${teamId} ID'li takım detayları getiriliyor... (Deneme: ${retryCount + 1}/${maxRetries + 1})`, 'info');
      
      // Takım bilgilerini al
      const response = await api.get(`/api/teams/${teamId}`);
      console.log('Takım yanıtı:', response.data);
      
      if (response.data) {
        const teamData = response.data;
        
        // Eğer agents veya tasks alanları yoksa, boş dizi ile başlat
        if (!teamData.agents) teamData.agents = [];
        if (!teamData.tasks) teamData.tasks = [];
        
        setTeam(teamData);
        setError('');
        addToLogs(`Takım bilgileri başarıyla alındı: ${teamData.name}`, 'success');
        
        // Takıma ait görevleri getir
        try {
          addToLogs(`Takıma ait görevler getiriliyor...`, 'info');
          const tasksResponse = await api.get(`/api/teams/${teamId}/tasks`);
          console.log('Görev yanıtı:', tasksResponse.data);
          
          if (tasksResponse.data && tasksResponse.data.tasks) {
            const updatedTeam = {...teamData};
            updatedTeam.tasks = tasksResponse.data.tasks;
            setTeam(updatedTeam);
            addToLogs(`${tasksResponse.data.tasks.length} görev bilgisi alındı`, 'success');
          }
        } catch (err) {
          addToLogs(`Görev bilgileri alınamadı: ${err.message}`, 'warning');
          console.error('Görev bilgileri alınırken hata:', err);
        }
      } else {
        throw new Error('Sunucudan veri geldi ancak takım bilgisi bulunamadı');
      }
    } catch (error) {
      console.error('Takım detayları alınırken hata:', error);
      
      // API yanıt hatası
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.detail || 
                            error.response.data?.message || 
                            `Hata kodu: ${status}`;
        
        setError(`Takım bilgileri yüklenemedi: ${errorMessage}`);
        addToLogs(`Hata: ${errorMessage} (${status})`, 'error');
        
        // 404 hatası ise kullanıcıya takımın olmadığını bildir
        if (status === 404) {
          toast.error('Takım bulunamadı');
        } else {
          toast.error(`Sunucu hatası: ${errorMessage}`);
        }
      } 
      // İstek hatası (sunucuya erişilemedi)
      else if (error.request) {
        setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
        addToLogs('Sunucuya erişilemedi. Bağlantı hatası.', 'error');
        
        // Otomatik yeniden deneme
        if (retryCount < maxRetries) {
          addToLogs(`${(retryCount + 1) * 2} saniye sonra yeniden denenecek...`, 'warning');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, (retryCount + 1) * 2000);
        } else {
          toast.error('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.');
        }
      } 
      // Diğer hatalar
      else {
        setError(`Beklenmeyen bir hata oluştu: ${error.message}`);
        addToLogs(`Beklenmeyen hata: ${error.message}`, 'error');
        toast.error('Beklenmeyen bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    addToLogs(`Sekme değiştirildi: ${tab}`);
  };

  if (loading && retryCount === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Takım bilgileri yükleniyor...</p>
      </Container>
    );
  }

  if (error && retryCount >= maxRetries) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Bir hata oluştu</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-between align-items-center">
            <Button 
              variant="outline-primary"
              onClick={() => {
                setRetryCount(0);
                fetchTeamDetails();
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Yeniden Dene
            </Button>
            <Button 
              variant="outline-danger"
              onClick={() => navigate('/teams')}
            >
              <i className="bi bi-arrow-left me-1"></i> Takımlara Dön
            </Button>
          </div>
        </Alert>
        
        {/* Hata ayıklama için logları göster */}
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">İşlem Logları</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="log-container bg-dark text-light p-3" style={{maxHeight: '300px', overflowY: 'auto'}}>
              {logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className={`log-entry log-${log.type} mb-2`}>
                    <span className="log-time text-muted">[{log.timestamp}]</span>
                    <span className={`log-badge badge bg-${log.type === 'error' ? 'danger' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'success' : 'info'} mx-2`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0">Log kaydı bulunmuyor</p>
              )}
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!team && !loading) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Takım bulunamadı</Alert.Heading>
          <p>Aradığınız takım bulunamadı veya erişim izniniz yok.</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-primary"
              onClick={() => navigate('/teams')}
            >
              Takımlara Dön
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {loading && retryCount > 0 && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Takım bilgileri yeniden yükleniyor... (Deneme: {retryCount + 1}/{maxRetries + 1})</span>
          </div>
        </Alert>
      )}
      
      {error && retryCount < maxRetries && (
        <Alert variant="warning" className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setRetryCount(0);
                fetchTeamDetails();
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Şimdi Yenile
            </Button>
          </div>
        </Alert>
      )}
      
      {team && (
        <>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h1 className="h3 mb-0">{team.name}</h1>
                  <p className="text-muted mb-0">
                    {team.description || 'Takım açıklaması bulunmuyor'}
                  </p>
                </div>
                <div className="d-flex">
                  <Button 
                    variant="outline-secondary" 
                    className="me-2"
                    onClick={() => navigate('/teams')}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Takımlar
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      setRetryCount(0);
                      fetchTeamDetails();
                    }}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Yenile
                  </Button>
                </div>
              </div>
              
              <Row className="g-3">
                <Col md={4}>
                  <div className="border rounded p-3 text-center">
                    <h4 className="h6 text-muted mb-1">Ajan Sayısı</h4>
                    <h3 className="mb-0">
                      {team.agents?.length || 0}
                    </h3>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="border rounded p-3 text-center">
                    <h4 className="h6 text-muted mb-1">Görev Sayısı</h4>
                    <h3 className="mb-0">
                      {team.tasks?.length || 0}
                    </h3>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="border rounded p-3 text-center">
                    <h4 className="h6 text-muted mb-1">Oluşturulma Tarihi</h4>
                    <h3 className="h5 mb-0">
                      {team.created_at ? new Date(team.created_at).toLocaleDateString() : 'Bilinmiyor'}
                    </h3>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-4"
            fill
          >
            <Tab eventKey="overview" title={<><i className="bi bi-house me-2"></i>Genel Bakış</>}>
              <Row>
                <Col md={8}>
                  <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Takım Bilgileri</h5>
                    </Card.Header>
                    <Card.Body>
                      <table className="table table-hover">
                        <tbody>
                          <tr>
                            <th style={{width: '150px'}}>Takım Adı</th>
                            <td>{team.name}</td>
                          </tr>
                          <tr>
                            <th>Açıklama</th>
                            <td>{team.description || 'Açıklama bulunmuyor'}</td>
                          </tr>
                          <tr>
                            <th>ID</th>
                            <td><code>{team.id}</code></td>
                          </tr>
                          <tr>
                            <th>Oluşturulma</th>
                            <td>{team.created_at ? new Date(team.created_at).toLocaleString() : 'Bilinmiyor'}</td>
                          </tr>
                          <tr>
                            <th>Son Güncelleme</th>
                            <td>{team.updated_at ? new Date(team.updated_at).toLocaleString() : 'Bilinmiyor'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">İşlemler</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <Button variant="outline-primary">
                          <i className="bi bi-person-plus me-2"></i>
                          Ajan Ekle
                        </Button>
                        <Button variant="outline-success">
                          <i className="bi bi-plus-circle me-2"></i>
                          Görev Oluştur
                        </Button>
                        <Button variant="outline-danger">
                          <i className="bi bi-trash me-2"></i>
                          Takımı Sil
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                  
                  {/* Günlük */}
                  <Card className="shadow-sm">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">İşlem Günlüğü</h5>
                    </Card.Header>
                    <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                      <ul className="list-group list-group-flush">
                        {logs.slice(-5).reverse().map(log => (
                          <li key={log.id} className="list-group-item">
                            <small className="d-block text-muted">{log.timestamp}</small>
                            <span className={`badge bg-${log.type === 'error' ? 'danger' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'success' : 'info'} me-2`}>
                              {log.type}
                            </span>
                            {log.message}
                          </li>
                        ))}
                        {logs.length === 0 && (
                          <li className="list-group-item text-center text-muted">
                            Henüz işlem kaydı bulunmuyor
                          </li>
                        )}
                      </ul>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="agents" title={<><i className="bi bi-people me-2"></i>Ajanlar ({team.agents?.length || 0})</>}>
              <Agents teamId={team.id} agents={team.agents || []} />
            </Tab>
            
            <Tab eventKey="tasks" title={<><i className="bi bi-list-check me-2"></i>Görevler ({team.tasks?.length || 0})</>}>
              <TaskList teamId={team.id} tasks={team.tasks || []} />
            </Tab>
            
            <Tab eventKey="logs" title={<><i className="bi bi-journal-text me-2"></i>Günlük ({logs.length})</>}>
              <Card>
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">İşlem Günlüğü</h5>
                  <Button variant="outline-secondary" size="sm" onClick={() => setLogs([])}>
                    <i className="bi bi-trash me-1"></i> Temizle
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="log-container bg-dark text-light p-3" style={{height: '400px', overflowY: 'auto'}}>
                    {logs.length > 0 ? (
                      logs.map(log => (
                        <div key={log.id} className={`log-entry log-${log.type} mb-2`}>
                          <span className="log-time text-muted">[{log.timestamp}]</span>
                          <span className={`log-badge badge bg-${log.type === 'error' ? 'danger' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'success' : 'info'} mx-2`}>
                            {log.type.toUpperCase()}
                          </span>
                          <span className="log-message">{log.message}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted text-center my-5">Log kaydı bulunmuyor</p>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </>
      )}
    </Container>
  );
};

export default TeamDetail; 
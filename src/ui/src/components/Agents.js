import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Modal, Spinner, Badge, Alert } from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const Agents = ({ teamId, refreshTeam }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalShow, setAddModalShow] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'developer',
    model: '',
  });
  const [models, setModels] = useState([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [modelRetryCount, setModelRetryCount] = useState(0);
  const maxRetries = 3;

  // Agent rollerini tanımla
  const roles = [
    { value: 'developer', label: 'Geliştirici', color: 'primary' },
    { value: 'architect', label: 'Mimar', color: 'secondary' },
    { value: 'tester', label: 'Test Uzmanı', color: 'success' },
    { value: 'devops', label: 'DevOps', color: 'warning' },
    { value: 'product_manager', label: 'Ürün Yöneticisi', color: 'info' },
    { value: 'ui_designer', label: 'UI Tasarımcı', color: 'dark' },
  ];

  useEffect(() => {
    if (teamId) {
      fetchAgents();
      fetchModels();
    }
  }, [teamId, retryCount, modelRetryCount]);

  const addToLogs = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now(),
      message,
      type,
      timestamp
    };
    setLogs(prev => [...prev, logEntry]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const fetchAgents = async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      addToLogs(`${teamId} ID'li takım için ajanlar getiriliyor... (Deneme: ${retryCount + 1}/${maxRetries + 1})`);
      
      // Takım detaylarını getir, ajanlar bu detaylarda yer alır
      const response = await api.get(`/api/teams/${teamId}`);
      
      if (response.data && response.data.agents) {
        setAgents(response.data.agents);
        addToLogs(`${response.data.agents.length} ajan başarıyla getirildi`, 'success');
      } else {
        setAgents([]);
        addToLogs('Ajan bilgisi alınamadı veya boş döndü', 'warning');
      }
    } catch (error) {
      console.error('Ajanlar getirilirken hata:', error);
      
      // Sunucudan yanıt geldi ancak hata var
      if (error.response) {
        const errorMsg = error.response?.data?.detail || 'Sunucu hatası';
        addToLogs(`Hata: ${errorMsg} (${error.response.status})`, 'error');
      } 
      // İstek gönderildi ama yanıt alınamadı
      else if (error.request) {
        addToLogs('Sunucuya erişilemedi. Bağlantı hatası.', 'error');
        
        // Otomatik yeniden deneme
        if (retryCount < maxRetries) {
          const retryWait = (retryCount + 1) * 2;
          addToLogs(`${retryWait} saniye sonra ajanlar için yeniden bağlantı kurulacak...`, 'warning');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryWait * 1000);
        } else {
          toast.error('Ajanlar getirilemedi. Sunucuya erişilemiyor.');
        }
      } else {
        addToLogs(`Beklenmeyen hata: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      addToLogs(`Kullanılabilir modeller getiriliyor... (Deneme: ${modelRetryCount + 1}/${maxRetries + 1})`);
      const response = await api.get('/api/models');
      
      if (response.data && response.data.models) {
        setModels(response.data.models);
        // Varsayılan model seç
        if (response.data.models.length > 0) {
          setNewAgent(prev => ({ ...prev, model: response.data.models[0] }));
        }
        addToLogs(`${response.data.models.length} model bulundu`, 'success');
      } else {
        addToLogs('Model bilgisi alınamadı veya boş döndü', 'warning');
      }
    } catch (error) {
      console.error('Modeller getirilirken hata:', error);
      
      if (error.response) {
        const errorMsg = error.response?.data?.detail || 'Sunucu hatası';
        addToLogs(`Model hatası: ${errorMsg} (${error.response.status})`, 'error');
      } else if (error.request) {
        addToLogs('Modeller için sunucuya erişilemedi.', 'error');
        
        // Otomatik yeniden deneme
        if (modelRetryCount < maxRetries) {
          const retryWait = (modelRetryCount + 1) * 2;
          addToLogs(`${retryWait} saniye sonra modeller için yeniden bağlantı kurulacak...`, 'warning');
          setTimeout(() => {
            setModelRetryCount(prev => prev + 1);
          }, retryWait * 1000);
        } else {
          toast.error('Modeller getirilemedi. Lütfen daha sonra tekrar deneyin.');
        }
      } else {
        addToLogs(`Model yüklemede beklenmeyen hata: ${error.message}`, 'error');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAgent(prev => ({ ...prev, [name]: value }));
  };

  const addAgent = async () => {
    // Form validasyonu
    if (!newAgent.name.trim()) {
      setFormError('Ajan adı boş olamaz');
      return;
    }
    
    if (!newAgent.model) {
      setFormError('Lütfen bir model seçin');
      return;
    }
    
    setFormError('');
    setFormSubmitting(true);
    addToLogs(`Yeni ajan ekleniyor: ${newAgent.name} (${newAgent.role})...`);
    
    try {
      // Ajan ekleme verilerini hazırla
      const agentData = {
        name: newAgent.name.trim(),
        role: newAgent.role,
        model: newAgent.model
      };
      
      console.log(`Ajan ekleme isteği: ${JSON.stringify(agentData)}`);
      
      // Ajan ekle
      const response = await api.post(`/api/teams/${teamId}/agents/add`, agentData);
      
      if (response.data && response.data.id) {
        addToLogs(`Ajan başarıyla eklendi: ${newAgent.name} (ID: ${response.data.id})`, 'success');
        toast.success('Ajan başarıyla eklendi');
        
        // Formu sıfırla
        setNewAgent({
          name: '',
          role: 'developer',
          model: models.length > 0 ? models[0] : '',
        });
        
        // Modalı kapat
        setAddModalShow(false);
        
        // Ajanları yeniden getir
        if (refreshTeam) {
          refreshTeam();
        } else {
          setRetryCount(0);
          fetchAgents();
        }
      } else {
        throw new Error('Ajan ID\'si döndürülmedi');
      }
    } catch (error) {
      console.error('Ajan eklenirken hata:', error);
      
      if (error.response) {
        const errorMsg = error.response?.data?.detail || 'Ajan eklenirken sunucu hatası oluştu';
        setFormError(errorMsg);
        addToLogs(`Hata: ${errorMsg} (${error.response.status})`, 'error');
        toast.error(errorMsg);
      } else if (error.request) {
        const errorMsg = 'Sunucu yanıt vermedi. İnternet bağlantınızı kontrol edin.';
        setFormError(errorMsg);
        addToLogs('Ajan eklenirken sunucuya erişilemedi.', 'error');
        toast.error(errorMsg);
      } else {
        const errorMsg = `Ajan eklenirken beklenmeyen hata: ${error.message}`;
        setFormError(errorMsg);
        addToLogs(errorMsg, 'error');
        toast.error(errorMsg);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleInfo = roles.find(r => r.value === role) || { label: role, color: 'secondary' };
    return (
      <Badge bg={roleInfo.color} className="text-white">
        {roleInfo.label}
      </Badge>
    );
  };

  const handleRetry = () => {
    setRetryCount(0);
    setModelRetryCount(0);
    addToLogs('Veriler yeniden yükleniyor...', 'info');
    fetchAgents();
    fetchModels();
  };

  return (
    <>
      <Card className="mb-4 shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">Takım Ajanları</h5>
          <div>
            <Button 
              variant="light" 
              size="sm" 
              className="me-2"
              onClick={() => setShowLogs(!showLogs)}
            >
              <i className="bi bi-journal-text"></i> Loglar
              {logs.filter(log => log.type === 'error').length > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="ms-1"
                >
                  {logs.filter(log => log.type === 'error').length}
                </Badge>
              )}
            </Button>
            <Button 
              variant="success" 
              size="sm" 
              onClick={() => setAddModalShow(true)}
              disabled={models.length === 0 || retryCount > maxRetries}
            >
              <i className="bi bi-plus-circle"></i> Ajan Ekle
            </Button>
          </div>
        </Card.Header>
        
        {showLogs && (
          <Card.Body className="bg-dark text-light p-3 log-container" style={{ maxHeight: '200px', overflow: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleRetry}
              >
                <i className="bi bi-arrow-repeat me-1"></i> Yenile
              </Button>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={() => setLogs([])}
              >
                <i className="bi bi-trash me-1"></i> Temizle
              </Button>
            </div>
            {logs.length === 0 ? (
              <p className="text-muted">Henüz log kaydı yok</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">[{log.timestamp}]</span>
                  <span className={`log-message ${log.type === 'error' ? 'text-danger' : log.type === 'success' ? 'text-success' : log.type === 'warning' ? 'text-warning' : ''}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </Card.Body>
        )}
        
        <Card.Body>
          {loading && retryCount === 0 ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Ajanlar yükleniyor...</p>
            </div>
          ) : loading && retryCount > 0 ? (
            <Alert variant="info" className="d-flex align-items-center">
              <Spinner animation="border" size="sm" className="me-3" />
              <div>
                Ajanlar yeniden yükleniyor... (Deneme: {retryCount + 1}/{maxRetries + 1})
              </div>
            </Alert>
          ) : retryCount >= maxRetries && agents.length === 0 ? (
            <Alert variant="danger">
              <Alert.Heading>Ajanlar yüklenemedi</Alert.Heading>
              <p>Sunucuya bağlanırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin ve daha sonra tekrar deneyin.</p>
              <div className="d-flex justify-content-end">
                <Button 
                  variant="outline-danger"
                  onClick={handleRetry}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Yeniden Dene
                </Button>
              </div>
            </Alert>
          ) : agents.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {agents.map(agent => (
                <Col key={agent.id}>
                  <Card className="h-100 agent-card">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="agent-avatar me-3 bg-primary text-white">
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Card.Title>{agent.name}</Card.Title>
                          {getRoleBadge(agent.role)}
                        </div>
                      </div>
                      
                      <Card.Text>
                        <small className="text-muted d-block mb-2">
                          <i className="bi bi-cpu me-1"></i> Model: {agent.model}
                        </small>
                        
                        <small className="text-muted d-block">
                          <i className="bi bi-key me-1"></i> ID: {agent.id}
                        </small>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-4 bg-light rounded">
              <i className="bi bi-people-fill display-4 text-muted"></i>
              <p className="mt-3">Bu takımda henüz ajan yok.</p>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setAddModalShow(true)}
                disabled={models.length === 0}
              >
                <i className="bi bi-plus-circle me-1"></i> İlk Ajanı Ekle
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Ajan Ekleme Modal */}
      <Modal
        show={addModalShow}
        onHide={() => {
          setAddModalShow(false);
          setFormError('');
        }}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Yeni Ajan Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          
          {modelRetryCount >= maxRetries && models.length === 0 ? (
            <Alert variant="warning">
              <Alert.Heading>Modeller yüklenemedi</Alert.Heading>
              <p>Sunucudan model bilgisi alınamadığı için ajan ekleyemiyorsunuz. Lütfen daha sonra tekrar deneyin.</p>
              <div className="d-flex justify-content-end mt-3">
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setModelRetryCount(0);
                    fetchModels();
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Yeniden Dene
                </Button>
              </div>
            </Alert>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Ajan Adı</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={newAgent.name}
                  onChange={handleInputChange}
                  placeholder="Ör: React Uzmanı"
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Rol</Form.Label>
                <Form.Select
                  name="role"
                  value={newAgent.role}
                  onChange={handleInputChange}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Model</Form.Label>
                {models.length > 0 ? (
                  <Form.Select
                    name="model"
                    value={newAgent.model}
                    onChange={handleInputChange}
                  >
                    {models.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <div className="text-center py-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Modeller yükleniyor...
                  </div>
                )}
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setAddModalShow(false);
              setFormError('');
            }}
          >
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={addAgent}
            disabled={formSubmitting || models.length === 0}
          >
            {formSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Ekleniyor...
              </>
            ) : (
              <>Ajan Ekle</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      <style jsx>{`
        .agent-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .agent-card {
          transition: all 0.2s ease;
          border: 1px solid #e0e0e0;
        }
        
        .agent-card:hover {
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          transform: translateY(-3px);
        }
        
        .log-container {
          font-family: monospace;
          font-size: 0.9rem;
        }
        
        .log-entry {
          padding: 4px 0;
          border-bottom: 1px dotted #444;
        }
        
        .log-timestamp {
          color: #888;
          margin-right: 10px;
        }
      `}</style>
    </>
  );
};

export default Agents; 
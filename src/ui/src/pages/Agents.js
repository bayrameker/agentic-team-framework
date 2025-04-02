import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Form, Modal, Badge } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [models, setModels] = useState([]);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: '',
    model: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Takımları getir
      const teamsResponse = await api.get('/teams');
      setTeams(teamsResponse.data.teams || []);
      
      // Mevcut modelleri getir
      const modelsResponse = await api.get('/models');
      setModels(modelsResponse.data.models || []);
      
      // Tüm ajanları toplama
      const allAgents = [];
      if (teamsResponse.data.teams) {
        for (const team of teamsResponse.data.teams) {
          if (team.agents) {
            // Her ajana takım bilgisi ekle
            team.agents.forEach(agent => {
              allAgents.push({
                ...agent,
                team_name: team.name,
                team_id: team.id
              });
            });
          }
        }
      }
      
      setAgents(allAgents);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      toast.error('Ajanlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAgent({ ...newAgent, [name]: value });
  };

  const handleTeamSelect = (e) => {
    setSelectedTeam(e.target.value);
  };

  const handleShowAddAgentModal = () => {
    setShowAddAgentModal(true);
  };

  const handleCloseAddAgentModal = () => {
    setShowAddAgentModal(false);
    setNewAgent({ name: '', role: '', model: '' });
    setSelectedTeam('');
  };

  const handleSubmitAgent = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      toast.error('Lütfen bir takım seçin');
      return;
    }
    
    if (!newAgent.name || !newAgent.role || !newAgent.model) {
      toast.error('Tüm alanları doldurun');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await api.post(`/teams/${selectedTeam}/agents/add`, newAgent);
      toast.success('Ajan başarıyla eklendi');
      handleCloseAddAgentModal();
      await fetchData();
    } catch (error) {
      console.error('Ajan eklenirken hata:', error);
      toast.error('Ajan eklenemedi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    role = role.toLowerCase();
    if (role === 'developer') return 'success';
    if (role === 'tester') return 'info';
    if (role === 'designer') return 'primary';
    if (role === 'reviewer') return 'warning';
    if (role === 'architect') return 'danger';
    if (role === 'manager') return 'dark';
    return 'secondary';
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Ajanlar</h1>
        <Button 
          variant="primary" 
          onClick={handleShowAddAgentModal}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Yeni Ajan Ekle
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" />
          <p className="mt-3">Ajanlar yükleniyor...</p>
        </div>
      ) : agents.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {agents.map((agent) => (
            <Col key={agent.id}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{agent.name}</h5>
                    <Badge bg={getRoleBadgeColor(agent.role)}>{agent.role}</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Card.Text>
                    <strong>Model:</strong> {agent.model}
                  </Card.Text>
                  <Card.Text>
                    <strong>Takım:</strong> {agent.team_name}
                  </Card.Text>
                  {agent.system_prompt && (
                    <Card.Text>
                      <strong>Sistem Talimatı:</strong>
                      <div className="mt-2 p-2 bg-light rounded small">
                        {agent.system_prompt}
                      </div>
                    </Card.Text>
                  )}
                </Card.Body>
                <Card.Footer className="bg-white border-top-0">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={() => {}}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Görüntüle
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="text-center p-5">
          <Card.Body>
            <i className="bi bi-people display-1 text-muted"></i>
            <h3 className="mt-4">Henüz Ajan Yok</h3>
            <p className="text-muted">
              Takımlara ajan ekleyerek başlayın. Her ajan farklı görevler için özelleştirilebilir.
            </p>
            <Button 
              variant="primary" 
              className="mt-3"
              onClick={handleShowAddAgentModal}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Yeni Ajan Ekle
            </Button>
          </Card.Body>
        </Card>
      )}
      
      {/* Ajan Ekleme Modalı */}
      <Modal show={showAddAgentModal} onHide={handleCloseAddAgentModal}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Ajan Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitAgent}>
            <Form.Group className="mb-3">
              <Form.Label>Takım</Form.Label>
              <Form.Select
                value={selectedTeam}
                onChange={handleTeamSelect}
                required
              >
                <option value="">Takım Seçin</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Ajan Adı</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newAgent.name}
                onChange={handleInputChange}
                placeholder="Ajan adını girin"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="role"
                value={newAgent.role}
                onChange={handleInputChange}
                required
              >
                <option value="">Rol Seçin</option>
                <option value="Developer">Geliştirici</option>
                <option value="Tester">Test Uzmanı</option>
                <option value="Designer">Tasarımcı</option>
                <option value="Reviewer">İnceleyici</option>
                <option value="Architect">Mimar</option>
                <option value="Manager">Yönetici</option>
                <option value="Analyst">Analist</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Model</Form.Label>
              <Form.Select
                name="model"
                value={newAgent.model}
                onChange={handleInputChange}
                required
              >
                <option value="">Model Seçin</option>
                {models.map((model, index) => (
                  <option key={index} value={model}>{model}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={handleCloseAddAgentModal}
                disabled={submitting}
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Ekleniyor...
                  </>
                ) : (
                  'Ajan Ekle'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Agents; 
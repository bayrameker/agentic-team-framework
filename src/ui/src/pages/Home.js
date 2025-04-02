import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import TeamCard from '../components/TeamCard';
import TaskCard from '../components/TaskCard';
import api from '../services/api';

function Home() {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalTasks: 0,
    completedTasks: 0,
    activeAgents: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [teamsResponse, tasksResponse, modelsResponse] = await Promise.all([
          api.get('/teams'),
          api.get('/tasks'),
          api.get('/models')
        ]);
        
        const teamsData = teamsResponse.data.teams || [];
        const tasksData = tasksResponse.data.tasks || [];
        
        setTeams(teamsData);
        setTasks(tasksData);
        setModels(modelsResponse.data.models || []);
        
        // İstatistikleri hesapla
        setStats({
          totalTeams: teamsData.length,
          totalTasks: tasksData.length,
          completedTasks: tasksData.filter(task => task.status === 'completed').length,
          activeAgents: teamsData.reduce((sum, team) => sum + (team.agents?.length || 0), 0)
        });
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="text-center mb-5">
            <h1 className="display-3 fw-bold">Agentic Teams</h1>
            <p className="lead">
              Yapay zeka destekli kodlama ve takım yönetimi platformu
            </p>
          </div>
        </Col>
      </Row>
      
      <Row className="mb-5">
        <Col md={6} className="mb-4">
          <Card className="h-100 shadow">
            <Card.Header className="bg-primary text-white">
              <h3>Kod Geliştirme</h3>
            </Card.Header>
            <Card.Body>
              <p>
                AI destekli ekipler, istediğiniz görevleri yerine getirmek için birlikte çalışır. 
                Proje geliştirme, kod yazma, test etme ve düzeltme işlemlerini otomatize edin.
              </p>
              <ul>
                <li>Uzun çalışma sürelerinde karma çözümler</li>
                <li>Birden fazla dosya ve modül geliştirme</li>
                <li>Çoklu dil desteği ve kod düzenleme</li>
                <li>Gerçek zamanlı kod oluşturma ve test etme</li>
              </ul>
              <Link to="/teams/create" className="btn btn-primary">
                <i className="bi bi-code-slash me-2"></i>
                Yeni Proje Başlat
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="h-100 shadow">
            <Card.Header className="bg-success text-white">
              <h3>Takım Yönetimi</h3>
            </Card.Header>
            <Card.Body>
              <p>
                Farklı rollerde LLM ajanlara dayalı sanal ekipler oluşturun. 
                Her ekip, özel yeteneklere ve uzmanlık alanlarına sahip olabilir.
              </p>
              <ul>
                <li>Geliştiriciler ve tasarımcılar</li>
                <li>Test uzmanları ve kalite denetçileri</li>
                <li>Mimarlar ve sistem analistleri</li>
                <li>Dokümantasyon ve yardım ekipleri</li>
              </ul>
              <Link to="/teams" className="btn btn-success">
                <i className="bi bi-people me-2"></i>
                Takımları Gör
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center p-4">
              <i className="bi bi-bezier2 display-4 text-primary mb-3"></i>
              <h4>Akıllı Görev Yönetimi</h4>
              <p>
                Karmaşık görevleri alt görevlere bölün ve takımlarınızı 
                verimli bir şekilde koordine edin. Gerçek zamanlı ilerleme 
                durumunu takip edin.
              </p>
              <Link to="/tasks" className="btn btn-outline-primary btn-sm">
                Görevlere Git
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center p-4">
              <i className="bi bi-terminal display-4 text-success mb-3"></i>
              <h4>Kod Geliştirme Süreçleri</h4>
              <p>
                Kod oluşturma, düzenleme, test etme ve çalıştırma
                işlemlerini tek bir arayüzde yönetin. Uzun süren çalışmaları 
                otomatikleştirin.
              </p>
              <Button variant="outline-success" size="sm">
                Daha Fazla Bilgi
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center p-4">
              <i className="bi bi-lightning-charge display-4 text-warning mb-3"></i>
              <h4>Entegre Yapay Zeka</h4>
              <p>
                Farklı LLM modellerini kullanarak her görev için 
                en uygun yapay zeka desteğini alın. Gemma, Llama, Phi 
                ve diğer modelleri deneyin.
              </p>
              <Link to="/agents" className="btn btn-outline-warning btn-sm">
                Ajanları Keşfet
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-5">
        <Col className="text-center">
          <h2 className="h3 mb-4">Hemen Başlayın</h2>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/teams/create" className="btn btn-primary px-4">
              <i className="bi bi-plus-circle me-2"></i>
              Yeni Takım
            </Link>
            <Link to="/tasks/create" className="btn btn-success px-4">
              <i className="bi bi-list-check me-2"></i>
              Yeni Görev
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Home; 
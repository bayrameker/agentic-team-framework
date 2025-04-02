import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, ListGroup, Tab, Nav } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const CodeOutput = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [outputs, setOutputs] = useState([]);
  const [activeOutputId, setActiveOutputId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
      
      // Çıktı türündeki dokümanları filtrele
      if (response.data.documents) {
        const outputDocs = response.data.documents.filter(doc => 
          doc.title.endsWith('.output') || 
          doc.title.includes('output') || 
          doc.title.includes('çıktı')
        );
        setOutputs(outputDocs);
        
        // İlk çıktıyı aktif olarak ayarla
        if (outputDocs.length > 0) {
          setActiveOutputId(outputDocs[0].id);
        }
      }
    } catch (error) {
      console.error('Görev detayları alınırken hata:', error);
      toast.error('Görev bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTaskDetails();
    setRefreshing(false);
  };

  const getOutputTime = (output) => {
    return output.uploaded_at ? new Date(output.uploaded_at).toLocaleString() : 'Bilinmeyen zaman';
  };

  const formatOutput = (content) => {
    // Basit sözdizimi vurgulama için kod içeren satırları tanımla
    if (!content) return '';

    // Hata mesajlarını kırmızı olarak işaretle
    content = content.replace(/Error:|ERROR:|Exception:|EXCEPTION:|\[ERROR\]|\[HATA\]|Hata:/g, 
      '<span class="text-danger fw-bold">$&</span>');
    
    // Uyarıları sarı olarak işaretle
    content = content.replace(/Warning:|WARNING:|\[WARNING\]|\[UYARI\]|Uyarı:/g, 
      '<span class="text-warning fw-bold">$&</span>');
    
    // Başarı mesajlarını yeşil olarak işaretle
    content = content.replace(/Success:|SUCCESS:|\[SUCCESS\]|\[BAŞARILI\]|Başarılı:/g, 
      '<span class="text-success fw-bold">$&</span>');
    
    // Sayıları turkuaz olarak işaretle
    content = content.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-info">$&</span>');

    return content;
  };

  // Çıktının türünü tahmin et
  const guessOutputType = (output) => {
    const title = output.title.toLowerCase();
    const content = output.content || '';
    
    if (title.includes('test')) return 'Test';
    if (title.includes('build') || title.includes('derleme')) return 'Derleme';
    if (title.includes('lint') || title.includes('analiz')) return 'Kod Analizi';
    if (title.includes('run') || title.includes('çalıştır')) return 'Çalıştırma';
    if (title.includes('deploy') || title.includes('yayınlama')) return 'Yayınlama';
    
    // İçeriğe göre tahmin
    if (content.includes('test') || content.includes('assert')) return 'Test';
    if (content.includes('build') || content.includes('compile')) return 'Derleme';
    if (content.includes('warning:') || content.includes('error:')) return 'Kod Analizi';
    
    return 'Genel';
  };

  // Çıktı türüne göre rozet rengi
  const getOutputTypeBadgeVariant = (type) => {
    switch(type) {
      case 'Test': return 'primary';
      case 'Derleme': return 'secondary';
      case 'Kod Analizi': return 'warning';
      case 'Çalıştırma': return 'success';
      case 'Yayınlama': return 'info';
      default: return 'light';
    }
  };

  // Çıktı başarılı mı kontrol et
  const isOutputSuccessful = (content) => {
    if (!content) return null;
    
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('error') || 
        lowerContent.includes('hata') || 
        lowerContent.includes('fail') || 
        lowerContent.includes('başarısız')) {
      return false;
    }
    
    if (lowerContent.includes('success') || 
        lowerContent.includes('başarılı') || 
        lowerContent.includes('passed') || 
        lowerContent.includes('completed')) {
      return true;
    }
    
    return null; // Belirsiz
  };

  const getStatusBadge = (output) => {
    const status = isOutputSuccessful(output.content);
    
    if (status === true) {
      return <Badge bg="success">Başarılı</Badge>;
    } else if (status === false) {
      return <Badge bg="danger">Başarısız</Badge>;
    } else {
      return <Badge bg="secondary">Belirsiz</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2">Kod Çıktıları</h1>
              <p className="text-muted">
                {task ? (
                  <>
                    <Link to={`/tasks/${taskId}`} className="text-decoration-none">{task.name}</Link> görevinin çalıştırma sonuçları
                  </>
                ) : 'Yükleniyor...'}
              </p>
            </div>
            <Button 
              variant="outline-primary" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Yenileniyor...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Yenile
                </>
              )}
            </Button>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </Spinner>
          <p className="mt-3">Çıktılar yükleniyor...</p>
        </div>
      ) : outputs.length > 0 ? (
        <Row>
          <Col md={3}>
            <Card className="shadow mb-4 mb-md-0">
              <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">Çıktı Listesi</h5>
              </Card.Header>
              <ListGroup variant="flush">
                {outputs.map(output => {
                  const outputType = guessOutputType(output);
                  return (
                    <ListGroup.Item 
                      key={output.id}
                      action
                      active={activeOutputId === output.id}
                      onClick={() => setActiveOutputId(output.id)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-terminal me-2"></i>
                          <span className="text-truncate" style={{maxWidth: '150px'}}>
                            {output.title.replace('.output', '')}
                          </span>
                        </div>
                        <div className="mt-1">
                          <Badge 
                            bg={getOutputTypeBadgeVariant(outputType)} 
                            className="me-1"
                          >
                            {outputType}
                          </Badge>
                          {getStatusBadge(output)}
                        </div>
                      </div>
                      <small className="text-muted ms-2" style={{fontSize: '0.7rem'}}>
                        {getOutputTime(output)}
                      </small>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card>
          </Col>
          
          <Col md={9}>
            <Card className="shadow">
              <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {activeOutputId ? (
                    outputs.find(o => o.id === activeOutputId)?.title || 'Çıktı Detayı'
                  ) : 'Çıktı Detayı'}
                </h5>
                <div>
                  <Link to={`/tasks/${taskId}`} className="btn btn-sm btn-outline-light me-2">
                    <i className="bi bi-arrow-left-right me-1"></i>
                    Göreve Dön
                  </Link>
                  <Link to={`/code-base/${taskId}`} className="btn btn-sm btn-outline-light">
                    <i className="bi bi-code-slash me-1"></i>
                    Kod Temelini Görüntüle
                  </Link>
                </div>
              </Card.Header>
              
              <Card.Body 
                className="output-content bg-dark text-light" 
                style={{ 
                  minHeight: '500px',
                  maxHeight: 'calc(100vh - 240px)',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {activeOutputId ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formatOutput(outputs.find(o => o.id === activeOutputId)?.content || '') 
                    }} 
                  />
                ) : (
                  <div className="text-center p-5">
                    <i className="bi bi-terminal-fill fs-1"></i>
                    <p className="mt-3">Görüntülemek için sol menüden bir çıktı seçin</p>
                  </div>
                )}
              </Card.Body>
              
              {activeOutputId && (
                <Card.Footer className="bg-dark text-light border-top border-secondary">
                  <small>
                    Son çalıştırma: {outputs.find(o => o.id === activeOutputId)?.uploaded_at ? 
                      new Date(outputs.find(o => o.id === activeOutputId)?.uploaded_at).toLocaleString() : 
                      'Bilinmeyen zaman'}
                  </small>
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>
      ) : (
        <Card className="shadow">
          <Card.Body className="text-center p-5">
            <i className="bi bi-terminal fs-1 text-muted"></i>
            <h4 className="mt-4">Henüz Çıktı Yok</h4>
            <p className="text-muted">
              Bu görev için henüz kod çalıştırma çıktısı bulunmuyor. Çıktıları görmek için kod çalıştırın.
            </p>
            <div className="mt-4">
              <Link to={`/tasks/${taskId}`} className="btn btn-primary me-3">
                <i className="bi bi-arrow-return-left me-2"></i>
                Göreve Dön
              </Link>
              <Link to={`/code-base/${taskId}`} className="btn btn-secondary">
                <i className="bi bi-code-slash me-2"></i>
                Kod Temelini Görüntüle
              </Link>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default CodeOutput; 
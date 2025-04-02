import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { PlayFill, PauseFill, CodeSlash, FileText, ListTask, PeopleFill, BugFill, LightbulbFill } from 'react-bootstrap-icons';
import CodeEditor from './CodeEditor';
import LoadingOverlay from './LoadingOverlay';
import { executeTask, iterateTask, addSubtask, executeCode } from '../services/api';

const TeamDashboard = ({ team }) => {
    const [activeTask, setActiveTask] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState([]);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [currentCode, setCurrentCode] = useState('');

    // Takım üyelerini rollerine göre grupla
    const developers = team.agents.filter(agent => agent.role === 'developer');
    const testers = team.agents.filter(agent => agent.role === 'tester');
    const productManager = team.agents.find(agent => agent.role === 'product_manager');
    const projectManager = team.agents.find(agent => agent.role === 'project_manager');

    // Aktif görevi başlat
    const handleStartTask = async (taskId) => {
        setIsProcessing(true);
        try {
            const result = await executeTask(taskId);
            setActiveTask(result.task);
            setMessages(prev => [...prev, {
                type: 'info',
                content: 'Görev başlatıldı',
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                type: 'danger',
                content: error.message,
                timestamp: new Date()
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // Görev iterasyonu
    const handleIterate = async (feedback) => {
        if (!activeTask) return;
        
        setIsProcessing(true);
        try {
            const result = await iterateTask(activeTask.id, feedback);
            setActiveTask(result.task);
            setMessages(prev => [...prev, {
                type: 'success',
                content: 'Görev güncellendi',
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                type: 'danger',
                content: error.message,
                timestamp: new Date()
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // Kod çalıştırma
    const handleCodeSubmit = async (code) => {
        if (!activeTask) return;
        
        setIsProcessing(true);
        try {
            const result = await executeCode(activeTask.id, code);
            setCurrentCode(code);
            setMessages(prev => [...prev, {
                type: 'success',
                content: 'Kod başarıyla çalıştırıldı',
                timestamp: new Date()
            }]);
            return result;
        } catch (error) {
            setMessages(prev => [...prev, {
                type: 'danger',
                content: error.message,
                timestamp: new Date()
            }]);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Container fluid className="py-4">
            <Row>
                {/* Sol Panel - Takım Bilgileri */}
                <Col md={3}>
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">
                                <PeopleFill className="me-2" />
                                Takım Bilgileri
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <h6>Proje Yöneticisi</h6>
                            <p className="mb-3">{projectManager?.name || 'Atanmamış'}</p>
                            
                            <h6>Ürün Yöneticisi</h6>
                            <p className="mb-3">{productManager?.name || 'Atanmamış'}</p>
                            
                            <h6>Geliştiriciler</h6>
                            <ul className="list-unstyled">
                                {developers.map(dev => (
                                    <li key={dev.id} className="mb-2">
                                        <Badge bg="primary">{dev.name}</Badge>
                                    </li>
                                ))}
                            </ul>
                            
                            <h6>Test Uzmanları</h6>
                            <ul className="list-unstyled">
                                {testers.map(tester => (
                                    <li key={tester.id} className="mb-2">
                                        <Badge bg="info">{tester.name}</Badge>
                                    </li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Orta Panel - Aktif Görev ve Kod Editörü */}
                <Col md={6}>
                    {activeTask ? (
                        <Card className="mb-4">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{activeTask.title}</h5>
                                <Badge bg={activeTask.status === 'completed' ? 'success' : 'primary'}>
                                    {activeTask.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}
                                </Badge>
                            </Card.Header>
                            <Card.Body>
                                <p>{activeTask.description}</p>
                                
                                <div className="d-flex gap-2 mb-3">
                                    <Button 
                                        variant="primary" 
                                        onClick={() => setShowCodeEditor(!showCodeEditor)}
                                    >
                                        <CodeSlash className="me-1" />
                                        Kod Editörü
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => handleIterate('Görev devam ediyor...')}
                                    >
                                        <PauseFill className="me-1" />
                                        İterasyon
                                    </Button>
                                </div>

                                {showCodeEditor && (
                                    <CodeEditor 
                                        taskId={activeTask.id}
                                        onCodeSubmit={handleCodeSubmit}
                                        initialCode={currentCode}
                                        language="python"
                                    />
                                )}
                            </Card.Body>
                        </Card>
                    ) : (
                        <Card className="mb-4">
                            <Card.Body className="text-center">
                                <h5>Başlatılmış Görev Yok</h5>
                                <p className="text-muted">Yeni bir görev başlatmak için sağ paneli kullanın.</p>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Sağ Panel - Mesajlar ve Geri Bildirimler */}
                <Col md={3}>
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">
                                <FileText className="me-2" />
                                Mesajlar ve Geri Bildirimler
                            </h5>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {messages.map((msg, index) => (
                                <Alert 
                                    key={index} 
                                    variant={msg.type}
                                    className="mb-2"
                                >
                                    <small className="text-muted d-block mb-1">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </small>
                                    {msg.content}
                                </Alert>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {isProcessing && (
                <LoadingOverlay message="AI işlemi devam ediyor..." />
            )}
        </Container>
    );
};

export default TeamDashboard; 
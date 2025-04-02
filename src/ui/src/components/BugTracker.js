import React, { useState } from 'react';
import { Card, Form, Button, Badge, ListGroup } from 'react-bootstrap';
import { BugFill, CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';

const BugTracker = ({ bugs, onAddBug, onUpdateBugStatus }) => {
    const [newBug, setNewBug] = useState({
        title: '',
        description: '',
        severity: 'medium',
        status: 'open'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newBug.title.trim() || !newBug.description.trim()) return;

        onAddBug(newBug);
        setNewBug({
            title: '',
            description: '',
            severity: 'medium',
            status: 'open'
        });
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return 'danger';
            case 'medium':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open':
                return 'danger';
            case 'in_progress':
                return 'warning';
            case 'resolved':
                return 'success';
            default:
                return 'secondary';
        }
    };

    return (
        <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    <BugFill className="me-2" />
                    Hata Takibi
                </h5>
                <Badge bg="danger">{bugs.filter(bug => bug.status === 'open').length} Açık</Badge>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit} className="mb-4">
                    <Form.Group className="mb-3">
                        <Form.Label>Hata Başlığı</Form.Label>
                        <Form.Control
                            type="text"
                            value={newBug.title}
                            onChange={(e) => setNewBug(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Hata başlığını girin..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Açıklama</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={newBug.description}
                            onChange={(e) => setNewBug(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Hata açıklamasını girin..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Önem Derecesi</Form.Label>
                        <Form.Select
                            value={newBug.severity}
                            onChange={(e) => setNewBug(prev => ({ ...prev, severity: e.target.value }))}
                        >
                            <option value="low">Düşük</option>
                            <option value="medium">Orta</option>
                            <option value="high">Yüksek</option>
                        </Form.Select>
                    </Form.Group>
                    <Button type="submit" variant="primary">
                        Hata Ekle
                    </Button>
                </Form>

                <ListGroup>
                    {bugs.map((bug) => (
                        <ListGroup.Item key={bug.id} className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-1">{bug.title}</h6>
                                <p className="mb-1 text-muted small">{bug.description}</p>
                                <div className="d-flex gap-2">
                                    <Badge bg={getSeverityColor(bug.severity)}>
                                        {bug.severity === 'high' ? 'Yüksek' : 
                                         bug.severity === 'medium' ? 'Orta' : 'Düşük'}
                                    </Badge>
                                    <Badge bg={getStatusColor(bug.status)}>
                                        {bug.status === 'open' ? 'Açık' :
                                         bug.status === 'in_progress' ? 'İşlemde' : 'Çözüldü'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                {bug.status === 'open' && (
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={() => onUpdateBugStatus(bug.id, 'in_progress')}
                                    >
                                        <CheckCircleFill />
                                    </Button>
                                )}
                                {bug.status === 'in_progress' && (
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => onUpdateBugStatus(bug.id, 'resolved')}
                                    >
                                        <CheckCircleFill />
                                    </Button>
                                )}
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => onUpdateBugStatus(bug.id, 'open')}
                                >
                                    <XCircleFill />
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
};

export default BugTracker; 
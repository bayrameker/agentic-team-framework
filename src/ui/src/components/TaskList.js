import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const TaskList = ({ teamId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchTasks();
    }
  }, [teamId]);

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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      addToLogs(`${teamId} ID'li takımın görevleri getiriliyor...`);
      
      const response = await api.get(`/api/teams/${teamId}/tasks`);
      
      if (response.data && response.data.tasks) {
        setTasks(response.data.tasks);
        addToLogs(`${response.data.tasks.length} görev başarıyla getirildi`, 'success');
      } else {
        setTasks([]);
        addToLogs(`Görev verisi alındı ancak beklenen formatta değil`, 'warning');
      }
    } catch (error) {
      console.error('Görevler getirilirken hata:', error);
      setError('Görevler yüklenemedi');
      addToLogs(`Hata: ${error.response?.data?.detail || error.message}`, 'error');
      toast.error('Görevler yüklenemedi');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'new': { text: 'Yeni', color: 'secondary' },
      'in_progress': { text: 'Devam Ediyor', color: 'primary' },
      'completed': { text: 'Tamamlandı', color: 'success' },
      'failed': { text: 'Başarısız', color: 'danger' },
    };
    
    const statusInfo = statusMap[status] || { text: status, color: 'info' };
    
    return (
      <Badge bg={statusInfo.color}>
        {statusInfo.text}
      </Badge>
    );
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
        <h5 className="mb-0">Görevler</h5>
        <div>
          <Button 
            variant="light" 
            size="sm" 
            className="me-2"
            onClick={() => setShowLogs(!showLogs)}
          >
            <i className="bi bi-journal-text"></i> Loglar
          </Button>
          <Link 
            to={`/tasks/new?teamId=${teamId}`} 
            className="btn btn-success btn-sm"
          >
            <i className="bi bi-plus-circle"></i> Yeni Görev
          </Link>
        </div>
      </Card.Header>
      
      {showLogs && (
        <Card.Body className="bg-dark text-light p-3 log-container" style={{ maxHeight: '200px', overflow: 'auto' }}>
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
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Görevler yükleniyor...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : tasks.length > 0 ? (
          <ListGroup>
            {tasks.map(task => (
              <ListGroup.Item 
                key={task.id}
                action
                as={Link}
                to={`/tasks/${task.id}`}
                className="d-flex justify-content-between align-items-center task-item"
              >
                <div>
                  <div className="d-flex align-items-center mb-1">
                    <h6 className="mb-0 me-2">{task.title}</h6>
                    {getStatusBadge(task.status)}
                  </div>
                  <p className="mb-0 text-muted small">
                    {task.description.length > 120
                      ? `${task.description.substring(0, 120)}...`
                      : task.description}
                  </p>
                  <small className="text-muted">
                    <i className="bi bi-clock me-1"></i> 
                    {new Date(task.updated_at || task.created_at).toLocaleString()}
                  </small>
                </div>
                
                {task.progress !== undefined && (
                  <div className="d-none d-md-block" style={{ width: '120px' }}>
                    <div className="progress">
                      <div 
                        className={`progress-bar ${
                          task.status === 'completed' ? 'bg-success' : 
                          task.status === 'failed' ? 'bg-danger' : 'bg-primary'
                        }`}
                        role="progressbar" 
                        style={{ width: `${task.progress}%` }} 
                        aria-valuenow={task.progress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        {task.progress}%
                      </div>
                    </div>
                    {task.status_message && (
                      <small className="text-muted d-block mt-1">{task.status_message}</small>
                    )}
                  </div>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <div className="text-center py-4 bg-light rounded">
            <i className="bi bi-list-task display-4 text-muted"></i>
            <p className="mt-3">Bu takımda henüz görev bulunmuyor.</p>
            <Link
              to={`/tasks/new?teamId=${teamId}`}
              className="btn btn-primary btn-sm"
            >
              <i className="bi bi-plus-circle me-1"></i> İlk Görevi Oluştur
            </Link>
          </div>
        )}
      </Card.Body>
      
      <style jsx>{`
        .task-item {
          transition: all 0.2s ease;
        }
        
        .task-item:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .log-container {
          font-family: monospace;
          font-size: 0.9rem;
        }
        
        .log-entry {
          padding: 3px 0;
          border-bottom: 1px dotted #444;
        }
        
        .log-timestamp {
          color: #888;
          margin-right: 10px;
        }
      `}</style>
    </Card>
  );
};

export default TaskList; 
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, ProgressBar, Form } from 'react-bootstrap';
import { PlayFill, PauseFill, CodeSlash, FileText, ListTask } from 'react-bootstrap-icons';
import CodeEditor from './CodeEditor';
import LoadingOverlay from './LoadingOverlay';

function TaskCard({ task, onExecute, onIterate, onAddSubtask, team, onDelete }) {
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  const handleExecute = async () => {
    setIsProcessing(true);
    try {
      await onExecute(task.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIterate = async () => {
    setIsProcessing(true);
    try {
      await onIterate(task.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      await onAddSubtask(task.id, newSubtask);
      setNewSubtask('');
      setShowSubtaskForm(false);
    }
  };

  const handleCodeSubmit = async (code) => {
    // Burada kod çalıştırma işlemi yapılacak
    console.log('Kod çalıştırılıyor:', code);
    return 'Kod çıktısı burada görüntülenecek';
  };

  // Görev durumu için renk belirleme
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="badge bg-success-light text-success">Tamamlandı</span>;
      case 'in_progress':
        return <span className="badge bg-warning-light text-warning">Devam Ediyor</span>;
      case 'pending':
        return <span className="badge bg-info-light text-info">Bekliyor</span>;
      case 'failed':
        return <span className="badge bg-danger-light text-danger">Başarısız</span>;
      default:
        return <span className="badge bg-secondary-light text-secondary">Bilinmiyor</span>;
    }
  };

  // Görev tipine göre simge belirleme
  const getTaskIcon = (type) => {
    switch(type) {
      case 'document_review':
        return 'bi-file-earmark-text';
      case 'code_generation':
        return 'bi-code-square';
      case 'research':
        return 'bi-search';
      case 'data_analysis':
        return 'bi-bar-chart';
      default:
        return 'bi-list-task';
    }
  };

  return (
    <Card className="task-card mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">{task.title || 'İsimsiz Görev'}</h5>
          <small className="text-muted">Oluşturulma: {new Date(task.created_at).toLocaleString('tr-TR')}</small>
        </div>
        <div>
          {getStatusBadge(task.status)}
        </div>
      </Card.Header>
      
      <Card.Body>
        <p className="card-text">{task.description}</p>
        
        {task.team && (
          <div className="team-info mb-3 d-flex align-items-center">
            <i className="bi bi-people-fill text-primary me-2"></i>
            <span>
              <span className="fw-medium">Takım:</span> {task.team.name}
            </span>
          </div>
        )}
        
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mb-3">
            <h6>Alt Görevler</h6>
            <ProgressBar 
              now={task.subtasks.filter(st => st.status === 'completed').length / task.subtasks.length * 100} 
              label={`${task.subtasks.filter(st => st.status === 'completed').length}/${task.subtasks.length}`}
            />
            <ul className="list-unstyled mt-2">
              {task.subtasks.map(subtask => (
                <li key={subtask.id} className="d-flex align-items-center mb-1">
                  <Badge bg={subtask.status === 'completed' ? 'success' : 'secondary'} className="me-2">
                    {subtask.status === 'completed' ? '✓' : '○'}
                  </Badge>
                  {subtask.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            onClick={handleExecute}
            disabled={isProcessing || task.status === 'completed'}
          >
            <PlayFill className="me-1" />
            Çalıştır
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleIterate}
            disabled={isProcessing || task.status === 'completed'}
          >
            <PauseFill className="me-1" />
            İterasyon
          </Button>
          <Button 
            variant="info" 
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className="ms-auto"
          >
            <CodeSlash className="me-1" />
            Kod Editörü
          </Button>
        </div>

        {showCodeEditor && (
          <div className="mt-3">
            <CodeEditor 
              taskId={task.id}
              onCodeSubmit={handleCodeSubmit}
              language="python"
            />
          </div>
        )}

        {!showSubtaskForm ? (
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowSubtaskForm(true)}
          >
            <ListTask className="me-1" />
            Alt Görev Ekle
          </Button>
        ) : (
          <Form onSubmit={handleAddSubtask} className="mt-2">
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Alt görev açıklaması..."
              />
              <Button type="submit" variant="success" size="sm">
                Ekle
              </Button>
              <Button 
                type="button" 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setShowSubtaskForm(false)}
              >
                İptal
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>

      <Card.Footer className="bg-white border-top-0 d-flex justify-content-between">
        <div>
          <Link to={`/tasks/${task.id}`} className="btn btn-sm btn-primary me-2">
            <i className="bi bi-eye me-1"></i> Görüntüle
          </Link>
          <button 
            onClick={(e) => {
              e.preventDefault();
              onDelete(task.id);
            }} 
            className="btn btn-sm btn-outline-danger"
          >
            <i className="bi bi-trash me-1"></i> Sil
          </button>
        </div>
        <div>
          <Link to={`/code-base/${task.id}`} className="btn btn-sm btn-outline-secondary me-2">
            <i className="bi bi-code-slash"></i>
          </Link>
          <Link to={`/code-output/${task.id}`} className="btn btn-sm btn-outline-dark">
            <i className="bi bi-terminal"></i>
          </Link>
        </div>
      </Card.Footer>

      {isProcessing && (
        <LoadingOverlay message="AI işlemi devam ediyor..." />
      )}
    </Card>
  );
}

export default TaskCard; 
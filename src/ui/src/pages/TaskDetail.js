import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Container, Row, Col, Card, Badge, Button, ListGroup, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
import CodeEditor from '../components/CodeEditor';
import DocumentViewer from '../components/DocumentViewer';

function TaskDetail({ api, teams, refreshTasks }) {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  // Form için alt görev
  const [newSubtask, setNewSubtask] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  
  // Doküman yükleme için state
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    content: '',
    type: 'text'
  });
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [evaluatingDocument, setEvaluatingDocument] = useState(false);
  
  // İterasyon modalı için state
  const [showIterationModal, setShowIterationModal] = useState(false);
  
  // Polling için interval değişkeni
  const [pollingActive, setPollingActive] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Görev verilerini getir
  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/tasks/${taskId}`);
        setTask(response.data);
        setError(null);
      } catch (err) {
        console.error('Görev detayları alınırken hata:', err);
        setError('Görev bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    if (taskId) {
      fetchTaskDetails();
      startPolling(); // Polling'i başlat
    }
    
    return () => {
      // Component unmount olduğunda interval'ı temizle
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [api, taskId]);
  
  // Görev durumunu periyodik olarak kontrol et
  const startPolling = () => {
    // Daha önce başlatılmış polling varsa temizle
    stopPolling();
    
    // 5 saniyede bir görev durumunu kontrol et
    const interval = setInterval(() => {
      if (taskId) {
        fetchTaskStatus();
      }
    }, 5000);
    
    setPollingInterval(interval);
    setPollingActive(true);
  };
  
  // Polling'i durdur
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setPollingActive(false);
    }
  };

  // Görev durumunu kontrol et (sadece durum bilgisi al)
  const fetchTaskStatus = async () => {
    try {
      const response = await api.get(`/api/tasks/${taskId}/status`);
      
      // Durum değişikliği varsa task'ı güncelle
      if (response.data && task) {
        const statusChanged = task.status !== response.data.status;
        const progressChanged = task.progress !== response.data.progress;
        
        if (statusChanged || progressChanged) {
          // Task bilgilerini güncelle
          setTask(prevTask => ({
            ...prevTask,
            status: response.data.status,
            progress: response.data.progress,
            status_message: response.data.status_message,
            is_active: response.data.is_active,
            logs: response.data.logs
          }));
          
          // Status değişikliğinde bildirim göster
          if (statusChanged) {
            let message = '';
            let type = 'info';
            
            if (response.data.status === 'completed') {
              message = 'Görev başarıyla tamamlandı!';
              type = 'success';
            } else if (response.data.status === 'failed') {
              message = 'Görev başarısız oldu!';
              type = 'error';
            } else if (response.data.status === 'cancelled') {
              message = 'Görev iptal edildi!';
              type = 'warning';
            }
            
            if (message) {
              toast[type](message);
            }
          }
        }
      }
    } catch (err) {
      console.error("Görev durumu kontrol edilirken hata:", err);
      // Sessizce devam et, polling'i durdurmuyoruz
    }
  };
  
  // Alt görev ekleme
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    
    if (!newSubtask.trim()) {
      toast.error('Alt görev açıklaması gereklidir!');
      return;
    }
    
    setUpdating(true);
    
    try {
      await api.post(`/api/tasks/${taskId}/subtasks/add`, { 
        description: newSubtask,
        title: subtaskTitle || undefined
      });
      
      // Görev bilgilerini güncellenmiş görevi kullan
      const taskResponse = await api.get(`/api/tasks/${taskId}`);
      setTask(taskResponse.data);
      await refreshTasks();
      
      toast.success('Alt görev başarıyla eklendi!');
      setNewSubtask('');
      setSubtaskTitle('');
    } catch (error) {
      console.error('Alt görev eklerken hata:', error);
      toast.error('Alt görev eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Doküman formunun girdi değişiklikleri
  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument({ ...newDocument, [name]: value });
  };
  
  // Doküman yükleme
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      toast.error('Doküman başlığı ve içeriği gereklidir!');
      return;
    }
    
    setUploadingDocument(true);
    
    try {
      await api.post(`/api/tasks/${taskId}/documents/upload`, newDocument);
      
      // Görev bilgilerini güncelle
      const taskResponse = await api.get(`/api/tasks/${taskId}`);
      setTask(taskResponse.data);
      await refreshTasks();
      
      toast.success('Doküman başarıyla yüklendi!');
      setNewDocument({ title: '', content: '', type: 'text' });
      setShowDocumentUpload(false);
    } catch (error) {
      console.error('Doküman yüklenirken hata:', error);
      toast.error('Doküman yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setUploadingDocument(false);
    }
  };
  
  // Dokümanı değerlendir
  const handleEvaluateDocument = async (documentId) => {
    setEvaluatingDocument(true);
    
    try {
      await api.post(`/api/tasks/${taskId}/documents/${documentId}/evaluate`);
      
      // Görev bilgilerini güncelle
      const taskResponse = await api.get(`/api/tasks/${taskId}`);
      setTask(taskResponse.data);
      await refreshTasks();
      
      toast.success('Doküman başarıyla değerlendirildi!');
    } catch (error) {
      console.error('Doküman değerlendirilirken hata:', error);
      toast.error('Doküman değerlendirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setEvaluatingDocument(false);
    }
  };
  
  // Görevi çalıştır
  const handleExecuteTask = async () => {
    if (!task || !task.id) return;
    
    try {
      setLoading(true);
      setExecuting(true);
      
      const response = await api.post(`/api/tasks/${task.id}/execute`);
      
      if (response.data) {
        toast.success("Görev başlatıldı!");
        
        // Görev bilgilerini güncelle
        setTask(prevTask => ({
          ...prevTask,
          status: 'in_progress',
          is_active: true
        }));
        
        // Polling'i başlat
        startPolling();
        
        // Görevleri yenile
        if (refreshTasks) await refreshTasks();
        
        // Görev detaylarını tekrar yükle (tüm verileri almak için)
        const taskDetails = await api.get(`/api/tasks/${task.id}`);
        setTask(taskDetails.data);
      }
    } catch (err) {
      console.error("Görev çalıştırılırken hata:", err);
      toast.error("Görev başlatılamadı: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
      setExecuting(false);
    }
  };
  
  // Görev iterasyonu
  const handleIterateTask = async (feedback) => {
    try {
        setExecuting(true);
        setLoading(true);
        
        await api.post(`/api/tasks/${taskId}/iterate`, { feedback });
        
        // Görev bilgilerini güncelle
        const taskResponse = await api.get(`/api/tasks/${taskId}`);
        setTask(taskResponse.data);
        await refreshTasks();
        
        // Polling'i başlat
        startPolling();
        
        toast.success('Görev iterasyonu başarıyla başlatıldı!');
    } catch (error) {
        console.error('Görev iterasyonu sırasında hata:', error);
        toast.error('Görev iterasyonu yapılamadı. Lütfen tekrar deneyin.');
    } finally {
        setLoading(false);
        setExecuting(false);
    }
  };
  
  // İterasyon modalını aç
  const handleOpenIterationModal = () => {
    setShowIterationModal(true);
  };
  
  // İterasyon modalını kapat
  const handleCloseIterationModal = () => {
    setShowIterationModal(false);
  };
  
  // Görevi sil
  const handleDeleteTask = async () => {
    if (window.confirm('Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await api.delete(`/api/tasks/${taskId}`);
        await refreshTasks();
        toast.success('Görev başarıyla silindi!');
        navigate('/tasks');
      } catch (error) {
        console.error('Görev silinirken hata:', error);
        toast.error('Görev silinemedi. Lütfen tekrar deneyin.');
      }
    }
  };
  
  // Görevi iptal et
  const handleCancelTask = async () => {
    if (!task || !task.id) return;
    
    // Kullanıcıdan onay al
    if (!window.confirm('Görevi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post(`/api/tasks/${task.id}/cancel`);
      
      if (response.data && response.data.message) {
        toast.success(response.data.message);
        
        // Görev bilgilerini güncelle
        setTask(prevTask => ({
          ...prevTask,
          status: 'cancelled',
          is_active: false
        }));
        
        // Görevleri yenile
        if (refreshTasks) refreshTasks();
      }
    } catch (err) {
      console.error("Görev iptal edilirken hata:", err);
      toast.error("Görev iptal edilemedi!");
    } finally {
      setLoading(false);
    }
  };
  
  // Görev durumuna göre renk belirle
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'in_progress':
        return 'bg-primary';
      case 'failed':
        return 'bg-danger';
      case 'cancelled':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };
  
  // Ajan çıktılarını göster
  const renderAgentOutputs = () => {
    if (!task || !task.subtasks || task.subtasks.length === 0) {
      return (
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">Ajan Çıktıları</h5>
          </Card.Header>
          <Card.Body className="text-center text-muted">
            <p>Bu görev için henüz ajan çıktısı bulunmuyor.</p>
          </Card.Body>
        </Card>
      );
    }
    
    return (
      <Card className="mb-4 shadow">
        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Ajan Çıktıları</h5>
          <Badge bg="light" text="dark">
            {task.subtasks.length} alt görev
          </Badge>
        </Card.Header>
        <div className="overflow-auto" style={{maxHeight: '600px'}}>
          <ListGroup variant="flush">
            {task.subtasks.map((subtask, index) => (
              <ListGroup.Item key={subtask.id} className={index % 2 === 0 ? "bg-light" : ""}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span className="fw-bold">{subtask.title || 'İsimsiz alt görev'}</span>
                    {subtask.assigned_agent_id && (
                      <Badge bg="info" className="ms-2">
                        {task.agents?.find(a => a.id === subtask.assigned_agent_id)?.name || 'Ajan'}
                      </Badge>
                    )}
                  </div>
                  <Badge bg={getStatusBadgeClass(subtask.status)}>
                    {getStatusText(subtask.status)}
                  </Badge>
                </div>
                <p className="mb-1 text-muted small">{subtask.description}</p>
                {subtask.result && (
                  <div className="mt-2 p-3 bg-light rounded border shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0">
                        <i className="bi bi-robot me-1"></i> Ajan Çıktısı:
                      </h6>
                      <div>
                        <small className="text-muted me-2">
                          {new Date(subtask.completed_at || subtask.created_at).toLocaleString()}
                        </small>
                        <Badge bg={subtask.status === "completed" ? "success" : "primary"} className="px-2">
                          {subtask.status === "completed" ? "Tamamlandı" : "Devam Ediyor"}
                        </Badge>
                      </div>
                    </div>
                    <div className="output-content" style={{
                      whiteSpace: "pre-wrap", 
                      maxHeight: "200px", 
                      overflowY: "auto", 
                      fontFamily: "monospace", 
                      fontSize: "0.85rem",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #dee2e6",
                      borderRadius: "0.25rem",
                      padding: "0.75rem"
                    }}>
                      {typeof subtask.result === 'string' && subtask.result.length > 500 
                        ? `${subtask.result.substring(0, 500)}...`
                        : subtask.result}
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/tasks/${taskId}/output/${subtask.id}`)}
                      >
                        <i className="bi bi-code-slash me-1"></i> Tüm Çıktıyı Görüntüle
                      </button>
                      {task.documents && task.documents.length > 0 && (
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowDocumentModal(true)}
                        >
                          <i className="bi bi-file-text me-1"></i> İlgili Dokümanları Gör
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {subtask.status === "in_progress" && !subtask.result && (
                  <div className="text-center py-3">
                    <Spinner animation="border" variant="info" size="sm" className="me-2" />
                    <span className="text-muted">Ajan çalışıyor...</span>
                  </div>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      </Card>
    );
  };
  
  // Görev ilerlemesini göster
  const renderTaskProgress = () => {
    if (!task) return null;
    
    const isInProgress = task.status === 'in_progress';
    const statusMessage = task.status_message || 'İşleniyor...';
    const progress = task.progress || 0;
    
    // Görev durumuna göre ilerleme çubuğu durumunu belirle
    let progressBarClass = 'progress-bar progress-bar-striped ';
    let statusBadgeClass = '';
    
    // Animasyon için
    if (isInProgress) {
      progressBarClass += 'progress-bar-animated ';
    }
    
    // Renk için
    if (task.status === 'completed') {
      progressBarClass += 'bg-success';
      statusBadgeClass = 'bg-success';
    } else if (task.status === 'failed') {
      progressBarClass += 'bg-danger';
      statusBadgeClass = 'bg-danger';
    } else if (task.status === 'cancelled') {
      progressBarClass += 'bg-warning';
      statusBadgeClass = 'bg-warning';
    } else if (task.status === 'waiting') {
      progressBarClass += 'bg-info';
      statusBadgeClass = 'bg-info';
    } else {
      progressBarClass += 'bg-primary';
      statusBadgeClass = 'bg-primary';
    }
    
    // Durum Metni
    let statusText = getStatusText(task.status);
    
    return (
      <Card className="mb-4 shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">Görev İlerlemesi</h5>
          <div className="d-flex align-items-center">
            <Badge bg={statusBadgeClass} className="me-2 px-3 py-2">
              {statusText}
            </Badge>
            {isInProgress && (
              <div className="spinner-border spinner-border-sm text-light" role="status">
                <span className="visually-hidden">İşleniyor...</span>
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-2 d-flex justify-content-between">
            <div>
              <strong>{statusMessage}</strong>
              {isInProgress && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-3"
                  onClick={handleCancelTask}
                  disabled={loading || executing}
                >
                  {loading || executing ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <><i className="bi bi-x-circle me-1"></i> Görevi İptal Et</>
                  )}
                </Button>
              )}
              {task.status === 'completed' && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="ms-3"
                  onClick={() => setShowIterationModal(true)}
                  disabled={loading || executing}
                >
                  {loading || executing ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <><i className="bi bi-arrow-repeat me-1"></i> Görevi İterasyona Al</>
                  )}
                </Button>
              )}
            </div>
            <div className="text-end">
              <strong>%{progress}</strong>
              <div>
                <small className="text-muted">
                  Son güncelleme: {new Date(task.updated_at).toLocaleTimeString()}
                </small>
              </div>
            </div>
          </div>
          <div className="progress mb-3" style={{height: '25px'}}>
            <div 
              className={progressBarClass}
              role="progressbar" 
              style={{width: `${progress}%`}} 
              aria-valuenow={progress} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {progress > 10 ? `%${progress}` : ''}
            </div>
          </div>
          
          {task.logs && task.logs.length > 0 && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">İşlem Günlüğü:</h6>
                <div>
                  <small className="text-muted me-2">
                    {task.is_active ? 'Gerçek zamanlı izleniyor' : 'Son güncellenme: ' + new Date(task.updated_at).toLocaleString()}
                  </small>
                  <Button 
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      if (pollingActive) {
                        stopPolling();
                      } else {
                        startPolling();
                      }
                    }}
                  >
                    <i className={`bi bi-${pollingActive ? 'pause' : 'play'}`}></i>
                    {pollingActive ? ' Durdur' : ' Devam Et'}
                  </Button>
                </div>
              </div>
              <div className="log-container bg-dark text-light p-2 rounded" style={{
                maxHeight: '300px', 
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}>
                {task.logs.slice().reverse().map((log, index) => (
                  <div key={index} className="mb-1" style={{whiteSpace: 'pre-wrap'}}>
                    <span className="text-muted">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className={log.message.includes('HATA') ? 'text-danger' : 
                                    log.message.includes('başarı') ? 'text-success' : 
                                    'text-light'}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  // Durum metni
  const getStatusText = (status) => {
    switch(status) {
      case 'new':
        return 'Yeni';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'failed':
        return 'Başarısız';
      case 'cancelled':
        return 'İptal Edildi';
      case 'waiting':
        return 'Bekliyor';
      default:
        return status;
    }
  };
  
  // Alt görevleri render et
  const renderSubtasks = () => {
    if (!task || !task.subtasks || task.subtasks.length === 0) {
      return (
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>Alt Görevler</span>
          </div>
          <div className="card-body text-center text-muted">
            <p>Bu görev için henüz alt görev bulunmuyor.</p>
          </div>
        </div>
      )
    }

    const subtasks = task.subtasks || [];
    
    return (
      <div className="card mb-4 shadow">
        <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
          <span>Alt Görevler</span>
          <Badge bg="light" text="dark">
            {subtasks.length} alt görev
          </Badge>
        </div>
        <div className="card-body p-0">
          <div className="list-group" style={{maxHeight: '500px', overflowY: 'auto'}}>
            {subtasks.map((subtask, index) => {
              const agent = task.agents?.find(a => a.id === subtask.assigned_agent_id);
              const agentName = subtask.assigned_agent_name || agent?.name || 'Ajan';
              const agentRole = subtask.assigned_agent_role || agent?.role || 'Bilinmeyen Rol';
              
              // Durum renkleri ve ikonları
              let statusClass = "secondary";
              let statusIcon = "bi-question-circle";
              
              if (subtask.status === "completed") {
                statusClass = "success";
                statusIcon = "bi-check-circle-fill";
              } else if (subtask.status === "in_progress") {
                statusClass = "primary";
                statusIcon = "bi-arrow-clockwise";
              } else if (subtask.status === "waiting") {
                statusClass = "warning";
                statusIcon = "bi-hourglass-split";
              } else if (subtask.status === "failed") {
                statusClass = "danger";
                statusIcon = "bi-exclamation-circle-fill";
              }
              
              // Progress değeri
              const progress = subtask.status === "completed" ? 100 : 
                            subtask.status === "in_progress" ? 50 : 
                            subtask.status === "waiting" ? 0 : 0;
              
              return (
                <div key={subtask.id} 
                  className={`list-group-item list-group-item-action p-0 ${index % 2 === 0 ? 'bg-light' : ''}`}>
                  <div className="accordion" id={`subtaskAccordion${index}`}>
                    <div className="accordion-item border-0">
                      <h2 className="accordion-header">
                        <button 
                          className="accordion-button p-3" 
                          type="button" 
                          data-bs-toggle="collapse" 
                          data-bs-target={`#subtaskCollapse${index}`}
                          aria-expanded={index === 0 ? "true" : "false"}
                        >
                          <div className="d-flex justify-content-between align-items-center w-100">
                            <div className="d-flex align-items-center">
                              <i className={`bi ${statusIcon} text-${statusClass} me-2`}></i>
                              <div>
                                <strong className="d-block">{subtask.title || `Alt Görev #${index+1}`}</strong>
                                <div className="subtask-meta text-muted small">
                                  <span className="me-2">
                                    <i className="bi bi-person me-1"></i> {agentName}
                                  </span>
                                  <span className="me-2">
                                    <i className="bi bi-briefcase me-1"></i> {agentRole}
                                  </span>
                                  <span>
                                    <i className="bi bi-calendar me-1"></i> {new Date(subtask.updated_at || subtask.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="d-flex align-items-center">
                              <div className="progress me-3" style={{width: '80px', height: '8px'}}>
                                <div className={`progress-bar bg-${statusClass}`} style={{width: `${progress}%`}}></div>
                              </div>
                              <Badge bg={statusClass} className="ms-1">
                                {getStatusText(subtask.status)}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      </h2>
                      <div 
                        id={`subtaskCollapse${index}`} 
                        className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                        data-bs-parent={`#subtaskAccordion${index}`}
                      >
                        <div className="accordion-body p-3">
                          <p className="mb-3 text-muted">{subtask.description}</p>
                          
                          {subtask.status === "in_progress" && (
                            <div className="alert alert-primary d-flex align-items-center">
                              <Spinner animation="border" size="sm" className="me-2" />
                              <div>
                                <strong>İşleniyor:</strong> {agentName} bu alt görev üzerinde çalışıyor.
                              </div>
                            </div>
                          )}

                          {subtask.result && (
                            <div className="mt-3">
                              <h6 className="mb-2">
                                <i className="bi bi-robot me-2"></i>
                                Ajan Çıktısı
                              </h6>
                              <div className="border rounded p-3 bg-light" style={{
                                maxHeight: '300px', 
                                overflowY: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {typeof subtask.result === 'string' && subtask.result.length > 1000 
                                  ? `${subtask.result.substring(0, 1000)}...`
                                  : subtask.result}
                              </div>
                              <div className="d-flex justify-content-end mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline-primary"
                                  onClick={() => {
                                    const modal = new window.bootstrap.Modal(document.getElementById(`subtaskResultModal${index}`));
                                    modal.show();
                                  }}
                                >
                                  <i className="bi bi-arrows-fullscreen me-1"></i>
                                  Tam Ekran Görüntüle
                                </Button>
                              </div>
                              
                              {/* Modal */}
                              <div className="modal fade" id={`subtaskResultModal${index}`} tabIndex="-1" aria-hidden="true">
                                <div className="modal-dialog modal-xl modal-fullscreen-lg-down">
                                  <div className="modal-content">
                                    <div className="modal-header">
                                      <h5 className="modal-title">{subtask.title} - Ajan Çıktısı</h5>
                                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div className="modal-body" style={{
                                      maxHeight: '70vh',
                                      overflowY: 'auto'
                                    }}>
                                      <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                          <span className="badge bg-info me-2">{agentRole}</span>
                                          <span className="text-muted">{agentName}</span>
                                        </div>
                                        <div>
                                          <button 
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => {
                                              navigator.clipboard.writeText(subtask.result);
                                              toast.success('İçerik panoya kopyalandı!');
                                            }}
                                          >
                                            <i className="bi bi-clipboard me-1"></i>
                                            Kopyala
                                          </button>
                                        </div>
                                      </div>
                                      <div className="border rounded p-3 bg-light" style={{
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap'
                                      }}>
                                        {subtask.result}
                                      </div>
                                    </div>
                                    <div className="modal-footer">
                                      <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {!subtask.result && subtask.status === "waiting" && (
                            <div className="alert alert-warning">
                              <i className="bi bi-hourglass-split me-2"></i>
                              Bu alt görev henüz başlatılmadı, sırasını bekliyor.
                            </div>
                          )}
                          
                          {!subtask.result && subtask.status === "failed" && (
                            <div className="alert alert-danger">
                              <i className="bi bi-exclamation-triangle-fill me-2"></i>
                              Alt görev gerçekleştirilemedi.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="alert alert-warning" role="alert">
        Görev bulunamadı. <Link to="/tasks">Görevlere dön</Link>
      </div>
    );
  }
  
  // İlgili takımı bul
  const team = teams?.find(t => t.id === task.team_id);
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">
          {task.name || task.description.substring(0, 20) + '...'}
          <Badge 
            className="ms-2" 
            bg={getStatusBadgeClass(task.status)}
          >
            {getStatusText(task.status)}
          </Badge>
        </h1>
        <div>
          <Link to="/tasks" className="btn btn-outline-secondary me-2">
            <i className="bi bi-arrow-left me-1"></i> Geri
          </Link>
          <Button 
            variant="danger" 
            onClick={handleDeleteTask}
            className="me-2"
            disabled={loading || executing}
          >
            <i className="bi bi-trash me-1"></i> Sil
          </Button>
          
          {task.status === 'completed' && (
            <Button 
              variant="success" 
              onClick={handleOpenIterationModal}
              disabled={loading || executing}
            >
              {loading || executing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-repeat me-1"></i> İterasyon
                </>
              )}
            </Button>
          )}
          
          {(task.status === 'new' || task.status === 'failed') && (
            <Button 
              variant="primary" 
              onClick={handleExecuteTask}
              disabled={loading || executing}
            >
              {loading || executing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Çalıştırılıyor...
                </>
              ) : (
                <>
                  <i className="bi bi-play-fill me-1"></i> Çalıştır
                </>
              )}
            </Button>
          )}
          
          {task.status === 'in_progress' && (
            <Button 
              variant="warning" 
              onClick={handleCancelTask}
              disabled={loading || executing}
            >
              {loading || executing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  İptal Ediliyor...
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle me-1"></i> İptal Et
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Görev İlerlemesi */}
      {renderTaskProgress()}

      <Row>
        <Col md={12} lg={8}>
          {/* Görev detayları */}
          <Card className="mb-4 shadow">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Görev Detayları</h5>
            </Card.Header>
            <Card.Body>
              <h5 className="mb-3">Açıklama</h5>
              <div className="py-2 px-3 bg-light rounded border mb-4">
                <p style={{whiteSpace: 'pre-wrap'}}>{task.description}</p>
              </div>
              
              <Row className="mb-4">
                <Col md={6}>
                  <div className="info-block border rounded p-3">
                    <h6 className="mb-2">
                      <i className="bi bi-info-circle me-2"></i>
                      Genel Bilgiler
                    </h6>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2">
                        <span className="text-muted me-2">Oluşturulma:</span>
                        {new Date(task.created_at).toLocaleString()}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">Son Güncelleme:</span>
                        {new Date(task.updated_at).toLocaleString()}
                      </li>
                      <li>
                        <span className="text-muted me-2">Takım:</span>
                        {team ? (
                          <Link to={`/teams/${team.id}`} className="text-decoration-none">
                            <span className="badge bg-info">{team.name}</span>
                          </Link>
                        ) : (
                          <span className="badge bg-secondary">Belirtilmemiş</span>
                        )}
                      </li>
                    </ul>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-block border rounded p-3">
                    <h6 className="mb-2">
                      <i className="bi bi-people me-2"></i>
                      Takım Ajanları
                    </h6>
                    {team && team.agents && team.agents.length > 0 ? (
                      <ul className="list-group list-group-flush">
                        {team.agents.map((agent, index) => (
                          <li key={agent.id} className="list-group-item border-0 px-0 py-1">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-robot me-2 text-primary"></i>
                              <div>
                                <span className="fw-medium">{agent.name}</span>
                                <div className="d-flex align-items-center">
                                  <Badge bg="info" className="me-2">{agent.role}</Badge>
                                  <small className="text-muted">{agent.model}</small>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">Bu takımda henüz ajan bulunmuyor.</p>
                    )}
                  </div>
                </Col>
              </Row>
              
              {/* Alt görevler */}
              {renderSubtasks()}
              
              {/* Ajan Çıktıları */}
              {renderAgentOutputs()}
              
              {/* Görev Sonucu */}
              {task.result && (
                <Card className="mb-4 mt-4 shadow-sm">
                  <Card.Header className="bg-success text-white">
                    <h5 className="mb-0">Görev Sonucu</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="result-content p-3 bg-light rounded border" style={{
                      whiteSpace: 'pre-wrap', 
                      maxHeight: '400px', 
                      overflowY: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}>
                      {typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={12} lg={4}>
          {/* Doküman Görüntüleyici */}
          {task.documents && task.documents.length > 0 ? (
            <DocumentViewer taskId={taskId} onDocumentUpdated={() => refreshTasks()} />
          ) : (
            <Card className="mb-4 shadow">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Dokümanlar</h5>
              </Card.Header>
              <Card.Body className="text-center p-5">
                <i className="bi bi-file-earmark-text display-4 text-muted mb-3"></i>
                <p className="mb-0 text-muted">Bu görev için henüz doküman bulunmuyor.</p>
              </Card.Body>
              <Card.Footer>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100"
                  onClick={() => setShowDocumentUpload(true)}
                >
                  <i className="bi bi-file-earmark-plus me-1"></i> Doküman Yükle
                </Button>
              </Card.Footer>
            </Card>
          )}
          
          {/* Yeni Doküman Yükleme Formu */}
          <Card className={`mb-4 shadow ${!showDocumentUpload ? 'd-none' : ''}`}>
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Doküman Yükle</h5>
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setShowDocumentUpload(false)}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleDocumentUpload}>
                <div className="mb-3">
                  <label htmlFor="docTitle" className="form-label">Başlık</label>
                  <input
                    type="text"
                    className="form-control"
                    id="docTitle"
                    name="title"
                    value={newDocument.title}
                    onChange={handleDocumentInputChange}
                    disabled={uploadingDocument}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="docType" className="form-label">Tür</label>
                  <select
                    className="form-select"
                    id="docType"
                    name="type"
                    value={newDocument.type}
                    onChange={handleDocumentInputChange}
                    disabled={uploadingDocument}
                  >
                    <option value="text">Metin</option>
                    <option value="code">Kod</option>
                    <option value="specification">Spesifikasyon</option>
                    <option value="requirements">Gereksinimler</option>
                    <option value="design">Tasarım</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="docContent" className="form-label">İçerik</label>
                  <textarea
                    className="form-control"
                    id="docContent"
                    name="content"
                    value={newDocument.content}
                    onChange={handleDocumentInputChange}
                    disabled={uploadingDocument}
                    rows="10"
                    required
                  ></textarea>
                </div>
                <div className="d-grid">
                  <Button 
                    variant="success" 
                    type="submit"
                    disabled={uploadingDocument}
                  >
                    {uploadingDocument ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-1"></i> Yükle
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
          
          {/* Alt Görev Ekleme Formu */}
          <Card className="mb-4 shadow">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">Alt Görev Ekle</h5>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleAddSubtask}>
                <div className="mb-3">
                  <label htmlFor="subtaskTitle" className="form-label">Başlık</label>
                  <input
                    type="text"
                    className="form-control"
                    id="subtaskTitle"
                    placeholder="Alt görev başlığı"
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    disabled={updating || loading || executing}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="subtaskDesc" className="form-label">Açıklama</label>
                  <textarea
                    className="form-control"
                    id="subtaskDesc"
                    placeholder="Alt görev açıklaması"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    disabled={updating || loading || executing}
                    rows="4"
                    required
                  ></textarea>
                </div>
                <div className="d-grid">
                  <Button 
                    variant="warning" 
                    type="submit"
                    disabled={updating || loading || executing}
                    className="text-dark"
                  >
                    {updating ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-1"></i> Alt Görev Ekle
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Kod Editörü */}
      <Row className="mt-4">
        <Col md={12}>
          <Card className="mb-4 shadow">
            <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
              <h5 className="mb-0">Kod Yönetimi</h5>
              <div>
                <Link to={`/code-base/${taskId}`} className="btn btn-light btn-sm me-2">
                  <i className="bi bi-code-slash me-1"></i>
                  Kod Temeli
                </Link>
                <Link to={`/code-output/${taskId}`} className="btn btn-light btn-sm">
                  <i className="bi bi-terminal me-1"></i>
                  Çıktılar
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              <CodeEditor taskId={taskId} onCodeUpdated={refreshTasks} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* İterasyon Modalı */}
      {showIterationModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Görev İterasyonu</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseIterationModal} disabled={loading}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const feedback = e.target.elements.feedback.value;
                  handleIterateTask(feedback);
                  handleCloseIterationModal();
                }}>
                  <div className="mb-3">
                    <label htmlFor="feedback" className="form-label">Geri Bildirim</label>
                    <textarea 
                      className="form-control" 
                      id="feedback" 
                      name="feedback" 
                      rows="5" 
                      placeholder="Görev sonucu hakkında geri bildiriminizi girin..."
                      required
                      disabled={loading}
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={handleCloseIterationModal} disabled={loading}>İptal</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          İşleniyor...
                        </>
                      ) : (
                        'İterasyonu Başlat'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </Container>
  );
}

export default TaskDetail; 
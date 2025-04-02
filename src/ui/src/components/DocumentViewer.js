import React, { useState, useEffect } from 'react';
import { Card, Button, Tabs, Tab, Badge, Alert, Spinner } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const DocumentViewer = ({ taskId, onDocumentUpdated }) => {
  const [documents, setDocuments] = useState([]);
  const [codeDocuments, setCodeDocuments] = useState([]);
  const [textDocuments, setTextDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    if (taskId) {
      fetchDocuments();
    }
  }, [taskId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/tasks/${taskId}/documents`);
      if (response.data && response.data.documents) {
        const docs = response.data.documents;
        setDocuments(docs);
        
        // Belgeleri türlerine göre ayır
        const codeDocs = docs.filter(doc => doc.type === 'code');
        const textDocs = docs.filter(doc => doc.type === 'text');
        
        setCodeDocuments(codeDocs);
        setTextDocuments(textDocs);
        
        // Aktif dokümanı ayarla (önce son eklenen kodu göster)
        if (docs.length > 0) {
          if (codeDocs.length > 0) {
            setActiveDocument(codeDocs[0]);
          } else {
            setActiveDocument(docs[0]);
          }
        }
      }
      setError('');
    } catch (err) {
      console.error('Dokümanlar yüklenirken hata:', err);
      setError('Dokümanlar yüklenemedi.');
      toast.error('Dokümanlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFromFilename = (filename) => {
    if (!filename) return 'text';
    
    const extension = filename.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'java': 'java',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'json': 'json',
      'md': 'markdown',
      'sql': 'sql',
      'xml': 'xml',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'sh': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml'
    };
    
    return langMap[extension] || 'text';
  };

  const evaluateDocument = async (documentId) => {
    if (!documentId) return;
    
    setEvaluating(true);
    try {
      const response = await api.post(`/api/tasks/${taskId}/documents/${documentId}/evaluate`);
      if (response.data && response.data.consolidated_evaluation) {
        setEvaluation(response.data.consolidated_evaluation);
        toast.success('Doküman başarıyla değerlendirildi');
      }
    } catch (err) {
      console.error('Doküman değerlendirilirken hata:', err);
      toast.error('Doküman değerlendirilemedi');
    } finally {
      setEvaluating(false);
    }
  };

  const renderDocumentList = () => {
    if (loading) {
      return (
        <div className="text-center p-4">
          <Spinner animation="border" />
          <p className="mt-2">Dokümanlar yükleniyor...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="danger">
          <Alert.Heading>Hata!</Alert.Heading>
          <p>{error}</p>
        </Alert>
      );
    }
    
    if (documents.length === 0) {
      return (
        <div className="text-center p-4 text-muted">
          <i className="bi bi-file-earmark-x fs-1"></i>
          <p className="mt-2">Bu görev için henüz doküman bulunmuyor.</p>
        </div>
      );
    }
    
    return (
      <div className="document-list">
        <Tabs defaultActiveKey="code" className="mb-3">
          <Tab eventKey="code" title={<><i className="bi bi-code-slash me-1"></i> Kod Dosyaları ({codeDocuments.length})</>}>
            {codeDocuments.length > 0 ? (
              <div className="list-group">
                {codeDocuments.map(doc => (
                  <button
                    key={doc.id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeDocument && activeDocument.id === doc.id ? 'active' : ''}`}
                    onClick={() => setActiveDocument(doc)}
                  >
                    <div className="text-truncate">
                      <i className="bi bi-file-code me-2"></i>
                      {doc.title}
                    </div>
                    <small className="text-nowrap ms-2">
                      {new Date(doc.uploaded_at).toLocaleTimeString()}
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center p-3 text-muted">
                <p>Henüz kod dosyası yok</p>
              </div>
            )}
          </Tab>
          
          <Tab eventKey="documents" title={<><i className="bi bi-file-text me-1"></i> Dokümanlar ({textDocuments.length})</>}>
            {textDocuments.length > 0 ? (
              <div className="list-group">
                {textDocuments.map(doc => (
                  <button
                    key={doc.id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeDocument && activeDocument.id === doc.id ? 'active' : ''}`}
                    onClick={() => setActiveDocument(doc)}
                  >
                    <div className="text-truncate">
                      <i className="bi bi-file-text me-2"></i>
                      {doc.title}
                    </div>
                    <small className="text-nowrap ms-2">
                      {new Date(doc.uploaded_at).toLocaleTimeString()}
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center p-3 text-muted">
                <p>Henüz doküman yok</p>
              </div>
            )}
          </Tab>
          
          <Tab eventKey="all" title={<><i className="bi bi-folder me-1"></i> Tüm Dosyalar ({documents.length})</>}>
            <div className="list-group">
              {documents.map(doc => (
                <button
                  key={doc.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeDocument && activeDocument.id === doc.id ? 'active' : ''}`}
                  onClick={() => setActiveDocument(doc)}
                >
                  <div className="d-flex align-items-center">
                    <i className={`bi bi-${doc.type === 'code' ? 'file-code' : 'file-text'} me-2`}></i>
                    <div className="text-truncate">{doc.title}</div>
                    <Badge bg={doc.type === 'code' ? 'primary' : 'info'} className="ms-2">
                      {doc.type}
                    </Badge>
                  </div>
                  <small className="text-nowrap ms-2">
                    {new Date(doc.uploaded_at).toLocaleTimeString()}
                  </small>
                </button>
              ))}
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  };

  const renderDocumentContent = () => {
    if (!activeDocument) {
      return (
        <div className="text-center p-5 text-muted">
          <i className="bi bi-file-earmark fs-1"></i>
          <p className="mt-2">Lütfen görüntülemek için bir doküman seçin.</p>
        </div>
      );
    }
    
    const isCode = activeDocument.type === 'code';
    const lang = isCode ? getLanguageFromFilename(activeDocument.title) : 'markdown';
    
    return (
      <div className="document-content">
        <div className="document-header d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
          <div>
            <h5 className="mb-0 d-flex align-items-center">
              <i className={`bi bi-${isCode ? 'file-code' : 'file-text'} me-2`}></i>
              {activeDocument.title}
              <Badge bg={isCode ? 'primary' : 'info'} className="ms-2">
                {isCode ? lang : 'doküman'}
              </Badge>
            </h5>
            <small className="text-muted">
              {new Date(activeDocument.uploaded_at).toLocaleString()}
            </small>
          </div>
          <div>
            <Button
              variant="outline-primary"
              size="sm"
              className="me-2"
              onClick={() => {
                navigator.clipboard.writeText(activeDocument.content);
                toast.success('İçerik panoya kopyalandı');
              }}
            >
              <i className="bi bi-clipboard me-1"></i> Kopyala
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={evaluating || !isCode}
              onClick={() => evaluateDocument(activeDocument.id)}
            >
              {evaluating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Değerlendiriliyor...
                </>
              ) : (
                <>
                  <i className="bi bi-chat-square-text me-1"></i> Değerlendir
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="content-area border rounded mb-3">
          {isCode ? (
            <SyntaxHighlighter 
              language={lang} 
              style={dracula}
              showLineNumbers
              wrapLines
              customStyle={{ margin: 0, borderRadius: '0.375rem', maxHeight: '60vh', overflow: 'auto' }}
            >
              {activeDocument.content || '// Kod içeriği yok'}
            </SyntaxHighlighter>
          ) : (
            <div className="p-3" style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto' }}>
              {activeDocument.content}
            </div>
          )}
        </div>
        
        {evaluation && (
          <Card className="mt-4">
            <Card.Header className="bg-light">
              <h6 className="mb-0">Doküman Değerlendirmesi</h6>
            </Card.Header>
            <Card.Body style={{ whiteSpace: 'pre-wrap' }}>
              {evaluation}
            </Card.Body>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className="mb-4 shadow">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Kod ve Doküman Görüntüleyici</h5>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-4 mb-3 mb-md-0">
            {renderDocumentList()}
          </div>
          <div className="col-md-8">
            {renderDocumentContent()}
          </div>
        </div>
      </Card.Body>
      <Card.Footer className="d-flex justify-content-between">
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={fetchDocuments}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Yenile
        </Button>
        {onDocumentUpdated && (
          <Button
            variant="primary"
            size="sm"
            onClick={onDocumentUpdated}
          >
            <i className="bi bi-check-circle me-1"></i> Değişiklikleri Uygula
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};

export default DocumentViewer; 
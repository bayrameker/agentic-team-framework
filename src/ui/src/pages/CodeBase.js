import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link, useParams } from 'react-router-dom';
import CodeFileTree from '../components/CodeFileTree';
import api from '../services/api';

const CodeBase = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

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
    } catch (error) {
      console.error('Görev detayları alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (fileObj) => {
    try {
      setSelectedFile(fileObj);
      setLoadingFile(true);
      const response = await api.get(`/tasks/${taskId}/documents/${fileObj.id}`);
      if (response.data) {
        setFileContent(response.data.content);
      }
    } catch (error) {
      console.error('Dosya içeriği alınırken hata:', error);
    } finally {
      setLoadingFile(false);
    }
  };

  const getLanguageFromFileName = (fileName) => {
    if (!fileName) return 'text';
    const extension = fileName.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'rs': 'rust',
      'md': 'markdown',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'dockerfile': 'docker',
      'gitignore': 'git',
      'txt': 'text'
    };
    
    return langMap[extension] || 'text';
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="h2">Kod Temeli</h1>
          <p className="text-muted">
            {task ? (
              <>
                <Link to={`/tasks/${taskId}`} className="text-decoration-none">{task.name}</Link> görevinin kod tabanı
              </>
            ) : 'Yükleniyor...'}
          </p>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </Spinner>
          <p className="mt-3">Görev bilgileri yükleniyor...</p>
        </div>
      ) : (
        <Row>
          <Col md={3} className="mb-4 mb-md-0">
            <CodeFileTree taskId={taskId} onFileSelect={handleFileSelect} />
          </Col>
          
          <Col md={9}>
            <Card className="shadow">
              <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                <div>
                  {selectedFile ? (
                    <h5 className="mb-0">{selectedFile.title}</h5>
                  ) : (
                    <h5 className="mb-0">Dosya Görüntüleyici</h5>
                  )}
                </div>
                {selectedFile && (
                  <div>
                    <Link to={`/tasks/${taskId}`} className="btn btn-sm btn-outline-light">
                      <i className="bi bi-pencil-square me-2"></i>
                      Düzenle
                    </Link>
                  </div>
                )}
              </Card.Header>
              
              <Card.Body style={{ maxHeight: 'calc(100vh - 240px)', overflow: 'auto' }}>
                {loadingFile ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" size="sm" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </Spinner>
                    <p className="mt-3">Dosya içeriği yükleniyor...</p>
                  </div>
                ) : selectedFile ? (
                  <SyntaxHighlighter 
                    language={getLanguageFromFileName(selectedFile.title)} 
                    style={dracula}
                    showLineNumbers={true}
                    customStyle={{ fontSize: '14px' }}
                  >
                    {fileContent}
                  </SyntaxHighlighter>
                ) : (
                  <div className="text-center p-5 text-muted">
                    <i className="bi bi-file-code fs-1"></i>
                    <p className="mt-3">Görüntülemek için sol menüden bir dosya seçin</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CodeBase; 
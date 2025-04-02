import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Spinner, Button } from 'react-bootstrap';
import api from '../services/api';

const CodeFileTree = ({ taskId, onFileSelect }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileStructure, setFileStructure] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  useEffect(() => {
    if (taskId) {
      fetchDocuments();
    }
  }, [taskId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/tasks/${taskId}/documents`);
      if (response.data && response.data.documents) {
        // Sadece kod tipindeki dosyaları filtrele
        const codeDocuments = response.data.documents.filter(doc => doc.type === 'code');
        setDocuments(codeDocuments);
        
        // Dosya yapısını oluştur
        const structure = buildFileStructure(codeDocuments);
        setFileStructure(structure);
      }
    } catch (error) {
      console.error('Dosyalar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildFileStructure = (files) => {
    const structure = {};
    
    files.forEach(file => {
      const pathParts = file.title.split('/');
      let currentLevel = structure;
      
      // Son parça dosya adı olacak, öncesindekiler klasör
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }
      
      // Son parça dosyanın kendisi
      const fileName = pathParts[pathParts.length - 1];
      currentLevel[fileName] = file;
    });
    
    return structure;
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileStructure = (structure, path = '', depth = 0) => {
    const items = [];
    const folders = [];
    const files = [];
    
    // Önce klasörler sonra dosyalar gelecek şekilde sırala
    Object.keys(structure).forEach(key => {
      const isFile = structure[key].id !== undefined;
      if (isFile) {
        files.push(key);
      } else {
        folders.push(key);
      }
    });
    
    // Önce klasörleri ekle
    folders.sort().forEach(folder => {
      const currentPath = path ? `${path}/${folder}` : folder;
      const isExpanded = expandedFolders.has(currentPath);
      
      items.push(
        <div key={currentPath} className="ms-3">
          <div 
            className="d-flex align-items-center py-1 cursor-pointer folder-item"
            onClick={() => toggleFolder(currentPath)}
            style={{ 
              paddingLeft: `${depth * 12}px`,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            <i className={`bi ${isExpanded ? 'bi-folder2-open' : 'bi-folder2'} me-2 text-warning`}></i>
            {folder}
          </div>
          
          {isExpanded && (
            <div className="folder-content">
              {renderFileStructure(structure[folder], currentPath, depth + 1)}
            </div>
          )}
        </div>
      );
    });
    
    // Sonra dosyaları ekle
    files.sort().forEach(file => {
      const fileObj = structure[file];
      items.push(
        <div 
          key={fileObj.id} 
          className="file-item ms-3"
          onClick={() => onFileSelect(fileObj)}
          style={{ 
            paddingLeft: `${depth * 12}px`,
            cursor: 'pointer',
            padding: '4px',
            marginBottom: '2px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <i className={`bi bi-file-code me-2 text-info`}></i>
          {file}
        </div>
      );
    });
    
    return items;
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename);
    switch(ext) {
      case 'js':
      case 'jsx':
        return 'bi-filetype-js';
      case 'html':
        return 'bi-filetype-html';
      case 'css':
        return 'bi-filetype-css';
      case 'py':
        return 'bi-filetype-py';
      case 'java':
        return 'bi-filetype-java';
      case 'json':
        return 'bi-filetype-json';
      case 'md':
        return 'bi-filetype-md';
      case 'svg':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'bi-file-image';
      default:
        return 'bi-file-code';
    }
  };

  const handleRefresh = () => {
    fetchDocuments();
  };

  return (
    <Card className="mb-4 shadow">
      <Card.Header className="d-flex justify-content-between align-items-center bg-secondary text-white">
        <div>
          <h5 className="mb-0">Kod Dosyaları</h5>
        </div>
        <Button 
          variant="light" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <i className="bi bi-arrow-repeat"></i>
        </Button>
      </Card.Header>
      
      <Card.Body>
        {isLoading ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
            <p className="mt-2">Dosyalar yükleniyor...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="file-tree p-2">
            {renderFileStructure(fileStructure)}
          </div>
        ) : (
          <p className="text-center text-muted">Henüz kod dosyası yok.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default CodeFileTree; 
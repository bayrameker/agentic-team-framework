import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, Alert, Spinner, Tab, Tabs, Row, Col } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const CodeEditor = ({ taskId, onCodeUpdated }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [fileName, setFileName] = useState('code.py');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [fullScreen, setFullScreen] = useState(false);
  
  const textareaRef = useRef(null);
  
  useEffect(() => {
    // Görev dokümanlarını yükle
    if (taskId) {
      fetchDocuments();
    }
  }, [taskId]);

  useEffect(() => {
    const extensions = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs'
    };
    
    const ext = extensions[language] || 'txt';
    const baseName = fileName.split('.')[0] || 'code';
    setFileName(`${baseName}.${ext}`);
  }, [language]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/tasks/${taskId}/documents`);
      if (response.data && response.data.documents) {
        setDocuments(response.data.documents);
        
        // Eğer kodlar varsa ilk kodu seç
        const codeDocuments = response.data.documents.filter(doc => doc.type === 'code');
        if (codeDocuments.length > 0) {
          setActiveDocument(codeDocuments[0]);
          loadDocument(codeDocuments[0].id);
        }
      }
    } catch (error) {
      console.error('Dokümanlar yüklenirken hata:', error);
      setError('Dokümanlar yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocument = async (documentId) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/tasks/${taskId}/documents/${documentId}`);
      if (response.data) {
        setCode(response.data.content);
        setFileName(response.data.title);
        
        // Dosya uzantısından dil tanıma
        const extension = response.data.title.split('.').pop().toLowerCase();
        const langMap = {
          'js': 'javascript',
          'py': 'python',
          'html': 'html',
          'css': 'css',
          'java': 'java',
          'php': 'php',
          'cs': 'csharp',
          'go': 'go',
          'rb': 'ruby',
          'rs': 'rust',
          'ts': 'typescript',
          'jsx': 'jsx',
          'tsx': 'tsx',
          'json': 'json',
          'xml': 'xml',
          'md': 'markdown',
          'sql': 'sql',
          'sh': 'bash',
          'yaml': 'yaml',
          'yml': 'yaml',
          'csv': 'csv'
        };
        
        setLanguage(langMap[extension] || 'text');
        
        // Aktif dokümanı güncelle
        const doc = documents.find(d => d.id === documentId);
        if (doc) {
          setActiveDocument(doc);
        }
        
        // Editor sekmesine geç
        setActiveTab('editor');
      }
    } catch (error) {
      console.error('Doküman yüklenirken hata:', error);
      setError('Doküman yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    setOutput('');
    setError('');
    setIsSuccess(false);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setError('Çalıştırmak için kod girmelisiniz');
      return;
    }
    
    setIsRunning(true);
    setOutput('');
    setError('');
    setIsSuccess(false);
    
    try {
      const response = await api.post(`/api/tasks/${taskId}/execute-code`, {
        code,
        language,
        fileName
      });
      
      if (response.data) {
        setOutput(response.data.output || 'Herhangi bir çıktı üretilmedi');
        setIsSuccess(true);
        toast.success('Kod başarıyla çalıştırıldı');
        
        // Çıktı sekmesine geç
        setActiveTab('output');
        
        // Eğer onCodeUpdated callback varsa çağır
        if (onCodeUpdated) {
          onCodeUpdated();
        }
      }
    } catch (error) {
      console.error('Kod çalıştırma hatası:', error);
      setError(error.response?.data?.detail || 'Kod çalıştırılırken bir hata oluştu');
      toast.error('Kod çalıştırılamadı');
      
      // Hata olsa da çıktı sekmesine geç
      setActiveTab('output');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveCode = async () => {
    if (!code.trim()) {
      setError('Kaydetmek için kod girmelisiniz');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post(`/api/tasks/${taskId}/documents/upload`, {
        title: fileName,
        content: code,
        type: 'code'
      });
      
      if (response.data) {
        setIsSuccess(true);
        toast.success('Kod başarıyla kaydedildi');
        
        // Dosyaları yeniden yükle
        await fetchDocuments();
        
        // Eğer onCodeUpdated callback varsa çağır
        if (onCodeUpdated) {
          onCodeUpdated();
        }
      }
    } catch (error) {
      console.error('Kod kaydetme hatası:', error);
      setError(error.response?.data?.detail || 'Kod kaydedilirken bir hata oluştu');
      toast.error('Kod kaydedilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholderCode = () => {
    switch(language) {
      case 'python':
        return 'def main():\n    print("Merhaba, Dünya!")\n\nif __name__ == "__main__":\n    main()';
      case 'javascript':
        return 'function main() {\n    console.log("Merhaba, Dünya!");\n}\n\nmain();';
      case 'java':
        return 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Merhaba, Dünya!");\n    }\n}';
      default:
        return '// Kodunuzu buraya yazın';
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };
  
  const handleInsertSnippet = (snippetType) => {
    // Örnek kod parçacıkları ekle
    const snippets = {
      function: {
        python: "def example_function(param1, param2):\n    \"\"\"Fonksiyon açıklaması\"\"\"\n    result = param1 + param2\n    return result\n",
        javascript: "function exampleFunction(param1, param2) {\n    // Fonksiyon açıklaması\n    const result = param1 + param2;\n    return result;\n}\n"
      },
      class: {
        python: "class ExampleClass:\n    \"\"\"Sınıf açıklaması\"\"\"\n    \n    def __init__(self, param1):\n        self.param1 = param1\n    \n    def example_method(self):\n        return self.param1\n",
        javascript: "class ExampleClass {\n    /**\n     * Sınıf açıklaması\n     */\n    constructor(param1) {\n        this.param1 = param1;\n    }\n    \n    exampleMethod() {\n        return this.param1;\n    }\n}\n"
      },
      loop: {
        python: "# For döngüsü\nfor i in range(10):\n    print(i)\n\n# While döngüsü\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n",
        javascript: "// For döngüsü\nfor (let i = 0; i < 10; i++) {\n    console.log(i);\n}\n\n// While döngüsü\nlet count = 0;\nwhile (count < 5) {\n    console.log(count);\n    count++;\n}\n"
      }
    };
    
    const lang = ['javascript', 'js', 'jsx', 'tsx'].includes(language) ? 'javascript' : 'python';
    
    if (snippets[snippetType] && snippets[snippetType][lang]) {
      const snippet = snippets[snippetType][lang];
      
      // Textarea'nın seçili konumuna snippet'i ekle
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const updatedCode = code.substring(0, start) + snippet + code.substring(end);
        setCode(updatedCode);
        
        // Odağı korumak ve imleci doğru konuma yerleştirmek için
        setTimeout(() => {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + snippet.length, start + snippet.length);
        }, 0);
      } else {
        // Referans yoksa sona ekle
        setCode(code + '\n' + snippet);
      }
    }
  };

  return (
    <Card className={`mb-4 shadow ${fullScreen ? 'position-fixed top-0 start-0 w-100 h-100 zindex-tooltip' : ''}`}>
      <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
        <div>
          <h5 className="mb-0">Kod Editörü</h5>
        </div>
        <div>
          <Button 
            variant="light" 
            size="sm" 
            className="me-2" 
            onClick={handleRunCode}
            disabled={isRunning || !code.trim()}
          >
            {isRunning ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Çalıştırılıyor...
              </>
            ) : (
              <>
                <i className="bi bi-play-fill"></i> Çalıştır
              </>
            )}
          </Button>
          <Button 
            variant="success" 
            size="sm"
            className="me-2"
            onClick={handleSaveCode}
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <i className="bi bi-save"></i> Kaydet
              </>
            )}
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={toggleFullScreen}
          >
            <i className={`bi bi-${fullScreen ? 'fullscreen-exit' : 'fullscreen'}`}></i>
          </Button>
        </div>
      </Card.Header>
      <Card.Body className={fullScreen ? 'overflow-auto' : ''}>
        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </Alert>
        )}
        
        {isSuccess && !error && (
          <Alert variant="success" className="mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            İşlem başarıyla tamamlandı!
          </Alert>
        )}
        
        <Row>
          <Col md={3} className="mb-3">
            <Card className="h-100">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Dosyalar</h6>
              </Card.Header>
              <div className="p-2" style={{maxHeight: '300px', overflowY: 'auto'}}>
                {documents.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {documents.map(doc => (
                      <button
                        key={doc.id}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeDocument && activeDocument.id === doc.id ? 'active' : ''}`}
                        onClick={() => loadDocument(doc.id)}
                      >
                        <div className="text-truncate">
                          <i className={`bi bi-${doc.type === 'code' ? 'file-code' : 'file-text'} me-2`}></i>
                          {doc.title}
                        </div>
                        <small className="badge bg-secondary rounded-pill">
                          {doc.type}
                        </small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-muted">
                    <i className="bi bi-folder fs-2"></i>
                    <p className="mt-2">Henüz dosya yok</p>
                  </div>
                )}
              </div>
            </Card>
          </Col>
          
          <Col md={9}>
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabChange}
              className="mb-3"
            >
              <Tab eventKey="editor" title={<><i className="bi bi-code-slash me-1"></i> Editör</>}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <Form.Control
                        type="text"
                        placeholder="Dosya adı"
                        value={fileName}
                        onChange={handleFileNameChange}
                        className="me-2"
                        style={{width: '200px'}}
                      />
                      <Form.Select
                        value={language}
                        onChange={handleLanguageChange}
                        style={{width: '150px'}}
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="sql">SQL</option>
                      </Form.Select>
                    </div>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleInsertSnippet('function')}
                      >
                        <i className="bi bi-braces"></i> Fonksiyon
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleInsertSnippet('class')}
                      >
                        <i className="bi bi-diagram-3"></i> Sınıf
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleInsertSnippet('loop')}
                      >
                        <i className="bi bi-arrow-repeat"></i> Döngü
                      </Button>
                    </div>
                  </div>
                  
                  <Form.Control
                    ref={textareaRef}
                    as="textarea"
                    placeholder={getPlaceholderCode()}
                    value={code}
                    onChange={handleCodeChange}
                    className="code-editor"
                    style={{
                      fontFamily: 'monospace',
                      minHeight: fullScreen ? 'calc(100vh - 300px)' : '350px',
                      resize: 'vertical',
                      padding: '10px',
                      fontSize: '14px',
                      backgroundColor: '#282c34',
                      color: '#abb2bf',
                      tabSize: 2
                    }}
                  />
                </div>
              </Tab>
              
              <Tab eventKey="output" title={<><i className="bi bi-terminal me-1"></i> Çıktı</>}>
                <div className="p-3 border rounded" style={{minHeight: '200px', backgroundColor: '#f8f9fa'}}>
                  {isRunning ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Kod çalıştırılıyor, lütfen bekleyin...</p>
                    </div>
                  ) : output ? (
                    <div>
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 className="mb-0">Program Çıktısı</h6>
                        <span className="badge bg-success">Başarıyla çalıştırıldı</span>
                      </div>
                      <pre className="bg-dark text-light p-3 rounded" style={{whiteSpace: 'pre-wrap'}}>
                        {output}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-terminal fs-1"></i>
                      <p className="mt-3">Henüz çıktı bulunmuyor. Kodu çalıştırarak çıktı görebilirsiniz.</p>
                    </div>
                  )}
                </div>
              </Tab>
              
              <Tab eventKey="preview" title={<><i className="bi bi-eye me-1"></i> Önizleme</>}>
                <div className="border rounded p-0" style={{minHeight: '350px'}}>
                  <div className="bg-dark text-light p-2 border-bottom d-flex justify-content-between">
                    <span><i className="bi bi-file-code me-1"></i> {fileName}</span>
                    <span className="badge bg-secondary">{language}</span>
                  </div>
                  <SyntaxHighlighter 
                    language={language} 
                    style={dracula}
                    className="rounded-0 rounded-bottom" 
                    showLineNumbers
                    wrapLines
                  >
                    {code || getPlaceholderCode()}
                  </SyntaxHighlighter>
                </div>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CodeEditor; 
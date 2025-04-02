import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { fetchModels } from '../services/api';

function ModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // API'den modelleri çekme işlemi
    const getModels = async () => {
      try {
        setLoading(true);
        // Gerçek API entegrasyonu yapıldığında fetchModels() kullanılacak
        // const data = await fetchModels();
        
        // Şimdilik örnek veri
        const mockData = [
          {
            id: 'llama3',
            name: 'Llama 3',
            version: '8B',
            description: 'Meta tarafından geliştirilen açık kaynaklı model.',
            status: 'READY',
            type: 'LLM',
            size: '8B',
            parameters: 8000000000,
            contextWindow: 8192,
            capabilities: ['Metin Üretimi', 'Kod Yazma', 'Analiz'],
            lastUsed: '2023-11-10T14:20:00Z',
            downloads: 1250,
          },
          {
            id: 'mistral',
            name: 'Mistral',
            version: '7B',
            description: 'Mistral AI tarafından geliştirilen performanslı model.',
            status: 'READY',
            type: 'LLM',
            size: '7B',
            parameters: 7000000000,
            contextWindow: 8192,
            capabilities: ['Metin Üretimi', 'Analiz', 'QA'],
            lastUsed: '2023-11-15T09:30:00Z',
            downloads: 980,
          },
          {
            id: 'mixtral',
            name: 'Mixtral',
            version: '8x7B',
            description: 'Mistral AI tarafından geliştirilen Mixture of Experts modeli.',
            status: 'DOWNLOADING',
            type: 'LLM',
            size: '46.7B',
            parameters: 46700000000,
            contextWindow: 32768,
            capabilities: ['Metin Üretimi', 'Kod Yazma', 'Çok Dilli', 'Analiz'],
            downloadProgress: 65,
            lastUsed: null,
            downloads: 750,
          },
          {
            id: 'phi3',
            name: 'Phi-3',
            version: 'Mini',
            description: 'Microsoft tarafından geliştirilen kompakt ama güçlü model.',
            status: 'READY',
            type: 'LLM',
            size: '3.8B',
            parameters: 3800000000,
            contextWindow: 2048,
            capabilities: ['Metin Üretimi', 'QA', 'Sınırlı Kod'],
            lastUsed: '2023-10-28T11:15:00Z',
            downloads: 1920,
          },
          {
            id: 'gemma',
            name: 'Gemma',
            version: '7B',
            description: 'Google tarafından geliştirilen hafif ve verimli model.',
            status: 'ERROR',
            type: 'LLM',
            size: '7B',
            parameters: 7000000000,
            contextWindow: 8192,
            capabilities: ['Metin Üretimi', 'Kod Yazma', 'QA'],
            errorMessage: 'Model indirme hatası, bağlantı zaman aşımına uğradı.',
            lastUsed: null,
            downloads: 840,
          }
        ];
        
        setTimeout(() => {
          setModels(mockData);
          setLoading(false);
        }, 1000); // Sahte bir yükleme gecikmesi
      } catch (err) {
        setError('Modeller yüklenirken bir hata oluştu: ' + err.message);
        setLoading(false);
      }
    };

    getModels();
  }, []);

  // Modeller durumu için renk ve simge
  const getModelStatusInfo = (status) => {
    switch (status) {
      case 'READY':
        return { 
          color: 'success', 
          label: 'Hazır',
          icon: <CheckCircleIcon fontSize="small" />
        };
      case 'DOWNLOADING':
        return { 
          color: 'warning', 
          label: 'İndiriliyor',
          icon: null
        };
      case 'ERROR':
        return { 
          color: 'error', 
          label: 'Hata',
          icon: <ErrorIcon fontSize="small" />
        };
      default:
        return { 
          color: 'default', 
          label: 'Bilinmiyor',
          icon: null
        };
    }
  };

  // Arama filtreleme fonksiyonu
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" className="page-title">
          LLM Modelleri
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Model ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '300px' }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {filteredModels.length === 0 ? (
            <Alert severity="info">
              Arama kriterlerinize uygun model bulunamadı.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="model table">
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell>Boyut</TableCell>
                    <TableCell>Bağlam Penceresi</TableCell>
                    <TableCell>Yetenekler</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredModels.map((model) => {
                    const statusInfo = getModelStatusInfo(model.status);
                    return (
                      <TableRow
                        key={model.id}
                        sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                      >
                        <TableCell>
                          <Box sx={{ fontWeight: 'bold' }}>{model.name}</Box>
                          <Typography variant="caption" color="text.secondary">
                            v{model.version}
                          </Typography>
                        </TableCell>
                        <TableCell>{model.description}</TableCell>
                        <TableCell>{model.size}</TableCell>
                        <TableCell>{model.contextWindow.toLocaleString()} token</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {model.capabilities.map((cap, index) => (
                              <Chip 
                                label={cap} 
                                key={index} 
                                size="small" 
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              icon={statusInfo.icon}
                              label={statusInfo.label} 
                              color={statusInfo.color} 
                              size="small" 
                            />
                            {model.status === 'DOWNLOADING' && (
                              <Box sx={{ width: '100%', maxWidth: 100 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={model.downloadProgress} 
                                  color="warning" 
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {model.downloadProgress}%
                                </Typography>
                              </Box>
                            )}
                            {model.status === 'ERROR' && (
                              <Tooltip title={model.errorMessage || 'Bilinmeyen hata'}>
                                <InfoIcon color="error" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            disabled={model.status !== 'READY'}
                          >
                            Kullan
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Model Yönetimi Hakkında
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Burada listelenen LLM modelleri, sistem tarafından desteklenen ve ajanlarınızda kullanabileceğiniz modellerdir. 
          Her model farklı yeteneklere ve performans özelliklerine sahiptir. Ekibinizin ihtiyaçlarına en uygun modeli seçin.
        </Typography>
      </Box>
    </Box>
  );
}

export default ModelsPage; 
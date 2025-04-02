import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  InputAdornment, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  Divider, 
  IconButton, 
  Menu, 
  MenuItem, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Alert,
  Tooltip,
  Fab,
  LinearProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { fetchTasks } from '../services/api';
import { getTaskStatusInfo, formatDate, truncateText } from '../utils/helpers';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    // API'den görevleri çekme işlemi
    const getTasks = async () => {
      try {
        setLoading(true);
        // Gerçek API entegrasyonu yapıldığında fetchTasks() kullanılacak
        // const data = await fetchTasks();
        
        // Şimdilik örnek veri
        const mockData = [
          {
            id: '1',
            title: 'Kullanıcı Arayüzü Geliştirme',
            description: 'React ile admin paneli için kullanıcı arayüzü komponentlerinin oluşturulması.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            assignedTeam: { id: '1', name: 'Yazılım Geliştirme Takımı' },
            progress: 60,
            createdAt: '2023-10-05T09:00:00Z',
            dueDate: '2023-11-20T18:00:00Z',
            tags: ['Frontend', 'React', 'UI/UX']
          },
          {
            id: '2',
            title: 'API Endpoint Testi',
            description: 'Yeni oluşturulan API endpointlerinin kapsamlı birim ve entegrasyon testlerinin yapılması.',
            status: 'PENDING',
            priority: 'MEDIUM',
            assignedTeam: { id: '2', name: 'Test Otomasyonu Takımı' },
            progress: 0,
            createdAt: '2023-10-10T14:30:00Z',
            dueDate: '2023-11-15T18:00:00Z',
            tags: ['Testing', 'API', 'Backend']
          },
          {
            id: '3',
            title: 'Pazarlama İçerikleri Oluşturma',
            description: 'Sosyal medya paylaşımları için ürün tanıtım içeriklerinin hazırlanması.',
            status: 'COMPLETED',
            priority: 'LOW',
            assignedTeam: { id: '3', name: 'Pazarlama İçerik Takımı' },
            progress: 100,
            createdAt: '2023-09-15T10:15:00Z',
            completedAt: '2023-10-05T16:45:00Z',
            dueDate: '2023-10-10T18:00:00Z',
            tags: ['Marketing', 'Content', 'Social Media']
          },
          {
            id: '4',
            title: 'Veritabanı Optimizasyonu',
            description: 'PostgreSQL veritabanı sorgularının ve indekslerinin performans iyileştirmesi.',
            status: 'FAILED',
            priority: 'CRITICAL',
            assignedTeam: { id: '1', name: 'Yazılım Geliştirme Takımı' },
            progress: 30,
            createdAt: '2023-10-01T08:45:00Z',
            dueDate: '2023-10-15T18:00:00Z',
            errorDetails: 'Performans hedeflerine ulaşılamadı, yeniden planlanması gerekiyor.',
            tags: ['Database', 'Optimization', 'PostgreSQL']
          },
          {
            id: '5',
            title: 'Docker Konteynerizasyonu',
            description: 'Uygulamanın Docker konteynerlerinde çalışacak şekilde yapılandırılması.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            assignedTeam: { id: '1', name: 'Yazılım Geliştirme Takımı' },
            progress: 45,
            createdAt: '2023-10-12T11:30:00Z',
            dueDate: '2023-11-30T18:00:00Z',
            tags: ['DevOps', 'Docker', 'Deployment']
          }
        ];
        
        setTimeout(() => {
          setTasks(mockData);
          setLoading(false);
        }, 1000); // Sahte bir yükleme gecikmesi
      } catch (err) {
        setError('Görevler yüklenirken bir hata oluştu: ' + err.message);
        setLoading(false);
      }
    };

    getTasks();
  }, []);

  // Öncelik seviyesi bilgisi
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return { color: 'error', label: 'Kritik' };
      case 'HIGH':
        return { color: 'warning', label: 'Yüksek' };
      case 'MEDIUM':
        return { color: 'info', label: 'Orta' };
      case 'LOW':
        return { color: 'success', label: 'Düşük' };
      default:
        return { color: 'default', label: 'Belirsiz' };
    }
  };

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Arama filtreleme
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Menu işlemleri
  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  // Tab'a göre görevleri filtreleme
  const getFilteredTasks = () => {
    let filteredByTab = tasks;

    // Tab filtresi
    if (tabValue === 1) { // Bekleyen
      filteredByTab = tasks.filter(task => task.status === 'PENDING');
    } else if (tabValue === 2) { // Devam Eden
      filteredByTab = tasks.filter(task => task.status === 'IN_PROGRESS');
    } else if (tabValue === 3) { // Tamamlanan
      filteredByTab = tasks.filter(task => task.status === 'COMPLETED');
    } else if (tabValue === 4) { // Başarısız
      filteredByTab = tasks.filter(task => task.status === 'FAILED');
    }

    // Arama filtresi
    if (searchQuery) {
      filteredByTab = filteredByTab.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filteredByTab;
  };

  const filteredTasks = getFilteredTasks();

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" className="page-title">
          Görevler
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Görev ara..."
          value={searchQuery}
          onChange={handleSearchChange}
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

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Tüm Görevler" />
          <Tab label="Bekleyen" />
          <Tab label="Devam Eden" />
          <Tab label="Tamamlanan" />
          <Tab label="Başarısız" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {filteredTasks.length === 0 ? (
            <Alert severity="info">
              Arama kriterlerinize uygun görev bulunamadı. Yeni bir görev oluşturmayı deneyebilirsiniz.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredTasks.map((task) => {
                const statusInfo = getTaskStatusInfo(task.status);
                const priorityInfo = getPriorityInfo(task.priority);
                
                return (
                  <Grid item xs={12} sm={6} lg={4} key={task.id}>
                    <Card 
                      className="card-hover" 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderLeft: `4px solid ${statusInfo.backgroundColor}`,
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h5" component="h2" gutterBottom>
                            {task.title}
                          </Typography>
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuOpen(e, task)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip 
                            label={statusInfo.label} 
                            size="small" 
                            sx={{ 
                              bgcolor: statusInfo.backgroundColor,
                              color: statusInfo.textColor,
                            }} 
                          />
                          <Chip 
                            label={priorityInfo.label} 
                            size="small"
                            color={priorityInfo.color} 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {truncateText(task.description, 120)}
                        </Typography>
                        
                        {task.status === 'IN_PROGRESS' && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              İlerleme: {task.progress}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={task.progress} 
                              color="primary" 
                              sx={{ height: 6, borderRadius: 3 }} 
                            />
                          </Box>
                        )}
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <GroupsIcon fontSize="small" sx={{ mr: 1 }} />
                            Takım: {task.assignedTeam.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                            Teslim: {formatDate(task.dueDate)}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {task.tags.map((tag, index) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/tasks/${task.id}`}
                        >
                          Detayları Görüntüle
                        </Button>
                        {task.status === 'FAILED' && (
                          <Button 
                            size="small"
                            color="secondary"
                          >
                            Yeniden Başlat
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose} component={Link} to={`/tasks/${selectedTask?.id}`}>
          Detayları Görüntüle
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Düzenle</MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>Görevi Sil</MenuItem>
      </Menu>

      <Tooltip title="Yeni Görev Oluştur" placement="left">
        <Fab 
          color="primary" 
          component={Link} 
          to="/tasks/create"
          sx={{ position: 'fixed', bottom: 30, right: 30 }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}

export default TasksPage; 
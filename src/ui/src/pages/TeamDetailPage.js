import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { fetchTeamById } from '../services/api';
import { getTeamTypeInfo, formatDate } from '../utils/helpers';

function TeamDetailPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // API'den takım detaylarını çekme işlemi
    const getTeam = async () => {
      try {
        setLoading(true);
        // Gerçek API entegrasyonu yapıldığında fetchTeamById(id) kullanılacak
        // const data = await fetchTeamById(id);

        // Şimdilik örnek veri
        const mockData = {
          id: id,
          name: 'Yazılım Geliştirme Takımı',
          description: 'Frontend ve backend geliştirme için oluşturulmuş ajan takımı',
          type: 'SOFTWARE_DEVELOPMENT',
          createdAt: '2023-08-15T10:30:00Z',
          agents: [
            {
              id: 'agent-1',
              name: 'Kod Geliştirici Ajan',
              role: 'DEVELOPER',
              model_name: 'llama3'
            },
            {
              id: 'agent-2',
              name: 'Kod İnceleyici Ajan',
              role: 'REVIEWER',
              model_name: 'mixtral'
            },
            {
              id: 'agent-3',
              name: 'Test Uzmanı Ajan',
              role: 'TESTER',
              model_name: 'mistral'
            },
            {
              id: 'agent-4',
              name: 'Dokümantasyon Uzmanı',
              role: 'DOCUMENTER',
              model_name: 'phi3'
            },
            {
              id: 'agent-5',
              name: 'Proje Yöneticisi',
              role: 'PROJECT_MANAGER',
              model_name: 'llama3'
            }
          ],
          tasks: [
            {
              id: 'task-1',
              title: 'Kullanıcı Arayüzü Geliştirme',
              status: 'IN_PROGRESS',
              dueDate: '2023-11-20T18:00:00Z',
              progress: 60
            },
            {
              id: 'task-4',
              title: 'Veritabanı Optimizasyonu',
              status: 'FAILED',
              dueDate: '2023-10-15T18:00:00Z',
              progress: 30
            },
            {
              id: 'task-5',
              title: 'Docker Konteynerizasyonu',
              status: 'IN_PROGRESS',
              dueDate: '2023-11-30T18:00:00Z',
              progress: 45
            }
          ]
        };

        setTimeout(() => {
          setTeam(mockData);
          setLoading(false);
        }, 1000); // Sahte bir yükleme gecikmesi
      } catch (err) {
        setError('Takım detayları yüklenirken bir hata oluştu: ' + err.message);
        setLoading(false);
      }
    };

    getTeam();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Rol açıklamaları
  const getRoleDescription = (role) => {
    switch (role) {
      case 'DEVELOPER':
        return 'Yazılım geliştirme ve kod yazma';
      case 'REVIEWER':
        return 'Kod inceleme ve değerlendirme';
      case 'TESTER':
        return 'Test senaryoları oluşturma ve uygulama';
      case 'DOCUMENTER':
        return 'Dokümantasyon oluşturma ve yönetme';
      case 'DESIGNER':
        return 'UI/UX tasarımı';
      case 'PROJECT_MANAGER':
        return 'Proje yönetimi ve planlama';
      default:
        return 'Tanımlanmamış rol';
    }
  };

  // Görev durumu rengi
  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#fff8e1';
      case 'IN_PROGRESS':
        return '#e3f2fd';
      case 'COMPLETED':
        return '#e8f5e9';
      case 'FAILED':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!team) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Takım bulunamadı.
      </Alert>
    );
  }

  const teamTypeInfo = getTeamTypeInfo(team.type);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {team.name}
        </Typography>
        <Chip
          label={teamTypeInfo.label}
          color={teamTypeInfo.color}
          sx={{ mr: 1 }}
        />
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          Oluşturulma: {formatDate(team.createdAt)}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Takım Açıklaması
        </Typography>
        <Typography variant="body1">
          {team.description}
        </Typography>
      </Paper>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Ajanlar" />
          <Tab label="Görevler" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabValue === 0 ? (
            <Grid container spacing={2}>
              {team.agents.map((agent) => (
                <Grid item xs={12} md={6} key={agent.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{agent.name}</Typography>
                          <Chip
                            label={agent.role.replace('_', ' ')}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getRoleDescription(agent.role)}
                      </Typography>
                      <Typography variant="body2">
                        Model: <strong>{agent.model_name}</strong>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <List>
              {team.tasks.map((task) => (
                <ListItem 
                  key={task.id}
                  sx={{ 
                    mb: 1, 
                    borderLeft: `4px solid ${getTaskStatusColor(task.status)}`,
                    bgcolor: 'background.paper'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <AssignmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Durum: {task.status}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Teslim: {formatDate(task.dueDate)}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          İlerleme: %{task.progress}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    color="primary"
                    href={`/tasks/${task.id}`}
                  >
                    Detaylar
                  </Button>
                </ListItem>
              ))}
              {team.tasks.length === 0 && (
                <Alert severity="info">
                  Bu takıma atanmış görev bulunmamaktadır.
                </Alert>
              )}
            </List>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" color="primary" href="/teams">
          Takımlara Dön
        </Button>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            href={`/tasks/create?team=${team.id}`}
            sx={{ mr: 1 }}
          >
            Görev Oluştur
          </Button>
          <Button 
            variant="outlined"
            color="secondary"
            href={`/teams/${team.id}/edit`}
          >
            Takımı Düzenle
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default TeamDetailPage; 
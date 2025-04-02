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
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { fetchTaskById } from '../services/api';
import { getTaskStatusInfo, formatDate } from '../utils/helpers';

function TaskDetailPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // API'den görev detaylarını çekme işlemi
    const getTask = async () => {
      try {
        setLoading(true);
        // Gerçek API entegrasyonu yapıldığında fetchTaskById(id) kullanılacak
        // const data = await fetchTaskById(id);

        // Şimdilik örnek veri
        const mockData = {
          id: id,
          title: 'Kullanıcı Arayüzü Geliştirme',
          description: 'React ile admin paneli için kullanıcı arayüzü komponentlerinin oluşturulması. Material UI kullanılarak modern bir tasarım oluşturulmalı ve duyarlı (responsive) olmalıdır.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          team: {
            id: 'team-1',
            name: 'Yazılım Geliştirme Takımı'
          },
          progress: 60,
          createdAt: '2023-10-05T09:00:00Z',
          dueDate: '2023-11-20T18:00:00Z',
          tags: ['Frontend', 'React', 'UI/UX'],
          iterations: 2,
          subtasks: [
            {
              id: 'subtask-1',
              title: 'Temel komponentlerin tasarımı',
              status: 'COMPLETED',
              assigned_agent: {
                id: 'agent-5',
                name: 'UI Tasarımcısı',
                role: 'DESIGNER'
              },
              result: 'Tüm UI bileşenleri mockup şeklinde tasarlandı ve onaylandı.'
            },
            {
              id: 'subtask-2',
              title: 'Komponentlerin React ile geliştirilmesi',
              status: 'IN_PROGRESS',
              assigned_agent: {
                id: 'agent-1',
                name: 'Kod Geliştirici Ajan',
                role: 'DEVELOPER'
              },
              progress: 75
            },
            {
              id: 'subtask-3',
              title: 'Komponentlerin test edilmesi',
              status: 'PENDING',
              assigned_agent: {
                id: 'agent-3',
                name: 'Test Uzmanı Ajan',
                role: 'TESTER'
              },
              dependencies: ['subtask-2']
            }
          ],
          results: [
            {
              iteration: 1,
              date: '2023-10-10T14:30:00Z',
              content: 'İlk iterasyonda tasarım prototipleri oluşturuldu ve ana komponentlerin taslakları hazırlandı.',
              feedback: 'Tasarım iyi görünüyor, ancak daha modern bir görünüm için Material UI v5 kullanılmasını öneriyorum.'
            },
            {
              iteration: 2, 
              date: '2023-10-25T11:15:00Z',
              content: 'Material UI v5 kullanılarak komponentler yeniden tasarlandı ve geliştirilmeye başlandı.',
              feedback: null
            }
          ]
        };

        setTimeout(() => {
          setTask(mockData);
          setLoading(false);
        }, 1000); // Sahte bir yükleme gecikmesi
      } catch (err) {
        setError('Görev detayları yüklenirken bir hata oluştu: ' + err.message);
        setLoading(false);
      }
    };

    getTask();
  }, [id]);

  // Geri bildirim gönderme işlemi
  const handleFeedbackSubmit = () => {
    if (!feedback.trim()) return;
    
    // Gerçek uygulamada API ile geri bildirim gönderilir
    alert(`Geri bildirim gönderildi: ${feedback}`);
    setFeedback('');
  };

  // Alt görev durumu rengi
  const getSubtaskStatusColor = (status) => {
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

  if (!task) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Görev bulunamadı.
      </Alert>
    );
  }

  const statusInfo = getTaskStatusInfo(task.status);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={statusInfo.label}
            sx={{ bgcolor: statusInfo.backgroundColor, color: statusInfo.textColor }}
          />
          <Chip
            icon={<GroupsIcon />}
            label={`Takım: ${task.team.name}`}
            variant="outlined"
            component="a"
            href={`/teams/${task.team.id}`}
            clickable
          />
          <Chip
            icon={<AccessTimeIcon />}
            label={`Teslim: ${formatDate(task.dueDate)}`}
            variant="outlined"
          />
        </Box>
        <Box sx={{ mt: 2, mb: 3 }}>
          {task.tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              sx={{ mr: 0.5 }}
            />
          ))}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Görev Açıklaması
            </Typography>
            <Typography variant="body1" paragraph>
              {task.description}
            </Typography>
            
            {task.status === 'IN_PROGRESS' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  İlerleme: {task.progress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={task.progress}
                  color="primary"
                  sx={{ height: 8, borderRadius: 5 }}
                />
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Alt Görevler
            </Typography>
            <List>
              {task.subtasks.map((subtask) => (
                <Card
                  key={subtask.id}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    borderLeft: `4px solid ${getSubtaskStatusColor(subtask.status)}`,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6">
                        {subtask.title}
                      </Typography>
                      <Chip
                        label={subtask.status === 'COMPLETED' ? 'Tamamlandı' : subtask.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 'Bekliyor'}
                        size="small"
                        color={subtask.status === 'COMPLETED' ? 'success' : subtask.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                      />
                    </Box>
                    
                    {subtask.assigned_agent && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {subtask.assigned_agent.name} ({subtask.assigned_agent.role})
                        </Typography>
                      </Box>
                    )}
                    
                    {subtask.progress !== undefined && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          İlerleme: {subtask.progress}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={subtask.progress}
                          color="primary"
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    )}
                    
                    {subtask.result && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Sonuç:
                        </Typography>
                        <Typography variant="body2">
                          {subtask.result}
                        </Typography>
                      </Box>
                    )}
                    
                    {subtask.dependencies && subtask.dependencies.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Bağımlılıklar: {subtask.dependencies.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {task.subtasks.length === 0 && (
                <Alert severity="info">
                  Bu görev için alt görev bulunmamaktadır.
                </Alert>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              İterasyon Geçmişi
            </Typography>
            <Stepper activeStep={task.iterations-1} orientation="vertical">
              {task.results.map((result, index) => (
                <Step key={index}>
                  <StepLabel>{`İterasyon ${result.iteration}`}</StepLabel>
                  <Box sx={{ ml: 2, mt: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(result.date)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {result.content}
                    </Typography>
                    {result.feedback && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Geri Bildirim:
                        </Typography>
                        <Typography variant="body2">
                          {result.feedback}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Step>
              ))}
            </Stepper>
            
            {task.results.length === 0 && (
              <Alert severity="info">
                Henüz iterasyon bulunmamaktadır.
              </Alert>
            )}
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Geri Bildirim Ekle
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Görev hakkında geri bildiriminizi yazın..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFeedbackSubmit}
                disabled={!feedback.trim()}
              >
                Gönder
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" color="primary" href="/tasks">
          Görevlere Dön
        </Button>
        <Box>
          {(task.status === 'PENDING' || task.status === 'FAILED') && (
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 1 }}
            >
              Görevi Başlat
            </Button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 1 }}
            >
              Görevi Yinele
            </Button>
          )}
          <Button
            variant="outlined"
            color="secondary"
          >
            Görevi Düzenle
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default TaskDetailPage; 
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  MenuItem, 
  FormControl, 
  FormLabel, 
  FormHelperText,
  Select, 
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Autocomplete,
  InputLabel
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { createTask, fetchTeams } from '../services/api';
import { validateForm } from '../utils/helpers';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function CreateTaskPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const teamParam = query.get('team');
  
  // Form durumları
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    team_id: teamParam || '',
    priority: 'MEDIUM',
    tags: []
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [serverError, setServerError] = useState(null);

  // Öncelik seviyeleri
  const priorities = [
    { value: 'LOW', label: 'Düşük' },
    { value: 'MEDIUM', label: 'Orta' },
    { value: 'HIGH', label: 'Yüksek' },
    { value: 'CRITICAL', label: 'Kritik' }
  ];

  // Örnek etiketler 
  const availableTags = [
    'Frontend', 'Backend', 'UI/UX', 'Database', 'API', 
    'Testing', 'Documentation', 'DevOps', 'Security', 
    'Performance', 'Bug Fix', 'Feature', 'Refactoring',
    'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java'
  ];

  // Takımları yükleme
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setTeamsLoading(true);
        // Gerçek API entegrasyonu için:
        // const response = await fetchTeams();
        // setTeams(response.teams || []);

        // Şimdilik örnek veri
        const mockTeams = [
          {
            id: '1',
            name: 'Yazılım Geliştirme Takımı',
            type: 'SOFTWARE_DEVELOPMENT'
          },
          {
            id: '2',
            name: 'Test Otomasyonu Takımı',
            type: 'TESTING'
          },
          {
            id: '3',
            name: 'Pazarlama İçerik Takımı',
            type: 'MARKETING'
          }
        ];
        
        setTimeout(() => {
          setTeams(mockTeams);
          setTeamsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Takımlar yüklenirken hata oluştu:', err);
        setTeamsLoading(false);
        setServerError('Takımlar yüklenirken bir hata oluştu.');
      }
    };

    loadTeams();
  }, []);

  // Form değişikliklerini işle
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Hata durumunu güncelle
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Etiket değişikliklerini işle
  const handleTagsChange = (event, newValue) => {
    setFormData({
      ...formData,
      tags: newValue
    });
  };

  // Form doğrulama
  const validateFormData = () => {
    const validationRules = {
      title: { required: true, minLength: 5, maxLength: 100, label: 'Görev başlığı' },
      description: { required: true, minLength: 10, maxLength: 1000, label: 'Açıklama' },
      team_id: { required: true, label: 'Takım' },
      priority: { required: true, label: 'Öncelik' }
    };
    
    const errors = validateForm(formData, validationRules);
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  // Form gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateFormData()) {
      return;
    }
    
    try {
      setLoading(true);
      setServerError(null);
      
      // API çağrısı yapılacak veri oluşturma
      const taskData = {
        title: formData.title,
        description: formData.description,
        team_id: formData.team_id,
        priority: formData.priority,
        tags: formData.tags
      };
      
      // Gerçek API entegrasyonu yapıldığında uncomment edilecek
      // const response = await createTask(taskData);
      // const taskId = response.task_id;
      
      // Simülasyon amaçlı gecikme
      setTimeout(() => {
        console.log('Gönderilen görev verileri:', taskData);
        setLoading(false);
        
        // İsteğe bağlı olarak geçici bir task_id oluşturma
        const dummyTaskId = 'task-' + Math.floor(Math.random() * 1000);
        navigate(`/tasks/${dummyTaskId}`);
      }, 1500);
      
    } catch (error) {
      setServerError('Görev oluşturulurken bir hata oluştu: ' + error.message);
      setLoading(false);
    }
  };

  // İptal işlemi
  const handleCancel = () => {
    navigate('/tasks');
  };

  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" className="page-title">
        Yeni Görev Oluştur
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {serverError}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Görev Başlığı"
                name="title"
                variant="outlined"
                value={formData.title}
                onChange={handleChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Görev Açıklaması"
                name="description"
                variant="outlined"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                error={!!formErrors.description}
                helperText={formErrors.description}
                placeholder="Görevin detaylı açıklamasını yazın..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.team_id} required>
                <InputLabel id="team-select-label">Takım</InputLabel>
                <Select
                  labelId="team-select-label"
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleChange}
                  label="Takım"
                  disabled={teamsLoading}
                >
                  {teamsLoading ? (
                    <MenuItem value="" disabled>
                      Takımlar yükleniyor...
                    </MenuItem>
                  ) : (
                    teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>{formErrors.team_id}</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="priority-select-label">Öncelik</InputLabel>
                <Select
                  labelId="priority-select-label"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Öncelik"
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={availableTags}
                value={formData.tags}
                onChange={handleTagsChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip 
                      variant="outlined" 
                      label={option} 
                      {...getTagProps({ index })} 
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Etiketler"
                    placeholder="Etiket ekle..."
                    helperText="Görevle ilgili etiketleri ekleyin (isteğe bağlı)"
                  />
                )}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancel}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Oluşturuluyor...
                </>
              ) : (
                'Görevi Oluştur'
              )}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default CreateTaskPage; 
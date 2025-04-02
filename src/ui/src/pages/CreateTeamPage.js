import React, { useState } from 'react';
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
  Divider,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createTeam } from '../services/api';
import { validateForm } from '../utils/helpers';

function CreateTeamPage() {
  const navigate = useNavigate();
  
  // Stepper adımları
  const steps = ['Takım Bilgileri', 'Ajanlar', 'Onay'];
  const [activeStep, setActiveStep] = useState(0);
  
  // Form durumları
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamType: '',
    goalDescription: '',
    agentRoles: [
      { id: 1, role: 'DEVELOPER', description: 'Kod yazma ve geliştirme', selected: false },
      { id: 2, role: 'TESTER', description: 'Test ve kalite kontrol', selected: false },
      { id: 3, role: 'REVIEWER', description: 'Kod inceleme ve değerlendirme', selected: false },
      { id: 4, role: 'DOCUMENTER', description: 'Dokümantasyon oluşturma', selected: false },
      { id: 5, role: 'DESIGNER', description: 'UI/UX tasarımı', selected: false },
      { id: 6, role: 'PROJECT_MANAGER', description: 'Proje yönetimi ve planlama', selected: false }
    ]
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Takım tipleri
  const teamTypes = [
    { value: 'SOFTWARE_DEVELOPMENT', label: 'Yazılım Geliştirme' },
    { value: 'TESTING', label: 'Test Otomasyonu' },
    { value: 'MARKETING', label: 'Pazarlama' },
    { value: 'CUSTOMER_SUPPORT', label: 'Müşteri Desteği' },
    { value: 'RESEARCH', label: 'Araştırma' }
  ];

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

  // Ajan rolü seçimi
  const handleAgentRoleToggle = (agentId) => {
    const updatedRoles = formData.agentRoles.map(role => 
      role.id === agentId ? { ...role, selected: !role.selected } : role
    );
    
    setFormData({
      ...formData,
      agentRoles: updatedRoles
    });
  };

  // Form doğrulama
  const validateFormData = () => {
    let validationRules = {};
    
    // Adım 1 doğrulama kuralları
    if (activeStep === 0) {
      validationRules = {
        name: { required: true, minLength: 3, maxLength: 50, label: 'Takım adı' },
        description: { required: true, minLength: 10, maxLength: 500, label: 'Açıklama' },
        teamType: { required: true, label: 'Takım tipi' },
      };
    }
    // Adım 2 doğrulama kuralları
    else if (activeStep === 1) {
      // En az bir ajan rolü seçilmiş olmalı
      const selectedRoles = formData.agentRoles.filter(role => role.selected);
      if (selectedRoles.length === 0) {
        setFormErrors({ agentRoles: 'En az bir ajan rolü seçmelisiniz' });
        return false;
      }
      return true;
    }
    
    const errors = validateForm(formData, validationRules);
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  // Adım ilerletme
  const handleNext = () => {
    if (validateFormData()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Adım geriye alma
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
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
      const selectedRoles = formData.agentRoles
        .filter(role => role.selected)
        .map(role => ({ role: role.role }));
      
      const teamData = {
        name: formData.name,
        description: formData.description,
        teamType: formData.teamType,
        goalDescription: formData.goalDescription,
        agentRoles: selectedRoles
      };
      
      // Gerçek API entegrasyonu
      const result = await createTeam(teamData);
      console.log('Takım oluşturuldu:', result);
      setLoading(false);
      navigate('/teams');
      
    } catch (error) {
      setServerError('Takım oluşturulurken bir hata oluştu: ' + (error.response?.data?.detail || error.message));
      setLoading(false);
    }
  };

  // Mevcut adıma göre içerik oluşturma
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Takım Adı"
                  name="name"
                  variant="outlined"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  name="description"
                  variant="outlined"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.teamType} required>
                  <FormLabel component="legend">Takım Tipi</FormLabel>
                  <Select
                    name="teamType"
                    value={formData.teamType}
                    onChange={handleChange}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>Takım tipi seçin</MenuItem>
                    {teamTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{formErrors.teamType}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Takım Hedefi (İsteğe bağlı)"
                  name="goalDescription"
                  variant="outlined"
                  value={formData.goalDescription}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="Takımın ulaşmak istediği hedefi tanımlayın"
                />
              </Grid>
            </Grid>
          </>
        );
      case 1:
        return (
          <>
            <Typography variant="body1" paragraph>
              Bu takım için ajan rollerini seçin. Her rol, belirli görevleri yerine getirmek için tasarlanmıştır.
            </Typography>
            
            {formErrors.agentRoles && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formErrors.agentRoles}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              {formData.agentRoles.map((agent) => (
                <Grid item xs={12} sm={6} md={4} key={agent.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: agent.selected ? 'rgba(46, 125, 50, 0.1)' : 'inherit',
                      borderColor: agent.selected ? 'primary.main' : 'inherit',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 1
                      }
                    }}
                    onClick={() => handleAgentRoleToggle(agent.id)}
                  >
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {agent.role.replace('_', ' ')}
                        {agent.selected && (
                          <Chip 
                            label="Seçildi" 
                            color="primary" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {agent.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        );
      case 2:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Takım Bilgileri
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Takım Adı:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{formData.name}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Açıklama:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{formData.description}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Takım Tipi:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {teamTypes.find(t => t.value === formData.teamType)?.label || ''}
                  </Typography>
                </Grid>
                
                {formData.goalDescription && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Typography variant="subtitle2">Takım Hedefi:</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">{formData.goalDescription}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
            
            <Typography variant="h6" gutterBottom>
              Seçilen Ajan Rolleri
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={1}>
                {formData.agentRoles.filter(agent => agent.selected).map((agent) => (
                  <Grid item key={agent.id}>
                    <Chip 
                      label={agent.role.replace('_', ' ')} 
                      color="primary" 
                    />
                  </Grid>
                ))}
                
                {formData.agentRoles.filter(agent => agent.selected).length === 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Hiç ajan rolü seçilmedi
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            {serverError && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {serverError}
              </Alert>
            )}
          </>
        );
      default:
        return 'Bilinmeyen adım';
    }
  };

  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" className="page-title">
        Yeni Takım Oluştur
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <form onSubmit={handleSubmit}>
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={activeStep === 0 ? () => navigate('/teams') : handleBack}
              sx={{ mr: 1 }}
            >
              {activeStep === 0 ? 'İptal' : 'Geri'}
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Oluşturuluyor...' : 'Takım Oluştur'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  İleri
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default CreateTeamPage; 
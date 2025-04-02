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
  Divider,
  Avatar,
  CircularProgress,
  Fab,
  Tooltip,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import { fetchTeams } from '../services/api';

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // API'den takımları çekme işlemi
    const getTeams = async () => {
      try {
        setLoading(true);
        // Gerçek API kullanımını aktif ediyorum
        const data = await fetchTeams();
        setTeams(data || []);
        setLoading(false);
      } catch (err) {
        setError('Takımlar yüklenirken bir hata oluştu: ' + err.message);
        setLoading(false);
      }
    };

    getTeams();
  }, []);

  // Takım tipine göre renk ve etiket belirleme
  const getTeamTypeInfo = (teamType) => {
    switch (teamType) {
      case 'SOFTWARE_DEVELOPMENT':
        return { color: 'primary', label: 'Yazılım Geliştirme' };
      case 'TESTING':
        return { color: 'secondary', label: 'Test' };
      case 'MARKETING':
        return { color: 'success', label: 'Pazarlama' };
      default:
        return { color: 'default', label: 'Diğer' };
    }
  };

  // Tarih biçimlendirme
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  // Arama filtreleme fonksiyonu
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
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
          Takımlar
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Takım ara..."
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
          {filteredTeams.length === 0 ? (
            <Alert severity="info">
              Arama kriterlerinize uygun takım bulunamadı. Yeni bir takım oluşturmayı deneyebilirsiniz.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredTeams.map((team) => {
                const typeInfo = getTeamTypeInfo(team.teamType);
                return (
                  <Grid item xs={12} sm={6} md={4} key={team.id}>
                    <Card className="card-hover" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h5" component="h2">
                            {team.name}
                          </Typography>
                          <Chip 
                            label={typeInfo.label} 
                            color={typeInfo.color} 
                            size="small" 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {team.description}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {team.agentCount} Ajan
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GroupsIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {team.taskCount} Görev
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                          Oluşturulma: {formatDate(team.createdAt)}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/teams/${team.id}`}
                          fullWidth
                          variant="contained"
                          color="primary"
                        >
                          Detayları Görüntüle
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      <Tooltip title="Yeni Takım Oluştur" placement="left">
        <Fab 
          color="primary" 
          component={Link} 
          to="/teams/create"
          sx={{ position: 'fixed', bottom: 30, right: 30 }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}

export default TeamsPage; 
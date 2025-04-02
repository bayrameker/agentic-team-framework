import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  CardMedia, 
  Paper,
  Stack
} from '@mui/material';
import { Link } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SmartToyIcon from '@mui/icons-material/SmartToy';

function HomePage() {
  const features = [
    {
      title: 'Takım Yönetimi',
      description: 'Farklı kabiliyetlerle çoklu ajan takımları oluşturun ve yönetin.',
      icon: <GroupsIcon fontSize="large" color="primary" />,
      link: '/teams',
      linkText: 'Takımları Görüntüle'
    },
    {
      title: 'Görev Atama',
      description: 'Takımlarınıza görevler atayın ve ilerlemeyi takip edin.',
      icon: <AssignmentIcon fontSize="large" color="primary" />,
      link: '/tasks',
      linkText: 'Görevleri Görüntüle'
    },
    {
      title: 'LLM Model Yönetimi',
      description: 'Farklı LLM modellerini ajanlarınızda kullanın ve yönetin.',
      icon: <SmartToyIcon fontSize="large" color="primary" />,
      link: '/models',
      linkText: 'Modelleri Görüntüle'
    }
  ];

  return (
    <Box className="fade-in">
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 2, 
          backgroundImage: 'linear-gradient(to right, #43a047, #2e7d32)',
          color: 'white'
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Agentic Team
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Büyük Dil Modelleri (LLM) tarafından güçlendirilen akıllı takımlar
        </Typography>
        <Typography variant="body1" paragraph sx={{ maxWidth: '800px' }}>
          Yazılım geliştirme, test ve pazarlama için AI destekli ajanlarla oluşturulmuş takımları yönetin.
          Her bir ajana özel görevler atayın ve takım çalışması için iş birliğini optimize edin.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            component={Link} 
            to="/teams/create"
            sx={{ color: 'white' }}
          >
            Yeni Takım Oluştur
          </Button>
          <Button 
            variant="outlined" 
            component={Link} 
            to="/tasks/create"
            sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
          >
            Yeni Görev Oluştur
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6, mb: 3 }}>
        Özellikler
      </Typography>
      
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card className="card-hover" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom align="center">
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary" component={Link} to={feature.link}>
                  {feature.linkText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6, mb: 3 }}>
        Başlarken
      </Typography>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="body1" paragraph>
          Agentic Team sistemi, farklı yeteneklere sahip LLM tabanlı ajanları bir araya getirerek 
          yazılım geliştirme, test ve pazarlama takımları oluşturmanıza olanak tanır.
        </Typography>
        <Typography variant="body1" paragraph>
          Başlamak için, önce bir takım oluşturun ve ardından bu takım için görevler tanımlayın.
          Takımlarınıza farklı kabiliyetlere sahip ajanlar ekleyebilir ve bu ajanları 
          görevlerinize atayabilirsiniz.
        </Typography>
        <Button variant="contained" color="primary" component={Link} to="/teams">
          Takımları Keşfet
        </Button>
      </Paper>
    </Box>
  );
}

export default HomePage; 
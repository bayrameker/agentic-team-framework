import React from 'react';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';

function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'primary.main', color: 'white' }}>
      <Container maxWidth="lg">
        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} Agentic Team - Çoklu-Ajan Takım Yönetim Sistemi
        </Typography>
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          <MuiLink 
            href="#" 
            color="inherit" 
            sx={{ mx: 1, '&:hover': { textDecoration: 'underline' } }}
          >
            Hakkında
          </MuiLink>
          <MuiLink 
            href="#" 
            color="inherit" 
            sx={{ mx: 1, '&:hover': { textDecoration: 'underline' } }}
          >
            Dokümantasyon
          </MuiLink>
          <MuiLink 
            href="#" 
            color="inherit" 
            sx={{ mx: 1, '&:hover': { textDecoration: 'underline' } }}
          >
            API
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer; 
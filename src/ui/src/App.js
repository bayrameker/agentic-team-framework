import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import api from './services/api';

// Sayfalar
import Home from './pages/Home';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Agents from './pages/Agents';
import CodeBase from './pages/CodeBase';
import CodeOutput from './pages/CodeOutput';

// Komponentler
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Ana uygulama
function App() {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  
  // Takımları yükle
  const fetchTeams = async () => {
    try {
      const response = await api.get('/api/teams');
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error('Takımlar yüklenirken hata:', error);
      setTeams([]); // Hata durumunda boş dizi
    }
  };
  
  // Görevleri yükle
  const fetchTasks = async () => {
    try {
      const response = await api.get('/api/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
      setTasks([]); // Hata durumunda boş dizi
    } finally {
      setLoading(false);
    }
  };
  
  // Modelleri yükle
  const fetchModels = async () => {
    try {
      const response = await api.get('/api/models');
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Modeller yüklenirken hata:', error);
      setModels([]); // Hata durumunda boş dizi
    }
  };
  
  // İlk yükleme
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchTeams();
      await fetchTasks();
      await fetchModels();
      setLoading(false);
    };
    
    loadInitialData();
  }, []);
  
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        
        <div className="container-fluid flex-grow-1">
          <div className="row">
            <div className="col-md-2 d-none d-md-block sidebar bg-light">
              <Sidebar teams={teams} tasks={tasks} models={models} loading={loading} />
            </div>
            
            <div className="col-md-10 ms-auto py-3 main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/teams" element={<Teams refreshTeams={fetchTeams} isLoading={loading} />} />
                <Route path="/teams/:teamId" element={<TeamDetail api={api} teams={teams} refreshTeams={fetchTeams} />} />
                <Route path="/tasks" element={<Tasks api={api} tasks={tasks} teams={teams} refreshTasks={fetchTasks} />} />
                <Route path="/tasks/:taskId" element={<TaskDetail api={api} teams={teams} refreshTasks={fetchTasks} />} />
                <Route path="/agents" element={<Agents api={api} models={models} />} />
                <Route path="/code-base/:taskId" element={<CodeBase />} />
                <Route path="/code-output/:taskId" element={<CodeOutput />} />
                
                {/* /teams/create yolunu /teams'e yönlendir */}
                <Route path="/teams/create" element={<Navigate to="/teams" replace />} />
              </Routes>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App; 
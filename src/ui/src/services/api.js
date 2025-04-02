import axios from 'axios';
import { toast } from 'react-hot-toast';

// API'nin base URL'ini ortam değişkeninden al veya varsayılan değeri kullan
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// axios istemcisini oluştur
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 saniye zaman aşımı
});

// İstek interceptor'u
api.interceptors.request.use(
  (config) => {
    // İstek gönderilmeden önce buradan geçecek
    console.log(`API isteği gönderiliyor: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API isteği gönderilirken hata:', error);
    return Promise.reject(error);
  }
);

// Yanıt interceptor'u
api.interceptors.response.use(
  (response) => {
    // Başarılı yanıtlar buradan geçecek
    console.log(`API yanıtı alındı: ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    // Hata durumunda buradan geçecek
    console.error('API yanıtında hata:', error);
    
    // Hata mesajını hazırla
    let errorMessage = 'Sunucu ile iletişim kurulamadı. Lütfen internet bağlantınızı kontrol edin.';
    
    if (error.response) {
      // Sunucudan yanıt geldi ama hata kodu döndü
      const status = error.response.status;
      
      if (status === 404) {
        errorMessage = 'İstenen kaynak bulunamadı.';
      } else if (status === 401) {
        errorMessage = 'Oturum süresi doldu veya yetkiniz yok.';
      } else if (status === 403) {
        errorMessage = 'Bu işlem için yetkiniz bulunmuyor.';
      } else if (status === 500) {
        errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      } else {
        // Sunucudan gelen hata mesajını kullan
        errorMessage = error.response.data?.detail || 
                       error.response.data?.message || 
                       `Hata kodu: ${status}`;
      }
    } else if (error.request) {
      // İstek gönderildi ama yanıt alınamadı
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.';
      }
    }
    
    // Toast ile hata bildirimini göster (non-blocking)
    if (!error.config?.skipErrorToast) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// API İşlevleri
export const createTeam = async (teamData) => {
  try {
    console.log('Takım oluşturma isteği:', teamData);
    const response = await api.post('/api/teams/create', teamData);
    console.log('Takım oluşturma yanıtı:', response.data);
    toast.success('Takım başarıyla oluşturuldu');
    return response.data;
  } catch (error) {
    console.error('Takım oluşturulurken hata:', error);
    throw error;
  }
};

export const addAgentToTeam = async (teamId, agentData) => {
  try {
    console.log(`${teamId} ID'li takıma ajan ekleme isteği:`, agentData);
    const response = await api.post(`/api/teams/${teamId}/agents/add`, agentData);
    console.log('Ajan ekleme yanıtı:', response.data);
    toast.success('Ajan başarıyla eklendi');
    return response.data;
  } catch (error) {
    console.error('Ajan eklenirken hata:', error);
    throw error;
  }
};

export const fetchTeams = async () => {
  try {
    console.log('Takımlar getiriliyor...');
    const response = await api.get('/api/teams');
    console.log('Takımlar alındı:', response.data.teams);
    return response.data.teams;
  } catch (error) {
    console.error('Takımlar getirilirken hata:', error);
    return [];
  }
};

export const fetchTasksForTeam = async (teamId) => {
  try {
    console.log(`${teamId} ID'li takımın görevleri getiriliyor...`);
    const response = await api.get(`/api/teams/${teamId}/tasks`);
    console.log('Takım görevleri alındı:', response.data.tasks);
    return response.data.tasks;
  } catch (error) {
    console.error('Takım görevleri getirilirken hata:', error);
    return [];
  }
};

export default api; 
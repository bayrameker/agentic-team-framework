/**
 * Çeşitli yardımcı fonksiyonlar
 */

// Tarih formatı 
export const formatDate = (dateString, locale = 'tr-TR') => {
  if (!dateString) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  
  return new Date(dateString).toLocaleDateString(locale, options);
};

// Tarih ve saat formatı
export const formatDateTime = (dateString, locale = 'tr-TR') => {
  if (!dateString) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  
  return new Date(dateString).toLocaleDateString(locale, options);
};

// Görev durumu bilgisi
export const getTaskStatusInfo = (status) => {
  const statusMap = {
    PENDING: { 
      label: 'Bekliyor', 
      color: 'warning',
      backgroundColor: '#fff8e1',
      textColor: '#f57c00'
    },
    IN_PROGRESS: { 
      label: 'Devam Ediyor', 
      color: 'info',
      backgroundColor: '#e3f2fd',
      textColor: '#1976d2'
    },
    COMPLETED: { 
      label: 'Tamamlandı', 
      color: 'success',
      backgroundColor: '#e8f5e9',
      textColor: '#388e3c'
    },
    FAILED: { 
      label: 'Başarısız', 
      color: 'error',
      backgroundColor: '#ffebee',
      textColor: '#d32f2f'
    },
    CANCELLED: { 
      label: 'İptal Edildi', 
      color: 'default',
      backgroundColor: '#f5f5f5',
      textColor: '#757575'
    }
  };

  return statusMap[status] || { 
    label: 'Bilinmiyor', 
    color: 'default',
    backgroundColor: '#f5f5f5',
    textColor: '#757575'
  };
};

// Takım tipi bilgisi
export const getTeamTypeInfo = (teamType) => {
  const typeMap = {
    SOFTWARE_DEVELOPMENT: {
      label: 'Yazılım Geliştirme',
      color: 'primary',
      description: 'Frontend ve backend kod geliştirme, kod gözden geçirme, test.'
    },
    TESTING: {
      label: 'Test',
      color: 'secondary',
      description: 'Yazılım testi, kalite güvencesi, test senaryoları oluşturma.'
    },
    MARKETING: {
      label: 'Pazarlama',
      color: 'success',
      description: 'İçerik oluşturma, sosyal medya, SEO ve pazarlama stratejileri.'
    },
    CUSTOMER_SUPPORT: {
      label: 'Müşteri Desteği',
      color: 'info',
      description: 'Müşteri sorularını yanıtlama, teknik destek sağlama.'
    },
    RESEARCH: {
      label: 'Araştırma',
      color: 'warning',
      description: 'Pazar araştırması, teknoloji araştırması ve analiz.'
    }
  };
  
  return typeMap[teamType] || { 
    label: 'Diğer', 
    color: 'default',
    description: 'Özel takım türü'
  };
};

// Metin kısaltma
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Dosya boyutu formatı
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// URL parametrelerini nesneye dönüştürme
export const getUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const params = {};
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
};

// Form doğrulama
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = values[field];
    const fieldRules = rules[field];
    
    // Zorunlu alan kontrolü
    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = `${fieldRules.label || field} alanı zorunludur`;
      return;
    }
    
    // Minimum uzunluk kontrolü
    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} en az ${fieldRules.minLength} karakter olmalıdır`;
      return;
    }
    
    // Maksimum uzunluk kontrolü
    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} en fazla ${fieldRules.maxLength} karakter olmalıdır`;
      return;
    }
    
    // Özel doğrulama fonksiyonu
    if (fieldRules.validator && typeof fieldRules.validator === 'function') {
      const validationError = fieldRules.validator(value);
      if (validationError) {
        errors[field] = validationError;
      }
    }
  });
  
  return errors;
};

// Objeden boş değerleri temizleme
export const removeEmptyValues = (obj) => {
  const result = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    // null, undefined, boş string değerleri hariç tut
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  });
  
  return result;
}; 
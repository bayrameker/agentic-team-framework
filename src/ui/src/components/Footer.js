import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h5 className="mb-0">Agentic Teams</h5>
            <p className="text-light small mb-0 mt-2">
              LLM destekli akıllı ekip yönetimi ve geliştirme platformu
            </p>
          </div>
          <div className="col-md-6 text-md-end mt-3 mt-md-0">
            <div className="d-flex justify-content-md-end gap-2">
              <span className="badge bg-primary d-flex align-items-center px-3 py-2">
                <i className="bi bi-robot me-2"></i>
                <span>AI Destekli Kod Üretimi</span>
              </span>
              <span className="badge bg-info d-flex align-items-center px-3 py-2">
                <i className="bi bi-code-slash me-2"></i>
                <span>Uzun Çalışma Süreleri</span>
              </span>
            </div>
            <div className="mt-2 text-muted small">
              © {new Date().getFullYear()} Tüm hakları saklıdır.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
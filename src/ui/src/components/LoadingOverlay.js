import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingOverlay = ({ message = 'İşlem devam ediyor...' }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <Spinner animation="border" role="status" variant="primary" size="lg">
                    <span className="visually-hidden">Yükleniyor...</span>
                </Spinner>
                <div className="loading-message mt-3">
                    {message}
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay; 
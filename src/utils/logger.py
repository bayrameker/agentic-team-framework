import logging
import os

def setup_logger(name):
    """Logger oluşturur ve yapılandırır"""
    # Logs klasörünü oluştur
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Logger oluştur
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Dosya handler'ı
    file_handler = logging.FileHandler(f'logs/{name}.log')
    file_handler.setLevel(logging.INFO)
    
    # Konsol handler'ı
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Format
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Handler'ları ekle
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger 
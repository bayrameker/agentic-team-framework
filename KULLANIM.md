# Agentic Teams - Kullanım Kılavuzu

Bu belge, Agentic Teams sisteminin nasıl kullanılacağını açıklar.

## Sistem Gereksinimleri

- Python 3.8+
- [Ollama](https://ollama.com/) kurulu ve çalışır durumda
- İstenen LLM modelleri Ollama'ya yüklenmiş (llama3, mistral, mixtral, gemma, phi3 vb.)

## Kurulum

1. Bu depoyu klonlayın:
```bash
git clone https://github.com/bayrameker/agentic-teams.git
cd agentic-teams
```

2. Sanal ortam oluşturun ve etkinleştirin:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate  # Windows
```

3. Gereksinimleri yükleyin:
```bash
pip install -r requirements.txt
```

4. (İsteğe bağlı) `.env` dosyası oluşturun:
```bash
cp .env.example .env
# .env dosyasını düzenleyerek gerekli yapılandırmaları özelleştirin
```

## Ollama Modelleri

Sistem, varsayılan olarak aşağıdaki Ollama modellerini kullanır:
- llama3
- mistral
- mixtral
- phi3
- gemma

Bu modelleri yüklemek için (eğer zaten yüklü değilse):

```bash
ollama pull llama3
ollama pull mistral
ollama pull mixtral
ollama pull phi3
ollama pull gemma
```

## Örnekleri Çalıştırma

### Yazılım Ekibi Örneği

```bash
python src/examples/create_software_team.py
```

Bu örnek şunları gerçekleştirir:
1. 4 üyeli bir yazılım geliştirme ekibi oluşturur
2. ToDo uygulaması geliştirme görevi atar
3. Tüm ekip üyelerinin katkılarını alır
4. Sonuçları görüntüler ve ardından geribildirime dayalı bir iyileştirme yapar

### Pazarlama Ekibi Örneği

```bash
python src/examples/create_marketing_team.py
```

Bu örnek şunları gerçekleştirir:
1. 3 üyeli bir pazarlama ekibi oluşturur
2. Mobil uygulama için pazarlama kampanyası geliştirme görevi atar
3. Tüm ekip üyelerinin katkılarını alır
4. Sonuçları görüntüler ve ardından geribildirime dayalı bir iyileştirme yapar

## API Sunucusunu Başlatma

```bash
./start_server.py
# veya
python start_server.py
```

API sunucusu `http://localhost:8000` adresinde başlayacaktır.
API dokümantasyonuna `http://localhost:8000/docs` adresinden erişebilirsiniz.

## API Kullanımı

### 1. Modelleri Listeleme

```bash
curl http://localhost:8000/models
```

### 2. Ekip Oluşturma

```bash
curl -X POST http://localhost:8000/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ekibi",
    "type": "software_development",
    "description": "Otomatik test ekibi"
  }'
```

### 3. Ekibe Ajan Ekleme

```bash
curl -X POST http://localhost:8000/teams/{team_id}/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Uzmanı",
    "role": "tester",
    "model_name": "mistral"
  }'
```

### 4. Görev Oluşturma

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Planı Oluştur",
    "description": "REST API için kapsamlı bir test planı oluşturun",
    "team_id": "{team_id}"
  }'
```

### 5. Görevi Çalıştırma

```bash
curl -X POST http://localhost:8000/tasks/{task_id}/execute
```

### 6. Görevi İyileştirme

```bash
curl -X POST http://localhost:8000/tasks/{task_id}/iterate \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "{task_id}",
    "feedback": "Güvenlik testlerini de ekleyin ve performans testlerini detaylandırın"
  }'
```

## Özel Ekip ve Görevler Oluşturma

Kendi özel ekiplerinizi ve görevlerinizi oluşturmak için örnek dosyalarını şablon olarak kullanabilirsiniz. Farklı yeteneklere sahip rollerle kendi ekiplerinizi oluşturarak çeşitli görevler atayabilirsiniz.

Farklı roller için uygun modelleri atama konusunda model yetenekleri önemlidir:
- Kod yazma görevleri için: llama3, mixtral
- Yaratıcı görevler için: phi3, gemma
- Test ve hata ayıklama için: mistral, llama3
- Planlama ve analiz için: mixtral, llama3 
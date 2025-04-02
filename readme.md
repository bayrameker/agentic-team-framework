# Agentic Teams

Çoklu-Ajan Takım Yönetim Sistemi - LLM tabanlı ajanların takımlar halinde birlikte çalışmasını sağlayan çerçeve.

## Genel Bakış

Agentic Teams, farklı LLM modellerinin çoklu-ajan olarak bir takımda birlikte çalışmasını sağlayan bir sistemdir. Farklı rollerdeki ajanlar, görevleri parçalara ayırabilir, işbirliği yapabilir ve karmaşık problemleri çözebilir.

## Özellikler

- Farklı LLM modellerini kullanan ajanlar oluşturma
- Ekipler halinde ajanları organize etme
- Görevleri alt görevlere bölme ve uygun ajanlara atama
- Farklı yeteneklere sahip modelleri kullanma
- Geri bildirim ile görevleri yineleme

## Sistem Gereksinimleri

- Python 3.8+
- [Ollama](https://ollama.com/) kurulu ve çalışır durumda
- İstenen LLM modelleri Ollama'ya yüklenmiş (llama3, mistral, mixtral, gemma, phi3 vb.)

## Kurulum

1. Gereksinimleri yükleyin:
```bash
pip install -r requirements.txt
```

2. Ollama'yı kurun ve çalıştırın:
```bash
# Ollama servisini başlatın
ollama serve

# İhtiyaç duyulan modelleri yükleyin
ollama pull llama3
ollama pull mistral
ollama pull mixtral
ollama pull phi3
ollama pull gemma
```

3. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin (ihtiyaca göre)
```

## Kullanım

### Örnek Uygulamayı Çalıştırma

```bash
python example.py
```

Bu örnek uygulama şunları gerçekleştirir:
1. Ollama modellerini kontrol eder
2. Bir yazılım geliştirme takımı oluşturur
3. Takıma farklı rollerle ajanlar ekler
4. Bir görev oluşturur ve alt görevlere böler
5. Görevi takıma dağıtır ve sonuçları gösterir
6. Geri bildirim ile çözümü iyileştirir

### API Sunucusunu Başlatma

```bash
python app.py
```

API sunucusu aşağıdaki adreste çalışacaktır:
- API: http://localhost:8000/api
- Dokümantasyon: http://localhost:8000/api/docs
- Web UI: http://localhost:8000

## API Endpoint'leri

- `GET /api/models`: Mevcut modelleri listeler
- `GET /api/model/{model_name}/capabilities`: Model yeteneklerini döndürür
- `GET /api/teams`: Tüm takımları listeler
- `GET /api/teams/{team_id}`: Belirli bir takımın detaylarını döndürür
- `POST /api/teams`: Yeni bir takım oluşturur
- `POST /api/teams/{team_id}/agents`: Takıma yeni bir ajan ekler
- `GET /api/tasks`: Tüm görevleri listeler
- `GET /api/tasks/{task_id}`: Belirli bir görevin detaylarını döndürür
- `POST /api/tasks`: Yeni bir görev oluşturur
- `POST /api/tasks/{task_id}/execute`: Görevi yürütür
- `POST /api/tasks/{task_id}/iterate`: Görevi geribildirime göre yineler

## Özelleştirme

- `src/agents/agent.py`: Ajan sınıfını ve davranışlarını tanımlar
- `src/models/ollama.py`: Ollama API adaptörü
- `src/models/team.py`: Takım ve görev modelleri
- `src/teams/team_manager.py`: Takım yönetimi ve görev dağıtımı

## Lisans

MIT

## İletişim

GitHub üzerinden issue açarak veya pull request göndererek katkıda bulunabilirsiniz.






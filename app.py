import os
import asyncio
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

# Modül yolunu ekle
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.models.ollama import OllamaAdapter
from src.team_manager import TeamManager

# Kullanılabilir modeller
AVAILABLE_MODELS = [
    "llama3.2:latest", 
    "phi4:latest", 
    "gemma3:12b", 
    "gemma3:4b", 
    "gemma3:1b", 
    "llama3.1:latest"
]

# API oluştur
app = FastAPI(
    title="Agentic Team API", 
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm originlere izin ver (geliştirme için)
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Statik dosyaları servis et (React build)
app.mount("/static", StaticFiles(directory="src/ui/build/static"), name="static")
app.mount("/manifest.json", StaticFiles(directory="src/ui/build"), name="manifest")
app.mount("/favicon.ico", StaticFiles(directory="src/ui/build"), name="favicon")
app.mount("/logo192.png", StaticFiles(directory="src/ui/build"), name="logo192")
app.mount("/logo512.png", StaticFiles(directory="src/ui/build"), name="logo512")

# Global değişkenler
ollama_adapter = None
team_manager = None
available_models = []

# Pydantic modelleri
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None

class AgentCreate(BaseModel):
    name: str
    role: str
    model: str

class TaskCreate(BaseModel):
    name: Optional[str] = None
    description: str
    team_id: str

class SubtaskCreate(BaseModel):
    description: str
    title: Optional[str] = None
    assigned_agent_id: Optional[str] = None

class FeedbackCreate(BaseModel):
    feedback: str

class DocumentUpload(BaseModel):
    title: str
    content: str
    type: str = "text"

# API başlatma fonksiyonu
async def initialize_api():
    global ollama_adapter, team_manager, available_models
    
    try:
        if ollama_adapter is None:
            print("Ollama API başlatılıyor...")
            ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            ollama_adapter = OllamaAdapter(base_url=ollama_base_url)
            print(f"Ollama API başlatıldı: {ollama_base_url}")
            
            # Mevcut modelleri al
            try:
                models = await ollama_adapter.list_models()
                if not models:
                    print("Ollama modelleri bulunamadı, varsayılan listesi kullanılıyor.")
                    available_models = AVAILABLE_MODELS
                else:
                    available_models = models
                print(f"Bulunan modeller: {available_models}")
            except Exception as e:
                print(f"Modeller alınırken hata: {e}")
                available_models = AVAILABLE_MODELS
            
            print(f"Kullanılabilir modeller: {available_models}")
        
        # Takım yöneticisini başlat
        if team_manager is None:
            try:
                team_manager = TeamManager(ollama_adapter)
                print("TeamManager başarıyla oluşturuldu")
            except Exception as e:
                print(f"TeamManager oluşturulurken hata: {e}")
                # Hata durumunda parametresiz başlatmayı dene
                team_manager = TeamManager()
                print("TeamManager parametresiz olarak başlatıldı")
    except Exception as e:
        print(f"API başlatma hatası: {e}")
        if team_manager is None:
            team_manager = TeamManager()
            print("TeamManager parametresiz olarak başlatıldı")
    
    # Olmassa olmaz: team_manager'ın kesinlikle oluşturulduğundan emin ol
    if team_manager is None:
        team_manager = TeamManager()
        print("TeamManager yedek olarak başlatıldı")
    
    # Olmassa olmaz: available_models listesinin kesinlikle dolu olduğundan emin ol
    if not available_models:
        available_models = AVAILABLE_MODELS
        print("Varsayılan model listesi kullanılıyor")

# Ana React uygulaması için index.html'i döndür
@app.get("/", include_in_schema=False)
async def serve_spa():
    return FileResponse("src/ui/build/index.html")

# API durumunu kontrol et
@app.get("/api/health")
async def health_check():
    return {"status": "up", "timestamp": datetime.now().isoformat()}

# Aktif görevleri listele
@app.get("/api/tasks/active")
async def list_active_tasks():
    await initialize_api()
    return {"active_tasks": team_manager.list_active_tasks()}

# Görev durumunu kontrol et
@app.get("/api/tasks/{task_id}/status")
async def check_task_status(task_id: str):
    await initialize_api()
    return team_manager.check_task_status(task_id)

# Mevcut modelleri listele
@app.get("/api/models")
async def list_models():
    await initialize_api()
    return {"models": available_models}

# Takımları listele
@app.get("/api/teams")
async def list_teams():
    await initialize_api()
    teams = []
    if team_manager and hasattr(team_manager, 'teams'):
        for team_id in team_manager.teams.keys():
            team = team_manager.get_team(team_id)
            if team:
                teams.append(team)
    return {"teams": teams}

# Yeni takım oluştur
@app.post("/api/teams/create")
async def create_team(team: TeamCreate):
    await initialize_api()
    
    # description değerini None veya boş string ise uygun bir değer ver
    description = team.description if team.description else f"{team.name} takımı için açıklama"
    
    try:
        team_id = team_manager.create_team(name=team.name, description=description)
        print(f"Yeni takım oluşturuldu: {team.name} (ID: {team_id})")
        return {"id": team_id, "name": team.name, "description": description}
    except Exception as e:
        print(f"Takım oluşturulurken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Takım oluşturulamadı: {str(e)}")

# Takım detaylarını getir
@app.get("/api/teams/{team_id}")
async def get_team(team_id: str):
    await initialize_api()
    team = team_manager.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Takım bulunamadı")
    return team

# Takıma ait görevleri getir 
@app.get("/api/teams/{team_id}/tasks")
async def get_team_tasks(team_id: str):
    await initialize_api()
    
    # Takımı kontrol et
    team = team_manager.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Takım bulunamadı")
    
    # Takıma ait görevleri getir
    tasks = []
    try:
        tasks = team_manager.get_team_tasks(team_id)
        print(f"Takım {team_id} için bulunan görevler: {len(tasks)}")
    except Exception as e:
        print(f"Takım görevleri getirilirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Görevler getirilemedi: {str(e)}")
    
    return {"tasks": tasks}

# Takımı sil
@app.delete("/api/teams/{team_id}")
async def delete_team(team_id: str):
    await initialize_api()
    team = team_manager.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Takım bulunamadı")
    
    team_manager.delete_team(team_id)
    return {"message": "Takım başarıyla silindi"}

# Takıma ajan ekle
@app.post("/api/teams/{team_id}/agents/add")
async def add_agent(team_id: str, agent: AgentCreate):
    await initialize_api()
    print(f"Ajan ekleme isteği: Takım ID: {team_id}, Ajan: {agent.name}, Rol: {agent.role}, Model: {agent.model}")
    
    team = team_manager.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Takım bulunamadı")
    
    try:
        agent_id = team_manager.add_agent_to_team(
            team_id=team_id, 
            name=agent.name, 
            role=agent.role, 
            model_name=agent.model
        )
        print(f"Ajan başarıyla eklendi: {agent.name} ({agent_id}) -> Takım: {team_id}")
        return {
            "id": agent_id, 
            "name": agent.name, 
            "role": agent.role, 
            "model": agent.model
        }
    except Exception as e:
        print(f"Ajan eklenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ajan eklenemedi: {str(e)}")

# Görevleri listele
@app.get("/api/tasks")
async def list_tasks():
    await initialize_api()
    tasks = []
    for task_id in team_manager.tasks.keys():
        task = team_manager.get_task(task_id)
        if task:
            tasks.append(task)
    return {"tasks": tasks}

# Yeni görev oluştur
@app.post("/api/tasks/create")
async def create_task(task: TaskCreate):
    await initialize_api()
    
    try:
        # Takımı kontrol et
        team = team_manager.get_team(task.team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Takım bulunamadı")
        
        task_name = task.name if task.name else f"Görev #{len(team_manager.tasks) + 1}"
        
        task_id = team_manager.create_task(
            title=task_name,
            description=task.description,
            team_id=task.team_id
        )
        
        return {
            "id": task_id, 
            "team_id": task.team_id, 
            "description": task.description, 
            "name": task_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Görev oluşturulurken hata: {str(e)}")

# Görev detaylarını getir
@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    return task

# Görevi sil
@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    team_manager.delete_task(task_id)
    return {"message": "Görev başarıyla silindi"}

# Göreve alt görev ekle
@app.post("/api/tasks/{task_id}/subtasks/add")
async def add_subtask(task_id: str, subtask: SubtaskCreate):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    subtask_id = team_manager.add_subtask(
        task_id=task_id, 
        description=subtask.description,
        title=subtask.title,
        assigned_agent_id=subtask.assigned_agent_id
    )
    
    # Güncellenmiş görevi al
    updated_task = team_manager.get_task(task_id)
    return {
        "message": "Alt görev başarıyla eklendi",
        "id": subtask_id,
        "subtask": team_manager.subtasks.get(subtask_id),
        "task": updated_task
    }

# Doküman yükleme
@app.post("/api/tasks/{task_id}/documents/upload")
async def upload_document(task_id: str, document: DocumentUpload):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    document_id = team_manager.upload_document(
        task_id=task_id,
        document_title=document.title,
        document_content=document.content,
        document_type=document.type
    )
    
    if not document_id:
        raise HTTPException(status_code=500, detail="Doküman yüklenemedi")
    
    # Güncellenmiş görevi al
    updated_task = team_manager.get_task(task_id)
    return {
        "message": "Doküman başarıyla yüklendi",
        "document_id": document_id,
        "document": team_manager.get_document(task_id, document_id),
        "task": updated_task
    }

# Dokümanları listele
@app.get("/api/tasks/{task_id}/documents")
async def list_documents(task_id: str):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    documents = team_manager.list_documents(task_id)
    return {"documents": documents}

# Doküman detayları
@app.get("/api/tasks/{task_id}/documents/{document_id}")
async def get_document(task_id: str, document_id: str):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    document = team_manager.get_document(task_id, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Doküman bulunamadı")
    
    return document

# Dokümanı değerlendir
@app.post("/api/tasks/{task_id}/documents/{document_id}/evaluate")
async def evaluate_document(task_id: str, document_id: str):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    document = team_manager.get_document(task_id, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Doküman bulunamadı")
    
    result = await team_manager.evaluate_document(task_id, document_id)
    
    if not result or "error" in result:
        raise HTTPException(status_code=500, detail=result.get("error", "Doküman değerlendirme başarısız oldu"))
    
    # Güncellenmiş görevi al
    updated_task = team_manager.get_task(task_id)
    return {
        "message": "Doküman başarıyla değerlendirildi",
        "evaluations": result.get("evaluations", []),
        "consolidated_evaluation": result.get("consolidated_evaluation", ""),
        "task": updated_task
    }

# Görevi çalıştır
@app.post("/api/tasks/{task_id}/execute")
async def execute_task(task_id: str):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    # Görev zaten çalışıyorsa hata döndür
    if team_manager.check_task_status(task_id).get("is_active", False):
        return {
            "message": "Görev zaten çalışıyor",
            "task": task,
            "status": "in_progress"
        }
    
    # Görev arka planda çalışmaya başlat (thread-safe için)
    async def run_task_async():
        try:
            await team_manager.execute_task(task_id)
        except Exception as e:
            logger.error(f"Görev çalıştırılırken hata: {str(e)}")
            team_manager.fail_task(task_id, str(e))
    
    # Görevi başlat
    asyncio.create_task(run_task_async())
    
    # Güncel görev bilgisini al
    updated_task = team_manager.get_task(task_id)
    
    return {
        "message": "Görev başarıyla başlatıldı",
        "task": updated_task,
        "status": "in_progress"
    }

# Görev iterasyonu
@app.post("/api/tasks/{task_id}/iterate")
async def iterate_task(task_id: str, feedback: FeedbackCreate = None):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    feedback_text = feedback.feedback if feedback else None
    result = await team_manager.iterate_task(task_id, feedback_text)
    
    # Güncellenmiş görevi döndür
    updated_task = team_manager.get_task(task_id)
    return {
        "message": "Görev iterasyonu başarıyla tamamlandı",
        "task": updated_task,
        "result": result
    }

# Kod çalıştırma endpoint'i
@app.post("/api/tasks/{task_id}/execute-code")
async def execute_code(task_id: str, request: Request):
    await initialize_api()
    task = team_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    # İstek gövdesinden kodu al
    data = await request.json()
    code = data.get("code")
    language = data.get("language", "python")
    file_name = data.get("fileName", "code.py")
    
    if not code:
        raise HTTPException(status_code=400, detail="Kod gereklidir")
    
    # Güvenlik kontrolü: Zararlı kodları engelle
    if "import os" in code and ("system(" in code or "popen(" in code):
        raise HTTPException(status_code=400, detail="Güvenlik sorunu: Sistem komutları çalıştırılamaz")
    
    # Kodu çalıştır ve sonuçları döndür
    try:
        # Geçici bir dosya oluştur
        import tempfile
        import os
        import subprocess
        from pathlib import Path
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Dosyayı oluştur
            file_path = Path(temp_dir) / file_name
            with open(file_path, 'w') as f:
                f.write(code)
            
            # Dile göre çalıştırma komutu
            cmd = None
            if language == "python":
                cmd = ["python", str(file_path)]
            elif language == "javascript" or language == "typescript":
                cmd = ["node", str(file_path)]
            elif language == "java":
                # Java için önce derleme gerekiyor
                compile_cmd = ["javac", str(file_path)]
                try:
                    subprocess.run(compile_cmd, check=True, capture_output=True, timeout=10)
                    class_name = file_name.replace(".java", "")
                    cmd = ["java", "-cp", temp_dir, class_name]
                except subprocess.CalledProcessError as e:
                    return {"output": f"Derleme hatası: {e.stderr.decode('utf-8')}"}
            elif language == "cpp" or language == "c":
                # C/C++ için derleme
                output_path = Path(temp_dir) / "compiled"
                compile_cmd = ["g++", str(file_path), "-o", str(output_path)]
                try:
                    subprocess.run(compile_cmd, check=True, capture_output=True, timeout=10)
                    cmd = [str(output_path)]
                except subprocess.CalledProcessError as e:
                    return {"output": f"Derleme hatası: {e.stderr.decode('utf-8')}"}
            else:
                return {"output": f"Desteklenmeyen dil: {language}"}
            
            if cmd:
                # Kodu çalıştır (zaman sınırlaması ile)
                try:
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                    output = result.stdout
                    if result.stderr:
                        output += f"\nHata çıktısı:\n{result.stderr}"
                    
                    # Kodu doküman olarak kaydet
                    document_id = team_manager.upload_document(
                        task_id=task_id,
                        document_title=file_name,
                        document_content=code,
                        document_type="code"
                    )
                    
                    # Çıktıyı da kaydet
                    output_doc_id = team_manager.upload_document(
                        task_id=task_id,
                        document_title=f"{file_name}.output",
                        document_content=output,
                        document_type="text"
                    )
                    
                    return {
                        "output": output,
                        "success": True,
                        "document_id": document_id,
                        "output_document_id": output_doc_id
                    }
                except subprocess.TimeoutExpired:
                    return {"output": "Kod çalıştırma zaman aşımına uğradı (10 saniye sınırı)"}
                except Exception as e:
                    return {"output": f"Çalıştırma hatası: {str(e)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kod çalıştırılırken hata oluştu: {str(e)}")

# Tüm diğer UI yolları için index.html'i döndür - React routing için
@app.get("/{full_path:path}", include_in_schema=False)
async def catch_all(full_path: str):
    # /api ile başlayan istekleri hariç tut
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint bulunamadı")
    return FileResponse("src/ui/build/index.html")

# Görevi iptal et
@app.post("/api/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    await initialize_api()
    success = team_manager.cancel_task(task_id)
    if success:
        return {"message": "Görev başarıyla iptal edildi"}
    return {"error": "Görev iptal edilemedi"}

# Uygulamayı başlat
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 
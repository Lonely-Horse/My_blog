import os
import json
import datetime
from fastapi import FastAPI,Request,HTTPException
from fastapi.responses import HTMLResponse,FileResponse,JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter
from pathlib import Path
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI()

templates=Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

index_view_counter = Counter("blog_index_views_total","total blog index views")
article_view_counter = Counter("blog_article_views_total","total blog article views",["article"])
projects_view_counter = Counter("blog_projects_views_total","total blog projects views")
download_counter = Counter("blog_downloads_total","total blog file downloads",["file"])
notes_view_counter = Counter("blog_notes_views_total","total blog notes views")
not_found_counter = Counter("blog_not_found_total","total number of 404 response",["type"])
                             
BASE_PATH = Path(__file__).resolve().parent
PROJECTS_DIR = BASE_PATH / 'static/projects'
POSTS_DIR = BASE_PATH / 'posts'
NOTES_DIR = BASE_PATH / 'notes'
HTTP_DIR = BASE_PATH / 'projects_web'

Instrumentator().instrument(app).expose(app)

# 1. 首页
@app.get('/',include_in_schema=False)
def index(request:Request):
    index_view_counter.inc()
    return templates.TemplateResponse(request=request, name="index.html")
# 2. 通用文章页 (读取本地 TXT)
@app.get('/article/{filename}',response_class=HTMLResponse,include_in_schema=False)
def article(request: Request, filename: str):

    if '..' in filename or '/' in filename:
        not_found_counter.labels(type="article").inc()
        raise HTTPException(status_code=404,detail = "Not Found")
        
    filepath = POSTS_DIR / f'{filename}.txt'
    
    if not os.path.exists(filepath):
        not_found_counter.labels(type="article").inc()
        raise HTTPException(status_code=404,detail = "Not Found")
        
    # 读取文件内容
    content_lines = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:

            content_lines = [line.strip() for line in f.readlines() if line.strip()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading file")
    article_view_counter.labels(article=filename).inc()
    return templates.TemplateResponse(name='post.html', request=request,context={"title": filename.upper(), "lines": content_lines})

# 3. 项目库页面
@app.get('/projects',include_in_schema=False)
def projects(request:Request):

    projects_view_counter.inc()   
    json_path = HTTP_DIR / 'projects.json'
    
    project_list = []
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                project_list = json.load(f)
        except Exception as e:
            print(f"JSON读取错误: {e}")        
    return templates.TemplateResponse(name='projects.html', request=request,context={"projects":project_list})

# 4. 下载路由
@app.get('/download/{filename:path}')
def download_file(filename:str):
    FILE_PATH = (PROJECTS_DIR / filename).resolve()
    
    # 防止路径遍历
    if not FILE_PATH.is_relative_to(PROJECTS_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    if not FILE_PATH.is_file():
        not_found_counter.labels(type="download").inc()
        raise HTTPException(status_code=404, detail="Not Found")
    download_counter.labels(file=filename).inc()
    return FileResponse(path=FILE_PATH, filename=FILE_PATH.name)

#5.随笔路由
@app.get('/notes',include_in_schema=False)
def notes(request:Request):
    notes_view_counter.inc()
    notes_list = []

    if NOTES_DIR.exists():
        files = list(NOTES_DIR.glob('*.txt'))

        file_data = []
        for filepath in files:
            mtime = filepath.stat().st_mtime
            file_data.append((filepath, mtime))

        file_data.sort(key=lambda x: x[1], reverse=True)

        # 4. 读取内容
        for filepath, mtime in file_data:
            try:
                content = filepath.read_text(encoding='utf-8')

                # 标题就是文件名去掉 .txt
                title = filepath.stem

                date_str = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')

                notes_list.append({
                    "title": title,
                    "date": date_str,
                    "content": content
                })
            except Exception as e:
                print(f"Error reading {filepath.name}: {e}")
    return templates.TemplateResponse(name='notes.html',request=request,context={"notes":notes_list})
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        path = request.url.path
        if path.startswith("/article/"):
            # 文章页 404 已经在业务里记了，这里不重复记
            pass
        elif path.startswith("/download/"):
            # 下载页 404 已经在业务里记了，这里不重复记
            pass
        else:
            not_found_counter.labels(type="route").inc()
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
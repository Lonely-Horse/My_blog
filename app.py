import os
import json
import datetime
from flask import Flask, render_template, abort, send_from_directory

app = Flask(__name__)

# 配置上传/下载文件夹路径
PROJECTS_DIR = os.path.join(app.root_path, 'static/projects')
POSTS_DIR = os.path.join(app.root_path, 'posts')
NOTES_DIR = os.path.join(app.root_path, 'notes')
# 1. 首页
@app.route('/')
def index():
    return render_template('index.html')

# 2. 通用文章页 (读取本地 TXT)
# 访问 /article/confession 会自动去读 posts/confession.txt
@app.route('/article/<filename>')
def article(filename):
    # 安全检查：只允许文件名，不允许路径跳转（防止读取系统文件）
    if '..' in filename or '/' in filename:
        abort(404)
        
    filepath = os.path.join(POSTS_DIR, f'{filename}.txt')
    
    if not os.path.exists(filepath):
        abort(404)
        
    # 读取文件内容
    content_lines = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            # 按行读取，方便前端分段显示
            content_lines = [line.strip() for line in f.readlines() if line.strip()]
    except Exception as e:
        return f"读取错误: {e}"

    # 这里的 title 我们简单处理，首字母大写
    return render_template('post.html', title=filename.upper(), lines=content_lines)

# 3. 项目库页面
@app.route('/projects')
def projects():
    # 模拟项目数据（未来可以从数据库或json文件读）
    # source_link 可以是 GitHub 地址，也可以是本地另一个页面
    json_path = os.path.join(app.root_path, 'projects.json')
    
    project_list = []
    # 尝试读取 json 文件
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                project_list = json.load(f)
        except Exception as e:
            print(f"JSON读取错误: {e}")
            
    return render_template('projects.html', projects=project_list)

# 4. 下载路由
@app.route('/download/<path:filename>')
def download_file(filename):
    # as_attachment=True 会触发浏览器下载而不是直接预览
    return send_from_directory(PROJECTS_DIR, filename, as_attachment=True)

#5.随笔路由
@app.route('/notes')
def notes():
    notes_list = []

    if os.path.exists(NOTES_DIR):
        # 1. 获取所有 .txt 文件
        files = [f for f in os.listdir(NOTES_DIR) if f.endswith('.txt')]

        # 2. 构造一个包含 (文件名, 修改时间) 的列表
        file_data = []
        for filename in files:
            filepath = os.path.join(NOTES_DIR, filename)
            # 获取文件最后修改时间戳
            mtime = os.path.getmtime(filepath)
            file_data.append((filename, mtime))

        # 3. 按修改时间倒序排列 (最新的时间排前面)
        # key=lambda x: x[1] 表示按照元组的第2个元素(时间)来排序
        file_data.sort(key=lambda x: x[1], reverse=True)

        # 4. 读取内容
        for filename, mtime in file_data:
            filepath = os.path.join(NOTES_DIR, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # 标题就是文件名去掉 .txt
                title = filename.replace('.txt', '')

                # 我们可以顺便把时间格式化一下，显示给前端看
                date_str = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')

                notes_list.append({
                    "title": title,
                    "date": date_str,  # 新增一个时间字段
                    "content": content
                })
            except Exception as e:
                print(f"Error reading {filename}: {e}")

    return render_template('notes.html', notes=notes_list)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


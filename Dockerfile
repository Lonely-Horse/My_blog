FROM 100.87.250.21:5000/python:3.9-slim

LABEL maintainer="lonelyhorse"

# SRE 环境变量优化：禁止 Python 产生 .pyc 缓存文件并禁用 stdout 缓冲以确保容器日志即时输出
ENV MYPATH=/usr/local \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR $MYPATH/My_blog

# 1. 拷贝依赖清单并优先安装，以充分利用 Docker 缓存层
COPY requirements.txt .
RUN pip3 install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

# 2. 拷贝项目全部源码（包括 static/ 静态资源及 templates/ 前端模板目录）
COPY . .

# 3. 💥 DevOps 容器安全规范：创建非特权用户 appuser，并对工作目录下的有状态资产目录赋予读写权限
RUN useradd -u 1000 -U -s /bin/sh appuser && \
    chown -R appuser:appuser $MYPATH/My_blog

# 切换为非特权用户执行，规避 root 容器溢出风险
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

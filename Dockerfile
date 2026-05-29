FROM 100.87.250.21:5000/python:3.9-slim
LABEL maintainer="lonelyhorse"
ENV MYPATH=/usr/local \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR $MYPATH/My_blog

COPY requirements.txt .

RUN pip3 install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

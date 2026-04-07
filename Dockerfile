FROM python:3.9-slim
LABEL maintainer="lonelyhorse"
ENV MYPATH=/usr/local

RUN apt update && \
    apt -y install vim net-tools && \
    apt clean

WORKDIR $MYPATH/My_blog
COPY . .

RUN pip3 install fastapi uvicorn jinja2 aiofiles prometheus_fastapi_instrumentator

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

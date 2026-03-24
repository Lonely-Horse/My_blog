FROM rockylinux:9
LABEL maintainer="lonelyhorse"
ENV MYPATH /usr/local

RUN yum -y install vim net-tools python3 python3-pip && \
    yum clean all

WORKDIR $MYPATH/My_blog
COPY . .

RUN pip3 install fastapi uvicorn jinja2 aiofiles

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

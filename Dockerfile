FROM rockylinux:9
LABEL maintainer="lonelyhorse"
ENV MYPATH /usr/local

RUN yum -y install vim net-tools python3 python3-pip && \
    yum clean all

WORKDIR $MYPATH/My_blog
COPY . .

RUN pip3 install fastapi

EXPOSE 5000
CMD ["python3","app.py"]

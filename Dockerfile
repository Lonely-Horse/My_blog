FROM rockylinux
LABEL maintainer="lonelyhorse"

ENV MYPATH /usr/local
COPY My_blog $MYPATH/My_blog
WORKDIR $MYPATH/My_blog

RUN yum -y install vim net-tools python3 python3-pip && \ 
    yum clean all

RUN pip3 install flask

EXPOSE 5000

CMD ["python3","app.py"]


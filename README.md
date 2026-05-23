# DevOps 自动化技术博客

## 1.项目定位
本项目是一个个人技术博客，本身用于我复盘我的踩坑记录，以及保留我的代码项目和学习经历，从而养成习惯于写文档记录的习惯

它也承担了运维知识库的作用，用来沉淀linux，网络，docker，监控，自动化运维的实践经验

最重要的一点是，成为我DevOps/SRE/平台工程师的训练场和实验场地，不仅是一个简单的博客，本身还是我的技术结晶

## 2.当前框架概要
当前的博客服务运行在我的HP t630边缘节点上，公网访问由aliyun server的nginx反代流量完成，服务器通过tailscale将请求内部转发到我的FastAPI博客服务
    
Ser7作为我的workstation和ansible控制节点，负责日常开发，部署指挥，和自动化管理中心，Oneplus6作为备用的测试节点使用

以下是结构图:
```text
      浏览器
        |
        |https
        v
aliyun server / nginx
        |
        |tailscale
        v
HP t630 / Docker Compose
        |
        |
        v
FastAPI Blog
```
详细架构说明，请见[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 3.技术栈
| 方向 | 技术 |
|---|---|
| 后端框架 | FastAPI |
| 网页渲染 | Jinja2 Templates |
| 容器化 | Docker / Docker Compose |
| 公网入口 | Nginx |
| 私有网络 | Tailscale |
| 监控 | Prometheus / Grafana |
| 告警 | Alertmanager |
| 自动化 | GitHub Actions / Ansible |
| 内容管理 | TXT文件 / bind mount / rsync(演进中) |

## 4.已实现能力
当前项目已经具备:
- 基于FastAPI的博客首页，文章页，项目库和随笔页
- 基于Docker Compose的容器化部署
- 通过aliyun server+nginx+tailscale完成公网访问内网服务
- 接入prometheus和grafana可视化，记录博客访问量，随笔访问量，项目页访问量，文件下载量，文章下载量，访问量和404数量
- 使用alertmanager完成基础的告警链路
- 对于`/metrics`指标路径进行公网入口拦截，走tailscale内网实现抓取数据
- 通过git actions和部署脚本推进自动化部署操作

## 5.监控和安全边界
博客后端通过暴露出'/metrics'路径来暴露数据指标，被prometheus抓取数据

当前公网入口nginx已经对于博客的配置进行了改变，对于/'metrics'路径进行对外封锁，并返还403错误码，避免了数据直接暴露在公网当中，导致泄露较为敏感的信息数据

本项目的基本安全边界是:业务页面可通过公网访问，但是监控暴露的数据指标和接口必须在tailscale内网当中流动，不能走公网通道

## 6.历史演进

### 第一阶段: Aliyun Server
直接运行在aliyun server上，使用nginx直接开放端口实现访问

### 第二阶段: One Plus 6
本身部署在arm64架构的一加6手机上，然后通过aliyun server的nginx反代，实现外部访问

### 第三阶段: Ser7
博客服务转移服务到零刻Ser7设备上，依旧是通过aliyun server的nginx反代，实现外部访问

### 第四阶段: T630 (现阶段)
博客服务再次转移到HP T630边缘设备上，使用aliyun server部署的nginx反代，实现外部访问

## 7.项目文档

- [架构说明](./docs/ARCHITECTURE.md)
- [职业发展优先级别](./docs/CAREER_PRIORITY.md)
- [Ser7到T630的服务迁移复盘](./posts/ser7_to_t630.txt)
- [Alertmanager实践记录](./posts/Alertmanager_Blog.txt)

## 8.当前状态和后续计划

已完成:
- FastAPI 博客基础功能
- Docker Compose部署
- Server Nginx 公网入口
- Tailscale 内网访问链路
- Prometheus / Grafana 基础监控
- `/metrics` 公网访问拦截

进行中:
- Github Actions 部署链路完善
- `rsync`内容同步流程
- Ansible纳管博客基础设施
- Dockerfile / Compose 工程化优化

后续计划:
- 完善Alertmanager告警规则和Grafana Dashboard
- 学习Traefix，并逐步替代部分Nginx代理配置
- 在基础稳定后探索k3s / k8s部署方式

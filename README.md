# 📱 Edge-Computing & Observability Platform
> **基于一加手机 (ARM64) 边缘节点与阿里云公网网关的分布式监控与个人博客系统**
> 
> ![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)
> ![Platform](https://img.shields.io/badge/Platform-ARM64%20|%20x86_64-blue)
> ![Network](https://img.shields.io/badge/Network-Tailscale%20VPN-orange)

---

## 🏗 架构图 (Architecture)

本项目采用 **"云端网关 + 边缘计算"** 的混合架构，通过私有隧道实现公网访问与内网服务的解耦。

```mermaid
graph TD
    User((访问者)) -- "HTTPS/443" --> Aliyun[阿里云 Nginx 网关]
    Aliyun -- "Tailscale 隧道" --> Phone[一加手机 边缘节点]
    
    subgraph Phone_Docker ["Docker Containers (Host Mode)"]
        Blog[FastAPI Blog]
        Prom[Prometheus]
        Graf[Grafana]
        Alert[Alertmanager]
        Node[Node Exporter]
    end
    
    GitHub -- "Push Code" --> Actions[GitHub Actions]
    Actions -- "SSH via Tailscale" --> Phone
    Phone -- "Git Pull & Build" --> Blog
```
## 🛠 技术栈 (Tech Stack)
维度
	
技术实现
基础硬件
	
一加手机 (OnePlus 6) / 阿里云服务器 / Fedora 开发机
操作系统
	
postmarketOS (Edge Linux) / Rocky Linux 9 (容器基础)
容器技术
	
Docker / Docker Compose / Native ARM64 Build
网络层
	
Tailscale (SD-WAN) / Nginx (Reverse Proxy) / SSL (Let's Encrypt)
监控层
	
Prometheus / Grafana / Alertmanager / Node Exporter
自动化
	
GitHub Actions (CI/CD) / GitOps
 
  
 
## 🔥 核心亮点 (Project Highlights)
1. 边缘侧原地构建 (Build on Edge)

针对 x86 (云端) 与 ARM64 (边缘端) 的架构差异，通过 GitHub Actions 驱动边缘节点进行 原地构建 (Native Build)。仅传输源码，在边缘端生成适配 CPU 的原生镜像，极大提升了部署效率与兼容性。
2. 零信任网络架构 (Zero-Trust)

手机节点不暴露公网端口，仅允许来自 Tailscale 虚拟隧道的入站流量。配合宿主机级 nftables 防火墙，构建了极高的安全屏障。
3. 全链路可观测性 (Full Observability)

    业务监控：实时追踪 FastAPI 博客的访问量、QPS 及 404 状态。
    硬件监控：通过 Node Exporter 监控手机 CPU 温度、内存压力及网络 IO。
    告警闭环：实现“服务异常 -> 阈值触发 -> 邮件告警”的自动化运维闭环（基于 Alertmanager）。

## 📊 运行状态预览 (Monitoring Dashboard)

    提示：以下为系统实时运行截图。请确保仓库内包含 images/ 目录。

1. 监控系统概览 (Grafana Dashboard)

 
 
2. 监控目标状态 (Prometheus Targets)

 
 
## 📅 路线图 (Roadmap)

     
    业务从云端向边缘 ARM 节点迁移。
     
    落地全链路 Prometheus 监控与邮件告警。
     
    成功打通 GitHub Actions 自动化部署流水线。
     
    自建国内 DERP 节点优化 Tailscale 延迟。
     
    引入 Ansible 实现多节点配置自动化管理。

## 👨‍💻 关于作者

LonelyHorse - 重庆地区三本计算机专业大一学生 / DevOps 爱好者

    Blog: https://blog.lonelyhorse.top
    Monitoring: https://grafana.lonelyhorse.top

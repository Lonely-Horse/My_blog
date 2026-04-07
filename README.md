# 🐎 LonelyHorse Blog (FastAPI)

![Python Version](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Framework](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCID-GitHub_Actions-2088FF.svg)

> 基于 **FastAPI** 构建的轻量级、容器化、高可观测性的个人技术博客系统。
> 摒弃了沉重的传统 CMS 架构，采用纯文本/静态文件驱动，专注于**极致的访问性能**与**现代化的工程交付链路**。

## ✨ 核心特性

- **🚀 极速响应**：后端采用异步框架 FastAPI 深度重构（从 Flask 迁移），结合 Uvicorn 提供高并发处理能力。
- **📦 容器化交付**：完全基于 Docker 运行，屏蔽环境差异，实现“一次构建，到处运行”。
- **🔄 自动化流水线 (CI/CD)**：集成 GitHub Actions，代码 Push 后自动完成镜像构建、推送至阿里云 ACR 私有镜像库，并触发服务器无缝滚动更新。
- **👁️ 深度可观测性 (Observability)**：
  - 内置 `prometheus_fastapi_instrumentator` 中间件，自动暴露 `/metrics` 接口。
  - 针对业务逻辑进行深度埋点统计（包括：首页访问量、文章分类访问趋势、文件下载量统计）。
  - 特色设计：精准捕获并分类 404 异常请求（防高基数爆炸设计），配合外部 Alertmanager 实现业务级告警闭环。

## 🏗️ 架构与技术栈

- **后端框架**：Python 3 + FastAPI + Jinja2Templates + StaticFiles
- **部署编排**：Docker + Docker Compose
- **镜像仓库**：阿里云容器镜像服务 (ACR)
- **CI/CD**：GitHub Actions + Appleboy SSH Action
- **监控集成**：Prometheus Client

## ⚙️ 自动化发布流程 (GitOps)

本项目的上线流程已实现 100% 自动化，无需人工 SSH 登录服务器操作源码：

1. 开发者在本地完成 Markdown 文章撰写或后端代码修改。
2. 提交代码并 `git push` 到 GitHub `main` 分支。
3. **GitHub Actions** 自动触发：
   - 检出最新代码。
   - 使用 `docker buildx` 构建最新镜像。
   - 将镜像打上 `latest` 和 `github.sha` 双标签，推送至阿里云 ACR 镜像库。
   - 通过 SSH 免密登录阿里云生产服务器。
   - 服务器执行 `docker compose pull` 拉取最新镜像，并强制重建博客容器，清理悬空镜像。

## 📊 监控与指标 (Metrics)

本服务原生暴露标准的 Prometheus 指标采集端点：`http://<domain>:8000/metrics`。

**核心自定义业务指标：**
- `blog_index_views_total`: 首页总访问量
- `blog_article_views_total{article="..."}`: 单篇文章阅读量统计
- `blog_downloads_total{file="..."}`: 资源文件下载统计
- `blog_not_found_total{type="..."}`: 404 异常路由聚合分类统计（用于死链与恶意扫描告警）

*(注：本服务的外部监控大盘与告警路由规则，由独立的 [monitor 基础设施仓库] 进行 IaC 统一管理。)*

## 🛠️ 本地开发与运行

如果你想在本地启动本博客进行开发调试：

1. **克隆仓库**
   ```bash
   git clone git@github.com:your_username/My_blog.git
   cd My_blog

# Homelab Blog 架构说明

## 1.项目定位
本项目是运行在Homelab环境中的个人博客和运维知识总结库
主要的作用在于:
- 对外展示我的个人学习进度，技术博客，项目实践总结等等
- 记录本人在linux，计网，docker，监控和部署的过程中遇到各种问题
- 作为devops方向的工程化实践载体和训练场

## 2.运行环境
| 项目 | 当前情况 |
|---|---|
| 业务节点 | HP t630 |
| 系统 | debian13.4 |
| 服务运行方式 | docker和docker compose |
| 后端框架 | fastapi |
| 网页渲染 | jinja2 Templates |
| 公网入口 | aliyun server |
| 私有网络 | tailscale |
| 管理节点 | ser7 |
| 备用测试节点 | oneplus6 |

## 3.节点角色
| 节点 | 角色 | 在本项目中的职责 |
|---|---|---|
| ser7 | workstation | 负责日常开发，ansible控制，部署指和日常的维护工作 |
| t630 | 边缘业务节点 | 负责运行博客服务，相关网关服务和部分监控服务 |
| aliyun server | 公网入口节点 | 负责接收公网访问，并通过nginx和tailscale将流量转发到内网服务中 |
| oneplus6 | 备用测试节点 | 由于该设备网络不稳定和电池问题，目前只作为测试和实验节点 |

## 4.公网访问链路
```text
        用户浏览器
            |
            | https/http
            v
    aliyun server nginx
            |
            | tailscale私网转发
            v
           t630
            |
            | docker compose / 容器端口
            v
  fastapi blog container
```
### 说明
- aliyun server 作为公网入口，不挂载博客服务
- t630作为实际的业务节点，运行博客容器
- tailscale用于连接公网节点和内网边缘节点

## 5.部署链路
当前处于演进阶段

### 当前方式
早期版本通过手动git pull拉起整个服务的初始化工作

### 自动化方向
当前已经开始接入github actions，链路如下:
```text
        git tag / push
             |
             v
        github actions
             |
             | tailscale + ssh
             v
     ser7 / 自动化部署脚本
             |
             |
             v
   t630 拉取registry最新镜像
            |
            |
            v
    docker compose 重启服务     
```
### 后续计划
使用ansible完成博客服务的基础设施建设，比如基础目录，compose文件等

## 6.监控链路
博客后端通过埋点，暴露出 `/metrics`指标接口，自定义了博客首页访问量，文章访问量，项目页的访问量，以及下载次数和404数量
    当前的监控链路如下:
```text
    fastapi blog /metrics
            |
            |
            v
        prometheus
            |        |
            |        v
            |   alertmanager
            v
    grafana dashboard

```
### 现具备的指标：
- 首页访问数量
- 文章访问数量
- 项目访问数量
- 文件下载数量
- 404反馈数量

## 7.内容与数据边界
本项目将内容，配置和运行时产生的数据分开管理，git 主要管理代码和文章，配置模板和可复用文档，prometheus这类实时产生的数据，不被git和ansible管理

| 数据类型 | 当前来源 | 管理方式 | 边界说明 |
|---|---|---|---|
| posts | 本人整理后的正式博客文章 | git管理 | 可随代码一起发布 |
| notes | 日常排障和学习记录 | 当前暂时由git / 文件挂载管理 |需要单独备份，不能被ansible直接覆盖 |
| projects.json | 项目展示元数据 | git管理 | 用于项目库的页面展示骨架 |
| static/projects | 项目下载文件 | 文件形式管理 | 需要注意体积和来源 |
| prometheus 数据 | 运行时的监控数据 | 运行时状态 | 不纳入git，也不被ansible控制 |
| grafana 数据 | dashboard 和配置 | 运行时状态 | 可导出json重要的数据，可推送至仓库 |

## 8.安全边界

### 当前被允许公网访问:
- 博客首页和文章网页
- 项目展示页面
- 必要的静态资源

### 不应当被公网访问:
- "/metrics"
- prometheus 管理界面
- grafana 管理后台
- node_exporter的暴露指标
- ssh端口
- 私有registry镜像仓库
- .ssh内的私钥文件，以及环境配置等等敏感文件

## 9.当前问题
1.readme仍然保留就的架构描述，和实际架构不符合
2.ansible对于博客的初始化和部署管理尚不完善
3.dockerfile和compose仍然由工程化优化空间，比如依赖固定，健康检查，端口边界等等
4.现阶段的部署链路仍然处于手动部署到git actions和ansible自动化流水线的演进阶段

## 10.未来计划

### 短期计划：
1.更新我的README，使得与当前实际架构相符合
2.限制博客的"/metrics"指标的暴露程度
3.补齐dockerfile，compose和依赖部署
4.完善git actions的部署链路和验证问题

### 长期计划:
1.学习 traefix 并逐步完成代替部分nginx的代理配置
2.等到基础稳定后，在考虑k3s等轻量云原生实战
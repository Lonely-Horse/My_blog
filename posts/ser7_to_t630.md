# 从 ser7 到 T630：一次 Homelab 服务迁移、验收与踩坑记录

## 一、前言

最近我对自己的 Homelab 架构做了一次阶段性调整：将原本集中在 ser7 上的一部分服务迁移到 T630 上。

这次迁移涉及的服务主要包括：

* AdGuard Home
* Prometheus / Grafana
* 博客服务
* node_exporter 监控接入
* ECS 上的 Nginx Stream 和监控安全边界整理

这篇文章不是一篇纯教程，而是一次迁移实践记录。

我会主要记录：

1. 为什么要迁移；
2. 迁移前后的节点角色；
3. 实际迁移了哪些服务；
4. 迁移后如何验收；
5. 过程中踩到或意识到的坑；
6. 这次实践带来的工程经验。

我的目标不是简单地“把服务跑起来”，而是让这个 Homelab 架构逐步变得更加清晰、可维护、可监控，也更接近真实基础设施项目的管理方式。

## 二、为什么要做这次迁移

ser7 是我的主力 workstation，平时承担开发、Ansible 控制、Docker Registry 等角色。

一开始服务数量不多时，把很多东西都跑在 ser7 上确实很方便。但随着 Homelab 逐渐扩大，问题也开始出现：

1. ser7 的职责越来越杂；
2. workstation 和业务服务混在一起；
3. 开发环境、监控、DNS、博客等服务耦合在同一台机器上；
4. 后续迁移、维护和排障会越来越混乱；
5. 如果 ser7 重启或维护，会影响过多服务。

所以我开始重新思考节点角色。

ser7 作为主力 workstation，更适合承担：

* Ansible 控制端；
* Docker Registry；
* 项目开发机；
* node_exporter 被监控节点；
* 后续可能运行 GitLab、K8s 等较重的实验性服务。

而像 AdGuard Home、博客、Prometheus/Grafana 这类服务，更适合迁移到 T630 这种本地边缘节点上。

这次迁移的目标可以概括为一句话：

> 让各个节点各司其职，避免 ser7 变成什么都跑的“大杂烩节点”。

## 三、迁移后的当前节点角色

本次迁移后，我的 Homelab 节点角色大致如下。

### 1. ser7

ser7 当前主要作为控制端 and 开发端存在。

当前角色：

* Ansible 控制端；
* Docker Registry；
* 项目开发机；
* node_exporter 被监控节点。

迁移后，ser7 不再承担 AdGuard Home 主服务，也不再继续堆放过多边缘业务服务。

### 2. T630

T630 是本次迁移后的主要边缘业务节点。

当前角色：

* Prometheus / Grafana 监控端；
* AdGuard Home 运行节点；
* 博客服务运行节点；
* node_exporter 被监控节点；
* 本地边缘业务节点。

T630 接手了部分原本由 ser7 承担的服务，使 ser7 的职责更加清晰。

### 3. OnePlus 6

OnePlus 6 当前作为轻量备用节点使用。

当前角色：

* 边缘测试节点；
* AdGuard Home 备用运行节点；
* node_exporter 被监控节点。

它不是主业务节点，更多是作为备用 DNS 和轻量灾备节点存在。

### 4. Aliyun ECS

Aliyun ECS 继续作为公网入口节点。

当前角色：

* Nginx Stream 转发节点；
* 对外开放的公网入口；
* Tailscale 内网桥接节点；
* node_exporter 被监控节点。

ECS 上的 node_exporter 只对 Tailscale 内网开放，不对公网暴露 9100 端口。

除业务必须的公网入口端口外，监控和管理类端口尽量限制在 Tailscale 内网访问。

## 四、这次迁移了哪些服务

这次迁移主要包括三个部分：

1. AdGuard Home 从 ser7 迁移到 T630；
2. Prometheus / Grafana 从 ser7 迁移到 T630；
3. 博客服务迁移到 T630。

同时，我也顺手梳理了 ECS 上 node_exporter、Nginx Stream 和公网暴露边界。

### 1. AdGuard Home 迁移到 T630

AdGuard Home 原本运行在 ser7 上，迁移后由 T630 接手。

迁移完成后：

* T630 成为 AdGuard Home 当前运行节点；
* ser7 上旧的 AdGuard Home 已停止；
* T630 成为 AdGuard Home 的唯一真实数据源；
* DNS 服务已经稳定运行数日；
* 实际测试后，DNS 解析功能正常。

这里最重要的一点是：

> AdGuard Home 是一个有状态服务。

它不仅有启动配置，还包含：

* 过滤规则；
* 证书；
* 查询日志；
* 统计数据；
* session；
* 运行时数据库；
* Web UI 中产生的配置变化。

这些数据都会随着服务运行持续变化。

所以我没有选择让 Ansible 反复从 ser7 覆盖这些运行时数据到 T630，而是采用了一次性迁移方式：

1. 使用 scp 将原有服务数据迁移到 T630；
2. 在 T630 上手动拉起服务；
3. 确认服务正常；
4. 停止 ser7 上旧的 AdGuard Home；
5. 将 T630 确认为唯一真实数据源。

这个过程让我意识到：有状态服务迁移最重要的不是“容器能不能跑起来”，而是要明确数据真实源。

### 2. Prometheus / Grafana 迁移到 T630

Prometheus / Grafana 也完成了从 ser7 到 T630 的迁移。

当前 Prometheus 可以抓取以下节点的 node_exporter 指标：

* ser7；
* T630；
* OnePlus 6；
* Aliyun ECS。

Prometheus targets 页面中，各节点状态均为 UP。

监控链路主要通过 Tailscale 内网完成，node_exporter 等监控端口不直接暴露到公网。

这样设计的原因是：

1. node_exporter 会暴露大量主机指标，不适合公网开放；
2. 通过 Tailscale 可以让跨地域节点组成一个安全内网；
3. Prometheus 可以通过 Tailscale 统一抓取各节点指标；
4. 监控面和公网业务入口可以尽量隔离。

这并不代表系统“绝对安全”，但确实减少了公网暴露面，降低了被扫描和未授权访问的风险。

### 3. 博客服务迁移到 T630

博客服务也迁移到了 T630 上。

这样做之后，T630 不只是一个 DNS 节点，也开始承担更多本地边缘业务服务。

对我来说，这也有一个额外意义：

> 博客不只是记录 Homelab 的地方，它本身也成为了 Homelab 架构中的一个真实业务服务。

## 五、迁移后的验收结果

服务迁移不是“能启动”就结束了。

迁移完成后，我对几个关键点做了验收。

### 1. AdGuard Home 验收

当前已确认：

* AdGuard Home 已完成从 ser7 到 T630 的迁移；
* T630 上的 AdGuard Home 已稳定运行数日；
* DNS 解析功能测试正常；
* ser7 上旧的 AdGuard Home 已停止；
* 当前 T630 是 AdGuard Home 的唯一真实数据源。

后续还需要补充：

* dig 测试记录；
* AdGuard Home 过滤规则测试记录；
* OnePlus 6 备用 DNS 测试记录。

### 2. Prometheus / Grafana 验收

当前已确认：

* Prometheus / Grafana 已迁移到 T630；
* Prometheus 可以抓取 ser7 的 node_exporter 指标；
* Prometheus 可以抓取 T630 的 node_exporter 指标；
* Prometheus 可以抓取 OnePlus 6 的 node_exporter 指标；
* Prometheus 可以抓取 Aliyun ECS 的 node_exporter 指标；
* Prometheus targets 中各节点状态均为 UP；
* node_exporter 监控端口不对公网开放，主要通过 Tailscale 内网访问。

后续还需要补充：

* Prometheus targets 截图；
* Grafana 节点监控截图；
* 服务级可用性探测，例如 AdGuard Home 和博客服务探测。

### 3. ECS 安全边界验收

当前已确认：

* ECS 仅开放业务所需的公网入口端口；
* node_exporter 的 9100 端口不对公网开放；
* Prometheus 通过 Tailscale 抓取 ECS 指标；
* 监控和管理类端口限制在 Tailscale 内网访问；
* Nginx Stream 配置由 Ansible 模板管理；
* Nginx 配置变更采用先测试再 reload 的方式生效。

ECS 作为公网入口节点，安全边界非常重要。

尤其是 node_exporter 这类组件，绝对不应该直接暴露到公网。

当前的设计是：

> 公网入口由 ECS 承担；
> 监控和管理通信通过 Tailscale 完成；
> node_exporter 不暴露公网；
> Nginx 配置变更先 `nginx -t`，再 reload。

这比简单地把端口全开在公网要安全得多。

## 六、这次迁移中的几个坑和思考

这次迁移过程中，真正有价值的并不是某一条命令怎么写，而是几个工程判断上的变化。

### 1. 坑一：ser7 不应该什么都跑

一开始，我很容易把 ser7 当成万能节点。

因为它性能更强、用起来方便，所以很多服务都会自然地堆到 ser7 上。

但这样时间久了会产生问题：

* 开发环境和业务服务混杂；
* 节点职责不清晰；
* 后续排障时很难判断哪个服务影响了哪个服务；
* ser7 一维护，很多服务都会受影响。

这次迁移后，我更加明确了 ser7 的定位：

> ser7 应该更像控制端和开发端，而不是所有业务服务的集中运行点。

### 2. 坑二：有状态服务不能盲目 Ansible 化

我之前很容易有一种想法：

既然我要做基础设施即代码，那是不是所有东西都应该交给 Ansible 管？

这次迁移 AdGuard Home 后，我意识到这个想法并不完全正确。

AdGuard Home 这类服务有很多运行时状态：

* querylog；
* stats；
* session；
* 过滤规则；
* 运行时数据库；
* Web UI 修改产生的配置变化。

如果迁移完成后，还继续用 Ansible 从 ser7 覆盖 T630 上的运行数据，就可能导致：

* 查询日志回滚；
* 统计数据丢失；
* 过滤规则被旧版本覆盖；
* Web UI 修改失效；
* 新旧数据源混乱。

所以最终我选择：

1. 一次性迁移数据；
2. T630 成为唯一真实源；
3. Ansible 不反复覆盖 AdGuard Home 运行时数据；
4. Ansible 只管理外围部署逻辑。

这次实践让我更清楚地认识到：

> 自动化不是把所有东西都强行纳入 Ansible。
> 自动化的前提是先判断清楚边界。

### 3. 坑三：迁移完成后必须明确唯一真实源

服务迁移最怕出现一种情况：

* 旧服务还在跑；
* 新服务也在跑；
* 两边都在产生数据；
* 最后不知道谁才是准的。

这次迁移 AdGuard Home 时，我明确做了几件事：

* 数据从 ser7 迁移到 T630；
* T630 拉起服务并验证；
* ser7 旧服务停止；
* 后续以 T630 数据为准。

这样可以避免“双主”和“状态分裂”。

这也是我这次最大的收获之一：

> 有状态服务迁移时，必须明确唯一真实源。

### 4. 坑四：node_exporter 不能暴露公网

node_exporter 是非常常见的监控组件，但它暴露的是主机指标。

这些指标虽然不是密码，但包含很多基础设施信息，例如：

* CPU；
* 内存；
* 磁盘；
* 文件系统；
* 网络；
* 系统负载；
* 运行状态。

如果直接把 9100 暴露到公网，很容易被扫描，也会泄露很多主机信息。

所以我在 ECS 上将 node_exporter 限制在 Tailscale 内网访问。

Prometheus 通过 Tailscale 抓取指标，而不是通过公网访问 9100。

这个设计在个人 Homelab 里非常实用。

### 5. 坑五：Nginx 配置不能直接粗暴重启

ECS 上的 Nginx Stream 配置由 Ansible 管理。

这里我采用的方式是：

1. Ansible 下发配置；
2. 执行 `nginx -t`；
3. 配置测试通过后再 reload。

而不是配置一改就直接 restart。

这样做的好处是：

* 可以提前发现配置错误；
* 避免错误配置导致入口服务中断；
* reload 比 restart 对现有连接影响更小；
* 变更过程更安全。

这个细节虽然不复杂，但非常重要。

### 6. 坑六：Tailscale 很方便，但网络路径仍需要关注

这次架构里，Tailscale 承担了很重要的作用：

* 内部通信；
* 管理面访问；
* Prometheus 抓取指标；
* 跨地域节点连接。

但目前我还没有自建中继节点，所以部分场景下网络路径和速度可能会受到影响。

后续如果对稳定性和延迟有更高要求，可以考虑建设自建节点，进一步优化访问体验。

## 七、这次迁移带来的收获

这次迁移让我对 Homelab 的理解更进了一步。

以前我更多关注：

* 服务能不能跑；
* 配置能不能生效；
* 容器能不能启动。

现在我开始更多关注：

* 节点职责是否清晰；
* 服务迁移后如何验收；
* 数据真实源是否明确；
* 端口是否暴露过多；
* Ansible 该管什么，不该管什么；
* 出现问题后如何回滚和排查；
* 这些实践能不能沉淀成文档。

这对我来说是一个很重要的变化。

因为真正有价值的 Homelab，不应该只是“装过很多软件”。

更重要的是：

* 我能解释为什么这样设计；
* 我知道哪些东西该自动化，哪些不该；
* 我遇到过真实的迁移、监控、安全和状态数据问题；
* 我能把实践转化成文档、复盘和可展示的项目经验。

## 八、当前结论

本次 ser7 到 T630 的服务迁移已经完成主要目标。

当前结果如下：

* T630 接手了部分原本由 ser7 承担的业务服务；
* AdGuard Home 已迁移到 T630，并稳定运行；
* Prometheus / Grafana 已迁移到 T630；
* 博客服务已运行在 T630；
* ser7 旧 AdGuard Home 已停止；
* Prometheus 可以正常抓取多个节点的 node_exporter 指标；
* ECS 上的 node_exporter 不对公网开放；
* 节点之间的监控和管理通信主要通过 Tailscale 完成；
* AdGuard Home 迁移后以 T630 为唯一真实数据源；
* Nginx Stream 配置由 Ansible 管理，并采用检查后 reload 的方式降低风险；
* 本次迁移进一步明确了 Ansible 与有状态服务运行数据之间的边界。

整体来看，这次迁移让我的 Homelab 从“服务能跑”向“角色清晰、边界明确、可监控、可维护”迈进了一步。

## 九、后续计划

后续我准备继续补充和完善以下内容：

1. 补充 dig 测试记录；
2. 补充 AdGuard Home 过滤规则测试记录；
3. 补充 OnePlus 6 备用 DNS 测试记录；
4. 补充 Prometheus targets 截图；
5. 补充 Grafana 节点监控截图；
6. 补充当前 Homelab 架构图；
7. 补充 ECS 公网端口检查记录；
8. 将本次迁移整理为 Markdown 文档，放入 GitHub 仓库；
9. 后续继续完善 Traefik、服务级监控和 CI/CD 流程。

这次迁移只是 Homelab 长期建设中的一个阶段。

后续我希望继续围绕 Ansible、Docker、Prometheus、Tailscale、Go 和云原生方向，把这个 Homelab 打磨成一个可维护、可复现、可展示的长期工程项目。

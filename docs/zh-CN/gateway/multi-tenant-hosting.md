---
doc-schema-version: 1
read_when:
    - 你正在为多个用户或组织托管 OpenClaw
    - 你需要为租户工作负载选择隔离边界
summary: 将多个租户信任域托管为每个租户一个相互隔离的 OpenClaw Gateway 网关单元
title: 多租户托管
x-i18n:
    generated_at: "2026-07-16T11:37:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# 多租户托管

OpenClaw 的默认安全模型是每个 Gateway 网关对应一个可信操作员边界，而不是在一个共享 Gateway 网关内部实现针对不可信方的多租户隔离。因此，托管不共享同一信任边界的用户或组织时，需要为每个租户运行一个独立且完整的 OpenClaw 实例。

`openclaw fleet` 将每个隔离实例称为一个**单元**。一个单元是在加固容器中运行的完整 Gateway 网关，拥有自己的状态、凭据、工作区、渠道账户、令牌以及仅限回环访问的主机端口。

Fleet 目前处于**实验阶段**：其命令、标志和容器配置文件可能在不同版本之间发生变化，且不提供弃用过渡期。

Fleet 已在 Linux 和 macOS 主机上进行测试。目前尚未测试 Windows 主机。

## 为什么每个租户都需要一个单元

一个 Gateway 网关内经过身份验证的操作员具有可信控制平面角色。会话 ID 用于选择路由，并不负责一个租户相对于另一个租户的授权。Agent 沙箱隔离可以减轻不可信内容和工具执行所造成的影响，但无法将一个共享 Gateway 网关转变为租户授权边界。

每个租户使用一个单元，使每个信任域都有独立的 Gateway 网关进程、容器、持久状态树和 Gateway 网关凭据。这遵循 [Gateway 网关安全模型](/zh-CN/gateway/security)：不要将互不信任的用户共同部署在同一个 OpenClaw 进程或同一个操作系统用户中。

## 架构

Fleet CLI 是主机端生命周期监督器。它在 OpenClaw 状态数据库中记录单元，并请求本地 Docker 或 Podman 运行时创建、检查、启动、停止、替换和移除其容器。不支持远程运行时端点，因为 Fleet 的绑定路径和回环 URL 属于本地主机。Fleet 不代理租户消息，也不会在单元之间添加共享的应用层数据路径。

每个单元都在自己的用户定义桥接网络上运行官方 `ghcr.io/openclaw/openclaw` 镜像。独立的桥接网络可以阻止单元之间通过容器 IP 直接通信，同时保留提供商和渠道所需的出站 NAT 访问。默认不限制出站流量。Podman 单元可以使用 `--network internal` 阻止出站流量，同时保留已发布的回环 Gateway 网关端口。Docker 内部网络会导致该已发布端口失效，因此 Fleet 会拒绝这种组合；请改用主机防火墙规则（例如 `DOCKER-USER` 链）实施 Docker 出站策略。单元的 Gateway 网关在容器内监听端口 `18789`，而运行时仅将其发布到主机上的 `127.0.0.1:<allocated-port>`。需要远程访问时，操作员可以在该回环端点前部署经过批准的反向代理、SSH 隧道或 tailnet。

持久化 Gateway 网关状态来自 `<state-dir>/fleet/cells/<tenant>/`，并挂载到 `/home/node/.openclaw`。身份验证配置文件加密密钥来自单独的 `<state-dir>/fleet/auth-profile-secrets/<tenant>/` 主机路径，并挂载到 `/home/node/.config/openclaw`，与官方 [Docker 持久化布局](/zh-CN/install/docker#storage-and-persistence)一致。该密钥不嵌套在普通状态挂载目录之下。每个租户的渠道账户在所属单元内终止；Fleet 不提供共享渠道账户或入站消息路由器。

官方镜像默认使用 UID 为 1000 的非 root 用户 `node`。Fleet 使用与主机兼容的用户映射，以确保私有绑定挂载保持可写：Podman 使用 `keep-id`，以 root 模式运行的 Docker 使用发起调用的非 root 身份，而无 root Docker 将容器 root 映射到无特权的守护进程用户。主机启用 SELinux 时，Docker 和 Podman 会应用私有 `:Z` 重新标记。该容器配置文件避免使用具有特权的主机功能，并适合无 root 运行；但无 root 运行是主机运行时的选择和先决条件，Fleet 不会自动启用它。

## 信任边界

多租户机制用于保护租户免受其他租户影响。每个租户都信任 Fleet 操作员和主机。抵御主机失陷不属于设计目标。

这意味着主机管理员可以检查容器配置和环境、读取已挂载的单元数据、替换镜像或进入容器。管理员可以通过 Docker 或 Podman 检查功能查看 Gateway 网关令牌以及通过 `--env` 传递的值。因此，请相应地使用主机控制措施、管理访问策略、监控、备份和经过批准的机密管理器。

该基线可以防止意外的通配符网络暴露，并移除常见的容器提权原语，但无法使不可信主机变得安全。

## 隔离级别

请选择与所托管租户相匹配的边界：

1. **加固容器基线。** Fleet 会移除所有 Linux capabilities、启用 `no-new-privileges`、应用 PID、内存、CPU 以及可选的可写层磁盘限制，使用独立的持久挂载和每单元网络，并且仅发布到主机回环接口。桥接网络默认不限制出站流量；当单元不得发起出站连接时，请使用 Podman `--network internal` 或 Docker 主机防火墙策略。这是适用于信任操作员和主机的租户的默认配置。
2. **更强的容器或虚拟机隔离。** 对于风险较高的工作负载，请配置 Docker 或 Podman 使用更强的 OCI 隔离运行时（例如 gVisor 或 Kata Containers），或将单元放入微型虚拟机。这属于运行时或基础设施配置；Fleet 的 `--runtime docker|podman` 选项用于选择容器 CLI，而不是 OCI 隔离后端。请参阅 Docker 的[替代容器运行时](https://docs.docker.com/engine/daemon/alternative-runtimes/)和 [Docker 虚拟机运行时指南](/zh-CN/install/docker-vm-runtime)。
3. **为敌对租户使用独立机器。** 不要将互为敌对方的租户共同部署在同一个 OpenClaw 进程或操作系统用户中。如果租户不信任同一个主机操作员，或需要更强的管理边界，请使用具有独立运行时管理的不同虚拟机或物理主机。

此隔离级别体系中的任何一级都不会改变 OpenClaw 应用程序的信任模型：一个 Gateway 网关仍然对应一个可信操作员域。

## 快速开始

创建一个单元。该命令只会输出一次生成的 Gateway 网关令牌，因此请立即妥善保存：

```bash
openclaw fleet create acme
```

在 Fleet 主机上打开所报告的 `http://127.0.0.1:<port>` URL，使用该租户的令牌进行身份验证，然后在单元内配置提供商凭据和渠道账户。

检查容器状态和 Gateway 网关存活情况：

```bash
openclaw fleet status acme
```

升级时保留主机端口、挂载数据、资源配置、用户提供的环境和 Gateway 网关令牌：

```bash
openclaw fleet upgrade acme
```

移除容器和注册表行，同时保留租户数据：

```bash
openclaw fleet rm acme --force
```

如果还要删除租户的持久数据，请添加 `--purge-data`。清除操作需要 `--force`，不可撤销，并且会在删除任何内容之前执行解析路径包含关系检查：

```bash
openclaw fleet rm acme --purge-data --force
```

有关所有命令和选项，请参阅 [`openclaw fleet` CLI 参考](/zh-CN/cli/fleet)。

## 当前范围

Fleet 不提供以下功能：

- 共享渠道账户或共享入口路由器
- 使用精简的每租户主机进程，而不是完整的 OpenClaw 实例
- 由一个监督器管理的远程单元主机
- 租户自助服务门户、计费平面或委托管理 UI

这些功能需要明确的身份、路由、授权和故障域契约。不要尝试通过跨租户共享一个 Gateway 网关或其凭据来近似实现这些功能。Fleet 是单主机生命周期监督器；跨机器且由身份治理的 Fleet 需要单独的控制平面层。

## 相关内容

- [`openclaw fleet`](/zh-CN/cli/fleet)
- [Gateway 网关安全](/zh-CN/gateway/security)
- [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)
- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)

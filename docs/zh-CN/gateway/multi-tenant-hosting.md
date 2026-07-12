---
read_when:
    - 你正在为多个用户或组织托管 OpenClaw
    - 你需要为租户工作负载选择隔离边界
summary: 将多个租户信任域托管为每个租户一个隔离的 OpenClaw Gateway 网关单元
title: 多租户托管
x-i18n:
    generated_at: "2026-07-12T14:31:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ffb873c7b9e7e463d932ad35eb009c34218447a051ac065c151ba57dc71b799
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# 多租户托管

OpenClaw 的默认安全模型是每个 Gateway 网关对应一个受信任的操作员边界，而不是在一个共享 Gateway 网关内实现对抗性多租户隔离。因此，若托管的用户或组织不共享同一信任边界，就需要为每个租户运行一个单独且完整的 OpenClaw 实例。

`openclaw fleet` 将每个隔离实例称为 **cell**。cell 是在加固容器中运行的完整 Gateway 网关，拥有自己的状态、凭据、工作区、渠道账号、令牌以及仅限 local loopback 的主机端口。

Fleet 目前为**实验性功能**：在此功能趋于稳定前，其命令、标志和容器配置可能在不同版本之间发生变化，且不会提供弃用过渡期。

Fleet 已在 Linux 和 macOS 主机上测试。目前尚未在 Windows 主机上测试。

## 为什么每个租户都需要一个 cell

一个 Gateway 网关内经过身份验证的操作员拥有受信任的控制平面角色。会话 ID 用于选择路由，并不用于授权一个租户访问另一个租户。Agent 沙箱隔离可以降低不受信任内容和工具执行所造成的影响，但无法将一个共享 Gateway 网关转变为租户授权边界。

为每个租户使用一个 cell，使每个信任域都有独立的 Gateway 网关进程、容器、持久化状态树和 Gateway 网关凭据。这符合 [Gateway 网关安全模型](/zh-CN/gateway/security)：不要将相互不信任的用户置于同一个 OpenClaw 进程或同一个操作系统用户下。

## 架构

Fleet CLI 是主机端的生命周期监督程序。它将 cell 记录在 OpenClaw 状态数据库中，并请求本地 Docker 或 Podman 运行时创建、检查、启动、停止、替换和移除其容器。Fleet 会拒绝远程运行时端点，因为其绑定路径和 local loopback URL 属于本地主机；在远程 cell 主机具备明确的存储和端点契约之前，该功能将暂缓实现。Fleet 不代理租户消息，也不会在 cell 之间添加共享的应用层数据路径。

每个 cell 都在自己的用户定义桥接网络上运行官方 `ghcr.io/openclaw/openclaw` 镜像。独立的桥接网络可防止 cell 之间通过容器 IP 直接通信，同时保留提供商和渠道所需的出站 NAT 访问。默认不限制出站流量。Podman cell 可以使用 `--network internal` 阻止出站流量，同时保留已发布的 local loopback Gateway 网关端口。Docker 内部网络会导致该已发布端口失效，因此 Fleet 会拒绝这种组合；应改用主机防火墙规则（例如 `DOCKER-USER` 链）实施 Docker 出站策略。cell 的 Gateway 网关在容器内监听端口 `18789`，而运行时仅将其发布到主机上的 `127.0.0.1:<allocated-port>`。需要远程访问时，操作员可以在该 local loopback 端点前配置经过批准的反向代理、SSH 隧道或 tailnet。

持久化 Gateway 网关状态来自 `<state-dir>/fleet/cells/<tenant>/`，并挂载到 `/home/node/.openclaw`。身份验证配置文件的加密密钥来自单独的主机路径 `<state-dir>/fleet/auth-profile-secrets/<tenant>/`，并挂载到 `/home/node/.config/openclaw`，与官方 [Docker 持久化布局](/zh-CN/install/docker#storage-and-persistence)一致。该密钥不嵌套在常规状态挂载目录下。每个租户的渠道账号均在其所属 cell 内终止连接，因此 Fleet MVP 中不存在共享渠道账号或共享入站消息路由器。

官方镜像默认使用 UID 为 1000 的非 root 用户 `node`。Fleet 使用与主机兼容的用户映射，确保私有绑定挂载保持可写：Podman 使用 `keep-id`，以 root 模式运行的 Docker 使用发起调用的非 root 用户身份，而无 root 模式的 Docker 则将容器 root 映射到无特权的守护进程用户。当主机启用 SELinux 时，Docker 和 Podman 会应用私有 `:Z` 重新标记。该容器配置不使用特权主机功能，并且对无 root 模式友好；但无 root 运行是主机运行时的选择和前提条件，并非 Fleet 自动启用的功能。

## 信任边界

多租户机制用于保护租户免受其他租户影响。每个租户都信任 Fleet 操作员和主机。抵御主机被攻陷不属于设计目标。

这意味着主机管理员可以检查容器配置和环境、读取挂载的 cell 数据、替换镜像或进入容器。管理员可以通过 Docker 或 Podman 检查查看 Gateway 网关令牌以及通过 `--env` 传递的值。因此，请相应使用主机控制措施、管理访问策略、监控、备份和经过批准的密钥管理器。

基线配置可防止意外暴露通配网络，并移除常见的容器提权机制，但无法使不受信任的主机变得安全。

## 隔离层级

选择与所托管租户相匹配的边界：

1. **加固容器基线。** Fleet 会移除所有 Linux 权能、启用 `no-new-privileges`、应用 PID、内存、CPU 和可选的可写层磁盘限制，使用独立的持久化挂载和每 cell 网络，并且仅发布到主机 local loopback。桥接网络不会限制出站流量；当 cell 不得主动发起出站连接时，请使用 Podman `--network internal` 或 Docker 主机防火墙策略。这是适用于信任操作员和主机的租户的 MVP 配置。
2. **更强的容器或虚拟机隔离。** 对于风险较高的工作负载，请配置 Docker 或 Podman 使用更强的 OCI 隔离运行时，例如 gVisor 或 Kata Containers；也可以将 cell 放入 microVM。这属于运行时或基础设施配置；Fleet 的 `--runtime docker|podman` 选项选择的是容器 CLI，而不是 OCI 隔离后端。请参阅 Docker 的[替代容器运行时](https://docs.docker.com/engine/daemon/alternative-runtimes/)和 [Docker VM 运行时指南](/zh-CN/install/docker-vm-runtime)。
3. **为对抗性租户使用独立机器。** 不要将相互敌对的租户置于同一个 OpenClaw 进程或操作系统用户下。当租户不信任同一主机操作员，或需要更强的管理边界时，请使用具有独立运行时管理的不同虚拟机或物理主机。

此层级中的任何一级都不会改变 OpenClaw 应用程序的信任模型：一个 Gateway 网关始终对应一个受信任的操作员域。

## 快速开始

创建一个 cell。该命令只会输出一次生成的 Gateway 网关令牌，因此请立即保存：

```bash
openclaw fleet create acme
```

在 Fleet 主机上打开所报告的 `http://127.0.0.1:<port>` URL，使用该租户的令牌进行身份验证，然后在 cell 内配置提供商凭据和渠道账号。

检查容器状态和 Gateway 网关存活情况：

```bash
openclaw fleet status acme
```

升级时保留主机端口、挂载数据、资源配置、用户提供的环境和 Gateway 网关令牌：

```bash
openclaw fleet upgrade acme
```

移除容器和注册表记录，同时保留租户数据：

```bash
openclaw fleet rm acme --force
```

如需同时删除持久化租户数据，请添加 `--purge-data`。清除操作要求使用 `--force`，且不可撤销；在删除任何内容之前，它会执行解析后路径的包含关系检查：

```bash
openclaw fleet rm acme --purge-data --force
```

有关所有命令和选项，请参阅 [`openclaw fleet` CLI 参考](/cli/fleet)。

## MVP 暂缓实现的功能

首个 Fleet 版本有意将以下功能留待后续设计：

- 共享渠道账号或共享入口路由器
- 使用精简的每租户主机进程，而不是完整的 OpenClaw 实例
- 由一个监督程序管理远程 cell 主机
- 租户自助服务门户、计费平面或委托管理 UI

这些功能需要明确的身份、路由、授权和故障域契约。不应通过在租户间共享同一个 Gateway 网关或其凭据来近似实现这些功能。它们也不属于 Fleet 的职责范围：Fleet 始终作为单主机生命周期监督程序，而多机器、由身份治理的 fleet 应由其上层的专用控制平面层负责。

## 相关内容

- [`openclaw fleet`](/cli/fleet)
- [Gateway 网关安全](/zh-CN/gateway/security)
- [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)
- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)

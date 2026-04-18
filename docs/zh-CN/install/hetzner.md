---
read_when:
    - 你希望 OpenClaw 在云 VPS 上 24/7 运行（而不是在你的笔记本电脑上）
    - 你希望在你自己的 VPS 上部署一个生产级、始终在线的 Gateway 网关
    - 你希望完全掌控持久化、二进制文件和重启行为
    - 你正在 Hetzner 或类似提供商上通过 Docker 运行 OpenClaw
summary: 在便宜的 Hetzner VPS 上以 24/7 方式运行 OpenClaw Gateway 网关（Docker），并具备持久化状态和内置二进制文件
title: Hetzner
x-i18n:
    generated_at: "2026-04-18T17:30:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# Hetzner 上的 OpenClaw（Docker，生产 VPS 指南）

## 目标

在 Hetzner VPS 上使用 Docker 运行一个持久化的 OpenClaw Gateway 网关，并具备持久化状态、内置二进制文件以及安全的重启行为。

如果你想要“每月约 5 美元即可 24/7 运行 OpenClaw”，这是最简单且可靠的配置方式。
Hetzner 的价格可能会变化；请选择最小规格的 Debian/Ubuntu VPS，如果遇到 OOM 再向上扩容。

安全模型提醒：

- 当所有人都处于同一信任边界内，且运行时仅用于业务用途时，公司共享的智能体是可以接受的。
- 保持严格隔离：专用 VPS/运行时 + 专用账号；不要在该主机上使用个人 Apple/Google/浏览器/密码管理器配置文件。
- 如果用户彼此之间具有对抗性，请按 Gateway 网关/主机/OS 用户进行隔离。

请参阅 [Security](/zh-CN/gateway/security) 和 [VPS hosting](/zh-CN/vps)。

## 我们在做什么（简单来说）？

- 租用一台小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启/重建后仍然保留）
- 通过 SSH 隧道从你的笔记本电脑访问 Control UI

挂载的 `~/.openclaw` 状态包括 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json` 以及 `.env`。

访问 Gateway 网关的方式包括：

- 从你的笔记本电脑通过 SSH 端口转发访问
- 如果你能自行管理防火墙和令牌，也可以直接暴露端口

本指南假设你在 Hetzner 上使用 Ubuntu 或 Debian。  
如果你使用的是其他 Linux VPS，请相应调整软件包。
关于通用 Docker 流程，请参阅 [Docker](/zh-CN/install/docker)。

---

## 快速路径（适合有经验的运维人员）

1. 创建 Hetzner VPS
2. 安装 Docker
3. 克隆 OpenClaw 仓库
4. 创建持久化主机目录
5. 配置 `.env` 和 `docker-compose.yml`
6. 将所需二进制文件烘焙进镜像
7. `docker compose up -d`
8. 验证持久化和 Gateway 网关访问

---

## 你需要准备

- 具有 root 访问权限的 Hetzner VPS
- 从你的笔记本电脑进行 SSH 访问
- 对 SSH + 复制粘贴有基本熟悉程度
- 约 20 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选的提供商凭据
  - WhatsApp 二维码
  - Telegram 机器人令牌
  - Gmail OAuth

---

<Steps>
  <Step title="创建 VPS">
    在 Hetzner 中创建一个 Ubuntu 或 Debian VPS。

    以 root 身份连接：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    本指南假设该 VPS 是有状态的。
    不要将其视为一次性基础设施。

  </Step>

  <Step title="安装 Docker（在 VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    验证：

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="克隆 OpenClaw 仓库">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    本指南假设你将构建一个自定义镜像，以确保二进制文件可持久保留。

  </Step>

  <Step title="创建持久化主机目录">
    Docker 容器是临时性的。
    所有长期状态都必须存放在主机上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # 将所有权设置为容器用户（uid 1000）：
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    除非你明确希望通过 `.env` 来管理它，否则请将 `OPENCLAW_GATEWAY_TOKEN` 留空；OpenClaw 会在首次启动时将一个随机 Gateway 网关令牌写入配置。
    生成一个 keyring 密码并将其粘贴到
    `GOG_KEYRING_PASSWORD`：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交这个文件。**

    这个 `.env` 文件用于容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。
    存储的提供商 OAuth/API 密钥认证位于挂载的
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中。

  </Step>

  <Step title="Docker Compose 配置">
    创建或更新 `docker-compose.yml`。

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # 建议：让 Gateway 网关在 VPS 上仅监听 loopback；通过 SSH 隧道访问。
          # 如果你要将其公开暴露，请移除 `127.0.0.1:` 前缀，并相应配置防火墙。
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` 仅用于引导阶段的便捷启动，并不能替代正确的 Gateway 网关配置。你仍然需要设置认证（`gateway.auth.token` 或密码），并为你的部署使用安全的绑定设置。

  </Step>

  <Step title="共享 Docker VM 运行时步骤">
    对于通用 Docker 主机流程，请使用共享运行时指南：

    - [将所需二进制文件烘焙进镜像](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [哪些内容会持久化到哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 专用访问方式">
    完成共享的构建和启动步骤后，从你的笔记本电脑建立隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    打开：

    `http://127.0.0.1:18789/`

    粘贴你配置的共享密钥。本指南默认使用 gateway token；
    如果你改用了密码认证，请改为使用那个密码。

  </Step>
</Steps>

共享的持久化映射位于 [Docker VM Runtime](/zh-CN/install/docker-vm-runtime#what-persists-where)。

## 基础设施即代码（Terraform）

对于偏好基础设施即代码工作流的团队，一个由社区维护的 Terraform 配置提供了：

- 带远程状态管理的模块化 Terraform 配置
- 通过 cloud-init 实现自动化部署
- 部署脚本（bootstrap、deploy、backup/restore）
- 安全加固（防火墙、UFW、仅限 SSH 访问）
- 用于 Gateway 网关访问的 SSH 隧道配置

**仓库：**

- 基础设施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 配置：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

这种方式在上述 Docker 配置基础上，补充了可复现部署、版本控制的基础设施，以及自动化灾难恢复能力。

> **注意：** 由社区维护。如有问题或希望贡献，请参阅上述仓库链接。

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway configuration](/zh-CN/gateway/configuration)
- 保持 OpenClaw 为最新版本：[Updating](/zh-CN/install/updating)

---
read_when:
    - 你希望 OpenClaw 在云 VPS 上 24/7 运行（而不是你的笔记本电脑）
    - 你想在自己的 VPS 上运行生产级、始终在线的 Gateway 网关
    - 你想完全控制持久化、二进制文件和重启行为
    - 你正在 Hetzner 或类似提供商上的 Docker 中运行 OpenClaw
summary: 在廉价的 Hetzner VPS（Docker）上全天候运行 OpenClaw Gateway 网关，并使用持久状态和内置二进制文件
title: Hetzner
x-i18n:
    generated_at: "2026-07-05T11:24:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

在 Hetzner VPS 上使用 Docker 运行持久化 OpenClaw Gateway 网关，并具备持久状态、内置二进制文件和安全重启行为。

Hetzner 定价会变化；选择满足需求的最小 Debian/Ubuntu VPS，如果遇到 OOM 再扩容。

可以通过从你的笔记本进行 SSH 端口转发来访问 Gateway 网关，也可以在你自行管理防火墙和令牌时直接暴露端口。

安全模型提醒：

- 公司共享的智能体可以使用，前提是所有人都在同一信任边界内，并且运行时仅用于业务。
- 保持严格隔离：专用 VPS/运行时 + 专用账号；不要在该主机上使用个人 Apple/Google/浏览器/密码管理器配置文件。
- 如果用户彼此对抗，请按 Gateway 网关/主机/OS 用户进行拆分。

参见 [Security](/zh-CN/gateway/security) 和 [VPS 托管](/zh-CN/vps)。

本指南假设你在 Hetzner 上使用 Ubuntu 或 Debian。在其他 Linux VPS 上，请相应映射软件包。通用 Docker 流程请参见 [Docker](/zh-CN/install/docker)。

## 你需要准备

- 具有 root 访问权限的 Hetzner VPS
- 从你的笔记本进行 SSH 访问
- Docker 和 Docker Compose
- 模型认证凭据
- 可选的提供商凭据（WhatsApp 二维码、Telegram bot token、Gmail OAuth）
- 约 20 分钟

## 快速路径

1. 配置 Hetzner VPS
2. 安装 Docker
3. 克隆 OpenClaw 仓库
4. 创建持久化主机目录
5. 配置 `.env` 和 `docker-compose.yml`
6. 将所需二进制文件内置到镜像中
7. `docker compose up -d`
8. 验证持久化和 Gateway 网关访问

<Steps>
  <Step title="配置 VPS">
    在 Hetzner 中创建 Ubuntu 或 Debian VPS，然后以 root 身份连接：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    将 VPS 视为有状态基础设施，而不是一次性基础设施。

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

    本指南会构建自定义镜像，因此你内置的任何二进制文件都能在重启后保留。

  </Step>

  <Step title="创建持久化主机目录">
    Docker 容器是临时的；所有长期状态都必须存放在主机上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`：

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

    设置 `OPENCLAW_GATEWAY_TOKEN`，以便通过 `.env` 管理稳定的 Gateway 网关令牌；否则，在依赖客户端跨重启使用之前，请配置 `gateway.auth.token`。如果两者都未设置，OpenClaw 会为该次启动使用仅运行时有效的令牌。为 `GOG_KEYRING_PASSWORD` 生成 keyring 密码：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。** 它保存容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。已存储的提供商 OAuth/API key 认证位于挂载的 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中。

  </Step>

  <Step title="Docker Compose 配置">
    创建或更新 `docker-compose.yml`：

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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
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

    `--allow-unconfigured` 仅用于方便引导启动，不能替代真实的 Gateway 网关配置。仍需为你的部署设置认证（`gateway.auth.token` 或密码）以及安全的绑定模式。

  </Step>

  <Step title="共享 Docker VM 运行时步骤">
    按共享运行时指南完成通用 Docker 主机流程：

    - [将所需二进制文件内置到镜像中](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [持久化内容的位置](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 专用访问">
    完成共享构建和启动步骤后，打开隧道。

    **先决条件：** 确保你的 VPS sshd 配置允许 TCP 转发。如果你加固过 SSH 配置，请检查 `/etc/ssh/sshd_config` 并设置：

    ```text
    AllowTcpForwarding local
    ```

    `local` 允许从你的笔记本使用 `ssh -L` 进行本地转发，同时阻止来自服务器的远程转发。将其设置为 `no` 会使隧道失败，并显示：
    `channel 3: open failed: administratively prohibited: open failed`

    确认已启用 TCP 转发后，重启 SSH 服务（`systemctl restart ssh`），并从你的笔记本运行隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    打开 `http://127.0.0.1:18789/` 并粘贴配置的共享密钥。本指南默认使用 Gateway 网关令牌；如果你切换到了密码认证，请改用你配置的密码。

  </Step>
</Steps>

共享持久化映射位于 [Docker VM 运行时](/zh-CN/install/docker-vm-runtime#what-persists-where)。

## 基础设施即代码（Terraform）

对于偏好基础设施即代码工作流的团队，社区维护的 Terraform 设置提供：

- 带远程状态管理的模块化 Terraform 配置
- 通过 cloud-init 自动预配
- 部署脚本（bootstrap、deploy、backup/restore）
- 安全加固（防火墙、UFW、仅 SSH 访问）
- 用于 Gateway 网关访问的 SSH 隧道配置

**仓库：**

- 基础设施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 配置：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

这种方式在上面的 Docker 设置基础上补充了可复现部署、版本控制的基础设施和自动化灾难恢复。

<Note>
由社区维护。如需报告问题或贡献，请参见上面的仓库链接。
</Note>

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)
- 让 OpenClaw 保持最新：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Fly.io](/zh-CN/install/fly)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)

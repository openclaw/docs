---
read_when:
    - 你希望 OpenClaw 在云 VPS 上 24/7 运行（而不是在你的笔记本电脑上）
    - 你希望在自己的 VPS 上运行生产级、始终在线的 Gateway 网关
    - 你希望完全控制持久化、二进制文件和重启行为
    - 你正在 Hetzner 或类似提供商上通过 Docker 运行 OpenClaw
summary: 在廉价 Hetzner VPS（Docker）上 24/7 运行 OpenClaw Gateway 网关，具备持久状态和内置二进制文件
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T16:12:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6102649b381b3b1ecd6f52e1cf518fc36147fe143ebc8fd4be5f44ab26cb3b4d
    source_path: install/hetzner.md
    workflow: 16
---

## 目标

使用 Docker 在 Hetzner VPS 上运行一个持久化的 OpenClaw Gateway 网关，并具备持久状态、内置二进制文件和安全的重启行为。

如果你想要“每月约 5 美元的 OpenClaw 24/7”，这是最简单可靠的设置方式。
Hetzner 定价会变化；选择最小的 Debian/Ubuntu VPS，如果遇到 OOM，再向上扩容。

安全模型提醒：

- 当所有人都在同一信任边界内，且运行时仅用于业务时，公司共享的智能体没有问题。
- 保持严格隔离：专用 VPS/运行时 + 专用账号；不要在该主机上使用个人 Apple/Google/浏览器/密码管理器配置文件。
- 如果用户之间互不信任，请按 Gateway 网关/主机/OS 用户拆分。

请参阅[安全](/zh-CN/gateway/security)和 [VPS 托管](/zh-CN/vps)。

## 我们在做什么（简单来说）？

- 租用一台小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启/重建后仍保留）
- 通过 SSH 隧道从你的笔记本电脑访问控制 UI

挂载的 `~/.openclaw` 状态包含 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json` 以及 `.env`。

可以通过以下方式访问 Gateway 网关：

- 从你的笔记本电脑进行 SSH 端口转发
- 如果你自行管理防火墙和令牌，也可以直接暴露端口

本指南假设 Hetzner 上运行的是 Ubuntu 或 Debian。  
如果你使用的是其他 Linux VPS，请相应映射软件包。
通用 Docker 流程请参阅 [Docker](/zh-CN/install/docker)。

---

## 快速路径（有经验的运维人员）

1. 预置 Hetzner VPS
2. 安装 Docker
3. 克隆 OpenClaw 仓库
4. 创建持久化主机目录
5. 配置 `.env` 和 `docker-compose.yml`
6. 将所需二进制文件内置到镜像中
7. `docker compose up -d`
8. 验证持久化和 Gateway 网关访问

---

## 你需要什么

- 拥有 root 访问权限的 Hetzner VPS
- 从你的笔记本电脑进行 SSH 访问
- 基本熟悉 SSH + 复制/粘贴
- 约 20 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选提供商凭据
  - WhatsApp 二维码
  - Telegram 机器人令牌
  - Gmail OAuth

---

<Steps>
  <Step title="Provision the VPS">
    在 Hetzner 中创建一台 Ubuntu 或 Debian VPS。

    以 root 身份连接：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    本指南假设该 VPS 是有状态的。
    不要将它视为一次性基础设施。

  </Step>

  <Step title="Install Docker (on the VPS)">
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

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    本指南假设你会构建一个自定义镜像，以保证二进制文件持久存在。

  </Step>

  <Step title="Create persistent host directories">
    Docker 容器是临时的。
    所有长期状态都必须存放在主机上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    在仓库根目录中创建 `.env`。

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

    如果你想通过 `.env` 管理稳定的 Gateway 网关
    令牌，请设置 `OPENCLAW_GATEWAY_TOKEN`；否则，请先配置 `gateway.auth.token`，
    再依赖客户端在重启后继续使用。如果两个来源都不存在，OpenClaw 会为该次启动
    使用仅运行时令牌。生成一个密钥环密码，并将其粘贴到 `GOG_KEYRING_PASSWORD`：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。**

    此 `.env` 文件用于容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。
    存储的提供商 OAuth/API-key 身份验证位于挂载的
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。

  </Step>

  <Step title="Docker Compose configuration">
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

    `--allow-unconfigured` 仅用于便捷引导，它不能替代正确的 Gateway 网关配置。仍需设置身份验证（`gateway.auth.token` 或密码），并为你的部署使用安全的绑定设置。

  </Step>

  <Step title="Shared Docker VM runtime steps">
    通用 Docker 主机流程请使用共享运行时指南：

    - [将所需二进制文件烘焙进镜像](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [哪些内容会持久化到哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    完成共享的构建和启动步骤后，完成以下设置以打开隧道：

    **前提条件：**确保你的 VPS sshd 配置允许 TCP 转发。如果你
    加固过 SSH 配置，请检查 `/etc/ssh/sshd_config` 并设置：

    ```
    AllowTcpForwarding local
    ```

    `local` 允许从你的笔记本电脑使用 `ssh -L` 本地转发，同时阻止
    来自服务器的远程转发。将其设置为 `no` 会导致隧道失败，
    并显示：
    `channel 3: open failed: administratively prohibited: open failed`

    确认已启用 TCP 转发后，重启 SSH 服务
    （`systemctl restart ssh`），并从你的笔记本电脑运行隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    打开：

    `http://127.0.0.1:18789/`

    粘贴已配置的共享密钥。本指南默认使用 Gateway 网关令牌；如果你已切换到密码身份验证，请改用该密码。

  </Step>
</Steps>

共享持久化映射位于 [Docker VM Runtime](/zh-CN/install/docker-vm-runtime#what-persists-where)。

## 基础设施即代码（Terraform）

对于偏好基础设施即代码工作流的团队，社区维护的 Terraform 设置提供：

- 带远程状态管理的模块化 Terraform 配置
- 通过 cloud-init 自动预配
- 部署脚本（引导、部署、备份/恢复）
- 安全加固（防火墙、UFW、仅限 SSH 访问）
- 用于 Gateway 网关访问的 SSH 隧道配置

**仓库：**

- 基础设施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 配置：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

这种方式通过可复现部署、版本控制的基础设施和自动化灾难恢复，补充了上面的 Docker 设置。

<Note>
由社区维护。有关问题或贡献，请参见上面的仓库链接。
</Note>

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 使 OpenClaw 保持最新：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Fly.io](/zh-CN/install/fly)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)

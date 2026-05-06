---
read_when:
    - 你想让 OpenClaw 在云 VPS 上全天候运行（而不是在你的笔记本电脑上）
    - 你想在自己的 VPS 上运行一个生产级、始终在线的 Gateway 网关
    - 你想完全控制持久化、二进制文件和重启行为
    - 你在 Hetzner 或类似提供商上通过 Docker 运行 OpenClaw
summary: 在低价 Hetzner VPS（Docker）上 24/7 运行 OpenClaw Gateway 网关，并使用持久状态和预置二进制文件
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T05:09:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw on Hetzner（Docker，生产 VPS 指南）

## 目标

使用 Docker 在 Hetzner VPS 上运行持久化的 OpenClaw Gateway 网关，并具备持久状态、内置二进制文件和安全重启行为。

如果你想要“约 5 美元的 OpenClaw 24/7”，这是最简单可靠的设置。
Hetzner 价格会变化；选择最小的 Debian/Ubuntu VPS，如果遇到 OOM 再扩容。

安全模型提醒：

- 当所有人都处于同一信任边界内且运行时仅用于业务时，公司共享的智能体是可以的。
- 保持严格隔离：专用 VPS/运行时 + 专用账号；不要在该主机上使用个人 Apple/Google/浏览器/密码管理器配置文件。
- 如果用户彼此之间存在对抗关系，请按 Gateway 网关/主机/OS 用户拆分。

参见 [安全](/zh-CN/gateway/security) 和 [VPS 托管](/zh-CN/vps)。

## 我们要做什么（简单来说）？

- 租用一台小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启/重建后仍保留）
- 通过 SSH 隧道从你的笔记本访问控制 UI

挂载的 `~/.openclaw` 状态包括 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json`，以及 `.env`。

可以通过以下方式访问 Gateway 网关：

- 从你的笔记本进行 SSH 端口转发
- 如果你自行管理防火墙和令牌，也可以直接暴露端口

本指南假设你在 Hetzner 上使用 Ubuntu 或 Debian。  
如果你使用的是其他 Linux VPS，请相应映射软件包。
通用 Docker 流程请参见 [Docker](/zh-CN/install/docker)。

---

## 快速路径（有经验的运维人员）

1. 配置 Hetzner VPS
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
- 从你的笔记本进行 SSH 访问
- 基本熟悉 SSH + 复制/粘贴
- 约 20 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选的提供商凭据
  - WhatsApp 二维码
  - Telegram bot 令牌
  - Gmail OAuth

---

<Steps>
  <Step title="Provision the VPS">
    在 Hetzner 中创建 Ubuntu 或 Debian VPS。

    以 root 身份连接：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    本指南假设 VPS 是有状态的。
    不要把它当作一次性基础设施。

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

    本指南假设你会构建自定义镜像来保证二进制文件持久存在。

  </Step>

  <Step title="Create persistent host directories">
    Docker 容器是临时的。
    所有长期状态都必须保存在主机上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
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

    除非你明确想通过 `.env` 管理 `OPENCLAW_GATEWAY_TOKEN`，否则请留空；OpenClaw 会在首次启动时向配置写入随机 Gateway 网关令牌。生成一个 keyring 密码并粘贴到
    `GOG_KEYRING_PASSWORD`：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。**

    这个 `.env` 文件用于容器/运行时环境，例如 `OPENCLAW_GATEWAY_TOKEN`。
    已存储的提供商 OAuth/API key 认证位于挂载的
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

    `--allow-unconfigured` 仅用于方便引导启动，它不能替代适当的 Gateway 网关配置。仍需设置认证（`gateway.auth.token` 或密码），并为你的部署使用安全的绑定设置。

  </Step>

  <Step title="Shared Docker VM runtime steps">
    对通用 Docker 主机流程使用共享运行时指南：

    - [将所需二进制文件烘焙进镜像](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [哪些内容持久化在哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    完成共享的构建和启动步骤后，完成以下设置以打开隧道：

    **前提条件：**确保你的 VPS sshd 配置允许 TCP 转发。如果你
    加固过 SSH 配置，请检查 `/etc/ssh/sshd_config` 并设置：

    ```
    AllowTcpForwarding local
    ```

    `local` 允许从你的笔记本发起 `ssh -L` 本地转发，同时阻止
    来自服务器的远程转发。将其设置为 `no` 会导致隧道失败，并显示：
    `channel 3: open failed: administratively prohibited: open failed`

    确认 TCP 转发已启用后，重启 SSH 服务
    （`systemctl restart ssh`），并从你的笔记本运行隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    打开：

    `http://127.0.0.1:18789/`

    粘贴已配置的共享密钥。本指南默认使用 Gateway 网关令牌；
    如果你切换到了密码认证，请改用该密码。

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

这种方式通过可复现部署、版本控制的基础设施和自动灾难恢复，补充了上面的 Docker 设置。

<Note>
由社区维护。有关问题或贡献，请参见上面的仓库链接。
</Note>

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 保持 OpenClaw 最新：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Fly.io](/zh-CN/install/fly)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)

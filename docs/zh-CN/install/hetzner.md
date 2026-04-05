---
read_when:
    - 你希望 OpenClaw 在云端 VPS 上 24/7 运行（而不是你的笔记本）
    - 你希望在自己的 VPS 上运行一个适合生产环境、始终在线的 Gateway 网关
    - 你希望完全控制持久化、二进制文件和重启行为
    - 你正在 Hetzner 或类似提供商上通过 Docker 运行 OpenClaw
summary: 在 Hetzner VPS 上用 Docker 运行 OpenClaw Gateway 网关，具备持久状态、内置二进制文件和安全重启行为
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T08:27:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# 在 Hetzner 上运行 OpenClaw（Docker，生产 VPS 指南）

## 目标

使用 Docker 在 Hetzner VPS 上运行一个持久化的 OpenClaw Gateway 网关，并具备持久状态、内置二进制文件和安全的重启行为。

如果你想要“每月约 5 美元即可 24/7 运行 OpenClaw”，这是最简单且可靠的方案。
Hetzner 的价格会变化；请选择最小的 Debian/Ubuntu VPS，如果遇到 OOM 再扩容。

安全模型提醒：

- 当所有人都处于同一个信任边界内，并且运行时仅用于业务用途时，公司共享智能体是可以接受的。
- 请保持严格隔离：专用 VPS/运行时 + 专用账户；不要在该主机上放置个人 Apple/Google/browser/password-manager 配置文件。
- 如果用户彼此存在对抗关系，请按 gateway/主机/OS 用户拆分。

请参阅[安全性](/gateway/security)和 [VPS 托管](/vps)。

## 我们要做什么（用简单的话说）？

- 租一台小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启/重建后仍保留）
- 通过 SSH 隧道从你的笔记本访问 Control UI

这个挂载的 `~/.openclaw` 状态包括 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json` 以及 `.env`。

访问 Gateway 网关的方式包括：

- 从你的笔记本进行 SSH 端口转发
- 如果你能自行管理防火墙和 token，也可以直接暴露端口

本指南假设你在 Hetzner 上使用 Ubuntu 或 Debian。  
如果你使用的是其他 Linux VPS，请相应替换软件包。
关于通用 Docker 流程，请参阅 [Docker](/install/docker)。

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

## 你需要准备什么

- 一台拥有 root 权限的 Hetzner VPS
- 从你的笔记本发起的 SSH 访问
- 对 SSH + 复制粘贴有基本使用经验
- 约 20 分钟
- Docker 和 Docker Compose
- 模型认证凭证
- 可选的提供商凭证
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="创建 VPS">
    在 Hetzner 中创建一台 Ubuntu 或 Debian VPS。

    以 root 身份连接：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    本指南假设该 VPS 是有状态的。
    不要把它当成可随意丢弃的基础设施。

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

    本指南假设你将构建一个自定义镜像，以保证二进制文件持久存在。

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
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    生成高强度密钥：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交这个文件。**

    这个 `.env` 文件用于容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。
    已存储的提供商 OAuth/API key 认证则保存在已挂载的
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
          # 推荐：在 VPS 上将 Gateway 网关仅绑定到 loopback；通过 SSH 隧道访问。
          # 若要公开暴露它，请移除 `127.0.0.1:` 前缀，并相应配置防火墙。
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

    `--allow-unconfigured` 仅用于 bootstrap 便利，它不能替代正确的 gateway 配置。你仍应设置认证（`gateway.auth.token` 或 password），并为你的部署使用安全的 bind 设置。

  </Step>

  <Step title="共享 Docker VM 运行时步骤">
    对于通用 Docker 主机流程，请使用共享运行时指南：

    - [将所需二进制文件烘焙进镜像](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/install/docker-vm-runtime#build-and-launch)
    - [哪些内容会持久化，存放在哪里](/install/docker-vm-runtime#what-persists-where)
    - [更新](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 专用访问方式">
    在完成共享构建和启动步骤后，从你的笔记本建立隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    打开：

    `http://127.0.0.1:18789/`

    粘贴已配置的共享密钥。本指南默认使用 gateway token；如果你切换到了 password 认证，请改用那个密码。

  </Step>
</Steps>

共享持久化映射请参阅 [Docker VM 运行时](/install/docker-vm-runtime#what-persists-where)。

## 基础设施即代码（Terraform）

对于偏好基础设施即代码工作流的团队，一个由社区维护的 Terraform 方案提供了：

- 带远程状态管理的模块化 Terraform 配置
- 通过 cloud-init 实现的自动化配置
- 部署脚本（bootstrap、deploy、backup/restore）
- 安全加固（防火墙、UFW、仅 SSH 访问）
- 用于 gateway 访问的 SSH 隧道配置

**仓库：**

- 基础设施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 配置：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

这种方式可在上述 Docker 设置基础上补充可复现部署、版本控制的基础设施，以及自动化灾难恢复。

> **注意：**由社区维护。如需反馈问题或贡献，请参阅上面的仓库链接。

## 后续步骤

- 设置消息渠道：[渠道](/channels)
- 配置 Gateway 网关：[Gateway 网关配置](/gateway/configuration)
- 保持 OpenClaw 为最新版本：[更新](/install/updating)

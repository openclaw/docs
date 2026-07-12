---
read_when:
    - 你希望 OpenClaw 在 GCP 上全天候运行
    - 你希望在自己的虚拟机上运行一个生产级、始终在线的 Gateway 网关
    - 你希望完全掌控持久化、二进制文件和重启行为
summary: 在 GCP Compute Engine 虚拟机上通过 Docker 全天候运行 OpenClaw Gateway 网关，并持久保存状态
title: GCP
x-i18n:
    generated_at: "2026-07-11T20:40:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

在 GCP Compute Engine 虚拟机上使用 Docker 运行持久化的 OpenClaw Gateway 网关，并提供持久状态、内置二进制文件和安全重启行为。

价格因机器类型和区域而异；请选择能够满足工作负载的最小虚拟机，如果遇到内存不足（OOM），再升级配置。

你可以通过笔记本电脑上的 SSH 端口转发访问 Gateway 网关；如果你自行管理防火墙和令牌，也可以直接开放端口。

本指南在 GCP Compute Engine 上使用 Debian。Ubuntu 也可以使用，但需要相应调整软件包。通用 Docker 流程请参阅 [Docker](/zh-CN/install/docker)。

## 所需条件

- GCP 账号（`e2-micro` 符合免费层资格）
- `gcloud` CLI，或 [Cloud Console](https://console.cloud.google.com)
- 从笔记本电脑进行 SSH 访问
- Docker 和 Docker Compose
- 模型身份验证凭据
- 可选的提供商凭据（WhatsApp 二维码、Telegram Bot 令牌、Gmail OAuth）
- 约 20～30 分钟

## 快速流程

1. 创建 GCP 项目，启用结算和 Compute Engine API
2. 创建 Compute Engine 虚拟机（`e2-small`、Debian 12、20GB）
3. 通过 SSH 登录虚拟机并安装 Docker
4. 克隆 OpenClaw 仓库
5. 创建持久化宿主机目录
6. 配置 `.env` 和 `docker-compose.yml`
7. 将所需二进制文件烘焙进镜像，然后构建并启动

<Steps>
  <Step title="安装 gcloud CLI（或使用 Console）">
    从 [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安装，然后运行：

    ```bash
    gcloud init
    gcloud auth login
    ```

    或者改为通过 [Cloud Console](https://console.cloud.google.com) Web UI 完成以下所有步骤。

  </Step>

  <Step title="创建 GCP 项目">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    在 [console.cloud.google.com/billing](https://console.cloud.google.com/billing) 启用结算（Compute Engine 要求启用）。

    Console 中的等效操作：IAM & Admin > Create Project，启用结算，然后依次进入 APIs & Services > Enable APIs > "Compute Engine API" > Enable。

  </Step>

  <Step title="创建虚拟机">
    | 类型      | 规格                     | 费用             | 说明                                      |
    | --------- | ------------------------ | ---------------- | ----------------------------------------- |
    | e2-medium | 2 个 vCPU、4GB 内存      | 约 25 美元/月    | 最适合可靠地进行本地 Docker 构建          |
    | e2-small  | 2 个 vCPU、2GB 内存      | 约 12 美元/月    | Docker 构建的最低推荐配置                 |
    | e2-micro  | 2 个 vCPU（共享）、1GB 内存 | 符合免费层资格 | Docker 构建经常因 OOM 而失败（退出码 137） |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="通过 SSH 登录虚拟机">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console：在 Compute Engine 控制面板中，点击虚拟机旁边的 "SSH"。

    创建虚拟机后，SSH 密钥传播可能需要 1～2 分钟；如果连接被拒绝，请等待后重试。

  </Step>

  <Step title="安装 Docker（在虚拟机上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    注销并重新登录，使用户组变更生效，然后再次通过 SSH 登录：

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    本指南会构建自定义镜像，因此烘焙进镜像的所有二进制文件都能在重启后继续保留。

  </Step>

  <Step title="创建持久化宿主机目录">
    Docker 容器是临时的；所有长期状态都必须存储在宿主机上。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`：

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    设置 `OPENCLAW_GATEWAY_TOKEN`，通过 `.env` 管理稳定的 Gateway 网关令牌；否则，请先配置 `gateway.auth.token`，再依赖客户端跨重启访问。如果两者均未设置，OpenClaw 会为本次启动使用仅限运行时的令牌。为 `GOG_KEYRING_PASSWORD` 生成密钥环密码：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。**它保存容器和运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。已存储的提供商 OAuth/API 密钥身份验证信息位于挂载的 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中。

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
          # 推荐：让虚拟机上的 Gateway 网关仅监听回环地址；通过 SSH 隧道访问。
          # 如需公开开放，请移除 `127.0.0.1:` 前缀，并相应配置防火墙。
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

    `--allow-unconfigured` 仅用于方便引导启动，不能替代真正的 Gateway 网关配置。仍然需要设置身份验证（`gateway.auth.token` 或密码），并为你的部署选择安全的绑定模式。

  </Step>

  <Step title="共享 Docker 虚拟机运行时步骤">
    按照共享运行时指南完成通用 Docker 宿主机流程：

    - [将所需二进制文件烘焙进镜像](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [各类数据的持久化位置](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 特定启动说明">
    如果在执行 `pnpm install --frozen-lockfile` 期间，构建因 `Killed` 或 `exit code 137` 而失败，则说明虚拟机内存不足。至少使用 `e2-small`，首次构建要更可靠则使用 `e2-medium`。

    绑定到局域网（`OPENCLAW_GATEWAY_BIND=lan`）时，请先配置受信任的浏览器来源，然后再继续：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你更改了端口，请将 `18789` 替换为配置的端口。

  </Step>

  <Step title="从笔记本电脑访问">
    创建 SSH 隧道以转发 Gateway 网关端口：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在浏览器中打开 `http://127.0.0.1:18789/`。

    重新输出不含多余内容的控制面板链接：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果界面提示需要共享密钥身份验证，请将配置的令牌或密码粘贴到 Control UI 设置中（此 Docker 流程默认写入令牌；如果你已切换为密码身份验证，请改用配置的密码）。

    如果 Control UI 显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    有关共享持久化映射，请参阅 [Docker 虚拟机运行时](/zh-CN/install/docker-vm-runtime#what-persists-where)；有关更新，请参阅[更新流程](/zh-CN/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

## 故障排查

**SSH 连接被拒绝**

创建虚拟机后，SSH 密钥传播可能需要 1～2 分钟。请等待后重试。

**OS Login 问题**

检查你的 OS Login 配置文件：

```bash
gcloud compute os-login describe-profile
```

确保你的账号具有所需的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足（OOM）**

如果 Docker 构建因 `Killed` 和 `exit code 137` 而失败，则虚拟机进程因 OOM 被终止：

```bash
# 先停止虚拟机
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 更改机器类型
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# 启动虚拟机
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## 服务账号（安全最佳实践）

对于个人使用，默认用户账号即可。对于自动化或 CI/CD，请创建权限最小化的专用服务账号：

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

避免为自动化使用 Owner 角色；请使用能够满足要求的最小权限角色。请参阅[了解角色](https://cloud.google.com/iam/docs/understanding-roles)。

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 将本地设备配对为节点：[节点](/zh-CN/nodes)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)

## 相关内容

- [安装概览](/zh-CN/install)
- [Azure](/zh-CN/install/azure)
- [VPS 托管](/zh-CN/vps)

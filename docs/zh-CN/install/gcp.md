---
read_when:
    - 你希望 OpenClaw 在 GCP 上 24/7 持续运行
    - 你希望在你自己的虚拟机上部署一个生产级、始终在线的 Gateway 网关
    - 你希望完全控制持久化、二进制文件和重启行为
summary: 在 GCP Compute Engine 虚拟机（Docker）上以 24/7 方式运行 OpenClaw Gateway 网关，并保持持久化状态
title: GCP
x-i18n:
    generated_at: "2026-04-18T17:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# 在 GCP Compute Engine 上运行 OpenClaw（Docker，生产级 VPS 指南）

## 目标

在 GCP Compute Engine 虚拟机上使用 Docker 运行一个持久化的 OpenClaw Gateway 网关，并具备持久化状态、预置二进制文件以及安全的重启行为。

如果你想要“以约 5-12 美元/月的成本让 OpenClaw 24/7 持续运行”，这是一个在 Google Cloud 上可靠的部署方案。
价格会因机器类型和区域而异；选择最适合你工作负载的最小虚拟机，如果遇到 OOM，再向上扩容。

## 我们要做什么（通俗解释）？

- 创建一个 GCP 项目并启用计费
- 创建一个 Compute Engine 虚拟机
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启/重建后仍保留）
- 通过 SSH 隧道从你的笔记本访问 Control UI

挂载的 `~/.openclaw` 状态包含 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json`，以及 `.env`。

Gateway 网关可以通过以下方式访问：

- 从你的笔记本进行 SSH 端口转发
- 如果你自行管理防火墙和令牌，也可以直接暴露端口

本指南在 GCP Compute Engine 上使用 Debian。
Ubuntu 也可用；请相应调整软件包名称。
关于通用 Docker 流程，请参见 [Docker](/zh-CN/install/docker)。

---

## 快速路径（适合有经验的运维人员）

1. 创建 GCP 项目并启用 Compute Engine API
2. 创建 Compute Engine 虚拟机（`e2-small`、Debian 12、20GB）
3. SSH 登录到虚拟机
4. 安装 Docker
5. 克隆 OpenClaw 仓库
6. 创建持久化主机目录
7. 配置 `.env` 和 `docker-compose.yml`
8. 预置所需二进制文件、构建并启动

---

## 你需要准备

- GCP 账号（`e2-micro` 可享受免费层资格）
- 已安装 `gcloud` CLI（或使用 Cloud Console）
- 从你的笔记本进行 SSH 访问
- 对 SSH + 复制粘贴有基础操作能力
- 约 20-30 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选的提供商凭据
  - WhatsApp 二维码
  - Telegram 机器人令牌
  - Gmail OAuth

---

<Steps>
  <Step title="安装 gcloud CLI（或使用 Console）">
    **选项 A：gcloud CLI**（推荐用于自动化）

    从 [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安装

    初始化并认证：

    ```bash
    gcloud init
    gcloud auth login
    ```

    **选项 B：Cloud Console**

    所有步骤都可以通过网页 UI 完成，地址是 [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="创建一个 GCP 项目">
    **CLI：**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    在 [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) 启用计费（Compute Engine 必需）。

    启用 Compute Engine API：

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console：**

    1. 前往 IAM & Admin > Create Project
    2. 命名并创建项目
    3. 为项目启用计费
    4. 前往 APIs & Services > Enable APIs > 搜索 “Compute Engine API” > Enable

  </Step>

  <Step title="创建虚拟机">
    **机器类型：**

    | 类型      | 配置                     | 成本               | 说明                             |
    | --------- | ------------------------ | ------------------ | -------------------------------- |
    | e2-medium | 2 vCPU，4GB RAM          | 约 25 美元/月      | 本地 Docker 构建最可靠           |
    | e2-small  | 2 vCPU，2GB RAM          | 约 12 美元/月      | Docker 构建的最低推荐配置        |
    | e2-micro  | 2 vCPU（共享），1GB RAM | 可享免费层资格     | 经常因 Docker 构建 OOM 而失败（退出 137） |

    **CLI：**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console：**

    1. 前往 Compute Engine > VM instances > Create instance
    2. 名称：`openclaw-gateway`
    3. 区域：`us-central1`，可用区：`us-central1-a`
    4. 机器类型：`e2-small`
    5. 启动磁盘：Debian 12，20GB
    6. 创建

  </Step>

  <Step title="SSH 登录到虚拟机">
    **CLI：**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console：**

    在 Compute Engine 仪表板中，点击你的虚拟机旁边的 “SSH” 按钮。

    注意：虚拟机创建后，SSH 密钥传播可能需要 1-2 分钟。如果连接被拒绝，请稍等后重试。

  </Step>

  <Step title="安装 Docker（在虚拟机上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    注销并重新登录，使组变更生效：

    ```bash
    exit
    ```

    然后重新 SSH 登录：

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

    本指南假设你会构建一个自定义镜像，以确保二进制文件持久化。

  </Step>

  <Step title="创建持久化主机目录">
    Docker 容器是临时的。
    所有长期状态都必须存放在主机上。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`。

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

    除非你明确想通过 `.env` 管理 `OPENCLAW_GATEWAY_TOKEN`，否则请将其留空；OpenClaw 会在首次启动时把一个随机 Gateway 网关令牌写入配置。生成一个密钥环密码并粘贴到 `GOG_KEYRING_PASSWORD` 中：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交这个文件。**

    这个 `.env` 文件用于容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。
    存储的提供商 OAuth/API 密钥认证信息位于挂载的
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
          # 推荐：让 Gateway 网关在虚拟机上仅绑定到 loopback；通过 SSH 隧道访问。
          # 如需公开暴露，请移除 `127.0.0.1:` 前缀，并相应配置防火墙。
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

    `--allow-unconfigured` 仅用于初始引导时的便利，并不能替代正确的 Gateway 网关配置。你仍然需要设置认证（`gateway.auth.token` 或密码），并为你的部署使用安全的绑定设置。

  </Step>

  <Step title="共享 Docker 虚拟机运行时步骤">
    对于通用的 Docker 主机流程，请使用共享运行时指南：

    - [将所需二进制文件预置到镜像中](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [哪些内容会持久化以及存放位置](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 特定启动说明">
    在 GCP 上，如果在 `pnpm install --frozen-lockfile` 期间构建因 `Killed` 或 `exit code 137` 失败，说明虚拟机内存不足。最低使用 `e2-small`，或者使用 `e2-medium` 以获得更可靠的首次构建体验。

    当绑定到局域网（`OPENCLAW_GATEWAY_BIND=lan`）时，继续之前请先配置一个受信任的浏览器来源：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你修改了 Gateway 网关端口，请将 `18789` 替换为你配置的端口。

  </Step>

  <Step title="从你的笔记本访问">
    创建一个 SSH 隧道来转发 Gateway 网关端口：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在浏览器中打开：

    `http://127.0.0.1:18789/`

    重新输出一个干净的仪表板链接：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 提示需要 shared-secret 认证，请将配置好的令牌或
    密码粘贴到 Control UI 设置中。这个 Docker 流程默认会写入一个令牌；如果你把容器配置改成密码认证，请改用该
    密码。

    如果 Control UI 显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准该浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    还需要再次查看共享持久化和更新参考？
    请参见 [Docker VM Runtime](/zh-CN/install/docker-vm-runtime#what-persists-where) 和 [Docker VM Runtime updates](/zh-CN/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

---

## 故障排除

**SSH 连接被拒绝**

虚拟机创建后，SSH 密钥传播可能需要 1-2 分钟。请稍等后重试。

**OS Login 问题**

检查你的 OS Login 配置文件：

```bash
gcloud compute os-login describe-profile
```

确保你的账号具有所需的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足（OOM）**

如果 Docker 构建失败并出现 `Killed` 和 `exit code 137`，说明虚拟机被 OOM kill 了。升级到 e2-small（最低）或 e2-medium（推荐，用于更可靠的本地构建）：

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

---

## 服务账号（安全最佳实践）

对于个人使用，你的默认用户账号已经足够。

对于自动化或 CI/CD 流水线，请创建一个权限最小化的专用服务账号：

1. 创建一个服务账号：

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. 授予 Compute Instance Admin 角色（或更窄的自定义角色）：

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

避免在自动化中使用 Owner 角色。请遵循最小权限原则。

IAM 角色详情请参见 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)。

---

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 将本地设备配对为节点：[Nodes](/zh-CN/nodes)
- 配置 Gateway 网关：[Gateway configuration](/zh-CN/gateway/configuration)

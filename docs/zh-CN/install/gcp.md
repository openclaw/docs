---
read_when:
    - 你希望 OpenClaw 在 GCP 上 24/7 运行
    - 你想在自己的虚拟机上运行一个生产级、始终在线的 Gateway 网关
    - 你想完全控制持久化、二进制文件和重启行为
summary: 在 GCP Compute Engine VM（Docker）上全天候运行带持久状态的 OpenClaw Gateway 网关
title: GCP
x-i18n:
    generated_at: "2026-07-05T11:27:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

使用 Docker 在 GCP Compute Engine VM 上运行持久化的 OpenClaw Gateway 网关，具备持久状态、内置二进制文件和安全的重启行为。

价格会因机器类型和区域而异；选择能满足你的工作负载的最小 VM，如果遇到 OOM，再向上扩容。

可以通过从你的笔记本进行 SSH 端口转发来访问 Gateway 网关；如果你自行管理防火墙和令牌，也可以直接暴露端口。

本指南在 GCP Compute Engine 上使用 Debian。Ubuntu 也可以使用；请相应映射软件包。通用 Docker 流程请参阅 [Docker](/zh-CN/install/docker)。

## 你需要准备

- GCP 账号（`e2-micro` 符合免费层条件）
- `gcloud` CLI，或 [Cloud Console](https://console.cloud.google.com)
- 从你的笔记本进行 SSH 访问
- Docker 和 Docker Compose
- 模型凭证
- 可选提供商凭证（WhatsApp QR、Telegram bot token、Gmail OAuth）
- 约 20-30 分钟

## 快速路径

1. 创建 GCP 项目，启用结算和 Compute Engine API
2. 创建 Compute Engine VM（`e2-small`、Debian 12、20GB）
3. SSH 进入 VM，安装 Docker
4. 克隆 OpenClaw 仓库
5. 创建持久化主机目录
6. 配置 `.env` 和 `docker-compose.yml`
7. 烘焙所需二进制文件，构建并启动

<Steps>
  <Step title="Install gcloud CLI (or use Console)">
    从 [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安装，然后：

    ```bash
    gcloud init
    gcloud auth login
    ```

    或者改用 [Cloud Console](https://console.cloud.google.com) Web UI 完成下面的每一步。

  </Step>

  <Step title="Create a GCP project">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    在 [console.cloud.google.com/billing](https://console.cloud.google.com/billing) 启用结算（Compute Engine 必需）。

    Console 等效操作：IAM & Admin > Create Project，启用结算，然后 APIs & Services > Enable APIs > "Compute Engine API" > Enable。

  </Step>

  <Step title="Create the VM">
    | 类型      | 规格                    | 成本               | 说明                                        |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU，4GB RAM          | 约 $25/月            | 本地 Docker 构建最可靠         |
    | e2-small  | 2 vCPU，2GB RAM          | 约 $12/月            | Docker 构建的最低推荐配置        |
    | e2-micro  | 2 vCPU（共享），1GB RAM | 符合免费层条件 | 经常因 Docker 构建 OOM 而失败（退出 137）  |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="SSH into the VM">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console：在 Compute Engine 仪表板中点击 VM 旁边的 “SSH”。

    VM 创建后，SSH 密钥传播可能需要 1-2 分钟；如果连接被拒绝，请等待后重试。

  </Step>

  <Step title="Install Docker (on the VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    注销并重新登录以使组变更生效，然后重新 SSH 登录：

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

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    本指南会构建自定义镜像，因此你烘焙进去的任何二进制文件都能在重启后保留。

  </Step>

  <Step title="Create persistent host directories">
    Docker 容器是临时的；所有长期状态都必须存放在主机上。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure environment variables">
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

    设置 `OPENCLAW_GATEWAY_TOKEN`，通过 `.env` 管理稳定的 Gateway 网关令牌；否则在依赖客户端跨重启之前，请先配置 `gateway.auth.token`。如果两者都未设置，OpenClaw 会为该次启动使用仅运行时有效的令牌。为 `GOG_KEYRING_PASSWORD` 生成一个 keyring 密码：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。** 它包含容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。已存储的提供商 OAuth/API key 凭证位于挂载的 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。

  </Step>

  <Step title="Docker Compose configuration">
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

    `--allow-unconfigured` 仅用于方便引导，不是真实 Gateway 网关配置的替代品。仍然需要设置凭证（`gateway.auth.token` 或密码）以及适合你部署的安全绑定模式。

  </Step>

  <Step title="Shared Docker VM runtime steps">
    按照共享运行时指南完成通用 Docker 主机流程：

    - [将所需二进制文件烘焙到镜像中](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [哪些内容持久化在哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specific launch notes">
    如果构建在 `pnpm install --frozen-lockfile` 期间因 `Killed` 或 `exit code 137` 失败，说明 VM 内存不足。至少使用 `e2-small`，若希望首次构建更可靠，请使用 `e2-medium`。

    绑定到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）时，继续之前请配置受信任的浏览器来源：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你更改了端口，请将 `18789` 替换为你配置的端口。

  </Step>

  <Step title="Access from your laptop">
    创建 SSH 隧道以转发 Gateway 网关端口：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在浏览器中打开 `http://127.0.0.1:18789/`。

    重新打印干净的仪表板链接：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 提示进行 shared-secret 凭证认证，请将配置的令牌或密码粘贴到 Control UI 设置中（此 Docker 流程默认会写入令牌；如果你已切换到密码认证，请改用你配置的密码）。

    如果 Control UI 显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准该浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    请参阅 [Docker VM 运行时](/zh-CN/install/docker-vm-runtime#what-persists-where) 了解共享持久化映射，并参阅 [更新流程](/zh-CN/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

## 故障排查

**SSH 连接被拒绝**

VM 创建后，SSH 密钥传播可能需要 1-2 分钟。请等待后重试。

**OS Login 问题**

检查你的 OS Login 配置文件：

```bash
gcloud compute os-login describe-profile
```

确保你的账号具有所需的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足（OOM）**

如果 Docker 构建因 `Killed` 和 `exit code 137` 失败，说明 VM 被 OOM 终止：

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## 服务账号（安全最佳实践）

个人使用时，默认用户账号即可。对于自动化或 CI/CD，请创建一个权限最小化的专用服务账号：

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

避免在自动化中使用 Owner 角色；使用能正常工作的最窄角色。请参阅 [了解角色](https://cloud.google.com/iam/docs/understanding-roles)。

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 将本地设备配对为节点：[Nodes](/zh-CN/nodes)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)

## 相关

- [安装概览](/zh-CN/install)
- [Azure](/zh-CN/install/azure)
- [VPS 托管](/zh-CN/vps)

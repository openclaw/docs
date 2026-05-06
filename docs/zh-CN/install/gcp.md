---
read_when:
    - 你希望 OpenClaw 在 GCP 上全天候运行
    - 你想在自己的 VM 上部署生产级、始终在线的 Gateway 网关
    - 你希望完全控制持久化、二进制文件和重启行为
summary: 在 GCP Compute Engine VM（Docker）上 24/7 运行 OpenClaw Gateway 网关并持久化状态
title: GCP
x-i18n:
    generated_at: "2026-05-06T01:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

在 GCP Compute Engine 虚拟机上使用 Docker 运行持久化的 OpenClaw Gateway 网关，具备持久状态、内置二进制文件和安全重启行为。

如果你想要“每月约 5-12 美元的 24/7 OpenClaw”，这是 Google Cloud 上的可靠设置。
价格会因机器类型和区域而异；选择能满足工作负载的最小虚拟机，如果遇到 OOM，再向上扩容。

## 我们要做什么（简单来说）？

- 创建 GCP 项目并启用结算
- 创建 Compute Engine 虚拟机
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启/重建后仍保留）
- 通过 SSH 隧道从你的笔记本访问控制 UI

挂载的 `~/.openclaw` 状态包含 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json`，以及 `.env`。

可以通过以下方式访问 Gateway 网关：

- 从你的笔记本使用 SSH 端口转发
- 如果你自行管理防火墙和令牌，也可以直接暴露端口

本指南使用 GCP Compute Engine 上的 Debian。
Ubuntu 也可用；请相应映射软件包。
关于通用 Docker 流程，请参阅 [Docker](/zh-CN/install/docker)。

---

## 快速路径（有经验的运维人员）

1. 创建 GCP 项目 + 启用 Compute Engine API
2. 创建 Compute Engine 虚拟机（e2-small、Debian 12、20GB）
3. SSH 进入虚拟机
4. 安装 Docker
5. 克隆 OpenClaw 仓库
6. 创建持久化主机目录
7. 配置 `.env` 和 `docker-compose.yml`
8. 烘焙所需二进制文件、构建并启动

---

## 你需要准备

- GCP 账号（e2-micro 可享受免费层）
- 已安装 gcloud CLI（或使用 Cloud Console）
- 从你的笔记本进行 SSH 访问
- 基本熟悉 SSH + 复制/粘贴
- 约 20-30 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选提供商凭据
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

    所有步骤都可以通过 [https://console.cloud.google.com](https://console.cloud.google.com) 的网页 UI 完成

  </Step>

  <Step title="创建 GCP 项目">
    **CLI：**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    在 [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) 启用结算（Compute Engine 必需）。

    启用 Compute Engine API：

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console：**

    1. 转到 IAM 和管理 > 创建项目
    2. 命名并创建
    3. 为项目启用结算
    4. 导航到 API 和服务 > 启用 API > 搜索“Compute Engine API”> 启用

  </Step>

  <Step title="创建虚拟机">
    **机器类型：**

    | 类型      | 规格                    | 成本               | 说明                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU，4GB RAM          | 约 25 美元/月            | 对本地 Docker 构建最可靠        |
    | e2-small  | 2 vCPU，2GB RAM          | 约 12 美元/月            | Docker 构建的最低推荐配置         |
    | e2-micro  | 2 vCPU（共享），1GB RAM | 符合免费层条件 | Docker 构建经常因 OOM 失败（退出 137） |

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

    1. 转到 Compute Engine > 虚拟机实例 > 创建实例
    2. 名称：`openclaw-gateway`
    3. 区域：`us-central1`，可用区：`us-central1-a`
    4. 机器类型：`e2-small`
    5. 启动磁盘：Debian 12，20GB
    6. 创建

  </Step>

  <Step title="SSH 进入虚拟机">
    **CLI：**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console：**

    在 Compute Engine 信息中心中点击你的虚拟机旁边的“SSH”按钮。

    注意：虚拟机创建后，SSH 密钥传播可能需要 1-2 分钟。如果连接被拒绝，请等待后重试。

  </Step>

  <Step title="安装 Docker（在虚拟机上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    退出并重新登录，使组变更生效：

    ```bash
    exit
    ```

    然后重新 SSH 进入：

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

    本指南假设你会构建自定义镜像，以保证二进制文件持久存在。

  </Step>

  <Step title="创建持久化主机目录">
    Docker 容器是临时的。
    所有长期状态都必须保存在主机上。

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

    保持 `OPENCLAW_GATEWAY_TOKEN` 为空，除非你明确想通过
    `.env` 管理它；OpenClaw 会在首次启动时将随机 Gateway 网关令牌写入
    配置。生成 keyring 密码并粘贴到
    `GOG_KEYRING_PASSWORD`：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。**

    这个 `.env` 文件用于容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。
    已存储的提供商 OAuth/API-key 认证位于挂载的
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。

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

    `--allow-unconfigured` 仅用于方便引导启动，不能替代正确的 Gateway 网关配置。仍然要设置认证（`gateway.auth.token` 或密码），并为你的部署使用安全的绑定设置。

  </Step>

  <Step title="共享 Docker 虚拟机运行时步骤">
    对常见 Docker 主机流程使用共享运行时指南：

    - [将所需二进制文件烘焙进镜像](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [持久化内容的位置](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 专用启动说明">
    在 GCP 上，如果构建在 `pnpm install --frozen-lockfile` 期间因 `Killed` 或 `exit code 137` 失败，则表示虚拟机内存不足。至少使用 `e2-small`，或使用 `e2-medium` 获得更可靠的首次构建体验。

    绑定到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）时，请先配置受信任的浏览器来源再继续：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你更改了 Gateway 网关端口，请将 `18789` 替换为你配置的端口。

  </Step>

  <Step title="从你的笔记本访问">
    创建 SSH 隧道以转发 Gateway 网关端口：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在浏览器中打开：

    `http://127.0.0.1:18789/`

    重新打印干净的信息中心链接：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 提示输入共享密钥认证，请将配置的令牌或
    密码粘贴到控制 UI 设置中。此 Docker 流程默认会写入令牌；
    如果你把容器配置切换为密码认证，请改用该密码。

    如果控制 UI 显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    还需要共享持久化和更新参考吗？
    请参阅 [Docker 虚拟机运行时](/zh-CN/install/docker-vm-runtime#what-persists-where) 和 [Docker 虚拟机运行时更新](/zh-CN/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

---

## 故障排除

**SSH 连接被拒绝**

虚拟机创建后，SSH 密钥传播可能需要 1-2 分钟。等待后重试。

**OS Login 问题**

检查你的 OS Login 配置文件：

```bash
gcloud compute os-login describe-profile
```

确保你的账号具有所需的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足（OOM）**

如果 Docker 构建因 `Killed` 和 `exit code 137` 失败，则虚拟机被 OOM 终止。升级到 e2-small（最低）或 e2-medium（推荐用于可靠的本地构建）：

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

---

## 服务账号（安全最佳实践）

个人使用时，你的默认用户账号就可以正常工作。

对于自动化或 CI/CD 流水线，请创建具有最小权限的专用服务账号：

1. 创建服务账号：

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. 授予 Compute Instance Admin 角色（或范围更窄的自定义角色）：

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

避免将 Owner 角色用于自动化。请遵循最小权限原则。

有关 IAM 角色详情，请参阅 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)。

---

## 下一步

- 设置消息渠道：[渠道](/zh-CN/channels)
- 将本地设备配对为节点：[节点](/zh-CN/nodes)
- 配置 Gateway 网关：[Gateway 网关配置](/zh-CN/gateway/configuration)

## 相关内容

- [安装概览](/zh-CN/install)
- [Azure](/zh-CN/install/azure)
- [VPS 托管](/zh-CN/vps)

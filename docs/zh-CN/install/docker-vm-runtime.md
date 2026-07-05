---
read_when:
    - 你正在使用 Docker 在云 VM 上部署 OpenClaw
    - 你需要共享二进制构建、持久化和更新流程
summary: 长期运行的 OpenClaw Gateway 网关主机的共享 Docker VM 运行时步骤
title: Docker VM 运行时
x-i18n:
    generated_at: "2026-07-05T11:23:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

基于 VM 的 Docker 安装（例如 GCP、Hetzner 和类似 VPS 提供商）的共享运行时步骤。

## 将所需二进制文件烘焙进镜像

在运行中的容器内安装二进制文件是个陷阱：运行时安装的任何内容都会在重启时丢失。将技能所需的每个外部二进制文件都在构建时烘焙进镜像。

下面的示例仅涵盖三个二进制文件，按字母顺序排列：

- 用于 Gmail 访问的 `gog`（来自 `gogcli`）
- 用于 Google Places 的 `goplaces`
- 用于 WhatsApp 的 `wacli`

这些只是示例，不是完整列表。使用相同模式安装你的技能所需的所有二进制文件。稍后添加需要新二进制文件的技能时：

1. 更新 Dockerfile。
2. 重新构建镜像。
3. 重启容器。

**示例 Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
上面的 URL 是示例。对于基于 ARM 的 VM，请选择 `arm64` 资产。若要实现可复现构建，请固定带版本号的发布 URL。
</Note>

## 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果构建在执行 `pnpm install --frozen-lockfile` 期间因 `Killed` 或退出代码 137 而失败，说明 VM 内存不足。请使用更大的机器规格后再重试。

验证二进制文件：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

预期输出：

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

验证 Gateway 网关已启动：

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

`/healthz` 返回 200 响应表示 Gateway 网关进程正在监听且健康；内置镜像 `HEALTHCHECK` 会轮询同一个端点。

## 持久化位置说明

OpenClaw 在 Docker 中运行，但 Docker 不是事实来源。所有长期状态都必须在重启、重建和重新启动主机后保留。

| 组件                   | 位置                                                   | 持久化机制             | 备注                                                                                                                |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Gateway 网关配置       | `/home/node/.openclaw/`                                | 主机卷挂载             | 包含 `openclaw.json`                                                                                                |
| 渠道/提供商凭证        | `/home/node/.openclaw/credentials/`                    | 主机卷挂载             | 渠道和提供商凭证材料                                                                                                |
| 模型认证配置           | `/home/node/.openclaw/agents/`                         | 主机卷挂载             | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API key）                                                       |
| 旧版 OAuth 密钥文件    | `/home/node/.config/openclaw/`                         | 主机卷挂载             | 迁移前 OAuth sidecar 的只读兼容；`openclaw doctor --fix` 会将这些迁移到 `auth-profiles.json`                         |
| Skills 配置            | `/home/node/.openclaw/skills/`                         | 主机卷挂载             | 技能级状态                                                                                                          |
| Agent 工作区           | `/home/node/.openclaw/workspace/`                      | 主机卷挂载             | 代码和智能体工件                                                                                                    |
| WhatsApp 会话          | `/home/node/.openclaw/`                                | 主机卷挂载             | 保留二维码登录                                                                                                      |
| Gmail keyring          | `/home/node/.openclaw/`                                | 主机卷 + 密码          | 需要 `GOG_KEYRING_PASSWORD`                                                                                         |
| 插件包                 | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | 主机卷挂载             | 可下载插件包根目录                                                                                                  |
| 外部二进制文件         | `/usr/local/bin/`                                      | Docker 镜像            | 必须在构建时烘焙                                                                                                    |
| Node 运行时            | 容器文件系统                                           | Docker 镜像            | 每次镜像构建都会重建                                                                                                |
| OS 软件包              | 容器文件系统                                           | Docker 镜像            | 不要在运行时安装                                                                                                    |
| Docker 容器            | 临时                                                   | 可重启                 | 可以安全销毁                                                                                                        |

## 更新

在 VM 上更新 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相关

- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)
- [ClawDock](/zh-CN/install/clawdock)

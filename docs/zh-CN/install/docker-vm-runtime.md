---
read_when:
    - 你正在使用 Docker 在云 VM 上部署 OpenClaw
    - 你需要共享二进制构建、持久化和更新流程
summary: 共享 Docker VM 运行时步骤，用于长期运行的 OpenClaw Gateway 网关主机
title: Docker VM 运行时
x-i18n:
    generated_at: "2026-05-01T20:38:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

基于 VM 的 Docker 安装的共享运行时步骤，例如 GCP、Hetzner 和类似 VPS 提供商。

## 将必需的二进制文件烘焙进镜像

在运行中的容器里安装二进制文件是一个陷阱。
任何在运行时安装的内容都会在重启后丢失。

Skills 所需的所有外部二进制文件都必须在镜像构建时安装。

下面的示例仅展示三个常见二进制文件：

- `gog`（来自 `gogcli`）用于 Gmail 访问
- `goplaces` 用于 Google Places
- `wacli` 用于 WhatsApp

这些是示例，不是完整列表。
你可以使用相同模式按需安装任意数量的二进制文件。

如果之后添加依赖额外二进制文件的新 Skills，你必须：

1. 更新 Dockerfile
2. 重新构建镜像
3. 重启容器

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
上面的 URL 是示例。对于基于 ARM 的 VM，选择 `arm64` 资产。为了实现可复现构建，请固定带版本的发布 URL。
</Note>

## 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果构建在 `pnpm install --frozen-lockfile` 期间失败并显示 `Killed` 或 `exit code 137`，说明 VM 内存不足。
请先使用更大的机器规格，再重试。

验证二进制文件：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

预期输出：

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

验证 Gateway 网关：

```bash
docker compose logs -f openclaw-gateway
```

预期输出：

```
[gateway] listening on ws://0.0.0.0:18789
```

## 哪些内容持久化在哪里

OpenClaw 在 Docker 中运行，但 Docker 不是事实来源。
所有长期存在的状态都必须能在重启、重新构建和系统重启后保留。

| 组件                | 位置                                                   | 持久化机制             | 备注                                                          |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| Gateway 网关配置    | `/home/node/.openclaw/`                                | 主机卷挂载             | 包含 `openclaw.json`、`.env`                                  |
| 模型认证配置文件    | `/home/node/.openclaw/agents/`                         | 主机卷挂载             | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API keys） |
| Skill 配置          | `/home/node/.openclaw/skills/`                         | 主机卷挂载             | Skill 级状态                                                  |
| Agent 工作区        | `/home/node/.openclaw/workspace/`                      | 主机卷挂载             | 代码和 agent 工件                                             |
| WhatsApp 会话       | `/home/node/.openclaw/`                                | 主机卷挂载             | 保留二维码登录                                                |
| Gmail 密钥环        | `/home/node/.openclaw/`                                | 主机卷 + 密码          | 需要 `GOG_KEYRING_PASSWORD`                                   |
| 插件包              | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | 主机卷挂载             | 可下载插件包根目录                                            |
| 外部二进制文件      | `/usr/local/bin/`                                      | Docker 镜像            | 必须在构建时烘焙进去                                          |
| Node 运行时         | 容器文件系统                                           | Docker 镜像            | 每次镜像构建时重新构建                                        |
| OS 软件包           | 容器文件系统                                           | Docker 镜像            | 不要在运行时安装                                              |
| Docker 容器         | 临时                                                   | 可重启                 | 可以安全销毁                                                  |

## 更新

要更新 VM 上的 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)
- [ClawDock](/zh-CN/install/clawdock)

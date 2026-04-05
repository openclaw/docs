---
read_when:
    - 你正在使用 Docker 在云 VM 上部署 OpenClaw
    - 你需要共享的二进制文件烘焙、持久化和更新流程
summary: 用于长期运行 OpenClaw Gateway 网关主机的共享 Docker VM 运行时步骤
title: Docker VM Runtime
x-i18n:
    generated_at: "2026-04-05T08:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Docker VM Runtime

适用于基于 VM 的 Docker 安装的共享运行时步骤，例如 GCP、Hetzner 及类似的 VPS 提供商。

## 将所需二进制文件烘焙进镜像

在正在运行的容器内安装二进制文件是一个陷阱。
任何在运行时安装的内容，重启后都会丢失。

Skills 所需的所有外部二进制文件都必须在镜像构建时安装。

下面的示例仅展示三个常见二进制文件：

- 用于 Gmail 访问的 `gog`
- 用于 Google Places 的 `goplaces`
- 用于 WhatsApp 的 `wacli`

这些只是示例，不是完整清单。
你可以使用相同的模式安装所需的任意数量二进制文件。

如果你之后添加了依赖额外二进制文件的新 Skills，你必须：

1. 更新 Dockerfile
2. 重建镜像
3. 重启容器

**Dockerfile 示例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

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
上面的下载 URL 适用于 x86_64（amd64）。对于基于 ARM 的 VM（例如 Hetzner ARM、GCP Tau T2A），请将下载 URL 替换为各工具发布页面中对应的 ARM64 变体。
</Note>

## 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果构建在 `pnpm install --frozen-lockfile` 期间因 `Killed` 或 `exit code 137` 失败，则说明 VM 内存不足。
请先改用更大的机器规格后再重试。

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

## 哪些内容持久化，存在哪里

OpenClaw 在 Docker 中运行，但 Docker 不是事实来源。
所有长期状态都必须能够在重启、重建和重启系统后继续保留。

| Component | Location | Persistence mechanism | Notes |
| --------- | -------- | --------------------- | ----- |
| Gateway 网关配置 | `/home/node/.openclaw/` | 主机卷挂载 | 包括 `openclaw.json`、`.env` |
| 模型认证配置档案 | `/home/node/.openclaw/agents/` | 主机卷挂载 | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API keys） |
| Skill 配置 | `/home/node/.openclaw/skills/` | 主机卷挂载 | Skill 级状态 |
| 智能体工作区 | `/home/node/.openclaw/workspace/` | 主机卷挂载 | 代码和智能体产物 |
| WhatsApp 会话 | `/home/node/.openclaw/` | 主机卷挂载 | 保留 QR 登录状态 |
| Gmail keyring | `/home/node/.openclaw/` | 主机卷 + password | 需要 `GOG_KEYRING_PASSWORD` |
| 外部二进制文件 | `/usr/local/bin/` | Docker 镜像 | 必须在构建时烘焙进去 |
| Node 运行时 | 容器文件系统 | Docker 镜像 | 每次构建镜像都会重建 |
| OS 软件包 | 容器文件系统 | Docker 镜像 | 不要在运行时安装 |
| Docker 容器 | 临时性的 | 可重启 | 可安全销毁 |

## 更新

要在 VM 上更新 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

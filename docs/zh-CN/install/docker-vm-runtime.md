---
read_when:
    - 你正在使用 Docker 在云 VM 上部署 OpenClaw
    - 你需要共享二进制文件的构建、持久化和更新流程
summary: 长期运行的 OpenClaw Gateway 网关主机的共享 Docker VM 运行时步骤
title: Docker 虚拟机运行时
x-i18n:
    generated_at: "2026-04-28T11:56:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1561022cea1e8534f55942186def31d2cb11ab554351b0bf1d9b5940ad6458b
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

基于 VM 的 Docker 安装（例如 GCP、Hetzner 和类似 VPS 提供商）的共享运行时步骤。

## 将必需二进制文件烘焙到镜像中

在运行中的容器内安装二进制文件是一个陷阱。
任何在运行时安装的内容都会在重启后丢失。

Skills 所需的所有外部二进制文件都必须在镜像构建时安装。

下面的示例仅展示三个常见二进制文件：

- 用于 Gmail 访问的 `gog`
- 用于 Google Places 的 `goplaces`
- 用于 WhatsApp 的 `wacli`

这些只是示例，不是完整列表。
你可以用相同模式安装所需的任意数量二进制文件。

如果之后添加依赖其他二进制文件的新 Skills，你必须：

1. 更新 Dockerfile
2. 重新构建镜像
3. 重启容器

**示例 Dockerfile**

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
上面的下载 URL 适用于 x86_64 (amd64)。对于基于 ARM 的 VM（例如 Hetzner ARM、GCP Tau T2A），请将下载 URL 替换为每个工具发布页面中的相应 ARM64 变体。
</Note>

## 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果构建在 `pnpm install --frozen-lockfile` 期间因 `Killed` 或 `exit code 137` 失败，说明 VM 内存不足。
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

## 持久化内容的位置

OpenClaw 在 Docker 中运行，但 Docker 不是事实来源。
所有长期状态都必须能在重启、重建和重新开机后保留下来。

| 组件                | 位置                                     | 持久化机制             | 备注                                                          |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway 网关配置    | `/home/node/.openclaw/`                  | 主机卷挂载             | 包含 `openclaw.json`、`.env`                                  |
| 模型认证配置文件    | `/home/node/.openclaw/agents/`           | 主机卷挂载             | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API 密钥） |
| Skills 配置         | `/home/node/.openclaw/skills/`           | 主机卷挂载             | Skill 级状态                                                  |
| Agent 工作区        | `/home/node/.openclaw/workspace/`        | 主机卷挂载             | 代码和智能体制品                                              |
| WhatsApp 会话       | `/home/node/.openclaw/`                  | 主机卷挂载             | 保留二维码登录                                                |
| Gmail 密钥环        | `/home/node/.openclaw/`                  | 主机卷 + 密码          | 需要 `GOG_KEYRING_PASSWORD`                                   |
| 插件运行时依赖      | `/var/lib/openclaw/plugin-runtime-deps/` | Docker 命名卷          | 生成的内置插件依赖和运行时镜像                                |
| 外部二进制文件      | `/usr/local/bin/`                        | Docker 镜像            | 必须在构建时烘焙                                              |
| Node 运行时         | 容器文件系统                             | Docker 镜像            | 每次镜像构建都会重建                                          |
| OS 包               | 容器文件系统                             | Docker 镜像            | 不要在运行时安装                                              |
| Docker 容器         | 临时                                     | 可重启                 | 可以安全销毁                                                  |

## 更新

要在 VM 上更新 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相关

- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)
- [ClawDock](/zh-CN/install/clawdock)

---
read_when:
    - 你正在使用 Docker 将 OpenClaw 部署到云端虚拟机上
    - 你需要共享的二进制文件烘焙、持久化和更新流程
summary: 面向长期运行 OpenClaw Gateway 网关主机的共享 Docker 虚拟机运行时步骤
title: Docker 虚拟机运行时
x-i18n:
    generated_at: "2026-07-11T20:35:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

适用于基于虚拟机的 Docker 安装（例如 GCP、Hetzner 和类似 VPS 提供商）的共享运行时步骤。

## 将所需二进制文件内置到镜像中

在运行中的容器内安装二进制文件是个陷阱：运行时安装的任何内容都会在重启后丢失。请在构建时将 Skills 所需的每个外部二进制文件都内置到镜像中。

以下示例仅涵盖三个二进制文件，按字母顺序排列：

- `gog`（来自 `gogcli`），用于访问 Gmail
- `goplaces`，用于 Google Places
- `wacli`，用于 WhatsApp

这些只是示例，并非完整列表。请使用相同模式安装你的 Skills 所需的所有二进制文件。如果你以后添加的 Skill 需要新的二进制文件：

1. 更新 Dockerfile。
2. 重新构建镜像。
3. 重启容器。

**Dockerfile 示例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 示例二进制文件 1：Gmail CLI（gogcli — 安装为 `gog`）
# 从 https://github.com/steipete/gogcli/releases 复制当前 Linux 资源 URL
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# 示例二进制文件 2：Google Places CLI
# 从 https://github.com/steipete/goplaces/releases 复制当前 Linux 资源 URL
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# 示例二进制文件 3：WhatsApp CLI
# 从 https://github.com/steipete/wacli/releases 复制当前 Linux 资源 URL
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# 使用相同模式在下方添加更多二进制文件

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
以上 URL 仅为示例。对于基于 ARM 的虚拟机，请选择 `arm64` 资源。若要实现可复现构建，请固定到带版本号的发布 URL。
</Note>

## 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果在执行 `pnpm install --frozen-lockfile` 期间构建因 `Killed` 或退出代码 137 而失败，说明虚拟机内存不足。请改用更大的机器类型后再重试。

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

`/healthz` 返回 200 响应即表示 Gateway 网关进程正在监听且运行状况良好；镜像内置的 `HEALTHCHECK` 会轮询同一端点。

## 各类数据的持久化位置

OpenClaw 在 Docker 中运行，但 Docker 并非数据的权威来源。所有长期状态都必须能够在重启、重新构建和系统重启后保留。

| 组件                   | 位置                                                   | 持久化机制             | 说明                                                                                                                |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Gateway 配置           | `/home/node/.openclaw/`                                | 主机卷挂载             | 包含 `openclaw.json`                                                                                                |
| 渠道/提供商凭据        | `/home/node/.openclaw/credentials/`                    | 主机卷挂载             | 渠道和提供商凭据材料                                                                                                |
| 模型身份验证配置文件   | `/home/node/.openclaw/agents/`                         | 主机卷挂载             | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API 密钥）                                                       |
| 旧版 OAuth 密钥文件    | `/home/node/.config/openclaw/`                         | 主机卷挂载             | 为迁移前的 OAuth 辅助文件提供只读兼容；`openclaw doctor --fix` 会将其迁移到 `auth-profiles.json`                     |
| Skill 配置             | `/home/node/.openclaw/skills/`                         | 主机卷挂载             | Skill 级状态                                                                                                        |
| Agent 工作区           | `/home/node/.openclaw/workspace/`                      | 主机卷挂载             | 代码和 Agent 产物                                                                                                   |
| WhatsApp 会话          | `/home/node/.openclaw/`                                | 主机卷挂载             | 保留二维码登录状态                                                                                                  |
| Gmail 密钥环           | `/home/node/.openclaw/`                                | 主机卷 + 密码          | 需要 `GOG_KEYRING_PASSWORD`                                                                                         |
| 插件包                 | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | 主机卷挂载             | 可下载插件包的根目录                                                                                                |
| 外部二进制文件         | `/usr/local/bin/`                                      | Docker 镜像            | 必须在构建时内置                                                                                                    |
| Node 运行时            | 容器文件系统                                           | Docker 镜像            | 每次构建镜像时重新构建                                                                                              |
| 操作系统软件包         | 容器文件系统                                           | Docker 镜像            | 不要在运行时安装                                                                                                    |
| Docker 容器            | 临时                                                   | 可重启                 | 可安全销毁                                                                                                          |

## 更新

要更新虚拟机上的 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)
- [ClawDock](/zh-CN/install/clawdock)

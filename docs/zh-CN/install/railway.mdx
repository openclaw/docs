---
read_when:
    - 将 OpenClaw 部署到 Railway
    - 你希望通过基于浏览器的 Control UI 进行一键云部署
summary: 通过一键模板在 Railway 上部署 OpenClaw
title: Railway
x-i18n:
    generated_at: "2026-04-23T06:41:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Railway

通过一键模板在 Railway 上部署 OpenClaw，并通过网页 Control UI 访问它。
这是最简单的“服务器上无需终端”路径：Railway 会为你运行 Gateway 网关。

## 快速检查清单（新用户）

1. 点击**在 Railway 上部署**（见下方）。
2. 添加一个挂载到 `/data` 的 **Volume**。
3. 设置所需的**变量**（至少包括 `OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_GATEWAY_TOKEN`）。
4. 在端口 `8080` 上启用 **HTTP Proxy**。
5. 打开 `https://<your-railway-domain>/openclaw`，并使用已配置的共享密钥连接。此模板默认使用 `OPENCLAW_GATEWAY_TOKEN`；如果你将其替换为密码认证，请改用该密码。

## 一键部署

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  在 Railway 上部署
</a>

部署后，在 **Railway → 你的服务 → Settings → Domains** 中找到你的公开 URL。

Railway 会：

- 提供一个自动生成的域名（通常为 `https://<something>.up.railway.app`），或
- 如果你已绑定自定义域名，则使用你的自定义域名。

然后打开：

- `https://<your-railway-domain>/openclaw` — Control UI

## 你将获得

- 托管的 OpenClaw Gateway 网关 + Control UI
- 通过 Railway Volume（`/data`）提供的持久化存储，因此 `openclaw.json`、
  每个智能体的 `auth-profiles.json`、渠道/提供商状态、会话以及
  工作区都能在重新部署后继续保留

## 必需的 Railway 设置

### 公共网络

为该服务启用 **HTTP Proxy**。

- 端口：`8080`

### Volume（必需）

挂载一个卷到：

- `/data`

### 变量

在该服务上设置以下变量：

- `OPENCLAW_GATEWAY_PORT=8080`（必需——必须与公共网络中的端口一致）
- `OPENCLAW_GATEWAY_TOKEN`（必需；请将其视为管理员密钥）
- `OPENCLAW_STATE_DIR=/data/.openclaw`（推荐）
- `OPENCLAW_WORKSPACE_DIR=/data/workspace`（推荐）

## 连接一个渠道

使用位于 `/openclaw` 的 Control UI，或通过 Railway 的 shell 运行 `openclaw onboard` 获取渠道设置说明：

- [Telegram](/zh-CN/channels/telegram)（最快——只需一个 bot token）
- [Discord](/zh-CN/channels/discord)
- [所有渠道](/zh-CN/channels)

## 备份与迁移

导出你的状态、配置、认证配置文件和工作区：

```bash
openclaw backup create
```

这会创建一个可移植的备份归档，其中包含 OpenClaw 状态以及任何已配置的
工作区。详情请参见 [Backup](/zh-CN/cli/backup)。

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway configuration](/zh-CN/gateway/configuration)
- 让 OpenClaw 保持最新：[Updating](/zh-CN/install/updating)

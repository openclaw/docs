---
read_when:
    - 将 OpenClaw 部署到 Railway
    - 你希望一键部署到云端，并使用基于浏览器的 Control UI
summary: 使用一键式模板在 Railway 上部署 OpenClaw
title: Railway
x-i18n:
    generated_at: "2026-07-11T20:41:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

在 Railway 上使用一键式模板部署 OpenClaw，并通过 Web Control UI 访问它。这是最简单的“服务器上无需终端”方案：Railway 会为你运行 Gateway 网关。

## 一键部署

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

<Steps>
  <Step title="部署模板">
    点击上方的 **Deploy on Railway**。
  </Step>

<Step title="添加卷">
  挂载一个挂载点为 `/data` 的卷（持久化状态所必需）。
</Step>

  <Step title="设置变量">
    在服务上设置所需的 **Variables**：

    - `OPENCLAW_GATEWAY_PORT=8080`（必需——必须与 Public Networking 中的端口一致）
    - `OPENCLAW_GATEWAY_TOKEN`（必需；将其视为管理员密钥）
    - `OPENCLAW_STATE_DIR=/data/.openclaw`（推荐）
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace`（推荐）

  </Step>

<Step title="启用公共网络">
  在 **Public Networking** 下，为服务的 `8080` 端口启用 **HTTP Proxy**。
</Step>

  <Step title="连接">
    在 **Railway -> your service -> Settings -> Domains** 中找到你的公共 URL——可以是生成的域名（通常为 `https://<something>.up.railway.app`），也可以是你绑定的自定义域名。

    打开 `https://<your-railway-domain>/openclaw`，并使用已配置的共享密钥进行连接。模板默认使用 `OPENCLAW_GATEWAY_TOKEN`；如果你将其替换为密码身份验证，请改用该密码。

  </Step>
</Steps>

## 你将获得

- 托管的 OpenClaw Gateway 网关和 Control UI
- 通过 Railway 卷（`/data`）实现持久化存储，因此 `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态、会话和工作区在重新部署后仍会保留

## 连接渠道

使用 `/openclaw` 路径下的 Control UI，或通过 Railway 的 shell 运行 `openclaw onboard`，以获取渠道设置说明：

- [Discord](/zh-CN/channels/discord)
- [Telegram](/zh-CN/channels/telegram)（最快——只需一个 Bot 令牌）
- [所有渠道](/zh-CN/channels)

## 备份和迁移

导出你的状态、配置、身份验证配置文件和工作区：

```bash
openclaw backup create
```

此命令会创建一个便携式备份归档，其中包含 OpenClaw 状态以及任何已配置的工作区。了解详情，请参阅[备份](/zh-CN/cli/backup)。

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)
- 使 OpenClaw 保持最新：[更新](/zh-CN/install/updating)

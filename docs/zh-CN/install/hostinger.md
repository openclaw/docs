---
read_when:
    - 在 Hostinger 上设置 OpenClaw
    - 寻找适用于 OpenClaw 的托管式 VPS
    - 使用 Hostinger 一键部署 OpenClaw
summary: 在 Hostinger 上托管 OpenClaw
title: Hostinger
x-i18n:
    generated_at: "2026-07-11T20:35:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

在 [Hostinger](https://www.hostinger.com/openclaw) 上运行持久化的 OpenClaw Gateway 网关，你可以选择 **1-Click** 托管部署，也可以选择自行管理的 **VPS** 安装。

## 前置条件

- Hostinger 账户（[注册](https://www.hostinger.com/openclaw)）
- 约 5–10 分钟

## 选项 A：1-Click OpenClaw

Hostinger 负责基础设施、Docker 和自动更新。这是最快启动并运行实例的方式。

<Steps>
  <Step title="购买并启动">
    1. 在 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)中，选择 Managed OpenClaw 套餐并完成结账。

    <Note>
    结账时，你可以选择预先购买并立即集成到 OpenClaw 中的 **Ready-to-Use AI** 额度，无需其他提供商的外部账户或 API 密钥。你可以立即开始聊天。或者，也可以在设置期间提供自己的 Anthropic、OpenAI、Google Gemini 或 xAI 密钥。
    </Note>

  </Step>

  <Step title="选择消息渠道">
    选择要连接的一个或多个渠道：

    - **WhatsApp** —— 扫描设置向导中显示的二维码。
    - **Telegram** —— 粘贴来自 [BotFather](https://t.me/BotFather) 的 Bot 令牌。

  </Step>

  <Step title="完成安装">
    点击 **Finish** 部署实例。准备就绪后，从 hPanel 的 **OpenClaw Overview** 访问 OpenClaw 仪表板。
  </Step>

</Steps>

## 选项 B：在 VPS 上运行 OpenClaw

你可以更全面地控制服务器。Hostinger 通过 Docker 将 OpenClaw 部署到你的 VPS；你可以通过 hPanel 中的 **Docker Manager** 进行管理。

<Steps>
  <Step title="购买 VPS">
    1. 在 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)中，选择 OpenClaw on VPS 套餐并完成结账。

    <Note>
    结账时可以选择 **Ready-to-Use AI** 额度。这些额度已预先购买并立即集成到 OpenClaw 中，因此无需其他提供商的外部账户或 API 密钥即可开始聊天。
    </Note>

  </Step>

  <Step title="配置 OpenClaw">
    VPS 配置完成后，填写以下配置字段：

    - **Gateway token** —— 自动生成；请保存以供后续使用。
    - **WhatsApp number** —— 包含国家/地区代码的号码（可选）。
    - **Telegram bot token** —— 来自 [BotFather](https://t.me/BotFather)（可选）。
    - **API keys** —— 仅当结账时未选择 Ready-to-Use AI 额度时才需要。

  </Step>

  <Step title="启动 OpenClaw">
    点击 **Deploy**。运行后，在 hPanel 中点击 **Open**，打开 OpenClaw 仪表板。
  </Step>

</Steps>

日志、重启和更新操作均可通过 hPanel 中的 Docker Manager 界面执行。要进行更新，请在 Docker Manager 中点击 **Update** 以拉取最新镜像。

## 验证设置

在已连接的渠道上向你的助手发送“你好”。OpenClaw 会回复并引导你完成初始偏好设置。

## 故障排查

**仪表板无法加载** —— 等待几分钟，让容器完成配置，然后检查 hPanel 中的 Docker Manager 日志。

**Docker 容器不断重启** —— 打开 Docker Manager 日志，查找配置错误，例如缺少令牌或 API 密钥无效。

**Telegram Bot 无响应** —— 如果需要私信配对，未知发送者会收到一个简短的配对码，而不是回复。如果你拥有容器的 shell 访问权限，可以通过 OpenClaw 仪表板聊天批准配对，也可以运行 `openclaw pairing approve telegram <CODE>`。请参阅[配对](/zh-CN/channels/pairing)。

## 后续步骤

- [渠道](/zh-CN/channels) —— 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/zh-CN/gateway/configuration) —— 所有配置选项

## 相关内容

- [安装概览](/zh-CN/install)
- [VPS 托管](/zh-CN/vps)
- [DigitalOcean](/zh-CN/install/digitalocean)

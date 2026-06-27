---
read_when:
    - 在 Hostinger 上设置 OpenClaw
    - 正在为 OpenClaw 寻找托管型 VPS
    - 使用 Hostinger 一键部署 OpenClaw
summary: 在 Hostinger 上托管 OpenClaw
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T03:17:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
    postprocess_version: locale-links-v1
---

通过 **1-Click** 托管部署或 **VPS** 安装，在 [Hostinger](https://www.hostinger.com/openclaw) 上运行一个持久化的 OpenClaw Gateway 网关。

## 前置条件

- Hostinger 账户（[注册](https://www.hostinger.com/openclaw)）
- 大约 5 - 10 分钟

## 方案 A：1-Click OpenClaw

最快的入门方式。Hostinger 负责基础设施、Docker 和自动更新。

<Steps>
  <Step title="购买并启动">
    1. 前往 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)，选择一个 Managed OpenClaw 套餐并完成结账。

    <Note>
    在结账过程中，你可以选择 **Ready-to-Use AI** 积分，这些积分会预先购买并立即集成到 OpenClaw 中——无需其他提供商的外部账户或 API key。你可以立刻开始聊天。或者，你也可以在设置过程中提供来自 Anthropic、OpenAI、Google Gemini 或 xAI 的自有 key。
    </Note>

  </Step>

  <Step title="选择一个消息渠道">
    选择一个或多个要连接的渠道：

    - **WhatsApp** —— 扫描设置向导中显示的二维码。
    - **Telegram** —— 粘贴来自 [BotFather](https://t.me/BotFather) 的机器人 token。

  </Step>

  <Step title="完成安装">
    点击 **Finish** 以部署实例。准备就绪后，可从 hPanel 中的 **OpenClaw Overview** 访问 OpenClaw 仪表板。
  </Step>

</Steps>

## 方案 B：在 VPS 上运行 OpenClaw

你可以对服务器拥有更多控制权。Hostinger 会通过 Docker 在你的 VPS 上部署 OpenClaw，而你可通过 hPanel 中的 **Docker Manager** 进行管理。

<Steps>
  <Step title="购买 VPS">
    1. 前往 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)，选择一个 OpenClaw on VPS 套餐并完成结账。

    <Note>
    你可以在结账时选择 **Ready-to-Use AI** 积分——这些积分会预先购买并立即集成到 OpenClaw 中，因此你无需任何外部账户或其他提供商的 API key 就可以开始聊天。
    </Note>

  </Step>

  <Step title="配置 OpenClaw">
    在 VPS 配置完成后，填写以下配置字段：

    - **Gateway token** —— 自动生成；请保存以备后用。
    - **WhatsApp number** —— 带国家区号的你的号码（可选）。
    - **Telegram bot token** —— 来自 [BotFather](https://t.me/BotFather)（可选）。
    - **API keys** —— 仅当你在结账时没有选择 Ready-to-Use AI 积分时才需要。

  </Step>

  <Step title="启动 OpenClaw">
    点击 **Deploy**。运行后，在 hPanel 中点击 **Open** 打开 OpenClaw 仪表板。
  </Step>

</Steps>

日志、重启和更新都可直接在 hPanel 的 Docker Manager 界面中管理。要更新，请在 Docker Manager 中点击 **Update**，这会拉取最新镜像。

## 验证你的设置

向你已连接渠道中的助手发送 “Hi”。OpenClaw 会回复，并引导你完成初始偏好设置。

## 故障排除

**仪表板无法加载** —— 等待几分钟，让容器完成配置。在 hPanel 中检查 Docker Manager 日志。

**Docker 容器持续重启** —— 打开 Docker Manager 日志，查找配置错误（缺少 token、无效 API keys）。

**Telegram 机器人无响应** —— 直接从 Telegram 将你的配对码消息发送到 OpenClaw 聊天中，以完成连接。

## 后续步骤

- [Channels](/zh-CN/channels) —— 连接 Telegram、WhatsApp、Discord 等
- [Gateway configuration](/zh-CN/gateway/configuration) —— 所有配置选项

## 相关内容

- [Install overview](/zh-CN/install)
- [VPS hosting](/zh-CN/vps)
- [DigitalOcean](/zh-CN/install/digitalocean)

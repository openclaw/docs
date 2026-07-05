---
read_when:
    - 在 Hostinger 上设置 OpenClaw
    - 正在寻找用于 OpenClaw 的托管 VPS
    - 使用 Hostinger 一键安装 OpenClaw
summary: 在 Hostinger 上托管 OpenClaw
title: Hostinger
x-i18n:
    generated_at: "2026-07-05T11:23:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

在 [Hostinger](https://www.hostinger.com/openclaw) 上运行一个持久的 OpenClaw Gateway 网关，可以使用 **1-Click** 托管部署，也可以使用你自行管理的 **VPS** 安装。

## 前提条件

- Hostinger 账户（[注册](https://www.hostinger.com/openclaw)）
- 大约 5-10 分钟

## 选项 A：1-Click OpenClaw

Hostinger 负责基础设施、Docker 和自动更新。这是获得可运行实例的最快路径。

<Steps>
  <Step title="购买并启动">
    1. 从 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)选择 Managed OpenClaw 方案并完成结账。

    <Note>
    结账期间，你可以选择已预购并即时集成到 OpenClaw 内部的**即用型 AI**额度，无需其他提供商的外部账户或 API 密钥。你可以立即开始聊天。也可以在设置期间提供你自己的 Anthropic、OpenAI、Google Gemini 或 xAI 密钥。
    </Note>

  </Step>

  <Step title="选择消息渠道">
    选择一个或多个要连接的渠道：

    - **WhatsApp** -- 扫描设置向导中显示的二维码。
    - **Telegram** -- 粘贴来自 [BotFather](https://t.me/BotFather) 的 bot 令牌。

  </Step>

  <Step title="完成安装">
    点击**完成**以部署实例。准备就绪后，可从 hPanel 中的 **OpenClaw 概览**访问 OpenClaw 仪表板。
  </Step>

</Steps>

## 选项 B：VPS 上的 OpenClaw

对服务器有更多控制权。Hostinger 会通过 Docker 在你的 VPS 上部署 OpenClaw；你通过 hPanel 中的 **Docker Manager** 管理它。

<Steps>
  <Step title="购买 VPS">
    1. 从 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)选择 OpenClaw on VPS 方案并完成结账。

    <Note>
    结账期间，你可以选择**即用型 AI**额度 -- 这些额度已预购并即时集成到 OpenClaw 内部，因此你无需其他提供商的任何外部账户或 API 密钥即可开始聊天。
    </Note>

  </Step>

  <Step title="配置 OpenClaw">
    VPS 预置完成后，填写配置字段：

    - **Gateway 网关令牌** -- 自动生成；保存下来以备后用。
    - **WhatsApp 号码** -- 带国家/地区代码的你的号码（可选）。
    - **Telegram bot 令牌** -- 来自 [BotFather](https://t.me/BotFather)（可选）。
    - **API 密钥** -- 仅当你在结账期间未选择即用型 AI 额度时需要。

  </Step>

  <Step title="启动 OpenClaw">
    点击**部署**。运行后，在 hPanel 中点击**打开**以打开 OpenClaw 仪表板。
  </Step>

</Steps>

日志、重启和更新都通过 hPanel 中的 Docker Manager 界面执行。要更新，请在 Docker Manager 中按**更新**以拉取最新镜像。

## 验证你的设置

在你连接的渠道上向你的助手发送“你好”。OpenClaw 会回复并引导你完成初始偏好设置。

## 故障排查

**仪表板未加载** -- 等待几分钟，让容器完成预置，然后在 hPanel 中检查 Docker Manager 日志。

**Docker 容器持续重启** -- 打开 Docker Manager 日志并查找配置错误（缺少令牌、API 密钥无效）。

**Telegram bot 无响应** -- 如果需要私信配对，未知发送者会收到一个简短的配对码，而不是回复。请从 OpenClaw 仪表板聊天中批准它，或者如果你有容器的 shell 访问权限，请使用 `openclaw pairing approve telegram <CODE>`。参见[配对](/zh-CN/channels/pairing)。

## 后续步骤

- [Channels](/zh-CN/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/zh-CN/gateway/configuration) -- 所有配置选项

## 相关

- [安装概览](/zh-CN/install)
- [VPS 托管](/zh-CN/vps)
- [DigitalOcean](/zh-CN/install/digitalocean)

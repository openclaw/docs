---
read_when:
    - 你想通过 Twilio 将 OpenClaw 连接到 SMS
    - 你需要 SMS 网络钩子或白名单设置
summary: Twilio SMS 渠道设置、访问控制和网络钩子配置
title: SMS
x-i18n:
    generated_at: "2026-06-27T01:26:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw 可以通过 Twilio 电话号码或 Messaging Service 接收和发送 SMS。Gateway 网关会注册入站 webhook 路由，默认验证 Twilio 请求签名，并通过 Twilio 的 Messages API 发回回复。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    SMS 的默认私信策略是配对。
  </Card>
  <Card title="Gateway 网关安全" icon="shield" href="/zh-CN/gateway/security">
    查看 webhook 暴露和发送方访问控制。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
  </Card>
</CardGroup>

## 开始之前

你需要：

- 已使用 `openclaw plugins install @openclaw/sms` 安装官方 SMS 插件。
- 一个 Twilio 账户，并带有支持 SMS 的电话号码，或一个 Twilio Messaging Service。
- Twilio Account SID 和 Auth Token。
- 一个可以访问你的 OpenClaw Gateway 网关的公开 HTTPS URL。
- 一个发送方策略选择：`pairing` 用于私人使用，`allowlist` 用于预先批准的电话号码，或仅在有意公开 SMS 访问时使用 `open`。

如果号码同时具备 SMS 和语音通话能力，请将同一个 Twilio 号码同时用于 SMS 和 Voice Call。在 Twilio 中分别配置 SMS webhook 和 Voice webhook；本页只介绍 SMS webhook。

## 快速设置

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="创建或选择 Twilio 发送方">
    在 Twilio 中，打开 **Phone Numbers > Manage > Active numbers** 并选择一个支持 SMS 的号码。保存：

    - Account SID，例如 `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 发送方电话号码，例如 `+15551234567`

    如果你使用 Messaging Service 而不是固定发送方号码，请保存 Messaging Service SID，例如 `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="配置 SMS 渠道">

将以下内容保存为 `sms.patch.json5` 并修改占位符：

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

应用它：

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="将 Twilio 指向 Gateway 网关 webhook">
    在 Twilio 电话号码设置中，打开 **Messaging** 并将 **A message comes in** 设置为：

```text
https://gateway.example.com/webhooks/sms
```

    使用 HTTP `POST`。默认本地路径是 `/webhooks/sms`；如果你需要不同路由，请更改 `channels.sms.webhookPath`。

  </Step>

  <Step title="暴露准确的 SMS webhook 路径">
    你的公开 URL 必须将 SMS 路径路由到 Gateway 网关进程。如果你使用 Tailscale Funnel 进行本地测试，请显式暴露 `/webhooks/sms`：

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call 和 SMS 使用不同的 webhook 路径。如果同一个 Twilio 号码同时处理两者，请在 Twilio 和你的隧道中保持两个路由都已配置。

  </Step>

  <Step title="启动 Gateway 网关并批准第一个发送方">

```bash
openclaw gateway
```

向 Twilio 号码发送一条短信。第一条消息会创建一个配对请求。批准它：

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    配对码会在 1 小时后过期。

  </Step>
</Steps>

## 配置示例

### 配置文件

当你希望渠道定义随 Gateway 网关配置一起移动时，请使用配置文件设置：

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### 环境变量

对于密钥来自主机环境的单账户部署，请使用环境变量设置：

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

然后在配置中启用该渠道：

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

`TWILIO_SMS_FROM` 可作为 `TWILIO_PHONE_NUMBER` 的别名。当 Twilio 应从 Messaging Service 中选择发送方时，请使用 `TWILIO_MESSAGING_SERVICE_SID` 而不是电话号码发送方。

### SecretRef 认证令牌

`authToken` 可以是 SecretRef。当 Gateway 网关应从 OpenClaw 密钥运行时解析 Twilio Auth Token，而不是存储明文配置时，请使用此方式：

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

引用的环境变量或密钥提供商必须对 Gateway 网关运行时可见。更改主机环境变量后，请重启托管的 Gateway 网关进程。

### 仅允许列表的私人号码

当只有已知电话号码应能与智能体对话时，请使用 `allowlist`：

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

### Messaging Service 发送方

当 Twilio 应通过 Messaging Service 选择发送方时，请使用 `messagingServiceSid` 而不是 `fromNumber`：

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

如果在配置和环境变量解析后同时存在 `fromNumber` 和 `messagingServiceSid`，则会使用 `fromNumber`。

### 默认出站目标

当自动化或智能体发起的投递在发送流程省略显式目标时应有默认目的地，请设置 `defaultTo`：

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## 访问控制

`channels.sms.dmPolicy` 控制直接 SMS 访问：

- `pairing`（默认）
- `allowlist`（要求 `allowFrom` 中至少有一个发送方）
- `open`（要求 `allowFrom` 包含 `"*"`）
- `disabled`

`allowFrom` 条目应为 E.164 电话号码，例如 `+15551234567`。`sms:` 前缀会被接受并规范化。对于私人助手，建议使用带有显式电话号码的 `dmPolicy: "allowlist"`。

## 发送 SMS

出站 SMS 目标使用 `sms:` 服务前缀，并选择 SMS 渠道：

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

当渠道选择是隐式的，`twilio-sms:+15551234567` 会选择此渠道，而不会接管 iMessage 使用的现有渠道所有的 `sms:` 服务前缀。

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI 要求显式 `--target`。`defaultTo` 用于自动化和智能体发起的投递路径，其中目标可从渠道配置解析。

来自入站 SMS 对话的智能体回复会自动通过配置的 Twilio 发送方返回给发送方。

SMS 输出是纯文本。OpenClaw 会去除 markdown，展平围栏代码块，保留可读链接，并在通过 Twilio 发送前对长回复进行分块。

## 验证设置

Gateway 网关启动后：

1. 确认 Gateway 网关日志显示 SMS webhook 路由。
2. 运行 Twilio 侧探测：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 从你的手机向 Twilio 号码发送 SMS。
4. 运行 `openclaw pairing list sms`。
5. 使用 `openclaw pairing approve sms <CODE>` 批准配对码。
6. 再发送一条 SMS 并确认智能体回复。

对于仅出站测试，请使用：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### 从 macOS iMessage/SMS 进行端到端测试

在可以通过 Messages 发送运营商 SMS 的 Mac 上，你可以使用 `imsg` 驱动发送方，而无需触碰手机：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

第一条消息应创建配对请求。第二条消息应通过 Twilio 收到智能体回复。

## Webhook 安全

默认情况下，OpenClaw 使用 `publicWebhookUrl` 和 `authToken` 验证 `X-Twilio-Signature`。请保持 `publicWebhookUrl` 与 Twilio 中配置的 URL 逐字节一致，包括 scheme、host、path 和 query string。

仅用于本地隧道测试时，你可以设置：

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

不要在公开 Gateway 网关上使用已禁用的签名验证。

## 多账户配置

当你运营多个 Twilio 号码时，请使用 `accounts`：

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

每个账户都应使用不同的 `webhookPath`。

## 故障排除

### Twilio 返回 403 或 OpenClaw 拒绝 webhook

检查 `publicWebhookUrl` 是否与 Twilio 中配置的 URL 完全匹配，包括 scheme、host、path 和 query string。Twilio 会对公开 URL 字符串签名，因此代理重写和备用主机名可能会破坏签名验证。

### 没有出现配对请求

检查 Twilio 号码的 **Messaging** webhook URL 和方法。它必须指向 SMS webhook URL 并使用 `POST`。还要确认 Gateway 网关可从公网或通过你的隧道访问。

如果 Twilio 消息日志显示错误 `11200`，说明 Twilio 已接受入站 SMS，但无法访问你的 webhook。检查：

- Twilio **Messaging > A message comes in** 指向 `publicWebhookUrl`。
- 方法是 `POST`。
- 隧道或反向代理暴露准确的 `webhookPath`；对于 Tailscale Funnel，运行 `tailscale funnel status` 并确认列出了 `/webhooks/sms`。
- `publicWebhookUrl` 使用与 Twilio 发送的一致的 scheme、host、path 和 query string，这样签名验证才能复现已签名的 URL。

### 出站发送失败

确认 `accountSid`、`authToken`，以及 `fromNumber` 或 `messagingServiceSid` 已解析。如果你使用试用版 Twilio 账户，则可能需要先在 Twilio 中验证目标号码，才能发送出站 SMS。

### 消息已到达但智能体没有回答

检查 `dmPolicy` 和 `allowFrom`。使用默认的 `pairing` 策略时，必须先批准发送者，才会处理正常的智能体轮次。

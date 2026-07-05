---
read_when:
    - 你想通过 Twilio 将 OpenClaw 连接到 SMS
    - 你需要 SMS webhook 或 allowlist 设置
summary: Twilio SMS 渠道设置、访问控制和 Webhook 配置
title: SMS
x-i18n:
    generated_at: "2026-07-05T11:04:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee82f9d5a18309e1ccdf341fb78440926f8f2c4bbd00249ad4ab5ce4532c61d
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw 通过 Twilio 电话号码或 Messaging Service 接收和发送 SMS。Gateway 网关会注册一个入站 webhook 路由（默认 `/webhooks/sms`），默认验证 Twilio 请求签名，并通过 Twilio 的 Messages API 发回回复。

状态：官方插件，需单独安装。仅文本：不支持 MMS/媒体，仅支持私信。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    SMS 的默认私信策略是配对。
  </Card>
  <Card title="Gateway 安全" icon="shield" href="/zh-CN/gateway/security">
    检查 webhook 暴露和发送者访问控制。
  </Card>
  <Card title="渠道故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
  </Card>
</CardGroup>

## 开始之前

你需要：

- 使用 `openclaw plugins install @openclaw/sms` 安装官方 SMS 插件。
- 一个 Twilio 账户，并带有支持 SMS 的电话号码，或一个 Twilio Messaging Service。
- Twilio Account SID 和 Auth Token。
- 一个可访问你的 OpenClaw Gateway 网关的公共 HTTPS URL。
- 一个发送者策略选择：`pairing`（默认）用于私有使用，`allowlist` 用于预先批准的电话号码，或仅在有意公开 SMS 访问时使用 `open`。

如果一个 Twilio 号码同时具备 SMS 和 [Voice Call](/zh-CN/plugins/voice-call) 功能，则可同时服务于二者。SMS webhook 和 Voice webhook 在 Twilio 中分别配置，并使用不同的 Gateway 网关路径；本页仅涵盖 SMS webhook。

## 快速设置

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="创建或选择 Twilio 发送者">
    在 Twilio 中，打开 **Phone Numbers > Manage > Active numbers** 并选择一个支持 SMS 的号码。保存：

    - Account SID，例如 `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 发送者电话号码，例如 `+15551234567`

    如果你使用 Messaging Service 而不是固定发送者号码，请保存 Messaging Service SID，例如 `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="配置 SMS 渠道">

将其保存为 `sms.patch.json5` 并更改占位符：

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
    在 Twilio 电话号码设置中，打开 **Messaging**，并将 **A message comes in** 设置为：

```text
https://gateway.example.com/webhooks/sms
```

    使用 HTTP `POST`。默认本地路径是 `/webhooks/sms`；如果需要其他路由，请更改 `channels.sms.webhookPath`。

  </Step>

  <Step title="暴露确切的 SMS webhook 路径">
    你的公共 URL 必须将 SMS 路径路由到 Gateway 网关进程（默认端口 `18789`）。如果你使用 Tailscale Funnel 进行本地测试，请显式暴露 `/webhooks/sms`：

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call 和 SMS 使用不同的 webhook 路径。如果同一个 Twilio 号码同时处理二者，请在 Twilio 和你的隧道中保持两个路由都已配置。

  </Step>

  <Step title="启动 Gateway 网关并批准第一个发送者">

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

所有键都位于 `channels.sms` 下（每个账户位于 `channels.sms.accounts.<id>` 下）：

| 键                                      | 默认值          | 用途                                                                |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | 启用或禁用渠道/账户。                                               |
| `accountSid`                            | —               | Twilio Account SID（`AC...`）。                                      |
| `authToken`                             | —               | Twilio Auth Token；明文字符串或 SecretRef。                          |
| `fromNumber`                            | —               | E.164 发送者号码。                                                   |
| `messagingServiceSid`                   | —               | 未解析到 `fromNumber` 时使用的 Messaging Service SID（`MG...`）。     |
| `defaultTo`                             | —               | 发送流程省略显式目标时的默认目标。                                  |
| `webhookPath`                           | `/webhooks/sms` | 入站 Twilio webhook 的 Gateway 网关 HTTP 路径。                      |
| `publicWebhookUrl`                      | —               | 在 Twilio 中配置的公共 URL；签名验证需要它。                        |
| `dangerouslyDisableSignatureValidation` | `false`         | 跳过 `X-Twilio-Signature` 检查；仅用于本地隧道测试。                 |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open` 或 `disabled`。                        |
| `allowFrom`                             | `[]`            | E.164 中允许的发送者号码，或配合 `dmPolicy: "open"` 使用 `"*"`。      |
| `textChunkLimit`                        | `1500`          | 每个出站 SMS 分块的最大字符数。                                     |
| `accounts`, `defaultAccount`            | —               | 多账户映射和默认账户 ID。                                           |

### 配置文件

当你希望渠道定义随 Gateway 网关配置一起传递时，请使用配置文件设置：

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

环境变量仅应用于默认账户；配置值优先于环境变量值。

| 变量                                            | 映射到                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER`（别名 `TWILIO_SMS_FROM`） | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom`（逗号分隔）                            |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation`（`"true"`） |

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

### SecretRef 认证令牌

`authToken` 可以是 SecretRef（`source: "env" | "file" | "exec"`）。当 Gateway 网关应从 OpenClaw secrets 运行时解析 Twilio Auth Token，而不是存储明文配置时，请使用此方式：

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

被引用的环境变量或密钥提供商必须对 Gateway 网关运行时可见。更改主机环境变量后，请重启托管的 Gateway 网关进程。

### Messaging Service 发送者

当 Twilio 应通过 Messaging Service 选择发送者时，请使用 `messagingServiceSid` 而不是 `fromNumber`：

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

如果在配置和环境变量解析后同时存在 `fromNumber` 和 `messagingServiceSid`，则使用 `fromNumber`。

### 默认出站目标

当自动化或由 agent 发起的投递在发送流程省略显式目标时应有默认目标，请设置 `defaultTo`：

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

`channels.sms.dmPolicy` 控制 SMS 直接访问：

- `pairing`（默认）：未知发送者会获得一个配对码；使用 `openclaw pairing approve sms <CODE>` 批准。
- `allowlist`：仅处理 `allowFrom` 中的发送者。空的 `allowFrom` 会拒绝所有发送者（Gateway 网关会记录启动警告）。
- `open`：配置验证要求 `allowFrom` 包含 `"*"`。没有通配符时，只有列出的号码可以聊天。
- `disabled`：丢弃所有入站私信。

`allowFrom` 条目应为 E.164 电话号码，例如 `+15551234567`。`sms:` 和 `twilio-sms:` 前缀会被接受并规范化。对于私人助手，建议使用带有显式电话号码的 `dmPolicy: "allowlist"`：

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

## 发送 SMS

选择 SMS 渠道后，目标接受裸 E.164 号码或 `sms:` 前缀：

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

当渠道选择是隐式的，`twilio-sms:` 前缀会选择此渠道，而不会接管 `sms:` 服务前缀；iMessage 使用该服务前缀为自己的目标选择运营商 SMS 投递：

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI 要求显式 `--target`。`defaultTo` 用于可从渠道配置解析目标的自动化和由 agent 发起的投递路径。

来自入站 SMS 对话的 agent 回复会自动通过已配置的 Twilio 发送者发回给发送者。

SMS 输出是纯文本。OpenClaw 会去除 markdown、展平围栏代码块、将链接重写为 `label (url)`，并在通过 Twilio 发送前，将长回复拆分为最多 `textChunkLimit` 个字符（默认 1500）的分块。

## 验证设置

Gateway 网关启动后：

1. 确认 Gateway 网关日志显示 SMS webhook 路由。
2. 运行 Twilio 侧探测（检查已配置的 Twilio webhook URL/方法和近期入站错误）：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 从你的手机向 Twilio 号码发送一条 SMS。
4. 运行 `openclaw pairing list sms`。
5. 使用 `openclaw pairing approve sms <CODE>` 批准配对码。
6. 再发送一条 SMS，并确认智能体会回复。

对于仅出站测试，使用：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### 从 macOS iMessage/SMS 进行端到端测试

在一台可通过 Messages 发送运营商 SMS 的 Mac 上，你可以使用 `imsg` 驱动发送方，而无需操作你的手机：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

第一条消息应创建一个配对请求。第二条消息应通过 Twilio 收到智能体回复。

## Webhook 安全

默认情况下，OpenClaw 会使用 `publicWebhookUrl` 和 `authToken` 验证 `X-Twilio-Signature`。请确保 `publicWebhookUrl` 与 Twilio 中配置的 URL 逐字节一致，包括 scheme、host、path 和 query string。

该 webhook 路由还会独立于签名验证执行以下限制：

- 仅允许 `POST`。
- 每个来源 IP 每分钟限速 30 个请求（超过后返回 HTTP 429）。
- 载荷中的 `AccountSid` 必须匹配已配置的 `accountSid`（否则返回 HTTP 403）。
- 重放的 `MessageSid` 值会在 10 分钟内去重。
- 超过 32 KB 的请求正文会被拒绝。

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

不要在公开的 Gateway 网关上使用已禁用的签名验证。

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

每个账户都必须使用不同的 `webhookPath`；如果某个路径已由另一个账户拥有，Gateway 网关会拒绝注册该 webhook 路由。`TWILIO_*`/`SMS_*` 环境变量回退仅适用于默认账户；设置 `defaultAccount` 可更改默认账户。

## 故障排查

### Twilio 返回 403 或 OpenClaw 拒绝 webhook

检查 `publicWebhookUrl` 是否与 Twilio 中配置的 URL 完全匹配，包括 scheme、host、path 和 query string。Twilio 会对公开 URL 字符串进行签名，因此代理重写和备用主机名可能会破坏签名验证。

带有 `Invalid account` 的 403 表示入站载荷的 `AccountSid` 与已配置的 `accountSid` 不匹配；请检查 webhook 是否指向拥有该号码的账户。

### 没有出现配对请求

检查 Twilio 号码的 **Messaging** webhook URL 和方法。它必须指向 SMS webhook URL，并使用 `POST`。同时确认 Gateway 网关可从公网访问，或可通过你的隧道访问。

如果 Twilio 消息日志显示错误 `11200`，说明 Twilio 已接受入站 SMS，但无法访问你的 webhook。请检查：

- Twilio **Messaging > A message comes in** 指向 `publicWebhookUrl`。
- 方法是 `POST`。
- 隧道或反向代理暴露了确切的 `webhookPath`；对于 Tailscale Funnel，请运行 `tailscale funnel status` 并确认列出了 `/webhooks/sms`。
- `publicWebhookUrl` 使用与 Twilio 发送时相同的 scheme、host、path 和 query string，因此签名验证可以复现已签名的 URL。

`openclaw channels status --channel sms --probe` 会显示不匹配的 Twilio webhook 设置和近期的 `11200` 错误。

### 出站发送失败

确认 `accountSid`、`authToken`，以及 `fromNumber` 或 `messagingServiceSid` 已解析。如果你使用的是 Twilio 试用账户，目标号码可能需要先在 Twilio 中验证后才能发送出站 SMS。

### 消息到达但智能体没有回答

检查 `dmPolicy` 和 `allowFrom`。使用默认的 `pairing` 策略时，发送方必须先获得批准，之后才会处理正常的智能体轮次。

---
read_when:
    - 你想通过 Twilio 将 OpenClaw 连接到 SMS
    - 你需要设置 SMS webhook 或允许列表
summary: Twilio SMS 渠道设置、访问控制和 Webhook 配置
title: SMS
x-i18n:
    generated_at: "2026-07-16T11:23:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw 通过 Twilio 电话号码或 Messaging Service 接收和发送 SMS。Gateway 网关会注册入站 webhook 路由（默认值为 `/webhooks/sms`），默认验证 Twilio 请求签名，并通过 Twilio 的 Messages API 发回回复。

状态：官方插件，需单独安装。仅支持文本：不支持 MMS/媒体，仅支持私信。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    SMS 的默认私信策略是配对。
  </Card>
  <Card title="Gateway 网关安全" icon="shield" href="/zh-CN/gateway/security">
    检查 webhook 暴露情况和发送者访问控制。
  </Card>
  <Card title="渠道故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
  </Card>
</CardGroup>

## 开始之前

你需要：

- 使用 `openclaw plugins install @openclaw/sms` 安装的官方 SMS 插件。
- 一个 Twilio 账户，并拥有支持 SMS 的电话号码或 Twilio Messaging Service。
- Twilio Account SID 和 Auth Token。
- 一个可访问 OpenClaw Gateway 网关的公共 HTTPS URL。
- 一种发送者策略：私用选择 `pairing`（默认），预先批准的电话号码选择 `allowlist`，仅在有意开放公共 SMS 访问时选择 `open`。

如果一个 Twilio 号码同时具备两种能力，就可以同时用于 SMS 和 [语音通话](/zh-CN/plugins/voice-call)。SMS webhook 和语音 webhook 在 Twilio 中分别配置，并使用不同的 Gateway 网关路径；本页仅介绍 SMS webhook。

## 快速设置

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="创建或选择 Twilio 发送者">
    在 Twilio 中，打开 **Phone Numbers > Manage > Active numbers**，然后选择一个支持 SMS 的号码。保存以下信息：

    - Account SID，例如 `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 发送者电话号码，例如 `+15551234567`

    如果使用 Messaging Service 而不是固定的发送者号码，请保存 Messaging Service SID，例如 `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="配置 SMS 渠道">

将以下内容保存为 `sms.patch.json5`，并更改占位符：

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

应用配置：

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

    使用 HTTP `POST`。默认本地路径为 `/webhooks/sms`；如果需要其他路由，请更改 `channels.sms.webhookPath`。

  </Step>

  <Step title="暴露准确的 SMS webhook 路径">
    你的公共 URL 必须将 SMS 路径路由到 Gateway 网关进程（默认端口为 `18789`）。如果使用 Tailscale Funnel 进行本地测试，请显式暴露 `/webhooks/sms`：

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    语音通话和 SMS 使用不同的 webhook 路径。如果同一个 Twilio 号码同时处理两者，请在 Twilio 和隧道中保留这两条路由的配置。

  </Step>

  <Step title="启动 Gateway 网关并批准第一个发送者">

```bash
openclaw gateway
```

向 Twilio 号码发送一条短信。第一条消息会创建配对请求。批准该请求：

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    配对码会在 1 小时后过期。

  </Step>
</Steps>

## 配置示例

所有键都位于 `channels.sms` 下（每个账户的键位于 `channels.sms.accounts.<id>` 下）：

| 键                                      | 默认值          | 用途                                                                |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | 启用或禁用渠道/账户。                                               |
| `accountSid`                            | —               | Twilio Account SID（`AC...`）。                                      |
| `authToken`                             | —               | Twilio Auth Token；纯文本字符串或 SecretRef。                       |
| `fromNumber`                            | —               | E.164 发送者号码。                                                   |
| `messagingServiceSid`                   | —               | 未解析出 `fromNumber` 时使用的 Messaging Service SID（`MG...`）。 |
| `defaultTo`                             | —               | 发送流程未指定明确目标时的默认目标。                                |
| `webhookPath`                           | `/webhooks/sms` | 用于 Twilio 入站 webhook 的 Gateway 网关 HTTP 路径。                 |
| `publicWebhookUrl`                      | —               | 在 Twilio 中配置的公共 URL；签名验证必需。                           |
| `dangerouslyDisableSignatureValidation` | `false`         | 跳过 `X-Twilio-Signature` 检查；仅用于本地隧道测试。                 |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open` 或 `disabled`。                    |
| `allowFrom`                             | `[]`            | E.164 格式的允许发送者号码，或将 `"*"` 与 `dmPolicy: "open"` 一起使用。 |
| `textChunkLimit`                        | `1500`          | 每个出站 SMS 分块的最大字符数。                                     |
| `accounts`、`defaultAccount`            | —               | 多账户映射和默认账户 ID。                                           |

### 配置文件

如果希望渠道定义随 Gateway 网关配置一起使用，请采用配置文件设置：

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
| `SMS_ALLOWED_USERS`                             | `allowFrom`（以逗号分隔）                         |
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

### SecretRef 身份验证令牌

`authToken` 可以是 SecretRef（`source: "env" | "file" | "exec"`）。如果 Gateway 网关应从 OpenClaw 密钥运行时解析 Twilio Auth Token，而不是在配置中以纯文本形式存储，请使用此方式：

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

### Messaging Service 发送者

当 Twilio 应通过 Messaging Service 选择发送者时，请使用 `messagingServiceSid`，而不是 `fromNumber`：

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

如果在解析配置和环境变量后，`fromNumber` 和 `messagingServiceSid` 均存在，则使用 `fromNumber`。

### 默认出站目标

当自动化或智能体发起的传递流程在未指定明确目标时需要使用默认目标，请设置 `defaultTo`：

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

`channels.sms.dmPolicy` 控制 SMS 私信访问：

- `pairing`（默认）：未知发送者会收到配对码；使用 `openclaw pairing approve sms <CODE>` 批准。
- `allowlist`：仅处理 `allowFrom` 中的发送者。空的 `allowFrom` 会拒绝所有发送者（Gateway 网关会记录启动警告）。
- `open`：配置验证要求 `allowFrom` 包含 `"*"`。如果没有通配符，则只有列出的号码可以聊天。
- `disabled`：丢弃所有入站私信。

`allowFrom` 条目应为 E.164 电话号码，例如 `+15551234567`。支持 `sms:` 和 `twilio-sms:` 前缀，并会对其进行规范化。对于私人助理，建议将 `dmPolicy: "allowlist"` 与明确的电话号码一起使用：

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

选择 SMS 渠道后，目标可以使用纯 E.164 号码或 `sms:` 前缀：

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

当渠道选择为隐式时，`twilio-sms:` 前缀会选择此渠道，而不会占用 `sms:` 服务前缀；iMessage 使用后者为自己的目标选择运营商 SMS 传递：

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI 要求显式指定 `--target`。`defaultTo` 用于可从渠道配置中解析目标的自动化和智能体发起的传递路径。

来自入站 SMS 对话的智能体回复会通过配置的 Twilio 发送方自动发回给发送者。

SMS 输出为纯文本。OpenClaw 会移除 Markdown、展平围栏代码块、将链接改写为 `label (url)`，并在通过 Twilio 发送前将长回复拆分为每段最多 `textChunkLimit` 个字符（默认 1500）的分块。

## 验证设置

Gateway 网关启动后：

1. 确认 Gateway 网关日志显示 SMS webhook 路由。
2. 运行 Twilio 端探测（检查配置的 Twilio webhook URL/方法和最近的入站错误）：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 使用手机向 Twilio 号码发送一条 SMS。
4. 运行 `openclaw pairing list sms`。
5. 使用 `openclaw pairing approve sms <CODE>` 批准配对码。
6. 再发送一条 SMS，并确认智能体作出回复。

如需仅测试出站发送，请使用：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### 从 macOS iMessage/SMS 进行端到端测试

在能够通过“信息”发送运营商 SMS 的 Mac 上，可以使用 `imsg` 驱动发送方，而无需操作手机：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

第一条消息应创建配对请求。第二条消息应通过 Twilio 收到智能体回复。

## Webhook 安全

默认情况下，OpenClaw 使用 `publicWebhookUrl` 和 `authToken` 验证 `X-Twilio-Signature`。请确保 `publicWebhookUrl` 的端点部分与 Twilio 中配置的 URL 逐字节一致，包括协议、主机、路径和查询字符串。按照 Twilio 的要求，OpenClaw 在计算签名时会排除 Twilio [连接覆盖](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides)片段（`#...`）。

除签名验证外，webhook 路由还独立实施以下限制：

- 仅限 `POST`。
- 每个 SMS 账户、webhook 路由和解析后的客户端地址每分钟最多允许 300 个失败请求。所有请求都计入此预算，但仅当请求未能通过请求体解析、Twilio 验证或 AccountSid 匹配时，才会在超出预算后应用 HTTP 429。
- 通过上述检查后，每个 SMS 账户、webhook 路由和解析后的客户端地址每分钟最多接受 30 个可分派回调（超过后返回 HTTP 429）。如果禁用签名验证，此每分钟 30 个的限制即为未经身份验证的分派上限。
- 客户端地址通过共享的 Gateway 网关可信代理规则解析。如果 `gateway.trustedProxies` 包含转发 Twilio 回调的反向代理，OpenClaw 会根据转发的客户端地址计算这些限制；否则会回退到直接套接字地址。
- 载荷中的 `AccountSid` 必须与配置的 `accountSid` 匹配（否则返回 HTTP 403）。
- 重复的 `MessageSid` 值会在 10 分钟内去重。
- 每个 SMS 账户的重放缓存最多保留 10,000 个有效消息 SID。当所有槽位均有效时，该账户的新 webhook 将以 HTTP 429 和 `Retry-After` 标头采取故障关闭方式拒绝，直到最早的槽位过期。
- 超过 32 KB 的请求体会被拒绝。

Twilio 默认不会重试 HTTP 429，也未说明支持 `Retry-After`。`#rp=4xx` 和 `#rp=all` 连接覆盖可选择启用 4xx 重试，但 Twilio 将完整重试事务限制在 15 秒内，因此重试仍可能在重放缓存槽位过期前结束。如果需要由其他处理程序接收失败的投递，请配置回退 URL；应将 429 视为故障关闭式拒绝，而不是可靠的背压机制。

仅限本地隧道测试时，可以设置：

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

不要在公共 Gateway 网关上禁用签名验证。

## 多账户配置

运营多个 Twilio 号码时，请使用 `accounts`：

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

每个账户必须使用不同的 `webhookPath`；Gateway 网关会拒绝注册路径已归其他账户所有的 webhook 路由。`TWILIO_*`/`SMS_*` 环境变量回退仅适用于默认账户；设置 `defaultAccount` 可更改默认账户。

## 故障排查

### Twilio 返回 403 或 OpenClaw 拒绝 webhook

检查 `publicWebhookUrl` 是否与 Twilio 中配置的 URL 完全匹配，包括协议、主机、路径和查询字符串。Twilio 对公共 URL 字符串进行签名，因此代理重写和备用主机名可能导致签名验证失败。

出现带有 `Invalid account` 的 403 表示入站载荷中的 `AccountSid` 与配置的 `accountSid` 不匹配；请检查 webhook 是否指向拥有该号码的账户。

### 未出现配对请求

检查 Twilio 号码的 **Messaging** webhook URL 和方法。它必须指向 SMS webhook URL，并使用 `POST`。同时确认可从公共互联网或通过隧道访问 Gateway 网关。

如果 Twilio 消息日志显示错误 `11200`，则表示 Twilio 已接受入站 SMS，但无法访问你的 webhook。请检查：

- Twilio **Messaging > A message comes in** 指向 `publicWebhookUrl`。
- 方法为 `POST`。
- 隧道或反向代理公开了完全一致的 `webhookPath`；对于 Tailscale Funnel，请运行 `tailscale funnel status` 并确认已列出 `/webhooks/sms`。
- `publicWebhookUrl` 使用与 Twilio 发送内容相同的协议、主机、路径和查询字符串，以便签名验证能够重现已签名的 URL。

`openclaw channels status --channel sms --probe` 会同时显示不匹配的 Twilio webhook 设置和最近的 `11200` 错误。

### 出站发送失败

确认 `accountSid`、`authToken` 以及 `fromNumber` 或 `messagingServiceSid` 已解析。如果使用 Twilio 试用账户，可能需要先在 Twilio 中验证目标号码，才能发送出站 SMS。

### 消息已到达，但智能体未回复

检查 `dmPolicy` 和 `allowFrom`。使用默认的 `pairing` 策略时，必须先批准发送者，才能处理正常的智能体轮次。

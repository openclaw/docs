---
read_when:
    - 你想透過 Twilio 將 OpenClaw 連接到 SMS
    - 你需要 SMS 網路鉤子或允許清單設定
summary: Twilio SMS 頻道設定、存取控制與網路鉤子設定
title: SMS
x-i18n:
    generated_at: "2026-07-05T11:04:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee82f9d5a18309e1ccdf341fb78440926f8f2c4bbd00249ad4ab5ce4532c61d
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw 透過 Twilio 電話號碼或 Messaging Service 接收與傳送 SMS。閘道會註冊傳入網路鉤子路由（預設為 `/webhooks/sms`）、預設驗證 Twilio 請求簽章，並透過 Twilio 的 Messages API 回送回覆。

狀態：官方外掛，需另行安裝。僅文字：不支援 MMS/媒體，僅支援直接訊息。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    SMS 的預設私訊政策是配對。
  </Card>
  <Card title="閘道安全性" icon="shield" href="/zh-TW/gateway/security">
    檢閱網路鉤子暴露範圍與寄件者存取控制。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復手冊。
  </Card>
</CardGroup>

## 開始之前

你需要：

- 已使用 `openclaw plugins install @openclaw/sms` 安裝官方 SMS 外掛。
- 具備可用於 SMS 的電話號碼，或 Twilio Messaging Service 的 Twilio 帳戶。
- Twilio Account SID 與 Auth Token。
- 可連到你的 OpenClaw 閘道的公開 HTTPS URL。
- 寄件者政策選擇：`pairing`（預設）用於私人使用、`allowlist` 用於預先核准的電話號碼，或僅在刻意公開 SMS 存取時使用 `open`。

只要同時具備兩種能力，一個 Twilio 號碼可同時服務 SMS 和 [語音通話](/zh-TW/plugins/voice-call)。SMS 網路鉤子與語音網路鉤子會在 Twilio 中分別設定，並使用不同的閘道路徑；本頁僅涵蓋 SMS 網路鉤子。

## 快速設定

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="建立或選擇 Twilio 寄件者">
    在 Twilio 中開啟 **Phone Numbers > Manage > Active numbers**，並選擇可用於 SMS 的號碼。儲存：

    - Account SID，例如 `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 寄件者電話號碼，例如 `+15551234567`

    如果你使用 Messaging Service 而不是固定寄件者號碼，請儲存 Messaging Service SID，例如 `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="設定 SMS 頻道">

將此儲存為 `sms.patch.json5` 並變更預留位置：

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

套用它：

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="將 Twilio 指向閘道網路鉤子">
    在 Twilio 電話號碼設定中，開啟 **Messaging** 並將 **A message comes in** 設為：

```text
https://gateway.example.com/webhooks/sms
```

    使用 HTTP `POST`。預設本機路徑是 `/webhooks/sms`；如果你需要不同路由，請變更 `channels.sms.webhookPath`。

  </Step>

  <Step title="暴露確切的 SMS 網路鉤子路徑">
    你的公開 URL 必須將 SMS 路徑路由到閘道程序（預設連接埠 `18789`）。如果你使用 Tailscale Funnel 進行本機測試，請明確暴露 `/webhooks/sms`：

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    語音通話和 SMS 使用不同的網路鉤子路徑。如果同一個 Twilio 號碼同時處理兩者，請在 Twilio 和你的通道中保持兩個路由皆已設定。

  </Step>

  <Step title="啟動閘道並核准第一位寄件者">

```bash
openclaw gateway
```

傳送文字訊息到 Twilio 號碼。第一則訊息會建立配對請求。核准它：

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>
</Steps>

## 設定範例

所有鍵都位於 `channels.sms` 下（每個帳戶則位於 `channels.sms.accounts.<id>` 下）：

| 鍵                                      | 預設            | 用途                                                                  |
| --------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `enabled`                               | `true`          | 啟用或停用頻道/帳戶。                                                 |
| `accountSid`                            | —               | Twilio Account SID (`AC...`)。                                        |
| `authToken`                             | —               | Twilio Auth Token；純文字字串或 SecretRef。                           |
| `fromNumber`                            | —               | E.164 寄件者號碼。                                                    |
| `messagingServiceSid`                   | —               | 未解析出 `fromNumber` 時使用的 Messaging Service SID (`MG...`)。      |
| `defaultTo`                             | —               | 傳送流程省略明確目標時的預設目的地。                                  |
| `webhookPath`                           | `/webhooks/sms` | 用於傳入 Twilio 網路鉤子的閘道 HTTP 路徑。                            |
| `publicWebhookUrl`                      | —               | 在 Twilio 中設定的公開 URL；簽章驗證需要它。                         |
| `dangerouslyDisableSignatureValidation` | `false`         | 略過 `X-Twilio-Signature` 檢查；僅限本機通道測試。                    |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open` 或 `disabled`。                        |
| `allowFrom`                             | `[]`            | E.164 中允許的寄件者號碼，或搭配 `dmPolicy: "open"` 的 `"*"`。        |
| `textChunkLimit`                        | `1500`          | 每個外送 SMS 分段的最大字元數。                                       |
| `accounts`, `defaultAccount`            | —               | 多帳戶對應表與預設帳戶 ID。                                           |

### 設定檔

當你希望頻道定義隨閘道設定一起保存時，請使用設定檔設定：

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

### 環境變數

環境變數只套用於預設帳戶；設定值優先於環境變數值。

| 變數                                             | 對應至                                             |
| ------------------------------------------------ | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                             | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                              | `authToken`                                        |
| `TWILIO_PHONE_NUMBER`（別名 `TWILIO_SMS_FROM`）  | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                   | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                         | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                               | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                              | `allowFrom`（逗號分隔）                            |
| `SMS_TEXT_CHUNK_LIMIT`                           | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`   | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

接著在設定中啟用頻道：

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

### SecretRef 驗證權杖

`authToken` 可以是 SecretRef (`source: "env" | "file" | "exec"`)。當閘道應從 OpenClaw 密鑰執行階段解析 Twilio Auth Token，而不是儲存純文字設定時，請使用此方式：

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

被參照的環境變數或密鑰提供者必須對閘道執行階段可見。變更主機環境變數後，請重新啟動受管理的閘道程序。

### Messaging Service 寄件者

當 Twilio 應透過 Messaging Service 選擇寄件者時，請使用 `messagingServiceSid` 而不是 `fromNumber`：

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

如果在設定和環境變數解析後同時存在 `fromNumber` 和 `messagingServiceSid`，會使用 `fromNumber`。

### 預設外送目標

當自動化或代理啟動的傳遞在傳送流程省略明確目標時應有預設目的地，請設定 `defaultTo`：

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

## 存取控制

`channels.sms.dmPolicy` 控制直接 SMS 存取：

- `pairing`（預設）：未知寄件者會取得配對碼；使用 `openclaw pairing approve sms <CODE>` 核准。
- `allowlist`：只處理 `allowFrom` 中的寄件者。空的 `allowFrom` 會拒絕每個寄件者（閘道會記錄啟動警告）。
- `open`：設定驗證要求 `allowFrom` 包含 `"*"`。若沒有萬用字元，只有列出的號碼可以聊天。
- `disabled`：所有傳入私訊都會被丟棄。

`allowFrom` 項目應為 E.164 電話號碼，例如 `+15551234567`。接受 `sms:` 和 `twilio-sms:` 前綴，並會正規化。對於私人助理，建議使用 `dmPolicy: "allowlist"` 並搭配明確電話號碼：

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

## 傳送 SMS

選取 SMS 頻道後，目標可接受裸 E.164 號碼或 `sms:` 前綴：

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

當頻道選擇為隱含時，`twilio-sms:` 前綴會選取此頻道，而不接管 `sms:` 服務前綴；iMessage 會使用該前綴為自己的目標選擇電信商 SMS 傳遞：

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

命令列介面需要明確的 `--target`。`defaultTo` 用於自動化與代理啟動的傳遞路徑，其中目標可從頻道設定解析。

來自傳入 SMS 對話的代理回覆會自動透過已設定的 Twilio 寄件者回送給寄件者。

SMS 輸出是純文字。OpenClaw 會移除 Markdown、攤平圍欄程式碼區塊、將連結改寫為 `label (url)`，並在透過 Twilio 傳送前，將長回覆分割為最多 `textChunkLimit` 個字元的分段（預設 1500）。

## 驗證設定

閘道啟動後：

1. 確認閘道日誌顯示 SMS 網路鉤子路由。
2. 執行 Twilio 端探測（檢查已設定的 Twilio 網路鉤子 URL/方法與近期傳入錯誤）：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 從你的手機傳送一則 SMS 到 Twilio 號碼。
4. 執行 `openclaw pairing list sms`。
5. 使用 `openclaw pairing approve sms <CODE>` 核准配對碼。
6. 再傳送一則 SMS，並確認代理程式會回覆。

若要進行僅限傳出的測試，請使用：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### 從 macOS iMessage/SMS 進行端對端測試

在可透過訊息傳送電信商 SMS 的 Mac 上，你可以使用 `imsg` 驅動傳送端，而不必操作手機：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

第一則訊息應建立配對請求。第二則訊息應透過 Twilio 收到代理程式回覆。

## 網路鉤子安全性

預設情況下，OpenClaw 會使用 `publicWebhookUrl` 與 `authToken` 驗證 `X-Twilio-Signature`。請讓 `publicWebhookUrl` 與 Twilio 中設定的 URL 逐位元組一致，包括 scheme、host、path 與 query string。

網路鉤子路由也會強制執行以下規則，且不受簽章驗證影響：

- 僅限 `POST`。
- 每個來源 IP 每分鐘 30 個請求的速率限制（超過則 HTTP 429）。
- 負載中的 `AccountSid` 必須符合已設定的 `accountSid`（否則 HTTP 403）。
- 重播的 `MessageSid` 值會在 10 分鐘內去重。
- 超過 32 KB 的請求本文會被拒絕。

僅限本機通道測試時，你可以設定：

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

請勿在公開閘道上停用簽章驗證。

## 多帳戶設定

當你操作多個 Twilio 號碼時，請使用 `accounts`：

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

每個帳戶都必須使用不同的 `webhookPath`；如果某個網路鉤子路由的路徑已由另一個帳戶擁有，閘道會拒絕註冊該路由。`TWILIO_*`/`SMS_*` 環境後援僅套用於預設帳戶；請設定 `defaultAccount` 來變更哪個帳戶是預設帳戶。

## 疑難排解

### Twilio 回傳 403 或 OpenClaw 拒絕網路鉤子

檢查 `publicWebhookUrl` 是否與 Twilio 中設定的 URL 完全相符，包括 scheme、host、path 與 query string。Twilio 會簽署公開 URL 字串，因此代理重寫與替代主機名稱可能會破壞簽章驗證。

帶有 `Invalid account` 的 403 表示傳入負載的 `AccountSid` 與已設定的 `accountSid` 不符；請檢查網路鉤子是否指向擁有該號碼的帳戶。

### 沒有出現配對請求

檢查 Twilio 號碼的 **Messaging** 網路鉤子 URL 與方法。它必須指向 SMS 網路鉤子 URL，並使用 `POST`。也請確認可從公開網際網路或透過你的通道連線到閘道。

如果 Twilio 訊息日誌顯示錯誤 `11200`，表示 Twilio 已接受傳入 SMS，但無法連線到你的網路鉤子。請檢查：

- Twilio **Messaging > A message comes in** 指向 `publicWebhookUrl`。
- 方法為 `POST`。
- 通道或反向代理公開了精確的 `webhookPath`；對於 Tailscale Funnel，請執行 `tailscale funnel status` 並確認已列出 `/webhooks/sms`。
- `publicWebhookUrl` 使用與 Twilio 傳送時相同的 scheme、host、path 與 query string，因此簽章驗證可以重現已簽署的 URL。

`openclaw channels status --channel sms --probe` 會顯示不相符的 Twilio 網路鉤子設定與近期的 `11200` 錯誤。

### 傳出傳送失敗

確認已解析 `accountSid`、`authToken`，以及 `fromNumber` 或 `messagingServiceSid`。如果你使用 Twilio 試用帳戶，目的地號碼可能需要先在 Twilio 中驗證，才能傳送傳出 SMS。

### 訊息已送達但代理程式沒有回覆

檢查 `dmPolicy` 與 `allowFrom`。使用預設的 `pairing` 政策時，必須先核准傳送者，才會處理一般代理程式回合。

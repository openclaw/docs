---
read_when:
    - 你想透過 Twilio 將 OpenClaw 連接到 SMS
    - 你需要設定 SMS 網路鉤子或允許清單
summary: Twilio SMS 頻道設定、存取控制與網路鉤子設定
title: SMS
x-i18n:
    generated_at: "2026-06-27T18:58:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw 可以透過 Twilio 電話號碼或 Messaging Service 接收與傳送 SMS。閘道會註冊入站網路鉤子路由，預設驗證 Twilio 請求簽章，並透過 Twilio 的 Messages API 回傳回覆。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    SMS 的預設私訊政策是配對。
  </Card>
  <Card title="閘道安全性" icon="shield" href="/zh-TW/gateway/security">
    檢閱網路鉤子暴露範圍與寄件者存取控制。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
</CardGroup>

## 開始之前

你需要：

- 已安裝官方 SMS 外掛，使用 `openclaw plugins install @openclaw/sms`。
- 具備可使用 SMS 的電話號碼，或 Twilio Messaging Service 的 Twilio 帳戶。
- Twilio Account SID 與 Auth Token。
- 可連到你的 OpenClaw 閘道的公開 HTTPS URL。
- 寄件者政策選擇：私人使用選 `pairing`、預先核准的電話號碼選 `allowlist`，或僅在有意開放公開 SMS 存取時選 `open`。

如果號碼同時具備 SMS 與 Voice Call 功能，SMS 和 Voice Call 可使用同一個 Twilio 號碼。在 Twilio 中分別設定 SMS 網路鉤子與 Voice 網路鉤子；本頁只涵蓋 SMS 網路鉤子。

## 快速設定

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="建立或選擇 Twilio 寄件者">
    在 Twilio 中開啟 **Phone Numbers > Manage > Active numbers**，並選擇可使用 SMS 的號碼。儲存：

    - Account SID，例如 `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 寄件者電話號碼，例如 `+15551234567`

    如果你使用 Messaging Service 而不是固定寄件者號碼，請儲存 Messaging Service SID，例如 `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="設定 SMS 頻道">

將以下內容儲存為 `sms.patch.json5` 並修改預留位置：

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
    在 Twilio 電話號碼設定中，開啟 **Messaging**，並將 **A message comes in** 設為：

```text
https://gateway.example.com/webhooks/sms
```

    使用 HTTP `POST`。預設本機路徑是 `/webhooks/sms`；如果需要不同路由，請變更 `channels.sms.webhookPath`。

  </Step>

  <Step title="暴露確切的 SMS 網路鉤子路徑">
    你的公開 URL 必須將 SMS 路徑路由到閘道程序。如果你使用 Tailscale Funnel 進行本機測試，請明確暴露 `/webhooks/sms`：

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call 與 SMS 使用不同的網路鉤子路徑。如果同一個 Twilio 號碼同時處理兩者，請在 Twilio 與你的通道中都保持兩個路由已設定。

  </Step>

  <Step title="啟動閘道並核准第一個寄件者">

```bash
openclaw gateway
```

傳送簡訊到 Twilio 號碼。第一則訊息會建立配對請求。核准它：

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>
</Steps>

## 設定範例

### 設定檔

當你希望頻道定義隨閘道設定一起移動時，使用設定檔設定：

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

針對密鑰來自主機環境的單帳戶部署，使用 env 設定：

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

`TWILIO_SMS_FROM` 可作為 `TWILIO_PHONE_NUMBER` 的別名。當 Twilio 應從 Messaging Service 選擇寄件者時，使用 `TWILIO_MESSAGING_SERVICE_SID` 取代電話號碼寄件者。

### SecretRef 驗證權杖

`authToken` 可以是 SecretRef。當閘道應從 OpenClaw secrets runtime 解析 Twilio Auth Token，而不是儲存明文設定時，請使用此方式：

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

被參照的環境變數或 secret provider 必須對閘道執行階段可見。變更主機環境變數後，請重新啟動受管理的閘道程序。

### 僅限允許清單的私人號碼

當只有已知電話號碼應能與代理對話時，使用 `allowlist`：

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

### Messaging Service 寄件者

當 Twilio 應透過 Messaging Service 選擇寄件者時，使用 `messagingServiceSid` 取代 `fromNumber`：

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

如果在設定與 env 解析後同時存在 `fromNumber` 與 `messagingServiceSid`，會使用 `fromNumber`。

### 預設出站目標

當自動化或代理主動發送需要預設目的地，且傳送流程省略明確目標時，設定 `defaultTo`：

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

- `pairing`（預設）
- `allowlist`（需要 `allowFrom` 中至少有一個寄件者）
- `open`（需要 `allowFrom` 包含 `"*"`）
- `disabled`

`allowFrom` 項目應為 E.164 電話號碼，例如 `+15551234567`。`sms:` 前綴會被接受並正規化。對於私人助理，建議使用 `dmPolicy: "allowlist"` 並明確列出電話號碼。

## 傳送 SMS

出站 SMS 目標在選定 SMS 頻道時，使用 `sms:` 服務前綴：

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

當頻道選擇是隱含的，`twilio-sms:+15551234567` 會選擇此頻道，且不會接管 iMessage 使用的現有頻道所擁有的 `sms:` 服務前綴。

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

命令列介面需要明確的 `--target`。`defaultTo` 適用於可從頻道設定解析目標的自動化與代理主動發送路徑。

來自入站 SMS 對話的代理回覆會透過已設定的 Twilio 寄件者自動傳回寄件者。

SMS 輸出為純文字。OpenClaw 會移除 markdown、展平圍欄式程式碼區塊、保留可讀連結，並在透過 Twilio 傳送前將長回覆分段。

## 驗證設定

閘道啟動後：

1. 確認閘道日誌顯示 SMS 網路鉤子路由。
2. 執行 Twilio 端探測：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 從你的手機傳送 SMS 到 Twilio 號碼。
4. 執行 `openclaw pairing list sms`。
5. 使用 `openclaw pairing approve sms <CODE>` 核准配對碼。
6. 再傳送一則 SMS，並確認代理回覆。

僅測試出站時，使用：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### 從 macOS iMessage/SMS 進行端對端測試

在可透過 Messages 傳送電信業者 SMS 的 Mac 上，你可以使用 `imsg` 驅動寄件端，而不需要操作手機：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

第一則訊息應建立配對請求。第二則訊息應透過 Twilio 接收代理回覆。

## 網路鉤子安全性

OpenClaw 預設會使用 `publicWebhookUrl` 與 `authToken` 驗證 `X-Twilio-Signature`。請讓 `publicWebhookUrl` 與 Twilio 中設定的 URL 逐位元組一致，包含 scheme、host、path 與 query string。

僅針對本機通道測試，你可以設定：

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

請勿在公開閘道上使用停用的簽章驗證。

## 多帳戶設定

當你操作多個 Twilio 號碼時，使用 `accounts`：

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

每個帳戶都應使用不同的 `webhookPath`。

## 疑難排解

### Twilio 回傳 403 或 OpenClaw 拒絕網路鉤子

檢查 `publicWebhookUrl` 是否與 Twilio 中設定的 URL 完全相符，包含 scheme、host、path 與 query string。Twilio 會簽署公開 URL 字串，因此代理重寫與替代主機名稱可能會破壞簽章驗證。

### 沒有出現配對請求

檢查 Twilio 號碼的 **Messaging** 網路鉤子 URL 與方法。它必須指向 SMS 網路鉤子 URL 並使用 `POST`。也請確認閘道可從公開網際網路或透過你的通道連線。

如果 Twilio 訊息日誌顯示錯誤 `11200`，表示 Twilio 已接受入站 SMS，但無法連到你的網路鉤子。檢查：

- Twilio **Messaging > A message comes in** 指向 `publicWebhookUrl`。
- 方法是 `POST`。
- 通道或反向代理暴露確切的 `webhookPath`；對於 Tailscale Funnel，執行 `tailscale funnel status` 並確認列出 `/webhooks/sms`。
- `publicWebhookUrl` 使用 Twilio 傳送時相同的 scheme、host、path 與 query string，因此簽章驗證可以重現已簽署的 URL。

### 出站傳送失敗

確認 `accountSid`、`authToken`，以及 `fromNumber` 或 `messagingServiceSid` 其中之一已解析。如果你使用 Twilio 試用帳戶，目的地號碼可能需要先在 Twilio 中驗證，才能傳送出站 SMS。

### 訊息已送達但代理沒有回覆

檢查 `dmPolicy` 和 `allowFrom`。使用預設的 `pairing` 政策時，寄件者必須先獲得核准，才會處理一般的代理程式回合。

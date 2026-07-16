---
read_when:
    - 你想要透過 Twilio 將 OpenClaw 連接至 SMS
    - 你需要設定 SMS 網路鉤子或允許清單
summary: Twilio SMS 頻道設定、存取控制與網路鉤子設定
title: SMS
x-i18n:
    generated_at: "2026-07-16T11:23:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw 透過 Twilio 電話號碼或 Messaging Service 接收和傳送 SMS。閘道會註冊傳入網路鉤子路由（預設為 `/webhooks/sms`）、預設驗證 Twilio 請求簽章，並透過 Twilio 的 Messages API 傳回回覆。

狀態：官方外掛，需另外安裝。僅支援文字：不支援 MMS／媒體，僅支援私訊。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    SMS 的預設私訊政策為配對。
  </Card>
  <Card title="閘道安全性" icon="shield" href="/zh-TW/gateway/security">
    檢視網路鉤子暴露情形與傳送者存取控制。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
</CardGroup>

## 開始之前

你需要：

- 使用 `openclaw plugins install @openclaw/sms` 安裝官方 SMS 外掛。
- 具備可傳送 SMS 的電話號碼或 Twilio Messaging Service 的 Twilio 帳號。
- Twilio Account SID 和 Auth Token。
- 可連線至 OpenClaw 閘道的公開 HTTPS URL。
- 選擇傳送者政策：私人使用選擇 `pairing`（預設）、預先核准的電話號碼選擇 `allowlist`，或僅在刻意開放公開 SMS 存取時選擇 `open`。

如果一個 Twilio 號碼同時具備兩項功能，便可同時用於 SMS 和[語音通話](/zh-TW/plugins/voice-call)。SMS 網路鉤子和 Voice 網路鉤子需在 Twilio 中分別設定，並使用不同的閘道路徑；本頁僅說明 SMS 網路鉤子。

## 快速設定

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="建立或選擇 Twilio 傳送者">
    在 Twilio 中開啟 **Phone Numbers > Manage > Active numbers**，並選擇可傳送 SMS 的號碼。儲存：

    - Account SID，例如 `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 傳送者電話號碼，例如 `+15551234567`

    如果你使用 Messaging Service 而非固定的傳送者號碼，請儲存 Messaging Service SID，例如 `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="設定 SMS 頻道">

將此內容儲存為 `sms.patch.json5`，並變更預留位置：

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

套用設定：

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

    使用 HTTP `POST`。預設本機路徑為 `/webhooks/sms`；如需使用其他路由，請變更 `channels.sms.webhookPath`。

  </Step>

  <Step title="公開確切的 SMS 網路鉤子路徑">
    你的公開 URL 必須將 SMS 路徑路由至閘道程序（預設連接埠為 `18789`）。如果你使用 Tailscale Funnel 進行本機測試，請明確公開 `/webhooks/sms`：

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    語音通話和 SMS 使用不同的網路鉤子路徑。如果同一個 Twilio 號碼同時處理兩者，請在 Twilio 和你的通道中保留這兩條路由的設定。

  </Step>

  <Step title="啟動閘道並核准第一位傳送者">

```bash
openclaw gateway
```

傳送簡訊至 Twilio 號碼。第一則訊息會建立配對請求。核准該請求：

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    配對碼會在 1 小時後失效。

  </Step>
</Steps>

## 設定範例

所有鍵都位於 `channels.sms` 之下（各帳號則位於 `channels.sms.accounts.<id>` 之下）：

| 鍵                                      | 預設值          | 用途                                                                |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | 啟用或停用頻道／帳號。                                              |
| `accountSid`                            | —               | Twilio Account SID（`AC...`）。                                      |
| `authToken`                             | —               | Twilio Auth Token；純文字字串或 SecretRef。                          |
| `fromNumber`                            | —               | E.164 傳送者號碼。                                                   |
| `messagingServiceSid`                   | —               | 未解析出 `fromNumber` 時使用的 Messaging Service SID（`MG...`）。 |
| `defaultTo`                             | —               | 傳送流程未指定明確目標時的預設目的地。                               |
| `webhookPath`                           | `/webhooks/sms` | Twilio 傳入網路鉤子的閘道 HTTP 路徑。                                |
| `publicWebhookUrl`                      | —               | 在 Twilio 中設定的公開 URL；簽章驗證需要此項。                       |
| `dangerouslyDisableSignatureValidation` | `false`         | 略過 `X-Twilio-Signature` 檢查；僅限本機通道測試。                   |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open` 或 `disabled`。                     |
| `allowFrom`                             | `[]`            | 允許的 E.164 傳送者號碼；搭配 `dmPolicy: "open"` 時可使用 `"*"`。 |
| `textChunkLimit`                        | `1500`          | 每個傳出 SMS 分段的字元數上限。                                     |
| `accounts`、`defaultAccount`            | —               | 多帳號對應表與預設帳號 ID。                                         |

### 設定檔

如果你希望頻道定義隨閘道設定一同移轉，請使用設定檔設定：

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

環境變數僅套用至預設帳號；設定值的優先順序高於環境變數值。

| 變數                                            | 對應至                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER`（別名 `TWILIO_SMS_FROM`） | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom`（以逗號分隔）                         |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation`（`"true"`） |

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

`authToken` 可以是 SecretRef（`source: "env" | "file" | "exec"`）。如果閘道應從 OpenClaw 密鑰執行階段解析 Twilio Auth Token，而非儲存純文字設定，請使用此方式：

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

閘道執行階段必須能存取參照的環境變數或密鑰提供者。變更主機環境變數後，請重新啟動受管理的閘道程序。

### Messaging Service 傳送者

如果 Twilio 應透過 Messaging Service 選擇傳送者，請使用 `messagingServiceSid`，而非 `fromNumber`：

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

如果解析設定和環境變數後，同時存在 `fromNumber` 和 `messagingServiceSid`，則會使用 `fromNumber`。

### 預設傳出目標

如果傳送流程未指定明確目標，而自動化或代理程式啟動的傳送應有預設目的地，請設定 `defaultTo`：

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

- `pairing`（預設）：未知傳送者會收到配對碼；使用 `openclaw pairing approve sms <CODE>` 核准。
- `allowlist`：僅處理 `allowFrom` 中的傳送者。空的 `allowFrom` 會拒絕所有傳送者（閘道會記錄啟動警告）。
- `open`：設定驗證要求 `allowFrom` 包含 `"*"`。若沒有萬用字元，則僅列出的號碼可以聊天。
- `disabled`：捨棄所有傳入私訊。

`allowFrom` 項目應為 E.164 電話號碼，例如 `+15551234567`。接受 `sms:` 和 `twilio-sms:` 前綴，並會將其正規化。若為私人助理，建議使用 `dmPolicy: "allowlist"` 並明確指定電話號碼：

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

選取 SMS 頻道後，目標可接受純 E.164 號碼或 `sms:` 前綴：

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

隱含選擇頻道時，`twilio-sms:` 前綴會選取此頻道，而不會占用 `sms:` 服務前綴；iMessage 使用後者為其自身目標選擇電信業者 SMS 傳送：

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

命令列介面要求明確指定 `--target`。`defaultTo` 適用於可從頻道設定解析目標的自動化與代理程式啟動傳送路徑。

來自傳入 SMS 對話的代理回覆，會透過已設定的 Twilio 傳送號碼自動回傳給寄件者。

SMS 輸出為純文字。OpenClaw 會移除 Markdown、將圍欄程式碼區塊攤平成純文字、將連結改寫為 `label (url)`，並在透過 Twilio 傳送前，將過長的回覆分割成每段最多 `textChunkLimit` 個字元（預設為 1500）的區塊。

## 驗證設定

閘道啟動後：

1. 確認閘道記錄顯示 SMS 網路鉤子路由。
2. 執行 Twilio 端探測（檢查已設定的 Twilio 網路鉤子 URL／方法和近期的傳入錯誤）：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 使用手機傳送 SMS 至 Twilio 號碼。
4. 執行 `openclaw pairing list sms`。
5. 使用 `openclaw pairing approve sms <CODE>` 核准配對碼。
6. 再傳送一則 SMS，並確認代理有回覆。

若只要測試傳出功能，請使用：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### 從 macOS iMessage／SMS 進行端對端測試

在可透過「訊息」傳送電信業者 SMS 的 Mac 上，你可以使用 `imsg` 操作傳送端，而不必碰手機：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

第一則訊息應建立配對請求。第二則訊息應透過 Twilio 收到代理回覆。

## 網路鉤子安全性

依預設，OpenClaw 會使用 `publicWebhookUrl` 和 `authToken` 驗證 `X-Twilio-Signature`。請讓 `publicWebhookUrl` 的端點部分與 Twilio 中設定的 URL 逐位元組一致，包括通訊協定、主機、路徑和查詢字串。依 Twilio 要求，OpenClaw 會在簽章計算中排除 Twilio [連線覆寫](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides)片段（`#...`）。

網路鉤子路由也會獨立於簽章驗證，強制執行以下規則：

- 僅限 `POST`。
- 每個 SMS 帳號、網路鉤子路由和解析後的用戶端位址，每分鐘的失敗請求額度為 300 個請求。所有請求都會計入此額度，但只有在請求無法剖析本文、Twilio 驗證失敗或 AccountSid 不相符後，才會套用 HTTP 429。
- 上述檢查通過後，每個 SMS 帳號、網路鉤子路由和解析後的用戶端位址，每分鐘最多接受 30 個可分派回呼（超過時回傳 HTTP 429）。若停用簽章驗證，此每分鐘 30 個的限制即為未驗證分派上限。
- 用戶端位址會透過共用閘道的受信任 Proxy 規則解析。若 `gateway.trustedProxies` 包含轉送 Twilio 回呼的反向 Proxy，OpenClaw 會依轉送的用戶端位址套用這些限制；否則會改用直接的通訊端位址。
- 承載資料中的 `AccountSid` 必須符合已設定的 `accountSid`（否則回傳 HTTP 403）。
- 重播的 `MessageSid` 值會在 10 分鐘內進行重複資料刪除。
- 每個 SMS 帳號的重播快取最多保留 10,000 個仍有效的訊息 SID。當所有位置都仍有效時，該帳號的新網路鉤子會採取封閉式失敗，回傳 HTTP 429 和 `Retry-After` 標頭，直到最舊的位置到期。
- 超過 32 KB 的請求本文會遭到拒絕。

Twilio 預設不會重試 HTTP 429，也未記載支援 `Retry-After`。`#rp=4xx` 和 `#rp=all` 連線覆寫會選擇啟用 4xx 重試，但 Twilio 將完整重試交易限制為 15 秒，因此重試仍可能在重播快取位置到期前結束。若必須由其他處理常式接收傳送失敗的內容，請設定後援 URL；應將 429 視為封閉式失敗拒絕，而非可靠的背壓機制。

僅限本機通道測試時，可以設定：

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

## 多帳號設定

操作多個 Twilio 號碼時，請使用 `accounts`：

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

每個帳號都必須使用不同的 `webhookPath`；若網路鉤子路由的路徑已由另一個帳號擁有，閘道會拒絕註冊該路由。`TWILIO_*`/`SMS_*` 環境變數後援僅適用於預設帳號；設定 `defaultAccount` 可變更預設帳號。

## 疑難排解

### Twilio 回傳 403 或 OpenClaw 拒絕網路鉤子

請檢查 `publicWebhookUrl` 是否與 Twilio 中設定的 URL 完全一致，包括通訊協定、主機、路徑和查詢字串。Twilio 會對公開 URL 字串簽章，因此 Proxy 改寫和替代主機名稱可能導致簽章驗證失敗。

若 403 包含 `Invalid account`，表示傳入承載資料中的 `AccountSid` 與已設定的 `accountSid` 不相符；請檢查網路鉤子是否指向擁有該號碼的帳號。

### 未出現配對請求

請檢查 Twilio 號碼的 **Messaging** 網路鉤子 URL 和方法。它必須指向 SMS 網路鉤子 URL，並使用 `POST`。另請確認可從公開網際網路或透過通道連線至閘道。

若 Twilio 訊息記錄顯示錯誤 `11200`，表示 Twilio 已接受傳入 SMS，但無法連線至你的網路鉤子。請檢查：

- Twilio **Messaging > A message comes in** 指向 `publicWebhookUrl`。
- 方法為 `POST`。
- 通道或反向 Proxy 公開完全相同的 `webhookPath`；若使用 Tailscale Funnel，請執行 `tailscale funnel status`，並確認其中列出 `/webhooks/sms`。
- `publicWebhookUrl` 使用與 Twilio 傳送內容相同的通訊協定、主機、路徑和查詢字串，讓簽章驗證可以重現已簽章的 URL。

`openclaw channels status --channel sms --probe` 會同時顯示不相符的 Twilio 網路鉤子設定和近期的 `11200` 錯誤。

### 傳出訊息失敗

請確認 `accountSid`、`authToken`，以及 `fromNumber` 或 `messagingServiceSid` 已解析。若使用 Twilio 試用帳號，可能必須先在 Twilio 中驗證目的地號碼，才能傳送傳出 SMS。

### 訊息已送達，但代理沒有回覆

請檢查 `dmPolicy` 和 `allowFrom`。使用預設的 `pairing` 原則時，必須先核准寄件者，系統才會處理一般的代理回合。

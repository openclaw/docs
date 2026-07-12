---
read_when:
    - 你想要透過 Twilio 將 OpenClaw 連接至 SMS
    - 你需要設定 SMS 網路鉤子或允許清單
summary: Twilio SMS 頻道設定、存取控制與網路鉤子設定
title: SMS
x-i18n:
    generated_at: "2026-07-11T21:09:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw 透過 Twilio 電話號碼或 Messaging Service 接收及傳送 SMS。閘道會註冊傳入網路鉤子路由（預設為 `/webhooks/sms`）、預設驗證 Twilio 請求簽章，並透過 Twilio 的 Messages API 傳回回覆。

狀態：官方外掛，需另行安裝。僅支援文字：不支援 MMS／媒體，且僅支援私訊。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    SMS 的預設私訊政策為配對。
  </Card>
  <Card title="閘道安全性" icon="shield" href="/zh-TW/gateway/security">
    檢查網路鉤子的公開方式與傳送者存取控制。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
</CardGroup>

## 開始之前

你需要：

- 使用 `openclaw plugins install @openclaw/sms` 安裝官方 SMS 外掛。
- 擁有包含支援 SMS 電話號碼的 Twilio 帳戶，或 Twilio Messaging Service。
- Twilio Account SID 與 Auth Token。
- 可連線至 OpenClaw 閘道的公用 HTTPS URL。
- 選擇傳送者政策：私人使用採用 `pairing`（預設）、預先核准的電話號碼採用 `allowlist`，只有刻意公開 SMS 存取時才採用 `open`。

如果同一個 Twilio 號碼同時具備兩種功能，便可同時用於 SMS 與[語音通話](/zh-TW/plugins/voice-call)。SMS 網路鉤子與語音網路鉤子須在 Twilio 中分別設定，並使用不同的閘道路徑；本頁僅涵蓋 SMS 網路鉤子。

## 快速設定

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="建立或選擇 Twilio 傳送者">
    在 Twilio 中開啟 **Phone Numbers > Manage > Active numbers**，並選擇支援 SMS 的號碼。儲存：

    - Account SID，例如 `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 傳送者電話號碼，例如 `+15551234567`

    如果使用 Messaging Service 而非固定傳送者號碼，請儲存 Messaging Service SID，例如 `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="設定 SMS 頻道">

將以下內容儲存為 `sms.patch.json5`，並變更預留位置：

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
    在 Twilio 電話號碼設定中開啟 **Messaging**，並將 **A message comes in** 設為：

```text
https://gateway.example.com/webhooks/sms
```

    使用 HTTP `POST`。預設本機路徑為 `/webhooks/sms`；如需不同路由，請變更 `channels.sms.webhookPath`。

  </Step>

  <Step title="公開確切的 SMS 網路鉤子路徑">
    公用 URL 必須將 SMS 路徑路由至閘道程序（預設連接埠為 `18789`）。如果使用 Tailscale Funnel 進行本機測試，請明確公開 `/webhooks/sms`：

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    語音通話與 SMS 使用不同的網路鉤子路徑。如果同一個 Twilio 號碼同時處理兩者，請在 Twilio 與通道中保留兩條路由的設定。

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

    配對碼會在 1 小時後過期。

  </Step>
</Steps>

## 設定範例

所有鍵都位於 `channels.sms` 之下（每個帳戶則位於 `channels.sms.accounts.<id>` 之下）：

| 鍵                                      | 預設值          | 用途                                                                |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | 啟用或停用頻道／帳戶。                                               |
| `accountSid`                            | —               | Twilio Account SID（`AC...`）。                                      |
| `authToken`                             | —               | Twilio Auth Token；純文字字串或 SecretRef。                           |
| `fromNumber`                            | —               | E.164 傳送者號碼。                                                    |
| `messagingServiceSid`                   | —               | 未解析出 `fromNumber` 時使用的 Messaging Service SID（`MG...`）。     |
| `defaultTo`                             | —               | 傳送流程省略明確目標時的預設目的地。                                  |
| `webhookPath`                           | `/webhooks/sms` | 用於接收 Twilio 網路鉤子的閘道 HTTP 路徑。                            |
| `publicWebhookUrl`                      | —               | 在 Twilio 中設定的公用 URL；簽章驗證需要此值。                        |
| `dangerouslyDisableSignatureValidation` | `false`         | 略過 `X-Twilio-Signature` 檢查；僅限本機通道測試。                    |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open` 或 `disabled`。                       |
| `allowFrom`                             | `[]`            | 允許的 E.164 傳送者號碼；搭配 `dmPolicy: "open"` 時亦可設為 `"*"`。   |
| `textChunkLimit`                        | `1500`          | 每個傳出 SMS 分段的最大字元數。                                       |
| `accounts`, `defaultAccount`            | —               | 多帳戶對應表與預設帳戶 ID。                                           |

### 設定檔

如果希望頻道定義隨閘道設定一併移轉，請使用設定檔方式：

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

環境變數僅套用至預設帳戶；設定值的優先順序高於環境變數值。

| 變數                                            | 對應至                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER`（別名 `TWILIO_SMS_FROM`） | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom`（以逗號分隔）                           |
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

`authToken` 可以是 SecretRef（`source: "env" | "file" | "exec"`）。當閘道應從 OpenClaw 密鑰執行階段解析 Twilio Auth Token，而非將其儲存於純文字設定中時，請使用此方式：

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

閘道執行階段必須能存取所參照的環境變數或密鑰提供者。變更主機環境變數後，請重新啟動受管理的閘道程序。

### Messaging Service 傳送者

當 Twilio 應透過 Messaging Service 選擇傳送者時，請使用 `messagingServiceSid` 取代 `fromNumber`：

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

如果解析設定與環境變數後同時存在 `fromNumber` 與 `messagingServiceSid`，則會使用 `fromNumber`。

### 預設傳出目標

如果傳送流程省略明確目標，而自動化或代理程式發起的傳送應有預設目的地，請設定 `defaultTo`：

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
- `allowlist`：只處理 `allowFrom` 中的傳送者。空的 `allowFrom` 會拒絕所有傳送者（閘道會記錄啟動警告）。
- `open`：設定驗證要求 `allowFrom` 包含 `"*"`。若沒有萬用字元，只有列出的號碼可以聊天。
- `disabled`：捨棄所有傳入私訊。

`allowFrom` 項目應為 E.164 電話號碼，例如 `+15551234567`。系統接受並會正規化 `sms:` 與 `twilio-sms:` 前綴。若是私人助理，建議使用包含明確電話號碼的 `dmPolicy: "allowlist"`：

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

選取 SMS 頻道後，目標可接受不含前綴的 E.164 號碼或 `sms:` 前綴：

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

隱含選擇頻道時，`twilio-sms:` 前綴會選擇此頻道，而不會占用 `sms:` 服務前綴；iMessage 使用後者為自己的目標選擇電信業者 SMS 傳送：

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

命令列介面要求明確提供 `--target`。`defaultTo` 適用於可從頻道設定解析目標的自動化與代理程式發起傳送路徑。

代理程式對傳入 SMS 對話的回覆，會自動透過已設定的 Twilio 傳送者傳回給原傳送者。

SMS 輸出為純文字。OpenClaw 會移除 Markdown 格式、攤平圍欄程式碼區塊、將連結改寫為 `label (url)`，並在透過 Twilio 傳送前，將較長的回覆分割成每段最多 `textChunkLimit` 個字元（預設為 1500）。

## 驗證設定

閘道啟動後：

1. 確認閘道日誌顯示 SMS 網路鉤子路由。
2. 執行 Twilio 端探測（檢查已設定的 Twilio 網路鉤子 URL／方法與近期的傳入錯誤）：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 使用手機向 Twilio 號碼傳送 SMS。
4. 執行 `openclaw pairing list sms`。
5. 使用 `openclaw pairing approve sms <CODE>` 核准配對碼。
6. 再傳送一則 SMS，並確認代理程式回覆。

若僅測試傳出功能，請使用：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### 從 macOS iMessage／SMS 進行端對端測試

在可透過「訊息」傳送電信業者 SMS 的 Mac 上，你可以使用 `imsg` 驅動傳送端，而不必操作手機：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

第一則訊息應建立配對請求。第二則訊息應透過 Twilio 收到代理程式的回覆。

## 網路鉤子安全性

OpenClaw 預設會使用 `publicWebhookUrl` 和 `authToken` 驗證 `X-Twilio-Signature`。請確保 `publicWebhookUrl` 的端點部分與 Twilio 中設定的 URL 逐位元組一致，包括通訊協定、主機、路徑和查詢字串。依 Twilio 要求，OpenClaw 會在簽章計算時排除 Twilio 的[連線覆寫](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides)片段（`#...`）。

網路鉤子路由還會獨立於簽章驗證，強制執行以下規則：

- 僅允許 `POST`。
- 每個來源 IP 每分鐘最多 30 個請求（超過時回傳 HTTP 429）。
- 承載資料中的 `AccountSid` 必須與設定的 `accountSid` 相符（否則回傳 HTTP 403）。
- 重複使用的 `MessageSid` 值會在 10 分鐘內進行去重。
- 每個 SMS 帳戶的重播快取最多保留 10,000 個仍有效的訊息 SID。當所有位置都仍有效時，該帳戶的新網路鉤子會採取封閉式失敗，回傳 HTTP 429 與 `Retry-After` 標頭，直到最舊的位置到期。
- 超過 32 KB 的請求主體會遭拒絕。

Twilio 預設不會重試 HTTP 429，也未記載支援 `Retry-After`。`#rp=4xx` 和 `#rp=all` 連線覆寫可啟用 4xx 重試，但 Twilio 將完整重試交易限制在 15 秒內，因此重試仍可能在重播快取位置到期前結束。若其他處理常式必須接收傳遞失敗的項目，請設定備援 URL；應將 429 視為封閉式失敗拒絕，而非可靠的背壓機制。

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

## 多帳戶設定

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

每個帳戶都必須使用不同的 `webhookPath`；若某路徑已由另一個帳戶擁有，閘道會拒絕註冊該網路鉤子路由。`TWILIO_*`／`SMS_*` 環境變數備援僅適用於預設帳戶；設定 `defaultAccount` 可變更預設帳戶。

## 疑難排解

### Twilio 回傳 403，或 OpenClaw 拒絕網路鉤子

請確認 `publicWebhookUrl` 與 Twilio 中設定的 URL 完全相符，包括通訊協定、主機、路徑和查詢字串。Twilio 會對公開 URL 字串簽章，因此 Proxy 重寫和替代主機名稱可能破壞簽章驗證。

出現包含 `Invalid account` 的 403，表示傳入承載資料的 `AccountSid` 與設定的 `accountSid` 不符；請確認網路鉤子指向擁有該號碼的帳戶。

### 未出現配對請求

檢查 Twilio 號碼的 **Messaging** 網路鉤子 URL 和方法。它必須指向 SMS 網路鉤子 URL，並使用 `POST`。另請確認可從公開網際網路或透過通道連線至閘道。

如果 Twilio 訊息日誌顯示錯誤 `11200`，表示 Twilio 已接受傳入的 SMS，但無法連線至你的網路鉤子。請檢查：

- Twilio 的 **Messaging > A message comes in** 指向 `publicWebhookUrl`。
- 方法為 `POST`。
- 通道或反向 Proxy 公開了完全一致的 `webhookPath`；若使用 Tailscale Funnel，請執行 `tailscale funnel status`，並確認列出了 `/webhooks/sms`。
- `publicWebhookUrl` 使用與 Twilio 傳送時相同的通訊協定、主機、路徑和查詢字串，以便簽章驗證重現已簽章的 URL。

`openclaw channels status --channel sms --probe` 會顯示 Twilio 網路鉤子設定不符及近期的 `11200` 錯誤。

### 傳出訊息失敗

確認已解析 `accountSid`、`authToken`，以及 `fromNumber` 或 `messagingServiceSid`。如果使用 Twilio 試用帳戶，可能必須先在 Twilio 中驗證目的地號碼，才能傳送 SMS。

### 訊息已送達，但代理程式沒有回覆

檢查 `dmPolicy` 和 `allowFrom`。使用預設的 `pairing` 原則時，必須先核准傳送者，才會處理一般的代理程式回合。

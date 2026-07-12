---
read_when:
    - 開發 Nextcloud Talk 頻道功能
summary: Nextcloud Talk 支援狀態、功能與設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-11T21:06:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk 是可下載的頻道外掛（`@openclaw/nextcloud-talk`），透過 Talk 網路鉤子機器人將 OpenClaw 連接至自行託管的 Nextcloud 執行個體。支援私訊、聊天室、回應及 Markdown 訊息；媒體則以 URL 傳送。

## 安裝

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

使用不含版本的套件規格，即可跟隨目前的官方發行標籤。只有在需要可重現的安裝時，才固定確切版本。

從本機原始碼簽出安裝（開發工作流程）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

安裝後重新啟動閘道。詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定（初學者）

1. 安裝外掛（如上所述）。
2. 在 Nextcloud 伺服器上建立機器人：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   保留 `--feature response`：若未啟用，對外回覆會因 401 而失敗。使用 `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1` 修復現有機器人。

3. 在目標聊天室的設定中啟用機器人。
4. 設定 OpenClaw：
   - 設定：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或環境變數：`NEXTCLOUD_TALK_BOT_SECRET`（僅限預設帳號）

   命令列介面設定（`--url`/`--token` 是明確欄位的別名；`nc-talk` 和 `nc` 可作為頻道別名）：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   等效的明確欄位：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   檔案型密鑰：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. 重新啟動閘道（或完成設定）。

最小設定：

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 注意事項

- 機器人無法主動發起私訊。使用者必須先向機器人傳送訊息。
- Nextcloud 伺服器必須能連線至網路鉤子 URL；若閘道位於 Proxy 後方，請設定 `webhookPublicUrl`。網路鉤子要求會使用機器人密鑰進行 HMAC-SHA256 簽署；簽章無效的要求會遭拒絕並受到速率限制。
- 機器人 API 不支援媒體上傳；對外媒體會附加為 `Attachment: <url>` 一行。
- 網路鉤子承載資料不會區分私訊與聊天室；設定 `apiUser` + `apiPassword` 可啟用聊天室類型查詢（快取約 5 分鐘）。若未設定，所有對話都會視為聊天室。
- 對外要求會經過 SSRF 防護。若 Nextcloud 主機位於受信任的私人／內部網路，請設定 `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` 以明確允許。
- 設定 `apiUser`/`apiPassword` 和 `webhookPublicUrl` 後，`openclaw channels status` 會探測機器人，並在缺少 `response` 功能時發出警告。

## 存取控制（私訊）

- 預設值：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知的傳送者會收到配對碼。
- 核准方式：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開私訊：設定 `channels.nextcloud-talk.dmPolicy="open"`，並加上 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 僅比對 Nextcloud 使用者 ID（轉為小寫）；顯示名稱會被忽略。

## 聊天室（群組）

- 預設值：`channels.nextcloud-talk.groupPolicy = "allowlist"`（必須提及才會觸發）。
- 使用 `channels.nextcloud-talk.rooms` 將聊天室加入允許清單，以聊天室權杖作為鍵；`"*"` 可設定萬用字元預設值：

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- 各聊天室可用的鍵：`requireMention`（預設為 true）、`enabled`（false 會停用聊天室）、`allowFrom`（各聊天室的傳送者允許清單）、`tools`（允許／拒絕工具的覆寫設定）、`skills`（限制載入的 Skills）、`systemPrompt`。
- 若不允許任何聊天室，請將允許清單保持為空，或設定 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能

| 功能     | 狀態        |
| -------- | ----------- |
| 私訊     | 支援        |
| 聊天室   | 支援        |
| 討論串   | 不支援      |
| 媒體     | 僅限 URL    |
| 回應     | 支援        |
| 原生命令 | 不支援      |

## 設定參考（Nextcloud Talk）

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.nextcloud-talk.enabled`：啟用／停用頻道啟動。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 執行個體 URL。
- `channels.nextcloud-talk.botSecret`：機器人共用密鑰（字串或密鑰參照）。
- `channels.nextcloud-talk.botSecretFile`：一般檔案的密鑰路徑。不接受符號連結。
- `channels.nextcloud-talk.apiUser`：用於聊天室查詢（偵測私訊）和狀態探測的 API 使用者。
- `channels.nextcloud-talk.apiPassword`：用於聊天室查詢的 API／應用程式密碼。
- `channels.nextcloud-talk.apiPasswordFile`：API 密碼檔案路徑。
- `channels.nextcloud-talk.webhookPort`：網路鉤子接聽連接埠（預設值：8788）。
- `channels.nextcloud-talk.webhookHost`：網路鉤子主機（預設值：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：網路鉤子路徑（預設值：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：可從外部連線的網路鉤子 URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`（預設值：pairing）。`open` 需要 `allowFrom=["*"]`。
- `channels.nextcloud-talk.allowFrom`：私訊允許清單（使用者 ID）。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`（預設值：allowlist）。
- `channels.nextcloud-talk.groupAllowFrom`：聊天室傳送者允許清單（使用者 ID）；未設定時會退回使用 `allowFrom`。
- `channels.nextcloud-talk.rooms`：各聊天室的設定與允許清單（見上文）。
- `allowFrom` 和 `groupAllowFrom` 可使用 `accessGroup:<name>` 參照靜態傳送者存取群組。
- `channels.nextcloud-talk.historyLimit`：群組歷史記錄上限（0 表示停用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私訊歷史記錄上限（0 表示停用）。
- `channels.nextcloud-talk.dms`：以使用者 ID 為鍵的各私訊覆寫設定（`historyLimit`）。
- `channels.nextcloud-talk.textChunkLimit`：對外文字分塊的字元數（預設值：4000）。
- `channels.nextcloud-talk.chunkMode`：`length`（預設值），或使用 `newline`，在依長度分塊之前先按空白行（段落邊界）分割。
- `channels.nextcloud-talk.blockStreaming`：停用此頻道的區塊串流。
- `channels.nextcloud-talk.blockStreamingCoalesce`：區塊串流合併調校。
- `channels.nextcloud-talk.responsePrefix`：對外回覆前綴。
- `channels.nextcloud-talk.markdown.tables`：Markdown 表格呈現模式（`off | bullets | code | block`）。
- `channels.nextcloud-talk.mediaMaxMb`：傳入媒體的大小上限（MB）。
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`：允許私人／內部 Nextcloud 主機通過 SSRF 防護。
- `channels.nextcloud-talk.accounts.<id>`：各帳號的覆寫設定（使用相同的鍵）；`defaultAccount` 選擇預設帳號。環境變數 `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` 僅套用至預設帳號。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及觸發機制
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與安全強化

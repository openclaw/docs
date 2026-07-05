---
read_when:
    - 正在開發 Nextcloud Talk 頻道功能
summary: Nextcloud Talk 支援狀態、功能與設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-05T11:03:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk 是可下載的頻道外掛（`@openclaw/nextcloud-talk`），可透過 Talk 網路鉤子 Bot 將 OpenClaw 連接到自託管的 Nextcloud 執行個體。支援私訊、房間、反應和 Markdown 訊息；媒體會以 URL 形式送出。

## 安裝

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

使用裸套件規格以跟隨目前官方發行標籤。只有在需要可重現安裝時，才釘選精確版本。

從本機 checkout（開發工作流程）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

安裝後請重新啟動閘道。詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定（初學者）

1. 安裝外掛（如上）。
2. 在你的 Nextcloud 伺服器上建立 Bot：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   保留 `--feature response`：沒有它，對外回覆會因 401 而失敗。使用 `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1` 修復現有 Bot。

3. 在目標房間設定中啟用 Bot。
4. 設定 OpenClaw：
   - 設定：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或環境變數：`NEXTCLOUD_TALK_BOT_SECRET`（僅預設帳號）

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

   檔案支援的密鑰：

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

- Bot 無法主動發起私訊。使用者必須先傳訊息給 Bot。
- 網路鉤子 URL 必須能從 Nextcloud 伺服器連到；當閘道位於 Proxy 後方時，請設定 `webhookPublicUrl`。網路鉤子請求會使用 Bot 密鑰以 HMAC-SHA256 簽署；無效簽章會被拒絕並受到速率限制。
- Bot API 不支援媒體上傳；對外媒體會附加為 `Attachment: <url>` 行。
- 網路鉤子酬載不會區分私訊與房間；設定 `apiUser` + `apiPassword` 以啟用房間類型查詢（快取約 5 分鐘）。沒有它們時，每個對話都會被視為房間。
- 對外請求會經過 SSRF 防護。若 Nextcloud 主機位於受信任的私人/內部網路，請使用 `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` 選擇加入。
- 設定 `apiUser`/`apiPassword` 和 `webhookPublicUrl` 後，`openclaw channels status` 會探測 Bot，並在缺少 `response` 功能時發出警告。

## 存取控制（私訊）

- 預設：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知傳送者會收到配對碼。
- 透過以下方式核准：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開私訊：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 只會比對 Nextcloud 使用者 ID（小寫）；會忽略顯示名稱。

## 房間（群組）

- 預設：`channels.nextcloud-talk.groupPolicy = "allowlist"`（以提及為門檻）。
- 使用 `channels.nextcloud-talk.rooms` 將房間加入允許清單，鍵為房間權杖；`"*"` 會設定萬用字元預設值：

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

- 每個房間的鍵：`requireMention`（預設 true）、`enabled`（false 會停用該房間）、`allowFrom`（每個房間的傳送者允許清單）、`tools`（允許/拒絕工具覆寫）、`skills`（限制載入的 Skills）、`systemPrompt`。
- 若要不允許任何房間，請保持允許清單為空，或設定 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能

| 功能         | 狀態        |
| --------------- | ------------- |
| 私訊 | 支援     |
| 房間           | 支援     |
| 執行緒         | 不支援 |
| 媒體           | 僅 URL      |
| 反應       | 支援     |
| 原生命令 | 不支援 |

## 設定參考（Nextcloud Talk）

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.nextcloud-talk.enabled`：啟用/停用頻道啟動。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 執行個體 URL。
- `channels.nextcloud-talk.botSecret`：Bot 共享密鑰（字串或密鑰參照）。
- `channels.nextcloud-talk.botSecretFile`：一般檔案密鑰路徑。符號連結會被拒絕。
- `channels.nextcloud-talk.apiUser`：用於房間查詢（私訊偵測）和狀態探測的 API 使用者。
- `channels.nextcloud-talk.apiPassword`：用於房間查詢的 API/應用程式密碼。
- `channels.nextcloud-talk.apiPasswordFile`：API 密碼檔案路徑。
- `channels.nextcloud-talk.webhookPort`：網路鉤子監聽器連接埠（預設：8788）。
- `channels.nextcloud-talk.webhookHost`：網路鉤子主機（預設：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：網路鉤子路徑（預設：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可連線的網路鉤子 URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）。`open` 需要 `allowFrom=["*"]`。
- `channels.nextcloud-talk.allowFrom`：私訊允許清單（使用者 ID）。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`（預設：allowlist）。
- `channels.nextcloud-talk.groupAllowFrom`：房間傳送者允許清單（使用者 ID）；未設定時會回退到 `allowFrom`。
- `channels.nextcloud-talk.rooms`：每個房間的設定和允許清單（見上方）。
- 靜態傳送者存取群組可透過 `accessGroup:<name>` 從 `allowFrom` 和 `groupAllowFrom` 參照。
- `channels.nextcloud-talk.historyLimit`：群組歷史限制（0 表示停用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私訊歷史限制（0 表示停用）。
- `channels.nextcloud-talk.dms`：以使用者 ID 為鍵的每個私訊覆寫（`historyLimit`）。
- `channels.nextcloud-talk.textChunkLimit`：對外文字分塊大小，單位為字元（預設：4000）。
- `channels.nextcloud-talk.chunkMode`：`length`（預設）或 `newline`，在依長度分塊前先按空白行（段落邊界）分割。
- `channels.nextcloud-talk.blockStreaming`：停用此頻道的區塊串流。
- `channels.nextcloud-talk.blockStreamingCoalesce`：區塊串流合併調校。
- `channels.nextcloud-talk.responsePrefix`：對外回覆前綴。
- `channels.nextcloud-talk.markdown.tables`：Markdown 表格轉譯模式（`off | bullets | code | block`）。
- `channels.nextcloud-talk.mediaMaxMb`：傳入媒體上限（MB）。
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`：允許私人/內部 Nextcloud 主機通過 SSRF 防護。
- `channels.nextcloud-talk.accounts.<id>`：每個帳號的覆寫（相同鍵）；`defaultAccount` 選擇預設值。環境變數 `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` 只套用於預設帳號。

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化

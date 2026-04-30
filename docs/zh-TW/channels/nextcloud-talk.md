---
read_when:
    - 開發 Nextcloud Talk 頻道功能
summary: Nextcloud Talk 支援狀態、功能與設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T02:48:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: 內建 Plugin（Webhook 機器人）。支援直接訊息、聊天室、回應，以及 Markdown 訊息。

## 內建 Plugin

Nextcloud Talk 在目前的 OpenClaw 版本中以內建 Plugin 提供，因此
一般封裝建置不需要另行安裝。

如果你使用的是較舊的建置，或是排除 Nextcloud Talk 的自訂安裝，
請在有目前版本套件發布時安裝目前的 npm 套件：

透過 CLI 安裝（npm registry，有目前套件時）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

如果 npm 回報 OpenClaw 擁有的套件已棄用，請使用目前的封裝
OpenClaw 建置，或在較新的 npm 套件發布前使用本機 checkout 路徑。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細資訊：[Plugin](/zh-TW/tools/plugin)

## 快速設定（初學者）

1. 確認 Nextcloud Talk Plugin 可用。
   - 目前的封裝 OpenClaw 版本已內建它。
   - 較舊或自訂安裝可以使用上述指令手動加入。
2. 在你的 Nextcloud 伺服器上建立機器人：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 在目標聊天室設定中啟用機器人。
4. 設定 OpenClaw：
   - 設定：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或 env：`NEXTCLOUD_TALK_BOT_SECRET`（僅預設帳號）

   CLI 設定：

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

   檔案支援的 secret：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. 重新啟動 Gateway（或完成設定）。

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

- 機器人無法主動發起 DM。使用者必須先傳訊息給機器人。
- Webhook URL 必須可由 Gateway 存取；如果位於代理後方，請設定 `webhookPublicUrl`。
- 機器人 API 不支援媒體上傳；媒體會以 URL 傳送。
- Webhook payload 不會區分 DM 與聊天室；設定 `apiUser` + `apiPassword` 可啟用聊天室類型查詢（否則 DM 會被視為聊天室）。

## 存取控制（DM）

- 預設：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知傳送者會取得配對碼。
- 透過下列方式核准：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開 DM：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 只會比對 Nextcloud 使用者 ID；顯示名稱會被忽略。

## 聊天室（群組）

- 預設：`channels.nextcloud-talk.groupPolicy = "allowlist"`（提及閘控）。
- 使用 `channels.nextcloud-talk.rooms` 將聊天室加入允許清單：

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

- 若要不允許任何聊天室，請保持允許清單為空，或設定 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能

| 功能         | 狀態        |
| --------------- | ------------- |
| 直接訊息 | 支援     |
| 聊天室           | 支援     |
| 對話串         | 不支援 |
| 媒體           | 僅限 URL      |
| 回應       | 支援     |
| 原生指令 | 不支援 |

## 設定參考（Nextcloud Talk）

完整設定：[設定](/zh-TW/gateway/configuration)

Provider 選項：

- `channels.nextcloud-talk.enabled`：啟用/停用 channel 啟動。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 執行個體 URL。
- `channels.nextcloud-talk.botSecret`：機器人 shared secret。
- `channels.nextcloud-talk.botSecretFile`：一般檔案 secret 路徑。symlink 會被拒絕。
- `channels.nextcloud-talk.apiUser`：用於聊天室查詢的 API 使用者（DM 偵測）。
- `channels.nextcloud-talk.apiPassword`：用於聊天室查詢的 API/app 密碼。
- `channels.nextcloud-talk.apiPasswordFile`：API 密碼檔案路徑。
- `channels.nextcloud-talk.webhookPort`：Webhook listener 連接埠（預設：8788）。
- `channels.nextcloud-talk.webhookHost`：Webhook host（預設：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：Webhook path（預設：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可存取的 Webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：DM 允許清單（使用者 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群組允許清單（使用者 ID）。
- `channels.nextcloud-talk.rooms`：各聊天室設定與允許清單。
- `channels.nextcloud-talk.historyLimit`：群組歷史記錄限制（0 會停用）。
- `channels.nextcloud-talk.dmHistoryLimit`：DM 歷史記錄限制（0 會停用）。
- `channels.nextcloud-talk.dms`：各 DM 覆寫（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：輸出文字區塊大小（字元）。
- `channels.nextcloud-talk.chunkMode`：`length`（預設）或 `newline`，在依長度分塊前先依空白行（段落邊界）分割。
- `channels.nextcloud-talk.blockStreaming`：停用此 channel 的區塊串流。
- `channels.nextcloud-talk.blockStreamingCoalesce`：區塊串流合併調校。
- `channels.nextcloud-talk.mediaMaxMb`：傳入媒體上限（MB）。

## 相關

- [Channels 概覽](/zh-TW/channels) — 所有支援的 channels
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [Channel 路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化

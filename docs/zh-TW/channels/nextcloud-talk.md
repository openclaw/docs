---
read_when:
    - 開發 Nextcloud Talk 頻道功能
summary: Nextcloud Talk 支援狀態、功能與設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

狀態：內建 Plugin（Webhook 機器人）。支援私訊、聊天室、回應和 Markdown 訊息。

## 內建 Plugin

Nextcloud Talk 在目前的 OpenClaw 版本中作為內建 Plugin 隨附，因此
一般的封裝建置不需要另外安裝。

如果你使用的是較舊的建置，或排除 Nextcloud Talk 的自訂安裝，
請直接安裝 npm 套件：

透過 CLI 安裝（npm registry）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

使用未指定版本的套件以跟隨目前的官方發行標籤。只有在需要可重現安裝時，
才固定精確版本。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細資訊：[Plugins](/zh-TW/tools/plugin)

## 快速設定（初學者）

1. 確認 Nextcloud Talk Plugin 可用。
   - 目前封裝的 OpenClaw 版本已經內建它。
   - 較舊或自訂安裝可使用上方命令手動新增。
2. 在你的 Nextcloud 伺服器上建立機器人：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 在目標聊天室設定中啟用機器人。
4. 設定 OpenClaw：
   - 設定：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或 env：`NEXTCLOUD_TALK_BOT_SECRET`（僅限預設帳戶）

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

- 機器人無法主動發起私訊。使用者必須先傳訊息給機器人。
- Webhook URL 必須可由 Gateway 存取；如果位於 proxy 後方，請設定 `webhookPublicUrl`。
- 機器人 API 不支援媒體上傳；媒體會以 URL 傳送。
- Webhook payload 不會區分私訊與聊天室；設定 `apiUser` + `apiPassword` 可啟用聊天室類型查詢（否則私訊會被視為聊天室）。

## 存取控制（私訊）

- 預設：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知寄件者會收到配對碼。
- 核准方式：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開私訊：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 僅比對 Nextcloud 使用者 ID；顯示名稱會被忽略。

## 聊天室（群組）

- 預設：`channels.nextcloud-talk.groupPolicy = "allowlist"`（以提及作為門檻）。
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

- 若不允許任何聊天室，請保持允許清單為空，或設定 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能

| 功能         | 狀態        |
| --------------- | ------------- |
| 私訊 | 支援     |
| 聊天室           | 支援     |
| 執行緒         | 不支援 |
| 媒體           | 僅限 URL      |
| 回應       | 支援     |
| 原生命令 | 不支援 |

## 設定參考（Nextcloud Talk）

完整設定：[設定](/zh-TW/gateway/configuration)

Provider 選項：

- `channels.nextcloud-talk.enabled`：啟用/停用 channel 啟動。
- `channels.nextcloud-talk.baseUrl`：Nextcloud instance URL。
- `channels.nextcloud-talk.botSecret`：機器人 shared secret。
- `channels.nextcloud-talk.botSecretFile`：一般檔案 secret 路徑。Symlink 會被拒絕。
- `channels.nextcloud-talk.apiUser`：用於聊天室查詢的 API 使用者（私訊偵測）。
- `channels.nextcloud-talk.apiPassword`：用於聊天室查詢的 API/app 密碼。
- `channels.nextcloud-talk.apiPasswordFile`：API 密碼檔案路徑。
- `channels.nextcloud-talk.webhookPort`：Webhook listener port（預設：8788）。
- `channels.nextcloud-talk.webhookHost`：Webhook host（預設：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：Webhook path（預設：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：可由外部存取的 Webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：私訊允許清單（使用者 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群組允許清單（使用者 ID）。
- `channels.nextcloud-talk.rooms`：每個聊天室的設定與允許清單。
- `channels.nextcloud-talk.historyLimit`：群組歷史記錄限制（0 表示停用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私訊歷史記錄限制（0 表示停用）。
- `channels.nextcloud-talk.dms`：每個私訊的覆寫（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：外送文字分塊大小（字元）。
- `channels.nextcloud-talk.chunkMode`：`length`（預設）或 `newline`，會先依空白行（段落邊界）分割，再依長度分塊。
- `channels.nextcloud-talk.blockStreaming`：停用此 channel 的區塊串流。
- `channels.nextcloud-talk.blockStreamingCoalesce`：區塊串流合併調校。
- `channels.nextcloud-talk.mediaMaxMb`：傳入媒體上限（MB）。

## 相關

- [Channels 概覽](/zh-TW/channels) — 所有支援的 channel
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [Channel Routing](/zh-TW/channels/channel-routing) — 訊息的 session routing
- [安全性](/zh-TW/gateway/security) — 存取模型與強化

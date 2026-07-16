---
read_when:
    - 你想要將 OpenClaw 連接至 LINE
    - 你需要設定 LINE 網路鉤子與認證資訊
    - 你想要 LINE 專用的訊息選項
summary: LINE Messaging API 外掛設定、組態與使用方式
title: LINE
x-i18n:
    generated_at: "2026-07-16T11:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連線至 OpenClaw。外掛會在閘道上作為網路鉤子
接收器執行，並使用你的 channel access token + channel secret 進行
驗證。

狀態：官方外掛，需另行安裝。支援私訊、群組聊天、媒體、
位置、Flex 訊息、範本訊息及快速回覆。
不支援表情回應與討論串。

## 安裝

設定頻道前，先安裝 LINE：

```bash
openclaw plugins install @openclaw/line
```

本機簽出版本（從 git 儲存庫執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers 帳號並開啟 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選擇）Provider，然後新增 **Messaging API** 頻道。
3. 從頻道設定複製 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 將網路鉤子 URL 設為你的閘道端點（必須使用 HTTPS）：

```text
https://gateway-host/line/webhook
```

閘道會回應 LINE 的網路鉤子驗證（GET），並在簽章與承載資料驗證完成後，
立即確認收到已簽署的傳入事件（POST）；代理程式處理則會以非同步方式繼續。
若需要自訂路徑，請設定 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE 簽章驗證取決於主體內容（針對原始主體計算 HMAC），因此 OpenClaw 會在驗證前套用嚴格的未驗證主體大小限制（64 KB）及讀取逾時。
- OpenClaw 會使用已驗證的原始請求位元組處理網路鉤子事件。為確保簽章完整性，會忽略經上游中介軟體轉換的 `req.body` 值。

## 設定

最小設定：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

公開私訊設定：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

環境變數（僅適用於預設帳號）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

權杖／密鑰檔案：

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` 和 `secretFile` 必須指向一般檔案。符號連結會遭拒絕。
行內設定值的優先順序高於檔案；環境變數是預設帳號最後使用的備援值。

多個帳號：

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 存取控制

私訊預設採用配對。未知傳送者會收到配對碼，在核准前，
其訊息將被忽略：

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單與原則：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`（預設為 `pairing`）
- `channels.line.allowFrom`：私訊允許清單中的 LINE 使用者 ID；`dmPolicy: "open"` 必須搭配 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`（預設為 `allowlist`）
- `channels.line.groupAllowFrom`：群組允許清單中的 LINE 使用者 ID；私訊的 `allowFrom` 項目不會允許群組傳送者
- 每個群組的覆寫設定：`channels.line.groups.<groupId>.allowFrom`（以及 `enabled`、`requireMention`、`systemPrompt`、`skills`）。使用
  `groupPolicy: "allowlist"` 時，請設定 `groupAllowFrom` 或各群組的 `allowFrom`；即使私訊已開放，空白的群組允許清單仍會封鎖群組訊息。
- 可透過 `accessGroup:<name>`，從 `allowFrom`、`groupAllowFrom` 及各群組的 `allowFrom` 參照靜態傳送者存取群組；請參閱[存取群組](/zh-TW/channels/access-groups)。
- 執行階段注意事項：若完全缺少 `channels.line`，執行階段會回退使用 `groupPolicy="allowlist"` 進行群組檢查（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 的格式如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分段。
- Markdown 格式會被移除；在可行的情況下，程式碼區塊和表格會轉換成 Flex
  卡片。
- 串流回應會先緩衝；代理程式工作期間，LINE 會顯示載入
  動畫，並接收完整分段。
- 媒體下載上限由 `channels.line.mediaMaxMb` 控制（預設為 10）。
- 傳入媒體在傳遞給代理程式前，會儲存至 `~/.openclaw/media/inbound/`，
  與其他頻道外掛使用的共用媒體儲存區一致。

## 頻道資料（豐富訊息）

使用 `channelData.line` 傳送快速回覆、位置、Flex 卡片或範本
訊息。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {/* Flex payload */},
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE 外掛也隨附用於 Flex 訊息預設集的 `/card` 命令：

```text
/card info "歡迎" "感謝加入！"
```

## ACP 支援

LINE 支援 ACP（代理程式通訊協定）對話繫結：

- `/acp spawn <agent> --bind here` 會將目前的 LINE 聊天繫結至 ACP 工作階段，而不建立子討論串。
- 已設定的 ACP 繫結及對話繫結中的作用中 ACP 工作階段，在 LINE 上的運作方式與其他對話頻道相同。

詳情請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE 外掛會透過代理程式訊息工具傳送圖片、影片和音訊：

- **圖片**：以 LINE 圖片訊息傳送；預覽圖片預設使用媒體 URL。
- **影片**：需要預覽圖片；請將 `channelData.line.previewImageUrl` 設為圖片 URL。
- **音訊**：以 LINE 音訊訊息傳送；除非已設定 `channelData.line.durationMs`，否則時間長度預設為 60 秒。

若已設定 `channelData.line.mediaKind`，媒體類型會採用其值；否則會根據
其他 LINE 選項或 URL 檔案副檔名推斷，並以圖片作為備援類型。

傳出媒體 URL 必須是長度不超過 2000 個字元的公開 HTTPS URL。OpenClaw
會先驗證目標主機名稱，再將 URL 交給 LINE，並拒絕回送、
鏈路本機和私人網路目標。

未包含 LINE 專屬選項的一般媒體傳送會使用圖片路徑。

## 疑難排解

- **網路鉤子驗證失敗：**請確認網路鉤子 URL 使用 HTTPS，且
  `channelSecret` 與 LINE Console 相符。
- **沒有傳入事件：**請確認網路鉤子路徑與 `channels.line.webhookPath`
  相符，且 LINE 可連線至閘道。
- **媒體下載錯誤：**若媒體超過預設限制，請提高 `channels.line.mediaMaxMb`。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化

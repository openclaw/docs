---
read_when:
    - 設定 Mattermost
    - 偵錯 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 機器人設定與 OpenClaw 組態
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T02:43:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e83d7d4a1b60822f5efdb004fb28e26764b7cd70b3c78296b882d38d51241ae
    source_path: channels/mattermost.md
    workflow: 16
---

狀態：內建 Plugin（機器人權杖 + WebSocket 事件）。支援頻道、群組和 DM。Mattermost 是可自行託管的團隊訊息平台；產品詳細資訊與下載請參閱官方網站 [mattermost.com](https://mattermost.com)。

## 內建 Plugin

<Note>
Mattermost 在目前的 OpenClaw 版本中以內建 Plugin 提供，因此一般封裝建置不需要另外安裝。
</Note>

如果你使用的是較舊的建置，或是不包含 Mattermost 的自訂安裝，請在 npm 套件發布後安裝目前版本：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="本機 checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

如果 npm 回報 OpenClaw 擁有的套件已棄用，請使用目前封裝的
OpenClaw 建置或本機 checkout 路徑，直到較新的 npm 套件
發布為止。

詳細資訊：[Plugins](/zh-TW/tools/plugin)

## 快速設定

<Steps>
  <Step title="確認 Plugin 可用">
    目前封裝的 OpenClaw 版本已經內建。較舊或自訂安裝可用上方命令手動新增。
  </Step>
  <Step title="建立 Mattermost 機器人">
    建立 Mattermost 機器人帳號並複製**機器人權杖**。
  </Step>
  <Step title="複製基底 URL">
    複製 Mattermost **基底 URL**（例如 `https://chat.example.com`）。
  </Step>
  <Step title="設定 OpenClaw 並啟動 gateway">
    最小設定：

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## 原生斜線命令

原生斜線命令需選擇啟用。啟用後，OpenClaw 會透過 Mattermost API 註冊 `oc_*` 斜線命令，並在 Gateway HTTP 伺服器上接收 callback POST。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="行為注意事項">
    - `native: "auto"` 對 Mattermost 預設為停用。設定 `native: true` 以啟用。
    - 如果省略 `callbackUrl`，OpenClaw 會從 Gateway host/port + `callbackPath` 推導一個 URL。
    - 對於多帳號設定，`commands` 可以設定在頂層，或設定在 `channels.mattermost.accounts.<id>.commands` 底下（帳號值會覆寫頂層欄位）。
    - 命令 callback 會使用 OpenClaw 註冊 `oc_*` 命令時 Mattermost 傳回的每個命令權杖進行驗證。
    - OpenClaw 會在接受每個 callback 之前重新整理目前的 Mattermost 命令註冊，因此已刪除或重新產生的斜線命令所留下的過期權杖，會在不重新啟動 Gateway 的情況下停止被接受。
    - 如果 Mattermost API 無法確認命令仍為目前版本，callback 驗證會安全失敗；失敗的驗證會短暫快取，並行查詢會合併，新的查詢啟動會依每個命令進行速率限制，以限制重放壓力。
    - 當註冊失敗、啟動只部分完成，或 callback 權杖與解析出的命令註冊權杖不相符時，斜線 callback 會安全失敗（對某個命令有效的權杖無法到達另一個命令的上游驗證）。

  </Accordion>
  <Accordion title="可連線需求">
    callback 端點必須能從 Mattermost 伺服器連線。

    - 除非 Mattermost 與 OpenClaw 執行在同一個主機/網路命名空間，否則不要將 `callbackUrl` 設為 `localhost`。
    - 除非該 URL 會將 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否則不要將 `callbackUrl` 設為你的 Mattermost 基底 URL。
    - 快速檢查方式是 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 應該從 OpenClaw 傳回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 輸出允許清單">
    如果你的 callback 目標是 private/tailnet/internal 位址，請將 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` 設為包含 callback 主機/網域。

    使用主機/網域項目，不要使用完整 URL。

    - 正確：`gateway.tailnet-name.ts.net`
    - 錯誤：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境變數（預設帳號）

如果你偏好 env vars，請在 Gateway 主機上設定這些項目：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env vars 只套用至**預設**帳號（`default`）。其他帳號必須使用設定值。

`MATTERMOST_URL` 無法從 workspace `.env` 設定；請參閱 [Workspace `.env` 檔案](/zh-TW/gateway/security)。
</Note>

## 聊天模式

Mattermost 會自動回應 DM。頻道行為由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（預設）">
    只在頻道中被 @提及時回應。
  </Tab>
  <Tab title="onmessage">
    回應每則頻道訊息。
  </Tab>
  <Tab title="onchar">
    當訊息以觸發前綴開頭時回應。
  </Tab>
</Tabs>

設定範例：

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

注意事項：

- `onchar` 仍會回應明確的 @提及。
- 舊版設定仍支援 `channels.mattermost.requireMention`，但建議使用 `chatmode`。

## 對話串與 session

使用 `channels.mattermost.replyToMode` 控制頻道與群組回覆要留在主要頻道，還是在觸發貼文下方開始對話串。

- `off`（預設）：只有在傳入貼文本來就在對話串中時，才在對話串中回覆。
- `first`：對於頂層頻道/群組貼文，在該貼文下方開始對話串，並將對話路由到對話串範圍的 session。
- `all`：目前在 Mattermost 中的行為與 `first` 相同。
- 私人訊息會忽略此設定，並維持非對話串形式。

設定範例：

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

注意事項：

- 對話串範圍的 session 會使用觸發貼文 id 作為對話串根。
- `first` 和 `all` 目前等效，因為一旦 Mattermost 有對話串根，後續 chunk 和媒體就會繼續留在同一個對話串中。

## 存取控制（DM）

- 預設：`channels.mattermost.dmPolicy = "pairing"`（未知寄件者會收到配對碼）。
- 核准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。

## 頻道（群組）

- 預設：`channels.mattermost.groupPolicy = "allowlist"`（由提及控管）。
- 使用 `channels.mattermost.groupAllowFrom` 允許清單寄件者（建議使用使用者 ID）。
- 每個頻道的提及覆寫位於 `channels.mattermost.groups.<channelId>.requireMention` 底下，或使用 `channels.mattermost.groups["*"].requireMention` 作為預設。
- `@username` 比對是可變的，且只在 `channels.mattermost.dangerouslyAllowNameMatching: true` 時啟用。
- 開放頻道：`channels.mattermost.groupPolicy="open"`（由提及控管）。
- 執行階段注意事項：如果完全缺少 `channels.mattermost`，執行階段會在群組檢查時退回到 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

範例：

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 對外傳送目標

搭配 `openclaw message send` 或 cron/webhooks 使用這些目標格式：

- `channel:<id>` 用於頻道
- `user:<id>` 用於 DM
- `@username` 用於 DM（透過 Mattermost API 解析）

<Warning>
裸露的不透明 ID（例如 `64ifufp...`）在 Mattermost 中是**模稜兩可**的（使用者 ID 與頻道 ID）。

OpenClaw 會以**使用者優先**解析：

- 如果該 ID 作為使用者存在（`GET /api/v4/users/<id>` 成功），OpenClaw 會透過 `/api/v4/channels/direct` 解析直接頻道，並傳送 **DM**。
- 否則該 ID 會被視為**頻道 ID**。

如果你需要確定性行為，請一律使用明確前綴（`user:<id>` / `channel:<id>`）。
</Warning>

## DM 頻道重試

當 OpenClaw 傳送到 Mattermost DM 目標且需要先解析直接頻道時，預設會重試暫時性的直接頻道建立失敗。

使用 `channels.mattermost.dmChannelRetry` 全域調整 Mattermost Plugin 的該行為，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 調整單一帳號。

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

注意事項：

- 這只套用至 DM 頻道建立（`/api/v4/channels/direct`），不是每個 Mattermost API 呼叫。
- 重試會套用至暫時性失敗，例如速率限制、5xx 回應，以及網路或逾時錯誤。
- 除了 `429` 以外的 4xx 用戶端錯誤會視為永久錯誤，不會重試。

## 預覽串流

Mattermost 會將思考、工具活動與部分回覆文字串流到單一**草稿預覽貼文**，在最終答案可安全傳送時就地完成。預覽會在同一個貼文 id 上更新，而不是用每個 chunk 的訊息洗版頻道。媒體/錯誤最終結果會取消待處理的預覽編輯，並使用一般傳送方式，而不是送出一次性的預覽貼文。

透過 `channels.mattermost.streaming` 啟用：

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="串流模式">
    - `partial` 是通常的選擇：一個預覽貼文會隨著回覆增長而編輯，然後以完整答案完成。
    - `block` 在預覽貼文內使用追加樣式的草稿 chunk。
    - `progress` 會在生成時顯示狀態預覽，並且只在完成時發布最終答案。
    - `off` 會停用預覽串流。

  </Accordion>
  <Accordion title="串流行為注意事項">
    - 如果串流無法就地完成（例如貼文在串流中途被刪除），OpenClaw 會退回到傳送新的最終貼文，因此回覆永遠不會遺失。
    - 只有推理的 payload 會從頻道貼文中抑制，包括以 `> Reasoning:` blockquote 到達的文字。設定 `/reasoning on` 可在其他表面查看思考；Mattermost 最終貼文只保留答案。
    - 請參閱 [Streaming](/zh-TW/concepts/streaming#preview-streaming-modes) 了解頻道對應矩陣。

  </Accordion>
</AccordionGroup>

## 回應（message tool）

- 使用 `message action=react` 搭配 `channel=mattermost`。
- `messageId` 是 Mattermost 貼文 id。
- `emoji` 接受像 `thumbsup` 或 `:+1:` 的名稱（冒號可省略）。
- 設定 `remove=true`（布林值）以移除回應。
- 回應新增/移除事件會作為系統事件轉發到已路由的 agent session。

範例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定：

- `channels.mattermost.actions.reactions`：啟用/停用回應動作（預設 true）。
- 每帳號覆寫：`channels.mattermost.accounts.<id>.actions.reactions`。

## 互動式按鈕（message tool）

傳送含有可點擊按鈕的訊息。當使用者點擊按鈕時，agent 會收到選擇並可回應。

透過將 `inlineButtons` 新增至頻道 capabilities 來啟用按鈕：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用 `message action=send` 搭配 `buttons` 參數。按鈕是 2D 陣列（按鈕列）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按鈕欄位：

<ParamField path="text" type="string" required>
  顯示標籤。
</ParamField>
<ParamField path="callback_data" type="string" required>
  點擊時傳回的值（用作動作 ID）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  按鈕樣式。
</ParamField>

當使用者點擊按鈕時：

<Steps>
  <Step title="按鈕會替換為確認訊息">
    所有按鈕都會替換為一行確認訊息（例如「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="Agent 會收到選取項目">
    Agent 會將選取項目作為傳入訊息接收並回應。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="實作注意事項">
    - 按鈕回呼使用 HMAC-SHA256 驗證（自動進行，不需要設定）。
    - Mattermost 會從其 API 回應中移除回呼資料（安全性功能），因此點擊時會移除所有按鈕，無法只移除部分按鈕。
    - 包含連字號或底線的動作 ID 會自動清理（Mattermost 路由限制）。

  </Accordion>
  <Accordion title="設定與可連線性">
    - `channels.mattermost.capabilities`：功能字串陣列。加入 `"inlineButtons"` 可在 Agent 系統提示中啟用按鈕工具說明。
    - `channels.mattermost.interactions.callbackBaseUrl`：按鈕回呼的可選外部基底 URL（例如 `https://gateway.example.com`）。當 Mattermost 無法直接透過 Gateway 的繫結主機連線時使用此項。
    - 在多帳號設定中，你也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下設定相同欄位。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 會從 `gateway.customBindHost` + `gateway.port` 衍生回呼 URL，然後後援到 `http://localhost:<port>`。
    - 可連線性規則：按鈕回呼 URL 必須能從 Mattermost 伺服器連線。`localhost` 只有在 Mattermost 和 OpenClaw 執行於同一主機／網路命名空間時才有效。
    - 如果你的回呼目標是私有／tailnet／內部目標，請將其主機／網域加入 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 整合（外部腳本）

外部腳本和 Webhook 可以透過 Mattermost REST API 直接發布按鈕，而不是透過 Agent 的 `message` 工具。可行時請使用 Plugin 提供的 `buildButtonAttachments()`；如果要發布原始 JSON，請遵循這些規則：

**酬載結構：**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**重要規則**

1. 附件要放在 `props.attachments`，不是最上層的 `attachments`（會被默默忽略）。
2. 每個動作都需要 `type: "button"`，否則點擊會被默默吞掉。
3. 每個動作都需要 `id` 欄位，Mattermost 會忽略沒有 ID 的動作。
4. 動作 `id` 必須**僅限英數字元**（`[a-zA-Z0-9]`）。連字號和底線會破壞 Mattermost 的伺服器端動作路由（回傳 404）。使用前請將它們移除。
5. `context.action_id` 必須符合按鈕的 `id`，這樣確認訊息才會顯示按鈕名稱（例如「Approve」），而不是原始 ID。
6. `context.action_id` 是必填，沒有它時互動處理常式會回傳 400。

</Warning>

**HMAC Token 產生**

Gateway 使用 HMAC-SHA256 驗證按鈕點擊。外部腳本必須產生符合 Gateway 驗證邏輯的 Token：

<Steps>
  <Step title="從 Bot Token 衍生 Secret">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="建構 context 物件">
    建構包含所有欄位但**不包含** `_token` 的 context 物件。
  </Step>
  <Step title="使用排序後的鍵進行序列化">
    使用**排序後的鍵**且**不含空格**進行序列化（Gateway 使用帶有排序鍵的 `JSON.stringify`，會產生緊湊輸出）。
  </Step>
  <Step title="簽署酬載">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="加入 Token">
    將產生的十六進位摘要作為 `_token` 加入 context。
  </Step>
</Steps>

Python 範例：

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="常見 HMAC 陷阱">
    - Python 的 `json.dumps` 預設會加入空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 以符合 JavaScript 的緊湊輸出（`{"key":"val"}`）。
    - 一律簽署**所有** context 欄位（扣除 `_token`）。Gateway 會移除 `_token`，然後簽署其餘所有內容。只簽署子集會導致驗證無聲失敗。
    - 使用 `sort_keys=True`，Gateway 會在簽署前排序鍵，而 Mattermost 儲存酬載時可能會重新排序 context 欄位。
    - 從 Bot Token 衍生 Secret（確定性），不要使用隨機位元組。建立按鈕的程序和進行驗證的 Gateway 必須使用相同 Secret。

  </Accordion>
</AccordionGroup>

## 目錄轉接器

Mattermost Plugin 包含一個目錄轉接器，會透過 Mattermost API 解析頻道和使用者名稱。這會在 `openclaw message send` 和 cron／webhook 傳遞中啟用 `#channel-name` 與 `@username` 目標。

不需要設定，轉接器會使用帳號設定中的 Bot Token。

## 多帳號

Mattermost 支援在 `channels.mattermost.accounts` 下設定多個帳號：

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    請確認 Bot 已加入頻道並提及它（oncall）、使用觸發前綴（onchar），或設定 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="驗證或多帳號錯誤">
    - 檢查 Bot Token、基底 URL，以及帳號是否已啟用。
    - 多帳號問題：環境變數只會套用到 `default` 帳號。

  </Accordion>
  <Accordion title="原生斜線命令失敗">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回呼 Token。典型原因包括：
      - 斜線命令註冊在啟動時失敗，或只完成部分註冊
      - 回呼打到了錯誤的 Gateway／帳號
      - Mattermost 仍有指向舊回呼目標的舊命令
      - Gateway 重新啟動後沒有重新啟用斜線命令
    - 如果原生斜線命令停止運作，請檢查日誌中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略 `callbackUrl`，且日誌警告回呼解析為 `http://127.0.0.1:18789/...`，該 URL 可能只有在 Mattermost 和 OpenClaw 執行於同一主機／網路命名空間時才能連線。請改為設定明確且可從外部連線的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按鈕問題">
    - 按鈕顯示為白色方塊：Agent 可能正在傳送格式錯誤的按鈕資料。請檢查每個按鈕是否同時具有 `text` 和 `callback_data` 欄位。
    - 按鈕可以顯示，但點擊沒有作用：確認 Mattermost 伺服器設定中的 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，且 ServiceSettings 中的 `EnablePostActionIntegration` 為 `true`。
    - 點擊按鈕回傳 404：按鈕 `id` 可能包含連字號或底線。Mattermost 的動作路由器會因非英數 ID 而失效。請只使用 `[a-zA-Z0-9]`。
    - Gateway 日誌顯示 `invalid _token`：HMAC 不相符。檢查你是否簽署所有 context 欄位（而不是子集）、使用排序鍵，並使用緊湊 JSON（不含空格）。請參閱上方的 HMAC 章節。
    - Gateway 日誌顯示 `missing _token in context`：`_token` 欄位不在按鈕的 context 中。建構整合酬載時請確認已包含它。
    - 確認訊息顯示原始 ID，而不是按鈕名稱：`context.action_id` 與按鈕的 `id` 不相符。請將兩者設定為相同的清理後值。
    - Agent 不知道按鈕：將 `capabilities: ["inlineButtons"]` 加入 Mattermost 頻道設定。

  </Accordion>
</AccordionGroup>

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [安全性](/zh-TW/gateway/security) — 存取模型與強化

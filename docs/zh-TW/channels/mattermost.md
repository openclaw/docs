---
read_when:
    - 設定 Mattermost
    - 偵錯 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost Bot 設定與 OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T18:56:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

狀態：可下載的外掛（機器人權杖 + WebSocket 事件）。支援頻道、群組與私訊。Mattermost 是可自行託管的團隊訊息平台；產品詳細資訊與下載請參閱官方網站 [mattermost.com](https://mattermost.com)。

## 安裝

設定頻道前，請先安裝 Mattermost：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

<Steps>
  <Step title="Ensure plugin is available">
    使用上方命令安裝 `@openclaw/mattermost`，如果閘道已在執行，請重新啟動。
  </Step>
  <Step title="Create a Mattermost bot">
    建立 Mattermost 機器人帳號並複製**機器人權杖**。
  </Step>
  <Step title="Copy the base URL">
    複製 Mattermost **base URL**（例如 `https://chat.example.com`）。
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

原生斜線命令採用選擇啟用。啟用後，OpenClaw 會透過 Mattermost API 註冊 `oc_*` 斜線命令，並在閘道 HTTP 伺服器上接收回呼 POST。

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
  <Accordion title="Behavior notes">
    - `native: "auto"` 對 Mattermost 預設為停用。設定 `native: true` 即可啟用。
    - 如果省略 `callbackUrl`，OpenClaw 會從閘道主機/連接埠 + `callbackPath` 推導出一個值。
    - 對於多帳號設定，`commands` 可以設在最上層，或設在 `channels.mattermost.accounts.<id>.commands` 下（帳號值會覆寫最上層欄位）。
    - 命令回呼會使用 OpenClaw 註冊 `oc_*` 命令時 Mattermost 傳回的個別命令權杖進行驗證。
    - OpenClaw 會在接受每個回呼前重新整理目前的 Mattermost 命令註冊，因此已刪除或重新產生的斜線命令所留下的過期權杖，無須重新啟動閘道就會停止被接受。
    - 如果 Mattermost API 無法確認命令仍是目前版本，回呼驗證會失敗關閉；失敗的驗證會短暫快取，並行查詢會合併，新的查詢啟動會依命令進行速率限制，以限制重放壓力。
    - 當註冊失敗、啟動不完整，或回呼權杖與已解析命令的註冊權杖不符時，斜線回呼會失敗關閉（對某個命令有效的權杖，無法觸及另一個命令的上游驗證）。

  </Accordion>
  <Accordion title="Reachability requirement">
    回呼端點必須能從 Mattermost 伺服器連線到。

    - 除非 Mattermost 與 OpenClaw 執行在同一台主機/網路命名空間，否則不要將 `callbackUrl` 設為 `localhost`。
    - 除非該 URL 會將 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否則不要將 `callbackUrl` 設為你的 Mattermost base URL。
    - 快速檢查方式是 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 應該從 OpenClaw 傳回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    如果你的回呼目標是私有/tailnet/內部位址，請設定 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`，納入回呼主機/網域。

    使用主機/網域項目，不要使用完整 URL。

    - 正確：`gateway.tailnet-name.ts.net`
    - 錯誤：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境變數（預設帳號）

如果你偏好使用環境變數，請在閘道主機上設定：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境變數只會套用到**預設**帳號（`default`）。其他帳號必須使用設定值。

`MATTERMOST_URL` 無法從工作區 `.env` 設定；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。
</Note>

## 聊天模式

Mattermost 會自動回應私訊。頻道行為由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall (default)">
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
- 機器人在頻道討論串中傳送可見回覆後，同一討論串中的後續訊息會在沒有新的 @提及或 `onchar` 前綴時被回答，因此多輪討論串對話能持續進行。參與狀態會記住 7 天的討論串閒置時間（每次回覆都會重新整理），並在閘道重新啟動後保留。機器人只觀察過的討論串不受影響；若要再次要求明確提及，請開始新的頂層訊息。

## 討論串與工作階段

使用 `channels.mattermost.replyToMode` 控制頻道與群組回覆是否留在主頻道，或在觸發貼文下開始討論串。

- `off`（預設）：只有在傳入貼文本身已位於討論串中時，才在線程中回覆。
- `first`：對於頂層頻道/群組貼文，在該貼文下開始討論串，並將對話路由到討論串範圍的工作階段。
- `all`：以目前 Mattermost 而言，行為與 `first` 相同。
- 私訊會忽略此設定，並保持非討論串形式。

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

- 討論串範圍的工作階段會使用觸發貼文 ID 作為討論串根。
- `first` 和 `all` 目前等效，因為 Mattermost 一旦有討論串根，後續分段與媒體會繼續留在同一討論串中。

## 存取控制（私訊）

- 預設：`channels.mattermost.dmPolicy = "pairing"`（未知寄件者會取得配對碼）。
- 透過以下方式核准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開私訊：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。
- `channels.mattermost.allowFrom` 接受 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。

## 頻道（群組）

- 預設：`channels.mattermost.groupPolicy = "allowlist"`（需提及）。
- 使用 `channels.mattermost.groupAllowFrom` 設定允許清單寄件者（建議使用使用者 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。
- 每個頻道的提及覆寫位於 `channels.mattermost.groups.<channelId>.requireMention` 下，或用 `channels.mattermost.groups["*"].requireMention` 作為預設。
- `@username` 比對是可變的，且只有在 `channels.mattermost.dangerouslyAllowNameMatching: true` 時才會啟用。
- 開放頻道：`channels.mattermost.groupPolicy="open"`（需提及）。
- 執行階段注意事項：如果完全缺少 `channels.mattermost`，執行階段在群組檢查時會退回 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

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

## 對外傳遞目標

搭配 `openclaw message send` 或 cron/網路鉤子使用這些目標格式：

- `channel:<id>` 表示頻道
- `user:<id>` 表示私訊
- `@username` 表示私訊（透過 Mattermost API 解析）

<Warning>
裸露的不透明 ID（例如 `64ifufp...`）在 Mattermost 中是**模稜兩可**的（使用者 ID 與頻道 ID）。

OpenClaw 會**使用者優先**解析：

- 如果該 ID 是既有使用者（`GET /api/v4/users/<id>` 成功），OpenClaw 會透過 `/api/v4/channels/direct` 解析直接頻道並傳送**私訊**。
- 否則該 ID 會被視為**頻道 ID**。

如果你需要決定性的行為，請一律使用明確前綴（`user:<id>` / `channel:<id>`）。
</Warning>

## 私訊頻道重試

當 OpenClaw 傳送到 Mattermost 私訊目標，且需要先解析直接頻道時，預設會重試暫時性的直接頻道建立失敗。

使用 `channels.mattermost.dmChannelRetry` 可為 Mattermost 外掛全域調整此行為，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 調整單一帳號。

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

- 這只適用於私訊頻道建立（`/api/v4/channels/direct`），不是每個 Mattermost API 呼叫。
- 重試適用於暫時性失敗，例如速率限制、5xx 回應，以及網路或逾時錯誤。
- 除 `429` 以外的 4xx 用戶端錯誤會被視為永久錯誤，不會重試。

## 預覽串流

Mattermost 會將思考、工具活動與部分回覆文字串流到單一**草稿預覽貼文**中，並在最終答案可安全傳送時就地定稿。預覽會在同一個貼文 ID 上更新，而不是用每個分段訊息洗版頻道。媒體/錯誤最終訊息會取消待處理的預覽編輯，並使用一般傳遞，而不是送出一次性的預覽貼文。

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
  <Accordion title="Streaming modes">
    - `partial` 是通常的選擇：一篇會隨回覆成長而編輯的預覽貼文，接著以完整答案定稿。
    - `block` 在預覽貼文內使用追加式草稿分段。
    - `progress` 會在生成時顯示狀態預覽，並只在完成時發佈最終答案。
    - `off` 會停用預覽串流。

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - 如果串流無法就地定稿（例如貼文在串流途中被刪除），OpenClaw 會退回傳送新的最終貼文，確保回覆不會遺失。
    - 僅思考的酬載會從頻道貼文中抑制，包括以 `> Thinking` 引用區塊抵達的文字。設定 `/reasoning on` 可在其他介面看到思考；Mattermost 的最終貼文只保留答案。
    - 請參閱[串流](/zh-TW/concepts/streaming#preview-streaming-modes)以了解頻道對應矩陣。

  </Accordion>
</AccordionGroup>

## 反應（訊息工具）

- 使用 `message action=react` 並搭配 `channel=mattermost`。
- `messageId` 是 Mattermost 貼文 ID。
- `emoji` 接受像 `thumbsup` 或 `:+1:` 這類名稱（冒號可省略）。
- 設定 `remove=true`（布林值）以移除反應。
- 新增/移除反應事件會作為系統事件轉送到已路由的代理工作階段。

範例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定：

- `channels.mattermost.actions.reactions`：啟用/停用反應動作（預設為 true）。
- 每帳號覆寫：`channels.mattermost.accounts.<id>.actions.reactions`。

## 互動式按鈕（訊息工具）

傳送含可點擊按鈕的訊息。當使用者點擊按鈕時，代理會收到選取項目並可以回應。

一般代理回覆也可以包含語意 `presentation` 承載資料。OpenClaw 會將值按鈕轉譯為 Mattermost 互動式按鈕，讓 URL 按鈕顯示在訊息文字中，並將選取選單降級為可讀文字。

若要啟用按鈕，請將 `inlineButtons` 加入頻道能力：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用 `message action=send` 並帶上 `buttons` 參數。按鈕是 2D 陣列（按鈕列）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按鈕欄位：

<ParamField path="text" type="string" required>
  顯示標籤。
</ParamField>
<ParamField path="callback_data" type="string" required>
  點擊後送回的值（用作動作 ID）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  按鈕樣式。
</ParamField>

當使用者點擊按鈕時：

<Steps>
  <Step title="按鈕會替換為確認訊息">
    所有按鈕都會替換為一行確認訊息（例如「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="代理收到選取結果">
    代理會將選取結果作為傳入訊息接收並回應。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="實作備註">
    - 按鈕回呼使用 HMAC-SHA256 驗證（自動處理，不需要設定）。
    - Mattermost 會從其 API 回應中移除回呼資料（安全功能），因此點擊後會移除所有按鈕，無法只移除部分按鈕。
    - 包含連字號或底線的動作 ID 會自動清理（Mattermost 路由限制）。

  </Accordion>
  <Accordion title="設定與可連線性">
    - `channels.mattermost.capabilities`：能力字串陣列。加入 `"inlineButtons"` 以在代理系統提示中啟用按鈕工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：按鈕回呼的選用外部基底 URL（例如 `https://gateway.example.com`）。當 Mattermost 無法直接透過閘道的繫結主機連到閘道時使用。
    - 在多帳號設定中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 底下設定相同欄位。
    - 若省略 `interactions.callbackBaseUrl`，OpenClaw 會從 `gateway.customBindHost` + `gateway.port` 推導回呼 URL，然後退回到 `http://localhost:<port>`。
    - 可連線性規則：按鈕回呼 URL 必須能從 Mattermost 伺服器連線。`localhost` 只在 Mattermost 和 OpenClaw 執行於同一主機/網路命名空間時有效。
    - 如果你的回呼目標是私有/tailnet/內部目標，請將其主機/網域加入 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 整合（外部指令碼）

外部指令碼和網路鉤子可以透過 Mattermost REST API 直接張貼按鈕，而不必透過代理的 `message` 工具。可行時，請使用外掛中的 `buildButtonAttachments()`；如果要張貼原始 JSON，請遵循以下規則：

**承載資料結構：**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
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
**關鍵規則**

1. 附件放在 `props.attachments`，而不是頂層 `attachments`（否則會被靜默忽略）。
2. 每個動作都需要 `type: "button"`，沒有它，點擊會被靜默吞掉。
3. 每個動作都需要 `id` 欄位，Mattermost 會忽略沒有 ID 的動作。
4. 動作 `id` 必須**只能是英數字元**（`[a-zA-Z0-9]`）。連字號和底線會破壞 Mattermost 的伺服器端動作路由（傳回 404）。使用前請移除它們。
5. `context.action_id` 必須符合按鈕的 `id`，讓確認訊息顯示按鈕名稱（例如「Approve」）而不是原始 ID。
6. `context.action_id` 是必要欄位，缺少它時互動處理常式會傳回 400。

</Warning>

**HMAC 權杖產生**

閘道會使用 HMAC-SHA256 驗證按鈕點擊。外部指令碼必須產生與閘道驗證邏輯相符的權杖：

<Steps>
  <Step title="從機器人權杖推導密鑰">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="建置 context 物件">
    建置包含所有欄位的 context 物件，但**不包含** `_token`。
  </Step>
  <Step title="使用排序後的鍵序列化">
    使用**排序後的鍵**且**沒有空格**進行序列化（閘道使用帶有排序鍵的 `JSON.stringify`，會產生精簡輸出）。
  </Step>
  <Step title="簽署承載資料">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="加入權杖">
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
    - Python 的 `json.dumps` 預設會加入空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 以符合 JavaScript 的精簡輸出（`{"key":"val"}`）。
    - 一律簽署**所有** context 欄位（扣除 `_token`）。閘道會移除 `_token`，然後簽署剩餘的所有內容。只簽署子集會造成靜默驗證失敗。
    - 使用 `sort_keys=True`，閘道會在簽署前排序鍵，且 Mattermost 儲存承載資料時可能重新排序 context 欄位。
    - 從機器人權杖推導密鑰（確定性），不要使用隨機位元組。建立按鈕的程序和驗證按鈕的閘道必須使用相同密鑰。

  </Accordion>
</AccordionGroup>

## 目錄配接器

Mattermost 外掛包含一個目錄配接器，會透過 Mattermost API 解析頻道和使用者名稱。這會在 `openclaw message send` 和排程/網路鉤子傳遞中啟用 `#channel-name` 和 `@username` 目標。

不需要設定，配接器會使用帳號設定中的機器人權杖。

## 多帳號

Mattermost 支援在 `channels.mattermost.accounts` 底下設定多個帳號：

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
    確認機器人在頻道中，並提及它（oncall）、使用觸發前綴（onchar），或設定 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="驗證或多帳號錯誤">
    - 檢查機器人權杖、基底 URL，以及帳號是否已啟用。
    - 多帳號問題：環境變數只會套用到 `default` 帳號。

  </Accordion>
  <Accordion title="原生斜線命令失敗">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回呼權杖。常見原因：
      - 斜線命令註冊在啟動時失敗或只完成一部分
      - 回呼打到錯誤的閘道/帳號
      - Mattermost 仍有舊命令指向先前的回呼目標
      - 閘道重新啟動後未重新啟用斜線命令
    - 如果原生斜線命令停止運作，請檢查記錄中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略 `callbackUrl`，且記錄警告回呼解析為 `http://127.0.0.1:18789/...`，該 URL 可能只有在 Mattermost 與 OpenClaw 執行於同一主機/網路命名空間時才可連線。請改為設定明確的外部可連線 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按鈕問題">
    - 按鈕顯示為白色方塊：代理可能正在傳送格式錯誤的按鈕資料。請檢查每個按鈕是否同時具有 `text` 和 `callback_data` 欄位。
    - 按鈕有轉譯但點擊沒有任何反應：確認 Mattermost 伺服器設定中的 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，且 ServiceSettings 中的 `EnablePostActionIntegration` 為 `true`。
    - 按鈕點擊後傳回 404：按鈕 `id` 可能包含連字號或底線。Mattermost 的動作路由器會在非英數字元 ID 上失效。只能使用 `[a-zA-Z0-9]`。
    - 閘道記錄 `invalid _token`：HMAC 不相符。請檢查你是否簽署所有 context 欄位（不是子集）、使用排序鍵，並使用精簡 JSON（沒有空格）。請參閱上方 HMAC 章節。
    - 閘道記錄 `missing _token in context`：`_token` 欄位不在按鈕的 context 中。請確認建置整合承載資料時有包含它。
    - 確認訊息顯示原始 ID 而非按鈕名稱：`context.action_id` 與按鈕的 `id` 不相符。請將兩者設定為相同的清理後值。
    - 代理不知道按鈕：將 `capabilities: ["inlineButtons"]` 加入 Mattermost 頻道設定。

  </Accordion>
</AccordionGroup>

## 相關

- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及控管
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [安全性](/zh-TW/gateway/security) - 存取模型與強化

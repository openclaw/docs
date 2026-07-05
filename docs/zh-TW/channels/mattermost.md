---
read_when:
    - 設定 Mattermost
    - 除錯 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 機器人設定與 OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-07-05T11:04:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a1e8c4688bcddbee15d64b388b24bfb03a3890fe05f98fbb47bb904f4a0bc29
    source_path: channels/mattermost.md
    workflow: 16
---

Status：可下載的外掛（Bot Token + WebSocket 事件）。支援頻道、私人頻道、群組 DM 和 DM。Mattermost 是可自行託管的團隊訊息平台（[mattermost.com](https://mattermost.com)）。

## 安裝

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

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

<Steps>
  <Step title="確認外掛可用">
    使用上述命令安裝 `@openclaw/mattermost`，如果閘道已在執行，請重新啟動閘道。
  </Step>
  <Step title="建立 Mattermost Bot">
    建立 Mattermost Bot 帳戶，複製 **Bot Token**，並將 Bot 新增到它應讀取的團隊和頻道。
  </Step>
  <Step title="複製基底 URL">
    複製 Mattermost **基底 URL**（例如 `https://chat.example.com`）。結尾的 `/api/v4` 會自動移除。
  </Step>
  <Step title="設定 OpenClaw 並啟動閘道">
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

    非互動式替代方式：

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
私人/LAN/tailnet 位址上的自託管 Mattermost：對外 Mattermost API 請求會通過 SSRF 防護，預設會封鎖私人與內部 IP。使用 `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` 選擇啟用（每個帳戶：`channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## 原生斜線命令

原生斜線命令為選擇啟用。啟用時，OpenClaw 會在 Bot 所屬的每個團隊上註冊 `oc_*` 斜線命令，並在閘道 HTTP 伺服器上接收 callback POST。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 當 Mattermost 無法直接連到閘道時使用（反向代理/公開 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

已註冊命令：`/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。搭配 `nativeSkills: true` 時，技能命令也會註冊為 `/oc_<skill>`。

<AccordionGroup>
  <Accordion title="行為備註">
    - `native` 和 `nativeSkills` 預設為 `"auto"`，對 Mattermost 解析為停用。請明確將它們設為 `true`。
    - `callbackPath` 預設為 `/api/channels/mattermost/command`。
    - 如果省略 `callbackUrl`，OpenClaw 會推導出 `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`。萬用字元綁定位址（`0.0.0.0`、`::`）會回退到 `localhost`。
    - 對於多帳戶設定，`commands` 可設定在頂層，或設定於 `channels.mattermost.accounts.<id>.commands` 底下（帳戶值會覆寫頂層欄位）。
    - 由其他整合以相同觸發字建立的現有斜線命令會保持不變（註冊會略過它們）；Bot 建立的命令會在 callback URL 漂移時更新或重新建立。
    - 命令 callback 會使用 Mattermost 在 OpenClaw 註冊 `oc_*` 命令時傳回的個別命令 Token 進行驗證。
    - OpenClaw 會在接受每個 callback 前重新整理目前的 Mattermost 命令註冊，因此已刪除或重新產生的斜線命令所留下的過期 Token，無需重新啟動閘道就會停止被接受。
    - 如果 Mattermost API 無法確認命令仍為目前版本，callback 驗證會失敗關閉；失敗的驗證會短暫快取，並行查詢會合併，而新的查詢開始會針對每個命令進行速率限制，以限制重放壓力。
    - 當註冊失敗、啟動不完整，或 callback Token 不符合已解析命令的已註冊 Token 時，斜線 callback 會失敗關閉（對某個命令有效的 Token 無法對不同命令進行上游驗證）。
    - 已接受的 callback 會以短暫可見的「Processing...」回覆確認；真正的答案會作為一般訊息送達。

  </Accordion>
  <Accordion title="可連線性要求">
    callback 端點必須能從 Mattermost 伺服器連線。

    - 除非 Mattermost 與 OpenClaw 在相同主機/網路命名空間中執行，否則不要將 `callbackUrl` 設為 `localhost`。
    - 除非該 URL 會將 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否則不要將 `callbackUrl` 設為你的 Mattermost 基底 URL。
    - 快速檢查為 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 應該從 OpenClaw 傳回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 輸出允許清單">
    如果你的 callback 目標是私人/tailnet/內部位址，請設定 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` 以包含 callback 主機/網域。

    使用主機/網域項目，而不是完整 URL。

    - 正確：`gateway.tailnet-name.ts.net`
    - 錯誤：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境變數（預設帳戶）

如果你偏好使用環境變數，請在閘道主機上設定：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境變數只會套用到**預設**帳戶（`default`）。其他帳戶必須使用設定值。

`MATTERMOST_URL` 不能從工作區 `.env` 設定；請參閱[工作區 .env 檔案](/zh-TW/gateway/security)。
</Note>

## 聊天模式

Mattermost 會自動回應 DM。頻道行為由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（預設）">
    僅在頻道中被 @提及時回應。
  </Tab>
  <Tab title="onmessage">
    回應每則頻道訊息。
  </Tab>
  <Tab title="onchar">
    在訊息以觸發前綴開頭時回應。
  </Tab>
</Tabs>

設定範例：

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // default
    },
  },
}
```

備註：

- `onchar` 仍會回應明確的 @提及。
- `channels.mattermost.requireMention` 仍會被遵循，但優先使用 `chatmode`。每個頻道的 `groups.<channelId>.requireMention` 設定優先於兩者。
- Bot 在頻道執行緒中傳送可見回覆後，該同一執行緒中的後續訊息無需新的 @提及或 `onchar` 前綴也會得到回答，因此多輪執行緒對話會保持流暢。參與狀態會在 Bot 最後於該執行緒回覆後記住 7 天，並會在閘道重新啟動後持續存在。Bot 只觀察過的執行緒不受影響；請開始新的頂層訊息以再次要求明確提及。

## 執行緒與工作階段

使用 `channels.mattermost.replyToMode` 控制頻道和群組回覆是留在主要頻道中，還是在觸發貼文下方開始執行緒。

- `off`（預設）：只有當傳入貼文已經在執行緒中時，才在執行緒中回覆。
- `first`：對頂層頻道/群組貼文，在該貼文下方開始執行緒，並將對話路由到執行緒範圍的工作階段。
- `all` 和 `batched`：目前對 Mattermost 而言行為與 `first` 相同，因為 Mattermost 一旦有執行緒根，後續片段和媒體會繼續留在同一個執行緒中。
- 直接訊息會忽略此設定，並保持非執行緒形式。

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

執行緒範圍的工作階段使用觸發貼文 ID 作為執行緒根。

## 存取控制（DM）

- 預設：`channels.mattermost.dmPolicy = "pairing"`（未知傳送者會取得配對碼）。其他值：`allowlist`、`open`、`disabled`。
- 透過以下方式核准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`（設定 schema 會強制要求萬用字元）。
- `channels.mattermost.allowFrom` 接受使用者 ID（建議）和 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。

## 頻道（群組）

- 預設：`channels.mattermost.groupPolicy = "allowlist"`（以提及作為門檻）。
- 使用 `channels.mattermost.groupAllowFrom` 將傳送者加入允許清單（建議使用使用者 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。
- 每個頻道的提及覆寫位於 `channels.mattermost.groups.<channelId>.requireMention` 底下，或以 `channels.mattermost.groups["*"].requireMention` 作為預設。
- `@username` 比對是可變的，且只有在 `channels.mattermost.dangerouslyAllowNameMatching: true` 時才會啟用。
- 開放頻道：`channels.mattermost.groupPolicy="open"`（以提及作為門檻）。
- 解析順序：`channels.mattermost.groupPolicy`，然後是 `channels.defaults.groupPolicy`，然後是 `"allowlist"`。
- 執行階段備註：如果完全缺少 `channels.mattermost` 區段，執行階段會對群組檢查失敗關閉為 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`），並記錄一次性警告。

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

將這些目標格式與 `openclaw message send` 或排程/網路鉤子搭配使用：

| 目標                                | 傳遞到                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | 依 ID 指定的頻道                                              |
| `channel:<name>` 或 `#channel-name` | 依名稱指定的頻道，會在 Bot 所屬的團隊中搜尋                  |
| `user:<id>` 或 `mattermost:<id>`    | 與該使用者的 DM                                               |
| `@username`                         | DM（透過 Mattermost API 解析使用者名稱）                     |

對外傳送每則訊息最多支援一個附件；請將多個檔案拆分為多次傳送。

<Warning>
裸露的不透明 ID（例如 `64ifufp...`）在 Mattermost 中是**模糊的**（使用者 ID 與頻道 ID）。

OpenClaw 會**使用者優先**解析它們：

- 如果該 ID 作為使用者存在（`GET /api/v4/users/<id>` 成功），OpenClaw 會透過 `/api/v4/channels/direct` 解析直接頻道並傳送 **DM**。
- 否則該 ID 會被視為**頻道 ID**。

如果你需要確定性的行為，請一律使用明確前綴（`user:<id>` / `channel:<id>`）。
</Warning>

## DM 頻道重試

當 OpenClaw 傳送到 Mattermost DM 目標且需要先解析直接頻道時，預設會重試暫時性的直接頻道建立失敗。

使用 `channels.mattermost.dmChannelRetry` 為 Mattermost 外掛全域調整該行為，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 為單一帳戶調整。預設值：

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

備註：

- 這只套用於 DM 頻道建立（`/api/v4/channels/direct`），而不是每個 Mattermost API 呼叫。
- 重試會使用帶有 jitter 的指數退避，並套用於暫時性失敗，例如速率限制、5xx 回應，以及網路或逾時錯誤。
- 除了 `429` 以外的 4xx 用戶端錯誤會被視為永久錯誤，不會重試。

## 預覽串流

Mattermost 會將思考、工具活動和部分回覆文字串流到單一 **草稿預覽貼文**，並在最終答案可安全送出時就地定稿。預覽會在同一個貼文 ID 上更新，而不是用逐區塊訊息洗版頻道。媒體/錯誤的最終訊息會取消待處理的預覽編輯，並改用一般傳遞方式，而不是送出一次性的預覽貼文。

預覽串流在 `partial` 模式中**預設啟用**。透過 `channels.mattermost.streaming` 設定（模式字串、布林值，或像 `{ mode: "progress" }` 這樣的物件）：

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
    - `partial`（預設）：一則預覽貼文，會隨著回覆增加而編輯，然後以完整答案定稿。
    - `block` 會在預覽貼文內使用附加樣式的草稿區塊。
    - `progress` 會在產生期間顯示狀態預覽，並且只在完成時張貼最終答案。
    - `off` 會停用預覽串流。

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - 如果串流無法就地定稿（例如貼文在串流中途被刪除），OpenClaw 會退回為傳送新的最終貼文，確保回覆不會遺失。
    - 純思考承載內容會從頻道貼文中抑制，包括以 `> Thinking` 區塊引用抵達的文字。設定 `/reasoning on` 可在其他介面查看思考；Mattermost 最終貼文只保留答案。
    - 請參閱[串流](/zh-TW/concepts/streaming#preview-streaming-modes)了解頻道對應矩陣。

  </Accordion>
</AccordionGroup>

## 回應（訊息工具）

- 使用 `message action=react` 並搭配 `channel=mattermost`。
- `messageId` 是 Mattermost 貼文 ID。
- `emoji` 接受像 `thumbsup` 或 `:+1:` 這樣的名稱（冒號可省略）。
- 設定 `remove=true`（布林值）以移除回應。
- 回應新增/移除事件會作為系統事件轉發到路由後的代理工作階段，並受與訊息相同的 DM/群組政策檢查約束。

範例：

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定：

- `channels.mattermost.actions.reactions`：啟用/停用回應動作（預設為 true）。
- 每帳號覆寫：`channels.mattermost.accounts.<id>.actions.reactions`。

## 互動式按鈕（訊息工具）

傳送包含可點擊按鈕的訊息。當使用者點擊按鈕時，代理會收到選取項目並可回應。

按鈕來自語義化 `presentation` 承載內容（在一般代理回覆和 `message action=send` 中）。OpenClaw 會將值按鈕呈現為 Mattermost 互動式按鈕，讓 URL 按鈕在訊息文字中可見，並將選取選單降級為可讀文字。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

呈現按鈕欄位：

<ParamField path="label" type="string" required>
  顯示標籤（別名：`text`）。
</ParamField>
<ParamField path="value" type="string">
  點擊時送回的值，用作動作 ID（別名：`callback_data`、`callbackData`）。除非設定 `url`，否則可點擊按鈕需要此欄位。
</ParamField>
<ParamField path="url" type="string">
  連結按鈕；在訊息本文中呈現為 `label: url` 文字，而不是互動式按鈕。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  按鈕樣式。Mattermost 會將預設樣式套用到它不支援的值。
</ParamField>

若要在代理系統提示中宣告按鈕支援，請將 `inlineButtons` 新增至頻道能力：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

當使用者點擊按鈕時：

<Steps>
  <Step title="Access check">
    點擊者必須通過與訊息傳送者相同的 DM/群組政策檢查；未授權的點擊會收到暫時通知並被忽略。
  </Step>
  <Step title="Buttons replaced with confirmation">
    所有按鈕都會替換為確認行（例如：「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="Agent receives the selection">
    代理會收到選取項目作為傳入訊息（外加一個系統事件）並回應。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - 按鈕回呼使用 HMAC-SHA256 驗證（自動執行，不需要設定）。
    - 點擊時會替換整個附件區塊，因此所有按鈕會一起移除，無法部分移除。
    - 包含連字號或底線的動作 ID 會自動清理（Mattermost 路由限制）。
    - `action_id` 與原始貼文上的動作不符的點擊，會以 `403`（「Unknown action」）拒絕。

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`：能力字串陣列。新增 `"inlineButtons"` 可在代理系統提示中啟用按鈕工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：按鈕回呼的選用外部基底 URL（例如 `https://gateway.example.com`）。當 Mattermost 無法直接透過閘道的繫結主機存取閘道時使用此項。
    - 在多帳號設定中，你也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下設定相同欄位。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 會從 `gateway.customBindHost` + `gateway.port`（預設 18789）衍生回呼 URL，然後退回到 `http://localhost:<port>`。回呼路徑是 `/mattermost/interactions/<accountId>`。
    - 可達性規則：按鈕回呼 URL 必須可從 Mattermost 伺服器存取。`localhost` 只有在 Mattermost 和 OpenClaw 在同一主機/網路命名空間上執行時才有效。
    - `channels.mattermost.interactions.allowedSourceIps`：按鈕回呼的來源 IP 允許清單。若未設定，僅接受回送來源（`127.0.0.1`、`::1`），因此遠端 Mattermost 伺服器必須在此加入允許清單，否則其點擊會以 `403` 拒絕。在反向代理後方時，也請設定 `gateway.trustedProxies`，讓真實用戶端 IP 可從轉發標頭衍生。
    - 如果你的回呼目標是私有/tailnet/內部目標，請將其主機/網域新增到 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 整合（外部指令碼）

外部指令碼和網路鉤子可以透過 Mattermost REST API 直接張貼按鈕，而不經由代理的 `message` 工具。可行時請使用外掛中的 `buildButtonAttachments()`；若張貼原始 JSON，請遵循這些規則：

**承載內容結構：**

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
                action_id: "mybutton01", // must match button id
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

1. 附件放在 `props.attachments`，不是頂層 `attachments`（會被靜默忽略）。
2. 每個動作都需要 `type: "button"`，否則點擊會被靜默吞掉。
3. 每個動作都需要 `id` 欄位，Mattermost 會忽略沒有 ID 的動作。
4. 動作 `id` 必須**僅包含英數字元**（`[a-zA-Z0-9]`）。連字號和底線會破壞 Mattermost 的伺服器端動作路由（傳回 404）。使用前請移除它們。
5. `context.action_id` 必須符合按鈕的 `id`；閘道會拒絕 `action_id` 不存在於貼文上的點擊。
6. `context.action_id` 是必要欄位，缺少它時互動處理器會傳回 400。
7. 回呼來源 IP 必須被允許（請參閱上方 `interactions.allowedSourceIps`）。

</Warning>

**HMAC 權杖產生**

閘道會使用 HMAC-SHA256 驗證按鈕點擊。外部指令碼必須產生符合閘道驗證邏輯的權杖：

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`，十六進位編碼。
  </Step>
  <Step title="Build the context object">
    建立包含 `_token` **以外**所有欄位的內容物件。
  </Step>
  <Step title="Serialize with sorted keys">
    使用**遞迴排序的鍵**且**不含空格**序列化（閘道也會將巢狀物件正規化，並產生精簡 JSON）。
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    將產生的十六進位摘要作為 `_token` 新增到內容中。
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
  <Accordion title="Common HMAC pitfalls">
    - Python 的 `json.dumps` 預設會新增空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 以符合 JavaScript 的精簡輸出（`{"key":"val"}`）。
    - 一律簽署**所有**內容欄位（扣除 `_token`）。閘道會移除 `_token`，然後簽署其餘所有內容。簽署子集會造成靜默驗證失敗。
    - 使用 `sort_keys=True`，閘道會在簽署前排序鍵，而 Mattermost 在儲存承載內容時可能會重新排序內容欄位。
    - 從 Bot 權杖衍生密鑰（決定性），不要使用隨機位元組。建立按鈕的程序和驗證的閘道必須使用相同密鑰。

  </Accordion>
</AccordionGroup>

## 目錄配接器

Mattermost 外掛包含一個目錄配接器，可透過 Mattermost API 解析頻道和使用者名稱。這會在 `openclaw message send` 以及排程/網路鉤子傳遞中啟用 `#channel-name` 和 `@username` 目標。

不需要設定，配接器會使用帳號設定中的 Bot 權杖。

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

帳號值會覆寫頂層欄位；`channels.mattermost.defaultAccount` 會選擇在未指定帳號時使用哪個帳號。

## 疑難排解

<AccordionGroup>
  <Accordion title="No replies in channels">
    確認 Bot 已在頻道中並提及它（oncall）、使用觸發前綴（onchar），或設定 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - 檢查 Bot 權杖、基底 URL，以及帳號是否已啟用。
    - 多帳號問題：環境變數只會套用到 `default` 帳號。
    - 私有/LAN Mattermost 主機需要 `network.dangerouslyAllowPrivateNetwork: true`（SSRF 防護預設會封鎖私有 IP）。

  </Accordion>
  <Accordion title="原生斜線命令失敗">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回呼權杖。典型原因：
      - 斜線命令註冊在啟動時失敗或只部分完成
      - 回呼打到錯誤的閘道/帳號
      - Mattermost 仍有指向先前回呼目標的舊命令
      - 閘道重新啟動後未重新啟用斜線命令
    - 如果原生斜線命令停止運作，請檢查日誌中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略 `callbackUrl`，且日誌警告回呼解析為像 `http://localhost:18789/...` 這樣的 loopback URL，該 URL 可能只有在 Mattermost 與 OpenClaw 在同一主機/網路命名空間執行時才能連線。請改為設定明確且可從外部連線的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按鈕問題">
    - 按鈕顯示為白色方框或完全不顯示：按鈕資料格式錯誤。每個呈現按鈕都需要 `label` 和 `value`（缺少任一者的按鈕都會被丟棄）。
    - 按鈕有呈現但點擊沒有反應：請確認 Mattermost 伺服器能連線到閘道、Mattermost 伺服器 IP 已包含在 `channels.mattermost.interactions.allowedSourceIps` 中（未設定時只接受 loopback），且 `ServiceSettings.AllowedUntrustedInternalConnections` 包含私有目標的回呼主機。
    - 按鈕點擊時回傳 404：按鈕 `id` 可能包含連字號或底線。Mattermost 的動作路由器會在非英數字元的 ID 上失效。只使用 `[a-zA-Z0-9]`。
    - 閘道日誌顯示 `rejected callback source`：點擊來自 `interactions.allowedSourceIps` 之外的 IP。將 Mattermost 伺服器或你的入口加入允許清單，並在反向代理後方設定 `gateway.trustedProxies`。
    - 閘道日誌顯示 `invalid _token`：HMAC 不相符。請確認你簽署所有脈絡欄位（不是子集）、使用排序後的鍵，並使用精簡 JSON（無空格）。請參閱上方 HMAC 章節。
    - 閘道日誌顯示 `missing _token in context`：`_token` 欄位不在按鈕的脈絡中。請確保建立整合酬載時包含它。
    - 閘道以 `Unknown action` 拒絕點擊：`context.action_id` 不符合貼文上任何動作 `id`。將兩者設定為相同的清理後值。
    - Agent 未提供按鈕：在 Mattermost 頻道設定中加入 `capabilities: ["inlineButtons"]`。

  </Accordion>
</AccordionGroup>

## 相關

- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [安全性](/zh-TW/gateway/security) - 存取模型與強化設定

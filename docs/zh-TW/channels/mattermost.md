---
read_when:
    - 設定 Mattermost
    - 偵錯 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 機器人設定與 OpenClaw 設定組態
title: Mattermost
x-i18n:
    generated_at: "2026-07-11T21:09:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

狀態：可下載的外掛（機器人權杖 + WebSocket 事件）。支援頻道、私人頻道、群組私訊和私訊。Mattermost 是可自行託管的團隊通訊平台（[mattermost.com](https://mattermost.com)）。

## 安裝

<Tabs>
  <Tab title="npm 套件庫">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="本機簽出">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

<Steps>
  <Step title="確認外掛可用">
    使用上述命令安裝 `@openclaw/mattermost`，若閘道已在執行，請重新啟動。
  </Step>
  <Step title="建立 Mattermost 機器人">
    建立 Mattermost 機器人帳戶、複製**機器人權杖**，並將機器人加入其應讀取的團隊與頻道。
  </Step>
  <Step title="複製基礎 URL">
    複製 Mattermost **基礎 URL**（例如 `https://chat.example.com`）。結尾的 `/api/v4` 會自動移除。
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
在私人網路／區域網路／tailnet 位址上自行託管的 Mattermost：對外 Mattermost API 請求會通過 SSRF 防護機制，預設會封鎖私人與內部 IP。若要允許，請設定 `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true`（每個帳戶可設定：`channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## 原生斜線命令

原生斜線命令為選擇性啟用。啟用後，OpenClaw 會在機器人所屬的每個團隊註冊 `oc_*` 斜線命令，並在閘道 HTTP 伺服器上接收回呼 POST。

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

已註冊的命令：`/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。若設定 `nativeSkills: true`，Skills 命令也會註冊為 `/oc_<skill>`。

<AccordionGroup>
  <Accordion title="行為注意事項">
    - `native` 和 `nativeSkills` 預設為 `"auto"`，在 Mattermost 中會解析為停用。請明確將其設定為 `true`。
    - `callbackPath` 預設為 `/api/channels/mattermost/command`。
    - 若省略 `callbackUrl`，OpenClaw 會推導出 `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`。萬用字元繫結主機（`0.0.0.0`、`::`）會改用 `localhost`。
    - 若使用多帳戶設定，可在頂層或 `channels.mattermost.accounts.<id>.commands` 下設定 `commands`（帳戶值會覆寫頂層欄位）。
    - 其他整合所建立、觸發字串相同的既有斜線命令不會被修改（註冊時會略過）；若回呼 URL 發生變動，機器人建立的命令會更新或重新建立。
    - OpenClaw 註冊 `oc_*` 命令時，Mattermost 會傳回每個命令各自的權杖，命令回呼會使用這些權杖進行驗證。
    - OpenClaw 會在接受每個回呼前重新整理目前的 Mattermost 命令註冊資訊，因此已刪除或重新產生之斜線命令的過期權杖，無須重新啟動閘道便會停止被接受。
    - 若 Mattermost API 無法確認命令仍為目前有效版本，回呼驗證會以關閉方式失敗；失敗的驗證結果會短暫快取、並行查詢會合併，且每個命令的新查詢啟動次數會受到速率限制，以控制重播壓力。
    - 若註冊失敗、啟動僅部分完成，或回呼權杖與已解析命令的已註冊權杖不符，斜線回呼會以關閉方式失敗（對某個命令有效的權杖，無法進入另一個命令的上游驗證）。
    - 已接受的回呼會先以僅本人可見的「Processing...」回覆確認；真正的答案則會以一般訊息送達。

  </Accordion>
  <Accordion title="可連線性要求">
    Mattermost 伺服器必須能夠連線至回呼端點。

    - 除非 Mattermost 與 OpenClaw 在相同主機／網路命名空間中執行，否則請勿將 `callbackUrl` 設定為 `localhost`。
    - 除非該 URL 會透過反向代理將 `/api/channels/mattermost/command` 轉送至 OpenClaw，否則請勿將 `callbackUrl` 設定為 Mattermost 基礎 URL。
    - 可使用 `curl https://<gateway-host>/api/channels/mattermost/command` 快速檢查；GET 應從 OpenClaw 傳回 `405 Method Not Allowed`，而非 `404`。

  </Accordion>
  <Accordion title="Mattermost 對外連線允許清單">
    若回呼的目標是私人／tailnet／內部位址，請設定 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`，使其包含回呼主機／網域。

    請使用主機／網域項目，而非完整 URL。

    - 正確：`gateway.tailnet-name.ts.net`
    - 錯誤：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境變數（預設帳戶）

若偏好使用環境變數，請在閘道主機上設定：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境變數僅套用於**預設**帳戶（`default`）。其他帳戶必須使用設定值。

無法從工作區 `.env` 設定 `MATTERMOST_URL`；請參閱[工作區 .env 檔案](/zh-TW/gateway/security)。
</Note>

## 聊天模式

Mattermost 會自動回覆私訊。頻道行為由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（預設）">
    僅在頻道中被 @提及時回覆。
  </Tab>
  <Tab title="onmessage">
    回覆每一則頻道訊息。
  </Tab>
  <Tab title="onchar">
    當訊息以觸發前綴開頭時回覆。
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

注意事項：

- `onchar` 仍會回覆明確的 @提及。
- `channels.mattermost.requireMention` 仍會生效，但建議使用 `chatmode`。每個頻道的 `groups.<channelId>.requireMention` 設定優先於兩者。
- 機器人在頻道討論串中傳送可見回覆後，同一討論串中的後續訊息無須新的 @提及或 `onchar` 前綴也會獲得回覆，因此多輪討論串對話可持續進行。從機器人最後一次在該討論串回覆起，參與狀態會保留 7 天，且在閘道重新啟動後仍會保留。機器人僅觀察過的討論串不受影響；若要再次要求明確提及，請建立新的頂層訊息。

## 討論串與工作階段

使用 `channels.mattermost.replyToMode` 控制頻道和群組回覆是留在主頻道中，還是在觸發貼文下方建立討論串。

- `off`（預設）：僅當傳入貼文本身已位於討論串中時，才在討論串中回覆。
- `first`：對於頂層頻道／群組貼文，在該貼文下方建立討論串，並將對話路由至以討論串為範圍的工作階段。
- `all` 和 `batched`：目前在 Mattermost 中的行為與 `first` 相同，因為 Mattermost 一旦建立討論串根節點，後續分段內容和媒體都會繼續留在同一討論串中。
- 即使設定了 `replyToMode`，私訊仍預設為 `off`。

使用 `channels.mattermost.replyToModeByChatType` 覆寫 `direct`、`group` 或 `channel` 聊天的模式。設定 `direct` 可讓私訊使用討論串：

- `off`（預設）：私訊不使用討論串，並維持在單一持續累積的工作階段中。
- `first`、`all` 或 `batched`：每則頂層私訊都會建立 Mattermost 討論串，並由全新、獨立的工作階段支援。

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

注意事項：

- 以討論串為範圍的工作階段會使用觸發貼文 ID 作為討論串根節點。
- `first` 和 `all` 目前效果相同，因為 Mattermost 一旦建立討論串根節點，後續分段內容和媒體都會繼續留在同一討論串中。
- 依聊天類型設定的覆寫優先於 `replyToMode`。若沒有 `direct` 覆寫，既有部署會維持扁平、不使用討論串的私訊。

## 存取控制（私訊）

- 預設：`channels.mattermost.dmPolicy = "pairing"`（未知傳送者會收到配對碼）。其他值：`allowlist`、`open`、`disabled`。
- 核准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開私訊：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`（設定結構描述會強制要求萬用字元）。
- `channels.mattermost.allowFrom` 接受使用者 ID（建議）和 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。

## 頻道（群組）

- 預設：`channels.mattermost.groupPolicy = "allowlist"`（需提及才會觸發）。
- 使用 `channels.mattermost.groupAllowFrom` 設定允許清單中的傳送者（建議使用使用者 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。
- 每個頻道的提及覆寫設定於 `channels.mattermost.groups.<channelId>.requireMention`，或使用 `channels.mattermost.groups["*"].requireMention` 設定預設值。
- `@username` 比對可能隨名稱變動，且僅在設定 `channels.mattermost.dangerouslyAllowNameMatching: true` 時啟用。
- 開放頻道：`channels.mattermost.groupPolicy="open"`（需提及才會觸發）。
- 解析順序：`channels.mattermost.groupPolicy`，接著是 `channels.defaults.groupPolicy`，最後是 `"allowlist"`。
- 執行階段注意事項：若完全缺少 `channels.mattermost` 區段，執行階段會在群組檢查時以關閉方式失敗，採用 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`），並記錄一次性警告。

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

## 對外傳送的目標

搭配 `openclaw message send` 或排程／網路鉤子使用下列目標格式：

| 目標                                | 傳送至                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | 依 ID 指定的頻道                                              |
| `channel:<name>` 或 `#channel-name` | 依名稱指定的頻道，搜尋範圍涵蓋機器人所屬的所有團隊            |
| `user:<id>` 或 `mattermost:<id>`    | 與該使用者的私訊                                              |
| `@username`                         | 私訊（使用者名稱透過 Mattermost API 解析）                    |

每則對外傳送的訊息最多支援一個附件；若有多個檔案，請分成多次傳送。

<Warning>
單獨使用的不透明 ID（例如 `64ifufp...`）在 Mattermost 中具有**歧義**（可能是使用者 ID 或頻道 ID）。

OpenClaw 會**優先解析為使用者**：

- 若該 ID 對應到使用者（`GET /api/v4/users/<id>` 成功），OpenClaw 會透過 `/api/v4/channels/direct` 解析私訊頻道並傳送**私訊**。
- 否則，該 ID 會視為**頻道 ID**。

若需要確定性的行為，請一律使用明確前綴（`user:<id>`／`channel:<id>`）。
</Warning>

## 私訊頻道重試

當 OpenClaw 傳送至 Mattermost 私訊目標，且必須先解析私訊頻道時，預設會重試暫時性的私訊頻道建立失敗。

使用 `channels.mattermost.dmChannelRetry` 調整整個 Mattermost 外掛的此行為，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 調整單一帳戶。預設值：

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

- 此設定僅適用於建立私訊頻道（`/api/v4/channels/direct`），而非每個 Mattermost API 呼叫。
- 重試會使用帶有隨機抖動的指數退避，並套用於速率限制、5xx 回應，以及網路或逾時錯誤等暫時性失敗。
- 除 `429` 以外的 4xx 用戶端錯誤會視為永久性錯誤，不會重試。

## 預覽串流

Mattermost 會將思考內容、工具活動和部分回覆文字串流至**草稿預覽貼文**，並在最終答案可安全傳送時就地完成該貼文。在 `partial` 模式下，預覽會更新同一個貼文 ID，而不會針對每個文字區塊傳送大量訊息至頻道。在 `block` 模式下，預覽會在已完成文字與工具活動區塊之間輪替，因此先前的區塊會以個別貼文保留，而不會被下一個區塊覆寫。若最終結果為媒體或錯誤，則會取消待處理的預覽編輯，改用一般傳遞方式，而不會送出可丟棄的預覽貼文。

預覽串流預設在 `partial` 模式下**啟用**。可透過 `channels.mattermost.streaming` 設定（模式字串、布林值，或類似 `{ mode: "progress" }` 的物件）：

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
    - `partial`（預設）：使用一則預覽貼文，隨著回覆內容增加而持續編輯，最後以完整答案定稿。
    - `block` 會讓預覽在已完成文字與工具活動區塊之間輪替，因此每個區塊都會以個別貼文保留，而不會就地覆寫。平行及連續的工具更新會共用目前的工具活動貼文。
    - `progress` 會在產生內容時顯示狀態預覽，並僅在完成時發佈最終答案。
    - `off` 會停用預覽串流。若設定 `blockStreaming: true`，已完成的助理區塊仍會以一般區塊回覆（個別貼文）傳遞，而不會合併成單一最終貼文。

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - 如果無法就地完成串流（例如貼文在串流途中遭刪除），OpenClaw 會改為傳送新的最終貼文，確保回覆不會遺失。
    - 僅含思考內容的承載資料不會發佈至頻道，包括以 `> Thinking` 引用區塊形式到達的文字。設定 `/reasoning on` 可在其他介面中查看思考內容；Mattermost 的最終貼文只會保留答案。
    - 如需頻道對應矩陣，請參閱[串流](/zh-TW/concepts/streaming#preview-streaming-modes)。

  </Accordion>
</AccordionGroup>

## 回應表情（訊息工具）

- 使用 `message action=react`，並設定 `channel=mattermost`。
- `messageId` 是 Mattermost 貼文 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 等名稱（冒號可省略）。
- 設定 `remove=true`（布林值）以移除回應表情。
- 新增／移除回應表情事件會作為系統事件轉送至已路由的代理程式工作階段，並受到與訊息相同的私訊／群組政策檢查。

範例：

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定：

- `channels.mattermost.actions.reactions`：啟用／停用回應表情動作（預設為 true）。
- 每個帳號的覆寫設定：`channels.mattermost.accounts.<id>.actions.reactions`。

## 互動式按鈕（訊息工具）

傳送含有可點選按鈕的訊息。當使用者點選按鈕時，代理程式會收到該選項並可進行回應。

按鈕來自語意化的 `presentation` 承載資料（用於一般代理程式回覆和 `message action=send`）。OpenClaw 會將值按鈕呈現為 Mattermost 互動式按鈕、在訊息文字中保留 URL 按鈕，並將選取選單降級為可讀文字。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

呈現按鈕欄位：

<ParamField path="label" type="string" required>
  顯示標籤（別名：`text`）。
</ParamField>
<ParamField path="value" type="string">
  點選時傳回的值，會作為動作 ID 使用（別名：`callback_data`、`callbackData`）。除非設定了 `url`，否則可點選按鈕必須提供此欄位。
</ParamField>
<ParamField path="url" type="string">
  連結按鈕；會在訊息內文中呈現為 `label: url` 文字，而非互動式按鈕。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  按鈕樣式。對於 Mattermost 不支援的值，會套用預設樣式。
</ParamField>

若要在代理程式系統提示中宣告支援按鈕，請將 `inlineButtons` 新增至頻道功能：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

當使用者點選按鈕時：

<Steps>
  <Step title="Access check">
    點選者必須通過與訊息傳送者相同的私訊／群組政策檢查；未獲授權的點選會收到暫時性通知，且該操作會被忽略。
  </Step>
  <Step title="Buttons replaced with confirmation">
    所有按鈕都會替換為確認行（例如「✓ **Yes** 已由 @user 選取」）。
  </Step>
  <Step title="Agent receives the selection">
    代理程式會以傳入訊息（另加一個系統事件）的形式收到選項，並進行回應。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - 按鈕回呼使用 HMAC-SHA256 驗證（自動執行，不需要設定）。
    - 點選時會替換整個附件區塊，因此所有按鈕會一起移除，無法只移除部分按鈕。
    - 包含連字號或底線的動作 ID 會自動清理（Mattermost 路由限制）。
    - 若點選的 `action_id` 與原始貼文中的任何動作皆不相符，將以 `403`（「未知動作」）拒絕。

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`：功能字串陣列。新增 `"inlineButtons"`，即可在代理程式系統提示中啟用按鈕工具說明。
    - `channels.mattermost.interactions.callbackBaseUrl`：按鈕回呼的選用外部基底 URL（例如 `https://gateway.example.com`）。當 Mattermost 無法直接透過繫結主機連線至閘道時，請使用此設定。
    - 在多帳號設定中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下設定相同欄位。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 會從 `gateway.customBindHost` + `gateway.port`（預設為 18789）推導回呼 URL，接著退回使用 `http://localhost:<port>`。回呼路徑為 `/mattermost/interactions/<accountId>`。
    - 可連線性規則：Mattermost 伺服器必須能連線至按鈕回呼 URL。只有當 Mattermost 與 OpenClaw 在相同主機／網路命名空間中執行時，`localhost` 才能運作。
    - `channels.mattermost.interactions.allowedSourceIps`：按鈕回呼的來源 IP 允許清單。若未設定，只接受迴路來源（`127.0.0.1`、`::1`），因此遠端 Mattermost 伺服器必須在此加入允許清單，否則其點選操作會以 `403` 拒絕。在反向代理後方時，也請設定 `gateway.trustedProxies`，以便從轉送標頭推導真正的用戶端 IP。
    - 如果回呼目標屬於私人網路／尾端網路／內部網路，請將其主機／網域新增至 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 整合（外部指令碼）

外部指令碼和網路鉤子可以直接透過 Mattermost REST API 發佈按鈕，而不必經由代理程式的 `message` 工具。若可行，請使用外掛提供的 `buildButtonAttachments()`；若要發佈原始 JSON，請遵循下列規則：

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

1. 附件必須放在 `props.attachments`，而非頂層 `attachments`（否則會被無聲忽略）。
2. 每個動作都需要 `type: "button"`，否則點選會被無聲吞掉。
3. 每個動作都需要 `id` 欄位，Mattermost 會忽略沒有 ID 的動作。
4. 動作 `id` **只能包含英數字元**（`[a-zA-Z0-9]`）。連字號和底線會破壞 Mattermost 的伺服器端動作路由（傳回 404）。使用前請將其移除。
5. `context.action_id` 必須與按鈕的 `id` 相符；若點選的 `action_id` 不存在於貼文中，閘道會拒絕該操作。
6. `context.action_id` 為必填；若未提供，互動處理程式會傳回 400。
7. 回呼來源 IP 必須獲得允許（請參閱上方的 `interactions.allowedSourceIps`）。

</Warning>

**HMAC 權杖產生方式**

閘道會使用 HMAC-SHA256 驗證按鈕點選操作。外部指令碼必須產生符合閘道驗證邏輯的權杖：

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`，以十六進位編碼。
  </Step>
  <Step title="Build the context object">
    建立包含所有欄位但**不含** `_token` 的內容物件。
  </Step>
  <Step title="Serialize with sorted keys">
    使用**遞迴排序的鍵**且**不含空格**進行序列化（閘道也會對巢狀物件進行正規化，並產生精簡 JSON）。
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    將產生的十六進位摘要作為 `_token` 新增至內容物件。
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
    - Python 的 `json.dumps` 預設會新增空格（`{"key": "val"}`）。請使用 `separators=(",", ":")`，以符合 JavaScript 的精簡輸出（`{"key":"val"}`）。
    - 一律簽署**所有**內容欄位（不含 `_token`）。閘道會移除 `_token`，然後簽署剩餘的所有內容。只簽署部分欄位會導致驗證無聲失敗。
    - 使用 `sort_keys=True`；閘道會在簽署前排序鍵，而 Mattermost 儲存承載資料時可能會重新排列內容欄位。
    - 請從機器人權杖推導祕密值（結果具確定性），不要使用隨機位元組。建立按鈕的程序與進行驗證的閘道必須使用相同的祕密值。

  </Accordion>
</AccordionGroup>

## 目錄配接器

Mattermost 外掛包含目錄配接器，可透過 Mattermost API 解析頻道和使用者名稱。這使 `openclaw message send` 與排程／網路鉤子傳遞能夠使用 `#channel-name` 和 `@username` 目標。

不需要任何設定；配接器會使用帳號設定中的機器人權杖。

## 多帳號

Mattermost 支援在 `channels.mattermost.accounts` 下設定多個帳號：

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "主要", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "警示", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

帳號值會覆寫頂層欄位；當未指定帳號時，`channels.mattermost.defaultAccount` 會選擇要使用的帳號。

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    請確認機器人已加入頻道，並提及它（oncall）、使用觸發前綴（onchar），或設定 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="驗證或多帳號錯誤">
    - 檢查機器人權杖、基礎 URL，以及帳號是否已啟用。
    - 多帳號問題：環境變數僅套用至 `default` 帳號。
    - 私有／區域網路 Mattermost 主機需要設定 `network.dangerouslyAllowPrivateNetwork: true`（SSRF 防護預設會封鎖私有 IP）。

  </Accordion>
  <Accordion title="原生斜線命令失敗">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回呼權杖。常見原因：
      - 啟動時斜線命令註冊失敗或僅完成一部分
      - 回呼連至錯誤的閘道／帳號
      - Mattermost 仍保留指向先前回呼目標的舊命令
      - 閘道重新啟動後未重新啟用斜線命令
    - 如果原生斜線命令停止運作，請檢查記錄中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略 `callbackUrl`，且記錄警告回呼解析為類似 `http://localhost:18789/...` 的 local loopback URL，則該 URL 很可能只有在 Mattermost 與 OpenClaw 執行於相同主機／網路命名空間時才能連線。請改為設定明確且可從外部連線的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按鈕問題">
    - 按鈕顯示為白色方塊或完全未顯示：按鈕資料格式錯誤。每個呈現按鈕都需要 `label` 和 `value`（缺少任一欄位的按鈕會被捨棄）。
    - 按鈕有顯示，但點擊後沒有反應：請確認 Mattermost 伺服器可連線至閘道、Mattermost 伺服器 IP 已包含於 `channels.mattermost.interactions.allowedSourceIps`（若未設定，僅接受 local loopback），且對於私有目標，`ServiceSettings.AllowedUntrustedInternalConnections` 包含回呼主機。
    - 點擊按鈕時傳回 404：按鈕 `id` 可能包含連字號或底線。Mattermost 的動作路由器無法處理非英數字元 ID。請僅使用 `[a-zA-Z0-9]`。
    - 閘道記錄顯示 `rejected callback source`：點擊來自 `interactions.allowedSourceIps` 以外的 IP。請將 Mattermost 伺服器或入口加入允許清單；若位於反向代理後方，請設定 `gateway.trustedProxies`。
    - 閘道記錄顯示 `invalid _token`：HMAC 不相符。請確認簽署所有內容欄位（而非僅簽署部分欄位）、使用排序後的鍵，並使用緊湊 JSON（不含空格）。請參閱上方的 HMAC 章節。
    - 閘道記錄顯示 `missing _token in context`：按鈕的內容中沒有 `_token` 欄位。建立整合酬載時，請確認已包含此欄位。
    - 閘道以 `Unknown action` 拒絕點擊：`context.action_id` 與貼文中任何動作的 `id` 都不相符。請將兩者設定為相同的已清理值。
    - 代理程式未提供按鈕：請將 `capabilities: ["inlineButtons"]` 加入 Mattermost 頻道設定。

  </Accordion>
</AccordionGroup>

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [安全性](/zh-TW/gateway/security) - 存取模型與安全強化

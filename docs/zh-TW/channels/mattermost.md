---
read_when:
    - 設定 Mattermost
    - 偵錯 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 機器人設定與 OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-07-19T13:35:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea41fb9a7e4e9ea6bd8d04a4f2c6d2d7f2e43cf71830e445f1e28e2e8737f3cb
    source_path: channels/mattermost.md
    workflow: 16
---

狀態：可下載的外掛（機器人權杖 + WebSocket 事件）。支援頻道、私人頻道、群組私訊和私訊。Mattermost 是可自行託管的團隊訊息平台（[mattermost.com](https://mattermost.com)）。

## 安裝

<Tabs>
  <Tab title="npm registry">
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
    建立 Mattermost 機器人帳號、複製**機器人權杖**，並將機器人加入其應讀取的團隊和頻道。
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

    非互動式替代方案：

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
在私人／區域網路／tailnet 位址上自行託管 Mattermost：對外 Mattermost API 要求會通過 SSRF 防護機制，預設會封鎖私人和內部 IP。使用 `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` 選擇加入（各帳號：`channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## 原生斜線命令

原生斜線命令須選擇加入。啟用後，OpenClaw 會在機器人所屬的每個團隊註冊 `oc_*` 斜線命令，並在閘道 HTTP 伺服器上接收回呼 POST。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 當 Mattermost 無法直接連線至閘道時使用（反向 Proxy／公開 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

已註冊的命令：`/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。使用 `nativeSkills: true` 時，技能命令也會註冊為 `/oc_<skill>`。

<AccordionGroup>
  <Accordion title="行為注意事項">
    - `native` 和 `nativeSkills` 預設為 `"auto"`，對 Mattermost 而言會解析為停用。請明確將其設為 `true`。
    - `callbackPath` 預設為 `/api/channels/mattermost/command`。
    - 若省略 `callbackUrl`，OpenClaw 會衍生 `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`。萬用字元繫結主機（`0.0.0.0`、`::`）會退回使用 `localhost`。
    - 對於多帳號設定，`commands` 可設於頂層或 `channels.mattermost.accounts.<id>.commands` 下（帳號值會覆寫頂層欄位）。
    - 由其他整合建立且觸發詞相同的現有斜線命令不會遭到變更（註冊時會略過）；機器人建立的命令則會在回呼 URL 發生偏移時更新或重新建立。
    - 命令回呼會使用 OpenClaw 註冊 `oc_*` 命令時由 Mattermost 傳回的各命令權杖進行驗證。
    - OpenClaw 會在接受每個回呼前重新整理目前的 Mattermost 命令註冊，因此已刪除或重新產生的斜線命令所留下的過時權杖，無須重新啟動閘道便會停止被接受。
    - 若 Mattermost API 無法確認命令仍為最新，回呼驗證會採取封閉式失敗；失敗的驗證會短暫快取、並行查詢會合併，且每個命令的新查詢啟動都會受到速率限制，以約束重播壓力。
    - 若註冊失敗、啟動不完整，或回呼權杖與解析所得命令的已註冊權杖不符，斜線回呼會採取封閉式失敗（一個命令的有效權杖無法針對另一個命令進入上游驗證）。
    - 已接受的回呼會以暫時性的「處理中...」回覆確認；實際答案會以一般訊息送達。

  </Accordion>
  <Accordion title="可連線性要求">
    Mattermost 伺服器必須能連線至回呼端點。

    - 除非 Mattermost 與 OpenClaw 在同一主機／網路命名空間中執行，否則請勿將 `callbackUrl` 設為 `localhost`。
    - 除非 Mattermost 基底 URL 會將 `/api/channels/mattermost/command` 反向代理至 OpenClaw，否則請勿將 `callbackUrl` 設為該基底 URL。
    - 快速檢查方式為 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 應從 OpenClaw 傳回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 對外連線允許清單">
    若回呼目標為私人／tailnet／內部位址，請設定 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`，使其包含回呼主機／網域。

    請使用主機／網域項目，而非完整 URL。

    - 正確：`gateway.tailnet-name.ts.net`
    - 錯誤：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境變數（預設帳號）

若偏好使用環境變數，請在閘道主機上設定以下項目：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境變數僅套用至**預設**帳號（`default`）。其他帳號必須使用設定值。

`MATTERMOST_URL` 無法從工作區 `.env` 設定；請參閱[工作區 .env 檔案](/zh-TW/gateway/security)。
</Note>

## 聊天模式

Mattermost 會自動回應私訊。頻道行為由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（預設）">
    僅在頻道中被 @提及時回應。
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
      oncharPrefixes: [">", "!"], // 預設值
    },
  },
}
```

注意事項：

- `onchar` 仍會回應明確的 @提及。
- 仍支援 `channels.mattermost.requireMention`，但建議使用 `chatmode`。各頻道的 `groups.<channelId>.requireMention` 設定優先於兩者。
- 機器人在頻道討論串中傳送可見回覆後，該討論串中的後續訊息不必再次 @提及或加上 `onchar` 前綴便會獲得回應，讓多輪討論串對話得以持續。參與狀態會從機器人上次在該討論串回覆起保留 7 天，並在閘道重新啟動後持續保留。機器人僅觀察而未回覆的討論串不受影響；若要再次要求明確提及，請建立新的頂層訊息。
- 將 `channels.mattermost.implicitMentions.threadParticipation: false` 設為停止讓已參與討論串的後續訊息略過提及限制。帳號覆寫使用 `channels.mattermost.accounts.<id>.implicitMentions`。Mattermost 目前不會產生 `replyToBot` 或 `quotedBot` 事實，因此這些旗標在此處沒有作用。

## 討論串與工作階段

使用 `channels.mattermost.replyToMode` 控制頻道和群組回覆要留在主頻道，還是在觸發貼文下建立討論串。

- `off`（預設）：僅在傳入貼文本來就在討論串中時，才於討論串回覆。
- `first`：對於頂層頻道／群組貼文，在該貼文下建立討論串，並將對話路由至討論串範圍的工作階段。
- 目前在 Mattermost 中，`all` 和 `batched` 的行為與 `first` 相同，因為 Mattermost 一旦有討論串根貼文，後續區塊和媒體就會繼續留在同一討論串中。
- 即使設定了 `replyToMode`，私訊仍預設為 `off`。

使用 `channels.mattermost.replyToModeByChatType` 覆寫 `direct`、`group` 或 `channel` 聊天的模式。設定 `direct`，讓私訊選擇加入討論串：

- `off`（預設）：私訊不使用討論串，並留在單一持續更新的工作階段中。
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

- 討論串範圍的工作階段會使用觸發貼文 ID 作為討論串根。
- `first` 和 `all` 目前等同，因為 Mattermost 一旦有討論串根貼文，後續區塊和媒體就會繼續留在同一討論串中。
- 各聊天類型的覆寫優先於 `replyToMode`。若沒有 `direct` 覆寫，現有部署會維持平面、非討論串式的私訊。

## 存取控制（私訊）

- 預設值：`channels.mattermost.dmPolicy = "pairing"`（未知傳送者會收到配對碼）。其他值：`allowlist`、`open`、`disabled`。
- 核准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開私訊：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`（設定結構描述會強制要求萬用字元）。
- `channels.mattermost.allowFrom` 接受使用者 ID（建議）和 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。

## 頻道（群組）

- 預設值：`channels.mattermost.groupPolicy = "allowlist"`（須提及）。
- 使用 `channels.mattermost.groupAllowFrom` 將傳送者加入允許清單（建議使用使用者 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。
- 各頻道的提及覆寫位於 `channels.mattermost.groups.<channelId>.requireMention` 下，或使用 `channels.mattermost.groups["*"].requireMention` 設定預設值。
- `@username` 比對是可變動的，且僅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 時啟用。
- 開放頻道：`channels.mattermost.groupPolicy="open"`（須提及）。
- 解析順序：`channels.mattermost.groupPolicy`，接著是 `channels.defaults.groupPolicy`，再來是 `"allowlist"`。
- 執行階段注意事項：若完全缺少 `channels.mattermost` 區段，執行階段會針對群組檢查採取封閉式失敗並使用 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`），同時記錄一次性警告。

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

將下列目標格式搭配 `openclaw message send` 或排程／網路鉤子使用：

| 目標                                | 傳遞至                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | 依 ID 指定的頻道                                              |
| `channel:<name>` 或 `#channel-name` | 依名稱指定的頻道，搜尋機器人所屬的所有團隊                    |
| `user:<id>` 或 `mattermost:<id>`    | 與該使用者的私訊                                              |
| `@username`                         | 私訊（透過 Mattermost API 解析使用者名稱）                     |

對外傳送每則訊息最多支援一個附件；請將多個檔案分成多次傳送。

<Warning>
在 Mattermost 中，裸露的不透明 ID（例如 `64ifufp...`）具有**歧義**（使用者 ID 或頻道 ID）。

OpenClaw 會**優先解析為使用者**：

- 如果該 ID 是既有使用者（`GET /api/v4/users/<id>` 成功），OpenClaw 會透過 `/api/v4/channels/direct` 解析直接頻道並傳送**私訊**。
- 否則，該 ID 會被視為**頻道 ID**。

若需要確定性行為，請一律使用明確的前綴（`user:<id>` / `channel:<id>`）。
</Warning>

## 私訊頻道重試

當 OpenClaw 傳送至 Mattermost 私訊目標，且需要先解析直接頻道時，預設會重試暫時性的直接頻道建立失敗。

使用 `channels.mattermost.dmChannelRetry` 為 Mattermost 外掛全域調整此行為，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 為單一帳號調整。預設值：

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

- 這僅適用於私訊頻道建立（`/api/v4/channels/direct`），而非每個 Mattermost API 呼叫。
- 重試會使用含隨機抖動的指數退避，並套用於速率限制、5xx 回應，以及網路或逾時錯誤等暫時性失敗。
- 除了 `429` 之外的 4xx 用戶端錯誤會被視為永久性錯誤，不會重試。

## 預覽串流

Mattermost 會將思考、工具活動和部分回覆文字串流至**預覽草稿貼文**，並在最終答案可安全傳送時就地完成該貼文。在 `partial` 模式下，預覽會更新相同的貼文 ID，而不會以每個區塊一則訊息的方式洗版頻道。在 `block` 模式下，預覽會在已完成文字與工具活動區塊之間輪替，因此較早的區塊會保留為各自的貼文，而不會被下一個區塊覆寫。媒體或錯誤的最終回覆會取消待處理的預覽編輯，並改用一般傳遞，而不會送出一次性的預覽貼文。

預覽串流在 `partial` 模式下**預設開啟**。透過 `channels.mattermost.streaming.mode` 設定（舊版純量／布林值 `streaming` 會由 `openclaw doctor --fix` 遷移）：

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // 關閉 | 部分 | 區塊 | 進度
    },
  },
}
```

<AccordionGroup>
  <Accordion title="串流模式">
    - `partial`（預設）：使用單一預覽貼文，隨著回覆增加而編輯，然後以完整答案完成。
    - `block` 會在已完成文字與工具活動區塊之間輪替預覽，使每個區塊都保留為各自的貼文，而不會就地覆寫。平行和連續的工具更新會共用目前的工具活動貼文。
    - `progress` 會在產生期間顯示狀態預覽，並僅在完成時發布最終答案。
    - `off` 會停用預覽串流。搭配 `streaming.block.enabled: true` 時，已完成的助理區塊仍會以一般區塊回覆（獨立貼文）傳遞，而不是合併為單一最終貼文。

  </Accordion>
  <Accordion title="串流行為注意事項">
    - 如果串流無法就地完成（例如貼文在串流期間遭到刪除），OpenClaw 會改為傳送新的最終貼文，確保回覆絕不遺失。
    - 僅含思考內容的承載資料不會發布至頻道，包括以 `> Thinking` 引用區塊形式抵達的文字。設定 `/reasoning on` 可在其他介面查看思考內容；Mattermost 的最終貼文只會保留答案。
    - 如需頻道對應矩陣，請參閱[串流](/zh-TW/concepts/streaming#preview-streaming-modes)。

  </Accordion>
</AccordionGroup>

## 表情回應（訊息工具）

- 搭配 `channel=mattermost` 使用 `message action=react`。
- `messageId` 是 Mattermost 貼文 ID。
- `emoji` 接受如 `thumbsup` 或 `:+1:` 的名稱（冒號可省略）。
- 將 `remove=true`（布林值）設為移除表情回應。
- 新增／移除表情回應事件會以系統事件轉送至已路由的代理程式工作階段，並套用與訊息相同的私訊／群組政策檢查。

範例：

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定：

- `channels.mattermost.actions.reactions`：啟用／停用表情回應動作（預設為 true）。
- 每個帳號的覆寫設定：`channels.mattermost.accounts.<id>.actions.reactions`。

## 互動式按鈕（訊息工具）

傳送含可點擊按鈕的訊息。當使用者點擊按鈕時，代理程式會收到選取結果並可回應。

按鈕來自語意化的 `presentation` 承載資料（用於一般代理程式回覆及 `message action=send`）。OpenClaw 會將值按鈕呈現為 Mattermost 互動式按鈕、讓 URL 按鈕顯示於訊息文字中，並將選取選單降級為可讀文字。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]}]}
```

呈現按鈕欄位：

<ParamField path="label" type="string" required>
  顯示標籤（別名：`text`）。
</ParamField>
<ParamField path="value" type="string">
  點擊時傳回的值，用作動作 ID（別名：`callback_data`、`callbackData`）。除非已設定 `url`，否則可點擊按鈕必須提供此值。
</ParamField>
<ParamField path="url" type="string">
  連結按鈕；在訊息本文中呈現為 `label: url` 文字，而非互動式按鈕。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  按鈕樣式。對於不支援的值，Mattermost 會套用預設樣式。
</ParamField>

若要在代理程式系統提示詞中宣告按鈕支援，請將 `inlineButtons` 新增至頻道功能：

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
  <Step title="存取檢查">
    點擊者必須通過與訊息傳送者相同的私訊／群組政策檢查；未授權的點擊會收到暫時性通知並被忽略。
  </Step>
  <Step title="以確認訊息取代按鈕">
    所有按鈕都會被確認行取代（例如「✓ **是**，由 @user 選取」）。
  </Step>
  <Step title="代理程式收到選取結果">
    代理程式會以輸入訊息（另加一個系統事件）的形式收到選取結果並回應。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="實作注意事項">
    - 按鈕回呼使用 HMAC-SHA256 驗證（自動進行，不需設定）。
    - 點擊時會取代整個附件區塊，因此所有按鈕會一併移除，無法只移除部分按鈕。
    - 包含連字號或底線的動作 ID 會自動清理（Mattermost 路由限制）。
    - `action_id` 與原始貼文中的任何動作不符的點擊，會以 `403`（「未知動作」）拒絕。

  </Accordion>
  <Accordion title="設定與可連線性">
    - `channels.mattermost.capabilities`：功能字串陣列。新增 `"inlineButtons"`，可在代理程式系統提示詞中啟用按鈕工具說明。
    - `channels.mattermost.interactions.callbackBaseUrl`：用於按鈕回呼的選用外部基底 URL（例如 `https://gateway.example.com`）。當 Mattermost 無法透過閘道的繫結主機直接連線時，請使用此設定。
    - 在多帳號設定中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下設定相同欄位。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 會從 `gateway.customBindHost` + `gateway.port`（預設為 18789）推導回呼 URL，接著回退至 `http://localhost:<port>`。回呼路徑為 `/mattermost/interactions/<accountId>`。
    - 可連線性規則：Mattermost 伺服器必須能連線至按鈕回呼 URL。僅當 Mattermost 與 OpenClaw 在相同主機／網路命名空間中執行時，`localhost` 才能運作。
    - `channels.mattermost.interactions.allowedSourceIps`：按鈕回呼的來源 IP 允許清單。若未設定，僅接受回送來源（`127.0.0.1`、`::1`），因此遠端 Mattermost 伺服器必須列入此處的允許清單，否則其點擊會以 `403` 拒絕。若位於反向代理後方，也請設定 `gateway.trustedProxies`，以便從轉送標頭取得真實的用戶端 IP。
    - 如果你的回呼目標是私有／tailnet／內部位址，請將其主機／網域新增至 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 整合（外部指令碼）

外部指令碼和網路鉤子可以透過 Mattermost REST API 直接發布按鈕，而不必經由代理程式的 `message` 工具。建議優先使用 OpenClaw 的 `message` 工具。若為直接整合，請從 `@openclaw/mattermost/api.js` 匯入 `buildButtonAttachments`；若發布原始 JSON，請遵循以下規則：

**承載資料結構：**

```json5
{
  channel_id: "<channelId>",
  message: "選擇一個選項：",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 僅限英數字元，請參閱下方
            type: "button", // 必填，否則點擊會被無聲忽略
            name: "核准", // 顯示標籤
            style: "primary", // 選填："default"、"primary"、"danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 必須與按鈕 ID 相符
                action: "approve",
                // ...任何自訂欄位...
                _token: "<hmac>", // 請參閱下方 HMAC 章節
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

1. 附件應放在 `props.attachments` 中，而非頂層 `attachments`（否則會被無聲忽略）。
2. 每個動作都需要 `type: "button"`，否則點擊會被無聲吞掉。
3. 每個動作都需要 `id` 欄位，Mattermost 會忽略沒有 ID 的動作。
4. 動作 `id` 必須**僅包含英數字元**（`[a-zA-Z0-9]`）。連字號和底線會破壞 Mattermost 的伺服器端動作路由（傳回 404）。使用前請移除它們。
5. `context.action_id` 必須與按鈕的 `id` 相符；如果 `action_id` 不存在於貼文中，閘道會拒絕該點擊。
6. `context.action_id` 為必填，缺少時互動處理常式會傳回 400。
7. 回呼來源 IP 必須獲得允許（請參閱上方的 `interactions.allowedSourceIps`）。

</Warning>

**HMAC 權杖產生**

閘道會使用 HMAC-SHA256 驗證按鈕點擊。外部指令碼必須產生符合閘道驗證邏輯的權杖：

<Steps>
  <Step title="從機器人權杖衍生密鑰">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`，以十六進位編碼。
  </Step>
  <Step title="建構內容物件">
    使用**除了** `_token` 以外的所有欄位建構內容物件。
  </Step>
  <Step title="使用已排序的鍵進行序列化">
    使用**遞迴排序的鍵**且**不含空格**進行序列化（閘道也會將巢狀物件正規化，並產生精簡 JSON）。
  </Step>
  <Step title="簽署承載資料">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="新增權杖">
    將產生的十六進位摘要以 `_token` 加入內容中。
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
  <Accordion title="常見的 HMAC 陷阱">
    - Python 的 `json.dumps` 預設會加入空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 以符合 JavaScript 的緊湊輸出（`{"key":"val"}`）。
    - 一律簽署**所有**內容欄位（`_token` 除外）。閘道會移除 `_token`，然後簽署剩餘的所有內容。只簽署部分欄位會導致驗證無聲失敗。
    - 使用 `sort_keys=True`——閘道會在簽署前排序鍵，而 Mattermost 儲存承載資料時可能會重新排列內容欄位。
    - 請從機器人權杖衍生密鑰（具確定性），不要使用隨機位元組。建立按鈕的處理程序與執行驗證的閘道必須使用相同的密鑰。

  </Accordion>
</AccordionGroup>

## 目錄配接器

Mattermost 外掛包含一個目錄配接器，可透過 Mattermost API 解析頻道與使用者名稱。這可讓 `#channel-name` 與 `@username` 目標用於 `openclaw message send` 及排程／網路鉤子遞送。

不需要任何設定——配接器會使用帳號設定中的機器人權杖。

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

帳號值會覆寫頂層欄位；未指定帳號時，`channels.mattermost.defaultAccount` 會選擇要使用的帳號。

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    請確認機器人已加入頻道並提及它（oncall）、使用觸發前綴（onchar），或設定 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="驗證或多帳號錯誤">
    - 檢查機器人權杖、基底 URL，以及帳號是否已啟用。
    - 多帳號問題：環境變數只會套用至 `default` 帳號。
    - 私人／區域網路中的 Mattermost 主機需要 `network.dangerouslyAllowPrivateNetwork: true`（SSRF 防護機制預設會封鎖私人 IP）。

  </Accordion>
  <Accordion title="原生斜線命令失敗">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回呼權杖。常見原因：
      - 斜線命令註冊失敗，或啟動時僅完成部分註冊
      - 回呼送至錯誤的閘道／帳號
      - Mattermost 仍保留指向先前回呼目標的舊命令
      - 閘道重新啟動後未重新啟用斜線命令
    - 如果原生斜線命令停止運作，請檢查日誌中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略 `callbackUrl`，且日誌警告回呼解析為類似 `http://localhost:18789/...` 的迴路位址 URL，則只有當 Mattermost 與 OpenClaw 在相同主機／網路命名空間中執行時，該 URL 才可能可供存取。請改為明確設定可從外部存取的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按鈕問題">
    - 按鈕顯示為白色方塊或完全不顯示：按鈕資料格式錯誤。每個呈現按鈕都需要 `label` 與 `value`（缺少其中任一項的按鈕都會遭到捨棄）。
    - 按鈕可正常顯示，但點擊後沒有反應：請確認 Mattermost 伺服器可連線至閘道、Mattermost 伺服器 IP 已包含在 `channels.mattermost.interactions.allowedSourceIps` 中（若未設定，僅接受迴路位址），且對於私人目標，`ServiceSettings.AllowedUntrustedInternalConnections` 包含回呼主機。
    - 點擊按鈕時傳回 404：按鈕的 `id` 可能包含連字號或底線。Mattermost 的動作路由器無法處理非英數字元的 ID。請只使用 `[a-zA-Z0-9]`。
    - 閘道日誌顯示 `rejected callback source`：點擊來自 `interactions.allowedSourceIps` 範圍外的 IP。請將 Mattermost 伺服器或你的入口加入允許清單；若位於反向 Proxy 後方，請設定 `gateway.trustedProxies`。
    - 閘道日誌顯示 `invalid _token`：HMAC 不相符。請檢查是否簽署所有內容欄位（而非僅部分欄位）、使用已排序的鍵，並使用緊湊 JSON（不含空格）。請參閱上方的 HMAC 章節。
    - 閘道日誌顯示 `missing _token in context`：按鈕的內容中沒有 `_token` 欄位。建立整合承載資料時，請確認已包含此欄位。
    - 閘道以 `Unknown action` 拒絕點擊：`context.action_id` 與貼文上的任何動作 `id` 都不相符。請將兩者設定為相同的清理後值。
    - 代理程式未提供按鈕：將 `capabilities: ["inlineButtons"]` 加入 Mattermost 頻道設定。

  </Accordion>
</AccordionGroup>

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing)——訊息的工作階段路由
- [頻道概覽](/zh-TW/channels)——所有支援的頻道
- [群組](/zh-TW/channels/groups)——群組聊天行為與提及限制
- [配對](/zh-TW/channels/pairing)——私訊驗證與配對流程
- [安全性](/zh-TW/gateway/security)——存取模型與強化措施

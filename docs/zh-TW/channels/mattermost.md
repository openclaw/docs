---
read_when:
    - 設定 Mattermost
    - 偵錯 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 機器人設定與 OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T11:25:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

狀態：可下載的外掛（機器人權杖 + WebSocket 事件）。支援頻道、私人頻道、群組私訊和私訊。Mattermost 是可自行託管的團隊訊息平台（[mattermost.com](https://mattermost.com)）。

## 安裝

<Tabs>
  <Tab title="npm 登錄檔">
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
    使用上述命令安裝 `@openclaw/mattermost`，如果閘道已在執行，請重新啟動。
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

    非互動式替代方式：

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
若自行託管的 Mattermost 位於私人／區域網路／tailnet 位址：傳出的 Mattermost API 要求會通過 SSRF 防護，該防護預設會封鎖私人和內部 IP。請透過 `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` 選擇啟用（每個帳號：`channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## 原生斜線命令

原生斜線命令須選擇啟用。啟用後，OpenClaw 會在機器人所屬的每個團隊註冊 `oc_*` 斜線命令，並在閘道 HTTP 伺服器上接收回呼 POST。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 當 Mattermost 無法直接連上閘道時使用（反向代理／公開 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

註冊的命令：`/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。使用 `nativeSkills: true` 時，技能命令也會註冊為 `/oc_<skill>`。

<AccordionGroup>
  <Accordion title="行為注意事項">
    - `native` 和 `nativeSkills` 預設為 `"auto"`，對 Mattermost 解析為停用。請明確將其設為 `true`。
    - `callbackPath` 預設為 `/api/channels/mattermost/command`。
    - 若省略 `callbackUrl`，OpenClaw 會推導 `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`。萬用字元繫結主機（`0.0.0.0`、`::`）會退回使用 `localhost`。
    - 對於多帳號設定，可在頂層或 `channels.mattermost.accounts.<id>.commands` 下設定 `commands`（帳號值會覆寫頂層欄位）。
    - 由其他整合建立且觸發字串相同的現有斜線命令不會被變更（註冊時會略過）；若回呼 URL 發生變動，由機器人建立的命令會被更新或重新建立。
    - 命令回呼會使用 Mattermost 在 OpenClaw 註冊 `oc_*` 命令時傳回的每命令權杖進行驗證。
    - OpenClaw 會在接受每個回呼前重新整理目前的 Mattermost 命令註冊，因此已刪除或重新產生的斜線命令所使用的過期權杖，無須重新啟動閘道便會停止被接受。
    - 若 Mattermost API 無法確認命令仍為目前版本，回呼驗證會採取封閉式失敗；失敗的驗證會短暫快取、並行查詢會合併，而且會限制每個命令啟動全新查詢的速率，以限制重播壓力。
    - 當註冊失敗、啟動不完整，或回呼權杖與解析出之命令的已註冊權杖不符時，斜線回呼會採取封閉式失敗（對一個命令有效的權杖無法觸發另一個命令的上游驗證）。
    - 接受回呼後，系統會以暫時性的「處理中……」回覆確認；實際答案會以一般訊息送達。

  </Accordion>
  <Accordion title="可連線性要求">
    Mattermost 伺服器必須能連上回呼端點。

    - 除非 Mattermost 與 OpenClaw 在同一主機／網路命名空間中執行，否則請勿將 `callbackUrl` 設為 `localhost`。
    - 除非你的 Mattermost 基底 URL 會將 `/api/channels/mattermost/command` 反向代理至 OpenClaw，否則請勿將 `callbackUrl` 設為該基底 URL。
    - 快速檢查方式是 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 應從 OpenClaw 傳回 `405 Method Not Allowed`，而非 `404`。

  </Accordion>
  <Accordion title="Mattermost 輸出允許清單">
    如果回呼以私人／tailnet／內部位址為目標，請設定 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`，將回呼主機／網域納入其中。

    請使用主機／網域項目，而非完整 URL。

    - 正確：`gateway.tailnet-name.ts.net`
    - 錯誤：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境變數（預設帳號）

如果偏好環境變數，請在閘道主機上設定：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境變數僅套用至**預設**帳號（`default`）。其他帳號必須使用設定值。

無法從工作區 `.env` 設定 `MATTERMOST_URL`；請參閱[工作區 .env 檔案](/zh-TW/gateway/security)。
</Note>

## 聊天模式

Mattermost 會自動回應私訊。頻道行為由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（預設）">
    僅在頻道中被 @提及時回應。
  </Tab>
  <Tab title="onmessage">
    回應每一則頻道訊息。
  </Tab>
  <Tab title="onchar">
    當訊息以觸發前置字元開頭時回應。
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
- 仍支援 `channels.mattermost.requireMention`，但建議使用 `chatmode`。每頻道的 `groups.<channelId>.requireMention` 設定優先於兩者。
- 機器人在頻道討論串中傳送可見回覆後，該討論串中的後續訊息無須新的 @提及或 `onchar` 前置字串便會獲得回應，因此多輪討論串對話可持續進行。機器人最後一次在該討論串回覆後，參與狀態會記住 7 天，且跨閘道重新啟動持續保存。機器人僅觀察過的討論串不受影響；若要再次要求明確提及，請建立新的頂層訊息。

## 討論串與工作階段

使用 `channels.mattermost.replyToMode` 控制頻道和群組回覆是留在主要頻道中，還是在觸發貼文下啟動討論串。

- `off`（預設）：僅當傳入貼文已位於討論串中時，才在討論串中回覆。
- `first`：對於頂層頻道／群組貼文，在該貼文下啟動討論串，並將對話路由到討論串範圍的工作階段。
- `all` 和 `batched`：目前在 Mattermost 上的行為與 `first` 相同，因為 Mattermost 一旦有討論串根貼文，後續區塊和媒體就會繼續留在同一討論串中。
- 即使已設定 `replyToMode`，私訊仍預設為 `off`。

使用 `channels.mattermost.replyToModeByChatType` 覆寫 `direct`、`group` 或 `channel` 聊天的模式。設定 `direct`，讓私訊選擇啟用討論串：

- `off`（預設）：私訊維持不使用討論串，並共用一個持續累積的工作階段。
- `first`、`all` 或 `batched`：每則頂層私訊都會啟動一個 Mattermost 討論串，並使用全新且獨立的工作階段。

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

- 討論串範圍的工作階段會使用觸發貼文 ID 作為討論串根貼文。
- `first` 和 `all` 目前等效，因為 Mattermost 一旦有討論串根貼文，後續區塊和媒體就會繼續留在同一討論串中。
- 每聊天類型的覆寫優先於 `replyToMode`。若沒有 `direct` 覆寫，現有部署會維持扁平、不使用討論串的私訊。

## 存取控制（私訊）

- 預設：`channels.mattermost.dmPolicy = "pairing"`（未知傳送者會收到配對碼）。其他值：`allowlist`、`open`、`disabled`。
- 核准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開私訊：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`（設定結構描述會強制使用萬用字元）。
- `channels.mattermost.allowFrom` 接受使用者 ID（建議）和 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。

## 頻道（群組）

- 預設：`channels.mattermost.groupPolicy = "allowlist"`（需提及）。
- 使用 `channels.mattermost.groupAllowFrom` 將傳送者加入允許清單（建議使用使用者 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 項目。請參閱[存取群組](/zh-TW/channels/access-groups)。
- 每頻道的提及覆寫位於 `channels.mattermost.groups.<channelId>.requireMention` 下，或使用 `channels.mattermost.groups["*"].requireMention` 設定預設值。
- `@username` 比對可變動，且僅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 時啟用。
- 開放頻道：`channels.mattermost.groupPolicy="open"`（需提及）。
- 解析順序：`channels.mattermost.groupPolicy`，接著 `channels.defaults.groupPolicy`，再接著 `"allowlist"`。
- 執行階段注意事項：如果完全缺少 `channels.mattermost` 區段，執行階段會在群組檢查時採取封閉式失敗並使用 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`），同時記錄一次性警告。

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

## 傳出遞送目標

將這些目標格式與 `openclaw message send` 或排程／網路鉤子搭配使用：

| 目標                                | 遞送至                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | 依 ID 指定的頻道                                              |
| `channel:<name>` 或 `#channel-name` | 依名稱指定的頻道，會在機器人所屬的各團隊中搜尋                |
| `user:<id>` 或 `mattermost:<id>`    | 與該使用者的私訊                                              |
| `@username`                         | 私訊（透過 Mattermost API 解析使用者名稱）                    |

每則傳出訊息最多支援一個附件；請將多個檔案拆分為分別傳送。

<Warning>
單獨的不透明 ID（例如 `64ifufp...`）在 Mattermost 中具有**歧義**（使用者 ID 或頻道 ID）。

OpenClaw 會**優先解析為使用者**：

- 如果該 ID 對應至使用者（`GET /api/v4/users/<id>` 成功），OpenClaw 會透過 `/api/v4/channels/direct` 解析直接頻道並傳送**私訊**。
- 否則，該 ID 會被視為**頻道 ID**。

如需確定性行為，請一律使用明確的前置字串（`user:<id>` / `channel:<id>`）。
</Warning>

## 私訊頻道重試

當 OpenClaw 傳送至 Mattermost 私訊目標，且需要先解析直接頻道時，預設會重試暫時性的直接頻道建立失敗。

使用 `channels.mattermost.dmChannelRetry` 全域調整 Mattermost 外掛的此行為，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 為單一帳號調整。預設值：

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

- 這僅適用於私訊頻道建立作業（`/api/v4/channels/direct`），而非每個 Mattermost API 呼叫。
- 重試會使用帶有隨機抖動的指數退避，並適用於速率限制、5xx 回應，以及網路或逾時錯誤等暫時性失敗。
- 除 `429` 以外的 4xx 用戶端錯誤會視為永久性錯誤，不會重試。

## 預覽串流

Mattermost 會將思考內容、工具活動及部分回覆文字串流至**預覽草稿貼文**，並在最終答案可安全傳送時就地定稿。在 `partial` 模式中，預覽會以相同的貼文 ID 更新，而非用每個區塊的訊息洗版頻道。在 `block` 模式中，預覽會在已完成文字與工具活動區塊之間輪替，因此先前的區塊會各自保留為獨立貼文，而不會遭下一個區塊覆寫。媒體或錯誤的最終結果會取消待處理的預覽編輯，並改用一般傳送方式，而不會送出無用的預覽貼文。

預覽串流在 `partial` 模式中**預設開啟**。透過 `channels.mattermost.streaming.mode` 設定（舊版純量／布林值 `streaming` 會由 `openclaw doctor --fix` 遷移）：

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="串流模式">
    - `partial`（預設）：使用一則預覽貼文，隨回覆內容增加而編輯，然後以完整答案定稿。
    - `block` 會讓預覽在已完成文字與工具活動區塊之間輪替，使每個區塊都各自保留為獨立貼文，而不是就地遭到覆寫。平行及連續的工具更新會共用目前的工具活動貼文。
    - `progress` 會在產生內容時顯示狀態預覽，並只在完成時發布最終答案。
    - `off` 會停用預覽串流。搭配 `streaming.block.enabled: true` 時，已完成的助理區塊仍會以一般區塊回覆（獨立貼文）傳送，而非合併為單一最終貼文。

  </Accordion>
  <Accordion title="串流行為注意事項">
    - 如果串流無法就地定稿（例如貼文在串流期間遭到刪除），OpenClaw 會改為傳送一則新的最終貼文，確保回覆絕不遺失。
    - 僅含思考內容的承載資料不會發布至頻道，包括以 `> Thinking` 引用區塊形式到達的文字。設定 `/reasoning on` 可在其他介面查看思考內容；Mattermost 的最終貼文只會保留答案。
    - 頻道對應矩陣請參閱[串流](/zh-TW/concepts/streaming#preview-streaming-modes)。

  </Accordion>
</AccordionGroup>

## 回應（訊息工具）

- 搭配 `channel=mattermost` 使用 `message action=react`。
- `messageId` 是 Mattermost 貼文 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 等名稱（冒號可省略）。
- 設定 `remove=true`（布林值）以移除回應。
- 新增／移除回應的事件會作為系統事件轉送至已路由的代理程式工作階段，並受與訊息相同的私訊／群組政策檢查約束。

範例：

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定：

- `channels.mattermost.actions.reactions`：啟用／停用回應操作（預設為 true）。
- 個別帳號覆寫：`channels.mattermost.accounts.<id>.actions.reactions`。

## 互動式按鈕（訊息工具）

傳送含可點擊按鈕的訊息。當使用者點擊按鈕時，代理程式會收到所選項目並可作出回應。

按鈕來自語意化的 `presentation` 承載資料（位於一般代理程式回覆及 `message action=send` 中）。OpenClaw 會將值按鈕呈現為 Mattermost 互動式按鈕、在訊息文字中保留可見的 URL 按鈕，並將選取選單降級為可讀文字。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

呈現按鈕欄位：

<ParamField path="label" type="string" required>
  顯示標籤（別名：`text`）。
</ParamField>
<ParamField path="value" type="string">
  點擊時傳回的值，用作動作 ID（別名：`callback_data`、`callbackData`）。除非已設定 `url`，否則可點擊按鈕必須提供此值。
</ParamField>
<ParamField path="url" type="string">
  連結按鈕；會在訊息本文中呈現為 `label: url` 文字，而非互動式按鈕。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  按鈕樣式。Mattermost 會對不支援的值套用預設樣式。
</ParamField>

若要在代理程式系統提示詞中宣告支援按鈕，請將 `inlineButtons` 新增至頻道功能：

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
    點擊者必須通過與訊息傳送者相同的私訊／群組政策檢查；未獲授權的點擊會收到暫時性通知，且該點擊會被忽略。
  </Step>
  <Step title="以確認訊息取代按鈕">
    所有按鈕都會替換成確認文字行（例如「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="代理程式接收所選項目">
    代理程式會將所選項目作為傳入訊息（加上一個系統事件）接收，並作出回應。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="實作注意事項">
    - 按鈕回呼使用 HMAC-SHA256 驗證（自動進行，無須設定）。
    - 點擊後會替換整個附件區塊，因此所有按鈕會一起移除，無法只移除部分按鈕。
    - 包含連字號或底線的動作 ID 會自動清理（Mattermost 路由限制）。
    - 若點擊的 `action_id` 與原始貼文上的任何動作都不相符，系統會以 `403`（「Unknown action」）拒絕該點擊。

  </Accordion>
  <Accordion title="設定與可連線性">
    - `channels.mattermost.capabilities`：功能字串陣列。新增 `"inlineButtons"`，即可在代理程式系統提示詞中啟用按鈕工具說明。
    - `channels.mattermost.interactions.callbackBaseUrl`：按鈕回呼的選用外部基底 URL（例如 `https://gateway.example.com`）。當 Mattermost 無法透過閘道的繫結主機直接連線至閘道時，請使用此設定。
    - 在多帳號設定中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下設定相同欄位。
    - 若省略 `interactions.callbackBaseUrl`，OpenClaw 會從 `gateway.customBindHost` + `gateway.port`（預設為 18789）推導回呼 URL，接著再回退至 `http://localhost:<port>`。回呼路徑為 `/mattermost/interactions/<accountId>`。
    - 可連線性規則：Mattermost 伺服器必須能連線至按鈕回呼 URL。只有當 Mattermost 與 OpenClaw 在相同主機／網路命名空間中執行時，`localhost` 才有效。
    - `channels.mattermost.interactions.allowedSourceIps`：按鈕回呼的來源 IP 允許清單。若未設定，則只接受迴路來源（`127.0.0.1`、`::1`）；因此，遠端 Mattermost 伺服器必須列入此處的允許清單，否則其點擊會以 `403` 拒絕。若位於反向 Proxy 後方，也請設定 `gateway.trustedProxies`，以便從轉送標頭推導出真實用戶端 IP。
    - 若回呼目標位於私人網路／Tailnet／內部網路，請將其主機／網域新增至 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 整合（外部指令碼）

外部指令碼與網路鉤子可以直接透過 Mattermost REST API 發布按鈕，而無須經過代理程式的 `message` 工具。建議使用 OpenClaw 的 `message` 工具。若是直接整合，請從 `@openclaw/mattermost/api.js` 匯入 `buildButtonAttachments`；若發布原始 JSON，請遵循以下規則：

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
**重要規則**

1. 附件應放在 `props.attachments` 中，而不是頂層 `attachments`（否則會無聲地忽略）。
2. 每個動作都需要 `type: "button"`，否則點擊會被無聲地吞掉。
3. 每個動作都需要 `id` 欄位，Mattermost 會忽略沒有 ID 的動作。
4. 動作 `id` 必須**只能包含英數字元**（`[a-zA-Z0-9]`）。連字號與底線會破壞 Mattermost 的伺服器端動作路由（傳回 404）。使用前請移除它們。
5. `context.action_id` 必須與按鈕的 `id` 相符；若點擊的 `action_id` 不存在於貼文上，閘道會拒絕該點擊。
6. `context.action_id` 為必填，缺少時互動處理常式會傳回 400。
7. 回呼來源 IP 必須獲得允許（請參閱上方的 `interactions.allowedSourceIps`）。

</Warning>

**HMAC 權杖產生方式**

閘道會使用 HMAC-SHA256 驗證按鈕點擊。外部指令碼必須產生與閘道驗證邏輯相符的權杖：

<Steps>
  <Step title="從機器人權杖推導密鑰">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`，以十六進位編碼。
  </Step>
  <Step title="建立 context 物件">
    使用**除了** `_token` 以外的所有欄位建立 context 物件。
  </Step>
  <Step title="以排序後的鍵序列化">
    使用**遞迴排序的鍵**序列化，且**不含空格**（閘道也會正規化巢狀物件，並產生精簡 JSON）。
  </Step>
  <Step title="簽署承載資料">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="新增權杖">
    將產生的十六進位摘要作為 context 中的 `_token` 新增。
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
    - 一律簽署**所有**內容欄位（`_token` 除外）。閘道會移除 `_token`，然後簽署其餘所有內容。僅簽署部分欄位會造成驗證無聲失敗。
    - 使用 `sort_keys=True`，因為閘道會在簽署前排序鍵，而 Mattermost 儲存承載資料時可能會重新排列內容欄位。
    - 從機器人權杖衍生密鑰（確定性），不要使用隨機位元組。建立按鈕的程序與執行驗證的閘道必須使用相同的密鑰。

  </Accordion>
</AccordionGroup>

## 目錄配接器

Mattermost 外掛包含一個目錄配接器，可透過 Mattermost API 解析頻道與使用者名稱。這使 `openclaw message send` 及排程／網路鉤子傳遞能夠使用 `#channel-name` 和 `@username` 目標。

不需要任何設定，配接器會使用帳戶設定中的機器人權杖。

## 多帳戶

Mattermost 支援在 `channels.mattermost.accounts` 下設定多個帳戶：

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

帳戶值會覆寫頂層欄位；未指定帳戶時，`channels.mattermost.defaultAccount` 會選擇要使用的帳戶。

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    請確認機器人已加入頻道並提及它（oncall）、使用觸發前綴（onchar），或設定 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="驗證或多帳戶錯誤">
    - 檢查機器人權杖、基底 URL，以及帳戶是否已啟用。
    - 多帳戶問題：環境變數只會套用至 `default` 帳戶。
    - 私人／區域網路 Mattermost 主機需要 `network.dangerouslyAllowPrivateNetwork: true`（SSRF 防護機制預設會封鎖私人 IP）。

  </Accordion>
  <Accordion title="原生斜線命令失敗">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回呼權杖。常見原因：
      - 斜線命令註冊失敗，或啟動時僅完成部分註冊
      - 回呼傳送至錯誤的閘道／帳戶
      - Mattermost 仍保留指向先前回呼目標的舊命令
      - 閘道重新啟動後未重新啟用斜線命令
    - 若原生斜線命令停止運作，請檢查記錄中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 若省略 `callbackUrl`，且記錄警告回呼解析為類似 `http://localhost:18789/...` 的迴環 URL，除非 Mattermost 與 OpenClaw 在同一主機／網路命名空間中執行，否則可能無法連線至該 URL。請改為明確設定可從外部連線的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按鈕問題">
    - 按鈕顯示為白色方塊或完全不顯示：按鈕資料格式錯誤。每個呈現按鈕都需要 `label` 和 `value`（缺少任一項的按鈕都會被捨棄）。
    - 按鈕可正常呈現，但點擊後沒有反應：確認 Mattermost 伺服器可連線至閘道、Mattermost 伺服器 IP 已包含在 `channels.mattermost.interactions.allowedSourceIps` 中（若未設定，只接受迴環位址），且針對私人目標，`ServiceSettings.AllowedUntrustedInternalConnections` 包含回呼主機。
    - 點擊按鈕後傳回 404：按鈕的 `id` 可能包含連字號或底線。Mattermost 的動作路由器無法處理非英數字元的 ID。只能使用 `[a-zA-Z0-9]`。
    - 閘道記錄顯示 `rejected callback source`：點擊來自 `interactions.allowedSourceIps` 之外的 IP。將 Mattermost 伺服器或輸入端加入允許清單；若位於反向代理後方，請設定 `gateway.trustedProxies`。
    - 閘道記錄顯示 `invalid _token`：HMAC 不相符。確認簽署所有內容欄位（而非部分欄位）、使用已排序的鍵，並使用緊湊 JSON（不含空格）。請參閱上方的 HMAC 小節。
    - 閘道記錄顯示 `missing _token in context`：按鈕內容中沒有 `_token` 欄位。建置整合承載資料時，請確認已包含該欄位。
    - 閘道以 `Unknown action` 拒絕點擊：`context.action_id` 與貼文上任何動作的 `id` 都不相符。請將兩者設為相同的清理後值。
    - 代理程式未提供按鈕：將 `capabilities: ["inlineButtons"]` 新增至 Mattermost 頻道設定。

  </Accordion>
</AccordionGroup>

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing)－訊息的工作階段路由
- [頻道概覽](/zh-TW/channels)－所有支援的頻道
- [群組](/zh-TW/channels/groups)－群組聊天行為與提及閘控
- [配對](/zh-TW/channels/pairing)－私訊驗證與配對流程
- [安全性](/zh-TW/gateway/security)－存取模型與強化措施

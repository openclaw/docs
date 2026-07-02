---
read_when:
    - 新增或修改訊息卡片、按鈕或選取項的呈現
    - 建置支援豐富外送訊息的頻道外掛
    - 變更訊息工具呈現方式或遞送能力
    - 偵錯特定供應商的卡片／區塊／元件算繪迴歸
summary: 語意訊息卡片、按鈕、選取器、備援文字，以及供通道外掛使用的遞送提示
title: 訊息呈现
x-i18n:
    generated_at: "2026-07-02T22:22:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

訊息呈現是 OpenClaw 用於豐富傳出聊天使用者介面的共享合約。
它讓代理程式、命令列介面命令、核准流程和外掛只需描述一次訊息意圖，
而每個頻道外掛都會盡力渲染成最佳的原生形態。

將 presentation 用於可攜式訊息使用者介面：

- 文字區段
- 小型內容脈絡/頁尾文字
- 分隔線
- 按鈕
- 選取選單
- 卡片標題與語氣

不要把新的供應商原生欄位加入共享訊息工具，例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。
這些是由頻道外掛擁有的渲染器輸出。

## 合約

外掛作者從以下位置匯入公開合約：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

形狀：

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

按鈕語意：

- `action.type: "command"` 會透過核心的命令路徑執行原生斜線命令。
  內建命令按鈕和選單請使用這個。
- `action.type: "callback"` 會透過頻道的互動路徑攜帶不透明的外掛資料。
  頻道外掛不得將回呼資料重新解讀為斜線命令。
- `value` 是舊版的不透明回呼值。新的控制項應使用 `action`，
  讓頻道外掛可以對應命令與回呼，而不用從文字猜測。
- `url` 是連結按鈕。它可以在沒有 `value` 的情況下存在。
- `webApp` 描述頻道原生的網頁應用程式按鈕。Telegram 會將它渲染為
  `web_app`，且只在私人聊天中支援。為了相容性，寬鬆 JSON 酬載仍接受
  `web_app`，但 TypeScript 產生端應使用 `webApp`。
- `label` 為必填，也會用於文字後援。
- `style` 是建議性質。渲染器應將不支援的樣式對應到安全預設值，
  而不是讓傳送失敗。
- `priority` 是選填。當頻道宣告動作限制且必須捨棄控制項時，
  核心會優先保留較高優先級的按鈕，並在相同優先級的按鈕之間保留原始順序。
  當所有控制項都能放入時，會保留作者指定的順序。
- `disabled` 是選填。頻道必須透過 `supportsDisabled` 明確選擇支援；
  否則核心會將停用的控制項降級為非互動式後援文字。
- `reusable` 是選填。支援可重複使用原生回呼的頻道，可以在成功互動後
  保持該動作可用。請將它用於可重複或冪等的動作，例如重新整理、檢查或更多詳細資訊；
  一般一次性核准和破壞性動作則保持未設定。

選取語意：

- `options[].action` 與按鈕 `action` 具有相同的命令/回呼意義。
- `options[].value` 是舊版的已選應用程式值。
- `placeholder` 是建議性質，沒有原生選取支援的頻道可能會忽略它。
- 如果頻道不支援選取，後援文字會列出標籤。

## 產生端範例

簡單卡片：

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

僅 URL 連結按鈕：

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Telegram Mini App 按鈕：

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

選取選單：

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

命令列介面傳送：

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

釘選遞送：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

使用明確 JSON 的釘選遞送：

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 渲染器合約

頻道外掛會在其傳出配接器上宣告渲染支援：

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

能力布林值描述渲染器能製作哪些互動項目。選用的 `limits`
描述核心在呼叫渲染器前可以調整的通用封套：

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

核心會在渲染前，先對語意控制項套用通用限制。渲染器仍負責最終的供應商專屬驗證與裁切，
例如原生區塊數量、卡片大小、URL 限制，以及無法用通用合約表示的供應商特性。
如果限制移除了某個區塊中的所有控制項，核心會把標籤保留為非互動式內容脈絡文字，
讓送出的訊息仍有可見的後援內容。

## 核心渲染流程

當 `ReplyPayload` 或訊息動作包含 `presentation` 時，核心會：

1. 正規化 presentation 酬載。
2. 解析目標頻道的傳出配接器。
3. 讀取 `presentationCapabilities`。
4. 在配接器宣告時，套用通用能力限制，例如動作數量、標籤長度和
   選取選項數量。
5. 當配接器可以渲染酬載時，呼叫 `renderPresentation`。
6. 當配接器不存在或無法渲染時，後援為保守文字。
7. 透過一般頻道遞送路徑傳送產生的酬載。
8. 在第一則成功送出的訊息後，套用 `delivery.pin` 等遞送中繼資料。

核心擁有後援行為，讓產生端可以保持頻道無關。頻道外掛擁有原生渲染與互動處理。

## 降級規則

Presentation 必須能安全地傳送到能力受限的頻道。

後援文字包含：

- `title` 作為第一行
- `text` 區塊作為一般段落
- `context` 區塊作為精簡的內容脈絡行
- `divider` 區塊作為視覺分隔線
- 按鈕標籤，包括連結按鈕的 URL
- 選取選項標籤

### 按鈕值後援可見性

當頻道無法渲染互動式控制項時，按鈕和選取值會後援為純文字。
後援行為會保留可用性，同時讓不透明的回呼資料保持私密：

- **`command` 型別動作**會渲染為 `label: \`command\``，讓使用者可以
  複製命令並在頻道輸入中手動執行。
- **`callback` 型別動作**和舊版 **`value`** 欄位會渲染為僅標籤。
  不透明的回呼值不會暴露在後援文字中。
- **`url` / `webApp`** 按鈕會在按鈕標籤旁渲染 URL 文字，
  因為 URL 是面向使用者的。
- **選取選項**會渲染為僅標籤。底層選項值不會暴露在後援文字中。

在後援使用者介面中加入手動命令指引的頻道配接器（例如
Feishu 文件留言指示），必須從後援渲染器使用的同一批 presentation 區塊
推導是否存在命令，讓指引文字只在實際顯示手動命令時出現。

不支援的原生控制項應降級，而不是讓整個傳送失敗。
範例：

- 停用行內按鈕的 Telegram 會傳送文字後援。
- 不支援選取的頻道會將選取選項列為文字。
- 僅 URL 按鈕會變成原生連結按鈕，或後援 URL 行。
- 選用的釘選失敗不會讓已遞送訊息失敗。

主要例外是 `delivery.pin.required: true`；如果釘選被要求為必要，
而頻道無法釘選已送出的訊息，遞送會回報失敗。

## 供應商對應

目前內建的渲染器：

| 頻道            | 原生渲染目標                        | 備註                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | 元件與元件容器                      | 為現有提供者原生酬載產生器保留舊版 `channelData.discord.components`，但新的共用傳送應使用 `presentation`。 |
| Slack           | Block Kit                           | 為現有提供者原生酬載產生器保留舊版 `channelData.slack.blocks`，但新的共用傳送應使用 `presentation`。       |
| Telegram        | 文字加上行內鍵盤                    | 按鈕/選取需要目標表面具備行內按鈕能力；否則會使用文字備援。                                         |
| Mattermost      | 文字加上互動式 props                | 其他區塊會降級為文字。                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 同時提供兩者時，一般 `message` 文字會隨卡片一起包含。                                                                            |
| Feishu          | 互動式卡片                          | 卡片標頭可使用 `title`；內文會避免重複該標題。                                                                                  |
| 純文字頻道      | 文字備援                            | 沒有渲染器的頻道仍會取得可讀輸出。                                                                                            |

提供者原生酬載相容性是既有回覆產生器的過渡性便利措施。這不是新增共用原生欄位的理由。

## Presentation 與 InteractiveReply

`InteractiveReply` 是核准與互動輔助工具使用的較舊內部子集。它支援：

- 文字
- 按鈕
- 選取

`MessagePresentation` 是標準的共用傳送合約。它新增：

- 標題
- 語氣
- 脈絡
- 分隔線
- 僅 URL 按鈕
- 透過 `ReplyPayload.delivery` 提供通用傳遞中繼資料

橋接較舊程式碼時，請使用 `openclaw/plugin-sdk/interactive-runtime` 的輔助工具：
__OC_I18N_900011__
新程式碼應直接接受或產生 `MessagePresentation`。既有 `interactive` 酬載是 `presentation` 的已棄用子集；執行階段仍支援較舊的產生器。

舊版 `InteractiveReply*` 型別與轉換輔助工具已在 SDK 中標記為 `@deprecated`：

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, and
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` 與
`presentationToInteractiveControlsReply(...)` 仍可作為舊版頻道實作的渲染器橋接使用。新的產生器程式碼不應呼叫它們；請傳送 `presentation`，並讓核心/頻道調適處理渲染。

核准輔助工具也有以 presentation 優先的替代項：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)` 取代
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)` 取代
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)` 取代
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` 會針對沒有文字備援的 presentation 區塊傳回空字串，例如只有分隔線的 presentation。需要非空傳送本文的傳輸可傳入 `emptyFallback`，以選擇使用最小本文，而不變更預設備援合約。

## 傳遞釘選

釘選是傳遞行為，不是 presentation。請使用 `delivery.pin`，而不是 `channelData.telegram.pin` 等提供者原生欄位。

語意：

- `pin: true` 會釘選第一則成功傳遞的訊息。
- `pin.notify` 預設為 `false`。
- `pin.required` 預設為 `false`。
- 選用釘選失敗會降級，並保留已傳送訊息不變。
- 必要釘選失敗會使傳遞失敗。
- 分塊訊息會釘選第一個已傳遞區塊，而不是尾端區塊。

手動 `pin`、`unpin` 與 `pins` 訊息動作仍適用於提供者支援這些操作的既有訊息。

## 外掛作者檢查清單

- 當頻道能渲染或安全降級語意 presentation 時，從 `describeMessageTool(...)` 宣告 `presentation`。
- 將 `presentationCapabilities` 新增至執行階段輸出配接器。
- 在執行階段程式碼中實作 `renderPresentation`，而不是在控制平面外掛設定程式碼中。
- 避免讓原生 UI 函式庫進入熱設定/目錄路徑。
- 已知時，在 `presentationCapabilities.limits` 上宣告通用能力限制。
- 在渲染器與測試中保留最終平台限制。
- 為不支援的按鈕、選取、URL 按鈕、標題/文字重複，以及混合 `message` 加 `presentation` 傳送新增備援測試。
- 只有在提供者可以釘選已傳送訊息 id 時，才透過 `deliveryCapabilities.pin` 與
  `pinDeliveredMessage` 新增傳遞釘選支援。
- 不要透過共用訊息動作結構描述公開新的提供者原生卡片/區塊/元件/按鈕欄位。

## 相關文件

- [訊息命令列介面](/zh-TW/cli/message)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛架構](/zh-TW/plugins/architecture-internals#message-tool-schemas)
- [頻道 Presentation 重構計畫](/zh-TW/plan/ui-channels)

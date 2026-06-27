---
read_when:
    - 新增或修改訊息卡片、按鈕或選取項目轉譯
    - 建置支援豐富傳出訊息的通道外掛
    - 變更訊息工具呈現方式或傳遞能力
    - 偵錯特定提供者的卡片／區塊／元件算繪回歸
summary: 語意化訊息卡片、按鈕、選單、備援文字，以及給頻道外掛的遞送提示
title: 訊息呈現
x-i18n:
    generated_at: "2026-06-27T19:38:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

訊息呈現是 OpenClaw 用於豐富傳出聊天介面的共用合約。
它讓代理程式、命令列介面命令、核准流程和外掛能先描述一次訊息意圖，
而每個通道外掛再盡可能轉譯成最佳的原生形式。

將呈現用於可攜式訊息介面：

- 文字區段
- 小型情境／頁尾文字
- 分隔線
- 按鈕
- 選取選單
- 卡片標題與語氣

不要在共用訊息工具中新增提供者原生欄位，例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。這些是由通道外掛擁有的轉譯器輸出。

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
  將它用於內建命令按鈕和選單。
- `action.type: "callback"` 會透過通道的互動路徑攜帶不透明的外掛資料。
  通道外掛不得將回呼資料重新解讀為斜線命令。
- `value` 是舊版不透明回呼值。新的控制項應使用 `action`，
  讓通道外掛可以對應命令與回呼，而不必從文字猜測。
- `url` 是連結按鈕。它可以不搭配 `value` 存在。
- `webApp` 描述通道原生的網頁應用程式按鈕。Telegram 會將它轉譯為
  `web_app`，且僅支援在私人聊天中使用。`web_app` 仍會在寬鬆 JSON
  承載中被接受以維持相容性，但 TypeScript 產生端應使用 `webApp`。
- `label` 為必填，且也會用於文字備援。
- `style` 是建議性質。轉譯器應將不支援的樣式對應到安全預設值，
  而不是讓傳送失敗。
- `priority` 是選填。當通道宣告動作限制且必須捨棄控制項時，
  核心會優先保留較高優先序的按鈕，並在相同優先序的按鈕之間保留原始順序。
  當所有控制項都放得下時，會保留作者設定的順序。
- `disabled` 是選填。通道必須以 `supportsDisabled` 選擇加入；否則
  核心會將停用的控制項降級為非互動式備援文字。
- `reusable` 是選填。支援可重複使用原生回呼的通道，可以在成功互動後
  讓該動作維持可用。將它用於可重複或冪等的動作，例如重新整理、檢查或更多詳細資訊；
  一般一次性核准與破壞性動作則不要設定。

選取語意：

- `options[].action` 與按鈕 `action` 具有相同的命令／回呼意義。
- `options[].value` 是舊版選取的應用程式值。
- `placeholder` 是建議性質，沒有原生選取支援的通道可能會忽略它。
- 如果通道不支援選取，備援文字會列出標籤。

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

僅 URL 的連結按鈕：

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

釘選傳遞：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

使用明確 JSON 的釘選傳遞：

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 轉譯器合約

通道外掛會在其傳出配接器上宣告轉譯支援：

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

能力布林值描述轉譯器能將什麼做成互動式。選填的
`limits` 描述核心可在呼叫轉譯器前調整的通用封套：

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

核心會在轉譯前對語意控制項套用通用限制。轉譯器仍擁有最後的提供者特定驗證與裁切，
用於原生區塊數量、卡片大小、URL 限制，以及無法在通用合約中表達的提供者特殊行為。
如果限制移除了某個區塊中的所有控制項，核心會將標籤保留為非互動式情境文字，
讓已傳遞的訊息仍有可見的備援。

## 核心轉譯流程

當 `ReplyPayload` 或訊息動作包含 `presentation` 時，核心會：

1. 正規化呈現承載。
2. 解析目標通道的傳出配接器。
3. 讀取 `presentationCapabilities`。
4. 當配接器宣告能力限制時，套用通用能力限制，例如動作數量、標籤長度和
   選取選項數量。
5. 當配接器可以轉譯承載時，呼叫 `renderPresentation`。
6. 當配接器不存在或無法轉譯時，退回保守文字。
7. 透過一般通道傳遞路徑傳送產生的承載。
8. 在第一則成功送出的訊息後，套用傳遞中繼資料，例如 `delivery.pin`。

核心擁有備援行為，因此產生端可以維持通道無關。通道外掛擁有原生轉譯與互動處理。

## 降級規則

呈現必須能安全地傳送到能力受限的通道。

備援文字包含：

- `title` 作為第一行
- `text` 區塊作為一般段落
- `context` 區塊作為精簡情境行
- `divider` 區塊作為視覺分隔線
- 按鈕標籤，包含連結按鈕的 URL
- 選取選項標籤

不支援的原生控制項應降級，而不是讓整個傳送失敗。
範例：

- 停用行內按鈕的 Telegram 會傳送文字備援。
- 沒有選取支援的通道會將選取選項列為文字。
- 僅 URL 的按鈕會變成原生連結按鈕或備援 URL 行。
- 選填釘選失敗不會讓已傳遞的訊息失敗。

主要例外是 `delivery.pin.required: true`；如果要求必須釘選，
而通道無法釘選已送出的訊息，傳遞會回報失敗。

## 提供者對應

目前內建的轉譯器：

| 通道            | 原生轉譯目標                         | 備註                                                                                                                                              |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 組件與組件容器                       | 為既有提供者原生承載產生端保留舊版 `channelData.discord.components`，但新的共用傳送應使用 `presentation`。                                      |
| Slack           | Block Kit                            | 為既有提供者原生承載產生端保留舊版 `channelData.slack.blocks`，但新的共用傳送應使用 `presentation`。                                            |
| Telegram        | 文字加行內鍵盤                       | 按鈕／選取需要目標介面的行內按鈕能力；否則會使用文字備援。                                                                                       |
| Mattermost      | 文字加互動屬性                       | 其他區塊會降級為文字。                                                                                                                           |
| Microsoft Teams | Adaptive Cards                       | 同時提供兩者時，純 `message` 文字會隨卡片一起包含。                                                                                              |
| Feishu          | 互動卡片                             | 卡片標頭可以使用 `title`；內文會避免重複該標題。                                                                                                 |
| 純文字通道      | 文字備援                             | 沒有轉譯器的通道仍會取得可讀的輸出。                                                                                                             |

提供者原生承載資料相容性，是為現有回覆產生器提供的過渡便利措施。這不是新增共享原生欄位的理由。

## 呈現 vs InteractiveReply

`InteractiveReply` 是較舊的內部子集，由核准與互動輔助工具使用。它支援：

- 文字
- 按鈕
- 選取選單

`MessagePresentation` 是標準共享傳送合約。它新增：

- 標題
- 語氣
- 情境
- 分隔線
- 僅 URL 按鈕
- 透過 `ReplyPayload.delivery` 提供的通用傳遞中繼資料

橋接較舊程式碼時，請使用 `openclaw/plugin-sdk/interactive-runtime` 的輔助工具：

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新程式碼應直接接受或產生 `MessagePresentation`。現有的 `interactive` 承載資料是 `presentation` 已淘汰的子集；執行階段仍會支援較舊的產生器。

舊版 `InteractiveReply*` 型別與轉換輔助工具在 SDK 中已標示為 `@deprecated`：

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, 和
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` 和
`presentationToInteractiveControlsReply(...)` 仍可作為舊版頻道實作的轉譯器橋接使用。新的產生器程式碼不應呼叫它們；請傳送 `presentation`，並讓核心/頻道調適處理轉譯。

核准輔助工具也有以呈現為優先的替代項：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)` 取代
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)` 取代
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)` 取代
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` 對沒有文字備援的呈現區塊會回傳空字串，例如只有分隔線的呈現。需要非空傳送本文的傳輸，可傳入 `emptyFallback` 以選擇使用最小本文，而不改變預設備援合約。

## 傳遞釘選

釘選是傳遞行為，不是呈現。請使用 `delivery.pin`，而不是 `channelData.telegram.pin` 這類提供者原生欄位。

語意：

- `pin: true` 會釘選第一則成功傳遞的訊息。
- `pin.notify` 預設為 `false`。
- `pin.required` 預設為 `false`。
- 選用釘選失敗會降級，並保留已傳送的訊息。
- 必要釘選失敗會使傳遞失敗。
- 分段訊息會釘選第一個已傳遞的分段，而不是尾端分段。

手動 `pin`、`unpin` 和 `pins` 訊息動作仍然存在，適用於提供者支援這些操作的既有訊息。

## 外掛作者檢查清單

- 當頻道可以轉譯或安全降級語意呈現時，從 `describeMessageTool(...)` 宣告 `presentation`。
- 將 `presentationCapabilities` 加入執行階段輸出配接器。
- 在執行階段程式碼中實作 `renderPresentation`，不要在控制平面外掛設定程式碼中實作。
- 讓原生 UI 函式庫遠離熱路徑的設定/目錄路徑。
- 已知時，在 `presentationCapabilities.limits` 上宣告通用功能限制。
- 在轉譯器與測試中保留最終平台限制。
- 為不支援的按鈕、選取選單、URL 按鈕、標題/文字重複，以及混合 `message` 加 `presentation` 傳送加入備援測試。
- 只有在提供者能釘選已傳送訊息 ID 時，才透過 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 加入傳遞釘選支援。
- 不要透過共享訊息動作結構描述暴露新的提供者原生卡片/區塊/元件/按鈕欄位。

## 相關文件

- [訊息命令列介面](/zh-TW/cli/message)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛架構](/zh-TW/plugins/architecture-internals#message-tool-schemas)
- [頻道呈現重構計畫](/zh-TW/plan/ui-channels)

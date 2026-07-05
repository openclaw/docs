---
read_when:
    - 新增或修改訊息卡片、按鈕或選取項目轉譯
    - 建置支援豐富外送訊息的頻道外掛
    - 變更訊息工具呈現方式或傳遞能力
    - 偵錯供應商特定的卡片/區塊/元件呈現回歸
summary: 語意訊息卡片、按鈕、選單、備援文字，以及 channel 外掛的傳遞提示
title: 訊息呈現
x-i18n:
    generated_at: "2026-07-05T11:31:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49e9a4657d27b90d12fb921bb4c9f0e7f0ae70d9dc452c8365626c9fdb5adcc8
    source_path: plugins/message-presentation.md
    workflow: 16
---

訊息呈現是 OpenClaw 用於豐富外送聊天 UI 的共享合約。
它讓代理程式、命令列介面命令、核准流程和外掛只需描述一次訊息
意圖，而每個通道外掛都能盡可能轉譯成最佳的原生形式。

將呈現用於可攜式訊息 UI：文字區段、小型脈絡/頁尾
文字、分隔線、按鈕、選單，以及卡片標題/語氣。

不要將新的提供者原生欄位（例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`）新增到共享的
訊息工具。這些是由通道外掛擁有的轉譯器輸出。

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

- `action.type: "command"` 會透過核心的命令
  路徑執行原生斜線命令。將此用於內建命令按鈕和選單。
- `action.type: "callback"` 會透過通道的
  互動路徑攜帶不透明的外掛資料。通道外掛不得將回呼資料重新解讀為斜線
  命令。
- `value` 是舊版不透明回呼值。新的控制項應使用 `action`，
  讓通道外掛可以對應命令和回呼，而不必從文字猜測。
- `url` 是連結按鈕。它可以在沒有 `value` 的情況下存在。
- `webApp` 描述通道原生的網頁應用程式按鈕。Telegram 會將此轉譯
  為 `web_app`，且僅在私人聊天中支援。為了相容性，`web_app` 仍會
  在寬鬆 JSON 酬載中被接受，但 TypeScript 產生器
  應使用 `webApp`。
- `label` 是必填，也會用於文字後援。
- `style` 是建議性質。轉譯器應將不支援的樣式對應到安全的
  預設值，而不是讓傳送失敗。
- `priority` 是選用。當通道宣告動作限制且控制項
  必須被捨棄時，核心會優先保留較高優先度的按鈕，並保留
  相同優先度按鈕之間的原始順序。當所有控制項都能容納時，會保留作者指定的
  順序。
- `disabled` 是選用。通道必須透過 `supportsDisabled` 選擇加入；否則
  核心會將停用的控制項降級為非互動後援文字。停用的按鈕在後援文字中一律只轉譯標籤，
  即使它帶有 `command` 動作。
- `reusable` 是選用。支援可重複使用原生回呼的通道可以
  在成功互動後保留動作可用。將它用於
  可重複或冪等的動作，例如重新整理、檢查或更多詳細資料；
  一般一次性的核准和破壞性動作則不要設定。

選單語意：

- `options[].action` 與按鈕 `action` 具有相同的命令/回呼意義。
- `options[].value` 是舊版選取的應用程式值。
- `placeholder` 是建議性質，沒有原生
  選單支援的通道可能會忽略它。
- 如果通道不支援選單，後援文字會列出標籤。

## 產生器範例

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

選單：

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

通道外掛在其外送配接器上宣告轉譯支援：

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

能力布林值描述轉譯器可以讓哪些項目具備互動性。選用的
`limits` 描述核心可在呼叫
轉譯器前調整的通用封套：

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

核心會在轉譯前對語意控制項套用通用限制。轉譯器
仍然擁有最終的提供者特定驗證與裁切，例如原生區塊
數量、卡片大小、URL 限制，以及無法在
通用合約中表達的提供者特性。如果限制移除了區塊中的所有控制項，核心會保留
標籤作為非互動脈絡文字，讓已傳遞的訊息仍有
可見的後援。

## 核心轉譯流程

當 `ReplyPayload` 或訊息動作包含 `presentation` 時，核心會：

1. 正規化呈現酬載。
2. 解析目標通道的外送配接器。
3. 讀取 `presentationCapabilities`。
4. 當配接器宣告限制時，套用通用能力限制，例如動作數量、標籤長度和
   選單選項數量。
5. 當配接器可以轉譯酬載時，呼叫 `renderPresentation`。
6. 當配接器不存在或無法轉譯時，後援為保守文字。
7. 透過一般通道傳遞路徑傳送產生的酬載。
8. 在第一則成功
   傳送的訊息之後，套用傳遞中繼資料，例如 `delivery.pin`。

核心擁有後援行為，讓產生器可以保持通道無關。通道
外掛擁有原生轉譯與互動處理。

## 降級規則

呈現必須能安全地傳送到能力受限的通道。

後援文字包含：

- `title` 作為第一行
- `text` 區塊作為一般段落
- `context` 區塊作為精簡脈絡行
- `divider` 區塊作為視覺分隔線
- 按鈕標籤，包括連結按鈕的 URL
- 選單選項標籤

### 按鈕值後援可見性

當通道無法轉譯互動控制項時，按鈕和選單值
會後援為純文字。後援行為會保留可用性，同時
保持不透明回呼資料的私密性：

- **`command` 型別的動作** 會轉譯為 `label: \`command\``，讓使用者可以
  複製命令並在通道輸入中手動執行。
- **`callback` 型別的動作** 和舊版 **`value`** 欄位會轉譯為
  僅標籤。不透明回呼值不會在後援文字中暴露。
- **`url` / `webApp`** 按鈕會在按鈕
  標籤旁轉譯 URL 文字，因為 URL 是面向使用者的。
- **選單選項** 會轉譯為僅標籤。底層選項值不會
  在後援文字中暴露。

在後援 UI 中加入手動命令指引的通道配接器（例如
Feishu 文件留言指示）必須從後援轉譯器使用的相同呈現區塊中推導命令存在檢查，
因此指引文字只會在實際顯示手動命令時出現。

不支援的原生控制項應降級，而不是讓整個傳送失敗。
範例：

- 停用行內按鈕的 Telegram 會傳送文字後援。
- 不支援選單的通道會將選單選項列為文字。
- 僅 URL 的按鈕會變成原生連結按鈕或後援 URL 行。
- 選用的釘選失敗不會讓已傳遞的訊息失敗。

主要例外是 `delivery.pin.required: true`；如果要求釘選為
必須且通道無法釘選已傳送的訊息，傳遞會回報失敗。

## 提供者對應

目前內建的轉譯器：

| 通道            | 原生呈現目標                            | 備註                                                                                                                                                                                                                  |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 元件與元件容器                            | 為現有提供者原生酬載產生器保留舊版 `channelData.discord.components`，但新的共用傳送應使用 `presentation`。                                                                 |
| Feishu          | 互動式卡片                                | 卡片標頭可以使用 `title`；本文會避免重複該標題。                                                                                                                                                  |
| Matrix          | 文字後援加上結構化事件欄位                | 按鈕/選單會宣告為支援，但每個區塊目前都會呈現為 `renderMessagePresentationFallbackText` 輸出，並放在 `com.openclaw.presentation` 事件欄位中，而不是原生互動小工具。 |
| Mattermost      | 文字加上互動式屬性                        | 不支援選單與分隔線；這些區塊會降級為文字。                                                                                                                                             |
| Microsoft Teams | Adaptive Cards                            | 同時提供純 `message` 文字與卡片時，文字會包含在卡片中。不支援選單、樣式與停用狀態。                                                                                     |
| Slack           | Block Kit                                 | 為現有提供者原生酬載產生器保留舊版 `channelData.slack.blocks`，但新的共用傳送應使用 `presentation`。                                                                       |
| Telegram        | 文字加上行內鍵盤                          | 按鈕/選單需要目標介面具備行內按鈕能力；否則會使用文字後援。                                                                                                         |
| 純文字通道      | 文字後援                                  | 沒有呈現器的通道仍會取得可讀輸出。                                                                                                                                                            |

提供者原生酬載相容性是給現有回覆產生器的過渡便利措施。
這不是新增共用原生欄位的理由。

## Presentation 與 InteractiveReply

`InteractiveReply` 是核准與互動輔助工具使用的較舊內部子集。
它支援：

- 文字
- 按鈕
- 選單

`MessagePresentation` 是標準的共用傳送合約。它新增：

- 標題
- 語氣
- 脈絡
- 分隔線
- 僅限 URL 的按鈕
- 透過 `ReplyPayload.delivery` 提供的通用傳遞中繼資料

橋接舊程式碼時，請使用 `openclaw/plugin-sdk/interactive-runtime` 中的輔助工具：
__OC_I18N_900011__
新程式碼應直接接受或產生 `MessagePresentation`。現有的
`interactive` 酬載是 `presentation` 已棄用的子集；執行階段
仍支援較舊的產生器。

值得了解的未棄用輔助工具：

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  會驗證未型別化酬載並將其強制轉換為 `MessagePresentation`（例如來自命令列介面
  `--presentation` 旗標的 JSON）。
- `isMessagePresentationInteractiveBlock(block)` 會將區塊縮窄為
  `buttons` | `select` 聯集。
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` 會讀取 `action` 上有效的
  命令/回呼值；`resolveMessagePresentationControlValue` 會後援到舊版 `value`
  欄位。

舊版 `InteractiveReply*` 型別與轉換輔助工具在 SDK 中標記為
`@deprecated`：

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
`presentationToInteractiveControlsReply(...)` 仍可作為舊版通道實作的呈現器
橋接使用。新的產生器程式碼不應呼叫它們；請傳送 `presentation`，並讓核心/通道調整處理呈現。

核准輔助工具也有以 presentation 為優先的替代項目：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)`，而不是
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)`，而不是
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)`，而不是
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` 對沒有文字後援的
presentation 區塊會回傳空字串，例如只有分隔線的
presentation。需要非空傳送本文的傳輸可以傳入
`emptyFallback` 來選擇使用最小本文，而不變更預設後援
合約。

## 傳遞釘選

釘選是傳遞行為，不是 presentation。請使用 `delivery.pin`，而不是
`channelData.telegram.pin` 等提供者原生欄位。

語意：

- `pin: true` 會釘選第一則成功傳遞的訊息。
- `pin.notify` 預設為 `false`。
- `pin.required` 預設為 `false`。
- 選用釘選失敗會降級，並保留已傳送的訊息。
- 必要釘選失敗會使傳遞失敗。
- 分塊訊息會釘選第一個已傳遞的分塊，而不是尾端分塊。

現有訊息仍可使用手動 `pin`、`unpin` 與 `pins` 訊息動作，
前提是提供者支援這些操作。

## 外掛作者檢查清單

- 當通道可以呈現語意 presentation，或可安全降級時，從 `describeMessageTool(...)` 宣告 `presentation`。
- 將 `presentationCapabilities` 新增至執行階段輸出配接器。
- 在執行階段程式碼中實作 `renderPresentation`，不要在控制平面外掛
  設定程式碼中實作。
- 讓原生 UI 函式庫遠離熱門設定/目錄路徑。
- 已知時，在 `presentationCapabilities.limits` 上宣告通用能力限制。
- 在呈現器與測試中保留最終平台限制。
- 為不支援的按鈕、選單、URL 按鈕、標題/文字重複，以及混合 `message` 加上 `presentation` 的傳送新增後援測試。
- 只有在提供者可以釘選已傳送訊息 ID 時，才透過 `deliveryCapabilities.pin` 與
  `pinDeliveredMessage` 新增傳遞釘選支援。
- 不要透過共用訊息動作結構描述公開新的提供者原生卡片/區塊/元件/按鈕欄位。

## 相關文件

- [訊息命令列介面](/zh-TW/cli/message)
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
- [外掛架構](/zh-TW/plugins/architecture-internals#message-tool-schemas)
- [通道 Presentation 重構計畫](/zh-TW/plan/ui-channels)

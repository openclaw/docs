---
read_when:
    - 新增或修改訊息卡片、按鈕或選取控制項的呈現
    - 建置支援豐富傳出訊息的通道 Plugin
    - 變更訊息工具的呈現方式或傳遞能力
    - 偵錯供應商特定的卡片/區塊/元件渲染回歸問題
summary: 供通道 Plugin 使用的語意訊息卡片、按鈕、選取項、備援文字與傳遞提示
title: 訊息呈現
x-i18n:
    generated_at: "2026-05-10T19:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

訊息呈現是 OpenClaw 針對豐富外送聊天 UI 的共用合約。
它讓代理、CLI 指令、核准流程與 plugins 只需描述一次訊息意圖，
而每個通道 Plugin 會盡可能渲染成最佳的原生形式。

將 presentation 用於可攜式訊息 UI：

- 文字區段
- 小型情境／頁尾文字
- 分隔線
- 按鈕
- 選取選單
- 卡片標題與語氣

不要將新的提供者原生欄位加入共用訊息工具，例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。
這些都是由通道 Plugin 擁有的渲染器輸出。

## 合約

Plugin 作者從以下位置匯入公開合約：

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

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
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

- `value` 是應用程式動作值；當通道支援可點擊控制項時，會透過通道既有的
  互動路徑路由回來。
- `url` 是連結按鈕。它可以不搭配 `value` 存在。
- `label` 為必填，也會用於文字後援。
- `style` 是建議性質。渲染器應將不支援的樣式對應到安全的預設值，
  而不是讓傳送失敗。

選取語意：

- `options[].value` 是選取的應用程式值。
- `placeholder` 是建議性質，沒有原生選取支援的通道可能會忽略它。
- 如果通道不支援選取，後援文字會列出標籤。

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

CLI 傳送：

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

置頂傳送：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

使用明確 JSON 的置頂傳送：

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

通道 plugins 在其外送配接器上宣告渲染支援：

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

能力欄位刻意保持為簡單的布林值。它們描述渲染器能讓哪些內容具備互動性，
而不是每個原生平台限制。渲染器仍然負責平台特定限制，例如最大按鈕數、
區塊數與卡片大小。

## 核心渲染流程

當 `ReplyPayload` 或訊息動作包含 `presentation` 時，核心會：

1. 正規化 presentation 酬載。
2. 解析目標通道的外送配接器。
3. 讀取 `presentationCapabilities`。
4. 當配接器能渲染酬載時呼叫 `renderPresentation`。
5. 當配接器不存在或無法渲染時，退回保守的文字。
6. 透過一般通道傳遞路徑傳送產生的酬載。
7. 在第一則成功送出的訊息後，套用 `delivery.pin` 等傳遞中繼資料。

核心擁有後援行為，因此產生端可以維持通道無關。通道 plugins
擁有原生渲染與互動處理。

## 降級規則

Presentation 必須能安全地傳送到受限通道。

後援文字包含：

- `title` 作為第一行
- `text` 區塊作為一般段落
- `context` 區塊作為精簡情境行
- `divider` 區塊作為視覺分隔符
- 按鈕標籤，包含連結按鈕的 URL
- 選取選項標籤

不支援的原生控制項應降級，而不是讓整個傳送失敗。
範例：

- 停用行內按鈕的 Telegram 會傳送文字後援。
- 沒有選取支援的通道會以文字列出選取選項。
- 僅 URL 的按鈕會變成原生連結按鈕或後援 URL 行。
- 選用置頂失敗不會讓已傳遞訊息失敗。

主要例外是 `delivery.pin.required: true`；如果要求置頂為必要，
且通道無法置頂已送出的訊息，傳遞會回報失敗。

## 提供者對應

目前內建的渲染器：

| 通道            | 原生渲染目標                        | 備註                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 元件與元件容器                      | 為現有提供者原生酬載產生端保留舊版 `channelData.discord.components`，但新的共用傳送應使用 `presentation`。 |
| Slack           | Block Kit                           | 為現有提供者原生酬載產生端保留舊版 `channelData.slack.blocks`，但新的共用傳送應使用 `presentation`。       |
| Telegram        | 文字加行內鍵盤                      | 按鈕／選取需要目標介面具備行內按鈕能力；否則會使用文字後援。                                         |
| Mattermost      | 文字加互動屬性                      | 其他區塊會降級為文字。                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 同時提供兩者時，純 `message` 文字會隨卡片一併包含。                                                                            |
| Feishu          | 互動卡片                            | 卡片標頭可以使用 `title`；本文會避免重複該標題。                                                                                  |
| 純文字通道      | 文字後援                            | 沒有渲染器的通道仍會取得可讀輸出。                                                                                            |

提供者原生酬載相容性是給現有回覆產生端的過渡便利措施。
它不是新增共用原生欄位的理由。

## Presentation 與 InteractiveReply

`InteractiveReply` 是核准與互動輔助程式使用的較舊內部子集。
它支援：

- 文字
- 按鈕
- 選取

`MessagePresentation` 是標準的共用傳送合約。它新增：

- 標題
- 語氣
- 情境
- 分隔線
- 僅 URL 的按鈕
- 透過 `ReplyPayload.delivery` 傳遞的一般中繼資料

橋接較舊程式碼時，請使用 `openclaw/plugin-sdk/interactive-runtime`
中的輔助程式：

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新程式碼應直接接受或產生 `MessagePresentation`。

`presentationToInteractiveReply(...)` 會將標題、文字、情境、按鈕與選取對應到較舊的
`InteractiveReply` 形狀，以保留可見的 presentation 文字。
已經以原生方式繪製標題、文字、情境與分隔線區塊的元件渲染器，應改用
`presentationToInteractiveControlsReply(...)`，然後只附加按鈕與選取控制項。

`renderMessagePresentationFallbackText(...)` 對沒有文字後援的 presentation
區塊會回傳空字串，例如只有分隔線的 presentation。需要非空傳送本文的傳輸層，
可以傳入 `emptyFallback` 來選擇使用最小本文，而不改變預設後援合約。

## 傳遞置頂

置頂是傳遞行為，不是 presentation。請使用 `delivery.pin`，而不是
`channelData.telegram.pin` 等提供者原生欄位。

語意：

- `pin: true` 會置頂第一則成功傳遞的訊息。
- `pin.notify` 預設為 `false`。
- `pin.required` 預設為 `false`。
- 選用置頂失敗會降級，並保持已送出的訊息完好。
- 必要置頂失敗會讓傳遞失敗。
- 分段訊息會置頂第一個已傳遞分段，而不是尾端分段。

手動 `pin`、`unpin` 與 `pins` 訊息動作仍可用於提供者支援這些操作的既有訊息。

## Plugin 作者檢查清單

- 當通道能渲染或安全降級語意化 presentation 時，從 `describeMessageTool(...)` 宣告 `presentation`。
- 將 `presentationCapabilities` 加到執行階段外送配接器。
- 在執行階段程式碼中實作 `renderPresentation`，而不是在控制平面 Plugin
  設定程式碼中實作。
- 讓原生 UI 函式庫不要進入高頻設定／目錄路徑。
- 在渲染器與測試中保留平台限制。
- 為不支援的按鈕、選取、URL 按鈕、標題／文字重複，以及混合 `message` 加 `presentation` 傳送新增後援測試。
- 只有在提供者能置頂已送出訊息 ID 時，才透過 `deliveryCapabilities.pin` 與
  `pinDeliveredMessage` 新增傳遞置頂支援。
- 不要透過共用訊息動作結構描述公開新的提供者原生卡片／區塊／元件／按鈕欄位。

## 相關文件

- [訊息 CLI](/zh-TW/cli/message)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 架構](/zh-TW/plugins/architecture-internals#message-tool-schemas)
- [通道 Presentation 重構計畫](/zh-TW/plan/ui-channels)

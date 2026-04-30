---
read_when:
    - 新增或修改訊息卡片、按鈕或選取控制項的呈現
    - 建置支援豐富傳出訊息的通道 Plugin
    - 變更訊息工具的呈現方式或傳遞功能
    - 偵錯提供者特定的卡片/區塊/元件呈現回歸問題
summary: 用於頻道 Plugin 的語意訊息卡片、按鈕、選取項、備援文字與傳遞提示
title: 訊息呈現
x-i18n:
    generated_at: "2026-04-30T03:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

訊息呈現是 OpenClaw 對豐富對外聊天 UI 的共享契約。
它讓代理程式、CLI 指令、核准流程和 Plugin 只需描述一次訊息
意圖，而每個通道 Plugin 都會盡可能轉譯成最佳的原生形式。

使用呈現來建立可攜式訊息 UI：

- 文字區段
- 小型上下文／頁尾文字
- 分隔線
- 按鈕
- 選取選單
- 卡片標題和語氣

不要將新的供應者原生欄位加入共享
訊息工具，例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。
這些是通道 Plugin 擁有的轉譯器輸出。

## 契約

Plugin 作者從以下位置匯入公開契約：

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

- `value` 是應用程式動作值，當通道支援可點擊控制項時，
  會透過該通道既有的互動路徑路由回來。
- `url` 是連結按鈕。它可以在沒有 `value` 的情況下存在。
- `label` 是必填，並且也會用於文字備援。
- `style` 是建議性的。轉譯器應該將不支援的樣式對應到安全的
  預設值，而不是讓傳送失敗。

選取語意：

- `options[].value` 是選取的應用程式值。
- `placeholder` 是建議性的，沒有原生
  選取支援的通道可能會忽略它。
- 如果通道不支援選取，備援文字會列出標籤。

## 產生者範例

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

## 轉譯器契約

通道 Plugin 會在其對外配接器上宣告轉譯支援：

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

能力欄位刻意採用簡單的布林值。它們描述轉譯器可以做成互動式的內容，
而不是每個原生平台限制。轉譯器仍然擁有平台特定限制，例如最大按鈕數量、區塊數量和
卡片大小。

## 核心轉譯流程

當 `ReplyPayload` 或訊息動作包含 `presentation` 時，核心會：

1. 正規化 presentation 酬載。
2. 解析目標通道的 outbound adapter。
3. 讀取 `presentationCapabilities`。
4. 當 adapter 可以算繪酬載時呼叫 `renderPresentation`。
5. 當 adapter 不存在或無法算繪時，退回到保守文字。
6. 透過一般通道傳遞路徑傳送產生的酬載。
7. 在第一則成功傳送的訊息之後，套用 `delivery.pin` 等傳遞中繼資料。

核心負責 fallback 行為，讓產生端可以保持通道無關。通道
plugins 負責原生算繪與互動處理。

## 降級規則

Presentation 必須能安全傳送到功能受限的通道。

Fallback 文字包含：

- `title` 作為第一行
- `text` 區塊作為一般段落
- `context` 區塊作為精簡的脈絡行
- `divider` 區塊作為視覺分隔線
- 按鈕標籤，包括連結按鈕的 URL
- 選取選項標籤

不支援的原生控制項應該降級，而不是讓整個傳送失敗。
範例：

- Telegram 在停用行內按鈕時會傳送文字 fallback。
- 不支援選取的通道會將選取選項列成文字。
- 僅 URL 按鈕會變成原生連結按鈕，或 fallback URL 行。
- 選用釘選失敗不會讓已傳遞的訊息失敗。

主要例外是 `delivery.pin.required: true`；如果要求釘選為必要，
而通道無法釘選已傳送的訊息，傳遞會回報失敗。

## Provider 對應

目前內建算繪器：

| 通道            | 原生算繪目標                        | 備註                                                                                                                                              |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 元件與元件容器                      | 為現有 provider 原生酬載產生端保留舊版 `channelData.discord.components`，但新的共享傳送應使用 `presentation`。 |
| Slack           | Block Kit                           | 為現有 provider 原生酬載產生端保留舊版 `channelData.slack.blocks`，但新的共享傳送應使用 `presentation`。       |
| Telegram        | 文字加行內鍵盤                      | 按鈕/選取需要目標介面具備行內按鈕能力；否則會使用文字 fallback。                                         |
| Mattermost      | 文字加互動 props                    | 其他區塊會降級為文字。                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 同時提供兩者時，純 `message` 文字會隨卡片一起包含。                                                                            |
| Feishu          | 互動卡片                            | 卡片標頭可以使用 `title`；本文會避免重複該標題。                                                                                  |
| 純文字通道      | 文字 fallback                       | 沒有算繪器的通道仍會得到可讀的輸出。                                                                                            |

Provider 原生酬載相容性是為現有回覆產生端提供的過渡便利性。
這不是新增共享原生欄位的理由。

## Presentation 與 InteractiveReply

`InteractiveReply` 是核准與互動輔助工具使用的較舊內部子集。
它支援：

- 文字
- 按鈕
- 選取

`MessagePresentation` 是標準的共享傳送合約。它新增：

- 標題
- 語氣
- 脈絡
- 分隔線
- 僅 URL 按鈕
- 透過 `ReplyPayload.delivery` 提供的通用傳遞中繼資料

橋接較舊程式碼時，請使用 `openclaw/plugin-sdk/interactive-runtime` 的輔助工具：

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新程式碼應直接接受或產生 `MessagePresentation`。

## 傳遞釘選

釘選是傳遞行為，不是 presentation。請使用 `delivery.pin`，而不是
`channelData.telegram.pin` 等 provider 原生欄位。

語意：

- `pin: true` 會釘選第一則成功傳遞的訊息。
- `pin.notify` 預設為 `false`。
- `pin.required` 預設為 `false`。
- 選用釘選失敗會降級，並讓已傳送訊息保持完整。
- 必要釘選失敗會讓傳遞失敗。
- 分段訊息會釘選第一個已傳遞分段，而不是尾端分段。

手動 `pin`、`unpin` 和 `pins` 訊息動作仍存在，適用於 provider 支援這些操作的現有
訊息。

## Plugin 作者檢查清單

- 當通道可以算繪或安全降級語意 presentation 時，從 `describeMessageTool(...)` 宣告 `presentation`。
- 將 `presentationCapabilities` 加到執行階段 outbound adapter。
- 在執行階段程式碼中實作 `renderPresentation`，而不是在控制平面 Plugin
  設定程式碼中。
- 讓原生 UI 函式庫遠離熱門設定/目錄路徑。
- 在算繪器與測試中保留平台限制。
- 為不支援的按鈕、選取、URL 按鈕、標題/文字重複，以及混合 `message` 加 `presentation` 傳送新增 fallback 測試。
- 只有在 provider 可以釘選已傳送訊息 id 時，才透過 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 新增傳遞釘選支援。
- 不要透過共享訊息動作結構描述暴露新的 provider 原生卡片/區塊/元件/按鈕欄位。

## 相關文件

- [訊息 CLI](/zh-TW/cli/message)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 架構](/zh-TW/plugins/architecture-internals#message-tool-schemas)
- [通道 Presentation 重構計畫](/zh-TW/plan/ui-channels)

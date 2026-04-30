---
read_when:
    - 重構通道訊息使用者介面、互動式酬載或原生通道渲染器
    - 變更訊息工具功能、傳遞提示或跨情境標記
    - 偵錯 Discord Carbon 匯入扇出或頻道 Plugin 執行階段惰性載入
summary: 將語意訊息呈現與通道原生 UI 渲染器解耦。
title: 頻道呈現重構計畫
x-i18n:
    generated_at: "2026-04-30T03:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## 狀態

已針對共用代理程式、CLI、Plugin 功能，以及對外傳送介面實作：

- `ReplyPayload.presentation` 承載語意化訊息 UI。
- `ReplyPayload.delivery.pin` 承載已傳送訊息的釘選請求。
- 共用訊息動作公開 `presentation`、`delivery` 和 `pin`，而不是供應商原生的 `components`、`blocks`、`buttons` 或 `card`。
- Core 會透過 Plugin 宣告的對外傳送功能轉譯或自動降級 presentation。
- Discord、Slack、Telegram、Mattermost、MS Teams 和 Feishu 轉譯器會使用通用合約。
- Discord 頻道控制平面程式碼不再匯入 Carbon 支援的 UI 容器。

正式文件現在位於 [訊息呈現](/zh-TW/plugins/message-presentation)。
保留此計畫作為歷史實作脈絡；若合約、轉譯器或備援行為變更，請更新正式指南。

## 問題

頻道 UI 目前分散在幾個不相容的介面中：

- Core 透過 `buildCrossContextComponents` 擁有一個 Discord 形狀的跨脈絡轉譯器 hook。
- Discord `channel.ts` 可以透過 `DiscordUiContainer` 匯入原生 Carbon UI，這會把執行階段 UI 相依性拉進頻道 Plugin 控制平面。
- 代理程式和 CLI 公開原生 payload 逃生口，例如 Discord `components`、Slack `blocks`、Telegram 或 Mattermost `buttons`，以及 Teams 或 Feishu `card`。
- `ReplyPayload.channelData` 同時承載傳輸提示和原生 UI envelope。
- 通用的 `interactive` 模型已存在，但它比 Discord、Slack、Teams、Feishu、LINE、Telegram 和 Mattermost 已使用的豐富版面更窄。

這讓 Core 需要知悉原生 UI 形狀，削弱 Plugin 執行階段延遲載入，並讓代理程式有太多供應商特定方式來表達相同的訊息意圖。

## 目標

- Core 會依據宣告的功能，為訊息決定最佳語意化 presentation。
- Extensions 宣告功能，並將語意化 presentation 轉譯成原生傳輸 payload。
- Web Control UI 與聊天原生 UI 保持分離。
- 原生頻道 payload 不會透過共用代理程式或 CLI 訊息介面公開。
- 不支援的 presentation 功能會自動降級為最佳文字表示。
- 釘選已傳送訊息等 delivery 行為是通用 delivery 中繼資料，不是 presentation。

## 非目標

- 不為 `buildCrossContextComponents` 提供向後相容 shim。
- 不公開 `components`、`blocks`、`buttons` 或 `card` 的公開原生逃生口。
- Core 不匯入頻道原生 UI 函式庫。
- 不為 bundled 頻道提供供應商特定 SDK 接縫。

## 目標模型

在 Core 擁有的 `ReplyPayload` 新增 `presentation` 欄位。

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` 會在遷移期間成為 `presentation` 的子集：

- `interactive` 文字區塊對應到 `presentation.blocks[].type = "text"`。
- `interactive` 按鈕區塊對應到 `presentation.blocks[].type = "buttons"`。
- `interactive` 選取區塊對應到 `presentation.blocks[].type = "select"`。

外部代理程式和 CLI schema 現在使用 `presentation`；`interactive` 仍是供現有回覆產生器使用的內部 legacy 剖析器／轉譯輔助工具。

## Delivery 中繼資料

新增 Core 擁有的 `delivery` 欄位，用於非 UI 的傳送行為。

```ts
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

語意：

- `delivery.pin = true` 表示釘選第一則成功送達的訊息。
- `notify` 預設為 `false`。
- `required` 預設為 `false`；不支援的頻道或釘選失敗會透過繼續 delivery 自動降級。
- 手動 `pin`、`unpin` 和 `list-pins` 訊息動作仍用於既有訊息。

目前的 Telegram ACP 主題繫結應從 `channelData.telegram.pin = true` 移至 `delivery.pin = true`。

## 執行階段功能合約

將 presentation 和 delivery 轉譯 hook 加到執行階段對外 adapter，而不是控制平面頻道 Plugin。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Core 行為：

- 解析目標頻道和執行階段 adapter。
- 詢問 presentation 功能。
- 在轉譯前降級不支援的區塊。
- 呼叫 `renderPresentation`。
- 如果沒有轉譯器，將 presentation 轉換成文字備援。
- 成功傳送後，當請求 `delivery.pin` 且受支援時，呼叫 `pinDeliveredMessage`。

## 頻道對應

Discord：

- 在僅限執行階段的模組中，將 `presentation` 轉譯為 components v2 和 Carbon 容器。
- 將強調色彩輔助工具保留在輕量模組中。
- 從頻道 Plugin 控制平面程式碼移除 `DiscordUiContainer` 匯入。

Slack：

- 將 `presentation` 轉譯為 Block Kit。
- 移除代理程式和 CLI 的 `blocks` 輸入。

Telegram：

- 將文字、脈絡和分隔線轉譯為文字。
- 在已設定且目標介面允許時，將動作和選取轉譯為 inline keyboards。
- 當 inline buttons 停用時使用文字備援。
- 將 ACP 主題釘選移至 `delivery.pin`。

Mattermost：

- 在已設定時，將動作轉譯為互動式按鈕。
- 將其他區塊轉譯為文字備援。

MS Teams：

- 將 `presentation` 轉譯為 Adaptive Cards。
- 保留手動 pin/unpin/list-pins 動作。
- 如果 Graph 對目標對話的支援可靠，可選擇實作 `pinDeliveredMessage`。

Feishu：

- 將 `presentation` 轉譯為互動式 cards。
- 保留手動 pin/unpin/list-pins 動作。
- 如果 API 行為可靠，可選擇實作已傳送訊息釘選的 `pinDeliveredMessage`。

LINE：

- 盡可能將 `presentation` 轉譯為 Flex 或 template messages。
- 不支援的區塊退回文字。
- 從 `channelData` 移除 LINE UI payload。

純文字或受限頻道：

- 使用保守格式將 presentation 轉換為文字。

## 重構步驟

1. 重新套用 Discord release 修正：將 `ui-colors.ts` 從 Carbon 支援的 UI 分離，並從 `extensions/discord/src/channel.ts` 移除 `DiscordUiContainer`。
2. 將 `presentation` 和 `delivery` 加到 `ReplyPayload`、對外 payload 正規化、delivery 摘要和 hook payload。
3. 在狹窄的 SDK／執行階段子路徑中新增 `MessagePresentation` schema 和剖析器輔助工具。
4. 以語意化 presentation 功能取代訊息功能 `buttons`、`cards`、`components` 和 `blocks`。
5. 新增用於 presentation 轉譯和 delivery 釘選的執行階段對外 adapter hook。
6. 以 `buildCrossContextPresentation` 取代跨脈絡 component 建構。
7. 刪除 `src/infra/outbound/channel-adapters.ts`，並從頻道 Plugin 型別移除 `buildCrossContextComponents`。
8. 將 `maybeApplyCrossContextMarker` 改為附加 `presentation`，而不是原生 params。
9. 更新 Plugin dispatch 傳送路徑，只使用語意化 presentation 和 delivery 中繼資料。
10. 移除代理程式和 CLI 原生 payload params：`components`、`blocks`、`buttons` 和 `card`。
11. 移除會建立原生 message-tool schema 的 SDK 輔助工具，改以 presentation schema 輔助工具取代。
12. 從 `channelData` 移除 UI／原生 envelopes；在每個剩餘欄位審查前，只保留傳輸中繼資料。
13. 遷移 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu 和 LINE 轉譯器。
14. 更新 message CLI、頻道頁面、Plugin SDK 和功能 cookbook 的文件。
15. 針對 Discord 和受影響的頻道 entrypoint 執行 import fanout profiling。

步驟 1-11 和 13-14 已在此重構中針對共用代理程式、CLI、Plugin 功能和對外 adapter 合約實作。步驟 12 仍是較深入的內部清理階段，用於 provider-private `channelData` 傳輸 envelopes。步驟 15 仍是後續驗證項目，若我們想要取得超出型別／測試閘門之外的量化 import-fanout 數字。

## 測試

新增或更新：

- Presentation 正規化測試。
- 不支援區塊的 presentation 自動降級測試。
- Plugin dispatch 和 Core delivery 路徑的跨脈絡標記測試。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE 和文字備援的頻道轉譯矩陣測試。
- 證明原生欄位已移除的訊息工具 schema 測試。
- 證明原生旗標已移除的 CLI 測試。
- 涵蓋 Carbon 的 Discord entrypoint 匯入延遲載入迴歸測試。
- 涵蓋 Telegram 和通用備援的 delivery 釘選測試。

## 未決問題

- `delivery.pin` 應在第一輪為 Discord、Slack、MS Teams 和 Feishu 實作，還是先只實作 Telegram？
- `delivery` 最終是否應吸收既有欄位，例如 `replyToId`、`replyToCurrent`、`silent` 和 `audioAsVoice`，或應維持聚焦於傳送後行為？
- Presentation 是否應直接支援圖片或檔案參照，還是媒體目前應與 UI 版面保持分離？

## 相關

- [頻道總覽](/zh-TW/channels)
- [訊息呈現](/zh-TW/plugins/message-presentation)

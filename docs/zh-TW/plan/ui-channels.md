---
read_when:
    - 重構頻道訊息使用者介面、互動式承載資料或頻道原生轉譯器
    - 變更訊息工具功能、傳遞提示或跨情境標記
    - 偵錯 Discord Carbon 匯入展開或頻道外掛執行階段的延遲載入問題
summary: 將訊息的語意呈現與頻道原生使用者介面轉譯器解耦。
title: 頻道呈現重構計畫
x-i18n:
    generated_at: "2026-07-11T21:28:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## 狀態

已針對共用代理程式、命令列介面、外掛功能及向外傳遞介面完成實作：

- `ReplyPayload.presentation` 承載語意化訊息介面。
- `ReplyPayload.delivery.pin` 承載已傳送訊息的釘選要求。
- 共用訊息動作公開 `presentation`、`delivery` 與 `pin`，而非供應者原生的 `components`、`blocks`、`buttons` 或 `card`。
- 核心透過外掛宣告的向外傳遞功能，呈現介面或自動降級。
- Discord、Slack、Telegram、Mattermost、MS Teams 與 Feishu 的呈現器使用通用合約。
- Discord 頻道控制平面程式碼不再匯入由 Carbon 支援的介面容器。

標準文件現位於[訊息呈現](/zh-TW/plugins/message-presentation)。
請將本計畫保留為歷史實作背景；若合約、呈現器或後援行為有所變更，
請更新標準指南。

## 問題

頻道介面目前分散於數個不相容的介面：

- 核心透過 `buildCrossContextComponents` 擁有採用 Discord 形態的跨情境呈現器掛鉤。
- Discord 的 `channel.ts` 可透過 `DiscordUiContainer` 匯入原生 Carbon 介面，這會將執行階段介面相依性帶入頻道外掛的控制平面。
- 代理程式與命令列介面公開原生酬載的繞過機制，例如 Discord 的 `components`、Slack 的 `blocks`、Telegram 或 Mattermost 的 `buttons`，以及 Teams 或 Feishu 的 `card`。
- `ReplyPayload.channelData` 同時承載傳輸提示與原生介面信封。
- 通用 `interactive` 模型已存在，但其範圍小於 Discord、Slack、Teams、Feishu、LINE、Telegram 與 Mattermost 已使用的豐富版面配置。

這使核心需要知悉原生介面形態、削弱外掛執行階段的延遲載入能力，並讓代理程式能以過多供應者特定方式表達相同的訊息意圖。

## 目標

- 核心依據宣告的功能，決定訊息的最佳語意化呈現方式。
- 擴充套件宣告功能，並將語意化呈現轉換為原生傳輸酬載。
- 網頁控制介面與聊天原生介面保持分離。
- 不透過共用代理程式或命令列介面的訊息介面公開原生頻道酬載。
- 不支援的呈現功能自動降級為最佳文字表示。
- 釘選已傳送訊息等傳遞行為屬於通用傳遞中繼資料，而非呈現。

## 非目標

- 不為 `buildCrossContextComponents` 提供向後相容墊片。
- 不為 `components`、`blocks`、`buttons` 或 `card` 提供公開的原生繞過機制。
- 核心不匯入頻道原生介面函式庫。
- 不為隨附頻道提供供應者特定的 SDK 介面。

## 目標模型

在 `ReplyPayload` 新增由核心擁有的 `presentation` 欄位。

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

遷移期間，`interactive` 會成為 `presentation` 的子集：

- `interactive` 文字區塊對應至 `presentation.blocks[].type = "text"`。
- `interactive` 按鈕區塊對應至 `presentation.blocks[].type = "buttons"`。
- `interactive` 選取區塊對應至 `presentation.blocks[].type = "select"`。

外部代理程式與命令列介面結構描述現改用 `presentation`；`interactive` 仍作為現有回覆產生器所用的內部舊版剖析／呈現輔助工具。
面向公開產生端的 API 將 `interactive` 視為已棄用。執行階段
仍予以支援，讓現有核准輔助工具與舊版外掛可繼續運作，同時讓新程式碼輸出 `presentation`。

## 傳遞中繼資料

針對非介面的傳送行為，新增由核心擁有的 `delivery` 欄位。

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

- `delivery.pin = true` 表示釘選第一則成功傳遞的訊息。
- `notify` 預設為 `false`。
- `required` 預設為 `false`；若頻道不支援或釘選失敗，會繼續傳遞以自動降級。
- 手動 `pin`、`unpin` 與 `list-pins` 訊息動作仍可用於現有訊息。

目前的 Telegram ACP 主題繫結應從 `channelData.telegram.pin = true` 移至 `delivery.pin = true`。

## 執行階段功能合約

將呈現與傳遞的轉換掛鉤新增至執行階段向外傳遞配接器，而非控制平面的頻道外掛。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

核心行為：

- 解析目標頻道與執行階段配接器。
- 查詢呈現功能。
- 在呈現前將不支援的區塊降級，並套用通用功能限制。
- 呼叫 `renderPresentation`。
- 若不存在呈現器，則將呈現轉換為文字後援。
- 成功傳送後，若要求且支援 `delivery.pin`，則呼叫 `pinDeliveredMessage`。

## 頻道對應

Discord：

- 在僅供執行階段使用的模組中，將 `presentation` 呈現為第 2 版元件與 Carbon 容器。
- 將輔助強調色的函式保留於輕量模組中。
- 從頻道外掛控制平面程式碼移除 `DiscordUiContainer` 匯入。

Slack：

- 將 `presentation` 呈現為 Block Kit。
- 移除代理程式與命令列介面的 `blocks` 輸入。

Telegram：

- 將文字、情境與分隔線呈現為文字。
- 在已設定且目標介面允許時，將動作與選取項目呈現為行內鍵盤。
- 停用行內按鈕時使用文字後援。
- 將 ACP 主題釘選移至 `delivery.pin`。

Mattermost：

- 在已設定時，將動作呈現為互動式按鈕。
- 將其他區塊呈現為文字後援。

MS Teams：

- 將 `presentation` 呈現為 Adaptive Cards。
- 保留手動釘選／取消釘選／列出釘選動作。
- 若 Graph 對目標交談的支援可靠，可選擇實作 `pinDeliveredMessage`。

Feishu：

- 將 `presentation` 呈現為互動式卡片。
- 保留手動釘選／取消釘選／列出釘選動作。
- 若 API 行為可靠，可選擇實作 `pinDeliveredMessage` 以釘選已傳送訊息。

LINE：

- 可行時將 `presentation` 呈現為 Flex 或範本訊息。
- 不支援的區塊改用文字後援。
- 從 `channelData` 移除 LINE 介面酬載。

純文字或功能受限的頻道：

- 以保守格式將呈現轉換為文字。

## 重構步驟

1. 重新套用 Discord 發行修正：將 `ui-colors.ts` 與由 Carbon 支援的介面分離，並從 `extensions/discord/src/channel.ts` 移除 `DiscordUiContainer`。
2. 將 `presentation` 與 `delivery` 新增至 `ReplyPayload`、向外酬載正規化、傳遞摘要及掛鉤酬載。
3. 在範圍明確的 SDK／執行階段子路徑中新增 `MessagePresentation` 結構描述與剖析輔助工具。
4. 以語意化呈現功能取代訊息功能中的 `buttons`、`cards`、`components` 與 `blocks`。
5. 新增用於呈現轉換與傳遞釘選的執行階段向外配接器掛鉤。
6. 以 `buildCrossContextPresentation` 取代跨情境元件建構。
7. 刪除 `src/infra/outbound/channel-adapters.ts`，並從頻道外掛型別移除 `buildCrossContextComponents`。
8. 變更 `maybeApplyCrossContextMarker`，使其附加 `presentation` 而非原生參數。
9. 更新外掛分派傳送路徑，使其僅使用語意化呈現與傳遞中繼資料。
10. 移除代理程式與命令列介面的原生酬載參數：`components`、`blocks`、`buttons` 與 `card`。
11. 移除建立原生訊息工具結構描述的 SDK 輔助工具，並以呈現結構描述輔助工具取代。
12. 從 `channelData` 移除介面／原生信封；在逐一審查其餘欄位前，僅保留傳輸中繼資料。
13. 遷移 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu 與 LINE 呈現器。
14. 更新訊息命令列介面、頻道頁面、外掛 SDK 與功能指南的文件。
15. 對 Discord 與受影響的頻道進入點執行匯入扇出分析。

本次重構已針對共用代理程式、命令列介面、外掛功能與向外配接器合約完成步驟 1 至 11 及 13 至 14。步驟 12 仍需進一步清理供應者私有的 `channelData` 傳輸信封。若需要型別／測試閘門之外的量化匯入扇出數據，步驟 15 仍留待後續驗證。

## 測試

新增或更新：

- 呈現正規化測試。
- 不支援區塊的呈現自動降級測試。
- 外掛分派與核心傳遞路徑的跨情境標記測試。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE 與文字後援的頻道呈現矩陣測試。
- 證明原生欄位已移除的訊息工具結構描述測試。
- 證明原生旗標已移除的命令列介面測試。
- 涵蓋 Carbon 的 Discord 進入點匯入延遲載入迴歸測試。
- 涵蓋 Telegram 與通用後援的傳遞釘選測試。

## 待決問題

- 第一階段應為 Discord、Slack、MS Teams 與 Feishu 實作 `delivery.pin`，還是先僅實作 Telegram？
- `delivery` 最終是否應納入 `replyToId`、`replyToCurrent`、`silent` 與 `audioAsVoice` 等現有欄位，或維持專注於傳送後行為？
- 呈現是否應直接支援圖片或檔案參照，還是媒體目前應繼續與介面版面配置分離？

## 相關內容

- [頻道概覽](/zh-TW/channels)
- [訊息呈現](/zh-TW/plugins/message-presentation)

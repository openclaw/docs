---
read_when:
    - 重構頻道訊息 UI、互動式酬載或原生頻道轉譯器
    - 變更訊息工具能力、傳送提示或跨情境標記
    - 除錯 Discord Carbon 匯入扇出或頻道外掛執行階段延遲載入
summary: 將語意訊息呈現與頻道原生 UI 算繪器解耦。
title: 頻道呈現重構計畫
x-i18n:
    generated_at: "2026-06-27T19:30:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## 狀態

已針對共享代理、命令列介面、外掛能力與出站傳遞介面實作：

- `ReplyPayload.presentation` 承載語意化訊息 UI。
- `ReplyPayload.delivery.pin` 承載已傳送訊息的釘選要求。
- 共享訊息動作公開 `presentation`、`delivery` 與 `pin`，而不是提供者原生的 `components`、`blocks`、`buttons` 或 `card`。
- 核心會透過外掛宣告的出站能力轉譯或自動降級呈現內容。
- Discord、Slack、Telegram、Mattermost、MS Teams 與 Feishu 轉譯器會消耗通用合約。
- Discord 頻道控制平面程式碼不再匯入 Carbon 支援的 UI 容器。

標準文件現在位於[訊息呈現](/zh-TW/plugins/message-presentation)。
保留此計畫作為歷史實作脈絡；若合約、轉譯器或備援行為有變更，請更新標準指南。

## 問題

頻道 UI 目前分散在數個彼此不相容的介面上：

- 核心透過 `buildCrossContextComponents` 擁有 Discord 形狀的跨脈絡轉譯器掛鉤。
- Discord `channel.ts` 可透過 `DiscordUiContainer` 匯入原生 Carbon UI，這會把執行階段 UI 相依性拉進頻道外掛控制平面。
- 代理與命令列介面會公開原生酬載逃生口，例如 Discord `components`、Slack `blocks`、Telegram 或 Mattermost `buttons`，以及 Teams 或 Feishu `card`。
- `ReplyPayload.channelData` 同時承載傳輸提示與原生 UI 信封。
- 通用 `interactive` 模型已存在，但它比 Discord、Slack、Teams、Feishu、LINE、Telegram 與 Mattermost 已使用的更豐富版面還要狹窄。

這會讓核心感知原生 UI 形狀、削弱外掛執行階段延遲載入，並讓代理有太多提供者特定方式來表達同一個訊息意圖。

## 目標

- 核心根據宣告能力，為訊息決定最佳語意呈現。
- 外掛宣告能力，並將語意呈現轉譯為原生傳輸酬載。
- Web 控制 UI 與聊天原生 UI 維持分離。
- 原生頻道酬載不會透過共享代理或命令列介面訊息介面公開。
- 不支援的呈現功能會自動降級為最佳文字表示。
- 釘選已傳送訊息等傳遞行為是通用傳遞中繼資料，不是呈現。

## 非目標

- 不為 `buildCrossContextComponents` 提供向後相容墊片。
- 不為 `components`、`blocks`、`buttons` 或 `card` 提供公開原生逃生口。
- 核心不匯入頻道原生 UI 函式庫。
- 不為內建頻道提供提供者特定 SDK 介面。

## 目標模型

在 `ReplyPayload` 新增核心擁有的 `presentation` 欄位。

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
- `interactive` 選擇區塊對應到 `presentation.blocks[].type = "select"`。

外部代理與命令列介面 schema 現在使用 `presentation`；`interactive` 仍是現有回覆產生器的內部舊版解析／轉譯輔助工具。
公開的產生器端 API 將 `interactive` 視為已棄用。執行階段支援仍會保留，讓現有核准輔助工具與較舊外掛在新程式碼輸出 `presentation` 時仍能繼續運作。

## 傳遞中繼資料

新增核心擁有的 `delivery` 欄位，用於非 UI 的傳送行為。

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
- `required` 預設為 `false`；不支援的頻道或釘選失敗會自動降級為繼續傳遞。
- 手動 `pin`、`unpin` 與 `list-pins` 訊息動作會保留給現有訊息使用。

目前 Telegram ACP 主題綁定應從 `channelData.telegram.pin = true` 移至 `delivery.pin = true`。

## 執行階段能力合約

將呈現與傳遞轉譯掛鉤新增到執行階段出站配接器，而不是控制平面頻道外掛。

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
- 要求呈現能力。
- 在轉譯前降級不支援的區塊並套用通用能力限制。
- 呼叫 `renderPresentation`。
- 若沒有轉譯器，將呈現轉換為文字備援。
- 成功傳送後，若要求且支援 `delivery.pin`，呼叫 `pinDeliveredMessage`。

## 頻道對應

Discord：

- 在僅執行階段模組中，將 `presentation` 轉譯為 components v2 與 Carbon 容器。
- 將強調色輔助工具保留在輕量模組中。
- 從頻道外掛控制平面程式碼移除 `DiscordUiContainer` 匯入。

Slack：

- 將 `presentation` 轉譯為 Block Kit。
- 移除代理與命令列介面的 `blocks` 輸入。

Telegram：

- 將文字、脈絡與分隔線轉譯為文字。
- 在已設定且目標介面允許時，將動作與選擇轉譯為行內鍵盤。
- 停用行內按鈕時使用文字備援。
- 將 ACP 主題釘選移至 `delivery.pin`。

Mattermost：

- 在已設定時，將動作轉譯為互動式按鈕。
- 將其他區塊轉譯為文字備援。

MS Teams：

- 將 `presentation` 轉譯為 Adaptive Cards。
- 保留手動釘選／取消釘選／列出釘選動作。
- 若 Graph 對目標對話的支援可靠，可選擇實作 `pinDeliveredMessage`。

Feishu：

- 將 `presentation` 轉譯為互動式卡片。
- 保留手動釘選／取消釘選／列出釘選動作。
- 若 API 行為可靠，可選擇實作 `pinDeliveredMessage` 以釘選已傳送訊息。

LINE：

- 盡可能將 `presentation` 轉譯為 Flex 或範本訊息。
- 對不支援的區塊退回文字。
- 從 `channelData` 移除 LINE UI 酬載。

純文字或受限頻道：

- 使用保守格式將呈現轉換為文字。

## 重構步驟

1. 重新套用 Discord 發行修正，將 `ui-colors.ts` 從 Carbon 支援的 UI 拆出，並從 `extensions/discord/src/channel.ts` 移除 `DiscordUiContainer`。
2. 將 `presentation` 與 `delivery` 新增到 `ReplyPayload`、出站酬載正規化、傳遞摘要與掛鉤酬載。
3. 在狹窄的 SDK／執行階段子路徑中新增 `MessagePresentation` schema 與解析器輔助工具。
4. 以語意呈現能力取代訊息能力 `buttons`、`cards`、`components` 與 `blocks`。
5. 新增呈現轉譯與傳遞釘選的執行階段出站配接器掛鉤。
6. 以 `buildCrossContextPresentation` 取代跨脈絡元件建構。
7. 刪除 `src/infra/outbound/channel-adapters.ts`，並從頻道外掛型別移除 `buildCrossContextComponents`。
8. 將 `maybeApplyCrossContextMarker` 改為附加 `presentation`，而不是原生參數。
9. 更新外掛分派傳送路徑，使其只消耗語意呈現與傳遞中繼資料。
10. 移除代理與命令列介面的原生酬載參數：`components`、`blocks`、`buttons` 與 `card`。
11. 移除建立原生訊息工具 schema 的 SDK 輔助工具，改以呈現 schema 輔助工具取代。
12. 從 `channelData` 移除 UI／原生信封；在逐一審查剩餘欄位前，只保留傳輸中繼資料。
13. 遷移 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu 與 LINE 轉譯器。
14. 更新訊息命令列介面、頻道頁面、外掛 SDK 與能力指南的文件。
15. 針對 Discord 與受影響的頻道進入點執行匯入扇出分析。

此重構已針對共享代理、命令列介面、外掛能力與出站配接器合約實作步驟 1-11 與 13-14。步驟 12 仍是針對提供者私有 `channelData` 傳輸信封的更深入內部清理。若我們想取得超出型別／測試閘門的量化匯入扇出數字，步驟 15 仍是後續驗證。

## 測試

新增或更新：

- 呈現正規化測試。
- 不支援區塊的呈現自動降級測試。
- 外掛分派與核心傳遞路徑的跨脈絡標記測試。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE 與文字備援的頻道轉譯矩陣測試。
- 證明原生欄位已移除的訊息工具 schema 測試。
- 證明原生旗標已移除的命令列介面測試。
- 涵蓋 Carbon 的 Discord 進入點匯入延遲載入迴歸測試。
- 涵蓋 Telegram 與通用備援的傳遞釘選測試。

## 開放問題

- `delivery.pin` 第一階段應該為 Discord、Slack、MS Teams 與 Feishu 實作，還是先只實作 Telegram？
- `delivery` 最終是否應吸收 `replyToId`、`replyToCurrent`、`silent` 與 `audioAsVoice` 等現有欄位，或維持聚焦於傳送後行為？
- 呈現是否應直接支援圖片或檔案參照，還是目前先讓媒體與 UI 版面維持分離？

## 相關

- [頻道概覽](/zh-TW/channels)
- [訊息呈現](/zh-TW/plugins/message-presentation)

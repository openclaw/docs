---
read_when:
    - 你正在建置或重構訊息通道外掛的接收路徑
    - 你需要共用的傳入內容脈絡建構、工作階段記錄，或預先準備的回覆分派
    - 你正在將舊版頻道回合輔助函式遷移至入站／訊息 API
summary: 頻道外掛的傳入事件輔助工具：內容建構、共用執行器協調、工作階段記錄及備妥的回覆分派
title: 頻道輸入 API
x-i18n:
    generated_at: "2026-07-20T00:55:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f702019b0ee35055edd6fdbccc190eee66f35419d918c50076a005072d3f8ec
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

頻道接收路徑遵循單一流程：

```text
平台事件 -> 入站事實／情境 -> 代理程式回覆 -> 訊息傳遞
```

使用 `openclaw/plugin-sdk/channel-inbound` 處理入站事件正規化、
格式化、根目錄及協調流程。使用
`openclaw/plugin-sdk/channel-outbound` 處理原生傳送、收件確認、持久化
傳遞及即時預覽行為。

## 核心輔助函式

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`：將正規化的頻道事實
  投射至提示詞／工作階段情境。透過 `channelContext` 傳遞頻道擁有的傳送者／聊天中繼資料，
  外掛掛鉤會將其視為 `ctx.channelContext`。
  從此子路徑擴充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`
  以加入頻道專屬欄位。
- `runChannelInboundEvent(...)`：針對單一入站平台事件執行擷取、分類、預檢、解析、
  記錄、分派及完成處理。
- `dispatchChannelInboundReply(...)`：使用傳遞轉接器記錄並分派已
  組裝完成的入站回覆。

對於僅含媒體的入站事件，請將訊息本文和命令文字保留為空，並為每個
原生附件傳入一項 `ChannelInboundMediaInput` 事實。當環境
歷史記錄行或其他純文字載體必須描述這些事實時，請使用
`formatMediaPlaceholderText(media)`。它會依序根據 `kind`、MIME
類型，再依路徑或 URL 副檔名分類每項事實；尚未下載的原生附件仍應
各自提供一項僅含類型的事實。請勿使用格式化工具合成
主要入站本文。

已接收注入之外掛執行階段物件的內建／原生頻道，
可以改為呼叫 `runtime.channel.inbound.*` 下的相同輔助函式，而不必
直接匯入此子路徑：

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

為將平台傳遞保留在傳遞轉接器中的相容性
分派器組裝 `dispatchChannelInboundReply(...)` 輸入。新的傳送
路徑應改用 `channel-outbound` 中的訊息轉接器和持久化訊息輔助函式。

## 遷移

`runtime.channel.turn.*` 執行階段別名已移除。請使用：

- `runtime.channel.inbound.run(...)`：用於原始入站事件。
- `runtime.channel.inbound.dispatchReply(...)`：用於已組裝的回覆情境。
- `runtime.channel.inbound.buildContext(...)`：用於入站情境酬載。
- `runtime.channel.inbound.runPreparedReply(...)`：已棄用，僅用於
  已自行組裝其分派閉包、由頻道擁有且已準備完成的分派路徑。

新的外掛程式碼不應引入以 `turn` 命名的頻道 API。模型或
代理程式回合詞彙應保留在代理程式／供應商程式碼內；頻道外掛應使用入站、
訊息、傳遞及回覆等詞彙。

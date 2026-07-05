---
read_when:
    - 您正在建置或重構訊息通道外掛的接收路徑
    - 你需要共享的傳入情境建構、工作階段記錄，或已準備好的回覆派送
    - 你正在將舊的頻道回合輔助工具遷移至入站/訊息 API
summary: 通道外掛的傳入事件輔助工具：內容脈絡建立、共用執行器協調、工作階段記錄，以及已準備回覆派送
title: 通道入站 API
x-i18n:
    generated_at: "2026-07-05T11:32:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

頻道接收路徑遵循同一個流程：

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

使用 `openclaw/plugin-sdk/channel-inbound` 進行傳入事件正規化、
格式化、根目錄與協調。使用
`openclaw/plugin-sdk/channel-outbound` 處理原生傳送、收據、持久
遞送，以及即時預覽行為。

## 核心輔助工具

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`：將正規化的頻道事實
  投射到提示詞/工作階段內容脈絡中。透過 `channelContext` 傳遞頻道擁有的寄件者/聊天中繼資料，
  外掛鉤子會將其視為 `ctx.channelContext`。
  從這個子路徑擴充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`
  以加入頻道專屬欄位。
- `runChannelInboundEvent(...)`：針對單一傳入平台事件執行擷取、分類、預檢、解析、
  記錄、派送與完成處理。
- `dispatchChannelInboundReply(...)`：使用遞送配接器記錄並派送已經
  組裝好的傳入回覆。

已接收注入外掛執行階段物件的內建/原生頻道，
可以改用 `runtime.channel.inbound.*` 底下的相同輔助工具，
而不是直接匯入此子路徑：

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

為了相容性派送器組裝 `dispatchChannelInboundReply(...)` 輸入，
這類派送器會將平台遞送保留在遞送配接器中。新的傳送路徑
應改用來自 `channel-outbound` 的訊息配接器與持久訊息輔助工具。

## 遷移

`runtime.channel.turn.*` 執行階段別名已移除。請使用：

- `runtime.channel.inbound.run(...)` 用於原始傳入事件。
- `runtime.channel.inbound.dispatchReply(...)` 用於已組裝的回覆內容脈絡。
- `runtime.channel.inbound.buildContext(...)` 用於傳入內容脈絡承載資料。
- `runtime.channel.inbound.runPreparedReply(...)` 已棄用，僅供
  頻道擁有且已自行組裝派送閉包的預備派送路徑使用。

新的外掛程式碼不應引入以 `turn` 命名的頻道 API。將模型或
代理回合詞彙保留在代理/提供者程式碼中；頻道外掛使用傳入、
訊息、遞送與回覆等術語。

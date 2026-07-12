---
read_when:
    - 你正在建置或重構訊息通道外掛的接收路徑
    - 你需要共用的傳入內容脈絡建構、工作階段記錄或預先準備的回覆分派
    - 你正在將舊版頻道回合輔助函式遷移至入站／訊息 API
summary: 頻道外掛的傳入事件輔助工具：情境建構、共用執行器協調、工作階段記錄，以及預備回覆分派
title: 頻道輸入 API
x-i18n:
    generated_at: "2026-07-11T21:38:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

頻道接收路徑遵循單一流程：

```text
平台事件 -> 入站事實/上下文 -> 代理程式回覆 -> 訊息傳遞
```

使用 `openclaw/plugin-sdk/channel-inbound` 進行入站事件正規化、格式化、根目錄處理與協調。使用 `openclaw/plugin-sdk/channel-outbound` 處理原生傳送、回執、持久傳遞與即時預覽行為。

## 核心輔助函式

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`：將正規化後的頻道事實投影至提示詞/工作階段上下文。透過 `channelContext` 傳遞由頻道擁有的傳送者/聊天中繼資料，外掛掛鉤會以 `ctx.channelContext` 取得這些資料。若需加入頻道專屬欄位，請從此子路徑擴充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`。
- `runChannelInboundEvent(...)`：針對單一入站平台事件執行擷取、分類、預檢、解析、記錄、分派及完成處理。
- `dispatchChannelInboundReply(...)`：使用傳遞配接器記錄並分派已組裝完成的入站回覆。

已接收注入之外掛執行階段物件的內建/原生頻道，可以改為呼叫 `runtime.channel.inbound.*` 下的相同輔助函式，而不必直接匯入此子路徑：

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

對於將平台傳遞保留在傳遞配接器中的相容性分派器，請組裝 `dispatchChannelInboundReply(...)` 的輸入。新的傳送路徑則應改用 `channel-outbound` 中的訊息配接器與持久訊息輔助函式。

## 遷移

`runtime.channel.turn.*` 執行階段別名已移除。請改用：

- `runtime.channel.inbound.run(...)` 處理原始入站事件。
- `runtime.channel.inbound.dispatchReply(...)` 處理已組裝的回覆上下文。
- `runtime.channel.inbound.buildContext(...)` 處理入站上下文承載資料。
- `runtime.channel.inbound.runPreparedReply(...)` 已棄用，僅供已自行組裝分派閉包、由頻道擁有的預先準備分派路徑使用。

新的外掛程式碼不應引入以 `turn` 命名的頻道 API。模型或代理程式的輪次詞彙應保留於代理程式/提供者程式碼內；頻道外掛則使用入站、訊息、傳遞與回覆等術語。

---
read_when:
    - 你正在建置或重構訊息通道外掛的接收路徑
    - 你需要共用的入站情境建構、工作階段記錄，或已準備的回覆派送
    - 你正在將舊的頻道回合輔助函式遷移到 inbound/message API
summary: 通道外掛的傳入事件輔助工具：內容脈絡建構、共用執行器協調、工作階段記錄，以及預備回覆派送
title: 通道入站 API
x-i18n:
    generated_at: "2026-06-27T19:47:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

通道外掛應使用 inbound 與 message 名詞來建模接收路徑：

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

使用 `openclaw/plugin-sdk/channel-inbound` 進行 inbound 事件正規化、格式化、根目錄與協調。使用
`openclaw/plugin-sdk/channel-outbound` 進行原生傳送、收據、持久傳遞與即時預覽行為。

## 核心輔助工具

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`：將正規化的通道事實投射到提示詞/工作階段脈絡中。使用 `channelContext` 將通道擁有的傳送者/聊天中繼資料傳遞到外掛 hook `ctx.channelContext`；從此子路徑擴充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`，以加入通道專屬欄位。
- `runChannelInboundEvent(...)`：針對一個 inbound 平台事件執行擷取、分類、預檢、解析、記錄、分派與收尾。
- `dispatchChannelInboundReply(...)`：使用傳遞配接器記錄並分派已組裝好的 inbound 回覆。

注入的外掛執行階段會在 `runtime.channel.inbound.*` 下公開相同的高階輔助工具，供已接收執行階段物件的內建/原生通道使用。

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

相容性分派器應組裝 `dispatchChannelInboundReply(...)` 輸入，並將平台傳遞保留在傳遞配接器中。新的傳送路徑應優先使用 message 配接器與持久 message 輔助工具。

## 遷移

舊的 `runtime.channel.turn.*` 執行階段別名已移除。請使用：

- `runtime.channel.inbound.run(...)` 用於原始 inbound 事件。
- `runtime.channel.inbound.dispatchReply(...)` 用於已組裝的回覆脈絡。
- `runtime.channel.inbound.buildContext(...)` 用於 inbound 脈絡承載資料。
- `runtime.channel.inbound.runPreparedReply(...)` 僅用於通道擁有、且已組裝自身分派閉包的預備分派路徑。

新的外掛程式碼不應引入以 `turn` 命名的通道 API。將模型或 agent turn 詞彙保留在 agent/provider 程式碼中；通道外掛使用 inbound、message、delivery 與 reply 這些術語。

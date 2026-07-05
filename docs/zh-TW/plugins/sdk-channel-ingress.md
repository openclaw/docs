---
read_when:
    - 建置或遷移訊息通道外掛
    - 變更 DM 或群組允許清單、路由閘門、命令驗證、事件驗證或提及啟用
    - 審查通道入口遮蔽或 SDK 相容性邊界
sidebarTitle: Channel Ingress
summary: 用於傳入訊息授權的實驗性頻道入口 API
title: 通道入口 API
x-i18n:
    generated_at: "2026-07-05T11:37:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

頻道入口是入站頻道事件的實驗性存取控制邊界。外掛擁有平台事實與副作用；核心擁有通用政策：DM/群組允許清單、配對儲存 DM 項目、路由閘門、命令閘門、事件驗證、提及啟用、已遮蔽診斷，以及准入。

新的接收路徑請使用 `openclaw/plugin-sdk/channel-ingress-runtime`。較舊的 `openclaw/plugin-sdk/channel-ingress` 子路徑會繼續匯出，作為第三方外掛的已棄用相容性 facade。

## 執行階段解析器

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

不要預先計算有效允許清單、命令擁有者或命令群組。解析器會從原始允許清單、儲存回呼、路由描述元、存取群組、政策，以及對話種類推導出它們。

## 結果

內建外掛應直接使用現代投影：

| 欄位 | 意義 |
| ------------------ | ------------------------------------------------------------------ |
| `ingress` | 有序閘門決策與准入 |
| `senderAccess` | 僅寄件者/對話授權 |
| `routeAccess` | 路由與路由寄件者投影 |
| `commandAccess` | 命令授權；未執行命令閘門時為 `requested: false` |
| `activationAccess` | 提及/啟用結果 |

事件授權仍可在有序的 `ingress.graph` 與決定性的 `ingress.reasonCode` 上取得；不會發出獨立的事件投影。

已棄用的第三方 SDK 輔助工具可以在內部重建較舊的形狀。新的內建接收路徑不應把現代結果轉譯回本機 DTO。

## 存取群組

`accessGroup:<name>` 項目會保持遮蔽。核心會自行解析靜態 `message.senders` 群組，且只會對需要平台查詢的動態群組呼叫 `resolveAccessGroupMembership`。缺失、不支援與失敗的群組會失敗關閉。

## 事件模式

| `authMode` | 意義 |
| ---------------- | ------------------------------------------------ |
| `inbound` | 一般入站寄件者閘門 |
| `command` | 回呼或範圍化按鈕的命令閘門 |
| `origin-subject` | 動作者必須符合原始訊息主體 |
| `route-only` | 僅對路由範圍化受信任事件套用路由閘門 |
| `none` | 外掛擁有的內部事件會略過共用驗證 |

對反應、按鈕、回呼與原生命令使用 `mayPair: false`。

## 路由與啟用

對房間、主題、公會、討論串或巢狀路由政策使用路由描述元：

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

當外掛有多個選用路由描述元時，請使用 `channelIngressRoutes(...)`；它會篩掉停用的分支，同時保持路由事實通用，並依每個描述元的 `precedence` 排序。

提及閘控是一個啟用閘門。提及未命中會回傳 `admission: "skip"`，因此回合核心不會處理僅觀察的回合。大多數頻道應將啟用放在寄件者與命令閘門之後。必須在寄件者允許清單雜訊之前靜默未提及流量的公開聊天介面，可以在停用文字命令繞過時選擇使用 `activation.order: "before-sender"`。具有隱式啟用的頻道，例如機器人討論串中的回覆，可以傳入 `activation.allowedImplicitMentionKinds`；投影的 `activationAccess.shouldBypassMention` 接著會回報命令或隱式啟用何時繞過了明確提及。

## 遮蔽

原始寄件者值與原始允許清單項目僅是解析器輸入。它們不得出現在已解析狀態、決策、診斷、快照或相容性事實中。請使用不透明的主體 ID、項目 ID、路由 ID 與診斷 ID。

## 驗證

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

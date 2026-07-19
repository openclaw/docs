---
read_when:
    - 建置或遷移訊息通道外掛
    - 變更私訊或群組允許清單、路由閘門、命令授權、事件授權或提及啟用機制
    - 審查頻道輸入遮蔽或 SDK 相容性邊界
sidebarTitle: Channel Ingress
summary: 用於傳入訊息授權的實驗性頻道入口 API
title: 頻道輸入 API
x-i18n:
    generated_at: "2026-07-19T13:59:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60feecb7bcf203cf37d2543a7855e89b5bfb2eb9d8263d804219e140facb8fc6
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

頻道輸入是針對傳入頻道事件的實驗性存取控制邊界。外掛擁有平台事實與副作用；核心擁有通用政策：私訊／群組允許清單、配對儲存區的私訊項目、路由閘門、命令閘門、事件授權、提及啟用、經遮蔽的診斷，以及准入。

接收路徑請使用 `openclaw/plugin-sdk/channel-ingress-runtime`。

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

請勿預先計算有效允許清單、命令擁有者或命令群組。解析器會從原始允許清單、儲存區回呼、路由描述元、存取群組、政策及對話種類推導這些項目。

## 結果

內建外掛應直接使用現代投影：

| 欄位              | 意義                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 依序排列的閘門決策與准入                                |
| `senderAccess`     | 僅限傳送者／對話授權                             |
| `routeAccess`      | 路由與路由傳送者投影                                  |
| `commandAccess`    | 命令授權；未執行命令閘門時為 `requested: false` |
| `activationAccess` | 提及／啟用結果                                          |

事件授權仍可透過依序排列的 `ingress.graph` 與具決定性的 `ingress.reasonCode` 取得；不會產生獨立的事件投影。

已棄用的第三方 SDK 輔助函式可在內部重建較舊的形狀。新的內建接收路徑不應將現代結果轉換回本機 DTO。

## 存取群組

`accessGroup:<name>` 項目會保持遮蔽。核心會自行解析靜態 `message.senders` 群組，且僅針對需要平台查詢的動態群組呼叫 `resolveAccessGroupMembership`。缺少、不支援或解析失敗的群組一律採取拒絕存取。

## 事件模式

| `authMode`       | 意義                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | 一般傳入傳送者閘門                      |
| `command`        | 回呼或限定範圍按鈕的命令閘門    |
| `origin-subject` | 動作者必須符合原始訊息主體    |
| `route-only`     | 僅針對限定路由範圍的受信任事件執行路由閘門 |
| `none`           | 外掛擁有的內部事件略過共用授權  |

回應、按鈕、回呼及原生命令請使用 `mayPair: false`。

## 路由與啟用

請對聊天室、主題、伺服器、討論串或巢狀路由政策使用路由描述元：

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

當外掛具有數個選用路由描述元時，請使用 `channelIngressRoutes(...)`；它會篩除已停用的分支，同時保持路由事實的通用性，並依每個描述元的 `precedence` 排序。

提及閘門是一種啟用閘門。未符合提及條件時會傳回 `admission: "skip"`，因此輪次核心不會處理僅供觀察的輪次。大多數頻道應將啟用閘門置於傳送者與命令閘門之後。若公開聊天介面必須在產生傳送者允許清單雜訊前，先靜默處理未提及的流量，則可在停用文字命令略過功能時選用 `activation.order: "before-sender"`。對於具有隱含啟用機制的頻道（例如機器人討論串中的回覆），請使用 `resolveChannelImplicitMentions(...)` 解析 `channels.defaults.implicitMentions` 以及頻道與帳戶覆寫，然後將結果以 `activation.implicitMentions` 傳入。投影的 `activationAccess.shouldBypassMention` 會回報命令或隱含啟用何時略過了明確提及。

## 遮蔽

原始傳送者值與原始允許清單項目僅能作為解析器輸入。它們不得出現在已解析狀態、決策、診斷、快照或相容性事實中。請使用不透明的主體 ID、項目 ID、路由 ID 及診斷 ID。

## 驗證

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

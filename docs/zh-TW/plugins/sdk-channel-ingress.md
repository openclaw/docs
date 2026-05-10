---
read_when:
    - 建置或遷移訊息通道 Plugin
    - 變更 DM 或群組允許清單、路由閘門、命令授權、事件授權或提及啟用
    - 審查通道入口遮蔽或 SDK 相容性邊界
sidebarTitle: Channel Ingress
summary: 用於傳入訊息授權的實驗性通道入口 API
title: 通道入口 API
x-i18n:
    generated_at: "2026-05-10T19:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# Channel 入口 API

Channel 入口是用於傳入 Channel 事件的實驗性存取控制邊界。接收路徑請使用 `openclaw/plugin-sdk/channel-ingress-runtime`。較舊的 `openclaw/plugin-sdk/channel-ingress` 子路徑仍會匯出，作為第三方 Plugin 的已棄用相容性 facade。

Plugin 擁有平台事實與副作用。核心擁有通用政策：DM/群組 allowlist、配對儲存的 DM 項目、路由閘門、命令閘門、事件驗證、提及啟用、已遮罩診斷，以及准入。

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

不要預先計算有效 allowlist、命令擁有者或命令群組。解析器會從原始 allowlist、儲存回呼、路由描述元、存取群組、政策，以及對話種類推導出這些內容。

## 結果

內建 Plugin 應直接取用現代投影：

- `ingress`：有序閘門決策與准入
- `senderAccess`：僅寄件者/對話授權
- `routeAccess`：路由與路由寄件者投影
- `commandAccess`：命令授權；未執行命令閘門時為 false
- `activationAccess`：提及/啟用結果

事件授權仍可在有序的 `ingress.graph` 與決定性的 `ingress.reasonCode` 上取得；不會發出獨立的事件投影。

已棄用的第三方 SDK helper 可以在內部重建較舊的形狀。新的內建接收路徑不應將現代結果轉譯回本機 DTO。

## 存取群組

`accessGroup:<name>` 項目會保持遮罩。核心會自行解析靜態 `message.senders` 群組，且只會針對需要平台查詢的動態群組呼叫 `resolveAccessGroupMembership`。遺失、不支援與失敗的群組都會 fail closed。

## 事件模式

| `authMode`       | 意義                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | 一般傳入寄件者閘門                              |
| `command`        | 回呼或 scoped 按鈕的命令閘門                    |
| `origin-subject` | 行為者必須符合原始訊息 subject                  |
| `route-only`     | 僅用於路由 scoped 受信任事件的路由閘門          |
| `none`           | Plugin 擁有的內部事件會繞過共享驗證             |

對 reaction、按鈕、callback 與原生命令使用 `mayPair: false`。

## 路由與啟用

針對房間、主題、guild、thread 或巢狀路由政策使用路由描述元：

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

當 Plugin 有多個選用路由描述元時，請使用 `channelIngressRoutes(...)`；它會篩除已停用的分支，同時保持路由事實通用，並依每個描述元的 `precedence` 排序。

提及閘控是一種啟用閘門。提及未命中會回傳 `admission: "skip"`，因此 turn kernel 不會處理僅 observe 的 turn。大多數 Channel 應將啟用放在寄件者與命令閘門之後。必須在寄件者 allowlist 噪音之前讓未提及流量保持安靜的公開聊天介面，可以在停用文字命令 bypass 時選擇使用 `activation.order: "before-sender"`。具有隱含啟用的 Channel，例如 bot thread 中的回覆，可以傳入 `activation.allowedImplicitMentionKinds`；投影出的 `activationAccess.shouldBypassMention` 接著會回報命令或隱含啟用何時繞過了明確提及。

## 遮罩

原始寄件者值與原始 allowlist 項目只能作為解析器輸入。它們不得出現在已解析狀態、決策、診斷、快照或相容性事實中。請使用不透明的 subject id、項目 id、路由 id 與診斷 id。

## 驗證

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

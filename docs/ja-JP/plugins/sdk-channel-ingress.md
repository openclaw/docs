---
read_when:
    - メッセージングチャネルPluginの構築または移行
    - DM またはグループの許可リスト、ルートゲート、コマンド認証、イベント認証、メンションによる有効化の変更
    - チャネル受信時の秘匿化または SDK 互換性境界のレビュー
sidebarTitle: Channel Ingress
summary: 受信メッセージ認可用の実験的なチャネル受信 API
title: チャネル受信 API
x-i18n:
    generated_at: "2026-07-11T22:31:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

チャンネル ingress は、受信チャンネルイベントに対する実験的なアクセス制御境界です。Plugin はプラットフォーム固有の情報と副作用を所有し、コアは汎用ポリシー、すなわち DM/グループの許可リスト、ペアリングストアの DM エントリ、ルートゲート、コマンドゲート、イベント認可、メンションによるアクティベーション、秘匿化された診断、および受け入れを所有します。

新しい受信パスには `openclaw/plugin-sdk/channel-ingress-runtime` を使用してください。以前の `openclaw/plugin-sdk/channel-ingress` サブパスは、サードパーティ Plugin 向けの非推奨の互換ファサードとして引き続きエクスポートされます。

## ランタイムリゾルバー

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

有効な許可リスト、コマンド所有者、またはコマンドグループを事前計算しないでください。リゾルバーが、生の許可リスト、ストアコールバック、ルート記述子、アクセスグループ、ポリシー、および会話種別からそれらを導出します。

## 結果

同梱 Plugin は、最新のプロジェクションを直接使用する必要があります。

| フィールド         | 意味                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 順序付けられたゲート判定と受け入れ                                 |
| `senderAccess`     | 送信者/会話の認可のみ                                               |
| `routeAccess`      | ルートおよびルート送信者のプロジェクション                         |
| `commandAccess`    | コマンド認可。コマンドゲートが実行されなかった場合は `requested: false` |
| `activationAccess` | メンション/アクティベーションの結果                                |

イベント認可は、順序付けられた `ingress.graph` と決定理由を示す `ingress.reasonCode` で引き続き利用できます。独立したイベントプロジェクションは出力されません。

非推奨のサードパーティ SDK ヘルパーは、内部で以前の形式を再構築する場合があります。新しい同梱受信パスでは、最新の結果をローカル DTO に変換し直さないでください。

## アクセスグループ

`accessGroup:<name>` エントリは秘匿化されたままです。コアは静的な `message.senders` グループを自身で解決し、プラットフォームへの問い合わせが必要な動的グループに対してのみ `resolveAccessGroupMembership` を呼び出します。存在しないグループ、サポートされていないグループ、および解決に失敗したグループは、閉鎖側に失敗します。

## イベントモード

| `authMode`       | 意味                                                   |
| ---------------- | ------------------------------------------------------ |
| `inbound`        | 通常の受信送信者ゲート                                 |
| `command`        | コールバックまたはスコープ付きボタンのコマンドゲート |
| `origin-subject` | アクターは元のメッセージ主体と一致する必要がある       |
| `route-only`     | ルートスコープの信頼済みイベントに対するルートゲートのみ |
| `none`           | Plugin 所有の内部イベントは共有認証を迂回する          |

リアクション、ボタン、コールバック、およびネイティブコマンドには `mayPair: false` を使用してください。

## ルートとアクティベーション

ルーム、トピック、ギルド、スレッド、またはネストされたルートポリシーには、ルート記述子を使用してください。

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

Plugin に複数の任意指定ルート記述子がある場合は、`channelIngressRoutes(...)` を使用してください。これにより、ルート情報を汎用のまま保ちながら、無効な分岐を除外し、各記述子の `precedence` に従って順序付けます。

メンションゲートはアクティベーションゲートです。メンションが一致しない場合は `admission: "skip"` が返されるため、ターンカーネルは監視専用ターンを処理しません。ほとんどのチャンネルでは、アクティベーションを送信者ゲートとコマンドゲートの後に配置する必要があります。送信者許可リストによるノイズより先に、メンションのないトラフィックを抑制する必要がある公開チャットサーフェスでは、テキストコマンドの迂回が無効な場合に `activation.order: "before-sender"` を選択できます。ボットスレッド内の返信など、暗黙的なアクティベーションを持つチャンネルでは、`activation.allowedImplicitMentionKinds` を渡せます。その場合、プロジェクションされた `activationAccess.shouldBypassMention` は、コマンドまたは暗黙的なアクティベーションによって明示的なメンションが迂回されたときにそれを示します。

## 秘匿化

生の送信者値と生の許可リストエントリは、リゾルバーへの入力にのみ使用できます。解決済みの状態、判定、診断、スナップショット、または互換性情報に含めてはなりません。不透明な主体 ID、エントリ ID、ルート ID、および診断 ID を使用してください。

## 検証

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

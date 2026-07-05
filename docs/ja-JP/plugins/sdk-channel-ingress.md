---
read_when:
    - メッセージングチャネル Plugin の構築または移行
    - DM またはグループの許可リスト、ルートゲート、コマンド認可、イベント認可、またはメンションによる有効化の変更
    - チャネルの受信リダクションまたは SDK 互換性境界のレビュー
sidebarTitle: Channel Ingress
summary: 受信メッセージ認可のための実験的なチャネル入力 API
title: チャネル受信 API
x-i18n:
    generated_at: "2026-07-05T11:40:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

チャネル ingress は、受信チャネルイベントのための実験的なアクセス制御境界です。Plugin はプラットフォーム上の事実と副作用を所有し、コアは汎用ポリシーを所有します。DM/グループの許可リスト、ペアリングストアの DM エントリ、ルートゲート、コマンドゲート、イベント認証、メンションによるアクティベーション、秘匿化された診断、受け入れです。

新しい受信パスには `openclaw/plugin-sdk/channel-ingress-runtime` を使用してください。古い `openclaw/plugin-sdk/channel-ingress` サブパスは、サードパーティ Plugin 向けの非推奨互換ファサードとして引き続きエクスポートされます。

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

有効な許可リスト、コマンド所有者、コマンドグループを事前計算しないでください。リゾルバーは、生の許可リスト、ストアコールバック、ルート記述子、アクセスグループ、ポリシー、会話種別からそれらを導出します。

## 結果

バンドルPluginは、モダンな投影を直接消費する必要があります。

| フィールド         | 意味                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 順序付けされたゲート判定と受け入れ                                 |
| `senderAccess`     | 送信者/会話の認可のみ                                              |
| `routeAccess`      | ルートおよびルート送信者の投影                                     |
| `commandAccess`    | コマンド認可。コマンドゲートが実行されなかった場合は `requested: false` |
| `activationAccess` | メンション/アクティベーションの結果                               |

イベント認可は、順序付けされた `ingress.graph` と決定的な `ingress.reasonCode` で引き続き利用できます。個別のイベント投影は出力されません。

非推奨のサードパーティ SDK ヘルパーは、古い形状を内部で再構築する場合があります。新しいバンドル受信パスでは、モダンな結果をローカル DTO に戻して変換しないでください。

## アクセスグループ

`accessGroup:<name>` エントリは秘匿化されたままです。コアは静的な `message.senders` グループを自分で解決し、プラットフォーム検索を必要とする動的グループに対してのみ `resolveAccessGroupMembership` を呼び出します。欠落、未サポート、失敗したグループは fail closed になります。

## イベントモード

| `authMode`       | 意味                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | 通常の受信送信者ゲート                           |
| `command`        | コールバックまたはスコープ付きボタンのコマンドゲート |
| `origin-subject` | アクターは元のメッセージ subject と一致する必要がある |
| `route-only`     | ルートスコープの信頼済みイベント専用のルートゲート |
| `none`           | Plugin 所有の内部イベントは共有認証をバイパスする |

リアクション、ボタン、コールバック、ネイティブコマンドには `mayPair: false` を使用してください。

## ルートとアクティベーション

ルーム、トピック、ギルド、スレッド、またはネストされたルートポリシーにはルート記述子を使用してください。

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

Plugin に複数の任意ルート記述子がある場合は、`channelIngressRoutes(...)` を使用してください。これは無効な分岐をフィルターしつつ、ルート上の事実を汎用的に保ち、各記述子の `precedence` で順序付けます。

メンションゲートはアクティベーションゲートです。メンションが一致しない場合は `admission: "skip"` を返すため、ターンカーネルは観測専用ターンを処理しません。ほとんどのチャネルでは、アクティベーションを送信者ゲートとコマンドゲートの後に置くべきです。送信者許可リストのノイズより前に、メンションされていないトラフィックを静かにしたい公開チャット面では、テキストコマンドのバイパスが無効な場合に `activation.order: "before-sender"` を選択できます。ボットスレッド内の返信など、暗黙的なアクティベーションを持つチャネルは `activation.allowedImplicitMentionKinds` を渡せます。その場合、投影された `activationAccess.shouldBypassMention` は、コマンドまたは暗黙的なアクティベーションが明示的なメンションをバイパスしたタイミングを報告します。

## 秘匿化

生の送信者値と生の許可リストエントリは、リゾルバー入力専用です。それらは解決済み状態、判定、診断、スナップショット、互換性ファクトに出現してはなりません。不透明な subject ID、エントリ ID、ルート ID、診断 ID を使用してください。

## 検証

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

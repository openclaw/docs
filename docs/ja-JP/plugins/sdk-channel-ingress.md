---
read_when:
    - メッセージングチャネルPluginの構築または移行
    - DMまたはグループの許可リスト、ルートゲート、コマンド認証、イベント認証、メンションによる有効化の変更
    - チャネルの受信時の秘匿化または SDK 互換性境界のレビュー
sidebarTitle: Channel Ingress
summary: 受信メッセージ認可用の実験的なチャネル受信 API
title: チャネル受信 API
x-i18n:
    generated_at: "2026-07-16T12:01:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

チャネルのイングレスは、受信チャネルイベントに対する実験的なアクセス制御境界です。Plugin はプラットフォーム固有の事実と副作用を所有し、コアは DM/グループの許可リスト、ペアリングストアの DM エントリ、ルートゲート、コマンドゲート、イベント認証、メンションによる有効化、秘匿化された診断、受け入れという汎用ポリシーを所有します。

受信パスには `openclaw/plugin-sdk/channel-ingress-runtime` を使用します。

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

有効な許可リスト、コマンド所有者、コマンドグループを事前計算しないでください。リゾルバーは、生の許可リスト、ストアのコールバック、ルート記述子、アクセスグループ、ポリシー、会話種別からそれらを導出します。

## 結果

バンドルされた Plugin は、最新のプロジェクションを直接使用する必要があります。

| フィールド              | 意味                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 順序付けされたゲート判定と受け入れ                                |
| `senderAccess`     | 送信者/会話の認可のみ                             |
| `routeAccess`      | ルートおよびルート送信者のプロジェクション                                  |
| `commandAccess`    | コマンド認可。コマンドゲートが実行されなかった場合は `requested: false` |
| `activationAccess` | メンション/有効化の結果                                          |

イベント認可は、順序付けされた `ingress.graph` と決定的な `ingress.reasonCode` で引き続き利用できます。個別のイベントプロジェクションは生成されません。

非推奨のサードパーティ SDK ヘルパーは、内部で古い形式を再構築する場合があります。新しいバンドル済み受信パスでは、最新の結果をローカル DTO に変換し直さないでください。

## アクセスグループ

`accessGroup:<name>` エントリは秘匿化されたままです。コアは静的な `message.senders` グループを自身で解決し、プラットフォーム検索が必要な動的グループに対してのみ `resolveAccessGroupMembership` を呼び出します。存在しないグループ、未対応のグループ、解決に失敗したグループは、閉じた状態で失敗します。

## イベントモード

| `authMode`       | 意味                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | 通常の受信送信者ゲート                      |
| `command`        | コールバックまたはスコープ付きボタンのコマンドゲート    |
| `origin-subject` | アクターは元のメッセージのサブジェクトと一致する必要がある    |
| `route-only`     | ルートスコープの信頼済みイベントに対するルートゲートのみ |
| `none`           | Plugin 所有の内部イベントは共有認証をバイパスする  |

リアクション、ボタン、コールバック、ネイティブコマンドには `mayPair: false` を使用します。

## ルートと有効化

ルーム、トピック、ギルド、スレッド、またはネストされたルートポリシーには、ルート記述子を使用します。

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

Plugin に複数の任意ルート記述子がある場合は、`channelIngressRoutes(...)` を使用します。これは、ルートに関する事実を汎用的に保ち、各記述子の `precedence` に従って順序付けしながら、無効な分岐を除外します。

メンションゲートは有効化ゲートです。メンションが一致しない場合は `admission: "skip"` が返されるため、ターンカーネルは監視のみのターンを処理しません。ほとんどのチャネルでは、有効化を送信者ゲートとコマンドゲートの後に配置する必要があります。送信者許可リストに関するノイズが発生する前に、メンションされていないトラフィックを抑制する必要がある公開チャットサーフェスでは、テキストコマンドのバイパスが無効な場合に `activation.order: "before-sender"` を選択できます。ボットスレッド内の返信など、暗黙的な有効化を持つチャネルでは `activation.allowedImplicitMentionKinds` を渡すことができます。その場合、プロジェクションされた `activationAccess.shouldBypassMention` は、コマンドまたは暗黙的な有効化が明示的なメンションをバイパスしたときに報告します。

## 秘匿化

生の送信者値と生の許可リストエントリは、リゾルバーへの入力としてのみ使用します。解決済みの状態、判定、診断、スナップショット、互換性に関する事実には含めてはなりません。不透明なサブジェクト ID、エントリ ID、ルート ID、診断 ID を使用してください。

## 検証

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

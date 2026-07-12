---
read_when:
    - チャネルメッセージ UI、インタラクティブペイロード、またはネイティブチャネルレンダラーのリファクタリング
    - メッセージツールの機能、配信ヒント、またはコンテキスト間マーカーの変更
    - Discord Carbon のインポートファンアウトまたはチャンネル Plugin のランタイム遅延読み込みのデバッグ
summary: セマンティックなメッセージ表現を、チャネル固有の UI レンダラーから分離する。
title: チャネルプレゼンテーションのリファクタリング計画
x-i18n:
    generated_at: "2026-07-11T22:22:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## ステータス

共有エージェント、CLI、Plugin ケイパビリティ、送信配信の各サーフェスに実装済みです。

- `ReplyPayload.presentation` はセマンティックなメッセージ UI を保持します。
- `ReplyPayload.delivery.pin` は送信済みメッセージのピン留め要求を保持します。
- 共有メッセージアクションは、プロバイダー固有の `components`、`blocks`、`buttons`、`card` の代わりに、`presentation`、`delivery`、`pin` を公開します。
- コアは、Plugin が宣言した送信ケイパビリティを通じてプレゼンテーションをレンダリングするか、自動的にフォールバックします。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu のレンダラーは汎用コントラクトを使用します。
- Discord チャンネルのコントロールプレーンコードは、Carbon ベースの UI コンテナーをインポートしなくなりました。

正規ドキュメントは現在、[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation)にあります。
この計画は実装時の履歴コンテキストとして保持し、コントラクト、レンダラー、フォールバック動作を変更する場合は正規ガイドを更新してください。

## 問題

チャンネル UI は現在、互換性のない複数のサーフェスに分散しています。

- コアは、`buildCrossContextComponents` を通じて Discord 形式のコンテキスト横断レンダラーフックを所有しています。
- Discord の `channel.ts` は、`DiscordUiContainer` を通じてネイティブの Carbon UI をインポートできるため、ランタイム UI の依存関係がチャンネル Plugin のコントロールプレーンに持ち込まれます。
- エージェントと CLI は、Discord の `components`、Slack の `blocks`、Telegram または Mattermost の `buttons`、Teams または Feishu の `card` など、ネイティブペイロードへの迂回手段を公開しています。
- `ReplyPayload.channelData` は、トランスポートヒントとネイティブ UI エンベロープの両方を保持しています。
- 汎用の `interactive` モデルは存在しますが、Discord、Slack、Teams、Feishu、LINE、Telegram、Mattermost ですでに使用されている、より豊富なレイアウトよりも限定的です。

このため、コアがネイティブ UI の形式を認識することになり、Plugin ランタイムの遅延読み込みが損なわれ、同じメッセージ意図を表現するためのプロバイダー固有の方法がエージェントに多く与えられすぎています。

## 目標

- コアは、宣言されたケイパビリティからメッセージに最適なセマンティックプレゼンテーションを決定します。
- 拡張機能はケイパビリティを宣言し、セマンティックプレゼンテーションをネイティブのトランスポートペイロードにレンダリングします。
- Web Control UI はチャットのネイティブ UI から分離したままにします。
- ネイティブチャンネルペイロードは、共有エージェントまたは CLI のメッセージサーフェスを通じて公開しません。
- サポートされていないプレゼンテーション機能は、最適なテキスト表現へ自動的にフォールバックします。
- 送信済みメッセージのピン留めなどの配信動作は、プレゼンテーションではなく汎用の配信メタデータとします。

## 対象外

- `buildCrossContextComponents` の後方互換性シムは追加しません。
- `components`、`blocks`、`buttons`、`card` の公開ネイティブ迂回手段は追加しません。
- コアからチャンネル固有のネイティブ UI ライブラリをインポートしません。
- バンドル済みチャンネル向けのプロバイダー固有 SDK シームは追加しません。

## 目標モデル

コアが所有する `presentation` フィールドを `ReplyPayload` に追加します。

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

移行中は、`interactive` を `presentation` のサブセットとします。

- `interactive` のテキストブロックは `presentation.blocks[].type = "text"` にマッピングします。
- `interactive` のボタンブロックは `presentation.blocks[].type = "buttons"` にマッピングします。
- `interactive` の選択ブロックは `presentation.blocks[].type = "select"` にマッピングします。

外部エージェントと CLI のスキーマは現在 `presentation` を使用し、`interactive` は既存の返信生成側向けの内部レガシーパーサー兼レンダリングヘルパーとして残します。
公開される生成側 API では `interactive` を非推奨として扱います。新しいコードが `presentation` を出力する一方で、既存の承認ヘルパーと古い Plugin が引き続き動作できるよう、ランタイムサポートは維持します。

## 配信メタデータ

UI ではない送信動作のために、コアが所有する `delivery` フィールドを追加します。

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

セマンティクス：

- `delivery.pin = true` は、最初に正常配信されたメッセージをピン留めすることを意味します。
- `notify` のデフォルトは `false` です。
- `required` のデフォルトは `false` です。サポートされていないチャンネルやピン留めの失敗時には、配信を継続して自動的にフォールバックします。
- 既存メッセージ向けの手動 `pin`、`unpin`、`list-pins` メッセージアクションは維持します。

現在の Telegram ACP トピックバインディングは、`channelData.telegram.pin = true` から `delivery.pin = true` に移行する必要があります。

## ランタイムケイパビリティコントラクト

プレゼンテーションと配信のレンダリングフックは、コントロールプレーンのチャンネル Plugin ではなく、ランタイム送信アダプターに追加します。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

コアの動作：

- 対象チャンネルとランタイムアダプターを解決します。
- プレゼンテーションケイパビリティを照会します。
- レンダリング前に、サポートされていないブロックをフォールバックし、汎用ケイパビリティ制限を適用します。
- `renderPresentation` を呼び出します。
- レンダラーが存在しない場合は、プレゼンテーションをテキストフォールバックに変換します。
- 送信成功後、`delivery.pin` が要求され、かつサポートされている場合は `pinDeliveredMessage` を呼び出します。

## チャンネルマッピング

Discord：

- `presentation` をコンポーネント v2 と Carbon コンテナーへ、ランタイム専用モジュール内でレンダリングします。
- アクセントカラーヘルパーは軽量モジュール内に維持します。
- チャンネル Plugin のコントロールプレーンコードから `DiscordUiContainer` のインポートを削除します。

Slack：

- `presentation` を Block Kit にレンダリングします。
- エージェントと CLI の `blocks` 入力を削除します。

Telegram：

- テキスト、コンテキスト、区切りをテキストとしてレンダリングします。
- 対象サーフェスで設定および許可されている場合、アクションと選択をインラインキーボードとしてレンダリングします。
- インラインボタンが無効な場合は、テキストフォールバックを使用します。
- ACP トピックのピン留めを `delivery.pin` に移行します。

Mattermost：

- 設定されている場合、アクションをインタラクティブボタンとしてレンダリングします。
- その他のブロックはテキストフォールバックとしてレンダリングします。

MS Teams：

- `presentation` を Adaptive Cards にレンダリングします。
- 手動のピン留め、ピン留め解除、ピン留め一覧アクションを維持します。
- 対象の会話で Graph のサポートが信頼できる場合は、必要に応じて `pinDeliveredMessage` を実装します。

Feishu：

- `presentation` をインタラクティブカードにレンダリングします。
- 手動のピン留め、ピン留め解除、ピン留め一覧アクションを維持します。
- 送信済みメッセージのピン留めに関する API 動作が信頼できる場合は、必要に応じて `pinDeliveredMessage` を実装します。

LINE：

- 可能な場合は、`presentation` を Flex またはテンプレートメッセージにレンダリングします。
- サポートされていないブロックはテキストにフォールバックします。
- LINE UI ペイロードを `channelData` から削除します。

プレーンまたは機能が限定されたチャンネル：

- 控えめな書式を使用してプレゼンテーションをテキストに変換します。

## リファクタリング手順

1. `ui-colors.ts` を Carbon ベースの UI から分離し、`extensions/discord/src/channel.ts` から `DiscordUiContainer` を削除する Discord リリース修正を再適用します。
2. `ReplyPayload`、送信ペイロードの正規化、配信サマリー、フックペイロードに `presentation` と `delivery` を追加します。
3. 限定された SDK／ランタイムのサブパスに `MessagePresentation` スキーマとパーサーヘルパーを追加します。
4. メッセージケイパビリティの `buttons`、`cards`、`components`、`blocks` をセマンティックプレゼンテーションケイパビリティに置き換えます。
5. プレゼンテーションのレンダリングと配信後のピン留めのためのランタイム送信アダプターフックを追加します。
6. コンテキスト横断コンポーネントの構築を `buildCrossContextPresentation` に置き換えます。
7. `src/infra/outbound/channel-adapters.ts` を削除し、チャンネル Plugin の型から `buildCrossContextComponents` を削除します。
8. `maybeApplyCrossContextMarker` を変更し、ネイティブパラメーターの代わりに `presentation` を添付するようにします。
9. Plugin ディスパッチの送信パスを更新し、セマンティックプレゼンテーションと配信メタデータのみを使用するようにします。
10. エージェントと CLI のネイティブペイロードパラメーター `components`、`blocks`、`buttons`、`card` を削除します。
11. ネイティブのメッセージツールスキーマを作成する SDK ヘルパーを削除し、プレゼンテーションスキーマヘルパーに置き換えます。
12. `channelData` から UI／ネイティブエンベロープを削除します。残りの各フィールドを確認するまでは、トランスポートメタデータのみを維持します。
13. Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE のレンダラーを移行します。
14. メッセージ CLI、チャンネルページ、Plugin SDK、ケイパビリティのクックブックに関するドキュメントを更新します。
15. Discord と影響を受けるチャンネルエントリーポイントについて、インポートのファンアウトプロファイリングを実行します。

このリファクタリングでは、共有エージェント、CLI、Plugin ケイパビリティ、送信アダプターのコントラクトについて、手順 1～11 および 13～14 が実装されています。手順 12 は、プロバイダー固有の非公開 `channelData` トランスポートエンベロープに対する、より深い内部クリーンアップとして残っています。手順 15 は、型／テストゲートを超える定量的なインポートファンアウト値が必要な場合の後続検証として残っています。

## テスト

追加または更新する項目：

- プレゼンテーション正規化テスト。
- サポートされていないブロックに対するプレゼンテーションの自動フォールバックテスト。
- Plugin ディスパッチとコア配信パスのコンテキスト横断マーカーテスト。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE、テキストフォールバックのチャンネルレンダリングマトリクステスト。
- ネイティブフィールドが削除されたことを証明するメッセージツールスキーマテスト。
- ネイティブフラグが削除されたことを証明する CLI テスト。
- Carbon を対象とする Discord エントリーポイントのインポート遅延読み込み回帰テスト。
- Telegram と汎用フォールバックを対象とする配信ピン留めテスト。

## 未解決の質問

- `delivery.pin` は最初の段階で Discord、Slack、MS Teams、Feishu に実装すべきですか。それとも最初は Telegram のみに実装すべきですか。
- `delivery` は最終的に `replyToId`、`replyToCurrent`、`silent`、`audioAsVoice` などの既存フィールドも取り込むべきですか。それとも送信後の動作に限定すべきですか。
- プレゼンテーションは画像やファイル参照を直接サポートすべきですか。それとも現時点では、メディアを UI レイアウトから分離したままにすべきですか。

## 関連項目

- [チャンネルの概要](/ja-JP/channels)
- [メッセージプレゼンテーション](/ja-JP/plugins/message-presentation)

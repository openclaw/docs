---
read_when:
    - チャンネルメッセージ UI、インタラクティブペイロード、またはネイティブチャンネルレンダラーのリファクタリング
    - メッセージツールの機能、配信ヒント、またはクロスコンテキストマーカーの変更
    - Discord Carbon インポートのファンアウトまたはチャンネル Plugin ランタイムの遅延読み込みのデバッグ
summary: セマンティックなメッセージ表示を、チャンネルのネイティブ UI レンダラーから切り離す。
title: チャネルプレゼンテーションのリファクタリング計画
x-i18n:
    generated_at: "2026-06-27T11:59:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## ステータス

共有エージェント、CLI、Plugin 機能、アウトバウンド配信サーフェスに実装済み:

- `ReplyPayload.presentation` は意味的なメッセージ UI を保持する。
- `ReplyPayload.delivery.pin` は送信済みメッセージのピン留め要求を保持する。
- 共有メッセージアクションは、プロバイダー固有の `components`、`blocks`、`buttons`、`card` の代わりに `presentation`、`delivery`、`pin` を公開する。
- コアは、Plugin が宣言したアウトバウンド機能を通じてプレゼンテーションをレンダリングまたは自動劣化する。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu のレンダラーは汎用契約を使用する。
- Discord チャネルの制御プレーンコードは、Carbon ベースの UI コンテナをインポートしなくなった。

正規ドキュメントは現在 [メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) にある。
この計画は過去の実装コンテキストとして保持し、契約、レンダラー、フォールバック動作の変更は正規ガイドを更新する。

## 問題

チャネル UI は現在、互換性のない複数のサーフェスに分割されている:

- コアは `buildCrossContextComponents` を通じて Discord 形状のクロスコンテキストレンダラーフックを所有している。
- Discord `channel.ts` は `DiscordUiContainer` を通じてネイティブ Carbon UI をインポートでき、それによりランタイム UI 依存関係がチャネル Plugin の制御プレーンに取り込まれる。
- エージェントと CLI は、Discord `components`、Slack `blocks`、Telegram または Mattermost `buttons`、Teams または Feishu `card` などのネイティブペイロードのエスケープハッチを公開している。
- `ReplyPayload.channelData` はトランスポートヒントとネイティブ UI エンベロープの両方を保持する。
- 汎用の `interactive` モデルは存在するが、Discord、Slack、Teams、Feishu、LINE、Telegram、Mattermost で既に使用されている、よりリッチなレイアウトより狭い。

これにより、コアがネイティブ UI 形状を認識し、Plugin ランタイムの遅延性が弱まり、エージェントが同じメッセージ意図を表現するためのプロバイダー固有の方法が多すぎる状態になる。

## 目標

- コアは、宣言された機能からメッセージに最適な意味的プレゼンテーションを決定する。
- 拡張機能は機能を宣言し、意味的プレゼンテーションをネイティブトランスポートペイロードへレンダリングする。
- Web Control UI はチャットのネイティブ UI から分離したままにする。
- ネイティブチャネルペイロードは、共有エージェントまたは CLI メッセージサーフェスを通じて公開しない。
- サポートされないプレゼンテーション機能は、最適なテキスト表現へ自動劣化する。
- 送信済みメッセージのピン留めなどの配信動作は、プレゼンテーションではなく汎用配信メタデータである。

## 非目標

- `buildCrossContextComponents` の後方互換性シムは用意しない。
- `components`、`blocks`、`buttons`、`card` 向けの公開ネイティブエスケープハッチは用意しない。
- コアはチャネルネイティブ UI ライブラリをインポートしない。
- バンドル済みチャネル向けのプロバイダー固有 SDK シームは用意しない。

## 目標モデル

コア所有の `presentation` フィールドを `ReplyPayload` に追加する。

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

移行中、`interactive` は `presentation` のサブセットになる:

- `interactive` テキストブロックは `presentation.blocks[].type = "text"` にマッピングされる。
- `interactive` ボタンブロックは `presentation.blocks[].type = "buttons"` にマッピングされる。
- `interactive` 選択ブロックは `presentation.blocks[].type = "select"` にマッピングされる。

外部エージェントと CLI のスキーマは現在 `presentation` を使用する。`interactive` は既存の返信生成側のための内部レガシーパーサー/レンダリングヘルパーとして残る。
公開の生成側 API では `interactive` を非推奨として扱う。既存の承認ヘルパーや古い Plugin が動作し続けるよう、ランタイムサポートは残しつつ、新しいコードは `presentation` を出力する。

## 配信メタデータ

UI ではない送信動作向けに、コア所有の `delivery` フィールドを追加する。

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

意味:

- `delivery.pin = true` は、最初に正常配信されたメッセージをピン留めすることを意味する。
- `notify` のデフォルトは `false`。
- `required` のデフォルトは `false`。サポートされないチャネルやピン留め失敗は、配信を継続することで自動劣化する。
- 手動の `pin`、`unpin`、`list-pins` メッセージアクションは既存メッセージ向けに残る。

現在の Telegram ACP トピックバインディングは、`channelData.telegram.pin = true` から `delivery.pin = true` に移行する必要がある。

## ランタイム機能契約

制御プレーンのチャネル Plugin ではなく、ランタイムアウトバウンドアダプターにプレゼンテーションおよび配信レンダーフックを追加する。

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

コアの動作:

- 対象チャネルとランタイムアダプターを解決する。
- プレゼンテーション機能を問い合わせる。
- レンダリング前に、サポートされないブロックを劣化し、汎用機能制限を適用する。
- `renderPresentation` を呼び出す。
- レンダラーが存在しない場合、プレゼンテーションをテキストフォールバックへ変換する。
- 正常送信後、`delivery.pin` が要求され、サポートされている場合は `pinDeliveredMessage` を呼び出す。

## チャネルマッピング

Discord:

- `presentation` をコンポーネント v2 と Carbon コンテナへ、ランタイム専用モジュールでレンダリングする。
- アクセントカラーのヘルパーは軽量モジュールに保持する。
- チャネル Plugin の制御プレーンコードから `DiscordUiContainer` のインポートを削除する。

Slack:

- `presentation` を Block Kit へレンダリングする。
- エージェントと CLI の `blocks` 入力を削除する。

Telegram:

- テキスト、コンテキスト、区切り線をテキストとしてレンダリングする。
- 対象サーフェスで設定済みかつ許可されている場合、アクションと選択をインラインキーボードとしてレンダリングする。
- インラインボタンが無効な場合はテキストフォールバックを使用する。
- ACP トピックのピン留めを `delivery.pin` へ移動する。

Mattermost:

- 設定されている場合、アクションをインタラクティブボタンとしてレンダリングする。
- その他のブロックはテキストフォールバックとしてレンダリングする。

MS Teams:

- `presentation` を Adaptive Cards へレンダリングする。
- 手動の pin/unpin/list-pins アクションを保持する。
- 対象会話で Graph サポートが信頼できる場合、任意で `pinDeliveredMessage` を実装する。

Feishu:

- `presentation` をインタラクティブカードへレンダリングする。
- 手動の pin/unpin/list-pins アクションを保持する。
- API 動作が信頼できる場合、送信済みメッセージのピン留め向けに任意で `pinDeliveredMessage` を実装する。

LINE:

- 可能な場合、`presentation` を Flex またはテンプレートメッセージへレンダリングする。
- サポートされないブロックはテキストへフォールバックする。
- LINE UI ペイロードを `channelData` から削除する。

プレーンまたは制限付きチャネル:

- 控えめな書式でプレゼンテーションをテキストへ変換する。

## リファクターステップ

1. `ui-colors.ts` を Carbon ベース UI から分割し、`extensions/discord/src/channel.ts` から `DiscordUiContainer` を削除する Discord リリース修正を再適用する。
2. `ReplyPayload`、アウトバウンドペイロード正規化、配信サマリー、フックペイロードに `presentation` と `delivery` を追加する。
3. 狭い SDK/ランタイムサブパスに `MessagePresentation` スキーマとパーサーヘルパーを追加する。
4. メッセージ機能の `buttons`、`cards`、`components`、`blocks` を意味的プレゼンテーション機能に置き換える。
5. プレゼンテーションレンダリングと配信ピン留め向けにランタイムアウトバウンドアダプターフックを追加する。
6. クロスコンテキストコンポーネント構築を `buildCrossContextPresentation` に置き換える。
7. `src/infra/outbound/channel-adapters.ts` を削除し、チャネル Plugin 型から `buildCrossContextComponents` を削除する。
8. `maybeApplyCrossContextMarker` を変更し、ネイティブパラメーターの代わりに `presentation` を付与する。
9. Plugin ディスパッチ送信パスを更新し、意味的プレゼンテーションと配信メタデータのみを使用する。
10. エージェントと CLI のネイティブペイロードパラメーター `components`、`blocks`、`buttons`、`card` を削除する。
11. ネイティブメッセージツールスキーマを作成する SDK ヘルパーを削除し、プレゼンテーションスキーマヘルパーに置き換える。
12. UI/ネイティブエンベロープを `channelData` から削除する。残りの各フィールドがレビューされるまで、トランスポートメタデータのみを保持する。
13. Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE のレンダラーを移行する。
14. メッセージ CLI、チャネルページ、Plugin SDK、機能クックブックのドキュメントを更新する。
15. Discord と影響を受けるチャネルエントリポイントのインポートファンアウトプロファイリングを実行する。

ステップ 1-11 と 13-14 は、このリファクターで共有エージェント、CLI、Plugin 機能、アウトバウンドアダプター契約に実装済み。ステップ 12 は、プロバイダー非公開の `channelData` トランスポートエンベロープに対する、より深い内部クリーンアップパスとして残る。ステップ 15 は、型/テストゲートを超える定量的なインポートファンアウト数値が必要な場合のフォローアップ検証として残る。

## テスト

追加または更新:

- プレゼンテーション正規化テスト。
- サポートされないブロック向けのプレゼンテーション自動劣化テスト。
- Plugin ディスパッチおよびコア配信パス向けのクロスコンテキストマーカーテスト。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE、テキストフォールバック向けのチャネルレンダリングマトリクステスト。
- ネイティブフィールドがなくなったことを証明するメッセージツールスキーマテスト。
- ネイティブフラグがなくなったことを証明する CLI テスト。
- Carbon を対象にした Discord エントリポイントのインポート遅延性回帰テスト。
- Telegram と汎用フォールバックを対象にした配信ピン留めテスト。

## 未解決の質問

- `delivery.pin` は初回パスで Discord、Slack、MS Teams、Feishu にも実装するべきか、それともまず Telegram のみにするべきか。
- `delivery` は最終的に `replyToId`、`replyToCurrent`、`silent`、`audioAsVoice` などの既存フィールドも吸収するべきか、それとも送信後の動作に集中したままにするべきか。
- プレゼンテーションは画像やファイル参照を直接サポートするべきか、それとも当面メディアは UI レイアウトから分離したままにするべきか。

## 関連

- [チャネル概要](/ja-JP/channels)
- [メッセージプレゼンテーション](/ja-JP/plugins/message-presentation)

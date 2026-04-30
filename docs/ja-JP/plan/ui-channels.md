---
read_when:
    - チャネルメッセージ UI、インタラクティブペイロード、またはネイティブチャネルレンダラーのリファクタリング
    - メッセージツールの機能、配信ヒント、またはコンテキスト横断マーカーの変更
    - Discord Carbon インポートのファンアウトまたはチャンネル Plugin ランタイムの遅延性のデバッグ
summary: セマンティックなメッセージ表示をチャンネル固有の UI レンダラーから分離する。
title: チャネル表示のリファクタリング計画
x-i18n:
    generated_at: "2026-04-30T05:22:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## ステータス

共有エージェント、CLI、Plugin 機能、およびアウトバウンド配信サーフェスで実装済み:

- `ReplyPayload.presentation` はセマンティックなメッセージ UI を保持する。
- `ReplyPayload.delivery.pin` は送信済みメッセージのピン留めリクエストを保持する。
- 共有メッセージアクションは、プロバイダー固有の `components`、`blocks`、`buttons`、`card` ではなく、`presentation`、`delivery`、`pin` を公開する。
- コアは、Plugin が宣言したアウトバウンド機能を通じて presentation をレンダリングするか、自動的に代替表現へフォールバックする。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu のレンダラーは汎用契約を使用する。
- Discord チャネルの制御プレーンコードは、Carbon ベースの UI コンテナーをインポートしなくなった。

正規ドキュメントは現在 [メッセージ presentation](/ja-JP/plugins/message-presentation) にある。
この計画は履歴上の実装コンテキストとして保持し、契約、レンダラー、フォールバック動作の変更については正規ガイドを更新する。

## 問題

チャネル UI は現在、互換性のない複数のサーフェスに分割されている:

- コアは `buildCrossContextComponents` を通じて、Discord 形状のクロスコンテキストレンダラーフックを所有している。
- Discord の `channel.ts` は `DiscordUiContainer` を通じてネイティブ Carbon UI をインポートできるため、実行時 UI 依存関係がチャネル Plugin の制御プレーンに入り込む。
- エージェントと CLI は、Discord の `components`、Slack の `blocks`、Telegram または Mattermost の `buttons`、Teams または Feishu の `card` などのネイティブペイロード回避口を公開している。
- `ReplyPayload.channelData` は、トランスポートヒントとネイティブ UI エンベロープの両方を保持している。
- 汎用の `interactive` モデルは存在するが、Discord、Slack、Teams、Feishu、LINE、Telegram、Mattermost ですでに使われているよりリッチなレイアウトより狭い。

これにより、コアがネイティブ UI 形状を意識し、Plugin 実行時の遅延性が弱まり、エージェントが同じメッセージ意図を表現するためのプロバイダー固有の方法を持ちすぎる。

## 目標

- コアは、宣言された機能からメッセージに最適なセマンティック presentation を決定する。
- 拡張は機能を宣言し、セマンティック presentation をネイティブトランスポートペイロードにレンダリングする。
- Web Control UI はチャットネイティブ UI から分離したままにする。
- ネイティブチャネルペイロードは、共有エージェントまたは CLI メッセージサーフェスを通じて公開しない。
- サポートされていない presentation 機能は、最適なテキスト表現へ自動的にフォールバックする。
- 送信済みメッセージのピン留めなどの配信動作は、presentation ではなく汎用配信メタデータである。

## 非目標

- `buildCrossContextComponents` の後方互換 shim は作らない。
- `components`、`blocks`、`buttons`、`card` の公開ネイティブ回避口は作らない。
- コアはチャネルネイティブ UI ライブラリをインポートしない。
- バンドル済みチャネル向けのプロバイダー固有 SDK シームは作らない。

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

- `interactive` テキストブロックは `presentation.blocks[].type = "text"` にマップされる。
- `interactive` ボタンブロックは `presentation.blocks[].type = "buttons"` にマップされる。
- `interactive` セレクトブロックは `presentation.blocks[].type = "select"` にマップされる。

外部エージェントと CLI スキーマは現在 `presentation` を使用する。`interactive` は既存の返信生成側のための内部レガシーパーサー/レンダリングヘルパーとして残る。

## 配信メタデータ

UI ではない送信動作用に、コア所有の `delivery` フィールドを追加する。

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

セマンティクス:

- `delivery.pin = true` は、最初に正常配信されたメッセージをピン留めすることを意味する。
- `notify` のデフォルトは `false`。
- `required` のデフォルトは `false`。サポートされていないチャネルやピン留め失敗は、配信を継続することで自動的に代替動作へフォールバックする。
- 手動の `pin`、`unpin`、`list-pins` メッセージアクションは既存メッセージ用に残る。

現在の Telegram ACP トピックバインディングは、`channelData.telegram.pin = true` から `delivery.pin = true` に移す必要がある。

## 実行時機能契約

制御プレーンのチャネル Plugin ではなく、実行時アウトバウンドアダプターに presentation と delivery のレンダーフックを追加する。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

コア動作:

- 対象チャネルと実行時アダプターを解決する。
- presentation 機能を問い合わせる。
- レンダリング前にサポートされていないブロックを劣化させる。
- `renderPresentation` を呼び出す。
- レンダラーが存在しない場合、presentation をテキストフォールバックに変換する。
- 送信成功後、`delivery.pin` がリクエストされサポートされている場合は `pinDeliveredMessage` を呼び出す。

## チャネルマッピング

Discord:

- `presentation` をコンポーネント v2 と Carbon コンテナーへ、実行時専用モジュールでレンダリングする。
- アクセントカラーヘルパーは軽量モジュールに保持する。
- チャネル Plugin 制御プレーンコードから `DiscordUiContainer` のインポートを削除する。

Slack:

- `presentation` を Block Kit にレンダリングする。
- エージェントと CLI の `blocks` 入力を削除する。

Telegram:

- テキスト、コンテキスト、区切り線をテキストとしてレンダリングする。
- ターゲットサーフェスで設定され許可されている場合、アクションとセレクトをインラインキーボードとしてレンダリングする。
- インラインボタンが無効な場合はテキストフォールバックを使用する。
- ACP トピックのピン留めを `delivery.pin` に移す。

Mattermost:

- 設定されている場合、アクションをインタラクティブボタンとしてレンダリングする。
- その他のブロックはテキストフォールバックとしてレンダリングする。

MS Teams:

- `presentation` を Adaptive Cards にレンダリングする。
- 手動の pin/unpin/list-pins アクションを保持する。
- 対象会話で Graph サポートが信頼できる場合は、任意で `pinDeliveredMessage` を実装する。

Feishu:

- `presentation` をインタラクティブカードにレンダリングする。
- 手動の pin/unpin/list-pins アクションを保持する。
- API 動作が信頼できる場合は、送信済みメッセージのピン留め向けに任意で `pinDeliveredMessage` を実装する。

LINE:

- 可能な場合、`presentation` を Flex またはテンプレートメッセージにレンダリングする。
- サポートされていないブロックはテキストにフォールバックする。
- LINE UI ペイロードを `channelData` から削除する。

プレーンまたは制限付きチャネル:

- presentation を保守的な書式のテキストに変換する。

## リファクタリング手順

1. `ui-colors.ts` を Carbon ベース UI から分離し、`extensions/discord/src/channel.ts` から `DiscordUiContainer` を削除する Discord リリース修正を再適用する。
2. `ReplyPayload`、アウトバウンドペイロード正規化、配信サマリー、フックペイロードに `presentation` と `delivery` を追加する。
3. 狭い SDK/実行時サブパスに `MessagePresentation` スキーマとパーサーヘルパーを追加する。
4. メッセージ機能の `buttons`、`cards`、`components`、`blocks` をセマンティック presentation 機能に置き換える。
5. presentation レンダリングと delivery ピン留め用の実行時アウトバウンドアダプターフックを追加する。
6. クロスコンテキストコンポーネント構築を `buildCrossContextPresentation` に置き換える。
7. `src/infra/outbound/channel-adapters.ts` を削除し、チャネル Plugin 型から `buildCrossContextComponents` を削除する。
8. `maybeApplyCrossContextMarker` を変更し、ネイティブパラメーターではなく `presentation` をアタッチする。
9. Plugin ディスパッチ送信パスを更新し、セマンティック presentation と delivery メタデータのみを使用する。
10. エージェントと CLI のネイティブペイロードパラメーター `components`、`blocks`、`buttons`、`card` を削除する。
11. ネイティブメッセージツールスキーマを作成する SDK ヘルパーを削除し、presentation スキーマヘルパーに置き換える。
12. UI/ネイティブエンベロープを `channelData` から削除する。残る各フィールドがレビューされるまでは、トランスポートメタデータのみを保持する。
13. Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE のレンダラーを移行する。
14. メッセージ CLI、チャネルページ、Plugin SDK、機能クックブックのドキュメントを更新する。
15. Discord と影響を受けるチャネルエントリーポイントのインポートファンアウトプロファイリングを実行する。

手順 1〜11 と 13〜14 は、このリファクタリングで共有エージェント、CLI、Plugin 機能、アウトバウンドアダプター契約について実装済み。手順 12 は、プロバイダー非公開の `channelData` トランスポートエンベロープに対する、より深い内部クリーンアップパスとして残っている。手順 15 は、型/テストゲートを超えた定量的なインポートファンアウト数値が必要な場合のフォローアップ検証として残っている。

## テスト

追加または更新するもの:

- presentation 正規化テスト。
- サポートされていないブロック向けの presentation 自動劣化テスト。
- Plugin ディスパッチとコア配信パスのクロスコンテキストマーカーテスト。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE、テキストフォールバックのチャネルレンダリングマトリクステスト。
- ネイティブフィールドがなくなったことを証明するメッセージツールスキーマテスト。
- ネイティブフラグがなくなったことを証明する CLI テスト。
- Carbon を対象にした Discord エントリーポイントのインポート遅延性回帰テスト。
- Telegram と汎用フォールバックを対象にした delivery ピン留めテスト。

## 未解決の質問

- `delivery.pin` は初回パスで Discord、Slack、MS Teams、Feishu にも実装すべきか、それともまず Telegram のみにすべきか。
- `delivery` は最終的に `replyToId`、`replyToCurrent`、`silent`、`audioAsVoice` などの既存フィールドも吸収すべきか、それとも送信後の動作に集中したままにすべきか。
- presentation は画像やファイル参照を直接サポートすべきか、それとも当面はメディアを UI レイアウトから分離したままにすべきか。

## 関連

- [チャネル概要](/ja-JP/channels)
- [メッセージ presentation](/ja-JP/plugins/message-presentation)

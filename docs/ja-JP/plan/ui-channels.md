---
read_when:
    - チャンネルメッセージ UI、インタラクティブペイロード、またはチャンネル固有のネイティブレンダラーをリファクタリングする場合
    - メッセージツールの機能、配信ヒント、またはクロスコンテキストマーカーを変更する場合
    - Discord Carbon のインポートファンアウトやチャンネル Plugin ランタイムの遅延読み込みをデバッグする場合
summary: 意味的なメッセージプレゼンテーションを、チャンネル固有のネイティブ UI レンダラーから分離する。
title: チャンネルプレゼンテーションのリファクタリング計画
x-i18n:
    generated_at: "2026-04-24T05:07:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## ステータス

共有エージェント、CLI、Plugin 機能、送信配信サーフェス向けに実装済み:

- `ReplyPayload.presentation` が意味的なメッセージ UI を運びます。
- `ReplyPayload.delivery.pin` が送信済みメッセージの pin リクエストを運びます。
- 共有メッセージアクションは、プロバイダー固有の `components`、`blocks`、`buttons`、`card` ではなく、`presentation`、`delivery`、`pin` を公開します。
- コアは、Plugin が宣言した送信機能を通して presentation をレンダリングまたは自動劣化させます。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu のレンダラーが汎用契約を消費します。
- Discord のチャンネル control-plane コードは、Carbon ベース UI コンテナをもう import しません。

正規ドキュメントは現在 [Message Presentation](/ja-JP/plugins/message-presentation) にあります。
この計画は履歴的な実装コンテキストとして保持し、契約、レンダラー、フォールバック動作に変更がある場合は
正規ガイドを更新してください。

## 問題

チャンネル UI は現在、互換性のない複数のサーフェスに分裂しています。

- コアは `buildCrossContextComponents` を通じて Discord 形状のクロスコンテキストレンダラーフックを所有しています。
- Discord `channel.ts` は `DiscordUiContainer` を通じてネイティブ Carbon UI を import できるため、ランタイム UI 依存がチャンネル Plugin の control plane に引き込まれます。
- エージェントと CLI は、Discord の `components`、Slack の `blocks`、Telegram や Mattermost の `buttons`、Teams や Feishu の `card` のようなネイティブペイロードの escape hatch を公開しています。
- `ReplyPayload.channelData` は transport hint とネイティブ UI envelope の両方を運びます。
- 汎用 `interactive` モデルは存在しますが、Discord、Slack、Teams、Feishu、LINE、Telegram、Mattermost ですでに使われているより豊かなレイアウトよりも狭いです。

これにより、コアがネイティブ UI 形状を認識することになり、Plugin ランタイムの遅延読み込みが弱まり、エージェントが同じメッセージ意図を表現するためのプロバイダー固有の方法を持ちすぎることになります。

## 目標

- コアが、宣言された機能からメッセージに最適な意味的 presentation を決定する。
- Extension が機能を宣言し、意味的 presentation をネイティブ transport payload にレンダリングする。
- Web Control UI は、チャットのネイティブ UI とは別のままにする。
- ネイティブチャンネルペイロードは、共有エージェントや CLI メッセージサーフェスから公開しない。
- サポートされない presentation 機能は、自動的に最適なテキスト表現へ劣化する。
- 送信済みメッセージの pin のような配信動作は、presentation ではなく汎用の配信メタデータである。

## 非目標

- `buildCrossContextComponents` 向けの後方互換 shim は作らない。
- `components`、`blocks`、`buttons`、`card` 向けの公開ネイティブ escape hatch は作らない。
- コアからチャンネル固有 UI ライブラリを import しない。
- バンドル済みチャンネル向けのプロバイダー固有 SDK seam は作らない。

## ターゲットモデル

コア所有の `presentation` フィールドを `ReplyPayload` に追加します。

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

移行中、`interactive` は `presentation` のサブセットになります。

- `interactive` text block は `presentation.blocks[].type = "text"` にマップされます。
- `interactive` buttons block は `presentation.blocks[].type = "buttons"` にマップされます。
- `interactive` select block は `presentation.blocks[].type = "select"` にマップされます。

外部エージェントと CLI schema は現在 `presentation` を使います。`interactive` は既存 reply producer 向けの内部 legacy parser/rendering helper のままです。

## 配信メタデータ

UI ではない送信動作のために、コア所有の `delivery` フィールドを追加します。

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

- `delivery.pin = true` は、最初に正常配信されたメッセージを pin することを意味します。
- `notify` のデフォルトは `false`。
- `required` のデフォルトは `false`。未対応チャンネルや pin 失敗は、配信を続行することで自動劣化します。
- 既存メッセージ向けの手動 `pin`、`unpin`、`list-pins` メッセージアクションは残します。

現在の Telegram ACP topic binding は、`channelData.telegram.pin = true` から `delivery.pin = true` へ移行すべきです。

## ランタイム機能契約

presentation と delivery の render hook を、control-plane チャンネル Plugin ではなく runtime outbound adapter に追加します。

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

コアの動作:

- 対象チャンネルと runtime adapter を解決する。
- presentation capabilities を問い合わせる。
- サポートされない block をレンダリング前に劣化させる。
- `renderPresentation` を呼び出す。
- renderer が存在しない場合は、presentation をテキストフォールバックへ変換する。
- 配信成功後、`delivery.pin` が要求されサポートされている場合は `pinDeliveredMessage` を呼び出す。

## チャンネルマッピング

Discord:

- `presentation` を runtime-only module 内で components v2 と Carbon container にレンダリングする。
- accent color helper は軽量 module に残す。
- チャンネル Plugin control-plane コードから `DiscordUiContainer` の import を除去する。

Slack:

- `presentation` を Block Kit にレンダリングする。
- エージェントと CLI の `blocks` 入力を削除する。

Telegram:

- text、context、divider をテキストとしてレンダリングする。
- actions と select は、対象サーフェスで設定され許可されている場合、inline keyboard としてレンダリングする。
- inline button が無効な場合はテキストフォールバックを使う。
- ACP topic pinning は `delivery.pin` へ移す。

Mattermost:

- actions は設定されていれば interactive button としてレンダリングする。
- その他の block はテキストフォールバックとしてレンダリングする。

MS Teams:

- `presentation` を Adaptive Cards にレンダリングする。
- 手動の pin/unpin/list-pins アクションは維持する。
- 対象 conversation に対して Graph サポートが信頼できるなら、`pinDeliveredMessage` を任意実装する。

Feishu:

- `presentation` を interactive cards にレンダリングする。
- 手動の pin/unpin/list-pins アクションは維持する。
- API 挙動が信頼できるなら、送信済みメッセージ pinning 用に `pinDeliveredMessage` を任意実装する。

LINE:

- `presentation` を可能な限り Flex または template message にレンダリングする。
- サポートされない block はテキストにフォールバックする。
- `channelData` から LINE UI payload を削除する。

プレーンまたは制限の多いチャンネル:

- 保守的な書式で presentation をテキストへ変換する。

## リファクタ手順

1. `ui-colors.ts` を Carbon ベース UI から分離し、`extensions/discord/src/channel.ts` から `DiscordUiContainer` を除去する Discord リリース修正を再適用する。
2. `presentation` と `delivery` を `ReplyPayload`、送信 payload 正規化、配信サマリー、hook payload に追加する。
3. 狭い SDK/runtime サブパスに `MessagePresentation` schema と parser helper を追加する。
4. メッセージ機能の `buttons`、`cards`、`components`、`blocks` を意味的 presentation capabilities に置き換える。
5. presentation render と delivery pinning のための runtime outbound adapter hook を追加する。
6. クロスコンテキスト component 構築を `buildCrossContextPresentation` に置き換える。
7. `src/infra/outbound/channel-adapters.ts` を削除し、チャンネル Plugin type から `buildCrossContextComponents` を除去する。
8. `maybeApplyCrossContextMarker` がネイティブ params ではなく `presentation` を付与するよう変更する。
9. Plugin-dispatch の send path を、意味的 presentation と delivery metadata だけを消費するよう更新する。
10. エージェントと CLI のネイティブ payload params: `components`、`blocks`、`buttons`、`card` を削除する。
11. ネイティブ message-tool schema を作る SDK helper を削除し、presentation schema helper に置き換える。
12. `channelData` から UI/native envelope を除去する。残る各フィールドをレビューするまでは transport metadata のみを維持する。
13. Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE のレンダラーを移行する。
14. message CLI、channel page、Plugin SDK、capability cookbook のドキュメントを更新する。
15. Discord と影響を受けるチャンネル entrypoint の import fanout profiling を実行する。

このリファクタでは、共有エージェント、CLI、Plugin capability、outbound adapter 契約について手順 1-11 と 13-14 が実装済みです。手順 12 は provider-private `channelData` transport envelope に対する、より深い内部クリーンアップパスとして残っています。手順 15 は、型/テストゲートを超えた定量的な import-fanout 数値が欲しい場合のフォローアップ検証として残っています。

## テスト

追加または更新するもの:

- Presentation 正規化テスト。
- サポートされない block に対する presentation 自動劣化テスト。
- Plugin dispatch とコア配信経路向けのクロスコンテキスト marker テスト。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE、およびテキストフォールバック向けのチャンネル render matrix テスト。
- ネイティブフィールドが消えたことを証明するメッセージツール schema テスト。
- ネイティブフラグが消えたことを証明する CLI テスト。
- Carbon を対象にした Discord entrypoint import-laziness 回帰テスト。
- Telegram と汎用フォールバックをカバーする delivery pin テスト。

## 未解決の質問

- `delivery.pin` は最初の段階で Discord、Slack、MS Teams、Feishu にも実装すべきか、それともまず Telegram のみか？
- `delivery` は将来的に `replyToId`、`replyToCurrent`、`silent`、`audioAsVoice` のような既存フィールドも吸収すべきか、それとも post-send 動作に集中したままにすべきか？
- Presentation は画像やファイル参照を直接サポートすべきか、それとも今のところメディアは UI レイアウトとは分離したままにすべきか？

## 関連

- [Channels overview](/ja-JP/channels)
- [Message presentation](/ja-JP/plugins/message-presentation)

---
read_when:
    - メッセージカード、ボタン、またはセレクトのレンダリングを追加または変更すること
    - リッチな送信メッセージをサポートするチャンネル Plugin を構築すること
    - message tool のプレゼンテーションや配信 capabilities を変更すること
    - プロバイダー固有のカード/ブロック/component レンダリングのリグレッションをデバッグすること
summary: チャンネル Plugin 向けのセマンティックメッセージカード、ボタン、セレクト、フォールバックテキスト、配信ヒント
title: メッセージプレゼンテーション
x-i18n:
    generated_at: "2026-04-24T05:10:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

メッセージプレゼンテーションは、リッチな送信チャット UI 向けの OpenClaw の共有契約です。
これにより、エージェント、CLI コマンド、承認フロー、Plugins はメッセージの
意図を 1 回だけ記述でき、各チャンネル Plugin はそれを可能な限り最適なネイティブ形状にレンダリングできます。

プレゼンテーションは、移植性のあるメッセージ UI に使ってください。

- テキストセクション
- 小さなコンテキスト/フッターテキスト
- 区切り線
- ボタン
- セレクトメニュー
- カードタイトルとトーン

Discord の `components`、Slack の
`blocks`、Telegram の `buttons`、Teams の `card`、Feishu の `card` のような、新しい provider-native フィールドを共有
message tool に追加してはいけません。これらはチャンネル Plugin が所有するレンダラー出力です。

## 契約

Plugin 作成者は次から公開契約を import します。

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

形状:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

ボタンの意味論:

- `value` はアプリケーション action 値であり、チャンネルがクリック可能なコントロールをサポートしている場合、チャンネルの既存 interaction path 経由で戻されます。
- `url` はリンクボタンです。`value` なしでも存在できます。
- `label` は必須で、テキストフォールバックでも使われます。
- `style` は advisory です。レンダラーは、サポートされていない style を失敗させるのではなく、安全なデフォルトにマップすべきです。

セレクトの意味論:

- `options[].value` は選択されたアプリケーション値です。
- `placeholder` は advisory であり、ネイティブなセレクトをサポートしないチャンネルでは無視されることがあります。
- チャンネルがセレクトをサポートしない場合、フォールバックテキストはラベルを列挙します。

## Producer の例

シンプルなカード:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

URL のみのリンクボタン:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

セレクトメニュー:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI 送信:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

pin 付き配信:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

明示的 JSON を使った pin 付き配信:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer 契約

チャンネル Plugin は、その outbound adapter 上で render サポートを宣言します。

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

capability フィールドは意図的に単純な真偽値です。これらは、レンダラーがどのネイティブプラットフォーム制限まで持つかではなく、何をインタラクティブにできるかを表します。ボタン最大数、ブロック数、カードサイズのようなプラットフォーム固有制限は、引き続きレンダラー側が所有します。

## Core のレンダーフロー

`ReplyPayload` または message action に `presentation` が含まれる場合、core は次を行います。

1. presentation payload を正規化する。
2. ターゲットチャンネルの outbound adapter を解決する。
3. `presentationCapabilities` を読む。
4. adapter が payload をレンダリングできる場合、`renderPresentation` を呼ぶ。
5. adapter がない、またはレンダリングできない場合は保守的なテキストへフォールバックする。
6. 生成された payload を通常のチャンネル配信パスで送る。
7. 最初に送信成功したメッセージの後で、`delivery.pin` のような配信メタデータを適用する。

フォールバック動作は core が所有するため、producer はチャンネル非依存のままでいられます。ネイティブレンダリングと interaction 処理はチャンネル Plugin が所有します。

## 劣化ルール

プレゼンテーションは、制限されたチャンネルでも安全に送信できなければなりません。

フォールバックテキストには次が含まれます。

- 最初の行としての `title`
- 通常段落としての `text` ブロック
- コンパクトなコンテキスト行としての `context` ブロック
- 視覚的区切りとしての `divider` ブロック
- リンクボタンの URL を含むボタンラベル
- セレクト option ラベル

サポートされないネイティブコントロールは、送信全体を失敗させるのではなく劣化すべきです。
例:

- inline button 無効の Telegram では、テキストフォールバックを送信する。
- セレクトをサポートしないチャンネルでは、セレクト option をテキストとして列挙する。
- URL のみボタンは、ネイティブリンクボタンまたはフォールバック URL 行のどちらかになる。
- 任意の pin 失敗は、配信済みメッセージを失敗させない。

主な例外は `delivery.pin.required: true` です。pin が必須として要求され、
チャンネルが送信済みメッセージを pin できない場合、配信は失敗として報告されます。

## Provider マッピング

現在の同梱レンダラー:

| Channel | ネイティブレンダー対象 | 注記 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord | Components と component container | 既存の provider-native payload producer 向けに旧式の `channelData.discord.components` を保持しますが、新しい共有送信では `presentation` を使うべきです。 |
| Slack | Block Kit | 既存の provider-native payload producer 向けに旧式の `channelData.slack.blocks` を保持しますが、新しい共有送信では `presentation` を使うべきです。 |
| Telegram | テキスト + inline keyboard | ボタン/セレクトは、ターゲットサーフェスに inline button capability が必要です。なければテキストフォールバックが使われます。 |
| Mattermost | テキスト + interactive props | 他のブロックはテキストに劣化します。 |
| Microsoft Teams | Adaptive Cards | 両方が提供された場合、プレーンな `message` テキストもカードと一緒に含まれます。 |
| Feishu | Interactive cards | カードヘッダーは `title` を使えます。本文ではそのタイトルの重複を避けます。 |
| Plain channels | テキストフォールバック | レンダラーのないチャンネルでも読みやすい出力が得られます。 |

provider-native payload 互換性は、既存の
reply producer 向けの移行用便宜措置です。新しい共有ネイティブフィールドを追加する理由にはなりません。

## Presentation と InteractiveReply

`InteractiveReply` は、承認および interaction
helper で使われる古い内部サブセットです。サポートするもの:

- text
- buttons
- selects

`MessagePresentation` は正規の共有送信契約です。これにより次が追加されます。

- title
- tone
- context
- divider
- URL のみボタン
- `ReplyPayload.delivery` を通じた汎用配信メタデータ

古いコードを bridge するときは `openclaw/plugin-sdk/interactive-runtime` の helper を使ってください。

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新しいコードは、`MessagePresentation` を直接受け取るか生成すべきです。

## Delivery pin

pin は presentation ではなく配信動作です。`channelData.telegram.pin` のような
provider-native フィールドではなく `delivery.pin` を使ってください。

意味論:

- `pin: true` は、最初に正常配信されたメッセージを pin します。
- `pin.notify` のデフォルトは `false` です。
- `pin.required` のデフォルトは `false` です。
- 任意の pin 失敗は劣化し、送信済みメッセージはそのまま残ります。
- 必須 pin 失敗は配信失敗になります。
- chunk 化されたメッセージでは、tail chunk ではなく最初に配信された chunk を pin します。

手動の `pin`, `unpin`, `pins` message action は、provider がそれらの操作をサポートする既存メッセージ用に引き続き存在します。

## Plugin 作成者チェックリスト

- チャンネルがセマンティックプレゼンテーションをレンダリングできる、または安全に劣化できる場合は、`describeMessageTool(...)` から `presentation` を宣言する。
- ランタイム outbound adapter に `presentationCapabilities` を追加する。
- `renderPresentation` は control-plane Plugin
  setup コードではなく、ランタイムコード内に実装する。
- ネイティブ UI ライブラリを hot setup/catalog パスに入れない。
- プラットフォーム制限をレンダラーとテスト内で保持する。
- 未対応のボタン、セレクト、URL ボタン、title/text
  重複、および `message` と `presentation` の混在送信に対するフォールバックテストを追加する。
- provider が送信済みメッセージ id を pin できる場合にのみ、`deliveryCapabilities.pin` と
  `pinDeliveredMessage` により配信 pin サポートを追加する。
- 新しい provider-native card/block/component/button フィールドを、
  共有 message action schema 経由で公開しない。

## 関連ドキュメント

- [Message CLI](/ja-JP/cli/message)
- [Plugin SDK Overview](/ja-JP/plugins/sdk-overview)
- [Plugin Architecture](/ja-JP/plugins/architecture-internals#message-tool-schemas)
- [Channel Presentation Refactor Plan](/ja-JP/plan/ui-channels)

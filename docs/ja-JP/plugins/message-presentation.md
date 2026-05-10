---
read_when:
    - メッセージカード、ボタン、またはセレクトのレンダリングの追加または変更
    - リッチな送信メッセージをサポートするチャネルPluginの構築
    - メッセージツールの表示形式または配信機能の変更
    - プロバイダー固有のカード/ブロック/コンポーネントのレンダリングリグレッションのデバッグ
summary: チャネル Plugin 向けのセマンティックなメッセージカード、ボタン、セレクト、フォールバックテキスト、配信ヒント
title: メッセージの表示
x-i18n:
    generated_at: "2026-05-10T19:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

メッセージプレゼンテーションは、リッチなアウトバウンドチャット UI のための OpenClaw の共有コントラクトです。
これにより、エージェント、CLI コマンド、承認フロー、Plugin はメッセージの
意図を一度だけ記述でき、各チャネル Plugin が可能な限り最適なネイティブ形式でレンダーします。

ポータブルなメッセージ UI にはプレゼンテーションを使用します。

- テキストセクション
- 小さなコンテキスト/フッターテキスト
- 区切り線
- ボタン
- セレクトメニュー
- カードタイトルとトーン

共有メッセージツールに、Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card`、Feishu `card` などの新しいプロバイダー固有フィールドを追加しないでください。
これらはチャネル Plugin が所有するレンダラー出力です。

## コントラクト

Plugin 作者は次から公開コントラクトをインポートします。

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

ボタンのセマンティクス:

- `value` は、チャネルがクリック可能なコントロールをサポートする場合に、チャネルの
  既存のインタラクション経路を通じてルーティングされるアプリケーションアクション値です。
- `url` はリンクボタンです。`value` なしでも存在できます。
- `label` は必須で、テキストフォールバックでも使用されます。
- `style` は助言的です。レンダラーは、サポートされていないスタイルを送信失敗にするのではなく、安全な
  デフォルトにマッピングする必要があります。

セレクトのセマンティクス:

- `options[].value` は選択されたアプリケーション値です。
- `placeholder` は助言的で、ネイティブの
  セレクトサポートがないチャネルでは無視される場合があります。
- チャネルがセレクトをサポートしない場合、フォールバックテキストにはラベルが一覧表示されます。

## プロデューサー例

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

ピン留め配信:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

明示的な JSON を使ったピン留め配信:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## レンダラーコントラクト

チャネル Plugin はアウトバウンドアダプターでレンダーサポートを宣言します。

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

ケイパビリティフィールドは意図的に単純なブール値です。これらは、あらゆるネイティブプラットフォームの制限ではなく、
レンダラーが何をインタラクティブにできるかを記述します。レンダラーは、最大ボタン数、ブロック数、
カードサイズなどのプラットフォーム固有の制限も引き続き所有します。

## コアレンダーフロー

`ReplyPayload` またはメッセージアクションに `presentation` が含まれる場合、コアは次を行います。

1. プレゼンテーションペイロードを正規化します。
2. 対象チャネルのアウトバウンドアダプターを解決します。
3. `presentationCapabilities` を読み取ります。
4. アダプターがペイロードをレンダーできる場合、`renderPresentation` を呼び出します。
5. アダプターが存在しない、またはレンダーできない場合、保守的なテキストにフォールバックします。
6. 結果のペイロードを通常のチャネル配信経路で送信します。
7. 最初の正常に送信されたメッセージの後に、`delivery.pin` などの配信メタデータを適用します。

コアはフォールバック動作を所有するため、プロデューサーはチャネル非依存のままでいられます。チャネル
Plugin はネイティブレンダリングとインタラクション処理を所有します。

## デグラデーションルール

プレゼンテーションは、制限のあるチャネルでも安全に送信できる必要があります。

フォールバックテキストには次が含まれます。

- 最初の行としての `title`
- 通常の段落としての `text` ブロック
- コンパクトなコンテキスト行としての `context` ブロック
- 視覚的な区切りとしての `divider` ブロック
- リンクボタンの URL を含むボタンラベル
- セレクトオプションラベル

サポートされていないネイティブコントロールは、送信全体を失敗させるのではなくデグレードする必要があります。
例:

- インラインボタンが無効な Telegram はテキストフォールバックを送信します。
- セレクトサポートのないチャネルは、セレクトオプションをテキストとして一覧表示します。
- URL のみのボタンは、ネイティブリンクボタンまたはフォールバック URL 行になります。
- 任意のピン留め失敗は、配信済みメッセージを失敗させません。

主な例外は `delivery.pin.required: true` です。ピン留めが必須として要求され、
チャネルが送信済みメッセージをピン留めできない場合、配信は失敗を報告します。

## プロバイダーマッピング

現在のバンドル済みレンダラー:

| チャネル         | ネイティブレンダー対象                | 注記                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | コンポーネントとコンポーネントコンテナー | 既存のプロバイダー固有ペイロードプロデューサー向けに従来の `channelData.discord.components` を保持しますが、新しい共有送信では `presentation` を使用する必要があります。 |
| Slack           | Block Kit                           | 既存のプロバイダー固有ペイロードプロデューサー向けに従来の `channelData.slack.blocks` を保持しますが、新しい共有送信では `presentation` を使用する必要があります。       |
| Telegram        | テキストとインラインキーボード          | ボタン/セレクトには対象サーフェスのインラインボタンケイパビリティが必要です。それ以外の場合はテキストフォールバックが使用されます。                                         |
| Mattermost      | テキストとインタラクティブ props       | その他のブロックはテキストにデグレードします。                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 両方が指定されている場合、プレーンな `message` テキストはカードと一緒に含まれます。                                                                            |
| Feishu          | インタラクティブカード                   | カードヘッダーは `title` を使用できます。本文ではそのタイトルの重複を避けます。                                                                                  |
| プレーンチャネル  | テキストフォールバック                   | レンダラーのないチャネルでも読みやすい出力を得られます。                                                                                            |

プロバイダー固有ペイロード互換性は、既存の
返信プロデューサーのための移行支援です。新しい共有ネイティブフィールドを追加する理由にはなりません。

## プレゼンテーションと InteractiveReply

`InteractiveReply` は、承認およびインタラクション
ヘルパーで使用される古い内部サブセットです。次をサポートします。

- テキスト
- ボタン
- セレクト

`MessagePresentation` は正規の共有送信コントラクトです。次を追加します。

- タイトル
- トーン
- コンテキスト
- 区切り線
- URL のみのボタン
- `ReplyPayload.delivery` を通じた汎用配信メタデータ

古いコードを橋渡しする場合は、`openclaw/plugin-sdk/interactive-runtime` のヘルパーを使用します。

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新しいコードは `MessagePresentation` を直接受け入れるか生成する必要があります。

`presentationToInteractiveReply(...)` は、タイトル、テキスト、コンテキスト、ボタン、セレクトを古い
`InteractiveReply` 形状にマッピングすることで、表示されるプレゼンテーションテキストを保持します。タイトル、テキスト、
コンテキスト、区切り線ブロックをすでにネイティブに描画しているコンポーネントレンダラーは、代わりに
`presentationToInteractiveControlsReply(...)` を使用し、その後ボタンとセレクトコントロールのみを追加する必要があります。

`renderMessagePresentationFallbackText(...)` は、区切り線のみの
プレゼンテーションなど、テキストフォールバックを持たないプレゼンテーションブロックに対して空文字列を返します。空でない送信本文を必要とするトランスポートは、
デフォルトのフォールバックコントラクトを変更せずに最小限の本文を選択するために `emptyFallback` を渡せます。

## 配信ピン留め

ピン留めは配信動作であり、プレゼンテーションではありません。`channelData.telegram.pin` などの
プロバイダー固有フィールドではなく `delivery.pin` を使用します。

セマンティクス:

- `pin: true` は、最初に正常に配信されたメッセージをピン留めします。
- `pin.notify` のデフォルトは `false` です。
- `pin.required` のデフォルトは `false` です。
- 任意のピン留め失敗はデグレードし、送信済みメッセージはそのまま残ります。
- 必須のピン留め失敗は配信を失敗させます。
- チャンク化されたメッセージは、末尾のチャンクではなく最初に配信されたチャンクをピン留めします。

既存メッセージについて、プロバイダーがそれらの操作をサポートする場合、手動の `pin`、`unpin`、`pins` メッセージアクションは引き続き存在します。

## Plugin 作者チェックリスト

- チャネルがセマンティックプレゼンテーションをレンダーまたは安全にデグレードできる場合、`describeMessageTool(...)` から `presentation` を宣言します。
- ランタイムアウトバウンドアダプターに `presentationCapabilities` を追加します。
- コントロールプレーンの Plugin セットアップコードではなく、ランタイムコードで `renderPresentation` を実装します。
- ネイティブ UI ライブラリをホットなセットアップ/カタログ経路に入れないでください。
- レンダラーとテストでプラットフォーム制限を保持します。
- サポートされていないボタン、セレクト、URL ボタン、タイトル/テキストの重複、および混在した `message` と `presentation` 送信に対するフォールバックテストを追加します。
- プロバイダーが送信済みメッセージ ID をピン留めできる場合のみ、`deliveryCapabilities.pin` と
  `pinDeliveredMessage` を通じて配信ピンサポートを追加します。
- 共有メッセージアクションスキーマを通じて、新しいプロバイダー固有のカード/ブロック/コンポーネント/ボタンフィールドを公開しないでください。

## 関連ドキュメント

- [メッセージ CLI](/ja-JP/cli/message)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture-internals#message-tool-schemas)
- [チャネルプレゼンテーションリファクタリング計画](/ja-JP/plan/ui-channels)

---
read_when:
    - メッセージカード、ボタン、またはセレクトのレンダリングの追加または変更
    - リッチな送信メッセージをサポートするチャネル Plugin の構築
    - メッセージツールの表示または配信機能の変更
    - プロバイダー固有のカード/ブロック/コンポーネントのレンダリング回帰をデバッグする
summary: チャネルPlugin向けのセマンティックメッセージカード、ボタン、セレクト、フォールバックテキスト、配信ヒント
title: メッセージの表示
x-i18n:
    generated_at: "2026-04-30T05:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

メッセージプレゼンテーションは、リッチな送信チャット UI のための OpenClaw の共有コントラクトです。
これにより、エージェント、CLI コマンド、承認フロー、Plugin はメッセージの
意図を一度記述すれば、各チャネル Plugin が可能な最適なネイティブ形状でレンダリングできます。

ポータブルなメッセージ UI にはプレゼンテーションを使用します。

- テキストセクション
- 小さなコンテキスト/フッターテキスト
- 区切り線
- ボタン
- 選択メニュー
- カードタイトルとトーン

共有メッセージツールに、Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card`、Feishu `card` などの新しいプロバイダーネイティブフィールドを追加しないでください。
それらはチャネル Plugin が所有するレンダラー出力です。

## コントラクト

Plugin 作者は公開コントラクトを次からインポートします。

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

- `value` は、チャネルがクリック可能なコントロールに対応している場合に、そのチャネルの
  既存のインタラクション経路を通じて戻されるアプリケーションアクション値です。
- `url` はリンクボタンです。`value` なしで存在できます。
- `label` は必須で、テキストフォールバックでも使用されます。
- `style` は助言的なものです。レンダラーは未対応のスタイルを、安全な
  デフォルトにマッピングし、送信を失敗させないようにする必要があります。

選択のセマンティクス:

- `options[].value` は選択されたアプリケーション値です。
- `placeholder` は助言的なもので、ネイティブの選択に対応しないチャネルでは無視される
  場合があります。
- チャネルが選択に対応していない場合、フォールバックテキストにはラベルが一覧表示されます。

## プロデューサー例

単純なカード:

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

選択メニュー:

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

明示的な JSON によるピン留め配信:

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

チャネル Plugin は送信アダプターでレンダー対応を宣言します。

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

ケイパビリティフィールドは意図的に単純なブール値です。これはレンダラーが何を
インタラクティブにできるかを説明するものであり、すべてのネイティブプラットフォーム制限を表すものではありません。レンダラーは引き続き、
最大ボタン数、ブロック数、カードサイズなどのプラットフォーム固有の制限を
所有します。

## コアレンダーフロー

`ReplyPayload` またはメッセージアクションに `presentation` が含まれる場合、コアは次を行います。

1. プレゼンテーションペイロードを正規化します。
2. 対象チャネルの送信アダプターを解決します。
3. `presentationCapabilities` を読み取ります。
4. アダプターがペイロードをレンダリングできる場合、`renderPresentation` を呼び出します。
5. アダプターが存在しない、またはレンダリングできない場合、保守的なテキストにフォールバックします。
6. 結果のペイロードを通常のチャネル配信経路で送信します。
7. 最初に正常送信されたメッセージの後に、`delivery.pin` などの配信メタデータを
   適用します。

コアがフォールバック動作を所有するため、プロデューサーはチャネル非依存のままでいられます。チャネル
Plugin はネイティブレンダリングとインタラクション処理を所有します。

## 劣化ルール

プレゼンテーションは、制限のあるチャネルでも安全に送信できる必要があります。

フォールバックテキストには次が含まれます。

- 最初の行としての `title`
- 通常の段落としての `text` ブロック
- コンパクトなコンテキスト行としての `context` ブロック
- 視覚的な区切りとしての `divider` ブロック
- リンクボタンの URL を含むボタンラベル
- 選択オプションのラベル

未対応のネイティブコントロールは、送信全体を失敗させるのではなく劣化する必要があります。
例:

- インラインボタンが無効な Telegram はテキストフォールバックを送信します。
- 選択に対応しないチャネルは、選択オプションをテキストとして一覧表示します。
- URL のみのボタンは、ネイティブリンクボタンまたはフォールバック URL 行になります。
- 任意のピン留め失敗は、配信済みメッセージを失敗させません。

主な例外は `delivery.pin.required: true` です。ピン留めが必須として要求され、
チャネルが送信済みメッセージをピン留めできない場合、配信は失敗を報告します。

## プロバイダーマッピング

現在の同梱レンダラー:

| チャネル        | ネイティブレンダーターゲット      | 備考                                                                                                                                           |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components とコンポーネントコンテナ | 既存のプロバイダーネイティブペイロードプロデューサー向けに従来の `channelData.discord.components` を保持しますが、新しい共有送信では `presentation` を使用する必要があります。 |
| Slack           | Block Kit                           | 既存のプロバイダーネイティブペイロードプロデューサー向けに従来の `channelData.slack.blocks` を保持しますが、新しい共有送信では `presentation` を使用する必要があります。       |
| Telegram        | テキストとインラインキーボード      | ボタン/選択には対象サーフェスのインラインボタンケイパビリティが必要です。そうでない場合はテキストフォールバックが使用されます。                                         |
| Mattermost      | テキストとインタラクティブプロパティ | その他のブロックはテキストに劣化します。                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 両方が提供された場合、プレーンな `message` テキストはカードに含まれます。                                                                            |
| Feishu          | インタラクティブカード              | カードヘッダーは `title` を使用できます。本文ではそのタイトルの重複を避けます。                                                                                  |
| プレーンチャネル | テキストフォールバック              | レンダラーのないチャネルでも読みやすい出力を得られます。                                                                                            |

プロバイダーネイティブペイロード互換性は、既存の返信プロデューサー向けの移行上の便宜です。
新しい共有ネイティブフィールドを追加する理由にはなりません。

## プレゼンテーションと InteractiveReply

`InteractiveReply` は、承認とインタラクション
ヘルパーで使用される古い内部サブセットです。これは次に対応しています。

- テキスト
- ボタン
- 選択

`MessagePresentation` は標準的な共有送信コントラクトです。これは次を追加します。

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
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新しいコードは `MessagePresentation` を直接受け入れるか生成する必要があります。

## 配信ピン留め

ピン留めは配信動作であり、プレゼンテーションではありません。
`channelData.telegram.pin` などのプロバイダーネイティブフィールドではなく、`delivery.pin` を使用してください。

セマンティクス:

- `pin: true` は最初に正常配信されたメッセージをピン留めします。
- `pin.notify` のデフォルトは `false` です。
- `pin.required` のデフォルトは `false` です。
- 任意のピン留め失敗は劣化し、送信済みメッセージをそのまま残します。
- 必須のピン留め失敗は配信を失敗させます。
- チャンク化されたメッセージは末尾チャンクではなく、最初に配信されたチャンクをピン留めします。

手動の `pin`、`unpin`、`pins` メッセージアクションは、プロバイダーがそれらの操作に対応している
既存メッセージ向けに引き続き存在します。

## Plugin 作者チェックリスト

- チャネルがセマンティックプレゼンテーションをレンダリングできる、または安全に劣化できる場合は、
  `describeMessageTool(...)` から `presentation` を宣言します。
- ランタイム送信アダプターに `presentationCapabilities` を追加します。
- コントロールプレーンの Plugin セットアップコードではなく、ランタイムコードで `renderPresentation` を実装します。
- ネイティブ UI ライブラリをホットなセットアップ/カタログ経路から除外します。
- レンダラーとテストでプラットフォーム制限を保持します。
- 未対応のボタン、選択、URL ボタン、タイトル/テキストの重複、`message` と `presentation` の混在送信についてフォールバックテストを追加します。
- プロバイダーが送信済みメッセージ ID をピン留めできる場合にのみ、`deliveryCapabilities.pin` と
  `pinDeliveredMessage` を通じて配信ピン留め対応を追加します。
- 共有メッセージアクションスキーマを通じて、新しいプロバイダーネイティブのカード/ブロック/コンポーネント/ボタンフィールドを公開しないでください。

## 関連ドキュメント

- [メッセージ CLI](/ja-JP/cli/message)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture-internals#message-tool-schemas)
- [チャネルプレゼンテーションリファクタリング計画](/ja-JP/plan/ui-channels)

---
read_when:
    - メッセージカード、ボタン、またはセレクトのレンダリングの追加または変更
    - リッチな送信メッセージをサポートするチャネルPluginの構築
    - |-
      OpenClaw_docs_i18n_input>
      メッセージツールの表示または配信機能を変更する
    - プロバイダー固有のカード/ブロック/コンポーネントのレンダリング回帰のデバッグ
summary: チャンネルPlugin向けのセマンティックなメッセージカード、ボタン、セレクト、フォールバックテキスト、配信ヒント
title: メッセージ表示
x-i18n:
    generated_at: "2026-06-27T12:18:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

メッセージプレゼンテーションは、リッチな送信チャット UI のための OpenClaw の共有コントラクトです。
これにより、エージェント、CLI コマンド、承認フロー、plugins はメッセージの
意図を一度だけ記述し、各チャネル Plugin が可能な最適なネイティブ形式でレンダリングできます。

ポータブルなメッセージ UI にはプレゼンテーションを使用します。

- テキストセクション
- 小さなコンテキスト/フッターテキスト
- 区切り線
- ボタン
- セレクトメニュー
- カードタイトルとトーン

Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card`、Feishu `card` のような新しいプロバイダーネイティブフィールドを共有
メッセージツールに追加しないでください。これらはチャネル Plugin が所有するレンダラー出力です。

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` は、core のコマンド
  パスを通じてネイティブのスラッシュコマンドを実行します。組み込みコマンドボタンやメニューにはこれを使用します。
- `action.type: "callback"` は、チャネルの
  インタラクションパスを通じて不透明な Plugin データを運びます。チャネル plugins はコールバックデータをスラッシュ
  コマンドとして再解釈してはなりません。
- `value` はレガシーの不透明なコールバック値です。新しいコントロールでは `action`
  を使用し、チャネル plugins がテキストから推測せずにコマンドとコールバックをマッピングできるようにするべきです。
- `url` はリンクボタンです。`value` なしで存在できます。
- `webApp` はチャネルネイティブの Web アプリボタンを記述します。Telegram はこれを
  `web_app` としてレンダリングし、プライベートチャットでのみサポートします。`web_app` は互換性のために
  緩い JSON ペイロードでは引き続き受け入れられますが、TypeScript プロデューサーは
  `webApp` を使用するべきです。
- `label` は必須で、テキストフォールバックでも使用されます。
- `style` は助言的なものです。レンダラーは、サポートされていないスタイルを送信失敗ではなく安全な
  デフォルトにマッピングするべきです。
- `priority` は任意です。チャネルがアクション制限を告知し、コントロールを
  削除する必要がある場合、core は優先度の高いボタンを先に残し、同じ優先度のボタン間では
  元の順序を保持します。すべてのコントロールが収まる場合は、作成時の
  順序が保持されます。
- `disabled` は任意です。チャネルは `supportsDisabled` で明示的に対応する必要があります。そうでない場合、
  core は無効化されたコントロールを非インタラクティブなフォールバックテキストに劣化させます。
- `reusable` は任意です。再利用可能なネイティブコールバックをサポートするチャネルは、
  成功したインタラクション後もアクションを利用可能に保てます。更新、検査、詳細表示などの
  反復可能または冪等なアクションに使用します。
  通常の一回限りの承認や破壊的アクションでは未設定のままにします。

セレクトのセマンティクス:

- `options[].action` はボタンの `action` と同じコマンド/コールバックの意味を持ちます。
- `options[].value` はレガシーの選択されたアプリケーション値です。
- `placeholder` は助言的なもので、ネイティブの
  セレクトサポートがないチャネルでは無視される場合があります。
- チャネルがセレクトをサポートしていない場合、フォールバックテキストはラベルを一覧表示します。

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

Telegram Mini App ボタン:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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

チャネル plugins は、送信アダプターでレンダーサポートを宣言します。

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

機能の真偽値は、レンダラーが何をインタラクティブにできるかを記述します。任意の
`limits` は、レンダラーを呼び出す前に core が適応できる汎用エンベロープを記述します。

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

core は、レンダリング前にセマンティックコントロールへ汎用制限を適用します。レンダラーは
ネイティブブロック数、カードサイズ、URL 制限、および汎用
コントラクトで表現できないプロバイダー固有の挙動に対する最終的なプロバイダー固有の検証とクリッピングを
引き続き所有します。制限によってブロックからすべてのコントロールが削除された場合、core は
配信されたメッセージに可視のフォールバックが残るように、ラベルを非インタラクティブなコンテキストテキストとして保持します。

## Core レンダーフロー

`ReplyPayload` またはメッセージアクションに `presentation` が含まれる場合、core は次を行います。

1. プレゼンテーションペイロードを正規化します。
2. 対象チャネルの送信アダプターを解決します。
3. `presentationCapabilities` を読み取ります。
4. アダプターが告知している場合、アクション数、ラベル長、
   セレクトオプション数などの汎用機能制限を適用します。
5. アダプターがペイロードをレンダリングできる場合、`renderPresentation` を呼び出します。
6. アダプターが存在しない、またはレンダリングできない場合は保守的なテキストにフォールバックします。
7. 結果のペイロードを通常のチャネル配信パスを通じて送信します。
8. 最初のメッセージ送信成功後に、`delivery.pin` などの配信メタデータを適用します。

core がフォールバック動作を所有するため、プロデューサーはチャネル非依存のままでいられます。チャネル
plugins はネイティブレンダリングとインタラクション処理を所有します。

## 劣化ルール

プレゼンテーションは、制限のあるチャネルでも安全に送信できなければなりません。

フォールバックテキストには次が含まれます。

- 最初の行としての `title`
- 通常の段落としての `text` ブロック
- コンパクトなコンテキスト行としての `context` ブロック
- 視覚的な区切りとしての `divider` ブロック
- リンクボタンの URL を含むボタンラベル
- セレクトオプションラベル

サポートされていないネイティブコントロールは、送信全体を失敗させるのではなく劣化させるべきです。
例:

- インラインボタンが無効な Telegram はテキストフォールバックを送信します。
- セレクトをサポートしないチャネルは、セレクトオプションをテキストとして一覧表示します。
- URL のみのボタンは、ネイティブリンクボタンまたはフォールバック URL 行のどちらかになります。
- 任意のピン留め失敗は、配信済みメッセージを失敗扱いにしません。

主な例外は `delivery.pin.required: true` です。必須としてピン留めが要求され、
チャネルが送信済みメッセージをピン留めできない場合、配信は失敗を報告します。

## プロバイダーマッピング

現在のバンドル済みレンダラー:

| チャネル         | ネイティブレンダーターゲット                | 注記                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | コンポーネントとコンポーネントコンテナー | 既存のプロバイダーネイティブペイロードプロデューサー向けにレガシーの `channelData.discord.components` を保持しますが、新しい共有送信では `presentation` を使用するべきです。 |
| Slack           | Block Kit                           | 既存のプロバイダーネイティブペイロードプロデューサー向けにレガシーの `channelData.slack.blocks` を保持しますが、新しい共有送信では `presentation` を使用するべきです。       |
| Telegram        | テキストとインラインキーボード          | ボタン/セレクトには対象サーフェスのインラインボタン機能が必要です。それ以外の場合はテキストフォールバックが使用されます。                                         |
| Mattermost      | テキストとインタラクティブ props         | その他のブロックはテキストに劣化します。                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 両方が提供されている場合、プレーンな `message` テキストはカードに含まれます。                                                                            |
| Feishu          | インタラクティブカード                   | カードヘッダーは `title` を使用できます。本文ではそのタイトルの重複を避けます。                                                                                  |
| プレーンチャネル  | テキストフォールバック                       | レンダラーのないチャネルでも読みやすい出力を取得します。                                                                                            |

プロバイダーネイティブのペイロード互換性は、既存の返信プロデューサーのための移行上の便宜です。新しい共有ネイティブフィールドを追加する理由にはなりません。

## Presentation と InteractiveReply

`InteractiveReply` は、承認とインタラクションのヘルパーで使われる古い内部サブセットです。次をサポートします。

- テキスト
- ボタン
- セレクト

`MessagePresentation` は、標準の共有送信コントラクトです。次を追加します。

- タイトル
- トーン
- コンテキスト
- 区切り
- URL 専用ボタン
- `ReplyPayload.delivery` による汎用配信メタデータ

古いコードをブリッジする場合は、`openclaw/plugin-sdk/interactive-runtime` のヘルパーを使用します。

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新しいコードは `MessagePresentation` を直接受け入れるか生成するべきです。既存の `interactive` ペイロードは `presentation` の非推奨サブセットです。古いプロデューサー向けのランタイムサポートは残ります。

従来の `InteractiveReply*` 型と変換ヘルパーは SDK で `@deprecated` とマークされています。

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, and
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` と
`presentationToInteractiveControlsReply(...)` は、従来のチャンネル実装向けのレンダラーブリッジとして引き続き利用できます。新しいプロデューサーコードではこれらを呼び出さないでください。`presentation` を送信し、core/チャンネルの適応にレンダリングを処理させてください。

承認ヘルパーにも、presentation 優先の置き換えがあります。

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` の代わりに `buildApprovalPresentationFromActionDescriptors(...)` を使用します
- `buildApprovalInteractiveReply(...)` の代わりに `buildApprovalPresentation(...)` を使用します
- `buildExecApprovalInteractiveReply(...)` の代わりに `buildExecApprovalPresentation(...)` を使用します

`renderMessagePresentationFallbackText(...)` は、区切りのみの presentation など、テキストフォールバックのない presentation ブロックに対して空文字列を返します。空でない送信本文を必要とするトランスポートは、デフォルトのフォールバックコントラクトを変更せずに最小本文を選択するため、`emptyFallback` を渡せます。

## 配信ピン留め

ピン留めは presentation ではなく配信の動作です。`channelData.telegram.pin` のようなプロバイダーネイティブフィールドではなく、`delivery.pin` を使用してください。

セマンティクス:

- `pin: true` は、正常に配信された最初のメッセージをピン留めします。
- `pin.notify` のデフォルトは `false` です。
- `pin.required` のデフォルトは `false` です。
- 任意のピン留め失敗は縮退し、送信済みメッセージをそのまま残します。
- 必須のピン留め失敗は配信を失敗させます。
- チャンク化されたメッセージでは、末尾のチャンクではなく、最初に配信されたチャンクをピン留めします。

手動の `pin`、`unpin`、`pins` メッセージアクションは、プロバイダーがそれらの操作をサポートする既存メッセージ向けに引き続き存在します。

## Plugin 作者チェックリスト

- チャンネルが意味的な presentation をレンダリングできる、または安全に縮退できる場合は、`describeMessageTool(...)` から `presentation` を宣言します。
- ランタイムのアウトバウンドアダプターに `presentationCapabilities` を追加します。
- control-plane Plugin セットアップコードではなく、ランタイムコードで `renderPresentation` を実装します。
- ネイティブ UI ライブラリをホットなセットアップ/カタログパスから外しておきます。
- 既知の場合は、`presentationCapabilities.limits` に汎用機能制限を宣言します。
- レンダラーとテストで最終的なプラットフォーム制限を保持します。
- サポートされないボタン、セレクト、URL ボタン、タイトル/テキストの重複、`message` と `presentation` が混在する送信のフォールバックテストを追加します。
- プロバイダーが送信済みメッセージ ID をピン留めできる場合にのみ、`deliveryCapabilities.pin` と `pinDeliveredMessage` による配信ピン留めサポートを追加します。
- 共有メッセージアクションスキーマを通じて、新しいプロバイダーネイティブのカード/ブロック/コンポーネント/ボタンフィールドを公開しないでください。

## 関連ドキュメント

- [Message CLI](/ja-JP/cli/message)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture-internals#message-tool-schemas)
- [チャンネル presentation リファクタリング計画](/ja-JP/plan/ui-channels)

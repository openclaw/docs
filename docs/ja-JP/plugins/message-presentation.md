---
read_when:
    - メッセージカード、ボタン、またはセレクト表示の追加または変更
    - リッチな送信メッセージをサポートするチャネル Plugin の構築
    - メッセージツールの表示または配信機能を変更する
    - プロバイダー固有のカード/ブロック/コンポーネント描画リグレッションのデバッグ
summary: チャンネルプラグイン向けのセマンティックメッセージカード、ボタン、選択、フォールバックテキスト、配信ヒント
title: メッセージ表示
x-i18n:
    generated_at: "2026-07-05T11:37:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49e9a4657d27b90d12fb921bb4c9f0e7f0ae70d9dc452c8365626c9fdb5adcc8
    source_path: plugins/message-presentation.md
    workflow: 16
---

メッセージプレゼンテーションは、リッチな送信チャット UI のための OpenClaw の共有契約です。
これにより、エージェント、CLI コマンド、承認フロー、プラグインはメッセージの
意図を一度だけ記述し、各チャンネルプラグインが可能な範囲で最適なネイティブ形式にレンダリングできます。

ポータブルなメッセージ UI にはプレゼンテーションを使用します。テキストセクション、小さなコンテキスト/フッター
テキスト、区切り、ボタン、選択メニュー、カードのタイトル/トーンが対象です。

共有メッセージツールに、Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card`、Feishu `card` のような新しいプロバイダーネイティブフィールドを追加しないでください。
それらはチャンネルプラグインが所有するレンダラー出力です。

## 契約

プラグイン作者は公開契約を次からインポートします。

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

ボタンの意味:

- `action.type: "command"` はコアのコマンド
  パスを通じてネイティブのスラッシュコマンドを実行します。組み込みコマンドボタンとメニューにはこれを使用します。
- `action.type: "callback"` はチャンネルの
  インタラクションパスを通じて不透明なプラグインデータを運びます。チャンネルプラグインはコールバックデータをスラッシュ
  コマンドとして再解釈してはいけません。
- `value` はレガシーの不透明なコールバック値です。新しいコントロールでは `action`
  を使用し、チャンネルプラグインがテキストから推測せずにコマンドとコールバックをマップできるようにしてください。
- `url` はリンクボタンです。`value` なしでも存在できます。
- `webApp` はチャンネルネイティブの Web アプリボタンを記述します。Telegram はこれを
  `web_app` としてレンダリングし、プライベートチャットでのみサポートします。互換性のため、緩い JSON ペイロードでは `web_app` も引き続き
  受け入れられますが、TypeScript の生成側は
  `webApp` を使用してください。
- `label` は必須で、テキストフォールバックでも使用されます。
- `style` は助言的なものです。レンダラーは未対応のスタイルを安全な
  デフォルトにマップし、送信を失敗させないでください。
- `priority` は任意です。チャンネルがアクション制限を告知しており、コントロールを
  削除する必要がある場合、コアは優先度の高いボタンを先に保持し、同じ優先度のボタン間では
  元の順序を維持します。すべてのコントロールが収まる場合は、作者が指定した
  順序が維持されます。
- `disabled` は任意です。チャンネルは `supportsDisabled` で明示的に対応する必要があります。そうでない場合、
  コアは無効化されたコントロールを非インタラクティブなフォールバックテキストに劣化させます。
  無効化されたボタンは、`command` アクションを持っている場合でも、
  フォールバックテキストでは常にラベルのみとしてレンダリングされます。
- `reusable` は任意です。再利用可能なネイティブコールバックをサポートするチャンネルは、
  成功したインタラクションの後もアクションを利用可能なままにできます。更新、確認、詳細表示のような
  反復可能または冪等なアクションに使用し、
  通常の一回限りの承認や破壊的アクションでは未設定のままにします。

選択の意味:

- `options[].action` はボタンの `action` と同じコマンド/コールバックの意味を持ちます。
- `options[].value` はレガシーの選択済みアプリケーション値です。
- `placeholder` は助言的なもので、ネイティブの
  選択サポートがないチャンネルでは無視されることがあります。
- チャンネルが選択をサポートしない場合、フォールバックテキストはラベルを一覧表示します。

## 生成側の例

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

Telegram ミニアプリボタン:

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

明示的な JSON を使うピン留め配信:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## レンダラー契約

チャンネルプラグインは送信アダプター上でレンダリングサポートを宣言します。

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
`limits` は、コアがレンダラーを呼び出す前に適応できる汎用エンベロープを記述します。

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

コアはレンダリング前に、意味を持つコントロールへ汎用制限を適用します。レンダラーは
引き続き、ネイティブブロック
数、カードサイズ、URL 制限、汎用契約では表現できないプロバイダー固有の癖について、最終的なプロバイダー固有の検証と切り詰めを所有します。
制限によってブロック内のすべてのコントロールが削除される場合、コアはラベルを非インタラクティブなコンテキストテキストとして保持し、
配信されたメッセージに可視のフォールバックが残るようにします。

## コアのレンダリングフロー

`ReplyPayload` またはメッセージアクションに `presentation` が含まれる場合、コアは次を行います。

1. プレゼンテーションペイロードを正規化します。
2. 対象チャンネルの送信アダプターを解決します。
3. `presentationCapabilities` を読み取ります。
4. アダプターが告知している場合、アクション数、ラベル長、
   選択オプション数などの汎用機能制限を適用します。
5. アダプターがペイロードをレンダリングできる場合、`renderPresentation` を呼び出します。
6. アダプターが存在しない、またはレンダリングできない場合、保守的なテキストへフォールバックします。
7. 結果のペイロードを通常のチャンネル配信パスで送信します。
8. 最初のメッセージ送信が成功した後、`delivery.pin` などの配信メタデータを適用します。

コアはフォールバック動作を所有するため、生成側はチャンネル非依存でいられます。チャンネル
プラグインはネイティブレンダリングとインタラクション処理を所有します。

## 劣化ルール

プレゼンテーションは制限のあるチャンネルでも安全に送信できる必要があります。

フォールバックテキストには次が含まれます。

- 最初の行としての `title`
- 通常の段落としての `text` ブロック
- コンパクトなコンテキスト行としての `context` ブロック
- 視覚的な区切りとしての `divider` ブロック
- リンクボタンの URL を含むボタンラベル
- 選択オプションのラベル

### ボタン値のフォールバック表示

チャンネルがインタラクティブコントロールをレンダリングできない場合、ボタンと選択の値は
プレーンテキストへフォールバックします。フォールバック動作は、
不透明なコールバックデータを非公開に保ちながら使いやすさを維持します。

- **`command` 型アクション** は `label: \`command\`` としてレンダリングされるため、ユーザーは
  コマンドをコピーし、チャンネル入力で手動実行できます。
- **`callback` 型アクション** とレガシー **`value`** フィールドは
  ラベルのみとしてレンダリングされます。不透明なコールバック値はフォールバックテキストに公開されません。
- **`url` / `webApp`** ボタンは、URL がユーザー向けであるため、
  ボタンラベルと並んで URL テキストをレンダリングします。
- **選択オプション** はラベルのみとしてレンダリングされます。基になるオプション値は
  フォールバックテキストに公開されません。

フォールバック UI に手動コマンド案内を追加するチャンネルアダプター（例:
Feishu ドキュメントコメントの手順）は、フォールバックレンダラーが使用するものと同じプレゼンテーションブロックからコマンド存在チェックを導出する必要があります。これにより、
実際に手動コマンドが表示される場合にのみ案内テキストが表示されます。

未対応のネイティブコントロールは、送信全体を失敗させるのではなく劣化させてください。
例:

- インラインボタンが無効な Telegram はテキストフォールバックを送信します。
- 選択サポートのないチャンネルは、選択オプションをテキストとして一覧表示します。
- URL のみのボタンは、ネイティブリンクボタンまたはフォールバック URL 行になります。
- 任意のピン留め失敗は、配信済みメッセージを失敗にしません。

主な例外は `delivery.pin.required: true` です。ピン留めが必須として要求され、
チャンネルが送信済みメッセージをピン留めできない場合、配信は失敗を報告します。

## プロバイダーマッピング

現在バンドルされているレンダラー:

| チャンネル         | ネイティブレンダーターゲット                      | 注記                                                                                                                                                                                                             |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | コンポーネントとコンポーネントコンテナ       | 既存のプロバイダーネイティブなペイロード生成元のために従来の `channelData.discord.components` を保持しますが、新しい共有送信では `presentation` を使用する必要があります。                                                                 |
| Feishu          | インタラクティブカード                         | カードヘッダーでは `title` を使用できます。本文ではそのタイトルの重複を避けます。                                                                                                                                                  |
| Matrix          | テキストフォールバックと構造化イベントフィールド | ボタン/セレクトはサポート対象として通知されますが、現在すべてのブロックはネイティブのインタラクティブウィジェットではなく、`com.openclaw.presentation` イベントフィールドに入れられた `renderMessagePresentationFallbackText` 出力としてレンダーされます。 |
| Mattermost      | テキストとインタラクティブプロパティ               | セレクトと区切り線はサポートされません。これらのブロックはテキストに劣化します。                                                                                                                                             |
| Microsoft Teams | Adaptive Cards                            | `message` のプレーンテキストは、両方が指定された場合にカードと一緒に含まれます。セレクト、スタイル、無効状態はサポートされません。                                                                                     |
| Slack           | Block Kit                                 | 既存のプロバイダーネイティブなペイロード生成元のために従来の `channelData.slack.blocks` を保持しますが、新しい共有送信では `presentation` を使用する必要があります。                                                                       |
| Telegram        | テキストとインラインキーボード                | ボタン/セレクトには対象サーフェスのインラインボタン機能が必要です。それ以外の場合はテキストフォールバックが使用されます。                                                                                                         |
| プレーンチャンネル  | テキストフォールバック                             | レンダラーのないチャンネルでも読みやすい出力を受け取ります。                                                                                                                                                            |

プロバイダーネイティブなペイロード互換性は、既存の返信生成元のための移行上の便宜です。新しい共有ネイティブフィールドを追加する理由にはなりません。

## Presentation と InteractiveReply

`InteractiveReply` は、承認とインタラクションヘルパーで使用される古い内部サブセットです。これは次をサポートします。

- テキスト
- ボタン
- セレクト

`MessagePresentation` は標準の共有送信コントラクトです。これは次を追加します。

- タイトル
- トーン
- コンテキスト
- 区切り線
- URL専用ボタン
- `ReplyPayload.delivery` を通じた汎用配信メタデータ

古いコードを橋渡しする場合は、`openclaw/plugin-sdk/interactive-runtime` のヘルパーを使用します。
__OC_I18N_900011__
新しいコードは `MessagePresentation` を直接受け入れるか生成する必要があります。既存の `interactive` ペイロードは `presentation` の非推奨サブセットです。古い生成元向けのランタイムサポートは維持されます。

知っておく価値のある非推奨ではないヘルパー:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  は、型付けされていないペイロード（たとえば CLI の `--presentation` フラグからの JSON）を検証し、`MessagePresentation` に強制変換します。
- `isMessagePresentationInteractiveBlock(block)` はブロックを
  `buttons` | `select` ユニオンに絞り込みます。
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` は `action` から有効な
  コマンド/コールバック値を読み取ります。`resolveMessagePresentationControlValue` では従来の `value`
  フィールドにフォールバックします。

従来の `InteractiveReply*` 型と変換ヘルパーは SDK で
`@deprecated` とマークされています。

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, および
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` と
`presentationToInteractiveControlsReply(...)` は、従来のチャンネル実装向けのレンダラー橋渡しとして引き続き利用できます。新しい生成元コードはこれらを呼び出すべきではありません。`presentation` を送信し、コア/チャンネル適応にレンダリングを処理させます。

承認ヘルパーにも presentation 優先の置き換えがあります。

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` の代わりに `buildApprovalPresentationFromActionDescriptors(...)` を使用します
- `buildApprovalInteractiveReply(...)` の代わりに `buildApprovalPresentation(...)` を使用します
- `buildExecApprovalInteractiveReply(...)` の代わりに `buildExecApprovalPresentation(...)` を使用します

`renderMessagePresentationFallbackText(...)` は、区切り線のみの
presentation など、テキストフォールバックを持たない presentation ブロックに対して空文字列を返します。空でない送信本文を必要とするトランスポートは、デフォルトのフォールバックコントラクトを変更せずに最小限の本文を選択するため、`emptyFallback` を渡せます。

## 配信ピン留め

ピン留めは presentation ではなく配信動作です。`channelData.telegram.pin` のようなプロバイダーネイティブフィールドの代わりに `delivery.pin` を使用します。

セマンティクス:

- `pin: true` は、正常に配信された最初のメッセージをピン留めします。
- `pin.notify` のデフォルトは `false` です。
- `pin.required` のデフォルトは `false` です。
- 任意のピン留め失敗は劣化し、送信済みメッセージをそのまま残します。
- 必須のピン留め失敗は配信を失敗させます。
- 分割されたメッセージは末尾のチャンクではなく、最初に配信されたチャンクをピン留めします。

手動の `pin`、`unpin`、および `pins` メッセージアクションは、プロバイダーがそれらの操作をサポートする既存メッセージ向けに引き続き存在します。

## Plugin 作者チェックリスト

- チャンネルがセマンティック presentation をレンダーまたは安全に劣化できる場合、`describeMessageTool(...)` から `presentation` を宣言します。
- ランタイム送信アダプターに `presentationCapabilities` を追加します。
- コントロールプレーンの Plugin セットアップコードではなく、ランタイムコードで `renderPresentation` を実装します。
- ネイティブ UI ライブラリをホットなセットアップ/カタログパスから外します。
- 既知の場合は、`presentationCapabilities.limits` に汎用機能制限を宣言します。
- レンダラーとテストで最終的なプラットフォーム制限を保持します。
- サポートされていないボタン、セレクト、URL ボタン、タイトル/テキストの重複、および `message` と `presentation` が混在する送信に対するフォールバックテストを追加します。
- プロバイダーが送信済みメッセージ ID をピン留めできる場合にのみ、`deliveryCapabilities.pin` と
  `pinDeliveredMessage` を通じて配信ピン留めサポートを追加します。
- 共有メッセージアクションスキーマを通じて、新しいプロバイダーネイティブなカード/ブロック/コンポーネント/ボタンフィールドを公開しないでください。

## 関連ドキュメント

- [Message CLI](/ja-JP/cli/message)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture-internals#message-tool-schemas)
- [チャンネル Presentation リファクタリング計画](/ja-JP/plan/ui-channels)

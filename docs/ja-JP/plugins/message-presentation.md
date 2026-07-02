---
read_when:
    - メッセージカード、ボタン、または選択レンダリングの追加または変更
    - リッチな送信メッセージをサポートするチャネル Plugin の構築
    - メッセージツールの表示または配信機能の変更
    - プロバイダー固有のカード/ブロック/コンポーネントのレンダリング回帰をデバッグする
summary: チャンネル Plugin 向けのセマンティックなメッセージカード、ボタン、選択、フォールバックテキスト、配信ヒント
title: メッセージの表示
x-i18n:
    generated_at: "2026-07-02T22:22:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

メッセージプレゼンテーションは、リッチな送信チャット UI のための OpenClaw の共有コントラクトです。
これにより、エージェント、CLI コマンド、承認フロー、Plugin はメッセージの
意図を一度だけ記述でき、各チャネル Plugin が可能な限り最適なネイティブ形式でレンダリングします。

ポータブルなメッセージ UI にはプレゼンテーションを使用します。

- テキストセクション
- 小さなコンテキスト/フッターテキスト
- 区切り線
- ボタン
- 選択メニュー
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

- `action.type: "command"` は、コアのコマンド
  パスを通じてネイティブのスラッシュコマンドを実行します。組み込みコマンドボタンやメニューにはこれを使用します。
- `action.type: "callback"` は、チャネルの
  インタラクションパスを通じて不透明な Plugin データを運びます。チャネル Plugin はコールバックデータをスラッシュ
  コマンドとして再解釈してはいけません。
- `value` は従来の不透明なコールバック値です。新しいコントロールでは `action`
  を使用し、チャネル Plugin がテキストから推測せずにコマンドとコールバックをマッピングできるようにしてください。
- `url` はリンクボタンです。`value` なしでも存在できます。
- `webApp` はチャネルネイティブの Web アプリボタンを記述します。Telegram はこれを
  `web_app` としてレンダリングし、プライベートチャットでのみサポートします。`web_app` は互換性のために緩い JSON ペイロードではまだ
  受け入れられますが、TypeScript の生成側は
  `webApp` を使用してください。
- `label` は必須で、テキストフォールバックでも使用されます。
- `style` は助言的です。レンダラーは未対応のスタイルを安全な
  デフォルトにマッピングし、送信を失敗させないでください。
- `priority` は任意です。チャネルがアクション制限を広告し、コントロールを
  削除する必要がある場合、コアは優先度の高いボタンを先に保持し、同じ優先度のボタン間では
  元の順序を保持します。すべてのコントロールが収まる場合は、記述された
  順序が保持されます。
- `disabled` は任意です。チャネルは `supportsDisabled` でオプトインする必要があります。そうでない場合、
  コアは無効化されたコントロールを非インタラクティブなフォールバックテキストに劣化させます。
- `reusable` は任意です。再利用可能なネイティブコールバックをサポートするチャネルは、
  正常なインタラクション後もアクションを利用可能なままにできます。更新、検査、詳細表示などの
  反復可能または冪等なアクションに使用してください。
  通常の一回限りの承認や破壊的アクションでは未設定のままにします。

選択のセマンティクス:

- `options[].action` はボタンの `action` と同じコマンド/コールバックの意味を持ちます。
- `options[].value` は従来の選択済みアプリケーション値です。
- `placeholder` は助言的で、ネイティブの
  選択サポートがないチャネルでは無視される場合があります。
- チャネルが選択をサポートしない場合、フォールバックテキストにラベルが一覧表示されます。

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

チャネル Plugin は送信アダプターでレンダーサポートを宣言します。

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

ケイパビリティの真偽値は、レンダラーが何をインタラクティブにできるかを記述します。任意の
`limits` は、レンダラーを呼び出す前にコアが適応できる汎用エンベロープを記述します。

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

コアはレンダリング前に、セマンティックコントロールへ汎用制限を適用します。レンダラーは
ネイティブブロック
数、カードサイズ、URL 制限、汎用コントラクトで表現できないプロバイダー固有の癖について、最終的なプロバイダー固有の検証と切り詰めを
引き続き所有します。制限によってブロックからすべてのコントロールが削除された場合、コアは
配信されたメッセージに可視のフォールバックが残るように、ラベルを非インタラクティブなコンテキストテキストとして保持します。

## コアのレンダーフロー

`ReplyPayload` またはメッセージアクションに `presentation` が含まれる場合、コアは次を行います。

1. プレゼンテーションペイロードを正規化します。
2. 対象チャネルの送信アダプターを解決します。
3. `presentationCapabilities` を読み取ります。
4. アダプターが広告している場合、アクション数、ラベル長、
   選択オプション数などの汎用ケイパビリティ制限を適用します。
5. アダプターがペイロードをレンダリングできる場合、`renderPresentation` を呼び出します。
6. アダプターが存在しない、またはレンダリングできない場合、保守的なテキストにフォールバックします。
7. 結果のペイロードを通常のチャネル配信パスで送信します。
8. 最初の送信メッセージが成功した後、`delivery.pin` などの配信メタデータを適用します。

コアはフォールバック動作を所有するため、生成側はチャネル非依存のままでいられます。チャネル
Plugin はネイティブレンダリングとインタラクション処理を所有します。

## 劣化ルール

プレゼンテーションは制限されたチャネルでも安全に送信できなければなりません。

フォールバックテキストには次が含まれます。

- 最初の行としての `title`
- 通常の段落としての `text` ブロック
- コンパクトなコンテキスト行としての `context` ブロック
- 視覚的な区切りとしての `divider` ブロック
- リンクボタンの URL を含むボタンラベル
- 選択オプションのラベル

### ボタン値フォールバックの可視性

チャネルがインタラクティブコントロールをレンダリングできない場合、ボタンと選択の値は
プレーンテキストにフォールバックします。このフォールバック動作は、不透明なコールバックデータを非公開に保ちながら
使いやすさを維持します。

- **`command` 型アクション** は `label: \`command\`` としてレンダリングされるため、ユーザーは
  コマンドをコピーしてチャネル入力で手動実行できます。
- **`callback` 型アクション** と従来の **`value`** フィールドは
  ラベルのみとしてレンダリングされます。不透明なコールバック値はフォールバックテキストに公開されません。
- **`url` / `webApp`** ボタンは、URL がユーザー向けであるため、
  ボタンラベルとともに URL テキストをレンダリングします。
- **選択オプション** はラベルのみとしてレンダリングされます。基になるオプション値は
  フォールバックテキストに公開されません。

フォールバック UI に手動コマンド案内を追加するチャネルアダプター（例:
Feishu のドキュメントコメント指示）は、フォールバックレンダラーが使用するのと同じプレゼンテーションブロックから
コマンド存在チェックを導出する必要があります。これにより、
手動コマンドが実際に表示される場合にのみ案内テキストが表示されます。

未対応のネイティブコントロールは、送信全体を失敗させるのではなく劣化させるべきです。
例:

- インラインボタンが無効な Telegram はテキストフォールバックを送信します。
- 選択サポートがないチャネルは選択オプションをテキストとして一覧表示します。
- URL のみのボタンは、ネイティブリンクボタンまたはフォールバック URL 行のいずれかになります。
- 任意のピン留め失敗は、配信済みメッセージを失敗にしません。

主な例外は `delivery.pin.required: true` です。ピン留めが必須として要求され、
チャネルが送信メッセージをピン留めできない場合、配信は失敗を報告します。

## プロバイダーマッピング

現在バンドルされているレンダラー:

| チャネル        | ネイティブレンダーターゲット        | 注記                                                                                                                                              |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | コンポーネントとコンポーネントコンテナー | 既存のプロバイダーネイティブペイロード生成側のために、従来の `channelData.discord.components` を維持しますが、新しい共有送信では `presentation` を使用する必要があります。 |
| Slack           | Block Kit                           | 既存のプロバイダーネイティブペイロード生成側のために、従来の `channelData.slack.blocks` を維持しますが、新しい共有送信では `presentation` を使用する必要があります。       |
| Telegram        | テキストとインラインキーボード      | ボタン/選択にはターゲットサーフェスのインラインボタン機能が必要です。ない場合はテキストフォールバックが使用されます。                             |
| Mattermost      | テキストとインタラクティブ props    | その他のブロックはテキストに縮退します。                                                                                                          |
| Microsoft Teams | Adaptive Cards                      | プレーンな `message` テキストは、両方が指定されている場合にカードと一緒に含まれます。                                                            |
| Feishu          | インタラクティブカード              | カードヘッダーでは `title` を使用できます。本文ではそのタイトルの重複を避けます。                                                                |
| プレーンチャネル | テキストフォールバック              | レンダラーのないチャネルでも読みやすい出力を受け取ります。                                                                                        |

プロバイダーネイティブペイロード互換性は、既存の返信生成側のための移行上の便宜です。
新しい共有ネイティブフィールドを追加する理由にはなりません。

## Presentation と InteractiveReply

`InteractiveReply` は、承認とインタラクションヘルパーで使用される古い内部サブセットです。
次をサポートします。

- テキスト
- ボタン
- 選択

`MessagePresentation` は標準の共有送信契約です。次を追加します。

- タイトル
- トーン
- コンテキスト
- 区切り線
- URL 専用ボタン
- `ReplyPayload.delivery` を通じた汎用配信メタデータ

古いコードをブリッジする場合は、`openclaw/plugin-sdk/interactive-runtime` のヘルパーを使用します。
__OC_I18N_900011__
新しいコードは `MessagePresentation` を直接受け取るか生成する必要があります。既存の
`interactive` ペイロードは `presentation` の非推奨サブセットです。古い生成側のためにランタイム
サポートは残ります。

従来の `InteractiveReply*` 型と変換ヘルパーは SDK で
`@deprecated` とマークされています。

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
`presentationToInteractiveControlsReply(...)` は、従来のチャネル実装向けのレンダラーブリッジとして引き続き利用できます。
新しい生成側コードはこれらを呼び出すべきではありません。`presentation` を送信し、core/チャネル適応にレンダリングを処理させてください。

承認ヘルパーにも Presentation 優先の代替があります。

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` の代わりに
  `buildApprovalPresentationFromActionDescriptors(...)` を使用する
- `buildApprovalInteractiveReply(...)` の代わりに
  `buildApprovalPresentation(...)` を使用する
- `buildExecApprovalInteractiveReply(...)` の代わりに
  `buildExecApprovalPresentation(...)` を使用する

`renderMessagePresentationFallbackText(...)` は、区切り線のみの
presentation など、テキストフォールバックを持たない presentation ブロックに対して空文字列を返します。
空でない送信本文が必要なトランスポートは、デフォルトのフォールバック契約を変更せずに最小本文を選択するために
`emptyFallback` を渡せます。

## 配信ピン留め

ピン留めは配信動作であり、presentation ではありません。`channelData.telegram.pin` などの
プロバイダーネイティブフィールドではなく、`delivery.pin` を使用します。

セマンティクス:

- `pin: true` は、正常に配信された最初のメッセージをピン留めします。
- `pin.notify` のデフォルトは `false` です。
- `pin.required` のデフォルトは `false` です。
- 任意のピン留め失敗は縮退し、送信済みメッセージをそのまま残します。
- 必須のピン留め失敗は配信を失敗させます。
- チャンク化されたメッセージは、末尾チャンクではなく最初に配信されたチャンクをピン留めします。

プロバイダーがそれらの操作をサポートする既存メッセージについては、手動の `pin`、`unpin`、`pins` メッセージアクションも引き続き存在します。

## Plugin 作者チェックリスト

- チャネルがセマンティック presentation をレンダリングまたは安全に縮退できる場合は、`describeMessageTool(...)` から `presentation` を宣言する。
- ランタイム送信アダプターに `presentationCapabilities` を追加する。
- コントロールプレーンの Plugin セットアップコードではなく、ランタイムコードで `renderPresentation` を実装する。
- ネイティブ UI ライブラリをホットセットアップ/カタログパスから外しておく。
- 既知の場合は、`presentationCapabilities.limits` で汎用機能制限を宣言する。
- レンダラーとテストで最終的なプラットフォーム制限を維持する。
- サポートされていないボタン、選択、URL ボタン、タイトル/テキストの重複、`message` と `presentation` の混在送信に対するフォールバックテストを追加する。
- プロバイダーが送信済みメッセージ ID をピン留めできる場合にのみ、`deliveryCapabilities.pin` と
  `pinDeliveredMessage` を通じて配信ピン留めサポートを追加する。
- 共有メッセージアクションスキーマを通じて、新しいプロバイダーネイティブのカード/ブロック/コンポーネント/ボタンフィールドを公開しない。

## 関連ドキュメント

- [メッセージ CLI](/ja-JP/cli/message)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture-internals#message-tool-schemas)
- [チャネル Presentation リファクタリング計画](/ja-JP/plan/ui-channels)

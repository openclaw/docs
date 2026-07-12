---
read_when:
    - メッセージカード、チャート、テーブル、ボタン、または選択項目のレンダリングの追加または変更
    - リッチな送信メッセージをサポートするチャネルPluginの構築
    - メッセージツールの表示または配信機能の変更
    - プロバイダー固有のカード／ブロック／コンポーネントのレンダリング回帰をデバッグする
summary: チャンネル Plugin 向けのセマンティックなメッセージカード、グラフ、表、コントロール、フォールバックテキスト、配信ヒント
title: メッセージの表示
x-i18n:
    generated_at: "2026-07-12T14:43:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

メッセージプレゼンテーションは、リッチな送信チャット UI に対する OpenClaw の共有契約です。
これにより、エージェント、CLI コマンド、承認フロー、plugins はメッセージの意図を一度記述するだけで、
各チャンネル Plugin が可能な限り最適なネイティブ形式でレンダリングできます。

プレゼンテーションは、移植可能なメッセージ UI に使用します。テキストセクション、小さなコンテキスト／フッター
テキスト、区切り線、チャート、テーブル、ボタン、選択メニュー、カードのタイトル／トーンに対応します。

Discord の `components`、Slack の `blocks`、Telegram の `buttons`、
Teams の `card`、Feishu の `card` など、プロバイダー固有の新しいフィールドを共有
メッセージツールに追加しないでください。これらはチャンネル Plugin が所有するレンダラー出力です。

## 契約

Plugin 作成者は、次の場所から公開契約をインポートします。

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

構造:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** 従来のコールバック値。新しいコントロールでは action を推奨します。 */
  value?: string;
  /** @deprecated type が "url" の action を使用してください。 */
  url?: string;
  /** @deprecated type が "web-app" の action を使用してください。 */
  webApp?: { url: string };
  /** @deprecated type が "web-app" の action を使用してください。 */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** 従来のコールバック値。新しいコントロールでは action を推奨します。 */
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

- `action.type: "command"` は、コアのコマンドパスを通じてネイティブのスラッシュコマンドを
  実行します。組み込みコマンドのボタンとメニューにはこれを使用します。
- `action.type: "callback"` は、チャンネルのインタラクションパスを通じて不透明な Plugin データを
  運びます。チャンネル plugins は、コールバックデータをスラッシュコマンドとして再解釈しては
  なりません。
- `action.type: "approval"` は、永続的なオペレーター承認を 1 つ、その明示的な
  `exec` または `plugin` の種別、および要求された決定とともに識別します。チャンネル plugins は
  そのアクションをトランスポート専用のコールバックにエンコードし、承認サービスを通じて
  解決します。`/approve` コマンドテキストを解析したり、ID から種別を推測したりしては
  なりません。
- `action.type: "url"` は通常のリンクを開きます。
- `action.type: "web-app"` はチャンネルネイティブの Web アプリを起動します。
- `value` は従来の不透明なコールバック値です。新しいコントロールでは `action` を使用して、
  チャンネル plugins がテキストから推測せずにコマンドとコールバックをマッピングできるように
  する必要があります。
- `url`、`webApp`、`web_app` は、非推奨の境界入力として引き続き受け付けられます。
  ノーマライザーはこれらのフィールドを保持するため、レンダラーはリリース済みの従来の
  セマンティクスと明示的な型付きアクションを区別できます。新しい生成元では `action` を使用してください。
- `label` は必須であり、テキストフォールバックにも使用されます。
- `style` は推奨情報です。レンダラーは未対応のスタイルを安全な
  デフォルトにマッピングし、送信を失敗させないでください。
- `priority` は任意です。チャンネルがアクション制限を公開していてコントロールを
  削除する必要がある場合、コアは優先度の高いボタンを先に保持し、
  優先度が同じボタン間では元の順序を維持します。すべてのコントロールが収まる場合は、作成時の
  順序が維持されます。
- `disabled` は任意です。チャンネルは `supportsDisabled` で明示的に対応する必要があります。それ以外の場合、
  コアは無効化されたコントロールを非インタラクティブなフォールバックテキストに変換します。
  無効化されたボタンは、`command` アクションを持つ場合でも、フォールバックテキストでは
  常にラベルのみでレンダリングされます。
- `reusable` は任意です。再利用可能なネイティブコールバックに対応するチャンネルは、
  インタラクションが成功した後もアクションを利用可能な状態に維持できます。更新、検査、詳細表示など、
  繰り返し可能または冪等なアクションに使用してください。通常の 1 回限りの承認や破壊的なアクションでは
  設定しないでください。

選択のセマンティクス:

- `options[].action` が受け付けるのは `command` または `callback` のみです。承認アクションとリンクアクションはボタン専用です。
- `options[].value` は従来の選択済みアプリケーション値です。
- `placeholder` は推奨情報であり、ネイティブの選択機能に対応していないチャンネルでは
  無視される場合があります。
- チャンネルが選択に対応していない場合、フォールバックテキストにラベルの一覧が表示されます。

チャートのセマンティクス:

- `pie` には正のセグメント値が必要です。
- `bar`、`area`、`line` は、順序付けられた 1 つの `categories` 配列を使用します。各系列は、
  同じ順序でカテゴリごとに有限値をちょうど 1 つ指定します。
- カテゴリラベルと系列名は一意である必要があります。無効または不完全なチャート
  ブロックは、データを暗黙に変更するのではなく、正規化時に削除されます。
- ネイティブのチャートレンダリングは、`presentationCapabilities.charts` によるオプトインです。
  その他のチャンネルには、チャートのタイトル、軸、カテゴリ、系列、値が
  決定論的なテキストとして渡されます。これはアクセシビリティのフォールバックとしても機能します。

テーブルのセマンティクス:

- `caption` は必須の短い見出しです。`headers` には、一意で空でない列ラベルを
  少なくとも 1 つ含める必要があります。
- `rows` には少なくとも 1 行が必要です。各行にはヘッダーごとにセルをちょうど 1 つ含め、
  各セルは空でない文字列または有限数である必要があります。
- `rowHeaderColumnIndex` は、ネイティブレンダラーでセルを行ヘッダーとして公開する列を
  識別する、任意のゼロベースインデックスです。
- テーブルの正規化はアトミックです。無効なキャプション、ヘッダー、行幅、セル、
  または行ヘッダーインデックスがある場合、データを切り詰めたり修復したりせず、
  テーブルブロック全体を削除します。
- ネイティブのテーブルレンダリングは、`presentationCapabilities.tables` によるオプトインです。
  その他のチャンネルには、キャプションとすべての行が決定論的な線形
  テキストとして渡され、内部の空白はまとめられます。

  ```text
  未完了のパイプライン（テーブル）
  - アカウント: Acme; ステージ: 成約; ARR: 125000
  - アカウント: Globex; ステージ: レビュー; ARR: 82000
  ```

独立した `report` 判別子はありません。`title`、`tone`、`text`、`context`、
`chart`、`table`、アクションブロックを組み合わせてレポートを構成します。これにより、各
ブロックを個別にレンダリングでき、完全なレポートにも同じ
決定論的なテキストフォールバックが提供されます。

## 生成元の例

シンプルなカード:

```json
{
  "title": "デプロイの承認",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary を昇格する準備が整いました。" },
    { "type": "context", "text": "ビルド 1234、ステージングに合格しました。" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "承認",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "却下",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

URL のみのリンクボタン:

```json
{
  "blocks": [
    { "type": "text", "text": "リリースノートの準備ができました。" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "ノートを開く",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
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
      "buttons": [
        {
          "label": "起動",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

選択メニュー:

```json
{
  "title": "環境を選択",
  "blocks": [
    {
      "type": "select",
      "placeholder": "環境",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "本番環境", "value": "env:prod" }
      ]
    }
  ]
}
```

チャート:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "四半期売上高",
      "categories": ["Q1", "Q2", "Q3"],
      "series": [
        { "name": "製品", "values": [120, 145, 138] },
        { "name": "サービス", "values": [80, 95, 104] }
      ],
      "xLabel": "四半期",
      "yLabel": "売上高"
    }
  ]
}
```

テーブルレポート:

```json
{
  "title": "パイプラインレポート",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "ステージ別の現在の商談です。" },
    {
      "type": "table",
      "caption": "未完了のパイプライン",
      "headers": ["アカウント", "ステージ", "ARR"],
      "rows": [
        ["Acme", "成約", 125000],
        ["Globex", "レビュー", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "CRM スナップショットから更新されました。" }
  ]
}
```

CLI 送信:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "デプロイの承認" \
  --presentation '{"title":"デプロイの承認","tone":"warning","blocks":[{"type":"text","text":"Canary の準備が整いました。"},{"type":"buttons","buttons":[{"label":"承認","value":"deploy:approve","style":"success"},{"label":"却下","value":"deploy:decline","style":"danger"}]}]}'
```

ピン留め配信:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "トピックを開きました" \
  --pin
```

明示的な JSON を使用したピン留め配信:

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

チャンネル plugins は、送信アダプターでレンダリング対応を宣言します。

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
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

機能のブール値は、レンダラーが何をインタラクティブにできるかを示します。任意の
`limits` は、レンダラーを呼び出す前にコアが適応できる汎用的な上限を示します。

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

Core は、レンダリング前にセマンティックコントロールへ汎用制限を適用します。レンダラーは引き続き、ネイティブブロック数、カードサイズ、URL 制限、および汎用コントラクトでは表現できないプロバイダー固有の挙動について、最終的な検証と切り詰めを担当します。制限によってブロックからすべてのコントロールが削除された場合、Core はラベルを非インタラクティブなコンテキストテキストとして保持し、配信されたメッセージに表示可能なフォールバックが残るようにします。

## Core のレンダリングフロー

CLI および標準メッセージアクションで使用される正規の送信パスでは、Core は次の処理を行います。

1. プレゼンテーションペイロードを正規化します。
2. 対象チャンネルの送信アダプターを解決します。
3. `presentationCapabilities` を読み取ります。
4. アダプターで宣言されている場合、アクション数、ラベル長、選択肢数などの汎用的な機能制限を適用します。アダプターがそれぞれ `charts: true` または `tables: true` を明示的に宣言していない限り、チャートおよびテーブルブロックは決定論的なテキストになります。
5. アダプターがペイロードをレンダリングできる場合、`renderPresentation` を呼び出します。
6. アダプターが存在しない場合、またはレンダリングできない場合は、保守的なテキストへフォールバックします。
7. 生成されたペイロードを通常のチャンネル配信パスで送信します。
8. 最初のメッセージが正常に送信された後、`delivery.pin` などの配信メタデータを適用します。

`ReplyPayload` を直接使用するチャンネルローカルの返信またはプレビュー経路は、その正規パスに入るか、ペイロードをプレーンテキスト／メディアへ投影する前に、同じプレゼンテーションフォールバックを具体化する必要があります。

プロデューサーがチャンネルに依存しない状態を維持できるよう、Core がフォールバック動作を担当します。チャンネル Plugin は、ネイティブレンダリングとインタラクション処理を担当します。

## 機能低下時のルール

プレゼンテーションは、機能が制限されたチャンネルでも安全に送信できる必要があります。

フォールバックテキストには次の内容が含まれます。

- 最初の行に `title`
- `text` ブロックは通常の段落として表示
- `context` ブロックは簡潔なコンテキスト行として表示
- `divider` ブロックは視覚的な区切りとして表示
- リンクボタンの URL を含むボタンラベル
- 選択肢のラベル
- チャートのタイトル、種類、軸、カテゴリ、系列、値
- テーブルのキャプション、ヘッダー、すべての行の値

### ボタン値のフォールバックの表示可否

チャネルがインタラクティブなコントロールをレンダリングできない場合、ボタンと選択項目の値はプレーンテキストにフォールバックします。このフォールバック動作は、不透明なコールバックデータを非公開に保ちながら、操作性を維持します。

- **`command`型のアクション**は、`label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**としてレンダリングされます。
  URL はユーザーに表示されるため、入力ではボタンラベルとともに URL テキストが
  レンダリングされます。
- **選択オプション**はラベルのみでレンダリングされます。基になるオプション値は
  フォールバックテキストには表示されません。

フォールバック UI に手動コマンドの案内（例:
Feishu のドキュメントコメント手順）を追加するチャネルアダプターは、フォールバックレンダラーが使用するものと同じプレゼンテーションブロックから
コマンドの存在チェックを導出し、手動コマンドが実際に表示される場合にのみ
案内テキストが表示されるようにする必要があります。

サポートされていないネイティブコントロールがある場合は、送信全体を失敗させるのではなく、代替表示にフォールバックする必要があります。
例：

- インラインボタンが無効になっている Telegram では、テキストのフォールバックを送信します。
- 選択機能をサポートしていないチャンネルでは、選択肢をテキストとして一覧表示します。
- ネイティブのグラフをサポートしていないチャンネルでは、グラフデータをテキストとして一覧表示します。
- ネイティブのテーブルをサポートしていないチャンネルでは、テーブルの各行をテキストとして一覧表示します。
- URL のみのボタンは、ネイティブのリンクボタンまたはフォールバックの URL 行になります。
- オプションのピン留めに失敗しても、配信済みメッセージは失敗扱いになりません。

主な例外は `delivery.pin.required: true` です。ピン留めが必須として要求され、
チャンネルが送信済みメッセージをピン留めできない場合、配信は失敗として報告されます。

## プロバイダーマッピング

現在バンドルされているレンダラー：

| チャンネル      | ネイティブレンダリング先                          | 注記                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | コンポーネントとコンポーネントコンテナ            | 既存のプロバイダーネイティブなペイロード生成元向けに従来の `channelData.discord.components` を維持しますが、新しい共有送信では `presentation` を使用してください。                                                                                              |
| Feishu          | インタラクティブカード                            | カードヘッダーには `title` を使用できます。本文ではそのタイトルの重複を避けます。                                                                                                                                                                             |
| Matrix          | テキストフォールバックと構造化イベントフィールド | ボタンと選択肢はサポート対象として通知されますが、現在の各ブロックはネイティブなインタラクティブウィジェットではなく、`com.openclaw.presentation` イベントフィールドで伝達される `renderMessagePresentationFallbackText` の出力としてレンダリングされます。 |
| Mattermost      | テキストとインタラクティブプロパティ              | 選択肢と区切り線はサポートされません。これらのブロックはテキストにフォールバックします。                                                                                                                                                                       |
| Microsoft Teams | Adaptive Cards                                    | 両方が指定されている場合、プレーンな `message` テキストがカードとともに含まれます。選択肢、スタイル、無効状態はサポートされません。                                                                                                                            |
| Slack           | Block Kit                                         | `chart` はネイティブの `data_visualization`、`table` はネイティブの `data_table` としてレンダリングします。従来の `channelData.slack.blocks` は維持されますが、新しい共有送信では `presentation` を使用してください。                                      |
| Telegram        | テキストとインラインキーボード                    | ボタンと選択肢には、対象サーフェスのインラインボタン機能が必要です。使用できない場合は、テキストフォールバックが使用されます。                                                                                                                                 |
| プレーンチャンネル | テキストフォールバック                         | レンダラーのないチャンネルでも、読みやすい出力が得られます。                                                                                                                                                                                                  |

プロバイダーネイティブなペイロード互換性は、既存の返信生成元向けの移行支援です。
新しい共有ネイティブフィールドを追加する理由にはなりません。

## Presentation と InteractiveReply の比較

`InteractiveReply` は、承認およびインタラクションヘルパーで使用される従来の内部サブセットです。
次をサポートします。

- テキスト
- ボタン
- 選択肢

`MessagePresentation` は、標準の共有送信コントラクトです。次が追加されています。

- タイトル
- トーン
- コンテキスト
- 区切り線
- グラフ
- テーブル
- URL 専用ボタン
- `ReplyPayload.delivery` を介した汎用配信メタデータ

従来のコードを橋渡しする場合は、`openclaw/plugin-sdk/interactive-runtime` のヘルパーを使用してください。
__OC_I18N_900014__
新しいコードでは、`MessagePresentation` を直接受け入れるか生成してください。既存の
`interactive` ペイロードは、非推奨となった `presentation` のサブセットです。従来の
生成元向けのランタイムサポートは維持されています。

把握しておくべき非推奨ではないヘルパーは次のとおりです。

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  は、型のないペイロード（たとえば、CLI の `--presentation` フラグからの JSON）を検証し、
  `MessagePresentation` に変換します。
- `isMessagePresentationInteractiveBlock(block)` は、ブロックを
  `buttons` | `select` のユニオン型に絞り込みます。
- `resolveMessagePresentationButtonAction(button)` と
  `resolveMessagePresentationOptionAction(option)` は、非推奨の境界フィールドを受け入れながら、
  標準の型付きアクションを返します。明示的な `action` が常に優先されます。
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` は、コマンドまたはコールバックの
  スカラー値のみを読み取ります。スカラーでない標準アクションが従来のシャドウ `value` に
  フォールスルーすることはないため、承認 ID とリンク先の型が維持されます。
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` は、チャンネル固有のフォールバックパス向けに、
  1 つの構造化データブロックを決定的なテキストとしてレンダリングします。

従来の `InteractiveReply*` 型と変換ヘルパーは、SDK で
`@deprecated` とマークされています。

- `InteractiveReply`、`InteractiveReplyBlock`、`InteractiveReplyButton`、
  `InteractiveReplyOption`、`InteractiveReplySelectBlock`、および
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` と
`presentationToInteractiveControlsReply(...)` は、従来のチャンネル実装向けのレンダラー
ブリッジとして引き続き使用できます。新しい生成元コードからは呼び出さないでください。
`presentation` を送信し、コアまたはチャンネルの適応処理にレンダリングを任せてください。

承認ヘルパーにも、Presentation を優先する代替があります。

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` の代わりに
  `buildApprovalPresentationFromActionDescriptors(...)` を使用します
- `buildApprovalInteractiveReply(...)` の代わりに
  `buildApprovalPresentation(...)` を使用します
- `buildExecApprovalInteractiveReply(...)` の代わりに
  `buildExecApprovalPresentation(...)` を使用します

出荷済みのこれらのビルダーは、Plugin 互換性のため、引き続きコマンドを基盤とします。永続的な承認種別を
所有する Gateway および同梱チャンネルコードでは、
`buildTypedApprovalPresentation(...)`、
`buildTypedExecApprovalPendingReplyPayload(...)`、または
`buildTypedPluginApprovalPendingReplyPayload(...)` を使用してください。これにより、トランスポートは
`/approve` テキストからセマンティクスを推測する代わりに、明示的な `approval` アクションを受け取ります。

`renderMessagePresentationFallbackText(...)` は、区切り線のみの
Presentation など、テキストフォールバックのない Presentation ブロックに対して空文字列を返します。
空でない送信本文を必要とするトランスポートは、`emptyFallback` を渡すことで、デフォルトのフォールバック
コントラクトを変更せずに最小限の本文を使用できます。

## 配信ピン

ピン留めは配信動作であり、プレゼンテーションではありません。
`channelData.telegram.pin` などのプロバイダー固有フィールドではなく、`delivery.pin` を使用してください。

セマンティクス:

- `pin: true` は、最初に正常に配信されたメッセージをピン留めします。
- `pin.notify` のデフォルトは `false` です。
- `pin.required` のデフォルトは `false` です。
- オプションのピン留めに失敗した場合は機能を縮退させ、送信済みメッセージはそのまま残します。
- 必須のピン留めに失敗した場合は、配信を失敗させます。
- チャンク化されたメッセージでは、末尾のチャンクではなく、最初に配信されたチャンクをピン留めします。

プロバイダーが該当する操作をサポートしている場合、既存のメッセージに対する手動の `pin`、`unpin`、`pins` メッセージアクションも引き続き利用できます。

## Plugin 作者向けチェックリスト

- チャネルがセマンティックなプレゼンテーションをレンダリングできるか、安全に機能を縮退できる場合は、`describeMessageTool(...)` から `presentation` を宣言します。
- ランタイムの送信アダプターに `presentationCapabilities` を追加します。
- `renderPresentation` は、コントロールプレーンの Plugin セットアップコードではなく、ランタイムコードに実装します。
- ネイティブ UI ライブラリを、頻繁に実行されるセットアップやカタログのパスに含めないでください。
- 汎用的な機能制限が既知の場合は、`presentationCapabilities.limits` で宣言します。
- 最終的なプラットフォーム制限を、レンダラーとテストで維持します。
- サポートされていないチャート、テーブル、ボタン、選択項目、URL ボタン、タイトルとテキストの重複、および `message` と `presentation` を併用する送信について、フォールバックテストを追加します。
- プロバイダーが送信済みメッセージ ID をピン留めできる場合に限り、`deliveryCapabilities.pin` と `pinDeliveredMessage` を通じて配信時のピン留めをサポートします。
- 共有メッセージアクションスキーマを通じて、新しいプロバイダー固有のカード、ブロック、コンポーネント、ボタンのフィールドを公開しないでください。

## 関連ドキュメント

- [メッセージ CLI](/ja-JP/cli/message)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture-internals#message-tool-schemas)
- [チャネルプレゼンテーションのリファクタリング計画](/ja-JP/plan/ui-channels)

---
read_when:
    - Mattermost のセットアップ
    - Mattermost ルーティングのデバッグ
sidebarTitle: Mattermost
summary: Mattermost ボットのセットアップと OpenClaw の設定
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T11:22:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

ステータス: ダウンロード可能なPlugin（ボットトークン + WebSocketイベント）。チャンネル、プライベートチャンネル、グループDM、DMに対応しています。Mattermostはセルフホスト可能なチームメッセージングプラットフォームです（[mattermost.com](https://mattermost.com)）。

## インストール

<Tabs>
  <Tab title="npmレジストリ">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="ローカルチェックアウト">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

<Steps>
  <Step title="Pluginが利用可能であることを確認する">
    上記のコマンドで`@openclaw/mattermost`をインストールし、Gatewayがすでに実行中の場合は再起動します。
  </Step>
  <Step title="Mattermostボットを作成する">
    Mattermostボットアカウントを作成し、**ボットトークン**をコピーして、読み取り対象のチームとチャンネルにボットを追加します。
  </Step>
  <Step title="ベースURLをコピーする">
    Mattermostの**ベースURL**（例: `https://chat.example.com`）をコピーします。末尾の`/api/v4`は自動的に削除されます。
  </Step>
  <Step title="OpenClawを設定してGatewayを起動する">
    最小構成:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    非対話式の代替方法:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
プライベート/LAN/tailnetアドレス上のセルフホストMattermost: Mattermost APIへの送信リクエストは、デフォルトでプライベートIPと内部IPをブロックするSSRFガードを通過します。`channels.mattermost.network.dangerouslyAllowPrivateNetwork: true`でオプトインしてください（アカウント単位: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## ネイティブスラッシュコマンド

ネイティブスラッシュコマンドはオプトインです。有効にすると、OpenClawはボットが所属するすべてのチームに`oc_*`スラッシュコマンドを登録し、GatewayのHTTPサーバーでコールバックPOSTを受信します。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // MattermostがGatewayに直接到達できない場合に使用します（リバースプロキシ/公開URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

登録されるコマンド: `/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。`nativeSkills: true`を指定すると、skillコマンドも`/oc_<skill>`として登録されます。

<AccordionGroup>
  <Accordion title="動作に関する注意事項">
    - `native`と`nativeSkills`のデフォルトは`"auto"`で、Mattermostでは無効として解決されます。明示的に`true`に設定してください。
    - `callbackPath`のデフォルトは`/api/channels/mattermost/command`です。
    - `callbackUrl`を省略すると、OpenClawは`http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`を導出します。ワイルドカードのバインドホスト（`0.0.0.0`、`::`）は`localhost`にフォールバックします。
    - 複数アカウント構成では、`commands`をトップレベルまたは`channels.mattermost.accounts.<id>.commands`配下に設定できます（アカウントの値がトップレベルのフィールドより優先されます）。
    - 他の連携によって作成された同じトリガーの既存スラッシュコマンドは変更されません（登録時にスキップされます）。ボットが作成したコマンドは、コールバックURLにずれが生じると更新または再作成されます。
    - コマンドのコールバックは、OpenClawが`oc_*`コマンドを登録したときにMattermostから返されるコマンド単位のトークンで検証されます。
    - OpenClawは各コールバックを受け入れる前に現在のMattermostコマンド登録を更新するため、削除または再生成されたスラッシュコマンドの古いトークンは、Gatewayを再起動しなくても受け入れられなくなります。
    - Mattermost APIでコマンドが現在も有効であることを確認できない場合、コールバック検証はフェイルクローズします。失敗した検証は短時間キャッシュされ、同時ルックアップはまとめられ、新規ルックアップの開始はリプレイ負荷を抑えるためコマンド単位でレート制限されます。
    - 登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが解決されたコマンドの登録済みトークンと一致しない場合、スラッシュコールバックはフェイルクローズします（あるコマンドで有効なトークンを使用して、別のコマンドの上流検証に到達することはできません）。
    - 受け入れられたコールバックには、一時的な「処理中...」という応答で確認が返されます。実際の回答は通常のメッセージとして届きます。

  </Accordion>
  <Accordion title="到達可能性の要件">
    コールバックエンドポイントはMattermostサーバーから到達可能である必要があります。

    - MattermostがOpenClawと同じホスト/ネットワーク名前空間で実行されていない限り、`callbackUrl`を`localhost`に設定しないでください。
    - そのURLが`/api/channels/mattermost/command`をOpenClawにリバースプロキシしていない限り、`callbackUrl`をMattermostのベースURLに設定しないでください。
    - 簡単な確認方法は`curl https://<gateway-host>/api/channels/mattermost/command`です。GETでは`404`ではなく、OpenClawから`405 Method Not Allowed`が返される必要があります。

  </Accordion>
  <Accordion title="Mattermostの送信先許可リスト">
    コールバックの送信先がプライベート/tailnet/内部アドレスの場合は、Mattermostの`ServiceSettings.AllowedUntrustedInternalConnections`にコールバックのホスト/ドメインを含めます。

    完全なURLではなく、ホスト/ドメインのエントリを使用してください。

    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境変数（デフォルトアカウント）

環境変数を使用する場合は、Gatewayホストで次を設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境変数は**デフォルト**アカウント（`default`）にのみ適用されます。他のアカウントでは設定値を使用する必要があります。

`MATTERMOST_URL`はワークスペースの`.env`から設定できません。[ワークスペースの.envファイル](/ja-JP/gateway/security)を参照してください。
</Note>

## チャットモード

MattermostはDMに自動的に応答します。チャンネルでの動作は`chatmode`で制御します。

<Tabs>
  <Tab title="oncall（デフォルト）">
    チャンネルで@メンションされた場合にのみ応答します。
  </Tab>
  <Tab title="onmessage">
    チャンネルのすべてのメッセージに応答します。
  </Tab>
  <Tab title="onchar">
    メッセージがトリガープレフィックスで始まる場合に応答します。
  </Tab>
</Tabs>

設定例:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // デフォルト
    },
  },
}
```

注意事項:

- `onchar`でも、明示的な@メンションには応答します。
- `channels.mattermost.requireMention`も引き続き適用されますが、`chatmode`が推奨されます。チャンネル単位の`groups.<channelId>.requireMention`設定は、どちらよりも優先されます。
- ボットがチャンネルスレッドで表示される応答を送信した後は、同じスレッド内の後続メッセージに新しい@メンションや`onchar`プレフィックスがなくても応答するため、複数ターンのスレッド会話が継続します。参加状態は、ボットがそのスレッドで最後に応答してから7日間記憶され、Gatewayの再起動後も維持されます。ボットが観測しただけのスレッドには影響しません。明示的なメンションを再び必須にするには、新しいトップレベルメッセージを開始します。

## スレッドとセッション

`channels.mattermost.replyToMode`を使用して、チャンネルやグループへの応答をメインチャンネルに残すか、トリガーとなった投稿の配下でスレッドを開始するかを制御します。

- `off`（デフォルト）: 受信投稿がすでにスレッド内にある場合にのみ、スレッド内で応答します。
- `first`: トップレベルのチャンネル/グループ投稿では、その投稿の配下にスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
- `all`と`batched`: 現在のMattermostでは`first`と同じ動作です。Mattermostでスレッドルートが作成されると、後続のチャンクとメディアも同じスレッドに送られるためです。
- `replyToMode`が設定されている場合でも、ダイレクトメッセージのデフォルトは`off`です。

`channels.mattermost.replyToModeByChatType`を使用して、`direct`、`group`、または`channel`チャットのモードを上書きします。ダイレクトメッセージでスレッドを使用するには、`direct`を設定します。

- `off`（デフォルト）: ダイレクトメッセージはスレッド化されず、1つの継続セッションに残ります。
- `first`、`all`、または`batched`: 各トップレベルのダイレクトメッセージは、新しい独立したセッションを使用するMattermostスレッドを開始します。

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

注意事項:

- スレッドスコープのセッションでは、トリガーとなった投稿IDをスレッドルートとして使用します。
- `first`と`all`は現在同等です。Mattermostでスレッドルートが作成されると、後続のチャンクとメディアも同じスレッドに送られるためです。
- チャットタイプ単位の上書きは`replyToMode`より優先されます。`direct`の上書きがない場合、既存のデプロイではフラットでスレッド化されないDMが維持されます。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（不明な送信者にはペアリングコードが送られます）。その他の値: `allowlist`、`open`、`disabled`。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開DM: `channels.mattermost.dmPolicy="open"`と`channels.mattermost.allowFrom=["*"]`（設定スキーマによってワイルドカードが強制されます）。
- `channels.mattermost.allowFrom`はユーザーID（推奨）と`accessGroup:<name>`エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## チャンネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（メンション必須）。
- `channels.mattermost.groupAllowFrom`で送信者を許可リストに追加します（ユーザーIDを推奨）。
- `channels.mattermost.groupAllowFrom`は`accessGroup:<name>`エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。
- チャンネル単位のメンション上書きは`channels.mattermost.groups.<channelId>.requireMention`配下に配置し、デフォルトには`channels.mattermost.groups["*"].requireMention`を使用します。
- `@username`の照合は可変であり、`channels.mattermost.dangerouslyAllowNameMatching: true`の場合にのみ有効になります。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"`（メンション必須）。
- 解決順序: `channels.mattermost.groupPolicy`、次に`channels.defaults.groupPolicy`、最後に`"allowlist"`。
- ランタイムに関する注意: `channels.mattermost`セクションが完全に欠けている場合、ランタイムはグループチェックを`groupPolicy="allowlist"`にフェイルクローズし（`channels.defaults.groupPolicy`が設定されている場合も同様）、1回限りの警告をログに記録します。

例:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 外向き配信の送信先

`openclaw message send`またはcron/webhookでは、次の送信先形式を使用します。

| 送信先                              | 配信先                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | IDで指定したチャンネル                                                 |
| `channel:<name>`または`#channel-name` | 名前で指定したチャンネル（ボットが所属するチーム全体を検索） |
| `user:<id>`または`mattermost:<id>`    | 指定したユーザーとのDM                                             |
| `@username`                         | DM（Mattermost APIでユーザー名を解決）                 |

外向き送信でサポートされる添付ファイルは、メッセージごとに最大1つです。複数のファイルは別々に送信してください。

<Warning>
プレフィックスのない不透明なID（`64ifufp...`など）は、Mattermostでは**曖昧**です（ユーザーIDかチャンネルIDかを判別できません）。

OpenClawは**ユーザー優先**で解決します。

- IDがユーザーとして存在する場合（`GET /api/v4/users/<id>`が成功する場合）、OpenClawは`/api/v4/channels/direct`でダイレクトチャンネルを解決し、**DM**を送信します。
- それ以外の場合、IDは**チャンネルID**として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。
</Warning>

## DMチャンネルの再試行

OpenClaw が Mattermost の DM ターゲットへ送信する際、最初にダイレクトチャンネルを解決する必要がある場合、デフォルトではダイレクトチャンネル作成時の一時的な失敗を再試行します。

Mattermost Plugin 全体でこの動作を調整するには `channels.mattermost.dmChannelRetry` を、1 つのアカウントで調整するには `channels.mattermost.accounts.<id>.dmChannelRetry` を使用します。デフォルト:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

注:

- これはすべての Mattermost API 呼び出しではなく、DM チャンネルの作成（`/api/v4/channels/direct`）にのみ適用されます。
- 再試行ではジッター付き指数バックオフを使用し、レート制限、5xx レスポンス、ネットワークエラー、タイムアウトエラーなどの一時的な失敗に適用されます。
- `429` 以外の 4xx クライアントエラーは永続的なエラーとして扱われ、再試行されません。

## プレビューストリーミング

Mattermost は、思考、ツールのアクティビティ、返信の部分的なテキストを**下書きプレビュー投稿**にストリーミングし、最終回答を安全に送信できるようになると、その場で確定します。`partial` モードでは、チャンクごとのメッセージでチャンネルを埋めるのではなく、同じ投稿 ID のプレビューを更新します。`block` モードでは、完了済みテキストとツールアクティビティのブロック間でプレビューが切り替わるため、以前のブロックは次のブロックに上書きされず、個別の投稿として表示されたままになります。メディアまたはエラーを含む最終結果では、保留中のプレビュー編集をキャンセルし、破棄されるプレビュー投稿を確定する代わりに通常の配信を使用します。

プレビューストリーミングは、`partial` モードで**デフォルトで有効**です。`channels.mattermost.streaming.mode` で設定します（従来のスカラー値またはブール値である `streaming` は `openclaw doctor --fix` によって移行されます）。

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ストリーミングモード">
    - `partial`（デフォルト）: 返信が増えるにつれて編集され、最後に完全な回答で確定される 1 つのプレビュー投稿です。
    - `block` は、完了済みテキストとツールアクティビティのブロック間でプレビューを切り替えるため、各ブロックはその場で上書きされず、個別の投稿として表示されたままになります。並列および連続したツール更新は、現在のツールアクティビティ投稿を共有します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。`streaming.block.enabled: true` を使用している場合、完了したアシスタントブロックは、1 つに結合された最終投稿ではなく、通常のブロック返信（個別の投稿）として引き続き配信されます。

  </Accordion>
  <Accordion title="ストリーミング動作に関する注記">
    - ストリームをその場で確定できない場合（たとえば、ストリーミング中に投稿が削除された場合）、OpenClaw は新しい最終投稿の送信にフォールバックするため、返信が失われることはありません。
    - 思考のみのペイロードは、`> Thinking` ブロック引用として届くテキストを含め、チャンネル投稿から除外されます。他のサーフェスで思考を表示するには `/reasoning on` を設定します。Mattermost の最終投稿には回答のみが保持されます。
    - チャンネルマッピングの対応表については、[ストリーミング](/ja-JP/concepts/streaming#preview-streaming-modes)を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション（メッセージツール）

- `channel=mattermost` とともに `message action=react` を使用します。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` には `thumbsup` や `:+1:` のような名前を指定できます（コロンは省略可能です）。
- リアクションを削除するには、`remove=true`（ブール値）を設定します。
- リアクションの追加および削除イベントは、メッセージと同じ DM／グループポリシーチェックに従い、ルーティングされたエージェントセッションへシステムイベントとして転送されます。

例:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクション操作を有効化／無効化します（デフォルトは true）。
- アカウントごとのオーバーライド: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（メッセージツール）

クリック可能なボタンを含むメッセージを送信します。ユーザーがボタンをクリックすると、エージェントが選択内容を受信し、応答できます。

ボタンは、セマンティックな `presentation` ペイロード（通常のエージェント返信および `message action=send` 内）から生成されます。OpenClaw は値ボタンを Mattermost のインタラクティブボタンとしてレンダリングし、URL ボタンをメッセージテキスト内に表示したままにし、選択メニューを読みやすいテキストへダウングレードします。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

プレゼンテーションボタンのフィールド:

<ParamField path="label" type="string" required>
  表示ラベル（別名: `text`）。
</ParamField>
<ParamField path="value" type="string">
  クリック時に返され、アクション ID として使用される値（別名: `callback_data`、`callbackData`）。`url` が設定されていない限り、クリック可能なボタンには必須です。
</ParamField>
<ParamField path="url" type="string">
  リンクボタン。インタラクティブボタンではなく、メッセージ本文内に `label: url` テキストとしてレンダリングされます。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  ボタンのスタイル。Mattermost は、サポートしていない値にデフォルトのスタイルを適用します。
</ParamField>

エージェントのシステムプロンプトでボタンのサポートを通知するには、チャンネル機能に `inlineButtons` を追加します。

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

ユーザーがボタンをクリックした場合:

<Steps>
  <Step title="アクセスチェック">
    クリックしたユーザーは、メッセージ送信者と同じ DM／グループポリシーチェックに合格する必要があります。許可されていないクリックには一時的な通知が表示され、無視されます。
  </Step>
  <Step title="ボタンを確認表示に置換">
    すべてのボタンが確認行（例: 「✓ **Yes** selected by @user」）に置き換えられます。
  </Step>
  <Step title="エージェントが選択内容を受信">
    エージェントは選択内容を受信メッセージ（およびシステムイベント）として受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="実装上の注記">
    - ボタンのコールバックでは HMAC-SHA256 検証を使用します（自動で行われ、設定は不要です）。
    - クリック時に添付ブロック全体が置き換えられるため、すべてのボタンがまとめて削除されます。一部のみを削除することはできません。
    - ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限）。
    - `action_id` が元の投稿上のアクションと一致しないクリックは、`403`（「不明なアクション」）として拒否されます。

  </Accordion>
  <Accordion title="設定と到達可能性">
    - `channels.mattermost.capabilities`: 機能文字列の配列です。エージェントのシステムプロンプトでボタンツールの説明を有効にするには、`"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例: `https://gateway.example.com`）。Mattermost がバインドホスト上の Gateway に直接到達できない場合に使用します。
    - マルチアカウント構成では、`channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` の下にも同じフィールドを設定できます。
    - `interactions.callbackBaseUrl` を省略すると、OpenClaw は `gateway.customBindHost` + `gateway.port`（デフォルトは 18789）からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。コールバックパスは `/mattermost/interactions/<accountId>` です。
    - 到達可能性の要件: ボタンのコールバック URL は Mattermost サーバーから到達可能である必要があります。`localhost` が機能するのは、Mattermost と OpenClaw が同じホスト／ネットワーク名前空間で実行されている場合のみです。
    - `channels.mattermost.interactions.allowedSourceIps`: ボタンコールバックの送信元 IP 許可リストです。これを指定しない場合、loopback の送信元（`127.0.0.1`、`::1`）のみが受け入れられるため、リモートの Mattermost サーバーをここで許可リストに追加しなければ、そのクリックは `403` として拒否されます。リバースプロキシの背後では、転送ヘッダーから実際のクライアント IP が導出されるように、`gateway.trustedProxies` も設定します。
    - コールバック先がプライベート／tailnet／内部の場合は、そのホスト／ドメインを Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加します。

  </Accordion>
</AccordionGroup>

### API の直接統合（外部スクリプト）

外部スクリプトおよび Webhook は、エージェントの `message` ツールを経由せず、Mattermost REST API を使用してボタンを直接投稿できます。OpenClaw の `message` ツールの使用を推奨します。直接統合する場合は、`@openclaw/mattermost/api.js` から `buildButtonAttachments` をインポートしてください。未加工の JSON を投稿する場合は、次のルールに従ってください。

**ペイロード構造:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**重要なルール**

1. 添付はトップレベルの `attachments` ではなく、`props.attachments` に配置します（誤った場合は通知なく無視されます）。
2. すべてのアクションに `type: "button"` が必要です。指定しない場合、クリックは通知なく破棄されます。
3. すべてのアクションに `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクションの `id` は**英数字のみ**（`[a-zA-Z0-9]`）でなければなりません。ハイフンとアンダースコアは Mattermost のサーバー側アクションルーティングを壊します（404 を返します）。使用前に取り除いてください。
5. `context.action_id` はボタンの `id` と一致する必要があります。Gateway は、`action_id` が投稿上に存在しないクリックを拒否します。
6. `context.action_id` は必須です。これがない場合、インタラクションハンドラーは 400 を返します。
7. コールバックの送信元 IP は許可されている必要があります（前述の `interactions.allowedSourceIps` を参照）。

</Warning>

**HMAC トークンの生成**

Gateway は HMAC-SHA256 を使用してボタンのクリックを検証します。外部スクリプトは、Gateway の検証ロジックと一致するトークンを生成する必要があります。

<Steps>
  <Step title="ボットトークンからシークレットを導出">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`。16 進数でエンコードします。
  </Step>
  <Step title="コンテキストオブジェクトを構築">
    `_token` **以外**のすべてのフィールドを含むコンテキストオブジェクトを構築します。
  </Step>
  <Step title="ソート済みキーでシリアライズ">
    **再帰的にソートされたキー**を使用し、**空白なし**でシリアライズします（Gateway はネストされたオブジェクトも正規化し、コンパクトな JSON を生成します）。
  </Step>
  <Step title="ペイロードに署名">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="トークンを追加">
    結果の 16 進ダイジェストをコンテキスト内の `_token` として追加します。
  </Step>
</Steps>

Python の例:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="HMAC の一般的な落とし穴">
    - Python の `json.dumps` は、デフォルトでスペースを追加します（`{"key": "val"}`）。JavaScript のコンパクトな出力（`{"key":"val"}`）と一致させるには、`separators=(",", ":")` を使用してください。
    - 常に（`_token` を除く）コンテキストフィールドを**すべて**署名してください。Gateway は `_token` を削除してから、残りすべてに署名します。一部だけを署名すると、検証が通知なく失敗します。
    - `sort_keys=True` を使用してください。Gateway は署名前にキーをソートし、Mattermost はペイロードの保存時にコンテキストフィールドの順序を変更する場合があります。
    - シークレットはランダムバイトではなく、ボットトークンから（決定論的に）導出してください。ボタンを作成するプロセスと検証を行う Gateway で、シークレットが同一である必要があります。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API を介してチャンネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` および cron/webhook 配信で `#channel-name` と `@username` のターゲットを使用できます。

設定は不要です。アダプターはアカウント設定のボットトークンを使用します。

## 複数アカウント

Mattermost は `channels.mattermost.accounts` 配下で複数のアカウントをサポートします。

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

アカウントの値は最上位フィールドを上書きします。アカウントが指定されていない場合に使用するアカウントは、`channels.mattermost.defaultAccount` で選択します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    ボットがチャンネルに参加していることを確認してメンションする（oncall）か、トリガープレフィックスを使用する（onchar）か、`chatmode: "onmessage"` を設定してください。
  </Accordion>
  <Accordion title="認証または複数アカウントのエラー">
    - ボットトークン、ベース URL、およびアカウントが有効になっているかを確認してください。
    - 複数アカウントの問題：環境変数は `default` アカウントにのみ適用されます。
    - プライベート/LAN の Mattermost ホストには `network.dangerouslyAllowPrivateNetwork: true` が必要です（SSRF ガードはデフォルトでプライベート IP をブロックします）。

  </Accordion>
  <Accordion title="ネイティブスラッシュコマンドが失敗する">
    - `Unauthorized: invalid command token.`：OpenClaw がコールバックトークンを受け入れませんでした。一般的な原因：
      - 起動時にスラッシュコマンドの登録が失敗したか、一部しか完了しなかった
      - コールバックが誤った Gateway/アカウントに到達している
      - Mattermost に、以前のコールバック先を指す古いコマンドが残っている
      - スラッシュコマンドを再有効化せずに Gateway が再起動した
    - ネイティブスラッシュコマンドが動作しなくなった場合は、ログで `mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` を確認してください。
    - `callbackUrl` を省略しており、コールバックが `http://localhost:18789/...` のようなループバック URL に解決されたという警告がログに表示される場合、その URL は Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されている場合にのみ到達可能である可能性があります。代わりに、外部から明示的に到達可能な `commands.callbackUrl` を設定してください。

  </Accordion>
  <Accordion title="ボタンの問題">
    - ボタンが白いボックスとして表示される、またはまったく表示されない：ボタンデータが不正です。各プレゼンテーションボタンには `label` と `value` が必要です（いずれかがないボタンは破棄されます）。
    - ボタンは表示されるが、クリックしても何も起きない：Mattermost サーバーから Gateway に到達できること、Mattermost サーバーの IP が `channels.mattermost.interactions.allowedSourceIps` に含まれていること（これを設定しない場合はループバックのみ許可されます）、およびプライベートターゲットの場合は `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホストが含まれていることを確認してください。
    - ボタンをクリックすると 404 が返される：ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID を処理できません。`[a-zA-Z0-9]` のみを使用してください。
    - Gateway のログに `rejected callback source` が記録される：クリック元の IP が `interactions.allowedSourceIps` の範囲外です。Mattermost サーバーまたはイングレスを許可リストに追加し、リバースプロキシの背後では `gateway.trustedProxies` を設定してください。
    - Gateway のログに `invalid _token` が記録される：HMAC が一致しません。コンテキストフィールドを（一部だけでなく）すべて署名し、ソート済みキーとコンパクトな JSON（スペースなし）を使用していることを確認してください。上記の HMAC セクションを参照してください。
    - Gateway のログに `missing _token in context` が記録される：`_token` フィールドがボタンのコンテキストにありません。連携ペイロードの構築時に含めてください。
    - Gateway が `Unknown action` でクリックを拒否する：`context.action_id` が投稿上のどのアクション `id` とも一致しません。両方に同じサニタイズ済みの値を設定してください。
    - エージェントがボタンを提示しない：Mattermost チャンネル設定に `capabilities: ["inlineButtons"]` を追加してください。

  </Accordion>
</AccordionGroup>

## 関連項目

- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [チャンネルの概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲーティング
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化

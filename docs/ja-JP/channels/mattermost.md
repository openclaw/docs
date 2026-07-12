---
read_when:
    - Mattermost のセットアップ
    - Mattermost ルーティングのデバッグ
sidebarTitle: Mattermost
summary: Mattermost ボットのセットアップと OpenClaw の設定
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T14:18:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

ステータス: ダウンロード可能なPlugin（ボットトークン + WebSocketイベント）。チャンネル、非公開チャンネル、グループDM、DMをサポートしています。Mattermostはセルフホスト可能なチームメッセージングプラットフォームです（[mattermost.com](https://mattermost.com)）。

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
    Mattermostのボットアカウントを作成し、**ボットトークン**をコピーして、ボットが読み取る必要のあるチームとチャンネルに追加します。
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

    非対話形式の代替方法:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
プライベート/LAN/tailnetアドレス上でセルフホストされているMattermost: Mattermost APIへの送信リクエストは、デフォルトでプライベートIPと内部IPをブロックするSSRFガードを通過します。`channels.mattermost.network.dangerouslyAllowPrivateNetwork: true`で明示的に許可してください（アカウント単位: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## ネイティブスラッシュコマンド

ネイティブスラッシュコマンドはオプトインです。有効にすると、OpenClawはボットが所属するすべてのチームに`oc_*`スラッシュコマンドを登録し、Gateway HTTPサーバーでコールバックPOSTを受信します。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // MattermostからGatewayへ直接到達できない場合に使用します（リバースプロキシ/公開URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

登録されるコマンド: `/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。`nativeSkills: true`の場合、Skillsのコマンドも`/oc_<skill>`として登録されます。

<AccordionGroup>
  <Accordion title="動作上の注意">
    - `native`と`nativeSkills`のデフォルトは`"auto"`で、Mattermostでは無効として解決されます。明示的に`true`に設定してください。
    - `callbackPath`のデフォルトは`/api/channels/mattermost/command`です。
    - `callbackUrl`を省略すると、OpenClawは`http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`を生成します。ワイルドカードのバインドホスト（`0.0.0.0`、`::`）は`localhost`にフォールバックします。
    - 複数アカウント構成では、`commands`をトップレベルまたは`channels.mattermost.accounts.<id>.commands`の下に設定できます（アカウントの値がトップレベルのフィールドを上書きします）。
    - 他の連携によって作成された同じトリガーの既存スラッシュコマンドは変更されません（登録時にスキップされます）。ボットが作成したコマンドは、コールバックURLに差異が生じると更新または再作成されます。
    - コマンドコールバックは、OpenClawが`oc_*`コマンドを登録したときにMattermostから返されるコマンド単位のトークンで検証されます。
    - OpenClawは各コールバックを受け付ける前に現在のMattermostコマンド登録を更新するため、削除または再生成されたスラッシュコマンドの古いトークンは、Gatewayを再起動しなくても受け付けられなくなります。
    - Mattermost APIでコマンドが現在も有効であることを確認できない場合、コールバック検証は安全側に失敗します。失敗した検証は短時間キャッシュされ、並行する検索はまとめられ、新しい検索の開始はリプレイ負荷を制限するためコマンド単位でレート制限されます。
    - 登録に失敗した場合、起動が部分的にしか完了していない場合、またはコールバックトークンが解決されたコマンドの登録済みトークンと一致しない場合、スラッシュコールバックは安全側に失敗します（あるコマンドで有効なトークンを使用して、別のコマンドの上流検証に到達することはできません）。
    - 受け付けたコールバックには、一時的な「処理中...」という応答で確認を返します。実際の回答は通常のメッセージとして届きます。

  </Accordion>
  <Accordion title="到達可能性の要件">
    コールバックエンドポイントにはMattermostサーバーから到達できる必要があります。

    - MattermostがOpenClawと同じホスト/ネットワーク名前空間で実行されている場合を除き、`callbackUrl`を`localhost`に設定しないでください。
    - MattermostのベースURLが`/api/channels/mattermost/command`をOpenClawへリバースプロキシしている場合を除き、`callbackUrl`をそのベースURLに設定しないでください。
    - 簡易確認には`curl https://<gateway-host>/api/channels/mattermost/command`を使用できます。GETに対して、`404`ではなくOpenClawから`405 Method Not Allowed`が返される必要があります。

  </Accordion>
  <Accordion title="Mattermostの外向き通信許可リスト">
    コールバックの宛先がプライベート/tailnet/内部アドレスの場合は、Mattermostの`ServiceSettings.AllowedUntrustedInternalConnections`にコールバックのホスト/ドメインを含めるよう設定します。

    完全なURLではなく、ホスト/ドメインのエントリを使用してください。

    - 正: `gateway.tailnet-name.ts.net`
    - 誤: `https://gateway.tailnet-name.ts.net`

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

MattermostはDMに自動的に応答します。チャンネルでの動作は`chatmode`によって制御されます。

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

注意:

- `onchar`でも明示的な@メンションには応答します。
- `channels.mattermost.requireMention`も引き続き尊重されますが、`chatmode`の使用を推奨します。チャンネル単位の`groups.<channelId>.requireMention`設定は、どちらよりも優先されます。
- ボットがチャンネルのスレッドで表示される応答を送信した後は、同じスレッド内の後続メッセージに、新しい@メンションや`onchar`プレフィックスがなくても応答するため、複数ターンのスレッド会話が継続します。参加状態は、ボットがそのスレッドで最後に応答してから7日間記憶され、Gatewayを再起動しても維持されます。ボットが確認しただけのスレッドには影響しません。明示的なメンションを再び必須にするには、新しいトップレベルメッセージを開始してください。

## スレッドとセッション

`channels.mattermost.replyToMode`を使用して、チャンネルおよびグループへの応答をメインチャンネルに残すか、トリガーとなった投稿の下でスレッドを開始するかを制御します。

- `off`（デフォルト）: 受信した投稿がすでにスレッド内にある場合にのみ、スレッド内で応答します。
- `first`: トップレベルのチャンネル/グループ投稿では、その投稿の下でスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
- `all`と`batched`: 現在のMattermostでは`first`と同じ動作です。Mattermostでスレッドルートが作成されると、後続のチャンクとメディアは同じスレッド内で継続するためです。
- `replyToMode`が設定されていても、ダイレクトメッセージのデフォルトは`off`です。

`channels.mattermost.replyToModeByChatType`を使用して、`direct`、`group`、または`channel`チャットのモードを上書きします。ダイレクトメッセージでスレッドを使用するには、`direct`を設定します。

- `off`（デフォルト）: ダイレクトメッセージはスレッド化されず、1つの継続的なセッションに留まります。
- `first`、`all`、または`batched`: 各トップレベルのダイレクトメッセージが、新しい独立したセッションに紐づくMattermostスレッドを開始します。

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

注意:

- スレッドスコープのセッションでは、トリガーとなった投稿IDをスレッドルートとして使用します。
- 現在、`first`と`all`は同等です。Mattermostでスレッドルートが作成されると、後続のチャンクとメディアは同じスレッド内で継続するためです。
- チャット種別ごとの上書きは`replyToMode`より優先されます。`direct`の上書きがなければ、既存のデプロイではフラットなスレッド化されていないDMが維持されます。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（不明な送信者にはペアリングコードが提示されます）。その他の値: `allowlist`、`open`、`disabled`。
- 次のコマンドで承認します。
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開DM: `channels.mattermost.dmPolicy="open"`と`channels.mattermost.allowFrom=["*"]`を併用します（設定スキーマによってワイルドカードが強制されます）。
- `channels.mattermost.allowFrom`はユーザーID（推奨）および`accessGroup:<name>`エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## チャンネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（メンション必須）。
- `channels.mattermost.groupAllowFrom`で送信者を許可リストに追加します（ユーザーIDを推奨）。
- `channels.mattermost.groupAllowFrom`は`accessGroup:<name>`エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。
- チャンネル単位のメンション上書きは`channels.mattermost.groups.<channelId>.requireMention`の下に設定します。デフォルトには`channels.mattermost.groups["*"].requireMention`を使用します。
- `@username`による照合は変更される可能性があり、`channels.mattermost.dangerouslyAllowNameMatching: true`の場合にのみ有効になります。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"`（メンション必須）。
- 解決順序: `channels.mattermost.groupPolicy`、次に`channels.defaults.groupPolicy`、最後に`"allowlist"`。
- ランタイム上の注意: `channels.mattermost`セクションが完全に存在しない場合、`channels.defaults.groupPolicy`が設定されていても、ランタイムはグループチェックで`groupPolicy="allowlist"`として安全側に失敗し、警告を1回記録します。

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

## 外向き配信のターゲット

`openclaw message send`またはcron/Webhookでは、次のターゲット形式を使用します。

| ターゲット                          | 配信先                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | IDで指定したチャンネル                                        |
| `channel:<name>`または`#channel-name` | 名前で指定したチャンネル（ボットが所属するチーム全体を検索）  |
| `user:<id>`または`mattermost:<id>`    | そのユーザーとのDM                                            |
| `@username`                         | DM（Mattermost APIを介してユーザー名を解決）                  |

外向き送信では、メッセージごとに最大1つの添付ファイルをサポートします。複数のファイルは個別に送信してください。

<Warning>
プレフィックスのない不透明なID（`64ifufp...`など）は、Mattermostでは**曖昧**です（ユーザーIDかチャンネルIDかを判別できません）。

OpenClawは**ユーザーを優先**して解決します。

- IDがユーザーとして存在する場合（`GET /api/v4/users/<id>`が成功する場合）、OpenClawは`/api/v4/channels/direct`を介してダイレクトチャンネルを解決し、**DM**を送信します。
- それ以外の場合、IDは**チャンネルID**として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。
</Warning>

## DMチャンネルの再試行

OpenClawがMattermostのDMターゲットに送信する際、最初にダイレクトチャンネルを解決する必要がある場合は、一時的なダイレクトチャンネル作成エラーをデフォルトで再試行します。

Mattermost Plugin全体でこの動作を調整するには`channels.mattermost.dmChannelRetry`を使用し、1つのアカウントに対して調整するには`channels.mattermost.accounts.<id>.dmChannelRetry`を使用します。デフォルト:

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

注記:

- これは DM チャンネルの作成（`/api/v4/channels/direct`）にのみ適用され、すべての Mattermost API 呼び出しに適用されるわけではありません。
- 再試行ではジッター付き指数バックオフを使用し、レート制限、5xx レスポンス、ネットワークエラー、タイムアウトエラーなどの一時的な障害に適用されます。
- `429` 以外の 4xx クライアントエラーは永続的なエラーとして扱われ、再試行されません。

## プレビューストリーミング

Mattermost は、思考、ツールアクティビティ、返信の部分的なテキストを、最終回答を安全に送信できる時点でその場で確定される**下書きプレビュー投稿**へストリーミングします。`partial` モードでは、チャンクごとのメッセージでチャンネルを埋め尽くす代わりに、同じ投稿 ID のプレビューを更新します。`block` モードでは、完成したテキストとツールアクティビティブロックを切り替えてプレビューするため、先行するブロックは次のブロックによって上書きされず、それぞれ独立した投稿として表示されたままになります。メディアまたはエラーを含む最終出力では、保留中のプレビュー編集をキャンセルし、破棄されるプレビュー投稿を確定する代わりに通常の配信を使用します。

プレビューストリーミングは、`partial` モードで**デフォルトで有効**です。`channels.mattermost.streaming`（モード文字列、ブール値、または `{ mode: "progress" }` のようなオブジェクト）で設定します。

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ストリーミングモード">
    - `partial`（デフォルト）: 返信の増加に伴って編集され、最後に完全な回答で確定される単一のプレビュー投稿です。
    - `block` は、完成したテキストとツールアクティビティブロックを切り替えてプレビューするため、各ブロックはその場で上書きされず、それぞれ独立した投稿として表示されたままになります。並列および連続するツール更新は、現在のツールアクティビティ投稿を共有します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。`blockStreaming: true` の場合、完成したアシスタントブロックは、単一に統合された最終投稿ではなく、通常のブロック返信（個別の投稿）として引き続き配信されます。

  </Accordion>
  <Accordion title="ストリーミング動作に関する注記">
    - ストリームをその場で確定できない場合（たとえば、ストリーミング中に投稿が削除された場合）、OpenClaw は新しい最終投稿の送信にフォールバックし、返信が失われないようにします。
    - 思考のみのペイロードは、`> Thinking` の引用ブロックとして届くテキストを含め、チャンネル投稿から除外されます。他のサーフェスで思考を表示するには `/reasoning on` を設定します。Mattermost の最終投稿には回答のみが含まれます。
    - チャンネルマッピングの対応表については、[ストリーミング](/ja-JP/concepts/streaming#preview-streaming-modes)を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション（メッセージツール）

- `channel=mattermost` を指定して `message action=react` を使用します。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` には `thumbsup` や `:+1:` のような名前を指定できます（コロンは省略可能です）。
- リアクションを削除するには、`remove=true`（ブール値）を設定します。
- リアクションの追加・削除イベントは、メッセージと同じ DM／グループポリシーチェックに従って、ルーティング先のエージェントセッションへシステムイベントとして転送されます。

例:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクションアクションを有効または無効にします（デフォルトは true）。
- アカウントごとのオーバーライド: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（メッセージツール）

クリック可能なボタン付きのメッセージを送信します。ユーザーがボタンをクリックすると、エージェントは選択内容を受信して応答できます。

ボタンは、セマンティックな `presentation` ペイロード（通常のエージェント返信および `message action=send`）から生成されます。OpenClaw は値ボタンを Mattermost のインタラクティブボタンとしてレンダリングし、URL ボタンはメッセージテキスト内で表示したままにし、選択メニューは読みやすいテキストへダウングレードします。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

プレゼンテーションボタンのフィールド:

<ParamField path="label" type="string" required>
  表示ラベル（別名: `text`）。
</ParamField>
<ParamField path="value" type="string">
  クリック時に返送され、アクション ID として使用される値（別名: `callback_data`、`callbackData`）。`url` が設定されていないクリック可能なボタンには必須です。
</ParamField>
<ParamField path="url" type="string">
  リンクボタン。インタラクティブボタンではなく、メッセージ本文内に `label: url` 形式のテキストとしてレンダリングされます。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  ボタンのスタイル。Mattermost がサポートしていない値にはデフォルトのスタイルが適用されます。
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
    クリックしたユーザーは、メッセージ送信者と同じ DM／グループポリシーチェックに合格する必要があります。権限のないクリックには一時的な通知が表示され、無視されます。
  </Step>
  <Step title="ボタンを確認メッセージに置換">
    すべてのボタンが確認行（例: 「✓ **Yes** selected by @user」）に置き換えられます。
  </Step>
  <Step title="エージェントが選択内容を受信">
    エージェントは選択内容を受信メッセージ（およびシステムイベント）として受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="実装上の注記">
    - ボタンのコールバックは HMAC-SHA256 検証を使用します（自動であり、設定は不要です）。
    - クリック時には添付ブロック全体が置き換えられるため、すべてのボタンがまとめて削除されます。一部のみを削除することはできません。
    - ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限）。
    - `action_id` が元の投稿のアクションと一致しないクリックは、`403`（「Unknown action」）で拒否されます。

  </Accordion>
  <Accordion title="設定と到達可能性">
    - `channels.mattermost.capabilities`: 機能文字列の配列です。エージェントのシステムプロンプトでボタンツールの説明を有効にするには、`"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例: `https://gateway.example.com`）。Mattermost から Gateway のバインドホストへ直接到達できない場合に使用します。
    - 複数アカウント構成では、`channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` に同じフィールドを設定することもできます。
    - `interactions.callbackBaseUrl` を省略すると、OpenClaw は `gateway.customBindHost` + `gateway.port`（デフォルトは 18789）からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。コールバックパスは `/mattermost/interactions/<accountId>` です。
    - 到達可能性のルール: ボタンのコールバック URL は Mattermost サーバーから到達可能である必要があります。`localhost` が機能するのは、Mattermost と OpenClaw が同じホスト／ネットワーク名前空間で実行されている場合のみです。
    - `channels.mattermost.interactions.allowedSourceIps`: ボタンコールバックの送信元 IP 許可リストです。これを指定しない場合、ループバック送信元（`127.0.0.1`、`::1`）のみが受け入れられるため、リモートの Mattermost サーバーをここで許可リストに追加しなければ、そのクリックは `403` で拒否されます。リバースプロキシの背後では、転送ヘッダーから実際のクライアント IP が導出されるように、`gateway.trustedProxies` も設定します。
    - コールバック先がプライベート／tailnet／内部にある場合、そのホスト／ドメインを Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加します。

  </Accordion>
</AccordionGroup>

### API の直接統合（外部スクリプト）

外部スクリプトと Webhook は、エージェントの `message` ツールを経由せず、Mattermost REST API を使用してボタンを直接投稿できます。可能な場合は Plugin の `buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、次のルールに従ってください。

**ペイロード構造:**

```json5
{
  channel_id: "<channelId>",
  message: "オプションを選択してください:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 英数字のみ - 以下を参照
            type: "button", // 必須。指定しない場合、クリックは通知なく無視される
            name: "承認", // 表示ラベル
            style: "primary", // 任意: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ボタン ID と一致する必要がある
                action: "approve",
                // ... 任意のカスタムフィールド ...
                _token: "<hmac>", // 以下の HMAC セクションを参照
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

1. 添付はトップレベルの `attachments` ではなく、`props.attachments` に配置します（そうでない場合、通知なく無視されます）。
2. すべてのアクションに `type: "button"` が必要です。指定しない場合、クリックは通知なく破棄されます。
3. すべてのアクションに `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクションの `id` は**英数字のみ**（`[a-zA-Z0-9]`）である必要があります。ハイフンとアンダースコアは Mattermost のサーバー側アクションルーティングを壊します（404 を返します）。使用前に削除してください。
5. `context.action_id` はボタンの `id` と一致する必要があります。Gateway は、投稿に存在しない `action_id` を持つクリックを拒否します。
6. `context.action_id` は必須です。指定しない場合、インタラクションハンドラーは 400 を返します。
7. コールバックの送信元 IP が許可されている必要があります（前述の `interactions.allowedSourceIps` を参照）。

</Warning>

**HMAC トークンの生成**

Gateway は HMAC-SHA256 を使用してボタンのクリックを検証します。外部スクリプトは、Gateway の検証ロジックと一致するトークンを生成する必要があります。

<Steps>
  <Step title="ボットトークンからシークレットを導出">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)` を使用し、16 進数でエンコードします。
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
    生成された 16 進ダイジェストをコンテキストの `_token` として追加します。
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
  <Accordion title="HMAC でよくある落とし穴">
    - Python の `json.dumps` はデフォルトで空白を追加します（`{"key": "val"}`）。JavaScript のコンパクトな出力（`{"key":"val"}`）と一致させるには、`separators=(",", ":")` を使用します。
    - コンテキストの**すべての**フィールド（`_token` を除く）に必ず署名してください。Gateway は `_token` を取り除いた後、残りのすべてに署名します。一部のみへの署名は、通知のない検証失敗を引き起こします。
    - `sort_keys=True` を使用してください。Gateway は署名前にキーをソートし、Mattermost はペイロードを保存する際にコンテキストフィールドを並べ替える可能性があります。
    - ランダムなバイトではなく、ボットトークンからシークレットを導出してください（決定論的）。ボタンを作成するプロセスと検証する Gateway で、シークレットが同一である必要があります。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API を介してチャンネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` および Cron／Webhook 配信で `#channel-name` と `@username` を宛先として使用できます。

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

アカウントの値はトップレベルのフィールドを上書きします。アカウントが指定されていない場合、`channels.mattermost.defaultAccount` で使用するアカウントを選択します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    ボットがチャンネルに参加していることを確認し、ボットにメンションする（oncall）か、トリガープレフィックスを使用する（onchar）か、`chatmode: "onmessage"` を設定してください。
  </Accordion>
  <Accordion title="認証または複数アカウントのエラー">
    - ボットトークン、ベース URL、アカウントが有効になっているかを確認してください。
    - 複数アカウントに関する問題：環境変数は `default` アカウントにのみ適用されます。
    - プライベート/LAN 上の Mattermost ホストには `network.dangerouslyAllowPrivateNetwork: true` が必要です（SSRF ガードはデフォルトでプライベート IP をブロックします）。

  </Accordion>
  <Accordion title="ネイティブスラッシュコマンドが失敗する">
    - `Unauthorized: invalid command token.`：OpenClaw がコールバックトークンを受け入れませんでした。一般的な原因：
      - 起動時にスラッシュコマンドの登録が失敗したか、一部しか完了しなかった
      - コールバックが誤った Gateway/アカウントに到達している
      - Mattermost に、以前のコールバック先を指す古いコマンドが残っている
      - スラッシュコマンドを再有効化せずに Gateway が再起動された
    - ネイティブスラッシュコマンドが機能しなくなった場合は、ログで `mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` を確認してください。
    - `callbackUrl` が省略され、コールバックが `http://localhost:18789/...` のようなループバック URL に解決されたという警告がログに表示される場合、その URL は Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されている場合にしか到達できない可能性があります。代わりに、外部から到達可能な `commands.callbackUrl` を明示的に設定してください。

  </Accordion>
  <Accordion title="ボタンの問題">
    - ボタンが白いボックスとして表示されるか、まったく表示されない：ボタンデータが不正です。各プレゼンテーションボタンには `label` と `value` が必要です（どちらかがないボタンは破棄されます）。
    - ボタンは表示されるが、クリックしても何も起こらない：Mattermost サーバーから Gateway に到達できること、Mattermost サーバーの IP が `channels.mattermost.interactions.allowedSourceIps` に含まれていること（設定しない場合はループバックのみ許可されます）、およびプライベートな宛先の場合は `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホストが含まれていることを確認してください。
    - ボタンをクリックすると 404 が返される：ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID では機能しません。`[a-zA-Z0-9]` のみを使用してください。
    - Gateway のログに `rejected callback source` が表示される：クリック元の IP が `interactions.allowedSourceIps` の範囲外です。Mattermost サーバーまたはイングレスを許可リストに追加し、リバースプロキシの背後では `gateway.trustedProxies` を設定してください。
    - Gateway のログに `invalid _token` が表示される：HMAC が一致していません。すべてのコンテキストフィールド（一部だけではなく）に署名し、キーをソートして、コンパクト JSON（空白なし）を使用していることを確認してください。上記の HMAC セクションを参照してください。
    - Gateway のログに `missing _token in context` が表示される：ボタンのコンテキストに `_token` フィールドがありません。インテグレーションペイロードを構築する際に、このフィールドが含まれていることを確認してください。
    - Gateway が `Unknown action` でクリックを拒否する：`context.action_id` が投稿上のどのアクションの `id` とも一致していません。両方を同じサニタイズ済みの値に設定してください。
    - エージェントがボタンを提示しない：Mattermost チャンネル設定に `capabilities: ["inlineButtons"]` を追加してください。

  </Accordion>
</AccordionGroup>

## 関連項目

- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションによる制御
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化

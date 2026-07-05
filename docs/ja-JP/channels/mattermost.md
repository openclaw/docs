---
read_when:
    - Mattermost の設定
    - Mattermost ルーティングのデバッグ
sidebarTitle: Mattermost
summary: Mattermost ボット設定と OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-07-05T11:03:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a1e8c4688bcddbee15d64b388b24bfb03a3890fe05f98fbb47bb904f4a0bc29
    source_path: channels/mattermost.md
    workflow: 16
---

ステータス: ダウンロード可能なPlugin（ボットトークン + WebSocketイベント）。チャンネル、プライベートチャンネル、グループDM、DMをサポートしています。Mattermostはセルフホスト可能なチームメッセージングプラットフォームです（[mattermost.com](https://mattermost.com)）。

## インストール

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

<Steps>
  <Step title="Ensure plugin is available">
    上記のコマンドで`@openclaw/mattermost`をインストールし、Gatewayがすでに実行中の場合は再起動します。
  </Step>
  <Step title="Create a Mattermost bot">
    Mattermostボットアカウントを作成し、**ボットトークン**をコピーして、ボットが読み取る必要のあるチームとチャンネルに追加します。
  </Step>
  <Step title="Copy the base URL">
    Mattermostの**ベースURL**（例: `https://chat.example.com`）をコピーします。末尾の`/api/v4`は自動的に削除されます。
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

    非対話型の代替:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
プライベート/LAN/tailnetアドレス上のセルフホストMattermost: 送信されるMattermost APIリクエストは、デフォルトでプライベートIPと内部IPをブロックするSSRFガードを通過します。`channels.mattermost.network.dangerouslyAllowPrivateNetwork: true`でオプトインします（アカウントごと: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
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
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

登録されるコマンド: `/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。`nativeSkills: true`の場合、Skillコマンドも`/oc_<skill>`として登録されます。

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native`と`nativeSkills`のデフォルトは`"auto"`で、Mattermostでは無効に解決されます。明示的に`true`に設定してください。
    - `callbackPath`のデフォルトは`/api/channels/mattermost/command`です。
    - `callbackUrl`を省略すると、OpenClawは`http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`を導出します。ワイルドカードのバインドホスト（`0.0.0.0`、`::`）は`localhost`にフォールバックします。
    - 複数アカウント構成では、`commands`をトップレベル、または`channels.mattermost.accounts.<id>.commands`の下に設定できます（アカウント値はトップレベルのフィールドを上書きします）。
    - 他の統合が作成した同じトリガーの既存スラッシュコマンドはそのまま残されます（登録時にスキップされます）。ボットが作成したコマンドは、コールバックURLがずれたときに更新または再作成されます。
    - コマンドコールバックは、OpenClawが`oc_*`コマンドを登録するときにMattermostから返されるコマンドごとのトークンで検証されます。
    - OpenClawは各コールバックを受け入れる前に現在のMattermostコマンド登録を更新するため、削除または再生成されたスラッシュコマンドの古いトークンは、Gatewayを再起動しなくても受け入れられなくなります。
    - Mattermost APIがコマンドがまだ現在有効であることを確認できない場合、コールバック検証はフェイルクローズします。失敗した検証は短時間キャッシュされ、同時ルックアップはまとめられ、新しいルックアップ開始はリプレイ圧を抑えるためコマンドごとにレート制限されます。
    - 登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが解決されたコマンドの登録済みトークンと一致しない場合、スラッシュコールバックはフェイルクローズします（あるコマンドで有効なトークンが、別のコマンドの上流検証に到達することはできません）。
    - 受け入れられたコールバックには、一時的な「処理中...」返信で応答します。実際の回答は通常のメッセージとして届きます。

  </Accordion>
  <Accordion title="Reachability requirement">
    コールバックエンドポイントはMattermostサーバーから到達可能である必要があります。

    - MattermostがOpenClawと同じホスト/ネットワーク名前空間で実行されていない限り、`callbackUrl`を`localhost`に設定しないでください。
    - そのURLが`/api/channels/mattermost/command`をOpenClawへリバースプロキシしない限り、`callbackUrl`をMattermostのベースURLに設定しないでください。
    - 簡単な確認は`curl https://<gateway-host>/api/channels/mattermost/command`です。GETは`404`ではなく、OpenClawから`405 Method Not Allowed`を返す必要があります。

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    コールバックの宛先がプライベート/tailnet/内部アドレスの場合は、Mattermostの`ServiceSettings.AllowedUntrustedInternalConnections`にコールバックホスト/ドメインを含めるよう設定します。

    完全なURLではなく、ホスト/ドメインエントリを使用してください。

    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境変数（デフォルトアカウント）

env varsを使う場合は、Gatewayホストでこれらを設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
env varsは**デフォルト**アカウント（`default`）にのみ適用されます。他のアカウントは設定値を使用する必要があります。

`MATTERMOST_URL`はワークスペースの`.env`からは設定できません。[ワークスペース`.env`ファイル](/ja-JP/gateway/security)を参照してください。
</Note>

## チャットモード

MattermostはDMに自動的に応答します。チャンネルの動作は`chatmode`で制御されます。

<Tabs>
  <Tab title="oncall (default)">
    チャンネルでは@メンションされた場合にのみ応答します。
  </Tab>
  <Tab title="onmessage">
    すべてのチャンネルメッセージに応答します。
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
      oncharPrefixes: [">", "!"], // default
    },
  },
}
```

注:

- `onchar`は明示的な@メンションにも引き続き応答します。
- `channels.mattermost.requireMention`も引き続き尊重されますが、`chatmode`が優先されます。チャンネルごとの`groups.<channelId>.requireMention`設定は両方より優先されます。
- ボットがチャンネルスレッドで表示される返信を送信した後、その同じスレッド内の以降のメッセージには、新しい@メンションや`onchar`プレフィックスなしで応答します。そのため、複数ターンのスレッド会話は継続して流れます。参加状態は、そのスレッドでボットが最後に返信してから7日間記憶され、Gatewayの再起動後も保持されます。ボットが観測しただけのスレッドには影響しません。明示的なメンションを再度必要にするには、新しいトップレベルメッセージを開始してください。

## スレッドとセッション

`channels.mattermost.replyToMode`を使用して、チャンネルとグループへの返信をメインチャンネルに残すか、トリガーした投稿の下にスレッドを開始するかを制御します。

- `off`（デフォルト）: 受信投稿がすでにスレッド内にある場合にのみ、スレッド内で返信します。
- `first`: トップレベルのチャンネル/グループ投稿では、その投稿の下にスレッドを開始し、会話をスレッドスコープのセッションへルーティングします。
- `all`と`batched`: 今日のMattermostでは`first`と同じ動作です。Mattermostでいったんスレッドルートができると、後続のチャンクとメディアは同じスレッドで継続するためです。
- ダイレクトメッセージはこの設定を無視し、非スレッドのままです。

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

スレッドスコープのセッションは、トリガーした投稿IDをスレッドルートとして使用します。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（未知の送信者にはペアリングコードが渡されます）。その他の値: `allowlist`、`open`、`disabled`。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- パブリックDM: `channels.mattermost.dmPolicy="open"`に加えて`channels.mattermost.allowFrom=["*"]`（設定スキーマがワイルドカードを強制します）。
- `channels.mattermost.allowFrom`はユーザーID（推奨）と`accessGroup:<name>`エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## チャンネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（メンションゲート付き）。
- `channels.mattermost.groupAllowFrom`で送信者を許可リストに追加します（ユーザーID推奨）。
- `channels.mattermost.groupAllowFrom`は`accessGroup:<name>`エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。
- チャンネルごとのメンション上書きは、`channels.mattermost.groups.<channelId>.requireMention`、またはデフォルト用の`channels.mattermost.groups["*"].requireMention`の下に置きます。
- `@username`の照合は変更可能であり、`channels.mattermost.dangerouslyAllowNameMatching: true`の場合にのみ有効になります。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"`（メンションゲート付き）。
- 解決順序: `channels.mattermost.groupPolicy`、次に`channels.defaults.groupPolicy`、次に`"allowlist"`。
- ランタイム注: `channels.mattermost`セクションが完全に存在しない場合、ランタイムはグループチェックに対して`groupPolicy="allowlist"`へフェイルクローズし（`channels.defaults.groupPolicy`が設定されている場合でも）、1回限りの警告をログに記録します。

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

## アウトバウンド配信のターゲット

`openclaw message send`またはcron/webhooksでは、これらのターゲット形式を使用します。

| ターゲット                          | 配信先                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | IDによるチャンネル                                           |
| `channel:<name>`または`#channel-name` | 名前によるチャンネル。ボットが所属するチーム全体から検索されます |
| `user:<id>`または`mattermost:<id>`    | そのユーザーとのDM                                           |
| `@username`                         | DM（ユーザー名はMattermost API経由で解決されます）           |

アウトバウンド送信は、メッセージごとに最大1つの添付ファイルをサポートします。複数のファイルは別々の送信に分割してください。

<Warning>
裸の不透明ID（`64ifufp...`など）はMattermostでは**曖昧**です（ユーザーIDかチャンネルIDか）。

OpenClawはそれらを**ユーザー優先**で解決します。

- IDがユーザーとして存在する場合（`GET /api/v4/users/<id>`が成功）、OpenClawは`/api/v4/channels/direct`経由でダイレクトチャンネルを解決し、**DM**を送信します。
- それ以外の場合、IDは**チャンネルID**として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。
</Warning>

## DMチャンネルの再試行

OpenClawがMattermost DMターゲットへ送信し、先にダイレクトチャンネルを解決する必要がある場合、一時的なダイレクトチャンネル作成失敗をデフォルトで再試行します。

その動作をMattermost Plugin全体でグローバルに調整するには`channels.mattermost.dmChannelRetry`を使用し、1つのアカウントに対しては`channels.mattermost.accounts.<id>.dmChannelRetry`を使用します。デフォルト:

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

- これはDMチャンネル作成（`/api/v4/channels/direct`）にのみ適用され、すべてのMattermost API呼び出しには適用されません。
- 再試行はジッター付きの指数バックオフを使用し、レート制限、5xxレスポンス、ネットワークまたはタイムアウトエラーなどの一時的な失敗に適用されます。
- `429`以外の4xxクライアントエラーは恒久的なものとして扱われ、再試行されません。

## プレビューストリーミング

Mattermost は、思考、ツール活動、部分的な返信テキストを単一の**下書きプレビュー投稿**にストリーミングし、最終回答を安全に送信できる状態になるとその場で確定します。プレビューはチャンクごとのメッセージでチャンネルを埋めるのではなく、同じ投稿 ID 上で更新されます。メディアやエラーの最終送信では、保留中のプレビュー編集をキャンセルし、使い捨てのプレビュー投稿をフラッシュする代わりに通常の配信を使用します。

プレビューストリーミングは `partial` モードで**デフォルトでオン**です。`channels.mattermost.streaming`（モード文字列、boolean、または `{ mode: "progress" }` のようなオブジェクト）で設定します。

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
    - `partial`（デフォルト）: 返信が伸びるにつれて編集され、最後に完全な回答で確定される 1 つのプレビュー投稿。
    - `block` は、プレビュー投稿内で追記形式の下書きチャンクを使用します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。

  </Accordion>
  <Accordion title="ストリーミング動作の注意事項">
    - ストリームをその場で確定できない場合（たとえば、投稿がストリーム中に削除された場合）、OpenClaw は新しい最終投稿の送信にフォールバックするため、返信が失われることはありません。
    - 思考のみのペイロードは、`> Thinking` ブロック引用として届くテキストも含め、チャンネル投稿から抑制されます。他のサーフェスで思考を見るには `/reasoning on` を設定します。Mattermost の最終投稿には回答のみが残ります。
    - チャンネルマッピングのマトリクスについては、[ストリーミング](/ja-JP/concepts/streaming#preview-streaming-modes)を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション（メッセージツール）

- `channel=mattermost` とともに `message action=react` を使用します。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` は `thumbsup` や `:+1:` のような名前を受け付けます（コロンは任意です）。
- リアクションを削除するには `remove=true`（boolean）を設定します。
- リアクションの追加/削除イベントは、メッセージと同じ DM/グループポリシーチェックの対象として、ルーティングされたエージェントセッションへシステムイベントとして転送されます。

例:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクションアクションを有効/無効にします（デフォルトは true）。
- アカウントごとのオーバーライド: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（メッセージツール）

クリック可能なボタン付きメッセージを送信します。ユーザーがボタンをクリックすると、エージェントは選択内容を受け取り、応答できます。

ボタンはセマンティックな `presentation` ペイロード（通常のエージェント返信および `message action=send` 内）から生成されます。OpenClaw は value ボタンを Mattermost のインタラクティブボタンとしてレンダリングし、URL ボタンはメッセージ本文内に見える形で残し、選択メニューは読みやすいテキストにダウングレードします。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

プレゼンテーションボタンのフィールド:

<ParamField path="label" type="string" required>
  表示ラベル（エイリアス: `text`）。
</ParamField>
<ParamField path="value" type="string">
  クリック時に送り返される値で、アクション ID として使用されます（エイリアス: `callback_data`, `callbackData`）。`url` が設定されていないクリック可能なボタンでは必須です。
</ParamField>
<ParamField path="url" type="string">
  リンクボタン。インタラクティブボタンではなく、メッセージ本文内に `label: url` テキストとしてレンダリングされます。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  ボタンスタイル。Mattermost はサポートしていない値にデフォルトのスタイルを適用します。
</ParamField>

エージェントのシステムプロンプトでボタンサポートを通知するには、チャンネル機能に `inlineButtons` を追加します。

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
    クリックしたユーザーは、メッセージ送信者と同じ DM/グループポリシーチェックに合格する必要があります。権限のないクリックには一時的な通知が表示され、無視されます。
  </Step>
  <Step title="ボタンが確認表示に置き換えられる">
    すべてのボタンが確認行（例: "✓ **Yes** selected by @user"）に置き換えられます。
  </Step>
  <Step title="エージェントが選択内容を受け取る">
    エージェントは選択内容をインバウンドメッセージ（およびシステムイベント）として受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="実装上の注意">
    - ボタンコールバックは HMAC-SHA256 検証を使用します（自動で、設定は不要です）。
    - クリック時には添付ブロック全体が置き換えられるため、すべてのボタンがまとめて削除されます。部分的な削除はできません。
    - ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限）。
    - `action_id` が元の投稿上のアクションと一致しないクリックは、`403`（"Unknown action"）で拒否されます。

  </Accordion>
  <Accordion title="設定と到達性">
    - `channels.mattermost.capabilities`: 機能文字列の配列。エージェントのシステムプロンプトでボタンツール説明を有効にするには `"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例: `https://gateway.example.com`）。Mattermost が Gateway のバインドホストに直接到達できない場合に使用します。
    - マルチアカウント構成では、同じフィールドを `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` の下にも設定できます。
    - `interactions.callbackBaseUrl` を省略した場合、OpenClaw は `gateway.customBindHost` + `gateway.port`（デフォルト 18789）からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。コールバックパスは `/mattermost/interactions/<accountId>` です。
    - 到達性ルール: ボタンコールバック URL は Mattermost サーバーから到達可能でなければなりません。`localhost` は Mattermost と OpenClaw が同じホスト/ネットワーク名前空間で実行されている場合にのみ機能します。
    - `channels.mattermost.interactions.allowedSourceIps`: ボタンコールバックの送信元 IP 許可リスト。これがない場合、ループバック送信元（`127.0.0.1`, `::1`）のみが受け付けられるため、リモートの Mattermost サーバーはここで許可リストに追加する必要があります。追加しない場合、クリックは `403` で拒否されます。リバースプロキシの背後では、転送ヘッダーから実際のクライアント IP を導出できるように `gateway.trustedProxies` も設定します。
    - コールバック先がプライベート/tailnet/内部の場合、そのホスト/ドメインを Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加します。

  </Accordion>
</AccordionGroup>

### 直接 API 連携（外部スクリプト）

外部スクリプトや Webhook は、エージェントの `message` ツールを経由せずに、Mattermost REST API を介してボタンを直接投稿できます。可能な場合は Plugin の `buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、以下のルールに従ってください。

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

1. 添付はトップレベルの `attachments` ではなく、`props.attachments` に入れます（静かに無視されます）。
2. すべてのアクションに `type: "button"` が必要です。ない場合、クリックは静かに握りつぶされます。
3. すべてのアクションに `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクションの `id` は**英数字のみ**（`[a-zA-Z0-9]`）でなければなりません。ハイフンとアンダースコアは Mattermost のサーバー側アクションルーティングを壊します（404 を返します）。使用前に取り除いてください。
5. `context.action_id` はボタンの `id` と一致する必要があります。Gateway は、投稿上に存在しない `action_id` のクリックを拒否します。
6. `context.action_id` は必須です。これがない場合、インタラクションハンドラーは 400 を返します。
7. コールバックの送信元 IP は許可されている必要があります（上記の `interactions.allowedSourceIps` を参照）。

</Warning>

**HMAC トークン生成**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは Gateway の検証ロジックと一致するトークンを生成する必要があります。

<Steps>
  <Step title="ボットトークンからシークレットを導出する">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)` を hex エンコードします。
  </Step>
  <Step title="コンテキストオブジェクトを構築する">
    `_token` **以外**のすべてのフィールドを含めてコンテキストオブジェクトを構築します。
  </Step>
  <Step title="ソート済みキーでシリアライズする">
    **再帰的にソートしたキー**かつ**スペースなし**でシリアライズします（Gateway はネストしたオブジェクトも正規化し、コンパクトな JSON を生成します）。
  </Step>
  <Step title="ペイロードに署名する">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="トークンを追加する">
    結果の hex ダイジェストをコンテキスト内の `_token` として追加します。
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
  <Accordion title="よくある HMAC の落とし穴">
    - Python の `json.dumps` はデフォルトでスペースを追加します（`{"key": "val"}`）。JavaScript のコンパクトな出力（`{"key":"val"}`）に一致させるには `separators=(",", ":")` を使用します。
    - 常に `_token` を除くコンテキストフィールド**すべて**に署名してください。Gateway は `_token` を取り除いてから、残りすべてに署名します。一部だけに署名すると、検証が静かに失敗します。
    - `sort_keys=True` を使用してください。Gateway は署名前にキーをソートし、Mattermost はペイロード保存時にコンテキストフィールドを並べ替える場合があります。
    - ランダムバイトではなく、ボットトークンからシークレットを導出してください（決定的）。シークレットは、ボタンを作成するプロセスと検証する Gateway の間で同一でなければなりません。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API を介してチャンネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` と Cron/Webhook 配信で `#channel-name` および `@username` ターゲットを使用できます。

設定は不要です。アダプターはアカウント設定のボットトークンを使用します。

## マルチアカウント

Mattermost は `channels.mattermost.accounts` の下で複数のアカウントをサポートします。

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

アカウント値はトップレベルのフィールドを上書きします。`channels.mattermost.defaultAccount` は、指定がない場合に使用されるアカウントを選択します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルに返信がない">
    ボットがチャンネル内にいることを確認し、メンションする（oncall）、トリガープレフィックスを使用する（onchar）、または `chatmode: "onmessage"` を設定してください。
  </Accordion>
  <Accordion title="認証またはマルチアカウントのエラー">
    - ボットトークン、ベース URL、アカウントが有効かどうかを確認してください。
    - マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。
    - プライベート/LAN の Mattermost ホストには `network.dangerouslyAllowPrivateNetwork: true` が必要です（SSRF ガードはデフォルトでプライベート IP をブロックします）。

  </Accordion>
  <Accordion title="ネイティブスラッシュコマンドが失敗する">
    - `Unauthorized: invalid command token.`: OpenClaw がコールバックトークンを受け入れませんでした。典型的な原因:
      - 起動時にスラッシュコマンドの登録が失敗した、または一部しか完了しなかった
      - コールバックが誤った Gateway/アカウントに到達している
      - Mattermost に、以前のコールバック先を指す古いコマンドがまだ残っている
      - Gateway がスラッシュコマンドを再有効化せずに再起動した
    - ネイティブスラッシュコマンドが動作しなくなった場合は、ログで `mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` を確認してください。
    - `callbackUrl` が省略され、コールバックが `http://localhost:18789/...` のようなループバック URL に解決されたという警告がログに出る場合、その URL はおそらく Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されている場合にのみ到達できます。代わりに、外部から到達可能な明示的な `commands.callbackUrl` を設定してください。

  </Accordion>
  <Accordion title="ボタンの問題">
    - ボタンが白いボックスとして表示される、またはまったく表示されない: ボタンデータの形式が不正です。各プレゼンテーションボタンには `label` と `value` が必要です（どちらかが欠けているボタンは破棄されます）。
    - ボタンは表示されるがクリックしても何も起きない: Mattermost サーバーから Gateway に到達できること、Mattermost サーバーの IP が `channels.mattermost.interactions.allowedSourceIps` に含まれていること（指定しない場合はループバックのみ許可）、プライベートターゲットの場合は `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホストが含まれていることを確認してください。
    - ボタンをクリックすると 404 が返る: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使用してください。
    - Gateway ログに `rejected callback source` が出る: クリックが `interactions.allowedSourceIps` の範囲外の IP から来ています。Mattermost サーバーまたは ingress を許可リストに追加し、リバースプロキシの背後では `gateway.trustedProxies` を設定してください。
    - Gateway ログに `invalid _token` が出る: HMAC の不一致です。すべてのコンテキストフィールド（一部ではなく）に署名していること、キーをソートしていること、コンパクト JSON（スペースなし）を使用していることを確認してください。上記の HMAC セクションを参照してください。
    - Gateway ログに `missing _token in context` が出る: `_token` フィールドがボタンのコンテキスト内にありません。インテグレーションペイロードを作成するときに含めてください。
    - Gateway が `Unknown action` でクリックを拒否する: `context.action_id` が投稿上のどのアクション `id` とも一致していません。両方を同じサニタイズ済みの値に設定してください。
    - Agent がボタンを提示しない: Mattermost チャンネル設定に `capabilities: ["inlineButtons"]` を追加してください。

  </Accordion>
</AccordionGroup>

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルとハードニング

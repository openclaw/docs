---
read_when:
    - Mattermostのセットアップ
    - Mattermost ルーティングのデバッグ
sidebarTitle: Mattermost
summary: Mattermost ボットのセットアップと OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-05-10T19:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58feb699238107c5f61ca0edf204d08b1b7e4e55444f037e8f02ea4147b8fec
    source_path: channels/mattermost.md
    workflow: 16
---

Status: ダウンロード可能な Plugin (ボットトークン + WebSocket イベント)。チャンネル、グループ、DM がサポートされています。Mattermost はセルフホスト可能なチームメッセージングプラットフォームです。製品の詳細とダウンロードについては公式サイト [mattermost.com](https://mattermost.com) を参照してください。

## インストール

チャンネルを構成する前に Mattermost をインストールします。

<Tabs>
  <Tab title="npm registry">
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

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

<Steps>
  <Step title="Plugin が利用可能であることを確認する">
    現在パッケージ化されている OpenClaw リリースには、すでにこれがバンドルされています。古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
  </Step>
  <Step title="Mattermost ボットを作成する">
    Mattermost ボットアカウントを作成し、**ボットトークン**をコピーします。
  </Step>
  <Step title="ベース URL をコピーする">
    Mattermost の**ベース URL** (例: `https://chat.example.com`) をコピーします。
  </Step>
  <Step title="OpenClaw を構成して Gateway を起動する">
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

  </Step>
</Steps>

## ネイティブスラッシュコマンド

ネイティブスラッシュコマンドはオプトインです。有効にすると、OpenClaw は Mattermost API 経由で `oc_*` スラッシュコマンドを登録し、Gateway HTTP サーバーでコールバック POST を受信します。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost が Gateway に直接到達できない場合に使用します (リバースプロキシ/公開 URL)。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="動作メモ">
    - `native: "auto"` は Mattermost ではデフォルトで無効です。有効にするには `native: true` を設定します。
    - `callbackUrl` が省略された場合、OpenClaw は Gateway のホスト/ポート + `callbackPath` からこれを導出します。
    - マルチアカウント構成では、`commands` はトップレベル、または `channels.mattermost.accounts.<id>.commands` 配下に設定できます (アカウント値はトップレベルフィールドを上書きします)。
    - コマンドコールバックは、OpenClaw が `oc_*` コマンドを登録したときに Mattermost から返されたコマンドごとのトークンで検証されます。
    - OpenClaw は各コールバックを受け入れる前に現在の Mattermost コマンド登録を更新するため、削除または再生成されたスラッシュコマンドの古いトークンは Gateway の再起動なしで受け入れられなくなります。
    - Mattermost API がコマンドがまだ最新であることを確認できない場合、コールバック検証はフェイルクローズします。失敗した検証は短時間キャッシュされ、同時検索は集約され、新しい検索開始はリプレイ圧力を抑えるためコマンドごとにレート制限されます。
    - 登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが解決されたコマンドの登録済みトークンと一致しない場合、スラッシュコールバックはフェイルクローズします (あるコマンドに有効なトークンで別のコマンドのアップストリーム検証に到達することはできません)。

  </Accordion>
  <Accordion title="到達可能性の要件">
    コールバックエンドポイントは Mattermost サーバーから到達可能である必要があります。

    - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されていない限り、`callbackUrl` を `localhost` に設定しないでください。
    - その URL が `/api/channels/mattermost/command` を OpenClaw にリバースプロキシしない限り、`callbackUrl` を Mattermost のベース URL に設定しないでください。
    - 簡単な確認は `curl https://<gateway-host>/api/channels/mattermost/command` です。GET は `404` ではなく、OpenClaw から `405 Method Not Allowed` を返す必要があります。

  </Accordion>
  <Accordion title="Mattermost の送信許可リスト">
    コールバックがプライベート/tailnet/内部アドレスを対象にする場合、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めるよう設定します。

    完全な URL ではなく、ホスト/ドメインエントリを使用します。

    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境変数 (デフォルトアカウント)

環境変数を使用したい場合は、Gateway ホストでこれらを設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境変数は**デフォルト**アカウント (`default`) にのみ適用されます。その他のアカウントでは構成値を使用する必要があります。

`MATTERMOST_URL` はワークスペース `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security) を参照してください。
</Note>

## チャットモード

Mattermost は DM に自動応答します。チャンネルの動作は `chatmode` で制御されます。

<Tabs>
  <Tab title="oncall (デフォルト)">
    チャンネルで @メンションされた場合にのみ応答します。
  </Tab>
  <Tab title="onmessage">
    すべてのチャンネルメッセージに応答します。
  </Tab>
  <Tab title="onchar">
    メッセージがトリガープレフィックスで始まる場合に応答します。
  </Tab>
</Tabs>

構成例:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

メモ:

- `onchar` は明示的な @メンションにも応答します。
- `channels.mattermost.requireMention` はレガシー構成では尊重されますが、`chatmode` が推奨されます。

## スレッドとセッション

`channels.mattermost.replyToMode` を使用して、チャンネルおよびグループの返信をメインチャンネルに残すか、トリガーとなった投稿の下にスレッドを開始するかを制御します。

- `off` (デフォルト): 受信投稿がすでにスレッド内にある場合にのみ、スレッドで返信します。
- `first`: トップレベルのチャンネル/グループ投稿では、その投稿の下にスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
- `all`: 現在の Mattermost では `first` と同じ動作です。
- ダイレクトメッセージはこの設定を無視し、非スレッドのままです。

構成例:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

メモ:

- スレッドスコープのセッションは、トリガーとなった投稿 ID をスレッドルートとして使用します。
- Mattermost ではスレッドルートが作成されると、後続チャンクとメディアは同じスレッド内で続くため、`first` と `all` は現在同等です。

## アクセス制御 (DM)

- デフォルト: `channels.mattermost.dmPolicy = "pairing"` (不明な送信者にはペアリングコードが発行されます)。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM: `channels.mattermost.dmPolicy="open"` に加えて `channels.mattermost.allowFrom=["*"]`。
- `channels.mattermost.allowFrom` は `accessGroup:<name>` エントリを受け入れます。[アクセスグループ](/ja-JP/channels/access-groups) を参照してください。

## チャンネル (グループ)

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"` (メンションゲート付き)。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します (ユーザー ID 推奨)。
- `channels.mattermost.groupAllowFrom` は `accessGroup:<name>` エントリを受け入れます。[アクセスグループ](/ja-JP/channels/access-groups) を参照してください。
- チャンネルごとのメンション上書きは、`channels.mattermost.groups.<channelId>.requireMention`、またはデフォルト用の `channels.mattermost.groups["*"].requireMention` 配下に置きます。
- `@username` マッチングは変更可能であり、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"` (メンションゲート付き)。
- ランタイムメモ: `channels.mattermost` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

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

`openclaw message send` または cron/webhooks で、これらのターゲット形式を使用します。

- チャンネルには `channel:<id>`
- DM には `user:<id>`
- DM には `@username` (Mattermost API 経由で解決)

<Warning>
裸の不透明な ID (`64ifufp...` など) は Mattermost では**曖昧**です (ユーザー ID かチャンネル ID)。

OpenClaw はこれらを**ユーザー優先**で解決します。

- ID がユーザーとして存在する場合 (`GET /api/v4/users/<id>` が成功)、OpenClaw は `/api/v4/channels/direct` 経由でダイレクトチャンネルを解決して **DM** を送信します。
- それ以外の場合、ID は**チャンネル ID**として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス (`user:<id>` / `channel:<id>`) を使用してください。
</Warning>

## DM チャンネルのリトライ

OpenClaw が Mattermost の DM ターゲットに送信し、先にダイレクトチャンネルを解決する必要がある場合、デフォルトで一時的なダイレクトチャンネル作成失敗をリトライします。

Mattermost Plugin 全体でこの動作を調整するには `channels.mattermost.dmChannelRetry` を使用し、1 つのアカウントに対しては `channels.mattermost.accounts.<id>.dmChannelRetry` を使用します。

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

メモ:

- これはすべての Mattermost API 呼び出しではなく、DM チャンネル作成 (`/api/v4/channels/direct`) にのみ適用されます。
- リトライは、レート制限、5xx 応答、ネットワークまたはタイムアウトエラーなどの一時的な失敗に適用されます。
- `429` 以外の 4xx クライアントエラーは永続的なものとして扱われ、リトライされません。

## プレビューストリーミング

Mattermost は思考、ツールアクティビティ、部分的な返信テキストを単一の**下書きプレビュー投稿**にストリーミングし、最終回答を安全に送信できるようになるとその場で確定します。プレビューは、チャンクごとのメッセージでチャンネルを埋めるのではなく、同じ投稿 ID で更新されます。メディア/エラーの最終送信では保留中のプレビュー編集がキャンセルされ、使い捨てのプレビュー投稿をフラッシュする代わりに通常配信が使用されます。

`channels.mattermost.streaming` で有効にします。

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
    - `partial` は通常の選択肢です。返信が増えるにつれて編集される 1 つのプレビュー投稿を作成し、その後完全な回答で確定します。
    - `block` はプレビュー投稿内で追記スタイルの下書きチャンクを使用します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。

  </Accordion>
  <Accordion title="ストリーミング動作メモ">
    - ストリームをその場で確定できない場合 (たとえば投稿がストリーム中に削除された場合)、OpenClaw は返信が失われないように新しい最終投稿の送信にフォールバックします。
    - 推論のみのペイロードは、`> Reasoning:` ブロック引用として届くテキストも含めて、チャンネル投稿から抑制されます。他のサーフェスで思考を表示するには `/reasoning on` を設定します。Mattermost の最終投稿には回答のみが残ります。
    - チャンネルマッピング行列については [ストリーミング](/ja-JP/concepts/streaming#preview-streaming-modes) を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション (message ツール)

- `channel=mattermost` で `message action=react` を使用します。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` は `thumbsup` や `:+1:` のような名前を受け入れます (コロンは任意です)。
- リアクションを削除するには `remove=true` (真偽値) を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションにシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

構成:

- `channels.mattermost.actions.reactions`: リアクションアクションを有効/無効にします (デフォルトは true)。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン (message ツール)

クリック可能なボタン付きのメッセージを送信します。ユーザーがボタンをクリックすると、エージェントは選択を受信して応答できます。

チャンネル機能に `inlineButtons` を追加してボタンを有効にします。

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` パラメーター付きで `message action=send` を使用します。ボタンは 2D 配列 (ボタンの行) です。

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンフィールド:

<ParamField path="text" type="string" required>
  表示ラベル。
</ParamField>
<ParamField path="callback_data" type="string" required>
  クリック時に送り返される値（アクション ID として使用）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  ボタンスタイル。
</ParamField>

ユーザーがボタンをクリックすると:

<Steps>
  <Step title="Buttons replaced with confirmation">
    すべてのボタンが確認行に置き換えられます（例: 「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="Agent receives the selection">
    エージェントは選択内容を受信メッセージとして受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - ボタンコールバックは HMAC-SHA256 検証を使用します（自動、設定不要）。
    - Mattermost は API レスポンスからコールバックデータを取り除くため（セキュリティ機能）、クリック時にはすべてのボタンが削除されます - 部分的な削除はできません。
    - ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限）。

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: capability 文字列の配列。エージェントのシステムプロンプトでボタンツールの説明を有効にするには `"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例: `https://gateway.example.com`）。Mattermost が Gateway のバインドホストへ直接到達できない場合に使用します。
    - 複数アカウント構成では、同じフィールドを `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` の下にも設定できます。
    - `interactions.callbackBaseUrl` が省略されると、OpenClaw は `gateway.customBindHost` + `gateway.port` からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。
    - 到達性ルール: ボタンコールバック URL は Mattermost サーバーから到達可能である必要があります。`localhost` は Mattermost と OpenClaw が同じホストまたはネットワーク名前空間で実行されている場合にのみ機能します。
    - コールバックターゲットがプライベート、tailnet、内部の場合、そのホストまたはドメインを Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加します。

  </Accordion>
</AccordionGroup>

### 直接 API 連携（外部スクリプト）

外部スクリプトと Webhook は、エージェントの `message` ツールを経由せずに、Mattermost REST API 経由でボタンを直接投稿できます。可能な場合は Plugin の `buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、次のルールに従います:

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
                action_id: "mybutton01", // must match button id (for name lookup)
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

1. attachments はトップレベルの `attachments` ではなく `props.attachments` に入れます（黙って無視されます）。
2. すべてのアクションには `type: "button"` が必要です - これがないと、クリックは黙って破棄されます。
3. すべてのアクションには `id` フィールドが必要です - Mattermost は ID のないアクションを無視します。
4. アクションの `id` は **英数字のみ**（`[a-zA-Z0-9]`）である必要があります。ハイフンとアンダースコアは Mattermost のサーバー側アクションルーティングを壊します（404 を返します）。使用前に削除してください。
5. `context.action_id` はボタンの `id` と一致している必要があります。これにより、確認メッセージには生の ID ではなくボタン名（例: 「Approve」）が表示されます。
6. `context.action_id` は必須です - これがないとインタラクションハンドラーは 400 を返します。

</Warning>

**HMAC トークン生成**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは、Gateway の検証ロジックに一致するトークンを生成する必要があります:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    `_token` **以外**のすべてのフィールドを含むコンテキストオブジェクトを構築します。
  </Step>
  <Step title="Serialize with sorted keys">
    **ソート済みキー**かつ**スペースなし**でシリアライズします（Gateway はソート済みキーで `JSON.stringify` を使用し、これはコンパクトな出力を生成します）。
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
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
  <Accordion title="Common HMAC pitfalls">
    - Python の `json.dumps` はデフォルトでスペースを追加します（`{"key": "val"}`）。JavaScript のコンパクトな出力（`{"key":"val"}`）に合わせるには `separators=(",", ":")` を使用します。
    - 常に `_token` を除くコンテキストフィールド**すべて**に署名します。Gateway は `_token` を取り除いてから、残りすべてに署名します。一部だけに署名すると、黙って検証に失敗します。
    - `sort_keys=True` を使用します - Gateway は署名前にキーをソートし、Mattermost はペイロード保存時にコンテキストフィールドを並べ替えることがあります。
    - secret はランダムバイトではなく、ボットトークンから導出します（決定的）。secret は、ボタンを作成するプロセスと検証する Gateway の間で同じである必要があります。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API 経由でチャンネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` と cron/webhook 配信で `#channel-name` と `@username` ターゲットを使用できます。

設定は不要です - アダプターはアカウント設定のボットトークンを使用します。

## 複数アカウント

Mattermost は `channels.mattermost.accounts` の下で複数アカウントをサポートします:

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

## トラブルシューティング

<AccordionGroup>
  <Accordion title="No replies in channels">
    ボットがチャンネル内にいることを確認し、メンションする (oncall)、トリガープレフィックスを使用する (onchar)、または `chatmode: "onmessage"` を設定します。
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - ボットトークン、ベース URL、アカウントが有効かどうかを確認します。
    - 複数アカウントの問題: 環境変数は `default` アカウントにのみ適用されます。

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw がコールバックトークンを受け入れませんでした。典型的な原因:
      - スラッシュコマンドの登録が起動時に失敗した、または部分的にしか完了しなかった
      - コールバックが間違った Gateway またはアカウントに到達している
      - Mattermost に、以前のコールバックターゲットを指す古いコマンドがまだ残っている
      - Gateway がスラッシュコマンドを再有効化せずに再起動した
    - ネイティブスラッシュコマンドが動作しなくなった場合は、ログで `mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` を確認します。
    - `callbackUrl` が省略され、ログでコールバックが `http://127.0.0.1:18789/...` に解決されたという警告が出ている場合、その URL は Mattermost が OpenClaw と同じホストまたはネットワーク名前空間で実行されている場合にしか到達できない可能性があります。代わりに、外部から到達可能な明示的な `commands.callbackUrl` を設定します。

  </Accordion>
  <Accordion title="Buttons issues">
    - ボタンが白いボックスとして表示される: エージェントが不正な形式のボタンデータを送信している可能性があります。各ボタンに `text` と `callback_data` の両方のフィールドがあることを確認してください。
    - ボタンは表示されるがクリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、および ServiceSettings の `EnablePostActionIntegration` が `true` であることを確認します。
    - ボタンがクリック時に 404 を返す: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使用してください。
    - Gateway ログに `invalid _token` が出る: HMAC の不一致です。すべてのコンテキストフィールド（一部ではなく）に署名し、ソート済みキーを使用し、コンパクト JSON（スペースなし）を使用していることを確認してください。上記の HMAC セクションを参照してください。
    - Gateway ログに `missing _token in context` が出る: `_token` フィールドがボタンのコンテキスト内にありません。インテグレーションペイロードを構築するときに含めていることを確認してください。
    - 確認にボタン名ではなく生の ID が表示される: `context.action_id` がボタンの `id` と一致していません。両方を同じサニタイズ済み値に設定してください。
    - エージェントがボタンを認識しない: Mattermost チャンネル設定に `capabilities: ["inlineButtons"]` を追加します。

  </Accordion>
</AccordionGroup>

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) - サポートされるすべてのチャンネル
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化

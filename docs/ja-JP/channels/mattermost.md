---
read_when:
    - Mattermost のセットアップ
    - Mattermost ルーティングのデバッグ
sidebarTitle: Mattermost
summary: Mattermost ボットのセットアップと OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T04:59:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

ステータス: バンドル済み Plugin (ボットトークン + WebSocket イベント)。チャネル、グループ、DM がサポートされています。Mattermost はセルフホスト可能なチームメッセージングプラットフォームです。製品の詳細とダウンロードについては、公式サイト [mattermost.com](https://mattermost.com) を参照してください。

## バンドル済み Plugin

<Note>
Mattermost は現在の OpenClaw リリースではバンドル済み Plugin として同梱されているため、通常のパッケージ化されたビルドでは別途インストールする必要はありません。
</Note>

古いビルドを使用している場合、または Mattermost を除外したカスタムインストールを使用している場合は、公開されている場合に現在の npm パッケージをインストールしてください。

<Tabs>
  <Tab title="npm レジストリ">
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

npm が OpenClaw 所有のパッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、現在のパッケージ化された OpenClaw ビルドまたはローカルチェックアウトパスを使用してください。

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

<Steps>
  <Step title="Plugin が利用可能であることを確認する">
    現在のパッケージ化された OpenClaw リリースには、すでに同梱されています。古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
  </Step>
  <Step title="Mattermost ボットを作成する">
    Mattermost ボットアカウントを作成し、**ボットトークン**をコピーします。
  </Step>
  <Step title="ベース URL をコピーする">
    Mattermost の**ベース URL** (例: `https://chat.example.com`) をコピーします。
  </Step>
  <Step title="OpenClaw を設定し、Gateway を起動する">
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

ネイティブスラッシュコマンドはオプトインです。有効にすると、OpenClaw は Mattermost API 経由で `oc_*` スラッシュコマンドを登録し、Gateway HTTP サーバー上でコールバック POST を受信します。

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
  <Accordion title="動作に関する注記">
    - `native: "auto"` は Mattermost ではデフォルトで無効です。有効にするには `native: true` を設定します。
    - `callbackUrl` を省略すると、OpenClaw は Gateway のホスト/ポート + `callbackPath` から URL を導出します。
    - 複数アカウント構成では、`commands` を最上位に設定するか、`channels.mattermost.accounts.<id>.commands` の下に設定できます (アカウント値は最上位フィールドを上書きします)。
    - コマンドコールバックは、OpenClaw が `oc_*` コマンドを登録したときに Mattermost から返されるコマンド単位のトークンで検証されます。
    - 登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが登録済みコマンドのいずれとも一致しない場合、スラッシュコールバックはフェイルクローズします。

  </Accordion>
  <Accordion title="到達可能性の要件">
    コールバックエンドポイントは Mattermost サーバーから到達可能である必要があります。

    - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されている場合を除き、`callbackUrl` を `localhost` に設定しないでください。
    - その URL が `/api/channels/mattermost/command` を OpenClaw にリバースプロキシしない限り、`callbackUrl` を Mattermost のベース URL に設定しないでください。
    - 簡単な確認方法は `curl https://<gateway-host>/api/channels/mattermost/command` です。GET は `404` ではなく、OpenClaw から `405 Method Not Allowed` を返すはずです。

  </Accordion>
  <Accordion title="Mattermost エグレス許可リスト">
    コールバックのターゲットがプライベート/tailnet/内部アドレスの場合は、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックのホスト/ドメインを含めるよう設定します。

    完全な URL ではなく、ホスト/ドメインのエントリを使用します。

    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境変数 (デフォルトアカウント)

環境変数を使いたい場合は、Gateway ホストでこれらを設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境変数は**デフォルト**アカウント (`default`) にのみ適用されます。他のアカウントでは設定値を使用する必要があります。

`MATTERMOST_URL` はワークスペース `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security)を参照してください。
</Note>

## チャットモード

Mattermost は DM に自動的に応答します。チャネルの動作は `chatmode` で制御されます。

<Tabs>
  <Tab title="oncall (デフォルト)">
    チャネルで @メンションされた場合にのみ応答します。
  </Tab>
  <Tab title="onmessage">
    すべてのチャネルメッセージに応答します。
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
      oncharPrefixes: [">", "!"],
    },
  },
}
```

注記:

- `onchar` でも明示的な @メンションには応答します。
- `channels.mattermost.requireMention` はレガシー設定では尊重されますが、`chatmode` が推奨されます。

## スレッドとセッション

`channels.mattermost.replyToMode` を使用して、チャネルとグループの返信をメインチャネルに残すか、トリガーとなった投稿の下にスレッドを開始するかを制御します。

- `off` (デフォルト): 受信投稿がすでにスレッド内にある場合にのみ、スレッドで返信します。
- `first`: 最上位のチャネル/グループ投稿について、その投稿の下にスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
- `all`: 現在の Mattermost では `first` と同じ動作です。
- ダイレクトメッセージはこの設定を無視し、非スレッドのままです。

設定例:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

注記:

- スレッドスコープのセッションは、トリガーとなった投稿 ID をスレッドルートとして使用します。
- Mattermost にスレッドルートができると、後続のチャンクとメディアは同じスレッド内で継続するため、`first` と `all` は現在は同等です。

## アクセス制御 (DM)

- デフォルト: `channels.mattermost.dmPolicy = "pairing"` (不明な送信者にはペアリングコードが渡されます)。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャネル (グループ)

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"` (メンションゲートあり)。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します (ユーザー ID 推奨)。
- チャネル単位のメンション上書きは、`channels.mattermost.groups.<channelId>.requireMention`、またはデフォルト用の `channels.mattermost.groups["*"].requireMention` の下にあります。
- `@username` の照合は変更される可能性があり、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。
- オープンチャネル: `channels.mattermost.groupPolicy="open"` (メンションゲートあり)。
- ランタイム注記: `channels.mattermost` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

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

`openclaw message send` または cron/Webhook では、これらのターゲット形式を使用します。

- チャネルには `channel:<id>`
- DM には `user:<id>`
- DM には `@username` (Mattermost API 経由で解決)

<Warning>
裸の不透明 ID (`64ifufp...` など) は Mattermost では**曖昧**です (ユーザー ID とチャネル ID)。

OpenClaw はそれらを**ユーザー優先**で解決します。

- ID がユーザーとして存在する場合 (`GET /api/v4/users/<id>` が成功する)、OpenClaw は `/api/v4/channels/direct` 経由でダイレクトチャネルを解決し、**DM** を送信します。
- それ以外の場合、ID は**チャネル ID** として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス (`user:<id>` / `channel:<id>`) を使用してください。
</Warning>

## DM チャネルのリトライ

OpenClaw が Mattermost DM ターゲットに送信し、最初にダイレクトチャネルを解決する必要がある場合、デフォルトでは一時的なダイレクトチャネル作成失敗をリトライします。

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

注記:

- これはすべての Mattermost API 呼び出しではなく、DM チャネル作成 (`/api/v4/channels/direct`) にのみ適用されます。
- リトライは、レート制限、5xx レスポンス、ネットワークエラーやタイムアウトエラーなどの一時的な失敗に適用されます。
- `429` 以外の 4xx クライアントエラーは永続的なものとして扱われ、リトライされません。

## プレビューストリーミング

Mattermost は、思考、ツールアクティビティ、部分的な返信テキストを 1 つの**下書きプレビュー投稿**にストリーミングし、最終回答を安全に送信できるようになった時点でその場で確定します。プレビューはチャンクごとのメッセージでチャネルを埋めるのではなく、同じ投稿 ID 上で更新されます。メディア/エラーの最終結果は保留中のプレビュー編集をキャンセルし、使い捨てのプレビュー投稿をフラッシュする代わりに通常の配信を使用します。

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
    - `partial` は通常の選択肢です。返信の増加に合わせて編集される 1 つのプレビュー投稿を使い、最後に完全な回答で確定します。
    - `block` はプレビュー投稿内で追記スタイルの下書きチャンクを使用します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。

  </Accordion>
  <Accordion title="ストリーミング動作に関する注記">
    - ストリームをその場で確定できない場合 (たとえば投稿がストリーム中に削除された場合)、OpenClaw は新しい最終投稿の送信にフォールバックするため、返信が失われることはありません。
    - 推論のみのペイロードは、`> Reasoning:` blockquote として到着するテキストを含め、チャネル投稿から抑制されます。他のサーフェスで思考を表示するには `/reasoning on` を設定します。Mattermost の最終投稿は回答のみを保持します。
    - チャネルマッピングマトリクスについては、[Streaming](/ja-JP/concepts/streaming#preview-streaming-modes) を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション (メッセージツール)

- `channel=mattermost` とともに `message action=react` を使用します。
- `messageId` は Mattermost 投稿 ID です。
- `emoji` は `thumbsup` や `:+1:` のような名前を受け付けます (コロンは任意です)。
- リアクションを削除するには `remove=true` (ブール値) を設定します。
- リアクション追加/削除イベントは、ルーティングされたエージェントセッションにシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクションアクションを有効/無効にします (デフォルトは true)。
- アカウント単位の上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン (メッセージツール)

クリック可能なボタン付きメッセージを送信します。ユーザーがボタンをクリックすると、エージェントが選択を受信し、応答できます。

チャネル機能に `inlineButtons` を追加してボタンを有効にします。

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` パラメーターとともに `message action=send` を使用します。ボタンは 2D 配列 (ボタンの行) です。

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンフィールド:

<ParamField path="text" type="string" required>
  表示ラベル。
</ParamField>
<ParamField path="callback_data" type="string" required>
  クリック時に送り返される値 (アクション ID として使用)。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  ボタンスタイル。
</ParamField>

ユーザーがボタンをクリックした場合:

<Steps>
  <Step title="ボタンが確認表示に置き換えられる">
    すべてのボタンは確認行に置き換えられます（例: "✓ **Yes** selected by @user"）。
  </Step>
  <Step title="エージェントが選択を受け取る">
    エージェントは選択を受信メッセージとして受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="実装メモ">
    - ボタンコールバックは HMAC-SHA256 検証を使用します（自動、設定不要）。
    - Mattermost は API 応答からコールバックデータを取り除く（セキュリティ機能）ため、クリック時にはすべてのボタンが削除されます。一部だけの削除はできません。
    - ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限）。

  </Accordion>
  <Accordion title="設定と到達性">
    - `channels.mattermost.capabilities`: ケイパビリティ文字列の配列。エージェントのシステムプロンプトでボタンツールの説明を有効にするには `"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例 `https://gateway.example.com`）。Mattermost がバインドホストで Gateway に直接到達できない場合に使用します。
    - マルチアカウント構成では、同じフィールドを `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` の下にも設定できます。
    - `interactions.callbackBaseUrl` が省略された場合、OpenClaw は `gateway.customBindHost` + `gateway.port` からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。
    - 到達性ルール: ボタンのコールバック URL は Mattermost サーバーから到達可能である必要があります。`localhost` が機能するのは、Mattermost と OpenClaw が同じホスト/ネットワーク名前空間で実行されている場合のみです。
    - コールバック先がプライベート/tailnet/内部の場合は、そのホスト/ドメインを Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加します。

  </Accordion>
</AccordionGroup>

### 直接 API 統合（外部スクリプト）

外部スクリプトと Webhook は、エージェントの `message` ツールを経由せず、Mattermost REST API 経由でボタンを直接投稿できます。可能な場合は Plugin の `buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、次のルールに従います。

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
            id: "mybutton01", // alphanumeric only — see below
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

1. 添付はトップレベルの `attachments` ではなく、`props.attachments` に入れます（黙って無視されます）。
2. すべてのアクションに `type: "button"` が必要です。これがない場合、クリックは黙って破棄されます。
3. すべてのアクションに `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクションの `id` は **英数字のみ**（`[a-zA-Z0-9]`）である必要があります。ハイフンとアンダースコアは Mattermost のサーバー側アクションルーティングを壊します（404 を返します）。使用前に取り除いてください。
5. 確認メッセージが生の ID ではなくボタン名（例: "Approve"）を表示するように、`context.action_id` はボタンの `id` と一致している必要があります。
6. `context.action_id` は必須です。これがない場合、インタラクションハンドラーは 400 を返します。

</Warning>

**HMAC トークン生成**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは、Gateway の検証ロジックと一致するトークンを生成する必要があります。

<Steps>
  <Step title="bot token からシークレットを導出する">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="コンテキストオブジェクトを構築する">
    `_token` **以外**のすべてのフィールドを含むコンテキストオブジェクトを構築します。
  </Step>
  <Step title="ソート済みキーでシリアライズする">
    **ソート済みキー**かつ**スペースなし**でシリアライズします（Gateway はソート済みキーで `JSON.stringify` を使用し、コンパクトな出力を生成します）。
  </Step>
  <Step title="ペイロードに署名する">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="トークンを追加する">
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
  <Accordion title="よくある HMAC の落とし穴">
    - Python の `json.dumps` はデフォルトでスペースを追加します（`{"key": "val"}`）。JavaScript のコンパクトな出力（`{"key":"val"}`）に合わせるには `separators=(",", ":")` を使用します。
    - 常に（`_token` を除く）**すべて**のコンテキストフィールドに署名します。Gateway は `_token` を取り除いてから、残りすべてに署名します。一部だけに署名すると、検証が黙って失敗します。
    - `sort_keys=True` を使用します。Gateway は署名前にキーをソートし、Mattermost はペイロードを保存するときにコンテキストフィールドの順序を変更する場合があります。
    - ランダムバイトではなく、bot token からシークレットを導出します（決定的）。シークレットは、ボタンを作成するプロセスと検証する Gateway の間で同じである必要があります。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API 経由でチャンネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` と cron/Webhook 配信で `#channel-name` と `@username` の宛先を使用できます。

設定は不要です。アダプターはアカウント設定の bot token を使用します。

## マルチアカウント

Mattermost は `channels.mattermost.accounts` の下で複数アカウントをサポートします。

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
  <Accordion title="チャンネルで返信がない">
    bot がチャンネルにいることを確認し、メンションする（oncall）、トリガープレフィックスを使用する（onchar）、または `chatmode: "onmessage"` を設定します。
  </Accordion>
  <Accordion title="認証またはマルチアカウントのエラー">
    - bot token、ベース URL、アカウントが有効かどうかを確認します。
    - マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。

  </Accordion>
  <Accordion title="ネイティブスラッシュコマンドが失敗する">
    - `Unauthorized: invalid command token.`: OpenClaw がコールバックトークンを受け入れませんでした。典型的な原因:
      - スラッシュコマンドの登録が起動時に失敗した、または一部しか完了していない
      - コールバックが間違った Gateway/アカウントに到達している
      - Mattermost に以前のコールバック先を指す古いコマンドがまだ残っている
      - Gateway がスラッシュコマンドを再有効化せずに再起動した
    - ネイティブスラッシュコマンドが動作しなくなった場合は、ログで `mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` を確認します。
    - `callbackUrl` が省略され、コールバックが `http://127.0.0.1:18789/...` に解決されたという警告がログに出ている場合、その URL はおそらく Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されている場合にのみ到達可能です。代わりに、外部から到達可能な明示的な `commands.callbackUrl` を設定します。

  </Accordion>
  <Accordion title="ボタンの問題">
    - ボタンが白いボックスとして表示される: エージェントが不正な形式のボタンデータを送信している可能性があります。各ボタンに `text` と `callback_data` の両方のフィールドがあることを確認します。
    - ボタンは表示されるが、クリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、および ServiceSettings の `EnablePostActionIntegration` が `true` であることを確認します。
    - クリック時にボタンが 404 を返す: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使用します。
    - Gateway ログに `invalid _token` と出る: HMAC の不一致です。一部ではなくすべてのコンテキストフィールドに署名し、ソート済みキーを使用し、コンパクト JSON（スペースなし）を使用していることを確認します。上記の HMAC セクションを参照してください。
    - Gateway ログに `missing _token in context` と出る: `_token` フィールドがボタンのコンテキストにありません。統合ペイロードを構築するときに含めていることを確認します。
    - 確認表示にボタン名ではなく生の ID が表示される: `context.action_id` がボタンの `id` と一致していません。両方に同じサニタイズ済み値を設定します。
    - エージェントがボタンを認識しない: Mattermost チャンネル設定に `capabilities: ["inlineButtons"]` を追加します。

  </Accordion>
</AccordionGroup>

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング

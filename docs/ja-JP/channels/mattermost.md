---
read_when:
    - Mattermost のセットアップ
    - Mattermost ルーティングのデバッグ
summary: Mattermost ボットのセットアップと OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T13:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

ステータス: バンドル済みPlugin（ボットトークン + WebSocket イベント）。チャネル、グループ、DMをサポートしています。
Mattermost はセルフホスト可能なチームメッセージングプラットフォームです。製品の詳細とダウンロードについては、公式サイト [mattermost.com](https://mattermost.com) を参照してください。

## バンドル済みPlugin

Mattermost は現在の OpenClaw リリースではバンドル済みPluginとして提供されるため、通常のパッケージ化されたビルドでは別途インストールは不要です。

古いビルドまたは Mattermost を含まないカスタムインストールを使っている場合は、手動でインストールしてください。

CLI 経由でインストール（npm レジストリ）:

```bash
openclaw plugins install @openclaw/mattermost
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

1. Mattermost Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. Mattermost ボットアカウントを作成し、**ボットトークン**をコピーします。
3. Mattermost の**ベース URL** をコピーします（例: `https://chat.example.com`）。
4. OpenClaw を設定して Gateway を起動します。

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
        // Mattermost から Gateway に直接到達できない場合に使用します（リバースプロキシ/公開 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

注意:

- `native: "auto"` は Mattermost では既定で無効です。有効にするには `native: true` を設定してください。
- `callbackUrl` を省略した場合、OpenClaw は Gateway の host/port + `callbackPath` から導出します。
- マルチアカウント構成では、`commands` はトップレベルまたは `channels.mattermost.accounts.<id>.commands` 配下に設定できます（アカウント値がトップレベルのフィールドを上書きします）。
- コマンドコールバックは、OpenClaw が `oc_*` コマンドを登録したときに Mattermost から返されるコマンドごとのトークンで検証されます。
- スラッシュコールバックは、登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが登録済みコマンドのいずれとも一致しない場合に fail closed します。
- 到達可能性の要件: コールバックエンドポイントは Mattermost サーバーから到達可能でなければなりません。
  - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間上で動作していない限り、`callbackUrl` に `localhost` を設定しないでください。
  - その URL が `/api/channels/mattermost/command` を OpenClaw にリバースプロキシしていない限り、`callbackUrl` に Mattermost のベース URL を設定しないでください。
  - 簡単な確認方法は `curl https://<gateway-host>/api/channels/mattermost/command` です。GET は `404` ではなく、OpenClaw からの `405 Method Not Allowed` を返す必要があります。
- Mattermost の送信先許可リスト要件:
  - コールバック先がプライベート/tailnet/内部アドレスを対象にする場合は、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックの host/domain を含めてください。
  - 完全な URL ではなく、host/domain エントリを使ってください。
    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

## 環境変数（既定アカウント）

環境変数を使いたい場合は、Gateway ホストで以下を設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

環境変数は**既定**アカウント（`default`）にのみ適用されます。その他のアカウントでは設定値を使う必要があります。

`MATTERMOST_URL` はワークスペースの `.env` からは設定できません。[Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## チャットモード

Mattermost は DM に自動的に応答します。チャネルでの動作は `chatmode` で制御されます。

- `oncall`（既定）: チャネルで @メンションされたときだけ応答します。
- `onmessage`: すべてのチャネルメッセージに応答します。
- `onchar`: メッセージがトリガープレフィックスで始まると応答します。

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

注意:

- `onchar` は明示的な @メンションにも引き続き応答します。
- `channels.mattermost.requireMention` はレガシー設定では尊重されますが、`chatmode` の使用を推奨します。

## スレッドとセッション

`channels.mattermost.replyToMode` を使うと、チャネルおよびグループの返信をメインチャネル内にとどめるか、トリガーとなった投稿の下にスレッドを開始するかを制御できます。

- `off`（既定）: 受信投稿がすでにスレッド内にある場合にのみ、そのスレッドで返信します。
- `first`: トップレベルのチャネル/グループ投稿では、その投稿の下にスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
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

注意:

- スレッドスコープのセッションでは、トリガーとなった投稿 ID をスレッドルートとして使います。
- Mattermost にスレッドルートが存在すると、後続のチャンクとメディアはその同じスレッド内で継続するため、現在 `first` と `all` は同等です。

## アクセス制御（DM）

- 既定: `channels.mattermost.dmPolicy = "pairing"`（未知の送信者にはペアリングコードが送られます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャネル（グループ）

- 既定: `channels.mattermost.groupPolicy = "allowlist"`（メンションゲート付き）。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します（ユーザー ID 推奨）。
- チャネルごとのメンション上書きは `channels.mattermost.groups.<channelId>.requireMention`、または既定値として `channels.mattermost.groups["*"].requireMention` にあります。
- `@username` の一致は可変であり、`channels.mattermost.dangerouslyAllowNameMatching: true` のときだけ有効です。
- オープンチャネル: `channels.mattermost.groupPolicy="open"`（メンションゲート付き）。
- ランタイム注意: `channels.mattermost` が完全に欠けている場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されていても同様です）。

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

## 送信先配信のターゲット

`openclaw message send` または Cron/Webhook では、以下のターゲット形式を使います。

- チャネルには `channel:<id>`
- DM には `user:<id>`
- DM には `@username`（Mattermost API で解決）

裸の不透明 ID（`64ifufp...` のようなもの）は、Mattermost では**曖昧**です（ユーザー ID かチャネル ID か）。

OpenClaw はこれらを**ユーザー優先**で解決します。

- ID がユーザーとして存在する場合（`GET /api/v4/users/<id>` が成功）、OpenClaw は `/api/v4/channels/direct` でダイレクトチャネルを解決して **DM** を送信します。
- それ以外の場合、その ID は **チャネル ID** として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使ってください。

## DM チャネル再試行

OpenClaw が Mattermost の DM ターゲットに送信し、その前にダイレクトチャネルを解決する必要がある場合、既定では一時的なダイレクトチャネル作成失敗を再試行します。

この動作は、Mattermost Plugin 全体に対して `channels.mattermost.dmChannelRetry`、または特定アカウントに対して `channels.mattermost.accounts.<id>.dmChannelRetry` で調整できます。

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

注意:

- これは DM チャネル作成（`/api/v4/channels/direct`）にのみ適用され、すべての Mattermost API 呼び出しに適用されるわけではありません。
- 再試行は、レート制限、5xx レスポンス、ネットワークエラー、タイムアウトエラーなどの一時的な失敗に適用されます。
- `429` 以外の 4xx クライアントエラーは恒久的なものとして扱われ、再試行されません。

## プレビューストリーミング

Mattermost は、思考、ツールアクティビティ、部分的な返信テキストを単一の**下書きプレビュー投稿**にストリーミングし、最終回答の送信が安全になった時点でその場で確定します。プレビューはチャンクごとのメッセージでチャネルを埋める代わりに、同じ投稿 ID 上で更新されます。メディア/エラーの最終結果では、保留中のプレビュー編集をキャンセルし、使い捨てのプレビュー投稿をフラッシュする代わりに通常配信を使います。

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

注意:

- `partial` が通常の選択です。返信が伸びるにつれて編集される 1 つのプレビュー投稿を使い、その後、完全な回答で確定します。
- `block` はプレビュー投稿内で追記スタイルの下書きチャンクを使います。
- `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
- `off` はプレビューストリーミングを無効にします。
- ストリームをその場で確定できない場合（たとえば、ストリーム途中で投稿が削除された場合）、OpenClaw は新しい最終投稿の送信にフォールバックするため、返信が失われることはありません。
- 推論のみのペイロードはチャネル投稿から抑制されます。これには、`> Reasoning:` ブロッククォートとして届くテキストも含まれます。思考を他の画面で見たい場合は `/reasoning on` を設定してください。Mattermost の最終投稿には回答のみが保持されます。
- チャネルマッピング行列については [Streaming](/ja-JP/concepts/streaming#preview-streaming-modes) を参照してください。

## リアクション（message ツール）

- `channel=mattermost` で `message action=react` を使います。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` には `thumbsup` や `:+1:` のような名前を指定できます（コロンは省略可能です）。
- リアクションを削除するには `remove=true`（boolean）を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションにシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクションアクションの有効/無効を切り替えます（既定は true）。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（message ツール）

クリック可能なボタン付きメッセージを送信します。ユーザーがボタンをクリックすると、エージェントはその選択を受け取り、応答できます。

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

`buttons` パラメータ付きで `message action=send` を使います。ボタンは 2 次元配列です（ボタンの行）。

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンのフィールド:

- `text`（必須）: 表示ラベル。
- `callback_data`（必須）: クリック時に返される値（action ID として使われます）。
- `style`（任意）: `"default"`、`"primary"`、または `"danger"`。

ユーザーがボタンをクリックすると:

1. すべてのボタンが確認行（例: "✓ **Yes** selected by @user"）に置き換えられます。
2. エージェントはその選択を受信メッセージとして受け取り、応答します。

注意:

- ボタンコールバックは HMAC-SHA256 検証を使います（自動、設定不要）。
- Mattermost は API レスポンスから callback data を取り除くため（セキュリティ機能）、クリック時にはすべてのボタンが削除されます。部分的な削除はできません。
- ハイフンまたはアンダースコアを含む action ID は自動的にサニタイズされます（Mattermost のルーティング制限）。

設定:

- `channels.mattermost.capabilities`: 機能文字列の配列。`"inlineButtons"` を追加すると、エージェントのシステムプロンプトでボタンツールの説明が有効になります。
- `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例: `https://gateway.example.com`）。Mattermost が Gateway の bind host に直接到達できない場合に使います。
- マルチアカウント構成では、同じフィールドを `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 配下にも設定できます。
- `interactions.callbackBaseUrl` を省略した場合、OpenClaw は `gateway.customBindHost` + `gateway.port` からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。
- 到達可能性ルール: ボタンコールバック URL は Mattermost サーバーから到達可能でなければなりません。`localhost` が使えるのは、Mattermost と OpenClaw が同じホスト/ネットワーク名前空間で動作している場合だけです。
- コールバック先がプライベート/tailnet/内部の場合は、その host/domain を Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加してください。

### 直接 API 統合（外部スクリプト）

外部スクリプトや Webhook は、エージェントの `message` ツールを経由せず、Mattermost REST API 経由で直接ボタンを投稿できます。可能な場合は Plugin の `buildButtonAttachments()` を使ってください。生の JSON を投稿する場合は、以下のルールに従ってください。

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
            id: "mybutton01", // 英数字のみ — 詳細は以下
            type: "button", // 必須。これがないとクリックは静かに無視される
            name: "Approve", // 表示ラベル
            style: "primary", // 任意: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ボタン名の参照のため、button id と一致する必要がある
                action: "approve",
                // ... 任意のカスタムフィールド ...
                _token: "<hmac>", // 詳細は以下の HMAC セクションを参照
              },
            },
          },
        ],
      },
    ],
  },
}
```

**重要なルール:**

1. Attachments はトップレベルの `attachments` ではなく、`props.attachments` に入れます（そうしないと静かに無視されます）。
2. すべての action に `type: "button"` が必要です。これがないとクリックは静かに吸収されます。
3. すべての action に `id` フィールドが必要です。Mattermost は ID のない action を無視します。
4. Action の `id` は**英数字のみ**（`[a-zA-Z0-9]`）でなければなりません。ハイフンとアンダースコアは Mattermost のサーバー側 action ルーティングを壊し（404 を返す）、使用前に取り除く必要があります。
5. 確認メッセージに生の ID ではなくボタン名（例: 「Approve」）が表示されるように、`context.action_id` はボタンの `id` と一致する必要があります。
6. `context.action_id` は必須です。これがないと interaction handler は 400 を返します。

**HMAC トークン生成:**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは、Gateway の検証ロジックに一致するトークンを生成する必要があります。

1. ボットトークンから秘密鍵を導出します:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token` を除くすべてのフィールドを含む context オブジェクトを組み立てます。
3. **キーをソートし**、**空白なし**でシリアライズします（Gateway はキーをソートした `JSON.stringify` を使うため、コンパクトな出力になります）。
4. 署名します: `HMAC-SHA256(key=secret, data=serializedContext)`
5. 結果の 16 進ダイジェストを `_token` として context に追加します。

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

よくある HMAC の落とし穴:

- Python の `json.dumps` は既定で空白を追加します（`{"key": "val"}`）。JavaScript のコンパクト出力（`{"key":"val"}`）に合わせるには、`separators=(",", ":")` を使ってください。
- 必ず **すべての** context フィールド（`_token` を除く）に署名してください。Gateway は `_token` を取り除いたあと、残りすべてに署名します。一部だけに署名すると、静かに検証失敗します。
- `sort_keys=True` を使ってください。Gateway は署名前にキーをソートし、Mattermost はペイロード保存時に context フィールドの順序を並べ替えることがあります。
- 秘密鍵はランダムバイトではなく、ボットトークンから導出してください（決定的）。ボタンを生成するプロセスと、それを検証する Gateway の間で同じ秘密鍵である必要があります。

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API 経由でチャネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` および Cron/Webhook 配信で `#channel-name` と `@username` ターゲットを使えます。

設定は不要です。アダプターはアカウント設定のボットトークンを使います。

## マルチアカウント

Mattermost は `channels.mattermost.accounts` 配下で複数アカウントをサポートします。

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

- チャネルで返信がない: ボットがそのチャネルに参加していることを確認し、@メンションする（oncall）、トリガープレフィックスを使う（onchar）、または `chatmode: "onmessage"` を設定してください。
- 認証エラー: ボットトークン、ベース URL、アカウントが有効かどうかを確認してください。
- マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。
- ネイティブスラッシュコマンドが `Unauthorized: invalid command token.` を返す: OpenClaw がコールバックトークンを受け入れませんでした。一般的な原因:
  - スラッシュコマンド登録が失敗した、または起動時に部分的にしか完了しなかった
  - コールバックが誤った Gateway/アカウントに到達している
  - Mattermost に、以前のコールバック先を指す古いコマンドがまだ残っている
  - Gateway がスラッシュコマンドを再有効化せずに再起動した
- ネイティブスラッシュコマンドが動かなくなった場合は、ログで
  `mattermost: failed to register slash commands` または
  `mattermost: native slash commands enabled but no commands could be registered`
  を確認してください。
- `callbackUrl` を省略していて、ログにコールバックが `http://127.0.0.1:18789/...` に解決されたという警告が出る場合、その URL に到達できるのは Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で動作しているときだけである可能性が高いです。代わりに、外部から到達可能な `commands.callbackUrl` を明示的に設定してください。
- ボタンが白いボックスとして表示される: エージェントが不正な形式のボタンデータを送っている可能性があります。各ボタンに `text` と `callback_data` の両方があることを確認してください。
- ボタンは表示されるがクリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、および `ServiceSettings` の `EnablePostActionIntegration` が `true` であることを確認してください。
- ボタンをクリックすると 404 が返る: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost の action ルーターは英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使ってください。
- Gateway ログに `invalid _token`: HMAC 不一致です。すべての context フィールド（一部ではなく）に署名していること、キーをソートしていること、コンパクト JSON（空白なし）を使っていることを確認してください。上の HMAC セクションを参照してください。
- Gateway ログに `missing _token in context`: `_token` フィールドがボタンの context にありません。integration ペイロード構築時に含めていることを確認してください。
- 確認にボタン名ではなく生の ID が表示される: `context.action_id` がボタンの `id` と一致していません。両方に同じサニタイズ済み値を設定してください。
- エージェントがボタンを認識しない: Mattermost チャネル設定に `capabilities: ["inlineButtons"]` を追加してください。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング

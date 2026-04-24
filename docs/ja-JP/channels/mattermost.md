---
read_when:
    - Mattermostをセットアップする
    - Mattermostのルーティングをデバッグする
summary: MattermostボットのセットアップとOpenClaw設定
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T04:46:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

ステータス: 同梱Plugin（bot token + WebSocketイベント）。チャンネル、グループ、DMをサポートします。
Mattermostはセルフホスト可能なチームメッセージングプラットフォームです。製品の詳細とダウンロードは公式サイト
[mattermost.com](https://mattermost.com) を参照してください。

## 同梱Plugin

Mattermostは現在のOpenClawリリースでは同梱Pluginとして提供されるため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドやMattermostを含まないカスタムインストールを使っている場合は、
手動でインストールしてください。

CLI経由でインストール（npmレジストリ）:

```bash
openclaw plugins install @openclaw/mattermost
```

ローカルチェックアウト（gitリポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

1. Mattermost Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. Mattermost botアカウントを作成し、**bot token** をコピーします。
3. Mattermostの**ベースURL** をコピーします（例: `https://chat.example.com`）。
4. OpenClawを設定してGatewayを起動します。

最小設定:

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

ネイティブスラッシュコマンドはオプトインです。有効化すると、OpenClawは
Mattermost API経由で `oc_*` スラッシュコマンドを登録し、GatewayのHTTPサーバー上で
コールバックPOSTを受け取ります。

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

注:

- `native: "auto"` はMattermostではデフォルトで無効です。有効化するには `native: true` を設定します。
- `callbackUrl` を省略した場合、OpenClawはGatewayのhost/port + `callbackPath` から自動生成します。
- マルチアカウント構成では、`commands` はトップレベルまたは
  `channels.mattermost.accounts.<id>.commands` の下に設定できます（アカウント側の値がトップレベルのフィールドを上書きします）。
- コマンドコールバックは、OpenClawが `oc_*` コマンドを登録したときに
  Mattermostから返されるコマンドごとのtokenで検証されます。
- スラッシュコールバックは、登録に失敗した場合、起動が部分的だった場合、または
  コールバックtokenが登録済みコマンドのいずれとも一致しない場合にフェイルクローズします。
- 到達性要件: コールバックエンドポイントはMattermostサーバーから到達可能でなければなりません。
  - MattermostがOpenClawと同じホスト/ネットワーク名前空間で動作していない限り、`callbackUrl` に `localhost` を設定しないでください。
  - そのURLが `/api/channels/mattermost/command` をOpenClawにリバースプロキシしない限り、`callbackUrl` にMattermostのベースURLを設定しないでください。
  - 簡易確認方法は `curl https://<gateway-host>/api/channels/mattermost/command` です。GETは `404` ではなく、OpenClawから `405 Method Not Allowed` を返すべきです。
- Mattermostのegress許可リスト要件:
  - コールバック先がプライベート/tailnet/内部アドレスの場合は、Mattermostの
    `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックのhost/domainを含めてください。
  - 完全なURLではなく、host/domainエントリを使用してください。
    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

## 環境変数（デフォルトアカウント）

環境変数を使いたい場合は、Gatewayホストに次を設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

環境変数は**デフォルト**アカウント（`default`）にのみ適用されます。その他のアカウントではconfig値を使う必要があります。

`MATTERMOST_URL` はワークスペースの `.env` からは設定できません。[Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## チャットモード

MattermostはDMには自動で応答します。チャンネルでの動作は `chatmode` で制御されます。

- `oncall`（デフォルト）: チャンネルで@メンションされたときだけ応答
- `onmessage`: チャンネル内のすべてのメッセージに応答
- `onchar`: メッセージがトリガープレフィックスで始まると応答

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

注:

- `onchar` でも明示的な@メンションには応答します。
- `channels.mattermost.requireMention` はレガシー設定用として尊重されますが、`chatmode` の使用を推奨します。

## スレッドとセッション

`channels.mattermost.replyToMode` を使うと、チャンネルおよびグループへの返信を
メインチャンネルに維持するか、トリガーとなった投稿の下にスレッドを開始するかを制御できます。

- `off`（デフォルト）: 受信投稿がすでにスレッド内にある場合のみ、そのスレッドで返信します。
- `first`: トップレベルのチャンネル/グループ投稿に対して、その投稿の下にスレッドを開始し、
  会話をスレッドスコープのセッションにルーティングします。
- `all`: 現在のMattermostでは `first` と同じ動作です。
- ダイレクトメッセージではこの設定は無視され、非スレッドのままです。

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

注:

- スレッドスコープのセッションでは、トリガーとなった投稿idをスレッドルートとして使用します。
- `first` と `all` は現在同等です。Mattermostにスレッドルートが一度できると、
  後続のchunkやメディアも同じスレッド内で継続されるためです。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（未知の送信者にはペアリングコードが送られます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャンネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（メンション制御あり）。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します（ユーザーID推奨）。
- チャンネルごとのメンション上書きは `channels.mattermost.groups.<channelId>.requireMention`
  またはデフォルト用の `channels.mattermost.groups["*"].requireMention` にあります。
- `@username` の照合は可変であり、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合のみ有効です。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"`（メンション制御あり）。
- ランタイム注記: `channels.mattermost` が完全に存在しない場合、ランタイムはグループチェックに `groupPolicy="allowlist"` を使用します（`channels.defaults.groupPolicy` が設定されていても同様です）。

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

## 送信配信用ターゲット

`openclaw message send` または Cron/Webhookでは、次のターゲット形式を使用します。

- チャンネルには `channel:<id>`
- DMには `user:<id>`
- DMには `@username` も使用可能（Mattermost APIで解決）

プレフィックスなしの不透明なID（`64ifufp...` のようなもの）は、Mattermostでは**曖昧**です（ユーザーIDかチャンネルIDか）。

OpenClawはそれらを**ユーザー優先**で解決します。

- IDがユーザーとして存在する場合（`GET /api/v4/users/<id>` が成功）、OpenClawは
  `/api/v4/channels/direct` でダイレクトチャンネルを解決して**DM**を送信します。
- そうでなければ、そのIDは**チャンネルID**として扱われます。

決定的な動作が必要な場合は、必ず明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。

## DMチャンネルのリトライ

OpenClawがMattermostのDMターゲットに送信し、最初にダイレクトチャンネルを解決する必要がある場合、
デフォルトで一時的なダイレクトチャンネル作成失敗をリトライします。

その動作は、Mattermost Plugin全体には `channels.mattermost.dmChannelRetry`、
1つのアカウントには `channels.mattermost.accounts.<id>.dmChannelRetry` で調整できます。

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

- これはすべてのMattermost API呼び出しではなく、DMチャンネル作成（`/api/v4/channels/direct`）にのみ適用されます。
- リトライは、レート制限、5xxレスポンス、ネットワークエラー、タイムアウトエラーなどの一時的失敗に適用されます。
- `429` 以外の4xxクライアントエラーは恒久的エラーとして扱われ、リトライされません。

## プレビューStreaming

Mattermostは、思考、ツールアクティビティ、部分的な返信テキストを1つの**下書きプレビューポスト**にStreamingし、安全に最終回答を送信できる段階でその場で確定します。プレビューはチャンクごとのメッセージでチャンネルを埋める代わりに、同じ投稿id上で更新されます。メディア/エラーの最終結果では、保留中のプレビュー編集をキャンセルし、使い捨てのプレビューポストをフラッシュする代わりに通常の配信を使用します。

有効化するには `channels.mattermost.streaming` を設定します。

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

注:

- `partial` が通常の選択です。返信が伸びるにつれて編集される1つのプレビューポストを使い、その後完全な回答で確定します。
- `block` はプレビューポスト内で追記型の下書きchunkを使用します。
- `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
- `off` はプレビューStreamingを無効化します。
- ストリームをその場で確定できない場合（たとえばストリーム途中で投稿が削除された場合）、OpenClawは返信が失われないよう新しい最終投稿の送信にフォールバックします。
- `> Reasoning:` のblockquoteとして到着するテキストを含め、推論専用のペイロードはチャンネル投稿から抑制されます。思考を他のサーフェスで見たい場合は `/reasoning on` を設定してください。Mattermostの最終投稿は回答のみを保持します。
- チャンネル対応マトリクスは [Streaming](/ja-JP/concepts/streaming#preview-streaming-modes) を参照してください。

## リアクション（messageツール）

- `channel=mattermost` で `message action=react` を使用します。
- `messageId` はMattermostの投稿idです。
- `emoji` には `thumbsup` や `:+1:` のような名前を指定できます（コロンは省略可能）。
- リアクションを削除するには `remove=true`（boolean）を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションへシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクションアクションの有効/無効（デフォルト true）。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（messageツール）

クリック可能なボタン付きメッセージを送信します。ユーザーがボタンをクリックすると、エージェントが
その選択を受け取り、応答できます。

ボタンを有効にするには、チャンネル機能に `inlineButtons` を追加します。

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` パラメーター付きで `message action=send` を使用します。ボタンは2次元配列です（ボタン行）:

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンフィールド:

- `text`（必須）: 表示ラベル。
- `callback_data`（必須）: クリック時に返される値（action IDとして使用）。
- `style`（任意）: `"default"`、`"primary"`、または `"danger"`。

ユーザーがボタンをクリックすると:

1. すべてのボタンが確認行に置き換えられます（例: 「✓ **Yes** selected by @user」）。
2. エージェントはその選択を受信メッセージとして受け取り、応答します。

注:

- ボタンコールバックはHMAC-SHA256検証を使用します（自動で、設定不要）。
- MattermostはAPIレスポンスからcallback dataを削除するため（セキュリティ機能）、すべてのボタンは
  クリック時に削除されます。部分的な削除はできません。
- ハイフンまたはアンダースコアを含むaction IDは自動的にサニタイズされます
  （Mattermostのルーティング制限）。

設定:

- `channels.mattermost.capabilities`: 機能文字列の配列。`"inlineButtons"` を追加すると、
  エージェントのシステムプロンプトでbuttonsツールの説明が有効になります。
- `channels.mattermost.interactions.callbackBaseUrl`: button
  コールバック用の任意の外部ベースURL（例: `https://gateway.example.com`）。Mattermostが
  bind host上のGatewayに直接到達できない場合に使用します。
- マルチアカウント構成では、同じフィールドを
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`
  の下にも設定できます。
- `interactions.callbackBaseUrl` を省略した場合、OpenClawは
  `gateway.customBindHost` + `gateway.port` からコールバックURLを導出し、その後
  `http://localhost:<port>` にフォールバックします。
- 到達性ルール: buttonのコールバックURLはMattermostサーバーから到達可能でなければなりません。
  `localhost` が機能するのは、MattermostとOpenClawが同じホスト/ネットワーク名前空間で動作している場合だけです。
- コールバック先がプライベート/tailnet/内部の場合は、そのhost/domainをMattermostの
  `ServiceSettings.AllowedUntrustedInternalConnections` に追加してください。

### 直接API統合（外部スクリプト）

外部スクリプトとWebhookは、エージェントの `message` ツールを経由せず、
Mattermost REST API経由で直接buttonを投稿できます。可能であればPluginの `buildButtonAttachments()` を使ってください。
生のJSONを投稿する場合は、次のルールに従ってください。

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
            id: "mybutton01", // 英数字のみ — 以下を参照
            type: "button", // 必須。これがないとクリックは静かに無視されます
            name: "Approve", // 表示ラベル
            style: "primary", // 任意: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ボタン名の参照に使うためbutton idと一致する必要があります
                action: "approve",
                // ... 任意のカスタムフィールド ...
                _token: "<hmac>", // 下のHMACセクションを参照
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

1. attachmentはトップレベルの `attachments` ではなく `props.attachments` に入れます（そうしないと静かに無視されます）。
2. すべてのactionには `type: "button"` が必要です。これがないとクリックは静かに吸収されます。
3. すべてのactionには `id` フィールドが必要です。MattermostはIDのないactionを無視します。
4. actionの `id` は**英数字のみ**（`[a-zA-Z0-9]`）でなければなりません。ハイフンとアンダースコアは
   Mattermostのサーバー側actionルーティングを壊し（404を返します）、使えません。使用前に削除してください。
5. `context.action_id` はbuttonの `id` と一致している必要があります。これにより確認メッセージに
   生のIDではなくbutton名（例: 「Approve」）が表示されます。
6. `context.action_id` は必須です。interactionハンドラーはこれがないと400を返します。

**HMAC token生成:**

GatewayはHMAC-SHA256でbuttonクリックを検証します。外部スクリプトは、
Gatewayの検証ロジックと一致するtokenを生成する必要があります。

1. bot tokenからsecretを導出します:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token` を除くすべてのフィールドを含むcontextオブジェクトを構築します。
3. **キーをソート済み**かつ**空白なし**でシリアライズします（Gatewayは
   ソート済みキーを持つ `JSON.stringify` を使うため、コンパクトな出力になります）。
4. 署名します: `HMAC-SHA256(key=secret, data=serializedContext)`
5. 結果の16進ダイジェストを `_token` としてcontextに追加します。

Python例:

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

よくあるHMACの落とし穴:

- Pythonの `json.dumps` はデフォルトで空白を追加します（`{"key": "val"}`）。JavaScriptのコンパクト出力（`{"key":"val"}`）に合わせるには
  `separators=(",", ":")` を使ってください。
- 必ず**すべて**のcontextフィールド（`_token` を除く）に署名してください。Gatewayは `_token` を除去してから
  残りすべてに署名します。一部だけに署名すると、静かに検証失敗になります。
- `sort_keys=True` を使ってください。Gatewayは署名前にキーをソートし、Mattermostは
  ペイロード保存時にcontextフィールドを並べ替えることがあります。
- secretはランダムなバイト列ではなく、bot tokenから導出してください（決定的です）。このsecretは、
  buttonを作成するプロセスと検証するGatewayの間で同一でなければなりません。

## ディレクトリアダプター

Mattermost Pluginには、チャンネル名とユーザー名を
Mattermost API経由で解決するディレクトリアダプターが含まれています。これにより
`openclaw message send` および Cron/Webhook配信で `#channel-name` と `@username` のターゲットが有効になります。

設定は不要です。このアダプターはアカウント設定のbot tokenを使用します。

## マルチアカウント

Mattermostは `channels.mattermost.accounts` の下で複数アカウントをサポートします。

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

- チャンネルで返信がない: botがそのチャンネルに参加していること、@メンションしていること（oncall）、トリガープレフィックスを使っていること（onchar）、または `chatmode: "onmessage"` を設定していることを確認してください。
- 認証エラー: bot token、ベースURL、アカウントが有効かどうかを確認してください。
- マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。
- ネイティブスラッシュコマンドが `Unauthorized: invalid command token.` を返す: OpenClawが
  コールバックtokenを受け入れていません。典型的な原因:
  - 起動時にスラッシュコマンド登録が失敗した、または部分的にしか完了していない
  - コールバックが誤ったGateway/アカウントに届いている
  - Mattermostに以前のコールバック先を指す古いコマンドがまだ残っている
  - Gatewayが再起動したがスラッシュコマンドが再有効化されていない
- ネイティブスラッシュコマンドが動かなくなった場合は、ログで
  `mattermost: failed to register slash commands` または
  `mattermost: native slash commands enabled but no commands could be registered`
  を確認してください。
- `callbackUrl` を省略し、ログにコールバック先が
  `http://127.0.0.1:18789/...` に解決されたという警告が出る場合、そのURLは
  MattermostがOpenClawと同じホスト/ネットワーク名前空間で動作しているときにしか到達できない可能性があります。代わりに
  外部から到達可能な明示的な `commands.callbackUrl` を設定してください。
- buttonが白いボックスとして表示される: エージェントが不正なbuttonデータを送っている可能性があります。各buttonに `text` と `callback_data` の両方があることを確認してください。
- buttonは描画されるがクリックしても何も起きない: Mattermostサーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、そして `ServiceSettings` で `EnablePostActionIntegration` が `true` になっていることを確認してください。
- buttonをクリックすると404が返る: buttonの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermostのaction routerは英数字以外のIDで壊れます。`[a-zA-Z0-9]` のみを使ってください。
- Gatewayログに `invalid _token` が出る: HMAC不一致です。すべてのcontextフィールド（一部ではなく全体）に署名していること、キーをソートしていること、コンパクトJSON（空白なし）を使っていることを確認してください。上のHMACセクションを参照してください。
- Gatewayログに `missing _token in context` が出る: `_token` フィールドがbuttonのcontextにありません。integrationペイロードを構築するときに含めてください。
- 確認表示にbutton名ではなく生のIDが出る: `context.action_id` がbuttonの `id` と一致していません。両方を同じサニタイズ済み値に設定してください。
- エージェントがbuttonを認識しない: Mattermostチャンネル設定に `capabilities: ["inlineButtons"]` を追加してください。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング

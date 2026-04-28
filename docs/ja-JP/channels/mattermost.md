---
read_when:
- Setting up Mattermost
- Mattermostルーティングのデバッグ
sidebarTitle: Mattermost
summary: MattermostボットのセットアップとOpenClawの設定
title: Mattermost
x-i18n:
  generated_at: '2026-04-26T11:23:57Z'
  model: gpt-5.4
  provider: openai
  source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
  source_path: channels/mattermost.md
  workflow: 15
---

ステータス: バンドルPlugin（ボットトークン + WebSocketイベント）。チャンネル、グループ、DMがサポートされています。Mattermostはセルフホスト可能なチームメッセージングプラットフォームです。製品の詳細とダウンロードについては、公式サイトの [mattermost.com](https://mattermost.com) を参照してください。

## バンドルPlugin

<Note>
Mattermostは現在のOpenClawリリースではバンドルPluginとして提供されるため、通常のパッケージビルドでは別途インストールは不要です。
</Note>

古いビルドまたはMattermostを除外したカスタムインストールを使用している場合は、手動でインストールしてください。

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
  <Step title="Pluginが利用可能であることを確認する">
    現在のパッケージ版OpenClawリリースにはすでに含まれています。古い/カスタムインストールでは、上記コマンドで手動追加できます。
  </Step>
  <Step title="Mattermostボットを作成する">
    Mattermostボットアカウントを作成し、**bot token** をコピーします。
  </Step>
  <Step title="ベースURLをコピーする">
    Mattermostの **base URL** をコピーします（例: `https://chat.example.com`）。
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

  </Step>
</Steps>

## ネイティブスラッシュコマンド

ネイティブスラッシュコマンドはオプトインです。有効にすると、OpenClawはMattermost API経由で `oc_*` スラッシュコマンドを登録し、Gateway HTTPサーバーでコールバックPOSTを受信します。

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

<AccordionGroup>
  <Accordion title="動作に関する注意">
    - `native: "auto"` はMattermostではデフォルトで無効です。有効にするには `native: true` を設定してください。
    - `callbackUrl` を省略した場合、OpenClawはGatewayのhost/port + `callbackPath` から自動導出します。
    - 複数アカウント構成では、`commands` はトップレベルまたは `channels.mattermost.accounts.<id>.commands` 配下に設定できます（アカウント側の値がトップレベルのフィールドを上書きします）。
    - コマンドコールバックは、OpenClawが `oc_*` コマンドを登録した際にMattermostから返されるコマンドごとのトークンで検証されます。
    - スラッシュコマンドのコールバックは、登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが登録済みコマンドのいずれとも一致しない場合、fail closedします。

  </Accordion>
  <Accordion title="到達可能性の要件">
    コールバックエンドポイントはMattermostサーバーから到達可能である必要があります。

    - MattermostがOpenClawと同じホスト/ネットワーク名前空間で動作していない限り、`callbackUrl` を `localhost` に設定しないでください。
    - そのURLが `/api/channels/mattermost/command` をOpenClawへリバースプロキシしていない限り、`callbackUrl` をMattermostのbase URLに設定しないでください。
    - 簡易チェックとして `curl https://<gateway-host>/api/channels/mattermost/command` を実行してください。GETは `404` ではなく、OpenClawからの `405 Method Not Allowed` を返すはずです。

  </Accordion>
  <Accordion title="Mattermostのegress許可リスト">
    コールバック先がプライベート/tailnet/内部アドレスの場合は、Mattermostの `ServiceSettings.AllowedUntrustedInternalConnections` にコールバック先のホスト/ドメインを含めてください。

    完全なURLではなく、ホスト/ドメインのエントリを使用してください。

    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境変数（デフォルトアカウント）

環境変数を使いたい場合は、Gatewayホストで次を設定してください。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境変数は **default** アカウント（`default`）にのみ適用されます。他のアカウントでは設定値を使用する必要があります。

`MATTERMOST_URL` はワークスペース `.env` から設定できません。詳しくは [Workspace `.env` files](/ja-JP/gateway/security) を参照してください。
</Note>

## チャットモード

MattermostはDMには自動で応答します。チャンネルでの動作は `chatmode` で制御されます。

<Tabs>
  <Tab title="oncall (default)">
    チャンネルでは@メンションされた場合のみ応答します。
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
      oncharPrefixes: [">", "!"],
    },
  },
}
```

注意:

- `onchar` は明示的な@メンションにも引き続き応答します。
- `channels.mattermost.requireMention` はレガシー設定のために尊重されますが、`chatmode` の使用が推奨されます。

## スレッドとセッション

チャンネルやグループの返信をメインチャンネルに維持するか、トリガーとなった投稿のスレッド配下で開始するかは、`channels.mattermost.replyToMode` で制御します。

- `off` (デフォルト): 受信投稿がすでにスレッド内にある場合のみ、スレッドで返信します。
- `first`: トップレベルのチャンネル/グループ投稿では、その投稿配下にスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
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

注意:

- スレッドスコープのセッションでは、トリガーとなった投稿IDをスレッドルートとして使用します。
- `first` と `all` は、Mattermostにスレッドルートができると、後続チャンクやメディアが同じスレッドで継続されるため、現在は同等です。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"` （未知の送信者にはペアリングコードが送られます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャンネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"` （メンション必須）。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します（ユーザーID推奨）。
- チャンネルごとのメンション上書きは `channels.mattermost.groups.<channelId>.requireMention` またはデフォルト用の `channels.mattermost.groups["*"].requireMention` にあります。
- `@username` の一致は可変であり、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合にのみ有効です。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"` （メンション必須）。
- ランタイム注記: `channels.mattermost` が完全に欠けている場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されていても同様です）。

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

## 送信先ターゲット形式

`openclaw message send` または cron/Webhook では、次のターゲット形式を使用します。

- チャンネルには `channel:<id>`
- DMには `user:<id>`
- DMには `@username` も使用可能（Mattermost API経由で解決）

<Warning>
プレフィックスなしの不透明なID（`64ifufp...` のようなもの）は、Mattermostでは **曖昧** です（ユーザーIDかチャンネルIDか）。

OpenClawはそれらを **ユーザー優先** で解決します。

- そのIDがユーザーとして存在する場合（`GET /api/v4/users/<id>` が成功）、OpenClawは `/api/v4/channels/direct` 経由でダイレクトチャンネルを解決し、**DM** を送信します。
- それ以外の場合、そのIDは **チャンネルID** として扱われます。

確定的な動作が必要な場合は、常に明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。
</Warning>

## DMチャンネルのリトライ

OpenClawがMattermostのDMターゲットへ送信し、最初にダイレクトチャンネルを解決する必要がある場合、デフォルトで一時的なダイレクトチャンネル作成失敗をリトライします。

その動作をMattermost Plugin全体で調整するには `channels.mattermost.dmChannelRetry` を、1つのアカウントだけに適用するには `channels.mattermost.accounts.<id>.dmChannelRetry` を使用します。

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

- これはDMチャンネル作成（`/api/v4/channels/direct`）にのみ適用され、すべてのMattermost API呼び出しには適用されません。
- リトライは、レート制限、5xxレスポンス、ネットワークエラー、タイムアウトエラーなどの一時的失敗に適用されます。
- `429` 以外の4xxクライアントエラーは恒久的失敗として扱われ、リトライされません。

## プレビューストリーミング

Mattermostでは、思考、ツールアクティビティ、部分的な返信テキストを1つの **ドラフトプレビュー投稿** にストリーミングし、最終回答の送信が安全になるとその場で確定します。プレビューはチャンクごとのメッセージでチャンネルを埋めるのではなく、同じ投稿ID上で更新されます。メディア/エラーの最終応答は保留中のプレビュー編集をキャンセルし、使い捨てプレビュー投稿をフラッシュする代わりに通常の配信を使用します。

`channels.mattermost.streaming` で有効化します。

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
    - `partial` が通常の選択です。返信の成長に合わせて編集される1つのプレビュー投稿を使い、最後に完全な回答で確定します。
    - `block` はプレビュー投稿内で追記型のドラフトチャンクを使用します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。

  </Accordion>
  <Accordion title="ストリーミング動作に関する注意">
    - ストリームをその場で確定できない場合（たとえばストリーム途中で投稿が削除された場合）、OpenClawは新しい最終投稿の送信にフォールバックするため、返信が失われることはありません。
    - 推論のみのペイロードはチャンネル投稿から抑制されます。これには `> Reasoning:` ブロッククォートとして届くテキストも含まれます。思考を他の画面で見たい場合は `/reasoning on` を設定してください。Mattermostの最終投稿には回答のみが保持されます。
    - チャンネルマッピング行列については [Streaming](/ja-JP/concepts/streaming#preview-streaming-modes) を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション（message tool）

- `channel=mattermost` とともに `message action=react` を使用します。
- `messageId` はMattermostの投稿IDです。
- `emoji` には `thumbsup` や `:+1:` のような名前を指定できます（コロンは省略可能）。
- リアクションを削除するには `remove=true`（boolean）を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションへシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクション操作を有効化/無効化します（デフォルト true）。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`.

## インタラクティブボタン（message tool）

クリック可能なボタン付きメッセージを送信します。ユーザーがボタンをクリックすると、エージェントは選択内容を受け取り、応答できます。

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

`buttons` パラメータ付きで `message action=send` を使用します。ボタンは2次元配列（ボタンの行）です。

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンフィールド:

<ParamField path="text" type="string" required>
  表示ラベル。
</ParamField>
<ParamField path="callback_data" type="string" required>
  クリック時に送り返される値です（action IDとして使用されます）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  ボタンのスタイル。
</ParamField>

ユーザーがボタンをクリックすると:

<Steps>
  <Step title="ボタンは確認表示に置き換えられる">
    すべてのボタンは確認行に置き換えられます（例: 「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="エージェントが選択内容を受け取る">
    エージェントは選択内容を受信メッセージとして受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="実装に関する注意">
    - ボタンコールバックではHMAC-SHA256検証を使用します（自動、設定不要）。
    - MattermostはAPIレスポンスからコールバックデータを取り除くため（セキュリティ機能）、クリック時にすべてのボタンが削除されます。部分的な削除はできません。
    - ハイフンまたはアンダースコアを含むaction IDは自動的にサニタイズされます（Mattermostのルーティング制限）。

  </Accordion>
  <Accordion title="設定と到達可能性">
    - `channels.mattermost.capabilities`: 機能文字列の配列です。エージェントのシステムプロンプトでボタンツールの説明を有効にするには `"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベースURLです（例: `https://gateway.example.com`）。MattermostがGatewayのbind hostに直接到達できない場合に使用します。
    - 複数アカウント構成では、同じフィールドを `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 配下にも設定できます。
    - `interactions.callbackBaseUrl` を省略した場合、OpenClawは `gateway.customBindHost` + `gateway.port` からコールバックURLを導出し、その後 `http://localhost:<port>` にフォールバックします。
    - 到達可能性ルール: ボタンコールバックURLはMattermostサーバーから到達可能である必要があります。`localhost` が機能するのは、MattermostとOpenClawが同じホスト/ネットワーク名前空間で動作している場合のみです。
    - コールバック先がプライベート/tailnet/内部の場合は、そのホスト/ドメインをMattermostの `ServiceSettings.AllowedUntrustedInternalConnections` に追加してください。

  </Accordion>
</AccordionGroup>

### 直接API統合（外部スクリプト）

外部スクリプトやWebhookは、エージェントの `message` ツールを経由せずにMattermost REST API経由で直接ボタンを投稿できます。可能であればPluginの `buildButtonAttachments()` を使用してください。生のJSONを投稿する場合は、次のルールに従ってください。

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
            id: "mybutton01", // 英数字のみ — 以下を参照
            type: "button", // 必須。ない場合、クリックは黙って無視されます
            name: "Approve", // 表示ラベル
            style: "primary", // 任意: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ボタンidと一致する必要があります（名前参照用）
                action: "approve",
                // ... 任意のカスタムフィールド ...
                _token: "<hmac>", // 以下のHMACセクションを参照
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

1. 添付はトップレベルの `attachments` ではなく、`props.attachments` に入れます（そうしないと黙って無視されます）。
2. すべてのactionに `type: "button"` が必要です。ない場合、クリックは黙って飲み込まれます。
3. すべてのactionに `id` フィールドが必要です。MattermostはIDのないactionを無視します。
4. actionの `id` は **英数字のみ** (`[a-zA-Z0-9]`) でなければなりません。ハイフンとアンダースコアはMattermostのサーバー側actionルーティングを壊し（404を返します）、使用前に削除する必要があります。
5. 確認メッセージに生のIDではなくボタン名（例: 「Approve」）を表示するには、`context.action_id` をボタンの `id` と一致させる必要があります。
6. `context.action_id` は必須です。ない場合、インタラクションハンドラーは400を返します。
</Warning>

**HMACトークン生成**

GatewayはボタンクリックをHMAC-SHA256で検証します。外部スクリプトは、Gatewayの検証ロジックに一致するトークンを生成する必要があります。

<Steps>
  <Step title="bot tokenからシークレットを導出する">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="contextオブジェクトを構築する">
    `_token` を除くすべてのフィールドでcontextオブジェクトを構築します。
  </Step>
  <Step title="キーをソートしてシリアライズする">
    **キーをソート** し、**空白なし** でシリアライズします（Gatewayはキーをソートした `JSON.stringify` を使用し、コンパクトな出力を生成します）。
  </Step>
  <Step title="ペイロードに署名する">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="トークンを追加する">
    生成された16進ダイジェストをcontext内の `_token` として追加します。
  </Step>
</Steps>

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

<AccordionGroup>
  <Accordion title="よくあるHMACの落とし穴">
    - Pythonの `json.dumps` はデフォルトで空白を追加します（`{"key": "val"}`）。JavaScriptのコンパクト出力（`{"key":"val"}`）に合わせるには `separators=(",", ":")` を使用してください。
    - 必ず **すべての** contextフィールド（`_token` を除く）に署名してください。Gatewayは `_token` を取り除いたあと、残りすべてに署名します。一部だけに署名すると、黙って検証失敗になります。
    - `sort_keys=True` を使用してください。Gatewayは署名前にキーをソートし、Mattermostはペイロード保存時にcontextフィールドの順序を並べ替える場合があります。
    - シークレットはランダムなバイト列ではなく、bot tokenから導出してください（決定的）。シークレットは、ボタンを生成するプロセスと検証するGatewayで同一である必要があります。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Pluginには、Mattermost API経由でチャンネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` や cron/Webhook 配信で `#channel-name` と `@username` ターゲットを使用できます。

設定は不要です。アダプターはアカウント設定のbot tokenを使用します。

## 複数アカウント

Mattermostは `channels.mattermost.accounts` 配下で複数アカウントをサポートします。

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
    ボットがチャンネルに参加していることを確認し、メンションする（oncall）、トリガープレフィックスを使う（onchar）、または `chatmode: "onmessage"` を設定してください。
  </Accordion>
  <Accordion title="認証または複数アカウントのエラー">
    - bot token、base URL、アカウントが有効かどうかを確認してください。
    - 複数アカウントの問題: 環境変数は `default` アカウントにのみ適用されます。

  </Accordion>
  <Accordion title="ネイティブスラッシュコマンドが失敗する">
    - `Unauthorized: invalid command token.`: OpenClawがコールバックトークンを受け入れませんでした。一般的な原因:
      - スラッシュコマンド登録が失敗した、または起動時に部分的にしか完了しなかった
      - コールバックが誤ったGateway/アカウントに到達している
      - Mattermostにまだ以前のコールバック先を指す古いコマンドが残っている
      - Gatewayが再起動したが、スラッシュコマンドが再有効化されていない
    - ネイティブスラッシュコマンドが動作しなくなった場合は、`mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` をログで確認してください。
    - `callbackUrl` を省略していて、ログにコールバックが `http://127.0.0.1:18789/...` に解決されたという警告がある場合、そのURLはMattermostがOpenClawと同じホスト/ネットワーク名前空間で動作している場合にしか到達できない可能性があります。代わりに外部から到達可能な `commands.callbackUrl` を明示的に設定してください。

  </Accordion>
  <Accordion title="ボタンの問題">
    - ボタンが白いボックスとして表示される: エージェントが不正なボタンデータを送っている可能性があります。各ボタンに `text` と `callback_data` の両方のフィールドがあることを確認してください。
    - ボタンは表示されるがクリックしても何も起きない: Mattermostサーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、および `ServiceSettings` の `EnablePostActionIntegration` が `true` であることを確認してください。
    - ボタンをクリックすると404が返る: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermostのaction routerは英数字以外のIDで壊れます。`[a-zA-Z0-9]` のみを使用してください。
    - Gatewayログに `invalid _token`: HMAC不一致です。すべてのcontextフィールド（部分集合ではなく）に署名していること、キーをソートしていること、コンパクトJSON（空白なし）を使用していることを確認してください。上のHMACセクションを参照してください。
    - Gatewayログに `missing _token in context`: `_token` フィールドがボタンのcontextにありません。integrationペイロード構築時に含めていることを確認してください。
    - 確認表示にボタン名ではなく生IDが表示される: `context.action_id` がボタンの `id` と一致していません。両方を同じサニタイズ済み値に設定してください。
    - エージェントがボタンを認識しない: Mattermostチャンネル設定に `capabilities: ["inlineButtons"]` を追加してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション必須条件
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング

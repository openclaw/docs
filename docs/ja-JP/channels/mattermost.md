---
read_when:
    - Mattermost のセットアップ
    - Mattermost ルーティングのデバッグ
sidebarTitle: Mattermost
summary: Mattermost ボットのセットアップと OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T20:41:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

Status: ダウンロード可能な Plugin（ボットトークン + WebSocket イベント）。チャネル、グループ、DM に対応しています。Mattermost はセルフホスト可能なチームメッセージングプラットフォームです。製品の詳細とダウンロードについては公式サイト [mattermost.com](https://mattermost.com) を参照してください。

## インストール

チャネルを設定する前に Mattermost をインストールします。

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

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

<Steps>
  <Step title="Plugin が利用可能であることを確認する">
    現在パッケージ化されている OpenClaw リリースには、すでにこの Plugin がバンドルされています。古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
  </Step>
  <Step title="Mattermost ボットを作成する">
    Mattermost ボットアカウントを作成し、**ボットトークン**をコピーします。
  </Step>
  <Step title="ベース URL をコピーする">
    Mattermost の**ベース URL**（例: `https://chat.example.com`）をコピーします。
  </Step>
  <Step title="OpenClaw を設定して Gateway を起動する">
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
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="動作メモ">
    - `native: "auto"` は Mattermost では既定で無効です。有効にするには `native: true` を設定します。
    - `callbackUrl` を省略した場合、OpenClaw は Gateway のホスト/ポート + `callbackPath` から URL を導出します。
    - 複数アカウント構成では、`commands` をトップレベル、または `channels.mattermost.accounts.<id>.commands` 配下に設定できます（アカウントの値がトップレベルのフィールドを上書きします）。
    - コマンドコールバックは、OpenClaw が `oc_*` コマンドを登録したときに Mattermost から返されるコマンドごとのトークンで検証されます。
    - OpenClaw は各コールバックを受け入れる前に、現在の Mattermost コマンド登録を更新します。そのため、削除または再生成されたスラッシュコマンドの古いトークンは、Gateway の再起動なしに受け入れられなくなります。
    - Mattermost API がそのコマンドが現在も有効であることを確認できない場合、コールバック検証はフェイルクローズします。失敗した検証は短時間キャッシュされ、同時検索はまとめられ、新しい検索開始はリプレイ負荷を抑えるためにコマンドごとにレート制限されます。
    - 登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが解決されたコマンドの登録済みトークンと一致しない場合、スラッシュコールバックはフェイルクローズします（あるコマンドで有効なトークンが、別のコマンドのアップストリーム検証に到達することはできません）。

  </Accordion>
  <Accordion title="到達可能性の要件">
    コールバックエンドポイントは Mattermost サーバーから到達可能である必要があります。

    - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されている場合を除き、`callbackUrl` を `localhost` に設定しないでください。
    - その URL が `/api/channels/mattermost/command` を OpenClaw にリバースプロキシしている場合を除き、`callbackUrl` を Mattermost のベース URL に設定しないでください。
    - 簡単な確認方法は `curl https://<gateway-host>/api/channels/mattermost/command` です。GET は `404` ではなく、OpenClaw からの `405 Method Not Allowed` を返す必要があります。

  </Accordion>
  <Accordion title="Mattermost の外向き通信許可リスト">
    コールバックの宛先がプライベート/tailnet/内部アドレスの場合は、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックのホスト/ドメインを含めます。

    完全な URL ではなく、ホスト/ドメインのエントリを使用してください。

    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境変数（既定アカウント）

環境変数を使う場合は、Gateway ホストで次を設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
環境変数は**既定**アカウント（`default`）にのみ適用されます。他のアカウントでは設定値を使用する必要があります。

`MATTERMOST_URL` はワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security)を参照してください。
</Note>

## チャットモード

Mattermost は DM に自動応答します。チャネルでの動作は `chatmode` で制御します。

<Tabs>
  <Tab title="oncall（既定）">
    チャネル内で @メンションされた場合にのみ応答します。
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

メモ:

- `onchar` でも明示的な @メンションには応答します。
- `channels.mattermost.requireMention` はレガシー設定として尊重されますが、`chatmode` が推奨されます。

## スレッドとセッション

`channels.mattermost.replyToMode` を使用して、チャネルとグループの返信をメインチャネルに残すか、トリガーになった投稿の下にスレッドを開始するかを制御します。

- `off`（既定）: 受信投稿がすでにスレッド内にある場合にのみ、スレッド内で返信します。
- `first`: トップレベルのチャネル/グループ投稿では、その投稿の下にスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
- `all`: 現在の Mattermost では `first` と同じ動作です。
- ダイレクトメッセージはこの設定を無視し、スレッド化されません。

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

メモ:

- スレッドスコープのセッションは、トリガーになった投稿 ID をスレッドルートとして使用します。
- Mattermost でスレッドルートができると、後続のチャンクやメディアは同じスレッド内で継続されるため、`first` と `all` は現在同等です。

## アクセス制御（DM）

- 既定: `channels.mattermost.dmPolicy = "pairing"`（不明な送信者にはペアリングコードが発行されます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャネル（グループ）

- 既定: `channels.mattermost.groupPolicy = "allowlist"`（メンションでゲート）。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します（ユーザー ID 推奨）。
- チャネルごとのメンション上書きは、`channels.mattermost.groups.<channelId>.requireMention` または既定値用の `channels.mattermost.groups["*"].requireMention` にあります。
- `@username` マッチングは変更可能で、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合にのみ有効です。
- オープンチャネル: `channels.mattermost.groupPolicy="open"`（メンションでゲート）。
- ランタイムメモ: `channels.mattermost` が完全に存在しない場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

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

## 送信配信のターゲット

`openclaw message send` または Cron/Webhook では、次のターゲット形式を使用します。

- チャネルには `channel:<id>`
- DM には `user:<id>`
- DM には `@username`（Mattermost API 経由で解決）

<Warning>
裸の不透明 ID（`64ifufp...` など）は Mattermost では**曖昧**です（ユーザー ID かチャネル ID か）。

OpenClaw はそれらを**ユーザー優先**で解決します。

- ID がユーザーとして存在する場合（`GET /api/v4/users/<id>` が成功する場合）、OpenClaw は `/api/v4/channels/direct` 経由でダイレクトチャネルを解決し、**DM**を送信します。
- それ以外の場合、その ID は**チャネル ID**として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。
</Warning>

## DM チャネルのリトライ

OpenClaw が Mattermost の DM ターゲットへ送信し、最初にダイレクトチャネルを解決する必要がある場合、既定で一時的なダイレクトチャネル作成失敗をリトライします。

Mattermost Plugin 全体でこの動作を調整するには `channels.mattermost.dmChannelRetry` を使用し、1 つのアカウントだけに適用するには `channels.mattermost.accounts.<id>.dmChannelRetry` を使用します。

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

- これは DM チャネル作成（`/api/v4/channels/direct`）にのみ適用され、すべての Mattermost API 呼び出しには適用されません。
- レート制限、5xx レスポンス、ネットワークエラーやタイムアウトエラーなどの一時的な失敗にリトライが適用されます。
- `429` 以外の 4xx クライアントエラーは永続的な失敗として扱われ、リトライされません。

## プレビューストリーミング

Mattermost は思考、ツールアクティビティ、部分的な返信テキストを単一の**下書きプレビュー投稿**にストリーミングし、最終回答を安全に送信できるようになったら、その場で確定します。プレビューはチャネルにチャンクごとのメッセージを大量投稿する代わりに、同じ投稿 ID 上で更新されます。メディア/エラーの最終出力は、保留中のプレビュー編集をキャンセルし、使い捨てのプレビュー投稿をフラッシュする代わりに通常の配信を使用します。

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
    - `partial` が通常の選択肢です。返信が増えるにつれて編集される 1 つのプレビュー投稿を使い、その後完全な回答で確定します。
    - `block` はプレビュー投稿内で追記形式の下書きチャンクを使用します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。

  </Accordion>
  <Accordion title="ストリーミング動作メモ">
    - ストリームをその場で確定できない場合（たとえば、ストリーム中に投稿が削除された場合）、OpenClaw は新しい最終投稿の送信にフォールバックするため、返信が失われることはありません。
    - 推論のみのペイロードは、`> Reasoning:` ブロック引用として届くテキストも含め、チャネル投稿から抑制されます。他のサーフェスで思考を表示するには `/reasoning on` を設定します。Mattermost の最終投稿には回答のみが残ります。
    - チャネルマッピングの対応表については [Streaming](/ja-JP/concepts/streaming#preview-streaming-modes) を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション（メッセージツール）

- `channel=mattermost` とともに `message action=react` を使用します。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` は `thumbsup` や `:+1:` のような名前を受け付けます（コロンは省略可能です）。
- リアクションを削除するには `remove=true`（真偽値）を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションへシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクションアクションを有効/無効にします（既定は true）。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（メッセージツール）

クリック可能なボタン付きでメッセージを送信します。ユーザーがボタンをクリックすると、エージェントは選択内容を受け取り、応答できます。

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

`buttons` パラメーターを指定して `message action=send` を使用します。ボタンは 2 次元配列（ボタンの行）です。

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
  ボタンのスタイル。
</ParamField>

ユーザーがボタンをクリックすると:

<Steps>
  <Step title="ボタンが確認表示に置き換えられる">
    すべてのボタンが確認行に置き換えられます（例: 「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="エージェントが選択を受け取る">
    エージェントは選択を受信メッセージとして受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="実装メモ">
    - ボタンのコールバックは HMAC-SHA256 検証を使用します（自動、設定不要）。
    - Mattermost は API レスポンスからコールバックデータを削除するため（セキュリティ機能）、クリック時にすべてのボタンが削除されます。一部だけの削除はできません。
    - ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限）。

  </Accordion>
  <Accordion title="設定と到達性">
    - `channels.mattermost.capabilities`: 機能文字列の配列。エージェントのシステムプロンプトでボタンツールの説明を有効にするには `"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例: `https://gateway.example.com`）。Mattermost が Gateway のバインドホストに直接到達できない場合に使用します。
    - 複数アカウント構成では、同じフィールドを `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 配下にも設定できます。
    - `interactions.callbackBaseUrl` が省略された場合、OpenClaw は `gateway.customBindHost` + `gateway.port` からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。
    - 到達性ルール: ボタンコールバック URL は Mattermost サーバーから到達可能である必要があります。`localhost` は、Mattermost と OpenClaw が同じホスト/ネットワーク名前空間で実行されている場合にのみ機能します。
    - コールバック先がプライベート/tailnet/内部の場合は、そのホスト/ドメインを Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加します。

  </Accordion>
</AccordionGroup>

### 直接 API 連携（外部スクリプト）

外部スクリプトと Webhook は、エージェントの `message` ツールを経由せずに、Mattermost REST API 経由でボタンを直接投稿できます。可能な場合は Plugin の `buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、次のルールに従ってください:

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
2. すべてのアクションには `type: "button"` が必要です。これがないと、クリックは黙って破棄されます。
3. すべてのアクションには `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクションの `id` は **英数字のみ**（`[a-zA-Z0-9]`）である必要があります。ハイフンとアンダースコアは Mattermost のサーバー側アクションルーティングを壊します（404 を返します）。使用前に削除してください。
5. 確認メッセージに生の ID ではなくボタン名（例: 「Approve」）を表示するには、`context.action_id` がボタンの `id` と一致している必要があります。
6. `context.action_id` は必須です。これがないと、インタラクションハンドラーは 400 を返します。

</Warning>

**HMAC トークン生成**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは、Gateway の検証ロジックと一致するトークンを生成する必要があります:

<Steps>
  <Step title="bot トークンからシークレットを導出する">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="コンテキストオブジェクトを作成する">
    `_token` **以外**のすべてのフィールドを含むコンテキストオブジェクトを作成します。
  </Step>
  <Step title="ソート済みキーでシリアライズする">
    **ソート済みキー**かつ**スペースなし**でシリアライズします（Gateway はソート済みキーで `JSON.stringify` を使用し、コンパクトな出力を生成します）。
  </Step>
  <Step title="ペイロードに署名する">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="トークンを追加する">
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
  <Accordion title="よくある HMAC の落とし穴">
    - Python の `json.dumps` はデフォルトでスペースを追加します（`{"key": "val"}`）。JavaScript のコンパクトな出力（`{"key":"val"}`）に合わせるには、`separators=(",", ":")` を使用してください。
    - 常に**すべての**コンテキストフィールド（`_token` を除く）に署名してください。Gateway は `_token` を削除してから、残りのすべてに署名します。一部だけに署名すると、黙って検証に失敗します。
    - `sort_keys=True` を使用してください。Gateway は署名前にキーをソートし、Mattermost はペイロードの保存時にコンテキストフィールドを並べ替える場合があります。
    - ランダムバイトではなく、bot トークンからシークレットを導出してください（決定的）。シークレットは、ボタンを作成するプロセスと検証する Gateway の間で同じである必要があります。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API 経由でチャンネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` と cron/Webhook 配信で `#channel-name` と `@username` ターゲットを使用できます。

設定は不要です。アダプターはアカウント設定の bot トークンを使用します。

## 複数アカウント

Mattermost は `channels.mattermost.accounts` 配下で複数アカウントをサポートします:

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
    bot がチャンネルに参加していることを確認してメンションする（oncall）、トリガープレフィックスを使用する（onchar）、または `chatmode: "onmessage"` を設定してください。
  </Accordion>
  <Accordion title="認証または複数アカウントのエラー">
    - bot トークン、ベース URL、アカウントが有効かどうかを確認してください。
    - 複数アカウントの問題: env vars は `default` アカウントにのみ適用されます。

  </Accordion>
  <Accordion title="ネイティブスラッシュコマンドが失敗する">
    - `Unauthorized: invalid command token.`: OpenClaw はコールバックトークンを受け入れませんでした。典型的な原因:
      - 起動時のスラッシュコマンド登録に失敗した、または一部だけ完了した
      - コールバックが誤った Gateway/アカウントに到達している
      - Mattermost に以前のコールバック先を指す古いコマンドがまだ残っている
      - Gateway がスラッシュコマンドを再有効化せずに再起動した
    - ネイティブスラッシュコマンドが動作しなくなった場合は、ログで `mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` を確認してください。
    - `callbackUrl` が省略され、ログがコールバックが `http://127.0.0.1:18789/...` に解決されたと警告している場合、その URL はおそらく Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されている場合にのみ到達可能です。代わりに、外部から到達可能な `commands.callbackUrl` を明示的に設定してください。

  </Accordion>
  <Accordion title="ボタンの問題">
    - ボタンが白いボックスとして表示される: エージェントが不正な形式のボタンデータを送信している可能性があります。各ボタンに `text` と `callback_data` の両方のフィールドがあることを確認してください。
    - ボタンは表示されるがクリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれており、ServiceSettings の `EnablePostActionIntegration` が `true` であることを確認してください。
    - クリック時にボタンが 404 を返す: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使用してください。
    - Gateway ログに `invalid _token` と表示される: HMAC の不一致です。すべてのコンテキストフィールド（一部ではなく）に署名し、ソート済みキーを使用し、コンパクトな JSON（スペースなし）を使用していることを確認してください。上記の HMAC セクションを参照してください。
    - Gateway ログに `missing _token in context` と表示される: `_token` フィールドがボタンのコンテキストにありません。連携ペイロードの作成時に含めてください。
    - 確認にボタン名ではなく生の ID が表示される: `context.action_id` がボタンの `id` と一致していません。両方を同じサニタイズ済み値に設定してください。
    - エージェントがボタンを認識しない: Mattermost チャンネル設定に `capabilities: ["inlineButtons"]` を追加してください。

  </Accordion>
</AccordionGroup>

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化

---
read_when:
    - Mattermost の設定
    - Mattermost ルーティングのデバッグ
sidebarTitle: Mattermost
summary: Mattermost ボット設定と OpenClaw 設定
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T10:38:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

ステータス: ダウンロード可能な Plugin（ボットトークン + WebSocket イベント）。チャンネル、グループ、DM がサポートされています。Mattermost はセルフホスト可能なチームメッセージングプラットフォームです。製品の詳細とダウンロードについては、公式サイト [mattermost.com](https://mattermost.com) を参照してください。

## インストール

チャンネルを設定する前に Mattermost をインストールします。

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

詳細: [Plugin](/ja-JP/tools/plugin)

## クイック設定

<Steps>
  <Step title="Plugin が利用可能であることを確認する">
    上記のコマンドで `@openclaw/mattermost` をインストールし、Gateway がすでに実行中の場合は再起動します。
  </Step>
  <Step title="Mattermost ボットを作成する">
    Mattermost ボットアカウントを作成し、**ボットトークン**をコピーします。
  </Step>
  <Step title="ベース URL をコピーする">
    Mattermost の**ベース URL**（例: `https://chat.example.com`）をコピーします。
  </Step>
  <Step title="OpenClaw を設定して Gateway を起動する">
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
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="動作メモ">
    - Mattermost では、`native: "auto"` はデフォルトで無効です。有効にするには `native: true` を設定します。
    - `callbackUrl` を省略すると、OpenClaw は Gateway のホスト/ポート + `callbackPath` からそれを導出します。
    - マルチアカウント設定では、`commands` をトップレベル、または `channels.mattermost.accounts.<id>.commands` の下に設定できます（アカウント値はトップレベルのフィールドを上書きします）。
    - コマンドコールバックは、OpenClaw が `oc_*` コマンドを登録するときに Mattermost から返されるコマンドごとのトークンで検証されます。
    - OpenClaw は各コールバックを受け入れる前に現在の Mattermost コマンド登録を更新するため、削除または再生成されたスラッシュコマンドの古いトークンは、Gateway の再起動なしに受け入れられなくなります。
    - Mattermost API がコマンドがまだ最新であることを確認できない場合、コールバック検証はフェイルクローズします。失敗した検証は短時間キャッシュされ、同時ルックアップは統合され、新しいルックアップ開始はコマンドごとにレート制限され、リプレイ負荷を抑えます。
    - 登録に失敗した場合、起動が部分的だった場合、またはコールバックトークンが解決済みコマンドの登録トークンと一致しない場合、スラッシュコールバックはフェイルクローズします（あるコマンドで有効なトークンは、別のコマンドの上流検証には到達できません）。

  </Accordion>
  <Accordion title="到達可能性要件">
    コールバックエンドポイントは Mattermost サーバーから到達可能である必要があります。

    - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で実行されていない限り、`callbackUrl` を `localhost` に設定しないでください。
    - その URL が `/api/channels/mattermost/command` を OpenClaw にリバースプロキシしない限り、`callbackUrl` を Mattermost のベース URL に設定しないでください。
    - 簡単な確認方法は `curl https://<gateway-host>/api/channels/mattermost/command` です。GET は `404` ではなく、OpenClaw から `405 Method Not Allowed` を返す必要があります。

  </Accordion>
  <Accordion title="Mattermost 送信先許可リスト">
    コールバックがプライベート/tailnet/内部アドレスを対象にする場合は、コールバックホスト/ドメインを含めるように Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` を設定します。

    完全な URL ではなく、ホスト/ドメインのエントリを使用します。

    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 環境変数（デフォルトアカウント）

env vars を使いたい場合は、Gateway ホストでこれらを設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
env vars は**デフォルト**アカウント（`default`）にのみ適用されます。その他のアカウントは設定値を使用する必要があります。

`MATTERMOST_URL` はワークスペース `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security)を参照してください。
</Note>

## チャットモード

Mattermost は DM に自動応答します。チャンネルの動作は `chatmode` で制御されます。

<Tabs>
  <Tab title="oncall（デフォルト）">
    チャンネル内で @メンションされた場合にのみ応答します。
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

メモ:

- `onchar` は明示的な @メンションにも引き続き応答します。
- レガシー設定では `channels.mattermost.requireMention` が尊重されますが、`chatmode` が推奨されます。
- ボットがチャンネルスレッドで表示される返信を送信した後は、同じスレッド内の以降のメッセージは、新しい @メンションや `onchar` プレフィックスなしで応答されるため、複数ターンのスレッド会話が継続します。参加状態はスレッドが非アクティブになってから 7 日間記憶され（各返信で更新）、Gateway の再起動後も保持されます。ボットが観測しただけのスレッドには影響しません。明示的なメンションを再度要求するには、新しいトップレベルメッセージを開始してください。

## スレッド化とセッション

`channels.mattermost.replyToMode` を使用して、チャンネルおよびグループの返信をメインチャンネルに残すか、トリガーとなった投稿の下にスレッドを開始するかを制御します。

- `off`（デフォルト）: 受信投稿がすでにスレッド内にある場合にのみ、スレッドで返信します。
- `first`: トップレベルのチャンネル/グループ投稿では、その投稿の下にスレッドを開始し、会話をスレッドスコープのセッションにルーティングします。
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

- スレッドスコープのセッションは、トリガー投稿 ID をスレッドルートとして使用します。
- Mattermost にスレッドルートができると、後続のチャンクとメディアは同じスレッドで継続するため、現在 `first` と `all` は同等です。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（未知の送信者にはペアリングコードが発行されます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM: `channels.mattermost.dmPolicy="open"` に加えて `channels.mattermost.allowFrom=["*"]`。
- `channels.mattermost.allowFrom` は `accessGroup:<name>` エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## チャンネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（メンションゲート付き）。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します（ユーザー ID 推奨）。
- `channels.mattermost.groupAllowFrom` は `accessGroup:<name>` エントリを受け付けます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。
- チャンネルごとのメンション上書きは、`channels.mattermost.groups.<channelId>.requireMention` の下、またはデフォルトとして `channels.mattermost.groups["*"].requireMention` の下に配置します。
- `@username` マッチングは変更可能であり、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。
- オープンチャンネル: `channels.mattermost.groupPolicy="open"`（メンションゲート付き）。
- ランタイムメモ: `channels.mattermost` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

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

`openclaw message send` または cron/webhooks では、これらのターゲット形式を使用します。

- チャンネルには `channel:<id>`
- DM には `user:<id>`
- DM には `@username`（Mattermost API 経由で解決）

<Warning>
裸の不透明 ID（`64ifufp...` のようなもの）は Mattermost では**曖昧**です（ユーザー ID かチャンネル ID か）。

OpenClaw はそれらを**ユーザー優先**で解決します。

- ID がユーザーとして存在する場合（`GET /api/v4/users/<id>` が成功）、OpenClaw は `/api/v4/channels/direct` 経由でダイレクトチャンネルを解決して **DM** を送信します。
- それ以外の場合、その ID は**チャンネル ID**として扱われます。

決定的な動作が必要な場合は、常に明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。
</Warning>

## DM チャンネルの再試行

OpenClaw が Mattermost の DM ターゲットに送信し、最初にダイレクトチャンネルを解決する必要がある場合、デフォルトで一時的なダイレクトチャンネル作成失敗を再試行します。

Mattermost Plugin 全体でこの動作を調整するには `channels.mattermost.dmChannelRetry` を使用し、1 つのアカウントでは `channels.mattermost.accounts.<id>.dmChannelRetry` を使用します。

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

- これは DM チャンネル作成（`/api/v4/channels/direct`）にのみ適用され、すべての Mattermost API 呼び出しには適用されません。
- 再試行は、レート制限、5xx レスポンス、ネットワークまたはタイムアウトエラーなどの一時的な失敗に適用されます。
- `429` 以外の 4xx クライアントエラーは永続的なものとして扱われ、再試行されません。

## プレビューストリーミング

Mattermost は思考、ツールアクティビティ、部分的な返信テキストを単一の**下書きプレビュー投稿**にストリーミングし、最終回答を安全に送信できるようになった時点でその場で確定します。プレビューはチャンクごとのメッセージでチャンネルを埋めるのではなく、同じ投稿 ID 上で更新されます。メディア/エラーの最終出力は保留中のプレビュー編集をキャンセルし、使い捨てのプレビュー投稿をフラッシュする代わりに通常の配信を使用します。

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
    - `partial` は通常の選択肢です。返信が伸びるにつれて編集される 1 つのプレビュー投稿を使用し、その後完全な回答で確定します。
    - `block` はプレビュー投稿内で追記スタイルの下書きチャンクを使用します。
    - `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
    - `off` はプレビューストリーミングを無効にします。

  </Accordion>
  <Accordion title="ストリーミング動作メモ">
    - ストリームをその場で確定できない場合（たとえば投稿がストリーム中に削除された場合）、OpenClaw は新しい最終投稿の送信にフォールバックするため、返信が失われることはありません。
    - 思考のみのペイロードは、`> Thinking` ブロック引用として届くテキストを含め、チャンネル投稿から抑制されます。他のサーフェスで思考を表示するには `/reasoning on` を設定してください。Mattermost の最終投稿には回答のみが残ります。
    - チャンネルマッピングのマトリクスについては、[ストリーミング](/ja-JP/concepts/streaming#preview-streaming-modes)を参照してください。

  </Accordion>
</AccordionGroup>

## リアクション（メッセージツール）

- `channel=mattermost` で `message action=react` を使用します。
- `messageId` は Mattermost 投稿 ID です。
- `emoji` は `thumbsup` や `:+1:` のような名前を受け付けます（コロンは任意です）。
- リアクションを削除するには `remove=true`（ブール値）を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションにシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクションアクションを有効/無効にします（デフォルトは true）。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（メッセージツール）

クリック可能なボタン付きのメッセージを送信します。ユーザーがボタンをクリックすると、エージェントは選択を受け取り、応答できます。

通常のエージェント返信には、セマンティックな `presentation` ペイロードも含められます。OpenClaw は値ボタンを Mattermost のインタラクティブボタンとしてレンダリングし、URL ボタンはメッセージ本文内で表示されたままにし、選択メニューは読みやすいテキストにダウングレードします。

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

`buttons` パラメーター付きで `message action=send` を使用します。ボタンは 2 次元配列です（ボタンの行）。

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

ユーザーがボタンをクリックした場合:

<Steps>
  <Step title="ボタンが確認表示に置き換えられる">
    すべてのボタンが確認行に置き換えられます（例: 「✓ **Yes** selected by @user」）。
  </Step>
  <Step title="エージェントが選択を受信する">
    エージェントは選択を受信メッセージとして受け取り、応答します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="実装メモ">
    - ボタンコールバックは HMAC-SHA256 検証を使用します（自動で、設定は不要）。
    - Mattermost は API レスポンスからコールバックデータを取り除くため（セキュリティ機能）、クリック時にはすべてのボタンが削除されます。一部だけを削除することはできません。
    - ハイフンまたはアンダースコアを含むアクション ID は自動的にサニタイズされます（Mattermost のルーティング制限）。

  </Accordion>
  <Accordion title="設定と到達性">
    - `channels.mattermost.capabilities`: 機能文字列の配列。エージェントのシステムプロンプトでボタンツールの説明を有効にするには `"inlineButtons"` を追加します。
    - `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の任意の外部ベース URL（例: `https://gateway.example.com`）。Mattermost が Gateway のバインドホストに直接到達できない場合に使用します。
    - 複数アカウント構成では、同じフィールドを `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` にも設定できます。
    - `interactions.callbackBaseUrl` が省略された場合、OpenClaw は `gateway.customBindHost` + `gateway.port` からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。
    - 到達性ルール: ボタンコールバック URL は Mattermost サーバーから到達可能である必要があります。`localhost` が機能するのは、Mattermost と OpenClaw が同じホストまたはネットワーク名前空間で実行されている場合だけです。
    - コールバック先がプライベート、tailnet、または内部の場合は、そのホストまたはドメインを Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` に追加します。

  </Accordion>
</AccordionGroup>

### 直接 API 連携（外部スクリプト）

外部スクリプトと Webhook は、エージェントの `message` ツールを経由せずに、Mattermost REST API 経由でボタンを直接投稿できます。可能な場合は Plugin の `buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、次のルールに従います。

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

1. 添付はトップレベルの `attachments` ではなく `props.attachments` に配置します（黙って無視されます）。
2. すべてのアクションに `type: "button"` が必要です。ない場合、クリックは黙って破棄されます。
3. すべてのアクションに `id` フィールドが必要です。Mattermost は ID のないアクションを無視します。
4. アクションの `id` は **英数字のみ**（`[a-zA-Z0-9]`）である必要があります。ハイフンとアンダースコアは Mattermost のサーバー側アクションルーティングを壊します（404 を返します）。使用前に取り除いてください。
5. 確認メッセージに生の ID ではなくボタン名（例: 「Approve」）が表示されるように、`context.action_id` はボタンの `id` と一致している必要があります。
6. `context.action_id` は必須です。ない場合、インタラクションハンドラーは 400 を返します。

</Warning>

**HMAC トークン生成**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは、Gateway の検証ロジックと一致するトークンを生成する必要があります。

<Steps>
  <Step title="bot トークンからシークレットを導出する">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="コンテキストオブジェクトを構築する">
    `_token` **以外**のすべてのフィールドでコンテキストオブジェクトを構築します。
  </Step>
  <Step title="ソート済みキーでシリアライズする">
    **ソート済みキー**かつ**スペースなし**でシリアライズします（Gateway はソート済みキーで `JSON.stringify` を使用し、コンパクトな出力を生成します）。
  </Step>
  <Step title="ペイロードに署名する">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="トークンを追加する">
    得られた 16 進ダイジェストをコンテキスト内の `_token` として追加します。
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
    - Python の `json.dumps` はデフォルトでスペースを追加します（`{"key": "val"}`）。JavaScript のコンパクトな出力（`{"key":"val"}`）と一致させるには `separators=(",", ":")` を使用します。
    - 常に `_token` を除くコンテキストフィールド**すべて**に署名します。Gateway は `_token` を取り除いてから、残ったすべてに署名します。一部だけに署名すると、検証は黙って失敗します。
    - `sort_keys=True` を使用します。Gateway は署名前にキーをソートし、Mattermost はペイロード保存時にコンテキストフィールドの順序を変更する場合があります。
    - シークレットはランダムバイトではなく bot トークンから導出します（決定的）。シークレットは、ボタンを作成するプロセスと検証する Gateway の間で同じである必要があります。

  </Accordion>
</AccordionGroup>

## ディレクトリアダプター

Mattermost Plugin には、Mattermost API 経由でチャネル名とユーザー名を解決するディレクトリアダプターが含まれています。これにより、`openclaw message send` と Cron/Webhook 配信で `#channel-name` と `@username` のターゲットを使用できます。

設定は不要です。アダプターはアカウント設定の bot トークンを使用します。

## 複数アカウント

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

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    bot がチャネル内にいることを確認してメンションする（oncall）、トリガープレフィックスを使用する（onchar）、または `chatmode: "onmessage"` を設定します。
  </Accordion>
  <Accordion title="認証または複数アカウントのエラー">
    - bot トークン、ベース URL、アカウントが有効かどうかを確認します。
    - 複数アカウントの問題: 環境変数は `default` アカウントにのみ適用されます。

  </Accordion>
  <Accordion title="ネイティブスラッシュコマンドが失敗する">
    - `Unauthorized: invalid command token.`: OpenClaw がコールバックトークンを受け入れませんでした。典型的な原因:
      - 起動時にスラッシュコマンド登録が失敗した、または一部だけ完了した
      - コールバックが誤った Gateway またはアカウントに到達している
      - Mattermost に、以前のコールバック先を指す古いコマンドがまだ残っている
      - Gateway がスラッシュコマンドを再有効化せずに再起動した
    - ネイティブスラッシュコマンドが動作しなくなった場合は、ログで `mattermost: failed to register slash commands` または `mattermost: native slash commands enabled but no commands could be registered` を確認します。
    - `callbackUrl` が省略され、ログがコールバックが `http://127.0.0.1:18789/...` に解決されたと警告している場合、その URL はおそらく Mattermost が OpenClaw と同じホストまたはネットワーク名前空間で実行されている場合にのみ到達可能です。代わりに、外部から到達可能な明示的な `commands.callbackUrl` を設定してください。

  </Accordion>
  <Accordion title="ボタンの問題">
    - ボタンが白いボックスとして表示される: エージェントが不正な形式のボタンデータを送信している可能性があります。各ボタンに `text` と `callback_data` の両方のフィールドがあることを確認します。
    - ボタンはレンダリングされるがクリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれ、ServiceSettings の `EnablePostActionIntegration` が `true` であることを確認します。
    - クリック時にボタンが 404 を返す: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost のアクションルーターは英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使用してください。
    - Gateway ログに `invalid _token` が出る: HMAC の不一致です。すべてのコンテキストフィールド（一部ではなく）に署名し、ソート済みキーを使用し、コンパクト JSON（スペースなし）を使用していることを確認します。上記の HMAC セクションを参照してください。
    - Gateway ログに `missing _token in context` が出る: `_token` フィールドがボタンのコンテキスト内にありません。連携ペイロードを構築するときに含まれていることを確認します。
    - 確認表示にボタン名ではなく生の ID が表示される: `context.action_id` がボタンの `id` と一致していません。両方を同じサニタイズ済み値に設定します。
    - エージェントがボタンを認識していない: Mattermost チャネル設定に `capabilities: ["inlineButtons"]` を追加します。

  </Accordion>
</AccordionGroup>

## 関連

- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [チャネル概要](/ja-JP/channels) - サポートされているすべてのチャネル
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化

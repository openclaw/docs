---
read_when:
    - Codex、Claude Code、または別の MCP クライアントを OpenClaw をバックエンドとするチャンネルに接続する
    - 実行中 `openclaw mcp serve`
    - OpenClaw に保存された MCP サーバー定義の管理
sidebarTitle: MCP
summary: MCP 経由で OpenClaw チャンネルの会話を公開し、保存済みの MCP サーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` には 2 つの役割があります。

- `openclaw mcp serve` で OpenClaw を MCP サーバーとして実行する
- `list`、`show`、`set`、`unset` で、OpenClaw が所有するアウトバウンド MCP サーバー定義を管理する

つまり、次のようになります。

- `serve` は、MCP サーバーとして動作する OpenClaw です
- `list` / `show` / `set` / `unset` は、ランタイムが後で利用する可能性のある他の MCP サーバー向けに、MCP クライアント側レジストリとして動作する OpenClaw です

OpenClaw 自体がコーディングハーネスセッションをホストし、そのランタイムを ACP 経由でルーティングする必要がある場合は、[`openclaw acp`](/ja-JP/cli/acp) を使用します。

## MCP サーバーとしての OpenClaw

これは `openclaw mcp serve` の経路です。

### `serve` を使用する場合

次の場合に `openclaw mcp serve` を使用します。

- Codex、Claude Code、または別の MCP クライアントが、OpenClaw が支えるチャンネル会話と直接通信する必要がある
- ルーティング済みセッションを持つローカルまたはリモートの OpenClaw Gateway がすでにある
- チャンネルごとに個別のブリッジを実行するのではなく、OpenClaw のチャンネルバックエンド全体で動作する 1 つの MCP サーバーが必要

OpenClaw がコーディングランタイム自体をホストし、エージェントセッションを OpenClaw 内に保持する必要がある場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使用します。

### 仕組み

`openclaw mcp serve` は stdio MCP サーバーを起動します。MCP クライアントがそのプロセスを所有します。クライアントが stdio セッションを開いたままにしている間、ブリッジは WebSocket 経由でローカルまたはリモートの OpenClaw Gateway に接続し、ルーティング済みチャンネル会話を MCP 経由で公開します。

<Steps>
  <Step title="Client spawns the bridge">
    MCP クライアントが `openclaw mcp serve` を生成します。
  </Step>
  <Step title="Bridge connects to Gateway">
    ブリッジが WebSocket 経由で OpenClaw Gateway に接続します。
  </Step>
  <Step title="Sessions become MCP conversations">
    ルーティング済みセッションは MCP 会話およびトランスクリプト/履歴ツールになります。
  </Step>
  <Step title="Live events queue">
    ライブイベントは、ブリッジが接続されている間メモリ内にキューされます。
  </Step>
  <Step title="Optional Claude push">
    Claude チャンネルモードが有効な場合、同じセッションは Claude 固有のプッシュ通知も受信できます。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - ライブキューの状態はブリッジが接続したときに開始されます
    - 古いトランスクリプト履歴は `messages_read` で読み取ります
    - Claude プッシュ通知は MCP セッションが有効な間だけ存在します
    - クライアントが切断されると、ブリッジは終了し、ライブキューはなくなります
    - `openclaw agent` や `openclaw infer model run` などの単発エージェントエントリポイントは、応答が完了したときに、それらが開いた同梱 MCP ランタイムを破棄するため、スクリプトによる繰り返し実行で stdio MCP 子プロセスが蓄積されることはありません
    - OpenClaw によって起動された stdio MCP サーバー（同梱またはユーザー設定）は、シャットダウン時にプロセスツリーとして終了されるため、サーバーによって開始された子サブプロセスは、親 stdio クライアントの終了後に残りません
    - セッションの削除またはリセットでは、共有ランタイムクリーンアップ経路を通じてそのセッションの MCP クライアントが破棄されるため、削除されたセッションに紐づく stdio 接続が残ることはありません

  </Accordion>
</AccordionGroup>

### クライアントモードを選択する

同じブリッジを 2 通りの方法で使用できます。

<Tabs>
  <Tab title="Generic MCP clients">
    標準 MCP ツールのみです。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、および承認ツールを使用します。
  </Tab>
  <Tab title="Claude Code">
    標準 MCP ツールに加えて、Claude 固有のチャンネルアダプターを使用します。`--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにします。
  </Tab>
</Tabs>

<Note>
現在、`auto` は `on` と同じ動作をします。クライアント機能の検出はまだありません。
</Note>

### `serve` が公開するもの

ブリッジは既存の Gateway セッションルートメタデータを使用して、チャンネルが支える会話を公開します。OpenClaw に、次のような既知のルートを持つセッション状態がすでにある場合、会話が表示されます。

- `channel`
- 受信者または宛先メタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより MCP クライアントは 1 か所で次のことができます。

- 最近のルーティング済み会話を一覧表示する
- 最近のトランスクリプト履歴を読む
- 新しい受信イベントを待つ
- 同じルートを通じて返信を送信する
- ブリッジ接続中に届く承認リクエストを確認する

### 使用方法

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ブリッジツール

現在のブリッジは、次の MCP ツールを公開します。

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway セッション状態にルートメタデータがすでにある、最近のセッションベースの会話を一覧表示します。

    便利なフィルター:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    直接の Gateway セッション検索を使用して、`session_key` によって 1 つの会話を返します。
  </Accordion>
  <Accordion title="messages_read">
    1 つのセッションベースの会話について、最近のトランスクリプトメッセージを読み取ります。
  </Accordion>
  <Accordion title="attachments_fetch">
    1 つのトランスクリプトメッセージから、非テキストのメッセージコンテンツブロックを抽出します。これはトランスクリプトコンテンツ上のメタデータビューであり、単独で永続的な添付ファイル BLOB ストアではありません。
  </Accordion>
  <Accordion title="events_poll">
    数値カーソル以降のキュー済みライブイベントを読み取ります。
  </Accordion>
  <Accordion title="events_wait">
    次に一致するキュー済みイベントが到着するか、タイムアウトが期限切れになるまでロングポーリングします。

    Claude 固有のプッシュプロトコルなしで、汎用 MCP クライアントにほぼリアルタイムの配信が必要な場合に使用します。

  </Accordion>
  <Accordion title="messages_send">
    セッションにすでに記録されている同じルートを通じて、テキストを送り返します。

    現在の動作:

    - 既存の会話ルートが必要です
    - セッションのチャンネル、受信者、アカウント ID、スレッド ID を使用します
    - テキストのみを送信します

  </Accordion>
  <Accordion title="permissions_list_open">
    ブリッジが Gateway に接続して以降に観測した、保留中の exec/Plugin 承認リクエストを一覧表示します。
  </Accordion>
  <Accordion title="permissions_respond">
    保留中の exec/Plugin 承認リクエスト 1 件を次のいずれかで解決します。

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### イベントモデル

ブリッジは、接続されている間、メモリ内イベントキューを保持します。

現在のイベントタイプ:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- キューはライブ専用です。MCP ブリッジの起動時に開始されます
- `events_poll` と `events_wait` は、それ自体では古い Gateway 履歴を再生しません
- 永続的なバックログは `messages_read` で読み取る必要があります

</Warning>

### Claude チャンネル通知

ブリッジは Claude 固有のチャンネル通知も公開できます。これは Claude Code チャンネルアダプターに相当する OpenClaw の機能です。標準 MCP ツールは引き続き利用できますが、ライブの受信メッセージを Claude 固有の MCP 通知として受け取ることもできます。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 標準 MCP ツールのみ。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude チャンネル通知を有効化します。
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: 現在のデフォルトです。`on` と同じブリッジ動作です。
  </Tab>
</Tabs>

Claude チャンネルモードが有効な場合、サーバーは Claude の実験的機能を告知し、次を発行できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジ動作:

- 受信した `user` トランスクリプトメッセージは `notifications/claude/channel` として転送されます
- MCP 経由で受け取った Claude 権限リクエストはメモリ内で追跡されます
- リンクされた会話が後で `yes abcde` または `no abcde` を送信した場合、ブリッジはそれを `notifications/claude/channel/permission` に変換します
- これらの通知はライブセッション専用です。MCP クライアントが切断されると、プッシュ先はありません

これは意図的にクライアント固有です。汎用 MCP クライアントは標準のポーリングツールに依存する必要があります。

### MCP クライアント設定

stdio クライアント設定の例:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

ほとんどの汎用 MCP クライアントでは、標準ツールサーフェスから始め、Claude モードは無視します。Claude 固有の通知メソッドを実際に理解するクライアントでのみ、Claude モードをオンにします。

### オプション

`openclaw mcp serve` は次をサポートします。

<ParamField path="--url" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token" type="string">
  Gateway トークン。
</ParamField>
<ParamField path="--token-file" type="string">
  ファイルからトークンを読み取ります。
</ParamField>
<ParamField path="--password" type="string">
  Gateway パスワード。
</ParamField>
<ParamField path="--password-file" type="string">
  ファイルからパスワードを読み取ります。
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 通知モード。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr に詳細ログを出力します。
</ParamField>

<Tip>
可能な場合は、インラインシークレットよりも `--token-file` または `--password-file` を優先してください。
</Tip>

### セキュリティと信頼境界

ブリッジはルーティングを作り出しません。Gateway がすでにルーティング方法を把握している会話のみを公開します。

つまり、次のようになります。

- 送信者許可リスト、ペアリング、チャンネルレベルの信頼は、引き続き基盤となる OpenClaw チャンネル設定に属します
- `messages_send` は、既存の保存済みルートを通じてのみ返信できます
- 承認状態は、現在のブリッジセッションに対してのみライブ/メモリ内です
- ブリッジ認証には、他のリモート Gateway クライアントに対して信頼するものと同じ Gateway トークンまたはパスワード制御を使用する必要があります

会話が `conversations_list` にない場合、通常の原因は MCP 設定ではありません。基盤となる Gateway セッションに、ルートメタデータが欠落しているか不完全です。

### テスト

OpenClaw には、このブリッジ向けの決定的な Docker スモークが同梱されています。

```bash
pnpm test:docker:mcp-channels
```

このスモークは次を行います。

- シード済み Gateway コンテナを起動する
- `openclaw mcp serve` を生成する 2 つ目のコンテナを起動する
- 会話検出、トランスクリプト読み取り、添付ファイルメタデータ読み取り、ライブイベントキューの動作、アウトバウンド送信ルーティングを検証する
- 実際の stdio MCP ブリッジ経由で、Claude スタイルのチャンネル通知と権限通知を検証する

これは、実際の Telegram、Discord、または iMessage アカウントをテスト実行に接続せずに、ブリッジが動作することを証明する最速の方法です。

より広いテストの文脈については、[テスト](/ja-JP/help/testing) を参照してください。

### トラブルシューティング

<AccordionGroup>
  <Accordion title="No conversations returned">
    通常は、Gateway セッションがまだルーティング可能でないことを意味します。基盤となるセッションに、保存済みチャンネル/プロバイダー、受信者、および任意のアカウント/スレッドルートメタデータがあることを確認してください。
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    想定どおりです。ライブキューはブリッジ接続時に開始されます。古いトランスクリプト履歴は `messages_read` で読み取ります。
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    次のすべてを確認してください。

    - クライアントが stdio MCP セッションを開いたままにしていた
    - `--claude-channel-mode` が `on` または `auto` である
    - クライアントが Claude 固有の通知メソッドを実際に理解している
    - 受信メッセージがブリッジ接続後に発生した

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` は、ブリッジが接続されている間に観測された承認リクエストのみを表示します。永続的な承認履歴 API ではありません。
  </Accordion>
</AccordionGroup>

## MCP クライアントレジストリとしての OpenClaw

これは `openclaw mcp list`、`show`、`set`、`unset` のパスです。

これらのコマンドは MCP 経由で OpenClaw を公開しません。OpenClaw 設定の `mcp.servers` 配下にある、OpenClaw が所有する MCP サーバー定義を管理します。

保存されたこれらの定義は、組み込み Pi やその他のランタイムアダプターなど、OpenClaw が後で起動または設定するランタイム向けです。OpenClaw は定義を一元的に保存するため、それらのランタイムが独自の重複した MCP サーバーリストを保持する必要はありません。

<AccordionGroup>
  <Accordion title="重要な動作">
    - これらのコマンドは OpenClaw 設定の読み取りまたは書き込みのみを行います
    - 対象の MCP サーバーには接続しません
    - コマンド、URL、またはリモートトランスポートが現時点で到達可能かどうかは検証しません
    - 実行時に実際にサポートするトランスポート形状はランタイムアダプターが決定します
    - 組み込み Pi は、設定済みの MCP ツールを通常の `coding` および `messaging` ツールプロファイルで公開します。`minimal` では引き続き非表示になり、`tools.deny: ["bundle-mcp"]` は明示的に無効化します
    - セッションスコープのバンドル MCP ランタイムは、`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます（デフォルトは 10 分。無効化するには `0` を設定）。ワンショットの組み込み実行では、実行終了時にそれらをクリーンアップします

  </Accordion>
</AccordionGroup>

ランタイムアダプターは、この共有レジストリを下流クライアントが期待する形状に正規化する場合があります。たとえば、組み込み Pi は OpenClaw の `transport` 値を直接使用しますが、Claude Code と Gemini は `http`、`sse`、`stdio` などの CLI ネイティブな `type` 値を受け取ります。

### 保存済み MCP サーバー定義

OpenClaw は、OpenClaw 管理の MCP 定義を必要とするサーフェス向けに、軽量な MCP サーバーレジストリも設定に保存します。

コマンド:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

注記:

- `list` はサーバー名をソートします。
- 名前なしの `show` は、設定済みの MCP サーバーオブジェクト全体を出力します。
- `set` は、コマンドライン上で 1 つの JSON オブジェクト値を想定します。
- Streamable HTTP MCP サーバーには `transport: "streamable-http"` を使用します。`openclaw mcp set` は互換性のため、CLI ネイティブな `type: "http"` も同じ正規の設定形状に正規化します。
- 名前付きサーバーが存在しない場合、`unset` は失敗します。

例:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

設定形状の例:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Stdio トランスポート

ローカルの子プロセスを起動し、stdin/stdout 経由で通信します。

| フィールド                 | 説明                              |
| -------------------------- | --------------------------------- |
| `command`                  | 起動する実行可能ファイル（必須）  |
| `args`                     | コマンドライン引数の配列          |
| `env`                      | 追加の環境変数                    |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ        |

<Warning>
**Stdio env 安全フィルター**

OpenClaw は、サーバーの `env` ブロックに出現する場合でも、最初の RPC の前に stdio MCP サーバーの起動方法を変更できるインタープリター起動環境キーを拒否します。ブロックされるキーには、`NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4`、および類似のランタイム制御変数が含まれます。これらは設定エラーとして起動時に拒否されるため、暗黙のプレリュードを注入したり、インタープリターを差し替えたり、stdio プロセスに対してデバッガーを有効化したりすることはできません。通常の認証情報、プロキシ、サーバー固有の環境変数（`GITHUB_TOKEN`、`HTTP_PROXY`、カスタム `*_API_KEY` など）には影響しません。

MCP サーバーがブロック対象の変数のいずれかを本当に必要とする場合は、stdio サーバーの `env` 配下ではなく、Gateway ホストプロセス側に設定してください。
</Warning>

### SSE / HTTP トランスポート

HTTP Server-Sent Events 経由でリモート MCP サーバーに接続します。

| フィールド            | 説明                                                                |
| --------------------- | ------------------------------------------------------------------- |
| `url`                 | リモートサーバーの HTTP または HTTPS URL（必須）                    |
| `headers`             | HTTP ヘッダーの任意のキー値マップ（例: 認証トークン）               |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意）                      |

例:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（userinfo）と `headers` の機密値は、ログとステータス出力で編集されます。

### Streamable HTTP トランスポート

`streamable-http` は、`sse` と `stdio` に並ぶ追加のトランスポートオプションです。リモート MCP サーバーとの双方向通信に HTTP ストリーミングを使用します。

| フィールド            | 説明                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | リモートサーバーの HTTP または HTTPS URL（必須）                                             |
| `transport`           | このトランスポートを選択するには `"streamable-http"` に設定します。省略時、OpenClaw は `sse` を使用します |
| `headers`             | HTTP ヘッダーの任意のキー値マップ（例: 認証トークン）                                        |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意）                                               |

OpenClaw 設定では、`transport: "streamable-http"` を正規の表記として使用します。CLI ネイティブな MCP の `type: "http"` 値は、`openclaw mcp set` 経由で保存される場合に受け入れられ、既存設定では `openclaw doctor --fix` によって修復されますが、組み込み Pi が直接使用するのは `transport` です。

例:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
これらのコマンドは保存済み設定のみを管理します。チャンネルブリッジを開始したり、ライブ MCP クライアントセッションを開いたり、対象サーバーが到達可能であることを証明したりはしません。
</Note>

## 現在の制限

このページは、現在出荷されているブリッジを文書化しています。

現在の制限:

- 会話検出は既存の Gateway セッションルートメタデータに依存します
- Claude 固有のアダプター以外に汎用プッシュプロトコルはありません
- メッセージ編集ツールやリアクションツールはまだありません
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続します。多重化されたアップストリームはまだありません
- `permissions_list_open` には、ブリッジ接続中に観測された承認のみが含まれます

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Plugins](/ja-JP/cli/plugins)

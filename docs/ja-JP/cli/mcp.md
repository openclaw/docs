---
read_when:
    - Codex、Claude Code、または他の MCP クライアントを OpenClaw バックエンドのチャンネルに接続する
    - '`openclaw mcp serve` を実行する'
    - OpenClaw に保存された MCP サーバー定義を管理する
summary: OpenClaw のチャンネル会話を MCP 経由で公開し、保存済みの MCP サーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-04-24T04:50:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` には 2 つの役割があります。

- `openclaw mcp serve` で OpenClaw を MCP サーバーとして実行する
- `list`、`show`、`set`、`unset` で OpenClaw 管理の送信先 MCP サーバー定義を管理する

つまり:

- `serve` は、OpenClaw が MCP サーバーとして動作するものです
- `list` / `show` / `set` / `unset` は、後でそのランタイムが利用する可能性のある他の MCP サーバー向けに、OpenClaw が MCP クライアント側レジストリとして動作するものです

OpenClaw 自身がコーディングハーネスセッションをホストし、そのランタイムを ACP 経由でルーティングする必要がある場合は、[`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## OpenClaw を MCP サーバーとして使う

これは `openclaw mcp serve` のパスです。

## `serve` を使うタイミング

次のような場合は `openclaw mcp serve` を使います。

- Codex、Claude Code、または他の MCP クライアントから OpenClaw バックエンドのチャンネル会話に直接接続したい
- すでにローカルまたはリモートの OpenClaw Gateway があり、セッションがルーティングされている
- チャンネルごとに別々のブリッジを実行するのではなく、OpenClaw のチャンネルバックエンド全体で機能する 1 つの MCP サーバーが欲しい

OpenClaw がコーディングランタイム自体をホストし、エージェントセッションを OpenClaw 内に保持する必要がある場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使ってください。

## 仕組み

`openclaw mcp serve` は stdio MCP サーバーを起動します。このプロセスは MCP クライアントが所有します。クライアントが stdio セッションを開いている間、ブリッジはローカルまたはリモートの OpenClaw Gateway に WebSocket で接続し、ルーティングされたチャンネル会話を MCP 経由で公開します。

ライフサイクル:

1. MCP クライアントが `openclaw mcp serve` を起動する
2. ブリッジが Gateway に接続する
3. ルーティングされたセッションが MCP 会話と transcript/history tools になる
4. ブリッジ接続中はライブイベントがメモリ内にキューされる
5. Claude チャンネルモードが有効な場合、同じセッションで Claude 固有の push 通知も受信できる

重要な動作:

- ライブキュー状態はブリッジ接続時点から開始される
- それ以前の transcript 履歴は `messages_read` で読み取る
- Claude push 通知は MCP セッションが生きている間だけ存在する
- クライアントが切断するとブリッジは終了し、ライブキューも消える
- OpenClaw によって起動された stdio MCP サーバー（同梱またはユーザー設定）は、シャットダウン時にプロセスツリーごと終了されるため、サーバーが起動した子 subprocess は親 stdio クライアント終了後も残りません
- セッションを削除またはリセットすると、そのセッションの MCP クライアントは共有ランタイムクリーンアップ経路を通じて破棄されるため、削除済みセッションに紐づく stdio 接続は残りません

## クライアントモードを選ぶ

同じブリッジを 2 通りで使えます。

- 汎用 MCP クライアント: 標準 MCP tools のみ。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、および承認 tools を使います。
- Claude Code: 標準 MCP tools に加えて Claude 固有のチャンネルアダプターを使います。`--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにします。

現時点では、`auto` は `on` と同じ動作をします。クライアント機能検出はまだありません。

## `serve` が公開するもの

このブリッジは、既存の Gateway セッションルートメタデータを使って、チャンネルバックエンドの会話を公開します。会話は、OpenClaw がすでに次のような既知ルートを持つセッション状態を持っている場合に表示されます。

- `channel`
- recipient または destination メタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCP クライアントは 1 か所で次のことを行えます。

- 最近のルーティング済み会話を一覧表示する
- 最近の transcript 履歴を読む
- 新しい受信イベントを待つ
- 同じルートを通じて返信を送る
- ブリッジ接続中に届いた承認リクエストを見る

## 使用方法

```bash
# ローカル Gateway
openclaw mcp serve

# リモート Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# パスワード認証付きリモート Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 詳細なブリッジログを有効化
openclaw mcp serve --verbose

# Claude 固有の push 通知を無効化
openclaw mcp serve --claude-channel-mode off
```

## ブリッジ tools

現在のブリッジは次の MCP tools を公開します。

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Gateway セッション状態にすでにルートメタデータを持つ、最近のセッションバック会話を一覧表示します。

便利なフィルター:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

`session_key` によって 1 つの会話を返します。

### `messages_read`

1 つのセッションバック会話について、最近の transcript メッセージを読み取ります。

### `attachments_fetch`

1 つの transcript メッセージから非テキストのメッセージコンテンツブロックを抽出します。これは transcript コンテンツに対するメタデータビューであり、独立した永続 attachment blob ストアではありません。

### `events_poll`

数値カーソル以降にキューされたライブイベントを読み取ります。

### `events_wait`

次に一致するキュー済みイベントが到着するか、タイムアウトするまでロングポーリングします。

これは、汎用 MCP クライアントが Claude 固有の push プロトコルなしで準リアルタイム配信を必要とする場合に使います。

### `messages_send`

セッションにすでに記録されている同じルートを通じてテキストを送信します。

現在の動作:

- 既存の会話ルートが必要
- セッションの channel、recipient、account id、thread id を使う
- テキストのみ送信する

### `permissions_list_open`

ブリッジが Gateway 接続以降に観測した、保留中の exec/plugin 承認リクエストを一覧表示します。

### `permissions_respond`

1 件の保留中 exec/plugin 承認リクエストを次のいずれかで解決します。

- `allow-once`
- `allow-always`
- `deny`

## イベントモデル

ブリッジは、接続中にメモリ内イベントキューを保持します。

現在のイベント型:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要な制限:

- キューはライブ専用で、MCP ブリッジ開始時に始まる
- `events_poll` と `events_wait` だけでは、それ以前の Gateway 履歴は再生しない
- 永続的な backlog は `messages_read` で読むべき

## Claude チャンネル通知

このブリッジは Claude 固有のチャンネル通知も公開できます。これは OpenClaw における Claude Code チャンネルアダプター相当のものです。標準 MCP tools はそのまま使えますが、ライブ受信メッセージは Claude 固有の MCP 通知としても到着できます。

フラグ:

- `--claude-channel-mode off`: 標準 MCP tools のみ
- `--claude-channel-mode on`: Claude チャンネル通知を有効化
- `--claude-channel-mode auto`: 現在のデフォルト。`on` と同じブリッジ動作

Claude チャンネルモードが有効な場合、サーバーは Claude experimental capabilities を通知し、次を送出できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジ動作:

- 受信 `user` transcript メッセージは `notifications/claude/channel` として転送される
- MCP 経由で受信した Claude permission request はメモリ内で追跡される
- リンクされた会話が後で `yes abcde` または `no abcde` を送信した場合、ブリッジはそれを `notifications/claude/channel/permission` に変換する
- これらの通知はライブセッション限定であり、MCP クライアントが切断すると push 先はなくなる

これは意図的にクライアント固有です。汎用 MCP クライアントは標準の polling tools に依存してください。

## MCP クライアント設定

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

ほとんどの汎用 MCP クライアントでは、まず標準 tool サーフェスを使い、Claude モードは無視してください。Claude 固有の通知メソッドを実際に理解するクライアントでのみ Claude モードを有効にしてください。

## オプション

`openclaw mcp serve` は次をサポートします。

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway トークン
- `--token-file <path>`: ファイルからトークンを読む
- `--password <password>`: Gateway パスワード
- `--password-file <path>`: ファイルからパスワードを読む
- `--claude-channel-mode <auto|on|off>`: Claude 通知モード
- `-v`, `--verbose`: stderr への詳細ログ

可能であれば、インラインのシークレットより `--token-file` または `--password-file` を優先してください。

## セキュリティと信頼境界

このブリッジはルーティングを新規に作り出しません。Gateway がすでにルーティング方法を知っている会話だけを公開します。

つまり:

- 送信者許可リスト、ペアリング、チャンネルレベルの信頼は、引き続き基盤となる OpenClaw チャンネル設定に属する
- `messages_send` は既存の保存済みルートを通じてのみ返信できる
- 承認状態は現在のブリッジセッションに対してのみライブ/メモリ内で存在する
- ブリッジ認証には、他のリモート Gateway クライアントに信頼するのと同じ Gateway トークンまたはパスワード制御を使うべき

`conversations_list` に会話が表示されない場合、通常の原因は MCP 設定ではありません。基盤となる Gateway セッションにルートメタデータがない、または不完全であることです。

## テスト

OpenClaw には、このブリッジ向けの決定的な Docker smoke が付属しています。

```bash
pnpm test:docker:mcp-channels
```

この smoke は次を行います。

- シード済み Gateway コンテナーを起動する
- `openclaw mcp serve` を起動する 2 つ目のコンテナーを起動する
- 会話検出、transcript 読み取り、attachment メタデータ読み取り、ライブイベントキュー動作、送信ルーティングを検証する
- 実際の stdio MCP ブリッジ上で Claude 形式のチャンネル通知と権限通知を検証する

これは、実際の Telegram、Discord、iMessage アカウントをテスト実行に接続せずに、ブリッジが動作することを証明する最速の方法です。

より広いテスト文脈については、[Testing](/ja-JP/help/testing) を参照してください。

## トラブルシューティング

### 会話が返らない

通常は、Gateway セッションがまだルーティング可能ではないことを意味します。基盤となるセッションに、保存済みの channel/provider、recipient、任意の account/thread ルートメタデータがあることを確認してください。

### `events_poll` または `events_wait` が古いメッセージを取りこぼす

想定どおりです。ライブキューはブリッジ接続時に開始されます。古い transcript 履歴は `messages_read` で読んでください。

### Claude 通知が表示されない

次のすべてを確認してください。

- クライアントが stdio MCP セッションを開いたままにしている
- `--claude-channel-mode` が `on` または `auto`
- クライアントが Claude 固有の通知メソッドを実際に理解している
- 受信メッセージがブリッジ接続後に発生した

### 承認が表示されない

`permissions_list_open` は、ブリッジ接続中に観測された承認リクエストだけを表示します。永続的な承認履歴 API ではありません。

## OpenClaw を MCP クライアントレジストリとして使う

これは `openclaw mcp list`、`show`、`set`、`unset` のパスです。

これらのコマンドは OpenClaw を MCP 経由で公開しません。OpenClaw config の `mcp.servers` 配下にある OpenClaw 管理の MCP サーバー定義を管理します。

これらの保存済み定義は、後で OpenClaw が起動または設定するランタイム、たとえば組み込み Pi やその他のランタイムアダプター向けです。OpenClaw は定義を一元的に保存するため、それらのランタイムが独自の重複した MCP サーバー一覧を保持する必要がありません。

重要な動作:

- これらのコマンドは OpenClaw config を読み書きするだけ
- 対象 MCP サーバーには接続しない
- コマンド、URL、リモートトランスポートが今すぐ到達可能かどうかは検証しない
- ランタイムアダプターは、実行時に実際にサポートするトランスポート形状を判断する
- 組み込み Pi は、通常の `coding` と `messaging` の tool profile で設定済み MCP tools を公開する。`minimal` では引き続き隠され、`tools.deny: ["bundle-mcp"]` で明示的に無効化できる

## 保存済み MCP サーバー定義

OpenClaw は、OpenClaw 管理の MCP 定義を必要とするサーフェス向けに、軽量な MCP サーバーレジストリも config に保存します。

コマンド:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

注:

- `list` はサーバー名をソートします。
- `show` は名前なしだと、設定済みの MCP サーバーオブジェクト全体を出力します。
- `set` は、コマンドライン上で 1 つの JSON オブジェクト値を受け取ります。
- `unset` は、指定されたサーバーが存在しない場合は失敗します。

例:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
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
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### stdio トランスポート

ローカルの子プロセスを起動し、stdin/stdout 経由で通信します。

| Field | 説明 |
| -------------------------- | --------------------------------- |
| `command` | 起動する実行ファイル（必須） |
| `args` | コマンドライン引数の配列 |
| `env` | 追加の環境変数 |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ |

#### stdio env 安全フィルター

OpenClaw は、サーバーの `env` ブロック内にあっても、最初の RPC 前に stdio MCP サーバーの起動方法を変更できるインタープリター起動時の env キーを拒否します。ブロックされるキーには `NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4`、および同様のランタイム制御変数が含まれます。これらは設定エラーとして起動が拒否されるため、暗黙の前処理を注入したり、インタープリターを差し替えたり、stdio プロセスに対してデバッガーを有効にしたりできません。通常の認証情報、プロキシ、およびサーバー固有の env 変数（`GITHUB_TOKEN`、`HTTP_PROXY`、カスタム `*_API_KEY` など）は影響を受けません。

MCP サーバーが本当にブロック対象の変数を必要とする場合は、stdio サーバーの `env` 配下ではなく、gateway ホストプロセス側に設定してください。

### SSE / HTTP トランスポート

HTTP Server-Sent Events 経由でリモート MCP サーバーに接続します。

| Field | 説明 |
| --------------------- | ---------------------------------------------------------------- |
| `url` | リモートサーバーの HTTP または HTTPS URL（必須） |
| `headers` | 任意の HTTP ヘッダのキー/値マップ（たとえば認証トークン） |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意） |

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

`url` 内の機密値（userinfo）と `headers` は、ログと status 出力ではマスクされます。

### Streamable HTTP トランスポート

`streamable-http` は、`sse` および `stdio` に加わる追加のトランスポートオプションです。HTTP ストリーミングを使って、リモート MCP サーバーと双方向通信します。

| Field | 説明 |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url` | リモートサーバーの HTTP または HTTPS URL（必須） |
| `transport` | このトランスポートを選ぶには `"streamable-http"` に設定します。省略時は OpenClaw は `sse` を使用します |
| `headers` | 任意の HTTP ヘッダのキー/値マップ（たとえば認証トークン） |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意） |

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

これらのコマンドが管理するのは保存済み config のみです。チャンネルブリッジを開始したり、ライブ MCP クライアントセッションを開いたり、対象サーバーに到達可能であることを証明したりはしません。

## 現在の制限

このページでは、現時点で提供されているブリッジについて説明しています。

現在の制限:

- 会話検出は既存の Gateway セッションルートメタデータに依存する
- Claude 固有アダプター以外に汎用 push プロトコルはない
- まだメッセージ編集またはリアクション tool はない
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続する。多重化された upstream はまだない
- `permissions_list_open` には、ブリッジ接続中に観測された承認のみが含まれる

## 関連

- [CLI reference](/ja-JP/cli)
- [Plugins](/ja-JP/cli/plugins)

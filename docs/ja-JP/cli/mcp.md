---
read_when:
    - Codex、Claude Code、または他の MCP クライアントを OpenClaw バックエンドのチャネルに接続する
    - '`openclaw mcp serve`'
    - OpenClaw に保存された MCP サーバー定義を管理する
summary: OpenClaw のチャネル会話を MCP 経由で公開し、保存済み MCP サーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-04-23T14:02:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# MCP

`openclaw mcp` には 2 つの役割があります。

- `openclaw mcp serve` で OpenClaw を MCP サーバーとして実行する
- `list`、`show`、`set`、`unset` で OpenClaw が所有する送信先 MCP サーバー定義を管理する

言い換えると:

- `serve` は、OpenClaw が MCP サーバーとして動作する経路です
- `list` / `show` / `set` / `unset` は、後でそのランタイムが利用する可能性のある他の MCP サーバーに対する、OpenClaw の MCP クライアント側レジストリとして動作する経路です

OpenClaw 自身がコーディングハーネスセッションをホストし、そのランタイムを ACP 経由でルーティングする必要がある場合は [`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## OpenClaw を MCP サーバーとして使う

これは `openclaw mcp serve` の経路です。

## `serve` を使うべきとき

次の場合は `openclaw mcp serve` を使ってください。

- Codex、Claude Code、または別の MCP クライアントが OpenClaw バックエンドのチャネル会話と直接やり取りする必要がある
- すでに、ルーティングされたセッションを持つローカルまたはリモートの OpenClaw Gateway がある
- チャネルごとの個別ブリッジを動かす代わりに、OpenClaw のチャネルバックエンド全体で動作する 1 つの MCP サーバーが欲しい

OpenClaw がコーディングランタイム自体をホストし、エージェントセッションを OpenClaw 内に保持する必要がある場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使ってください。

## 仕組み

`openclaw mcp serve` は stdio MCP サーバーを起動します。そのプロセスは MCP クライアントが所有します。クライアントが stdio セッションを開いている間、ブリッジはローカルまたはリモートの OpenClaw Gateway に WebSocket で接続し、ルーティングされたチャネル会話を MCP 経由で公開します。

ライフサイクル:

1. MCP クライアントが `openclaw mcp serve` を起動する
2. ブリッジが Gateway に接続する
3. ルーティングされたセッションが MCP の会話および transcript/history ツールとして利用可能になる
4. ブリッジが接続されている間、ライブイベントはメモリ内にキューされる
5. Claude チャネルモードが有効な場合、同じセッションで Claude 固有のプッシュ通知も受け取れる

重要な動作:

- ライブキュー状態はブリッジ接続時に開始されます
- それ以前の transcript 履歴は `messages_read` で読み取ります
- Claude のプッシュ通知は MCP セッションが生きている間だけ存在します
- クライアントが切断すると、ブリッジは終了し、ライブキューは消えます
- OpenClaw が起動した stdio MCP サーバー（同梱またはユーザー設定）は、シャットダウン時にプロセスツリーとして停止されるため、サーバーが開始した子サブプロセスは親 stdio クライアントの終了後に残りません
- セッションを削除またはリセットすると、そのセッションの MCP クライアントは共有ランタイムクリーンアップパスを通じて破棄されるため、削除されたセッションに紐づく stdio 接続が残ることはありません

## クライアントモードを選ぶ

同じブリッジを 2 通りの方法で使えます。

- 汎用 MCP クライアント: 標準 MCP ツールのみ。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、および承認ツールを使います。
- Claude Code: 標準 MCP ツールに加えて Claude 固有のチャネルアダプターも使います。`--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにしてください。

現時点では `auto` は `on` と同じ動作をします。クライアント機能の検出はまだありません。

## `serve` が公開するもの

このブリッジは、既存の Gateway セッションルートメタデータを使って、チャネルバックエンドの会話を公開します。OpenClaw がすでに以下のような既知のルートを持つセッション状態を持っている場合に会話が現れます。

- `channel`
- recipient または destination メタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCP クライアントは 1 か所で次のことができます。

- 最近のルーティング済み会話を一覧表示する
- 最近の transcript 履歴を読む
- 新しい受信イベントを待つ
- 同じルートを通じて返信を送る
- ブリッジ接続中に届いた承認リクエストを見る

## 使い方

```bash
# ローカル Gateway
openclaw mcp serve

# リモート Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# パスワード認証付きリモート Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 詳細なブリッジログを有効化
openclaw mcp serve --verbose

# Claude 固有のプッシュ通知を無効化
openclaw mcp serve --claude-channel-mode off
```

## ブリッジツール

現在のブリッジは次の MCP ツールを公開します。

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

`session_key` で 1 件の会話を返します。

### `messages_read`

1 つのセッションバック会話について、最近の transcript メッセージを読み取ります。

### `attachments_fetch`

1 つの transcript メッセージから非テキストのメッセージコンテンツブロックを抽出します。これは transcript コンテンツに対するメタデータビューであり、独立した永続 attachment blob ストアではありません。

### `events_poll`

数値カーソル以降にキューされたライブイベントを読み取ります。

### `events_wait`

次に一致するキュー済みイベントが到着するか、タイムアウトするまで long-poll します。

これは、汎用 MCP クライアントが Claude 固有のプッシュプロトコルなしでほぼリアルタイムの配信を必要とする場合に使います。

### `messages_send`

セッションにすでに記録されている同じルートを通じてテキストを送信します。

現在の動作:

- 既存の会話ルートが必要です
- セッションの channel、recipient、account id、thread id を使います
- テキストのみ送信します

### `permissions_list_open`

Gateway への接続後にブリッジが観測した、保留中の exec/plugin 承認リクエストを一覧表示します。

### `permissions_respond`

1 件の保留中 exec/plugin 承認リクエストを次のいずれかで解決します。

- `allow-once`
- `allow-always`
- `deny`

## イベントモデル

ブリッジは接続中、メモリ内イベントキューを保持します。

現在のイベントタイプ:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要な制限:

- キューはライブ限定で、MCP ブリッジ開始時に始まります
- `events_poll` と `events_wait` は、それだけでは古い Gateway 履歴を再生しません
- 永続的なバックログは `messages_read` で読み取る必要があります

## Claude チャネル通知

このブリッジは Claude 固有のチャネル通知も公開できます。これは Claude Code のチャネルアダプターに相当する OpenClaw 側の仕組みです。標準 MCP ツールは引き続き利用でき、加えてライブ受信メッセージが Claude 固有の MCP 通知として届くことがあります。

フラグ:

- `--claude-channel-mode off`: 標準 MCP ツールのみ
- `--claude-channel-mode on`: Claude チャネル通知を有効化
- `--claude-channel-mode auto`: 現在のデフォルト。`on` と同じブリッジ動作

Claude チャネルモードが有効な場合、サーバーは Claude の実験的 capabilities を告知し、次を発行できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジ動作:

- 受信した `user` transcript メッセージは `notifications/claude/channel` として転送されます
- MCP 経由で受信した Claude の権限リクエストはメモリ内で追跡されます
- 後で対応する会話が `yes abcde` または `no abcde` を送信すると、ブリッジはそれを `notifications/claude/channel/permission` に変換します
- これらの通知はライブセッション限定です。MCP クライアントが切断されると、プッシュ先はなくなります

これは意図的にクライアント固有です。汎用 MCP クライアントは標準の polling ツールに依存してください。

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

ほとんどの汎用 MCP クライアントでは、まず標準ツールサーフェスから始めて、Claude モードは無視してください。Claude 固有の通知メソッドを実際に理解するクライアントに対してのみ Claude モードを有効にしてください。

## オプション

`openclaw mcp serve` は以下をサポートします。

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway トークン
- `--token-file <path>`: ファイルからトークンを読み取る
- `--password <password>`: Gateway パスワード
- `--password-file <path>`: ファイルからパスワードを読み取る
- `--claude-channel-mode <auto|on|off>`: Claude 通知モード
- `-v`, `--verbose`: stderr への詳細ログ

可能な限り、インラインの secret より `--token-file` または `--password-file` を優先してください。

## セキュリティと信頼境界

このブリッジはルーティングを新たに作りません。Gateway がすでにルーティング方法を知っている会話だけを公開します。

つまり:

- sender allowlist、ペアリング、およびチャネルレベルの信頼は、引き続き基盤となる OpenClaw チャネル設定に属します
- `messages_send` は既存の保存済みルートを通じてのみ返信できます
- 承認状態は現在のブリッジセッションに対してのみライブ/メモリ内です
- ブリッジ認証には、他のリモート Gateway クライアントに対して信頼するのと同じ Gateway トークンまたはパスワード制御を使うべきです

`conversations_list` に会話が出てこない場合、通常の原因は MCP 設定ではありません。基盤となる Gateway セッションにルートメタデータがない、または不完全であることです。

## テスト

OpenClaw には、このブリッジ用の決定的な Docker スモークテストが用意されています。

```bash
pnpm test:docker:mcp-channels
```

このスモークテストでは次を行います。

- シード済み Gateway コンテナを起動する
- `openclaw mcp serve` を起動する 2 つ目のコンテナを起動する
- 会話検出、transcript 読み取り、attachment メタデータ読み取り、ライブイベントキューの動作、および送信ルーティングを検証する
- 実際の stdio MCP ブリッジ上で Claude スタイルのチャネル通知と権限通知を検証する

これは、実際の Telegram、Discord、または iMessage アカウントをテスト実行に接続せずに、ブリッジが動作することを証明する最速の方法です。

より広いテスト文脈については [Testing](/ja-JP/help/testing) を参照してください。

## トラブルシューティング

### 会話が返ってこない

通常は Gateway セッションがまだルーティング可能でないことを意味します。基盤セッションに channel/provider、recipient、および任意の account/thread ルートメタデータが保存されていることを確認してください。

### `events_poll` または `events_wait` が古いメッセージを取りこぼす

想定どおりです。ライブキューはブリッジ接続時に始まります。古い transcript 履歴は `messages_read` で読んでください。

### Claude 通知が表示されない

次をすべて確認してください。

- クライアントが stdio MCP セッションを開いたままにしている
- `--claude-channel-mode` が `on` または `auto`
- クライアントが実際に Claude 固有の通知メソッドを理解している
- 受信メッセージがブリッジ接続後に発生した

### 承認が表示されない

`permissions_list_open` は、ブリッジ接続中に観測された承認リクエストだけを表示します。これは永続的な承認履歴 API ではありません。

## OpenClaw を MCP クライアントレジストリとして使う

これは `openclaw mcp list`、`show`、`set`、`unset` の経路です。

これらのコマンドは OpenClaw を MCP 経由で公開しません。OpenClaw config の `mcp.servers` 配下にある、OpenClaw が所有する MCP サーバー定義を管理します。

これらの保存済み定義は、組み込み Pi やその他のランタイムアダプターのように、後で OpenClaw が起動または設定するランタイム向けです。OpenClaw はこれらの定義を中央管理するため、それらのランタイムは独自に重複した MCP サーバー一覧を保持する必要がありません。

重要な動作:

- これらのコマンドは OpenClaw config の読み書きのみを行います
- 対象 MCP サーバーには接続しません
- コマンド、URL、またはリモート転送が今この瞬間に到達可能かどうかは検証しません
- ランタイムアダプターは、実行時に実際にどの転送形式をサポートするかを決定します
- 組み込み Pi は、設定された MCP ツールを通常の `coding` および `messaging` ツールプロファイルで公開します。`minimal` では引き続き非表示で、`tools.deny: ["bundle-mcp"]` で明示的に無効化されます

## 保存済み MCP サーバー定義

OpenClaw はまた、OpenClaw 管理の MCP 定義を必要とするサーフェス向けに、軽量な MCP サーバーレジストリを config に保存します。

コマンド:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

注意:

- `list` はサーバー名をソートします。
- `show` は、名前なしだと設定済み MCP サーバーオブジェクト全体を表示します。
- `set` はコマンドライン上で 1 つの JSON オブジェクト値を受け取ります。
- `unset` は指定されたサーバーが存在しないと失敗します。

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

| フィールド                 | 説明                           |
| -------------------------- | ------------------------------ |
| `command`                  | 起動する実行ファイル（必須）   |
| `args`                     | コマンドライン引数の配列       |
| `env`                      | 追加の環境変数                 |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ     |

#### stdio env 安全フィルター

OpenClaw は、サーバーの `env` ブロックに含まれていても、最初の RPC より前に stdio MCP サーバーの起動方法を変更できるインタープリター起動時の env キーを拒否します。ブロックされるキーには `NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4` などのランタイム制御変数が含まれます。これらは設定エラーとして起動時に拒否されるため、暗黙の前処理を注入したり、インタープリターを差し替えたり、stdio プロセスに対してデバッガーを有効化したりできません。通常の資格情報、proxy、およびサーバー固有の env 変数（`GITHUB_TOKEN`、`HTTP_PROXY`、カスタム `*_API_KEY` など）は影響を受けません。

MCP サーバーが本当にブロックされた変数のいずれかを必要とする場合は、stdio サーバーの `env` の下ではなく、gateway ホストプロセス側に設定してください。

### SSE / HTTP トランスポート

HTTP Server-Sent Events 経由でリモート MCP サーバーに接続します。

| フィールド            | 説明                                                           |
| --------------------- | -------------------------------------------------------------- |
| `url`                 | リモートサーバーの HTTP または HTTPS URL（必須）               |
| `headers`             | 任意の HTTP ヘッダーのキー・バリューマップ（例: 認証トークン） |
| `connectionTimeoutMs` | サーバー単位の接続タイムアウト（ms、任意）                     |

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

`url` 内の機密値（userinfo）と `headers` は、ログと status 出力で伏せ字化されます。

### Streamable HTTP トランスポート

`streamable-http` は、`sse` と `stdio` に加わる追加のトランスポートオプションです。HTTP ストリーミングを使って、リモート MCP サーバーと双方向通信します。

| フィールド            | 説明                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | リモートサーバーの HTTP または HTTPS URL（必須）                                       |
| `transport`           | このトランスポートを選ぶには `"streamable-http"` を設定します。省略時は OpenClaw は `sse` を使います |
| `headers`             | 任意の HTTP ヘッダーのキー・バリューマップ（例: 認証トークン）                        |
| `connectionTimeoutMs` | サーバー単位の接続タイムアウト（ms、任意）                                            |

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

これらのコマンドが管理するのは保存済み config のみです。チャネルブリッジを起動したり、ライブ MCP クライアントセッションを開いたり、対象サーバーへの到達可能性を証明したりはしません。

## 現在の制限

このページは、現在出荷されているブリッジを記述しています。

現在の制限:

- 会話検出は既存の Gateway セッションルートメタデータに依存します
- Claude 固有アダプター以外に汎用 push プロトコルはまだありません
- メッセージ編集ツールやリアクションツールはまだありません
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続します。upstream の多重化はまだありません
- `permissions_list_open` には、ブリッジ接続中に観測された承認のみが含まれます

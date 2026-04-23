---
read_when:
    - ACP ベースの IDE 連携のセットアップ
    - Gateway への ACP セッションルーティングのデバッグ
summary: IDE 連携向けに ACP bridge を実行する
title: acp
x-i18n:
    generated_at: "2026-04-23T14:00:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

OpenClaw Gateway と通信する [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) bridge を実行します。

このコマンドは、IDE 向けに stdio 上で ACP を話し、プロンプトを WebSocket 経由で Gateway に転送します。ACP セッションは Gateway のセッションキーに対応付けられたまま維持されます。

`openclaw acp` は Gateway をバックエンドにした ACP bridge であり、完全な ACP ネイティブのエディターランタイムではありません。主にセッションルーティング、プロンプト配信、基本的なストリーミング更新に焦点を当てています。

ACP harness セッションをホストする代わりに、外部 MCP クライアントから OpenClaw のチャネル会話へ直接接続したい場合は、代わりに [`openclaw mcp serve`](/ja-JP/cli/mcp) を使ってください。

## これは何ではないか

このページは ACP harness セッションと混同されがちです。

`openclaw acp` の意味は次のとおりです。

- OpenClaw が ACP サーバーとして動作する
- IDE または ACP クライアントが OpenClaw に接続する
- OpenClaw がその処理を Gateway セッションに転送する

これは、OpenClaw が `acpx` を通じて Codex や Claude Code のような外部 harness を実行する [ACP Agents](/ja-JP/tools/acp-agents) とは異なります。

簡単なルール:

- エディター/クライアントが ACP で OpenClaw と話したい: `openclaw acp` を使う
- OpenClaw が Codex/Claude/Gemini を ACP harness として起動すべき: `/acp spawn` と [ACP Agents](/ja-JP/tools/acp-agents) を使う

## 互換性マトリクス

| ACP 領域                                                              | ステータス | 注記                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`、`newSession`、`prompt`、`cancel`                        | 実装済み   | stdio から Gateway の chat/send + abort へのコア bridge フロー。                                                                                                                                                                                |
| `listSessions`、スラッシュコマンド                                    | 実装済み   | セッション一覧は Gateway のセッション状態に対して機能します。コマンドは `available_commands_update` 経由で通知されます。                                                                                                                       |
| `loadSession`                                                         | 部分対応   | ACP セッションを Gateway セッションキーに再バインドし、保存された user/assistant のテキスト履歴を再生します。ツール/システム履歴はまだ再構築されません。                                                                                       |
| プロンプト内容（`text`、埋め込み `resource`、画像）                   | 部分対応   | テキスト/リソースは chat 入力にフラット化され、画像は Gateway attachments になります。                                                                                                                                                           |
| セッションモード                                                      | 部分対応   | `session/set_mode` はサポートされています。bridge は初期の Gateway バックドなセッション制御として、thought level、tool verbosity、reasoning、usage detail、elevated actions を公開します。より広い ACP ネイティブの mode/config 表面はまだ対象外です。 |
| セッション情報と使用量の更新                                          | 部分対応   | bridge はキャッシュされた Gateway セッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を発行します。使用量は概算であり、Gateway のトークン合計が fresh とマークされている場合にのみ送信されます。      |
| ツールストリーミング                                                  | 部分対応   | `tool_call` / `tool_call_update` イベントには、生の I/O、テキスト内容、および Gateway のツール引数/結果が公開している場合のベストエフォートなファイル位置が含まれます。埋め込みターミナルや、よりリッチな diff ネイティブ出力はまだ公開されません。 |
| セッションごとの MCP サーバー（`mcpServers`）                         | 未対応     | bridge モードはセッション単位の MCP サーバー要求を拒否します。代わりに OpenClaw gateway または agent 側で MCP を設定してください。                                                                                                            |
| クライアントのファイルシステムメソッド（`fs/read_text_file`、`fs/write_text_file`） | 未対応     | bridge は ACP クライアントのファイルシステムメソッドを呼び出しません。                                                                                                                                                                          |
| クライアントのターミナルメソッド（`terminal/*`）                      | 未対応     | bridge は ACP クライアントターミナルを作成せず、ツール呼び出し経由でターミナル ID もストリームしません。                                                                                                                                       |
| セッションプラン / thought ストリーミング                             | 未対応     | bridge は現在、ACP の plan または thought 更新ではなく、出力テキストとツールステータスを発行します。                                                                                                                                           |

## 既知の制限

- `loadSession` は保存された user および assistant のテキスト履歴を再生しますが、過去のツール呼び出し、システム通知、またはよりリッチな ACP ネイティブイベント型は再構築しません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有する場合、イベントおよび cancel のルーティングは、クライアントごとに厳密に分離されるのではなくベストエフォートになります。エディターごとにきれいに分離されたターンが必要な場合は、既定の分離された `acp:<uuid>` セッションを使ってください。
- Gateway の stop 状態は ACP の stop reason に変換されますが、その対応付けは完全な ACP ネイティブランタイムほど表現力がありません。
- 現在の初期セッション制御で公開されるのは、Gateway の設定のうち焦点を絞った一部だけです: thought level、tool verbosity、reasoning、usage detail、elevated actions。モデル選択と exec-host 制御は、まだ ACP の config オプションとして公開されていません。
- `session_info_update` と `usage_update` は、ACP ネイティブのライブなランタイム会計ではなく、Gateway セッションスナップショットから導出されます。使用量は概算で、コストデータは含まれず、Gateway が合計トークンデータを fresh とマークしている場合にのみ発行されます。
- ツール追従データはベストエフォートです。bridge は既知のツール引数/結果に現れるファイルパスを表面化できますが、ACP ターミナルや構造化されたファイル diff はまだ発行しません。

## 使い方

```bash
openclaw acp

# リモート Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# リモート Gateway（ファイルからトークンを取得）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 既存のセッションキーにアタッチ
openclaw acp --session agent:main:main

# ラベルでアタッチ（事前に存在している必要があります）
openclaw acp --session-label "support inbox"

# 最初のプロンプトの前にセッションキーをリセット
openclaw acp --session agent:main:main --reset-session
```

## ACP クライアント（デバッグ）

IDE なしで bridge の健全性を確認するには、組み込みの ACP クライアントを使ってください。
これにより ACP bridge が起動され、対話的にプロンプトを入力できます。

```bash
openclaw acp client

# 起動される bridge をリモート Gateway に向ける
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# サーバーコマンドを上書き（既定: openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル（クライアントデバッグモード）:

- 自動承認は allowlist ベースで、信頼されたコアツール ID にのみ適用されます。
- `read` の自動承認は現在の作業ディレクトリ（設定時は `--cwd`）に限定されます。
- ACP は狭い読み取り専用クラスのみを自動承認します。つまり、アクティブな cwd 配下のスコープ付き `read` 呼び出しと、読み取り専用の検索ツール（`search`、`web_search`、`memory_search`）です。未知/非コアツール、範囲外の読み取り、exec 可能なツール、control-plane ツール、変更系ツール、対話的フローは常に明示的なプロンプト承認が必要です。
- サーバーから提供される `toolCall.kind` は信頼できないメタデータとして扱われます（認可の情報源ではありません）。
- この ACP bridge のポリシーは ACPX harness 権限とは別です。`acpx` バックエンド経由で OpenClaw を実行する場合、`plugins.entries.acpx.config.permissionMode=approve-all` がその harness セッション用の非常用「yolo」スイッチです。

## これをどう使うか

IDE（または他のクライアント）が Agent Client Protocol を話し、それに OpenClaw Gateway セッションを操作させたい場合は ACP を使います。

1. Gateway が実行中であることを確認します（ローカルまたはリモート）。
2. Gateway の接続先を設定します（config または flags）。
3. IDE が stdio 経由で `openclaw acp` を実行するように設定します。

設定例（永続化）:

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行の例（config には書き込まない）:

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# ローカルプロセス安全性のため推奨
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## エージェントの選択

ACP はエージェントを直接選びません。Gateway セッションキーによってルーティングされます。

特定のエージェントを対象にするには、エージェントスコープのセッションキーを使います。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは 1 つの Gateway セッションキーに対応します。1 つのエージェントは複数のセッションを持てます。ACP は、キーまたはラベルを上書きしない限り、既定で分離された `acp:<uuid>` セッションを使います。

bridge モードでは、セッションごとの `mcpServers` はサポートされません。ACP クライアントが `newSession` または `loadSession` 中にそれらを送信した場合、bridge は黙って無視するのではなく、明確なエラーを返します。

ACPX バックドなセッションから OpenClaw Plugin ツールや、`cron` のような選択された組み込みツールを見えるようにしたい場合は、セッションごとの `mcpServers` を渡そうとするのではなく、gateway 側の ACPX MCP bridge を有効にしてください。詳しくは [ACP Agents](/ja-JP/tools/acp-agents#plugin-tools-mcp-bridge) と [OpenClaw tools MCP bridge](/ja-JP/tools/acp-agents#openclaw-tools-mcp-bridge) を参照してください。

## `acpx` から使う（Codex、Claude、その他の ACP クライアント）

Codex や Claude Code のようなコーディングエージェントから ACP 経由で OpenClaw ボットと対話させたい場合は、組み込みの `openclaw` ターゲットを持つ `acpx` を使ってください。

典型的な流れ:

1. Gateway を起動し、ACP bridge がそこに到達できることを確認します。
2. `acpx openclaw` を `openclaw acp` に向けます。
3. コーディングエージェントに使わせたい OpenClaw セッションキーを指定します。

例:

```bash
# 既定の OpenClaw ACP セッションへの単発リクエスト
acpx openclaw exec "アクティブな OpenClaw セッション状態を要約して。"

# フォローアップターン用の永続的な名前付きセッション
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "このリポジトリに関連する最近のコンテキストを、私の OpenClaw 作業エージェントに尋ねて。"
```

`acpx openclaw` が常に特定の Gateway とセッションキーを対象にするようにしたい場合は、`~/.acpx/config.json` で `openclaw` エージェントコマンドを上書きしてください。

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルの OpenClaw チェックアウトでは、ACP ストリームをクリーンに保つため、dev runner ではなく直接 CLI エントリーポイントを使ってください。たとえば次のようにします。

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または他の ACP 対応クライアントが、ターミナルをスクレイピングせずに OpenClaw エージェントからコンテキスト情報を取得する最も簡単な方法です。

## Zed エディターのセットアップ

`~/.config/zed/settings.json` にカスタム ACP エージェントを追加します（または Zed の Settings UI を使います）:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

特定の Gateway またはエージェントを対象にするには:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed では、Agent パネルを開いて「OpenClaw ACP」を選択するとスレッドを開始できます。

## セッションマッピング

既定では、ACP セッションは `acp:` プレフィックス付きの分離された Gateway セッションキーを取得します。
既知のセッションを再利用するには、セッションキーまたはラベルを渡します。

- `--session <key>`: 特定の Gateway セッションキーを使います。
- `--session-label <label>`: ラベルで既存セッションを解決します。
- `--reset-session`: そのキーに対して新しいセッション ID を発行します（同じキー、新しいトランスクリプト）。

ACP クライアントがメタデータをサポートしている場合は、セッションごとに上書きできます。

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

セッションキーの詳細は [/concepts/session](/ja-JP/concepts/session) を参照してください。

## オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合は既定で gateway.remote.url）。
- `--token <token>`: Gateway 認証トークン。
- `--token-file <path>`: ファイルから Gateway 認証トークンを読み取ります。
- `--password <password>`: Gateway 認証パスワード。
- `--password-file <path>`: ファイルから Gateway 認証パスワードを読み取ります。
- `--session <key>`: 既定のセッションキー。
- `--session-label <label>`: 解決する既定のセッションラベル。
- `--require-existing`: セッションキー/ラベルが存在しない場合は失敗します。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトの先頭に作業ディレクトリを付けません。
- `--provenance <off|meta|meta+receipt>`: ACP provenance メタデータまたは receipt を含めます。
- `--verbose, -v`: stderr への詳細ログ。

セキュリティに関する注意:

- `--token` と `--password` は、一部のシステムではローカルのプロセス一覧に表示されることがあります。
- `--token-file`/`--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）の使用を推奨します。
- Gateway 認証の解決は、他の Gateway クライアントで使われる共有契約に従います。
  - ローカルモード: env（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> `gateway.auth.*` が未設定のときのみ `gateway.remote.*` にフォールバック（設定済みだが未解決のローカル SecretRefs は fail closed）
  - リモートモード: `gateway.remote.*` を使い、リモート優先ルールに従って env/config にフォールバック
  - `--url` は上書き安全で、暗黙の config/env 資格情報は再利用しません。明示的な `--token`/`--password`（またはファイル版）を渡してください
- ACP ランタイムバックエンドの子プロセスには `OPENCLAW_SHELL=acp` が渡され、コンテキスト固有の shell/profile ルールに使えます。
- `openclaw acp client` は、起動した bridge プロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` のオプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド（既定: `openclaw`）。
- `--server-args <args...>`: ACP サーバーに渡す追加引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: クライアントの詳細ログ。

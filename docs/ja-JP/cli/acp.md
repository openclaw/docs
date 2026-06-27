---
read_when:
    - ACP ベースの IDE 連携の設定
    - Gateway への ACP セッションルーティングのデバッグ
summary: IDE 統合用の ACP ブリッジを実行する
title: ACP
x-i18n:
    generated_at: "2026-06-27T10:51:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行し、OpenClaw Gateway と通信します。

このコマンドは IDE 向けに stdio 経由で ACP を話し、プロンプトを WebSocket
経由で Gateway に転送します。ACP セッションを Gateway セッションキーに対応付けて保持します。

`openclaw acp` は Gateway backed の ACP ブリッジであり、完全な ACP ネイティブのエディター
ランタイムではありません。セッションルーティング、プロンプト配信、基本的なストリーミング
更新に重点を置いています。

ACP ハーネスセッションをホストするのではなく、外部 MCP クライアントから OpenClaw チャンネル
会話へ直接接続したい場合は、代わりに
[`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。

## これは何ではないか

このページは ACP ハーネスセッションと混同されることがよくあります。

`openclaw acp` の意味:

- OpenClaw が ACP サーバーとして動作する
- IDE または ACP クライアントが OpenClaw に接続する
- OpenClaw がその作業を Gateway セッションに転送する

これは [ACP Agents](/ja-JP/tools/acp-agents) とは異なります。ACP Agents では、OpenClaw が
Codex や Claude Code などの外部ハーネスを `acpx` 経由で実行します。

簡単な判断基準:

- エディター/クライアントが OpenClaw に ACP で話したい場合: `openclaw acp` を使用する
- OpenClaw が Codex/Claude/Gemini を ACP ハーネスとして起動する必要がある場合: `/acp spawn` と [ACP Agents](/ja-JP/tools/acp-agents) を使用する

## 互換性マトリックス

| ACP 領域                                                              | 状態      | メモ                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 実装済み | stdio から Gateway chat/send + abort へのコアブリッジフロー。                                                                                                                                                                                        |
| `listSessions`, スラッシュコマンド                                        | 実装済み | セッション一覧は、境界付きカーソルページネーションと、Gateway セッション行にワークスペースメタデータがある場合の `cwd` フィルタリングを使って、Gateway セッション状態に対して動作します。コマンドは `available_commands_update` 経由で通知されます。                                |
| セッション系譜メタデータ                                              | 実装済み | セッション一覧とセッション情報スナップショットには、OpenClaw の親子系譜が `_meta` に含まれるため、ACP クライアントは非公開の Gateway サイドチャンネルなしでサブエージェントグラフを描画できます。                                                                |
| `resumeSession`, `closeSession`                                       | 実装済み | resume は履歴を再生せずに ACP セッションを既存の Gateway セッションへ再バインドします。close はアクティブなブリッジ作業をキャンセルし、保留中のプロンプトをキャンセル済みとして解決し、ブリッジセッション状態を解放します。                                              |
| `loadSession`                                                         | 部分対応     | ACP セッションを Gateway セッションキーへ再バインドし、ブリッジが作成したセッションについて ACP イベント台帳履歴を再生します。古い、または台帳のないセッションでは保存済みのユーザー/アシスタントテキストへフォールバックします。                                                             |
| プロンプト内容 (`text`, 埋め込み `resource`, 画像)                  | 部分対応     | テキスト/リソースはチャット入力に平坦化され、画像は Gateway 添付ファイルになります。                                                                                                                                                                 |
| セッションモード                                                         | 部分対応     | `session/set_mode` がサポートされ、ブリッジは思考レベル、ツール冗長度、推論、使用量詳細、昇格アクション向けの初期 Gateway backed セッション制御を公開します。より広い ACP ネイティブのモード/設定サーフェスはまだ対象外です。 |
| セッション情報と使用量更新                                        | 部分対応     | ブリッジは、キャッシュされた Gateway セッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を送信します。使用量は概算であり、Gateway のトークン合計が最新とマークされている場合にのみ送信されます。                                        |
| ツールストリーミング                                                        | 部分対応     | `tool_call` / `tool_call_update` イベントには、Gateway ツールの引数/結果が公開している場合、生の I/O、テキスト内容、ベストエフォートのファイル位置が含まれます。埋め込みターミナルや、よりリッチな diff ネイティブ出力はまだ公開されません。                        |
| exec 承認                                                        | 部分対応     | アクティブな ACP プロンプトターン中の Gateway exec 承認プロンプトは、`session/request_permission` で ACP クライアントへ中継されます。                                                                                                                    |
| セッションごとの MCP サーバー (`mcpServers`)                                | 非対応 | ブリッジモードはセッションごとの MCP サーバー要求を拒否します。代わりに OpenClaw Gateway またはエージェントで MCP を設定してください。                                                                                                                                     |
| クライアントファイルシステムメソッド (`fs/read_text_file`, `fs/write_text_file`) | 非対応 | ブリッジは ACP クライアントファイルシステムメソッドを呼び出しません。                                                                                                                                                                                          |
| クライアントターミナルメソッド (`terminal/*`)                                | 非対応 | ブリッジは ACP クライアントターミナルを作成せず、ツール呼び出しを通じてターミナル ID をストリーミングしません。                                                                                                                                                       |
| セッションプラン / 思考ストリーミング                                     | 非対応 | ブリッジは現在、ACP プランや思考更新ではなく、出力テキストとツール状態を送信します。                                                                                                                                                         |

## 既知の制限

- `loadSession` は、ブリッジが作成したセッションについてのみ、完全な ACP イベント台帳履歴を再生できます。古い、または台帳のないセッションでは引き続きトランスクリプト
  フォールバックを使用し、過去のツール呼び出しやシステム通知は再構成しません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有する場合、イベントとキャンセルの
  ルーティングはクライアントごとに厳密に分離されるのではなく、ベストエフォートになります。クリーンなエディター local
  ターンが必要な場合は、既定の分離された `acp-bridge:<uuid>` セッションを推奨します。
- Gateway の停止状態は ACP 停止理由に変換されますが、そのマッピングは完全な ACP ネイティブランタイムより
  表現力が低くなります。
- 初期セッション制御は現在、Gateway ノブの絞り込まれたサブセットを公開します:
  思考レベル、ツール冗長度、推論、使用量詳細、昇格
  アクション。モデル選択と exec ホスト制御は、まだ ACP
  設定オプションとして公開されていません。
- `session_info_update` と `usage_update` は、ライブの ACP ネイティブランタイム計測ではなく、Gateway セッション
  スナップショットから派生します。使用量は概算で、
  コストデータを含まず、Gateway が合計トークン
  データを最新とマークしている場合にのみ送信されます。
- ツールの追従データはベストエフォートです。ブリッジは既知のツール引数/結果に
  現れるファイルパスを表示できますが、ACP ターミナルや
  構造化されたファイル diff はまだ送信しません。
- exec 承認の中継はアクティブな ACP プロンプトターンに限定されます。他の
  Gateway セッションからの承認は無視されます。

## 使用方法

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP クライアント (デバッグ)

IDE なしでブリッジを健全性確認するには、組み込み ACP クライアントを使用します。
ACP ブリッジを起動し、対話的にプロンプトを入力できます。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル (クライアントデバッグモード):

- 自動承認は許可リストベースであり、信頼されたコアツール ID にのみ適用されます。
- `read` の自動承認は、現在の作業ディレクトリ (`--cwd` が設定されている場合はそれ) に限定されます。
- ACP は狭い読み取り専用クラスのみを自動承認します: アクティブな cwd 配下に限定された `read` 呼び出しと、読み取り専用検索ツール (`search`, `web_search`, `memory_search`)。不明なツール/非コアツール、スコープ外の読み取り、exec 可能ツール、制御プレーンツール、変更を行うツール、対話フローでは、常に明示的なプロンプト承認が必要です。
- サーバー提供の `toolCall.kind` は信頼できないメタデータとして扱われます (認可ソースではありません)。
- この ACP ブリッジポリシーは ACPX ハーネス権限とは別です。`acpx` backend 経由で OpenClaw を実行する場合、`plugins.entries.acpx.config.permissionMode=approve-all` は、そのハーネスセッション向けの非常用「yolo」スイッチです。

## プロトコルスモークテスト

プロトコルレベルのデバッグでは、分離された状態で Gateway を起動し、ACP JSON-RPC クライアントで
stdio 経由の `openclaw acp` を駆動します。`initialize`、
絶対 `cwd` を指定した `session/new`、`session/list`、`session/resume`、
`session/close`、重複 close、存在しない resume をカバーします。

証拠には、通知されたライフサイクル機能、Gateway backed
セッション行、更新通知、Gateway の `sessions.list` ログを含める必要があります:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

唯一の ACP 証拠として `openclaw gateway call sessions.list` を使用するのは避けてください。その
CLI パスは fresh-token オペレータースコープ昇格を要求する場合があります。ACP ブリッジの
正しさは、ACP stdio フレームと Gateway `sessions.list` ログで証明されます。

## これの使い方

IDE (または他のクライアント) が Agent Client Protocol を話し、それによって
OpenClaw Gateway セッションを駆動したい場合に ACP を使用します。

1. Gateway が実行中であることを確認します (ローカルまたはリモート)。
2. Gateway ターゲットを設定します (設定またはフラグ)。
3. IDE に stdio 経由で `openclaw acp` を実行するよう指定します。

設定例 (永続化):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行の例 (設定を書き込まない):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## エージェントの選択

ACP はエージェントを直接選択しません。Gateway セッションキーでルーティングします。

特定のエージェントを対象にするには、エージェントスコープのセッションキーを使用します:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは単一の Gateway セッションキーに対応します。1つのエージェントは複数の
セッションを持てます。ACP は、キーまたはラベルを上書きしない限り、分離された
`acp-bridge:<uuid>` セッションをデフォルトで使用します。

セッションごとの `mcpServers` はブリッジモードではサポートされません。ACP クライアントが
`newSession` または `loadSession` 中にそれらを送信した場合、ブリッジはそれらを黙って無視するのではなく、
明確なエラーを返します。

ACPX をバックエンドにしたセッションから OpenClaw Plugin ツール、または `cron` などの選択された
組み込みツールを見えるようにしたい場合は、セッションごとの `mcpServers` を渡そうとするのではなく、
Gateway 側の ACPX MCP ブリッジを有効にしてください。
[ACP エージェント](/ja-JP/tools/acp-agents-setup#plugin-tools-mcp-bridge) と
[OpenClaw ツール MCP ブリッジ](/ja-JP/tools/acp-agents-setup#openclaw-tools-mcp-bridge) を参照してください。

## `acpx`（Codex、Claude、その他の ACP クライアント）から使用する

Codex や Claude Code のようなコーディングエージェントに ACP 経由で
OpenClaw ボットと通信させたい場合は、組み込みの `openclaw` ターゲットを指定して `acpx` を使用します。

典型的な流れ:

1. Gateway を実行し、ACP ブリッジがそこに到達できることを確認します。
2. `acpx openclaw` を `openclaw acp` に向けます。
3. コーディングエージェントに使用させたい OpenClaw セッションキーを対象にします。

例:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

毎回 `acpx openclaw` が特定の Gateway とセッションキーを対象にするようにしたい場合は、
`~/.acpx/config.json` で `openclaw` エージェントコマンドを上書きします。

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルの OpenClaw チェックアウトでは、ACP ストリームをクリーンに保つために、
dev ランナーではなく直接の CLI エントリポイントを使用します。例:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または別の ACP 対応クライアントが、ターミナルをスクレイピングせずに
OpenClaw エージェントからコンテキスト情報を取得できるようにする最も簡単な方法です。

## Zed エディターのセットアップ

`~/.config/zed/settings.json` にカスタム ACP エージェントを追加します（または Zed の Settings UI を使用します）。

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

Zed で Agent パネルを開き、「OpenClaw ACP」を選択してスレッドを開始します。

## セッションマッピング

デフォルトでは、ACP ブリッジセッションは `acp-bridge:` プレフィックス付きの
分離された Gateway セッションキーを取得します。これらの通常モデルのブリッジセッションは合成されたもので、
古いエントリの刈り込みとエントリ数上限の対象になります。既知のセッションを再利用するには、
セッションキーまたはラベルを渡します。

- `--session <key>`: 特定の Gateway セッションキーを使用します。
- `--session-label <label>`: ラベルで既存のセッションを解決します。
- `--reset-session`: そのキー用に新しいセッション ID を生成します（同じキー、新しいトランスクリプト）。

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

セッションキーについて詳しくは [/concepts/session](/ja-JP/concepts/session) を参照してください。

## オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合は gateway.remote.url がデフォルト）。
- `--token <token>`: Gateway 認証トークン。
- `--token-file <path>`: ファイルから Gateway 認証トークンを読み取ります。
- `--password <password>`: Gateway 認証パスワード。
- `--password-file <path>`: ファイルから Gateway 認証パスワードを読み取ります。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッションラベル。
- `--require-existing`: セッションキーまたはラベルが存在しない場合に失敗します。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトの先頭に作業ディレクトリを付けません。
- `--provenance <off|meta|meta+receipt>`: ACP 来歴メタデータまたはレシートを含めます。
- `--verbose, -v`: stderr への詳細ログ出力。

セキュリティ上の注意:

- `--token` と `--password` は、一部のシステムでローカルプロセス一覧に表示される場合があります。
- `--token-file`/`--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）を優先してください。
- Gateway 認証解決は、他の Gateway クライアントが使用する共有契約に従います。
  - ローカルモード: env（`OPENCLAW_GATEWAY_*`） -> `gateway.auth.*` -> `gateway.auth.*` が未設定の場合のみ `gateway.remote.*` フォールバック（設定済みだが解決できないローカル SecretRefs は fail closed）
  - リモートモード: リモート優先順位ルールに従う env/config フォールバック付きの `gateway.remote.*`
  - `--url` は上書きしても安全で、暗黙の config/env 認証情報を再利用しません。明示的な `--token`/`--password`（またはファイル版）を渡してください
- ACP ランタイムバックエンドの子プロセスは `OPENCLAW_SHELL=acp` を受け取ります。これはコンテキスト固有のシェル/プロファイルルールに使用できます。
- `openclaw acp client` は、生成されたブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` オプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド（デフォルト: `openclaw`）。
- `--server-args <args...>`: ACP サーバーに渡される追加引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: 詳細なクライアントログ。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ACP エージェント](/ja-JP/tools/acp-agents)

---
read_when:
    - ACP ベースの IDE 統合の設定
    - ACP セッションの Gateway へのルーティングをデバッグする
summary: IDE 連携用に ACP ブリッジを実行する
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:25:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行し、OpenClaw Gateway と通信します。

このコマンドは IDE 向けに stdio 経由で ACP を話し、プロンプトを WebSocket 経由で Gateway に転送します。ACP セッションと Gateway セッションキーの対応関係を保持します。

`openclaw acp` は Gateway をバックエンドにした ACP ブリッジであり、完全な ACP ネイティブのエディターランタイムではありません。セッションルーティング、プロンプト配信、基本的なストリーミング更新に重点を置いています。

外部 MCP クライアントから、ACP ハーネスセッションをホストするのではなく OpenClaw チャネル会話に直接接続したい場合は、代わりに [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。

## これは何ではないか

このページは ACP ハーネスセッションと混同されることがよくあります。

`openclaw acp` の意味は次のとおりです。

- OpenClaw が ACP サーバーとして動作する
- IDE または ACP クライアントが OpenClaw に接続する
- OpenClaw がその作業を Gateway セッションへ転送する

これは、OpenClaw が Codex や Claude Code などの外部ハーネスを `acpx` 経由で実行する [ACP Agents](/ja-JP/tools/acp-agents) とは異なります。

簡単なルール:

- エディター/クライアントが ACP で OpenClaw と通信したい場合: `openclaw acp` を使用する
- OpenClaw が Codex/Claude/Gemini を ACP ハーネスとして起動する必要がある場合: `/acp spawn` と [ACP Agents](/ja-JP/tools/acp-agents) を使用する

## 互換性マトリックス

| ACP 領域                                                              | 状態        | 注記                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 実装済み | stdio から Gateway の chat/send + abort へのコアブリッジフロー。                                                                                                                                                                                        |
| `listSessions`, スラッシュコマンド                                        | 実装済み | セッション一覧は、境界付きカーソルページネーションと、Gateway セッション行がワークスペースメタデータを持つ場合の `cwd` フィルタリングを使って、Gateway セッション状態に対して動作します。コマンドは `available_commands_update` 経由で通知されます。                                |
| セッション系譜メタデータ                                              | 実装済み | セッション一覧とセッション情報スナップショットには、OpenClaw の親子系譜が `_meta` に含まれるため、ACP クライアントは非公開の Gateway サイドチャネルなしでサブエージェントグラフを描画できます。                                                                |
| `resumeSession`, `closeSession`                                       | 実装済み | resume は履歴を再生せずに、ACP セッションを既存の Gateway セッションへ再バインドします。close はアクティブなブリッジ作業をキャンセルし、保留中のプロンプトをキャンセル済みとして解決し、ブリッジセッション状態を解放します。                                              |
| `loadSession`                                                         | 部分対応     | ACP セッションを Gateway セッションキーに再バインドし、ブリッジが作成したセッションについて ACP イベント台帳履歴を再生します。古いセッションや台帳のないセッションでは、保存済みのユーザー/アシスタントテキストにフォールバックします。                                                             |
| プロンプト内容（`text`、埋め込み `resource`、画像）                  | 部分対応     | テキスト/リソースはチャット入力に平坦化され、画像は Gateway 添付ファイルになります。                                                                                                                                                                 |
| セッションモード                                                         | 部分対応     | `session/set_mode` はサポートされ、ブリッジは思考レベル、ツール詳細度、推論、使用量詳細、昇格アクション向けの初期 Gateway バックエンド付きセッション制御を公開します。より広範な ACP ネイティブのモード/設定サーフェスは引き続き対象外です。 |
| セッション情報と使用量更新                                        | 部分対応     | ブリッジはキャッシュされた Gateway セッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を送信します。使用量は概算であり、Gateway のトークン合計が最新としてマークされている場合にのみ送信されます。                                        |
| ツールストリーミング                                                        | 部分対応     | `tool_call` / `tool_call_update` イベントには、Gateway ツールの引数/結果で公開されている場合、生の I/O、テキスト内容、ベストエフォートのファイル位置が含まれます。埋め込みターミナルや、よりリッチな diff ネイティブ出力はまだ公開されません。                        |
| Exec 承認                                                        | 部分対応     | アクティブな ACP プロンプトターン中の Gateway exec 承認プロンプトは、`session/request_permission` で ACP クライアントに中継されます。                                                                                                                    |
| セッション単位の MCP サーバー（`mcpServers`）                                | 非対応 | ブリッジモードでは、セッション単位の MCP サーバーリクエストを拒否します。代わりに OpenClaw Gateway またはエージェント側で MCP を設定してください。                                                                                                                                     |
| クライアントファイルシステムメソッド（`fs/read_text_file`, `fs/write_text_file`） | 非対応 | ブリッジは ACP クライアントのファイルシステムメソッドを呼び出しません。                                                                                                                                                                                          |
| クライアントターミナルメソッド（`terminal/*`）                                | 非対応 | ブリッジは ACP クライアントターミナルを作成せず、ツール呼び出しを通じてターミナル ID をストリーミングしません。                                                                                                                                                       |
| セッション計画 / 思考ストリーミング                                     | 非対応 | ブリッジは現在、出力テキストとツール状態を送信し、ACP 計画や思考更新は送信しません。                                                                                                                                                         |

## 既知の制限事項

- `loadSession` が完全な ACP イベント台帳履歴を再生できるのは、ブリッジが作成したセッションのみです。古いセッションや台帳のないセッションは引き続きトランスクリプトフォールバックを使用し、過去のツール呼び出しやシステム通知は再構築しません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有する場合、イベントとキャンセルのルーティングは、クライアントごとに厳密に分離されるのではなくベストエフォートになります。クリーンなエディターローカルターンが必要な場合は、既定の分離された `acp:<uuid>` セッションを使用してください。
- Gateway の停止状態は ACP 停止理由に変換されますが、その対応付けは完全な ACP ネイティブランタイムほど表現力がありません。
- 初期セッション制御では現在、Gateway ノブの絞り込まれたサブセットとして、思考レベル、ツール詳細度、推論、使用量詳細、昇格アクションを公開します。モデル選択と exec ホスト制御は、まだ ACP 設定オプションとして公開されていません。
- `session_info_update` と `usage_update` は、ライブの ACP ネイティブランタイム会計ではなく、Gateway セッションスナップショットから派生します。使用量は概算で、コストデータを含まず、Gateway が合計トークンデータを最新としてマークしている場合にのみ送信されます。
- ツール追従データはベストエフォートです。ブリッジは既知のツール引数/結果に現れるファイルパスを表示できますが、ACP ターミナルや構造化ファイル diff はまだ送信しません。
- Exec 承認中継はアクティブな ACP プロンプトターンに限定されます。他の Gateway セッションからの承認は無視されます。

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

## ACP クライアント（デバッグ）

IDE なしでブリッジの健全性を確認するには、組み込み ACP クライアントを使用します。
ACP ブリッジを起動し、対話的にプロンプトを入力できるようにします。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル（クライアントデバッグモード）:

- 自動承認は許可リストベースで、信頼済みのコアツール ID にのみ適用されます。
- `read` 自動承認は現在の作業ディレクトリ（設定されている場合は `--cwd`）に限定されます。
- ACP が自動承認するのは、狭い読み取り専用クラスのみです。アクティブな cwd 配下に限定された `read` 呼び出しと、読み取り専用検索ツール（`search`, `web_search`, `memory_search`）です。不明/非コアツール、スコープ外の読み取り、exec 可能なツール、コントロールプレーンツール、変更を伴うツール、対話フローでは、常に明示的なプロンプト承認が必要です。
- サーバー提供の `toolCall.kind` は、信頼されないメタデータ（認可ソースではない）として扱われます。
- この ACP ブリッジポリシーは ACPX ハーネス権限とは別です。`acpx` バックエンド経由で OpenClaw を実行する場合、そのハーネスセッションでは `plugins.entries.acpx.config.permissionMode=approve-all` が緊急用の "yolo" スイッチです。

## プロトコルスモークテスト

プロトコルレベルのデバッグでは、分離状態の Gateway を起動し、ACP JSON-RPC クライアントで stdio 経由の `openclaw acp` を駆動します。`initialize`、`session/new`、絶対 `cwd` 付きの `session/list`、`session/resume`、`session/close`、重複 close、存在しない resume を網羅してください。

証跡には、通知されたライフサイクル機能、Gateway バックエンド付きセッション行、更新通知、Gateway の `sessions.list` ログを含める必要があります。

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

唯一の ACP 証跡として `openclaw gateway call sessions.list` を使うことは避けてください。その CLI 経路は fresh-token オペレータースコープ昇格を要求する可能性があります。ACP ブリッジの正しさは、ACP stdio フレームと Gateway の `sessions.list` ログによって証明されます。

## これの使い方

IDE（または他のクライアント）が Agent Client Protocol を話し、それを OpenClaw Gateway セッションの駆動に使いたい場合は ACP を使用します。

1. Gateway が実行中であることを確認します（ローカルまたはリモート）。
2. Gateway ターゲットを設定します（設定またはフラグ）。
3. IDE で stdio 経由の `openclaw acp` を実行するよう指定します。

設定例（永続化）:

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行の例（設定を書き込まない）:

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## エージェントの選択

ACP はエージェントを直接選択しません。Gateway セッションキーによってルーティングします。

特定のエージェントを対象にするには、エージェントスコープのセッションキーを使用します。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは、単一の Gateway セッションキーに対応します。1 つのエージェントは複数の
セッションを持てます。キーやラベルを上書きしない限り、ACP は分離された `acp:<uuid>` セッションをデフォルトで使用します。

セッションごとの `mcpServers` はブリッジモードではサポートされていません。ACP クライアントが
`newSession` または `loadSession` 中にそれらを送信した場合、ブリッジは黙って無視するのではなく、明確な
エラーを返します。

ACPX ベースのセッションから OpenClaw Plugin ツールや `cron` などの選択された
組み込みツールを見えるようにしたい場合は、セッションごとの `mcpServers` を渡そうとするのではなく、
Gateway 側の ACPX MCP ブリッジを有効にしてください。詳しくは
[ACP エージェント](/ja-JP/tools/acp-agents-setup#plugin-tools-mcp-bridge) と
[OpenClaw ツール MCP ブリッジ](/ja-JP/tools/acp-agents-setup#openclaw-tools-mcp-bridge) を参照してください。

## `acpx` から使用する (Codex、Claude、その他の ACP クライアント)

Codex や Claude Code などのコーディングエージェントに ACP 経由で
OpenClaw ボットと通信させたい場合は、組み込みの `openclaw` ターゲットを持つ `acpx` を使用します。

一般的な流れ:

1. Gateway を実行し、ACP ブリッジから到達できることを確認します。
2. `acpx openclaw` を `openclaw acp` に向けます。
3. コーディングエージェントに使用させたい OpenClaw セッションキーをターゲットにします。

例:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

毎回 `acpx openclaw` が特定の Gateway とセッションキーをターゲットにするようにしたい場合は、
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

リポジトリローカルの OpenClaw チェックアウトでは、ACP ストリームをクリーンに保つため、
dev runner ではなく直接 CLI エントリーポイントを使用します。例:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または別の ACP 対応クライアントが、
ターミナルをスクレイピングせずに OpenClaw エージェントからコンテキスト情報を取得できるようにする最も簡単な方法です。

## Zed エディターのセットアップ

`~/.config/zed/settings.json` にカスタム ACP エージェントを追加します (または Zed の Settings UI を使用します)。

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

特定の Gateway またはエージェントをターゲットにするには:

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

デフォルトでは、ACP セッションには `acp:` プレフィックス付きの分離された Gateway セッションキーが割り当てられます。
既知のセッションを再利用するには、セッションキーまたはラベルを渡します。

- `--session <key>`: 特定の Gateway セッションキーを使用します。
- `--session-label <label>`: ラベルで既存のセッションを解決します。
- `--reset-session`: そのキーに対して新しいセッション ID を生成します (同じキー、新しいトランスクリプト)。

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

- `--url <url>`: Gateway WebSocket URL (設定済みの場合は gateway.remote.url がデフォルト)。
- `--token <token>`: Gateway 認証トークン。
- `--token-file <path>`: ファイルから Gateway 認証トークンを読み取ります。
- `--password <password>`: Gateway 認証パスワード。
- `--password-file <path>`: ファイルから Gateway 認証パスワードを読み取ります。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッションラベル。
- `--require-existing`: セッションキー/ラベルが存在しない場合は失敗します。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトの先頭に作業ディレクトリを付けません。
- `--provenance <off|meta|meta+receipt>`: ACP provenance メタデータまたはレシートを含めます。
- `--verbose, -v`: stderr への詳細ログ出力。

セキュリティ注記:

- 一部のシステムでは、`--token` と `--password` がローカルプロセス一覧に表示される場合があります。
- `--token-file`/`--password-file` または環境変数 (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) を優先してください。
- Gateway 認証解決は、他の Gateway クライアントで使用される共有コントラクトに従います。
  - ローカルモード: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` フォールバックは `gateway.auth.*` が未設定の場合のみ (設定済みだが解決されていないローカル SecretRefs は fail closed します)
  - リモートモード: リモート優先順位ルールに従い、env/config フォールバック付きの `gateway.remote.*`
  - `--url` は上書きしても安全で、暗黙の config/env 認証情報を再利用しません。明示的な `--token`/`--password` (またはファイル版) を渡してください
- ACP ランタイムバックエンドの子プロセスは `OPENCLAW_SHELL=acp` を受け取ります。これはコンテキスト固有のシェル/プロファイルルールに使用できます。
- `openclaw acp client` は、生成されたブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` オプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド (デフォルト: `openclaw`)。
- `--server-args <args...>`: ACP サーバーに渡される追加引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: 詳細なクライアントログ。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ACP エージェント](/ja-JP/tools/acp-agents)

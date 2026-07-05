---
read_when:
    - ACP ベースの IDE 連携のセットアップ
    - Gateway への ACP セッションルーティングのデバッグ
summary: IDE 統合用に ACP ブリッジを実行する
title: ACP
x-i18n:
    generated_at: "2026-07-05T11:09:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行し、OpenClaw Gateway と通信します。

`openclaw acp` は IDE 向けに stdio 経由で ACP を話し、プロンプトを WebSocket 経由で Gateway に転送しながら、ACP セッションを Gateway セッションキーに対応付けたまま維持します。これは Gateway バックの ACP ブリッジであり、完全な ACP ネイティブのエディターランタイムではありません。セッションルーティング、プロンプト配信、ストリーミング更新に重点を置いています。

ACP ハーネスセッションをホストする代わりに、外部 MCP クライアントから OpenClaw チャンネル会話へ直接通信したい場合は、代わりに [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。

## これは何ではないか

`openclaw acp` は、OpenClaw が ACP サーバーとして動作することを意味します。IDE または ACP クライアントが OpenClaw に接続し、OpenClaw がその作業を Gateway セッションに転送します。

これは [ACP Agents](/ja-JP/tools/acp-agents) とは異なります。ACP Agents では、OpenClaw が Codex や Claude Code などの外部ハーネスを `acpx` 経由で実行します。

簡単なルール:

- エディター/クライアントが ACP で OpenClaw と通信したい場合: `openclaw acp` を使用
- OpenClaw が Codex/Claude/Gemini を ACP ハーネスとして起動する必要がある場合: `/acp spawn` と [ACP Agents](/ja-JP/tools/acp-agents) を使用

## 互換性マトリックス

| ACP 領域                                                              | 状態        | 注記                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 実装済み    | stdio から Gateway chat/send + abort へのコアブリッジフロー。                                                                                                                                                                        |
| `listSessions`, スラッシュコマンド                                    | 実装済み    | セッション一覧は、境界付きカーソルページネーションと、Gateway セッション行がワークスペースメタデータを持つ場合の `cwd` フィルタリングにより、Gateway セッション状態に対して機能します。コマンドは `available_commands_update` 経由で通知されます。 |
| セッション系譜メタデータ                                              | 実装済み    | セッション一覧とセッション情報スナップショットには、OpenClaw の親子系譜が `_meta` に含まれるため、ACP クライアントはプライベートな Gateway サイドチャンネルなしでサブエージェントグラフをレンダリングできます。                   |
| `resumeSession`, `closeSession`                                       | 実装済み    | Resume は履歴を再生せずに、ACP セッションを既存の Gateway セッションへ再バインドします。Close はアクティブなブリッジ作業をキャンセルし、保留中のプロンプトをキャンセル済みとして解決し、ブリッジセッション状態を解放します。       |
| `loadSession`                                                         | 部分対応    | ACP セッションを Gateway セッションキーへ再バインドし、ブリッジ作成セッションでは ACP イベント台帳履歴を再生します。古いセッションや台帳のないセッションは、保存済みのユーザー/アシスタントテキストへフォールバックします。        |
| プロンプト内容 (`text`, 埋め込み `resource`, 画像)                    | 部分対応    | テキスト/リソースはチャット入力に平坦化され、画像は Gateway 添付ファイルになります。                                                                                                                                                 |
| セッションモード                                                      | 部分対応    | `session/set_mode` をサポートしています。ブリッジは、思考レベル、ツール詳細度、推論、使用量詳細、昇格アクションについて、Gateway バックのセッション制御を公開します。より広範な ACP ネイティブのモード/設定サーフェスはまだ対象外です。 |
| 思考ストリーミング                                                    | 実装済み    | モデルの思考内容は `agent_thought_chunk` セッション更新としてストリーミングされます。ACP ネイティブのセッション計画は送信されません。                                                                                               |
| セッション情報と使用量更新                                            | 部分対応    | ブリッジは、キャッシュされた Gateway セッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を送信します。使用量は概算であり、Gateway トークン合計が fresh とマークされている場合にのみ送信されます。 |
| ツールストリーミング                                                  | 部分対応    | `tool_call`/`tool_call_update` イベントには、Gateway ツールの引数/結果が公開している場合、raw I/O、テキスト内容、ベストエフォートのファイル位置が含まれます。埋め込みターミナルや、よりリッチな diff ネイティブ出力は公開されません。 |
| Exec 承認                                                             | 部分対応    | アクティブな ACP プロンプトターン中の Gateway exec 承認プロンプトは、`session/request_permission` で ACP クライアントに中継されます。                                                                                               |
| セッションごとの MCP サーバー (`mcpServers`)                          | 非対応      | ブリッジモードは、セッションごとの MCP サーバー要求を拒否します。代わりに OpenClaw Gateway またはエージェント側で MCP を設定してください。                                                                                           |
| クライアントファイルシステムメソッド (`fs/read_text_file`, `fs/write_text_file`) | 非対応 | ブリッジは ACP クライアントのファイルシステムメソッドを呼び出しません。                                                                                                                                                             |
| クライアントターミナルメソッド (`terminal/*`)                         | 非対応      | ブリッジは ACP クライアントターミナルを作成せず、ツール呼び出し経由でターミナル ID をストリーミングしません。                                                                                                                       |

## 既知の制限

- `loadSession` は、ブリッジ作成セッションについてのみ完全な ACP イベント台帳履歴を再生します。古いセッションや台帳のないセッションはトランスクリプトフォールバックを使用し、過去のツール呼び出しやシステム通知は再構築しません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有している場合、イベントとキャンセルのルーティングはクライアントごとに厳密に分離されるのではなく、ベストエフォートになります。クリーンなエディター内ローカルターンが必要な場合は、デフォルトの分離された `acp-bridge:<uuid>` セッションを推奨します。
- Gateway 停止状態は ACP 停止理由に変換されますが、そのマッピングは完全な ACP ネイティブランタイムほど表現力がありません。
- セッション制御は Gateway のつまみのうち、思考レベル、ツール詳細度、推論、使用量詳細、昇格アクションに絞ったサブセットを公開します。モデル選択と exec ホスト制御は ACP 設定オプションとして公開されません。
- `session_info_update` と `usage_update` は、ライブの ACP ネイティブランタイム会計ではなく Gateway セッションスナップショットから派生します。使用量は概算で、コストデータを含まず、Gateway が合計トークンデータを fresh とマークした場合にのみ送信されます。
- ツール追従データはベストエフォートです。ブリッジは既知のツール引数/結果に現れるファイルパスを公開しますが、ACP ターミナルや構造化ファイル diff は送信しません。
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

## ACP クライアント (デバッグ)

IDE なしでブリッジを健全性チェックするには、組み込み ACP クライアントを使用します。ACP ブリッジを起動し、プロンプトを対話的に入力できます。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル（クライアントデバッグモード）:

- 自動承認は許可リストベースで、信頼されたコアツール ID にのみ適用されます。
- `read` の自動承認は、現在の作業ディレクトリ（設定されている場合は `--cwd`）にスコープされます。
- ACP は、狭い読み取り専用クラスだけを自動承認します。アクティブな cwd 配下にスコープされた `read` 呼び出しと、読み取り専用検索ツール（`search`、`web_search`、`memory_search`）です。不明なツールや非コアツール、スコープ外の読み取り、exec 可能なツール、制御プレーンツール、変更を伴うツール、対話型フローでは、常に明示的なプロンプト承認が必要です。
- サーバーが提供する `toolCall.kind` は、認可ソースではなく信頼されないメタデータとして扱われます。
- この ACP ブリッジポリシーは、ACPX ハーネス権限とは別です。`acpx` バックエンド経由で OpenClaw を実行する場合、`plugins.entries.acpx.config.permissionMode=approve-all` はそのハーネスセッション用の緊急用「yolo」スイッチです。

## プロトコルのスモークテスト

プロトコルレベルのデバッグでは、分離された状態で Gateway を起動し、ACP JSON-RPC クライアントを使って stdio 経由で `openclaw acp` を駆動します。`initialize`、`session/new`、絶対パスの `cwd` を伴う `session/list`、`session/resume`、`session/close`、重複 close、存在しない resume をカバーします。

証明には、広告されたライフサイクル機能、Gateway に裏付けられたセッション行、更新通知、Gateway の `sessions.list` ログを含める必要があります。

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

ACP の唯一の証明として `openclaw gateway call sessions.list` を使うことは避けてください。その CLI パスは新しいトークンのオペレータースコープ昇格を要求する場合があります。ACP ブリッジの正しさは、ACP stdio フレームと Gateway の `sessions.list` ログによって証明されます。

## 使い方

IDE（または他のクライアント）が Agent Client Protocol を話し、それに OpenClaw Gateway セッションを駆動させたい場合は ACP を使います。

1. Gateway が実行中であることを確認します（ローカルまたはリモート）。
2. Gateway ターゲットを設定します（設定またはフラグ）。
3. IDE に、stdio 経由で `openclaw acp` を実行するよう指定します。

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

ACP はエージェントを直接選択しません。Gateway セッションキーによってルーティングします。特定のエージェントを対象にするには、エージェントにスコープされたセッションキーを使います。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは、単一の Gateway セッションキーにマッピングされます。1 つのエージェントは複数のセッションを持てます。キーまたはラベルを上書きしない限り、ACP は分離された `acp-bridge:<uuid>` セッションをデフォルトで使用します。

セッション単位の `mcpServers` はブリッジモードではサポートされていません。ACP クライアントが `newSession` または `loadSession` 中にそれらを送信した場合、ブリッジはそれらを暗黙に無視するのではなく、明確なエラーを返します。

ACPX ベースのセッションで OpenClaw Plugin ツールや `cron` などの選択された組み込みツールを見せたい場合は、セッション単位の `mcpServers` を渡そうとするのではなく、Gateway 側の ACPX MCP ブリッジを有効にしてください。[ACP エージェント](/ja-JP/tools/acp-agents-setup#plugin-tools-mcp-bridge) と [OpenClaw ツール MCP ブリッジ](/ja-JP/tools/acp-agents-setup#openclaw-tools-mcp-bridge) を参照してください。

## `acpx` から使用する（Codex、Claude、その他の ACP クライアント）

Codex や Claude Code などのコーディングエージェントに ACP 経由で OpenClaw ボットと通信させたい場合は、組み込みの `openclaw` ターゲットを持つ `acpx` を使用します。

一般的な流れ:

1. Gateway を実行し、ACP ブリッジが到達できることを確認します。
2. `acpx openclaw` を `openclaw acp` に向けます。
3. コーディングエージェントに使用させたい OpenClaw セッションキーを指定します。

例:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw` が毎回特定の Gateway とセッションキーを対象にするようにしたい場合は、`~/.acpx/config.json` の `openclaw` エージェントコマンドを上書きします:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルの OpenClaw チェックアウトでは、ACP ストリームをクリーンに保つため、開発ランナーではなく直接の CLI エントリポイントを使用します:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または別の ACP 対応クライアントが、ターミナルをスクレイピングせずに OpenClaw エージェントからコンテキスト情報を取得できるようにする最も簡単な方法です。

## Zed エディター設定

`~/.config/zed/settings.json` にカスタム ACP エージェントを追加します（または Zed の設定 UI を使用します）:

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

デフォルトでは、ACP ブリッジセッションは `acp-bridge:` プレフィックス付きの分離された Gateway セッションキーを取得します。これらの通常モデルのブリッジセッションは合成される使い捨てのもので、古いエントリのプルーニング対象になり、保護された人間の会話サーフェスとしては扱われません。既知のセッションを再利用するには、セッションキーまたはラベルを渡します:

- `--session <key>`: 特定の Gateway セッションキーを使用します。
- `--session-label <label>`: 既存のセッションをラベルで解決します。
- `--reset-session`: そのキーに対して新しいセッション ID を発行します（同じキー、新しいトランスクリプト）。

ACP クライアントがメタデータをサポートしている場合は、セッションごとに上書きできます:

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

- `--url <url>`: Gateway WebSocket URL（設定されている場合のデフォルトは `gateway.remote.url`）。
- `--token <token>`: Gateway 認証トークン。
- `--token-file <path>`: Gateway 認証トークンをファイルから読み取ります。
- `--password <password>`: Gateway 認証パスワード。
- `--password-file <path>`: Gateway 認証パスワードをファイルから読み取ります。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッションラベル。
- `--require-existing`: セッションキー/ラベルが存在しない場合は失敗します。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトに作業ディレクトリをプレフィックスしません。
- `--provenance <off|meta|meta+receipt>`: ACP 来歴メタデータまたはレシートを含めます。
- `--verbose, -v`: 詳細ログを stderr に出力します。

セキュリティ上の注意:

- `--token` と `--password` は、一部のシステムでローカルプロセス一覧に表示される場合があります。`--token-file`/`--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）を優先してください。
- Gateway 認証の解決は、他の Gateway クライアントが使用する共有コントラクトに従います:
  - ローカルモード: 環境変数（`OPENCLAW_GATEWAY_*`）、次に `gateway.auth.*`。`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` にフォールバックします（設定済みだが解決されていないローカル SecretRef は、暗黙にフォールバックするのではなくフェイルクローズします）
  - リモートモード: リモート優先順位ルールに従い、環境変数/設定フォールバック付きの `gateway.remote.*`
  - `--url` は安全に上書きでき、暗黙の設定/環境変数の認証情報を再利用しません。明示的な `--token`/`--password`（またはファイル形式）を渡してください

### `acp client` オプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド（デフォルト: `openclaw`）。
- `--server-args <args...>`: ACP サーバーに渡す追加引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: 詳細なクライアントログ。
- `openclaw acp client` は、生成されたブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。これはコンテキスト固有のシェル/プロファイルルールに使用できます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ACP エージェント](/ja-JP/tools/acp-agents)

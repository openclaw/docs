---
read_when:
    - ACPベースの IDE 連携の設定
    - Gateway への ACP セッションルーティングのデバッグ
summary: IDE 連携用に ACP ブリッジを実行する
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行し、OpenClaw Gateway と通信します。

このコマンドは IDE 向けに stdio 上で ACP を話し、プロンプトを WebSocket 経由で Gateway に転送します。ACP セッションを Gateway セッションキーに対応付けて保持します。

`openclaw acp` は Gateway をバックエンドに持つ ACP ブリッジであり、完全な ACP ネイティブのエディタランタイムではありません。セッションルーティング、プロンプト配信、基本的なストリーミング更新に重点を置いています。

ACP ハーネスセッションをホストするのではなく、外部 MCP クライアントから OpenClaw チャンネル会話へ直接通信したい場合は、代わりに [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。

## これは何ではないか

このページは、ACP ハーネスセッションと混同されることがよくあります。

`openclaw acp` の意味は次のとおりです。

- OpenClaw が ACP サーバーとして動作する
- IDE または ACP クライアントが OpenClaw に接続する
- OpenClaw がその作業を Gateway セッションへ転送する

これは [ACP Agents](/ja-JP/tools/acp-agents) とは異なります。ACP Agents では、OpenClaw が Codex や Claude Code などの外部ハーネスを `acpx` 経由で実行します。

簡単なルール:

- エディタ/クライアントが ACP で OpenClaw と通信したい場合: `openclaw acp` を使用する
- OpenClaw が Codex/Claude/Gemini を ACP ハーネスとして起動すべき場合: `/acp spawn` と [ACP Agents](/ja-JP/tools/acp-agents) を使用する

## 互換性マトリクス

| ACP 領域                                                              | 状態      | 注記                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 実装済み | stdio から Gateway の chat/send + abort へのコアブリッジフロー。                                                                                                                                                                                        |
| `listSessions`, スラッシュコマンド                                        | 実装済み | Gateway セッション状態に対してセッション一覧が動作し、境界付きカーソルページネーションと、Gateway セッション行にワークスペースメタデータがある場合の `cwd` フィルタリングに対応します。コマンドは `available_commands_update` 経由で通知されます。                                |
| `resumeSession`, `closeSession`                                       | 実装済み | Resume は履歴を再生せずに ACP セッションを既存の Gateway セッションへ再バインドします。Close はアクティブなブリッジ作業をキャンセルし、保留中のプロンプトをキャンセル済みとして解決し、ブリッジセッション状態を解放します。                                              |
| `loadSession`                                                         | 部分対応     | ACP セッションを Gateway セッションキーへ再バインドし、ブリッジが作成したセッションについて ACP イベント台帳履歴を再生します。古いセッションや台帳のないセッションでは、保存済みのユーザー/アシスタントテキストへフォールバックします。                                                             |
| プロンプト内容 (`text`, 埋め込み `resource`, 画像)                  | 部分対応     | テキスト/リソースはチャット入力へ平坦化され、画像は Gateway 添付ファイルになります。                                                                                                                                                                 |
| セッションモード                                                         | 部分対応     | `session/set_mode` がサポートされ、ブリッジは思考レベル、ツールの冗長性、推論、使用量詳細、昇格アクションについて、Gateway をバックエンドに持つ初期セッション制御を公開します。より広範な ACP ネイティブのモード/設定サーフェスは、引き続き対象外です。 |
| セッション情報と使用量更新                                        | 部分対応     | ブリッジはキャッシュされた Gateway セッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を発行します。使用量は概算で、Gateway のトークン合計が最新としてマークされている場合にのみ送信されます。                                        |
| ツールストリーミング                                                        | 部分対応     | `tool_call` / `tool_call_update` イベントには、Gateway ツールの引数/結果が公開している場合、生の I/O、テキスト内容、ベストエフォートのファイル位置が含まれます。埋め込みターミナルやよりリッチな diff ネイティブ出力は、まだ公開されません。                        |
| Exec 承認                                                        | 部分対応     | アクティブな ACP プロンプトターン中の Gateway exec 承認プロンプトは、`session/request_permission` で ACP クライアントへ中継されます。                                                                                                                    |
| セッションごとの MCP サーバー (`mcpServers`)                                | 非対応 | ブリッジモードでは、セッションごとの MCP サーバー要求を拒否します。代わりに OpenClaw gateway またはエージェント側で MCP を設定してください。                                                                                                                                     |
| クライアントファイルシステムメソッド (`fs/read_text_file`, `fs/write_text_file`) | 非対応 | ブリッジは ACP クライアントのファイルシステムメソッドを呼び出しません。                                                                                                                                                                                          |
| クライアントターミナルメソッド (`terminal/*`)                                | 非対応 | ブリッジは ACP クライアントターミナルを作成せず、ツール呼び出しを通じてターミナル ID をストリームしません。                                                                                                                                                       |
| セッション計画 / 思考ストリーミング                                     | 非対応 | ブリッジは現在、出力テキストとツール状態を発行しますが、ACP の計画や思考更新は発行しません。                                                                                                                                                         |

## 既知の制限

- `loadSession` が完全な ACP イベント台帳履歴を再生できるのは、ブリッジが作成したセッションのみです。古いセッションや台帳のないセッションでは、引き続きトランスクリプトフォールバックを使用し、過去のツール呼び出しやシステム通知は再構築しません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有する場合、イベントとキャンセルのルーティングはクライアントごとに厳密に分離されるのではなく、ベストエフォートになります。エディタローカルのターンをきれいに分離する必要がある場合は、デフォルトの分離された `acp:<uuid>` セッションを推奨します。
- Gateway の停止状態は ACP の停止理由へ変換されますが、そのマッピングは完全な ACP ネイティブランタイムほど表現力が高くありません。
- 初期セッション制御は現在、Gateway のノブのうち、思考レベル、ツールの冗長性、推論、使用量詳細、昇格アクションに絞ったサブセットを公開しています。モデル選択と exec ホスト制御は、まだ ACP 設定オプションとして公開されていません。
- `session_info_update` と `usage_update` は、ライブの ACP ネイティブランタイム会計ではなく、Gateway セッションスナップショットから派生します。使用量は概算で、コストデータを持たず、Gateway が合計トークンデータを最新としてマークした場合にのみ発行されます。
- ツール追従データはベストエフォートです。ブリッジは既知のツール引数/結果に現れるファイルパスを表面化できますが、ACP ターミナルや構造化されたファイル diff はまだ発行しません。
- Exec 承認の中継はアクティブな ACP プロンプトターンに限定され、他の Gateway セッションからの承認は無視されます。

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

組み込みの ACP クライアントを使用すると、IDE なしでブリッジを健全性チェックできます。ACP ブリッジを起動し、対話的にプロンプトを入力できます。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル (クライアントデバッグモード):

- 自動承認は許可リストベースで、信頼されたコアツール ID にのみ適用されます。
- `read` の自動承認は現在の作業ディレクトリにスコープされます (`--cwd` が設定されている場合はそれ)。
- ACP は狭い読み取り専用クラスのみを自動承認します。具体的には、アクティブな cwd 配下にスコープされた `read` 呼び出しと、読み取り専用検索ツール (`search`, `web_search`, `memory_search`) です。不明なツール/非コアツール、スコープ外の読み取り、exec 可能なツール、コントロールプレーンツール、変更を行うツール、対話フローでは、常に明示的なプロンプト承認が必要です。
- サーバー提供の `toolCall.kind` は、信頼されないメタデータとして扱われます (認可ソースではありません)。
- この ACP ブリッジポリシーは ACPX ハーネス権限とは別です。`acpx` バックエンド経由で OpenClaw を実行する場合、`plugins.entries.acpx.config.permissionMode=approve-all` はそのハーネスセッション用の緊急時「yolo」スイッチです。

## プロトコルスモークテスト

プロトコルレベルのデバッグでは、分離された状態で Gateway を起動し、ACP JSON-RPC クライアントで stdio 経由の `openclaw acp` を操作します。`initialize`、`session/new`、絶対 `cwd` を指定した `session/list`、`session/resume`、`session/close`、重複 close、存在しない resume をカバーしてください。

証跡には、通知されたライフサイクル機能、Gateway をバックエンドに持つセッション行、更新通知、Gateway の `sessions.list` ログを含める必要があります。

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

唯一の ACP 証跡として `openclaw gateway call sessions.list` を使うことは避けてください。その CLI パスでは fresh-token オペレータースコープのアップグレードを要求する場合があります。ACP ブリッジの正しさは、ACP stdio フレームと Gateway の `sessions.list` ログによって証明されます。

## これの使い方

IDE (または他のクライアント) が Agent Client Protocol を話し、それに OpenClaw Gateway セッションを操作させたい場合に ACP を使用します。

1. Gateway が実行中であることを確認します (ローカルまたはリモート)。
2. Gateway ターゲットを設定します (config またはフラグ)。
3. IDE に、stdio 経由で `openclaw acp` を実行するよう指定します。

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

特定のエージェントを対象にするには、エージェントスコープのセッションキーを使用します。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは単一の Gateway セッションキーに対応付けられます。1 つのエージェントは多数のセッションを持てます。キーまたはラベルを上書きしない限り、ACP は分離された `acp:<uuid>` セッションをデフォルトで使用します。

セッション単位の `mcpServers` はブリッジモードではサポートされません。ACP クライアントが
`newSession` または `loadSession` 中にそれらを送信した場合、ブリッジは暗黙に無視するのではなく、明確な
エラーを返します。

ACPX バックエンドのセッションから OpenClaw Plugin ツールや `cron` などの選択された
組み込みツールを見えるようにしたい場合は、セッション単位の `mcpServers` を渡そうとするのではなく、
Gateway 側の ACPX MCP ブリッジを有効にしてください。詳しくは
[ACP エージェント](/ja-JP/tools/acp-agents-setup#plugin-tools-mcp-bridge) と
[OpenClaw ツール MCP ブリッジ](/ja-JP/tools/acp-agents-setup#openclaw-tools-mcp-bridge) を参照してください。

## `acpx` から使う（Codex、Claude、その他の ACP クライアント）

Codex や Claude Code などのコーディングエージェントから ACP 経由で自分の
OpenClaw ボットと通信したい場合は、組み込みの `openclaw` ターゲットを持つ `acpx` を使用します。

典型的な流れ:

1. Gateway を実行し、ACP ブリッジが到達できることを確認します。
2. `acpx openclaw` の接続先を `openclaw acp` に向けます。
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

`acpx openclaw` が毎回特定の Gateway とセッションキーを対象にするようにしたい場合は、
`~/.acpx/config.json` で `openclaw` エージェントコマンドを上書きします:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルの OpenClaw チェックアウトでは、ACP ストリームをクリーンに保つために
開発ランナーではなく直接の CLI エントリポイントを使用します。例:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または別の ACP 対応クライアントに、ターミナルをスクレイピングせずに
OpenClaw エージェントからコンテキスト情報を取得させる最も簡単な方法です。

## Zed エディターの設定

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

Zed でエージェントパネルを開き、「OpenClaw ACP」を選択してスレッドを開始します。

## セッションのマッピング

デフォルトでは、ACP セッションには `acp:` プレフィックス付きの分離された Gateway セッションキーが割り当てられます。
既知のセッションを再利用するには、セッションキーまたはラベルを渡します:

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

- `--url <url>`: Gateway WebSocket URL（設定されている場合は gateway.remote.url がデフォルト）。
- `--token <token>`: Gateway 認証トークン。
- `--token-file <path>`: Gateway 認証トークンをファイルから読み取ります。
- `--password <password>`: Gateway 認証パスワード。
- `--password-file <path>`: Gateway 認証パスワードをファイルから読み取ります。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッションラベル。
- `--require-existing`: セッションキーまたはラベルが存在しない場合に失敗します。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトに作業ディレクトリをプレフィックスとして付けません。
- `--provenance <off|meta|meta+receipt>`: ACP の来歴メタデータまたはレシートを含めます。
- `--verbose, -v`: stderr への詳細ログ。

セキュリティ上の注意:

- `--token` と `--password` は、一部のシステムではローカルプロセス一覧に表示される可能性があります。
- `--token-file`/`--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）を優先してください。
- Gateway 認証解決は、他の Gateway クライアントで使用される共有契約に従います:
  - ローカルモード: env（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> `gateway.remote.*` フォールバックは `gateway.auth.*` が未設定の場合のみ（設定済みだが解決できないローカル SecretRefs は fail closed）
  - リモートモード: リモートの優先順位ルールに従い、env/config フォールバック付きの `gateway.remote.*`
  - `--url` は上書きしても安全で、暗黙の config/env 認証情報を再利用しません。明示的な `--token`/`--password`（またはファイル形式）を渡してください
- ACP ランタイムバックエンドの子プロセスは `OPENCLAW_SHELL=acp` を受け取り、これはコンテキスト固有のシェルまたはプロファイルルールに使用できます。
- `openclaw acp client` は、起動されたブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` オプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド（デフォルト: `openclaw`）。
- `--server-args <args...>`: ACP サーバーに渡される追加引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: 詳細なクライアントログ。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ACP エージェント](/ja-JP/tools/acp-agents)

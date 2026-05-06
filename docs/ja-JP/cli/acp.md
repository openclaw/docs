---
read_when:
    - ACPベースのIDE連携の設定
    - ACP セッションの Gateway へのルーティングのデバッグ
summary: IDE 連携用の ACP ブリッジを実行する
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:02:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行し、OpenClaw Gateway と通信します。

このコマンドは IDE 向けに stdio 経由で ACP を話し、プロンプトを WebSocket
経由で Gateway に転送します。ACP セッションを Gateway セッションキーに対応付けて維持します。

`openclaw acp` は Gateway バックエンドの ACP ブリッジであり、完全な ACP ネイティブのエディター
ランタイムではありません。セッションルーティング、プロンプト配信、基本的なストリーミング
更新に重点を置いています。

ACP ハーネスセッションをホストするのではなく、外部 MCP クライアントから OpenClaw チャンネルの
会話に直接接続したい場合は、代わりに
[`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。

## これは何ではないか

このページは ACP ハーネスセッションと混同されることがよくあります。

`openclaw acp` の意味:

- OpenClaw が ACP サーバーとして動作する
- IDE または ACP クライアントが OpenClaw に接続する
- OpenClaw がその作業を Gateway セッションに転送する

これは [ACP Agents](/ja-JP/tools/acp-agents) とは異なります。ACP Agents では、OpenClaw が
`acpx` 経由で Codex や Claude Code などの外部ハーネスを実行します。

簡単なルール:

- エディター/クライアントが ACP で OpenClaw と通信したい場合: `openclaw acp` を使用する
- OpenClaw が Codex/Claude/Gemini を ACP ハーネスとして起動する必要がある場合: `/acp spawn` と [ACP Agents](/ja-JP/tools/acp-agents) を使用する

## 互換性マトリクス

| ACP 領域                                                              | 状態      | 注記                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 実装済み | Gateway chat/send + abort への stdio 経由のコアブリッジフロー。                                                                                                                                                                                        |
| `listSessions`, スラッシュコマンド                                        | 実装済み | セッション一覧は Gateway セッション状態に対して動作します。コマンドは `available_commands_update` 経由で通知されます。                                                                                                                                       |
| `loadSession`                                                         | 部分対応     | ACP セッションを Gateway セッションキーに再バインドし、保存済みのユーザー/アシスタントのテキスト履歴を再生します。ツール/システム履歴はまだ再構築されません。                                                                                                   |
| プロンプトコンテンツ (`text`, 埋め込み `resource`, 画像)                  | 部分対応     | テキスト/リソースはチャット入力にフラット化されます。画像は Gateway 添付ファイルになります。                                                                                                                                                                 |
| セッションモード                                                         | 部分対応     | `session/set_mode` がサポートされ、ブリッジは思考レベル、ツール詳細度、推論、使用量詳細、昇格アクション向けの初期 Gateway バックエンドセッションコントロールを公開します。より広範な ACP ネイティブのモード/設定サーフェスはまだ対象外です。 |
| セッション情報と使用量更新                                        | 部分対応     | ブリッジは、キャッシュ済み Gateway セッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を送信します。使用量は概算で、Gateway のトークン合計が最新としてマークされている場合にのみ送信されます。                                        |
| ツールストリーミング                                                        | 部分対応     | `tool_call` / `tool_call_update` イベントには、Gateway ツールの引数/結果が公開している場合、raw I/O、テキストコンテンツ、ベストエフォートのファイル位置が含まれます。埋め込みターミナルや、よりリッチな diff ネイティブ出力はまだ公開されません。                        |
| セッションごとの MCP サーバー (`mcpServers`)                                | 非対応 | ブリッジモードは、セッションごとの MCP サーバー要求を拒否します。代わりに OpenClaw Gateway またはエージェントで MCP を設定してください。                                                                                                                                     |
| クライアントファイルシステムメソッド (`fs/read_text_file`, `fs/write_text_file`) | 非対応 | ブリッジは ACP クライアントのファイルシステムメソッドを呼び出しません。                                                                                                                                                                                          |
| クライアントターミナルメソッド (`terminal/*`)                                | 非対応 | ブリッジは ACP クライアントターミナルを作成せず、ツール呼び出しを通じてターミナル ID をストリーミングしません。                                                                                                                                                       |
| セッション計画 / 思考ストリーミング                                     | 非対応 | ブリッジは現在、ACP 計画や思考更新ではなく、出力テキストとツール状態を送信します。                                                                                                                                                         |

## 既知の制限

- `loadSession` は保存済みのユーザーとアシスタントのテキスト履歴を再生しますが、過去のツール呼び出し、システム通知、またはよりリッチな ACP ネイティブイベント
  タイプは再構築しません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有する場合、イベントとキャンセルの
  ルーティングはクライアントごとに厳密に分離されるのではなく、ベストエフォートになります。クリーンなエディター ローカル
  ターンが必要な場合は、デフォルトの分離された `acp:<uuid>` セッションを使用してください。
- Gateway の停止状態は ACP 停止理由に変換されますが、そのマッピングは
  完全な ACP ネイティブランタイムほど表現力がありません。
- 初期セッションコントロールは現在、Gateway ノブの限定的なサブセットを公開します:
  思考レベル、ツール詳細度、推論、使用量詳細、昇格
  アクション。モデル選択と exec-host コントロールはまだ ACP
  設定オプションとして公開されていません。
- `session_info_update` と `usage_update` は、ライブの ACP ネイティブランタイムの会計処理ではなく、Gateway セッション
  スナップショットから導出されます。使用量は概算で、
  コストデータは含まず、Gateway が合計トークン
  データを最新としてマークした場合にのみ送信されます。
- ツール追従データはベストエフォートです。ブリッジは既知のツール引数/結果に
  現れるファイルパスを表示できますが、ACP ターミナルや
  構造化されたファイル diff はまだ送信しません。

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

IDE なしでブリッジを健全性チェックするには、組み込み ACP クライアントを使用します。
これは ACP ブリッジを起動し、対話的にプロンプトを入力できるようにします。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル (クライアントデバッグモード):

- 自動承認は allowlist ベースで、信頼されたコアツール ID にのみ適用されます。
- `read` の自動承認は、現在の作業ディレクトリ (`--cwd` が設定されている場合はそれ) にスコープされます。
- ACP は狭い読み取り専用クラスのみを自動承認します。具体的には、アクティブな cwd 配下のスコープ付き `read` 呼び出しと、読み取り専用検索ツール (`search`, `web_search`, `memory_search`) です。不明/非コアツール、スコープ外の読み取り、exec 可能なツール、コントロールプレーンツール、変更を行うツール、対話フローは常に明示的なプロンプト承認を必要とします。
- サーバー提供の `toolCall.kind` は、信頼できないメタデータとして扱われます (認可ソースではありません)。
- この ACP ブリッジポリシーは ACPX ハーネス権限とは別です。`acpx` バックエンド経由で OpenClaw を実行する場合、そのハーネスセッション向けの非常用「yolo」スイッチは `plugins.entries.acpx.config.permissionMode=approve-all` です。

## 使い方

IDE (またはその他のクライアント) が Agent Client Protocol を話し、それによって
OpenClaw Gateway セッションを駆動したい場合に ACP を使用します。

1. Gateway が実行中であることを確認します (ローカルまたはリモート)。
2. Gateway ターゲットを設定します (設定またはフラグ)。
3. IDE に stdio 経由で `openclaw acp` を実行させます。

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

各 ACP セッションは単一の Gateway セッションキーに対応します。1 つのエージェントは複数の
セッションを持てます。キーまたはラベルを上書きしない限り、ACP は分離された `acp:<uuid>` セッションをデフォルトで使用します。

セッションごとの `mcpServers` はブリッジモードではサポートされません。ACP クライアントが
`newSession` または `loadSession` 中にそれらを送信した場合、ブリッジは黙って無視するのではなく、明確な
エラーを返します。

ACPX バックエンドのセッションから OpenClaw Plugin ツールや `cron` などの選択された
組み込みツールを見えるようにしたい場合は、セッションごとの `mcpServers` を渡そうとするのではなく、
Gateway 側の ACPX MCP ブリッジを有効にしてください。以下を参照してください:
[ACP Agents](/ja-JP/tools/acp-agents-setup#plugin-tools-mcp-bridge) と
[OpenClaw ツール MCP ブリッジ](/ja-JP/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## `acpx` から使用する (Codex、Claude、その他の ACP クライアント)

Codex や Claude Code などのコーディングエージェントに ACP 経由で
OpenClaw ボットと通信させたい場合は、組み込みの `openclaw` ターゲットを持つ `acpx` を使用します。

典型的なフロー:

1. Gateway を実行し、ACP ブリッジが到達できることを確認します。
2. `acpx openclaw` を `openclaw acp` に向けます。
3. コーディングエージェントに使わせたい OpenClaw セッションキーを対象にします。

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
`~/.acpx/config.json` 内の `openclaw` エージェントコマンドを上書きします。

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
dev runner ではなく直接 CLI エントリーポイントを使用します。例:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または別の ACP 対応クライアントに、ターミナルをスクレイピングせずに
OpenClaw エージェントからコンテキスト情報を取得させる最も簡単な方法です。

## Zed エディターのセットアップ

`~/.config/zed/settings.json` にカスタム ACP エージェントを追加します (または Zed の設定 UI を使用します):

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

## セッションのマッピング

デフォルトでは、ACP セッションには `acp:` プレフィックス付きの分離された Gateway セッションキーが割り当てられます。
既知のセッションを再利用するには、セッションキーまたはラベルを渡します:

- `--session <key>`: 特定の Gateway セッションキーを使用します。
- `--session-label <label>`: ラベルで既存のセッションを解決します。
- `--reset-session`: そのキーの新しいセッション ID を発行します（同じキー、新しいトランスクリプト）。

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

- `--url <url>`: Gateway WebSocket URL（構成されている場合は gateway.remote.url がデフォルト）。
- `--token <token>`: Gateway 認証トークン。
- `--token-file <path>`: ファイルから Gateway 認証トークンを読み取ります。
- `--password <password>`: Gateway 認証パスワード。
- `--password-file <path>`: ファイルから Gateway 認証パスワードを読み取ります。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッションラベル。
- `--require-existing`: セッションキー/ラベルが存在しない場合に失敗します。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトに作業ディレクトリのプレフィックスを付けません。
- `--provenance <off|meta|meta+receipt>`: ACP 来歴メタデータまたは受領証を含めます。
- `--verbose, -v`: stderr への詳細ログ出力。

セキュリティ上の注意:

- `--token` と `--password` は、一部のシステムではローカルプロセス一覧に表示される場合があります。
- `--token-file`/`--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`）を優先してください。
- Gateway 認証の解決は、他の Gateway クライアントで使用される共有コントラクトに従います:
  - ローカルモード: env（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> `gateway.auth.*` が未設定の場合のみ `gateway.remote.*` にフォールバック（構成済みだが解決不能なローカル SecretRefs は fail closed）
  - リモートモード: リモートの優先順位ルールに従い、env/config フォールバック付きの `gateway.remote.*`
  - `--url` は安全に上書きでき、暗黙の config/env 認証情報を再利用しません。明示的な `--token`/`--password`（またはファイル版）を渡してください
- ACP ランタイムバックエンドの子プロセスは `OPENCLAW_SHELL=acp` を受け取り、コンテキスト固有のシェル/プロファイルルールに使用できます。
- `openclaw acp client` は、生成されたブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` オプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド（デフォルト: `openclaw`）。
- `--server-args <args...>`: ACP サーバーに渡される追加引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: 詳細なクライアントログ出力。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ACP エージェント](/ja-JP/tools/acp-agents)

---
read_when:
    - ACP ベースの IDE 統合を設定する
    - Gateway への ACP セッションルーティングのデバッグ
summary: IDE 連携用の ACP ブリッジを実行する
title: ACP
x-i18n:
    generated_at: "2026-07-11T22:01:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行し、OpenClaw Gateway と通信します。

`openclaw acp` は IDE 向けに標準入出力を介して ACP を提供し、プロンプトを WebSocket 経由で Gateway に転送します。その際、ACP セッションと Gateway セッションキーの対応関係を維持します。これは Gateway をバックエンドとする ACP ブリッジであり、完全な ACP ネイティブのエディターランタイムではありません。セッションのルーティング、プロンプトの配信、更新のストリーミングに重点を置いています。

外部 MCP クライアントから ACP ハーネスセッションをホストするのではなく、OpenClaw のチャンネル会話と直接通信したい場合は、代わりに [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。

## これは何ではないか

`openclaw acp` では、OpenClaw が ACP サーバーとして動作します。IDE または ACP クライアントが OpenClaw に接続し、OpenClaw がその処理を Gateway セッションへ転送します。

これは [ACP エージェント](/ja-JP/tools/acp-agents) とは異なります。ACP エージェントでは、OpenClaw が `acpx` を通じて Codex や Claude Code などの外部ハーネスを実行します。

簡単な判断基準：

- エディター／クライアントから ACP で OpenClaw と通信したい場合：`openclaw acp` を使用
- OpenClaw から Codex／Claude／Gemini を ACP ハーネスとして起動したい場合：`/acp spawn` と [ACP エージェント](/ja-JP/tools/acp-agents) を使用

## 互換性マトリクス

| ACP の領域                                                            | 状態       | 注記                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 実装済み   | 標準入出力から Gateway のチャット／送信および中止までを扱う、ブリッジの中核フローです。                                                                                                                                                 |
| `listSessions`、スラッシュコマンド                                    | 実装済み   | セッション一覧は Gateway のセッション状態を対象に動作し、上限付きカーソルページネーションを使用します。Gateway のセッション行にワークスペースメタデータが含まれる場合は `cwd` フィルタリングにも対応します。コマンドは `available_commands_update` を介して通知されます。 |
| セッション系譜メタデータ                                              | 実装済み   | セッション一覧とセッション情報のスナップショットには、OpenClaw の親子系譜が `_meta` に含まれます。これにより、ACP クライアントは Gateway の非公開サイドチャンネルを使わずにサブエージェントのグラフを描画できます。                         |
| `resumeSession`, `closeSession`                                       | 実装済み   | 再開では、履歴を再生せずに ACP セッションを既存の Gateway セッションへ再関連付けします。終了では、進行中のブリッジ処理を中止し、保留中のプロンプトをキャンセル済みとして解決し、ブリッジのセッション状態を解放します。                     |
| `loadSession`                                                         | 部分対応   | ACP セッションを Gateway セッションキーへ再関連付けし、ブリッジで作成されたセッションについて ACP イベント台帳の履歴を再生します。古いセッションや台帳のないセッションでは、保存済みのユーザー／アシスタントテキストにフォールバックします。 |
| プロンプト内容（`text`、埋め込み `resource`、画像）                   | 部分対応   | テキスト／リソースはチャット入力へ平坦化され、画像は Gateway の添付ファイルになります。                                                                                                                                                |
| セッションモード                                                      | 部分対応   | `session/set_mode` に対応しています。ブリッジは、思考レベル、ツールの詳細度、推論、使用量の詳細、昇格操作について、Gateway をバックエンドとするセッション制御を公開します。より広範な ACP ネイティブのモード／設定領域は引き続き対象外です。 |
| 思考のストリーミング                                                  | 実装済み   | モデルの思考内容は、`agent_thought_chunk` セッション更新としてストリーミングされます。ACP ネイティブのセッション計画は出力されません。                                                                                                  |
| セッション情報と使用量の更新                                          | 部分対応   | ブリッジは、キャッシュされた Gateway セッションのスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を送信します。使用量は概算であり、Gateway のトークン合計が最新とマークされている場合にのみ送信されます。 |
| ツールのストリーミング                                                | 部分対応   | `tool_call`／`tool_call_update` イベントには、生の入出力、テキスト内容、および Gateway のツール引数／結果から取得できる場合はベストエフォートのファイル位置が含まれます。埋め込みターミナルや、より高度な差分ネイティブ出力は公開されません。 |
| 実行の承認                                                            | 部分対応   | アクティブな ACP プロンプト処理中に発生した Gateway の実行承認要求は、`session/request_permission` を使用して ACP クライアントへ中継されます。                                                                                           |
| セッション単位の MCP サーバー（`mcpServers`）                         | 非対応     | ブリッジモードでは、セッション単位の MCP サーバー要求を拒否します。代わりに OpenClaw Gateway またはエージェント側で MCP を設定してください。                                                                                           |
| クライアントのファイルシステムメソッド（`fs/read_text_file`, `fs/write_text_file`） | 非対応     | ブリッジは ACP クライアントのファイルシステムメソッドを呼び出しません。                                                                                                                                                                |
| クライアントのターミナルメソッド（`terminal/*`）                     | 非対応     | ブリッジは ACP クライアントのターミナルを作成せず、ツール呼び出しを通じてターミナル ID をストリーミングすることもありません。                                                                                                          |

## 既知の制限事項

- `loadSession` が ACP イベント台帳の完全な履歴を再生できるのは、ブリッジで作成されたセッションのみです。古いセッションや台帳のないセッションではトランスクリプトへのフォールバックを使用し、過去のツール呼び出しやシステム通知は再構築されません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有している場合、イベントとキャンセルのルーティングはクライアントごとに厳密に分離されず、ベストエフォートとなります。エディターごとに処理を明確に分離する必要がある場合は、デフォルトの分離された `acp-bridge:<uuid>` セッションを使用してください。
- Gateway の停止状態は ACP の停止理由に変換されますが、この対応付けは完全な ACP ネイティブランタイムほど表現力がありません。
- セッション制御で公開される Gateway の調整項目は、思考レベル、ツールの詳細度、推論、使用量の詳細、昇格操作に限定されています。モデル選択と実行ホストの制御は、ACP 設定オプションとして公開されません。
- `session_info_update` と `usage_update` は、ACP ネイティブランタイムのリアルタイムな計測ではなく、Gateway セッションのスナップショットから生成されます。使用量は概算で、コスト情報を含まず、Gateway がトークン合計データを最新とマークした場合にのみ送信されます。
- ツール追従データはベストエフォートです。ブリッジは既知のツール引数／結果に現れるファイルパスを公開しますが、ACP ターミナルや構造化されたファイル差分は出力しません。
- 実行承認の中継は、アクティブな ACP プロンプト処理に限定されます。他の Gateway セッションからの承認は無視されます。

## 使用方法

```bash
openclaw acp

# リモート Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# リモート Gateway（ファイルからトークンを取得）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 既存のセッションキーへ接続
openclaw acp --session agent:main:main

# ラベルで接続（既に存在している必要があります）
openclaw acp --session-label "support inbox"

# 最初のプロンプトの前にセッションキーをリセット
openclaw acp --session agent:main:main --reset-session
```

## ACP クライアント（デバッグ）

IDE を使用せずにブリッジの基本動作を確認するには、組み込みの ACP クライアントを使用します。このクライアントは ACP ブリッジを起動し、対話形式でプロンプトを入力できます。

```bash
openclaw acp client

# 起動したブリッジをリモート Gateway に接続
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# サーバーコマンドを上書き（デフォルト：openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル（クライアントのデバッグモード）：

- 自動承認は許可リストに基づき、信頼されたコアツール ID にのみ適用されます。
- `read` の自動承認は、現在の作業ディレクトリ（指定されている場合は `--cwd`）の範囲内に限定されます。
- ACP が自動承認するのは、限定された読み取り専用クラスだけです。具体的には、アクティブな cwd 配下に限定された `read` 呼び出しと、読み取り専用の検索ツール（`search`、`web_search`、`memory_search`）です。不明なツールやコア以外のツール、範囲外の読み取り、実行可能なツール、制御プレーンのツール、変更を伴うツール、対話型フローでは、常にプロンプトによる明示的な承認が必要です。
- サーバーが提供する `toolCall.kind` は、認可の根拠ではなく、信頼できないメタデータとして扱われます。
- この ACP ブリッジのポリシーは、ACPX ハーネスの権限とは別です。`acpx` バックエンドを通じて OpenClaw を実行する場合、`plugins.entries.acpx.config.permissionMode=approve-all` は、そのハーネスセッション用の緊急時「yolo」スイッチです。

## プロトコルのスモークテスト

プロトコルレベルでデバッグするには、分離された状態で Gateway を起動し、ACP JSON-RPC クライアントから標準入出力経由で `openclaw acp` を操作します。`initialize`、`session/new`、絶対パスの `cwd` を指定した `session/list`、`session/resume`、`session/close`、重複した終了、存在しないセッションの再開を対象にします。

検証結果には、通知されたライフサイクル機能、Gateway をバックエンドとするセッション行、更新通知、および Gateway の `sessions.list` ログを含める必要があります。

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

ACP の検証として `openclaw gateway call sessions.list` だけを使用することは避けてください。この CLI 経路では、最新トークンによるオペレータースコープの昇格が要求される場合があります。ACP ブリッジの正しさは、ACP の標準入出力フレームと Gateway の `sessions.list` ログによって検証されます。

## 使用手順

IDE（またはその他のクライアント）が Agent Client Protocol に対応していて、そこから OpenClaw Gateway セッションを操作したい場合は、ACP を使用します。

1. Gateway が稼働していることを確認します（ローカルまたはリモート）。
2. Gateway の接続先を設定します（設定またはフラグ）。
3. IDE から標準入出力経由で `openclaw acp` を実行するように設定します。

設定例（永続化）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行の例（設定を書き込まない）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# ローカルプロセスの安全性のために推奨
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## エージェントの選択

ACP はエージェントを直接選択しません。Gateway セッションキーに基づいてルーティングします。特定のエージェントを対象にするには、エージェントスコープのセッションキーを使用します。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは、単一の Gateway セッションキーに対応します。1 つのエージェントは複数のセッションを持つことができます。キーまたはラベルを上書きしない限り、ACP はデフォルトで分離された `acp-bridge:<uuid>` セッションを使用します。

ブリッジモードでは、セッションごとの `mcpServers` はサポートされません。ACP クライアントが `newSession` または `loadSession` の際にこれらを送信した場合、ブリッジは黙って無視せず、明確なエラーを返します。

ACPX ベースのセッションから OpenClaw Plugin ツールや `cron` などの一部の組み込みツールを利用できるようにするには、セッションごとの `mcpServers` を渡そうとするのではなく、Gateway 側の ACPX MCP ブリッジを有効にしてください。[ACP エージェント](/ja-JP/tools/acp-agents-setup#plugin-tools-mcp-bridge)および[OpenClaw ツールの MCP ブリッジ](/ja-JP/tools/acp-agents-setup#openclaw-tools-mcp-bridge)を参照してください。

## `acpx` から使用する（Codex、Claude、その他の ACP クライアント）

Codex や Claude Code などのコーディングエージェントから ACP 経由で OpenClaw ボットと通信するには、組み込みの `openclaw` ターゲットを指定して `acpx` を使用します。

一般的な手順：

1. Gateway を実行し、ACP ブリッジから到達できることを確認します。
2. `acpx openclaw` の接続先を `openclaw acp` にします。
3. コーディングエージェントに使用させる OpenClaw セッションキーを指定します。

例：

```bash
# デフォルトの OpenClaw ACP セッションへの単発リクエスト
acpx openclaw exec "Summarize the active OpenClaw session state."

# 後続ターンに使用する永続的な名前付きセッション
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw` で常に特定の Gateway とセッションキーを指定するには、`~/.acpx/config.json` で `openclaw` エージェントコマンドを上書きします。

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルの OpenClaw チェックアウトでは、ACP ストリームをクリーンに保つため、開発用ランナーではなく CLI の直接エントリポイントを使用します。

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、またはその他の ACP 対応クライアントから、ターミナルをスクレイピングせずに OpenClaw エージェントのコンテキスト情報を取得する最も簡単な方法です。

## Zed エディターの設定

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

特定の Gateway またはエージェントを指定する場合：

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

デフォルトでは、ACP ブリッジセッションには `acp-bridge:` プレフィックスを持つ、分離された Gateway セッションキーが割り当てられます。これらの通常モデル用ブリッジセッションは合成された一時的なものであり、古いエントリの削除対象となり、保護対象の人間との会話サーフェスとしては扱われません。既知のセッションを再利用するには、セッションキーまたはラベルを渡します。

- `--session <key>`：特定の Gateway セッションキーを使用します。
- `--session-label <label>`：ラベルで既存のセッションを解決します。
- `--reset-session`：そのキーに対して新しいセッション ID を発行します（キーは同じで、トランスクリプトは新規）。

ACP クライアントがメタデータをサポートしている場合、セッションごとに上書きできます。

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

セッションキーについて詳しくは、[/concepts/session](/ja-JP/concepts/session)を参照してください。

## オプション

- `--url <url>`：Gateway WebSocket URL（設定されている場合、デフォルトは `gateway.remote.url`）。
- `--token <token>`：Gateway 認証トークン。
- `--token-file <path>`：ファイルから Gateway 認証トークンを読み取ります。
- `--password <password>`：Gateway 認証パスワード。
- `--password-file <path>`：ファイルから Gateway 認証パスワードを読み取ります。
- `--session <key>`：デフォルトのセッションキー。
- `--session-label <label>`：解決するデフォルトのセッションラベル。
- `--require-existing`：セッションキーまたはラベルが存在しない場合は失敗します。
- `--reset-session`：初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`：プロンプトの先頭に作業ディレクトリを付けません。
- `--provenance <off|meta|meta+receipt>`：ACP の来歴メタデータまたは受領情報を含めます。
- `--verbose, -v`：詳細ログを stderr に出力します。

セキュリティ上の注意：

- 一部のシステムでは、`--token` と `--password` がローカルのプロセス一覧に表示される可能性があります。`--token-file`/`--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）を使用してください。
- Gateway の認証解決は、他の Gateway クライアントで使用される共通契約に従います。
  - ローカルモード：環境変数（`OPENCLAW_GATEWAY_*`）、次に `gateway.auth.*` の順で使用し、`gateway.auth.*` が未設定の場合に限り `gateway.remote.*` にフォールバックします（設定済みだが解決できないローカルの SecretRef は、黙ってフォールバックせず、フェイルクローズします）
  - リモートモード：リモートの優先順位ルールに従って環境変数または設定にフォールバックしつつ、`gateway.remote.*` を使用します
  - `--url` は安全に上書きでき、暗黙の設定や環境変数の認証情報を再利用しません。明示的に `--token`/`--password`（またはファイル指定のバリアント）を渡してください

### `acp client` のオプション

- `--cwd <dir>`：ACP セッションの作業ディレクトリ。
- `--server <command>`：ACP サーバーコマンド（デフォルト：`openclaw`）。
- `--server-args <args...>`：ACP サーバーに渡す追加引数。
- `--server-verbose`：ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`：クライアントの詳細ログ。
- `openclaw acp client` は、起動したブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。これは、コンテキスト固有のシェルまたはプロファイルルールに使用できます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [ACP エージェント](/ja-JP/tools/acp-agents)

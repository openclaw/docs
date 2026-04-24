---
read_when:
    - ACPベースのIDE連携をセットアップする
    - GatewayへのACPセッションルーティングをデバッグする
summary: IDE連携のためにACPブリッジを実行する
title: ACP
x-i18n:
    generated_at: "2026-04-24T04:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

OpenClaw Gatewayと通信する[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)ブリッジを実行します。

このコマンドは、IDE向けにstdio上でACPを話し、WebSocket経由でプロンプトをGatewayへ転送します。
ACPセッションはGatewayセッションキーにマッピングされたまま維持されます。

`openclaw acp` はGatewayをバックエンドにしたACPブリッジであり、完全なACPネイティブのエディター
ランタイムではありません。セッションルーティング、プロンプト配信、基本的なStreaming更新に
重点を置いています。

外部MCPクライアントからACPハーネスセッションをホストするのではなく、OpenClawのチャンネル会話に
直接接続したい場合は、
[`openclaw mcp serve`](/ja-JP/cli/mcp) を使ってください。

## これは何ではないか

このページはACPハーネスセッションと混同されがちです。

`openclaw acp` の意味:

- OpenClawがACPサーバーとして動作する
- IDEまたはACPクライアントがOpenClawに接続する
- OpenClawがその処理をGatewayセッションへ転送する

これは [ACP Agents](/ja-JP/tools/acp-agents) とは異なります。そちらではOpenClawが
`acpx` を通じてCodexやClaude Codeのような外部ハーネスを実行します。

簡単なルール:

- エディター/クライアントがACPでOpenClawと話したい: `openclaw acp` を使う
- OpenClawがCodex/Claude/GeminiをACPハーネスとして起動すべき: `/acp spawn` と [ACP Agents](/ja-JP/tools/acp-agents) を使う

## 互換性マトリクス

| ACP area                                                              | ステータス | 注記                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 実装済み   | stdioからGatewayのchat/send + abortへのコアブリッジフローです。                                                                                                                                                                                  |
| `listSessions`, スラッシュコマンド                                    | 実装済み   | セッション一覧はGatewayのセッション状態に対して動作し、コマンドは `available_commands_update` を通じて通知されます。                                                                                                                           |
| `loadSession`                                                         | 一部対応   | ACPセッションをGatewayセッションキーに再バインドし、保存済みのユーザー/アシスタントのテキスト履歴を再生します。ツール/システム履歴はまだ再構築されません。                                                                                     |
| プロンプト内容（`text`、埋め込み `resource`、画像）                  | 一部対応   | テキスト/リソースはchat入力にフラット化され、画像はGateway添付ファイルになります。                                                                                                                                                              |
| セッションモード                                                      | 一部対応   | `session/set_mode` はサポートされており、ブリッジはthought level、tool verbosity、reasoning、usage detail、elevated actions向けの初期Gatewayバックドセッション制御を公開します。より広範なACPネイティブのmode/configサーフェスはまだ対象外です。 |
| セッション情報とusage更新                                             | 一部対応   | ブリッジはキャッシュされたGatewayセッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を出します。usageは概算で、Gatewayのtoken合計がfreshとしてマークされているときだけ送信されます。                 |
| ツールStreaming                                                       | 一部対応   | `tool_call` / `tool_call_update` イベントには、生のI/O、テキスト内容、およびGatewayツール引数/結果が公開する場合のベストエフォートのファイル位置が含まれます。埋め込みterminalやよりリッチなdiffネイティブ出力はまだ公開されません。          |
| セッションごとのMCPサーバー（`mcpServers`）                           | 未対応     | ブリッジモードではセッション単位のMCPサーバー要求を拒否します。代わりにOpenClaw Gatewayまたはagent側でMCPを設定してください。                                                                                                                  |
| クライアントfilesystemメソッド（`fs/read_text_file`, `fs/write_text_file`） | 未対応     | ブリッジはACPクライアントのfilesystemメソッドを呼び出しません。                                                                                                                                                                                  |
| クライアントterminalメソッド（`terminal/*`）                          | 未対応     | ブリッジはACPクライアントterminalを作成せず、tool call経由でterminal idもStreamingしません。                                                                                                                                                    |
| セッションplan / thought streaming                                    | 未対応     | ブリッジは現在、出力テキストとツール状態を出力しますが、ACPのplanやthought更新は出しません。                                                                                                                                                    |

## 既知の制限

- `loadSession` は保存済みのユーザーおよびアシスタントのテキスト履歴を再生しますが、
  過去のツール呼び出し、システム通知、またはよりリッチなACPネイティブイベント種別は
  再構築しません。
- 複数のACPクライアントが同じGatewayセッションキーを共有する場合、イベントとcancelの
  ルーティングはクライアントごとに厳密に分離されるのではなく、ベストエフォートです。エディターごとに
  クリーンなturnが必要な場合は、デフォルトの分離された `acp:<uuid>` セッションを推奨します。
- Gatewayのstop状態はACPのstop reasonに変換されますが、そのマッピングは
  完全なACPネイティブランタイムほど表現力豊かではありません。
- 初期セッション制御は現在、Gatewayノブのうち絞られたサブセットのみを公開します:
  thought level、tool verbosity、reasoning、usage detail、elevated
  actions。model選択とexec-host制御はまだACP
  configオプションとして公開されていません。
- `session_info_update` と `usage_update` はGatewayセッション
  スナップショットから導出されるものであり、ライブなACPネイティブランタイム会計ではありません。usageは概算で、
  コストデータは含まず、Gatewayが合計token
  データをfreshとしてマークしたときだけ送出されます。
- ツールの追従データはベストエフォートです。ブリッジは既知のツール引数/結果に現れるファイルパスを
  表示できますが、ACP terminalや
  構造化されたファイルdiffはまだ出力しません。

## 使用方法

```bash
openclaw acp

# リモートGateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# リモートGateway（ファイルからtokenを読む）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 既存のセッションキーに接続
openclaw acp --session agent:main:main

# ラベルで接続（事前に存在している必要があります）
openclaw acp --session-label "support inbox"

# 最初のプロンプトの前にセッションキーをリセット
openclaw acp --session agent:main:main --reset-session
```

## ACPクライアント（デバッグ）

IDEなしでブリッジを簡易確認するには、組み込みのACPクライアントを使ってください。
ACPブリッジを起動し、対話的にプロンプトを入力できます。

```bash
openclaw acp client

# 起動されるブリッジをリモートGatewayに向ける
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# サーバーコマンドを上書き（デフォルト: openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル（クライアントデバッグモード）:

- 自動承認は許可リストベースで、信頼されたコアツールIDにのみ適用されます。
- `read` の自動承認は現在の作業ディレクトリに限定されます（`--cwd` 設定時）。
- ACPが自動承認するのは、アクティブなcwd配下の限定的な `read` 呼び出しと、読み取り専用の検索ツール（`search`、`web_search`、`memory_search`）だけです。未知/非コアツール、範囲外の読み取り、exec可能ツール、control-planeツール、変更系ツール、インタラクティブフローは常に明示的なプロンプト承認が必要です。
- サーバー提供の `toolCall.kind` は信頼されていないメタデータとして扱われます（認可の根拠にはなりません）。
- このACPブリッジポリシーはACPXハーネス権限とは別です。`acpx` バックエンド経由でOpenClawを実行する場合、`plugins.entries.acpx.config.permissionMode=approve-all` がそのハーネスセッションの緊急用「yolo」スイッチです。

## これの使いどころ

IDE（または他のクライアント）がAgent Client Protocolを話し、
OpenClaw Gatewayセッションを操作させたい場合にACPを使います。

1. Gatewayが動作していることを確認します（ローカルまたはリモート）。
2. Gatewayの接続先を設定します（configまたはフラグ）。
3. IDEがstdio経由で `openclaw acp` を実行するよう設定します。

設定例（永続化）:

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行の例（configを書き込まない）:

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# ローカルプロセス安全性のため推奨
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## agentの選択

ACPはagentを直接選択しません。Gatewayセッションキーによってルーティングします。

特定のagentを対象にするには、agentスコープのセッションキーを使います。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各ACPセッションは単一のGatewayセッションキーにマッピングされます。1つのagentに複数の
セッションを持たせることができ、ACPはキーまたはラベルを上書きしない限り、
デフォルトで分離された `acp:<uuid>` セッションを使用します。

ブリッジモードではセッションごとの `mcpServers` はサポートされません。ACPクライアントが
`newSession` または `loadSession` 中にそれらを送ると、ブリッジは黙って無視せず、
明確なエラーを返します。

ACPXバックエンドのセッションからOpenClaw Pluginツールや、
`cron` のような選択された組み込みツールを見せたい場合は、
セッションごとの `mcpServers` を渡そうとする代わりに、
Gateway側のACPX MCPブリッジを有効にしてください。詳細は
[ACP Agents](/ja-JP/tools/acp-agents-setup#plugin-tools-mcp-bridge) と
[OpenClaw tools MCP bridge](/ja-JP/tools/acp-agents-setup#openclaw-tools-mcp-bridge)
を参照してください。

## `acpx` から使う（Codex、Claude、その他のACPクライアント）

CodexやClaude CodeのようなコーディングagentからACP経由で
OpenClaw botと通信したい場合は、組み込みの `openclaw` ターゲットを持つ
`acpx` を使ってください。

一般的な流れ:

1. Gatewayを起動し、ACPブリッジがそこに到達できることを確認します。
2. `acpx openclaw` を `openclaw acp` に向けます。
3. コーディングagentに使わせたいOpenClawセッションキーを指定します。

例:

```bash
# デフォルトのOpenClaw ACPセッションへのワンショットリクエスト
acpx openclaw exec "アクティブなOpenClawセッション状態を要約して。"

# 後続turn用の永続的な名前付きセッション
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "このリポジトリに関連する最近のコンテキストを私のOpenClaw work agentに尋ねて。"
```

毎回 `acpx openclaw` を特定のGatewayとセッションキーに向けたい場合は、
`~/.acpx/config.json` で `openclaw` agentコマンドを上書きしてください。

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルのOpenClawチェックアウトを使う場合は、
ACPストリームをクリーンに保つため、dev runnerではなく直接CLIエントリーポイントを使ってください。例:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または他のACP対応クライアントに、terminalをスクレイピングせずに
OpenClaw agentからコンテキスト情報を取得させる最も簡単な方法です。

## Zedエディターのセットアップ

`~/.config/zed/settings.json` にカスタムACP agentを追加します（またはZedのSettings UIを使用します）:

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

特定のGatewayまたはagentを対象にするには:

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

Zedでは、Agentパネルを開いて「OpenClaw ACP」を選択するとスレッドを開始できます。

## セッションマッピング

デフォルトでは、ACPセッションには `acp:` プレフィックス付きの分離されたGatewayセッションキーが割り当てられます。
既知のセッションを再利用するには、セッションキーまたはラベルを渡します。

- `--session <key>`: 特定のGatewayセッションキーを使用します。
- `--session-label <label>`: ラベルから既存セッションを解決します。
- `--reset-session`: そのキーに対して新しいセッションidを発行します（同じキー、ただし新しいトランスクリプト）。

ACPクライアントがメタデータをサポートしている場合は、セッションごとに上書きできます。

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

- `--url <url>`: Gateway WebSocket URL（設定されている場合は `gateway.remote.url` がデフォルト）。
- `--token <token>`: Gateway認証token。
- `--token-file <path>`: ファイルからGateway認証tokenを読み取ります。
- `--password <password>`: Gateway認証password。
- `--password-file <path>`: ファイルからGateway認証passwordを読み取ります。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッションラベル。
- `--require-existing`: セッションキー/ラベルが存在しない場合は失敗します。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトの先頭に作業ディレクトリを付けません。
- `--provenance <off|meta|meta+receipt>`: ACP provenanceメタデータまたはreceiptを含めます。
- `--verbose, -v`: 詳細ログをstderrに出力します。

セキュリティに関する注意:

- `--token` と `--password` は、一部のシステムではローカルのプロセス一覧に表示されることがあります。
- `--token-file`/`--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）を推奨します。
- Gateway認証の解決は、他のGatewayクライアントで使われる共通契約に従います。
  - ローカルモード: env（`OPENCLAW_GATEWAY_*`） -> `gateway.auth.*` -> `gateway.auth.*` が未設定の場合に限り `gateway.remote.*` にフォールバック（設定済みだが未解決のローカルSecretRefはフェイルクローズ）
  - リモートモード: `gateway.remote.*`。env/configフォールバックはリモート優先ルールに従います
  - `--url` は安全に上書き可能で、暗黙のconfig/env認証情報を再利用しません。明示的な `--token`/`--password`（またはファイル版）を渡してください
- ACPランタイムバックエンドの子プロセスには `OPENCLAW_SHELL=acp` が渡され、コンテキスト固有のshell/profileルールに利用できます。
- `openclaw acp client` は、起動したブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` オプション

- `--cwd <dir>`: ACPセッションの作業ディレクトリ。
- `--server <command>`: ACPサーバーコマンド（デフォルト: `openclaw`）。
- `--server-args <args...>`: ACPサーバーに渡す追加引数。
- `--server-verbose`: ACPサーバーで詳細ログを有効化します。
- `--verbose, -v`: クライアントの詳細ログ。

## 関連

- [CLI reference](/ja-JP/cli)
- [ACP agents](/ja-JP/tools/acp-agents)

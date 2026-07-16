---
read_when:
    - iOS/watchOS/Android NodeをGatewayにペアリングする
    - エージェントのコンテキストに Node のキャンバス／カメラを使用する
    - 新しい Node コマンドまたは CLI ヘルパーの追加
summary: Node：ペアリング、機能、権限、および canvas/camera/screen/device/notifications/system 用 CLI ヘルパー
title: Node群
x-i18n:
    generated_at: "2026-07-16T11:45:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

**Node** は、`role: "node"` を使用して Gateway に接続し、`node.invoke` を介してコマンドサーフェス（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS/iOS/watchOS/Android/ヘッドレス）です。ほとんどの Node は、オペレーターポート上の Gateway WebSocket を使用します。オプションの直接接続 Apple Watch Node は、watchOS が通常のアプリによる汎用的な低レベルネットワーク通信をブロックするため、同じポートで署名付き HTTPS ポーリングを使用します。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL。現在の Node については履歴参照用のみ）。

macOS は **Node モード**でも実行できます。メニューバーアプリが 1 つの Node として Gateway の
WS サーバーに接続します（そのため、この Mac に対して `openclaw nodes …` が機能します）。アプリは、
`openclaw node run` が使用するものと同じ Node ホストのコマンドサーフェスに、ネイティブの Canvas、カメラ、画面、通知、コンピューター制御コマンドを
追加します。その Mac で 2 つ目の
CLI Node を起動しないでください。アプリは、対応する CLI Node ホストランタイムを
内部ワーカーとして実行し、唯一の Gateway 接続および Node ID であり続けます。

Node は Gateway ではなく**周辺機器**です。Node は Gateway サービスを実行せず、チャンネルメッセージ（Telegram、WhatsApp など）は Node ではなく Gateway に届きます。

トラブルシューティング手順書: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリングとステータス

Node は**デバイスペアリング**を使用します。Node は接続時に署名付きデバイス ID を提示し、Gateway は `role: node` のデバイスペアリングリクエストを作成します。デバイス CLI（または UI）から承認します。直接接続 Apple Watch のセットアップでは、管理者が発行した短期間有効な Node 専用セットアップコードを使用して、固定された低リスクのコマンドサーフェスを承認します。その後のケイパビリティ拡張には、引き続き通常の承認が必要です。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

保留中のペアリングリクエストは、デバイスの最後の再試行から 5 分後に期限切れになります。再接続を続けるデバイスでは、数分ごとに新しいプロンプトを発行する代わりに、1 件の保留中リクエスト（および `requestId`）が有効なまま維持されます。リクエストから承認までのライフサイクル全体については、[Node のペアリング](/ja-JP/gateway/pairing)を参照してください。Node が認証情報（ロール/スコープ/公開鍵）を変更して再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。クライアントは置き換えられたリクエストに対する `device.pair.resolved` イベントを受信するため、承認前に `openclaw devices list` を再実行してください。

- `nodes status` は、デバイスペアリングのロールに `node` が含まれている場合、Node を**ペアリング済み**としてマークします。
- アクセシビリティ権限を持つ、接続中のネイティブ Mac は、統合された
  物理入力アクティビティを報告できます。Gateway は、条件を満たす最新の Mac を
  `active` としてマークし、エージェントに安定した Node ID ヒントを提供して、遅延フォールバックの前に Node 接続
  アラートをそこへルーティングします。セットアップ、プライバシー、タイミング、
  トラブルシューティングについては、[アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence)を参照してください。
- デバイスペアリングレコードは、承認済みロールに関する永続的な契約です。トークンのローテーションはその契約内に限定され、ペアリング承認で付与されていないロールへ、ペアリング済み Node を昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、Gateway が所有する独立した Node ペアリングストアであり、再接続をまたいで Node の承認済みコマンド/ケイパビリティサーフェスを追跡します。これはトランスポート認証を制御**しません**。トランスポート認証を制御するのはデバイスペアリングです。
- `openclaw nodes remove --node <id|name|ip>` は Node のペアリングを削除します。デバイスに基づく Node の場合、ペアリング済みデバイスストアにあるそのデバイスの `node` ロールを失効させ、そのデバイスの Node ロールセッションを切断します。複数ロールのデバイスでは行が維持され、`node` ロールのみが失われます。一方、Node 専用デバイスの行は削除されます。また、独立した Node ペアリングストアから一致するエントリも消去します。`operator.pairing` は、他のデバイスにあるオペレーター以外の Node 行を削除できる場合があります。複数ロールのデバイスで自身の Node ロールを失効させるデバイストークン呼び出し元には、追加で `operator.admin` が必要です。
- 承認スコープは、保留中リクエストで宣言されたコマンドに従います。
  - コマンドなしのリクエスト: `operator.pairing`
  - exec 以外の Node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## バージョン差異とアップグレード順序

Gateway WebSocket は、N-1 のプロトコル範囲内にある認証済み Node クライアントを受け入れます。
したがって、現在の v4 Gateway は、接続で
`role: "node"` と `client.mode: "node"` の両方が宣言されている場合、v3 Node を受け入れます。オペレーターセッションと UI セッションは、
引き続き現在のプロトコルを使用する必要があります。

段階的なフリートアップグレードでは、まず Gateway をアップグレードし、その後で各 Node をアップグレードします。
N-1 の Node は、アップグレード中も表示および管理できます。Gateway は
アップグレードの推奨事項とともに `legacy node protocol accepted` をログに記録します。ペアリング、
デバイス認証、コマンド許可リスト、exec 承認は引き続き適用されます。
Plugin が所有するケイパビリティとコマンドは、Node が
現在のプロトコルにアップグレードされるまで非表示のままです。N-1 より古い Node は、
再接続する前に帯域外でアップグレードする必要があります。

直接接続の watchOS HTTPS トランスポートには、現在のプロトコルバージョンが必要です。直接モードを有効にする前に、
Gateway とともに Watch アプリを更新してください。

## リモート Node ホスト（system.run）

Gateway を 1 台のマシンで実行し、別のマシンでコマンドを実行する場合は、**Node ホスト**を使用します。モデルは引き続き **Gateway** と通信します。`host=node` が選択されている場合、Gateway は `exec` の呼び出しを **Node ホスト**へ転送します。

| ロール       | 責務                                                             |
| ------------ | ---------------------------------------------------------------- |
| Gateway ホスト | メッセージを受信し、モデルを実行して、ツール呼び出しをルーティングします。 |
| Node ホスト    | Node マシン上で `system.run`/`system.which` を実行します。 |
| 承認           | `~/.openclaw/exec-approvals.json` を介して Node ホスト上で適用されます。 |

承認に関する注意:

- 承認に基づく Node 実行は、正確なリクエストコンテキストにバインドされます。exec パスは承認前に正規の `systemRunPlan` を準備します。承認されると、Gateway は、その後に呼び出し元が編集したコマンド/cwd/セッションフィールドではなく、保存済みのプランを転送し、実行前に作業ディレクトリを再検証します。
- シェル/ランタイムによるファイルの直接実行では、OpenClaw は具体的なローカルファイルのオペランド 1 つもベストエフォートでバインドし、実行前にそのファイルが変更された場合は実行を拒否します。
- インタープリター/ランタイムコマンドについて、OpenClaw が具体的なローカルファイルをちょうど 1 つ特定できない場合、ランタイム全体を保護できるかのように扱う代わりに、承認に基づく実行を拒否します。より広範なインタープリターのセマンティクスには、サンドボックス化、別ホスト、または明示的に信頼された許可リスト/完全なワークフローを使用してください。

### Node ホストを起動する（フォアグラウンド）

Node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` は、`--context-path`（Gateway WS コンテキストパス）、`--tls`、`--tls-fingerprint <sha256>`、および `--node-id`（レガシークライアントインスタンス ID を上書きします。ペアリングはリセットされません）も受け入れます。

### SSH トンネル経由のリモート Gateway（ループバックバインド）

Gateway がループバックにバインドされている場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、リモート Node ホストは直接接続できません。SSH トンネルを作成し、Node ホストをトンネルのローカル側へ接続します。

例（Node ホスト -> Gateway ホスト）:

```bash
# ターミナル A（実行を継続）: ローカルの 18790 を Gateway の 127.0.0.1:18789 に転送
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# ターミナル B: Gateway トークンをエクスポートし、トンネル経由で接続
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意:

- `openclaw node run` は、トークン認証またはパスワード認証をサポートします。
- 環境変数が推奨されます: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定のフォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、リモートの優先順位規則に従って `gateway.remote.token` / `gateway.remote.password` を使用できます。
- 有効なローカル `gateway.auth.*` SecretRefs が設定されていても解決できない場合、Node ホスト認証はフェイルクローズします。
- Node ホストの認証解決では、`OPENCLAW_GATEWAY_*` 環境変数のみが考慮されます。

### Node ホストを起動する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` は、`--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`（レガシークライアントインスタンス ID のみ）、`--runtime <node>`（デフォルト: Node）、および再インストール用の `--force` も受け入れます。`node status`、`node stop`、`node uninstall` も使用できます。

### ペアリングと名前の設定

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node が認証情報を変更して再試行した場合は、`openclaw devices list` を再実行し、現在の `requestId` を承認してください。

名前の設定方法:

- `openclaw node run` / `openclaw node install` の `--display-name`（クライアントインスタンス ID および Gateway 接続メタデータとともに、共有 `node_host_config` SQLite 行に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway による上書き）。

### Node でホストされる MCP サーバー

MCP サーバーは Gateway ではなく、Node マシン上の `openclaw.json` に
設定します。

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

ヘッドレス Node ホストはこれらのサーバーを起動し、ツールの一覧を取得して、接続後に
ディスクリプターを公開します。ツール呼び出しは
`mcp.tools.call.v1` を介してその Node に戻ります。Gateway に一致する MCP 設定や JS
Plugin は必要ありません。OAuth MCP サーバーは、この Node ホスト型 v1 パスではサポートされていません。

現在の Node ホストは、MCP サーバーが設定されていない場合でも、初回ペアリング時に組み込みの `mcp.tools.call.v1` コマンドファミリーを
宣言します。古い OpenClaw バージョンでペアリングされた Node は、
Node ホストの更新後に、コマンドサーフェスの 1 回限りのアップグレードを要求する場合があります。その後にサーバーを追加、削除、またはフィルタリングしても、
承認済みコマンドファミリーは変わらないため、再ペアリングは
必要ありません。Node の MCP 設定変更を適用するには、
`openclaw node run` または `openclaw node restart` を再起動してください。
Node ホストはこの設定を監視しません。

Gateway オペレーターは、
Node でホストされる MCP ツールを含め、ペアリング済み Node が公開するすべてのエージェント可視ツールを
`gateway.nodes.pluginTools.enabled: false` で無視できます。`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` のような
コマンドを正確に指定した拒否設定も、実行をブロックします。

### Node でホストされる Skills

Node マシンで有効な OpenClaw Skills ディレクトリ（デフォルトでは
`~/.openclaw/skills`）の下に Skills をインストールします。`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR`、および
`OPENCLAW_CONFIG_PATH` は、その有効なプロファイルを移動します。Skills については `OPENCLAW_STATE_DIR` が
優先されます。それ以外の場合、`skills/` は
`openclaw config file` が出力するパスの隣にあります。ヘッドレス Node ホストは接続後に、有効な `SKILL.md` ファイルを
公開します。Gateway は、その Node が接続されている間だけ、それらをエージェントの Skills スナップショットに追加します。
抽象的な Node ロケーターが別のプロトコルフィールドを追加せずに 1 つのエントリへマッピングされるように、
各 Skill ディレクトリ名は `name` の frontmatter フィールドと一致する必要があります。

初回のノードロールのペアリングによって、スキルの公開が承認されます。スキルの追加、削除、変更に、再度のペアリングや Gateway 設定の変更は必要ありません。ノードのスキルファイルを変更した後は、`openclaw node run` または `openclaw node restart` を再起動してください。ノードホストはスキルディレクトリを監視しません。

ノードでホストされるスキルのエントリは、対象ノードを識別し、実行場所を保持します。スキルファイル、そこから参照される相対パス、およびバイナリは、そのノード上に残ります。エージェントは、通常の `read` ツールを使用して、通知された `node://.../SKILL.md` の場所を読み取ります。`file_fetch` は、オペレーターが承認したノードの絶対パスを受け入れますが、ノードスキルのロケーターは受け入れません。通常の読み取りツールを持たないランタイムでは、代わりに、通知された `node://.../skills/<name>` ディレクトリを `workdir` として指定し、`exec host=node node=<node-id>` を介して `cat SKILL.md` を実行できます。参照されるファイルとバイナリには、同じ exec ターゲットと作業ディレクトリが使用されます。ノードホストは、そのロケーターをアクティブな OpenClaw 状態ディレクトリに対して解決するため、相対パスは Gateway マシンではなくノード上で解決されます。公開元ノードでは `system.run` が承認済みであり、エージェントの exec ポリシーでは `host=node` が許可されている必要があります。それ以外の場合、そのスキルはエージェントのスナップショットに含まれません。

公開を停止するには、ノードで `nodeHost.skills.enabled: false` を設定します。Gateway オペレーターは、`gateway.nodes.skills.enabled: false` を使用して、ペアリング済みのすべてのノードからのスキルを無視できます。

### ヘッドレス ID の状態

ヘッドレスノードは、次の 3 つの独立した状態レコードを保持します。

- `~/.openclaw/state/openclaw.sqlite`（`node_host_config`）：クライアントインスタンス ID、表示名、および Gateway 接続メタデータ。
- `~/.openclaw/identity/device.json`：署名済みデバイスキーペアと、そこから導出された暗号学的デバイス ID。
- `~/.openclaw/identity/device-auth.json`：暗号学的デバイス ID とロールをキーとする、ペアリング済みデバイス認証トークン。

署名済みノードの場合、Gateway はペアリングとノードルーティングに暗号学的デバイス ID を使用します。クライアントインスタンス ID は接続メタデータにすぎません。したがって、`--node-id` を変更したり、廃止された `node.json` を移行したりしても、ペアリングはリセットされません。サポートされている取り消しと再ペアリングの手順、およびアップグレードに関する注意事項については、[ID とペアリングの状態](/ja-JP/cli/node#identity-and-pairing-state)を参照してください。

### コマンドを許可リストに追加する

Exec の承認は**ノードホストごと**に管理されます。Gateway から許可リストのエントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認情報は、ノードホストの `~/.openclaw/exec-approvals.json` に保存されます。

### exec の実行先をノードに設定する

デフォルトを設定します（Gateway 設定）。

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

または、セッションごとに設定します。

```text
/exec host=node security=allowlist node=<id-or-name>
```

設定後は、`host=node` を指定したすべての `exec` 呼び出しが、ノードの許可リストと承認に従ってノードホスト上で実行されます。

`host=auto` が暗黙的にノードを選択することはありませんが、`auto` から呼び出しごとに明示的な `host=node` を要求することはできます。ノードでの exec をセッションのデフォルトにする場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連項目：

- [ノードホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec の承認](/ja-JP/tools/exec-approvals)

### ローカルモデル推論

デスクトップまたはサーバーノードは、そのノード上で稼働する Ollama サーバーから、チャット対応モデルを公開できます。エージェントは Ollama Plugin の `node_inference` ツールを使用して、インストール済みモデルを検出し、制限付きプロンプトをリモートで実行します。Gateway から Ollama へ直接ネットワークアクセスする必要はありません。セットアップ、モデルのフィルタリング、および直接検証するためのコマンドについては、[Ollama のノードローカル推論](/ja-JP/providers/ollama#node-local-inference)を参照してください。

### Codex のセッションとトランスクリプト

公式の `codex` Plugin は、ヘッドレスノードホストまたはネイティブ macOS ノード上の、アーカイブされていない Codex セッションを公開できます。カタログ登録は `supervision.enabled` に依存しなくなりました。このオプションは、エージェント向けの監督ツールを制御します。プロバイダーやハーネスを無効にせずに、オペレーターカタログとペアリング済みノードのカタログコマンドを無効にするには、Codex Plugin の設定で `sessionCatalog.enabled: false` を設定します。
Plugin は両方のコンピューターで引き続き有効になっている必要があり、ノード設定はローカルでの同意として機能します。Gateway 側だけで有効にしても、別のコンピューターの Codex 状態を読み取ることはできません。

ノードは、バージョン管理された読み取り専用の `codex.appServer.threads.list.v1` および `codex.appServer.thread.turns.list.v1` コマンドを通知します。Codex CLI を使用できるネイティブノードホストでは、`codex.terminal.resume.v1` も通知されます。これらのコマンドが初めて表示されたときに、ノードのペアリングアップグレードを承認してください。Gateway は通常の Plugin ノードポリシーを通じてこれらを呼び出し、障害をホストごとに分離します。

ペアリング済みノードの行は、通常のセッションサイドバーに **Codex** グループとして表示されます。デフォルトでは、行を選択すると通常のチャットペインが開き、完全な項目投影を使用した、制限付きかつカーソルベースでページ分割された `thread/turns/list` 呼び出しを通じて、永続化されたトランスクリプトが読み取られます。行メニュー、ビューアーヘッダー、または **Open Codex/Claude sessions in** 設定を使用して、セッションを所有するコンピューターのオペレーター端末で `codex resume <thread-id>` を起動します。ペアリング済みノードの端末パスは Codex Plugin が所有する許可リスト登録済みの PTY リレーであり、任意のノードコマンドを実行するものではありません。

このリレーは、OpenClaw ハーネスの完全な継続契約およびアーカイブ所有権契約を提供しません。そのため、リモート行では **Continue** と **Archive** を使用できません。Gateway コンピューターでは、保存済みまたはアイドル状態の行から、別個のモデル固定チャットブランチを開始できます。どちらも、他の Codex クライアントが使用していないことをオペレーターが確認した後にのみアーカイブできます。保存済みの行が現在アクティブかどうかは不明なままです。アクティブな行では、ブランチの作成やアーカイブはできません。

セットアップ、ページネーション、ローカルでの継続、およびメタデータのセキュリティ境界については、[Codex セッションを監督する](/ja-JP/plugins/codex-supervision)を参照してください。

### Claude のセッションとトランスクリプト

同梱の `anthropic` Plugin は、デフォルトで Gateway およびペアリング済みノード上の、アーカイブされていない Claude CLI と Claude Desktop のセッションを検出します。Anthropic モデルや Claude CLI バックエンドを無効にせずに、オペレーターカタログとペアリング済みノードのカタログコマンドを無効にするには、`plugins.entries.anthropic.config.sessionCatalog.enabled: false` を設定します。
リモートの macOS アプリノードでは、Anthropic Plugin が有効で `~/.claude/projects/` が存在する場合、`anthropic.claude.sessions.list.v1` と `anthropic.claude.sessions.read.v1` が通知されます。これらのコマンドが初めて表示されたときに、ノードのペアリングアップグレードを承認してください。

Claude CLI を使用できるネイティブノードホストでは、`anthropic.claude.terminal.resume.v1` も通知されます。対象となる CLI と Desktop の行では、それらを所有するホストのオペレーター端末で `claude --resume <session-id>` を開くことができます。これはネイティブセッションの引き継ぎです。OpenClaw での引き継ぎとは異なり、先に Claude セッションをフォークすることはありません。

カタログは、有効な Claude CLI プロジェクトインデックスレコードと、現在の `sdk-cli` JSONL ファイルから取得した制限付きのメタデータ接頭部を統合します。Claude Desktop のローカルメタデータは、Desktop のタイトルとアーカイブ状態を提供します。両方のソースが同じ Claude Code セッション ID を参照する場合は Desktop のメタデータが優先されます。CLI にはアーカイブフラグがないため、CLI のみに存在するトランスクリプトは引き続き表示されます。トランスクリプトの読み取りでは、不透明なバイトオフセットカーソルと制限付きのファイル逆方向読み取りを使用します。そのため、大きなセッションを選択した場合や古いページを読み込んだ場合でも、JSONL 履歴全体が 1 回の Gateway 応答に読み込まれることはありません。

一覧表示コマンドと読み取りコマンドは読み取り専用です。これらは、`operator.write` を持つ認証済みオペレーター接続に対してのみ、汎用の `sessions.catalog.list` および `sessions.catalog.read` メソッドを通じてカタログメタデータとトランスクリプト内容を公開します。Gateway ローカルの Claude CLI 行は、通常のチャット作成欄から引き継ぐことができます。OpenClaw は表示可能な履歴を制限付きでインポートし、最初のターンで `--fork-session` を使用して再開し、元のトランスクリプトは変更しません。

ヘッドレスノードホストでは、同じ継続フローをオプトインで有効にできます。

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

ノードは、このノードローカル設定が有効で、かつそのノード上で `claude` 実行ファイルを解決できる場合にのみ `agent.cli.claude.run.v1` を通知します。Gateway からリモートで有効にすることはできません。このコマンドも、ノードの既存の exec 承認ポリシーを通過します。3 つの Claude コマンドがすべて通知され、Gateway のノードコマンドポリシーで許可されると、そのノード上の Claude CLI 行を継続できるようになります。OpenClaw は制限付きの履歴をインポートし、引き継いだセッションをそのノードおよびカタログから報告された作業ディレクトリに関連付け、各単発の `claude -p` ターンをそこで実行します。最初のターンでは引き続き `--fork-session` が使用され、元のトランスクリプトが保持されます。

ノード上で実行されるターンでは、ノードの Claude デフォルト設定が使用されます。v1 では、Gateway loopback MCP 設定または Gateway の Skills Plugin を受け取らず、Gateway トランスクリプトから再シードできず、添付ファイルと画像を拒否します。Claude Desktop の行、および実行コマンドを通知しないノードは、表示専用のままです。macOS アプリノードでは、このコマンドはまだ通知されないため、その行は表示専用のままです。

Control UI の動作とストレージソースについては、[Anthropic：コンピューター間の Claude セッション](/ja-JP/providers/anthropic#claude-sessions-across-computers)を参照してください。

### OpenCode と Pi のセッション

同梱の OpenCode および ACPX Plugin も、Gateway とペアリング済みノード上の読み取り専用ネイティブセッションカタログを検出します。`opencode` CLI がインストールされている場合、ノードは `opencode.sessions.list.v1` / `opencode.sessions.read.v1` を通知し、Pi のセッションディレクトリが存在する場合は `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1` を通知します。新しいコマンドが初めて表示されたときに、ノードのペアリングアップグレードを承認してください。対応する CLI も使用できる場合、ノードは `opencode.terminal.resume.v1` または `acpx.pi.terminal.resume.v1` を追加します。既存の行メニューとビューアーヘッダーから、`opencode --session <id>` または `pi --session <id>` を使用して、選択したセッションをそれが属する端末で再度開けるようになります。

OpenCode は、公式 CLI の JSON/export サーフェスを通じて読み取ります。Pi は、プロジェクトおよびグローバルの `settings.json` セッションディレクトリに加え、`PI_CODING_AGENT_DIR` と `PI_CODING_AGENT_SESSION_DIR` のオーバーライドを含む、文書化された JSONL セッションストアを読み取ります。両方のカタログはデフォルトで有効です。無効にするには、Web UI の **Config > Plugins** で設定します。

端末での再開には、保存されているセッションの作業ディレクトリと、Codex および Claude と同じ許可リスト登録済みの双方向 PTY リレーが使用されます。任意のノードコマンドを実行できるようにはなりません。

### 端末へのファイルアップロード

Control UI では、開いているペアリング済みノードの端末にファイルをドラッグできます。ネイティブノードホストは、管理者専用の `terminal.upload` コマンドを通知します。初めて表示されたときに、ペアリングアップグレードを承認してください。各ファイルの上限は 16 MiB で、そのノード上の非公開一時ディレクトリにステージングされ、実行されることなくシェル引用符付きのパスとして端末に返されます。

パスの挿入は、PowerShell、`cmd.exe`、および認識される POSIX シェル（`sh`、Bash、Dash、Ash、Ksh、Zsh、Fish）に対応し、Windows 上の Git Bash も含まれます。その他のシェルオーバーライドは、引用規則を安全に推測できないため拒否されます。ネイティブ WSL パスを使用するには、WSL 内でノードホストを実行してください。`%` または `!` を含む `cmd.exe` パスも、そのシェルが二重引用符内でもこれらの文字を展開するため拒否されます。

## コマンドの呼び出し

低レベル（raw RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` は `system.run` と `system.run.prepare` をブロックします。これらのコマンドは、`host=node` を指定した `exec` ツールを通じてのみ実行されます（前述を参照）。一般的な「エージェントに MEDIA 添付ファイルを渡す」ワークフロー（canvas、camera、screen、location、後述）には、より高レベルのヘルパーが用意されています。

長時間実行されるストリーミング Node コマンドは、追加型の `node.invoke.progress`
イベントを使用します。各イベントには、呼び出し ID、0 から始まるシーケンス番号、および
サイズが制限された UTF-8 テキストチャンクが含まれます。Gateway は、呼び出し元に配信する前に
チャンクを順序どおりに並べます。既存の `node.invoke.result` は、引き続き単一の終端
レスポンスです。ストリーミングの呼び出し元は、最初の進行状況イベントで開始し、
以降の進行状況イベントのたびにリセットされる無通信期限を設定できます。その一方で、
承認および実行中は、呼び出しに設定された別個のハードタイムアウトが維持されます。結果の返却、ハード
タイムアウト、無通信タイムアウト、Node の切断が発生すると、保留中のストリーム
状態はすべて破棄されます。呼び出し元によるキャンセルでは `node.invoke.cancel` が送出され、その後 Node ホストが
一致するプロセスツリーを終了します。既存のリクエスト／レスポンス型コマンドに変更はありません。

## コマンドポリシー

Node コマンドを呼び出すには、事前に 2 つのゲートを通過する必要があります。

1. Node は、認証済みの接続メタデータ（`connect.commands`）内でコマンドを宣言する必要があります。
2. プラットフォームと承認から導出される Gateway の許可リストに、宣言されたコマンドが含まれている必要があります。

プラットフォーム別のデフォルト許可リスト（Plugin のデフォルトおよび `allowCommands`/`denyCommands` によるオーバーライドの適用前）：

| プラットフォーム | デフォルトで許可されるコマンド                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（`system.run` などの Node ホストコマンドには承認が必要です。以下を参照してください）                                                                                                                                                                                                                                  |

これらの行は、すべての Node アプリが実装するコマンドではなく、Gateway ポリシーの上限を示しています。コマンドを使用できるのは、接続中の Node もそのコマンドを宣言している場合に限られます。特に、現在の macOS アプリは、macOS ポリシーの行に記載されているデバイスおよび個人データ系のコマンド群を宣言しません。

`canvas.*` コマンド（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）は、iOS、Android、macOS、Windows、Linux、および不明なプラットフォームにおける Plugin のデフォルトです。Linux Node は、デスクトップアプリのローカル Canvas ソケットが存在する場合にのみ、これらを宣言します。iOS では、すべての Canvas コマンドがフォアグラウンドに制限されます。

`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、および `talk.ptt.once` は、プラットフォームラベルに関係なく、`talk` 機能を公開するか、`talk.*` コマンドを宣言するすべての Node でデフォルトで許可されます。

デスクトップホストコマンド（macOS/Windows 上の `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`mcp.tools.call.v1`、および `screen.snapshot`）は、上記の静的なプラットフォーム別デフォルト表には含まれません。これらを宣言するペアリングリクエストをオペレーターが承認すると利用可能になり、その後は Node の承認済みコマンドセットによって、再接続後も引き継がれます。

危険性またはプライバシーへの影響が大きいコマンドは、Node が宣言している場合でも、`gateway.nodes.allowCommands` による明示的なオプトインが必要です：`camera.snap`、`camera.clip`、`screen.record`、`computer.act`、`contacts.add`、`calendar.add`、`reminders.add`、`health.summary`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` は、デフォルトおよび追加の許可リストエントリよりも常に優先されます。iPhone の同意ゲートについては [HealthKit の概要](/ja-JP/platforms/ios-healthkit)を、デスクトップ入力に関する追加の macOS、ツールポリシー、および有効化ゲートについては[コンピューター操作](/ja-JP/nodes/computer-use)を参照してください。

Plugin が所有する Node コマンドは、Gateway の Node 呼び出しポリシーを追加できます。このポリシーは、許可リストの確認後、Node への転送前に実行されるため、生の `node.invoke`、CLI ヘルパー、および専用のエージェントツールは、同じ Plugin 権限境界を共有します。危険な Plugin Node コマンドには、引き続き明示的な `gateway.nodes.allowCommands` オプトインが必要です。

Node が宣言するコマンドリストを変更した後は、古いデバイスペアリングを拒否し、新しいリクエストを承認して、Gateway に更新済みのコマンドスナップショットを保存させてください。

## 設定（`openclaw.json`）

Node 関連の設定は、`gateway.nodes` および `tools.exec` 配下にあります。

```json5
{
  gateway: {
    nodes: {
      // 信頼されたネットワーク（CIDR リスト）からの初回 Node ペアリングを自動承認します。
      // 未設定の場合は無効です。要求されたスコープがない初回の role:node リクエストにのみ
      // 適用され、アップグレードは自動承認しません。
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // SSH 検証済みの自動承認（デフォルト：有効）。SSH 経由で読み戻された
        // デバイスキーが完全に一致する場合、初回の Node ペアリングを承認します。
        sshVerify: true,
      },
      // ペアリング済み Node が公開する、エージェントから参照可能な Plugin ツールを信頼します（デフォルト：true）。
      pluginTools: {
        enabled: true,
      },
      // 危険性またはプライバシーへの影響が大きい Node コマンド（camera.snap など）をオプトインで有効にします。
      allowCommands: ["camera.snap", "screen.record"],
      // デフォルトまたは allowCommands に含まれている場合でも、完全一致するコマンド名をブロックします。
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // デフォルトの exec ホスト："node" は、すべての exec 呼び出しをペアリング済み Node にルーティングします。
      host: "node",
      // Node exec のセキュリティモード：承認済み／許可リスト登録済みのコマンドのみを許可します。
      security: "allowlist",
      // exec を特定の Node（ID または名前）に固定します。任意の Node を許可する場合は省略します。
      node: "build-node",
    },
  },
}
```

正確な Node コマンド名を使用してください。`denyCommands` は、プラットフォームのデフォルトまたは `allowCommands` エントリによって許可される場合でも、そのコマンドを除外します。ペアリング済み Node は、デフォルトでエージェントから参照可能な Plugin ツール記述子を公開できますが、各記述子のコマンドは、引き続き Node の承認済みコマンドサーフェスに含まれている必要があります。このような記述子をすべて無視するには、`gateway.nodes.pluginTools.enabled: false` を設定します。Gateway の Node ペアリングおよびコマンドポリシーフィールドの詳細については、[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

エージェントごとの exec Node オーバーライド：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## スクリーンショット（Canvas スナップショット）

Node が Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルに書き込み、保存先のパスを出力します）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas コントロール

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注：

- `canvas present` は、ローカルパスをサポートする Node で URL またはローカルファイルパス（`--target`）を受け付け、位置指定用の `--x/--y/--width/--height` も任意で指定できます。Linux Canvas は、HTTP(S) URL または同梱の A2UI レンダラーを受け付けます。
- `canvas eval` は、インライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注：

- モバイルおよび Linux デスクトップの Node は、アクション対応のレンダリングに、アプリが所有する同梱の A2UI ページを使用します。
- A2UI v0.8 JSONL のみがサポートされます（v0.9/createSurface は拒否されます）。
- iOS と Android はリモートの Gateway Canvas ページをレンダリングしますが、A2UI ボタンアクションがディスパッチされるのは、アプリが所有する同梱の A2UI ページからのみです。Gateway がホストする HTTP/HTTPS A2UI ページは、これらのモバイルクライアントではレンダリング専用です。
- macOS は、アプリによって選択された、機能スコープが完全に一致する Gateway A2UI ページからアクションをディスパッチできます。その他の HTTP/HTTPS ページは、引き続きレンダリング専用です。
- Linux は、同梱の A2UI ページからのみアクションをディスパッチします。その他の HTTP/HTTPS ページは引き続きレンダリング専用であり、デスクトップアプリのないヘッドレス Linux Node は Canvas を公開しません。

## 写真と動画（Node カメラ）

写真（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # デフォルト：両方の向き（2 MEDIA 行）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

動画クリップ（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注：

- `canvas.*` および `camera.*` を使用するには、Node が**フォアグラウンド**である必要があります（バックグラウンドからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- Node は、base64 ペイロードを扱いやすいサイズに保つため、クリップの長さを上限に制限します（プラットフォームごとの正確な制限については、[カメラ撮影](/ja-JP/nodes/camera)を参照してください）。`nodes` エージェントツールはさらに、呼び出しを転送する前に、要求された `durationMs` を 300000（5 分）に制限します。Node 自体は、これより厳しい制限を適用します。
- Android は、可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を求めます。権限が拒否されると、`*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（Node）

対応する Node は `screen.record`（mp4）を公開します。例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注：

- `screen.record` の可用性は Node プラットフォームによって異なります。
- `nodes` エージェントツールは、要求された `durationMs` を 300000（5 分）に制限します。Node は、返されるペイロードを制限するため、さらに厳しい制限を適用する場合があります。
- `--no-audio` は、対応プラットフォームでマイクのキャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します（0 = プライマリ）。

## 位置情報（Node）

設定で位置情報を有効にすると、Node は `location.get` を公開します。

CLI ヘルパー：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注：

- 位置情報は**デフォルトでオフ**です。
- 「常に許可」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには、緯度／経度、精度（メートル）、タイムスタンプが含まれます。
- パラメーターとレスポンスの完全な形式、およびエラーコードについては、[位置情報コマンド](/ja-JP/nodes/location-command)を参照してください。

## SMS（Android Node）

ユーザーが **SMS** 権限を付与し、デバイスが電話機能に対応している場合、Android Node は `sms.send` と `sms.search` を公開できます。どちらのコマンドもデフォルトでは危険なコマンドとして扱われます。呼び出せるようにするには、Gateway オペレーターが `gateway.nodes.allowCommands` にも追加する必要があります（[コマンドポリシー](#command-policy)を参照）。

読み取り専用の SMS 検索を使用するには、`openclaw.json` で明示的にオプトインします。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Node からメッセージも送信できるようにする場合に限り、`sms.send` を別途追加します。Android の権限と Gateway のコマンド認可は独立しています。スマートフォンの権限を付与しても、Gateway ポリシーは変更されません。

低レベルの呼び出し：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注：

- `sms.search` は、`READ_SMS` が付与される前でも宣言できるため、呼び出し時に権限診断を返せます。ただし、メッセージの読み取りには引き続きその Android 権限が必要です。
- 電話機能のない Wi-Fi 専用デバイスは、`sms.send` を公開しません。
- `requires explicit gateway.nodes.allowCommands opt-in` エラーは、スマートフォン側でコマンドが宣言されているものの、Gateway オペレーターが認可していないことを示します。

## デバイスおよび個人データのコマンド

iOS および Android Node は、デフォルトで複数の読み取り専用データコマンドを公開します（[コマンドポリシー](#command-policy)の表を参照）。Android ではさらに、アプリ内設定によって制御される、より多くのコマンド群が公開されます。

利用可能なコマンド群：

- `device.status`、`device.info` — iOS、Android、Windows。
- `device.permissions`、`device.health`、`device.apps` — Android のみ。`device.apps` には Android Settings で Installed Apps の共有を有効にする必要があり、デフォルトではランチャーに表示されるアプリを返します。
- `notifications.list`、`notifications.actions` — Android のみ。
- `photos.latest` — iOS、Android。
- `contacts.search` — iOS、Android（デフォルトは読み取り専用）。`contacts.add` は危険なコマンドであり、`gateway.nodes.allowCommands` が必要です。
- `calendar.events` — iOS、Android（デフォルトは読み取り専用）。`calendar.add` は危険なコマンドであり、`gateway.nodes.allowCommands` が必要です。
- `reminders.list` — iOS、Android（デフォルトは読み取り専用）。`reminders.add` は危険なコマンドであり、`gateway.nodes.allowCommands` が必要です。
- `callLog.search` — Android のみ。
- `motion.activity`、`motion.pedometer` — iOS、Android。利用可能なセンサーの機能によって制限されます。

呼び出し例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## システムコマンド（Node ホスト／Mac Node）

macOS Node は `system.run`、`system.which`、`system.notify`、`system.execApprovals.get/set` を公開します。ヘッドレス Node ホストは `system.run.prepare`、`system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

注：

- `system.run` は、ペイロードで標準出力、標準エラー出力、終了コードを返します。
- シェル実行は現在、`host=node` を指定した `exec` ツールを経由します。`nodes` は、明示的な Node コマンド用の直接 RPC サーフェスとして引き続き使用されます。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パスでのみ使用されます。
- exec パスは、承認前に正規の `systemRunPlan` を準備します。承認されると、Gateway は保存されたそのプランを転送し、それ以降に呼び出し元が編集したコマンド、cwd、セッションの各フィールドは転送しません。
- `system.notify` は macOS アプリの通知権限状態に従い、`--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- 認識されない Node の `platform`／`deviceFamily` メタデータには、`system.run` と `system.which` を除外する保守的なデフォルト許可リストが使用されます。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` を使用して明示的に追加してください。
- `system.run` は、`--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は、明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に限定されます。
- 許可リストモードで「常に許可」を選択した場合、既知のディスパッチラッパー（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）では、ラッパーのパスではなく内部の実行ファイルパスが永続化されます。安全にラッパーを展開できない場合、許可リストのエントリは自動的に永続化されません。
- Windows Node ホストの許可リストモードでは、`cmd.exe /c` を介したシェルラッパーの実行には承認が必要です（許可リストのエントリだけではラッパー形式は自動許可されません）。
- Node ホストは、`--env` 内の `PATH` オーバーライドを無視し、コマンドを実行する前に、管理対象となっている多数のインタープリター／シェル起動変数（例：`NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）を削除します。PATH に追加のエントリが必要な場合は、`--env` を介して `PATH` を渡すのではなく、Node ホストサービスの環境を設定するか、標準の場所にツールをインストールしてください。
- macOS Node モードでは、`system.run` は macOS アプリの exec 承認（Settings → Exec approvals）によって制御されます。確認／許可リスト／完全の動作はヘッドレス Node ホストと同じです。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレス Node ホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制御されます。macOS については、以下の[ヘッドレス Node ホスト](#headless-node-host-cross-platform)にある exec ホストルーティング環境変数を参照してください。

## exec の Node バインディング

複数の Node が利用可能な場合、exec を特定の Node にバインドできます。これにより、`exec host=node` のデフォルト Node が設定されます（エージェントごとに上書き可能です）。

グローバルデフォルト：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

任意の Node を許可するには設定を解除します。

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 権限マップ

Node は、`node.list`／`node.describe` に `permissions` マップを含める場合があります。このマップは権限名（例：`screenRecording`、`accessibility`、`location`）をキーとし、真偽値（`true` = 付与済み）を値とします。

## ヘッドレス Node ホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続して `system.run`／`system.which` を公開する**ヘッドレス Node ホスト**（UI なし）を実行できます。Linux／Windows での使用や、サーバーとともに最小構成の Node を実行する場合に便利です。

起動方法：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注：

- 引き続きペアリングが必要です（Gateway にデバイスのペアリングプロンプトが表示されます）。
- クライアントインスタンスのメタデータ、署名付きデバイス ID、ペアリング認証には別々のファイルが使用されます。[ヘッドレス ID の状態](#headless-identity-state)を参照してください。
- exec 承認は `~/.openclaw/exec-approvals.json` を介してローカルで適用されます（[exec 承認](/ja-JP/tools/exec-approvals)を参照）。
- macOS では、ヘッドレス Node ホストはデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリの exec ホスト経由でルーティングするには、`OPENCLAW_NODE_EXEC_HOST=app` を設定します。アプリホストを必須とし、利用できない場合にフェイルクローズするには、`OPENCLAW_NODE_EXEC_FALLBACK=0` を追加します。
- Gateway WS が TLS を使用する場合は、`--tls`／`--tls-fingerprint` を追加します。

## Mac Node モード

- macOS メニューバーアプリは Node として Gateway WS サーバーに接続します（そのため、この Mac に対して `openclaw nodes …` を使用できます）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

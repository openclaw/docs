---
read_when:
    - iOS/watchOS/Android Node を Gateway にペアリングする
    - エージェントのコンテキストにNodeのキャンバス／カメラを使用する
    - 新しいNodeコマンドまたはCLIヘルパーの追加
summary: Node：ペアリング、機能、権限、および canvas/camera/screen/device/notifications/system 用 CLI ヘルパー
title: ノード
x-i18n:
    generated_at: "2026-07-12T14:34:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59e34e93ec38c69d0cee274d2366eef22c6ff6619a8aea3c2d4a75721865b72
    source_path: nodes/index.md
    workflow: 16
---

**Node** は、`role: "node"` で Gateway に接続し、`node.invoke` を介してコマンドサーフェス（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS/iOS/watchOS/Android/ヘッドレス）です。ほとんどの Node は、オペレーターポート上の Gateway WebSocket を使用します。オプションの Apple Watch 直接接続 Node は、watchOS が通常のアプリによる汎用的な低レベルネットワーク通信をブロックするため、同じポートで署名付き HTTPS ポーリングを使用します。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL。現在の Node については履歴参照のみ）。

macOS は **Node モード**でも実行できます。メニューバーアプリが Gateway の WS サーバーに接続し、ローカルの canvas/camera コマンドを Node として公開します（そのため、この Mac に対して `openclaw nodes …` を使用できます）。リモート Gateway モードでは、ブラウザ自動化はネイティブアプリの Node ではなく、CLI Node ホスト（`openclaw node run` またはインストール済みの Node サービス）が処理します。

Node は Gateway ではなく**周辺機器**です。Node は Gateway サービスを実行せず、チャンネルメッセージ（Telegram、WhatsApp など）は Node ではなく Gateway に届きます。

トラブルシューティング手順書: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリングとステータス

Node は**デバイスペアリング**を使用します。Node は接続時に署名付きデバイス ID を提示し、Gateway は `role: node` のデバイスペアリングリクエストを作成します。デバイス CLI（または UI）から承認してください。Apple Watch 直接接続のセットアップでは、管理者が発行する有効期間の短い Node 専用セットアップコードを使用して、固定された低リスクのコマンドサーフェスを承認します。その後のケイパビリティ拡張には、引き続き通常の承認が必要です。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

保留中のペアリングリクエストは、デバイスの最後の再試行から 5 分後に期限切れになります。再接続を続けるデバイスでは、数分おきに新しいプロンプトを発行する代わりに、1 件の保留中リクエスト（および `requestId`）が維持されます。リクエストから承認までのライフサイクル全体については、[Node のペアリング](/ja-JP/gateway/pairing)を参照してください。Node が変更された認証情報（ロール/スコープ/公開鍵）で再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。クライアントは置き換えられたリクエストについて `device.pair.resolved` イベントを受信するため、承認前に `openclaw devices list` を再実行してください。

- `nodes status` は、デバイスペアリングのロールに `node` が含まれている場合、その Node を**ペアリング済み**として表示します。
- アクセシビリティ権限を持つ接続済みのネイティブ Mac は、統合された
  物理入力アクティビティを報告できます。Gateway は、条件を満たす最新の Mac を
  `active` としてマークし、エージェントに安定した Node ID ヒントを提供して、Node 接続
  アラートを遅延フォールバックより先にその Mac へルーティングします。セットアップ、プライバシー、タイミング、
  トラブルシューティングについては、
  [アクティブなコンピューターのプレゼンス](/nodes/presence)を参照してください。
- デバイスペアリングレコードは、承認済みロールを定める永続的な契約です。トークンローテーションはその契約の範囲内で行われ、ペアリング承認で付与されていないロールへペアリング済み Node を昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、再接続をまたいで Node の承認済みコマンド/ケイパビリティサーフェスを追跡する、Gateway 所有の独立した Node ペアリングストアです。これはトランスポート認証を制御**しません**。トランスポート認証を制御するのはデバイスペアリングです。
- `openclaw nodes remove --node <id|name|ip>` は Node ペアリングを削除します。デバイスベースの Node では、ペアリング済みデバイスストアにあるデバイスの `node` ロールを取り消し、そのデバイスの Node ロールセッションを切断します。複数ロールを持つデバイスでは行を維持して `node` ロールのみを失い、Node 専用デバイスの行は削除されます。また、独立した Node ペアリングストアから一致するエントリも削除されます。`operator.pairing` は、ほかのデバイス上にあるオペレーター以外の Node 行を削除できます。複数ロールを持つデバイスで、デバイストークンの呼び出し元が自身の Node ロールを取り消す場合は、さらに `operator.admin` が必要です。
- 承認スコープは、保留中リクエストで宣言されたコマンドに従います。
  - コマンドなしのリクエスト: `operator.pairing`
  - exec 以外の Node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## バージョン差異とアップグレード順序

Gateway WebSocket は、N-1 のプロトコル範囲にある認証済み Node クライアントを受け入れます。
したがって、現在の v4 Gateway は、接続時に
`role: "node"` と `client.mode: "node"` の両方が宣言されている場合、v3 Node を受け入れます。オペレーターおよび UI セッションでは、
引き続き現在のプロトコルを使用する必要があります。

段階的にフリートをアップグレードする場合は、最初に Gateway をアップグレードし、次に各 Node をアップグレードしてください。
N-1 の Node はアップグレード中も表示および管理が可能です。Gateway は、
アップグレードの推奨とともに `legacy node protocol accepted` をログに記録します。ペアリング、
デバイス認証、コマンド許可リスト、および exec 承認は引き続き適用されます。
Plugin 所有のケイパビリティとコマンドは、Node が
現在のプロトコルにアップグレードされるまで非表示のままです。N-1 より古い Node は、
再接続する前に帯域外でアップグレードする必要があります。

watchOS の直接 HTTPS トランスポートには、現在のプロトコルバージョンが必要です。直接モードを有効にする前に、
Gateway とあわせて Watch アプリを更新してください。

## リモート Node ホスト（system.run）

Gateway をあるマシンで実行し、別のマシンでコマンドを実行したい場合は、**Node ホスト**を使用します。モデルは引き続き **Gateway** と通信します。`host=node` が選択されている場合、Gateway は `exec` 呼び出しを **Node ホスト**へ転送します。

| ロール       | 責任                                                             |
| ------------ | ---------------------------------------------------------------- |
| Gateway ホスト | メッセージを受信し、モデルを実行して、ツール呼び出しをルーティングします。 |
| Node ホスト  | Node マシン上で `system.run`/`system.which` を実行します。       |
| 承認         | Node ホスト上で `~/.openclaw/exec-approvals.json` を介して適用されます。 |

承認に関する注意:

- 承認に基づく Node 実行は、正確なリクエストコンテキストにバインドされます。exec パスは承認前に正規の `systemRunPlan` を準備します。承認後、Gateway は後から呼び出し元によって編集されたコマンド/cwd/セッションフィールドではなく、保存済みのプランを転送し、実行前に作業ディレクトリを再検証します。
- シェル/ランタイムによるファイルの直接実行では、OpenClaw は具体的なローカルファイルオペランド 1 件もベストエフォートでバインドし、実行前にそのファイルが変更された場合は実行を拒否します。
- インタープリター/ランタイムコマンドについて、具体的なローカルファイルを正確に 1 件特定できない場合、OpenClaw はランタイム全体を保護できるように装うのではなく、承認に基づく実行を拒否します。より広範なインタープリターセマンティクスには、サンドボックス、別個のホスト、または明示的に信頼された許可リスト/完全なワークフローを使用してください。

### Node ホストを起動する（フォアグラウンド）

Node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` は、`--context-path`（Gateway WS コンテキストパス）、`--tls`、`--tls-fingerprint <sha256>`、`--node-id`（レガシークライアントインスタンス ID の上書き。ペアリングはリセットされません）も受け入れます。

### SSH トンネル経由のリモート Gateway（ループバックバインド）

Gateway がループバックにバインドされている場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、リモート Node ホストは直接接続できません。SSH トンネルを作成し、Node ホストの接続先をトンネルのローカル側に設定してください。

例（Node ホスト -> Gateway ホスト）:

```bash
# ターミナル A（実行したままにする）: ローカル 18790 -> Gateway 127.0.0.1:18789 に転送
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# ターミナル B: Gateway トークンをエクスポートし、トンネル経由で接続
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注:

- `openclaw node run` は、トークン認証またはパスワード認証をサポートします。
- 環境変数の使用を推奨します: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定のフォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、リモート優先順位ルールに従って `gateway.remote.token` / `gateway.remote.password` を使用できます。
- アクティブなローカル `gateway.auth.*` SecretRef が設定されているものの解決できない場合、Node ホスト認証はフェイルクローズします。
- Node ホストの認証情報解決では、`OPENCLAW_GATEWAY_*` 環境変数のみが使用されます。

### Node ホストを起動する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` は、`--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`（レガシークライアントインスタンス ID のみ）、`--runtime <node|bun>`（デフォルト: node）、および再インストール用の `--force` も受け入れます。`node status`、`node stop`、`node uninstall` も使用できます。

### ペアリングと名前付け

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node が変更された認証情報で再試行する場合は、`openclaw devices list` を再実行し、現在の `requestId` を承認してください。

名前付けのオプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（クライアントインスタンス ID および Gateway 接続メタデータとともに、Node 上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway による上書き）。

### Node ホストの MCP サーバー

MCP サーバーは Gateway ではなく、Node マシン上の `openclaw.json` で設定します。

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

ヘッドレス Node ホストはこれらのサーバーを起動してツールを一覧表示し、接続後に
ディスクリプターを公開します。ツール呼び出しは
`mcp.tools.call.v1` を介してその Node に戻ります。Gateway に対応する MCP 設定や JS
Plugin は必要ありません。OAuth MCP サーバーは、この Node ホスト型 v1 パスではサポートされません。

現在の Node ホストは、MCP サーバーが設定されていない場合でも、初回ペアリング時に
組み込みの `mcp.tools.call.v1` コマンドファミリーを宣言します。古い OpenClaw バージョンでペアリングされた Node は、
Node ホストの更新後に 1 回限りのコマンドサーフェスアップグレードを要求する場合があります。
承認済みのコマンドファミリーは変わらないため、その後にサーバーを追加、削除、またはフィルタリングしても、
再ペアリングは必要ありません。Node の MCP 設定変更を適用するには、
`openclaw node run` または `openclaw node restart` を再起動してください。
Node ホストはこの設定を監視しません。

Gateway オペレーターは、Node ホストの MCP ツールを含め、
ペアリング済み Node が公開するエージェント可視のすべてのツールを
`gateway.nodes.pluginTools.enabled: false` で無視できます。
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` のようなコマンドの完全一致による拒否も、
実行をブロックします。

### Node ホストの Skills

Node マシンのアクティブな OpenClaw Skills ディレクトリに Skills をインストールします。
デフォルトは `~/.openclaw/skills` です。`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR`、および
`OPENCLAW_CONFIG_PATH` によって、そのアクティブプロファイルの場所が移動します。Skills については
`OPENCLAW_STATE_DIR` が優先されます。それ以外の場合、`skills/` は
`openclaw config file` が出力するパスと同じ場所にあります。ヘッドレス Node ホストは、
接続後に有効な `SKILL.md` ファイルを公開し、Gateway はその Node が接続されている間のみ、
それらをエージェントの Skills スナップショットに追加します。抽象的な Node ロケーターが
別のプロトコルフィールドを追加せずに 1 つのエントリへマッピングできるように、各 Skill ディレクトリ名は
frontmatter の `name` フィールドと一致する必要があります。

初回の Node ロールペアリングによって、Skill の公開が承認されます。Skills を追加、削除、または
変更しても、再度のペアリングや Gateway の設定変更は必要ありません。
Node の Skill ファイルを変更した後は、`openclaw node run` または `openclaw node restart` を再起動してください。
Node ホストは Skills ディレクトリを監視しません。

Node でホストされるスキルのエントリは、その Node を識別し、実行場所を保持します。スキルファイル、相対パスで参照されるファイル、バイナリは、その Node 上に残ります。エージェントは、通常の `read` ツールを使用して、通知された `node://.../SKILL.md` の場所を読み取ります。`file_fetch` が受け付けるのは、オペレーターが承認した Node の絶対パスであり、Node のスキルロケーターではありません。通常の read ツールがないランタイムでは、代わりに、通知された `node://.../skills/<name>` ディレクトリを `workdir` として、`exec host=node node=<node-id>` 経由で `cat SKILL.md` を実行できます。参照されるファイルとバイナリでは、同じ exec ターゲットと workdir を使用します。Node ホストは、そのロケーターを自身のアクティブな OpenClaw 状態ディレクトリに対して解決するため、相対パスは Gateway マシンではなく Node 上で解決されます。公開元の Node では `system.run` が承認されている必要があり、エージェントの exec ポリシーで `host=node` が許可されている必要があります。そうでない場合、そのスキルはエージェントのスナップショットに含まれません。

公開を停止するには、Node で `nodeHost.skills.enabled: false` を設定します。Gateway オペレーターは、`gateway.nodes.skills.enabled: false` を設定することで、ペアリングされたすべての Node からのスキルを無視できます。

### ヘッドレス ID の状態

ヘッドレス Node は、3 つの個別の状態ファイルを保持します。

- `~/.openclaw/node.json`: レガシーのクライアントインスタンス ID（`nodeId` として保存）、表示名、Gateway 接続メタデータ。
- `~/.openclaw/identity/device.json`: 署名付きデバイスキーペアと、そこから導出された暗号学的デバイス ID。
- `~/.openclaw/identity/device-auth.json`: 暗号学的デバイス ID とロールをキーとする、ペアリング済みデバイス認証トークン。

署名付き Node では、Gateway はペアリングと Node ルーティングに暗号学的デバイス ID を使用します。クライアントインスタンス ID は接続メタデータにすぎません。そのため、`--node-id` を変更したり、`node.json` だけを削除したりしても、ペアリングはリセットされません。サポートされる取り消しと再ペアリングの手順、およびアップグレードに関する注意事項については、[ID とペアリング状態](/ja-JP/cli/node#identity-and-pairing-state)を参照してください。

### コマンドを許可リストに追加する

exec の承認は **Node ホストごと**に行われます。Gateway から許可リストのエントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認情報は Node ホストの `~/.openclaw/exec-approvals.json` に保存されます。

### exec の実行先を Node にする

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

設定後、`host=node` を指定したすべての `exec` 呼び出しは、Node の許可リストと承認に従って Node ホスト上で実行されます。

`host=auto` が暗黙的に Node を選択することはありませんが、呼び出しごとに明示的に `host=node` を指定することは `auto` からも許可されます。Node での exec をセッションのデフォルトにする場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定します。

関連項目:

- [Node ホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec の承認](/ja-JP/tools/exec-approvals)

### ローカルモデル推論

デスクトップまたはサーバーの Node は、その Node 上で動作する Ollama サーバーからチャット対応モデルを公開できます。エージェントは Ollama Plugin の `node_inference` ツールを使用して、インストール済みモデルを検出し、制限付きプロンプトをリモートで実行します。Gateway から Ollama への直接のネットワークアクセスは不要です。セットアップ、モデルのフィルタリング、直接検証するためのコマンドについては、[Ollama の Node ローカル推論](/ja-JP/providers/ollama#node-local-inference)を参照してください。

### Codex のセッションとトランスクリプト

公式の `codex` Plugin は、ヘッドレス Node ホストまたはネイティブ macOS Node 上にある、アーカイブされていない Codex セッションを公開できます。カタログへの登録は `supervision.enabled` に依存しなくなりました。このオプションは、エージェント向けの監督ツールを制御します。Plugin は引き続き両方のコンピューターでアクティブである必要があり、Node の設定はローカルでの同意として機能します。Gateway 側だけで有効にしても、別のコンピューターの Codex 状態を読み取ることはできません。

Node は、バージョン付きの読み取り専用コマンド `codex.appServer.threads.list.v1` および `codex.appServer.thread.turns.list.v1` を通知します。これらのコマンドが初めて表示されたときに、Node のペアリングアップグレードを承認してください。Gateway は通常の Plugin Node ポリシーを介してこれらを呼び出し、障害をホストごとに分離します。

ペアリングされた Node の行は、通常のセッションサイドバーに **Codex** グループとして表示されます。行を選択すると通常の Chat ペインが開き、完全な項目投影を使用した、上限付きのカーソルページネーション形式の `thread/turns/list` 呼び出しを通じて、永続化されたトランスクリプトを読み取ります。Node の呼び出しトランスポートはリクエスト/レスポンス専用であり、Codex ハーネスを通じてネイティブスレッドを続行するために必要なストリーミングターン、ライブイベント、承認を伝送できません。そのため、リモート行では **Continue** と **Archive** を使用できません。Gateway コンピューターでは、保存済みまたはアイドル状態の行から、モデルが固定された個別の Chat ブランチを開始できます。いずれの行も、他の Codex クライアントが使用していないことをオペレーターが確認した後にのみアーカイブできます。保存済み行のライブアクティビティは不明なままです。アクティブな行では、ブランチの作成もアーカイブもできません。

セットアップ、ページネーション、ローカルでの続行、メタデータのセキュリティ境界については、[Codex セッションを監督する](/plugins/codex-supervision)を参照してください。

### Claude のセッションとトランスクリプト

バンドルされている `anthropic` Plugin は、Gateway およびペアリングされた Node 上にある、アーカイブされていない Claude CLI と Claude Desktop のセッションを検出します。Codex の監督とは異なり、個別のオプトインは不要です。リモートの macOS アプリ Node は、Anthropic Plugin が有効で `~/.claude/projects/` が存在する場合、`anthropic.claude.sessions.list.v1` と `anthropic.claude.sessions.read.v1` を通知します。これらのコマンドが初めて表示されたときに、Node のペアリングアップグレードを承認してください。

カタログは、有効な Claude CLI プロジェクトインデックスレコードと、現在の `sdk-cli` JSONL ファイルから取得した上限付きのメタデータプレフィックスを組み合わせます。Claude Desktop のローカルメタデータは、Desktop のタイトルとアーカイブ状態を提供します。両方のソースが同じ Claude Code セッション ID を参照する場合は、Desktop のメタデータが優先されます。CLI にはアーカイブフラグがないため、CLI のみに存在するトランスクリプトも引き続き表示されます。トランスクリプトの読み取りでは、不透明なバイトオフセットカーソルと上限付きの後方ファイル読み取りを使用するため、大きなセッションを選択したり古いページを読み込んだりしても、JSONL の履歴全体が 1 つの Gateway レスポンスに読み込まれることはありません。

両方の Node コマンドは読み取り専用です。これらは、`operator.write` を持つ認証済みオペレーター接続に対して、汎用の `sessions.catalog.list` および `sessions.catalog.read` メソッドを通じてのみ、カタログメタデータとトランスクリプトの内容を公開します。ペアリングされた Node の行は表示専用のままです。Gateway ローカルの Claude CLI の行は、通常の Chat コンポーザーから引き継ぐことができます。OpenClaw は上限付きの表示履歴をインポートし、最初のターンで `--fork-session` を使用して再開し、元のトランスクリプトには変更を加えません。Claude Desktop の行は表示専用のままです。

Control UI の動作とストレージソースについては、[Anthropic: コンピューター間の Claude セッション](/ja-JP/providers/anthropic#claude-sessions-across-computers)を参照してください。

## コマンドの呼び出し

低レベル（生の RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` は `system.run` と `system.run.prepare` をブロックします。これらのコマンドは、`host=node` を指定した `exec` ツールを通じてのみ実行されます（上記参照）。一般的な「エージェントに MEDIA 添付ファイルを渡す」ワークフロー（canvas、camera、screen、location、後述）には、より高レベルのヘルパーが用意されています。

## コマンドポリシー

Node コマンドを呼び出すには、その前に 2 つのゲートを通過する必要があります。

1. Node が、認証済み接続メタデータ（`connect.commands`）でそのコマンドを宣言している必要があります。
2. Gateway の、プラットフォームと承認から導出された許可リストに、宣言されたコマンドが含まれている必要があります。

プラットフォームごとのデフォルトの許可リスト（Plugin のデフォルト、および `allowCommands`/`denyCommands` による上書きの適用前）:

| プラットフォーム | デフォルトで許可されるコマンド                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（`system.run` などの Node ホストコマンドは承認によって制御されます。下記参照）                                                                                                                                                                                                                                  |

これらの行は Gateway ポリシーの上限を示すものであり、すべての Node アプリによって実装されているコマンドを示すものではありません。コマンドを使用できるのは、接続された Node もそのコマンドを宣言している場合に限られます。特に、現在の macOS アプリは、macOS ポリシーの行に記載されているデバイスおよび個人データ関連のコマンド群を宣言していません。

`canvas.*` コマンド（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）は、iOS、Android、macOS、Windows、および不明なプラットフォーム（Linux を除く）で Plugin のデフォルトとして設定されています。iOS では、これらすべてがフォアグラウンドでの実行に制限されます。

`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` は、プラットフォームラベルに関係なく、`talk` ケイパビリティを通知するか、`talk.*` コマンドを宣言するすべての Node でデフォルトで許可されます。

デスクトップホストコマンド（`system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`mcp.tools.call.v1`、および macOS/Windows の `screen.snapshot`）は、上記の静的なプラットフォーム別デフォルト表には含まれません。これらのコマンドを宣言するペアリング要求をオペレーターが承認すると使用可能になり、その後は Node の承認済みコマンドセットに保持され、再接続時にも引き継がれます。

危険性が高いコマンドやプライバシーへの影響が大きいコマンドは、Node が宣言している場合でも、`gateway.nodes.allowCommands` による明示的なオプトインが必要です。対象は `camera.snap`、`camera.clip`、`screen.record`、`computer.act`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search` です。`gateway.nodes.denyCommands` は、デフォルトおよび追加の許可リストエントリより常に優先されます。デスクトップ入力に関する追加の macOS、ツールポリシー、有効化ゲートについては、[コンピューター操作](/nodes/computer-use)を参照してください。

Plugin が所有する Node コマンドは、Gateway の Node 呼び出しポリシーを追加できます。このポリシーは許可リストのチェック後、Node へ転送する前に実行されるため、生の `node.invoke`、CLI ヘルパー、専用のエージェントツールで同じ Plugin 権限境界が共有されます。危険な Plugin Node コマンドには、引き続き明示的な `gateway.nodes.allowCommands` のオプトインが必要です。

Node が宣言済みコマンドリストを変更した後は、古いデバイスのペアリングを拒否し、新しいリクエストを承認して、Gateway に更新済みのコマンドスナップショットを保存させてください。

## 設定（`openclaw.json`）

Node 関連の設定は `gateway.nodes` と `tools.exec` にあります。

```json5
{
  gateway: {
    nodes: {
      // 信頼済みネットワーク（CIDR リスト）からの初回 Node ペアリングを自動承認します。
      // 未設定の場合は無効です。要求されたスコープがない初回の role:node
      // リクエストにのみ適用され、アップグレードは自動承認しません。
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // SSH 検証済みの自動承認（デフォルト: 有効）。SSH 経由で読み戻した
        // デバイスキーが完全一致した場合、初回の Node ペアリングを承認します。
        sshVerify: true,
      },
      // ペアリング済み Node が公開する、エージェントに表示される Plugin ツールを信頼します（デフォルト: true）。
      pluginTools: {
        enabled: true,
      },
      // 危険な、またはプライバシーへの影響が大きい Node コマンド（camera.snap など）をオプトインします。
      allowCommands: ["camera.snap", "screen.record"],
      // デフォルトまたは allowCommands に含まれていても、完全一致するコマンド名をブロックします。
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // デフォルトの exec ホスト: "node" は、すべての exec 呼び出しをペアリング済み Node にルーティングします。
      host: "node",
      // Node exec のセキュリティモード: 承認済みまたは許可リスト登録済みのコマンドのみ許可します。
      security: "allowlist",
      // exec を特定の Node（ID または名前）に固定します。任意の Node を許可する場合は省略します。
      node: "build-node",
    },
  },
}
```

Node コマンド名は完全一致で指定してください。プラットフォームのデフォルトまたは `allowCommands` エントリによって許可される場合でも、`denyCommands` はそのコマンドを除外します。ペアリング済み Node はデフォルトで、エージェントに表示される Plugin ツール記述子を公開できますが、各記述子のコマンドは引き続き Node の承認済みコマンド範囲に含まれている必要があります。このような記述子をすべて無視するには、`gateway.nodes.pluginTools.enabled: false` を設定します。Gateway の Node ペアリングおよびコマンドポリシーフィールドの詳細については、[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

エージェントごとの exec Node オーバーライド:

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

CLI ヘルパー（一時ファイルに書き込み、保存先のパスを出力します）:

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas の操作

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注:

- `canvas present` は URL またはローカルファイルパス（`--target`）を受け付け、配置用の `--x/--y/--width/--height` も任意で指定できます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- モバイル Node は、アクション対応のレンダリングにアプリ所有の同梱 A2UI ページを使用します。
- A2UI v0.8 JSONL のみがサポートされます（v0.9/createSurface は拒否されます）。
- iOS と Android はリモートの Gateway Canvas ページをレンダリングしますが、A2UI ボタンアクションは、アプリ所有の同梱 A2UI ページからのみディスパッチされます。Gateway がホストする HTTP/HTTPS A2UI ページは、これらのモバイルクライアントではレンダリング専用です。
- macOS は、アプリによって選択された、機能スコープが完全に一致する Gateway A2UI ページからアクションをディスパッチできます。その他の HTTP/HTTPS ページはレンダリング専用のままです。

## 写真と動画（Node カメラ）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # デフォルト: 前面と背面の両方（2 MEDIA 行）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注:

- `canvas.*` と `camera.*` を使用するには、Node が**フォアグラウンドにある**必要があります（バックグラウンドからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- Node は base64 ペイロードを扱いやすいサイズに保つため、クリップの長さを制限します（プラットフォームごとの正確な制限については、[カメラキャプチャ](/ja-JP/nodes/camera)を参照してください）。さらに、`nodes` エージェントツールは呼び出しを転送する前に、要求された `durationMs` を 300000（5 分）に制限します。Node 自体は、より厳しい制限を適用します。
- Android は、可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を求めるプロンプトを表示します。権限が拒否されると `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（Node）

対応する Node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` を使用できるかどうかは、Node のプラットフォームによって異なります。
- `nodes` エージェントツールは、要求された `durationMs` を 300000（5 分）に制限します。Node は返されるペイロードのサイズを制限するため、さらに厳しい制限を適用する場合があります。
- `--no-audio` は、対応するプラットフォームでマイク録音を無効にします。
- 複数の画面が使用可能な場合は、`--screen <index>` を使用してディスプレイを選択します（0 = プライマリ）。

## 位置情報（Node）

設定で位置情報が有効になっている場合、Node は `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- 位置情報は**デフォルトでオフ**です。
- 「Always」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには緯度/経度、精度（メートル）、タイムスタンプが含まれます。
- パラメーターとレスポンスの完全な形式、およびエラーコードについては、[位置情報コマンド](/ja-JP/nodes/location-command)を参照してください。

## SMS（Android Node）

ユーザーが **SMS** 権限を付与し、デバイスが電話機能に対応している場合、Android Node は `sms.send` と `sms.search` を公開できます。どちらのコマンドもデフォルトでは危険と見なされます。呼び出せるようにするには、Gateway オペレーターがこれらを `gateway.nodes.allowCommands` に追加する必要もあります（[コマンドポリシー](#command-policy)を参照）。

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

Node でメッセージ送信も可能にする場合にのみ、`sms.send` を別途追加してください。Android の権限と Gateway のコマンド認可は独立しています。端末の権限を付与しても、Gateway ポリシーは変更されません。

低レベル呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- `sms.search` は、`READ_SMS` が付与される前に宣言される場合があります。これにより、呼び出し時に権限診断を返せますが、メッセージの読み取りには引き続きその Android 権限が必要です。
- 電話機能のない Wi-Fi 専用デバイスは、`sms.send` を公開しません。
- `requires explicit gateway.nodes.allowCommands opt-in` エラーは、端末がそのコマンドを宣言しているものの、Gateway オペレーターが認可していないことを意味します。

## デバイスおよび個人データのコマンド

iOS および Android Node は、デフォルトで複数の読み取り専用データコマンドを公開します（[コマンドポリシー](#command-policy)の表を参照）。Android ではさらに、アプリ内の設定によって制御される、より大きなコマンド群も公開されます。

使用可能なコマンド群:

- `device.status`, `device.info` — iOS、Android、Windows。
- `device.permissions`, `device.health`, `device.apps` — Android のみ。`device.apps` には Android Settings で Installed Apps sharing が有効になっている必要があり、デフォルトではランチャーに表示されるアプリを返します。
- `notifications.list`, `notifications.actions` — Android のみ。
- `photos.latest` — iOS、Android。
- `contacts.search` — iOS、Android（デフォルトでは読み取り専用）。`contacts.add` は危険なため、`gateway.nodes.allowCommands` が必要です。
- `calendar.events` — iOS、Android（デフォルトでは読み取り専用）。`calendar.add` は危険なため、`gateway.nodes.allowCommands` が必要です。
- `reminders.list` — iOS、Android（デフォルトでは読み取り専用）。`reminders.add` は危険なため、`gateway.nodes.allowCommands` が必要です。
- `callLog.search` — Android のみ。
- `motion.activity`, `motion.pedometer` — iOS、Android。利用可能なセンサーの機能によって制限されます。

呼び出し例:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## システムコマンド（Node ホスト / Mac Node）

macOS Node は `system.run`、`system.which`、`system.notify`、`system.execApprovals.get/set` を公開します。ヘッドレス Node ホストは `system.run.prepare`、`system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

注:

- `system.run` はペイロードで stdout/stderr/終了コードを返します。
- シェル実行は今後、`host=node` を指定した `exec` ツールを経由します。`nodes` は、明示的な Node コマンド用のダイレクト RPC サーフェスとして引き続き使用されます。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パスでのみ引き続き使用されます。
- exec パスは、承認前に正規の `systemRunPlan` を準備します。承認が付与されると、Gateway はその後に呼び出し元が編集した command/cwd/session フィールドではなく、保存されたプランを転送します。
- `system.notify` は macOS アプリの通知権限の状態に従い、`--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- 認識されない Node の `platform` / `deviceFamily` メタデータには、`system.run` と `system.which` を除外する保守的なデフォルト許可リストが使用されます。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` を使用して明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に制限されます。
- 許可リストモードで常時許可を選択した場合、既知のディスパッチラッパー（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）では、ラッパーのパスではなく内部の実行可能ファイルのパスが永続化されます。安全にラッパーを解除できない場合、許可リストエントリは自動的に永続化されません。
- 許可リストモードの Windows Node ホストでは、`cmd.exe /c` を介したシェルラッパーの実行に承認が必要です（許可リストエントリだけでは、このラッパー形式は自動的に許可されません）。
- Node ホストは `--env` の `PATH` オーバーライドを無視し、コマンドの実行前に、広範かつ継続的に管理されているインタープリター/シェル起動変数のセット（たとえば `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）を削除します。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、Node ホストサービスの環境を設定するか、ツールを標準の場所にインストールしてください。
- macOS Node モードでは、`system.run` は macOS アプリ（Settings → Exec approvals）の exec 承認によって制御されます。確認/許可リスト/完全許可の動作はヘッドレス Node ホストと同じで、拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレス Node ホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制御されます。特に macOS については、下記の[ヘッドレス Node ホスト](#headless-node-host-cross-platform)にある exec ホストルーティング環境変数を参照してください。

## Exec の Node バインディング

複数の Node が利用可能な場合、exec を特定の Node にバインドできます。これにより、`exec host=node` のデフォルト Node が設定されます（エージェントごとに上書きできます）。

グローバルデフォルト：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

任意の Node を許可するには設定を解除します：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 権限マップ

Node は、`node.list` / `node.describe` に `permissions` マップを含めることができます。このマップは権限名（例：`screenRecording`、`accessibility`、`location`）をキーとし、真偽値（`true` = 許可済み）を値とします。

## ヘッドレス Node ホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する**ヘッドレス Node ホスト**（UI なし）を実行できます。これは、Linux/Windows 上、またはサーバーと並行して最小構成の Node を実行する場合に便利です。

起動します：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事項：

- ペアリングは引き続き必要です（Gateway にデバイスのペアリングプロンプトが表示されます）。
- クライアントインスタンスのメタデータ、署名済みデバイス ID、ペアリング認証には、それぞれ別のファイルが使用されます。[ヘッドレス ID の状態](#headless-identity-state)を参照してください。
- Exec 承認は `~/.openclaw/exec-approvals.json` を介してローカルで適用されます（[Exec 承認](/ja-JP/tools/exec-approvals)を参照）。
- macOS では、ヘッドレス Node ホストはデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリの exec ホスト経由にするには `OPENCLAW_NODE_EXEC_HOST=app` を設定します。アプリホストを必須とし、利用できない場合に安全側に失敗させるには、`OPENCLAW_NODE_EXEC_FALLBACK=0` も追加します。
- Gateway WS が TLS を使用する場合は、`--tls` / `--tls-fingerprint` を追加します。

## Mac Node モード

- macOS メニューバーアプリは Node として Gateway WS サーバーに接続します（そのため、この Mac に対して `openclaw nodes …` が機能します）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

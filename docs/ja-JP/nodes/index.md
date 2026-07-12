---
read_when:
    - iOS/watchOS/Android Node を Gateway にペアリングする
    - エージェントコンテキストに Node のキャンバス/カメラを使用する
    - 新しい Node コマンドまたは CLI ヘルパーの追加
summary: Node：ペアリング、機能、権限、および canvas/camera/screen/device/notifications/system 用 CLI ヘルパー
title: Node群
x-i18n:
    generated_at: "2026-07-12T21:25:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c3a13a2b879bef2356a7b28fe207842d64061ba5333f14a1435cc65ae6da85f1
    source_path: nodes/index.md
    workflow: 16
---

**Node** は、`role: "node"` で Gateway に接続し、`node.invoke` を介してコマンドサーフェス（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS/iOS/watchOS/Android/ヘッドレス）です。ほとんどの Node は、オペレーターポート上の Gateway WebSocket を使用します。オプションの Apple Watch 直接接続 Node は、watchOS が通常のアプリによる汎用的な低レベルネットワーキングをブロックするため、同じポート上で署名付き HTTPS ポーリングを使用します。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL。現在の Node については履歴参照のみ）。

macOS は **Node モード**でも実行できます。メニューバーアプリが 1 つの Node として Gateway の
WS サーバーに接続します（そのため、この Mac に対して `openclaw nodes …` が機能します）。アプリは、
`openclaw node run` が使用するものと同じ Node ホストのコマンドサーフェスに、ネイティブの Canvas、カメラ、画面、通知、コンピューター制御コマンドを
追加します。その Mac で 2 つ目の CLI Node を起動しないでください。アプリは対応する CLI Node ホストランタイムを
内部ワーカーとして実行し、唯一の Gateway 接続および Node ID として動作し続けます。

Node は Gateway ではなく**周辺機器**です。Node は Gateway サービスを実行せず、チャンネルメッセージ（Telegram、WhatsApp など）は Node ではなく Gateway に届きます。

トラブルシューティング手順書: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリングとステータス

Node は**デバイスペアリング**を使用します。Node は接続時に署名付きデバイス ID を提示し、Gateway は `role: node` のデバイスペアリング要求を作成します。デバイス CLI（または UI）から承認します。Apple Watch 直接接続のセットアップでは、管理者が発行する短時間有効な Node 専用セットアップコードを使用して、固定された低リスクのコマンドサーフェスを承認します。後で機能を拡張する場合は、引き続き通常の承認が必要です。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

保留中のペアリング要求は、デバイスの最後の再試行から 5 分後に期限切れになります。再接続を続けるデバイスでは、数分ごとに新しいプロンプトを発行する代わりに、1 件の保留中の要求（および `requestId`）が有効なまま維持されます。要求から承認までのライフサイクル全体については、[Node のペアリング](/ja-JP/gateway/pairing)を参照してください。Node が認証情報（ロール/スコープ/公開鍵）を変更して再試行した場合、以前の保留中の要求は置き換えられ、新しい `requestId` が作成されます。クライアントは置き換えられた要求について `device.pair.resolved` イベントを受信するため、承認前に `openclaw devices list` を再実行してください。

- `nodes status` は、デバイスペアリングのロールに `node` が含まれている場合、その Node を**ペアリング済み**として表示します。
- アクセシビリティ権限を持つ接続済みのネイティブ Mac は、統合された
  物理入力アクティビティを報告できます。Gateway は、条件を満たす最新の Mac を
  `active` としてマークし、エージェントに安定した Node ID のヒントを提供し、遅延フォールバックより先に
  Node 接続アラートをその Mac にルーティングします。セットアップ、プライバシー、タイミング、
  トラブルシューティングについては、
  [アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence)を参照してください。
- デバイスペアリングレコードは、承認済みロールに関する永続的な契約です。トークンのローテーションはその契約の範囲内に留まり、ペアリング承認で付与されなかったロールへペアリング済み Node を昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、再接続をまたいで Node の承認済みコマンド/機能サーフェスを追跡する、Gateway が所有する独立した Node ペアリングストアです。これはトランスポート認証を制御**しません**。トランスポート認証はデバイスペアリングが制御します。
- `openclaw nodes remove --node <id|name|ip>` は Node のペアリングを削除します。デバイスに紐づく Node の場合、ペアリング済みデバイスストアにあるそのデバイスの `node` ロールを取り消し、そのデバイスの Node ロールセッションを切断します。複数ロールを持つデバイスは行が保持され、`node` ロールのみを失いますが、Node 専用デバイスの行は削除されます。また、独立した Node ペアリングストアから一致するエントリも削除します。`operator.pairing` は、他のデバイス上にあるオペレーター以外の Node 行を削除できます。複数ロールを持つデバイスで、デバイストークンの呼び出し元が自身の Node ロールを取り消す場合は、追加で `operator.admin` が必要です。
- 承認スコープは、保留中の要求で宣言されたコマンドに従います。
  - コマンドなしの要求: `operator.pairing`
  - exec 以外の Node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## バージョン差異とアップグレード順序

Gateway WebSocket は、N-1 のプロトコル範囲内にある認証済み Node クライアントを受け入れます。
したがって、現在の v4 Gateway は、接続で
`role: "node"` と `client.mode: "node"` の両方が宣言されている場合、v3 Node を受け入れます。オペレーターおよび UI セッションでは、
引き続き現在のプロトコルを使用する必要があります。

段階的なフリートアップグレードでは、最初に Gateway をアップグレードし、その後に各 Node をアップグレードします。
N-1 の Node は、アップグレード中も表示および管理できます。Gateway は、アップグレードの推奨とともに
`legacy node protocol accepted` をログに記録します。ペアリング、
デバイス認証、コマンド許可リスト、および exec 承認は引き続き適用されます。
Plugin が所有する機能とコマンドは、Node が
現在のプロトコルへアップグレードされるまで非表示のままです。N-1 より古い Node は、
再接続する前に帯域外でアップグレードする必要があります。

watchOS の直接 HTTPS トランスポートには現在のプロトコルバージョンが必要です。直接モードを有効にする前に、
Gateway とともに Watch アプリを更新してください。

## リモート Node ホスト（system.run）

Gateway をあるマシンで実行し、別のマシンでコマンドを実行したい場合は、**Node ホスト**を使用します。モデルは引き続き **Gateway** と通信し、`host=node` が選択されている場合、Gateway が `exec` 呼び出しを **Node ホスト**へ転送します。

| ロール       | 担当                                                               |
| ------------ | ------------------------------------------------------------------ |
| Gateway ホスト | メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。 |
| Node ホスト    | Node マシン上で `system.run`/`system.which` を実行します。          |
| 承認          | Node ホスト上の `~/.openclaw/exec-approvals.json` を介して適用されます。 |

承認に関する注意:

- 承認に基づく Node での実行は、要求の正確なコンテキストに紐づけられます。exec パスは承認前に正規化された `systemRunPlan` を準備します。承認されると、Gateway は後から呼び出し元が編集したコマンド/cwd/セッションフィールドではなく、保存済みのそのプランを転送し、実行前に作業ディレクトリを再検証します。
- シェル/ランタイムによるファイルの直接実行では、OpenClaw は具体的なローカルファイルオペランド 1 つもベストエフォートで紐づけ、そのファイルが実行前に変更された場合は実行を拒否します。
- インタープリター/ランタイムコマンドについて、OpenClaw が具体的なローカルファイルを正確に 1 つ特定できない場合、ランタイム全体をカバーしているかのように扱わず、承認に基づく実行を拒否します。より広範なインタープリターのセマンティクスには、サンドボックス、別ホスト、または明示的に信頼された許可リスト/完全なワークフローを使用してください。

### Node ホストを起動する（フォアグラウンド）

Node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` は、`--context-path`（Gateway WS コンテキストパス）、`--tls`、`--tls-fingerprint <sha256>`、および `--node-id`（レガシークライアントインスタンス ID を上書き。ペアリングはリセットされません）も受け入れます。

### SSH トンネル経由のリモート Gateway（ループバックバインド）

Gateway がループバックにバインドされている場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、リモート Node ホストは直接接続できません。SSH トンネルを作成し、Node ホストをトンネルのローカル側に接続します。

例（Node ホスト -> Gateway ホスト）:

```bash
# ターミナル A（実行したままにする）: ローカル 18790 -> Gateway 127.0.0.1:18789 に転送
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
- 有効なローカルの `gateway.auth.*` SecretRefs が設定されているものの解決できない場合、Node ホスト認証はフェイルクローズします。
- Node ホストの認証情報解決では、`OPENCLAW_GATEWAY_*` 環境変数のみが使用されます。

### Node ホストを起動する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` は、`--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`（レガシークライアントインスタンス ID のみ）、`--runtime <node|bun>`（デフォルト: node）、および再インストール用の `--force` も受け入れます。`node status`、`node stop`、`node uninstall` も使用できます。

### ペアリングと命名

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node が認証情報を変更して再試行した場合は、`openclaw devices list` を再実行し、現在の `requestId` を承認してください。

命名オプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（クライアントインスタンス ID および Gateway 接続メタデータとともに、Node 上の `~/.openclaw/node.json` に保持されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway による上書き）。

### Node ホスト上の MCP サーバー

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

ヘッドレス Node ホストはこれらのサーバーを起動し、そのツールを一覧化し、接続後に
記述子を公開します。ツール呼び出しは
`mcp.tools.call.v1` を介してその Node に戻ります。Gateway に一致する MCP 設定や JS
Plugin は不要です。OAuth MCP サーバーは、この Node ホスト上の v1 パスではサポートされません。

現在の Node ホストは、MCP サーバーが設定されていない場合でも、初回ペアリング時に
組み込みの `mcp.tools.call.v1` コマンドファミリーを宣言します。古い OpenClaw バージョンでペアリングされた Node は、
Node ホストの更新後にコマンドサーフェスの 1 回限りのアップグレードを要求する場合があります。
その後にサーバーを追加、削除、またはフィルタリングしても、承認済みのコマンドファミリーは変更されないため、
再ペアリングは不要です。Node の MCP 設定変更を適用するには、
`openclaw node run` または `openclaw node restart` を再起動してください。
Node ホストはこの設定を監視しません。

Gateway オペレーターは、
`gateway.nodes.pluginTools.enabled: false` を使用して、Node ホスト上の MCP ツールを含め、ペアリング済み Node が公開するエージェント向けツールをすべて無視できます。
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` のような正確なコマンド拒否設定でも、実行をブロックできます。

### Node ホスト上の Skills

Skills は、Node マシンで有効な OpenClaw Skills ディレクトリ（デフォルトでは
`~/.openclaw/skills`）にインストールします。`OPENCLAW_HOME`、`OPENCLAW_STATE_DIR`、および
`OPENCLAW_CONFIG_PATH` によって、その有効なプロファイルの場所が変わります。Skills については `OPENCLAW_STATE_DIR` が
優先されます。それ以外の場合、`skills/` は
`openclaw config file` が出力するパスと同じ場所にあります。ヘッドレス Node ホストは
接続後に有効な `SKILL.md` ファイルを公開し、Gateway は
その Node が接続されている間のみ、それらをエージェントの Skills スナップショットに追加します。抽象的な Node ロケーターが
別のプロトコルフィールドを追加せずに 1 つのエントリへマッピングできるように、各 Skills ディレクトリ名は frontmatter の `name`
フィールドと一致する必要があります。

初回の Node ロールペアリングで Skills の公開が承認されます。Skills の追加、削除、または
変更に、別のペアリングや Gateway 設定の変更は必要ありません。
Node の Skills ファイルを変更した後は、`openclaw node run` または `openclaw node restart` を再起動してください。
Node ホストは Skills ディレクトリを監視しません。

Node でホストされるスキルエントリは、その Node を識別し、実行場所を保持します。スキルファイル、相対パスで参照されるファイル、バイナリはその Node 上に残ります。エージェントは通常の `read` ツールを使用して、通知された `node://.../SKILL.md` の場所を読み取ります。`file_fetch` はオペレーターが承認した Node の絶対パスを受け付けますが、Node スキルロケーターは受け付けません。通常の read ツールがないランタイムでは、代わりに、通知された `node://.../skills/<name>` ディレクトリを `workdir` として、`exec host=node node=<node-id>` を通じて `cat SKILL.md` を実行できます。参照されるファイルとバイナリは、同じ exec ターゲットと workdir を使用します。Node ホストは、そのロケーターをアクティブな OpenClaw 状態ディレクトリに対して解決するため、相対パスは Gateway マシンではなく Node 上で解決されます。公開元の Node では `system.run` が承認されている必要があり、エージェントの exec ポリシーでは `host=node` が許可されている必要があります。それ以外の場合、そのスキルはエージェントのスナップショットに含まれません。

公開を停止するには、Node で `nodeHost.skills.enabled: false` を設定します。Gateway オペレーターは、`gateway.nodes.skills.enabled: false` を使用して、ペアリング済みのすべての Node からのスキルを無視できます。

### ヘッドレス ID の状態

ヘッドレス Node は、3 つの個別の状態ファイルを保持します。

- `~/.openclaw/node.json`: 従来のクライアントインスタンス ID（`nodeId` として保存）、表示名、および Gateway 接続メタデータ。
- `~/.openclaw/identity/device.json`: 署名済みデバイスキーペアと、そこから導出された暗号学的デバイス ID。
- `~/.openclaw/identity/device-auth.json`: 暗号学的デバイス ID とロールをキーとする、ペアリング済みデバイス認証トークン。

署名済み Node の場合、Gateway はペアリングと Node ルーティングに暗号学的デバイス ID を使用します。クライアントインスタンス ID は接続メタデータにすぎません。したがって、`--node-id` を変更したり、`node.json` だけを削除したりしても、ペアリングはリセットされません。サポートされている失効と再ペアリングのフロー、およびアップグレード時の注意事項については、[ID とペアリング状態](/ja-JP/cli/node#identity-and-pairing-state)を参照してください。

### コマンドを許可リストに追加する

Exec の承認は **Node ホストごと** に行われます。Gateway から許可リストエントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認情報は、Node ホスト上の `~/.openclaw/exec-approvals.json` に保存されます。

### exec の実行先を Node に設定する

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

設定後、`host=node` を指定したすべての `exec` 呼び出しは、Node ホスト上で実行されます（Node の許可リストと承認の対象です）。

`host=auto` はそれ自体では暗黙的に Node を選択しませんが、呼び出しごとに明示した `host=node` リクエストは `auto` から許可されます。セッションで Node exec をデフォルトにする場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定します。

関連項目:

- [Node ホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec の承認](/ja-JP/tools/exec-approvals)

### ローカルモデル推論

デスクトップまたはサーバー Node は、その Node 上で稼働する Ollama サーバーからチャット対応モデルを公開できます。エージェントは Ollama Plugin の `node_inference` ツールを使用して、インストール済みモデルを検出し、制限付きプロンプトをリモートで実行します。Gateway から Ollama へ直接ネットワークアクセスする必要はありません。セットアップ、モデルのフィルタリング、および直接検証コマンドについては、[Ollama の Node ローカル推論](/ja-JP/providers/ollama#node-local-inference)を参照してください。

### Codex セッションとトランスクリプト

公式の `codex` Plugin は、ヘッドレス Node ホストまたはネイティブ macOS Node 上にある未アーカイブの Codex セッションを公開できます。カタログ登録は `supervision.enabled` に依存しなくなりました。このオプションは、エージェント向け監視ツールへのアクセスを制御します。Plugin は引き続き両方のコンピューターで有効である必要があり、Node 設定はローカルでの同意として機能します。Gateway だけを有効にしても、別のコンピューターの Codex 状態を読み取ることはできません。

Node は、バージョン管理された読み取り専用の `codex.appServer.threads.list.v1` および `codex.appServer.thread.turns.list.v1` コマンドを通知します。これらのコマンドが初めて表示されたら、Node ペアリングのアップグレードを承認してください。Gateway は通常の Plugin Node ポリシーを通じてこれらを呼び出し、障害をホストごとに分離します。

ペアリング済み Node の行は、通常のセッションサイドバーに **Codex** グループとして表示されます。行を選択すると通常のチャットペインが開き、完全な項目投影を使用した、制限付きでカーソルページネーション対応の `thread/turns/list` 呼び出しを通じて、永続化されたトランスクリプトが読み取られます。Node の invoke トランスポートはリクエスト/レスポンス専用であり、Codex ハーネスを通じてネイティブスレッドを継続するために必要なストリーミングターン、ライブイベント、承認を伝送できません。そのため、リモート行では **続行** と **アーカイブ** は使用できません。Gateway コンピューターでは、保存済みまたはアイドル状態の行から、モデルが固定された別のチャットブランチを開始できます。いずれも、他の Codex クライアントが使用していないことをオペレーターが確認した後にのみアーカイブできます。保存済み行のライブアクティビティは不明なままです。アクティブな行はブランチ化もアーカイブもできません。

セットアップ、ページネーション、ローカルでの継続、およびメタデータのセキュリティ境界については、[Codex セッションを監視する](/ja-JP/plugins/codex-supervision)を参照してください。

### Claude セッションとトランスクリプト

バンドルされた `anthropic` Plugin は、Gateway およびペアリング済み Node 上にある未アーカイブの Claude CLI と Claude Desktop のセッションを検出します。Codex の監視とは異なり、個別のオプトインは必要ありません。Anthropic Plugin が有効で、`~/.claude/projects/` が存在する場合、リモートの macOS アプリ Node は `anthropic.claude.sessions.list.v1` と `anthropic.claude.sessions.read.v1` を通知します。これらのコマンドが初めて表示されたら、Node ペアリングのアップグレードを承認してください。

カタログは、有効な Claude CLI プロジェクトインデックスレコードと、現在の `sdk-cli` JSONL ファイルから取得した制限付きメタデータプレフィックスを統合します。Claude Desktop のローカルメタデータは、Desktop のタイトルとアーカイブ状態を提供します。両方のソースが同じ Claude Code セッション ID を参照している場合は、Desktop メタデータが優先されます。CLI にはアーカイブフラグがないため、CLI のみに存在するトランスクリプトも引き続き表示されます。トランスクリプトの読み取りでは、不透明なバイトオフセットカーソルと制限付きの後方ファイル読み取りを使用するため、大きなセッションを選択したり、古いページを読み込んだりしても、JSONL 履歴全体が 1 つの Gateway レスポンスに読み込まれることはありません。

両方の Node コマンドは読み取り専用です。これらは、`operator.write` を持つ認証済みオペレーター接続に対して、汎用の `sessions.catalog.list` および `sessions.catalog.read` メソッドを通じてのみ、カタログメタデータとトランスクリプト内容を公開します。ペアリング済み Node の行は表示専用のままです。Gateway ローカルの Claude CLI 行は、通常のチャットコンポーザーから引き継ぐことができます。OpenClaw は制限付きの表示履歴をインポートし、最初のターンで `--fork-session` を使用して再開し、ソーストランスクリプトは変更しません。Claude Desktop の行は表示専用のままです。

Control UI の動作とストレージソースについては、[Anthropic: コンピューター間の Claude セッション](/ja-JP/providers/anthropic#claude-sessions-across-computers)を参照してください。

## コマンドの呼び出し

低レベル（生の RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` は `system.run` と `system.run.prepare` をブロックします。これらのコマンドは、`host=node` を指定した `exec` ツールを通じてのみ実行されます（上記を参照）。一般的な「エージェントに MEDIA 添付ファイルを渡す」ワークフロー（canvas、カメラ、画面、位置情報。後述）には、より高レベルのヘルパーが用意されています。

## コマンドポリシー

Node コマンドを呼び出すには、事前に 2 つのゲートを通過する必要があります。

1. Node が、認証済みの接続メタデータ（`connect.commands`）でコマンドを宣言している必要があります。
2. Gateway のプラットフォームおよび承認から導出された許可リストに、宣言されたコマンドが含まれている必要があります。

プラットフォーム別のデフォルト許可リスト（Plugin のデフォルトおよび `allowCommands`/`denyCommands` によるオーバーライド適用前）:

| プラットフォーム | デフォルトで許可されるコマンド                                                                                                                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（`system.run` などの Node ホストコマンドは承認によって制御されます。後述を参照）                                                                                                                                                                                                                     |

これらの行は、すべての Node アプリが実装するコマンドではなく、Gateway ポリシーの上限を示します。コマンドを使用できるのは、接続済み Node もそのコマンドを宣言している場合に限られます。特に、現在の macOS アプリは、macOS ポリシー行に記載されているデバイスおよび個人データのコマンドファミリーを宣言していません。

`canvas.*` コマンド（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）は、iOS、Android、macOS、Windows、および不明なプラットフォーム（Linux を除く）で Plugin のデフォルトです。iOS では、これらすべてがフォアグラウンド実行に制限されます。

`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` は、プラットフォームラベルに関係なく、`talk` ケイパビリティを通知するか、`talk.*` コマンドを宣言するすべての Node でデフォルトで許可されます。

デスクトップホストコマンド（`system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`mcp.tools.call.v1`、および macOS/Windows の `screen.snapshot`）は、上記の静的なプラットフォームデフォルト表には含まれません。これらを宣言するペアリングリクエストをオペレーターが承認すると利用可能になり、その後は Node の承認済みコマンドセットによって、再接続時にも引き継がれます。

危険性が高い、またはプライバシーへの影響が大きいコマンドは、Node が宣言している場合でも、`gateway.nodes.allowCommands` による明示的なオプトインが必要です: `camera.snap`、`camera.clip`、`screen.record`、`computer.act`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` は、常にデフォルトおよび追加の許可リストエントリより優先されます。デスクトップ入力に関する追加の macOS、ツールポリシー、および有効化ゲートについては、[コンピューター操作](/ja-JP/nodes/computer-use)を参照してください。

Plugin が所有する Node コマンドでは、Gateway の Node 呼び出しポリシーを追加できます。このポリシーは許可リストのチェック後、Node への転送前に実行されるため、生の `node.invoke`、CLI ヘルパー、専用のエージェントツールは同じ Plugin 権限境界を共有します。危険な Plugin Node コマンドには、引き続き明示的な `gateway.nodes.allowCommands` のオプトインが必要です。

Node が宣言するコマンドリストを変更した後は、古いデバイスのペアリングを拒否して新しいリクエストを承認し、Gateway に更新済みのコマンドスナップショットを保存させてください。

## 設定（`openclaw.json`）

Node 関連の設定は `gateway.nodes` と `tools.exec` にあります。

```json5
{
  gateway: {
    nodes: {
      // 信頼済みネットワーク（CIDR リスト）からの初回 Node ペアリングを自動承認します。
      // 未設定の場合は無効です。要求されたスコープがない初回の role:node リクエストに
      // のみ適用され、アップグレードは自動承認しません。
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // SSH 検証済み自動承認（デフォルト: 有効）。SSH 経由で読み戻した
        // デバイスキーが完全に一致する場合、初回の Node ペアリングを承認します。
        sshVerify: true,
      },
      // ペアリング済み Node が公開する、エージェントから見える Plugin ツールを信頼します（デフォルト: true）。
      pluginTools: {
        enabled: true,
      },
      // 危険またはプライバシー負荷の高い Node コマンド（camera.snap など）にオプトインします。
      allowCommands: ["camera.snap", "screen.record"],
      // デフォルトまたは allowCommands に含まれていても、完全一致するコマンド名をブロックします。
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // デフォルトの exec ホスト: "node" はすべての exec 呼び出しをペアリング済み Node にルーティングします。
      host: "node",
      // Node exec のセキュリティモード: 承認済みまたは許可リスト登録済みのコマンドのみ許可します。
      security: "allowlist",
      // exec を特定の Node（ID または名前）に固定します。任意の Node を許可する場合は省略します。
      node: "build-node",
    },
  },
}
```

Node コマンド名は完全一致で指定してください。`denyCommands` は、プラットフォームのデフォルトまたは `allowCommands` エントリによって許可される場合でも、コマンドを除外します。ペアリング済み Node は、デフォルトでエージェントから見える Plugin ツール記述子を公開できますが、各記述子のコマンドは引き続き Node の承認済みコマンドサーフェスに含まれている必要があります。このような記述子をすべて無視するには、`gateway.nodes.pluginTools.enabled: false` を設定します。Gateway の Node ペアリングとコマンドポリシーフィールドの詳細については、[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

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

CLI ヘルパー（一時ファイルに書き込み、保存先パスを表示します）:

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

- `canvas present` は URL またはローカルファイルパス（`--target`）を受け付け、配置用にオプションの `--x/--y/--width/--height` も指定できます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- モバイル Node は、アクション対応のレンダリング用に、アプリにバンドルされたアプリ所有の A2UI ページを使用します。
- A2UI v0.8 JSONL のみサポートされます（v0.9/createSurface は拒否されます）。
- iOS と Android はリモートの Gateway Canvas ページをレンダリングしますが、A2UI ボタンアクションがディスパッチされるのは、アプリにバンドルされたアプリ所有の A2UI ページからのみです。Gateway がホストする HTTP/HTTPS A2UI ページは、これらのモバイルクライアントではレンダリング専用です。
- macOS は、アプリが選択した、機能スコープが完全に一致する Gateway A2UI ページからアクションをディスパッチできます。その他の HTTP/HTTPS ページは引き続きレンダリング専用です。

## 写真と動画（Node カメラ）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # デフォルト: 前面と背面の両方（MEDIA 行 2 行）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注:

- `canvas.*` と `camera.*` を使用するには、Node が**フォアグラウンド**にある必要があります（バックグラウンドからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- Node は base64 ペイロードを扱いやすいサイズに保つため、クリップの長さを上限内に制限します（プラットフォームごとの正確な制限については[カメラキャプチャ](/ja-JP/nodes/camera)を参照してください）。さらに、`nodes` エージェントツールは呼び出しを転送する前に、要求された `durationMs` を 300000（5 分）に制限します。Node 自体は、より厳しい制限を適用します。
- Android は可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を要求します。権限が拒否されると `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（Node）

対応する Node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` を利用できるかどうかは、Node のプラットフォームによって異なります。
- `nodes` エージェントツールは、要求された `durationMs` を 300000（5 分）に制限します。返されるペイロードのサイズを抑えるため、Node がさらに厳しい制限を適用する場合があります。
- `--no-audio` は、対応プラットフォームでのマイク音声のキャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します（0 = プライマリ）。

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
- パラメータとレスポンスの完全な形式、およびエラーコードについては、[位置情報コマンド](/ja-JP/nodes/location-command)を参照してください。

## SMS（Android Node）

ユーザーが **SMS** 権限を付与し、デバイスが電話機能をサポートしている場合、Android Node は `sms.send` と `sms.search` を公開できます。どちらのコマンドもデフォルトでは危険として扱われます。呼び出せるようにするには、Gateway オペレーターがこれらを `gateway.nodes.allowCommands` に追加する必要があります（[コマンドポリシー](#command-policy)を参照）。

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

Node からメッセージも送信できるようにする場合に限り、`sms.send` を別途追加してください。Android の権限と Gateway のコマンド認可は独立しています。スマートフォンの権限を付与しても、Gateway ポリシーは編集されません。

低レベル呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- `sms.search` は、呼び出し時に権限診断を返せるように、`READ_SMS` が付与される前でも宣言される場合があります。メッセージの読み取りには、引き続きその Android 権限が必要です。
- 電話機能のない Wi-Fi 専用デバイスは `sms.send` を公開しません。
- `requires explicit gateway.nodes.allowCommands opt-in` エラーは、スマートフォンがコマンドを宣言しているものの、Gateway オペレーターが認可していないことを意味します。

## デバイスおよび個人データのコマンド

iOS と Android の Node は、デフォルトで複数の読み取り専用データコマンドを公開します（[コマンドポリシー](#command-policy)の表を参照）。Android はさらに、独自のアプリ内設定によって制御される、より大きなコマンド群を公開します。

利用可能なコマンド群:

- `device.status`、`device.info` — iOS、Android、Windows。
- `device.permissions`、`device.health`、`device.apps` — Android のみ。`device.apps` には Android Settings で Installed Apps の共有を有効にする必要があり、デフォルトではランチャーに表示されるアプリを返します。
- `notifications.list`、`notifications.actions` — Android のみ。
- `photos.latest` — iOS、Android。
- `contacts.search` — iOS、Android（デフォルトで読み取り専用）。`contacts.add` は危険なため、`gateway.nodes.allowCommands` が必要です。
- `calendar.events` — iOS、Android（デフォルトで読み取り専用）。`calendar.add` は危険なため、`gateway.nodes.allowCommands` が必要です。
- `reminders.list` — iOS、Android（デフォルトで読み取り専用）。`reminders.add` は危険なため、`gateway.nodes.allowCommands` が必要です。
- `callLog.search` — Android のみ。
- `motion.activity`、`motion.pedometer` — iOS、Android。利用可能なセンサーによって機能が制限されます。

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
- シェル実行は `host=node` を指定した `exec` ツール経由になりました。`nodes` は、明示的な Node コマンド用のダイレクト RPC サーフェスとして引き続き使用されます。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パスでのみ使用できます。
- exec パスは、承認前に正規化された `systemRunPlan` を準備します。承認されると、Gateway は、呼び出し元が後から編集した command/cwd/session フィールドではなく、保存されたそのプランを転送します。
- `system.notify` は macOS アプリの通知権限状態に従います。`--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- 認識されない Node の `platform` / `deviceFamily` メタデータには、`system.run` と `system.which` を除外する保守的なデフォルト許可リストが使用されます。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に限定されます。
- 許可リストモードで常時許可を選択した場合、既知のディスパッチラッパー（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）では、ラッパーのパスではなく内部の実行可能ファイルのパスが永続化されます。安全にラッパーを解除できない場合、許可リストエントリは自動的に永続化されません。
- 許可リストモードの Windows Node ホストでは、`cmd.exe /c` を介したシェルラッパー実行に承認が必要です（許可リストエントリだけでは、ラッパー形式は自動許可されません）。
- Node ホストは `--env` の `PATH` オーバーライドを無視し、コマンド実行前に、保守されている多数のインタープリター／シェル起動変数（例: `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）を削除します。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、Node ホストサービスの環境を構成するか、ツールを標準の場所にインストールしてください。
- macOS Node モードでは、`system.run` は macOS アプリの実行承認（Settings → Exec approvals）によって制御されます。確認／許可リスト／完全許可の動作はヘッドレス Node ホストと同じで、拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレス Node ホストでは、`system.run` は実行承認（`~/.openclaw/exec-approvals.json`）によって制御されます。特に macOS については、以下の[ヘッドレス Node ホスト](#headless-node-host-cross-platform)にある exec ホストルーティング環境変数を参照してください。

## exec の Node バインディング

複数の Node が利用可能な場合、exec を特定の Node にバインドできます。これにより `exec host=node` のデフォルト Node が設定されます（エージェントごとに上書きできます）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

任意の Node を許可するには設定を解除します:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 権限マップ

Node は `node.list` / `node.describe` に `permissions` マップを含めることができます。これは権限名（例: `screenRecording`、`accessibility`、`location`）をキーとし、真偽値（`true` = 付与済み）を値とします。

## ヘッドレス Node ホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する**ヘッドレス Node ホスト**（UI なし）を実行できます。これは Linux/Windows、またはサーバーと並行して最小構成の Node を実行する場合に便利です。

起動方法:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注:

- ペアリングは引き続き必要です（Gateway にデバイスのペアリングプロンプトが表示されます）。
- クライアントインスタンスのメタデータ、署名済みデバイス ID、ペアリング認証にはそれぞれ別のファイルが使用されます。[ヘッドレス ID の状態](#headless-identity-state)を参照してください。
- 実行承認は `~/.openclaw/exec-approvals.json` によりローカルで適用されます（[実行承認](/ja-JP/tools/exec-approvals)を参照）。
- macOS では、ヘッドレス Node ホストはデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリの exec ホスト経由でルーティングするには `OPENCLAW_NODE_EXEC_HOST=app` を設定します。アプリホストを必須とし、利用できない場合にフェイルクローズするには、さらに `OPENCLAW_NODE_EXEC_FALLBACK=0` を追加します。
- Gateway WS が TLS を使用する場合は、`--tls` / `--tls-fingerprint` を追加してください。

## Mac Node モード

- macOS メニューバーアプリは Node として Gateway WS サーバーに接続します（そのため、この Mac に対して `openclaw nodes …` が機能します）。
- リモートモードでは、アプリが Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

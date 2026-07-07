---
read_when:
    - iOS/Android ノードを Gateway にペアリングする
    - エージェントコンテキストにノードキャンバス/カメラを使用する
    - 新しいノードコマンドまたは CLI ヘルパーの追加
summary: 'ノード: キャンバス/カメラ/画面/デバイス/通知/システム向けのペアリング、ケイパビリティ、権限、CLI ヘルパー'
title: ノード
x-i18n:
    generated_at: "2026-07-06T21:49:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 942ddfdbd2210c54537fe57d5f50f20f53eaa2478c2ccb81886f2cedd4e9ea73
    source_path: nodes/index.md
    workflow: 16
---

A **ノード**は、Gateway **WebSocket**（オペレーターと同じポート）に `role: "node"` で接続し、`node.invoke` 経由でコマンドサーフェス（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL。現在のノードでは歴史的な用途のみ）。

macOS は **ノードモード**でも実行できます。メニューバーアプリが Gateway の WS サーバーに接続し、ローカルの canvas/camera コマンドをノードとして公開します（そのため `openclaw nodes …` はこの Mac に対して動作します）。リモートゲートウェイモードでは、ブラウザー自動化はネイティブアプリのノードではなく、CLI ノードホスト（`openclaw node run` またはインストール済みノードサービス）によって処理されます。

ノードは Gateway ではなく**周辺機器**です。Gateway サービスは実行せず、チャネルメッセージ（Telegram、WhatsApp など）はノードではなく Gateway に届きます。

トラブルシューティング Runbook: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

WS ノードは**デバイスペアリング**を使用します。ノードは `connect` 時にデバイス ID を提示し、Gateway は `role: node` のデバイスペアリングリクエストを作成します。デバイス CLI（または UI）で承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

保留中のペアリングリクエストは、デバイスの最後の再試行から 5 分後に期限切れになります。再接続を続けるデバイスは、数分ごとに新しいプロンプトを作成するのではなく、保留中のリクエスト（および `requestId`）を維持します。リクエスト/承認/トークンの完全なライフサイクルについては、[Gateway 所有のペアリング](/ja-JP/gateway/pairing)を参照してください。ノードが変更された認証詳細（ロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。クライアントは置き換えられたリクエストに対する `device.pair.resolved` イベントを受け取り、承認前に `openclaw devices list` を再実行する必要があります。

- `nodes status` は、デバイスペアリングロールに `node` が含まれている場合、ノードを**ペアリング済み**としてマークします。
- デバイスペアリングレコードは、承認済みロールの永続的な契約です。トークンローテーションはその契約内にとどまり、ペアリング承認が付与していないロールへペアリング済みノードを昇格することはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、再接続をまたいでノードの承認済みコマンド/機能サーフェスを追跡する、別個の Gateway 所有ノードペアリングストアです。これは WS `connect` ハンドシェイクをゲートしません。デバイスペアリングがそれを行います。
- `openclaw nodes remove --node <id|name|ip>` はノードペアリングを削除します。デバイスに裏付けられたノードの場合、`devices/paired.json` 内のデバイスの `node` ロールを取り消し、そのデバイスのノードロールセッションを切断します。混在ロールのデバイスは行を保持して `node` ロールだけを失い、ノード専用デバイスの行は削除されます。また、別個のノードペアリングストアから一致するエントリも消去します。`operator.pairing` は他のデバイス上の非オペレーターノード行を削除できます。混在ロールデバイスで自分自身のノードロールを取り消すデバイストークン呼び出し元には、追加で `operator.admin` が必要です。
- 承認スコープは、保留中リクエストが宣言したコマンドに従います。
  - コマンドなしリクエスト: `operator.pairing`
  - 非 exec ノードコマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## バージョンスキューとアップグレード順序

Gateway は、N-1 プロトコルウィンドウ内で認証済みノードクライアントを受け入れます。
そのため現在の v4 Gateway は、接続が `role: "node"` と `client.mode: "node"` の両方を宣言している場合に v3 ノードを受け入れます。オペレーターおよび UI セッションは引き続き現在のプロトコルを使用する必要があります。

段階的なフリートアップグレードでは、まず Gateway をアップグレードし、その後で各ノードをアップグレードします。
N-1 ノードはアップグレード中も表示および管理可能です。Gateway はアップグレード推奨とともに `legacy node protocol accepted` をログに記録します。ペアリング、デバイス認証、コマンド許可リスト、exec 承認は引き続き適用されます。
Plugin 所有の機能とコマンドは、ノードが現在のプロトコルにアップグレードされるまで非表示のままです。N-1 より古いノードは、再接続前に帯域外アップグレードが必要です。

## リモートノードホスト（system.run）

Gateway をあるマシンで実行し、別のマシンでコマンドを実行したい場合は、**ノードホスト**を使用します。モデルは引き続き **Gateway** と通信します。`host=node` が選択されている場合、Gateway は `exec` 呼び出しを**ノードホスト**へ転送します。

| ロール         | 責任                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway ホスト | メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。            |
| ノードホスト    | ノードマシン上で `system.run`/`system.which` を実行します。        |
| 承認    | ノードホスト上の `~/.openclaw/exec-approvals.json` で強制されます。 |

承認に関する注意:

- 承認に裏付けられたノード実行は、正確なリクエストコンテキストにバインドされます。exec パスは承認前に正規の `systemRunPlan` を準備します。承認されると、Gateway は後から呼び出し元が編集した command/cwd/session フィールドではなく、その保存済みプランを転送し、実行前に作業ディレクトリを再検証します。
- 直接のシェル/ランタイムファイル実行では、OpenClaw はベストエフォートで 1 つの具体的なローカルファイルオペランドもバインドし、そのファイルが実行前に変更された場合は実行を拒否します。
- OpenClaw がインタープリター/ランタイムコマンドに対して、正確に 1 つの具体的なローカルファイルを識別できない場合、完全なランタイムカバレッジを装うのではなく、承認に裏付けられた実行は拒否されます。より広いインタープリターセマンティクスには、サンドボックス化、分離ホスト、または明示的な信頼済み許可リスト/完全ワークフローを使用してください。

### ノードホストを開始する（フォアグラウンド）

ノードマシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` は `--context-path`（Gateway WS コンテキストパス）、`--tls`、`--tls-fingerprint <sha256>`、`--node-id`（上書きするとペアリングトークンが消去されます）も受け付けます。

### SSH トンネル経由のリモート Gateway（loopback バインド）

Gateway が loopback にバインドしている場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、リモートノードホストは直接接続できません。SSH トンネルを作成し、ノードホストをトンネルのローカル側に向けます。

例（ノードホスト -> Gateway ホスト）:

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意:

- `openclaw node run` はトークンまたはパスワード認証をサポートします。
- 環境変数が推奨されます: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- config フォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、ノードホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、`gateway.remote.token` / `gateway.remote.password` はリモート優先順位ルールに従って候補になります。
- アクティブなローカル `gateway.auth.*` SecretRefs が設定されているが解決されていない場合、ノードホスト認証はフェイルクローズします。
- ノードホスト認証解決は `OPENCLAW_GATEWAY_*` 環境変数のみを尊重します。

### ノードホストを開始する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` は `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`、`--runtime <node|bun>`（デフォルト: node）、再インストール用の `--force` も受け付けます。`node status`、`node stop`、`node uninstall` も利用できます。

### ペアリング + 名前

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードが変更された認証詳細で再試行する場合は、`openclaw devices list` を再実行し、現在の `requestId` を承認します。

命名オプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（ノード上の `~/.openclaw/node.json` に、ノード ID、トークン、Gateway 接続情報とともに永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway 側の上書き）。

### コマンドを許可リストに追加する

Exec 承認は**ノードホストごと**です。Gateway から許可リストエントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認はノードホスト上の `~/.openclaw/exec-approvals.json` にあります。

### exec をノードに向ける

デフォルトを設定します（Gateway config）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごとに:

```text
/exec host=node security=allowlist node=<id-or-name>
```

設定後、`host=node` を指定した任意の `exec` 呼び出しはノードホスト上で実行されます（ノードの許可リスト/承認の対象）。

`host=auto` は単独では暗黙的にノードを選択しませんが、呼び出しごとの明示的な `host=node` リクエストは `auto` から許可されます。セッションでノード exec をデフォルトにしたい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [ノードホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

### ローカルモデル推論

デスクトップまたはサーバーノードは、そのノード上で実行されている Ollama サーバーからチャット対応モデルを公開できます。エージェントは Ollama Plugin の `node_inference` ツールを使用して、インストール済みモデルを検出し、制限付きプロンプトをリモートで実行します。Gateway が Ollama に直接ネットワークアクセスできる必要はありません。セットアップ、モデルフィルタリング、直接検証コマンドについては、[Ollama ノードローカル推論](/ja-JP/providers/ollama#node-local-inference)を参照してください。

## コマンドの呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` は `system.run` と `system.run.prepare` をブロックします。これらのコマンドは `host=node` を指定した `exec` ツール経由でのみ実行されます（上記参照）。一般的な「エージェントに MEDIA 添付を渡す」ワークフロー（canvas、camera、screen、location、下記）には、より高レベルなヘルパーがあります。

## コマンドポリシー

ノードコマンドは、呼び出し可能になる前に 2 つのゲートを通過する必要があります。

1. ノードが WebSocket `connect.commands` リストでそのコマンドを宣言している必要があります。
2. Gateway のプラットフォームおよび承認由来の許可リストに、宣言されたコマンドが含まれている必要があります。

プラットフォーム別のデフォルト許可リスト（Plugin デフォルトおよび `allowCommands`/`denyCommands` 上書きの前）:

| プラットフォーム | デフォルトで許可されるコマンド                                                                                                                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（`system.run` のようなノードホストコマンドは承認ゲート付き。下記参照）                                                                                                                                                                                                                                  |

`canvas.*` コマンド（`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`）は、iOS、Android、macOS、Windows、および不明なプラットフォーム（Linux 以外）では Plugin のデフォルトです。iOS ではこれらすべてがフォアグラウンドに制限されます。

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once` は、プラットフォームラベルに関係なく、`talk` ケイパビリティを公開している、または `talk.*` コマンドを宣言している任意のノードでデフォルトで許可されます。

デスクトップホストコマンド（macOS/Windows の `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `screen.snapshot`）は、上記の静的なプラットフォームデフォルト表には含まれません。これらを宣言するペアリング要求をオペレーターが承認すると利用可能になり、その後はノードの承認済みコマンドセットが再接続時にもそれらを引き継ぎます。

危険なコマンドやプライバシーに大きく関わるコマンドは、ノードが宣言している場合でも、引き続き `gateway.nodes.allowCommands` による明示的なオプトインが必要です: `camera.snap`, `camera.clip`, `screen.record`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`。`gateway.nodes.denyCommands` は、デフォルトや追加の allowlist エントリより常に優先されます。

Plugin 所有のノードコマンドは、Gateway のノード呼び出しポリシーを追加できます。このポリシーは allowlist チェックの後、ノードへの転送前に実行されるため、生の `node.invoke`、CLI ヘルパー、専用エージェントツールは同じ Plugin 権限境界を共有します。危険な Plugin ノードコマンドには、引き続き明示的な `gateway.nodes.allowCommands` オプトインが必要です。

ノードが宣言済みコマンドリストを変更した後は、古いデバイスペアリングを拒否し、新しい要求を承認して、Gateway が更新済みコマンドスナップショットを保存するようにしてください。

## 設定 (`openclaw.json`)

ノード関連の設定は `gateway.nodes` と `tools.exec` の下にあります。

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

正確なノードコマンド名を使用してください。`denyCommands` は、プラットフォームデフォルトや `allowCommands` エントリが本来許可する場合でも、そのコマンドを削除します。Gateway ノードペアリングとコマンドポリシーフィールドの詳細は、[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

エージェント単位の exec ノードオーバーライド:

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

## スクリーンショット（canvas スナップショット）

ノードが Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルに書き込み、保存先パスを出力）:

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

注記:

- `canvas present` は URL またはローカルファイルパス（`--target`）を受け付け、配置用の任意の `--x/--y/--width/--height` も受け付けます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注記:

- モバイルノードは、アクション対応レンダリングのために、バンドルされたアプリ所有の A2UI ページを使用します。
- A2UI v0.8 JSONL のみがサポートされます（v0.9/createSurface は拒否されます）。
- iOS と Android はリモート Gateway Canvas ページをレンダリングしますが、A2UI ボタンアクションはバンドルされたアプリ所有の A2UI ページからのみディスパッチされます。Gateway がホストする HTTP/HTTPS A2UI ページは、これらのモバイルクライアントではレンダリング専用です。

## 写真 + 動画（ノードカメラ）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注記:

- `canvas.*` と `camera.*` では、ノードが**フォアグラウンド**にある必要があります（バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- ノードは base64 ペイロードを扱いやすく保つためにクリップ時間を制限します（プラットフォームごとの正確な制限は[カメラキャプチャ](/ja-JP/nodes/camera)を参照）。`nodes` エージェントツールはさらに、要求された `durationMs` を、呼び出しを転送する前に 300000（5 分）で上限設定します。ノード自体はより厳しい制限を適用します。
- Android は可能な場合、`CAMERA`/`RECORD_AUDIO` 権限を求めます。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（ノード）

サポート対象ノードは `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注記:

- `screen.record` の可用性はノードプラットフォームによって異なります。
- `nodes` エージェントツールは、要求された `durationMs` を 300000（5 分）で上限設定します。ノードは返されるペイロードを制限するため、より厳しい制限を適用する場合があります。
- `--no-audio` は、サポート対象プラットフォームでマイクキャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します（0 = プライマリ）。

## 位置情報（ノード）

設定で位置情報が有効になっている場合、ノードは `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注記:

- 位置情報は**デフォルトでオフ**です。
- 「常に」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには緯度/経度、精度（メートル）、タイムスタンプが含まれます。
- パラメーター/レスポンスの完全な形状とエラーコード: [位置情報コマンド](/ja-JP/nodes/location-command)。

## SMS（Android ノード）

Android ノードは、ユーザーが **SMS** 権限を付与し、デバイスが通話機能をサポートしている場合、`sms.send` と `sms.search` を公開できます。どちらのコマンドもデフォルトでは危険です。呼び出す前に、Gateway オペレーターがそれらを `gateway.nodes.allowCommands` に追加する必要もあります（[コマンドポリシー](#command-policy)を参照）。

読み取り専用の SMS 検索では、`openclaw.json` で明示的にオプトインします。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

ノードがメッセージ送信もできる必要がある場合にのみ、`sms.send` を別途追加してください。Android 権限と Gateway コマンド承認は独立しています。電話の権限を付与しても Gateway ポリシーは編集されません。

低レベル呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注記:

- 呼び出しが権限診断を返せるよう、`READ_SMS` が付与される前に `sms.search` が宣言される場合があります。メッセージの読み取りには引き続きその Android 権限が必要です。
- 通話機能のない Wi-Fi 専用デバイスは `sms.send` を公開しません。
- `requires explicit gateway.nodes.allowCommands opt-in` エラーは、電話がコマンドを宣言しているものの、Gateway オペレーターが承認していないことを意味します。

## デバイスおよび個人データコマンド

iOS、Android、macOS ノードは、デフォルトで複数の読み取り専用データコマンドを公開します（[コマンドポリシー](#command-policy)表を参照）。Android はさらに、独自のアプリ内設定でゲートされるより大きなファミリーを公開します。

利用可能なファミリー:

- `device.status`, `device.info` — iOS、Android、macOS、Windows。
- `device.permissions`, `device.health`, `device.apps` — Android のみ。`device.apps` には Android 設定でインストール済みアプリの共有が有効になっている必要があり、デフォルトではランチャーに表示されるアプリを返します。
- `notifications.list`, `notifications.actions` — Android のみ。
- `photos.latest` — iOS、Android、macOS。
- `contacts.search` — iOS、Android、macOS（読み取り専用デフォルト）。`contacts.add` は危険であり、`gateway.nodes.allowCommands` が必要です。
- `calendar.events` — iOS、Android、macOS（読み取り専用デフォルト）。`calendar.add` は危険であり、`gateway.nodes.allowCommands` が必要です。
- `reminders.list` — iOS、Android、macOS（読み取り専用デフォルト）。`reminders.add` は危険であり、`gateway.nodes.allowCommands` が必要です。
- `callLog.search` — Android のみ。
- `motion.activity`, `motion.pedometer` — iOS、Android、macOS。利用可能なセンサーによってケイパビリティゲートされます。

呼び出し例:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## システムコマンド（ノードホスト / mac ノード）

macOS ノードは `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。ヘッドレスノードホストは `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意:

- `system.run` はペイロード内で stdout/stderr/終了コードを返します。
- シェル実行は現在、`host=node` の `exec` ツールを通ります。`nodes` は明示的なノードコマンド用の直接 RPC サーフェスのままです。
- `nodes invoke` は `system.run` や `system.run.prepare` を公開しません。これらは exec パス上にのみ残ります。
- exec パスは承認前に正規の `systemRunPlan` を準備します。承認が付与されると、gateway はその保存済みプランを転送し、後から呼び出し元が編集した command/cwd/session フィールドは転送しません。
- `system.notify` は macOS アプリの通知権限状態に従います。`--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- 認識されないノードの `platform` / `deviceFamily` メタデータには、`system.run` と `system.which` を除外する保守的なデフォルト許可リストが使われます。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に削減されます。
- 許可リストモードの常時許可判定では、既知のディスパッチラッパー（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）はラッパーパスではなく内側の実行可能ファイルパスを永続化します。安全にアンラップできない場合、許可リストエントリは自動的には永続化されません。
- Windows ノードホストの許可リストモードでは、`cmd.exe /c` 経由のシェルラッパー実行は承認が必要です（許可リストエントリだけではラッパー形式は自動許可されません）。
- ノードホストは `--env` 内の `PATH` 上書きを無視し、コマンド実行前に、保守されている多数のインタープリター/シェル起動変数（例: `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）を取り除きます。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、ノードホストサービス環境を設定する（または標準の場所にツールをインストールする）ようにしてください。
- macOS ノードモードでは、`system.run` は macOS アプリ内の exec 承認（Settings → Exec approvals）で制御されます。ask/allowlist/full はヘッドレスノードホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレスノードホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）で制御されます。特に macOS については、下の [ヘッドレスノードホスト](#headless-node-host-cross-platform) にある exec-host ルーティング環境変数を参照してください。

## Exec ノードバインディング

複数のノードが利用可能な場合、exec を特定のノードにバインドできます。これにより、`exec host=node` のデフォルトノードが設定されます（エージェントごとに上書きできます）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

任意のノードを許可するように解除:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 権限マップ

ノードは `node.list` / `node.describe` 内に `permissions` マップを含めることがあります。これは権限名（例: `screenRecording`、`accessibility`、`location`）をキーとし、ブール値（`true` = 付与済み）を値にします。

## ヘッドレスノードホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する **ヘッドレスノードホスト**（UI なし）を実行できます。これは Linux/Windows 上、またはサーバーの横で最小構成のノードを実行する場合に便利です。

起動:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意:

- ペアリングは引き続き必要です（Gateway がデバイスペアリングプロンプトを表示します）。
- ノードホストは、ノード ID、トークン、表示名、gateway 接続情報を `~/.openclaw/node.json` に保存します。
- Exec 承認は `~/.openclaw/exec-approvals.json` 経由でローカルに適用されます（[Exec 承認](/ja-JP/tools/exec-approvals) を参照）。
- macOS では、ヘッドレスノードホストはデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリの exec ホスト経由にルーティングするには `OPENCLAW_NODE_EXEC_HOST=app` を設定します。アプリホストを必須にし、利用できない場合にフェイルクローズするには `OPENCLAW_NODE_EXEC_FALLBACK=0` を追加します。
- Gateway WS が TLS を使用する場合は `--tls` / `--tls-fingerprint` を追加してください。

## Mac ノードモード

- macOS メニューバーアプリはノードとして Gateway WS サーバーに接続します（そのため、この Mac に対して `openclaw nodes …` が動作します）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

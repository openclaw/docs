---
read_when:
    - iOS/Android ノードを Gateway にペアリングする
    - エージェントコンテキストに Node キャンバス/カメラを使用する
    - 新しい Node コマンドまたは CLI ヘルパーの追加
summary: 'ノード: ペアリング、機能、権限、およびキャンバス/カメラ/画面/デバイス/通知/システム向けの CLI ヘルパー'
title: Nodes
x-i18n:
    generated_at: "2026-07-05T11:28:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8a781c60e80989d35dcf5bfefe8a3c706e1a1682377876e0d83da924bfcb908
    source_path: nodes/index.md
    workflow: 16
---

**node** は、Gateway **WebSocket**（operator と同じポート）に `role: "node"` で接続し、`node.invoke` を介してコマンドサーフェス（例: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL、現在の node では履歴目的のみ）。

macOS は **node モード**でも実行できます。メニューバーアプリが Gateway の WS サーバーに接続し、ローカルの canvas/camera コマンドを node として公開します（そのため `openclaw nodes …` がこの Mac に対して動作します）。リモート Gateway モードでは、ブラウザー自動化はネイティブアプリの node ではなく CLI node ホスト（`openclaw node run` またはインストール済み node サービス）によって処理されます。

node は **peripheral** であり、Gateway ではありません。Gateway サービスは実行せず、チャネルメッセージ（Telegram、WhatsApp など）は node ではなく Gateway に到着します。

トラブルシューティング runbook: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

WS node は **デバイスペアリング**を使用します。node は `connect` 中にデバイス ID を提示し、Gateway は `role: node` のデバイスペアリングリクエストを作成します。devices CLI（または UI）で承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

保留中のペアリングリクエストは 5 分後に期限切れになります。リクエスト/承認/トークンのライフサイクル全体については、[Gateway 所有のペアリング](/ja-JP/gateway/pairing)を参照してください。node が変更された認証詳細（role/scopes/public key）で再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

- `nodes status` は、デバイスペアリング role に `node` が含まれる場合に node を **paired** としてマークします。
- デバイスペアリングレコードは、承認済み role の永続的な契約です。トークンローテーションはその契約内に留まり、ペアリング承認で付与されていない role に paired node を昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、再接続をまたいで node の承認済みコマンド/ケイパビリティサーフェスを追跡する、Gateway 所有の別個の node ペアリングストアです。これは WS `connect` ハンドシェイクをゲートしません。デバイスペアリングがそれを行います。
- `openclaw nodes remove --node <id|name|ip>` は node ペアリングを削除します。デバイスに紐づく node では、`devices/paired.json` 内のデバイスの `node` role を取り消し、そのデバイスの node-role セッションを切断します。mixed-role デバイスは行を保持し、`node` role だけを失います。一方、node-only デバイス行は削除されます。また、別個の node ペアリングストアから一致するエントリも消去します。`operator.pairing` は他のデバイス上の非 operator node 行を削除できます。mixed-role デバイス上で device-token caller が自身の node role を取り消す場合は、追加で `operator.admin` が必要です。
- 承認スコープは保留中リクエストで宣言されたコマンドに従います。
  - コマンドなしリクエスト: `operator.pairing`
  - 非 exec node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## リモート node ホスト（system.run）

Gateway があるマシンで実行され、別のマシンでコマンドを実行したい場合は、**node ホスト**を使用します。モデルは引き続き **gateway** と対話します。`host=node` が選択されると、gateway は `exec` 呼び出しを **node ホスト**に転送します。

| Role         | Responsibility                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway ホスト | メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。 |
| Node ホスト    | node マシン上で `system.run`/`system.which` を実行します。        |
| Approvals    | node ホスト上の `~/.openclaw/exec-approvals.json` を介して適用されます。 |

承認に関する注記:

- 承認に裏付けられた node 実行は、正確なリクエストコンテキストにバインドされます。exec パスは承認前に正規の `systemRunPlan` を準備します。承認されると、Gateway は後から caller が編集した command/cwd/session フィールドではなく、その保存済み plan を転送し、実行前に作業ディレクトリを再検証します。
- 直接の shell/runtime ファイル実行では、OpenClaw はベストエフォートで具体的なローカルファイル operand 1 つにもバインドし、実行前にそのファイルが変更された場合は実行を拒否します。
- OpenClaw が interpreter/runtime コマンドについて具体的なローカルファイルを正確に 1 つ識別できない場合、完全な runtime coverage を装うのではなく、承認に裏付けられた実行は拒否されます。より広い interpreter セマンティクスには、sandboxing、分離ホスト、または明示的に信頼された allowlist/full workflow を使用してください。

### node ホストを起動する（foreground）

node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` は `--context-path`（Gateway WS コンテキストパス）、`--tls`、`--tls-fingerprint <sha256>`、`--node-id`（上書きするとペアリングトークンが消去されます）も受け付けます。

### SSH トンネル経由のリモート Gateway（loopback bind）

Gateway が loopback に bind している場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、リモート node ホストは直接接続できません。SSH トンネルを作成し、node ホストをトンネルのローカル側に向けます。

例（node ホスト -> gateway ホスト）:

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注記:

- `openclaw node run` はトークン認証またはパスワード認証をサポートします。
- 環境変数が推奨されます: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- config fallback は `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、リモート優先順位ルールに従って `gateway.remote.token` / `gateway.remote.password` が対象になります。
- active local `gateway.auth.*` SecretRefs が設定されているが解決されていない場合、node-host auth は fail closed します。
- node-host auth 解決は `OPENCLAW_GATEWAY_*` 環境変数のみを尊重します。

### node ホストを起動する（service）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` は `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`、`--runtime <node|bun>`（デフォルト: node）、再インストール用の `--force` も受け付けます。`node status`、`node stop`、`node uninstall` も利用できます。

### ペアリング + 名前

gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node が変更された認証詳細で再試行する場合は、`openclaw devices list` を再実行し、現在の `requestId` を承認してください。

命名オプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（node 上の `~/.openclaw/node.json` に、node id、token、gateway 接続情報とともに永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 側の上書き）。

### コマンドを allowlist に追加する

Exec 承認は **node ホストごと**です。gateway から allowlist エントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認は node ホスト上の `~/.openclaw/exec-approvals.json` にあります。

### exec を node に向ける

デフォルトを設定します（gateway config）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごとに:

```text
/exec host=node security=allowlist node=<id-or-name>
```

設定後、`host=node` の任意の `exec` 呼び出しは node ホスト上で実行されます（node の allowlist/承認に従います）。

`host=auto` は単独で暗黙的に node を選択しませんが、明示的な per-call `host=node` リクエストは `auto` から許可されます。セッションで node exec をデフォルトにしたい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [Node ホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

### ローカルモデル推論

desktop または server node は、その node 上で動作する Ollama サーバーから chat-capable モデルを公開できます。エージェントは Ollama Plugin の `node_inference` ツールを使用して、インストール済みモデルを検出し、リモートで境界付き prompt を実行します。Gateway が Ollama に直接ネットワークアクセスする必要はありません。セットアップ、モデルフィルタリング、直接検証コマンドについては、[Ollama node-local 推論](/ja-JP/providers/ollama#node-local-inference)を参照してください。

## コマンドの呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` は `system.run` と `system.run.prepare` をブロックします。これらのコマンドは `host=node` の `exec` ツールを通じてのみ実行されます（上記参照）。一般的な「エージェントに MEDIA attachment を渡す」ワークフロー（canvas、camera、screen、location、後述）には、より高レベルの helper が存在します。

## コマンドポリシー

node コマンドは、呼び出し可能になる前に 2 つのゲートを通過する必要があります。

1. node が WebSocket `connect.commands` リストでそのコマンドを宣言している必要があります。
2. gateway の platform-and-approval-derived allowlist に、宣言されたコマンドが含まれている必要があります。

プラットフォーム別のデフォルト allowlist（Plugin デフォルトおよび `allowCommands`/`denyCommands` 上書きの前）:

| Platform | Commands allowed by default                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（`system.run` のような node ホストコマンドは承認でゲートされます。下記参照）                                                                                                                                                                                                                                  |

`canvas.*` コマンド（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）は、iOS、Android、macOS、Windows、不明なプラットフォーム（Linux 以外）で Plugin デフォルトです。これらはすべて iOS では foreground に制限されます。

`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once` は、プラットフォームラベルに関係なく、`talk` capability を通知する、または `talk.*` コマンドを宣言する任意のノードでデフォルトで許可されます。

デスクトップホストコマンド（macOS/Windows の `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`screen.snapshot`）は、上記の静的なプラットフォームデフォルト表には含まれません。これらは、オペレーターがそれらを宣言するペアリングリクエストを承認すると利用可能になり、その後はノードの承認済みコマンドセットが再接続時にも引き継ぎます。

危険またはプライバシー影響の大きいコマンドは、ノードが宣言している場合でも、`gateway.nodes.allowCommands` による明示的なオプトインが必要です: `camera.snap`、`camera.clip`、`screen.record`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` は、デフォルトと追加の許可リスト項目より常に優先されます。

Plugin 所有のノードコマンドは、Gateway ノード呼び出しポリシーを追加できます。そのポリシーは許可リストチェックの後、ノードへの転送前に実行されるため、生の `node.invoke`、CLI ヘルパー、専用エージェントツールは同じ Plugin 権限境界を共有します。危険な Plugin ノードコマンドには、引き続き明示的な `gateway.nodes.allowCommands` オプトインが必要です。

ノードが宣言済みコマンドリストを変更した後は、古いデバイスペアリングを拒否し、新しいリクエストを承認して、Gateway が更新済みコマンドスナップショットを保存するようにします。

## 設定 (`openclaw.json`)

ノード関連の設定は `gateway.nodes` と `tools.exec` の下にあります:

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

正確なノードコマンド名を使用してください。`denyCommands` は、プラットフォームデフォルトまたは `allowCommands` 項目で本来許可される場合でも、コマンドを削除します。Gateway ノードペアリングとコマンドポリシーフィールドの詳細については、[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

エージェントごとの exec ノード上書き:

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

## スクリーンショット（キャンバススナップショット）

ノードが Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルに書き込み、保存済みパスを出力します）:

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

注:

- `canvas present` は URL またはローカルファイルパス（`--target`）に加え、位置指定用の任意の `--x/--y/--width/--height` を受け付けます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- モバイルノードは、アクション可能なレンダリングのために、バンドルされたアプリ所有の A2UI ページを使用します。
- A2UI v0.8 JSONL のみがサポートされます（v0.9/createSurface は拒否されます）。
- iOS と Android はリモート Gateway Canvas ページをレンダリングしますが、A2UI ボタンアクションは、バンドルされたアプリ所有の A2UI ページからのみディスパッチされます。Gateway ホストの HTTP/HTTPS A2UI ページは、これらのモバイルクライアントではレンダリング専用です。

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

注:

- `canvas.*` と `camera.*` では、ノードが**フォアグラウンド**である必要があります（バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- ノードは、base64 ペイロードを扱いやすく保つため、クリップ時間を制限します（プラットフォームごとの正確な制限については[カメラキャプチャ](/ja-JP/nodes/camera)を参照してください）。`nodes` エージェントツールはさらに、呼び出しを転送する前にリクエストされた `durationMs` を 300000（5 分）で上限設定します。ノード自体はより厳しい制限を適用します。
- Android は可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を求めます。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（ノード）

サポートされるノードは `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` の可用性はノードプラットフォームによって異なります。
- `nodes` エージェントツールは、リクエストされた `durationMs` を 300000（5 分）で上限設定します。ノードは返されるペイロードを制限するため、より厳しい制限を適用する場合があります。
- `--no-audio` は、サポートされるプラットフォームでマイクキャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します（0 = プライマリ）。

## 位置情報（ノード）

設定で Location が有効になっている場合、ノードは `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- Location は**デフォルトでオフ**です。
- 「常に」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには緯度/経度、精度（メートル）、タイムスタンプが含まれます。
- 完全なパラメーター/レスポンス形状とエラーコード: [Location コマンド](/ja-JP/nodes/location-command)。

## SMS（Android ノード）

Android ノードは、ユーザーが **SMS** 権限を付与し、デバイスがテレフォニーをサポートしている場合、`sms.send` と `sms.search` を公開できます。どちらのコマンドもデフォルトでは危険です。呼び出す前に、Gateway オペレーターがそれらを `gateway.nodes.allowCommands` に追加する必要もあります（[コマンドポリシー](#command-policy)を参照）。

低レベル呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- capability が通知される前に、Android デバイスで権限プロンプトを承認する必要があります。
- テレフォニーのない Wi-Fi 専用デバイスは `sms.send` を通知しません。

## デバイスおよび個人データコマンド

iOS、Android、macOS ノードは、デフォルトで複数の読み取り専用データコマンドを通知します（[コマンドポリシー](#command-policy)表を参照）。Android はさらに、独自のアプリ内設定で制御されるより大きなファミリーを公開します。

利用可能なファミリー:

- `device.status`、`device.info` — iOS、Android、macOS、Windows。
- `device.permissions`、`device.health`、`device.apps` — Android のみ。`device.apps` は Android Settings で Installed Apps 共有が有効である必要があり、デフォルトでランチャーに表示されるアプリを返します。
- `notifications.list`、`notifications.actions` — Android のみ。
- `photos.latest` — iOS、Android、macOS。
- `contacts.search` — iOS、Android、macOS（読み取り専用デフォルト）。`contacts.add` は危険で、`gateway.nodes.allowCommands` が必要です。
- `calendar.events` — iOS、Android、macOS（読み取り専用デフォルト）。`calendar.add` は危険で、`gateway.nodes.allowCommands` が必要です。
- `reminders.list` — iOS、Android、macOS（読み取り専用デフォルト）。`reminders.add` は危険で、`gateway.nodes.allowCommands` が必要です。
- `callLog.search` — Android のみ。
- `motion.activity`、`motion.pedometer` — iOS、Android、macOS。利用可能なセンサーによって capability が制御されます。

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

注:

- `system.run` はペイロード内で stdout/stderr/終了コードを返します。
- シェル実行は現在、`host=node` の `exec` ツールを経由します。`nodes` は明示的なノードコマンド用の直接 RPC サーフェスとして残ります。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パス上にのみ残ります。
- exec パスは承認前に正規の `systemRunPlan` を準備します。承認が付与されると、Gateway は後で呼び出し元が編集した command/cwd/session フィールドではなく、その保存済みプランを転送します。
- `system.notify` は macOS アプリの通知権限状態に従います。`--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- 認識されないノード `platform` / `deviceFamily` メタデータでは、`system.run` と `system.which` を除外する保守的なデフォルト許可リストが使用されます。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に削減されます。
- 許可リストモードの常時許可判断では、既知のディスパッチラッパー（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）は、ラッパーパスではなく内部実行ファイルパスを永続化します。安全にアンラップできない場合、許可リスト項目は自動的には永続化されません。
- Windows ノードホストの許可リストモードでは、`cmd.exe /c` 経由のシェルラッパー実行には承認が必要です（許可リスト項目だけではラッパー形式は自動許可されません）。
- ノードホストは `--env` 内の `PATH` 上書きを無視し、コマンドを実行する前に、インタープリター/シェル起動変数の大規模な保守済みセット（例: `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）を取り除きます。追加の PATH 項目が必要な場合は、`--env` で `PATH` を渡すのではなく、ノードホストサービス環境を設定する（または標準の場所にツールをインストールする）ようにしてください。
- macOS ノードモードでは、`system.run` は macOS アプリの exec 承認（Settings → Exec approvals）によって制御されます。ask/allowlist/full はヘッドレスノードホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレスノードホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制御されます。macOS では特に、下記の[ヘッドレスノードホスト](#headless-node-host-cross-platform)にある exec-host ルーティング環境変数を参照してください。

## Exec ノードバインディング

複数のノードが利用可能な場合、exec を特定のノードにバインドできます。これにより、`exec host=node` のデフォルトノードが設定されます（エージェントごとに上書きできます）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとのオーバーライド:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

任意のノードを許可するには設定を解除します:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 権限マップ

ノードは、権限名 (例: `screenRecording`、`accessibility`、`location`) をキーとし、真偽値 (`true` = 付与済み) を値とする `permissions` マップを `node.list` / `node.describe` に含めることがあります。

## ヘッドレスノードホスト (クロスプラットフォーム)

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する **ヘッドレスノードホスト** (UI なし) を実行できます。これは Linux/Windows 上、またはサーバーの横で最小構成のノードを実行する場合に便利です。

起動します:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注記:

- ペアリングは引き続き必要です (Gateway にデバイスのペアリングプロンプトが表示されます)。
- ノードホストは、ノード ID、トークン、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。
- exec 承認は `~/.openclaw/exec-approvals.json` によってローカルで適用されます ([Exec 承認](/ja-JP/tools/exec-approvals) を参照)。
- macOS では、ヘッドレスノードホストはデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリの exec ホスト経由にルーティングするには `OPENCLAW_NODE_EXEC_HOST=app` を設定します。アプリホストを必須にし、利用できない場合にフェイルクローズするには `OPENCLAW_NODE_EXEC_FALLBACK=0` を追加します。
- Gateway WS が TLS を使用する場合は、`--tls` / `--tls-fingerprint` を追加します。

## Mac ノードモード

- macOS メニューバーアプリはノードとして Gateway WS サーバーに接続します (そのため、この Mac に対して `openclaw nodes …` が機能します)。
- リモートモードでは、アプリが Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

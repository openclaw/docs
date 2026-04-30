---
read_when:
    - iOS/Android ノードを Gateway にペアリングする
    - エージェントのコンテキストにノードのキャンバス/カメラを使用する
    - 新しい Node コマンドまたは CLI ヘルパーの追加
summary: 'Node: ペアリング、機能、権限、およびキャンバス/カメラ/画面/デバイス/通知/システム向けの CLI ヘルパー'
title: Node
x-i18n:
    generated_at: "2026-04-30T05:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

**Node** は、Gateway **WebSocket**（オペレーターと同じポート）へ `role: "node"` で接続し、`node.invoke` 経由でコマンドサーフェス（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL;
現在の Node では履歴目的のみ）。

macOS は **Node モード**でも実行できます。メニューバーアプリが Gateway の
WS サーバーに接続し、ローカルの canvas/camera コマンドを Node として公開します（そのため
`openclaw nodes …` がこの Mac に対して機能します）。リモート Gateway モードでは、ブラウザー
自動化はネイティブアプリ Node ではなく、CLI Node ホスト（`openclaw node run` または
インストール済み Node サービス）によって処理されます。

注:

- Node は **周辺デバイス**であり、Gateway ではありません。Gateway サービスは実行しません。
- Telegram/WhatsApp などのメッセージは **Gateway** に届き、Node には届きません。
- トラブルシューティングランブック: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

**WS Node はデバイスペアリングを使用します。** Node は `connect` 中にデバイス ID を提示します。Gateway は
`role: node` のデバイスペアリングリクエストを作成します。デバイス CLI（または UI）で承認します。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Node が変更された認証詳細（role/scopes/public key）で再試行した場合、以前の
保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に
`openclaw devices list` を再実行してください。

注:

- `nodes status` は、デバイスペアリング role に `node` が含まれる場合に Node を **paired** としてマークします。
- デバイスペアリングレコードは、永続的な承認済み role 契約です。Token
  ローテーションはその契約内に留まり、ペアリング承認が許可していない
  別の role へペア済み Node を昇格することはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、Gateway が所有する別の
  Node ペアリングストアです。WS `connect` ハンドシェイクのゲートには **なりません**。
- `openclaw nodes remove --node <id|name|ip>` は、その
  Gateway 所有の別 Node ペアリングストアから古いエントリを削除します。
- 承認スコープは、保留中リクエストで宣言されたコマンドに従います。
  - コマンドなしリクエスト: `operator.pairing`
  - exec 以外の Node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## リモート Node ホスト（system.run）

Gateway をあるマシンで実行し、別のマシンでコマンドを実行したい場合は **Node ホスト**を使用します。モデルは引き続き **Gateway** と通信します。`host=node` が選択されている場合、Gateway は
`exec` 呼び出しを **Node ホスト**へ転送します。

### どこで何が実行されるか

- **Gateway ホスト**: メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。
- **Node ホスト**: Node マシン上で `system.run`/`system.which` を実行します。
- **承認**: Node ホスト上の `~/.openclaw/exec-approvals.json` によって強制されます。

承認に関する注:

- 承認に基づく Node 実行は、正確なリクエストコンテキストにバインドされます。
- 直接のシェル/ランタイムファイル実行では、OpenClaw はベストエフォートで具体的なローカル
  ファイルオペランド 1 つにもバインドし、実行前にそのファイルが変更された場合は実行を拒否します。
- OpenClaw がインタープリター/ランタイムコマンドについて、具体的なローカルファイルをちょうど 1 つ識別できない場合、
  完全なランタイムカバレッジを装うのではなく、承認に基づく実行は拒否されます。より広いインタープリターのセマンティクスには、サンドボックス化、
  別ホスト、または明示的な信頼済み allowlist/完全ワークフローを使用してください。

### Node ホストを開始する（フォアグラウンド）

Node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由のリモート Gateway（loopback バインド）

Gateway が loopback（`gateway.bind=loopback`、ローカルモードのデフォルト）にバインドされている場合、
リモート Node ホストは直接接続できません。SSH トンネルを作成し、Node ホストをトンネルのローカル側に向けます。

例（Node ホスト -> Gateway ホスト）:

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注:

- `openclaw node run` は Token 認証またはパスワード認証をサポートします。
- 環境変数を推奨します: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- Config フォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、`gateway.remote.token` / `gateway.remote.password` はリモート優先順位ルールに従って対象になります。
- アクティブなローカル `gateway.auth.*` SecretRefs が設定されているものの解決されていない場合、Node ホスト認証は fail closed します。
- Node ホスト認証解決は `OPENCLAW_GATEWAY_*` 環境変数のみを尊重します。

### Node ホストを開始する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### ペアリング + 名前

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node が変更された認証詳細で再試行した場合は、`openclaw devices list` を再実行し、
現在の `requestId` を承認してください。

命名オプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（Node 上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway オーバーライド）。

### コマンドを allowlist に追加する

Exec 承認は **Node ホストごと**です。Gateway から allowlist エントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認は Node ホスト上の `~/.openclaw/exec-approvals.json` に保存されます。

### exec を Node に向ける

デフォルトを設定します（Gateway config）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごとに:

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後は、`host=node` の任意の `exec` 呼び出しが Node ホスト上で実行されます（Node の
allowlist/承認の対象です）。

`host=auto` はそれ自体で暗黙的に Node を選択しませんが、`auto` からの明示的な呼び出しごとの `host=node` リクエストは許可されます。セッションのデフォルトとして Node exec を使用したい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [Node ホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

## コマンドの呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「エージェントに MEDIA 添付を渡す」ワークフローには、より高レベルのヘルパーがあります。

## コマンドポリシー

Node コマンドは、呼び出される前に 2 つのゲートを通過する必要があります。

1. Node が WebSocket `connect.commands` リストでそのコマンドを宣言している必要があります。
2. Gateway のプラットフォームポリシーが、宣言されたコマンドを許可している必要があります。

Windows および macOS のコンパニオン Node は、デフォルトで
`canvas.*`、`camera.list`、`location.get`、`screen.snapshot` などの安全な宣言済みコマンドを許可します。
`camera.snap`、`camera.clip`、`screen.record` などの危険またはプライバシー影響の大きいコマンドには、
引き続き `gateway.nodes.allowCommands` による明示的なオプトインが必要です。`gateway.nodes.denyCommands` は常に
デフォルトと追加の allowlist エントリより優先されます。

Plugin 所有の Node コマンドは、Gateway の node-invoke ポリシーを追加できます。そのポリシーは
allowlist チェック後、Node への転送前に実行されるため、raw
`node.invoke`、CLI ヘルパー、専用エージェントツールは同じ Plugin
権限境界を共有します。危険な Plugin Node コマンドには、引き続き明示的な
`gateway.nodes.allowCommands` オプトインが必要です。

Node が宣言済みコマンドリストを変更した後は、古いデバイスペアリングを拒否し、
新しいリクエストを承認して、Gateway が更新済みコマンドスナップショットを保存するようにしてください。

## スクリーンショット（canvas snapshots）

Node が Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルに書き込み、`MEDIA:<path>` を出力します）:

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas controls

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注:

- `canvas present` は URL またはローカルファイルパス（`--target`）を受け付け、配置用に任意で `--x/--y/--width/--height` も受け付けます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- A2UI v0.8 JSONL のみサポートされます（v0.9/createSurface は拒否されます）。

## 写真 + 動画（Node カメラ）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注:

- `canvas.*` と `camera.*` では、Node が **フォアグラウンド**である必要があります（バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- クリップ時間は、過大な base64 ペイロードを避けるために（現在は `<= 60s` に）制限されます。
- Android は可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を求めます。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（Node）

サポートされている Node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` の可用性は Node プラットフォームに依存します。
- 画面録画は `<= 60s` に制限されます。
- `--no-audio` はサポートされているプラットフォームでマイクキャプチャを無効化します。
- 複数の画面が利用可能な場合は、`--screen <index>` でディスプレイを選択します。

## 位置情報（Node）

設定で Location が有効な場合、Node は `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- Location は **デフォルトでオフ**です。
- 「Always」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには lat/lon、精度（メートル）、timestamp が含まれます。

## SMS（Android Node）

Android Node は、ユーザーが **SMS** 権限を付与し、デバイスが通話機能をサポートしている場合に `sms.send` を公開できます。

低レベルの呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- 機能が広告される前に、Android デバイス上で権限プロンプトを承認する必要があります。
- 通話機能のない Wi-Fi のみのデバイスは `sms.send` を広告しません。

## Android デバイス + 個人データコマンド

Android Node は、対応する機能が有効な場合に追加のコマンドファミリーを広告できます。

利用可能なファミリー:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

呼び出し例:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注記:

- モーションコマンドは、利用可能なセンサーの機能によって制御されます。

## システムコマンド (Node ホスト / mac Node)

macOS Node は `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。
ヘッドレス Node ホストは `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注記:

- `system.run` はペイロード内で stdout/stderr/終了コードを返します。
- シェル実行は現在、`host=node` の `exec` ツールを経由します。`nodes` は明示的な Node コマンド向けの直接 RPC サーフェスのままです。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パス専用です。
- exec パスは承認前に正規の `systemRunPlan` を準備します。承認が付与されると、Gateway は後から呼び出し元が編集した command/cwd/session フィールドではなく、その保存済みプランを転送します。
- `system.notify` は macOS アプリ上の通知権限状態を尊重します。
- 認識されない Node の `platform` / `deviceFamily` メタデータには、`system.run` と `system.which` を除外する保守的なデフォルト許可リストが使われます。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー (`bash|sh|zsh ... -c/-lc`) では、リクエストスコープの `--env` 値は明示的な許可リスト (`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`) に削減されます。
- 許可リストモードで常に許可する判断では、既知のディスパッチラッパー (`env`、`nice`、`nohup`、`stdbuf`、`timeout`) はラッパーパスではなく内側の実行可能ファイルパスを永続化します。安全にアンラップできない場合、許可リストエントリは自動的には永続化されません。
- Windows Node ホストの許可リストモードでは、`cmd.exe /c` 経由のシェルラッパー実行には承認が必要です (許可リストエントリだけではラッパー形式は自動許可されません)。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- Node ホストは `PATH` の上書きを無視し、危険な起動/シェルキー (`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`) を取り除きます。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、Node ホストサービス環境を構成する (またはツールを標準の場所にインストールする) ようにしてください。
- macOS Node モードでは、`system.run` は macOS アプリの exec 承認 (Settings → Exec approvals) によってゲートされます。
  ask/allowlist/full はヘッドレス Node ホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレス Node ホストでは、`system.run` は exec 承認 (`~/.openclaw/exec-approvals.json`) によってゲートされます。

## Exec Node バインディング

複数の Node が利用可能な場合、exec を特定の Node にバインドできます。
これにより、`exec host=node` のデフォルト Node が設定されます (エージェントごとに上書きできます)。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

任意の Node を許可するには設定解除します:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 権限マップ

Node は `node.list` / `node.describe` に `permissions` マップを含める場合があります。これは権限名 (例: `screenRecording`、`accessibility`) をキーとし、真偽値 (`true` = 付与済み) を値とします。

## ヘッドレス Node ホスト (クロスプラットフォーム)

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する **ヘッドレス Node ホスト** (UI なし) を実行できます。これは Linux/Windows 上、またはサーバーの横で最小構成の Node を実行する場合に便利です。

起動します:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注記:

- ペアリングは引き続き必要です (Gateway はデバイスペアリングプロンプトを表示します)。
- Node ホストは Node ID、トークン、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。
- Exec 承認は `~/.openclaw/exec-approvals.json` によってローカルで強制されます
  ([Exec approvals](/ja-JP/tools/exec-approvals) を参照)。
- macOS では、ヘッドレス Node ホストはデフォルトで `system.run` をローカル実行します。`OPENCLAW_NODE_EXEC_HOST=app` を設定すると、`system.run` がコンパニオンアプリの exec ホスト経由にルーティングされます。`OPENCLAW_NODE_EXEC_FALLBACK=0` を追加すると、アプリホストを必須にし、利用できない場合はフェイルクローズします。
- Gateway WS が TLS を使う場合は、`--tls` / `--tls-fingerprint` を追加します。

## Mac Node モード

- macOS メニューバーアプリは Node として Gateway WS サーバーに接続します (そのため `openclaw nodes …` はこの Mac に対して動作します)。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

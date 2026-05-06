---
read_when:
    - iOS/Android ノードを Gateway にペアリングする
    - エージェントコンテキストに Node canvas/camera を使用する
    - 新しいノードコマンドまたは CLI ヘルパーの追加
summary: 'Node: ペアリング、ケイパビリティ、権限、および canvas/camera/screen/device/notifications/system 用の CLI ヘルパー'
title: Node
x-i18n:
    generated_at: "2026-05-06T05:11:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7cb933edcd0df2151373ea7c3b0289a0aa1b2fc6af581147ce6eb780f9a76351
    source_path: nodes/index.md
    workflow: 16
---

**node** は、Gateway **WebSocket**（operator と同じポート）に `role: "node"` で接続し、`node.invoke` を介してコマンドサーフェス（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL。
現在の Node では履歴用途のみ）。

macOS は **node モード**でも実行できます。メニューバーアプリが Gateway の
WS サーバーに接続し、ローカルの canvas/camera コマンドを Node として公開します（そのため
`openclaw nodes …` はこの Mac に対して動作します）。リモート Gateway モードでは、ブラウザー
自動化はネイティブアプリ Node ではなく、CLI Node ホスト（`openclaw node run` または
インストール済み Node サービス）によって処理されます。

注:

- Node は **周辺機器**であり、Gateway ではありません。Gateway サービスは実行しません。
- Telegram/WhatsApp などのメッセージは **Gateway** に届き、Node には届きません。
- トラブルシューティング Runbook: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

**WS Node はデバイスペアリングを使用します。** Node は `connect` 中にデバイス ID を提示し、Gateway は
`role: node` のデバイスペアリングリクエストを作成します。devices CLI（または UI）で承認します。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Node が変更された認証詳細（role/scopes/public key）で再試行すると、以前の
保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認する前に
`openclaw devices list` を再実行してください。

注:

- `nodes status` は、デバイスペアリング role に `node` が含まれる場合、その Node を **paired** としてマークします。
- デバイスペアリングレコードは、永続的な承認済み role コントラクトです。トークン
  ローテーションはそのコントラクト内に留まり、ペアリング承認で許可されていない
  別の role へペアリング済み Node を昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、Gateway が所有する別の
  Node ペアリングストアです。WS `connect` ハンドシェイクのゲートには **なりません**。
- `openclaw nodes remove --node <id|name|ip>` は、その
  Gateway 所有の別 Node ペアリングストアから古いエントリを削除します。
- 承認スコープは、保留中リクエストで宣言されたコマンドに従います。
  - コマンドなしリクエスト: `operator.pairing`
  - 非 exec Node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## リモート Node ホスト（system.run）

Gateway をあるマシンで実行し、別のマシンでコマンドを実行したい場合は、**Node ホスト**を使用します。
モデルは引き続き **Gateway** と通信し、`host=node` が選択されている場合、Gateway が
`exec` 呼び出しを **Node ホスト**へ転送します。

### どこで何が実行されるか

- **Gateway ホスト**: メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。
- **Node ホスト**: Node マシン上で `system.run`/`system.which` を実行します。
- **承認**: Node ホスト上の `~/.openclaw/exec-approvals.json` によって適用されます。

承認に関する注:

- 承認に基づく Node 実行は、正確なリクエストコンテキストにバインドされます。
- 直接の shell/runtime ファイル実行では、OpenClaw はベストエフォートで 1 つの具体的なローカル
  ファイルオペランドにもバインドし、そのファイルが実行前に変更された場合は実行を拒否します。
- OpenClaw が interpreter/runtime コマンドについて、ちょうど 1 つの具体的なローカルファイルを識別できない場合、
  完全な runtime カバレッジを装うのではなく、承認に基づく実行は拒否されます。より広い interpreter セマンティクスには、サンドボックス化、
  分離したホスト、または明示的に信頼された allowlist/完全なワークフローを使用してください。

### Node ホストを開始する（フォアグラウンド）

Node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由のリモート Gateway（loopback バインド）

Gateway が loopback にバインドされている場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、
リモート Node ホストは直接接続できません。SSH トンネルを作成し、Node ホストを
トンネルのローカル側に向けてください。

例（Node ホスト -> Gateway ホスト）:

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注:

- `openclaw node run` は token または password 認証をサポートします。
- 環境変数が推奨されます: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- Config フォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、`gateway.remote.token` / `gateway.remote.password` はリモート優先順位ルールに従って使用対象になります。
- アクティブなローカル `gateway.auth.*` SecretRefs が設定されているものの解決されていない場合、Node ホスト認証は fail closed します。
- Node ホストの認証解決は `OPENCLAW_GATEWAY_*` 環境変数のみを尊重します。

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
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway 側の上書き）。

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

設定後は、`host=node` を持つすべての `exec` 呼び出しが Node ホスト上で実行されます（Node の allowlist/承認に従います）。

`host=auto` は Node を暗黙的に自動選択しませんが、`auto` からの明示的な per-call `host=node` リクエストは許可されます。セッションのデフォルトとして Node exec を使用したい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [Node ホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

## コマンドの呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「agent に MEDIA 添付を渡す」ワークフローには、より高レベルなヘルパーがあります。

## コマンドポリシー

Node コマンドは、呼び出される前に 2 つのゲートを通過する必要があります。

1. Node が WebSocket `connect.commands` リストでそのコマンドを宣言している必要があります。
2. Gateway のプラットフォームポリシーが宣言済みコマンドを許可している必要があります。

Windows および macOS のコンパニオン Node は、デフォルトで
`canvas.*`、`camera.list`、`location.get`、`screen.snapshot` などの安全な宣言済みコマンドを許可します。
`talk` capability を広告する、または `talk.*` コマンドを宣言する信頼済み Node も、
プラットフォームラベルに関係なく、宣言済み push-to-talk コマンド
（`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once`）をデフォルトで許可します。
`camera.snap`、`camera.clip`、`screen.record` などの危険またはプライバシー負荷の高いコマンドは、
引き続き `gateway.nodes.allowCommands` による明示的な opt-in が必要です。
`gateway.nodes.denyCommands` は、デフォルトおよび追加 allowlist エントリより常に優先されます。

Plugin 所有の Node コマンドは、Gateway の node-invoke ポリシーを追加できます。そのポリシーは
allowlist チェック後、Node へ転送する前に実行されるため、raw
`node.invoke`、CLI ヘルパー、専用 agent ツールは同じ Plugin
権限境界を共有します。危険な Plugin Node コマンドには、引き続き明示的な
`gateway.nodes.allowCommands` opt-in が必要です。

Node が宣言済みコマンドリストを変更した後は、古いデバイスペアリングを拒否し、
新しいリクエストを承認して、Gateway が更新済みコマンドスナップショットを保存できるようにしてください。

## スクリーンショット（canvas スナップショット）

Node が Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルへ書き込み、`MEDIA:<path>` を出力します）:

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

- `canvas present` は URL またはローカルファイルパス（`--target`）に加えて、位置指定用の任意の `--x/--y/--width/--height` を受け付けます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- A2UI v0.8 JSONL のみサポートされています（v0.9/createSurface は拒否されます）。

## 写真 + 動画（Node camera）

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

- `canvas.*` および `camera.*` を使用するには、Node が **foregrounded** である必要があります（バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- クリップの長さは、過大な base64 ペイロードを避けるために制限されます（現在は `<= 60s`）。
- Android は可能な場合、`CAMERA`/`RECORD_AUDIO` 権限を要求します。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（Node）

サポートされる Node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` の可用性は Node プラットフォームによって異なります。
- 画面録画は `<= 60s` に制限されます。
- `--no-audio` は、サポートされるプラットフォームでマイクキャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します。

## 位置情報（Node）

Node は、設定で Location が有効になっている場合に `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- Location は **デフォルトでオフ** です。
- 「常に」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには lat/lon、精度（メートル）、timestamp が含まれます。

## SMS（Android Node）

Android Node は、ユーザーが **SMS** 権限を付与し、デバイスがテレフォニーをサポートしている場合に `sms.send` を公開できます。

低レベル呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- capability が広告される前に、Android デバイス上で権限プロンプトを承諾する必要があります。
- テレフォニーのない Wi-Fi 専用デバイスは `sms.send` を広告しません。

## Android デバイス + 個人データコマンド

Android Node は、対応する capability が有効な場合に追加のコマンドファミリーを広告できます。

利用可能なファミリー:

- `device.status`、`device.info`、`device.permissions`、`device.health`
- `notifications.list`、`notifications.actions`
- `photos.latest`
- `contacts.search`、`contacts.add`
- `calendar.events`、`calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`、`motion.pedometer`

呼び出し例:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注記:

- モーションコマンドは、利用可能なセンサーによって機能制限されます。

## システムコマンド（ノードホスト / Macノード）

macOSノードは `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。
ヘッドレスノードホストは `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注記:

- `system.run` はペイロードで stdout/stderr/終了コードを返します。
- シェル実行は現在、`host=node` を指定した `exec` ツール経由で行われます。`nodes` は明示的なノードコマンド用の直接RPCサーフェスのままです。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パス上にのみ残ります。
- exec パスは承認前に正規の `systemRunPlan` を準備します。承認が付与されると、Gateway は、後で呼び出し元が編集した command/cwd/session フィールドではなく、その保存済みプランを転送します。
- `system.notify` は macOSアプリの通知権限状態を尊重します。
- 認識されないノードの `platform` / `deviceFamily` メタデータでは、`system.run` と `system.which` を除外する保守的なデフォルト許可リストを使用します。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に縮小されます。
- 許可リストモードの常時許可の判断では、既知のディスパッチラッパー（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）はラッパーパスではなく内部の実行可能ファイルパスを永続化します。アンラップが安全でない場合、許可リストエントリは自動的には永続化されません。
- 許可リストモードのWindowsノードホストでは、`cmd.exe /c` 経由のシェルラッパー実行に承認が必要です（許可リストエントリだけでは、ラッパー形式は自動許可されません）。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- ノードホストは `PATH` の上書きを無視し、危険な起動/シェルキー（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）を削除します。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、ノードホストサービス環境を設定する（または標準の場所にツールをインストールする）してください。
- macOSノードモードでは、`system.run` は macOSアプリの exec 承認（Settings → Exec approvals）によって制限されます。
  ask/allowlist/full はヘッドレスノードホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレスノードホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制限されます。

## Exec ノードのバインド

複数のノードが利用可能な場合、exec を特定のノードにバインドできます。
これにより、`exec host=node` のデフォルトノードが設定されます（エージェントごとに上書きできます）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

任意のノードを許可するために未設定にする:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 権限マップ

ノードは `node.list` / `node.describe` に `permissions` マップを含めることがあります。これは権限名（例: `screenRecording`、`accessibility`）をキーとし、真偽値（`true` = 付与済み）を値とします。

## ヘッドレスノードホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する **ヘッドレスノードホスト**（UIなし）を実行できます。これは Linux/Windows 上、またはサーバーと並行して最小ノードを実行する場合に便利です。

起動方法:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注記:

- ペアリングは引き続き必要です（Gateway はデバイスペアリングプロンプトを表示します）。
- ノードホストは、ノードID、トークン、表示名、Gateway接続情報を `~/.openclaw/node.json` に保存します。
- Exec 承認は `~/.openclaw/exec-approvals.json` 経由でローカルに適用されます
  （[Exec 承認](/ja-JP/tools/exec-approvals) を参照）。
- macOSでは、ヘッドレスノードホストはデフォルトで `system.run` をローカルで実行します。`OPENCLAW_NODE_EXEC_HOST=app` を設定すると、`system.run` をコンパニオンアプリの exec ホスト経由にルーティングします。`OPENCLAW_NODE_EXEC_FALLBACK=0` を追加すると、アプリホストを必須にし、利用できない場合は fail closed します。
- Gateway WS が TLS を使用する場合は `--tls` / `--tls-fingerprint` を追加します。

## Macノードモード

- macOSメニューバーアプリはノードとして Gateway WS サーバーに接続します（そのため、このMacに対して `openclaw nodes …` が動作します）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

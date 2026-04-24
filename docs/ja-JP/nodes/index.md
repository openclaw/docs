---
read_when:
    - iOS/Android Node を gateway にペアリングすること
    - エージェントコンテキストのために Node の canvas/camera を使うこと
    - 新しい Node コマンドまたは CLI helper を追加すること
summary: 'Nodes: ペアリング、capabilities、権限、および canvas/camera/screen/device/notifications/system 向け CLI helper'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T05:06:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Node とは、Gateway **WebSocket**（operator と同じポート）に `role: "node"` で接続し、`node.invoke` を通じて command サーフェス（たとえば `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。protocol の詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

旧式トランスポート: [Bridge protocol](/ja-JP/gateway/bridge-protocol)（TCP JSONL;
現行 Node では歴史的なもののみ）。

macOS は **node mode** でも実行できます。メニューバーアプリが Gateway の WS server に接続し、その Mac のローカル canvas/camera command を Node として公開します（そのため `openclaw nodes …` がこの Mac に対して動作します）。

注:

- Node は **周辺機器**であり、gateway ではありません。gateway service 自体は実行しません。
- Telegram/WhatsApp などのメッセージは Node ではなく **gateway** に届きます。
- トラブルシューティング runbook: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

**WS Node は device pairing を使います。** Node は `connect` 中に device identity を提示します。Gateway
は `role: node` 向けの device pairing request を作成します。devices CLI（または UI）で承認します。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Node が変更された auth 詳細（role/scopes/public key）で再試行すると、以前の
pending request は置き換えられ、新しい `requestId` が作成されます。承認前に
`openclaw devices list` を再実行してください。

注:

- `nodes status` は、device pairing role に `node` が含まれていると Node を **paired** とマークします。
- device pairing レコードは、耐久的な承認済み role 契約です。token
  ローテーションはその契約の内部で行われ、ペアリング承認が一度も与えていない
  別の role に paired Node を昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/rename`）は別の gateway 管理
  Node pairing store であり、WS `connect` handshake は制御しません。
- 承認スコープは pending request の declared command に従います:
  - コマンドなしリクエスト: `operator.pairing`
  - 非 exec Node command: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## リモート Node ホスト（system.run）

Gateway が 1 台のマシンで動作していて、別のマシンで command を
実行したい場合は **node host** を使います。モデルは引き続き **gateway** と会話します。gateway
は `host=node` が選択されると、`exec` 呼び出しを **node host** に転送します。

### 何がどこで動くか

- **Gateway host**: メッセージを受信し、モデルを実行し、tool 呼び出しをルーティングする。
- **Node host**: Node マシン上で `system.run`/`system.which` を実行する。
- **承認**: Node host 上の `~/.openclaw/exec-approvals.json` で強制される。

承認に関する注記:

- 承認ベースの Node run は、正確なリクエストコンテキストに bind されます。
- 直接 shell/runtime ファイル実行では、OpenClaw は 1 つの具体的なローカル
  ファイルオペランドを best-effort で bind し、そのファイルが実行前に変更された場合は run を拒否します。
- インタープリター/runtime command に対して、OpenClaw が正確に 1 つの具体的ローカルファイルを特定できない場合、
  完全な runtime カバレッジを装うのではなく、承認ベース実行は拒否されます。より広いインタープリター意味論には、sandboxing、
  別ホスト、または明示的な trusted allowlist/full workflow を使ってください。

### Node host を起動する（フォアグラウンド）

Node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由のリモート gateway（loopback bind）

Gateway が loopback に bind している場合（`gateway.bind=loopback`、local mode のデフォルト）、
リモート Node host は直接接続できません。SSH トンネルを作成し、
Node host からトンネルのローカル側を指すようにしてください。

例（Node host -> gateway host）:

```bash
# Terminal A（実行したままにする）: ローカル 18790 -> gateway 127.0.0.1:18789 を転送
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: gateway token を export してトンネル経由で接続
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注:

- `openclaw node run` は token または password auth をサポートします。
- env var が推奨です: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- config フォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- local mode では、Node host は意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- remote mode では、`gateway.remote.token` / `gateway.remote.password` は remote の優先順位ルールに従って対象になります。
- アクティブなローカル `gateway.auth.*` SecretRef が設定されていても未解決なら、node-host auth は fail closed します。
- Node-host auth 解決は `OPENCLAW_GATEWAY_*` env var のみを尊重します。

### Node host を起動する（service）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### ペアリング + 名前付け

gateway host 上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node が auth 詳細を変えて再試行した場合は、`openclaw devices list`
を再実行し、現在の `requestId` を承認してください。

命名オプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（Node 上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 側の上書き）。

### command を allowlist に追加する

exec 承認は **Node host ごと** です。gateway から allowlist エントリーを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認は Node host 上の `~/.openclaw/exec-approvals.json` に保存されます。

### exec を Node に向ける

デフォルトを設定します（gateway config）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッション単位で:

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後は、`host=node` を指定した `exec` 呼び出しはすべて Node host 上で実行されます（Node の allowlist/承認の対象）。

`host=auto` はそれ自体では暗黙に Node を選びませんが、呼び出し単位で明示的に `host=node` を要求することは `auto` から許可されます。セッションのデフォルトを Node exec にしたい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [Node host CLI](/ja-JP/cli/node)
- [Exec tool](/ja-JP/tools/exec)
- [Exec approvals](/ja-JP/tools/exec-approvals)

## command の呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「エージェントに MEDIA 添付を渡す」ワークフロー向けには、より高レベルの helper があります。

## スクリーンショット（canvas スナップショット）

Node が Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI helper（temp ファイルに書き込み、`MEDIA:<path>` を出力）:

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 制御

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注:

- `canvas present` は URL またはローカルファイルパス（`--target`）を受け付けます。位置指定には任意の `--x/--y/--width/--height` も使えます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- サポートされるのは A2UI v0.8 JSONL のみです（v0.9/createSurface は拒否されます）。

## 写真 + 動画（Node カメラ）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # デフォルト: 両方の向き（2 行の MEDIA）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注:

- `canvas.*` と `camera.*` では Node は **foreground** である必要があります（background 呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- oversized な base64 payload を避けるため、clip duration には制限があります（現在 `<= 60s`）。
- Android は可能な場合 `CAMERA`/`RECORD_AUDIO` 権限を求めます。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（Node）

対応 Node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` の可用性は Node プラットフォームに依存します。
- 画面録画は `<= 60s` に制限されます。
- `--no-audio` は、対応プラットフォームでマイク録音を無効化します。
- 複数画面がある場合は、`--screen <index>` で表示を選択します。

## 位置情報（Node）

Node は設定で Location が有効なときに `location.get` を公開します。

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- Location はデフォルトで **off** です。
- 「Always」はシステム権限が必要で、background fetch は best-effort です。
- 応答には緯度/経度、精度（メートル）、タイムスタンプが含まれます。

## SMS（Android Node）

Android Node は、ユーザーが **SMS** 権限を付与し、デバイスが telephony をサポートしている場合に `sms.send` を公開できます。

低レベル invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- capability が広告される前に、Android デバイス上で権限プロンプトを受け入れる必要があります。
- telephony のない Wi‑Fi 専用デバイスは `sms.send` を広告しません。

## Android の device と個人データ command

Android Node は、対応する capability が有効な場合に追加の command ファミリーを広告できます。

利用可能なファミリー:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

invoke の例:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注:

- motion command は利用可能なセンサーによって capability-gated されます。

## システム command（node host / mac node）

macOS Node は `system.run`, `system.notify`, `system.execApprovals.get/set` を公開します。
headless Node host は `system.run`, `system.which`, `system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注:

- `system.run` は payload 内で stdout/stderr/終了コードを返します。
- シェル実行は現在 `host=node` を指定した `exec` tool を経由します。`nodes` は明示的な Node command のための direct-RPC サーフェスのままです。
- `nodes invoke` は `system.run` や `system.run.prepare` を公開しません。これらは exec パスのみに残ります。
- exec パスは、承認前に正規の `systemRunPlan` を準備します。一度
  承認されると、gateway は後から呼び出し側が編集した command/cwd/session フィールドではなく、その保存済み plan を転送します。
- `system.notify` は macOS アプリ上の通知権限状態を尊重します。
- 未認識の Node `platform` / `deviceFamily` メタデータでは、`system.run` と `system.which` を除外する保守的なデフォルト allowlist が使われます。未知のプラットフォームで意図的にそれらの command が必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な allowlist（`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`）に縮小されます。
- allowlist モードでの allow-always 判定では、既知のディスパッチラッパー（`env`, `nice`, `nohup`, `stdbuf`, `timeout`）はラッパーパスではなく内部実行ファイルパスを永続化します。安全にアンラップできない場合、allowlist エントリーは自動で永続化されません。
- allowlist モードの Windows Node host では、`cmd.exe /c` 経由のシェルラッパー実行には承認が必要です（allowlist エントリーだけではラッパー形式は自動許可されません）。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- Node host は `PATH` 上書きを無視し、危険な起動/シェルキー（`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`）を除去します。追加の PATH エントリーが必要な場合は、`--env` で `PATH` を渡すのではなく、Node host service 環境を設定するか、標準的な場所に tool をインストールしてください。
- macOS Node mode では、`system.run` は macOS アプリ内の exec approvals によって制御されます（Settings → Exec approvals）。
  ask/allowlist/full は headless Node host と同じように動作し、拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- headless Node host では、`system.run` は exec approvals（`~/.openclaw/exec-approvals.json`）によって制御されます。

## Exec Node binding

複数の Node が利用可能な場合、exec を特定の Node に bind できます。
これにより、`exec host=node` のデフォルト Node が設定されます（エージェントごとに上書き可能）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

任意の Node を許可するには unset します。

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 権限マップ

Node は `node.list` / `node.describe` に、権限名（例: `screenRecording`, `accessibility`）をキー、真偽値（`true` = 許可済み）を値とする `permissions` マップを含めることがあります。

## Headless Node host（クロスプラットフォーム）

OpenClaw は、Gateway
WebSocket に接続し、`system.run` / `system.which` を公開する **headless Node host**（UI なし）を実行できます。これは Linux/Windows
や、サーバーと並行して最小構成の Node を実行する場合に便利です。

起動方法:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注:

- 依然としてペアリングが必要です（Gateway に device pairing プロンプトが表示されます）。
- Node host は、Node id、token、display name、gateway 接続情報を `~/.openclaw/node.json` に保存します。
- Exec approvals は `~/.openclaw/exec-approvals.json`
  によってローカルで強制されます（[Exec approvals](/ja-JP/tools/exec-approvals) を参照）。
- macOS では、headless Node host はデフォルトで `system.run` をローカル実行します。`system.run` を companion app exec host 経由にルーティングするには
  `OPENCLAW_NODE_EXEC_HOST=app` を設定してください。app host を必須にして、利用不能時に fail closed させるには
  `OPENCLAW_NODE_EXEC_FALLBACK=0` を追加してください。
- Gateway WS が TLS を使っている場合は `--tls` / `--tls-fingerprint` を追加してください。

## Mac Node mode

- macOS メニューバーアプリは Gateway WS server に Node として接続します（そのため `openclaw nodes …` がこの Mac に対して動作します）。
- remote mode では、アプリは Gateway port 向けに SSH トンネルを開き、`localhost` に接続します。

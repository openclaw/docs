---
read_when:
    - iOS/Android Node をgatewayにペアリングする
    - エージェントコンテキストに Node の canvas/camera を使う
    - 新しいNodeコマンドまたはCLIヘルパーの追加
summary: 'Nodes: ペアリング、機能、権限、および canvas/camera/screen/device/notifications/system 向けCLIヘルパー'
title: Node
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:34:50Z"
  model: gpt-5.4
  provider: openai
  source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
  source_path: nodes/index.md
  workflow: 15
---

**Node** は、Gateway の **WebSocket**（オペレーターと同じポート）に `role: "node"` で接続し、`node.invoke` を通じてコマンドサーフェス（例: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。プロトコル詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

レガシーtransport: [Bridge protocol](/ja-JP/gateway/bridge-protocol)（TCP JSONL;
現行Nodeでは履歴的なもののみ）。

macOS は **node mode** でも実行できます。メニューバーアプリが Gateway の
WSサーバーに接続し、そのローカルのcanvas/cameraコマンドをNodeとして公開します（そのため
`openclaw nodes …` をこのMacに対して使えます）。remote gateway mode では、browser
automation はネイティブアプリNodeではなく、CLI node host（`openclaw node run` または
インストール済みnode service）によって処理されます。

注意:

- Node は **周辺機器** であり、gateway ではありません。gateway service は実行しません。
- Telegram/WhatsApp などのメッセージは **gateway** に届き、Nodeには届きません。
- トラブルシューティングの手順書: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + 状態

**WS Node はdevice pairing を使います。** Node は `connect` 中にdevice identity を提示し、Gateway
は `role: node` 用のdevice pairing request を作成します。devices CLI（またはUI）で承認してください。

クイックCLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Node が変更された認証詳細（role/scopes/public key）で再試行した場合、以前の
保留中request は置き換えられ、新しい `requestId` が作成されます。承認前に
`openclaw devices list` を再実行してください。

注意:

- `nodes status` は、device pairing role に `node` が含まれている場合、そのNodeを **paired** として表示します。
- device pairing record は、永続的な承認済みrole契約です。token
  rotation はその契約内にとどまり、pairing承認で一度も認められていない
  別のrole にpaired Nodeを昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/rename`）は、別のgateway管理の
  node pairing store であり、WS の `connect` handshake は制御しません。
- 承認scope は、保留中request の宣言コマンドに従います:
  - コマンドなしrequest: `operator.pairing`
  - exec 以外のnodeコマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote node host（system.run）

Gateway が1台のマシンで動作していて、別のマシンでコマンドを
実行したい場合は **node host** を使います。モデルは引き続き **gateway** と通信し、
gateway は `host=node` が選ばれたときに `exec` 呼び出しを **node host** に転送します。

### どこで何が動くか

- **Gateway host**: メッセージを受け取り、モデルを実行し、ツール呼び出しをルーティングします。
- **Node host**: nodeマシン上で `system.run`/`system.which` を実行します。
- **承認**: node host 上の `~/.openclaw/exec-approvals.json` で強制されます。

承認に関する注意:

- 承認に基づくnode実行は、正確なrequestコンテキストにバインドされます。
- 直接のshell/runtime file 実行では、OpenClaw はベストエフォートで1つの具体的なローカル
  file operand にもバインドし、そのfile が実行前に変更されていた場合は実行を拒否します。
- OpenClaw がinterpreter/runtime コマンドに対して、正確に1つの具体的ローカルfile を識別できない場合、
  承認に基づく実行は、完全なruntimeカバレッジを装うのではなく拒否されます。より広いinterpreterセマンティクスには、sandboxing、
  別ホスト、または明示的な信頼済みallowlist/full workflow を使ってください。

### Node host を起動する（フォアグラウンド）

nodeマシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSHトンネル経由のremote gateway（loopback bind）

Gateway が loopback（`gateway.bind=loopback`、local mode のデフォルト）にbindしている場合、
remote node host は直接接続できません。SSHトンネルを作成し、
node host をそのトンネルのローカル側に向けてください。

例（node host -> gateway host）:

```bash
# Terminal A（実行し続ける）: local 18790 -> gateway 127.0.0.1:18789 を転送
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: gateway token をexport し、トンネル経由で接続
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意:

- `openclaw node run` は token 認証または password 認証をサポートします。
- 環境変数が推奨です: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- config フォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- local mode では、node host は意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- remote mode では、`gateway.remote.token` / `gateway.remote.password` は remote の優先順位ルールに従って候補になります。
- アクティブなローカル `gateway.auth.*` SecretRefs が設定されていて未解決の場合、node-host 認証はフェイルクローズします。
- node-host 認証解決は `OPENCLAW_GATEWAY_*` 環境変数のみを尊重します。

### Node host を起動する（service）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### ペアリング + 名前付け

gateway host 上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node が変更された認証詳細で再試行した場合は、`openclaw devices list`
を再実行し、現在の `requestId` を承認してください。

名前付けオプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（Node上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 側の上書き）。

### コマンドを許可リストに入れる

exec approvals は **node host ごと** です。gateway からallowlistエントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認はnode host 上の `~/.openclaw/exec-approvals.json` に保存されます。

### exec をNodeに向ける

デフォルトを設定する（gateway config）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごとに:

```
/exec host=node security=allowlist node=<id-or-name>
```

一度設定すると、`host=node` の `exec` 呼び出しはすべてnode host 上で実行されます（
node allowlist/approvals の対象）。

`host=auto` は暗黙にnodeを選びませんが、呼び出しごとの明示的な `host=node` 要求は `auto` から許可されます。セッションでnode exec をデフォルトにしたい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [Node host CLI](/ja-JP/cli/node)
- [Exec tool](/ja-JP/tools/exec)
- [Exec approvals](/ja-JP/tools/exec-approvals)

## コマンドの呼び出し

低レベル（生RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

よくある「エージェントにMEDIA添付を渡す」ワークフローには、より高レベルなヘルパーがあります。

## スクリーンショット（canvas snapshots）

Node が Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLIヘルパー（一時ファイルに書き込み、`MEDIA:<path>` を表示）:

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

注意:

- `canvas present` はURLまたはローカルfile path（`--target`）を受け付け、位置指定用の任意の `--x/--y/--width/--height` も使えます。
- `canvas eval` はインラインJS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意:

- A2UI v0.8 JSONL のみサポートされます（v0.9/createSurface は拒否されます）。

## 写真 + 動画（node camera）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # デフォルト: 両方の向き（2つのMEDIA行）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意:

- `canvas.*` と `camera.*` では、Node は **foreground** である必要があります（background 呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- クリップ時間は、base64ペイロードが大きくなりすぎないように制限されます（現在は `<= 60s`）。
- Android は可能な場合 `CAMERA`/`RECORD_AUDIO` 権限を求めます。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（Node）

対応Node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意:

- `screen.record` の可用性はNodeプラットフォームに依存します。
- 画面録画は `<= 60s` に制限されます。
- `--no-audio` は、対応プラットフォームでマイクキャプチャを無効にします。
- 複数画面がある場合は、`--screen <index>` でディスプレイを選択してください。

## 位置情報（Node）

位置情報が設定で有効になっている場合、Node は `location.get` を公開します。

CLIヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意:

- 位置情報はデフォルトで **off** です。
- 「Always」にはシステム権限が必要です。background 取得はベストエフォートです。
- 応答には、lat/lon、accuracy（メートル）、timestamp が含まれます。

## SMS（Android Node）

Android Node は、ユーザーが **SMS** 権限を付与し、デバイスがテレフォニーをサポートしている場合、`sms.send` を公開できます。

低レベルinvoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意:

- capability が広告される前に、Androidデバイス上で権限プロンプトを承認する必要があります。
- テレフォニーのないWi-Fi専用デバイスは `sms.send` を広告しません。

## Android device + 個人データコマンド

Android Node は、対応するcapabilities が有効な場合、追加のコマンドファミリーを広告できます。

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

注意:

- motion コマンドは、利用可能なsensor によって capability-gated されます。

## システムコマンド（node host / mac node）

macOS Node は `system.run`, `system.notify`, `system.execApprovals.get/set` を公開します。
headless node host は `system.run`, `system.which`, `system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意:

- `system.run` は、ペイロード内で stdout / stderr / 終了コードを返します。
- シェル実行は現在 `host=node` を指定した `exec` ツール経由で行われます。`nodes` は、明示的な node コマンド用のダイレクト RPC サーフェスのままです。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは `exec` パスでのみ利用できます。
- `exec` パスは、承認前に正規の `systemRunPlan` を準備します。いったん承認されると、Gateway は後から呼び出し元が編集した command/cwd/session フィールドではなく、その保存済みプランを転送します。
- `system.notify` は、macOS アプリの通知権限状態を尊重します。
- 認識されない node の `platform` / `deviceFamily` メタデータでは、`system.run` と `system.which` を除外する保守的なデフォルト allowlist が使用されます。不明なプラットフォームでそれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエスト単位の `--env` 値は明示的な allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に絞り込まれます。
- allowlist モードでの常時許可の決定では、既知のディスパッチラッパー（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）はラッパーパスではなく内部の実行可能ファイルパスを永続化します。安全にアンラップできない場合、allowlist エントリは自動的には永続化されません。
- Windows の node ホストで allowlist モードの場合、`cmd.exe /c` 経由のシェルラッパー実行は承認が必要です（allowlist エントリだけでは、そのラッパー形式は自動許可されません）。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- Node ホストは `PATH` の上書きを無視し、危険な startup/shell キー（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）を除去します。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、node ホストのサービス環境を設定するか、標準的な場所にツールをインストールしてください。
- macOS の node モードでは、`system.run` は macOS アプリ内の exec 承認（「Settings → Exec approvals」）によって制御されます。Ask / allowlist / full は headless node host と同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- headless node host では、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制御されます。

## Exec の node バインディング

複数の node が利用可能な場合、exec を特定の node にバインドできます。
これにより、`exec host=node` のデフォルト node が設定されます（エージェント単位で上書きも可能です）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

任意の node を許可するには、設定を解除します:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 権限マップ

Node には、`node.list` / `node.describe` に `permissions` マップを含めることができます。これは権限名（例: `screenRecording`、`accessibility`）をキーとし、真偽値（`true` = 許可済み）を値とします。

## headless node host（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続し、`system.run` / `system.which` を公開する **headless node host**（UI なし）を実行できます。これは Linux/Windows や、サーバーと一緒に最小構成の node を動かす場合に便利です。

起動方法:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意:

- ペアリングは引き続き必要です（Gateway にデバイスのペアリング確認プロンプトが表示されます）。
- node host は、node id、トークン、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。
- Exec 承認は `~/.openclaw/exec-approvals.json` を通じてローカルで適用されます
  （[Exec approvals](/ja-JP/tools/exec-approvals) を参照）。
- macOS では、headless node host はデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリの exec host 経由にルーティングするには `OPENCLAW_NODE_EXEC_HOST=app` を設定してください。アプリホストを必須にし、利用できない場合はクローズドフェイルさせるには、`OPENCLAW_NODE_EXEC_FALLBACK=0` も追加してください。
- Gateway WS が TLS を使用している場合は、`--tls` / `--tls-fingerprint` を追加してください。

## Mac の node モード

- macOS のメニューバーアプリは、Gateway WS サーバーに node として接続します（そのため、この Mac に対して `openclaw nodes …` を使用できます）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

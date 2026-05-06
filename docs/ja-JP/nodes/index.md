---
read_when:
    - iOS/Android ノードを Gateway にペアリングする
    - エージェントコンテキストにノードキャンバス/カメラを使用する
    - 新しい Node コマンドまたは CLI ヘルパーの追加
summary: 'ノード: canvas/camera/screen/device/notifications/system 向けのペアリング、ケイパビリティ、権限、CLI ヘルパー'
title: ノード
x-i18n:
    generated_at: "2026-05-06T09:06:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

**ノード**は、Gateway **WebSocket**（オペレーターと同じポート）に `role: "node"` で接続し、`node.invoke` 経由でコマンドサーフェス（例: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL。
現在のノードでは履歴用途のみ）。

macOS は **ノードモード**でも実行できます。メニューバーアプリが Gateway の
WS サーバーに接続し、ローカルの canvas/camera コマンドをノードとして公開します（そのため
`openclaw nodes …` はこの Mac に対して動作します）。リモート Gateway モードでは、ブラウザー
自動化はネイティブアプリのノードではなく、CLI ノードホスト（`openclaw node run` または
インストール済みノードサービス）が処理します。

注:

- ノードは **周辺機器**であり、Gateway ではありません。Gateway サービスは実行しません。
- Telegram/WhatsApp などのメッセージは**Gateway**に届き、ノードには届きません。
- トラブルシューティング手順書: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

**WS ノードはデバイスペアリングを使用します。** ノードは `connect` 中にデバイス ID を提示し、Gateway は
`role: node` のデバイスペアリングリクエストを作成します。devices CLI（または UI）で承認します。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

ノードが変更された認証詳細（ロール/スコープ/公開鍵）で再試行すると、以前の
保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に
`openclaw devices list` を再実行してください。

注:

- `nodes status` は、デバイスペアリングロールに `node` が含まれる場合にノードを**ペアリング済み**として示します。
- デバイスペアリングレコードは、永続的な承認済みロール契約です。トークン
  ローテーションはその契約内に留まります。ペアリング承認で付与されていない
  別のロールへ、ペアリング済みノードを昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、Gateway が所有する別の
  ノードペアリングストアです。WS の `connect` ハンドシェイクをゲートしません。
- `openclaw nodes remove --node <id|name|ip>` は、その別個の Gateway 所有ノードペアリングストアから
  古いエントリを削除します。
- 承認スコープは、保留中リクエストが宣言したコマンドに従います。
  - コマンドなしリクエスト: `operator.pairing`
  - exec 以外のノードコマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## リモートノードホスト（system.run）

Gateway があるマシンで実行され、コマンドを別のマシンで実行したい場合は、**ノードホスト**を使用します。
モデルは引き続き **Gateway** と通信します。`host=node` が選択されている場合、Gateway は
`exec` 呼び出しを**ノードホスト**へ転送します。

### どこで何が実行されるか

- **Gateway ホスト**: メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。
- **ノードホスト**: ノードマシン上で `system.run`/`system.which` を実行します。
- **承認**: `~/.openclaw/exec-approvals.json` を介してノードホスト上で適用されます。

承認に関する注:

- 承認に基づくノード実行は、正確なリクエストコンテキストに結び付けられます。
- 直接の shell/runtime ファイル実行では、OpenClaw はベストエフォートで具体的なローカル
  ファイルオペランド 1 つにも結び付け、そのファイルが実行前に変更された場合は実行を拒否します。
- OpenClaw がインタープリター/runtime コマンドについて具体的なローカルファイルを正確に 1 つ特定できない場合、
  承認に基づく実行は、runtime 全体をカバーしているように見せるのではなく拒否されます。より広いインタープリターセマンティクスには、サンドボックス化、
  分離ホスト、または明示的に信頼された許可リスト/完全なワークフローを使用してください。

### ノードホストを開始する（フォアグラウンド）

ノードマシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由のリモート Gateway（loopback バインド）

Gateway が loopback（`gateway.bind=loopback`、ローカルモードのデフォルト）にバインドされている場合、
リモートノードホストは直接接続できません。SSH トンネルを作成し、ノードホストを
トンネルのローカル側に向けます。

例（ノードホスト -> Gateway ホスト）:

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注:

- `openclaw node run` はトークン認証またはパスワード認証をサポートします。
- 環境変数が推奨です: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定のフォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、ノードホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、リモート優先順位ルールに従って `gateway.remote.token` / `gateway.remote.password` を使用できます。
- アクティブなローカル `gateway.auth.*` SecretRefs が設定されているが解決されていない場合、ノードホスト認証はフェイルクローズします。
- ノードホスト認証の解決では、`OPENCLAW_GATEWAY_*` 環境変数のみが尊重されます。

### ノードホストを開始する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### ペアリング + 名前付け

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードが変更された認証詳細で再試行する場合は、`openclaw devices list` を再実行し、
現在の `requestId` を承認してください。

名前付けオプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（ノード上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway 側の上書き）。

### コマンドを許可リストに追加する

Exec 承認は**ノードホストごと**です。Gateway から許可リストエントリを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認はノードホスト上の `~/.openclaw/exec-approvals.json` に保存されます。

### exec をノードに向ける

デフォルトを設定します（Gateway 設定）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごとに:

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後、`host=node` を含むすべての `exec` 呼び出しは、ノード許可リスト/承認の対象として
ノードホスト上で実行されます。

`host=auto` は単独では暗黙的にノードを選択しませんが、明示的な呼び出しごとの `host=node` リクエストは `auto` から許可されます。セッションのデフォルトとしてノード exec を使用したい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [ノードホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

## コマンドの呼び出し

低レベル（生 RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「エージェントに MEDIA 添付を渡す」ワークフロー向けに、より高レベルなヘルパーがあります。

## コマンドポリシー

ノードコマンドを呼び出すには、事前に 2 つのゲートを通過する必要があります。

1. ノードは WebSocket の `connect.commands` リストでそのコマンドを宣言する必要があります。
2. Gateway のプラットフォームポリシーが、宣言されたコマンドを許可する必要があります。

Windows および macOS のコンパニオンノードは、デフォルトで
`canvas.*`、`camera.list`、`location.get`、`screen.snapshot` などの安全な宣言済みコマンドを許可します。
`talk` 機能を広告する、または `talk.*` コマンドを宣言する信頼済みノードも、
プラットフォームラベルに関係なく、宣言済みの push-to-talk コマンド（`talk.ptt.start`、`talk.ptt.stop`、
`talk.ptt.cancel`、`talk.ptt.once`）をデフォルトで許可します。
`camera.snap`、`camera.clip`、
`screen.record` などの危険またはプライバシー影響の大きいコマンドは、引き続き
`gateway.nodes.allowCommands` による明示的な opt-in が必要です。`gateway.nodes.denyCommands` は常に
デフォルトおよび追加の許可リストエントリより優先されます。

Plugin が所有するノードコマンドは、Gateway の node-invoke ポリシーを追加できます。そのポリシーは
許可リストチェックの後、ノードへの転送前に実行されるため、生の
`node.invoke`、CLI ヘルパー、専用エージェントツールは同じ Plugin
権限境界を共有します。危険な Plugin ノードコマンドには、引き続き明示的な
`gateway.nodes.allowCommands` opt-in が必要です。

ノードが宣言済みコマンドリストを変更した後は、古いデバイスペアリングを拒否し、
新しいリクエストを承認して、Gateway が更新されたコマンドスナップショットを保存できるようにしてください。

## スクリーンショット（canvas スナップショット）

ノードが Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルに書き込み、`MEDIA:<path>` を出力します）:

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

- A2UI v0.8 JSONL のみがサポートされています（v0.9/createSurface は拒否されます）。

## 写真 + 動画（ノードカメラ）

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

- `canvas.*` と `camera.*` では、ノードが**フォアグラウンド**である必要があります（バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- 大きすぎる base64 ペイロードを避けるため、クリップ時間は制限されます（現在は `<= 60s`）。
- Android は可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を要求します。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（ノード）

サポートされているノードは `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` の可用性はノードプラットフォームに依存します。
- 画面録画は `<= 60s` に制限されます。
- `--no-audio` は、サポートされているプラットフォームでマイクキャプチャを無効にします。
- 複数の画面が利用できる場合は、`--screen <index>` を使用してディスプレイを選択します。

## 位置情報（ノード）

設定で Location が有効な場合、ノードは `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- Location は**デフォルトでオフ**です。
- 「Always」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには lat/lon、精度（メートル）、タイムスタンプが含まれます。

## SMS（Android ノード）

Android ノードは、ユーザーが **SMS** 権限を付与し、デバイスが電話機能をサポートしている場合に `sms.send` を公開できます。

低レベルの呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- 機能が広告される前に、Android デバイス上で権限プロンプトを承認する必要があります。
- 電話機能のない Wi-Fi 専用デバイスは `sms.send` を広告しません。

## Android デバイス + 個人データコマンド

Android ノードは、対応する機能が有効な場合に追加のコマンドファミリーを広告できます。

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

- モーションコマンドは、利用可能なセンサーによって機能制限されます。

## システムコマンド（Node ホスト / Mac Node）

macOS Node は `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。
ヘッドレス Node ホストは `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注記:

- `system.run` はペイロード内で stdout/stderr/終了コードを返します。
- シェル実行は現在、`host=node` を指定した `exec` ツール経由で行われます。`nodes` は明示的な Node コマンド用の直接 RPC サーフェスのままです。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パス専用のままです。
- exec パスは、承認前に正規の `systemRunPlan` を準備します。承認が付与されると、Gateway は後から呼び出し元が編集した command/cwd/session フィールドではなく、保存済みのそのプランを転送します。
- `system.notify` は macOS アプリ上の通知権限状態を尊重します。
- 認識されない Node の `platform` / `deviceFamily` メタデータには、`system.run` と `system.which` を除外する保守的なデフォルト許可リストが使用されます。不明なプラットフォームで意図的にこれらのコマンドが必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に縮小されます。
- 許可リストモードでの常に許可する判断では、既知のディスパッチラッパー（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）は、ラッパーパスではなく内部の実行可能ファイルパスを永続化します。安全にアンラップできない場合、許可リストエントリは自動的には永続化されません。
- 許可リストモードの Windows Node ホストでは、`cmd.exe /c` 経由のシェルラッパー実行には承認が必要です（許可リストエントリだけではラッパー形式は自動許可されません）。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- Node ホストは `PATH` の上書きを無視し、危険な起動/シェルキー（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）を取り除きます。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、Node ホストサービス環境を設定する（または標準の場所にツールをインストールする）ようにしてください。
- macOS Node モードでは、`system.run` は macOS アプリ内の exec 承認（Settings → Exec approvals）によって制御されます。
  Ask/allowlist/full はヘッドレス Node ホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレス Node ホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制御されます。

## Exec Node バインド

複数の Node が利用可能な場合、exec を特定の Node にバインドできます。
これにより、`exec host=node` のデフォルト Node が設定されます（エージェントごとに上書きできます）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

任意の Node を許可するように解除:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 権限マップ

Node は `node.list` / `node.describe` に `permissions` マップを含めることがあります。これは権限名（例: `screenRecording`、`accessibility`）をキーにし、真偽値（`true` = 付与済み）を持ちます。

## ヘッドレス Node ホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続し、`system.run` / `system.which` を公開する **ヘッドレス Node ホスト**（UI なし）を実行できます。これは Linux/Windows 上、またはサーバーの横で最小構成の Node を実行する場合に便利です。

起動:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注記:

- ペアリングは引き続き必要です（Gateway はデバイスペアリングのプロンプトを表示します）。
- Node ホストは、Node ID、トークン、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。
- exec 承認は `~/.openclaw/exec-approvals.json` によってローカルで適用されます
  （[Exec approvals](/ja-JP/tools/exec-approvals) を参照）。
- macOS では、ヘッドレス Node ホストはデフォルトで `system.run` をローカル実行します。`OPENCLAW_NODE_EXEC_HOST=app` を設定すると、`system.run` をコンパニオンアプリの exec ホスト経由にルーティングできます。`OPENCLAW_NODE_EXEC_FALLBACK=0` を追加すると、アプリホストを必須にし、利用できない場合は安全側に失敗します。
- Gateway WS が TLS を使用する場合は、`--tls` / `--tls-fingerprint` を追加してください。

## Mac Node モード

- macOS メニューバーアプリは Node として Gateway WS サーバーに接続します（そのため `openclaw nodes …` はこの Mac に対して動作します）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

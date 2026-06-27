---
read_when:
    - iOS/Android ノードを Gateway にペアリングする
    - エージェントコンテキストに node canvas/camera を使用する
    - 新しい Node コマンドまたは CLI ヘルパーの追加
summary: 'ノード: canvas/camera/screen/device/notifications/system のペアリング、機能、権限、CLI ヘルパー'
title: Nodes
x-i18n:
    generated_at: "2026-06-27T11:53:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

**ノード**は、Gateway **WebSocket**（オペレーターと同じポート）に `role: "node"` で接続し、`node.invoke` 経由でコマンドサーフェス（例: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/ヘッドレス）です。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL;
現在のノードでは履歴用途のみ）。

macOS は **ノードモード**でも実行できます。メニューバーアプリが Gateway の
WS サーバーに接続し、ローカルの Canvas/カメラコマンドをノードとして公開します（そのため
`openclaw nodes …` はこの Mac に対して動作します）。リモート Gateway モードでは、ブラウザー
自動化はネイティブアプリノードではなく、CLI ノードホスト（`openclaw node run` または
インストール済みノードサービス）が処理します。

注:

- ノードは **周辺機器**であり、Gateway ではありません。Gateway サービスは実行しません。
- Telegram/WhatsApp などのメッセージはノードではなく **Gateway** に届きます。
- トラブルシューティングのランブック: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

**WS ノードはデバイスペアリングを使用します。** ノードは `connect` 中にデバイス ID を提示します。Gateway は
`role: node` のデバイスペアリング要求を作成します。デバイス CLI（または UI）で承認してください。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

ノードが変更された認証詳細（ロール/スコープ/公開鍵）で再試行した場合、以前の
保留中要求は置き換えられ、新しい `requestId` が作成されます。承認する前に
`openclaw devices list` を再実行してください。

注:

- `nodes status` は、デバイスペアリングのロールに `node` が含まれている場合にノードを **paired** としてマークします。
- デバイスペアリングレコードは、承認済みロールの永続的な契約です。トークン
  ローテーションはその契約内に留まります。ペアリング承認で許可されていない
  別ロールへ、ペアリング済みノードを昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、Gateway が所有する別個の
  ノードペアリングストアです。WS `connect` ハンドシェイクをゲートしません。
- `openclaw nodes remove --node <id|name|ip>` はノードペアリングを削除します。
  デバイスに基づくノードの場合、`devices/paired.json` 内のデバイスの `node` ロールを取り消し、
  そのデバイスのノードロールセッションを切断します。複合ロールデバイスは
  行を保持し、`node` ロールだけを失います。一方、ノード専用デバイス行は
  削除されます。また、Gateway が所有する別個のノードペアリングストアから一致するエントリも
  消去します。`operator.pairing` は非オペレーターのノード行を削除できます。
  複合ロールデバイス上で自身のノードロールを取り消すデバイストークン呼び出し元には、
  追加で `operator.admin` が必要です。
- 承認スコープは保留中要求が宣言したコマンドに従います:
  - コマンドなしの要求: `operator.pairing`
  - 非 exec ノードコマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## リモートノードホスト（system.run）

Gateway があるマシンで実行され、別のマシンでコマンドを実行したい場合は
**ノードホスト**を使用します。モデルは引き続き **Gateway** と通信します。Gateway は
`host=node` が選択されている場合、`exec` 呼び出しを **ノードホスト**へ転送します。

### どこで何が実行されるか

- **Gateway ホスト**: メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。
- **ノードホスト**: ノードマシン上で `system.run`/`system.which` を実行します。
- **承認**: ノードホスト上の `~/.openclaw/exec-approvals.json` によって強制されます。

承認に関する注:

- 承認に基づくノード実行は、正確な要求コンテキストにバインドされます。
- 直接的な shell/runtime ファイル実行では、OpenClaw はベストエフォートで具体的なローカル
  ファイルオペランド 1 つにもバインドし、そのファイルが実行前に変更された場合は実行を拒否します。
- OpenClaw が interpreter/runtime コマンドについて具体的なローカルファイルを正確に 1 つ識別できない場合、
  完全な runtime カバレッジを装う代わりに、承認に基づく実行は拒否されます。より広いインタープリターセマンティクスには、サンドボックス化、
  別ホスト、または明示的な信頼済み許可リスト/完全ワークフローを使用してください。

### ノードホストを起動する（フォアグラウンド）

ノードマシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由のリモート Gateway（ループバックバインド）

Gateway がループバックにバインドしている場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、
リモートノードホストは直接接続できません。SSH トンネルを作成し、ノードホストを
トンネルのローカル側に向けてください。

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
- リモートモードでは、`gateway.remote.token` / `gateway.remote.password` はリモート優先順位ルールに従って対象になります。
- アクティブなローカル `gateway.auth.*` SecretRefs が設定されているが解決できない場合、ノードホスト認証はフェイルクローズします。
- ノードホスト認証の解決では `OPENCLAW_GATEWAY_*` 環境変数のみが考慮されます。

### ノードホストを起動する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### ペアリング + 命名

Gateway ホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードが変更された認証詳細で再試行した場合は、`openclaw devices list` を再実行し、
現在の `requestId` を承認してください。

命名オプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（ノード上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway のオーバーライド）。

### コマンドを許可リストに追加する

Exec 承認は **ノードホストごと**です。Gateway から許可リストエントリを追加します:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認はノードホスト上の `~/.openclaw/exec-approvals.json` にあります。

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

設定後、`host=node` の任意の `exec` 呼び出しはノードホストで実行されます（ノードの
許可リスト/承認の対象）。

`host=auto` はそれ自体で暗黙的にノードを選択しませんが、`auto` から明示的な呼び出しごとの `host=node` 要求は許可されます。セッションのデフォルトをノード exec にしたい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [ノードホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

## コマンドの呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「エージェントに MEDIA 添付を渡す」ワークフローには、より高レベルのヘルパーがあります。

## コマンドポリシー

ノードコマンドは呼び出し可能になる前に 2 つのゲートを通過する必要があります:

1. ノードが WebSocket `connect.commands` リストでそのコマンドを宣言している必要があります。
2. Gateway のプラットフォームポリシーが宣言されたコマンドを許可している必要があります。

Windows および macOS のコンパニオンノードは、デフォルトで
`canvas.*`、`camera.list`、`location.get`、`screen.snapshot` などの安全な宣言済みコマンドを許可します。
`talk` capability を広告する、または `talk.*` コマンドを宣言する信頼済みノードは、
プラットフォームラベルに関係なく、宣言済みのプッシュトゥトークコマンド（`talk.ptt.start`、`talk.ptt.stop`、
`talk.ptt.cancel`、`talk.ptt.once`）もデフォルトで許可します。
`camera.snap`、`camera.clip`、
`screen.record` などの危険またはプライバシー影響の大きいコマンドには、引き続き
`gateway.nodes.allowCommands` による明示的なオプトインが必要です。`gateway.nodes.denyCommands` は常に
デフォルトおよび追加の許可リストエントリより優先されます。

Plugin 所有のノードコマンドは、Gateway の node-invoke ポリシーを追加できます。そのポリシーは
許可リストチェックの後、ノードへの転送前に実行されるため、raw
`node.invoke`、CLI ヘルパー、専用エージェントツールは同じ Plugin
権限境界を共有します。危険な Plugin ノードコマンドには、引き続き明示的な
`gateway.nodes.allowCommands` オプトインが必要です。

ノードが宣言済みコマンドリストを変更した後は、古いデバイスペアリングを拒否し、
新しい要求を承認して、Gateway に更新済みコマンドスナップショットを保存させてください。

## 設定（`openclaw.json`）

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

正確なノードコマンド名を使用してください。`denyCommands` は、プラットフォームデフォルトまたは
`allowCommands` エントリが許可する場合でも、コマンドを削除します。Gateway ノードペアリングとコマンドポリシーフィールドの詳細は
[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway-field-details)
を参照してください。

エージェントごとの exec ノードオーバーライド:

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

ノードが Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルに書き込み、保存されたパスを出力します）:

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

- モバイルノードは、アクション可能なレンダリングのために、バンドルされたアプリ所有の A2UI ページを使用します。
- A2UI v0.8 JSONL のみがサポートされます（v0.9/createSurface は拒否されます）。
- iOS と Android はリモート Gateway Canvas ページをレンダリングしますが、A2UI ボタンアクションはバンドルされたアプリ所有の A2UI ページからのみディスパッチされます。Gateway ホストの HTTP/HTTPS A2UI ページは、これらのモバイルクライアントではレンダリング専用です。

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

注記:

- `canvas.*` と `camera.*` では、node が**フォアグラウンド**になっている必要があります（バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- 過大な base64 ペイロードを避けるため、クリップの長さは（現在 `<= 60s` に）クランプされます。
- Android は可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を求めます。権限が拒否されると `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（nodes）

対応 node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注記:

- `screen.record` の可用性は node プラットフォームに依存します。
- 画面録画は `<= 60s` にクランプされます。
- `--no-audio` は対応プラットフォームでマイクキャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します。

## 位置情報（nodes）

設定で位置情報が有効になっている場合、node は `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注記:

- 位置情報は**デフォルトでオフ**です。
- 「常に」はシステム権限を必要とします。バックグラウンド取得はベストエフォートです。
- 応答には緯度/経度、精度（メートル）、タイムスタンプが含まれます。

## SMS（Android nodes）

Android node は、ユーザーが **SMS** 権限を付与し、デバイスが電話機能に対応している場合に `sms.send` を公開できます。

低レベル呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注記:

- capability が通知される前に、Android デバイス上で権限プロンプトを承認する必要があります。
- 電話機能のない Wi-Fi 専用デバイスは `sms.send` を通知しません。

## Android デバイス + 個人データコマンド

Android node は、対応する capability が有効になっている場合に追加のコマンドファミリーを通知できます。

利用可能なファミリー:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- Android 設定でインストール済みアプリの共有が有効な場合の `device.apps`
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注記:

- `device.apps` はオプトインで、デフォルトではランチャーに表示されるアプリを返します。
- motion コマンドは利用可能なセンサーによって capability 制御されます。

## システムコマンド（node ホスト / Mac node）

macOS node は `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。
ヘッドレス node ホストは `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注記:

- `system.run` はペイロード内で stdout/stderr/終了コードを返します。
- Shell 実行は現在、`host=node` の `exec` ツールを経由します。`nodes` は明示的な node コマンドの直接 RPC サーフェスとして残ります。
- `nodes invoke` は `system.run` や `system.run.prepare` を公開しません。これらは exec パスのみに残ります。
- exec パスは承認前に正規の `systemRunPlan` を準備します。承認が付与されると、Gateway は保存済みのその plan を転送し、後から呼び出し元が編集した command/cwd/session フィールドは転送しません。
- `system.notify` は macOS アプリ上の通知権限状態を尊重します。
- 認識されない node の `platform` / `deviceFamily` メタデータでは、`system.run` と `system.which` を除外する保守的なデフォルト許可リストを使用します。不明なプラットフォームでそれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- Shell ラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に縮小されます。
- allowlist モードの常時許可判断では、既知のディスパッチラッパー（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）はラッパーパスではなく内側の実行可能ファイルパスを永続化します。安全にアンラップできない場合、許可リストエントリは自動的には永続化されません。
- allowlist モードの Windows node ホストでは、`cmd.exe /c` 経由の shell ラッパー実行は承認が必要です（許可リストエントリだけではラッパー形式は自動許可されません）。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- Node ホストは `PATH` の上書きを無視し、危険な起動/シェルキー（`DYLD_*`、`LD_*`、`BASHOPTS`、`FPATH`、`KSH_ENV`、`NODE_OPTIONS`、`NODE_REDIRECT_WARNINGS`、`NODE_REPL_EXTERNAL_MODULE`、`NODE_REPL_HISTORY`、`NODE_V8_COVERAGE`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`、`TCLLIBPATH`）を取り除きます。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、node ホストサービス環境を設定する（または標準の場所にツールをインストールする）ようにしてください。
- macOS node モードでは、`system.run` は macOS アプリの exec 承認（設定 → Exec approvals）によって制御されます。
  Ask/allowlist/full はヘッドレス node ホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレス node ホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制御されます。

## Exec node バインディング

複数の node が利用可能な場合、exec を特定の node にバインドできます。
これにより `exec host=node` のデフォルト node が設定されます（agent ごとに上書きできます）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

agent ごとの上書き:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

任意の node を許可するには設定を解除します:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 権限マップ

node は `node.list` / `node.describe` 内に `permissions` マップを含める場合があります。これは権限名（例: `screenRecording`、`accessibility`）をキーとし、boolean 値（`true` = 付与済み）を持ちます。

## ヘッドレス node ホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する**ヘッドレス node ホスト**（UI なし）を実行できます。これは Linux/Windows 上、またはサーバーと並べて最小限の node を実行する場合に便利です。

起動します:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注記:

- ペアリングは引き続き必要です（Gateway はデバイスペアリングプロンプトを表示します）。
- node ホストは node id、token、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。
- Exec 承認は `~/.openclaw/exec-approvals.json` によってローカルで適用されます
  （[Exec approvals](/ja-JP/tools/exec-approvals) を参照）。
- macOS では、ヘッドレス node ホストはデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリの exec ホスト経由にルーティングするには `OPENCLAW_NODE_EXEC_HOST=app` を設定します。アプリホストを必須にし、利用できない場合に fail closed するには `OPENCLAW_NODE_EXEC_FALLBACK=0` を追加します。
- Gateway WS が TLS を使用する場合は `--tls` / `--tls-fingerprint` を追加します。

## Mac node モード

- macOS メニューバーアプリは node として Gateway WS サーバーに接続します（そのため、この Mac に対して `openclaw nodes …` が動作します）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

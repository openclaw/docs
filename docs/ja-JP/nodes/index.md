---
read_when:
    - iOS/Android ノードを Gateway にペアリングする
    - エージェントコンテキストにノードのキャンバス/カメラを使用する
    - 新しい Node コマンドや CLI ヘルパーの追加
summary: 'Node: ペアリング、機能、権限、および canvas/camera/screen/device/notifications/system 用の CLI ヘルパー'
title: ノード
x-i18n:
    generated_at: "2026-07-03T09:22:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

**ノード**は、Gateway **WebSocket**（オペレーターと同じポート）に `role: "node"` で接続し、`node.invoke` 経由でコマンドサーフェス（例: `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS/iOS/Android/headless）です。プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

レガシートランスポート: [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)（TCP JSONL;
現在のノードでは履歴目的のみ）。

macOS は **ノードモード**でも実行できます。メニューバーアプリが Gateway の
WS サーバーへ接続し、ローカルの Canvas/カメラコマンドをノードとして公開します（そのため
`openclaw nodes …` はこの Mac に対して動作します）。リモートゲートウェイモードでは、ブラウザー
自動化はネイティブアプリノードではなく、CLI ノードホスト（`openclaw node run` または
インストール済みのノードサービス）が処理します。

注:

- ノードは **周辺機器**であり、ゲートウェイではありません。ゲートウェイサービスは実行しません。
- Telegram/WhatsApp などのメッセージは **ゲートウェイ**に届き、ノードには届きません。
- トラブルシューティングランブック: [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)

## ペアリング + ステータス

**WS ノードはデバイスペアリングを使用します。** ノードは `connect` 中にデバイス ID を提示し、Gateway
は `role: node` のデバイスペアリングリクエストを作成します。デバイス CLI（または UI）で承認します。

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

- デバイスペアリングロールに `node` が含まれる場合、`nodes status` はノードを **paired** としてマークします。
- デバイスペアリングレコードは、永続的な承認済みロール契約です。トークン
  ローテーションはその契約内に留まります。ペアリング承認で付与されていない
  別ロールへ、ペア済みノードを昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/remove/rename`）は、Gateway が所有する別の
  ノードペアリングストアです。WS `connect` ハンドシェイクのゲートには **なりません**。
- `openclaw nodes remove --node <id|name|ip>` はノードペアリングを削除します。
  デバイスに裏付けられたノードでは、`devices/paired.json` にあるデバイスの `node` ロールを取り消し、
  そのデバイスのノードロールセッションを切断します。混在ロールデバイスは
  行を保持し、`node` ロールだけを失います。一方、ノード専用デバイスの行は
  削除されます。また、Gateway が所有する別のノードペアリングストアからも、
  一致するエントリを消去します。`operator.pairing` は非オペレーターノード行を削除できます。
  混在ロールデバイスで自身のノードロールを取り消すデバイストークン呼び出し元には、
  追加で `operator.admin` が必要です。
- 承認スコープは、保留中リクエストが宣言したコマンドに従います:
  - コマンドなしリクエスト: `operator.pairing`
  - 非 exec ノードコマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## リモートノードホスト（system.run）

Gateway があるマシンで実行され、別のマシンでコマンドを実行したい場合は、**ノードホスト**を使用します。
モデルは引き続き **ゲートウェイ**と通信します。`host=node` が選択されている場合、ゲートウェイは
`exec` 呼び出しを **ノードホスト**へ転送します。

### どこで何が実行されるか

- **Gateway ホスト**: メッセージを受信し、モデルを実行し、ツール呼び出しをルーティングします。
- **ノードホスト**: ノードマシン上で `system.run`/`system.which` を実行します。
- **承認**: `~/.openclaw/exec-approvals.json` によりノードホスト上で強制されます。

承認に関する注:

- 承認に裏付けられたノード実行は、正確なリクエストコンテキストにバインドされます。
- 直接のシェル/ランタイムファイル実行では、OpenClaw はベストエフォートで具体的なローカル
  ファイルオペランドを 1 つバインドし、そのファイルが実行前に変更された場合は実行を拒否します。
- OpenClaw がインタープリター/ランタイムコマンドについて、具体的なローカルファイルを正確に 1 つ識別できない場合、
  完全なランタイムカバレッジを装うのではなく、承認に裏付けられた実行は拒否されます。より広いインタープリターセマンティクスには、
  サンドボックス化、別ホスト、または明示的に信頼された allowlist/完全ワークフローを使用してください。

### ノードホストを開始する（フォアグラウンド）

ノードマシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由のリモートゲートウェイ（ループバックバインド）

Gateway がループバックにバインドしている場合（`gateway.bind=loopback`、ローカルモードのデフォルト）、
リモートノードホストは直接接続できません。SSH トンネルを作成し、ノードホストを
トンネルのローカル側へ向けます。

例（ノードホスト -> ゲートウェイホスト）:

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
- 設定フォールバックは `gateway.auth.token` / `gateway.auth.password` です。
- ローカルモードでは、ノードホストは意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- リモートモードでは、リモート優先順位ルールに従って `gateway.remote.token` / `gateway.remote.password` を使用できます。
- アクティブなローカル `gateway.auth.*` SecretRefs が設定されているが未解決の場合、ノードホスト認証は fail closed します。
- ノードホスト認証解決は `OPENCLAW_GATEWAY_*` 環境変数のみを尊重します。

### ノードホストを開始する（サービス）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### ペアリング + 名前

ゲートウェイホスト上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

ノードが変更された認証詳細で再試行した場合は、`openclaw devices list` を再実行し、
現在の `requestId` を承認してください。

名前付けオプション:

- `openclaw node run` / `openclaw node install` の `--display-name`（ノード上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（ゲートウェイ側の上書き）。

### コマンドを allowlist に追加する

Exec 承認は **ノードホストごと**です。ゲートウェイから allowlist エントリを追加します:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

承認はノードホスト上の `~/.openclaw/exec-approvals.json` に存在します。

### exec をノードへ向ける

デフォルトを設定します（ゲートウェイ設定）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごとに:

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後、`host=node` の任意の `exec` 呼び出しはノードホスト上で実行されます（ノードの
allowlist/承認の対象）。

`host=auto` は単独では暗黙的にノードを選択しませんが、`auto` から明示的な呼び出しごとの `host=node` リクエストは許可されます。セッションのデフォルトとしてノード exec を使いたい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [ノードホスト CLI](/ja-JP/cli/node)
- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

### ローカルモデル推論

デスクトップまたはサーバーノードは、そのノード上で実行されている Ollama サーバーから
チャット対応モデルを公開できます。エージェントは Ollama Plugin の `node_inference` ツールを使って
インストール済みモデルを検出し、境界付きプロンプトをリモートで実行します。Gateway は
Ollama への直接ネットワークアクセスを必要としません。セットアップ、モデルフィルタリング、直接検証コマンドについては
[Ollama ノードローカル推論](/ja-JP/providers/ollama#node-local-inference)を参照してください。

## コマンドの呼び出し

低レベル（raw RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「エージェントに MEDIA 添付ファイルを渡す」ワークフローには、より高レベルのヘルパーがあります。

## コマンドポリシー

ノードコマンドは、呼び出される前に 2 つのゲートを通過する必要があります:

1. ノードが WebSocket `connect.commands` リストでコマンドを宣言している必要があります。
2. ゲートウェイのプラットフォームポリシーが、宣言されたコマンドを許可している必要があります。

Windows および macOS のコンパニオンノードは、デフォルトで
`canvas.*`、`camera.list`、`location.get`、`screen.snapshot` などの安全な宣言済みコマンドを許可します。
`talk` capability を広告する、または `talk.*` コマンドを宣言する信頼済みノードも、
プラットフォームラベルとは独立して、宣言済みのプッシュトゥトークコマンド（`talk.ptt.start`、`talk.ptt.stop`、
`talk.ptt.cancel`、`talk.ptt.once`）をデフォルトで許可します。
`camera.snap`、`camera.clip`、`screen.record` などの危険またはプライバシー影響の大きいコマンドは、
引き続き `gateway.nodes.allowCommands` による明示的なオプトインが必要です。
`gateway.nodes.denyCommands` は常にデフォルトと追加の allowlist エントリより優先されます。

Plugin が所有するノードコマンドは、Gateway の node-invoke ポリシーを追加できます。そのポリシーは
allowlist チェック後、ノードへの転送前に実行されるため、raw
`node.invoke`、CLI ヘルパー、専用エージェントツールは同じ Plugin
権限境界を共有します。危険な Plugin ノードコマンドには、引き続き明示的な
`gateway.nodes.allowCommands` オプトインが必要です。

ノードが宣言済みコマンドリストを変更した後は、古いデバイスペアリングを拒否し、
新しいリクエストを承認して、ゲートウェイが更新済みコマンドスナップショットを保存するようにします。

## 設定（`openclaw.json`）

ノード関連設定は `gateway.nodes` と `tools.exec` の下にあります:

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

正確なノードコマンド名を使用してください。`denyCommands` は、
プラットフォームデフォルトまたは `allowCommands` エントリで許可される場合でも、コマンドを削除します。
ゲートウェイノードペアリングとコマンドポリシーフィールドの詳細については、
[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#gateway-field-details)を参照してください。

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

## スクリーンショット（Canvas スナップショット）

ノードが Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルへ書き込み、保存されたパスを出力します）:

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

- `canvas present` は URL またはローカルファイルパス（`--target`）に加え、配置用の任意の `--x/--y/--width/--height` を受け付けます。
- `canvas eval` はインライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注:

- モバイルノードは、アクション対応レンダリングにバンドルされたアプリ所有の A2UI ページを使用します。
- A2UI v0.8 JSONL のみがサポートされます（v0.9/createSurface は拒否されます）。
- iOS と Android はリモート Gateway Canvas ページをレンダリングしますが、A2UI ボタンアクションはバンドルされたアプリ所有の A2UI ページからのみディスパッチされます。Gateway がホストする HTTP/HTTPS A2UI ページは、これらのモバイルクライアントではレンダリング専用です。

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

- ノードは `canvas.*` と `camera.*` のために**フォアグラウンド**である必要があります（バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- クリップの長さは、大きすぎる base64 ペイロードを避けるために（現在は `<= 60s` に）制限されます。
- Android は可能な場合に `CAMERA`/`RECORD_AUDIO` 権限を求めます。拒否された権限は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（ノード）

サポートされるノードは `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注:

- `screen.record` の可用性はノードプラットフォームによって異なります。
- 画面録画は `<= 60s` に制限されます。
- `--no-audio` は、サポートされるプラットフォームでマイクキャプチャを無効にします。
- 複数の画面が利用可能な場合は、`--screen <index>` を使用してディスプレイを選択します。

## 位置情報（ノード）

設定で位置情報が有効な場合、ノードは `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注:

- 位置情報は**デフォルトでオフ**です。
- 「常に許可」にはシステム権限が必要です。バックグラウンド取得はベストエフォートです。
- レスポンスには lat/lon、精度（メートル）、タイムスタンプが含まれます。

## SMS（Android ノード）

Android ノードは、ユーザーが **SMS** 権限を付与し、デバイスが電話機能をサポートしている場合に `sms.send` を公開できます。

低レベルの呼び出し:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注:

- ケイパビリティが通知される前に、Android デバイスで権限プロンプトを承認する必要があります。
- 電話機能のない Wi-Fi 専用デバイスは `sms.send` を通知しません。

## Android デバイス + 個人データコマンド

Android ノードは、対応するケイパビリティが有効な場合に追加のコマンドファミリーを通知できます。

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

注:

- `device.apps` はオプトインで、デフォルトではランチャーに表示されるアプリを返します。
- モーションコマンドは、利用可能なセンサーによってケイパビリティ制限されます。

## システムコマンド（ノードホスト / Mac ノード）

macOS ノードは `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。
ヘッドレスノードホストは `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注:

- `system.run` はペイロード内で stdout/stderr/終了コードを返します。
- シェル実行は現在、`host=node` の `exec` ツールを経由します。`nodes` は明示的なノードコマンド用の直接 RPC サーフェスのままです。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec パス上にのみ残ります。
- exec パスは承認前に正規の `systemRunPlan` を準備します。承認が付与されると、Gateway は後から呼び出し元が編集した command/cwd/session フィールドではなく、その保存済みプランを転送します。
- `system.notify` は macOS アプリの通知権限状態を尊重します。
- 認識されないノード `platform` / `deviceFamily` メタデータは、`system.run` と `system.which` を除外する保守的なデフォルトの許可リストを使用します。不明なプラットフォームでこれらのコマンドが意図的に必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの `--env` 値は明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に絞られます。
- 許可リストモードでの常時許可の決定では、既知のディスパッチラッパー（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）はラッパーパスではなく内部実行ファイルのパスを永続化します。安全にアンラップできない場合、許可リストエントリは自動的には永続化されません。
- 許可リストモードの Windows ノードホストでは、`cmd.exe /c` 経由のシェルラッパー実行には承認が必要です（許可リストエントリだけではラッパー形式を自動許可しません）。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- ノードホストは `PATH` の上書きを無視し、危険な起動/シェルキー（`DYLD_*`、`LD_*`、`BASHOPTS`、`FPATH`、`KSH_ENV`、`NODE_OPTIONS`、`NODE_REDIRECT_WARNINGS`、`NODE_REPL_EXTERNAL_MODULE`、`NODE_REPL_HISTORY`、`NODE_V8_COVERAGE`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`、`TCLLIBPATH`）を取り除きます。追加の PATH エントリが必要な場合は、`--env` で `PATH` を渡すのではなく、ノードホストサービス環境を設定するか、標準の場所にツールをインストールしてください。
- macOS ノードモードでは、`system.run` は macOS アプリ内の exec 承認（設定 → Exec approvals）によって制御されます。
  ask/allowlist/full はヘッドレスノードホストと同じように動作します。拒否されたプロンプトは `SYSTEM_RUN_DENIED` を返します。
- ヘッドレスノードホストでは、`system.run` は exec 承認（`~/.openclaw/exec-approvals.json`）によって制御されます。

## Exec ノードバインディング

複数のノードが利用可能な場合、exec を特定のノードにバインドできます。
これにより、`exec host=node` のデフォルトノードが設定されます（エージェントごとに上書きできます）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

任意のノードを許可するように未設定にする:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 権限マップ

ノードは `node.list` / `node.describe` に `permissions` マップを含む場合があります。これは権限名（例: `screenRecording`、`accessibility`）をキーとし、真偽値（`true` = 付与済み）を値とします。

## ヘッドレスノードホスト（クロスプラットフォーム）

OpenClaw は、Gateway WebSocket に接続して `system.run` / `system.which` を公開する **ヘッドレスノードホスト**（UI なし）を実行できます。これは Linux/Windows 上、またはサーバーと並行して最小限のノードを実行する場合に便利です。

起動する:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注:

- ペアリングは引き続き必要です（Gateway はデバイスペアリングプロンプトを表示します）。
- ノードホストは、ノード ID、トークン、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。
- Exec 承認は `~/.openclaw/exec-approvals.json` を通じてローカルで適用されます
  （[Exec approvals](/ja-JP/tools/exec-approvals) を参照）。
- macOS では、ヘッドレスノードホストはデフォルトで `system.run` をローカル実行します。`system.run` をコンパニオンアプリ exec ホスト経由にルーティングするには `OPENCLAW_NODE_EXEC_HOST=app` を設定します。アプリホストを必須にし、利用できない場合にフェイルクローズするには `OPENCLAW_NODE_EXEC_FALLBACK=0` を追加します。
- Gateway WS が TLS を使用する場合は、`--tls` / `--tls-fingerprint` を追加します。

## Mac ノードモード

- macOS メニューバーアプリはノードとして Gateway WS サーバーに接続します（そのため `openclaw nodes …` はこの Mac に対して動作します）。
- リモートモードでは、アプリは Gateway ポート用の SSH トンネルを開き、`localhost` に接続します。

---
read_when:
    - Gateway processを実行またはデバッグする შემთხვევაში
summary: Gatewayサービス、ライフサイクル、運用のためのランブック
title: Gatewayランブック
x-i18n:
    generated_at: "2026-04-24T04:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Gatewayサービスのday-1起動とday-2運用にはこのページを使ってください。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    症状優先の診断。正確なコマンド手順とログシグネチャ付き。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイド + 完全な設定リファレンス。
  </Card>
  <Card title="Secrets管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef契約、ランタイムsnapshot動作、移行/リロード操作。
  </Card>
  <Card title="Secrets plan契約" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` のtarget/pathルールとref専用auth-profile動作。
  </Card>
</CardGroup>

## 5分でできるローカル起動

<Steps>
  <Step title="Gatewayを起動する">

```bash
openclaw gateway --port 18789
# debug/traceをstdioにも出力
openclaw gateway --port 18789 --verbose
# 選択したポートのlistenerを強制終了してから起動
openclaw gateway --force
```

  </Step>

  <Step title="サービスの健全性を確認する">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健全なベースライン: `Runtime: running`、`Connectivity probe: ok`、および期待どおりの `Capability: ...`。到達性だけでなくread-scope RPCの証明が必要な場合は `openclaw gateway status --require-rpc` を使ってください。

  </Step>

  <Step title="チャンネルの準備状況を検証する">

```bash
openclaw channels status --probe
```

到達可能なgatewayがあれば、これはアカウントごとのライブなチャンネルprobeと任意の監査を実行します。
gatewayに到達できない場合、CLIはライブprobe出力の代わりに
configのみのチャンネル要約へフォールバックします。

  </Step>
</Steps>

<Note>
Gateway config reloadは、アクティブなconfig file path（profile/stateのデフォルト、または設定されていれば `OPENCLAW_CONFIG_PATH` から解決）を監視します。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
最初の正常な読み込み後、実行中processはアクティブなインメモリconfig snapshotを提供し、正常なreloadはそのsnapshotをアトミックに切り替えます。
</Note>

## ランタイムモデル

- ルーティング、control plane、チャンネル接続のための常時稼働processが1つ
- 次のための単一多重化ポート:
  - WebSocket control/RPC
  - HTTP API、OpenAI互換（`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`）
  - Control UIとフック
- デフォルトbind mode: `loopback`
- デフォルトでauth必須。shared-secret構成では
  `gateway.auth.token` / `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使い、non-loopbackの
  reverse-proxy構成では `gateway.auth.mode: "trusted-proxy"` を使えます。

## OpenAI互換エンドポイント

OpenClawの現在もっともレバレッジの高い互換サーフェスは次です:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- 多くのOpen WebUI、LobeChat、LibreChat統合は最初に `/v1/models` をprobeします。
- 多くのRAGおよびmemoryパイプラインは `/v1/embeddings` を期待します。
- agentネイティブクライアントはますます `/v1/responses` を好むようになっています。

計画上の注記:

- `/v1/models` はagent-firstです: `openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定済みのデフォルトagentにマッピングされる安定したaliasです。
- バックエンドprovider/modelをoverrideしたい場合は `x-openclaw-model` を使ってください。そうでなければ、選択されたagentの通常のmodelとembedding設定がそのまま制御を持ちます。

これらはすべてメインGatewayポート上で動作し、Gatewayの他のHTTP APIと同じ信頼されたoperator auth境界を使います。

### ポートとbindの優先順位

| 設定         | 解決順                                                |
| ------------ | ----------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode    | CLI/override → `gateway.bind` → `loopback`            |

### ホットリロードモード

| `gateway.reload.mode` | 動作                                      |
| --------------------- | ----------------------------------------- |
| `off`                 | config reloadなし                         |
| `hot`                 | ホットセーフな変更のみ適用                |
| `restart`             | reload必須の変更時にrestart               |
| `hybrid` (default)    | 安全ならホット適用、必要ならrestart       |

## operatorコマンドセット

```bash
openclaw gateway status
openclaw gateway status --deep   # システムレベルのサービススキャンを追加
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` は追加のサービス検出（LaunchDaemons/systemd system
units/schtasks）向けであり、より深いRPC health probeではありません。

## 複数Gateway（同一ホスト）

ほとんどのインストールでは、1台のマシンにつき1つのgatewayを実行するべきです。単一のgatewayで複数の
agentとチャンネルをホストできます。

複数gatewayが必要なのは、意図的に分離やrescue botが欲しい場合だけです。

便利な確認:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定されること:

- `gateway status --deep` は `Other gateway-like services detected (best effort)`
  を報告し、古いlaunchd/systemd/schtasksインストールがまだ残っている場合に
  クリーンアップヒントを表示することがあります。
- `gateway probe` は、複数のtargetが応答した場合に `multiple reachable gateways` と警告できます。
- それが意図的な場合は、gatewayごとにポート、config/state、workspace rootを分離してください。

インスタンスごとのチェックリスト:

- 一意の `gateway.port`
- 一意の `OPENCLAW_CONFIG_PATH`
- 一意の `OPENCLAW_STATE_DIR`
- 一意の `agents.defaults.workspace`

例:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

詳細なセットアップ: [/gateway/multiple-gateways](/ja-JP/gateway/multiple-gateways)。

## リモートアクセス

推奨: Tailscale/VPN。
フォールバック: SSHトンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

その後、クライアントをローカルの `ws://127.0.0.1:18789` に接続してください。

<Warning>
SSHトンネルはgateway authを回避しません。shared-secret authでは、クライアントは
トンネル経由でも `token`/`password` を送る必要があります。identity-bearing modeでも、
リクエストは引き続きそのauth pathを満たす必要があります。
</Warning>

参照: [Remote Gateway](/ja-JP/gateway/remote), [Authentication](/ja-JP/gateway/authentication), [Tailscale](/ja-JP/gateway/tailscale)。

## 監視とサービスライフサイクル

本番相当の信頼性には、監視付き実行を使ってください。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent labelは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きprofile）です。`openclaw doctor` はサービスconfig driftを監査・修復します。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も持続させるには、lingeringを有効化します:

```bash
sudo loginctl enable-linger <user>
```

カスタムインストールパスが必要な場合の手動user-unit例:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

ネイティブWindowsの管理起動は、`OpenClaw Gateway`
（名前付きprofileでは `OpenClaw Gateway (<profile>)`）という名前のScheduled Taskを使います。もしScheduled Taskの
作成が拒否された場合、OpenClawはstate directory内の `gateway.cmd` を指す
ユーザーごとのStartup-folder launcherにフォールバックします。

  </Tab>

  <Tab title="Linux (system service)">

マルチユーザー/常時稼働ホストではsystem unitを使ってください。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

user unitと同じservice本体を使いますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` の下にインストールし、
`openclaw` バイナリの場所が異なる場合は `ExecStart=` を調整してください。

  </Tab>
</Tabs>

## dev profileクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには分離されたstate/configとベースgateway port `19001` が含まれます。

## プロトコル簡易リファレンス（operator view）

- 最初のクライアントframeは `connect` でなければなりません。
- Gatewayは `hello-ok` snapshot（`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy）を返します。
- `hello-ok.features.methods` / `events` は保守的なdiscovery listであり、
  呼び出し可能なhelper routeすべての自動生成ダンプではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`.
- 一般的なイベントには `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, pairing/approval lifecycle events, `shutdown` があります。

agent実行は2段階です:

1. 即時の受理ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間に `agent` イベントがStreamingされます。

完全なプロトコル文書: [Gateway Protocol](/ja-JP/gateway/protocol) を参照してください。

## 運用チェック

### Liveness

- WSを開いて `connect` を送信する。
- `hello-ok` 応答とsnapshotを期待する。

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap recovery

イベントは再送されません。シーケンスにgapがある場合は、続行前に状態（`health`, `system-presence`）を更新してください。

## よくある失敗シグネチャ

| シグネチャ                                                   | 考えられる問題                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                  | 有効なgateway auth pathなしでnon-loopback bindしようとしている                 |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                      |
| `Gateway start blocked: set gateway.mode=local`              | configがremote modeに設定されている、またはlocal-mode stampが壊れたconfigから失われている |
| `unauthorized` during connect                                | クライアントとgatewayのauth不一致                                               |

完全な診断手順については [Gateway Troubleshooting](/ja-JP/gateway/troubleshooting) を使ってください。

## 安全性保証

- Gateway protocolクライアントは、Gatewayが利用できない場合に即座に失敗します（暗黙のdirect-channelフォールバックなし）。
- 無効な/`connect` でない最初のframeは拒否され、接続は閉じられます。
- 正常終了時には、socket close前に `shutdown` イベントが送出されます。

---

関連:

- [Troubleshooting](/ja-JP/gateway/troubleshooting)
- [Background Process](/ja-JP/gateway/background-process)
- [Configuration](/ja-JP/gateway/configuration)
- [Health](/ja-JP/gateway/health)
- [Doctor](/ja-JP/gateway/doctor)
- [Authentication](/ja-JP/gateway/authentication)

## 関連

- [Configuration](/ja-JP/gateway/configuration)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
- [Remote access](/ja-JP/gateway/remote)
- [Secrets management](/ja-JP/gateway/secrets)

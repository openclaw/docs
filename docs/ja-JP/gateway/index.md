---
read_when:
    - Gateway プロセスの実行またはデバッグ
summary: Gateway サービス、ライフサイクル、運用のランブック
title: Gateway ランブック
x-i18n:
    generated_at: "2026-04-21T04:45:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Gateway ランブック

このページは、Gateway サービスの初日セットアップとその後の運用に使用してください。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    症状優先の診断と、正確なコマンド手順およびログシグネチャ。
  </Card>
  <Card title="Configuration" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイド + 完全な構成リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef の契約、実行時スナップショット動作、移行／再読み込み操作。
  </Card>
  <Card title="シークレットプラン契約" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` の target/path ルールと、ref-only auth-profile の挙動。
  </Card>
</CardGroup>

## 5 分でできるローカル起動

<Steps>
  <Step title="Gateway を起動する">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="サービスの健全性を確認する">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常なベースライン: `Runtime: running`、`Connectivity probe: ok`、および期待どおりの `Capability: ...`。到達可能性だけでなく、読み取りスコープの RPC 証明が必要な場合は、`openclaw gateway status --require-rpc` を使用してください。

  </Step>

  <Step title="チャネルの準備状況を検証する">

```bash
openclaw channels status --probe
```

到達可能な gateway がある場合、これはアカウントごとのライブなチャネルプローブとオプションの監査を実行します。
gateway に到達できない場合、CLI はライブプローブ出力の代わりに、設定のみのチャネル要約へフォールバックします。

  </Step>
</Steps>

<Note>
Gateway の設定再読み込みは、アクティブな設定ファイルパス（profile/state のデフォルトから解決されるか、設定されている場合は `OPENCLAW_CONFIG_PATH`）を監視します。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
最初の読み込みに成功した後は、実行中プロセスがアクティブなインメモリ設定スナップショットを提供し、再読み込み成功時にはそのスナップショットがアトミックに入れ替わります。
</Note>

## ランタイムモデル

- ルーティング、コントロールプレーン、チャネル接続のための常時稼働プロセス 1 つ。
- 以下をまとめた単一の多重化ポート:
  - WebSocket control/RPC
  - HTTP API、OpenAI 互換（`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`）
  - Control UI と hook
- デフォルトの bind モード: `loopback`。
- デフォルトで auth が必要です。共有シークレット構成では
  `gateway.auth.token` / `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、non-loopback の
  reverse-proxy 構成では `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI 互換エンドポイント

OpenClaw の現在最も効果の高い互換サーフェスは以下です。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどの Open WebUI、LobeChat、LibreChat の統合は、最初に `/v1/models` をプローブします。
- 多くの RAG およびメモリパイプラインは `/v1/embeddings` を前提とします。
- エージェントネイティブなクライアントは、ますます `/v1/responses` を好むようになっています。

計画上の注記:

- `/v1/models` は agent-first です。`openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定されたデフォルトエージェントへマップされる安定した alias です。
- バックエンドの provider/model 上書きが必要な場合は `x-openclaw-model` を使用してください。そうでなければ、選択されたエージェントの通常の model と embedding 設定がそのまま使われます。

これらはすべてメイン Gateway ポート上で動作し、Gateway HTTP API の他の部分と同じ trusted operator auth 境界を使用します。

### ポートと bind の優先順位

| 設定 | 解決順序 |
| ------------ | ------------------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode | CLI/override → `gateway.bind` → `loopback` |

### ホットリロードモード

| `gateway.reload.mode` | 挙動 |
| --------------------- | ------------------------------------------ |
| `off` | 設定の再読み込みなし |
| `hot` | ホットセーフな変更のみ適用 |
| `restart` | 再読み込みが必要な変更時に再起動 |
| `hybrid` (デフォルト) | 安全ならホット適用し、必要なら再起動 |

## オペレーターコマンドセット

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` は、より深い RPC 健全性プローブではなく、追加のサービス検出（LaunchDaemons/systemd system
units/schtasks）のためのものです。

## 複数の Gateway（同一ホスト）

ほとんどのインストールでは、1 台のマシンにつき Gateway は 1 つで十分です。1 つの Gateway で複数の
エージェントとチャネルをホストできます。

複数の Gateway が必要なのは、意図的に分離や rescue bot を使いたい場合だけです。

便利な確認コマンド:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

期待されること:

- `gateway status --deep` は `Other gateway-like services detected (best effort)`
  を報告し、古い launchd/systemd/schtasks のインストールが残っている場合はクリーンアップのヒントを表示することがあります。
- `gateway probe` は、複数の対象が応答した場合に `multiple reachable gateways` を警告することがあります。
- それが意図的な場合は、各 Gateway ごとにポート、config/state、workspace root を分離してください。

詳細なセットアップ: [/gateway/multiple-gateways](/ja-JP/gateway/multiple-gateways)。

## リモートアクセス

推奨: Tailscale/VPN。
フォールバック: SSH トンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

その後、クライアントをローカルで `ws://127.0.0.1:18789` に接続してください。

<Warning>
SSH トンネルは gateway auth をバイパスしません。共有シークレット auth では、トンネル経由でもクライアントは
引き続き `token`/`password` を送信する必要があります。ID 付きモードでは、
リクエストは依然としてその auth パスを満たす必要があります。
</Warning>

参照: [Remote Gateway](/ja-JP/gateway/remote)、[Authentication](/ja-JP/gateway/authentication)、[Tailscale](/ja-JP/gateway/tailscale)。

## 監視とサービスライフサイクル

本番に近い信頼性のためには、監視付き実行を使用してください。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent ラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付き profile）です。`openclaw doctor` はサービス設定のドリフトを監査し、修復します。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も継続させるには、lingering を有効にします。

```bash
sudo loginctl enable-linger <user>
```

カスタムインストールパスが必要な場合の手動 user unit 例:

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

ネイティブ Windows の管理対象起動では、`OpenClaw Gateway`
（名前付き profile の場合は `OpenClaw Gateway (<profile>)`）という Scheduled Task を使用します。Scheduled Task
の作成が拒否された場合、OpenClaw は state directory 内の `gateway.cmd` を指すユーザーごとの Startup-folder launcher にフォールバックします。

  </Tab>

  <Tab title="Linux (system service)">

複数ユーザー／常時稼働ホストでは system unit を使用してください。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

user unit と同じ service body を使用しますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 配下にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整してください。

  </Tab>
</Tabs>

## 1 台のホスト上で複数の Gateway

ほとんどのセットアップでは **1 つ** の Gateway を実行してください。
複数を使うのは、厳密な分離／冗長性（たとえば rescue profile）の場合だけです。

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

参照: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

### dev profile のクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離された state/config とベース Gateway ポート `19001` が含まれます。

## プロトコルのクイックリファレンス（オペレータービュー）

- 最初のクライアントフレームは `connect` でなければなりません。
- Gateway は `hello-ok` スナップショット（`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy）を返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、
  呼び出し可能なすべての helper route を生成ダンプしたものではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的な event には `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、pairing/approval ライフサイクル event、`shutdown` が含まれます。

エージェント実行は 2 段階です。

1. 即時の accepted ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）、その間に `agent` event がストリーミングされます。

完全なプロトコルドキュメントは [Gateway Protocol](/ja-JP/gateway/protocol) を参照してください。

## 運用チェック

### 稼働確認

- WS を開いて `connect` を送信します。
- スナップショットを含む `hello-ok` レスポンスを期待します。

### 準備状態

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップ回復

event は再送されません。シーケンスギャップがある場合は、続行する前に state（`health`, `system-presence`）を再取得してください。

## 一般的な障害シグネチャ

| Signature | 可能性の高い問題 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth` | 有効な gateway auth パスなしでの non-loopback bind |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合 |
| `Gateway start blocked: set gateway.mode=local` | config が remote mode に設定されている、または破損した config から local-mode stamp が失われている |
| `unauthorized` during connect | クライアントと gateway の間で auth が不一致 |

完全な診断手順については、[Gateway Troubleshooting](/ja-JP/gateway/troubleshooting) を使用してください。

## 安全性の保証

- Gateway protocol クライアントは、Gateway が利用できない場合に即座に失敗します（暗黙の direct-channel フォールバックはありません）。
- 無効な first frame または `connect` 以外の first frame は拒否され、接続が閉じられます。
- 正常終了時には、ソケットが閉じる前に `shutdown` event が送出されます。

---

関連:

- [Troubleshooting](/ja-JP/gateway/troubleshooting)
- [Background Process](/ja-JP/gateway/background-process)
- [Configuration](/ja-JP/gateway/configuration)
- [Health](/ja-JP/gateway/health)
- [Doctor](/ja-JP/gateway/doctor)
- [Authentication](/ja-JP/gateway/authentication)

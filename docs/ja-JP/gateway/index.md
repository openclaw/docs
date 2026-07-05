---
read_when:
    - Gatewayプロセスの実行またはデバッグ
summary: Gateway サービス、ライフサイクル、運用のためのランブック
title: Gateway ランブック
x-i18n:
    generated_at: "2026-07-05T11:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a14b9b6e00a1ec68703d2c6587d0a42cd14acd70f44c72423f33f94035b802e
    source_path: gateway/index.md
    workflow: 16
---

このページは、Gateway サービスの day-1 起動と day-2 運用に使用します。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    症状起点の診断を、正確なコマンド手順とログシグネチャ付きで説明します。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイド + 完全な設定リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef コントラクト、ランタイムスナップショット動作、移行/リロード操作。
  </Card>
  <Card title="シークレットプランコントラクト" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` のターゲット/パス規則と、ref 専用 auth-profile 動作。
  </Card>
</CardGroup>

## 5分でのローカル起動

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

健全なベースライン: `Runtime: running`、`Connectivity probe: ok`、期待内容と一致する `Capability` 行。到達可能性だけでなく、読み取りスコープの RPC 証明には `openclaw gateway status --require-rpc` を使用します。

  </Step>

  <Step title="チャンネルの準備状態を検証する">

```bash
openclaw channels status --probe
```

到達可能な Gateway がある場合、これはアカウントごとのチャンネルプローブと任意の監査をライブ実行します。Gateway に到達できない場合、CLI は設定のみのチャンネル要約にフォールバックします。

  </Step>
</Steps>

<Note>
Gateway 設定リロードは、アクティブな設定ファイルパス（プロファイル/状態のデフォルトから解決、または設定時は `OPENCLAW_CONFIG_PATH`）を監視します。デフォルトモードは `gateway.reload.mode="hybrid"` です。最初の読み込みが成功した後、実行中のプロセスはアクティブなインメモリ設定スナップショットを提供します。リロードに成功すると、そのスナップショットがアトミックに差し替えられます。
</Note>

## ランタイムモデル

- ルーティング、コントロールプレーン、チャンネル接続のための常時稼働プロセス。
- 次の用途に使う単一の多重化ポート:
  - WebSocket コントロール/RPC
  - HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 任意の `/api/v1/admin/rpc` などの Plugin HTTP ルート
  - Control UI とフック
- デフォルトのバインドモード: `loopback`。コンテナ環境が検出された場合、有効なデフォルトは `auto`（ポートフォワーディング用に `0.0.0.0` に解決）です。ただし、Tailscale serve/funnel が有効な場合は常に `loopback` が強制されます。
- 認証はデフォルトで必須です。共有シークレットのセットアップでは `gateway.auth.token` / `gateway.auth.password`（または `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非 loopback のリバースプロキシ構成では `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI 互換エンドポイント

OpenClaw で最も効果の高い互換サーフェス:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどの Open WebUI、LobeChat、LibreChat 連携は最初に `/v1/models` をプローブします。
- 多くの RAG とメモリパイプラインは `/v1/embeddings` を期待します。
- エージェントネイティブのクライアントでは `/v1/responses` がますます好まれています。

`/v1/models` はエージェント優先です。設定済みの各エージェントに対して `openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。`openclaw/default` は、設定済みのデフォルトエージェントに常にマップされる安定したエイリアスです。バックエンドのプロバイダー/モデルを上書きしたい場合は `x-openclaw-model` を送信します。それ以外の場合は、選択されたエージェントの通常のモデルと埋め込みセットアップが制御を維持します。

これらはすべてメインの Gateway ポートで実行され、Gateway HTTP API の他の部分と同じ信頼済みオペレーター認証境界を使用します。

管理 HTTP RPC（`POST /api/v1/admin/rpc`）は、WebSocket RPC を使用できないホストツール向けの、別個のデフォルトオフ Plugin ルートです。[管理 HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。

### ポートとバインドの優先順位

| 設定      | 解決順序                                                     |
| ------------ | -------------------------------------------------------------------- |
| Gateway ポート | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| バインドモード    | CLI/上書き → `gateway.bind` → `loopback`（またはコンテナ内では `auto`） |

インストール済みの Gateway サービスは、解決済みの `--port` をスーパーバイザーメタデータに記録します。`gateway.port` を変更した後は、launchd/systemd/schtasks が新しいポートでプロセスを起動するように、`openclaw doctor --fix` または `openclaw gateway install --force` を実行してください。

Gateway 起動時は、非 loopback バインド向けのローカル Control UI オリジンをシードするときに、同じ有効ポートとバインドを使用します。たとえば、`--bind lan --port 3000` は、ランタイム検証が走る前に `http://localhost:3000` と `http://127.0.0.1:3000` をシードします。HTTPS プロキシ URL などのリモートブラウザーオリジンは、`gateway.controlUi.allowedOrigins` に明示的に追加してください。

### ホットリロードモード

| `gateway.reload.mode` | 動作                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | 設定リロードなし                           |
| `hot`                 | ホットセーフな変更のみ適用                |
| `restart`             | リロード必須の変更で再起動                 |
| `hybrid`（デフォルト）    | 安全な場合はホット適用し、必要な場合は再起動 |

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

`gateway status --deep` は追加のサービス検出（LaunchDaemons/systemd システムユニット/schtasks）用であり、より深い RPC 健全性プローブではありません。

## 複数の Gateway（同一ホスト）

ほとんどのインストールでは、1 台のマシンにつき 1 つの Gateway を実行するべきです。単一の Gateway は複数のエージェントとチャンネルをホストできます。意図的に分離したい場合やレスキューボットが必要な場合にのみ、複数の Gateway が必要です。

有用なチェック:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される内容:

- `gateway status --deep` は、古い launchd/systemd/schtasks インストールがまだ残っている場合、`Other gateway-like services detected (best effort)` を報告し、クリーンアップのヒントを出力することがあります。
- `gateway probe` は、異なる Gateway が応答する場合、または OpenClaw が到達可能なターゲットが同じ Gateway であることを証明できない場合、`multiple reachable gateway identities` について警告することがあります。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みリモート URL は、トランスポートポートが異なっていても、複数のトランスポートを持つ 1 つの Gateway です。
- それが意図的な場合は、Gateway ごとにポート、設定/状態、ワークスペースルートを分離します。

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
フォールバック: SSH トンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

その後、クライアントをローカルで `ws://127.0.0.1:18789` に接続します。

<Warning>
SSH トンネルは Gateway 認証をバイパスしません。共有シークレット認証では、クライアントはトンネル経由でも
`token`/`password` を送信する必要があります。ID を持つモードでは、
リクエストは引き続きその認証パスを満たす必要があります。
</Warning>

参照: [リモート Gateway](/ja-JP/gateway/remote)、[認証](/ja-JP/gateway/authentication)、[Tailscale](/ja-JP/gateway/tailscale)。

## 監視とサービスライフサイクル

本番相当の信頼性には、監視付き実行を使用します。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

再起動には `openclaw gateway restart` を使用します。再起動の代替として `openclaw gateway stop` と `openclaw gateway start` を連結しないでください。

macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これにより、無効化を永続化せずに現在のブートセッションから LaunchAgent が削除されるため、予期しないクラッシュ後も KeepAlive の自動復旧は引き続き機能し、`gateway start` でクリーンに再有効化されます。再起動をまたいで自動再生成を永続的に抑止するには、`--disable` を渡します: `openclaw gateway stop --disable`。

LaunchAgent ラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きプロファイル）です。`openclaw doctor` はサービス設定のドリフトを監査して修復します。

  </Tab>

  <Tab title="Linux（systemd user）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も永続化するには、lingering を有効にします。

```bash
sudo loginctl enable-linger $(whoami)
```

デスクトップセッションのないヘッドレスサーバーでは、`systemctl --user` コマンドを再試行する前に、`XDG_RUNTIME_DIR` が設定されていることも確認してください（`export XDG_RUNTIME_DIR=/run/user/$(id -u)`）。

カスタムインストールパスが必要な場合の手動ユーザーユニット例:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows（ネイティブ）">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

ネイティブ Windows の管理された起動は、`OpenClaw Gateway`
（または名前付きプロファイルでは `OpenClaw Gateway (<profile>)`）という名前のスケジュールタスクを使用します。スケジュールタスクの
作成が拒否された場合、OpenClaw は状態ディレクトリ内の `gateway.cmd` を指す
ユーザーごとのスタートアップフォルダーランチャーにフォールバックします。

  </Tab>

  <Tab title="Linux（システムサービス）">

マルチユーザー/常時稼働ホストにはシステムユニットを使用します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ユーザーユニットと同じサービス本体を使用しますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` の下にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整します。

同じプロファイル/ポートに対して、`openclaw doctor --fix` にユーザーレベルの Gateway サービスをインストールさせないでください。Doctor はシステムレベルの OpenClaw Gateway サービスを見つけると、その自動インストールを拒否します。システムユニットがライフサイクルを所有する場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を使用してください。

  </Tab>
</Tabs>

## 開発プロファイルのクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離された状態/設定とベース Gateway ポート `19001` が含まれます。

## プロトコルクイックリファレンス（オペレーター視点）

- 最初のクライアントフレームは `connect` である必要があります。
- Gateway は、`snapshot`（`presence`、`health`、`stateVersion`、`uptimeMs`）と `policy` 制限（`maxPayload`、`maxBufferedBytes`、`tickIntervalMs`）を含む `hello-ok` フレームを返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、
  呼び出し可能なすべてのヘルパールートを生成してダンプしたものではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには、`connect.challenge`、`agent`、`chat`、
  `session.message`、`session.operation`、`session.tool`、`sessions.changed`、
  `presence`、`tick`、`health`、`heartbeat`、ペアリング/承認ライフサイクルイベント、
  `shutdown` が含まれます。

エージェント実行は 2 段階です。

1. 即時の受理 ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間に `agent` イベントがストリーミングされます。

完全なプロトコルドキュメントを参照: [Gateway プロトコル](/ja-JP/gateway/protocol)。

## 運用チェック

### 稼働状態

- WS を開いて `connect` を送信します。
- スナップショット付きの `hello-ok` レスポンスを期待します。

### 準備状態

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップからの復旧

イベントは再生されません。シーケンスギャップが発生した場合は、続行する前に状態（`health`、`system-presence`）を更新してください。

## 一般的な失敗シグネチャ

| シグネチャ                                                     | 想定される問題                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 有効な gateway 認証パスなしでの非ループバックへのバインド                    |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | 設定がリモートモードになっている、または破損した設定から `gateway.mode` が欠落している |
| 接続中の `unauthorized`                                        | クライアントと gateway の認証不一致                                           |

完全な診断手順については、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)を使用してください。

## 安全性の保証

- Gateway プロトコルクライアントは、Gateway が利用できない場合に即座に失敗します（暗黙の直接チャネルフォールバックはありません）。
- 無効な、または connect ではない最初のフレームは拒否され、クローズされます。
- グレースフルシャットダウンでは、ソケットをクローズする前に `shutdown` イベントを発行します。

## 関連情報

- [設定](/ja-JP/gateway/configuration)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [ヘルス](/ja-JP/gateway/health)
- [診断](/ja-JP/gateway/doctor)
- [認証](/ja-JP/gateway/authentication)
- [リモートアクセス](/ja-JP/gateway/remote)
- [シークレット管理](/ja-JP/gateway/secrets)

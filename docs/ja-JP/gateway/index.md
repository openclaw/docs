---
read_when:
    - Gateway プロセスの実行またはデバッグ
summary: Gateway サービス、ライフサイクル、運用のランブック
title: Gateway ランブック
x-i18n:
    generated_at: "2026-06-27T11:29:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

このページは、Gateway サービスの初日立ち上げと 2日目以降の運用に使用します。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    正確なコマンド手順とログシグネチャによる、症状優先の診断。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイドと完全な設定リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef コントラクト、ランタイムスナップショットの動作、移行/リロード操作。
  </Card>
  <Card title="シークレット計画コントラクト" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` のターゲット/パス規則と、参照のみの認証プロファイル動作。
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

正常なベースライン: `Runtime: running`、`Connectivity probe: ok`、および期待どおりの `Capability: ...`。到達性だけでなく読み取りスコープの RPC 証明が必要な場合は、`openclaw gateway status --require-rpc` を使用します。

  </Step>

  <Step title="チャネルの準備状態を検証する">

```bash
openclaw channels status --probe
```

到達可能な Gateway がある場合、これはアカウントごとのライブチャネルプローブと任意の監査を実行します。
Gateway に到達できない場合、CLI はライブプローブ出力ではなく、設定のみのチャネル概要にフォールバックします。

  </Step>
</Steps>

<Note>
Gateway 設定のリロードは、アクティブな設定ファイルパス（プロファイル/状態のデフォルトから解決、または `OPENCLAW_CONFIG_PATH` が設定されている場合はそれ）を監視します。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
最初の正常な読み込み後、実行中のプロセスはアクティブなメモリ内設定スナップショットを提供します。リロードが成功すると、そのスナップショットはアトミックに差し替えられます。
</Note>

## ランタイムモデル

- ルーティング、コントロールプレーン、チャネル接続のための常時稼働プロセスが 1つ。
- 次のための単一の多重化ポート:
  - WebSocket コントロール/RPC
  - HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 任意の `/api/v1/admin/rpc` などの Plugin HTTP ルート
  - Control UI とフック
- デフォルトのバインドモード: `loopback`。
- 認証はデフォルトで必須です。共有シークレットのセットアップでは
  `gateway.auth.token` / `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非 local loopback の
  リバースプロキシセットアップでは `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI 互換エンドポイント

OpenClaw の最も効果の高い互換性サーフェスは現在、次のとおりです。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどの Open WebUI、LobeChat、LibreChat 連携は最初に `/v1/models` をプローブします。
- 多くの RAG とメモリパイプラインは `/v1/embeddings` を想定しています。
- エージェントネイティブなクライアントでは、`/v1/responses` がますます好まれています。

計画メモ:

- `/v1/models` はエージェント優先です。`openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定済みのデフォルトエージェントにマップされる安定したエイリアスです。
- バックエンドプロバイダー/モデルをオーバーライドしたい場合は `x-openclaw-model` を使用します。それ以外の場合は、選択されたエージェントの通常のモデルと埋め込み設定が制御を維持します。

これらはすべてメインの Gateway ポートで実行され、Gateway HTTP API の残りと同じ信頼済みオペレーター認証境界を使用します。

管理用 HTTP RPC（`POST /api/v1/admin/rpc`）は、WebSocket RPC を使用できないホストツール向けの、別個のデフォルトオフ Plugin ルートです。[管理用 HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。

### ポートとバインドの優先順位

| 設定         | 解決順序                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway ポート | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| バインドモード | CLI/オーバーライド → `gateway.bind` → `loopback`              |

インストール済みの Gateway サービスは、解決された `--port` をスーパーバイザーメタデータに記録します。`gateway.port` を変更した後は、launchd/systemd/schtasks が新しいポートでプロセスを起動するように、`openclaw doctor --fix` または `openclaw gateway install --force` を実行します。

Gateway 起動時は、非 local loopback バインド用にローカルの
Control UI オリジンをシードするとき、同じ有効ポートとバインドを使用します。たとえば、`--bind lan --port 3000` は、ランタイム検証が実行される前に
`http://localhost:3000` と `http://127.0.0.1:3000` をシードします。
HTTPS プロキシ URL などのリモートブラウザーオリジンは、
`gateway.controlUi.allowedOrigins` に明示的に追加してください。

### ホットリロードモード

| `gateway.reload.mode` | 動作                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 設定をリロードしない                       |
| `hot`                 | ホットセーフな変更のみ適用                 |
| `restart`             | リロードが必要な変更で再起動               |
| `hybrid`（デフォルト） | 安全な場合はホット適用し、必要な場合は再起動 |

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

`gateway status --deep` は追加のサービス検出（LaunchDaemons/systemd システム
ユニット/schtasks）用であり、より深い RPC 健全性プローブではありません。

## 複数の Gateway（同一ホスト）

ほとんどのインストールでは、マシンごとに 1つの Gateway を実行すべきです。単一の Gateway で複数の
エージェントとチャネルをホストできます。

意図的に分離したい場合、またはレスキューボットが必要な場合にのみ、複数の Gateway が必要です。

有用なチェック:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される内容:

- `gateway status --deep` は、古い launchd/systemd/schtasks インストールが残っている場合に、
  `Other gateway-like services detected (best effort)` を報告し、クリーンアップのヒントを出力することがあります。
- `gateway probe` は、別々の Gateway が応答する場合、または OpenClaw が到達可能なターゲットが同じ Gateway であることを証明できない場合に、
  `multiple reachable gateway identities` について警告することがあります。
  同じ Gateway への SSH トンネル、プロキシ URL、または設定済みリモート URL は、
  トランスポートポートが異なる場合でも、複数のトランスポートを持つ 1つの
  Gateway です。
- それが意図した構成である場合は、Gateway ごとにポート、設定/状態、ワークスペースルートを分離します。

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
ssh -N -L 18789:127.0.0.1:18789 user@host
```

その後、クライアントをローカルで `ws://127.0.0.1:18789` に接続します。

<Warning>
SSH トンネルは Gateway 認証を迂回しません。共有シークレット認証では、トンネル越しであってもクライアントは
`token`/`password` を送信する必要があります。アイデンティティを持つモードでは、
リクエストは引き続きその認証パスを満たす必要があります。
</Warning>

参照: [リモート Gateway](/ja-JP/gateway/remote)、[認証](/ja-JP/gateway/authentication)、[Tailscale](/ja-JP/gateway/tailscale)。

## 監視とサービスライフサイクル

本番に近い信頼性のために、監視付き実行を使用します。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

再起動には `openclaw gateway restart` を使用します。再起動の代替として `openclaw gateway stop` と `openclaw gateway start` を連結しないでください。

macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これは無効化を永続化せずに現在の起動セッションから LaunchAgent を削除するため、予期しないクラッシュ後も KeepAlive の自動復旧が機能し、`gateway start` で正常に再有効化できます。再起動をまたいで自動再生成を永続的に抑制するには、`--disable` を渡します: `openclaw gateway stop --disable`。

LaunchAgent ラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きプロファイル）です。`openclaw doctor` はサービス設定のずれを監査し、修復します。

  </Tab>

  <Tab title="Linux（systemd ユーザー）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も永続化するには、リンガリングを有効にします。

```bash
sudo loginctl enable-linger <user>
```

カスタムインストールパスが必要な場合の手動ユーザーユニット例:

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

ネイティブ Windows の管理対象起動では、`OpenClaw Gateway`
（名前付きプロファイルでは `OpenClaw Gateway (<profile>)`）という名前のスケジュールタスクを使用します。スケジュールタスクの作成が拒否された場合、OpenClaw は状態ディレクトリ内の `gateway.cmd` を指すユーザー単位のスタートアップフォルダーランチャーにフォールバックします。

  </Tab>

  <Tab title="Linux（システムサービス）">

マルチユーザー/常時稼働ホストにはシステムユニットを使用します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ユーザーユニットと同じサービス本文を使用しますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` の下にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整します。

同じプロファイル/ポートに対して、`openclaw doctor --fix` にユーザーレベルの Gateway サービスもインストールさせないでください。Doctor はシステムレベルの OpenClaw Gateway サービスを見つけると、その自動インストールを拒否します。システムユニットがライフサイクルを所有する場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を使用します。

  </Tab>
</Tabs>

## 開発プロファイルのクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離された状態/設定とベース Gateway ポート `19001` が含まれます。

## プロトコルのクイックリファレンス（オペレーター視点）

- 最初のクライアントフレームは `connect` である必要があります。
- Gateway は `hello-ok` スナップショット（`presence`、`health`、`stateVersion`、`uptimeMs`、制限/ポリシー）を返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、
  呼び出し可能なすべてのヘルパールートを生成して列挙したものではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには、`connect.challenge`、`agent`、`chat`、
  `session.message`、`session.operation`、`session.tool`、`sessions.changed`、
  `presence`、`tick`、`health`、`heartbeat`、ペアリング/承認ライフサイクルイベント、
  `shutdown` が含まれます。

エージェント実行は 2段階です。

1. 即時の受理 ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間に `agent` イベントがストリーミングされます。

完全なプロトコルドキュメントを参照: [Gateway プロトコル](/ja-JP/gateway/protocol)。

## 運用チェック

### Liveness

- WS を開き、`connect` を送信します。
- スナップショット付きの `hello-ok` レスポンスを期待します。

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップ復旧

イベントは再生されません。シーケンスギャップがある場合は、続行する前に状態（`health`、`system-presence`）を更新します。

## 一般的な失敗シグネチャ

| シグネチャ                                                    | 想定される問題                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 有効な Gateway 認証パスなしでの非ループバックバインド                          |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 設定がリモートモードになっている、または破損した設定からローカルモードスタンプが欠落している |
| `unauthorized` during connect                                  | クライアントと Gateway の認証不一致                                             |

完全な診断手順については、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)を使用してください。

## 安全性の保証

- Gateway プロトコルクライアントは、Gateway が利用できない場合に即座に失敗します（暗黙の直接チャネルフォールバックはありません）。
- 無効な、または接続ではない最初のフレームは拒否され、閉じられます。
- 正常なシャットダウンでは、ソケットを閉じる前に `shutdown` イベントが発行されます。

---

関連:

- [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [ヘルス](/ja-JP/gateway/health)
- [ドクター](/ja-JP/gateway/doctor)
- [認証](/ja-JP/gateway/authentication)

## 関連

- [設定](/ja-JP/gateway/configuration)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [リモートアクセス](/ja-JP/gateway/remote)
- [シークレット管理](/ja-JP/gateway/secrets)

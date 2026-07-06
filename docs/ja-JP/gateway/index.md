---
read_when:
    - Gatewayプロセスの実行またはデバッグ
summary: Gateway サービス、ライフサイクル、運用のランブック
title: Gateway ランブック
x-i18n:
    generated_at: "2026-07-06T10:51:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 177748e282b8ac75070a38ec91f5503ae53076f524255f0dc8d06880d946e0de
    source_path: gateway/index.md
    workflow: 16
---

このページは、Gateway サービスの初日スタートアップと2日目以降の運用に使用します。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    症状起点の診断、正確なコマンド手順、ログシグネチャ。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイドと完全な設定リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef コントラクト、実行時スナップショットの挙動、移行/再読み込み操作。
  </Card>
  <Card title="シークレット計画コントラクト" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` ターゲット/パス規則と参照専用 auth-profile の挙動。
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

  <Step title="サービスのヘルスを検証する">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常なベースラインは `Runtime: running`、`Connectivity probe: ok`、そして期待内容に一致する `Capability` 行です。単なる到達可能性ではなく、読み取りスコープの RPC 証明には `openclaw gateway status --require-rpc` を使用します。

  </Step>

  <Step title="チャネル準備状態を検証する">

```bash
openclaw channels status --probe
```

到達可能な Gateway がある場合、これはアカウントごとのライブチャネルプローブと任意の監査を実行します。Gateway に到達できない場合、CLI は設定のみのチャネル要約にフォールバックします。

  </Step>
</Steps>

<Note>
Gateway 設定の再読み込みは、アクティブな設定ファイルパス（プロファイル/状態のデフォルトから解決、または `OPENCLAW_CONFIG_PATH` が設定されている場合はそれ）を監視します。デフォルトモードは `gateway.reload.mode="hybrid"` です。最初の読み込み成功後、実行中のプロセスはアクティブなメモリ内設定スナップショットを提供し、再読み込みが成功するとそのスナップショットをアトミックに差し替えます。
</Note>

## 実行時モデル

- ルーティング、制御プレーン、チャネル接続のための常時稼働プロセス1つ。
- 次のための単一の多重化ポート:
  - WebSocket 制御/RPC
  - HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 任意の `/api/v1/admin/rpc` などの Plugin HTTP ルート
  - Control UI とフック
- デフォルトのバインドモード: `loopback`。コンテナ環境が検出された場合、有効なデフォルトは `auto`（ポートフォワーディング用に `0.0.0.0` に解決）です。ただし Tailscale serve/funnel がアクティブな場合は常に `loopback` が強制されます。
- 認証はデフォルトで必須です。共有シークレットのセットアップでは `gateway.auth.token` / `gateway.auth.password`（または `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非ループバックのリバースプロキシセットアップでは `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI 互換エンドポイント

OpenClaw の最もレバレッジの高い互換サーフェス:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどの Open WebUI、LobeChat、LibreChat 連携は最初に `/v1/models` をプローブします。
- 多くの RAG とメモリパイプラインは `/v1/embeddings` を期待します。
- エージェントネイティブクライアントは、ますます `/v1/responses` を優先しています。

`/v1/models` はエージェント優先です。設定済みのすべてのエージェントについて、`openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。`openclaw/default` は、常に設定済みのデフォルトエージェントにマップされる安定したエイリアスです。バックエンドのプロバイダー/モデルを上書きしたい場合は `x-openclaw-model` を送信します。そうでない場合は、選択されたエージェントの通常のモデルと埋め込み設定が引き続き制御します。

これらはすべてメインの Gateway ポートで動作し、Gateway HTTP API の他の部分と同じ信頼済みオペレーター認証境界を使用します。

Admin HTTP RPC（`POST /api/v1/admin/rpc`）は、WebSocket RPC を使用できないホストツール向けの、別個のデフォルトオフの Plugin ルートです。[Admin HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。

### ポートとバインドの優先順位

| 設定         | 解決順序                                                             |
| ------------ | -------------------------------------------------------------------- |
| Gateway ポート | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| バインドモード | CLI/override → `gateway.bind` → `loopback`（またはコンテナ内では `auto`） |

インストール済みの Gateway サービスは、解決された `--port` をスーパーバイザーメタデータに記録します。`gateway.port` を変更した後は、launchd/systemd/schtasks が新しいポートでプロセスを開始するように、`openclaw doctor --fix` または `openclaw gateway install --force` を実行します。

Gateway 起動時は、非ループバックバインド用にローカル Control UI オリジンをシードするときに、同じ有効ポートとバインドを使用します。たとえば、`--bind lan --port 3000` は実行時検証が実行される前に `http://localhost:3000` と `http://127.0.0.1:3000` をシードします。HTTPS プロキシ URL など、リモートブラウザーのオリジンは `gateway.controlUi.allowedOrigins` に明示的に追加します。

### ホットリロードモード

| `gateway.reload.mode` | 挙動                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 設定を再読み込みしない                     |
| `hot`                 | ホットセーフな変更のみを適用               |
| `restart`             | 再起動が必要な変更で再起動                 |
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

`gateway status --deep` は追加のサービス検出（LaunchDaemons/systemd システムユニット/schtasks）用であり、より深い RPC ヘルスプローブではありません。

## 複数の Gateway（同一ホスト）

ほとんどのインストールでは、マシンごとに1つの Gateway を実行するべきです。単一の Gateway で複数のエージェントとチャネルをホストできます。複数の Gateway が必要なのは、意図的に分離したい場合やレスキューボットが必要な場合だけです。

有用なチェック:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される内容:

- `gateway status --deep` は、古い launchd/systemd/schtasks インストールがまだ残っている場合に `Other gateway-like services detected (best effort)` を報告し、クリーンアップのヒントを出力することがあります。
- `gateway probe` は、別々の Gateway が応答した場合、または OpenClaw が到達可能なターゲットが同じ Gateway であることを証明できない場合に、`multiple reachable gateway identities` について警告することがあります。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みのリモート URL は、トランスポートポートが異なっていても、複数のトランスポートを持つ1つの Gateway です。
- それが意図したものなら、Gateway ごとにポート、設定/状態、ワークスペースルートを分離します。

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
SSH トンネルは Gateway 認証をバイパスしません。共有シークレット認証では、クライアントはトンネル越しでも
`token`/`password` を送信する必要があります。ID を伴うモードでは、
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

再起動には `openclaw gateway restart` を使用します。再起動の代替として `openclaw gateway stop` と `openclaw gateway start` を連鎖させないでください。

macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これは無効化を永続化せずに現在のブートセッションから LaunchAgent を削除するため、予期しないクラッシュ後も KeepAlive による自動復旧が機能し、`gateway start` でクリーンに再有効化できます。再起動をまたいで自動再生成を永続的に抑制するには、`--disable` を渡します: `openclaw gateway stop --disable`。

LaunchAgent ラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きプロファイル）です。`openclaw doctor` はサービス設定のドリフトを監査して修復します。

  </Tab>

  <Tab title="Linux（systemd user）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後の永続化には lingering を有効にします:

```bash
sudo loginctl enable-linger $(whoami)
```

デスクトップセッションのないヘッドレスサーバーでは、`systemctl --user` コマンドを再試行する前に `XDG_RUNTIME_DIR` が設定されていること（`export XDG_RUNTIME_DIR=/run/user/$(id -u)`）も確認してください。

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

ネイティブ Windows の管理された起動では、`OpenClaw Gateway`
（名前付きプロファイルの場合は `OpenClaw Gateway (<profile>)`）という名前のスケジュールタスクを使用します。スケジュールタスクの
作成が拒否された場合、OpenClaw は状態ディレクトリ内の `gateway.cmd` を指す
ユーザーごとの Startup フォルダーランチャーにフォールバックします。

  </Tab>

  <Tab title="Linux（システムサービス）">

マルチユーザー/常時稼働ホストにはシステムユニットを使用します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ユーザーユニットと同じサービス本文を使用しますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整します。

同じプロファイル/ポートに対して、`openclaw doctor --fix` にユーザーレベルの Gateway サービスもインストールさせないでください。Doctor はシステムレベルの OpenClaw Gateway サービスを見つけた場合、その自動インストールを拒否します。システムユニットがライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を使用します。

  </Tab>
</Tabs>

無効な設定エラーはコード `78` で終了します。Linux systemd ユニットは、設定が修正されるまで再起動を停止するために `RestartPreventExitStatus=78` を使用します。launchd と Windows Task Scheduler には同等の終了コードごとの停止ルールがないため、Gateway は急速な異常ブート履歴も永続化し、起動失敗が繰り返された後はチャネル/プロバイダーアカウントの自動開始を抑制します。そのセーフモードでは、検査と修復のために制御プレーンは引き続き起動し、設定のホットリロードと `secrets.reload` は自動チャネル再起動を拒否し、明示的なオペレーターの `channels.start` リクエストで抑制を上書きできます。

## 開発プロファイルのクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離された状態/設定とベース Gateway ポート `19001` が含まれます。

## プロトコルクイックリファレンス（オペレーター視点）

- 最初のクライアントフレームは `connect` でなければなりません。
- Gateway は `snapshot`（`presence`、`health`、`stateVersion`、`uptimeMs`）と `policy` 制限（`maxPayload`、`maxBufferedBytes`、`tickIntervalMs`）を含む `hello-ok` フレームを返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、呼び出し可能なすべてのヘルパールートを
  生成して列挙したものではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには、`connect.challenge`、`agent`、`chat`、
  `session.message`、`session.operation`、`session.tool`、`sessions.changed`、
  `presence`、`tick`、`health`、`heartbeat`、ペアリング/承認ライフサイクルイベント、
  および `shutdown` が含まれます。

エージェント実行は 2 段階です。

1. 即時の受諾 ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間に `agent` イベントがストリーミングされます。

完全なプロトコルドキュメントを参照してください: [Gateway プロトコル](/ja-JP/gateway/protocol)。

## 運用チェック

### ライブネス

- WS を開き、`connect` を送信します。
- スナップショット付きの `hello-ok` レスポンスを期待します。

### レディネス

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップ復旧

イベントは再生されません。シーケンスの欠落がある場合は、続行する前に状態（`health`、`system-presence`）を更新してください。

## 一般的な失敗シグネチャ

| シグネチャ                                                   | 考えられる問題                                                               |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 有効な Gateway 認証パスがない非ループバックバインド                          |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | 設定がリモートモードになっている、または破損した設定に `gateway.mode` がない |
| `unauthorized` during connect                                  | クライアントと Gateway の間の認証不一致                                      |

完全な診断手順については、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)を使用してください。

## 安全性の保証

- Gateway プロトコルクライアントは、Gateway が利用できない場合に高速に失敗します（暗黙の直接チャネルフォールバックはありません）。
- 無効な、または connect ではない最初のフレームは拒否され、クローズされます。
- 正常なシャットダウンでは、ソケットを閉じる前に `shutdown` イベントが送出されます。

## 関連

- [設定](/ja-JP/gateway/configuration)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [ヘルス](/ja-JP/gateway/health)
- [診断](/ja-JP/gateway/doctor)
- [認証](/ja-JP/gateway/authentication)
- [リモートアクセス](/ja-JP/gateway/remote)
- [シークレット管理](/ja-JP/gateway/secrets)

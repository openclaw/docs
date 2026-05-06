---
read_when:
    - Gateway プロセスの実行またはデバッグ
summary: Gateway サービス、ライフサイクル、運用のランブック
title: Gateway 運用手順書
x-i18n:
    generated_at: "2026-05-06T05:05:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

このページは、Gateway サービスの初日起動と2日目以降の運用に使用します。

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/ja-JP/gateway/troubleshooting">
    症状起点の診断。正確なコマンド手順とログシグネチャを含みます。
  </Card>
  <Card title="Configuration" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイドと完全な設定リファレンス。
  </Card>
  <Card title="Secrets management" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef 契約、ランタイムスナップショットの動作、移行/再読み込み操作。
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` のターゲット/パス規則と、ref のみの auth-profile 動作。
  </Card>
</CardGroup>

## 5分でのローカル起動

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常なベースライン: 期待どおりの `Runtime: running`、`Connectivity probe: ok`、`Capability: ...`。単なる到達性ではなく read スコープの RPC 証明が必要な場合は、`openclaw gateway status --require-rpc` を使用します。

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

到達可能な gateway がある場合、これはアカウントごとのチャンネルプローブと任意の監査をライブで実行します。
gateway に到達できない場合、CLI はライブプローブ出力ではなく、設定のみのチャンネル概要にフォールバックします。

  </Step>
</Steps>

<Note>
Gateway 設定の再読み込みは、アクティブな設定ファイルパス（プロファイル/状態のデフォルトから解決、または設定されている場合は `OPENCLAW_CONFIG_PATH`）を監視します。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
初回の読み込みが成功した後、実行中のプロセスはアクティブなインメモリ設定スナップショットを提供します。再読み込みに成功すると、そのスナップショットはアトミックに差し替えられます。
</Note>

## ランタイムモデル

- ルーティング、コントロールプレーン、チャンネル接続のための常時稼働プロセス1つ。
- 単一の多重化ポート:
  - WebSocket コントロール/RPC
  - HTTP API、OpenAI 互換（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - コントロール UI とフック
- デフォルトのバインドモード: `loopback`。
- Auth はデフォルトで必須です。共有シークレットのセットアップでは
  `gateway.auth.token` / `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非 loopback の
  リバースプロキシセットアップでは `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI 互換エンドポイント

OpenClaw の最も効果の高い互換サーフェスは現在、次のとおりです。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどの Open WebUI、LobeChat、LibreChat 統合は、最初に `/v1/models` をプローブします。
- 多くの RAG とメモリパイプラインは `/v1/embeddings` を想定しています。
- エージェントネイティブのクライアントは、ますます `/v1/responses` を好むようになっています。

計画メモ:

- `/v1/models` はエージェントファーストです。`openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定済みのデフォルトエージェントにマップされる安定したエイリアスです。
- バックエンド provider/model の上書きが必要な場合は `x-openclaw-model` を使用します。それ以外の場合、選択されたエージェントの通常のモデルと埋め込み設定が制御を維持します。

これらはすべてメインの Gateway ポートで実行され、Gateway HTTP API の残りと同じ信頼済みオペレーター auth 境界を使用します。

### ポートとバインドの優先順位

| 設定      | 解決順序                                              |
| ------------ | ------------------------------------------------------------- |
| Gateway ポート | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| バインドモード    | CLI/override → `gateway.bind` → `loopback`                    |

インストール済みの gateway サービスは、解決済みの `--port` を supervisor メタデータに記録します。`gateway.port` を変更した後は、launchd/systemd/schtasks が新しいポートでプロセスを開始するように、`openclaw doctor --fix` または `openclaw gateway install --force` を実行します。

Gateway の起動は、非 loopback バインド向けにローカルのコントロール UI オリジンをシードするとき、同じ有効ポートとバインドを使用します。たとえば、`--bind lan --port 3000` は、ランタイム検証が実行される前に `http://localhost:3000` と `http://127.0.0.1:3000` をシードします。HTTPS プロキシ URL など、リモートブラウザのオリジンは `gateway.controlUi.allowedOrigins` に明示的に追加します。

### ホットリロードモード

| `gateway.reload.mode` | 動作                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | 設定を再読み込みしない                           |
| `hot`                 | ホットセーフな変更のみ適用                |
| `restart`             | 再起動が必要な変更で再起動         |
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

`gateway status --deep` は追加のサービス検出（LaunchDaemons/systemd system units/schtasks）用であり、より深い RPC ヘルスプローブではありません。

## 複数の gateway（同一ホスト）

ほとんどのインストールでは、1台のマシンにつき1つの gateway を実行するべきです。単一の gateway で複数のエージェントとチャンネルをホストできます。

意図的に分離したい場合、またはレスキューボットが必要な場合にのみ、複数の gateway が必要です。

有用なチェック:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される内容:

- `gateway status --deep` は、古い launchd/systemd/schtasks インストールがまだ残っている場合に `Other gateway-like services detected (best effort)` を報告し、クリーンアップのヒントを出力することがあります。
- 複数のターゲットが応答する場合、`gateway probe` は `multiple reachable gateways` について警告することがあります。
- それが意図的な場合は、gateway ごとにポート、設定/状態、ワークスペースルートを分離します。

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
SSH トンネルは gateway auth を回避しません。共有シークレット auth の場合、クライアントはトンネル越しでも `token`/`password` を送信する必要があります。ID を持つモードでは、リクエストは引き続きその auth パスを満たす必要があります。
</Warning>

参照: [Remote Gateway](/ja-JP/gateway/remote)、[Authentication](/ja-JP/gateway/authentication)、[Tailscale](/ja-JP/gateway/tailscale)。

## 監視とサービスライフサイクル

本番に近い信頼性には、監視付き実行を使用します。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

再起動には `openclaw gateway restart` を使用します。`openclaw gateway stop` と `openclaw gateway start` を連結しないでください。macOS では、`gateway stop` は停止前に意図的に LaunchAgent を無効化します。

LaunchAgent ラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きプロファイル）です。`openclaw doctor` はサービス設定のドリフトを監査し、修復します。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も永続化するには、lingering を有効にします。

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

ネイティブ Windows の管理付き起動では、`OpenClaw Gateway` という名前の Scheduled Task（名前付きプロファイルの場合は `OpenClaw Gateway (<profile>)`）を使用します。Scheduled Task の作成が拒否された場合、OpenClaw は状態ディレクトリ内の `gateway.cmd` を指すユーザーごとの Startup フォルダーランチャーにフォールバックします。

  </Tab>

  <Tab title="Linux (system service)">

マルチユーザー/常時稼働ホストには system unit を使用します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ユーザーユニットと同じサービス本文を使用しますが、`/etc/systemd/system/openclaw-gateway[-<profile>].service` の下にインストールし、`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整します。

同じプロファイル/ポートについて、`openclaw doctor --fix` にユーザーレベルの gateway サービスもインストールさせないでください。Doctor は system-level の OpenClaw gateway サービスを検出すると、その自動インストールを拒否します。system unit がライフサイクルを所有している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を使用します。

  </Tab>
</Tabs>

## 開発プロファイルのクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離された状態/設定とベース gateway ポート `19001` が含まれます。

## プロトコルクイックリファレンス（オペレーター視点）

- 最初のクライアントフレームは `connect` である必要があります。
- Gateway は `hello-ok` スナップショット（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）を返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、呼び出し可能なすべてのヘルパールートを生成したダンプではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには、`connect.challenge`、`agent`、`chat`、`session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、`health`、`heartbeat`、pairing/approval ライフサイクルイベント、`shutdown` が含まれます。

エージェント実行は2段階です。

1. 即時の accepted ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間に `agent` イベントがストリーミングされます。

完全なプロトコルドキュメントを参照: [Gateway Protocol](/ja-JP/gateway/protocol)。

## 運用チェック

### Liveness

- WS を開き、`connect` を送信します。
- スナップショットを含む `hello-ok` レスポンスを期待します。

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップリカバリ

イベントは再生されません。シーケンスギャップがある場合は、続行する前に状態（`health`、`system-presence`）を更新します。

## 一般的な失敗シグネチャ

| シグネチャ                                                      | 考えられる問題                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 有効な gateway auth パスなしの非 loopback バインド                             |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | 設定がリモートモードに設定されている、または破損した設定から local-mode スタンプが欠落している |
| `unauthorized` during connect                                  | クライアントと gateway の間の auth 不一致                                        |

完全な診断手順については、[Gateway Troubleshooting](/ja-JP/gateway/troubleshooting) を使用してください。

## 安全性保証

- Gateway プロトコルクライアントは、Gateway が利用できない場合に即座に失敗します（暗黙の直接チャネルフォールバックはありません）。
- 無効な、または connect ではない最初のフレームは拒否され、クローズされます。
- 正常なシャットダウンでは、ソケットをクローズする前に `shutdown` イベントが発行されます。

---

関連:

- [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [ヘルス](/ja-JP/gateway/health)
- [診断](/ja-JP/gateway/doctor)
- [認証](/ja-JP/gateway/authentication)

## 関連

- [設定](/ja-JP/gateway/configuration)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [リモートアクセス](/ja-JP/gateway/remote)
- [シークレット管理](/ja-JP/gateway/secrets)

---
read_when:
    - Gateway プロセスの実行またはデバッグ
summary: Gatewayサービス、ライフサイクル、運用のランブック
title: Gateway ランブック
x-i18n:
    generated_at: "2026-04-30T05:13:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

このページは、Gateway サービスの初日の起動と 2 日目以降の運用に使用します。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    正確なコマンド手順とログシグネチャを使った、症状起点の診断。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイド + 完全な設定リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef コントラクト、ランタイムスナップショットの動作、移行/リロード操作。
  </Card>
  <Card title="シークレットプランコントラクト" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` のターゲット/パス規則と、参照専用の認証プロファイル動作。
  </Card>
</CardGroup>

## 5 分でローカル起動

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

健全なベースライン: 期待どおりの `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...`。到達可能性だけでなく読み取りスコープの RPC 証明が必要な場合は、`openclaw gateway status --require-rpc` を使用します。

  </Step>

  <Step title="チャネルの準備状況を検証する">

```bash
openclaw channels status --probe
```

到達可能な gateway がある場合、これはアカウントごとのライブチャネルプローブと任意の監査を実行します。
gateway に到達できない場合、CLI はライブプローブ出力の代わりに、設定のみのチャネル概要にフォールバックします。

  </Step>
</Steps>

<Note>
Gateway 設定のリロードは、有効な設定ファイルパスを監視します（プロファイル/状態のデフォルト、または設定されている場合は `OPENCLAW_CONFIG_PATH` から解決）。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
最初の読み込みに成功した後、実行中のプロセスは有効なメモリ内設定スナップショットを提供します。リロードに成功すると、そのスナップショットがアトミックに差し替えられます。
</Note>

## ランタイムモデル

- ルーティング、コントロールプレーン、チャネル接続のための常時稼働プロセス 1 つ。
- 次のための単一の多重化ポート:
  - WebSocket コントロール/RPC
  - OpenAI 互換の HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - Control UI とフック
- デフォルトのバインドモード: `loopback`。
- 認証はデフォルトで必須です。共有シークレットのセットアップでは
  `gateway.auth.token` / `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非 loopback の
  リバースプロキシセットアップでは `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI 互換エンドポイント

OpenClaw の最も効果の高い互換サーフェスは、現在次のとおりです。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどの Open WebUI、LobeChat、LibreChat 統合は、最初に `/v1/models` をプローブします。
- 多くの RAG とメモリパイプラインは `/v1/embeddings` を期待します。
- エージェントネイティブなクライアントでは、`/v1/responses` を優先する傾向が強まっています。

計画メモ:

- `/v1/models` はエージェント優先です。`openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定済みのデフォルトエージェントに対応する安定したエイリアスです。
- バックエンドプロバイダー/モデルを上書きしたい場合は `x-openclaw-model` を使用します。それ以外の場合、選択したエージェントの通常のモデルと埋め込み設定が制御を維持します。

これらはすべてメインの Gateway ポートで実行され、Gateway HTTP API の他の部分と同じ、信頼されたオペレーター認証境界を使用します。

### ポートとバインドの優先順位

| 設定         | 解決順序                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway ポート | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| バインドモード | CLI/override → `gateway.bind` → `loopback`                    |

インストール済みの gateway サービスは、解決された `--port` をスーパーバイザーメタデータに記録します。`gateway.port` を変更した後は、launchd/systemd/schtasks が新しいポートでプロセスを開始するように、`openclaw doctor --fix` または `openclaw gateway install --force` を実行します。

Gateway 起動は、非 loopback バインド向けにローカル
Control UI オリジンをシードするとき、同じ有効ポートとバインドを使用します。たとえば、`--bind lan --port 3000` は、ランタイム検証の前に
`http://localhost:3000` と `http://127.0.0.1:3000` をシードします。HTTPS プロキシ URL などのリモートブラウザーオリジンは、
`gateway.controlUi.allowedOrigins` に明示的に追加します。

### ホットリロードモード

| `gateway.reload.mode` | 動作                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 設定をリロードしない                       |
| `hot`                 | ホットセーフな変更のみを適用               |
| `restart`             | リロードが必要な変更時に再起動             |
| `hybrid` (default)    | 安全な場合はホット適用し、必要な場合は再起動 |

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

## 複数の gateway（同一ホスト）

ほとんどのインストールでは、1 台のマシンにつき 1 つの gateway を実行すべきです。1 つの gateway で複数の
エージェントとチャネルをホストできます。

意図的に分離したい場合やレスキューボットが必要な場合にのみ、複数の gateway が必要です。

便利な確認:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される内容:

- `gateway status --deep` は `Other gateway-like services detected (best effort)` を報告し、
  古い launchd/systemd/schtasks インストールが残っている場合はクリーンアップのヒントを出力できます。
- 複数のターゲットが応答する場合、`gateway probe` は `multiple reachable gateways` について警告できます。
- それが意図した状態であれば、gateway ごとにポート、設定/状態、ワークスペースルートを分離します。

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

## VoiceClaw リアルタイムブレインエンドポイント

OpenClaw は、VoiceClaw 互換のリアルタイム WebSocket エンドポイントを
`/voiceclaw/realtime` で公開します。VoiceClaw デスクトップクライアントが、別のリレープロセスを経由せずに、リアルタイムの OpenClaw ブレインと直接通信する必要がある場合に使用します。

このエンドポイントはリアルタイム音声に Gemini Live を使用し、OpenClaw ツールを Gemini Live に直接公開することで、OpenClaw をブレインとして呼び出します。ツール呼び出しは、音声ターンの応答性を保つために即座に `working` 結果を返します。その後、OpenClaw が実際のツールを非同期に実行し、結果をライブセッションへ戻します。gateway プロセス環境で `GEMINI_API_KEY` を設定します。gateway 認証が有効な場合、デスクトップクライアントは最初の `session.config` メッセージで gateway トークンまたはパスワードを送信します。

リアルタイムブレインアクセスは、所有者に認可された OpenClaw エージェントコマンドを実行します。
`gateway.auth.mode: "none"` は loopback のみのテストインスタンスに限定してください。非ローカルの
リアルタイムブレイン接続には gateway 認証が必要です。

分離されたテスト gateway の場合は、独自のポート、設定、状態を持つ別インスタンスを実行します。

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

次に、VoiceClaw が次を使用するように設定します。

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## リモートアクセス

推奨: Tailscale/VPN。
フォールバック: SSH トンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

次に、クライアントをローカルで `ws://127.0.0.1:18789` に接続します。

<Warning>
SSH トンネルは gateway 認証を迂回しません。共有シークレット認証では、クライアントはトンネル経由でも
`token`/`password` を送信する必要があります。ID を伴うモードでは、リクエストは引き続きその認証パスを満たす必要があります。
</Warning>

参照: [Remote Gateway](/ja-JP/gateway/remote)、[認証](/ja-JP/gateway/authentication)、[Tailscale](/ja-JP/gateway/tailscale)。

## 監督とサービスライフサイクル

本番に近い信頼性には、監督付き実行を使用します。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

再起動には `openclaw gateway restart` を使用します。`openclaw gateway stop` と `openclaw gateway start` を連結しないでください。macOS では、`gateway stop` は停止前に意図的に LaunchAgent を無効化します。

LaunchAgent ラベルは、`ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きプロファイル）です。`openclaw doctor` はサービス設定のずれを監査し、修復します。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も永続化するには、lingering を有効化します。

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

ネイティブ Windows の管理起動は、`OpenClaw Gateway`（または名前付きプロファイルでは `OpenClaw Gateway (<profile>)`）という Scheduled Task を使用します。Scheduled Task の作成が拒否された場合、OpenClaw は状態ディレクトリ内の `gateway.cmd` を指す、ユーザーごとの Startup フォルダーランチャーにフォールバックします。

  </Tab>

  <Tab title="Linux (system service)">

マルチユーザー/常時稼働ホストにはシステムユニットを使用します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ユーザーユニットと同じサービス本体を使用しますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` の下にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整します。

同じプロファイル/ポートに対して `openclaw doctor --fix` にユーザーレベルの gateway サービスもインストールさせないでください。Doctor はシステムレベルの OpenClaw gateway サービスを検出すると、その自動インストールを拒否します。システムユニットがライフサイクルを所有する場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を使用します。

  </Tab>
</Tabs>

## 開発プロファイルのクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離された状態/設定と、ベース gateway ポート `19001` が含まれます。

## プロトコルクイックリファレンス（オペレーター視点）

- 最初のクライアントフレームは `connect` でなければなりません。
- Gateway は `hello-ok` スナップショット（`presence`、`health`、`stateVersion`、`uptimeMs`、制限/ポリシー）を返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、
  呼び出し可能なすべてのヘルパールートの生成済みダンプではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには、`connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、ペアリング/承認ライフサイクルイベント、`shutdown` が含まれます。

エージェント実行は 2 段階です。

1. 即時の accepted ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間に `agent` イベントがストリーミングされます。

完全なプロトコルドキュメントを参照: [Gateway プロトコル](/ja-JP/gateway/protocol)。

## 運用チェック

### Liveness

- WS を開き、`connect` を送信します。
- スナップショットを含む `hello-ok` レスポンスを想定します。

### 準備状態

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップからの復旧

イベントは再生されません。シーケンスギャップがある場合は、続行する前に状態（`health`、`system-presence`）を更新してください。

## 一般的な失敗シグネチャ

| シグネチャ                                                     | 想定される問題                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 有効な Gateway 認証パスなしで非ループバックにバインドしている                  |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 設定がリモートモードになっている、または破損した設定からローカルモードスタンプが欠落している |
| `unauthorized` during connect                                  | クライアントと Gateway の認証不一致                                             |

完全な診断手順については、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)を使用してください。

## 安全性の保証

- Gateway プロトコルクライアントは、Gateway が利用できない場合に即座に失敗します（暗黙の直接チャネルフォールバックはありません）。
- 無効な、または最初のフレームが connect でないものは拒否され、閉じられます。
- グレースフルシャットダウンでは、ソケットを閉じる前に `shutdown` イベントを送出します。

---

関連:

- [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [ヘルス](/ja-JP/gateway/health)
- [Doctor](/ja-JP/gateway/doctor)
- [認証](/ja-JP/gateway/authentication)

## 関連

- [設定](/ja-JP/gateway/configuration)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [リモートアクセス](/ja-JP/gateway/remote)
- [シークレット管理](/ja-JP/gateway/secrets)

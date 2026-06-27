---
read_when:
    - ローカルインストールではなくコンテナ化された Gateway が必要な場合
    - Docker フローを検証しています
summary: OpenClaw 向けの任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-06-27T11:47:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。コンテナ化された Gateway が必要な場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に適していますか？

- **はい**: 分離された使い捨ての Gateway 環境が必要、またはローカルインストールなしのホストで OpenClaw を実行したい場合。
- **いいえ**: 自分のマシンで実行していて、最速の開発ループだけが必要な場合。代わりに通常のインストールフローを使用してください。
- **サンドボックス化の注記**: サンドボックス化が有効な場合、デフォルトのサンドボックスバックエンドは Docker を使用しますが、サンドボックス化はデフォルトでオフであり、完全な Gateway を Docker で実行する必要は**ありません**。SSH と OpenShell のサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも 2 GB の RAM（1 GB ホストでは `pnpm install` が OOM により終了コード 137 で強制終了される場合があります）
- イメージとログ用の十分なディスク容量
- VPS/公開ホストで実行する場合は、
  [ネットワーク公開のためのセキュリティ強化](/ja-JP/gateway/security)、
  特に Docker の `DOCKER-USER` ファイアウォールポリシーを確認してください。

## コンテナ化された Gateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより Gateway イメージがローカルにビルドされます。代わりにビルド済みイメージを使用するには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    で公開されています。
    一般的なタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="エアギャップ環境での再実行">
    オフラインホストでは、先にイメージを転送して読み込んでください。

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` は、`OPENCLAW_IMAGE` がすでにローカルに存在することを検証し、
    暗黙の Compose pull と build を無効にしてから、`.env` 同期、権限修正、
    オンボーディング、Gateway 設定同期、Compose 起動などの通常のセットアップフローを実行します。

    `OPENCLAW_SANDBOX=1` の場合、オフラインセットアップは
    `OPENCLAW_DOCKER_SOCKET` の背後にあるデーモン上で、設定されたデフォルトの
    サンドボックスイメージと、エージェントごとのアクティブなサンドボックスイメージも確認します。
    Docker ベースのブラウザーイメージには、現在の OpenClaw ブラウザー契約ラベルも必要です。
    必須イメージが欠落している、または互換性がない場合、セットアップは使用不能なサンドボックスで成功を報告する代わりに、
    サンドボックス設定を変更せずに終了します。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動的に実行します。これは次を行います。

    - プロバイダー API キーの入力を求める
    - Gateway トークンを生成し、`.env` に書き込む
    - 認証プロファイルの秘密鍵ディレクトリを作成する
    - Docker Compose 経由で Gateway を起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接通じて実行されます。`openclaw-cli` は
    Gateway コンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、設定済みの
    共有シークレットを Settings に貼り付けます。セットアップスクリプトはデフォルトでトークンを `.env` に書き込みます。
    コンテナ設定をパスワード認証に切り替えた場合は、代わりにそのパスワードを使用してください。

    URL がもう一度必要ですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャネルを設定する（任意）">
    CLI コンテナを使用してメッセージングチャネルを追加します。

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)

  </Step>
</Steps>

### 手動フロー

セットアップスクリプトを使用せずに各ステップを自分で実行したい場合:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
リポジトリルートから `docker compose` を実行してください。`OPENCLAW_EXTRA_MOUNTS`
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml` を書き込みます。
標準のオーバーライドファイルがある場合は、その後に含めてください。たとえば、両方のオーバーライドファイルが存在する場合は
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
です。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、
起動後のツールです。`docker compose up -d openclaw-gateway` の前に、
`--no-deps --entrypoint node` を指定した `openclaw-gateway` を通じて
オンボーディングとセットアップ時の設定書き込みを実行してください。
</Note>

### 環境変数

セットアップスクリプトは、次の任意の環境変数を受け付けます。

| 変数                                       | 目的                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ローカルでビルドする代わりにリモートイメージを使用する                |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | ビルド中に追加の apt パッケージをインストールする（スペース区切り）   |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | ビルド中に追加の Python パッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS`                      | ビルド時に Plugin 依存関係を事前インストールする（スペース区切りの名前） |
| `OPENCLAW_EXTRA_MOUNTS`                    | 追加のホスト bind mount（カンマ区切りの `source:target[:opts]`）       |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` を名前付き Docker ボリュームに永続化する                 |
| `OPENCLAW_SANDBOX`                         | サンドボックスのブートストラップにオプトインする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_SKIP_ONBOARDING`                 | 対話型オンボーディング手順をスキップする（`1`、`true`、`yes`、`on`）   |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker ソケットパスを上書きする                                       |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS アドバタイズを無効にする（Docker ではデフォルト `1`）     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | バンドル済み Plugin ソースの bind-mount オーバーレイを無効にする      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry エクスポート用の共有 OTLP/HTTP コレクターエンドポイント |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | トレース、メトリクス、ログ用のシグナル固有 OTLP エンドポイント        |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP プロトコルの上書き。現在は `http/protobuf` のみサポート           |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry リソースに使用するサービス名                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 最新の実験的 GenAI セマンティック属性にオプトインする                 |
| `OPENCLAW_OTEL_PRELOADED`                  | すでにプリロードされている場合、2 つ目の OpenTelemetry SDK の起動をスキップする |

公式 Docker イメージには Homebrew は含まれていません。オンボーディング中、OpenClaw は
`brew` のない Linux コンテナ内で実行されている場合、brew のみに対応した skill 依存関係インストーラーを非表示にします。
それらの依存関係は、カスタムイメージで提供するか、手動でインストールする必要があります。Debian パッケージから利用できる依存関係には、
イメージビルド時に `OPENCLAW_IMAGE_APT_PACKAGES` を使用してください。従来の
`OPENCLAW_DOCKER_APT_PACKAGES` 名も引き続き受け付けます。
Python 依存関係には `OPENCLAW_IMAGE_PIP_PACKAGES` を使用してください。これはイメージビルド中に
`python3 -m pip install --break-system-packages` を実行するため、パッケージバージョンを固定し、
信頼できるパッケージインデックスのみを使用してください。

メンテナーは、たとえば
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
のように、1 つの Plugin ソースディレクトリをパッケージ化されたソースパス上にマウントすることで、
パッケージ化されたイメージに対してバンドル済み Plugin ソースをテストできます。
そのマウントされたソースディレクトリは、同じ Plugin ID の一致するコンパイル済み
`/app/dist/extensions/synology-chat` バンドルを上書きします。

### 可観測性

OpenTelemetry エクスポートは、Gateway コンテナから OTLP コレクターへのアウトバウンドです。
公開された Docker ポートは不要です。イメージをローカルでビルドし、バンドル済み OpenTelemetry エクスポーターを
イメージ内で利用できるようにしたい場合は、そのランタイム依存関係を含めてください。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

パッケージ化された Docker インストールでエクスポートを有効にする前に、ClawHub から公式の
`@openclaw/diagnostics-otel` Plugin をインストールしてください。カスタムのソースビルドイメージでは、
`OPENCLAW_EXTENSIONS=diagnostics-otel` によりローカル Plugin ソースを引き続き含めることができます。
エクスポートを有効にするには、設定で `diagnostics-otel` Plugin を許可して有効化し、
`diagnostics.otel.enabled=true` を設定するか、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
の設定例を使用してください。コレクター認証ヘッダーは
Docker 環境変数ではなく、`diagnostics.otel.headers` を通じて設定します。

Prometheus メトリクスは、すでに公開済みの Gateway ポートを使用します。
`clawhub:@openclaw/diagnostics-prometheus` をインストールし、
`diagnostics-prometheus` Plugin を有効にしてから、スクレイプしてください。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別の公開
`/metrics` ポートや、未認証のリバースプロキシパスを公開しないでください。
[Prometheus メトリクス](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには、`/healthz` に ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続ける場合、Docker はコンテナを `unhealthy` としてマークし、
オーケストレーションシステムはそれを再起動または置き換えることができます。

認証済みの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN と loopback

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を設定するため、
Docker のポート公開によりホストから `http://127.0.0.1:18789` にアクセスできます。

- `lan`（デフォルト）: ホストブラウザーとホスト CLI が公開された Gateway ポートに到達できます。
- `loopback`: コンテナのネットワーク名前空間内のプロセスだけが Gateway に直接到達できます。

<Note>
`gateway.bind` では、`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではなく、
bind モード値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使用してください。
</Note>

### ホストローカルプロバイダー

OpenClaw が Docker で実行されている場合、コンテナ内の `127.0.0.1` はホストマシンではなく、
コンテナ自体を指します。ホスト上で実行される AI プロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL | Docker セットアップ URL              |
| ------------ | ---------------------- | ------------------------------------ |
| LM Studio    | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama       | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

バンドル済み Docker セットアップは、これらのホスト URL を LM Studio と Ollama の
オンボーディングデフォルトとして使用し、`docker-compose.yml` は Linux Docker Engine 向けに
`host.docker.internal` を Docker のホストゲートウェイへマップします。Docker Desktop は macOS と Windows で
すでに同じホスト名を提供しています。

ホストサービスも、Docker から到達可能なアドレスで待ち受ける必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` コマンドを使う場合は、同じホスト
マッピングを自分で追加します。例:
`--add-host=host.docker.internal:host-gateway`

### Docker での Claude CLI バックエンド

公式の OpenClaw Docker イメージには Claude Code はプリインストールされていません。OpenClaw を実行するコンテナユーザー内で Claude Code をインストールしてログインし、
イメージのアップグレードでバイナリや Claude の認証状態が消えないように、
そのコンテナホームを永続化します。

新規の Docker インストールでは、セットアップを実行する前に永続的な `/home/node` ボリュームを有効にします。

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

既存の Docker インストールでは、まずスタックを停止し、セットアップを再実行する前に現在の
Docker `.env` 値を再読み込みします。セットアップスクリプトは
`.env` を自動では読みません。現在のシェルとデフォルト値から `.env` を再生成します。
生成済みの `.env` では、次を実行します。

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env` にシェルで source できない値が含まれる場合は、先に依存している既存値を手動で再 export してください。たとえば `OPENCLAW_IMAGE`、ポート、バインドモード、
カスタムパス、`OPENCLAW_EXTRA_MOUNTS`、サンドボックス、オンボーディングをスキップする設定などです。
生成されたオーバーレイは、`openclaw-gateway` と
`openclaw-cli` の両方にホームボリュームをマウントします。

以降のコマンドは、生成された Compose オーバーレイ付きで実行し、両方のサービスが
永続化されたホームをマウントするようにします。セットアップで `docker-compose.override.yml` も使っている場合は、
`docker-compose.extra.yml` の前に含めます。

その永続化されたホームに Claude Code をインストールします。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ネイティブインストーラーは `claude` バイナリを
`/home/node/.local/bin/claude` に書き込みます。OpenClaw にそのコンテナパスを使わせます。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

同じ永続化されたコンテナホームの中からログインして確認します。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

その後、同梱の `claude-cli` バックエンドを使えます。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` は、ネイティブの Claude Code インストールを
`/home/node/.local/bin` と `/home/node/.local/share/claude` の下に永続化し、さらに Claude Code の
設定と認証状態を `/home/node/.claude` と `/home/node/.claude.json` の下に永続化します。
Claude CLI を再利用するには、`/home/node/.openclaw` だけを永続化しても不十分です。
ホームボリュームの代わりに `OPENCLAW_EXTRA_MOUNTS` を使う場合は、これらすべての
Claude パスを両方の Docker サービスにマウントしてください。

<Note>
共有の本番自動化や予測可能な Anthropic 請求には、
Anthropic API キーの経路を優先してください。Claude CLI の再利用は、Claude Code のインストール済み
バージョン、アカウントログイン、請求、更新動作に従います。
</Note>

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト
(`224.0.0.251:5353`) を安定して転送しません。そのため、同梱の Compose セットアップでは
デフォルトで `OPENCLAW_DISABLE_BONJOUR=1` になっており、ブリッジがマルチキャストトラフィックを落としたときに
Gateway がクラッシュループしたり、アドバタイズを繰り返し再起動したりしないようにしています。

Docker ホストでは、公開済みの Gateway URL、Tailscale、または広域 DNS-SD を使ってください。
`OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、
または mDNS マルチキャストが動作することが分かっている別のネットワークで実行する場合にのみ設定してください。

注意点とトラブルシューティングについては、[Bonjour 検出](/ja-JP/gateway/bonjour) を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に、
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` を `/home/node/.config/openclaw` に bind mount するため、これらの
パスはコンテナを置き換えても残ります。いずれかの変数が未設定の場合、同梱の
`docker-compose.yml` は `${HOME}` の下にフォールバックし、`HOME` 自体も
ない場合は `/tmp` にフォールバックします。これにより、最小環境で `docker compose up` が空の source を持つ
ボリューム仕様を出力しないようにしています。

そのマウントされた設定ディレクトリには、OpenClaw が次を保持します。

- 振る舞い設定用の `openclaw.json`
- 保存済みプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` などの環境変数ベースのランタイムシークレット用の `.env`

認証プロファイルのシークレットキーディレクトリには、
OAuth ベースの認証プロファイルトークン素材に使うローカル暗号化キーが保存されます。Docker ホストの状態と一緒に保持しつつ、
`OPENCLAW_CONFIG_DIR` とは分離してください。

インストール済みのダウンロード可能な Plugin は、マウントされた
OpenClaw ホームの下にパッケージ状態を保存するため、Plugin のインストール記録とパッケージルートはコンテナを置き換えても残ります。
Gateway 起動時に同梱 Plugin の依存関係ツリーは生成されません。

VM デプロイにおける完全な永続化の詳細は、
[Docker VM Runtime - 何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where) を参照してください。

**ディスク増加のホットスポット:** `media/`、セッション JSONL ファイル、共有
SQLite 状態データベース、インストール済み Plugin のパッケージルート、`/tmp/openclaw/` 配下のローテーションファイルログを監視してください。

### シェルヘルパー（任意）

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` の raw パスから ClawDock をインストールしていた場合は、上のインストールコマンドを再実行して、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使います。すべてのコマンドは
`clawdock-help` で確認できます。
完全なヘルパーガイドは [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker gateway の agent サンドボックスを有効化">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    カスタムソケットパス（例: rootless Docker）:

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    スクリプトは、サンドボックスの前提条件を満たした後でのみ `docker.sock` をマウントします。
    サンドボックスのセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` にリセットします。OpenClaw サンドボックスが有効な間も、Codex コードモードのターンは Codex
    `workspace-write` に制約されます。ホストの Docker ソケットを
    agent サンドボックスコンテナにマウントしないでください。

  </Accordion>

  <Accordion title="自動化 / CI（非対話）">
    `-T` で Compose の疑似 TTY 割り当てを無効にします。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティメモ">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使うため、CLI
    コマンドは `127.0.0.1` 経由で Gateway に到達できます。これは共有された
    信頼境界として扱ってください。Compose 設定は `openclaw-gateway` と `openclaw-cli` の両方で
    `NET_RAW`/`NET_ADMIN` を削除し、
    `no-new-privileges` を有効にします。
  </Accordion>

  <Accordion title="openclaw-cli での Docker Desktop DNS 障害">
    一部の Docker Desktop セットアップでは、`NET_RAW` が削除された後に共有ネットワークの
    `openclaw-cli` サイドカーからの DNS ルックアップに失敗します。これは
    `openclaw plugins install` などの npm ベースのコマンド中に
    `EAI_AGAIN` として現れます。
    通常の Gateway 運用では、デフォルトの強化済み Compose ファイルを使い続けてください。
    下のローカルオーバーライドは、Docker のデフォルト capabilities を復元することで CLI コンテナのセキュリティ姿勢を緩めます。そのため、デフォルトの Compose
    呼び出しとしてではなく、パッケージレジストリアクセスを必要とする一度きりの CLI
    コマンドにのみ使ってください。

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    すでに長時間実行される `openclaw-cli` コンテナを作成している場合は、
    同じオーバーライドで再作成してください。`docker compose exec` と `docker exec` は、
    作成済みコンテナの Linux capabilities を変更できません。

  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node`（uid 1000）として実行されます。
    `/home/node/.openclaw` で権限エラーが出る場合は、ホストの bind mount が uid 1000 に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同じ不一致は、次のような Plugin 警告として現れることがあります。
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    に続いて `plugin present but blocked` が表示されます。これは、プロセス uid と
    マウントされた Plugin ディレクトリの所有者が一致していないことを意味します。コンテナはデフォルトの uid 1000 として実行し、bind mount の所有権を修正することを優先してください。
    OpenClaw を長期的に root として実行する意図がある場合にのみ、
    `/path/to/openclaw-config/npm` を `root:root` に chown してください。

  </Accordion>

  <Accordion title="より速いリビルド">
    依存関係レイヤーがキャッシュされるように Dockerfile を並べます。これにより、lockfile が変わらない限り
    `pnpm install` の再実行を避けられます。

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="パワーユーザー向けコンテナオプション">
    デフォルトイメージはセキュリティ優先で、非 root の `node` として実行されます。より
    多機能なコンテナにするには:

    1. **`/home/node` を永続化**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python 依存関係を焼き込む**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium を焼き込む**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **または Playwright ブラウザーを永続化ボリュームにインストール**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **ブラウザーダウンロードを永続化**: `OPENCLAW_HOME_VOLUME` または
       `OPENCLAW_EXTRA_MOUNTS` を使います。OpenClaw は Linux 上で Docker イメージの
       Playwright 管理 Chromium を自動検出します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（headless Docker）">
    ウィザードで OpenAI Codex OAuth を選ぶと、ブラウザー URL が開きます。
    Docker または headless セットアップでは、到達した完全なリダイレクト URL をコピーして
    ウィザードに貼り戻し、認証を完了してください。
  </Accordion>

  <Accordion title="ベースイメージのメタデータ">
    メインの Docker ランタイムイメージは `node:24-bookworm-slim` を使用し、長時間実行されるコンテナでゾンビプロセスが回収され、シグナルが正しく処理されるように、エントリポイントの init プロセス (PID 1) として `tini` を含みます。`org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` などを含む OCI ベースイメージ注釈を公開します。Node ベースのダイジェストは
    Dependabot の Docker ベースイメージ PR によって更新されます。リリースビルドでは
    ディストリビューションのアップグレードレイヤーは実行されません。詳しくは
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md) を参照してください。
  </Accordion>
</AccordionGroup>

### VPS で実行しますか？

バイナリの組み込み、永続化、更新を含む共有 VM デプロイ手順については、
[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## エージェントサンドボックス

`agents.defaults.sandbox` が Docker バックエンドで有効な場合、gateway は
エージェントのツール実行 (シェル、ファイルの読み取り/書き込みなど) を隔離された Docker
コンテナ内で実行し、gateway 自体はホスト上に残ります。これにより、gateway 全体をコンテナ化せずに、
信頼されていない、またはマルチテナントのエージェントセッションの周囲に強い壁を設けられます。

サンドボックスのスコープはエージェント単位 (デフォルト)、セッション単位、または共有にできます。各スコープには、
`/workspace` にマウントされる独自のワークスペースがあります。ツールの許可/拒否ポリシー、
ネットワーク分離、リソース制限、ブラウザコンテナも設定できます。

完全な設定、イメージ、セキュリティノート、マルチエージェントプロファイルについては、以下を参照してください。

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- サンドボックスの完全なリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナへの対話型シェルアクセス
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位のオーバーライド

### クイック有効化

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

デフォルトのサンドボックスイメージをビルドします (ソースチェックアウトから)。

```bash
scripts/sandbox-setup.sh
```

ソースチェックアウトなしの npm インストールでは、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージがない、またはサンドボックスコンテナが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (ソースチェックアウト) または [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) のインライン `docker build` コマンド (npm install) でサンドボックスイメージをビルドするか、
    `agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。
    コンテナは必要に応じてセッション単位で自動作成されます。
  </Accordion>

  <Accordion title="サンドボックス内の権限エラー">
    `docker.user` を、マウントしたワークスペースの所有権と一致する UID:GID に設定するか、
    ワークスペースフォルダを chown してください。
  </Accordion>

  <Accordion title="カスタムツールがサンドボックス内で見つからない">
    OpenClaw は `/etc/profile` を読み込み PATH をリセットすることがある
    `sh -lc` (ログインシェル) でコマンドを実行します。`docker.env.PATH` を設定して
    カスタムツールのパスを先頭に追加するか、Dockerfile 内で `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM-killed された (終了 137)">
    VM には少なくとも 2 GB の RAM が必要です。より大きなマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で未認証またはペアリングが必要">
    新しいダッシュボードリンクを取得し、ブラウザデバイスを承認してください。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [ダッシュボード](/ja-JP/web/dashboard)、[デバイス](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway ターゲットに ws://172.x.x.x が表示される、または Docker CLI からペアリングエラーが出る">
    gateway モードとバインドをリセットしてください。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [インストール概要](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替となる Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose のコミュニティセットアップ
- [更新](/ja-JP/install/updating) — OpenClaw を最新の状態に保つ
- [設定](/ja-JP/gateway/configuration) — インストール後の gateway 設定

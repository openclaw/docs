---
read_when:
    - ローカルインストールではなくコンテナ化された gateway が必要な場合
    - Docker フローを検証しています
summary: OpenClaw の任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-07-01T12:47:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。コンテナ化された Gateway が必要な場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に適していますか？

- **はい**: 分離された使い捨ての Gateway 環境が必要な場合、またはローカルインストールなしのホストで OpenClaw を実行したい場合。
- **いいえ**: 自分のマシンで実行していて、最速の開発ループだけが必要な場合。代わりに通常のインストールフローを使用してください。
- **サンドボックス化の注記**: サンドボックス化が有効な場合、デフォルトのサンドボックスバックエンドは Docker を使用しますが、サンドボックス化はデフォルトでオフであり、Gateway 全体を Docker で実行する必要は**ありません**。SSH と OpenShell のサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも 2 GB RAM（1 GB のホストでは `pnpm install` が OOM により exit 137 で強制終了される場合があります）
- イメージとログ用の十分なディスク容量
- VPS/公開ホストで実行する場合は、特に Docker `DOCKER-USER` ファイアウォールポリシーについて、
  [ネットワーク公開のセキュリティ強化](/ja-JP/gateway/security)を確認してください。

## コンテナ化された Gateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより Gateway イメージがローカルでビルドされます。代わりにビルド済みイメージを使用するには、次のようにします。

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージはまず
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    に公開されます。GHCR は、リリース自動化、固定されたデプロイ、
    および出所確認のための主要レジストリです。同じリリースワークフローでは、Docker Hub を好むホスト向けに
    `openclaw/openclaw` の公式 Docker Hub ミラーも公開します。

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` または `openclaw/openclaw` を使用してください。コミュニティの
    Docker Hub ミラーは避けてください。OpenClaw はそれらのリリースタイミング、
    再ビルド、保持ポリシーを制御していません。一般的な公式タグは `main`、`latest`、
    `<version>`（例: `2026.2.26`）、および
    `2026.2.26-beta.1` などのベータ版です。ベータタグは `latest` や `main` を移動しません。

  </Step>

  <Step title="エアギャップ環境で再実行する">
    オフラインホストでは、まずイメージを転送してロードします。

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` は、`OPENCLAW_IMAGE` がすでにローカルに存在することを確認し、
    暗黙的な Compose の pull と build を無効にしてから、`.env` 同期、
    権限修正、オンボーディング、Gateway 設定同期、Compose 起動などの通常のセットアップフローを実行します。

    `OPENCLAW_SANDBOX=1` の場合、オフラインセットアップは
    `OPENCLAW_DOCKER_SOCKET` の背後にあるデーモン上で、設定済みのデフォルトおよびアクティブなエージェントごとのサンドボックスイメージも確認します。Docker ベースのブラウザーイメージには、
    現在の OpenClaw ブラウザー契約ラベルも必要です。必須イメージが見つからない、または互換性がない場合、セットアップは使用できないサンドボックスで成功を報告する代わりに、サンドボックス設定を変更せずに終了します。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動的に実行します。次の処理を行います。

    - プロバイダー API キーの入力を求める
    - Gateway トークンを生成して `.env` に書き込む
    - auth-profile シークレットキーのディレクトリを作成する
    - Docker Compose 経由で Gateway を起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接通じて実行されます。`openclaw-cli` は、Gateway コンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、設定済みの共有シークレットを Settings に貼り付けます。セットアップスクリプトはデフォルトでトークンを `.env` に書き込みます。コンテナ設定をパスワード認証に切り替えた場合は、代わりにそのパスワードを使用してください。

    URL が再度必要ですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャンネルを設定する（任意）">
    CLI コンテナを使用してメッセージングチャンネルを追加します。

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

セットアップスクリプトを使用せずに各ステップを自分で実行したい場合は、次のようにします。

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
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml` を書き込みます。標準の override ファイルの後に含めてください。たとえば、両方の override ファイルが存在する場合は
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
です。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、起動後のツールです。`docker compose up -d openclaw-gateway` の前には、
`--no-deps --entrypoint node` を指定して `openclaw-gateway` 経由でオンボーディングとセットアップ時の設定書き込みを実行してください。
</Note>

### 環境変数

セットアップスクリプトは次の任意の環境変数を受け付けます。

| 変数                                            | 目的                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | ローカルでビルドする代わりにリモートイメージを使用する                |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | ビルド中に追加の apt パッケージをインストールする（スペース区切り）   |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | ビルド中に追加の Python パッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS`                           | ビルド時に Plugin 依存関係を事前インストールする（スペース区切り名）  |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | ローカルソースビルドの Node オプションを上書きする                    |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | ローカルソースビルドの tsdown ヒープを MB 単位で上書きする            |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | ランタイム専用ローカルイメージビルド中に宣言出力をスキップする        |
| `OPENCLAW_EXTRA_MOUNTS`                         | 追加のホスト bind mount（カンマ区切りの `source:target[:opts]`）      |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` を名前付き Docker ボリュームに永続化する                 |
| `OPENCLAW_SANDBOX`                              | サンドボックスのブートストラップを有効にする（`1`, `true`, `yes`, `on`） |
| `OPENCLAW_SKIP_ONBOARDING`                      | 対話式オンボーディング手順をスキップする（`1`, `true`, `yes`, `on`）  |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker ソケットパスを上書きする                                       |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour/mDNS 広告を無効にする（Docker ではデフォルトで `1`）          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | バンドル済み Plugin ソースの bind-mount オーバーレイを無効にする      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry エクスポート用の共有 OTLP/HTTP コレクターエンドポイント |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | traces、metrics、または logs 用のシグナル固有 OTLP エンドポイント     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP プロトコルの上書き。現在サポートされるのは `http/protobuf` のみ  |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry リソースに使用されるサービス名                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 最新の実験的な GenAI セマンティック属性を有効にする                  |
| `OPENCLAW_OTEL_PRELOADED`                       | すでにプリロードされている場合、2 つ目の OpenTelemetry SDK の起動をスキップする |

公式 Docker イメージには Homebrew は含まれていません。オンボーディング中、OpenClaw は
`brew` のない Linux コンテナで実行されている場合、brew 専用の skill 依存関係インストーラーを非表示にします。これらの依存関係は、カスタムイメージで提供するか、手動でインストールする必要があります。Debian パッケージから利用できる依存関係については、イメージビルド中に
`OPENCLAW_IMAGE_APT_PACKAGES` を使用してください。従来の
`OPENCLAW_DOCKER_APT_PACKAGES` 名も引き続き受け付けられます。
Python 依存関係には `OPENCLAW_IMAGE_PIP_PACKAGES` を使用してください。これはイメージビルド中に
`python3 -m pip install --break-system-packages` を実行するため、パッケージバージョンを固定し、信頼できるパッケージインデックスのみを使用してください。
ソースビルドでは `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` のデフォルトは
`--max-old-space-size=8192` で、tsdown ラッパーがコンテナメモリ制限を尊重できるように
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` は未設定のままにします。また、ランタイムイメージはビルド後に宣言ファイルを削除するため、
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` もデフォルトになります。Docker が `ResourceExhausted`、`cannot allocate
memory` を報告する場合、または `tsdown` 中に中断する場合は、Docker ビルダーのメモリ制限を増やすか、
たとえば
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`
のように、より小さい明示的なヒープで再試行してください。

メンテナーは、1 つの Plugin ソースディレクトリをパッケージ済みソースパスの上にマウントすることで、パッケージ化されたイメージに対してバンドル済み Plugin ソースをテストできます。例:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
そのマウントされたソースディレクトリは、同じ Plugin id に対して一致するコンパイル済みの
`/app/dist/extensions/synology-chat` バンドルを上書きします。

### 可観測性

OpenTelemetry エクスポートは Gateway コンテナから OTLP コレクターへの送信です。公開された Docker ポートは必要ありません。イメージをローカルでビルドし、バンドル済みの OpenTelemetry エクスポーターをイメージ内で利用したい場合は、そのランタイム依存関係を含めてください。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

パッケージ化された Docker インストールでエクスポートを有効にする前に、ClawHub から公式
`@openclaw/diagnostics-otel` Plugin をインストールしてください。カスタムのソースビルドイメージでは、引き続き
`OPENCLAW_EXTENSIONS=diagnostics-otel` を使用してローカル Plugin ソースを含めることができます。エクスポートを有効にするには、設定で
`diagnostics-otel` Plugin を許可して有効化し、その後
`diagnostics.otel.enabled=true` を設定するか、[OpenTelemetry
エクスポート](/ja-JP/gateway/opentelemetry)の設定例を使用してください。コレクター認証ヘッダーは Docker 環境変数ではなく、
`diagnostics.otel.headers` で設定します。

Prometheus metrics は、すでに公開されている Gateway ポートを使用します。
`clawhub:@openclaw/diagnostics-prometheus` をインストールし、
`diagnostics-prometheus` Plugin を有効化してから、次をスクレイプします。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別の公開 `/metrics` ポートや認証なしのリバースプロキシパスを公開しないでください。
[Prometheus metrics](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには、`/healthz` に ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` としてマークし、
オーケストレーションシステムはそれを再起動または置換できます。

認証済みの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN と loopback

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を使うため、
Docker のポート公開でホストから `http://127.0.0.1:18789` にアクセスできます。

- `lan` (デフォルト): ホストのブラウザーとホストの CLI が公開された Gateway ポートに到達できます。
- `loopback`: コンテナのネットワーク名前空間内のプロセスだけが
  Gateway に直接到達できます。

<Note>
`gateway.bind` では、`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではなく、
バインドモード値 (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) を使用してください。
</Note>

### ホストのローカルプロバイダー

OpenClaw を Docker で実行する場合、コンテナ内の `127.0.0.1` はホストマシンではなく
コンテナ自身です。ホスト上で動作する AI プロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL | Docker セットアップ URL |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

バンドルされた Docker セットアップは、これらのホスト URL を LM Studio と Ollama の
オンボーディングのデフォルトとして使用し、`docker-compose.yml` は Linux Docker Engine 向けに
`host.docker.internal` を Docker のホスト Gateway にマッピングします。Docker Desktop は
macOS と Windows で同じホスト名をすでに提供しています。

ホストサービスも、Docker から到達可能なアドレスでリッスンする必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルや `docker run` コマンドを使用する場合は、同じホストマッピングを
自分で追加してください。例:
`--add-host=host.docker.internal:host-gateway`.

### Docker の Claude CLI バックエンド

公式 OpenClaw Docker イメージには Claude Code はプリインストールされていません。
OpenClaw を実行するコンテナユーザー内で Claude Code をインストールしてログインし、
イメージのアップグレードでバイナリや Claude 認証状態が消えないように、そのコンテナホームを永続化してください。

新規 Docker インストールでは、セットアップを実行する前に永続的な `/home/node` ボリュームを有効にします。

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

既存の Docker インストールでは、まずスタックを停止し、セットアップを再実行する前に現在の
Docker `.env` 値を再読み込みします。セットアップスクリプトは `.env` を単独では読みません。
現在のシェルとデフォルトから `.env` を書き換えます。生成済みの `.env` では、次を実行します。

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env` にシェルで source できない値が含まれている場合は、まず依存している既存の値を手動で再 export してください。
たとえば `OPENCLAW_IMAGE`、ポート、バインドモード、カスタムパス、`OPENCLAW_EXTRA_MOUNTS`、
サンドボックス、オンボーディングスキップ設定などです。生成されるオーバーレイは、`openclaw-gateway` と
`openclaw-cli` の両方にホームボリュームをマウントします。

残りのコマンドは、生成された Compose オーバーレイを使って実行し、両方のサービスが永続化されたホームを
マウントするようにします。セットアップで `docker-compose.override.yml` も使用している場合は、
`docker-compose.extra.yml` より前に含めてください。

その永続化されたホームに Claude Code をインストールします。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ネイティブインストーラーは `claude` バイナリを
`/home/node/.local/bin/claude` に書き込みます。OpenClaw にそのコンテナパスを使うよう設定します。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

同じ永続化されたコンテナホーム内からログインして確認します。

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

その後、バンドルされた `claude-cli` バックエンドを使用できます。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` は、ネイティブ Claude Code のインストールを
`/home/node/.local/bin` と `/home/node/.local/share/claude` の下に永続化し、さらに Claude Code の
設定と認証状態を `/home/node/.claude` と `/home/node/.claude.json` の下に永続化します。
Claude CLI の再利用には、`/home/node/.openclaw` だけを永続化しても不十分です。
ホームボリュームの代わりに `OPENCLAW_EXTRA_MOUNTS` を使用する場合は、これらすべての
Claude パスを両方の Docker サービスにマウントしてください。

<Note>
共有本番自動化や予測可能な Anthropic 請求には、Anthropic API キーの経路を優先してください。
Claude CLI の再利用は、Claude Code のインストール済みバージョン、アカウントログイン、
請求、更新動作に従います。
</Note>

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト
(`224.0.0.251:5353`) を確実には転送しません。そのため、バンドルされた Compose セットアップでは
デフォルトで `OPENCLAW_DISABLE_BONJOUR=1` を設定し、ブリッジがマルチキャストトラフィックを落としたときに
Gateway がクラッシュループしたり、アドバタイズを繰り返し再起動したりしないようにしています。

Docker ホストには、公開された Gateway URL、Tailscale、または広域 DNS-SD を使用してください。
`OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが
動作することがわかっている別のネットワークで実行する場合にのみ設定してください。

注意点とトラブルシューティングについては、[Bonjour 検出](/ja-JP/gateway/bonjour)を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に、
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` を `/home/node/.config/openclaw` にバインドマウントするため、
これらのパスはコンテナ置換後も保持されます。いずれかの変数が未設定の場合、バンドルされた
`docker-compose.yml` は `${HOME}` 配下にフォールバックし、`HOME` 自体もない場合は `/tmp` に
フォールバックします。これにより、素の環境で `docker compose up` が空のソースを持つ
ボリューム仕様を出力しないようにしています。

そのマウントされた設定ディレクトリには、OpenClaw が次を保持します。

- 動作設定用の `openclaw.json`
- 保存済みプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` など、環境変数に基づくランタイムシークレット用の `.env`

認証プロファイルのシークレットキーディレクトリには、OAuth ベースの認証プロファイルトークン素材に使われる
ローカル暗号化キーが保存されます。これは Docker ホストの状態と一緒に保持してください。
ただし `OPENCLAW_CONFIG_DIR` とは分けてください。

インストール済みのダウンロード可能な Plugin は、マウントされた OpenClaw ホーム配下にパッケージ状態を保存するため、
Plugin インストール記録とパッケージルートはコンテナ置換後も保持されます。Gateway 起動時に
バンドル Plugin の依存関係ツリーは生成されません。

VM デプロイでの完全な永続化の詳細については、
[Docker VM ランタイム - 何がどこに保持されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

**ディスク増加のホットスポット:** `media/`、セッション JSONL ファイル、共有
SQLite 状態データベース、インストール済み Plugin のパッケージルート、`/tmp/openclaw/` 配下の
ローテーションファイルログを監視してください。

### シェルヘルパー (任意)

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` の raw パスから ClawDock をインストールしていた場合は、上のインストールコマンドを再実行し、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使用します。
すべてのコマンドについては `clawdock-help` を実行してください。
完全なヘルパーガイドについては、[ClawDock](/ja-JP/install/clawdock)を参照してください。

<AccordionGroup>
  <Accordion title="Docker Gateway のエージェントサンドボックスを有効にする">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    カスタムソケットパス (例: rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    スクリプトは、サンドボックスの前提条件が通過した後にのみ `docker.sock` をマウントします。
    サンドボックスセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` にリセットします。OpenClaw サンドボックスが有効な間も、Codex コードモードのターンは
    Codex `workspace-write` に制約されます。ホストの Docker ソケットをエージェントサンドボックスコンテナに
    マウントしないでください。

  </Accordion>

  <Accordion title="自動化 / CI (非対話)">
    `-T` で Compose の疑似 TTY 割り当てを無効にします。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティ注意事項">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使用するため、CLI
    コマンドは `127.0.0.1` 経由で Gateway に到達できます。これは共有された信頼境界として扱ってください。
    Compose 設定は `openclaw-gateway` と `openclaw-cli` の両方で `NET_RAW`/`NET_ADMIN` を削除し、
    `no-new-privileges` を有効にします。
  </Accordion>

  <Accordion title="openclaw-cli での Docker Desktop DNS 障害">
    一部の Docker Desktop セットアップでは、`NET_RAW` が削除された後、共有ネットワークの
    `openclaw-cli` サイドカーからの DNS ルックアップが失敗します。これは
    `openclaw plugins install` などの npm ベースのコマンド中に `EAI_AGAIN` として現れます。
    通常の Gateway 運用では、デフォルトの強化済み Compose ファイルを維持してください。
    次のローカルオーバーライドは、Docker のデフォルト capability を復元することで CLI コンテナの
    セキュリティ姿勢を緩めます。そのため、デフォルトの Compose 呼び出しとしてではなく、
    パッケージレジストリアクセスが必要な一回限りの CLI コマンドにのみ使用してください。

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    すでに長時間実行される `openclaw-cli` コンテナを作成している場合は、同じオーバーライドで再作成してください。
    `docker compose exec` と `docker exec` は、作成済みコンテナの Linux capability を変更できません。

  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node` (uid 1000) として実行されます。`/home/node/.openclaw` で権限エラーが表示される場合は、
    ホストのバインドマウントが uid 1000 に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同じ不一致は、次のような Plugin 警告として現れることもあります。
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    その後に `plugin present but blocked` が続きます。これは、プロセス uid と
    マウントされた Plugin ディレクトリの所有者が一致していないことを意味します。
    コンテナはデフォルトの uid 1000 で実行し、バインドマウントの所有権を修正することを優先してください。
    OpenClaw を長期的に root として意図的に実行する場合にのみ、
    `/path/to/openclaw-config/npm` を `root:root` に chown してください。

  </Accordion>

  <Accordion title="より高速な再ビルド">
    依存関係レイヤーがキャッシュされるように Dockerfile を並べます。これにより、lockfile が変更されない限り
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
    機能の充実したコンテナにするには:

    1. **`/home/node` を永続化する**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python 依存関係を焼き込む**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium を焼き込む**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **または Playwright ブラウザーを永続化ボリュームにインストールする**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **ブラウザーダウンロードを永続化する**: `OPENCLAW_HOME_VOLUME` または
       `OPENCLAW_EXTRA_MOUNTS` を使用します。OpenClaw は Linux 上で Docker イメージの
       Playwright 管理 Chromium を自動検出します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (ヘッドレス Docker)">
    ウィザードで OpenAI Codex OAuth を選択すると、ブラウザー URL が開きます。
    Docker またはヘッドレス構成では、到達した完全なリダイレクト URL をコピーし、
    ウィザードに貼り戻して認証を完了します。
  </Accordion>

  <Accordion title="ベースイメージのメタデータ">
    メインの Docker ランタイムイメージは `node:24-bookworm-slim` を使用し、長時間実行されるコンテナでゾンビプロセスが回収され、シグナルが正しく処理されるように、エントリーポイントの init プロセス (PID 1) として `tini` を含みます。`org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` などを含む OCI ベースイメージアノテーションを公開します。Node ベースのダイジェストは
    Dependabot の Docker ベースイメージ PR によって更新されます。リリースビルドでは
    ディストリビューションアップグレードレイヤーは実行されません。詳しくは
    [OCI イメージアノテーション](https://github.com/opencontainers/image-spec/blob/main/annotations.md) を参照してください。
  </Accordion>
</AccordionGroup>

### VPS で実行しますか?

バイナリの焼き込み、永続化、更新を含む共有 VM デプロイ手順については、
[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## エージェントサンドボックス

Docker バックエンドで `agents.defaults.sandbox` が有効な場合、Gateway は
エージェントのツール実行 (shell、ファイルの読み取り/書き込みなど) を分離された Docker
コンテナ内で実行し、Gateway 自体はホスト上に残ります。これにより、Gateway 全体を
コンテナ化せずに、信頼できないエージェントセッションやマルチテナントのエージェントセッションの周囲に強固な壁を設けられます。

サンドボックスのスコープは、エージェント単位 (デフォルト)、セッション単位、または共有にできます。各スコープには
`/workspace` にマウントされた独自のワークスペースが割り当てられます。allow/deny のツールポリシー、ネットワーク分離、リソース制限、ブラウザー
コンテナも設定できます。

完全な設定、イメージ、セキュリティノート、マルチエージェントプロファイルについては、以下を参照してください:

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- サンドボックスの完全なリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナへの対話型 shell アクセス
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位のオーバーライド

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

デフォルトのサンドボックスイメージをビルドします（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh
```

ソースチェックアウトなしの npm インストールでは、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージが見つからない、またはサンドボックスコンテナが起動しない">
    サンドボックスイメージは
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （ソースチェックアウト）または [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) のインライン `docker build` コマンド（npm インストール）でビルドするか、
    `agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。
    コンテナはセッションごとに必要に応じて自動作成されます。
  </Accordion>

  <Accordion title="サンドボックス内の権限エラー">
    `docker.user` を、マウントしたワークスペースの所有権と一致する UID:GID に設定するか、
    ワークスペースフォルダーを chown してください。
  </Accordion>

  <Accordion title="サンドボックス内でカスタムツールが見つからない">
    OpenClaw は `sh -lc`（ログインシェル）でコマンドを実行します。これにより
    `/etc/profile` が読み込まれ、PATH がリセットされる場合があります。`docker.env.PATH` を設定して
    カスタムツールのパスを先頭に追加するか、Dockerfile 内で `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM-killed された（終了 137）">
    VM には少なくとも 2 GB の RAM が必要です。より大きなマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で認証されていない、またはペアリングが必要">
    新しいダッシュボードリンクを取得し、ブラウザデバイスを承認します:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [ダッシュボード](/ja-JP/web/dashboard)、[デバイス](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway ターゲットに ws://172.x.x.x が表示される、または Docker CLI からペアリングエラーが発生する">
    Gateway モードとバインドをリセットします:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [インストール概要](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替としての Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose のコミュニティセットアップ
- [更新](/ja-JP/install/updating) — OpenClaw を最新に保つ
- [設定](/ja-JP/gateway/configuration) — インストール後の Gateway 設定

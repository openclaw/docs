---
read_when:
    - ローカルインストールではなく、コンテナ化されたGatewayを使用したい場合
    - Docker フローを検証しています
summary: OpenClaw のオプションの Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-07-12T14:35:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。分離された使い捨ての Gateway 環境や、ローカルインストールのないホストで使用してください。すでに自分のマシンで開発している場合は、代わりに通常のインストールフローを使用してください。

デフォルトのサンドボックスバックエンドは、`agents.defaults.sandbox` が有効な場合に Docker を使用しますが、サンドボックスはデフォルトで無効であり、Gateway 自体を Docker で実行する必要はありません。SSH および OpenShell サンドボックスバックエンドも利用できます。[サンドボックス](/ja-JP/gateway/sandboxing)を参照してください。

複数のユーザーをホストしますか？テナントごとに 1 つのセルを使用するモデルについては、[マルチテナントホスティング](/gateway/multi-tenant-hosting)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージのビルド用に 2 GB 以上の RAM（1 GB のホストでは、`pnpm install` が終了コード 137 で OOM により強制終了される場合があります）
- イメージとログ用の十分なディスク容量
- VPS／公開ホストでは、[ネットワーク公開時のセキュリティ強化](/ja-JP/gateway/security)、特に Docker の `DOCKER-USER` ファイアウォールチェーンを確認してください

## コンテナ化された Gateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリのルートから実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより、Gateway イメージが `openclaw:local` としてローカルにビルドされます。代わりにビルド済みイメージを使用するには、次を実行します。

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージは、最初に [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) に公開されます。GHCR は、リリース自動化、バージョンを固定したデプロイ、来歴チェックの主要レジストリです。同じリリースで、`openclaw/openclaw` に Docker Hub ミラーも公開されます。

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` または `openclaw/openclaw` を使用し、OpenClaw のリリース時期や保持ポリシーを共有しない非公式ミラーは避けてください。公式タグは `main`、`latest`、`<version>`（例：`2026.2.26`）、および `2026.2.26-beta.1` などのベータタグです（ベータが `latest`／`main` を移動することはありません）。デフォルトの `main`／`latest`／`<version>` イメージには、`codex` および `diagnostics-otel` Plugin が同梱されています。`-browser` バリアント（例：`latest-browser`）には Chromium も組み込まれており、初回実行時に Playwright をインストールせずに[サンドボックス化されたブラウザ](/ja-JP/gateway/sandboxing#sandboxed-browser)ツールを使用する場合に便利です。

  </Step>

  <Step title="エアギャップ環境で再実行する">
    オフラインホストでは、最初にイメージを転送して読み込みます。

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` は、`OPENCLAW_IMAGE` がすでにローカルに存在することを確認し、暗黙的な Compose のプル／ビルドを無効にしてから、通常のフロー（`.env` の同期、権限の修正、オンボーディング、Gateway 設定の同期、Compose の起動）を実行します。

    `OPENCLAW_SANDBOX=1` の場合、オフラインセットアップでは、`OPENCLAW_DOCKER_SOCKET` の背後にあるデーモン上で、設定済みのデフォルトおよびエージェントごとのサンドボックスイメージも確認します。これには、Docker ベースのブラウザイメージにあるブラウザ契約ラベルも含まれます。必要なイメージが存在しないか古い場合、セットアップは壊れた状態を成功として報告せず、サンドボックス設定を変更せずに終了します。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動的に実行します。

    - プロバイダーの API キーの入力を求める
    - Gateway トークンを生成して `.env` に書き込む
    - 認証プロファイルの秘密鍵ディレクトリを作成する
    - Docker Compose 経由で Gateway を起動する

    起動前のオンボーディングと設定の書き込みは、`openclaw-gateway` を直接経由して実行されます（`--no-deps --entrypoint node` を使用）。これは、`openclaw-cli` が Gateway のネットワーク名前空間を共有し、Gateway コンテナが存在してからでなければ動作しないためです。

  </Step>

  <Step title="Control UI を開く">
    `http://127.0.0.1:18789/` を開き、`.env` に書き込まれたトークンを Settings に貼り付けます。コンテナをパスワード認証に切り替えた場合は、代わりにそのパスワードを使用してください。

    URL をもう一度確認する必要がありますか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャンネルを設定する（任意）">
    ```bash
    # WhatsApp（QR）
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    ドキュメント：[WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)

  </Step>
</Steps>

### 手動フロー

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Docker コンテキストでは `.git` が除外されます。上記のようにソースの識別情報をビルド引数として渡すことで、イメージの About 画面にチェックアウト済みのコミットと単一のビルドタイムスタンプが表示されます。`scripts/docker/setup.sh` は両方の値を自動的に解決して渡します。

<Note>
リポジトリのルートから `docker compose` を実行してください。`OPENCLAW_EXTRA_MOUNTS` または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml` を書き込みます。自分で管理している `docker-compose.override.yml` がある場合は、その後に含めてください。例：`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

### コンテナイメージのアップグレード

マウント済みの状態／設定を維持したまま OpenClaw イメージを置き換えると、新しい Gateway は準備完了になる前に、起動時に安全なアップグレード移行と Plugin の収束処理を実行します。通常のイメージアップグレードでは、別途 `openclaw doctor --fix` を実行する必要はありません。

起動時にこれらの修復を安全に完了できない場合、Gateway は正常と報告せずに終了します。再起動ポリシーが設定されている場合、Docker、Podman、または Kubernetes では Gateway コンテナが再起動を繰り返しているように表示されることがあります。マウント済みの状態ボリュームを維持し、Gateway が使用するものと同じ状態／設定マウントを使って、同じイメージをコンテナコマンドとして `openclaw doctor --fix` を指定して一度実行します。

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

doctor の完了後、デフォルトコマンドで Gateway コンテナを再起動します。Kubernetes では、同じ PVC をマウントした一回限りの Job またはデバッグ Pod で同じコマンドを実行してから、Deployment または StatefulSet を再起動します。

### 環境変数

`scripts/docker/setup.sh`（および Gateway コンテナについては `docker-compose.yml` から直接）で受け付ける任意の変数：

| 変数                                            | 用途                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | ローカルでビルドする代わりにリモートイメージを使用する                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | ビルド中に追加の apt パッケージをインストールする（スペース区切り）。従来の別名：`OPENCLAW_DOCKER_APT_PACKAGES`            |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | ビルド中に追加の Python パッケージをインストールする（スペース区切り）                                                     |
| `OPENCLAW_EXTENSIONS`                           | 選択したサポート対象 Plugin をコンパイル／パッケージ化し、そのランタイム依存関係をインストールする（ID はカンマまたはスペース区切り） |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | ローカルソースビルドの Node オプションを上書きする（デフォルト：`--max-old-space-size=8192`）                              |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | ローカルソースビルドの tsdown ヒープを MB 単位で上書きする                                                                |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | ランタイム専用のローカルイメージビルド時に宣言出力をスキップする（デフォルト：`1`）                                       |
| `OPENCLAW_INSTALL_BROWSER`                      | ビルド時に Chromium + Xvfb をイメージへ組み込む                                                                           |
| `OPENCLAW_EXTRA_MOUNTS`                         | 追加のホストバインドマウント（カンマ区切りの `source:target[:opts]`）                                                      |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` を名前付き Docker ボリュームに永続化する                                                                     |
| `OPENCLAW_SANDBOX`                              | サンドボックスのブートストラップを有効にする（`1`、`true`、`yes`、`on`）                                                  |
| `OPENCLAW_SKIP_ONBOARDING`                      | 対話形式のオンボーディング手順をスキップする（`1`、`true`、`yes`、`on`）                                                  |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker ソケットのパスを上書きする                                                                                         |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour／mDNS アドバタイズを強制的に有効（`0`）または無効（`1`）にする。[Bonjour／mDNS](#bonjour--mdns)を参照             |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 同梱 Plugin ソースのバインドマウントオーバーレイを無効にする                                                              |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry エクスポート用の共有 OTLP／HTTP コレクターエンドポイント                                                    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | トレース、メトリクス、またはログ用のシグナル固有 OTLP エンドポイント                                                      |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP プロトコルの上書き。現在サポートされているのは `http/protobuf` のみ                                                  |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry リソースに使用するサービス名                                                                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 最新の実験的な GenAI セマンティック属性を有効にする                                                                        |
| `OPENCLAW_OTEL_PRELOADED`                       | OpenTelemetry SDK がプリロード済みの場合、2 つ目の SDK の起動をスキップする                                               |

公式イメージには Homebrew は含まれていません。オンボーディング中、OpenClaw は `brew` のない Linux コンテナでは brew 専用のスキル依存関係インストーラーを非表示にします。これらの依存関係はカスタムイメージで提供するか、手動でインストールしてください。Debian パッケージとして提供される依存関係には `OPENCLAW_IMAGE_APT_PACKAGES` を、Python の依存関係には `OPENCLAW_IMAGE_PIP_PACKAGES` を使用してください（ビルド時に `python3 -m pip install --break-system-packages` を実行するため、バージョンを固定し、信頼できるインデックスのみを使用してください）。

Docker が `ResourceExhausted`、`cannot allocate memory` を報告するか、`tsdown` 中に中断する場合は、Docker ビルダーのメモリ上限を増やすか、より小さいヒープを明示的に指定して再試行してください。

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### 選択した Plugin を含むソースビルドイメージ

`OPENCLAW_EXTENSIONS` は、ソースチェックアウトから Plugin マニフェスト ID を選択します。
異なる場合は、既存のソースディレクトリ名も使用できます。Docker
ビルドは選択内容を一度だけソースディレクトリに解決し、本番用の
依存関係をインストールします。また、選択された Plugin が
`openclaw.build.bundledDist: false` として個別に公開されている場合、そのランタイムをルートのバンドル済み
dist にコンパイルします。この Docker 専用のパッケージングによって、Plugin の npm または ClawHub
アーティファクトの契約が変わることはありません。不明、無効、または曖昧な ID はイメージビルドを失敗させます。
既知の依存関係専用またはソース専用 ID は、コンパイル済みルート dist エントリを追加せず、
既存のソースと依存関係のステージングを維持します。統合ビルドエントリを持つ選択済み Plugin は、
正常にコンパイルされる必要があります。選択されていない外部 Plugin の
ソースとランタイム出力は削除されます。

たとえば、次のコマンドは ClickClack、Slack、Microsoft Teams 用に、独立したマルチアーキテクチャのスタンドアロン
FakeCo Gateway イメージをビルドします。ClawRouter は
すでにルートの OpenClaw ランタイムの一部であるため、ClickClack イメージでは
`clickclack` のみを選択します。ブラウザー引数を明示的に空にすることで、デフォルトイメージに
Chromium が含まれないようにします。

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

単一のネイティブローカルビルドには、`--platform linux/arm64 --load` または `--platform linux/amd64 --load` を
使用します。マルチプラットフォーム出力と添付された SBOM/プロベナンスには、
レジストリ、またはアテステーションを保持する別の Buildx 出力が必要です。プッシュ後は
マニフェストを検査し、変更可能なソース SHA タグではなく、不変のダイジェストをデプロイします。

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# デプロイ: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

これらのイメージは、スタンドアロンの OCI ベース Gateway と一般的な Docker ユーザー向けです。
Crabhelm で管理される Gateway はこれらを使用しません。この配布経路では、
OpenClaw npm tarball を含む別の x86_64 アプライアンスアーカイブをビルドし、
Node、アーカイブ、マニフェストのダイジェストを固定します。同じマージ済み OpenClaw ソースから、
そのアプライアンスを個別にビルドしてください。

パッケージ化されたイメージに対してバンドル済み Plugin ソースをテストするには、1 つの Plugin ソースディレクトリを、そのパッケージ化されたソースパス上にマウントします。例: `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。これにより、同じ Plugin ID に対応するコンパイル済み `/app/dist/extensions/synology-chat` バンドルが上書きされます。

### オブザーバビリティ

OpenTelemetry エクスポートは Gateway コンテナから OTLP コレクターへの送信であり、Docker ポートを公開する必要はありません。ローカルでビルドするイメージにバンドル済みエクスポーターを含めるには、次のようにします。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

公式のビルド済みイメージには、すでに `diagnostics-otel` がバンドルされています。削除した場合に限り、`clawhub:@openclaw/diagnostics-otel` を自分でインストールしてください。エクスポートを有効にするには、設定で `diagnostics-otel` Plugin を許可して有効化し、`diagnostics.otel.enabled=true` を設定します（完全な例は [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照）。コレクターの認証ヘッダーは Docker 環境変数ではなく、`diagnostics.otel.headers` を介して指定します。

Prometheus メトリクスは、すでに公開されている Gateway ポートを再利用します。`clawhub:@openclaw/diagnostics-prometheus` をインストールし、`diagnostics-prometheus` Plugin を有効にしてから、次をスクレイプします。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別の公開 `/metrics` ポートや、認証されていないリバースプロキシパスを公開しないでください。[Prometheus メトリクス](/ja-JP/gateway/prometheus) を参照してください。

### ヘルスチェック

コンテナのプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # ライブネス
curl -fsS http://127.0.0.1:18789/readyz     # レディネス
```

イメージ組み込みの `HEALTHCHECK` は `/healthz` に ping します。失敗が繰り返されると、コンテナは `unhealthy` とマークされ、オーケストレーターが再起動または置換できるようになります。

認証済みの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN とループバック

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を設定するため、Docker のポート公開を使用して、ホスト上の `http://127.0.0.1:18789` にアクセスできます。

- `lan`（デフォルト）: ホストのブラウザーとホストの CLI から、公開された Gateway ポートにアクセスできます。
- `loopback`: コンテナのネットワーク名前空間内のプロセスのみが、Gateway に直接アクセスできます。

<Note>
`gateway.bind` では、`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではなく、バインドモード値（`lan` / `loopback` / `custom` / `tailnet` / `auto`）を使用してください。
</Note>

### ホストのローカルプロバイダー

コンテナ内の `127.0.0.1` はホストではなく、コンテナ自体を指します。ホスト上で実行されるプロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL      | Docker セットアップ URL             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

バンドル済みセットアップでは、これらの URL を LM Studio/Ollama のオンボーディング時のデフォルトとして使用します。また、`docker-compose.yml` は Linux Docker Engine 上で `host.docker.internal` をホスト Gateway にマッピングします（Docker Desktop は macOS/Windows で同じエイリアスを提供します）。ホストサービスは、Docker からアクセスできるアドレスで待ち受ける必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` を使用していますか？同じマッピングを自分で追加してください。例: `--add-host=host.docker.internal:host-gateway`。

### Docker での Claude CLI バックエンド

公式イメージには Claude Code はプリインストールされていません。コンテナの `node` ユーザーでインストールしてログインし、そのコンテナホームを永続化して、イメージのアップグレードでバイナリや認証状態が消去されないようにしてください。

新規インストールでは、セットアップを実行する前に永続的な `/home/node` ボリュームを有効にします。

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

既存のインストールでは、まずスタックを停止し、現在の `.env` の値を再読み込みします。セットアップスクリプトは常に現在のシェルとデフォルト値から `.env` を書き換え、ファイル自体を自動では読み込みません。

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env` にシェルで読み込めない値が含まれている場合は、使用する値（`OPENCLAW_IMAGE`、ポート、バインドモード、カスタムパス、`OPENCLAW_EXTRA_MOUNTS`、サンドボックス、オンボーディングのスキップ）を先に手動で再エクスポートしてください。生成されたオーバーレイは、`openclaw-gateway` と `openclaw-cli` の両方にホームボリュームをマウントします。残りのコマンドはそのオーバーレイを使用して実行してください（`docker-compose.override.yml` を使用する場合は、それも先に指定します）。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ネイティブインストーラーは `claude` を `/home/node/.local/bin/claude` に書き込みます。OpenClaw でそのパスを指定します。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

同じ永続化されたホームからログインして確認します。

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

次に、バンドル済みの `claude-cli` バックエンドを使用します。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Docker Claude CLI からこんにちはと言ってください"
```

`OPENCLAW_HOME_VOLUME` は、`/home/node/.local/bin` と `/home/node/.local/share/claude` にあるネイティブインストールに加え、`/home/node/.claude` と `/home/node/.claude.json` にある Claude Code の設定と認証を永続化します。`/home/node/.openclaw` だけを永続化しても不十分です。ホームボリュームの代わりに `OPENCLAW_EXTRA_MOUNTS` を使用する場合は、これらすべての Claude パスを両方のサービスにマウントしてください。

<Note>
共有の本番自動化や予測可能な Anthropic の課金には、Anthropic API キー方式を推奨します。Claude CLI の再利用は、Claude Code のインストール済みバージョン、アカウントログイン、課金、更新動作に従います。
</Note>

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト（`224.0.0.251:5353`）を確実には転送しません。`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、バンドル済み Bonjour Plugin は、コンテナ内で実行されていることを検出すると LAN アドバタイズを自動的に無効化するため、ブリッジが破棄するマルチキャストを再試行し続けてクラッシュループすることはありません。検出結果に関係なく強制的に無効にするには `OPENCLAW_DISABLE_BONJOUR=1` を、強制的に有効にするには `0` を設定します（ホストネットワーク、macvlan、または mDNS マルチキャストが動作すると確認されている別のネットワークでのみ使用してください）。

それ以外の Docker ホストでは、公開された Gateway URL、Tailscale、または広域 DNS-SD を使用してください。注意点とトラブルシューティングについては、[Bonjour 検出](/ja-JP/gateway/bonjour) を参照してください。

### ストレージと永続化

Docker Compose は、`OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に、`OPENCLAW_AUTH_PROFILE_SECRET_DIR` を `/home/node/.config/openclaw` にバインドマウントするため、これらのパスはコンテナを置換しても保持されます。変数が未設定の場合、`docker-compose.yml` は `${HOME}` 配下にフォールバックし、`HOME` 自体がない場合は `/tmp` にフォールバックするため、最低限の環境でも `docker compose up` がソースの空のボリューム指定を出力することはありません。

マウントされた設定ディレクトリには、次のものが格納されます。

- 動作設定用の `openclaw.json`
- 保存されたプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` など、環境変数を介するランタイムシークレット用の `.env`

認証プロファイルのシークレットディレクトリには、OAuth ベースの認証プロファイルのトークン情報に使用するローカル暗号化キーが保存されます。Docker ホストの状態とともに保持しつつ、`OPENCLAW_CONFIG_DIR` とは分けてください。

インストール済みのダウンロード可能な Plugin は、マウントされた OpenClaw ホーム配下にパッケージ状態を保存するため、インストール記録とパッケージルートはコンテナを置換しても保持されます。Gateway の起動時に、バンドル済み Plugin の依存関係ツリーが再生成されることはありません。

VM 全体の永続化の詳細については、[Docker VM ランタイム - 何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where) を参照してください。

**ディスク使用量が増えやすい箇所:** `media/`、エージェントごとの SQLite データベース、従来のセッション JSONL トランスクリプト、共有 SQLite 状態データベース、インストール済み Plugin のパッケージルート、`/tmp/openclaw/` 配下のローテーションファイルログ。

### シェルヘルパー（任意）

日常的なコマンドを短縮するには、[ClawDock](/ja-JP/install/clawdock) をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

以前の `scripts/shell-helpers/clawdock-helpers.sh` パスからインストールした場合は、ローカルヘルパーが現在の場所を参照するように、上記のコマンドを再実行してください。その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使用できます（完全な一覧は `clawdock-help` を実行してください）。

<AccordionGroup>
  <Accordion title="Docker Gateway 用のエージェントサンドボックスを有効化">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    カスタムソケットパス（ルートレス Docker など）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    スクリプトは、サンドボックスの前提条件を満たした後にのみ `docker.sock` をマウントします。サンドボックスのセットアップを完了できない場合は、`agents.defaults.sandbox.mode` を `off` に戻します。OpenClaw サンドボックスが有効なターンでは Codex コードモードが無効になります（[サンドボックス化 § Docker バックエンド](/ja-JP/gateway/sandboxing#docker-backend)を参照）。ホストの Docker ソケットをエージェントサンドボックスコンテナにマウントしないでください。

  </Accordion>

  <Accordion title="自動化 / CI（非対話型）">
    `-T` を使用して Compose の疑似 TTY 割り当てを無効にします：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティに関する注意">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使用するため、CLI コマンドは `127.0.0.1` 経由で Gateway に到達できます。これは共有の信頼境界として扱ってください。Compose 設定では、`openclaw-gateway` と `openclaw-cli` の両方で `NET_RAW`/`NET_ADMIN` を削除し、`no-new-privileges` を有効にしています。
  </Accordion>

  <Accordion title="openclaw-cli での Docker Desktop の DNS 障害">
    一部の Docker Desktop セットアップでは、`NET_RAW` の削除後、共有ネットワークの `openclaw-cli` サイドカーからの DNS ルックアップに失敗し、`openclaw plugins install` のような npm を利用するコマンドで `EAI_AGAIN` が表示されます。通常の運用では、既定の強化済み Compose ファイルを維持してください。以下のオーバーライドは、`openclaw-cli` コンテナに対してのみ既定のケイパビリティを復元します。レジストリアクセスが必要な一度限りのコマンドに使用し、既定の呼び出し方法としては使用しないでください：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    長時間実行する `openclaw-cli` コンテナをすでに作成している場合は、同じオーバーライドを使用して再作成してください。`docker compose exec`/`docker exec` では、作成済みコンテナの Linux ケイパビリティを変更できません。

  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で権限エラーが発生する場合は、ホストのバインドマウントが uid 1000 によって所有されていることを確認してください：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同じ不一致は、`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` に続いて `plugin present but blocked` と表示される場合にも発生します。プロセスの uid と、マウントされた Plugin ディレクトリの所有者が一致していません。既定の uid 1000 で実行し、バインドマウントの所有権を修正することを推奨します。OpenClaw を長期的に root として実行する意図がある場合にのみ、`/path/to/openclaw-config/npm` を `root:root` に chown してください。

  </Accordion>

  <Accordion title="再ビルドの高速化">
    ロックファイルが変更されない限り `pnpm install` が再実行されないよう、依存関係レイヤーがキャッシュされる順序で Dockerfile を構成します：

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

  <Accordion title="上級者向けコンテナオプション">
    既定のイメージはセキュリティを優先し、非 root の `node` として実行されます。より多機能なコンテナにするには：

    1. **`/home/node` を永続化**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係をイメージに組み込む**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python 依存関係をイメージに組み込む**：`export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium をイメージに組み込む**：`export OPENCLAW_INSTALL_BROWSER=1`、または公式の `-browser` イメージタグを使用
    5. **または、Playwright ブラウザーを永続ボリュームにインストール**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **ブラウザーのダウンロードを永続化**：`OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使用します。OpenClaw は Linux 上で、イメージ内の Playwright 管理 Chromium を自動検出します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレス Docker）">
    ウィザードで OpenAI Codex OAuth を選択すると、ブラウザー URL が開きます。Docker またはヘッドレス環境では、遷移先の完全なリダイレクト URL をコピーしてウィザードに貼り付け、認証を完了してください。
  </Accordion>

  <Accordion title="ベースイメージのメタデータ">
    ランタイムイメージは `node:24-bookworm-slim` を使用し、PID 1 として `tini` を実行します。これにより、長時間実行されるコンテナ内でゾンビプロセスが回収され、シグナルが正しく処理されます。`org.opencontainers.image.base.name` や `org.opencontainers.image.source` などの OCI ベースイメージアノテーションを公開します。Dependabot は固定された Node ベースダイジェストを更新します。リリースビルドでは、ディストリビューションをアップグレードする別個のレイヤーは実行されません。[OCI イメージアノテーション](https://github.com/opencontainers/image-spec/blob/main/annotations.md)を参照してください。
  </Accordion>
</AccordionGroup>

### VPS で実行しますか？

バイナリの組み込み、永続化、更新を含む共有 VM へのデプロイ手順については、[Hetzner（Docker VPS）](/ja-JP/install/hetzner)および[Docker VM ランタイム](/ja-JP/install/docker-vm-runtime)を参照してください。

## エージェントサンドボックス

Docker バックエンドで `agents.defaults.sandbox` を有効にすると、Gateway 自体はホスト上に維持したまま、エージェントツールの実行（シェル、ファイルの読み書きなど）が隔離された Docker コンテナ内で行われます。Gateway 全体をコンテナ化せずに、信頼できない、またはマルチテナントのエージェントセッションを強固に隔離できます。

サンドボックスのスコープは、エージェント単位（既定）、セッション単位、または共有に設定できます。各スコープには、`/workspace` にマウントされた独自のワークスペースが割り当てられます。ツールの許可/拒否ポリシー、ネットワーク分離、リソース制限、ブラウザーコンテナも設定できます。

完全な設定、イメージ、セキュリティ上の注意、マルチエージェントプロファイルについては、以下を参照してください：

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- サンドボックスの完全なリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナへの対話型シェルアクセス
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

既定のサンドボックスイメージをビルドします（ソースチェックアウトから）：

```bash
scripts/sandbox-setup.sh
```

ソースチェックアウトなしで npm インストールを使用する場合は、インラインの `docker build` コマンドについて[サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージが見つからない、またはサンドボックスコンテナが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（ソースチェックアウト）または[サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)のインライン `docker build` コマンド（npm インストール）を使用してサンドボックスイメージをビルドするか、`agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。コンテナは必要に応じてセッション単位で自動作成されます。
  </Accordion>

  <Accordion title="サンドボックス内の権限エラー">
    `docker.user` を、マウントしたワークスペースの所有権に一致する UID:GID に設定するか、ワークスペースフォルダーを chown してください。
  </Accordion>

  <Accordion title="サンドボックス内でカスタムツールが見つからない">
    OpenClaw は `sh -lc`（ログインシェル）でコマンドを実行します。これにより `/etc/profile` が読み込まれ、PATH がリセットされる場合があります。`docker.env.PATH` を設定してカスタムツールのパスを先頭に追加するか、Dockerfile で `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージのビルド中に OOM kill される（終了コード 137）">
    VM には少なくとも 2 GB の RAM が必要です。より大きなマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で未認証またはペアリングが必要と表示される">
    新しいダッシュボードリンクを取得し、ブラウザーデバイスを承認します：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細：[ダッシュボード](/ja-JP/web/dashboard)、[デバイス](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway のターゲットに ws://172.x.x.x が表示される、または Docker CLI でペアリングエラーが発生する">
    Gateway のモードとバインドをリセットします：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連項目

- [インストールの概要](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替となる Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose のコミュニティセットアップ
- [更新](/ja-JP/install/updating) — OpenClaw を最新の状態に維持する方法
- [設定](/ja-JP/gateway/configuration) — インストール後の Gateway 設定

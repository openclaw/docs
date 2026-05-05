---
read_when:
    - ローカルインストールではなく、コンテナ化された Gateway を使いたい場合
    - Docker フローを検証しています
summary: OpenClaw の任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:26:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。コンテナ化された Gateway が必要な場合、または Docker フローを検証する場合にのみ使用してください。

## Docker は自分に適していますか？

- **はい**: 分離された使い捨ての Gateway 環境が必要な場合、またはローカルインストールなしのホストで OpenClaw を実行したい場合。
- **いいえ**: 自分のマシンで実行していて、最速の開発ループだけが必要な場合。代わりに通常のインストールフローを使用してください。
- **サンドボックス化に関する注意**: デフォルトのサンドボックスバックエンドは、サンドボックス化が有効な場合に Docker を使用しますが、サンドボックス化はデフォルトではオフであり、Gateway 全体を Docker で実行する必要は**ありません**。SSH と OpenShell のサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも 2 GB RAM（1 GB のホストでは `pnpm install` が OOM により終了コード 137 で kill される場合があります）
- イメージとログ用の十分なディスク容量
- VPS/公開ホストで実行する場合は、特に Docker の `DOCKER-USER` ファイアウォールポリシーについて、[ネットワーク公開のためのセキュリティ強化](/ja-JP/gateway/security)を確認してください。

## コンテナ化された Gateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより、Gateway イメージがローカルでビルドされます。代わりに事前ビルド済みイメージを使用するには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    事前ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    で公開されています。一般的なタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動的に実行します。次を行います。

    - プロバイダー API キーの入力を求める
    - Gateway トークンを生成して `.env` に書き込む
    - Docker Compose 経由で Gateway を起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接通じて実行されます。`openclaw-cli` は、Gateway
    コンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、設定済みの共有シークレットを
    Settings に貼り付けます。セットアップスクリプトはデフォルトで `.env` にトークンを書き込みます。コンテナ設定をパスワード認証に切り替えた場合は、代わりにそのパスワードを使用してください。

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

セットアップスクリプトを使用せず、各手順を自分で実行したい場合:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` はリポジトリルートから実行してください。`OPENCLAW_EXTRA_MOUNTS`
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは
`docker-compose.extra.yml` を書き込みます。`-f docker-compose.yml -f docker-compose.extra.yml`
で含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、起動後のツールです。
`docker compose up -d openclaw-gateway` の前には、オンボーディングとセットアップ時の設定書き込みを
`--no-deps --entrypoint node` を付けて `openclaw-gateway` 経由で実行してください。
</Note>

### 環境変数

セットアップスクリプトは、次の任意の環境変数を受け付けます。

| 変数                                       | 目的                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ローカルでビルドする代わりにリモートイメージを使用する          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ビルド中に追加の apt パッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS`                      | ビルド時に選択したバンドル済み Plugin ヘルパーを含める          |
| `OPENCLAW_EXTRA_MOUNTS`                    | 追加のホストバインドマウント（カンマ区切りの `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` を名前付き Docker ボリュームに永続化する           |
| `OPENCLAW_SANDBOX`                         | サンドボックスのブートストラップにオプトインする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_SKIP_ONBOARDING`                 | 対話型オンボーディング手順をスキップする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker ソケットパスを上書きする                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS アドバタイズを無効にする（Docker ではデフォルトで `1`） |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | バンドル済み Plugin ソースのバインドマウントオーバーレイを無効にする |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry エクスポート用の共有 OTLP/HTTP コレクターエンドポイント |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | トレース、メトリクス、またはログ用のシグナル別 OTLP エンドポイント |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP プロトコルの上書き。現在は `http/protobuf` のみサポートされています |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry リソースに使用されるサービス名                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 最新の実験的な GenAI セマンティック属性にオプトインする         |
| `OPENCLAW_OTEL_PRELOADED`                  | すでに事前ロードされている場合、2 つ目の OpenTelemetry SDK の起動をスキップする |

メンテナーは、1 つの Plugin ソースディレクトリをパッケージ済みソースパスにマウントすることで、パッケージ済みイメージに対してバンドル済み Plugin ソースをテストできます。例:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
そのマウントされたソースディレクトリは、同じ Plugin ID に対して対応するコンパイル済み
`/app/dist/extensions/synology-chat` バンドルを上書きします。

### 可観測性

OpenTelemetry エクスポートは、Gateway コンテナから OTLP コレクターへのアウトバウンド通信です。
公開済み Docker ポートは不要です。イメージをローカルでビルドし、バンドル済み OpenTelemetry
エクスポーターをイメージ内で利用可能にしたい場合は、そのランタイム依存関係を含めてください。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

エクスポートを有効にする前に、パッケージ済み Docker インストールでは ClawHub から公式
`@openclaw/diagnostics-otel` Plugin をインストールしてください。カスタムのソースビルドイメージでは、
引き続き `OPENCLAW_EXTENSIONS=diagnostics-otel` でローカル Plugin ソースを含めることができます。
エクスポートを有効にするには、設定で `diagnostics-otel` Plugin を許可して有効化し、
`diagnostics.otel.enabled=true` を設定するか、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
の設定例を使用してください。コレクター認証ヘッダーは Docker 環境変数ではなく、
`diagnostics.otel.headers` で設定します。

Prometheus メトリクスは、すでに公開済みの Gateway ポートを使用します。
`clawhub:@openclaw/diagnostics-prometheus` をインストールし、`diagnostics-prometheus`
Plugin を有効化してから、次をスクレイプします。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別の公開 `/metrics` ポートや未認証のリバースプロキシパスを公開しないでください。[Prometheus メトリクス](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには、`/healthz` に ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` とマークし、オーケストレーションシステムが再起動または置き換えを行えるようになります。

認証済みの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN とループバック

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を設定するため、
Docker ポート公開によりホストから `http://127.0.0.1:18789` へアクセスできます。

- `lan`（デフォルト）: ホストブラウザーとホスト CLI が公開済み Gateway ポートに到達できます。
- `loopback`: コンテナネットワーク名前空間内のプロセスだけが Gateway に直接到達できます。

<Note>
`gateway.bind` には、`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではなく、バインドモード値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使用してください。
</Note>

### ホストローカルプロバイダー

OpenClaw を Docker で実行する場合、コンテナ内の `127.0.0.1` はホストマシンではなくコンテナ自身です。ホスト上で実行される AI プロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL | Docker セットアップ URL              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

バンドル済み Docker セットアップでは、LM Studio と Ollama のオンボーディングデフォルトとしてこれらのホスト URL を使用し、`docker-compose.yml` は Linux Docker Engine 向けに `host.docker.internal` を Docker のホストゲートウェイへマップします。Docker Desktop は macOS と Windows で同じホスト名をすでに提供しています。

ホストサービスも Docker から到達可能なアドレスでリッスンする必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` コマンドを使用する場合は、同じホストマッピングを自分で追加してください。例:
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト（`224.0.0.251:5353`）を確実には転送しません。そのため、バンドル済み Compose セットアップではデフォルトで `OPENCLAW_DISABLE_BONJOUR=1` を設定し、ブリッジがマルチキャストトラフィックを落とした際に Gateway がクラッシュループしたり、アドバタイズを繰り返し再開したりしないようにしています。

Docker ホストには、公開済み Gateway URL、Tailscale、または広域 DNS-SD を使用してください。
`OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが動作することが分かっている別のネットワークで実行している場合にのみ設定してください。

注意点とトラブルシューティングについては、[Bonjour ディスカバリー](/ja-JP/gateway/bonjour)を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、`OPENCLAW_WORKSPACE_DIR` を
`/home/node/.openclaw/workspace` にバインドマウントするため、これらのパスはコンテナを置き換えても残ります。どちらかの変数が未設定の場合、バンドル済みの `docker-compose.yml` は `${HOME}/.openclaw`（ワークスペースマウントでは `${HOME}/.openclaw/workspace`）にフォールバックし、`HOME` 自体もない場合は `/tmp/.openclaw` にフォールバックします。これにより、素の環境で `docker compose up` が空のソースボリューム仕様を出力しないようにします。

そのマウントされた設定ディレクトリには、OpenClaw が次を保持します。

- 動作設定用の `openclaw.json`
- 保存済みプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` などの環境変数ベースのランタイムシークレット用の `.env`

インストール済みのダウンロード可能な Plugin は、マウントされた OpenClaw ホーム配下にパッケージ状態を保存するため、Plugin インストール記録とパッケージルートはコンテナを置き換えても残ります。Gateway 起動時にバンドル済み Plugin の依存関係ツリーは生成されません。

VM デプロイでの永続化の詳細については、[Docker VM ランタイム - 何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

**ディスク増加のホットスポット:** `media/`、セッションのJSONLファイル、`cron/runs/*.jsonl`、インストール済みPluginパッケージルート、`/tmp/openclaw/` 配下のローテーションファイルログを監視してください。

### シェルヘルパー（任意）

日常的なDocker管理を簡単にするには、`ClawDock` をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` のrawパスからClawDockをインストールしていた場合は、上のインストールコマンドを再実行し、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使います。すべてのコマンドは `clawdock-help` を実行して確認してください。
完全なヘルパーガイドは [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker gatewayのエージェントサンドボックスを有効化">
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

    このスクリプトは、サンドボックスの前提条件が満たされた後にのみ `docker.sock` をマウントします。サンドボックスのセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode` を `off` にリセットします。

  </Accordion>

  <Accordion title="自動化 / CI（非対話）">
    `-T` でComposeの疑似TTY割り当てを無効化します。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティメモ">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使用するため、CLIコマンドは `127.0.0.1` 経由でGatewayに到達できます。これは共有の信頼境界として扱ってください。compose設定は `NET_RAW`/`NET_ADMIN` を削除し、`openclaw-gateway` と `openclaw-cli` の両方で `no-new-privileges` を有効化します。
  </Accordion>

  <Accordion title="権限とEACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で権限エラーが表示される場合は、ホストのバインドマウントがuid 1000に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="再ビルドの高速化">
    依存関係レイヤーがキャッシュされるようにDockerfileを並べます。これにより、ロックファイルが変更されない限り `pnpm install` の再実行を避けられます。

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

  <Accordion title="上級ユーザー向けコンテナオプション">
    デフォルトのイメージはセキュリティ重視で、非rootの `node` として実行されます。より機能が充実したコンテナにするには:

    1. **`/home/node` を永続化**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込み**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwrightブラウザーをインストール**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **ブラウザーのダウンロードを永続化**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定し、`OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使います。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレスDocker）">
    ウィザードでOpenAI Codex OAuthを選ぶと、ブラウザーURLが開きます。Dockerまたはヘッドレス環境では、到達した完全なリダイレクトURLをコピーし、認証を完了するためにウィザードへ貼り戻してください。
  </Accordion>

  <Accordion title="ベースイメージのメタデータ">
    メインのDockerランタイムイメージは `node:24-bookworm-slim` を使用し、`org.opencontainers.image.base.name`、`org.opencontainers.image.source` などを含むOCIベースイメージアノテーションを公開します。NodeのベースダイジェストはDependabotのDockerベースイメージPRを通じて更新されます。リリースビルドではディストロアップグレードレイヤーを実行しません。[OCIイメージアノテーション](https://github.com/opencontainers/image-spec/blob/main/annotations.md)を参照してください。
  </Accordion>
</AccordionGroup>

### VPSで実行しますか？

バイナリの焼き込み、永続化、更新を含む共有VMデプロイ手順については、[Hetzner（Docker VPS）](/ja-JP/install/hetzner) と [Docker VMランタイム](/ja-JP/install/docker-vm-runtime) を参照してください。

## エージェントサンドボックス

Dockerバックエンドで `agents.defaults.sandbox` が有効な場合、Gatewayはエージェントのツール実行（シェル、ファイルの読み取り/書き込みなど）を分離されたDockerコンテナ内で実行し、Gateway自体はホスト上に残ります。これにより、Gateway全体をコンテナ化せずに、信頼できない、またはマルチテナントのエージェントセッションを囲む強固な壁を作れます。

サンドボックスのスコープはエージェント単位（デフォルト）、セッション単位、または共有にできます。各スコープには `/workspace` にマウントされた専用ワークスペースがあります。許可/拒否ツールポリシー、ネットワーク分離、リソース制限、ブラウザーコンテナも構成できます。

完全な構成、イメージ、セキュリティメモ、マルチエージェントプロファイルについては、以下を参照してください。

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナへの対話型シェルアクセス
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位の上書き

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

デフォルトのサンドボックスイメージをビルドします（ソースチェックアウトから）。

```bash
scripts/sandbox-setup.sh
```

ソースチェックアウトなしのnpmインストールでは、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージがない、またはサンドボックスコンテナが起動しない">
    サンドボックスイメージを [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（ソースチェックアウト）または [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) のインライン `docker build` コマンド（npmインストール）でビルドするか、`agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。コンテナは必要に応じてセッション単位で自動作成されます。
  </Accordion>

  <Accordion title="サンドボックス内の権限エラー">
    マウントされたワークスペースの所有権に一致するUID:GIDを `docker.user` に設定するか、ワークスペースフォルダーをchownしてください。
  </Accordion>

  <Accordion title="サンドボックス内でカスタムツールが見つからない">
    OpenClawは `sh -lc`（ログインシェル）でコマンドを実行します。これは `/etc/profile` を読み込み、PATHをリセットする場合があります。カスタムツールのパスを前置するように `docker.env.PATH` を設定するか、Dockerfile内で `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中にOOMでkillされた（exit 137）">
    VMには少なくとも2 GBのRAMが必要です。より大きいマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UIで未認可またはペアリングが必要">
    新しいダッシュボードリンクを取得し、ブラウザーデバイスを承認します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [ダッシュボード](/ja-JP/web/dashboard)、[デバイス](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gatewayターゲットがws://172.x.x.xを表示する、またはDocker CLIからペアリングエラーが出る">
    Gatewayモードとバインドをリセットします。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [インストール概要](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Dockerに代わるPodman
- [ClawDock](/ja-JP/install/clawdock) — Docker Composeのコミュニティセットアップ
- [更新](/ja-JP/install/updating) — OpenClawを最新に保つ
- [構成](/ja-JP/gateway/configuration) — インストール後のGateway構成

---
read_when:
    - ローカルインストールではなくコンテナ化された Gateway を使用したい
    - Docker フローを検証しています
summary: OpenClaw 向けの任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-05-06T05:09:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。コンテナ化された Gateway が必要な場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に適していますか？

- **はい**: 分離された使い捨ての Gateway 環境が必要な場合、またはローカルインストールなしのホストで OpenClaw を実行したい場合。
- **いいえ**: 自分のマシンで実行していて、最速の開発ループだけが必要な場合。代わりに通常のインストールフローを使用してください。
- **サンドボックス化の注記**: デフォルトのサンドボックスバックエンドは、サンドボックス化が有効な場合に Docker を使用しますが、サンドボックス化はデフォルトでオフであり、Gateway 全体を Docker で実行する必要は**ありません**。SSH と OpenShell のサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも 2 GB の RAM（1 GB のホストでは `pnpm install` が OOM により終了 137 で強制終了される場合があります）
- イメージとログに十分なディスク容量
- VPS/公開ホストで実行する場合は、特に Docker の `DOCKER-USER` ファイアウォールポリシーについて、
  [ネットワーク公開のためのセキュリティ強化](/ja-JP/gateway/security)を確認してください。

## コンテナ化された Gateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより Gateway イメージがローカルでビルドされます。代わりに事前ビルド済みイメージを使用するには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    事前ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    で公開されています。一般的なタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動的に実行します。次の処理を行います。

    - プロバイダー API キーの入力を求める
    - Gateway トークンを生成して `.env` に書き込む
    - Docker Compose 経由で Gateway を起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接通して実行されます。`openclaw-cli` は、
    Gateway コンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、設定済みの
    共有シークレットを設定に貼り付けます。セットアップスクリプトはデフォルトでトークンを `.env` に書き込みます。
    コンテナ設定をパスワード認証に切り替えた場合は、代わりにその
    パスワードを使用してください。

    URL がもう一度必要ですか？

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

セットアップスクリプトを使用せずに各手順を自分で実行したい場合:

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
または `OPENCLAW_HOME_VOLUME` を有効にしている場合、セットアップスクリプトは `docker-compose.extra.yml` を書き込みます。
`-f docker-compose.yml -f docker-compose.extra.yml` を付けて含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、
起動後ツールです。`docker compose up -d openclaw-gateway` の前に、オンボーディング
とセットアップ時の設定書き込みを、`--no-deps --entrypoint node` を付けた
`openclaw-gateway` 経由で実行してください。
</Note>

### 環境変数

セットアップスクリプトは次の任意の環境変数を受け付けます。

| 変数                                       | 目的                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ローカルでビルドする代わりにリモートイメージを使用する          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ビルド中に追加の apt パッケージをインストールする（空白区切り） |
| `OPENCLAW_EXTENSIONS`                      | ビルド時に選択したバンドル済みPluginヘルパーを含める            |
| `OPENCLAW_EXTRA_MOUNTS`                    | 追加のホストバインドマウント（カンマ区切りの `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME`                     | 名前付き Docker ボリュームに `/home/node` を永続化する          |
| `OPENCLAW_SANDBOX`                         | サンドボックスのブートストラップにオプトインする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_SKIP_ONBOARDING`                 | 対話型オンボーディング手順をスキップする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker ソケットパスを上書きする                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS アドバタイズを無効にする（Docker ではデフォルトで `1`） |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | バンドル済みPluginソースのバインドマウントオーバーレイを無効にする |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry エクスポート用の共有 OTLP/HTTP コレクターエンドポイント |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | トレース、メトリクス、ログ用のシグナル別 OTLP エンドポイント    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP プロトコルの上書き。現在サポートされているのは `http/protobuf` のみ |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry リソースに使用されるサービス名                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 最新の実験的 GenAI セマンティック属性にオプトインする           |
| `OPENCLAW_OTEL_PRELOADED`                  | すでにプリロード済みの場合、2 つ目の OpenTelemetry SDK の起動をスキップする |

メンテナーは、1 つのPluginソースディレクトリをパッケージ化されたソースパスの上にマウントすることで、
パッケージ化されたイメージに対してバンドル済みPluginソースをテストできます。例:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
そのマウントされたソースディレクトリは、同じPlugin ID に対応するコンパイル済みの
`/app/dist/extensions/synology-chat` バンドルを上書きします。

### 可観測性

OpenTelemetry エクスポートは、Gateway コンテナから OTLP
コレクターへのアウトバウンド通信です。公開済み Docker ポートは必要ありません。イメージを
ローカルでビルドし、バンドル済み OpenTelemetry エクスポーターをイメージ内で利用可能にしたい場合は、
そのランタイム依存関係を含めます。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

エクスポートを有効にする前に、パッケージ化された Docker インストールでは、
ClawHub から公式の `@openclaw/diagnostics-otel` Pluginをインストールしてください。
カスタムのソースビルドイメージでも、`OPENCLAW_EXTENSIONS=diagnostics-otel`
でローカルPluginソースを含めることができます。エクスポートを有効にするには、設定で
`diagnostics-otel` Pluginを許可して有効化し、
`diagnostics.otel.enabled=true` を設定するか、[OpenTelemetry
エクスポート](/ja-JP/gateway/opentelemetry)の設定例を使用してください。コレクター認証ヘッダーは
Docker 環境変数ではなく、`diagnostics.otel.headers` で設定します。

Prometheus メトリクスは、すでに公開されている Gateway ポートを使用します。
`clawhub:@openclaw/diagnostics-prometheus` をインストールし、
`diagnostics-prometheus` Pluginを有効にしてから、次をスクレイプします。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別の公開
`/metrics` ポートや、認証されていないリバースプロキシパスを公開しないでください。
[Prometheus メトリクス](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには、`/healthz` に ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` としてマークし、
オーケストレーションシステムが再起動または置換できるようになります。

認証付きの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN とループバック

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` に設定するため、
Docker ポート公開で `http://127.0.0.1:18789` へのホストアクセスが機能します。

- `lan`（デフォルト）: ホストブラウザーとホスト CLI が公開された Gateway ポートに到達できます。
- `loopback`: コンテナネットワーク名前空間内のプロセスだけが
  Gateway に直接到達できます。

<Note>
`gateway.bind` では、`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではなく、
バインドモード値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使用してください。
</Note>

### ホストローカルプロバイダー

OpenClaw が Docker 内で実行される場合、コンテナ内の `127.0.0.1` は
ホストマシンではなくコンテナ自体です。ホスト上で実行される AI プロバイダーには
`host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL  | Docker セットアップ URL             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

バンドル済み Docker セットアップは、これらのホスト URL を LM Studio と Ollama の
オンボーディングデフォルトとして使用し、`docker-compose.yml` は Linux Docker Engine 用に
`host.docker.internal` を Docker のホストゲートウェイにマップします。Docker Desktop は
macOS と Windows で同じホスト名をすでに提供しています。

ホストサービスは、Docker から到達可能なアドレスでも待ち受ける必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` コマンドを使用する場合は、
たとえば `--add-host=host.docker.internal:host-gateway` のように、
同じホストマッピングを自分で追加してください。

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト
（`224.0.0.251:5353`）を安定して転送しません。そのため、バンドル済み Compose セットアップでは
デフォルトで `OPENCLAW_DISABLE_BONJOUR=1` に設定され、ブリッジがマルチキャストトラフィックを落としたときに
Gateway がクラッシュループしたり、アドバタイズを繰り返し再起動したりしないようにしています。

Docker ホストには、公開された Gateway URL、Tailscale、または広域 DNS-SD を使用してください。
`OPENCLAW_DISABLE_BONJOUR=0` を設定するのは、ホストネットワーク、macvlan、
または mDNS マルチキャストが機能することが分かっている別のネットワークで実行する場合だけです。

注意点とトラブルシューティングについては、[Bonjour 検出](/ja-JP/gateway/bonjour)を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` にバインドマウントするため、
これらのパスはコンテナ置換後も残ります。どちらかの変数が未設定の場合、バンドル済みの
`docker-compose.yml` は `${HOME}/.openclaw`（ワークスペースマウントには
`${HOME}/.openclaw/workspace`）にフォールバックし、`HOME` 自体もない場合は
`/tmp/.openclaw` にフォールバックします。これにより、最小環境で `docker compose up` が
ソースが空のボリューム仕様を出力するのを防ぎます。

そのマウントされた設定ディレクトリに OpenClaw が保持するもの:

- 動作設定用の `openclaw.json`
- 保存されたプロバイダーの OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` など、環境変数由来のランタイムシークレット用の `.env`

インストール済みのダウンロード可能なPluginは、マウントされた
OpenClaw ホーム配下にパッケージ状態を保存するため、Pluginインストール記録とパッケージルートは
コンテナ置換後も残ります。Gateway 起動時に、バンドル済みPluginの依存関係ツリーは生成されません。

VM デプロイでの完全な永続化の詳細については、
[Docker VM ランタイム - 何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

**ディスク増加のホットスポット:** `/tmp/openclaw/` 配下の `media/`、セッション JSONL ファイル、
`cron/runs/*.jsonl`、インストール済み Plugin パッケージルート、ローテーションされるファイルログを監視します。

### シェルヘルパー (任意)

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` raw パスから ClawDock をインストールしていた場合は、上のインストールコマンドを再実行して、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使用します。すべてのコマンドについては
`clawdock-help` を実行してください。
完全なヘルパーガイドは [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker Gateway の agent sandbox を有効化">
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

    スクリプトは、sandbox の前提条件を満たした後にのみ `docker.sock` をマウントします。sandbox のセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` にリセットします。

  </Accordion>

  <Accordion title="自動化 / CI (非対話)">
    `-T` で Compose の疑似 TTY 割り当てを無効にします。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティに関する注意">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使用するため、CLI
    コマンドは `127.0.0.1` 経由で Gateway に到達できます。これは共有の信頼境界として扱ってください。compose 設定は `NET_RAW`/`NET_ADMIN` を削除し、
    `openclaw-gateway` と `openclaw-cli` の両方で
    `no-new-privileges` を有効にします。
  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node` (uid 1000) として実行されます。
    `/home/node/.openclaw` で権限エラーが表示される場合は、ホストの bind mount が uid 1000 に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同じ不一致は、
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    に続いて `plugin present but blocked` のような Plugin 警告として表示されることがあります。これは、プロセス uid と
    マウントされた Plugin ディレクトリの所有者が一致していないことを意味します。コンテナはデフォルトの uid 1000 で実行し、bind mount の所有権を修正することを推奨します。長期的に OpenClaw を root として意図的に実行する場合にのみ、
    `/path/to/openclaw-config/npm` を `root:root` に chown してください。

  </Accordion>

  <Accordion title="より高速なリビルド">
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

  <Accordion title="上級者向けコンテナオプション">
    デフォルトのイメージはセキュリティ優先で、非 root の `node` として実行されます。より
    機能の多いコンテナにするには:

    1. **`/home/node` を永続化**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込み**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright ブラウザをインストール**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **ブラウザのダウンロードを永続化**: 
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定し、
       `OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使用します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (ヘッドレス Docker)">
    ウィザードで OpenAI Codex OAuth を選ぶと、ブラウザ URL が開きます。
    Docker またはヘッドレス環境では、到達した完全なリダイレクト URL をコピーし、
    ウィザードに貼り戻して認証を完了してください。
  </Accordion>

  <Accordion title="ベースイメージのメタデータ">
    メインの Docker ランタイムイメージは `node:24-bookworm-slim` を使用し、
    `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` などを含む OCI
    ベースイメージアノテーションを公開します。Node ベース digest は
    Dependabot の Docker ベースイメージ PR を通じて更新されます。リリースビルドは
    distro upgrade レイヤーを実行しません。参照:
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### VPS で実行しますか？

バイナリの焼き込み、永続化、更新を含む共有 VM デプロイ手順については、[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## Agent sandbox

Docker バックエンドで `agents.defaults.sandbox` を有効にすると、Gateway
自体はホスト上に残したまま、Gateway は agent tool 実行 (shell、ファイル読み書きなど) を分離された Docker
コンテナ内で実行します。これにより、Gateway 全体をコンテナ化せずに、信頼できない agent セッションやマルチテナントの agent セッションの周囲に堅い壁を設けられます。

sandbox のスコープは、agent ごと (デフォルト)、セッションごと、または共有にできます。各スコープには
`/workspace` にマウントされる専用のワークスペースがあります。allow/deny tool ポリシー、ネットワーク分離、リソース制限、ブラウザ
コンテナも設定できます。

完全な設定、イメージ、セキュリティメモ、マルチエージェントプロファイルについては、次を参照してください。

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全な sandbox リファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- sandbox コンテナへの対話型 shell アクセス
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agent ごとの上書き

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

デフォルトの sandbox イメージをビルドします (ソース checkout から):

```bash
scripts/sandbox-setup.sh
```

ソース checkout のない npm インストールでは、インラインの `docker build` コマンドについて [Sandboxing § Images and setup](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージが見つからない、または sandbox コンテナが起動しない">
    sandbox イメージを
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (ソース checkout) または [Sandboxing § Images and setup](/ja-JP/gateway/sandboxing#images-and-setup) のインライン `docker build` コマンド (npm install) でビルドするか、
    `agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。
    コンテナは必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="sandbox での権限エラー">
    `docker.user` を、マウントしたワークスペースの所有権に一致する UID:GID に設定するか、
    ワークスペースフォルダーを chown してください。
  </Accordion>

  <Accordion title="カスタムツールが sandbox 内で見つからない">
    OpenClaw は `/etc/profile` を読み込み、PATH をリセットすることがある `sh -lc` (login shell) でコマンドを実行します。
    カスタムツールのパスを先頭に追加するように `docker.env.PATH` を設定するか、Dockerfile 内で `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM-killed された (exit 137)">
    VM には少なくとも 2 GB RAM が必要です。より大きいマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で Unauthorized または pairing required が表示される">
    新しい dashboard link を取得し、ブラウザデバイスを承認します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [Dashboard](/ja-JP/web/dashboard)、[Devices](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target に ws://172.x.x.x が表示される、または Docker CLI から pairing エラーが出る">
    Gateway mode と bind をリセットします。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替としての Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose コミュニティセットアップ
- [Updating](/ja-JP/install/updating) — OpenClaw を最新に保つ
- [Configuration](/ja-JP/gateway/configuration) — インストール後の Gateway 設定

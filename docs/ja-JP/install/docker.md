---
read_when:
    - ローカルインストールではなくコンテナ化された Gateway を使いたい場合
    - Docker フローを検証しています
summary: OpenClaw の任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。コンテナ化された Gateway を使いたい場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に適していますか？

- **はい**: 分離された使い捨ての Gateway 環境が必要な場合、またはローカルインストールなしのホストで OpenClaw を実行したい場合。
- **いいえ**: 自分のマシンで実行していて、最速の開発ループだけが必要な場合。代わりに通常のインストールフローを使用してください。
- **サンドボックス化の注記**: サンドボックス化が有効な場合、デフォルトのサンドボックスバックエンドは Docker を使用しますが、サンドボックス化はデフォルトでオフであり、Gateway 全体を Docker で実行する必要は**ありません**。SSH と OpenShell のサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも 2 GB の RAM（1 GB ホストでは `pnpm install` が OOM により強制終了され、終了コード 137 になる場合があります）
- イメージとログ用の十分なディスク容量
- VPS/公開ホストで実行する場合は、
  [ネットワーク公開のためのセキュリティ強化](/ja-JP/gateway/security)、
  特に Docker の `DOCKER-USER` ファイアウォールポリシーを確認してください。

## コンテナ化された Gateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートからセットアップスクリプトを実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより Gateway イメージがローカルでビルドされます。代わりにビルド済みイメージを使用するには、次を実行します。

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    で公開されています。
    一般的なタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動的に実行します。実行内容は次のとおりです。

    - プロバイダー API キーの入力を求める
    - Gateway トークンを生成して `.env` に書き込む
    - auth-profile シークレットキー ディレクトリを作成する
    - Docker Compose 経由で Gateway を起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接介して実行されます。`openclaw-cli` は、
    Gateway コンテナがすでに存在した後で実行するコマンド用です。

  </Step>

  <Step title="コントロール UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、構成済みの
    共有シークレットを「設定」に貼り付けます。セットアップスクリプトは
    デフォルトでトークンを `.env` に書き込みます。コンテナ設定を
    パスワード認証に切り替える場合は、代わりにそのパスワードを使用してください。

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

セットアップスクリプトを使わずに各手順を自分で実行したい場合は、次を実行します。

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
を使って含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、
起動後に使うツールです。`docker compose up -d openclaw-gateway` の前に、
オンボーディングとセットアップ時の設定書き込みは
`--no-deps --entrypoint node` を指定して `openclaw-gateway` 経由で実行してください。
</Note>

### 環境変数

セットアップスクリプトは、次の任意の環境変数を受け付けます。

| 変数                                       | 目的                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ローカルでビルドする代わりにリモートイメージを使用する          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ビルド時に追加の apt パッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS`                      | ビルド時に選択した同梱 plugin ヘルパーを含める                  |
| `OPENCLAW_EXTRA_MOUNTS`                    | 追加のホストバインドマウント（カンマ区切り `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME`                     | 名前付き Docker ボリュームに `/home/node` を永続化する          |
| `OPENCLAW_SANDBOX`                         | サンドボックスのブートストラップを有効にする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_SKIP_ONBOARDING`                 | 対話式オンボーディング手順をスキップする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker ソケットパスを上書きする                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS アドバタイズを無効化する（Docker ではデフォルトで `1`） |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 同梱 plugin ソースのバインドマウントオーバーレイを無効化する    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry エクスポート用の共有 OTLP/HTTP コレクターエンドポイント |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | トレース、メトリクス、ログ向けのシグナル固有の OTLP エンドポイント |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP プロトコルの上書き。現時点では `http/protobuf` のみサポート |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry リソースに使用されるサービス名                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 最新の実験的な GenAI セマンティック属性を有効にする             |
| `OPENCLAW_OTEL_PRELOADED`                  | OpenTelemetry SDK がすでにプリロードされている場合、2 つ目の起動をスキップする |

メンテナーは、1 つの plugin ソースディレクトリをパッケージ済みソースパスに重ねてマウントすることで、
パッケージ済みイメージに対して同梱 plugin ソースをテストできます。例:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
そのマウントされたソースディレクトリは、同じ plugin ID の一致するコンパイル済み
`/app/dist/extensions/synology-chat` バンドルを上書きします。

### 可観測性

OpenTelemetry エクスポートは Gateway コンテナから OTLP コレクターへのアウトバウンドです。
公開済み Docker ポートは必要ありません。イメージをローカルでビルドし、同梱の OpenTelemetry
エクスポーターをイメージ内で利用できるようにしたい場合は、そのランタイム依存関係を含めてください。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

エクスポートを有効にする前に、パッケージ版 Docker インストールでは ClawHub から公式の
`@openclaw/diagnostics-otel` plugin をインストールしてください。カスタムのソースビルドイメージでも、
`OPENCLAW_EXTENSIONS=diagnostics-otel` を使ってローカル plugin ソースを含められます。
エクスポートを有効にするには、config で `diagnostics-otel` plugin を許可して有効化し、
`diagnostics.otel.enabled=true` を設定するか、[OpenTelemetry
エクスポート](/ja-JP/gateway/opentelemetry)の設定例を使用してください。コレクター認証ヘッダーは
Docker 環境変数ではなく、`diagnostics.otel.headers` で構成します。

Prometheus メトリクスは、すでに公開されている Gateway ポートを使用します。
`clawhub:@openclaw/diagnostics-prometheus` をインストールし、
`diagnostics-prometheus` plugin を有効化してから、次をスクレイプしてください。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別の公開 `/metrics` ポートや、認証なしの
リバースプロキシパスを公開しないでください。[Prometheus メトリクス](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナのプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには `/healthz` に ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` としてマークし、
オーケストレーションシステムが再起動または置き換えを行えます。

認証付きの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN とループバック

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を使用するため、
Docker のポート公開でホストから `http://127.0.0.1:18789` へのアクセスが機能します。

- `lan`（デフォルト）: ホストのブラウザーとホスト CLI から公開済み Gateway ポートに到達できます。
- `loopback`: コンテナネットワーク名前空間内のプロセスのみが Gateway に直接到達できます。

<Note>
`gateway.bind` では bind mode 値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使用してください。`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではありません。
</Note>

### ホストのローカルプロバイダー

OpenClaw を Docker で実行する場合、コンテナ内の `127.0.0.1` はホストマシンではなく
コンテナ自体です。ホスト上で動作する AI プロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL | Docker セットアップ URL              |
| ------------ | ---------------------- | ------------------------------------ |
| LM Studio    | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama       | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

同梱 Docker セットアップは、これらのホスト URL を LM Studio と Ollama のオンボーディングの
デフォルトとして使用します。また `docker-compose.yml` は、Linux Docker Engine 向けに
`host.docker.internal` を Docker のホストゲートウェイへマッピングします。Docker Desktop は、
macOS と Windows ですでに同じホスト名を提供しています。

ホストサービスも Docker から到達可能なアドレスで待ち受ける必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` コマンドを使用する場合は、同じホストマッピングを自分で追加してください。例:
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト（`224.0.0.251:5353`）を
安定して転送しません。そのため、同梱 Compose セットアップでは
`OPENCLAW_DISABLE_BONJOUR=1` がデフォルトになっており、ブリッジがマルチキャストトラフィックを
落としたときに Gateway がクラッシュループしたり、アドバタイズを繰り返し再起動したりしないようにしています。

Docker ホストでは、公開済み Gateway URL、Tailscale、または広域 DNS-SD を使用してください。
`OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーキング、macvlan、または mDNS マルチキャストが
動作することがわかっている別のネットワークで実行している場合にのみ設定してください。

注意点とトラブルシューティングについては、[Bonjour 検出](/ja-JP/gateway/bonjour)を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に、
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` を `/home/node/.config/openclaw` にバインドマウントするため、
これらのパスはコンテナを置き換えても残ります。いずれかの変数が未設定の場合、同梱の
`docker-compose.yml` は `${HOME}` 配下にフォールバックし、`HOME` 自体もない場合は `/tmp` に
フォールバックします。これにより、最小環境で `docker compose up` が空の source を持つ
ボリューム指定を出力することを防ぎます。

そのマウントされた設定ディレクトリには、OpenClaw が次を保存します。

- 動作設定用の `openclaw.json`
- 保存されたプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` など、環境変数に基づくランタイムシークレット用の `.env`

auth-profile シークレットキー ディレクトリには、OAuth ベースの認証プロファイルのトークンデータに
使用するローカル暗号化キーが保存されます。これは Docker ホストの状態と一緒に保持しつつ、
`OPENCLAW_CONFIG_DIR` とは分けてください。

インストール済みのダウンロード可能な plugins は、パッケージ状態をマウントされた
OpenClaw ホーム配下に保存するため、plugin インストール記録とパッケージルートはコンテナ
置換後も保持されます。Gateway 起動時に、同梱 Plugin の依存関係ツリーは生成されません。

VM デプロイでの永続化の詳細については、
[Docker VM Runtime - 何がどこに保持されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

**ディスク増加のホットスポット:** `media/`、セッション JSONL ファイル、
`cron/runs/*.jsonl`、インストール済み plugin パッケージルート、`/tmp/openclaw/`
配下のローテーションされるファイルログを監視してください。

### シェルヘルパー（任意）

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` の raw パスから ClawDock をインストールしていた場合は、上のインストールコマンドを再実行して、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使用します。すべてのコマンドは
`clawdock-help` で確認できます。
ヘルパーの完全なガイドについては、[ClawDock](/ja-JP/install/clawdock)を参照してください。

<AccordionGroup>
  <Accordion title="Docker gateway の agent sandbox を有効にする">
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

    このスクリプトは、sandbox の前提条件が満たされた後にのみ `docker.sock` をマウントします。
    sandbox セットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` にリセットします。OpenClaw sandbox が有効な間も、Codex code-mode のターンは Codex
    `workspace-write` に制約されます。ホストの Docker ソケットを agent sandbox コンテナにマウントしないでください。

  </Accordion>

  <Accordion title="自動化 / CI（非対話）">
    `-T` で Compose の疑似 TTY 割り当てを無効にします。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティ注記">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使用するため、CLI
    コマンドは `127.0.0.1` 経由で gateway に到達できます。これは共有の
    信頼境界として扱ってください。compose 設定では、`openclaw-gateway` と `openclaw-cli`
    の両方で `NET_RAW`/`NET_ADMIN` を削除し、
    `no-new-privileges` を有効にしています。
  </Accordion>

  <Accordion title="openclaw-cli での Docker Desktop DNS 失敗">
    一部の Docker Desktop セットアップでは、`NET_RAW` が削除された後、共有ネットワークの
    `openclaw-cli` sidecar からの DNS ルックアップが失敗します。これは
    `openclaw plugins install` など npm に依存するコマンドで `EAI_AGAIN`
    として現れます。通常の gateway 運用では、既定の強化済み compose ファイルを使用してください。以下の
    ローカル override は Docker の既定 capabilities を復元することで CLI コンテナのセキュリティ態勢を
    緩めるため、既定の Compose 呼び出しとしてではなく、パッケージレジストリアクセスが必要な単発の CLI
    コマンドにのみ使用してください。

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    長時間実行される `openclaw-cli` コンテナをすでに作成している場合は、同じ override
    で再作成してください。`docker compose exec` と `docker exec` は、すでに作成済みのコンテナの
    Linux capabilities を変更できません。

  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node`（uid 1000）として実行されます。
    `/home/node/.openclaw` で権限エラーが発生する場合は、ホストの bind mount が uid 1000
    に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同じ不一致は、次のような plugin 警告として現れることもあります。
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    に続いて `plugin present but blocked` が表示されます。これはプロセス uid と
    マウントされた plugin ディレクトリ所有者が一致していないことを意味します。コンテナは既定の uid 1000
    で実行し、bind mount の所有権を修正することを推奨します。OpenClaw を長期的に root
    として実行する意図がある場合にのみ、`/path/to/openclaw-config/npm` を `root:root`
    に chown してください。

  </Accordion>

  <Accordion title="より高速なリビルド">
    依存関係レイヤーがキャッシュされるように Dockerfile を順序付けます。これにより、lockfile が変更されない限り
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
    既定のイメージはセキュリティ優先で、非 root の `node` として実行されます。より
    多機能なコンテナにするには:

    1. **`/home/node` を永続化**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright Chromium を焼き込む**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **または Playwright browsers を永続化ボリュームにインストール**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **browser downloads を永続化**: `OPENCLAW_HOME_VOLUME` または
       `OPENCLAW_EXTRA_MOUNTS` を使用します。OpenClaw は Linux 上で Docker イメージの
       Playwright 管理 Chromium を自動検出します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（headless Docker）">
    ウィザードで OpenAI Codex OAuth を選択すると、browser URL が開きます。
    Docker または headless セットアップでは、到達した完全な redirect URL をコピーし、
    認証を完了するためにウィザードへ貼り付けてください。
  </Accordion>

  <Accordion title="ベースイメージ metadata">
    メインの Docker runtime イメージは `node:24-bookworm-slim` を使用し、entrypoint の init process（PID 1）として `tini` を含めることで、長時間実行されるコンテナで zombie processes が回収され、signals が正しく処理されるようにしています。`org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` などを含む OCI base-image annotations を公開します。Node base digest は
    Dependabot Docker base-image PRs を通じて更新されます。release builds では
    distro upgrade layer は実行されません。参照:
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### VPS で実行する場合

binary baking、永続化、更新を含む共有 VM デプロイ手順については、
[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## Agent sandbox

`agents.defaults.sandbox` が Docker backend で有効な場合、gateway
自体はホスト上に留まり、gateway は agent tool execution（shell、ファイルの読み取り/書き込みなど）を分離された Docker
コンテナ内で実行します。これにより、gateway 全体をコンテナ化せずに、信頼できない agent sessions
やマルチテナントの agent sessions の周囲に強固な壁を設けられます。

Sandbox scope は agent ごと（既定）、session ごと、または shared にできます。各 scope
には `/workspace` にマウントされる独自の workspace が割り当てられます。また、
allow/deny tool policies、network isolation、resource limits、browser
containers も設定できます。

完全な設定、イメージ、セキュリティ注記、multi-agent profiles については、次を参照してください。

- [Sandboxing](/ja-JP/gateway/sandboxing) -- sandbox の完全なリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- sandbox コンテナへの対話型 shell アクセス
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agent ごとの overrides

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

既定の sandbox イメージをビルドします（source checkout から）。

```bash
scripts/sandbox-setup.sh
```

source checkout なしの npm インストールの場合は、inline `docker build` コマンドについて
[Sandboxing § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージが見つからない、または sandbox コンテナが起動しない">
    sandbox イメージを
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （source checkout）または [Sandboxing § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) の inline `docker build` コマンド（npm install）でビルドするか、
    `agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。
    コンテナは必要に応じて session ごとに自動作成されます。
  </Accordion>

  <Accordion title="sandbox 内の権限エラー">
    `docker.user` を、マウントされた workspace の所有権と一致する UID:GID に設定するか、
    workspace folder を chown してください。
  </Accordion>

  <Accordion title="カスタム tools が sandbox で見つからない">
    OpenClaw は `sh -lc`（login shell）でコマンドを実行します。これは
    `/etc/profile` を source し、PATH をリセットする場合があります。カスタム tool paths
    を前置するように `docker.env.PATH` を設定するか、Dockerfile 内で `/etc/profile.d/`
    配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM-killed（exit 137）">
    VM には少なくとも 2 GB RAM が必要です。より大きな machine class を使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で Unauthorized または pairing required">
    新しい dashboard link を取得し、browser device を承認します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [Dashboard](/ja-JP/web/dashboard)、[Devices](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target が ws://172.x.x.x を示す、または Docker CLI から pairing errors が出る">
    gateway mode と bind をリセットします。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替としての Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose community setup
- [Updating](/ja-JP/install/updating) — OpenClaw を最新に保つ
- [Configuration](/ja-JP/gateway/configuration) — インストール後の gateway 設定

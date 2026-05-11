---
read_when:
    - ローカルインストールではなく、コンテナ化された Gateway を使いたい場合
    - Docker フローを検証しています
summary: OpenClaw の任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:32:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。コンテナ化されたGatewayが必要な場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に適していますか？

- **はい**: 分離された使い捨てのGateway環境が必要な場合、またはローカルインストールなしのホストで OpenClaw を実行したい場合。
- **いいえ**: 自分のマシンで実行しており、最速の開発ループだけが必要な場合。代わりに通常のインストールフローを使用してください。
- **サンドボックス化に関する注意**: デフォルトのサンドボックスバックエンドは、サンドボックス化が有効な場合に Docker を使用しますが、サンドボックス化はデフォルトでオフであり、Gateway 全体を Docker で実行する必要は**ありません**。SSH と OpenShell のサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも 2 GB の RAM（1 GB のホストでは `pnpm install` が OOM により exit 137 で強制終了されることがあります）
- イメージとログ用の十分なディスク容量
- VPS/公開ホストで実行する場合は、
  [ネットワーク公開のためのセキュリティ強化](/ja-JP/gateway/security)、
  特に Docker の `DOCKER-USER` ファイアウォールポリシーを確認してください。

## コンテナ化されたGateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートからセットアップスクリプトを実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより、Gateway イメージがローカルでビルドされます。代わりに事前ビルド済みイメージを使用するには、次を実行します。

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
    - Docker Compose 経由でGatewayを起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接通じて実行されます。`openclaw-cli` は、
    Gateway コンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、構成済みの共有シークレットを
    Settings に貼り付けます。セットアップスクリプトはデフォルトでトークンを `.env` に
    書き込みます。コンテナ設定をパスワード認証に切り替えた場合は、代わりにその
    パスワードを使用してください。

    URL が再度必要ですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャンネルを構成する（任意）">
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

セットアップスクリプトを使用せず、各ステップを自分で実行したい場合:

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
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml`
を書き込みます。`-f docker-compose.yml -f docker-compose.extra.yml` を指定して含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、
起動後のツールです。`docker compose up -d openclaw-gateway` の前に、オンボーディング
とセットアップ時の設定書き込みを `openclaw-gateway` から
`--no-deps --entrypoint node` を使用して実行してください。
</Note>

### 環境変数

セットアップスクリプトは、次の任意の環境変数を受け付けます。

| 変数                                       | 目的                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ローカルでビルドする代わりにリモートイメージを使用する          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ビルド中に追加の apt パッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS`                      | ビルド時に選択したバンドルPluginヘルパーを含める                |
| `OPENCLAW_EXTRA_MOUNTS`                    | 追加のホスト bind mount（カンマ区切りの `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME`                     | 名前付き Docker ボリュームに `/home/node` を永続化する          |
| `OPENCLAW_SANDBOX`                         | サンドボックスのブートストラップにオプトインする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_SKIP_ONBOARDING`                 | 対話式オンボーディング手順をスキップする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker ソケットパスを上書きする                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS アドバタイズを無効にする（Docker ではデフォルトで `1`） |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | バンドルPluginソースの bind mount オーバーレイを無効にする      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry エクスポート用の共有 OTLP/HTTP コレクターエンドポイント |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | トレース、メトリクス、ログ用のシグナル固有 OTLP エンドポイント  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP プロトコルの上書き。現在は `http/protobuf` のみ対応        |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry リソースに使用されるサービス名                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 最新の実験的な GenAI セマンティック属性にオプトインする         |
| `OPENCLAW_OTEL_PRELOADED`                  | 事前読み込み済みの場合、2 つ目の OpenTelemetry SDK の起動をスキップする |

メンテナーは、1 つのPluginソースディレクトリをパッケージ化済みソースパスの上にマウントすることで、
パッケージ化されたイメージに対してバンドルPluginソースをテストできます。例:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
そのマウントされたソースディレクトリは、同じPlugin ID の対応するコンパイル済み
`/app/dist/extensions/synology-chat` バンドルを上書きします。

### 可観測性

OpenTelemetry エクスポートは、Gateway コンテナから OTLP コレクターへのアウトバウンドです。
公開済みの Docker ポートは不要です。イメージをローカルでビルドし、バンドルされた
OpenTelemetry エクスポーターをイメージ内で利用できるようにしたい場合は、
そのランタイム依存関係を含めます。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

パッケージ化された Docker インストールでエクスポートを有効にする前に、ClawHub から
公式の `@openclaw/diagnostics-otel` Plugin をインストールしてください。カスタムの
ソースビルドイメージでは、引き続き `OPENCLAW_EXTENSIONS=diagnostics-otel` により
ローカルPluginソースを含めることができます。エクスポートを有効にするには、設定で
`diagnostics-otel` Plugin を許可して有効化し、`diagnostics.otel.enabled=true` を設定するか、
[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)の設定例を使用してください。
コレクター認証ヘッダーは Docker 環境変数ではなく、`diagnostics.otel.headers` で構成します。

Prometheus メトリクスは、すでに公開されているGatewayポートを使用します。
`clawhub:@openclaw/diagnostics-prometheus` をインストールし、`diagnostics-prometheus`
Plugin を有効にしてからスクレイプします。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別個の公開 `/metrics` ポートや
未認証のリバースプロキシパスを公開しないでください。
[Prometheus メトリクス](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには `/healthz` に ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続ける場合、Docker はコンテナを `unhealthy` としてマークし、
オーケストレーションシステムが再起動または置き換えできます。

認証済みの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN と loopback

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を使用するため、
Docker のポート公開によりホストから `http://127.0.0.1:18789` へアクセスできます。

- `lan`（デフォルト）: ホストブラウザーとホスト CLI が公開済みGatewayポートに到達できます。
- `loopback`: コンテナネットワーク名前空間内のプロセスだけがGatewayへ直接到達できます。

<Note>
`gateway.bind` では bind mode の値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使用し、`0.0.0.0` や `127.0.0.1` のようなホストエイリアスは使用しないでください。
</Note>

### ホストローカルプロバイダー

OpenClaw が Docker で実行されている場合、コンテナ内の `127.0.0.1` はホストマシンではなく
コンテナ自体です。ホストで実行される AI プロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL    | Docker セットアップ URL             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

バンドルされた Docker セットアップでは、これらのホスト URL を LM Studio と Ollama の
オンボーディングのデフォルトとして使用し、`docker-compose.yml` は Linux Docker Engine 用に
`host.docker.internal` を Docker のホストゲートウェイへマップします。Docker Desktop は
macOS と Windows ですでに同じホスト名を提供しています。

ホストサービスは、Docker から到達可能なアドレスでもリッスンする必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` コマンドを使用する場合は、同じホストマッピングを
自分で追加してください。例:
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker ブリッジネットワークは、通常 Bonjour/mDNS マルチキャスト
（`224.0.0.251:5353`）を安定して転送しません。そのため、バンドルされた Compose セットアップは
デフォルトで `OPENCLAW_DISABLE_BONJOUR=1` を設定し、ブリッジがマルチキャストトラフィックを
落としたときに Gateway がクラッシュループしたり、アドバタイズを繰り返し再起動したりしないようにします。

Docker ホストでは、公開済みのGateway URL、Tailscale、または広域 DNS-SD を使用してください。
`OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが
動作することが分かっている別のネットワークで実行する場合にのみ設定してください。

注意点とトラブルシューティングについては、[Bonjour 検出](/ja-JP/gateway/bonjour)を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に bind mount するため、
これらのパスはコンテナ置き換え後も維持されます。どちらかの変数が未設定の場合、バンドルされた
`docker-compose.yml` は `${HOME}/.openclaw`（ワークスペースマウントは
`${HOME}/.openclaw/workspace`）にフォールバックし、`HOME` 自体もない場合は `/tmp/.openclaw`
にフォールバックします。これにより、最低限の環境でも `docker compose up` が
空のソースボリューム仕様を出力しなくなります。

そのマウントされた設定ディレクトリには、OpenClaw が次のものを保持します。

- 動作設定用の `openclaw.json`
- 保存済みプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` など、env ベースのランタイムシークレット用の `.env`

インストール済みのダウンロード可能なPluginは、マウントされた OpenClaw ホーム配下に
パッケージ状態を保存するため、Plugin インストール記録とパッケージルートはコンテナ置き換え後も維持されます。
Gateway 起動時にバンドルPluginの依存関係ツリーは生成されません。

VM デプロイでの完全な永続化の詳細については、
[Docker VM ランタイム - 何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

**ディスク増加のホットスポット:** `media/`、セッション JSONL ファイル、`cron/runs/*.jsonl`、インストール済み Plugin パッケージルート、`/tmp/openclaw/` 配下のローテーションファイルログを監視します。

### シェルヘルパー（任意）

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

以前の `scripts/shell-helpers/clawdock-helpers.sh` raw パスから ClawDock をインストールした場合は、上のインストールコマンドを再実行して、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使用します。すべてのコマンドを確認するには `clawdock-help` を実行してください。完全なヘルパーガイドは [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker gateway のエージェントサンドボックスを有効化">
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

    このスクリプトは、サンドボックスの前提条件が通った後にのみ `docker.sock` をマウントします。サンドボックスのセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode` を `off` にリセットします。OpenClaw サンドボックスが有効な間も、Codex コードモードのターンは Codex の `workspace-write` に制限されます。ホストの Docker ソケットをエージェントサンドボックスコンテナにマウントしないでください。

  </Accordion>

  <Accordion title="自動化 / CI（非対話）">
    `-T` で Compose の疑似 TTY 割り当てを無効にします。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティ注記">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使用するため、CLI コマンドは `127.0.0.1` 経由で Gateway に到達できます。これは共有された信頼境界として扱ってください。compose 設定は `NET_RAW`/`NET_ADMIN` を削除し、`openclaw-gateway` と `openclaw-cli` の両方で `no-new-privileges` を有効にします。
  </Accordion>

  <Accordion title="openclaw-cli での Docker Desktop DNS 障害">
    一部の Docker Desktop セットアップでは、`NET_RAW` を削除した後、共有ネットワークの `openclaw-cli` サイドカーからの DNS ルックアップが失敗し、`openclaw plugins install` など npm を使用するコマンド中に `EAI_AGAIN` として現れます。通常の Gateway 運用では、既定の強化された compose ファイルを維持してください。以下のローカルオーバーライドは Docker の既定 capability を復元して CLI コンテナのセキュリティ姿勢を緩めるため、既定の Compose 呼び出しとしてではなく、パッケージレジストリアクセスが必要な単発の CLI コマンドだけに使用してください。

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    長時間実行される `openclaw-cli` コンテナをすでに作成している場合は、同じオーバーライドで再作成してください。`docker compose exec` と `docker exec` は、すでに作成済みのコンテナの Linux capability を変更できません。

  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で権限エラーが表示される場合は、ホストの bind mount が uid 1000 に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同じ不一致は、`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` のような Plugin 警告に続いて `plugin present but blocked` と表示される形でも現れることがあります。これは、プロセス uid とマウントされた Plugin ディレクトリの所有者が一致していないことを意味します。コンテナを既定の uid 1000 で実行し、bind mount の所有権を修正する方法を優先してください。OpenClaw を長期的に root として実行する意図がある場合にのみ、`/path/to/openclaw-config/npm` を `root:root` に chown してください。

  </Accordion>

  <Accordion title="より高速なリビルド">
    依存関係レイヤーがキャッシュされるように Dockerfile を並べます。これにより、lockfile が変更されない限り `pnpm install` の再実行を避けられます。

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
    既定のイメージはセキュリティ優先で、非 root の `node` として実行されます。より機能の充実したコンテナにするには:

    1. **`/home/node` を永続化**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込み**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright Chromium を焼き込み**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **または Playwright ブラウザを永続化ボリュームにインストール**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **ブラウザダウンロードを永続化**: `OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使用します。OpenClaw は Linux 上で Docker イメージの Playwright 管理 Chromium を自動検出します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレス Docker）">
    ウィザードで OpenAI Codex OAuth を選ぶと、ブラウザ URL が開きます。Docker またはヘッドレスセットアップでは、到達した完全なリダイレクト URL をコピーし、ウィザードに貼り戻して認証を完了してください。
  </Accordion>

  <Accordion title="ベースイメージメタデータ">
    メインの Docker ランタイムイメージは `node:24-bookworm-slim` を使用し、長時間実行されるコンテナでゾンビプロセスが回収され、シグナルが正しく処理されるように、エントリポイントの init プロセス（PID 1）として `tini` を含みます。`org.opencontainers.image.base.name`、`org.opencontainers.image.source` などを含む OCI ベースイメージアノテーションを公開します。Node ベース digest は Dependabot の Docker ベースイメージ PR を通じて更新されます。リリースビルドではディストリビューションのアップグレードレイヤーは実行されません。詳しくは [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md) を参照してください。
  </Accordion>
</AccordionGroup>

### VPS で実行しますか？

バイナリの焼き込み、永続化、更新を含む共有 VM デプロイ手順については、[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と [Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## エージェントサンドボックス

Docker バックエンドで `agents.defaults.sandbox` が有効になっている場合、Gateway 自体はホスト上に置いたまま、Gateway はエージェントのツール実行（シェル、ファイルの読み書きなど）を分離された Docker コンテナ内で実行します。これにより、Gateway 全体をコンテナ化せずに、信頼できない、またはマルチテナントのエージェントセッションの周囲に強い壁を作れます。

サンドボックススコープは、エージェントごと（既定）、セッションごと、または共有にできます。各スコープには `/workspace` にマウントされる独自のワークスペースがあります。ツールの許可/拒否ポリシー、ネットワーク分離、リソース制限、ブラウザコンテナも設定できます。

完全な設定、イメージ、セキュリティ注記、マルチエージェントプロファイルについては、以下を参照してください。

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナへの対話型シェルアクセス
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとのオーバーライド

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

既定のサンドボックスイメージをビルドします（ソースチェックアウトから）。

```bash
scripts/sandbox-setup.sh
```

ソースチェックアウトなしで npm インストールする場合は、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージがない、またはサンドボックスコンテナが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（ソースチェックアウト）または [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) のインライン `docker build` コマンド（npm install）でサンドボックスイメージをビルドするか、`agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。コンテナは必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="サンドボックスでの権限エラー">
    `docker.user` を、マウントされたワークスペースの所有権に一致する UID:GID に設定するか、ワークスペースフォルダーを chown してください。
  </Accordion>

  <Accordion title="サンドボックス内でカスタムツールが見つからない">
    OpenClaw は `sh -lc`（ログインシェル）でコマンドを実行します。これは `/etc/profile` を source し、PATH をリセットすることがあります。`docker.env.PATH` を設定してカスタムツールパスを先頭に追加するか、Dockerfile で `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM で kill された（exit 137）">
    VM には少なくとも 2 GB の RAM が必要です。より大きいマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で未認可またはペアリングが必要">
    新しいダッシュボードリンクを取得し、ブラウザデバイスを承認します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [ダッシュボード](/ja-JP/web/dashboard)、[デバイス](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway ターゲットが ws://172.x.x.x を示す、または Docker CLI からペアリングエラーが出る">
    Gateway モードと bind をリセットします。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [インストール概要](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替としての Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose コミュニティセットアップ
- [更新](/ja-JP/install/updating) — OpenClaw を最新に保つ
- [設定](/ja-JP/gateway/configuration) — インストール後の Gateway 設定

---
read_when:
    - ローカルインストールではなくコンテナ化された Gateway を使いたい場合
    - Docker フローを検証しています
summary: OpenClaw の任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-05-02T20:50:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker は**任意**です。コンテナ化された Gateway を使いたい場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に適しているか？

- **はい**: 分離された使い捨ての Gateway 環境が必要な場合、またはローカルインストールなしのホストで OpenClaw を実行したい場合。
- **いいえ**: 自分のマシンで実行していて、最速の開発ループだけが必要な場合。代わりに通常のインストールフローを使用してください。
- **サンドボックス化の注記**: デフォルトのサンドボックスバックエンドは、サンドボックス化が有効な場合に Docker を使用しますが、サンドボックス化はデフォルトでオフであり、完全な Gateway を Docker で実行する必要は**ありません**。SSH と OpenShell のサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に 2 GB 以上の RAM（1 GB ホストでは `pnpm install` が OOM により終了コード 137 で強制終了されることがあります）
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

    これにより Gateway イメージがローカルでビルドされます。代わりに事前ビルド済みイメージを使用するには、次を実行します。

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    事前ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    で公開されています。一般的なタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動的に実行します。以下を行います。

    - プロバイダー API キーの入力を求める
    - Gateway トークンを生成し、`.env` に書き込む
    - Docker Compose 経由で Gateway を起動する

    セットアップ中、起動前のオンボーディングと設定の書き込みは
    `openclaw-gateway` を直接通じて実行されます。`openclaw-cli` は、
    Gateway コンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、設定済みの
    共有シークレットを Settings に貼り付けます。セットアップスクリプトはデフォルトでトークンを `.env` に書き込みます。コンテナ設定をパスワード認証に切り替えた場合は、代わりにそのパスワードを使用してください。

    URL が再度必要ですか？

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

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Telegram](/ja-JP/channels/telegram), [Discord](/ja-JP/channels/discord)

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
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml` を書き込みます。
`-f docker-compose.yml -f docker-compose.extra.yml` を付けて含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、起動後のツールです。
`docker compose up -d openclaw-gateway` の前に、オンボーディングとセットアップ時の設定書き込みを
`--no-deps --entrypoint node` を指定した `openclaw-gateway` 経由で実行してください。
</Note>

### 環境変数

セットアップスクリプトは、次の任意の環境変数を受け付けます。

| 変数                                       | 目的                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ローカルでビルドする代わりにリモートイメージを使用する          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ビルド中に追加の apt パッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS`                      | ビルド時に選択した同梱 Plugin ヘルパーを含める                 |
| `OPENCLAW_EXTRA_MOUNTS`                    | 追加のホストバインドマウント（カンマ区切りの `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME`                     | 名前付き Docker ボリュームに `/home/node` を永続化する          |
| `OPENCLAW_SANDBOX`                         | サンドボックスブートストラップを有効にする（`1`, `true`, `yes`, `on`） |
| `OPENCLAW_SKIP_ONBOARDING`                 | 対話型オンボーディングステップをスキップする（`1`, `true`, `yes`, `on`） |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker ソケットパスを上書きする                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS アドバタイズを無効にする（Docker ではデフォルトで `1`） |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 同梱 Plugin ソースのバインドマウントオーバーレイを無効にする    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry エクスポート用の共有 OTLP/HTTP コレクターエンドポイント |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | トレース、メトリクス、またはログ用のシグナル別 OTLP エンドポイント |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP プロトコルの上書き。現在サポートされているのは `http/protobuf` のみ |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry リソースに使用されるサービス名                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 最新の実験的な GenAI セマンティック属性を有効にする             |
| `OPENCLAW_OTEL_PRELOADED`                  | すでにプリロード済みの場合、2 つ目の OpenTelemetry SDK の起動をスキップする |

メンテナーは、1 つの Plugin ソースディレクトリを、そのパッケージ化済みソースパスの上にマウントすることで、パッケージ化済みイメージに対して同梱 Plugin ソースをテストできます。例:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
そのマウントされたソースディレクトリは、同じ Plugin ID に対して一致するコンパイル済みの
`/app/dist/extensions/synology-chat` バンドルを上書きします。

### オブザーバビリティ

OpenTelemetry エクスポートは、Gateway コンテナから OTLP コレクターへのアウトバウンドです。
公開された Docker ポートは必要ありません。イメージをローカルでビルドし、同梱の OpenTelemetry エクスポーターをイメージ内で利用できるようにしたい場合は、そのランタイム依存関係を含めてください。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

エクスポートを有効にする前に、パッケージ化済み Docker インストールでは ClawHub から公式の `@openclaw/diagnostics-otel` Plugin をインストールしてください。カスタムのソースビルドイメージでは、引き続き
`OPENCLAW_EXTENSIONS=diagnostics-otel` でローカル Plugin ソースを含めることができます。エクスポートを有効にするには、設定で `diagnostics-otel` Plugin を許可して有効にし、その後
`diagnostics.otel.enabled=true` を設定するか、[OpenTelemetry
エクスポート](/ja-JP/gateway/opentelemetry)の設定例を使用します。コレクター認証ヘッダーは Docker 環境変数ではなく、
`diagnostics.otel.headers` で設定します。

Prometheus メトリクスは、すでに公開されている Gateway ポートを使用します。
`clawhub:@openclaw/diagnostics-prometheus` をインストールし、
`diagnostics-prometheus` Plugin を有効にしてから、スクレイプします。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートは Gateway 認証で保護されています。別の公開 `/metrics` ポートや、認証されていないリバースプロキシパスを公開しないでください。
[Prometheus メトリクス](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには、`/healthz` に ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` とマークし、オーケストレーションシステムはそれを再起動または置換できます。

認証済みの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN とループバック

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を設定するため、Docker のポート公開によりホストから
`http://127.0.0.1:18789` へアクセスできます。

- `lan`（デフォルト）: ホストブラウザーとホスト CLI が公開された Gateway ポートに到達できます。
- `loopback`: コンテナネットワーク名前空間内のプロセスだけが Gateway に直接到達できます。

<Note>
`gateway.bind` にはホストエイリアスの `0.0.0.0` や `127.0.0.1` ではなく、バインドモード値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使用してください。
</Note>

### ホストローカルプロバイダー

OpenClaw が Docker 内で実行される場合、コンテナ内の `127.0.0.1` はホストマシンではなくコンテナ自体です。ホスト上で実行される AI プロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL | Docker セットアップ URL            |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

同梱の Docker セットアップは、LM Studio と Ollama のオンボーディングのデフォルトとしてこれらのホスト URL を使用し、`docker-compose.yml` は Linux Docker Engine 用に `host.docker.internal` を Docker のホスト Gateway にマップします。Docker Desktop は macOS と Windows で同じホスト名をすでに提供しています。

ホストサービスは、Docker から到達可能なアドレスでもリッスンしている必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` コマンドを使用する場合は、同じホストマッピングを自分で追加してください。例:
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト（`224.0.0.251:5353`）を安定して転送しません。そのため、同梱の Compose セットアップではデフォルトで
`OPENCLAW_DISABLE_BONJOUR=1` を設定し、ブリッジがマルチキャストトラフィックをドロップしたときに Gateway がクラッシュループしたり、アドバタイズの再起動を繰り返したりしないようにしています。

Docker ホストには、公開された Gateway URL、Tailscale、または広域 DNS-SD を使用してください。
`OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが動作することが分かっている別のネットワークで実行する場合にのみ設定してください。

注意点とトラブルシューティングについては、[Bonjour ディスカバリー](/ja-JP/gateway/bonjour)を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` にバインドマウントするため、これらのパスはコンテナを置換しても保持されます。どちらかの変数が未設定の場合、同梱の
`docker-compose.yml` は `${HOME}/.openclaw`（ワークスペースマウントは
`${HOME}/.openclaw/workspace`）にフォールバックし、`HOME` 自体もない場合は `/tmp/.openclaw` にフォールバックします。これにより、ベア環境で `docker compose up` が空のソースボリューム仕様を出力しないようにします。

そのマウントされた設定ディレクトリに OpenClaw は以下を保持します。

- 動作設定用の `openclaw.json`
- 保存されたプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` など、環境変数に基づくランタイムシークレット用の `.env`

インストール済みのダウンロード可能な Plugin は、マウントされた OpenClaw ホーム配下にパッケージ状態を保存するため、Plugin インストール記録とパッケージルートはコンテナを置換しても保持されます。Gateway 起動時に同梱 Plugin の依存関係ツリーは生成されません。

VM デプロイでの完全な永続化の詳細については、
[Docker VM ランタイム - 何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

**ディスク増加のホットスポット:** `media/`、セッション JSONL ファイル、
`cron/runs/*.jsonl`、インストール済み Plugin パッケージルート、`/tmp/openclaw/`
配下のローリングファイルログを監視してください。

### シェルヘルパー (任意)

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` の raw パスから ClawDock をインストールしていた場合は、上記のインストールコマンドを再実行して、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使用します。すべてのコマンドについては
`clawdock-help` を実行してください。
完全なヘルパーガイドは [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker gateway のエージェントサンドボックスを有効化">
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

    スクリプトは、サンドボックスの前提条件が満たされた後にのみ `docker.sock` をマウントします。サンドボックスのセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` にリセットします。

  </Accordion>

  <Accordion title="自動化 / CI (非対話)">
    `-T` で Compose の疑似 TTY 割り当てを無効にします。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティメモ">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使用するため、CLI
    コマンドは `127.0.0.1` 経由で gateway に到達できます。これは共有の信頼境界として扱ってください。compose 設定では `NET_RAW`/`NET_ADMIN` を削除し、`openclaw-cli` で
    `no-new-privileges` を有効にします。
  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node` (uid 1000) として実行されます。
    `/home/node/.openclaw` で権限エラーが表示される場合は、ホストの bind mount が uid 1000 に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="再ビルドの高速化">
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
    デフォルトイメージはセキュリティ優先で、非 root の `node` として実行されます。より機能の多いコンテナにするには:

    1. **`/home/node` を永続化**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を組み込む**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright ブラウザーをインストール**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **ブラウザーのダウンロードを永続化**:
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定し、
       `OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使用します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    ウィザードで OpenAI Codex OAuth を選択すると、ブラウザー URL が開きます。Docker や headless セットアップでは、到達した完全なリダイレクト URL をコピーしてウィザードに貼り戻し、認証を完了します。
  </Accordion>

  <Accordion title="ベースイメージのメタデータ">
    メインの Docker ランタイムイメージは `node:24-bookworm-slim` を使用し、
    `org.opencontainers.image.base.name`、`org.opencontainers.image.source` などを含む OCI
    ベースイメージアノテーションを公開します。Node ベースダイジェストは Dependabot の Docker ベースイメージ PR を通じて更新されます。リリースビルドではディストリビューションのアップグレードレイヤーは実行されません。
    [OCI イメージアノテーション](https://github.com/opencontainers/image-spec/blob/main/annotations.md) を参照してください。
  </Accordion>
</AccordionGroup>

### VPS で実行しますか?

バイナリの組み込み、永続化、更新を含む共有 VM デプロイ手順については、[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## エージェントサンドボックス

`agents.defaults.sandbox` が Docker バックエンドで有効化されている場合、gateway
はエージェントのツール実行 (シェル、ファイル読み取り/書き込みなど) を分離された Docker
コンテナ内で実行し、gateway 自体はホスト上に残ります。これにより、gateway 全体をコンテナ化せずに、信頼できないエージェントセッションやマルチテナントのエージェントセッションの周囲に強固な壁を設けられます。

サンドボックスのスコープは、エージェント単位 (デフォルト)、セッション単位、または共有にできます。各スコープには、`/workspace` にマウントされた独自のワークスペースがあります。ツールの許可/拒否ポリシー、ネットワーク分離、リソース制限、ブラウザーコンテナも設定できます。

完全な設定、イメージ、セキュリティメモ、マルチエージェントプロファイルについては、以下を参照してください。

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナへの対話型シェルアクセス
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位のオーバーライド

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

デフォルトのサンドボックスイメージをビルドします (ソース checkout から):

```bash
scripts/sandbox-setup.sh
```

ソース checkout なしの npm インストールでは、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージが見つからない、またはサンドボックスコンテナが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (ソース checkout) または [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) のインライン `docker build` コマンド (npm install) でサンドボックスイメージをビルドするか、
    `agents.defaults.sandbox.docker.image` をカスタムイメージに設定します。
    コンテナは必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="サンドボックス内の権限エラー">
    `docker.user` をマウントされたワークスペースの所有権に一致する UID:GID に設定するか、ワークスペースフォルダーを chown します。
  </Accordion>

  <Accordion title="カスタムツールがサンドボックスで見つからない">
    OpenClaw は `sh -lc` (login shell) でコマンドを実行します。これは
    `/etc/profile` を source し、PATH をリセットする場合があります。`docker.env.PATH` を設定してカスタムツールパスを先頭に追加するか、Dockerfile の `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM で kill された (exit 137)">
    VM には少なくとも 2 GB の RAM が必要です。より大きなマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で未認証またはペアリングが必要">
    新しいダッシュボードリンクを取得し、ブラウザーデバイスを承認します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [ダッシュボード](/ja-JP/web/dashboard)、[デバイス](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway ターゲットが ws://172.x.x.x を示す、または Docker CLI からペアリングエラーが出る">
    gateway モードと bind をリセットします。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [インストール概要](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替となる Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose コミュニティセットアップ
- [更新](/ja-JP/install/updating) — OpenClaw を最新の状態に保つ
- [設定](/ja-JP/gateway/configuration) — インストール後の gateway 設定

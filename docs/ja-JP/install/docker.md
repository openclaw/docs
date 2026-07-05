---
read_when:
    - ローカルインストールではなくコンテナ化されたゲートウェイが必要な場合
    - Docker フローを検証しています
summary: OpenClaw の任意の Docker ベースのセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-07-05T11:31:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7666fabb7e4815cd541d23487a16f973183c5239a7be9a9b7b2ed2d82e640a47
    source_path: install/docker.md
    workflow: 16
---

Dockerは**任意**です。分離された使い捨てのGateway環境、またはローカルインストールがないホストで使用します。すでに自分のマシンで開発している場合は、代わりに通常のインストールフローを使用してください。

デフォルトのサンドボックスバックエンドは、`agents.defaults.sandbox` が有効な場合にDockerを使用しますが、サンドボックス化はデフォルトでオフであり、Gateway自体をDockerで実行する必要はありません。SSHおよびOpenShellサンドボックスバックエンドも利用できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（またはDocker Engine）+ Docker Compose v2
- イメージビルド用に最低2 GBのRAM（1 GBホストでは `pnpm install` がメモリ不足で終了コード137により強制終了される場合があります）
- イメージとログに十分なディスク容量
- VPS/公開ホストでは、[ネットワーク公開のセキュリティ強化](/ja-JP/gateway/security)を確認してください。特にDockerの `DOCKER-USER` ファイアウォールチェーンを確認してください

## コンテナ化されたGateway

<Steps>
  <Step title="イメージをビルド">
    リポジトリルートから:

    ```bash
    ./scripts/docker/setup.sh
    ```

    これによりGatewayイメージがローカルで `openclaw:local` としてビルドされます。代わりに事前ビルド済みイメージを使用するには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    事前ビルド済みイメージはまず[GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)に公開されます。GHCRは、リリース自動化、固定デプロイ、来歴チェックの主要レジストリです。同じリリースはDocker Hubミラー `openclaw/openclaw` にも公開されます:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` または `openclaw/openclaw` を使用し、非公式ミラーは避けてください。非公式ミラーはOpenClawのリリースタイミングや保持ポリシーを共有していません。公式タグ: `main`、`latest`、`<version>`（例: `2026.2.26`）、および `2026.2.26-beta.1` のようなベータタグ（ベータは `latest`/`main` を移動しません）。デフォルトの `main`/`latest`/`<version>` イメージには、`codex` と `diagnostics-otel` Pluginが含まれます。`-browser` バリアント（例: `latest-browser`）にはChromiumも組み込まれており、初回実行時のPlaywrightインストールなしで[サンドボックス化されたブラウザー](/ja-JP/gateway/sandboxing#sandboxed-browser)ツールを使う場合に便利です。

  </Step>

  <Step title="エアギャップ環境での再実行">
    オフラインホストでは、まずイメージを転送して読み込みます:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` は `OPENCLAW_IMAGE` がすでにローカルに存在することを検証し、暗黙的なComposeのpull/buildを無効にしたうえで、通常のフローを実行します: `.env` 同期、権限修正、オンボーディング、Gateway設定同期、Compose起動。

    `OPENCLAW_SANDBOX=1` の場合、オフラインセットアップは `OPENCLAW_DOCKER_SOCKET` の背後にあるデーモン上で、設定済みのデフォルトおよびエージェントごとのサンドボックスイメージも確認します。Dockerバックエンドのブラウザーイメージでは、ブラウザー契約ラベルも確認します。必要なイメージが欠落している、または古い場合、セットアップは壊れた成功を報告するのではなく、サンドボックス設定を変更せずに終了します。

  </Step>

  <Step title="オンボーディングを完了">
    セットアップスクリプトはオンボーディングを自動的に実行します:

    - プロバイダーAPIキーを入力するプロンプトを表示
    - Gatewayトークンを生成して `.env` に書き込み
    - 認証プロファイルのシークレットキーディレクトリを作成
    - Docker Compose経由でGatewayを起動

    起動前のオンボーディングと設定書き込みは、`openclaw-gateway` を直接通して（`--no-deps --entrypoint node` 付きで）実行されます。`openclaw-cli` はGatewayのネットワーク名前空間を共有し、Gatewayコンテナが存在してからでないと動作しないためです。

  </Step>

  <Step title="Control UIを開く">
    `http://127.0.0.1:18789/` を開き、`.env` に書き込まれたトークンをSettingsに貼り付けます。コンテナをパスワード認証に切り替えた場合は、代わりにそのパスワードを使用します。

    URLをもう一度確認する必要がありますか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャンネルを設定（任意）">
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

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
リポジトリルートから `docker compose` を実行してください。`OPENCLAW_EXTRA_MOUNTS` または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml` を書き込みます。自分で管理している `docker-compose.override.yml` がある場合は、その後に含めてください。例: `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

### 環境変数

`scripts/docker/setup.sh` が受け付ける任意の変数（Gatewayコンテナについては `docker-compose.yml` が直接受け付ける変数）:

| 変数                                            | 目的                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | ローカルでビルドする代わりにリモートイメージを使用する                                                  |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | ビルド中に追加のaptパッケージをインストールする（スペース区切り）。レガシーエイリアス: `OPENCLAW_DOCKER_APT_PACKAGES` |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | ビルド中に追加のPythonパッケージをインストールする（スペース区切り）                                    |
| `OPENCLAW_EXTENSIONS`                           | ビルド時にPlugin依存関係を事前インストールする（カンマ区切りまたはスペース区切りのID）                  |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | ローカルソースビルドのNodeオプションを上書きする（デフォルト `--max-old-space-size=8192`）              |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | ローカルソースビルドのtsdownヒープをMB単位で上書きする                                                  |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | ランタイム専用ローカルイメージビルド中の宣言出力をスキップする（デフォルト `1`）                        |
| `OPENCLAW_INSTALL_BROWSER`                      | ビルド時にChromium + Xvfbをイメージへ組み込む                                                           |
| `OPENCLAW_EXTRA_MOUNTS`                         | 追加のホストバインドマウント（カンマ区切りの `source:target[:opts]`）                                   |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` を名前付きDockerボリュームに永続化する                                                     |
| `OPENCLAW_SANDBOX`                              | サンドボックスブートストラップを有効化する（`1`, `true`, `yes`, `on`）                                  |
| `OPENCLAW_SKIP_ONBOARDING`                      | 対話型オンボーディング手順をスキップする（`1`, `true`, `yes`, `on`）                                    |
| `OPENCLAW_DOCKER_SOCKET`                        | Dockerソケットパスを上書きする                                                                          |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour/mDNS広告を強制的にオン（`0`）またはオフ（`1`）にする。[Bonjour / mDNS](#bonjour--mdns)を参照     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | バンドル済みPluginソースのバインドマウントオーバーレイを無効化する                                      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetryエクスポート用の共有OTLP/HTTPコレクターエンドポイント                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | トレース、メトリクス、ログ向けのシグナル別OTLPエンドポイント                                            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLPプロトコルの上書き。現在サポートされているのは `http/protobuf` のみ                                 |
| `OTEL_SERVICE_NAME`                             | OpenTelemetryリソースに使用されるサービス名                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 最新の実験的GenAIセマンティック属性を有効化する                                                         |
| `OPENCLAW_OTEL_PRELOADED`                       | すでに1つのOpenTelemetry SDKが事前読み込みされている場合、2つ目の起動をスキップする                     |

公式イメージにはHomebrewは含まれません。オンボーディング中、OpenClawは `brew` のないLinuxコンテナ内で、brew専用のSkill依存関係インストーラーを非表示にします。これらの依存関係はカスタムイメージで提供するか、手動でインストールしてください。Debianパッケージ化された依存関係には `OPENCLAW_IMAGE_APT_PACKAGES` を、Python依存関係には `OPENCLAW_IMAGE_PIP_PACKAGES` を使用してください（ビルド時に `python3 -m pip install --break-system-packages` を実行するため、バージョンを固定し、信頼できるインデックスのみを使用してください）。

Dockerが `ResourceExhausted`、`cannot allocate memory` を報告する、または `tsdown` 中に中止する場合は、Dockerビルダーのメモリ制限を増やすか、より小さい明示的なヒープで再試行してください:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

パッケージ化されたイメージに対してバンドル済みPluginソースをテストするには、1つのPluginソースディレクトリを、そのパッケージ化されたソースパスにマウントします。例: `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。これにより、同じPlugin IDに対応するコンパイル済みの `/app/dist/extensions/synology-chat` バンドルが上書きされます。

### 可観測性

OpenTelemetryエクスポートは、GatewayコンテナからOTLPコレクターへのアウトバウンド通信です。公開Dockerポートは不要です。ローカルでビルドしたイメージにバンドル済みエクスポーターを含めるには:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

公式の事前ビルド済みイメージにはすでに `diagnostics-otel` が含まれています。削除した場合のみ、自分で `clawhub:@openclaw/diagnostics-otel` をインストールしてください。エクスポートを有効にするには、設定で `diagnostics-otel` Pluginを許可して有効化し、その後 `diagnostics.otel.enabled=true` を設定します（完全な例は[OpenTelemetryエクスポート](/ja-JP/gateway/opentelemetry)を参照）。コレクター認証ヘッダーはDocker環境変数ではなく、`diagnostics.otel.headers` を通ります。

Prometheusメトリクスは、すでに公開されているGatewayポートを再利用します。`clawhub:@openclaw/diagnostics-prometheus` をインストールし、`diagnostics-prometheus` Pluginを有効化してから、次をスクレイプします:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートはGateway認証で保護されています。別の公開 `/metrics` ポートや、認証されていないリバースプロキシパスを公開しないでください。[Prometheusメトリクス](/ja-JP/gateway/prometheus)を参照してください。

### ヘルスチェック

コンテナプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

イメージに組み込まれた `HEALTHCHECK` は `/healthz` にpingします。失敗が繰り返されると、コンテナは `unhealthy` とマークされ、オーケストレーターが再起動または置換できるようになります。

認証付きの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を設定するため、Dockerポート公開により、ホスト上の `http://127.0.0.1:18789` が動作します。

- `lan` (デフォルト): ホストのブラウザーとホスト CLI は、公開された Gateway ポートに到達できます。
- `loopback`: コンテナのネットワーク名前空間内のプロセスだけが Gateway に直接到達できます。

<Note>
`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではなく、`gateway.bind` のバインドモード値 (`lan` / `loopback` / `custom` / `tailnet` / `auto`) を使用してください。
</Note>

### ホストのローカルプロバイダー

コンテナ内では、`127.0.0.1` はホストではなくコンテナ自体です。ホスト上で実行されているプロバイダーには `host.docker.internal` を使用してください。

| プロバイダー | ホストのデフォルト URL | Docker セットアップ URL |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

同梱のセットアップは、これらの URL を LM Studio/Ollama オンボーディングのデフォルトとして使用し、`docker-compose.yml` は Linux Docker Engine 上で `host.docker.internal` をホスト Gateway にマッピングします (Docker Desktop は macOS/Windows で同じエイリアスを提供します)。ホストサービスは Docker が到達できるアドレスで待ち受ける必要があります。

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

独自の Compose ファイルまたは `docker run` を使用していますか？ 同じマッピングを自分で追加してください。例: `--add-host=host.docker.internal:host-gateway`。

### Docker の Claude CLI バックエンド

公式イメージには Claude Code は事前インストールされていません。コンテナの `node` ユーザー内でインストールしてログインし、そのコンテナホームを永続化して、イメージのアップグレードでバイナリや認証状態が消えないようにします。

新規インストールでは、セットアップを実行する前に永続的な `/home/node` ボリュームを有効にします。

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

既存のインストールでは、まずスタックを停止し、現在の `.env` 値を再読み込みします。セットアップスクリプトは常に現在のシェルとデフォルトから `.env` を書き換え、ファイルを自分では読み取りません。

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env` にシェルで source できない値が含まれている場合は、依存している値を先に手動で再 export してください (`OPENCLAW_IMAGE`、ポート、バインドモード、カスタムパス、`OPENCLAW_EXTRA_MOUNTS`、sandbox、skip-onboarding)。生成された overlay は `openclaw-gateway` と `openclaw-cli` の両方にホームボリュームをマウントします。残りのコマンドはその overlay で実行してください (使用している場合は `docker-compose.override.yml` を先に指定します)。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ネイティブインストーラーは `claude` を `/home/node/.local/bin/claude` に書き込みます。OpenClaw にそのパスを指定します。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

同じ永続化されたホームからログインして検証します。

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

その後、同梱の `claude-cli` バックエンドを使用します。

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` は、`/home/node/.local/bin` と `/home/node/.local/share/claude` にあるネイティブインストールに加え、`/home/node/.claude` と `/home/node/.claude.json` にある Claude Code の設定/認証を永続化します。`/home/node/.openclaw` だけを永続化しても不十分です。ホームボリュームではなく `OPENCLAW_EXTRA_MOUNTS` を使用する場合は、これらすべての Claude パスを両方のサービスにマウントしてください。

<Note>
共有の本番自動化または予測可能な Anthropic 課金には、Anthropic API キーの経路を推奨します。Claude CLI の再利用は、Claude Code のインストール済みバージョン、アカウントログイン、課金、更新の挙動に従います。
</Note>

### Bonjour / mDNS

Docker ブリッジネットワークは通常、Bonjour/mDNS マルチキャスト (`224.0.0.251:5353`) を安定して転送しません。`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、同梱の Bonjour Plugin はコンテナ内で実行されていることを検出すると LAN 広告を自動的に無効化するため、ブリッジが破棄するマルチキャストを再試行してクラッシュループすることはありません。検出結果に関係なく強制的にオフにするには `OPENCLAW_DISABLE_BONJOUR=1` を設定し、強制的にオンにするには `0` を設定します (ホストネットワーク、macvlan、または mDNS マルチキャストが機能することが分かっている別のネットワークでのみ)。

それ以外の Docker ホストでは、公開された Gateway URL、Tailscale、または広域 DNS-SD を使用してください。注意点とトラブルシューティングについては [Bonjour 検出](/ja-JP/gateway/bonjour) を参照してください。

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に、`OPENCLAW_AUTH_PROFILE_SECRET_DIR` を `/home/node/.config/openclaw` にバインドマウントするため、これらのパスはコンテナの置き換え後も残ります。変数が未設定の場合、`docker-compose.yml` は `${HOME}` 配下にフォールバックし、`HOME` 自体がない場合は `/tmp` にフォールバックするため、素の環境でも `docker compose up` が空のソースボリューム指定を出力することはありません。

そのマウントされた設定ディレクトリには以下が含まれます。

- 挙動設定用の `openclaw.json`
- 保存済みプロバイダー OAuth/API キー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` などの env ベースのランタイムシークレット用の `.env`

  auth-profile シークレットディレクトリは、OAuth に裏付けられた認証プロファイルのトークンマテリアル用ローカル暗号化キーを保存します。Docker ホスト状態と一緒に保持しますが、`OPENCLAW_CONFIG_DIR` とは分離してください。

  インストール済みのダウンロード可能な Plugin は、マウントされた OpenClaw ホーム配下にパッケージ状態を保存するため、インストール記録とパッケージルートはコンテナの置き換え後も残ります。Gateway 起動時に、バンドル済み Plugin の依存関係ツリーは再生成されません。

  VM の永続化の詳細は、[Docker VM ランタイム - 何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

  **ディスク増加のホットスポット:** `media/`、セッション JSONL ファイル、共有 SQLite 状態データベース、インストール済み Plugin のパッケージルート、`/tmp/openclaw/` 配下のローテーションファイルログ。

  ### シェルヘルパー（任意）

  日常的なコマンドを短くするには、[ClawDock](/ja-JP/install/clawdock) をインストールします。

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  古い `scripts/shell-helpers/clawdock-helpers.sh` パスからインストールしていた場合は、上のコマンドを再実行して、ローカルヘルパーが現在の場所を追跡するようにしてください。その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使用します（完全な一覧は `clawdock-help` を実行してください）。

  <AccordionGroup>
  <Accordion title="Docker Gateway のエージェントサンドボックスを有効化する">
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

    このスクリプトは、サンドボックスの前提条件を通過した後でのみ `docker.sock` をマウントします。サンドボックスのセットアップを完了できない場合は、`agents.defaults.sandbox.mode` を `off` にリセットします。OpenClaw サンドボックスが有効なターンでは、Codex コードモードは無効になります（[サンドボックス化 § Docker バックエンド](/ja-JP/gateway/sandboxing#docker-backend)を参照）。ホストの Docker ソケットをエージェントサンドボックスコンテナにマウントしないでください。

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

  <Accordion title="openclaw-cli での Docker Desktop DNS 失敗">
    一部の Docker Desktop セットアップでは、`NET_RAW` が削除された後、共有ネットワークの `openclaw-cli` サイドカーからの DNS ルックアップに失敗し、`openclaw plugins install` のような npm に裏付けられたコマンド中に `EAI_AGAIN` として現れます。通常運用では、デフォルトの強化済み compose ファイルを維持してください。下のオーバーライドは `openclaw-cli` コンテナに対してのみデフォルトのケーパビリティを復元します。デフォルトの呼び出しとしてではなく、レジストリアクセスが必要な 1 回限りのコマンドに使用してください。

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    長時間実行される `openclaw-cli` コンテナをすでに作成している場合は、同じオーバーライドで再作成してください。`docker compose exec`/`docker exec` では、作成済みコンテナの Linux ケーパビリティを変更できません。

  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で権限エラーが表示される場合は、ホストの bind mount が uid 1000 に所有されていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同じ不一致は、`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` に続いて `plugin present but blocked` と表示される形でも現れることがあります。これは、プロセス uid とマウントされた Plugin ディレクトリの所有者が一致していないことを意味します。デフォルトの uid 1000 として実行し、bind mount の所有権を修正することを優先してください。OpenClaw を長期的に root として実行する意図がある場合にのみ、`/path/to/openclaw-config/npm` を `root:root` に chown してください。

  </Accordion>

  <Accordion title="より高速な再ビルド">
    ロックファイルが変更されない限り `pnpm install` の再実行を避けられるよう、依存関係レイヤーがキャッシュされる順序で Dockerfile を並べます。

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
    デフォルトイメージはセキュリティ優先で、非 root の `node` として実行されます。より機能の揃ったコンテナにするには:

    1. **`/home/node` を永続化する**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python 依存関係を焼き込む**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium を焼き込む**: `export OPENCLAW_INSTALL_BROWSER=1`、または公式の `-browser` イメージタグを使用します
    5. **または Playwright ブラウザを永続化されたボリュームにインストールする**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **ブラウザダウンロードを永続化する**: `OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使用します。OpenClaw は Linux 上でイメージの Playwright 管理 Chromium を自動検出します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (ヘッドレス Docker)">
    ウィザードで OpenAI Codex OAuth を選ぶと、ブラウザー URL が開きます。Docker またはヘッドレス構成では、遷移先の完全なリダイレクト URL をコピーし、ウィザードに貼り戻して認証を完了してください。
  </Accordion>

  <Accordion title="ベースイメージのメタデータ">
    ランタイムイメージは `node:24-bookworm-slim` を使用し、`tini` を PID 1 として実行するため、長時間実行されるコンテナーでゾンビプロセスが回収され、シグナルが正しく処理されます。`org.opencontainers.image.base.name` や `org.opencontainers.image.source` を含む OCI ベースイメージ注釈を公開します。Dependabot が固定された Node ベースダイジェストを更新します。リリースビルドでは、別個のディストリビューションアップグレードレイヤーは実行しません。[OCI イメージ注釈](https://github.com/opencontainers/image-spec/blob/main/annotations.md)を参照してください。
  </Accordion>
</AccordionGroup>

### VPS で実行しますか？

バイナリのベイク、永続化、更新を含む共有 VM デプロイ手順については、[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と [Docker VM ランタイム](/ja-JP/install/docker-vm-runtime)を参照してください。

## エージェントサンドボックス

Docker バックエンドで `agents.defaults.sandbox` が有効な場合、gateway 自体はホスト上に残したまま、Gateway はエージェントツール実行（シェル、ファイルの読み書きなど）を分離された Docker コンテナー内で実行します。これにより、Gateway 全体をコンテナー化せずに、信頼されていない、またはマルチテナントのエージェントセッションの周囲に強固な壁を作ります。

サンドボックスのスコープは、エージェント単位（デフォルト）、セッション単位、または共有にできます。各スコープには `/workspace` にマウントされた専用ワークスペースが割り当てられます。許可/拒否のツールポリシー、ネットワーク分離、リソース制限、ブラウザーコンテナーも設定できます。

完全な設定、イメージ、セキュリティメモ、マルチエージェントプロファイルについては、次を参照してください。

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナーへの対話型シェルアクセス
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

デフォルトのサンドボックスイメージをビルドします（ソースチェックアウトから）。

```bash
scripts/sandbox-setup.sh
```

ソースチェックアウトなしで npm インストールを使用する場合は、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)を参照してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージが見つからない、またはサンドボックスコンテナーが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（ソースチェックアウト）または [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)のインライン `docker build` コマンド（npm インストール）でサンドボックスイメージをビルドするか、`agents.defaults.sandbox.docker.image` をカスタムイメージに設定してください。コンテナーは必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="サンドボックスで権限エラーが発生する">
    `docker.user` を、マウントされたワークスペースの所有権と一致する UID:GID に設定するか、ワークスペースフォルダーを chown してください。
  </Accordion>

  <Accordion title="サンドボックスでカスタムツールが見つからない">
    OpenClaw は `sh -lc`（ログインシェル）でコマンドを実行します。これは `/etc/profile` を読み込み、PATH をリセットする場合があります。`docker.env.PATH` を設定してカスタムツールパスを前置するか、Dockerfile の `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM で kill された（exit 137）">
    VM には少なくとも 2 GB の RAM が必要です。より大きいマシンクラスを使用して再試行してください。
  </Accordion>

  <Accordion title="Control UI で未認可またはペアリングが必要と表示される">
    新しいダッシュボードリンクを取得し、ブラウザーデバイスを承認してください。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [ダッシュボード](/ja-JP/web/dashboard)、[デバイス](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway ターゲットが ws://172.x.x.x を表示する、または Docker CLI からペアリングエラーが出る">
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
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose コミュニティセットアップ
- [更新](/ja-JP/install/updating) — OpenClaw を最新の状態に保つ
- [設定](/ja-JP/gateway/configuration) — インストール後の gateway 設定

---
read_when:
    - ローカルインストールではなく、コンテナ化されたGatewayを使いたいです
    - Dockerフローを確認しています
summary: OpenClawの任意のDockerベースセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-04-21T04:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8d3e346ca60daa9908aef0846c9052321087af7dd2c919ce79de4d5925136a2
    source_path: install/docker.md
    workflow: 15
---

# Docker（任意）

Dockerは**任意**です。コンテナ化されたGatewayを使いたい場合、またはDockerフローを確認したい場合にのみ使用してください。

## Dockerは自分に合っているか？

- **はい**: 分離された使い捨てのGateway環境が欲しい、またはローカルインストールなしでOpenClawをホスト上で実行したい場合。
- **いいえ**: 自分のマシン上で実行し、最速の開発ループだけが欲しい場合。代わりに通常のインストールフローを使ってください。
- **サンドボックスに関する注記**: デフォルトのサンドボックスバックエンドは、サンドボックス有効時にDockerを使いますが、サンドボックスはデフォルトで無効であり、Gateway全体をDockerで動かす必要は**ありません**。SSHおよびOpenShellサンドボックスバックエンドも利用できます。詳しくは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

## 前提条件

- Docker Desktop（またはDocker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも2 GBのRAM（1 GBホストでは `pnpm install` が終了コード137でOOM killされる場合があります）
- イメージとログのための十分なディスク容量
- VPS/公開ホストで実行する場合は、[ネットワーク公開向けセキュリティ強化](/ja-JP/gateway/security) を確認してください。特にDockerの `DOCKER-USER` ファイアウォールポリシーを確認してください。

## コンテナ化されたGateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します:

    ```bash
    ./scripts/docker/setup.sh
    ```

    これでGatewayイメージがローカルでビルドされます。代わりにビルド済みイメージを使うには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージは [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) で公開されています。  
    一般的なタグ: `main`, `latest`, `<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトは自動的にオンボーディングを実行します。次のことを行います:

    - プロバイダAPIキーの入力を求める
    - Gatewayトークンを生成して `.env` に書き込む
    - Docker Compose経由でGatewayを起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは `openclaw-gateway` を直接通して実行されます。`openclaw-cli` は、Gatewayコンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UIを開く">
    ブラウザで `http://127.0.0.1:18789/` を開き、設定された共有シークレットをSettingsに貼り付けます。セットアップスクリプトはデフォルトでトークンを `.env` に書き込みます。コンテナ設定をパスワード認証に切り替えた場合は、そのパスワードを代わりに使ってください。

    URLをもう一度確認したいですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャネルを設定する（任意）">
    CLIコンテナを使ってメッセージングチャネルを追加します:

    ```bash
    # WhatsApp（QR）
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

セットアップスクリプトを使わず、各手順を自分で実行したい場合:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
リポジトリルートから `docker compose` を実行してください。`OPENCLAW_EXTRA_MOUNTS` または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml` を書き込みます。`-f docker-compose.yml -f docker-compose.extra.yml` でそれを含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、起動後ツールです。`docker compose up -d openclaw-gateway` の前に、オンボーディングとセットアップ時の設定書き込みは `--no-deps --entrypoint node` を付けて `openclaw-gateway` 経由で実行してください。
</Note>

### 環境変数

セットアップスクリプトは次の任意の環境変数を受け付けます:

| 変数 | 目的 |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE` | ローカルビルドの代わりにリモートイメージを使う |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ビルド中に追加のaptパッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS` | ビルド時に拡張機能の依存関係を事前インストールする（スペース区切りの名前） |
| `OPENCLAW_EXTRA_MOUNTS` | 追加のホストbind mount（カンマ区切り `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME` | `/home/node` を名前付きDockerボリュームに永続化する |
| `OPENCLAW_SANDBOX` | サンドボックスのブートストラップにオプトインする（`1`, `true`, `yes`, `on`） |
| `OPENCLAW_DOCKER_SOCKET` | Dockerソケットパスを上書きする |

### ヘルスチェック

コンテナのプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Dockerイメージには、`/healthz` をpingする組み込みの `HEALTHCHECK` が含まれています。  
チェックが失敗し続ける場合、Dockerはコンテナを `unhealthy` とマークし、オーケストレーションシステムは再起動または置き換えを行えます。

認証付きの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN と loopback

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を設定するため、Dockerのポート公開でホストから `http://127.0.0.1:18789` にアクセスできます。

- `lan`（デフォルト）: ホストブラウザとホストCLIが公開されたGatewayポートに到達できます。
- `loopback`: コンテナのネットワーク名前空間内のプロセスだけがGatewayに直接到達できます。

<Note>
`0.0.0.0` や `127.0.0.1` のようなホスト別名ではなく、`gateway.bind` のbind mode値（`lan` / `loopback` / `custom` / `tailnet` / `auto`）を使ってください。
</Note>

### ストレージと永続化

Docker Composeは `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` にbind mountするため、これらのパスはコンテナ置き換え後も維持されます。

そのマウントされた設定ディレクトリには、OpenClawの次の内容が保存されます:

- 動作設定用の `openclaw.json`
- 保存済みプロバイダOAuth/APIキー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` など環境変数ベース実行時シークレット用の `.env`

VMデプロイでの永続化の詳細は、[Docker VM Runtime - What persists where](/ja-JP/install/docker-vm-runtime#what-persists-where) を参照してください。

**ディスク増加のホットスポット:** `media/`、セッションJSONLファイル、`cron/runs/*.jsonl`、および `/tmp/openclaw/` 配下のローテーションファイルログに注意してください。

### シェルヘルパー（任意）

日常的なDocker管理を簡単にするには、`ClawDock` をインストールしてください:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` のrawパスからClawDockをインストールしていた場合は、上のインストールコマンドを再実行して、ローカルのヘルパーファイルが新しい場所を追従するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使います。すべてのコマンドは `clawdock-help` を実行してください。  
完全なヘルパーガイドは [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker Gatewayのエージェントサンドボックスを有効にする">
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

    スクリプトは、サンドボックス前提条件が通った後にだけ `docker.sock` をマウントします。サンドボックスセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode` を `off` に戻します。

  </Accordion>

  <Accordion title="自動化 / CI（非対話）">
    Composeの疑似TTY割り当てを `-T` で無効にします:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティに関する注記">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使うため、CLIコマンドは `127.0.0.1` 経由でGatewayに到達できます。これは共有信頼境界として扱ってください。compose設定では、`openclaw-cli` 上で `NET_RAW` / `NET_ADMIN` を削除し、`no-new-privileges` を有効にしています。
  </Accordion>

  <Accordion title="権限とEACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で権限エラーが出る場合は、ホストのbind mountがuid 1000の所有になっていることを確認してください:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="より高速な再ビルド">
    依存関係レイヤがキャッシュされるようにDockerfileを並べてください。これにより、lockfileが変わらない限り `pnpm install` の再実行を避けられます:

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
    デフォルトイメージはセキュリティ優先で、非rootの `node` として実行されます。よりフル機能のコンテナにするには:

    1. **`/home/node` を永続化する**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwrightブラウザをインストールする**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **ブラウザダウンロードを永続化する**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定し、`OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使います。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレスDocker）">
    ウィザードでOpenAI Codex OAuthを選ぶと、ブラウザURLが開きます。Dockerまたはヘッドレス環境では、遷移先の完全なリダイレクトURLをコピーして、認証完了のためにウィザードへ貼り戻してください。
  </Accordion>

  <Accordion title="ベースイメージメタデータ">
    メインのDockerイメージは `node:24-bookworm` を使い、`org.opencontainers.image.base.name`、`org.opencontainers.image.source` などを含むOCIベースイメージ注釈を公開します。詳しくは [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md) を参照してください。
  </Accordion>
</AccordionGroup>

### VPSで実行する場合

バイナリの焼き込み、永続化、更新を含む共有VMデプロイ手順は、[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と [Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## エージェントサンドボックス

Dockerバックエンドで `agents.defaults.sandbox` が有効な場合、Gateway自体はホスト上に残ったまま、エージェントのツール実行（シェル、ファイル読み書きなど）を分離されたDockerコンテナ内で実行します。これにより、信頼できないエージェントセッションやマルチテナントのエージェントセッションに対して、Gateway全体をコンテナ化せずに強い隔離境界を得られます。

サンドボックスのスコープは、エージェント単位（デフォルト）、セッション単位、または共有にできます。各スコープは `/workspace` にマウントされる独自のワークスペースを持ちます。ツールの許可/拒否ポリシー、ネットワーク分離、リソース制限、ブラウザコンテナも設定できます。

完全な設定、イメージ、セキュリティ注記、マルチエージェントプロファイルについては:

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全なサンドボックスリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- サンドボックスコンテナへの対話型シェルアクセス
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書き

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

デフォルトのサンドボックスイメージをビルドします:

```bash
scripts/sandbox-setup.sh
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージが見つからない、またはサンドボックスコンテナが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    を使ってサンドボックスイメージをビルドするか、`agents.defaults.sandbox.docker.image` にカスタムイメージを設定してください。
    コンテナは必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="サンドボックス内で権限エラーが出る">
    マウントされたワークスペースの所有権に一致するUID:GIDに `docker.user` を設定するか、ワークスペースフォルダを `chown` してください。
  </Accordion>

  <Accordion title="サンドボックス内でカスタムツールが見つからない">
    OpenClawは `sh -lc`（ログインシェル）でコマンドを実行するため、`/etc/profile` を読み込み、PATHがリセットされることがあります。`docker.env.PATH` を設定してカスタムツールのパスを先頭追加するか、Dockerfile内で `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中にOOM killされる（終了コード137）">
    VMには少なくとも2 GBのRAMが必要です。より大きいマシンクラスを使って再試行してください。
  </Accordion>

  <Accordion title="Control UIでUnauthorizedまたはペアリング必須と表示される">
    新しいダッシュボードリンクを取得し、ブラウザデバイスを承認してください:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [Dashboard](/web/dashboard), [Devices](/cli/devices)。

  </Accordion>

  <Accordion title="Gatewayターゲットがws://172.x.x.xと表示される、またはDocker CLIからペアリングエラーが出る">
    Gateway modeとbindをリセットしてください:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Dockerの代替としてのPodman
- [ClawDock](/ja-JP/install/clawdock) — Docker Composeのコミュニティセットアップ
- [Updating](/ja-JP/install/updating) — OpenClawを最新の状態に保つ
- [Configuration](/ja-JP/gateway/configuration) — インストール後のGateway設定

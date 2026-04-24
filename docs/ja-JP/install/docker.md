---
read_when:
    - ローカルインストールの代わりにコンテナ化されたgatewayを使いたい場合
    - Dockerフローを検証している場合
summary: OpenClaw向けの任意のDockerベースセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-04-24T05:03:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Dockerは**任意**です。コンテナ化されたgatewayが必要な場合、またはDockerフローを検証したい場合にのみ使用してください。

## Dockerは自分に合っているか？

- **はい**: 分離された使い捨てのgateway環境が欲しい、またはローカルインストールなしのホストでOpenClawを実行したい。
- **いいえ**: 自分のマシン上で実行していて、最速の開発ループが欲しいだけの場合。代わりに通常のインストールフローを使ってください。
- **サンドボックスに関する注意**: デフォルトのサンドボックスバックエンドは、サンドボックスが有効な場合にDockerを使用しますが、サンドボックスはデフォルトでオフであり、gateway全体をDockerで動かす必要は**ありません**。SSHおよびOpenShellサンドボックスバックエンドも利用できます。[Sandboxing](/ja-JP/gateway/sandboxing)を参照してください。

## 前提条件

- Docker Desktop（またはDocker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも2 GB RAM（1 GBホストでは`pnpm install`がexit 137でOOM killされることがあります）
- イメージとログのための十分なディスク容量
- VPS/公開ホスト上で実行する場合は、
  [Security hardening for network exposure](/ja-JP/gateway/security)、
  特にDockerの`DOCKER-USER`ファイアウォールポリシーを確認してください。

## コンテナ化されたGateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します。

    ```bash
    ./scripts/docker/setup.sh
    ```

    これによりgatewayイメージがローカルでビルドされます。代わりにビルド済みイメージを使うには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)で公開されています。
    一般的なタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングも自動で実行します。これにより次が行われます。

    - プロバイダーAPI keyを尋ねる
    - gatewayトークンを生成して`.env`へ書き込む
    - Docker Compose経由でgatewayを起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway`を直接経由して実行されます。`openclaw-cli`は、
    gatewayコンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UIを開く">
    ブラウザーで`http://127.0.0.1:18789/`を開き、設定済みの
    共有シークレットをSettingsに貼り付けてください。セットアップスクリプトはデフォルトで
    トークンを`.env`へ書き込みます。コンテナ設定をpassword認証へ切り替えた場合は、
    代わりにそのpasswordを使用してください。

    URLをもう一度確認したいですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャネルを設定する（任意）">
    CLIコンテナを使ってメッセージングチャネルを追加します。

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

セットアップスクリプトを使わず、各ステップを自分で実行したい場合:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose`はリポジトリルートから実行してください。`OPENCLAW_EXTRA_MOUNTS`
または`OPENCLAW_HOME_VOLUME`を有効にした場合、セットアップスクリプトは`docker-compose.extra.yml`を書き出します。`-f docker-compose.yml -f docker-compose.extra.yml`でそれも含めてください。
</Note>

<Note>
`openclaw-cli`は`openclaw-gateway`のネットワーク名前空間を共有するため、
起動後ツールです。`docker compose up -d openclaw-gateway`の前には、オンボーディング
およびセットアップ時の設定書き込みを、`--no-deps --entrypoint node`付きの
`openclaw-gateway`経由で実行してください。
</Note>

### 環境変数

セットアップスクリプトは、以下の任意の環境変数を受け付けます。

| 変数 | 用途 |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | ローカルビルドの代わりにリモートイメージを使う |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ビルド中に追加のaptパッケージをインストールする（空白区切り） |
| `OPENCLAW_EXTENSIONS`          | ビルド時にPlugin依存関係を事前インストールする（空白区切り名） |
| `OPENCLAW_EXTRA_MOUNTS`        | 追加のホストbind mount（カンマ区切りの`source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME`         | `/home/node`を名前付きDocker volumeに永続化する |
| `OPENCLAW_SANDBOX`             | サンドボックスbootstrapへオプトインする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET`       | Docker socketパスを上書きする |

### ヘルスチェック

コンテナのプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Dockerイメージには、`/healthz`へpingする組み込みの`HEALTHCHECK`が含まれています。
チェックが失敗し続けると、Dockerはコンテナを`unhealthy`としてマークし、
オーケストレーションシステムは再起動または置き換えを行えます。

認証付きの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN対loopback

`scripts/docker/setup.sh`は、Dockerのポート公開で
`http://127.0.0.1:18789`へのホストアクセスが動作するよう、デフォルトで`OPENCLAW_GATEWAY_BIND=lan`を設定します。

- `lan`（デフォルト）: ホストブラウザーとホストCLIが公開されたgatewayポートへ到達できます。
- `loopback`: コンテナのネットワーク名前空間内のプロセスだけが
  gatewayへ直接到達できます。

<Note>
`0.0.0.0`や`127.0.0.1`のようなホストエイリアスではなく、`gateway.bind`にはbind mode値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使ってください。
</Note>

### ストレージと永続化

Docker Composeは、`OPENCLAW_CONFIG_DIR`を`/home/node/.openclaw`へ、
`OPENCLAW_WORKSPACE_DIR`を`/home/node/.openclaw/workspace`へbind mountするため、
これらのパスはコンテナの置き換え後も保持されます。

このマウントされた設定ディレクトリには、OpenClawが次を保持します。

- 動作設定用の`openclaw.json`
- 保存されたプロバイダーOAuth/API-key認証用の`agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN`のようなenvバックランタイムシークレット用の`.env`

VMデプロイでの完全な永続化の詳細については、
[Docker VM Runtime - What persists where](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

**ディスク増加のホットスポット:** `media/`、セッションJSONLファイル、`cron/runs/*.jsonl`、
および`/tmp/openclaw/`配下のローテーションファイルログを監視してください。

### シェルヘルパー（任意）

日常的なDocker管理を簡単にするには、`ClawDock`をインストールします。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い`scripts/shell-helpers/clawdock-helpers.sh`のrawパスからClawDockをインストールしていた場合は、上記のインストールコマンドを再実行して、ローカルヘルパーファイルが新しい場所を追従するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard`などを使います。すべてのコマンドは
`clawdock-help`で確認できます。
完全なヘルパーガイドについては[ClawDock](/ja-JP/install/clawdock)を参照してください。

<AccordionGroup>
  <Accordion title="Docker gatewayでエージェントサンドボックスを有効にする">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    カスタムsocketパス（例: rootless Docker）:

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    このスクリプトは、サンドボックス前提条件を満たした後にのみ`docker.sock`をマウントします。
    サンドボックスセットアップが完了できない場合、スクリプトは`agents.defaults.sandbox.mode`
    を`off`へリセットします。

  </Accordion>

  <Accordion title="自動化 / CI（非対話型）">
    Composeの疑似TTY割り当てを`-T`で無効化します。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティに関する注意">
    `openclaw-cli`は`network_mode: "service:openclaw-gateway"`を使用するため、CLI
    コマンドは`127.0.0.1`経由でgatewayへ到達できます。これを共有された
    信頼境界として扱ってください。compose設定では、`openclaw-cli`上で`NET_RAW`/`NET_ADMIN`を削除し、
    `no-new-privileges`を有効化しています。
  </Accordion>

  <Accordion title="権限とEACCES">
    このイメージは`node`（uid 1000）として実行されます。`/home/node/.openclaw`で権限エラーが
    出る場合は、ホストのbind mountがuid 1000所有になっていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="より速い再ビルド">
    Dockerfileでは依存レイヤーがキャッシュされるよう順序を工夫してください。これにより
    lockfileが変わらない限り`pnpm install`の再実行を避けられます。

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
    デフォルトイメージはセキュリティ優先で、非rootの`node`として動作します。より
    フル機能なコンテナにするには:

    1. **`/home/node`を永続化する**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwrightブラウザーをインストールする**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **ブラウザーダウンロードを永続化する**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`を設定し、
       `OPENCLAW_HOME_VOLUME`または`OPENCLAW_EXTRA_MOUNTS`を使用します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレスDocker）">
    ウィザードでOpenAI Codex OAuthを選ぶと、ブラウザーURLが開きます。
    Dockerまたはヘッドレス環境では、最終的に到達した完全なリダイレクトURLをコピーし、
    認証完了のためにそれをウィザードへ貼り戻してください。
  </Accordion>

  <Accordion title="ベースイメージメタデータ">
    メインDockerイメージは`node:24-bookworm`を使用し、
    `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source`などを含むOCIベースイメージ
    アノテーションを公開します。参照:
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### VPS上で実行する場合

共有VMデプロイ手順（バイナリの組み込み、永続化、更新を含む）については、
[Hetzner (Docker VPS)](/ja-JP/install/hetzner)および
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime)を参照してください。

## エージェントサンドボックス

Dockerバックエンドで`agents.defaults.sandbox`が有効な場合、gateway
自体はホスト上に留まりつつ、エージェントのツール実行（shell、file read/writeなど）を分離されたDocker
コンテナ内で実行します。これにより、信頼できない、またはマルチテナントのエージェントセッションの周囲に
強固な壁を作れます。gateway全体をコンテナ化する必要はありません。

サンドボックススコープは、エージェントごと（デフォルト）、セッションごと、または共有にできます。各スコープは
`/workspace`へマウントされる独自のワークスペースを持ちます。さらに、
ツールのallow/denyポリシー、ネットワーク分離、リソース制限、ブラウザー
コンテナも設定できます。

完全な設定、イメージ、セキュリティに関する注意、およびマルチエージェントプロファイルについては、参照してください:

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

デフォルトのサンドボックスイメージをビルドします。

```bash
scripts/sandbox-setup.sh
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    サンドボックスイメージを
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    でビルドするか、`agents.defaults.sandbox.docker.image`を
    自分のカスタムイメージに設定してください。
    コンテナは必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    `docker.user`を、マウントされたワークスペース所有権に一致するUID:GIDへ設定するか、
    ワークスペースフォルダーをchownしてください。
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClawはコマンドを`sh -lc`（login shell）で実行するため、
    `/etc/profile`を読み込み、PATHをリセットすることがあります。カスタム
    ツールパスを先頭追加するよう`docker.env.PATH`を設定するか、Dockerfile内の
    `/etc/profile.d/`配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VMには少なくとも2 GB RAMが必要です。より大きいマシンクラスを使って再試行してください。
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    新しいダッシュボードリンクを取得し、ブラウザーデバイスを承認してください。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [Dashboard](/ja-JP/web/dashboard)、[Devices](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    gatewayモードとbindをリセットしてください。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Dockerの代替となるPodman
- [ClawDock](/ja-JP/install/clawdock) — Docker Composeコミュニティセットアップ
- [Updating](/ja-JP/install/updating) — OpenClawを最新状態に保つ
- [Configuration](/ja-JP/gateway/configuration) — インストール後のgateway設定

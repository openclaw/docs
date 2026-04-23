---
read_when:
    - ローカルインストールの代わりにコンテナ化された Gateway を使いたい場合
    - Docker フローを検証している場合
summary: OpenClaw の任意の Docker ベースセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-04-23T14:04:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker（任意）

Docker は**任意**です。コンテナ化された Gateway が必要な場合、または Docker フローを検証したい場合にのみ使用してください。

## Docker は自分に合っているか？

- **はい**: 分離された使い捨ての Gateway 環境が欲しい、またはローカルインストールなしで host 上で OpenClaw を動かしたい。
- **いいえ**: 自分のマシン上で動かしていて、ただ最速の開発ループが欲しい。通常のインストールフローを使ってください。
- **Sandboxing に関する注意**: デフォルトの sandbox バックエンドは sandboxing が有効なときに Docker を使いますが、sandboxing はデフォルトで無効であり、Gateway 全体を Docker 上で動かす必要は**ありません**。SSH と OpenShell の sandbox バックエンドも利用できます。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に最低 2 GB RAM（1 GB host では `pnpm install` が exit 137 で OOM kill されることがあります）
- イメージとログに十分なディスク容量
- VPS/公開 host 上で動かす場合は、
  [ネットワーク公開に対するセキュリティ強化](/ja-JP/gateway/security) を確認してください。
  特に Docker `DOCKER-USER` firewall policy を確認してください。

## コンテナ化された Gateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します:

    ```bash
    ./scripts/docker/setup.sh
    ```

    これにより Gateway イメージがローカルでビルドされます。代わりにビルド済みイメージを使うには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    で公開されています。
    よく使うタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトはオンボーディングを自動で実行します。内容は次のとおりです:

    - provider API key の入力を促す
    - gateway token を生成して `.env` に書き込む
    - Docker Compose 経由で Gateway を起動する

    セットアップ中は、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接通して実行されます。`openclaw-cli` は、
    Gateway container がすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    browser で `http://127.0.0.1:18789/` を開き、Settings に設定済みの
    共有 secret を貼り付けます。セットアップスクリプトはデフォルトで token を `.env` に書き込みます。
    container 設定を password 認証に切り替えた場合は、代わりにその
    password を使ってください。

    URL をもう一度確認したいですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャンネルを設定する（任意）">
    CLI container を使って messaging channel を追加します:

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

セットアップスクリプトの代わりに各手順を自分で実行したい場合:

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
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml`
を書き出します。`-f docker-compose.yml -f docker-compose.extra.yml` で含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` の network namespace を共有するため、
起動後のツールです。`docker compose up -d openclaw-gateway` の前は、オンボーディング
とセットアップ時の設定書き込みを `openclaw-gateway` に対して
`--no-deps --entrypoint node` 付きで実行してください。
</Note>

### 環境変数

セットアップスクリプトは、次の任意の環境変数を受け付けます:

| 変数 | 用途 |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE` | ローカルビルドの代わりにリモートイメージを使用する |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ビルド中に追加の apt package をインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS` | ビルド時に plugin 依存関係を事前インストールする（スペース区切りの名前） |
| `OPENCLAW_EXTRA_MOUNTS` | 追加の host bind mount（カンマ区切りの `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME` | 名前付き Docker volume で `/home/node` を永続化する |
| `OPENCLAW_SANDBOX` | sandbox bootstrap に opt in する（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET` | Docker socket path を上書きする |

### ヘルスチェック

container の probe endpoint（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker イメージには `/healthz` を ping する組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続けると、Docker は container を `unhealthy` とマークし、
オーケストレーションシステムは再起動または置き換えを行えます。

認証付きの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN と loopback

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` にするため、
Docker のポート公開で host から `http://127.0.0.1:18789` にアクセスできます。

- `lan`（デフォルト）: host browser と host CLI が公開された Gateway port に到達できます。
- `loopback`: container network namespace 内の process のみが
  Gateway に直接到達できます。

<Note>
bind モードの値には `gateway.bind` の値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使ってください。`0.0.0.0` や `127.0.0.1` のような host エイリアスは使わないでください。
</Note>

### ストレージと永続化

Docker Compose は `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` に bind mount するため、
これらの path は container の置き換え後も維持されます。

この mount された設定ディレクトリには、OpenClaw が次を保存します:

- 動作設定用の `openclaw.json`
- 保存された provider OAuth/API-key 認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` のような env ベースのランタイム secret 用の `.env`

VM デプロイメントにおける永続化の詳細は、
[Docker VM Runtime - What persists where](/ja-JP/install/docker-vm-runtime#what-persists-where)
を参照してください。

**ディスク増加のホットスポット:** `media/`、session JSONL ファイル、`cron/runs/*.jsonl`、
および `/tmp/openclaw/` 配下のローテーションファイルログを監視してください。

### シェルヘルパー（任意）

日常的な Docker 管理を簡単にするには、`ClawDock` をインストールします:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` の raw path から ClawDock をインストールしていた場合は、
上記のインストールコマンドを再実行して、ローカルの helper file が新しい場所を追従するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使えます。すべてのコマンドは
`clawdock-help` を実行してください。
完全な helper ガイドは [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker Gateway 用に agent sandbox を有効にする">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    カスタム socket path（例: rootless Docker）:

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    スクリプトは、sandbox の前提条件が通った後でのみ `docker.sock` を mount します。
    sandbox セットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` に戻します。

  </Accordion>

  <Accordion title="自動化 / CI（非対話）">
    Compose の疑似 TTY 割り当てを `-T` で無効にします:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティに関する注意">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使うため、CLI
    コマンドは `127.0.0.1` 経由で Gateway に到達できます。これを共有
    trust boundary として扱ってください。compose 設定では `NET_RAW`/`NET_ADMIN` を削除し、
    `openclaw-cli` で `no-new-privileges` を有効にしています。
  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で
    権限エラーが出る場合は、host の bind mount が uid 1000 所有であることを確認してください:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="より高速な再ビルド">
    依存関係レイヤーがキャッシュされるように Dockerfile の順序を構成してください。これにより、
    lockfile が変わらない限り `pnpm install` の再実行を避けられます:

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

  <Accordion title="上級者向け container オプション">
    デフォルトイメージはセキュリティ優先で、非 root の `node` として実行されます。より高機能な container にするには:

    1. **`/home/node` を永続化する**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright browser をインストールする**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **browser ダウンロードを永続化する**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`
       を設定し、`OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使用します。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレス Docker）">
    ウィザードで OpenAI Codex OAuth を選ぶと、browser URL が開きます。Docker やヘッドレス環境では、
    遷移先の完全な redirect URL をコピーしてウィザードに貼り戻し、認証を完了してください。
  </Accordion>

  <Accordion title="ベースイメージ metadata">
    メイン Docker イメージは `node:24-bookworm` を使用し、
    `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` などを含む OCI ベースイメージ
    annotation を公開します。詳細は
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md) を参照してください。
  </Accordion>
</AccordionGroup>

### VPS 上で動かす場合は？

共有 VM デプロイ手順（バイナリの焼き込み、永続化、更新を含む）については
[Hetzner (Docker VPS)](/ja-JP/install/hetzner) と
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。

## Agent Sandbox

Docker バックエンドで `agents.defaults.sandbox` を有効にすると、Gateway 自体は host 上に残したまま、
agent tool 実行（shell、file read/write など）を分離された Docker
container 内で実行します。これにより、Gateway 全体をコンテナ化しなくても、
信頼できない agent セッションやマルチテナント agent セッションの周囲に強固な境界を設けられます。

sandbox のスコープは agent ごと（デフォルト）、セッションごと、または共有にできます。各スコープは
`/workspace` に mount された独自の workspace を持ちます。さらに、
allow/deny tool ポリシー、ネットワーク分離、リソース制限、browser
container も設定できます。

完全な設定、イメージ、セキュリティ上の注意点、マルチ agent プロファイルについては:

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全な sandbox リファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- sandbox container への対話的 shell アクセス
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

デフォルトの sandbox イメージをビルドします:

```bash
scripts/sandbox-setup.sh
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージがない、または sandbox container が起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    で sandbox イメージをビルドするか、`agents.defaults.sandbox.docker.image` を
    独自のイメージに設定してください。
    container は必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="sandbox 内で権限エラーが出る">
    `docker.user` を、mount された workspace の所有権に一致する UID:GID に設定するか、
    workspace フォルダーを `chown` してください。
  </Accordion>

  <Accordion title="sandbox 内でカスタム tools が見つからない">
    OpenClaw はコマンドを `sh -lc`（login shell）で実行するため、
    `/etc/profile` を読み込み、PATH をリセットする場合があります。`docker.env.PATH` を設定して
    カスタム tool path を先頭に追加するか、Dockerfile 内で `/etc/profile.d/` 配下に
    スクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中に OOM kill される（exit 137）">
    VM には最低 2 GB RAM が必要です。より大きいマシンクラスを使って再試行してください。
  </Accordion>

  <Accordion title="Control UI で Unauthorized または pairing required が表示される">
    新しい dashboard link を取得し、browser device を承認してください:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [Dashboard](/ja-JP/web/dashboard), [Devices](/ja-JP/cli/devices).

  </Accordion>

  <Accordion title="Gateway target が ws://172.x.x.x を表示する、または Docker CLI から pairing error が出る">
    Gateway mode と bind をリセットします:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替としての Podman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose のコミュニティセットアップ
- [Updating](/ja-JP/install/updating) — OpenClaw を最新状態に保つ
- [Configuration](/ja-JP/gateway/configuration) — インストール後の Gateway 設定

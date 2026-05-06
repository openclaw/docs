---
read_when:
    - GCP で OpenClaw を 24時間365日稼働させたい場合
    - 自分の VM 上で、本番グレードの常時稼働 Gateway を使いたい場合
    - 永続化、バイナリ、再起動動作を完全に制御したい
summary: GCP Compute Engine VM (Docker) で永続化された状態を使って OpenClaw Gateway を 24/7 稼働させる
title: GCP
x-i18n:
    generated_at: "2026-05-06T17:57:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 678253bd90f0694668400ffddba957e442f8aaed3f5308af3c2481940e104733
    source_path: install/gcp.md
    workflow: 16
---

Docker を使用して、GCP Compute Engine VM 上で永続的な OpenClaw Gateway を実行します。耐久性のある状態、組み込み済みのバイナリ、安全な再起動動作を備えます。

「月額約 $5-12 で OpenClaw を 24/7 稼働」させたい場合、これは Google Cloud 上で信頼性の高いセットアップです。
料金はマシンタイプとリージョンによって異なります。ワークロードに合う最小の VM を選び、OOM が発生したらスケールアップしてください。

## 何をするのか（簡単に）？

- GCP プロジェクトを作成して課金を有効にする
- Compute Engine VM を作成する
- Docker（分離されたアプリ実行環境）をインストールする
- Docker で OpenClaw Gateway を起動する
- ホスト上で `~/.openclaw` + `~/.openclaw/workspace` を永続化する（再起動や再ビルド後も残る）
- ラップトップから SSH トンネル経由で Control UI にアクセスする

マウントされた `~/.openclaw` 状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、および `.env` が含まれます。

Gateway には次の方法でアクセスできます。

- ラップトップからの SSH ポートフォワーディング
- ファイアウォール設定とトークンを自分で管理する場合の直接ポート公開

このガイドでは GCP Compute Engine 上の Debian を使用します。
Ubuntu でも動作します。パッケージは適宜読み替えてください。
汎用的な Docker フローについては、[Docker](/ja-JP/install/docker) を参照してください。

---

## クイックパス（経験のある運用者向け）

1. GCP プロジェクトを作成し、Compute Engine API を有効にする
2. Compute Engine VM を作成する（e2-small、Debian 12、20GB）
3. VM に SSH する
4. Docker をインストールする
5. OpenClaw リポジトリをクローンする
6. 永続的なホストディレクトリを作成する
7. `.env` と `docker-compose.yml` を設定する
8. 必要なバイナリを組み込み、ビルドして起動する

---

## 必要なもの

- GCP アカウント（e2-micro の無料枠対象）
- gcloud CLI のインストール（または Cloud Console を使用）
- ラップトップからの SSH アクセス
- SSH とコピー＆ペーストの基本的な扱いに慣れていること
- 約 20〜30 分
- Docker と Docker Compose
- モデル認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI をインストールする（または Console を使用する）">
    **オプション A: gcloud CLI**（自動化に推奨）

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) からインストールします。

    初期化して認証します。

    ```bash
    gcloud init
    gcloud auth login
    ```

    **オプション B: Cloud Console**

    すべての手順は [https://console.cloud.google.com](https://console.cloud.google.com) の Web UI から実行できます。

  </Step>

  <Step title="GCP プロジェクトを作成する">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) で課金を有効にします（Compute Engine に必要）。

    Compute Engine API を有効にします。

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM & Admin > Create Project に移動する
    2. 名前を付けて作成する
    3. プロジェクトの課金を有効にする
    4. APIs & Services > Enable APIs に移動し、「Compute Engine API」を検索して有効にする

  </Step>

  <Step title="VM を作成する">
    **マシンタイプ:**

    | 種類      | 仕様                    | コスト               | 備考                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | 月額約 $25            | ローカル Docker ビルドで最も信頼性が高い        |
    | e2-small  | 2 vCPU, 2GB RAM          | 月額約 $12            | Docker ビルドに推奨される最小構成         |
    | e2-micro  | 2 vCPU (shared), 1GB RAM | 無料枠対象 | Docker ビルドで OOM（exit 137）になりやすい |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Compute Engine > VM instances > Create instance に移動する
    2. 名前: `openclaw-gateway`
    3. リージョン: `us-central1`、ゾーン: `us-central1-a`
    4. マシンタイプ: `e2-small`
    5. ブートディスク: Debian 12、20GB
    6. 作成する

  </Step>

  <Step title="VM に SSH する">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine ダッシュボードで VM の横にある「SSH」ボタンをクリックします。

    注: SSH 鍵の反映には VM 作成後 1〜2 分かかることがあります。接続が拒否された場合は、待ってから再試行してください。

  </Step>

  <Step title="Docker をインストールする（VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    グループ変更を反映するためにログアウトして再ログインします。

    ```bash
    exit
    ```

    その後、再度 SSH します。

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    確認します。

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw リポジトリをクローンする">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    このガイドでは、バイナリの永続性を保証するためにカスタムイメージをビルドすることを前提としています。

  </Step>

  <Step title="永続的なホストディレクトリを作成する">
    Docker コンテナは一時的なものです。
    長期間保持する状態はすべてホスト上に置く必要があります。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリルートに `.env` を作成します。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    安定した Gateway
    トークンを `.env` 経由で管理したい場合は `OPENCLAW_GATEWAY_TOKEN` を設定します。そうでない場合は、再起動をまたいでクライアントを利用する前に `gateway.auth.token` を設定してください。どちらのソースも存在しない場合、OpenClaw はその起動時のみ有効なランタイムトークンを使用します。キーリングパスワードを生成して
    `GOG_KEYRING_PASSWORD` に貼り付けます。

    ```bash
    openssl rand -hex 32
    ```

    **このファイルをコミットしないでください。**

    この `.env` ファイルは、`OPENCLAW_GATEWAY_TOKEN` などのコンテナ/ランタイム環境変数用です。
    保存されたプロバイダー OAuth/API キー認証は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に格納されます。

  </Step>

  <Step title="Docker Compose 設定">
    `docker-compose.yml` を作成または更新します。

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` はブートストラップ時の利便性のためだけのもので、適切な Gateway 設定の代替ではありません。認証（`gateway.auth.token` またはパスワード）は必ず設定し、デプロイに対して安全なバインド設定を使用してください。

  </Step>

  <Step title="共有 Docker VM ランタイム手順">
    一般的な Docker ホストフローには、共有ランタイムガイドを使用してください。

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 固有の起動メモ">
    GCP で、`pnpm install --frozen-lockfile` 中にビルドが `Killed` または `exit code 137` で失敗する場合、VM のメモリが不足しています。最小でも `e2-small` を使用するか、初回ビルドの信頼性を高めるには `e2-medium` を使用してください。

    LAN にバインドする場合（`OPENCLAW_GATEWAY_BIND=lan`）、続行する前に信頼済みブラウザーオリジンを設定します。

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Gateway ポートを変更した場合は、`18789` を設定したポートに置き換えてください。

  </Step>

  <Step title="ラップトップからアクセスする">
    Gateway ポートを転送する SSH トンネルを作成します。

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    ブラウザーで開きます。

    `http://127.0.0.1:18789/`

    クリーンなダッシュボードリンクを再表示します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI が共有シークレット認証を求める場合は、設定済みのトークンまたは
    パスワードを Control UI 設定に貼り付けます。この Docker フローはデフォルトでトークンを書き込みます。コンテナ設定をパスワード認証に切り替えた場合は、代わりにその
    パスワードを使用してください。

    Control UI に `unauthorized` または `disconnected (1008): pairing required` が表示される場合は、ブラウザーデバイスを承認します。

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    共有永続化と更新のリファレンスをもう一度確認する必要がありますか？
    [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) と [Docker VM Runtime の更新](/ja-JP/install/docker-vm-runtime#updates) を参照してください。

  </Step>
</Steps>

---

## トラブルシューティング

**SSH 接続が拒否される**

SSH 鍵の反映には VM 作成後 1〜2 分かかることがあります。待ってから再試行してください。

**OS Login の問題**

OS Login プロファイルを確認します。

```bash
gcloud compute os-login describe-profile
```

アカウントに必要な IAM 権限（Compute OS Login または Compute OS Admin Login）があることを確認してください。

**メモリ不足（OOM）**

Docker ビルドが `Killed` と `exit code 137` で失敗する場合、VM は OOM-killed されています。e2-small（最小）または e2-medium（信頼性の高いローカルビルドに推奨）にアップグレードしてください。

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## サービスアカウント（セキュリティのベストプラクティス）

個人利用では、デフォルトのユーザーアカウントで問題ありません。

自動化または CI/CD パイプラインでは、最小権限の専用サービスアカウントを作成します。

1. サービスアカウントを作成します。

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin ロール（またはより狭いカスタムロール）を付与します。

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

自動化には Owner ロールの使用を避けてください。最小権限の原則を使用してください。

IAM ロールの詳細については、[https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) を参照してください。

---

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- ローカルデバイスをノードとしてペアリングする: [ノード](/ja-JP/nodes)
- Gatewayを設定する: [Gateway 設定](/ja-JP/gateway/configuration)

## 関連

- [インストール概要](/ja-JP/install)
- [Azure](/ja-JP/install/azure)
- [VPS ホスティング](/ja-JP/vps)

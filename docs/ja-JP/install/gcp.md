---
read_when:
    - OpenClaw を GCP で 24時間365日稼働させたい
    - 自分の VM 上で本番グレードの常時稼働 Gateway が必要な場合
    - 永続化、バイナリ、再起動時の挙動を完全に制御したい
summary: 耐久性のある状態を備えた GCP Compute Engine VM (Docker) で OpenClaw Gateway を 24 時間 365 日実行する
title: GCP
x-i18n:
    generated_at: "2026-07-05T11:31:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Docker を使用して、GCP Compute Engine VM 上で永続的な OpenClaw Gateway を実行します。耐久性のある状態、組み込み済みバイナリ、安全な再起動動作を備えます。

料金はマシンタイプとリージョンによって異なります。ワークロードに合う最小の VM を選び、OOM が発生した場合はスケールアップしてください。

Gateway には、ラップトップからの SSH ポートフォワーディング経由でアクセスできます。または、ファイアウォール設定とトークンを自分で管理する場合は、ポートを直接公開してアクセスできます。

このガイドでは GCP Compute Engine 上の Debian を使用します。Ubuntu でも動作します。その場合はパッケージを適宜読み替えてください。汎用の Docker フローについては、[Docker](/ja-JP/install/docker) を参照してください。

## 必要なもの

- GCP アカウント（`e2-micro` は無料枠の対象）
- `gcloud` CLI、または [Cloud Console](https://console.cloud.google.com)
- ラップトップからの SSH アクセス
- Docker と Docker Compose
- モデル認証情報
- 任意のプロバイダー認証情報（WhatsApp QR、Telegram bot token、Gmail OAuth）
- 約 20〜30 分

## クイックパス

1. GCP プロジェクトを作成し、課金と Compute Engine API を有効化する
2. Compute Engine VM（`e2-small`、Debian 12、20GB）を作成する
3. VM に SSH 接続し、Docker をインストールする
4. OpenClaw リポジトリをクローンする
5. 永続的なホストディレクトリを作成する
6. `.env` と `docker-compose.yml` を設定する
7. 必要なバイナリを組み込み、ビルドして起動する

<Steps>
  <Step title="Install gcloud CLI (or use Console)">
    [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) からインストールしてから、次を実行します。

    ```bash
    gcloud init
    gcloud auth login
    ```

    または、以下のすべての手順を [Cloud Console](https://console.cloud.google.com) の Web UI から実行します。

  </Step>

  <Step title="Create a GCP project">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    [console.cloud.google.com/billing](https://console.cloud.google.com/billing) で課金を有効化します（Compute Engine には必須です）。

    Console での同等手順: IAM & Admin > Create Project でプロジェクトを作成し、課金を有効化してから、APIs & Services > Enable APIs > "Compute Engine API" > Enable を選択します。

  </Step>

  <Step title="Create the VM">
    | タイプ      | 仕様                    | コスト               | メモ                                        |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU、4GB RAM          | 約 $25/月            | ローカル Docker ビルドで最も信頼性が高い         |
    | e2-small  | 2 vCPU、2GB RAM          | 約 $12/月            | Docker ビルドに推奨される最小構成        |
    | e2-micro  | 2 vCPU（共有）、1GB RAM | 無料枠の対象 | Docker ビルドで OOM（終了 137）になることが多い  |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="SSH into the VM">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: Compute Engine ダッシュボードで VM の横にある「SSH」をクリックします。

    VM 作成後、SSH キーの反映には 1〜2 分かかることがあります。接続が拒否された場合は、待ってから再試行してください。

  </Step>

  <Step title="Install Docker (on the VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    グループ変更を有効にするためにログアウトして再ログインし、その後 SSH で再接続します。

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    確認します。

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    このガイドではカスタムイメージをビルドするため、組み込んだバイナリは再起動後も保持されます。

  </Step>

  <Step title="Create persistent host directories">
    Docker コンテナは一時的なものです。長期間保持する状態はすべてホスト上に置く必要があります。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure environment variables">
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

    安定した Gateway トークンを `.env` で管理するには、`OPENCLAW_GATEWAY_TOKEN` を設定します。設定しない場合は、再起動をまたいでクライアントに依存する前に `gateway.auth.token` を設定してください。どちらも設定されていない場合、OpenClaw はその起動時だけ有効なランタイム専用トークンを使用します。`GOG_KEYRING_PASSWORD` 用のキーリングパスワードを生成します。

    ```bash
    openssl rand -hex 32
    ```

    **このファイルをコミットしないでください。** `OPENCLAW_GATEWAY_TOKEN` などのコンテナ/ランタイム環境変数が含まれます。保存済みのプロバイダー OAuth/API キー認証は、マウントされた `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます。

  </Step>

  <Step title="Docker Compose configuration">
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

    `--allow-unconfigured` はブートストラップを便利にするためだけのもので、実際の Gateway 設定の代わりにはなりません。デプロイでは、認証（`gateway.auth.token` またはパスワード）と安全な bind モードを必ず設定してください。

  </Step>

  <Step title="Shared Docker VM runtime steps">
    共通の Docker ホストフローについては、共有ランタイムガイドに従ってください。

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specific launch notes">
    `pnpm install --frozen-lockfile` 中にビルドが `Killed` または `exit code 137` で失敗する場合、VM のメモリが不足しています。最低でも `e2-small` を使用し、初回ビルドの信頼性を高めるには `e2-medium` を使用してください。

    LAN に bind する場合（`OPENCLAW_GATEWAY_BIND=lan`）、続行する前に信頼済みブラウザーオリジンを設定します。

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    変更している場合は、`18789` を設定済みのポートに置き換えてください。

  </Step>

  <Step title="Access from your laptop">
    Gateway ポートを転送する SSH トンネルを作成します。

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    ブラウザーで `http://127.0.0.1:18789/` を開きます。

    クリーンなダッシュボードリンクを再出力します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI が共有シークレット認証を求める場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます（この Docker フローはデフォルトでトークンを書き込みます。パスワード認証に切り替えた場合は、設定済みのパスワードを使用してください）。

    Control UI に `unauthorized` または `disconnected (1008): pairing required` が表示される場合は、ブラウザーデバイスを承認します。

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    共有の永続化マップについては [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) を、[更新フロー](/ja-JP/install/docker-vm-runtime#updates) についても参照してください。

  </Step>
</Steps>

## トラブルシューティング

**SSH 接続が拒否される**

VM 作成後、SSH キーの反映には 1〜2 分かかることがあります。待ってから再試行してください。

**OS Login の問題**

OS Login プロファイルを確認します。

```bash
gcloud compute os-login describe-profile
```

アカウントに必要な IAM 権限（Compute OS Login または Compute OS Admin Login）があることを確認してください。

**メモリ不足（OOM）**

Docker ビルドが `Killed` と `exit code 137` で失敗する場合、VM が OOM により強制終了されています。

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

## サービスアカウント（セキュリティのベストプラクティス）

個人利用では、デフォルトのユーザーアカウントで問題ありません。自動化や CI/CD では、最小権限の専用サービスアカウントを作成します。

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

自動化に Owner ロールを使うのは避け、動作する最も狭いロールを使用してください。[Understanding roles](https://cloud.google.com/iam/docs/understanding-roles) を参照してください。

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- ローカルデバイスをノードとしてペアリングする: [ノード](/ja-JP/nodes)
- Gateway を設定する: [Gateway 設定](/ja-JP/gateway/configuration)

## 関連

- [インストール概要](/ja-JP/install)
- [Azure](/ja-JP/install/azure)
- [VPS ホスティング](/ja-JP/vps)

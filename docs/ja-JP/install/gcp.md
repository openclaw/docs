---
read_when:
    - OpenClaw を GCP 上で 24 時間 365 日実行したい場合
    - 自分の VM 上で本番運用向けの常時稼働 Gateway が欲しい場合
    - 永続化、バイナリ、再起動動作を完全に制御したい場合
summary: 永続状態を保ちながら、GCP Compute Engine VM（Docker）上で OpenClaw Gateway を 24 時間 365 日実行する
title: GCP
x-i18n:
    generated_at: "2026-04-24T05:04:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# GCP Compute Engine 上の OpenClaw（Docker、本番 VPS ガイド）

## 目的

Docker を使って GCP Compute Engine VM 上で永続的な OpenClaw Gateway を実行し、耐久性のある状態、bake 済みバイナリ、安全な再起動動作を実現します。

「月額 ~$5-12 で OpenClaw を 24 時間 365 日動かしたい」なら、これは Google Cloud 上で信頼できるセットアップです。
料金はマシンタイプとリージョンによって異なります。ワークロードに合う最小の VM を選び、OOM が発生したらスケールアップしてください。

## 何をするのか（簡単に）

- GCP プロジェクトを作成し、課金を有効化する
- Compute Engine VM を作成する
- Docker をインストールする（分離されたアプリ実行環境）
- Docker で OpenClaw Gateway を起動する
- ホスト上で `~/.openclaw` + `~/.openclaw/workspace` を永続化する（再起動/rebuild 後も保持）
- SSH トンネル経由でノート PC から Control UI にアクセスする

このマウントされた `~/.openclaw` 状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、および `.env` が含まれます。

Gateway には次の方法でアクセスできます。

- ノート PC からの SSH ポートフォワーディング
- 自分で firewall と token を管理する場合の直接ポート公開

このガイドでは GCP Compute Engine 上の Debian を使用します。
Ubuntu でも動作します。パッケージは適宜読み替えてください。
一般的な Docker フローについては [Docker](/ja-JP/install/docker) を参照してください。

---

## クイックパス（経験のある運用者向け）

1. GCP プロジェクトを作成し、Compute Engine API を有効化
2. Compute Engine VM を作成（e2-small、Debian 12、20GB）
3. VM に SSH 接続
4. Docker をインストール
5. OpenClaw リポジトリを clone
6. 永続ホストディレクトリを作成
7. `.env` と `docker-compose.yml` を設定
8. 必要なバイナリを bake し、build と起動を実行

---

## 必要なもの

- GCP アカウント（e2-micro は free tier 対象）
- gcloud CLI がインストール済み（または Cloud Console を使用）
- ノート PC からの SSH アクセス
- SSH + コピー＆ペーストの基本操作
- 約 20〜30 分
- Docker と Docker Compose
- モデル auth 認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI をインストールする（または Console を使う）">
    **オプション A: gcloud CLI**（自動化に推奨）

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) からインストールします。

    初期化して認証します。

    ```bash
    gcloud init
    gcloud auth login
    ```

    **オプション B: Cloud Console**

    すべての手順は Web UI [https://console.cloud.google.com](https://console.cloud.google.com) から実行できます。

  </Step>

  <Step title="GCP プロジェクトを作成する">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) で課金を有効にします（Compute Engine に必要）。

    Compute Engine API を有効化します。

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM & Admin > Create Project に移動
    2. 名前を付けて作成
    3. そのプロジェクトで課金を有効化
    4. APIs & Services > Enable APIs に移動 > 「Compute Engine API」を検索 > Enable

  </Step>

  <Step title="VM を作成する">
    **マシンタイプ:**

    | Type      | Specs                    | Cost               | Notes                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/mo            | ローカル Docker build には最も信頼性が高い |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/mo            | Docker build 向けの最小推奨 |
    | e2-micro  | 2 vCPU (shared), 1GB RAM | Free tier eligible | Docker build が OOM（exit 137）で失敗しやすい |

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

    1. Compute Engine > VM instances > Create instance に移動
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Machine type: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. Create

  </Step>

  <Step title="VM に SSH 接続する">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine ダッシュボードで VM の横にある「SSH」ボタンをクリックします。

    注: VM 作成後、SSH キーの伝播には 1〜2 分かかることがあります。接続が拒否された場合は、少し待って再試行してください。

  </Step>

  <Step title="Docker をインストールする（VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    グループ変更を有効にするには、ログアウトして再ログインします。

    ```bash
    exit
    ```

    その後、再度 SSH 接続します。

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    確認:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw リポジトリを clone する">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    このガイドでは、バイナリ永続性を確実にするため、カスタムイメージを build する前提です。

  </Step>

  <Step title="永続ホストディレクトリを作成する">
    Docker コンテナーは一時的です。
    すべての長寿命状態はホスト上に置く必要があります。

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

    `.env` 経由で明示的に管理したい場合を除き、`OPENCLAW_GATEWAY_TOKEN` は空のままにしてください。OpenClaw は初回起動時にランダムな gateway token を
    config に書き込みます。keyring password を生成して
    `GOG_KEYRING_PASSWORD` に貼り付けてください。

    ```bash
    openssl rand -hex 32
    ```

    **このファイルはコミットしないでください。**

    この `.env` ファイルは `OPENCLAW_GATEWAY_TOKEN` のようなコンテナー/ランタイム env 用です。
    保存される provider OAuth/API-key auth は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます。

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
          # 推奨: VM 上では Gateway を loopback のみに保ち、SSH トンネル経由でアクセスする。
          # 公開するには `127.0.0.1:` 接頭辞を外し、適切に firewall を設定する。
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

    `--allow-unconfigured` はブートストラップの便宜のためだけのものであり、適切な gateway 設定の代わりではありません。デプロイに合わせて auth（`gateway.auth.token` または password）を設定し、安全な bind 設定を使ってください。

  </Step>

  <Step title="共有 Docker VM ランタイム手順">
    一般的な Docker ホストフローには、共有ランタイムガイドを使ってください。

    - [必要なバイナリをイメージに bake する](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドと起動](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 固有の起動メモ">
    GCP で、`pnpm install --frozen-lockfile` 中に `Killed` または `exit code 137` で build が失敗した場合、その VM はメモリ不足です。最低でも `e2-small`、より信頼できる初回 build には `e2-medium` を使ってください。

    LAN に bind する場合（`OPENCLAW_GATEWAY_BIND=lan`）、続行する前に信頼済みブラウザー origin を設定してください。

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    gateway port を変更した場合は、`18789` を設定済み port に置き換えてください。

  </Step>

  <Step title="ノート PC からアクセスする">
    Gateway port を転送する SSH トンネルを作成します。

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    ブラウザで開きます。

    `http://127.0.0.1:18789/`

    クリーンな dashboard リンクを再表示するには:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI が shared-secret auth を求めてきた場合は、設定済み token または
    password を Control UI settings に貼り付けてください。この Docker フローは
    デフォルトで token を書き込みます。コンテナー config を password auth に切り替えた場合は、
    代わりにその password を使ってください。

    Control UI に `unauthorized` または `disconnected (1008): pairing required` と表示される場合は、ブラウザーデバイスを承認してください。

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    共有の永続化と更新リファレンスが再度必要ですか？
    [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) と [Docker VM Runtime updates](/ja-JP/install/docker-vm-runtime#updates) を参照してください。

  </Step>
</Steps>

---

## トラブルシューティング

**SSH connection refused**

VM 作成後、SSH キーの伝播には 1〜2 分かかることがあります。少し待って再試行してください。

**OS Login の問題**

OS Login profile を確認してください。

```bash
gcloud compute os-login describe-profile
```

自分のアカウントに必要な IAM 権限（Compute OS Login または Compute OS Admin Login）があることを確認してください。

**メモリ不足（OOM）**

Docker build が `Killed` と `exit code 137` で失敗する場合、VM は OOM-killed されています。e2-small（最小）または e2-medium（信頼できるローカル build に推奨）にアップグレードしてください。

```bash
# まず VM を停止
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# マシンタイプを変更
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM を起動
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## サービスアカウント（セキュリティのベストプラクティス）

個人利用なら、デフォルトのユーザーアカウントで問題ありません。

自動化や CI/CD パイプラインでは、最小権限を持つ専用サービスアカウントを作成してください。

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

自動化に Owner ロールを使うのは避けてください。最小権限の原則を使ってください。

IAM ロールの詳細は [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) を参照してください。

---

## 次のステップ

- メッセージングチャンネルを設定する: [Channels](/ja-JP/channels)
- ローカルデバイスを Node としてペアリングする: [Nodes](/ja-JP/nodes)
- Gateway を設定する: [Gateway configuration](/ja-JP/gateway/configuration)

## 関連

- [Install overview](/ja-JP/install)
- [Azure](/ja-JP/install/azure)
- [VPS hosting](/ja-JP/vps)

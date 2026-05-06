---
read_when:
    - OpenClaw をクラウド VPS（自分のノートPCではなく）で24時間365日稼働させたい場合
    - 自分のVPS上で、本番グレードの常時稼働するGatewayを使いたい場合
    - 永続化、バイナリ、再起動時の動作を完全に制御したい場合
    - Hetzner または類似のプロバイダー上の Docker で OpenClaw を実行している
summary: 安価な Hetzner VPS (Docker) 上で、永続化された状態と組み込み済みバイナリを使って OpenClaw Gateway を24時間365日実行する
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T17:57:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6102649b381b3b1ecd6f52e1cf518fc36147fe143ebc8fd4be5f44ab26cb3b4d
    source_path: install/hetzner.md
    workflow: 16
---

## 目的

Docker を使用して Hetzner VPS 上で永続的な OpenClaw Gateway を実行し、永続化された状態、組み込み済みバイナリ、安全な再起動動作を確保します。

「月額約 $5 で OpenClaw を 24 時間 365 日動かしたい」場合、これが最もシンプルで信頼性の高いセットアップです。
Hetzner の料金は変わります。最小構成の Debian/Ubuntu VPS を選び、OOM が発生した場合にスケールアップしてください。

セキュリティモデルの確認:

- 会社で共有するエージェントは、全員が同じ信頼境界内にいて、ランタイムが業務専用であれば問題ありません。
- 厳密に分離してください: 専用 VPS/ランタイム + 専用アカウントを使い、そのホストに個人用の Apple/Google/ブラウザ/パスワードマネージャープロファイルを置かないでください。
- ユーザー同士が敵対的である可能性がある場合は、gateway/ホスト/OS ユーザーごとに分離してください。

[セキュリティ](/ja-JP/gateway/security) と [VPS ホスティング](/ja-JP/vps) を参照してください。

## 何をするのか（簡単に）?

- 小さな Linux サーバー（Hetzner VPS）を借りる
- Docker（分離されたアプリランタイム）をインストールする
- Docker 内で OpenClaw Gateway を起動する
- ホスト上に `~/.openclaw` + `~/.openclaw/workspace` を永続化する（再起動/再ビルド後も残る）
- SSH トンネル経由で自分のラップトップから Control UI にアクセスする

マウントされたその `~/.openclaw` 状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、`.env` が含まれます。

Gateway には次の方法でアクセスできます:

- ラップトップからの SSH ポートフォワーディング
- ファイアウォールとトークンを自分で管理する場合の直接ポート公開

このガイドでは、Hetzner 上の Ubuntu または Debian を前提としています。  
別の Linux VPS を使用している場合は、パッケージを適宜対応させてください。
汎用的な Docker フローについては、[Docker](/ja-JP/install/docker) を参照してください。

---

## クイック手順（経験のある運用者向け）

1. Hetzner VPS をプロビジョニングする
2. Docker をインストールする
3. OpenClaw リポジトリをクローンする
4. 永続的なホストディレクトリを作成する
5. `.env` と `docker-compose.yml` を設定する
6. 必要なバイナリをイメージに組み込む
7. `docker compose up -d`
8. 永続化と Gateway アクセスを確認する

---

## 必要なもの

- root アクセス権を持つ Hetzner VPS
- ラップトップからの SSH アクセス
- SSH とコピー/ペーストの基本的な操作に慣れていること
- 約 20 分
- Docker と Docker Compose
- モデル認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="VPS をプロビジョニングする">
    Hetzner で Ubuntu または Debian の VPS を作成します。

    root として接続します:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    このガイドでは、VPS が状態を保持することを前提としています。
    使い捨てインフラとして扱わないでください。

  </Step>

  <Step title="Docker をインストールする（VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    確認します:

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
    Docker コンテナは一時的です。
    長期間保持するすべての状態はホスト上に置く必要があります。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリルートに `.env` を作成します。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    安定した gateway トークンを `.env` で管理したい場合は `OPENCLAW_GATEWAY_TOKEN` を設定します。それ以外の場合は、再起動をまたいでクライアントに依存する前に `gateway.auth.token` を設定してください。どちらのソースも存在しない場合、OpenClaw はその起動時だけ有効なランタイム専用トークンを使用します。キーリングパスワードを生成し、`GOG_KEYRING_PASSWORD` に貼り付けます:

    ```bash
    openssl rand -hex 32
    ```

    **このファイルをコミットしないでください。**

    この `.env` ファイルは、`OPENCLAW_GATEWAY_TOKEN` などのコンテナ/ランタイム環境変数用です。
    保存されたプロバイダーの OAuth/API キー認証は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` にあります。

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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
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

    `--allow-unconfigured` はブートストラップの利便性のためだけのもので、適切な gateway 設定の代替ではありません。デプロイ環境では、引き続き認証（`gateway.auth.token` またはパスワード）を設定し、安全なバインド設定を使用してください。

  </Step>

  <Step title="共有 Docker VM ランタイム手順">
    一般的な Docker ホストフローには、共有ランタイムガイドを使用してください:

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 固有のアクセス">
    共有のビルドおよび起動手順の後、トンネルを開くために次のセットアップを完了します:

    **前提条件:** VPS の sshd 設定で TCP フォワーディングが許可されていることを確認してください。SSH 設定を強化している場合は、`/etc/ssh/sshd_config` を確認し、次のように設定します:

    ```
    AllowTcpForwarding local
    ```

    `local` は、サーバーからのリモートフォワードをブロックしつつ、ラップトップからの `ssh -L` ローカルフォワードを許可します。`no` に設定すると、トンネルは次のエラーで失敗します:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP フォワーディングが有効であることを確認したら、SSH サービスを再起動し
    （`systemctl restart ssh`）、ラップトップからトンネルを実行します:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    開きます:

    `http://127.0.0.1:18789/`

    設定済みの共有シークレットを貼り付けます。このガイドではデフォルトで gateway トークンを使用します。パスワード認証に切り替えた場合は、代わりにそのパスワードを使用してください。

  </Step>
</Steps>

共有の永続化マップは [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) にあります。

## コードとしてのインフラストラクチャ（Terraform）

Infrastructure as Code のワークフローを好むチーム向けに、コミュニティが管理する Terraform セットアップが次を提供します:

- リモート状態管理を備えたモジュール式 Terraform 設定
- cloud-init による自動プロビジョニング
- デプロイスクリプト（ブートストラップ、デプロイ、バックアップ/復元）
- セキュリティ強化（ファイアウォール、UFW、SSH 専用アクセス）
- gateway アクセス用の SSH トンネル設定

**リポジトリ:**

- インフラストラクチャ: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 設定: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

このアプローチは、再現可能なデプロイ、バージョン管理されたインフラストラクチャ、自動化された災害復旧により、上記の Docker セットアップを補完します。

<Note>
コミュニティ管理です。問題や貢献については、上記のリポジトリリンクを参照してください。
</Note>

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- Gateway を設定する: [Gateway 設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ: [更新](/ja-JP/install/updating)

## 関連

- [インストール概要](/ja-JP/install)
- [Fly.io](/ja-JP/install/fly)
- [Docker](/ja-JP/install/docker)
- [VPS ホスティング](/ja-JP/vps)

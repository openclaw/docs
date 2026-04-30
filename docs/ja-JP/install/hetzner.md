---
read_when:
    - OpenClaw をクラウド VPS（自分のノートPCではなく）で 24/7 稼働させたい
    - 本番運用レベルで常時稼働するGatewayを自分のVPS上で運用したい
    - 永続化、バイナリ、再起動動作を完全に制御したい場合
    - Hetzner または同様のプロバイダー上の Docker で OpenClaw を実行している
summary: 安価な Hetzner VPS（Docker）で、永続化された状態と組み込み済みバイナリを備えた OpenClaw Gateway を 24 時間 365 日実行する
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T05:20:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# Hetzner 上の OpenClaw (Docker、本番 VPS ガイド)

## 目的

Docker を使用して Hetzner VPS 上で永続的な OpenClaw Gateway を実行し、永続状態、組み込み済みバイナリ、安全な再起動動作を備えます。

「月額約 $5 で OpenClaw を 24/7 稼働」させたいなら、これは最もシンプルで信頼できる構成です。
Hetzner の料金は変わります。最小の Debian/Ubuntu VPS を選び、OOM が発生する場合はスケールアップしてください。

セキュリティモデルの注意:

- 会社で共有するエージェントは、全員が同じ信頼境界内にいて、ランタイムが業務専用である場合は問題ありません。
- 厳密に分離してください: 専用 VPS/ランタイム + 専用アカウント。そのホストでは個人用の Apple/Google/ブラウザ/パスワードマネージャープロファイルを使わないでください。
- ユーザー同士が敵対的である場合は、gateway/ホスト/OS ユーザー単位で分離してください。

[セキュリティ](/ja-JP/gateway/security) と [VPS ホスティング](/ja-JP/vps) を参照してください。

## 何をするのか (簡単に)?

- 小さな Linux サーバー (Hetzner VPS) を借りる
- Docker (分離されたアプリランタイム) をインストールする
- Docker で OpenClaw Gateway を起動する
- ホスト上で `~/.openclaw` + `~/.openclaw/workspace` を永続化する (再起動/再ビルド後も残る)
- SSH トンネル経由でラップトップから Control UI にアクセスする

マウントされたその `~/.openclaw` 状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、および `.env` が含まれます。

Gateway には次の方法でアクセスできます:

- ラップトップからの SSH ポートフォワーディング
- ファイアウォールとトークンを自分で管理する場合の直接ポート公開

このガイドは、Hetzner 上の Ubuntu または Debian を前提としています。  
別の Linux VPS を使用している場合は、パッケージを適宜読み替えてください。
汎用的な Docker フローについては、[Docker](/ja-JP/install/docker) を参照してください。

---

## クイックパス (経験豊富な運用者向け)

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

- root アクセス付きの Hetzner VPS
- ラップトップからの SSH アクセス
- SSH + コピー/ペーストの基本的な扱いに慣れていること
- 約 20 分
- Docker と Docker Compose
- モデル認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram ボットトークン
  - Gmail OAuth

---

<Steps>
  <Step title="VPS をプロビジョニングする">
    Hetzner で Ubuntu または Debian VPS を作成します。

    root として接続します:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    このガイドでは、VPS が状態を保持するものと想定しています。
    使い捨てインフラとして扱わないでください。

  </Step>

  <Step title="Docker をインストールする (VPS 上)">
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
    長期的に保持する状態はすべてホスト上に置く必要があります。

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

    `OPENCLAW_GATEWAY_TOKEN` は、明示的に `.env` で管理したい場合を除き空のままにしてください。OpenClaw は初回起動時にランダムな Gateway トークンを設定に書き込みます。キーリングパスワードを生成し、
    `GOG_KEYRING_PASSWORD` に貼り付けます:

    ```bash
    openssl rand -hex 32
    ```

    **このファイルをコミットしないでください。**

    この `.env` ファイルは、`OPENCLAW_GATEWAY_TOKEN` などのコンテナ/ランタイム環境変数用です。
    保存済みのプロバイダー OAuth/API キー認証は、マウントされた
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

    `--allow-unconfigured` はブートストラップを便利にするためだけのもので、適切な Gateway 設定の代替ではありません。デプロイに合わせて認証 (`gateway.auth.token` またはパスワード) を設定し、安全な bind 設定を使用してください。

  </Step>

  <Step title="共有 Docker VM ランタイム手順">
    共通の Docker ホストフローには、共有ランタイムガイドを使用してください:

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 固有のアクセス">
    共有のビルドと起動手順の後、トンネルを開くために次の設定を完了します:

    **前提条件:** VPS の sshd 設定で TCP フォワーディングが許可されていることを確認してください。SSH 設定を強化している場合は、
    `/etc/ssh/sshd_config` を確認して次のように設定します:

    ```
    AllowTcpForwarding local
    ```

    `local` は、サーバーからのリモートフォワードをブロックしながら、ラップトップからの `ssh -L` ローカルフォワードを許可します。`no` に設定すると、トンネルは次のエラーで失敗します:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP フォワーディングが有効であることを確認したら、SSH サービスを再起動し
    (`systemctl restart ssh`)、ラップトップからトンネルを実行します:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    開きます:

    `http://127.0.0.1:18789/`

    設定済みの共有シークレットを貼り付けます。このガイドではデフォルトで Gateway トークンを使用します。パスワード認証に切り替えた場合は、代わりにそのパスワードを使用してください。

  </Step>
</Steps>

共有の永続化マップは [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) にあります。

## Infrastructure as Code (Terraform)

Infrastructure as Code ワークフローを好むチーム向けに、コミュニティが保守する Terraform 構成が次を提供します:

- リモート状態管理を備えたモジュール式 Terraform 設定
- cloud-init による自動プロビジョニング
- デプロイスクリプト (bootstrap、deploy、backup/restore)
- セキュリティ強化 (ファイアウォール、UFW、SSH のみのアクセス)
- Gateway アクセス用の SSH トンネル設定

**リポジトリ:**

- インフラストラクチャ: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 設定: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

このアプローチは、再現可能なデプロイ、バージョン管理されたインフラストラクチャ、自動化された災害復旧によって、上記の Docker 構成を補完します。

<Note>
コミュニティ保守です。問題やコントリビューションについては、上記のリポジトリリンクを参照してください。
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

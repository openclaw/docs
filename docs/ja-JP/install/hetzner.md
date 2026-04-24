---
read_when:
    - OpenClaw をラップトップではなくクラウド VPS 上で 24 時間 365 日実行したい場合
    - 自分の VPS 上で本番向けの常時稼働 Gateway が必要な場合
    - 永続化、バイナリ、再起動動作を完全に制御したい場合
    - Hetzner または同様のプロバイダー上で Docker で OpenClaw を実行している場合
summary: 安価な Hetzner VPS（Docker）上で、耐久性のある状態と組み込みバイナリ付きで OpenClaw Gateway を 24 時間 365 日実行する
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T05:04:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw on Hetzner（Docker、本番 VPS ガイド）

## 目的

耐久性のある状態、組み込みバイナリ、安全な再起動動作を備えた Docker を使って、Hetzner VPS 上で永続的な OpenClaw Gateway を実行します。

「月額 ~$5 で OpenClaw を 24 時間 365 日動かしたい」なら、これが最もシンプルで信頼できる構成です。
Hetzner の価格は変動するため、最小の Debian/Ubuntu VPS を選び、OOM が出るようならスケールアップしてください。

セキュリティモデルの注意:

- 全員が同じ trust boundary にいて、ランタイムが業務専用であるなら、会社共有エージェントでも問題ありません。
- 厳密な分離を保ってください: 専用 VPS/ランタイム + 専用アカウント。そのホストには個人用の Apple/Google/browser/password-manager プロファイルを置かないでください。
- ユーザー同士が敵対的である可能性があるなら、gateway/host/OS user ごとに分離してください。

[Security](/ja-JP/gateway/security) と [VPS hosting](/ja-JP/vps) を参照してください。

## 何をするのか（簡単に）

- 小さな Linux サーバー（Hetzner VPS）を借りる
- Docker をインストールする（分離されたアプリランタイム）
- Docker で OpenClaw Gateway を起動する
- ホスト上に `~/.openclaw` + `~/.openclaw/workspace` を永続化する（再起動/再ビルド後も残る）
- SSH トンネル経由でラップトップから Control UI にアクセスする

マウントされる `~/.openclaw` 状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、および `.env` が含まれます。

Gateway へのアクセス方法:

- ラップトップからの SSH ポートフォワード
- 自分でファイアウォールとトークンを管理する場合は、直接ポート公開

このガイドは Hetzner 上の Ubuntu または Debian を前提としています。  
他の Linux VPS の場合は、パッケージを適宜読み替えてください。
汎用的な Docker フローについては [Docker](/ja-JP/install/docker) を参照してください。

---

## クイックパス（経験者向け）

1. Hetzner VPS を用意する
2. Docker をインストールする
3. OpenClaw リポジトリを clone する
4. 永続ホストディレクトリを作成する
5. `.env` と `docker-compose.yml` を設定する
6. 必要なバイナリをイメージに焼き込む
7. `docker compose up -d`
8. 永続化と Gateway アクセスを確認する

---

## 必要なもの

- root アクセス可能な Hetzner VPS
- ラップトップからの SSH アクセス
- SSH + copy/paste の基本操作
- 約 20 分
- Docker と Docker Compose
- モデル認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="VPS を用意する">
    Hetzner で Ubuntu または Debian の VPS を作成します。

    root として接続します。

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    このガイドでは、VPS が stateful であることを前提とします。
    使い捨てインフラとして扱わないでください。

  </Step>

  <Step title="Docker をインストールする（VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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

    このガイドは、バイナリ永続性を保証するためにカスタムイメージをビルドする前提です。

  </Step>

  <Step title="永続ホストディレクトリを作成する">
    Docker コンテナはエフェメラルです。
    長寿命の状態はすべてホスト上に置く必要があります。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # コンテナユーザー（uid 1000）に所有権を設定:
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

    `OPENCLAW_GATEWAY_TOKEN` は、明示的に
    `.env` で管理したい場合を除き空欄のままにしてください。OpenClaw は初回起動時に
    ランダムな gateway token を config に書き込みます。keyring password を生成して
    `GOG_KEYRING_PASSWORD` に貼り付けてください。

    ```bash
    openssl rand -hex 32
    ```

    **このファイルはコミットしないでください。**

    この `.env` ファイルは `OPENCLAW_GATEWAY_TOKEN` のようなコンテナ/ランタイム env 用です。
    保存される provider OAuth/API-key 認証は、マウントされた
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
          # 推奨: Gateway は VPS 上で loopback のみにしておき、SSH トンネル経由でアクセスします。
          # 公開する場合は `127.0.0.1:` プレフィックスを外し、適切にファイアウォールを設定してください。
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

    `--allow-unconfigured` はブートストラップ上の便宜のためだけのものであり、適切な gateway 設定の代替ではありません。引き続き認証（`gateway.auth.token` または password）を設定し、デプロイに適した安全な bind 設定を使用してください。

  </Step>

  <Step title="共有 Docker VM ランタイム手順">
    共通の Docker ホストフローには共有ランタイムガイドを使用してください。

    - [必要なバイナリをイメージに焼き込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドと起動](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 固有のアクセス">
    共有のビルドと起動手順の後、ラップトップからトンネルを張ります。

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    開く URL:

    `http://127.0.0.1:18789/`

    設定された共有シークレットを貼り付けてください。このガイドではデフォルトで gateway token を使います。
    password 認証に切り替えている場合は、代わりにその password を使ってください。

  </Step>
</Steps>

共有の永続化マップは [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) にあります。

## Infrastructure as Code（Terraform）

infrastructure-as-code ワークフローを好むチーム向けに、コミュニティ管理の Terraform セットアップが次を提供します。

- リモート state 管理付きのモジュラー Terraform 設定
- cloud-init による自動プロビジョニング
- デプロイスクリプト（bootstrap、deploy、backup/restore）
- セキュリティハードニング（firewall、UFW、SSH-only access）
- gateway アクセス用 SSH トンネル設定

**リポジトリ:**

- インフラ: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 設定: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

このアプローチは、再現可能なデプロイ、バージョン管理されたインフラ、自動化された災害復旧によって、上記 Docker セットアップを補完します。

> **注:** コミュニティ管理です。問題やコントリビューションについては、上記のリポジトリリンクを参照してください。

## 次のステップ

- メッセージングチャンネルを設定する: [Channels](/ja-JP/channels)
- Gateway を設定する: [Gateway configuration](/ja-JP/gateway/configuration)
- OpenClaw を最新に保つ: [Updating](/ja-JP/install/updating)

## 関連

- [Install overview](/ja-JP/install)
- [Fly.io](/ja-JP/install/fly)
- [Docker](/ja-JP/install/docker)
- [VPS hosting](/ja-JP/vps)

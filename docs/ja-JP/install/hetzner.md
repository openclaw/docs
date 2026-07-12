---
read_when:
    - クラウド VPS（ノートパソコンではなく）で OpenClaw を 24 時間 365 日稼働させたい場合
    - 自分の VPS 上で、本番環境に対応した常時稼働の Gateway を運用したい場合
    - 永続化、バイナリ、再起動時の動作を完全に制御したい場合
    - Hetzner または同様のプロバイダー上の Docker で OpenClaw を実行している場合
summary: 永続的な状態と組み込み済みバイナリを備えた低価格の Hetzner VPS（Docker）上で OpenClaw Gateway を24時間365日稼働させる
title: Hetzner
x-i18n:
    generated_at: "2026-07-11T22:20:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Docker を使用して Hetzner VPS 上で永続的な OpenClaw Gateway を実行し、状態を永続化し、必要なバイナリをイメージに組み込み、安全に再起動できるようにします。

Hetzner の料金は変更されることがあります。要件を満たす最小構成の Debian/Ubuntu VPS を選び、OOM が発生した場合はスケールアップしてください。

Gateway には、ノートパソコンから SSH ポートフォワーディング経由でアクセスできます。また、ファイアウォールとトークンを自分で管理する場合は、ポートを直接公開してアクセスすることもできます。

セキュリティモデルについての注意事項：

- 全員が同じ信頼境界内にいて、ランタイムを業務専用にする場合は、社内共有エージェントを使用しても問題ありません。
- 厳密に分離してください。専用の VPS/ランタイムと専用アカウントを使用し、そのホストには個人用の Apple/Google/ブラウザー/パスワードマネージャーのプロファイルを置かないでください。
- ユーザー同士が敵対的である可能性がある場合は、Gateway、ホスト、または OS ユーザー単位で分離してください。

[セキュリティ](/ja-JP/gateway/security)および[VPS ホスティング](/ja-JP/vps)を参照してください。

このガイドでは、Hetzner 上の Ubuntu または Debian を前提としています。別の Linux VPS を使用する場合は、対応するパッケージに読み替えてください。汎用的な Docker の手順については、[Docker](/ja-JP/install/docker)を参照してください。

## 必要なもの

- root アクセス権を持つ Hetzner VPS
- ノートパソコンからの SSH アクセス
- Docker と Docker Compose
- モデル認証資格情報
- 任意のプロバイダー資格情報（WhatsApp の QR コード、Telegram ボットトークン、Gmail OAuth）
- 約 20 分

## 最短手順

1. Hetzner VPS をプロビジョニングする
2. Docker をインストールする
3. OpenClaw リポジトリをクローンする
4. 永続化用のホストディレクトリを作成する
5. `.env` と `docker-compose.yml` を設定する
6. 必要なバイナリをイメージに組み込む
7. `docker compose up -d`
8. 永続化と Gateway へのアクセスを確認する

<Steps>
  <Step title="VPS をプロビジョニングする">
    Hetzner で Ubuntu または Debian の VPS を作成し、root として接続します。

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    VPS は使い捨てのインフラストラクチャではなく、状態を保持するものとして扱ってください。

  </Step>

  <Step title="Docker をインストールする（VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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

    このガイドでは、組み込んだバイナリが再起動後も保持されるようにカスタムイメージをビルドします。

  </Step>

  <Step title="永続化用のホストディレクトリを作成する">
    Docker コンテナは一時的なものです。長期的に保持するすべての状態はホスト上に保存する必要があります。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # 所有者をコンテナユーザー（uid 1000）に設定します。
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリのルートに `.env` を作成します。

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

    再起動後も安定した Gateway トークンを `.env` で管理するには、`OPENCLAW_GATEWAY_TOKEN` を設定します。設定しない場合は、再起動をまたいでクライアントを使用する前に `gateway.auth.token` を設定してください。どちらも設定されていない場合、OpenClaw はその起動時にのみ有効なランタイム専用トークンを使用します。`GOG_KEYRING_PASSWORD` 用のキーリングパスワードを生成します。

    ```bash
    openssl rand -hex 32
    ```

    **このファイルをコミットしないでください。** このファイルには、`OPENCLAW_GATEWAY_TOKEN` などのコンテナ/ランタイム環境変数が含まれます。保存済みのプロバイダー OAuth/API キー認証情報は、マウントされた `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に格納されます。

  </Step>

  <Step title="Docker Compose を設定する">
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
          # 推奨：VPS 上の Gateway はループバック限定にし、SSH トンネル経由でアクセスします。
          # 公開する場合は、`127.0.0.1:` プレフィックスを削除し、適切にファイアウォールを設定してください。
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

    `--allow-unconfigured` は初期セットアップを簡単にするためのものであり、実際の Gateway 設定の代わりにはなりません。デプロイ環境では、認証（`gateway.auth.token` またはパスワード）と安全なバインドモードを必ず設定してください。

  </Step>

  <Step title="共通の Docker VM ランタイム手順">
    一般的な Docker ホストの手順については、共通ランタイムガイドに従ってください。

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [永続化される場所](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 固有のアクセス方法">
    共通のビルドと起動手順を完了した後、トンネルを開きます。

    **前提条件：** VPS の sshd 設定で TCP フォワーディングが許可されていることを確認してください。SSH 設定を強化している場合は、`/etc/ssh/sshd_config` を確認し、次のように設定します。

    ```text
    AllowTcpForwarding local
    ```

    `local` を指定すると、サーバーからのリモートフォワーディングを遮断しながら、ノートパソコンからの `ssh -L` ローカルフォワーディングを許可できます。`no` に設定すると、トンネルは次のエラーで失敗します。
    `channel 3: open failed: administratively prohibited: open failed`

    TCP フォワーディングが有効であることを確認したら、SSH サービスを再起動（`systemctl restart ssh`）し、ノートパソコンからトンネルを実行します。

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    `http://127.0.0.1:18789/` を開き、設定済みの共有シークレットを貼り付けます。このガイドではデフォルトで Gateway トークンを使用します。パスワード認証に切り替えた場合は、代わりに設定済みのパスワードを使用してください。

  </Step>
</Steps>

共通の永続化マップについては、[Docker VM ランタイム](/ja-JP/install/docker-vm-runtime#what-persists-where)を参照してください。

## Infrastructure as Code（Terraform）

Infrastructure as Code のワークフローを希望するチーム向けに、コミュニティが保守する Terraform セットアップでは次の機能が提供されています。

- リモート状態管理を備えたモジュール式 Terraform 設定
- cloud-init による自動プロビジョニング
- デプロイスクリプト（ブートストラップ、デプロイ、バックアップ/復元）
- セキュリティ強化（ファイアウォール、UFW、SSH のみによるアクセス）
- Gateway アクセス用の SSH トンネル設定

**リポジトリ：**

- インフラストラクチャ：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 設定：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

この方法は、再現可能なデプロイ、バージョン管理されたインフラストラクチャ、自動化された災害復旧によって、前述の Docker セットアップを補完します。

<Note>
コミュニティによって保守されています。問題の報告やコントリビューションについては、前述のリポジトリリンクを参照してください。
</Note>

## 次のステップ

- メッセージングチャネルを設定する：[チャネル](/ja-JP/channels)
- Gateway を設定する：[Gateway の設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ：[更新](/ja-JP/install/updating)

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Fly.io](/ja-JP/install/fly)
- [Docker](/ja-JP/install/docker)
- [VPS ホスティング](/ja-JP/vps)

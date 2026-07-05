---
read_when:
    - OpenClawをクラウドVPS（自分のラップトップではなく）で24時間365日稼働させたい
    - 自分の VPS で本番グレードの常時稼働 Gateway を使いたい
    - 永続化、バイナリ、再起動動作を完全に制御したい場合
    - Hetzner または同様のプロバイダー上の Docker で OpenClaw を実行している
summary: 安価な Hetzner VPS（Docker）で、永続的な状態と組み込み済みバイナリを備えた OpenClaw Gateway を24時間365日実行する
title: Hetzner
x-i18n:
    generated_at: "2026-07-05T11:32:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

永続的な OpenClaw Gateway を Docker を使って Hetzner VPS 上で実行し、永続的な状態、組み込み済みバイナリ、安全な再起動動作を備えます。

Hetzner の料金は変わることがあります。要件に合う最小の Debian/Ubuntu VPS を選び、OOM が発生した場合はスケールアップしてください。

Gateway には、ノート PC からの SSH ポートフォワーディング、またはファイアウォールとトークンを自分で管理する場合は直接ポート公開でアクセスできます。

セキュリティモデルの注意事項:

- 会社共有のエージェントは、全員が同じ信頼境界内にいて、ランタイムが業務専用であれば問題ありません。
- 厳密に分離してください: 専用 VPS/ランタイム + 専用アカウントを使い、そのホスト上に個人用の Apple/Google/ブラウザ/パスワードマネージャーのプロファイルを置かないでください。
- ユーザー同士が敵対的である場合は、gateway/ホスト/OS ユーザー単位で分離してください。

[セキュリティ](/ja-JP/gateway/security) と [VPS ホスティング](/ja-JP/vps) を参照してください。

このガイドでは、Hetzner 上の Ubuntu または Debian を前提としています。別の Linux VPS では、パッケージを適宜読み替えてください。汎用的な Docker フローについては、[Docker](/ja-JP/install/docker) を参照してください。

## 必要なもの

- root アクセス権を持つ Hetzner VPS
- ノート PC からの SSH アクセス
- Docker と Docker Compose
- モデル認証情報
- 任意のプロバイダー認証情報 (WhatsApp QR、Telegram bot token、Gmail OAuth)
- 約 20 分

## 最短手順

1. Hetzner VPS をプロビジョニングする
2. Docker をインストールする
3. OpenClaw リポジトリをクローンする
4. 永続的なホストディレクトリを作成する
5. `.env` と `docker-compose.yml` を設定する
6. 必要なバイナリをイメージに組み込む
7. `docker compose up -d`
8. 永続化と Gateway アクセスを確認する

<Steps>
  <Step title="VPS をプロビジョニングする">
    Hetzner で Ubuntu または Debian の VPS を作成し、root として接続します:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    VPS は使い捨てインフラではなく、状態を持つものとして扱ってください。

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

    このガイドでは、組み込んだバイナリが再起動後も残るようにカスタムイメージをビルドします。

  </Step>

  <Step title="永続的なホストディレクトリを作成する">
    Docker コンテナは一時的なものです。長期間保持する状態はすべてホスト上に置く必要があります。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリルートに `.env` を作成します:

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

    `OPENCLAW_GATEWAY_TOKEN` を設定すると、安定した gateway token を
    `.env` で管理できます。そうしない場合は、再起動をまたいでクライアントに依存する前に
    `gateway.auth.token` を設定してください。どちらも設定されていない場合、OpenClaw は
    その起動時だけ有効なランタイム専用トークンを使用します。`GOG_KEYRING_PASSWORD` 用の keyring password を生成します:

    ```bash
    openssl rand -hex 32
    ```

    **このファイルをコミットしないでください。** これには
    `OPENCLAW_GATEWAY_TOKEN` などのコンテナ/ランタイム env が含まれます。保存済みの provider OAuth/API-key auth は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` にあります。

  </Step>

  <Step title="Docker Compose 設定">
    `docker-compose.yml` を作成または更新します:

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

    `--allow-unconfigured` はブートストラップを便利にするためだけのものであり、実際の gateway 設定の代わりにはなりません。デプロイに合わせて auth (`gateway.auth.token` または password) と安全な bind mode を必ず設定してください。

  </Step>

  <Step title="共有 Docker VM ランタイム手順">
    一般的な Docker ホストフローについては、共有ランタイムガイドに従ってください:

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 固有のアクセス">
    共有のビルドと起動の手順が終わったら、トンネルを開きます。

    **前提条件:** VPS の sshd 設定で TCP forwarding が許可されていることを確認してください。
    SSH 設定を強化している場合は、`/etc/ssh/sshd_config` を確認し、次のように設定します:

    ```text
    AllowTcpForwarding local
    ```

    `local` は、サーバーからのリモートフォワードをブロックしつつ、ノート PC からの `ssh -L` ローカルフォワードを許可します。`no` に設定すると、トンネルは次のエラーで失敗します:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP forwarding が有効であることを確認したら、SSH サービスを再起動し
    (`systemctl restart ssh`)、ノート PC からトンネルを実行します:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    `http://127.0.0.1:18789/` を開き、設定した共有シークレットを貼り付けます。
    このガイドではデフォルトで gateway token を使用します。password auth に切り替えた場合は、代わりに設定済みのパスワードを使用してください。

  </Step>
</Steps>

共有の永続化マップは [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) にあります。

## Infrastructure as Code (Terraform)

infrastructure-as-code ワークフローを好むチーム向けに、コミュニティ管理の Terraform セットアップでは次を提供しています:

- リモート状態管理を備えたモジュール式 Terraform 設定
- cloud-init による自動プロビジョニング
- デプロイスクリプト (bootstrap、deploy、backup/restore)
- セキュリティ強化 (firewall、UFW、SSH-only access)
- gateway アクセス用の SSH トンネル設定

**リポジトリ:**

- インフラストラクチャ: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 設定: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

このアプローチは、再現可能なデプロイ、バージョン管理されたインフラストラクチャ、自動化された災害復旧によって、上記の Docker セットアップを補完します。

<Note>
コミュニティ管理です。問題や貢献については、上記のリポジトリリンクを参照してください。
</Note>

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- Gateway を設定する: [Gateway 設定](/ja-JP/gateway/configuration)
- OpenClaw を最新に保つ: [更新](/ja-JP/install/updating)

## 関連

- [インストール概要](/ja-JP/install)
- [Fly.io](/ja-JP/install/fly)
- [Docker](/ja-JP/install/docker)
- [VPS ホスティング](/ja-JP/vps)

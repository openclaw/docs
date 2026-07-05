---
read_when:
    - DigitalOcean で OpenClaw をセットアップする
    - OpenClaw 向けのシンプルな有料 VPS を探す
summary: DigitalOcean Droplet で OpenClaw をホストする
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-05T11:31:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

永続的な OpenClaw Gateway を DigitalOcean Droplet（1 GB Basic プランで約 $6/月）で実行します。

DigitalOcean はわかりやすい有料 VPS ルートです。より安価または無料の選択肢は次のとおりです。

- [Hetzner](/ja-JP/install/hetzner) -- 1 ドルあたりのコア数/RAM が多い。
- [Oracle Cloud](/ja-JP/install/oracle) -- Always Free ARM ティア（最大 4 OCPU、24 GB RAM）がありますが、サインアップが不安定な場合があり、ARM のみです。

## 前提条件

- DigitalOcean アカウント（[サインアップ](https://cloud.digitalocean.com/registrations/new)）
- SSH キーペア（またはパスワード認証を使う意思）
- 約 20 分

## セットアップ

<Steps>
  <Step title="Create a Droplet">
    <Warning>
    クリーンなベースイメージ（Ubuntu 24.04 LTS）を使用してください。起動スクリプトとファイアウォールのデフォルトを確認していない限り、サードパーティの Marketplace 1-click イメージは避けてください。
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) にログインします。
    2. **Create > Droplets** をクリックします。
    3. 次を選択します。
       - **リージョン:** 自分に最も近い場所
       - **イメージ:** Ubuntu 24.04 LTS
       - **サイズ:** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **認証:** SSH キー（推奨）またはパスワード
    4. **Create Droplet** をクリックし、IP アドレスを控えます。

  </Step>

  <Step title="Connect and install">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    root シェルはシステムのブートストラップにのみ使用してください。OpenClaw コマンドは非 root の `openclaw` ユーザーとして実行し、状態が `/home/openclaw/.openclaw/` 配下に置かれ、Gateway がそのユーザーの systemd `--user` サービスとしてインストールされるようにします。

  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードがモデル認証、チャネル設定、Gateway トークン生成、デーモンのインストール（systemd ユーザーサービス）を案内します。

  </Step>

  <Step title="Add swap (recommended for 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verify the gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Gateway はデフォルトでループバックにバインドします。次のいずれかの選択肢を選びます。

    **選択肢 A: SSH トンネル（最も簡単）**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    その後、`http://localhost:18789` を開きます。

    **選択肢 B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    その後、tailnet 上の任意のデバイスから `https://<magicdns>/` を開きます。

    Tailscale Serve は tailnet ID ヘッダーを介して Control UI と WebSocket トラフィックを認証します。これは Gateway ホスト自体が信頼されていることを前提とします。HTTP API エンドポイントは、それに関係なく Gateway の通常の認証モード（トークン/パスワード）に従います。Serve 経由で明示的な共有シークレット認証情報を要求するには、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使用します。

    **選択肢 C: Tailnet バインド（Serve なし）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    その後、`http://<tailscale-ip>:18789` を開きます（トークンが必要です）。

  </Step>
</Steps>

## 永続化とバックアップ

OpenClaw の状態は次の場所にあります。

- `~/.openclaw/` -- `openclaw.json`、チャネル/プロバイダー認証情報、エージェントごとの `auth-profiles.json`、セッションデータ。
- `~/.openclaw/workspace/` -- エージェントワークスペース（SOUL.md、メモリ、成果物）。

これらは Droplet の再起動後も残ります。ポータブルなスナップショットを取得するには、次を実行します。

```bash
openclaw backup create
```

DigitalOcean スナップショットは Droplet 全体をバックアップします。`openclaw backup create` はホスト間で移植可能です。

## 1 GB RAM のヒント

$6 の Droplet には 1 GB RAM しかありません。快適に保つには、次の点に注意してください。

- 上記の swap 手順が `/etc/fstab` に入っていることを確認し、再起動後も維持されるようにします。
- ローカルのものではなく API ベースのモデル（Claude、GPT）を優先します -- ローカル LLM 推論は 1 GB には収まりません。
- 大きなプロンプトで OOM が発生する場合は、`agents.defaults.model.primary` をより小さいモデルに設定します。
- `free -h` と `htop` で監視します。

## トラブルシューティング

**Gateway が起動しない** -- `openclaw doctor --non-interactive` を実行し、`journalctl --user -u openclaw-gateway.service -n 50` でログを確認します。

**ポートがすでに使用中** -- `lsof -i :18789` を実行してプロセスを見つけ、その後停止します。

**メモリ不足** -- `free -h` で swap が有効であることを確認します。それでも OOM が発生する場合は、ローカルモデルではなく API ベースのモデル（Claude、GPT）に切り替えるか、2 GB Droplet にアップグレードします。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway 設定](/ja-JP/gateway/configuration) -- すべての設定オプション
- [更新](/ja-JP/install/updating) -- OpenClaw を最新に保つ

## 関連

- [インストール概要](/ja-JP/install)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)
- [VPS ホスティング](/ja-JP/vps)

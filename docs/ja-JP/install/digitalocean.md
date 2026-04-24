---
read_when:
    - DigitalOcean上でOpenClawをセットアップする შემთხვევაში
    - OpenClaw向けのシンプルな有料VPSを探している場合
summary: DigitalOcean Droplet上でOpenClawをホストする
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T05:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

DigitalOcean Droplet上で永続的なOpenClaw Gatewayを実行します。

## 前提条件

- DigitalOceanアカウント（[signup](https://cloud.digitalocean.com/registrations/new)）
- SSH鍵ペア（またはパスワード認証を使う意思）
- 約20分

## セットアップ

<Steps>
  <Step title="Dropletを作成する">
    <Warning>
    クリーンなベースイメージ（Ubuntu 24.04 LTS）を使用してください。起動スクリプトとファイアウォールのデフォルトを確認していない限り、サードパーティのMarketplace 1-clickイメージは避けてください。
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/)にログインします。
    2. **Create > Droplets**をクリックします。
    3. 次を選択します:
       - **Region:** 自分に最も近いリージョン
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH key（推奨）またはpassword
    4. **Create Droplet**をクリックし、IPアドレスを控えます。

  </Step>

  <Step title="接続してインストールする">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24をインストール
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClawをインストール
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    このウィザードでは、モデル認証、チャネル設定、gatewayトークン生成、およびdaemonインストール（systemd）を案内します。

  </Step>

  <Step title="swapを追加する（1 GB Dropletでは推奨）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="gatewayを確認する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UIにアクセスする">
    gatewayはデフォルトでloopbackにbindします。次のいずれかのオプションを選んでください。

    **オプションA: SSHトンネル（最も簡単）**

    ```bash
    # ローカルマシンから
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    その後、`http://localhost:18789`を開きます。

    **オプションB: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    その後、tailnet上の任意のデバイスから`https://<magicdns>/`を開きます。

    **オプションC: Tailnet bind（Serveなし）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    その後、`http://<tailscale-ip>:18789`を開きます（トークンが必要です）。

  </Step>
</Steps>

## トラブルシューティング

**gatewayが起動しない** -- `openclaw doctor --non-interactive`を実行し、`journalctl --user -u openclaw-gateway.service -n 50`でログを確認してください。

**ポートがすでに使用中** -- `lsof -i :18789`を実行してプロセスを特定し、それを停止してください。

**メモリ不足** -- `free -h`でswapが有効か確認してください。それでもOOMが発生する場合は、ローカルモデルではなくAPIベースのモデル（Claude、GPT）を使用するか、2 GB Dropletへアップグレードしてください。

## 次のステップ

- [Channels](/ja-JP/channels) -- Telegram、WhatsApp、Discordなどを接続する
- [Gateway configuration](/ja-JP/gateway/configuration) -- すべての設定オプション
- [Updating](/ja-JP/install/updating) -- OpenClawを最新の状態に保つ

## 関連

- [Install overview](/ja-JP/install)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)
- [VPS hosting](/ja-JP/vps)

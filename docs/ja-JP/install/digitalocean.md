---
read_when:
    - DigitalOcean で OpenClaw をセットアップする
    - OpenClaw 向けのシンプルな有料 VPS を探す
summary: DigitalOcean Droplet で OpenClaw をホストする
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T05:09:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

DigitalOcean Droplet（1 GB Basic プランで約 $6/月）で永続的な OpenClaw Gateway を実行します。

DigitalOcean は最もシンプルな有料 VPS ルートです。より安い、または無料の選択肢を好む場合:

- [Hetzner](/ja-JP/install/hetzner) — €3.79/月、1ドルあたりのコア数/RAM が多い。
- [Oracle Cloud](/ja-JP/install/oracle) — Always Free ARM（最大 4 OCPU、24 GB RAM）ですが、サインアップが不安定な場合があり、ARM 専用です。

## 前提条件

- DigitalOcean アカウント（[登録](https://cloud.digitalocean.com/registrations/new)）
- SSH キーペア（またはパスワード認証を使う意思）
- 約 20 分

## セットアップ

<Steps>
  <Step title="Droplet を作成する">
    <Warning>
    クリーンなベースイメージ（Ubuntu 24.04 LTS）を使用してください。起動スクリプトとファイアウォールのデフォルトを確認していない限り、サードパーティの Marketplace 1-click イメージは避けてください。
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) にログインします。
    2. **Create > Droplets** をクリックします。
    3. 次を選択します:
       - **リージョン:** 自分に最も近い場所
       - **イメージ:** Ubuntu 24.04 LTS
       - **サイズ:** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **認証:** SSH キー（推奨）またはパスワード
    4. **Create Droplet** をクリックし、IP アドレスを控えます。

  </Step>

  <Step title="接続してインストールする">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードが、モデル認証、チャネル設定、Gateway トークン生成、デーモンインストール（systemd）を順に案内します。

  </Step>

  <Step title="swap を追加する（1 GB Droplet では推奨）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway を確認する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="コントロール UI にアクセスする">
    Gateway はデフォルトでループバックにバインドします。次のいずれかのオプションを選びます。

    **オプション A: SSH トンネル（最もシンプル）**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    その後、`http://localhost:18789` を開きます。

    **オプション B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    その後、tailnet 上の任意のデバイスから `https://<magicdns>/` を開きます。

    Tailscale Serve は tailnet ID ヘッダーを通じてコントロール UI と WebSocket トラフィックを認証します。これは Gateway ホスト自体が信頼されていることを前提にします。HTTP API エンドポイントは、それにかかわらず Gateway の通常の認証モード（トークン/パスワード）に従います。Serve 経由で明示的な共有シークレット認証情報を要求するには、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使用します。

    **オプション C: Tailnet バインド（Serve なし）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    その後、`http://<tailscale-ip>:18789` を開きます（トークンが必要）。

  </Step>
</Steps>

## 永続化とバックアップ

OpenClaw の状態は次の場所にあります:

- `~/.openclaw/` — `openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル/プロバイダーの状態、セッションデータ。
- `~/.openclaw/workspace/` — エージェントのワークスペース（SOUL.md、メモリ、アーティファクト）。

これらは Droplet の再起動後も保持されます。ポータブルなスナップショットを取得するには:

```bash
openclaw backup create
```

DigitalOcean スナップショットは Droplet 全体をバックアップします。`openclaw backup create` はホストをまたいで移植できます。

## 1 GB RAM のヒント

$6 の Droplet には 1 GB RAM しかありません。スムーズに保つには:

- 上記の swap 手順が `/etc/fstab` に入っていることを確認し、再起動後も維持されるようにします。
- ローカルモデルより API ベースのモデル（Claude、GPT）を優先します — ローカル LLM 推論は 1 GB には収まりません。
- 大きなプロンプトで OOM が発生する場合は、`agents.defaults.model.primary` をより小さいモデルに設定します。
- `free -h` と `htop` で監視します。

## トラブルシューティング

**Gateway が起動しない** -- `openclaw doctor --non-interactive` を実行し、`journalctl --user -u openclaw-gateway.service -n 50` でログを確認します。

**ポートがすでに使用中** -- `lsof -i :18789` を実行してプロセスを見つけ、その後停止します。

**メモリ不足** -- `free -h` で swap が有効であることを確認します。それでも OOM が発生する場合は、ローカルモデルではなく API ベースのモデル（Claude、GPT）を使用するか、2 GB Droplet にアップグレードします。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway 設定](/ja-JP/gateway/configuration) -- すべての設定オプション
- [更新](/ja-JP/install/updating) -- OpenClaw を最新の状態に保つ

## 関連

- [インストール概要](/ja-JP/install)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)
- [VPS ホスティング](/ja-JP/vps)

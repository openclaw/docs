---
read_when:
    - DigitalOcean で OpenClaw をセットアップする
    - OpenClaw 向けの安価な VPS ホスティングを探す
summary: DigitalOcean 上の OpenClaw（シンプルな有料 VPS オプション）
title: DigitalOcean（プラットフォーム）
x-i18n:
    generated_at: "2026-04-30T05:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# DigitalOcean での OpenClaw

## 目標

**月額 $6**（リザーブド料金なら月額 $4）で、永続的な OpenClaw Gateway を DigitalOcean 上で実行します。

月額 $0 の選択肢がよく、ARM とプロバイダー固有のセットアップを許容できる場合は、[Oracle Cloud ガイド](/ja-JP/install/oracle)を参照してください。

## コスト比較（2026）

| プロバイダー | プラン | 仕様 | 月額 | メモ |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | 最大 4 OCPU、24GB RAM | $0 | ARM、容量制限 / サインアップの癖あり |
| Hetzner | CX22 | 2 vCPU、4GB RAM | €3.79（約 $4） | 最安の有料オプション |
| DigitalOcean | Basic | 1 vCPU、1GB RAM | $6 | 使いやすい UI、優れたドキュメント |
| Vultr | Cloud Compute | 1 vCPU、1GB RAM | $6 | 多数のロケーション |
| Linode | Nanode | 1 vCPU、1GB RAM | $5 | 現在は Akamai の一部 |

**プロバイダーの選び方:**

- DigitalOcean: 最もシンプルな UX + 予測しやすいセットアップ（このガイド）
- Hetzner: 価格性能比が良い（[Hetzner ガイド](/ja-JP/install/hetzner)を参照）
- Oracle Cloud: 月額 $0 にできるが、やや扱いにくく ARM のみ（[Oracle ガイド](/ja-JP/install/oracle)を参照）

---

## 前提条件

- DigitalOcean アカウント（[$200 の無料クレジット付きでサインアップ](https://m.do.co/c/signup)）
- SSH キーペア（またはパスワード認証を使う意思）
- 約 20 分

## 1) Droplet を作成する

<Warning>
クリーンなベースイメージ（Ubuntu 24.04 LTS）を使用してください。起動スクリプトとファイアウォールのデフォルトを確認していない限り、サードパーティの Marketplace 1-click イメージは避けてください。
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/) にログインします
2. **Create → Droplets** をクリックします
3. 次を選択します:
   - **Region:** 自分（またはユーザー）に最も近いリージョン
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo**（1 vCPU、1GB RAM、25GB SSD）
   - **Authentication:** SSH key（推奨）または password
4. **Create Droplet** をクリックします
5. IP アドレスを控えます

## 2) SSH で接続する

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw をインストールする

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

ウィザードが次の内容を案内します:

- モデル認証（API キーまたは OAuth）
- チャンネル設定（Telegram、WhatsApp、Discord など）
- Gateway トークン（自動生成）
- デーモンのインストール（systemd）

## 5) Gateway を確認する

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) ダッシュボードにアクセスする

Gateway はデフォルトで loopback にバインドします。Control UI にアクセスするには:

**オプション A: SSH トンネル（推奨）**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**オプション B: Tailscale Serve（HTTPS、loopback 専用）**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

開く: `https://<magicdns>/`

メモ:

- Serve は Gateway を loopback 専用のままにし、Tailscale ID ヘッダーを通じて Control UI/WebSocket トラフィックを認証します（トークンなし認証は信頼済み Gateway ホストを前提とします。HTTP API はこれらの Tailscale ヘッダーを使用せず、Gateway の通常の HTTP 認証モードに従います）。
- 代わりに明示的な共有シークレット認証情報を必須にするには、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使用します。

**オプション C: Tailnet バインド（Serve なし）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

開く: `http://<tailscale-ip>:18789`（トークンが必要）。

## 7) チャンネルを接続する

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

他のプロバイダーについては [チャンネル](/ja-JP/channels) を参照してください。

---

## 1GB RAM 向けの最適化

$6 の Droplet には 1GB RAM しかありません。安定して動作させるには:

### swap を追加する（推奨）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 軽量なモデルを使う

OOM が発生する場合は、次を検討してください:

- ローカルモデルの代わりに API ベースのモデル（Claude、GPT）を使用する
- `agents.defaults.model.primary` をより小さいモデルに設定する

### メモリを監視する

```bash
free -h
htop
```

---

## 永続化

すべての状態は次に保存されます:

- `~/.openclaw/` — `openclaw.json`、エージェントごとの `auth-profiles.json`、チャンネル/プロバイダーの状態、セッションデータ
- `~/.openclaw/workspace/` — ワークスペース（SOUL.md、memory など）

これらは再起動後も保持されます。定期的にバックアップしてください:

```bash
openclaw backup create
```

---

## Oracle Cloud の無料代替案

Oracle Cloud は、ここにあるどの有料オプションよりも大幅に強力な **Always Free** ARM インスタンスを提供しています。月額 $0 です。

| 得られるもの | 仕様 |
| ----------------- | ---------------------- |
| **4 OCPU** | ARM Ampere A1 |
| **24GB RAM** | 十分以上 |
| **200GB ストレージ** | ブロックボリューム |
| **永続無料** | クレジットカードへの請求なし |

**注意点:**

- サインアップがうまくいかない場合があります（失敗したら再試行してください）
- ARM アーキテクチャ — ほとんどのものは動作しますが、一部のバイナリは ARM ビルドが必要です

完全なセットアップガイドについては、[Oracle Cloud](/ja-JP/install/oracle) を参照してください。サインアップのヒントと登録プロセスのトラブルシューティングについては、この[コミュニティガイド](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)を参照してください。

---

## トラブルシューティング

### Gateway が起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### ポートがすでに使用中

```bash
lsof -i :18789
kill <PID>
```

### メモリ不足

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 関連

- [Hetzner ガイド](/ja-JP/install/hetzner) — より安価で、より高性能
- [Docker インストール](/ja-JP/install/docker) — コンテナ化されたセットアップ
- [Tailscale](/ja-JP/gateway/tailscale) — 安全なリモートアクセス
- [設定](/ja-JP/gateway/configuration) — 完全な設定リファレンス

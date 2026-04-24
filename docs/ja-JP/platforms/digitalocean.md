---
read_when:
    - DigitalOcean で OpenClaw をセットアップしている場合
    - OpenClaw 向けの安価な VPS ホスティングを探している場合
summary: DigitalOcean 上での OpenClaw（シンプルな有料 VPS オプション）
title: DigitalOcean（プラットフォーム）
x-i18n:
    generated_at: "2026-04-24T05:07:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# DigitalOcean 上での OpenClaw

## 目標

DigitalOcean 上で **月額 $6**（または予約価格なら月額 $4）で永続的な OpenClaw Gateway を動かします。

月額 $0 を希望し、ARM + プロバイダ固有セットアップを許容できるなら、[Oracle Cloud ガイド](/ja-JP/install/oracle) を参照してください。

## コスト比較（2026）

| プロバイダ   | プラン            | スペック               | 月額         | 注記                                  |
| ------------ | ----------------- | ---------------------- | ------------ | ------------------------------------- |
| Oracle Cloud | Always Free ARM   | 最大 4 OCPU, 24GB RAM  | $0           | ARM、容量制限 / signup の癖あり       |
| Hetzner      | CX22              | 2 vCPU, 4GB RAM        | €3.79 (~$4)  | 最安の有料オプション                  |
| DigitalOcean | Basic             | 1 vCPU, 1GB RAM        | $6           | UI が簡単、ドキュメントが良い         |
| Vultr        | Cloud Compute     | 1 vCPU, 1GB RAM        | $6           | ロケーションが多い                    |
| Linode       | Nanode            | 1 vCPU, 1GB RAM        | $5           | 現在は Akamai 傘下                    |

**プロバイダ選び:**

- DigitalOcean: もっとも簡単な UX + 予測しやすいセットアップ（このガイド）
- Hetzner: 価格 / 性能が良い（[Hetzner guide](/ja-JP/install/hetzner) を参照）
- Oracle Cloud: 月額 $0 にできるが、より癖があり ARM 専用（[Oracle guide](/ja-JP/install/oracle) を参照）

---

## 前提条件

- DigitalOcean アカウント（[signup with $200 free credit](https://m.do.co/c/signup)）
- SSH キーペア（または password 認証を使う意思）
- 約 20 分

## 1) Droplet を作成

<Warning>
クリーンなベースイメージ（Ubuntu 24.04 LTS）を使ってください。起動スクリプトやファイアウォールデフォルトを確認していない限り、サードパーティ Marketplace の 1-click イメージは避けてください。
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/) にログイン
2. **Create → Droplets** をクリック
3. 次を選択:
   - **Region:** 自分（またはユーザー）に近い場所
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo**（1 vCPU, 1GB RAM, 25GB SSD）
   - **Authentication:** SSH key（推奨）または password
4. **Create Droplet** をクリック
5. IP アドレスを控える

## 2) SSH で接続

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw をインストール

```bash
# システム更新
apt update && apt upgrade -y

# Node.js 24 をインストール
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# OpenClaw をインストール
curl -fsSL https://openclaw.ai/install.sh | bash

# 確認
openclaw --version
```

## 4) オンボーディングを実行

```bash
openclaw onboard --install-daemon
```

ウィザードでは次を順に設定します:

- モデル認証（API キーまたは OAuth）
- チャネル設定（Telegram、WhatsApp、Discord など）
- Gateway token（自動生成）
- daemon インストール（systemd）

## 5) Gateway を確認

```bash
# ステータス確認
openclaw status

# サービス確認
systemctl --user status openclaw-gateway.service

# ログ表示
journalctl --user -u openclaw-gateway.service -f
```

## 6) Dashboard にアクセス

gateway はデフォルトで loopback に bind します。Control UI にアクセスするには:

**Option A: SSH トンネル（推奨）**

```bash
# ローカルマシンから
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# その後開く: http://localhost:18789
```

**Option B: Tailscale Serve（HTTPS, loopback-only）**

```bash
# droplet 上で
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Gateway を Tailscale Serve を使うよう設定
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

開く: `https://<magicdns>/`

注記:

- Serve は Gateway を loopback-only のまま保ち、Tailscale identity header を通じて Control UI / WebSocket トラフィックを認証します（token なし認証は信頼できる gateway ホストを前提とします。HTTP API はこれらの Tailscale header を使わず、代わりに gateway の通常の HTTP auth mode に従います）。
- 代わりに明示的な shared-secret 認証情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使ってください。

**Option C: Tailnet bind（Serve なし）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

開く: `http://<tailscale-ip>:18789`（token 必須）。

## 7) チャネルを接続

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# QR コードをスキャン
```

その他のプロバイダは [Channels](/ja-JP/channels) を参照してください。

---

## 1GB RAM 向け最適化

$6 droplet は 1GB RAM しかありません。安定動作のためには:

### swap を追加（推奨）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 軽いモデルを使う

OOM が起きる場合は、次を検討してください:

- ローカルモデルではなく API ベースモデル（Claude、GPT）を使う
- `agents.defaults.model.primary` をより小さいモデルに設定する

### メモリ監視

```bash
free -h
htop
```

---

## 永続化

すべての state は次に保存されます:

- `~/.openclaw/` — `openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル / プロバイダ状態、セッションデータ
- `~/.openclaw/workspace/` — workspace（`SOUL.md`、memory など）

これらは再起動後も残ります。定期的にバックアップしてください:

```bash
openclaw backup create
```

---

## Oracle Cloud Free の代替案

Oracle Cloud には **Always Free** の ARM インスタンスがあり、ここに挙げたどの有料オプションよりも大幅に高性能です。それでいて月額 $0 です。

| 得られるもの      | スペック               |
| ----------------- | ---------------------- |
| **4 OCPUs**       | ARM Ampere A1          |
| **24GB RAM**      | 十分以上               |
| **200GB storage** | Block volume           |
| **永久無料**      | クレジットカード請求なし |

**注意点:**

- signup に癖があることがあります（失敗したら再試行）
- ARM アーキテクチャ — ほとんどは動きますが、一部バイナリには ARM ビルドが必要です

完全なセットアップガイドは [Oracle Cloud](/ja-JP/install/oracle) を参照してください。signup のコツや登録プロセスのトラブルシューティングには、この [community guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) も参照してください。

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
# メモリ確認
free -h

# swap を増やす
# または $12/mo droplet（2GB RAM）へアップグレード
```

---

## 関連

- [Hetzner guide](/ja-JP/install/hetzner) — より安く、より高性能
- [Docker install](/ja-JP/install/docker) — コンテナ化セットアップ
- [Tailscale](/ja-JP/gateway/tailscale) — 安全なリモートアクセス
- [Configuration](/ja-JP/gateway/configuration) — 完全な設定リファレンス

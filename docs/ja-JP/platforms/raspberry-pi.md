---
read_when:
    - Raspberry Pi で OpenClaw をセットアップする
    - ARM デバイスで OpenClaw を実行する
    - 安価で常時稼働するパーソナル AI を構築する
summary: Raspberry PiでのOpenClaw（低予算のセルフホスト構成）
title: Raspberry Pi（プラットフォーム）
x-i18n:
    generated_at: "2026-04-30T05:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# Raspberry Pi 上の OpenClaw

## 目標

一度きりの費用 **~$35-80**（月額費用なし）で、Raspberry Pi 上に永続的で常時稼働する OpenClaw Gateway を動かします。

最適な用途:

- 24時間365日の個人AIアシスタント
- ホームオートメーションハブ
- 低消費電力で常時利用できる Telegram/WhatsApp ボット

## ハードウェア要件

| Pi モデル      | RAM     | 動作するか | メモ                               |
| --------------- | ------- | ---------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ 最適    | 最速、推奨                         |
| **Pi 4**        | 4GB     | ✅ 良好    | ほとんどのユーザーに最適なバランス |
| **Pi 4**        | 2GB     | ✅ OK      | 動作するが、swap を追加            |
| **Pi 4**        | 1GB     | ⚠️ 厳しい  | swap と最小構成なら可能            |
| **Pi 3B+**      | 1GB     | ⚠️ 遅い    | 動作するがもたつく                 |
| **Pi Zero 2 W** | 512MB   | ❌         | 推奨しない                         |

**最小スペック:** 1GB RAM、1 core、500MB disk  
**推奨:** 2GB+ RAM、64-bit OS、16GB+ SD card（または USB SSD）

## 必要なもの

- Raspberry Pi 4 または 5（2GB+ 推奨）
- MicroSD card（16GB+）または USB SSD（より高性能）
- 電源（公式 Pi PSU 推奨）
- ネットワーク接続（Ethernet または WiFi）
- 約30分

## 1) OS を書き込む

**Raspberry Pi OS Lite (64-bit)** を使います。ヘッドレスサーバーにデスクトップは不要です。

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロード
2. OS を選択: **Raspberry Pi OS Lite (64-bit)**
3. 歯車アイコン（⚙️）をクリックして事前設定:
   - ホスト名を設定: `gateway-host`
   - SSH を有効化
   - ユーザー名/パスワードを設定
   - WiFi を設定（Ethernet を使わない場合）
4. SD card / USB drive に書き込み
5. Pi に挿入して起動

## 2) SSH で接続

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) システムのセットアップ

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Node.js 24 (ARM64) をインストール

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Swap を追加（2GB 以下では重要）

Swap はメモリ不足によるクラッシュを防ぎます:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw をインストール

### オプション A: 標準インストール（推奨）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### オプション B: 改造しやすいインストール（いじりたい場合）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

改造しやすいインストールではログとコードへ直接アクセスできます。ARM 固有の問題をデバッグするのに便利です。

## 7) オンボーディングを実行

```bash
openclaw onboard --install-daemon
```

ウィザードに従います:

1. **Gateway モード:** ローカル
2. **認証:** API キー推奨（OAuth はヘッドレス Pi では扱いにくい場合があります）
3. **チャネル:** Telegram が最も始めやすいです
4. **Daemon:** はい（systemd）

## 8) インストールを確認

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw Dashboard にアクセス

`user@gateway-host` を Pi のユーザー名とホスト名、または IP アドレスに置き換えます。

コンピューターから、Pi に新しいダッシュボード URL を表示させます:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

このコマンドは `Dashboard URL:` を出力します。`gateway.auth.token`
の設定に応じて、URL は通常の `http://127.0.0.1:18789/` リンクの場合もあれば、
`#token=...` を含む場合もあります。

コンピューターの別のターミナルで SSH トンネルを作成します:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

その後、表示された Dashboard URL をローカルブラウザーで開きます。

UI が共有シークレット認証を求める場合は、設定済みのトークンまたはパスワードを
Control UI 設定に貼り付けます。トークン認証では `gateway.auth.token`（または
`OPENCLAW_GATEWAY_TOKEN`）を使います。

常時稼働のリモートアクセスについては、[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

---

## パフォーマンス最適化

### USB SSD を使う（大幅な改善）

SD cards は遅く、消耗します。USB SSD はパフォーマンスを大幅に改善します:

```bash
# Check if booting from USB
lsblk
```

セットアップについては [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) を参照してください。

### CLI 起動を高速化（モジュールコンパイルキャッシュ）

低消費電力の Pi ホストでは、Node のモジュールコンパイルキャッシュを有効にすると、繰り返しの CLI 実行が速くなります:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

メモ:

- `NODE_COMPILE_CACHE` は以後の実行（`status`、`health`、`--help`）を高速化します。
- `/var/tmp` は `/tmp` より再起動後も残りやすいです。
- `OPENCLAW_NO_RESPAWN=1` は CLI の自己再起動による追加の起動コストを避けます。
- 初回実行でキャッシュが温まり、以後の実行で最も効果があります。

### systemd 起動チューニング（任意）

この Pi が主に OpenClaw を実行する用途なら、サービス drop-in を追加して再起動の
揺らぎを減らし、起動環境を安定させます:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

その後、適用します:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

可能であれば、OpenClaw の状態/キャッシュを SSD-backed storage に置き、コールドスタート時の
SD-card のランダム I/O ボトルネックを避けます。

これがヘッドレス Pi なら、ユーザーサービスがログアウト後も生き残るように lingering を一度有効化します:

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` ポリシーが自動復旧にどう役立つか:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### メモリ使用量を減らす

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### リソースを監視

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM 固有のメモ

### バイナリ互換性

ほとんどの OpenClaw 機能は ARM64 で動作しますが、一部の外部バイナリは ARM ビルドが必要な場合があります:

| ツール             | ARM64 ステータス | メモ                        |
| ------------------ | ---------------- | --------------------------- |
| Node.js            | ✅               | とてもよく動作              |
| WhatsApp (Baileys) | ✅               | Pure JS、問題なし           |
| Telegram           | ✅               | Pure JS、問題なし           |
| gog (Gmail CLI)    | ⚠️               | ARM release を確認          |
| Chromium (browser) | ✅               | `sudo apt install chromium-browser` |

Skills が失敗した場合は、そのバイナリに ARM ビルドがあるか確認してください。多くの Go/Rust ツールにはありますが、ないものもあります。

### 32-bit と 64-bit

**必ず 64-bit OS を使ってください。** Node.js と多くの最新ツールが必要とします。次で確認します:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## 推奨モデル設定

Pi は Gateway にすぎない（モデルはクラウドで実行される）ため、API ベースのモデルを使います:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Pi 上でローカル LLM を実行しようとしないでください**。小さなモデルでも遅すぎます。重い処理は Claude/GPT に任せます。

---

## 起動時の自動開始

オンボーディングでこれは設定されますが、確認するには:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## トラブルシューティング

### メモリ不足（OOM）

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### パフォーマンスが遅い

- SD card ではなく USB SSD を使う
- 未使用サービスを無効化: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU throttling を確認: `vcgencmd get_throttled`（`0x0` が返るはず）

### サービスが起動しない

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM バイナリの問題

Skills が "exec format error" で失敗する場合:

1. バイナリに ARM64 ビルドがあるか確認する
2. ソースからビルドしてみる
3. または ARM support のある Docker コンテナーを使う

### WiFi が切れる

WiFi 上のヘッドレス Pi では:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## コスト比較

| セットアップ   | 一度きりの費用 | 月額費用 | メモ                         |
| -------------- | -------------- | -------- | ---------------------------- |
| **Pi 4 (2GB)** | ~$45           | $0       | + 電力（~$5/年）             |
| **Pi 4 (4GB)** | ~$55           | $0       | 推奨                         |
| **Pi 5 (4GB)** | ~$60           | $0       | 最高のパフォーマンス         |
| **Pi 5 (8GB)** | ~$80           | $0       | 過剰だが将来性あり           |
| DigitalOcean   | $0             | $6/月    | $72/年                       |
| Hetzner        | $0             | €3.79/月 | ~$50/年                      |

**損益分岐点:** Pi は cloud VPS と比べて約6〜12か月で元が取れます。

---

## 関連

- [Linux ガイド](/ja-JP/platforms/linux) — 一般的な Linux セットアップ
- [DigitalOcean ガイド](/ja-JP/install/digitalocean) — クラウドの代替
- [Hetzner ガイド](/ja-JP/install/hetzner) — Docker セットアップ
- [Tailscale](/ja-JP/gateway/tailscale) — リモートアクセス
- [Nodes](/ja-JP/nodes) — ラップトップ/スマートフォンを Pi gateway とペアリング

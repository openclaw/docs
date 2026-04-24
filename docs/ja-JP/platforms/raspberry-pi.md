---
read_when:
    - Raspberry Pi に OpenClaw をセットアップする դեպքում
    - ARM デバイスで OpenClaw を実行する場合
    - 安価で常時稼働の個人 AI を構築する場合
summary: Raspberry Pi での OpenClaw（低予算のセルフホスト構成）
title: Raspberry Pi（プラットフォーム）
x-i18n:
    generated_at: "2026-04-24T05:09:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi での OpenClaw

## 目的

Raspberry Pi 上で、**一度きり約 $35-80** のコスト（月額料金なし）で、永続的に常時稼働する OpenClaw Gateway を実行する。

次の用途に最適です。

- 24/7 の個人 AI アシスタント
- ホームオートメーションハブ
- 低消費電力で常時利用可能な Telegram/WhatsApp ボット

## ハードウェア要件

| Pi モデル       | RAM     | 動作するか | 備考                               |
| --------------- | ------- | ---------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ 最良     | 最速。推奨                         |
| **Pi 4**        | 4GB     | ✅ 良好     | 多くのユーザーにとって最適         |
| **Pi 4**        | 2GB     | ✅ 可       | 動作する。swap を追加              |
| **Pi 4**        | 1GB     | ⚠️ 厳しい   | swap と最小構成で可能              |
| **Pi 3B+**      | 1GB     | ⚠️ 遅い     | 動作するが重い                     |
| **Pi Zero 2 W** | 512MB   | ❌         | 非推奨                             |

**最小仕様:** 1GB RAM、1 コア、500MB ディスク  
**推奨:** 2GB 以上の RAM、64-bit OS、16GB 以上の SD カード（または USB SSD）

## 必要なもの

- Raspberry Pi 4 または 5（2GB 以上推奨）
- MicroSD カード（16GB 以上）または USB SSD（より高性能）
- 電源（公式 Pi PSU 推奨）
- ネットワーク接続（Ethernet または WiFi）
- 約 30 分

## 1) OS を書き込む

ヘッドレスサーバーには **Raspberry Pi OS Lite（64-bit）** を使ってください。デスクトップは不要です。

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロード
2. OS として **Raspberry Pi OS Lite（64-bit）** を選ぶ
3. ギアアイコン（⚙️）をクリックして事前設定:
   - ホスト名を設定: `gateway-host`
   - SSH を有効化
   - ユーザー名/パスワードを設定
   - WiFi を設定（Ethernet を使わない場合）
4. SD カード / USB ドライブに書き込む
5. Pi に挿入して起動する

## 2) SSH で接続する

```bash
ssh user@gateway-host
# または IP アドレスを使う
ssh user@192.168.x.x
```

## 3) システムセットアップ

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# 必須パッケージをインストール
sudo apt install -y git curl build-essential

# タイムゾーンを設定（Cron/リマインダーに重要）
sudo timedatectl set-timezone America/Chicago  # あなたのタイムゾーンに変更
```

## 4) Node.js 24 をインストールする（ARM64）

```bash
# NodeSource 経由で Node.js をインストール
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 確認
node --version  # v24.x.x と表示されるはず
npm --version
```

## 5) Swap を追加する（2GB 以下では重要）

swap はメモリ不足クラッシュを防ぎます。

```bash
# 2GB の swap ファイルを作成
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永続化
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 低 RAM 向けに最適化（swappiness を減らす）
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw をインストールする

### オプション A: 標準インストール（推奨）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### オプション B: Hackable インストール（いじりたい人向け）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Hackable インストールではログとコードに直接アクセスできるため、ARM 固有の問題をデバッグするのに便利です。

## 7) オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

ウィザードでは次に従ってください。

1. **Gateway mode:** Local
2. **Auth:** API キー推奨（OAuth はヘッドレス Pi では不安定なことがある）
3. **Channels:** 最初は Telegram が最も簡単
4. **Daemon:** Yes（systemd）

## 8) インストールを確認する

```bash
# ステータス確認
openclaw status

# サービス確認（標準インストール = systemd ユーザーユニット）
systemctl --user status openclaw-gateway.service

# ログ表示
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw ダッシュボードにアクセスする

`user@gateway-host` は、あなたの Pi のユーザー名とホスト名または IP アドレスに置き換えてください。

コンピューター上で、Pi に新しいダッシュボード URL を表示させます。

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

このコマンドは `Dashboard URL:` を表示します。`gateway.auth.token`
の設定方法に応じて、その URL は単純な `http://127.0.0.1:18789/` リンクか、
`#token=...` を含むリンクになります。

コンピューター上の別のターミナルで、SSH トンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

その後、表示された Dashboard URL をローカル browser で開いてください。

UI が共有シークレット認証を求める場合は、設定済み token または password
を Control UI 設定に貼り付けてください。token 認証の場合は `gateway.auth.token`（または
`OPENCLAW_GATEWAY_TOKEN`）を使います。

常時有効なリモートアクセスについては、[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

---

## パフォーマンス最適化

### USB SSD を使う（大きな改善）

SD カードは遅く、劣化します。USB SSD を使うとパフォーマンスが大幅に向上します。

```bash
# USB から起動しているか確認
lsblk
```

設定については [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) を参照してください。

### CLI 起動を高速化する（モジュールコンパイルキャッシュ）

低消費電力の Pi ホストでは、Node のモジュールコンパイルキャッシュを有効にして、繰り返しの CLI 実行を高速化してください。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

注意:

- `NODE_COMPILE_CACHE` は、2 回目以降の実行（`status`, `health`, `--help`）を高速化します。
- `/var/tmp` は `/tmp` より再起動後も残りやすいです。
- `OPENCLAW_NO_RESPAWN=1` は、CLI 自己再起動による追加起動コストを避けます。
- 初回実行でキャッシュが温まり、その後の実行で最も効果が出ます。

### systemd 起動チューニング（任意）

この Pi が主に OpenClaw を動かすなら、サービス drop-in を追加して再起動
ジッターを減らし、起動 env を安定化できます。

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

その後適用:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

可能なら、cold start 時の SD カードの
ランダム I/O ボトルネックを避けるため、OpenClaw の state/cache は SSD ベースストレージに置いてください。

これがヘッドレス Pi なら、ユーザーサービスが
ログアウト後も生き残るように一度 lingering を有効化してください。

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` ポリシーが自動復旧にどのように役立つか:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### メモリ使用量を減らす

```bash
# GPU メモリ割り当てを無効化（ヘッドレス）
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 不要なら Bluetooth を無効化
sudo systemctl disable bluetooth
```

### リソース監視

```bash
# メモリ確認
free -h

# CPU 温度確認
vcgencmd measure_temp

# ライブ監視
htop
```

---

## ARM 固有の注意

### バイナリ互換性

OpenClaw の大部分の機能は ARM64 で動作しますが、一部の外部バイナリには ARM ビルドが必要な場合があります。

| Tool               | ARM64 状態 | 備考                                  |
| ------------------ | ---------- | ------------------------------------- |
| Node.js            | ✅         | 問題なく動作                          |
| WhatsApp（Baileys） | ✅         | Pure JS。問題なし                     |
| Telegram           | ✅         | Pure JS。問題なし                     |
| gog（Gmail CLI）    | ⚠️         | ARM リリースがあるか確認              |
| Chromium（browser） | ✅         | `sudo apt install chromium-browser`   |

Skill が失敗する場合は、そのバイナリに ARM ビルドがあるか確認してください。多くの Go/Rust tool にはありますが、ないものもあります。

### 32-bit と 64-bit

**必ず 64-bit OS を使ってください。** Node.js と多くの現代的な tool はこれを必要とします。次で確認してください。

```bash
uname -m
# 次のように表示されるはず: aarch64（64-bit）であり armv7l（32-bit）ではない
```

---

## 推奨モデル構成

Pi は Gateway にすぎないため（モデルはクラウドで実行される）、API ベースのモデルを使ってください。

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

**Pi 上でローカル LLM を動かそうとしないでください**。小さいモデルでも遅すぎます。重い処理は Claude/GPT に任せてください。

---

## ブート時の自動起動

オンボーディングで設定されますが、確認するには:

```bash
# サービスが有効か確認
systemctl --user is-enabled openclaw-gateway.service

# 有効でなければ有効化
systemctl --user enable openclaw-gateway.service

# ブート時に起動
systemctl --user start openclaw-gateway.service
```

---

## トラブルシューティング

### メモリ不足（OOM）

```bash
# メモリ確認
free -h

# さらに swap を追加する（手順 5 を参照）
# または Pi 上で動作しているサービスを減らす
```

### パフォーマンスが遅い

- SD カードではなく USB SSD を使う
- 未使用サービスを無効化する: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU throttling を確認する: `vcgencmd get_throttled`（`0x0` が望ましい）

### サービスが起動しない

```bash
# ログ確認
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# よくある修正: 再ビルド
cd ~/openclaw  # hackable install を使っている場合
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM バイナリの問題

Skill が "exec format error" で失敗する場合:

1. そのバイナリに ARM64 ビルドがあるか確認する
2. ソースからビルドしてみる
3. または ARM サポート付きの Docker コンテナを使う

### WiFi が切れる

WiFi 利用のヘッドレス Pi では:

```bash
# WiFi の電力管理を無効化
sudo iwconfig wlan0 power off

# 永続化
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## コスト比較

| 構成             | 初期費用 | 月額費用 | 備考                         |
| ---------------- | -------- | -------- | ---------------------------- |
| **Pi 4（2GB）**  | ~$45     | $0       | + 電気代（約 $5/年）         |
| **Pi 4（4GB）**  | ~$55     | $0       | 推奨                         |
| **Pi 5（4GB）**  | ~$60     | $0       | 最良の性能                   |
| **Pi 5（8GB）**  | ~$80     | $0       | 過剰だが将来性あり           |
| DigitalOcean     | $0       | $6/月    | $72/年                       |
| Hetzner          | $0       | €3.79/月 | 約 $50/年                    |

**損益分岐点:** Pi はクラウド VPS と比べて約 6〜12 か月で元が取れます。

---

## 関連

- [Linux guide](/ja-JP/platforms/linux) — 一般的な Linux セットアップ
- [DigitalOcean guide](/ja-JP/install/digitalocean) — クラウド代替
- [Hetzner guide](/ja-JP/install/hetzner) — Docker セットアップ
- [Tailscale](/ja-JP/gateway/tailscale) — リモートアクセス
- [Nodes](/ja-JP/nodes) — ノート PC / スマートフォンを Pi Gateway とペアリングする

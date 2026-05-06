---
read_when:
    - Raspberry Pi で OpenClaw をセットアップする
    - ARM デバイスで OpenClaw を実行する
    - 安価な常時稼働の個人用AIを構築する
summary: 常時稼働のセルフホスティングのために Raspberry Pi で OpenClaw をホストする
title: Raspberry Pi
x-i18n:
    generated_at: "2026-05-06T05:11:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96df076c2707b0b27751d452f15fad774356a86e96d10bce998581235776c4bc
    source_path: install/raspberry-pi.md
    workflow: 16
---

Raspberry Pi で、永続的に常時稼働する OpenClaw Gateway を実行します。Pi は Gateway だけを担い（モデルは API 経由でクラウド上で動作します）、控えめな性能の Pi でも十分に処理できます。一般的なハードウェア費用は **$35–80 の一回払い**で、月額料金はありません。

## ハードウェア互換性

| Pi モデル    | RAM    | 動作するか | 注記                               |
| ----------- | ------ | ------ | ----------------------------------- |
| Pi 5        | 4/8 GB | 最適   | 最速、推奨。               |
| Pi 4        | 4 GB   | 良好   | ほとんどのユーザーに最適な選択。          |
| Pi 4        | 2 GB   | 可     | swap を追加。                           |
| Pi 4        | 1 GB   | 厳しい  | swap と最小構成なら可能。 |
| Pi 3B+      | 1 GB   | 遅い   | 動作するがもたつく。                 |
| Pi Zero 2 W | 512 MB | 不可     | 推奨しない。                    |

**最小要件:** 1 GB RAM、1 コア、500 MB の空きディスク容量、64-bit OS。
**推奨:** 2 GB+ RAM、16 GB+ SD カード（または USB SSD）、Ethernet。

## 前提条件

- 2 GB+ RAM 搭載の Raspberry Pi 4 または 5（4 GB 推奨）
- MicroSD カード（16 GB+）または USB SSD（より高性能）
- 公式 Pi 電源
- ネットワーク接続（Ethernet または WiFi）
- 64-bit Raspberry Pi OS（必須 -- 32-bit は使用しない）
- 約 30 分

## セットアップ

<Steps>
  <Step title="OS をフラッシュする">
    **Raspberry Pi OS Lite (64-bit)** を使用します -- ヘッドレスサーバーにデスクトップは不要です。

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロードします。
    2. OS を選択: **Raspberry Pi OS Lite (64-bit)**。
    3. 設定ダイアログで事前設定します:
       - ホスト名: `gateway-host`
       - SSH を有効化
       - ユーザー名とパスワードを設定
       - WiFi を設定（Ethernet を使用しない場合）
    4. SD カードまたは USB ドライブにフラッシュし、挿入して Pi を起動します。

  </Step>

  <Step title="SSH で接続する">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="システムを更新する">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 をインストールする">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="swap を追加する（2 GB 以下では重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw をインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードに従います。ヘッドレスデバイスでは OAuth より API キーが推奨されます。最初に使うチャンネルとしては Telegram が最も簡単です。

  </Step>

  <Step title="検証する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI にアクセスする">
    コンピューターで、Pi からダッシュボード URL を取得します:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    次に別のターミナルで SSH トンネルを作成します:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    表示された URL をローカルブラウザーで開きます。常時利用できるリモートアクセスについては、[Tailscale 統合](/ja-JP/gateway/tailscale)を参照してください。

  </Step>
</Steps>

## パフォーマンスのヒント

**USB SSD を使用する** -- SD カードは低速で消耗します。USB SSD はパフォーマンスを大きく改善します。[Pi USB ブートガイド](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)を参照してください。

**モジュールコンパイルキャッシュを有効化する** -- 低電力の Pi ホストで CLI の繰り返し起動を高速化します:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**メモリ使用量を減らす** -- ヘッドレス構成では、GPU メモリを空け、未使用のサービスを無効にします:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**安定した再起動のための systemd drop-in** -- この Pi が主に OpenClaw を実行する場合は、サービス drop-in を追加します:

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

その後、`systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` を実行します。ヘッドレス Pi では、ユーザーサービスがログアウト後も維持されるように、linger も一度有効化します: `sudo loginctl enable-linger "$(whoami)"`。

## 推奨モデル設定

Pi は Gateway のみを実行するため、クラウドホストの API モデルを使用します:

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

Pi 上でローカル LLM を実行しないでください。小さなモデルでも、実用には遅すぎます。モデル処理は Claude または GPT に任せます。

## ARM バイナリに関する注記

ほとんどの OpenClaw 機能は ARM64 で変更なしに動作します（Node.js、Telegram、WhatsApp/Baileys、Chromium）。ARM ビルドがない場合があるバイナリは、通常 Skills に同梱される任意の Go/Rust CLI ツールです。ソースからビルドする前に、不足しているバイナリのリリースページで `linux-arm64` / `aarch64` アーティファクトを確認してください。

## 永続化とバックアップ

OpenClaw の状態は次の場所にあります:

- `~/.openclaw/` — `openclaw.json`、エージェントごとの `auth-profiles.json`、チャンネル/プロバイダー状態、セッション。
- `~/.openclaw/workspace/` — エージェントワークスペース（SOUL.md、メモリ、アーティファクト）。

これらは再起動後も維持されます。ポータブルなスナップショットは次で取得します:

```bash
openclaw backup create
```

これらを SSD 上に置くと、SD カードよりもパフォーマンスと寿命の両方が向上します。

## トラブルシューティング

**メモリ不足** -- `free -h` で swap が有効か確認します。未使用のサービスを無効にします（`sudo systemctl disable cups bluetooth avahi-daemon`）。API ベースのモデルのみを使用します。

**パフォーマンスが遅い** -- SD カードではなく USB SSD を使用します。`vcgencmd get_throttled` で CPU スロットリングを確認します（`0x0` が返るはずです）。

**サービスが起動しない** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100` でログを確認し、`openclaw doctor --non-interactive` を実行します。これがヘッドレス Pi の場合は、linger が有効になっていることも確認します: `sudo loginctl enable-linger "$(whoami)"`。

**ARM バイナリの問題** -- Skill が "exec format error" で失敗する場合は、そのバイナリに ARM64 ビルドがあるか確認します。`uname -m` でアーキテクチャを確認します（`aarch64` が表示されるはずです）。

**WiFi が切断される** -- WiFi の電源管理を無効にします: `sudo iwconfig wlan0 power off`。

## 次のステップ

- [チャンネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway 設定](/ja-JP/gateway/configuration) -- すべての設定オプション
- [更新](/ja-JP/install/updating) -- OpenClaw を最新の状態に保つ

## 関連

- [インストール概要](/ja-JP/install)
- [Linux サーバー](/ja-JP/vps)
- [プラットフォーム](/ja-JP/platforms)

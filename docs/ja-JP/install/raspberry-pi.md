---
read_when:
    - Raspberry Pi で OpenClaw をセットアップする
    - ARM デバイスで OpenClaw を実行する
    - 安価な常時稼働のパーソナル AI を構築する
summary: OpenClaw を Raspberry Pi でホストして、常時稼働のセルフホスティングを行う
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T11:50:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Raspberry Pi 上で永続的に常時稼働する OpenClaw Gateway を実行します。Pi は Gateway にすぎないため（モデルは API 経由でクラウド上で実行されます）、控えめな性能の Pi でもワークロードを十分に処理できます。一般的なハードウェア費用は**一度きりで $35〜80**、月額料金はありません。

## ハードウェア互換性

| Pi モデル   | RAM    | 動作するか | 注記                                |
| ----------- | ------ | ---------- | ----------------------------------- |
| Pi 5        | 4/8 GB | 最適       | 最速、推奨。                        |
| Pi 4        | 4 GB   | 良好       | ほとんどのユーザーに最適。          |
| Pi 4        | 2 GB   | 可         | スワップを追加。                    |
| Pi 4        | 1 GB   | 厳しい     | スワップと最小構成で可能。          |
| Pi 3B+      | 1 GB   | 遅い       | 動作するがもたつく。                |
| Pi Zero 2 W | 512 MB | 不可       | 推奨しない。                        |

**最小要件:** 1 GB RAM、1 コア、500 MB の空きディスク、64 ビット OS。
**推奨:** 2 GB 以上の RAM、16 GB 以上の SD カード（または USB SSD）、Ethernet。

## 前提条件

- 2 GB 以上の RAM を搭載した Raspberry Pi 4 または 5（4 GB 推奨）
- MicroSD カード（16 GB 以上）または USB SSD（より高性能）
- 公式 Pi 電源
- ネットワーク接続（Ethernet または WiFi）
- 64 ビット Raspberry Pi OS（必須 -- 32 ビットは使用しない）
- 約 30 分

## セットアップ

<Steps>
  <Step title="Flash the OS">
    **Raspberry Pi OS Lite (64-bit)** を使用します -- ヘッドレスサーバーにはデスクトップは不要です。

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロードします。
    2. OS を選択します: **Raspberry Pi OS Lite (64-bit)**。
    3. 設定ダイアログで事前設定します:
       - ホスト名: `gateway-host`
       - SSH を有効化
       - ユーザー名とパスワードを設定
       - WiFi を設定（Ethernet を使用しない場合）
    4. SD カードまたは USB ドライブに書き込み、挿入して Pi を起動します。

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
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

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードに従います。ヘッドレスデバイスでは、OAuth よりも API キーを推奨します。最初に使うチャンネルとしては Telegram が最も簡単です。

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    自分のコンピューターで、Pi からダッシュボード URL を取得します:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    次に、別のターミナルで SSH トンネルを作成します:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    表示された URL をローカルブラウザーで開きます。常時稼働のリモートアクセスについては、[Tailscale 連携](/ja-JP/gateway/tailscale)を参照してください。

  </Step>
</Steps>

## パフォーマンスのヒント

**USB SSD を使用する** -- SD カードは低速で劣化します。USB SSD によりパフォーマンスが大幅に向上します。[Pi USB ブートガイド](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)を参照してください。

**モジュールコンパイルキャッシュを有効化する** -- 低消費電力の Pi ホストで、繰り返しの CLI 起動を高速化します:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` は通常の Gateway 再起動をプロセス内に保ち、余分なプロセス受け渡しを避け、小規模ホストでの PID 追跡をシンプルに保ちます。

**メモリ使用量を減らす** -- ヘッドレス構成では、GPU メモリを解放し、未使用のサービスを無効化します:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**安定した再起動のための systemd drop-in** -- この Pi が主に OpenClaw を実行する用途なら、サービス drop-in を追加します:

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

その後、`systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` を実行します。ヘッドレス Pi では、ユーザーサービスがログアウト後も存続するように、linger も一度有効化します: `sudo loginctl enable-linger "$(whoami)"`。

## 推奨モデル設定

Pi は Gateway だけを実行するため、クラウドホスト型の API モデルを使用します:

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

Pi 上でローカル LLM を実行しないでください。小規模モデルでさえ、有用な速度には遅すぎます。モデル処理は Claude または GPT に任せます。

## ARM バイナリに関する注記

ほとんどの OpenClaw 機能は ARM64 で変更なしに動作します（Node.js、Telegram、WhatsApp/Baileys、Chromium）。ARM ビルドがない場合があるバイナリは、通常 Skills に同梱される任意の Go/Rust CLI ツールです。ソースからのビルドに戻る前に、不足しているバイナリのリリースページで `linux-arm64` / `aarch64` アーティファクトを確認してください。

## 永続性とバックアップ

OpenClaw の状態は次の場所にあります:

- `~/.openclaw/` — `openclaw.json`、エージェントごとの `auth-profiles.json`、チャンネル/プロバイダーの状態、セッション。
- `~/.openclaw/workspace/` — エージェントワークスペース（SOUL.md、メモリ、アーティファクト）。

これらは再起動後も保持されます。ポータブルなスナップショットを作成するには:

```bash
openclaw backup create
```

これらを SSD 上に保持すると、SD カードよりもパフォーマンスと寿命の両方が向上します。

## トラブルシューティング

**メモリ不足** -- `free -h` でスワップが有効か確認します。未使用のサービスを無効化します（`sudo systemctl disable cups bluetooth avahi-daemon`）。API ベースのモデルのみを使用します。

**パフォーマンスが遅い** -- SD カードではなく USB SSD を使用します。`vcgencmd get_throttled` で CPU スロットリングを確認します（`0x0` が返るはずです）。

**サービスが起動しない** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100` でログを確認し、`openclaw doctor --non-interactive` を実行します。これがヘッドレス Pi の場合は、linger が有効になっていることも確認します: `sudo loginctl enable-linger "$(whoami)"`。

**ARM バイナリの問題** -- Skill が "exec format error" で失敗する場合、そのバイナリに ARM64 ビルドがあるか確認します。`uname -m` でアーキテクチャを確認します（`aarch64` と表示されるはずです）。

**WiFi が切断される** -- WiFi 電源管理を無効化します: `sudo iwconfig wlan0 power off`。

## 次のステップ

- [チャンネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway 設定](/ja-JP/gateway/configuration) -- すべての設定オプション
- [更新](/ja-JP/install/updating) -- OpenClaw を最新の状態に保つ

## 関連

- [インストール概要](/ja-JP/install)
- [Linux サーバー](/ja-JP/vps)
- [プラットフォーム](/ja-JP/platforms)

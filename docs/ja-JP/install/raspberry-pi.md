---
read_when:
    - Raspberry PiでOpenClawをセットアップする
    - ARM デバイスで OpenClaw を実行する
    - 安価な常時稼働のパーソナル AIを構築する
summary: 常時稼働のセルフホスティングのために Raspberry Pi で OpenClaw をホストする
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-05T11:33:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Raspberry Pi 上で永続的に常時稼働する OpenClaw Gateway を実行します。Pi は Gateway にすぎないため（モデルは API 経由でクラウド上で実行されます）、控えめな Pi でもこのワークロードを十分に処理できます。一般的なハードウェア費用は **一度きりで $35-80**、月額料金はありません。

## ハードウェア互換性

| Pi モデル   | RAM    | 動作するか | 注記                                |
| ----------- | ------ | ---------- | ----------------------------------- |
| Pi 5        | 4/8 GB | 最適       | 最速、推奨。                        |
| Pi 4        | 4 GB   | 良好       | ほとんどのユーザーに最適。          |
| Pi 4        | 2 GB   | OK         | swap を追加。                       |
| Pi 4        | 1 GB   | 厳しい     | swap と最小構成なら可能。           |
| Pi 3B+      | 1 GB   | 低速       | 動作するがもたつきます。            |
| Pi Zero 2 W | 512 MB | 不可       | 推奨しません。                      |

**最小要件:** 1 GB RAM、1 コア、500 MB の空きディスク、64-bit OS。
**推奨:** 2 GB+ RAM、16 GB+ SD カード（または USB SSD）、Ethernet。

## 前提条件

- 2 GB+ RAM 搭載の Raspberry Pi 4 または 5（4 GB 推奨）
- MicroSD カード（16 GB+）または USB SSD（より高性能）
- 公式 Pi 電源
- ネットワーク接続（Ethernet または WiFi）
- 64-bit Raspberry Pi OS（必須 -- 32-bit は使用しないでください）
- 約 30 分

## セットアップ

<Steps>
  <Step title="OS を書き込む">
    **Raspberry Pi OS Lite (64-bit)** を使用します -- ヘッドレスサーバーにデスクトップは不要です。

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロードします。
    2. OS を選択: **Raspberry Pi OS Lite (64-bit)**。
    3. 設定ダイアログで、事前に構成します:
       - ホスト名: `gateway-host`
       - SSH を有効化
       - ユーザー名とパスワードを設定
       - WiFi を構成（Ethernet を使わない場合）
    4. SD カードまたは USB ドライブに書き込み、挿入して Pi を起動します。

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

    ウィザードに従います。ヘッドレスデバイスでは OAuth より API キーを推奨します。Telegram は開始するのに最も簡単なチャンネルです。

  </Step>

  <Step title="検証する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI にアクセスする">
    自分のコンピューターで、Pi からダッシュボード URL を取得します:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    次に、別のターミナルで SSH トンネルを作成します:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    表示された URL をローカルブラウザーで開きます。常時接続のリモートアクセスについては、[Tailscale 連携](/ja-JP/gateway/tailscale)を参照してください。

  </Step>
</Steps>

## パフォーマンスのヒント

**USB SSD を使用する** -- SD カードは遅く、摩耗します。USB SSD はパフォーマンスを大幅に向上させ、より多くの書き込みサイクルに耐えます。OS を SD に置いたままにする場合は、`OPENCLAW_STATE_DIR` に使用してください。[Pi USB ブートガイド](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)を参照してください。

**モジュールコンパイルキャッシュを有効にする** -- 低電力の Pi ホストで、繰り返しの CLI 呼び出しを高速化します。`OPENCLAW_NO_RESPAWN=1` は通常の Gateway 再起動をプロセス内に保ち、余分なプロセス引き継ぎを避け、小さなホストで PID 追跡を単純に保ちます:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`/tmp` ではなく `/var/tmp` を使用します -- 一部のディストリビューションは起動時に `/tmp` をクリアするため、ウォーム済みキャッシュが失われます。

**メモリ使用量を削減する** -- ヘッドレス構成では、GPU メモリを解放し、未使用サービスを無効化します:

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

その後、`systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` を実行します。ヘッドレス Pi では、ユーザーサービスがログアウト後も残るように、linger も一度有効化します: `sudo loginctl enable-linger "$(whoami)"`。

## 推奨モデル設定

Pi は Gateway だけを実行するため、クラウドホストの API モデルを使用します -- Pi 上でローカル LLM を実行しないでください。小さなモデルでも実用には遅すぎます:

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

## ARM バイナリの注記

ほとんどの OpenClaw 機能は ARM64 で変更なしに動作します（Node.js、Telegram、WhatsApp/Baileys、Chromium）。ARM ビルドがないことがあるバイナリは、通常 Skills に同梱される任意の Go/Rust CLI ツールです。`uname -m` でアーキテクチャを確認し（`aarch64` と表示されるはずです）、ソースからビルドする前に、不足しているバイナリのリリースページで `linux-arm64` / `aarch64` アーティファクトを確認してください。

## 永続化とバックアップ

OpenClaw の状態は次の場所にあります:

- `~/.openclaw/` -- `openclaw.json`、エージェントごとの `auth-profiles.json`、チャンネル/プロバイダー状態、セッション。
- `~/.openclaw/workspace/` -- エージェントワークスペース（SOUL.md、メモリ、アーティファクト）。

これらは再起動後も保持され、パフォーマンスと寿命の両面で SD カードより SSD の恩恵を受けます。ポータブルスナップショットを作成するには:

```bash
openclaw backup create
```

## トラブルシューティング

**メモリ不足** -- `free -h` で swap が有効であることを確認します。未使用サービスを無効化します（`sudo systemctl disable cups bluetooth avahi-daemon`）。API ベースのモデルのみを使用してください。

**パフォーマンスが遅い** -- SD カードではなく USB SSD を使用します。`vcgencmd get_throttled` で CPU スロットリングを確認します（`0x0` が返るはずです）。

**サービスが起動しない** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100` でログを確認し、`openclaw doctor --non-interactive` を実行します。これがヘッドレス Pi の場合は、linger が有効であることも確認します: `sudo loginctl enable-linger "$(whoami)"`。

**ARM バイナリの問題** -- Skill が "exec format error" で失敗する場合、そのバイナリに ARM64 ビルドがあるか確認します。`uname -m` でアーキテクチャを確認します（`aarch64` と表示されるはずです）。

**WiFi が切断される** -- WiFi 電源管理を無効化します: `sudo iwconfig wlan0 power off`。

## 次のステップ

- [チャンネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway 構成](/ja-JP/gateway/configuration) -- すべての構成オプション
- [更新](/ja-JP/install/updating) -- OpenClaw を最新の状態に保つ

## 関連

- [インストール概要](/ja-JP/install)
- [Linux サーバー](/ja-JP/vps)
- [プラットフォーム](/ja-JP/platforms)

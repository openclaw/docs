---
read_when:
    - Raspberry Pi上でOpenClawをセットアップする
    - ARMデバイス上でOpenClawを実行するံုး
    - 安価で常時稼働する個人AIを構築する შემთხვევაში
summary: 常時稼働のセルフホスティング向けにRaspberry Pi上でOpenClawをホストする
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T05:05:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Raspberry Pi上で、永続的かつ常時稼働するOpenClaw Gatewayを実行します。Piは単なるgatewayであり（モデルはAPI経由でクラウド上で実行されるため）、控えめなPiでもこの負荷を十分に処理できます。

## 前提条件

- 2 GB以上のRAMを搭載したRaspberry Pi 4または5（4 GB推奨）
- MicroSDカード（16 GB以上）またはUSB SSD（より高性能）
- 公式Pi電源
- ネットワーク接続（EthernetまたはWiFi）
- 64-bit Raspberry Pi OS（必須 -- 32-bitは使用しないでください）
- 約30分

## セットアップ

<Steps>
  <Step title="OSを書き込む">
    ヘッドレスサーバーには**Raspberry Pi OS Lite (64-bit)**を使用します -- デスクトップは不要です。

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/)をダウンロードします。
    2. OSとして**Raspberry Pi OS Lite (64-bit)**を選択します。
    3. 設定ダイアログで事前設定します:
       - Hostname: `gateway-host`
       - SSHを有効化
       - ユーザー名とパスワードを設定
       - WiFiを設定（Ethernetを使わない場合）
    4. SDカードまたはUSBドライブへ書き込み、挿入してPiを起動します。

  </Step>

  <Step title="SSHで接続する">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="システムを更新する">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # タイムゾーンを設定（Cronとリマインダーに重要）
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24をインストールする">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="swapを追加する（2 GB以下では重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 低RAMデバイス向けにswappinessを下げる
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClawをインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードに従ってください。ヘッドレスデバイスではOAuthよりAPI keyを推奨します。最初に始めるチャネルとしてはTelegramが最も簡単です。

  </Step>

  <Step title="確認する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UIにアクセスする">
    自分のコンピューターから、PiでダッシュボードURLを取得します。

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    その後、別のターミナルでSSHトンネルを作成します。

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    出力されたURLをローカルブラウザーで開いてください。常時稼働のリモートアクセスについては、[Tailscale integration](/ja-JP/gateway/tailscale)を参照してください。

  </Step>
</Steps>

## パフォーマンスのヒント

**USB SSDを使う** -- SDカードは遅く、消耗します。USB SSDを使うとパフォーマンスが大幅に向上します。[Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)を参照してください。

**モジュールコンパイルキャッシュを有効にする** -- 低性能なPiホストでのCLI繰り返し実行を高速化します。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**メモリ使用量を減らす** -- ヘッドレス構成では、GPUメモリを解放し、不要サービスを無効化します。

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## トラブルシューティング

**メモリ不足** -- `free -h`でswapが有効か確認してください。不要サービスを無効化してください（`sudo systemctl disable cups bluetooth avahi-daemon`）。APIベースのモデルのみを使ってください。

**動作が遅い** -- SDカードではなくUSB SSDを使用してください。`vcgencmd get_throttled`でCPUスロットリングを確認してください（`0x0`が返るべきです）。

**サービスが起動しない** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100`でログを確認し、`openclaw doctor --non-interactive`を実行してください。これがヘッドレスPiであれば、lingeringも有効か確認してください: `sudo loginctl enable-linger "$(whoami)"`。

**ARMバイナリの問題** -- Skillが「exec format error」で失敗する場合、そのバイナリにARM64ビルドがあるか確認してください。`uname -m`でアーキテクチャを確認します（`aarch64`が表示されるはずです）。

**WiFiが切れる** -- WiFiの電源管理を無効化します: `sudo iwconfig wlan0 power off`。

## 次のステップ

- [Channels](/ja-JP/channels) -- Telegram、WhatsApp、Discordなどを接続する
- [Gateway configuration](/ja-JP/gateway/configuration) -- すべての設定オプション
- [Updating](/ja-JP/install/updating) -- OpenClawを最新状態に保つ

## 関連

- [Install overview](/ja-JP/install)
- [Linux server](/ja-JP/vps)
- [Platforms](/ja-JP/platforms)

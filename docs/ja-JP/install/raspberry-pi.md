---
read_when:
    - Raspberry Pi で OpenClaw をセットアップする
    - ARM デバイスで OpenClaw を実行する
    - 低コストで常時稼働するパーソナルAIの構築
summary: 常時稼働のセルフホスティング向けに Raspberry Pi で OpenClaw をホストする
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-11T22:21:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

永続的に常時稼働する OpenClaw Gateway を Raspberry Pi 上で実行します。Pi は Gateway としてのみ機能し（モデルは API 経由でクラウド上で実行されます）、一般的な性能の Pi でもワークロードを十分に処理できます。通常、ハードウェア費用は **初回のみ $35～80** で、月額料金はかかりません。

## ハードウェアの互換性

| Pi モデル   | RAM    | 動作評価 | 備考                                       |
| ----------- | ------ | -------- | ------------------------------------------ |
| Pi 5        | 4/8 GB | 最適     | 最速。推奨。                               |
| Pi 4        | 4 GB   | 良好     | ほとんどのユーザーに最適な構成。           |
| Pi 4        | 2 GB   | 使用可能 | スワップを追加してください。               |
| Pi 4        | 1 GB   | 厳しい   | スワップと最小構成であれば使用可能。       |
| Pi 3B+      | 1 GB   | 低速     | 動作しますが、処理は遅くなります。         |
| Pi Zero 2 W | 512 MB | 不可     | 推奨されません。                           |

**最小要件:** RAM 1 GB、1 コア、空きディスク容量 500 MB、64 ビット OS。
**推奨要件:** RAM 2 GB 以上、16 GB 以上の SD カード（または USB SSD）、Ethernet。

## 前提条件

- RAM 2 GB 以上の Raspberry Pi 4 または 5（4 GB 推奨）
- MicroSD カード（16 GB 以上）または USB SSD（より高性能）
- 公式 Pi 電源
- ネットワーク接続（Ethernet または WiFi）
- 64 ビット Raspberry Pi OS（必須。32 ビット版は使用しないでください）
- 約 30 分

## セットアップ

<Steps>
  <Step title="OS を書き込む">
    **Raspberry Pi OS Lite (64-bit)** を使用します。ヘッドレスサーバーにデスクトップ環境は不要です。

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロードします。
    2. OS として **Raspberry Pi OS Lite (64-bit)** を選択します。
    3. 設定ダイアログで、事前に以下を設定します。
       - ホスト名: `gateway-host`
       - SSH を有効化
       - ユーザー名とパスワードを設定
       - WiFi を設定（Ethernet を使用しない場合）
    4. SD カードまたは USB ドライブに書き込み、Pi に挿入して起動します。

  </Step>

  <Step title="SSH 経由で接続する">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="システムを更新する">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # タイムゾーンを設定（cron とリマインダーに重要）
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

  <Step title="スワップを追加する（2 GB 以下では重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # RAM が少ないデバイス向けにスワップ使用傾向を抑える
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

    ウィザードに従います。ヘッドレスデバイスでは、OAuth より API キーを推奨します。最初に利用するチャンネルとしては Telegram が最も簡単です。

  </Step>

  <Step title="確認する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="コントロール UI にアクセスする">
    コンピューターから、Pi 上でダッシュボードの URL を取得します。

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    次に、別のターミナルで SSH トンネルを作成します。

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    表示された URL をローカルブラウザーで開きます。常時利用可能なリモートアクセスについては、[Tailscale 連携](/ja-JP/gateway/tailscale)を参照してください。

  </Step>
</Steps>

## パフォーマンスのヒント

**USB SSD を使用する** -- SD カードは低速で、書き込みによって劣化します。USB SSD を使用するとパフォーマンスが大幅に向上し、より多くの書き込みサイクルに耐えられます。OS を SD カードに置く場合は、`OPENCLAW_STATE_DIR` に USB SSD を使用してください。[Pi の USB ブートガイド](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)を参照してください。

**モジュールコンパイルキャッシュを有効にする** -- 処理能力の低い Pi ホストで、CLI を繰り返し実行する際の速度が向上します。`OPENCLAW_NO_RESPAWN=1` を設定すると、通常の Gateway 再起動が同一プロセス内で行われるため、追加のプロセス引き継ぎを回避し、小規模なホストでの PID 追跡を簡潔に保てます。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`/tmp` ではなく `/var/tmp` を使用してください。一部のディストリビューションでは起動時に `/tmp` が消去され、ウォームアップ済みのキャッシュが失われます。

**メモリ使用量を削減する** -- ヘッドレス構成では、GPU メモリを解放し、使用しないサービスを無効化します。

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**安定した再起動のための systemd ドロップイン** -- この Pi で主に OpenClaw を実行する場合は、サービスのドロップインを追加します。

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

次に、`systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` を実行します。ヘッドレス Pi では、ユーザーサービスがログアウト後も動作し続けるよう、一度だけリンガリングも有効にします: `sudo loginctl enable-linger "$(whoami)"`。

## 推奨モデル設定

Pi では Gateway のみを実行するため、クラウドでホストされる API モデルを使用してください。Pi 上でローカル LLM を実行しないでください。小規模なモデルであっても、実用には遅すぎます。

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

## ARM バイナリに関する注意事項

OpenClaw のほとんどの機能（Node.js、Telegram、WhatsApp/Baileys、Chromium）は、変更なしで ARM64 上で動作します。ARM ビルドが提供されていないことがあるバイナリは、通常、Skills によって同梱される任意の Go/Rust CLI ツールです。`uname -m` でアーキテクチャを確認し（`aarch64` と表示される必要があります）、不足しているバイナリのリリースページで `linux-arm64` / `aarch64` アーティファクトを確認してから、ソースからのビルドに切り替えてください。

## 永続化とバックアップ

OpenClaw の状態は以下に保存されます。

- `~/.openclaw/` -- `openclaw.json`、エージェントごとの `auth-profiles.json`、チャンネルやプロバイダーの状態、セッション。
- `~/.openclaw/workspace/` -- エージェントのワークスペース（SOUL.md、メモリ、アーティファクト）。

これらは再起動後も保持されます。SD カードではなく SSD を使用すると、パフォーマンスと耐久性の両方が向上します。次のコマンドで持ち運び可能なスナップショットを作成します。

```bash
openclaw backup create
```

## トラブルシューティング

**メモリ不足** -- `free -h` でスワップが有効になっていることを確認します。使用しないサービスを無効化します（`sudo systemctl disable cups bluetooth avahi-daemon`）。API ベースのモデルのみを使用してください。

**パフォーマンスが遅い** -- SD カードの代わりに USB SSD を使用します。`vcgencmd get_throttled` で CPU のスロットリングを確認します（`0x0` が返される必要があります）。

**サービスが起動しない** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100` でログを確認し、`openclaw doctor --non-interactive` を実行します。ヘッドレス Pi の場合は、リンガリングが有効になっていることも確認します: `sudo loginctl enable-linger "$(whoami)"`。

**ARM バイナリの問題** -- Skill が「exec format error」で失敗する場合は、そのバイナリに ARM64 ビルドがあるか確認します。`uname -m` でアーキテクチャを確認します（`aarch64` と表示される必要があります）。

**WiFi 接続が切れる** -- WiFi の電源管理を無効化します: `sudo iwconfig wlan0 power off`。

## 次のステップ

- [チャンネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続
- [Gateway の設定](/ja-JP/gateway/configuration) -- すべての設定項目
- [更新](/ja-JP/install/updating) -- OpenClaw を最新の状態に維持

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Linux サーバー](/ja-JP/vps)
- [プラットフォーム](/ja-JP/platforms)

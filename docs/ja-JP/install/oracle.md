---
read_when:
    - Oracle Cloud で OpenClaw をセットアップする
    - OpenClaw 向けの無料 VPS ホスティングを探している場合
    - 小さなサーバーで OpenClaw を 24 時間 365 日動かしたい場合
summary: Oracle Cloud の Always Free ARM ティアで OpenClaw をホストする
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T05:05:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

Oracle Cloud の **Always Free** ARM ティア（最大 4 OCPU、24 GB RAM、200 GB ストレージ）で、永続的な OpenClaw Gateway を無料で実行します。

## 前提条件

- Oracle Cloud アカウント（[signup](https://www.oracle.com/cloud/free/)） -- 問題が発生した場合は [community signup guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) を参照してください
- Tailscale アカウント（[tailscale.com](https://tailscale.com) で無料）
- SSH キーペア
- 約 30 分

## セットアップ

<Steps>
  <Step title="OCI インスタンスを作成する">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) にログインします。
    2. **Compute > Instances > Create Instance** に移動します。
    3. 次のように設定します:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04（aarch64）
       - **Shape:** `VM.Standard.A1.Flex`（Ampere ARM）
       - **OCPUs:** 2（または最大 4）
       - **Memory:** 12 GB（または最大 24 GB）
       - **Boot volume:** 50 GB（無料枠では最大 200 GB）
       - **SSH key:** 公開鍵を追加
    4. **Create** をクリックし、公開 IP アドレスを控えます。

    <Tip>
    インスタンス作成が「Out of capacity」で失敗する場合は、別の availability domain を試すか、後で再試行してください。free tier の容量には限りがあります。
    </Tip>

  </Step>

  <Step title="接続してシステムを更新する">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` は、一部の依存関係を ARM 向けにコンパイルするために必要です。

  </Step>

  <Step title="ユーザーとホスト名を設定する">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    linger を有効にすると、ログアウト後もユーザーサービスが動作し続けます。

  </Step>

  <Step title="Tailscale をインストールする">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    以後は Tailscale 経由で接続します: `ssh ubuntu@openclaw`

  </Step>

  <Step title="OpenClaw をインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    「How do you want to hatch your bot?」と尋ねられたら、**Do this later** を選択します。

  </Step>

  <Step title="gateway を設定する">
    安全なリモートアクセスのため、token auth と Tailscale Serve を使います。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    ここでの `gateway.trustedProxies=["127.0.0.1"]` は、ローカルの Tailscale Serve proxy の forwarded-IP/local-client 処理のためだけです。これは **not** `gateway.auth.mode: "trusted-proxy"` ではありません。このセットアップでは、diff viewer ルートは fail-closed 動作を維持します。forwarded proxy header なしの生の `127.0.0.1` viewer request は `Diff not found` を返すことがあります。添付には `mode=file` / `mode=both` を使うか、共有可能な viewer link が必要なら、意図的に remote viewer を有効にして `plugins.entries.diffs.config.viewerBaseUrl` を設定する（または proxy の `baseUrl` を渡す）ようにしてください。

  </Step>

  <Step title="VCN セキュリティをロックダウンする">
    ネットワークエッジで Tailscale 以外のすべてのトラフィックをブロックします。

    1. OCI Console の **Networking > Virtual Cloud Networks** に移動します。
    2. 自分の VCN をクリックし、**Security Lists > Default Security List** を開きます。
    3. `0.0.0.0/0 UDP 41641`（Tailscale）以外のすべての ingress ルールを**削除**します。
    4. デフォルトの egress ルール（すべての outbound を許可）は維持します。

    これにより、ネットワークエッジで port 22 の SSH、HTTP、HTTPS、その他すべてがブロックされます。この時点以降は Tailscale 経由でのみ接続できます。

  </Step>

  <Step title="検証する">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    tailnet 上の任意のデバイスから Control UI にアクセスします。

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` は自分の tailnet 名に置き換えてください（`tailscale status` で確認できます）。

  </Step>
</Steps>

## フォールバック: SSH トンネル

Tailscale Serve が動作しない場合は、ローカルマシンから SSH トンネルを使ってください。

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

その後、`http://localhost:18789` を開きます。

## トラブルシューティング

**インスタンス作成が失敗する（"Out of capacity"）** -- Free tier の ARM インスタンスは人気があります。別の availability domain を試すか、オフピーク時間帯に再試行してください。

**Tailscale が接続しない** -- `sudo tailscale up --ssh --hostname=openclaw --reset` を実行して再認証してください。

**gateway が起動しない** -- `openclaw doctor --non-interactive` を実行し、`journalctl --user -u openclaw-gateway.service -n 50` でログを確認してください。

**ARM バイナリの問題** -- ほとんどの npm パッケージは ARM64 で動作します。ネイティブバイナリについては、`linux-arm64` または `aarch64` のリリースを探してください。`uname -m` でアーキテクチャを確認できます。

## 次のステップ

- [Channels](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続
- [Gateway configuration](/ja-JP/gateway/configuration) -- すべての config オプション
- [Updating](/ja-JP/install/updating) -- OpenClaw を最新に保つ

## 関連

- [Install overview](/ja-JP/install)
- [GCP](/ja-JP/install/gcp)
- [VPS hosting](/ja-JP/vps)

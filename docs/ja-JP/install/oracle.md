---
read_when:
    - Oracle CloudでOpenClawをセットアップする
    - OpenClaw 向けの無料 VPS ホスティングを探す
    - 小型サーバーで OpenClaw を24時間365日稼働させたい
summary: Oracle Cloud の Always Free ARM ティアで OpenClaw をホストする
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T05:10:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Oracle Cloud の **Always Free** ARM ティア（最大 4 OCPU、24 GB RAM、200 GB ストレージ）で、永続的な OpenClaw Gateway を無料で実行します。

## 前提条件

- Oracle Cloud アカウント（[signup](https://www.oracle.com/cloud/free/)）-- 問題が発生した場合は [community signup guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) を参照
- Tailscale アカウント（[tailscale.com](https://tailscale.com) で無料）
- SSH キーペア
- 約 30 分

## セットアップ

<Steps>
  <Step title="OCI インスタンスを作成する">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) にログインします。
    2. **Compute > Instances > Create Instance** に移動します。
    3. 設定:
       - **名前:** `openclaw`
       - **イメージ:** Ubuntu 24.04 (aarch64)
       - **シェイプ:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2（または最大 4）
       - **メモリ:** 12 GB（または最大 24 GB）
       - **ブートボリューム:** 50 GB（最大 200 GB まで無料）
       - **SSH キー:** 公開鍵を追加
    4. **Create** をクリックし、パブリック IP アドレスを控えます。

    <Tip>
    インスタンスの作成が「Out of capacity」で失敗する場合は、別の可用性ドメインを試すか、後でもう一度試してください。無料ティアのキャパシティには制限があります。
    </Tip>

  </Step>

  <Step title="接続してシステムを更新する">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    一部の依存関係を ARM でコンパイルするには `build-essential` が必要です。

  </Step>

  <Step title="ユーザーとホスト名を設定する">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    linger を有効にすると、ログアウト後もユーザーサービスが実行され続けます。

  </Step>

  <Step title="Tailscale をインストールする">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    以後は Tailscale 経由で接続します: `ssh ubuntu@openclaw`。

  </Step>

  <Step title="OpenClaw をインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    「How do you want to hatch your bot?」と表示されたら、**Do this later** を選択します。

  </Step>

  <Step title="Gateway を設定する">
    安全なリモートアクセスのため、Tailscale Serve とトークン認証を使用します。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    ここでの `gateway.trustedProxies=["127.0.0.1"]` は、ローカルの Tailscale Serve プロキシによる forwarded-IP/local-client 処理のためだけのものです。これは `gateway.auth.mode: "trusted-proxy"` では**ありません**。このセットアップでは、差分ビューアールートは fail-closed 動作を維持します。プロキシ転送ヘッダーなしの素の `127.0.0.1` ビューアーリクエストは `Diff not found` を返すことがあります。添付ファイルには `mode=file` / `mode=both` を使用するか、共有可能なビューアーリンクが必要な場合は意図的にリモートビューアーを有効にして `plugins.entries.diffs.config.viewerBaseUrl` を設定します（またはプロキシの `baseUrl` を渡します）。

  </Step>

  <Step title="VCN セキュリティをロックダウンする">
    ネットワーク境界で Tailscale 以外のすべてのトラフィックをブロックします。

    1. OCI Console で **Networking > Virtual Cloud Networks** に移動します。
    2. VCN をクリックし、**Security Lists > Default Security List** を開きます。
    3. `0.0.0.0/0 UDP 41641`（Tailscale）以外のすべてのイングレスルールを**削除**します。
    4. デフォルトのエグレスルール（すべてのアウトバウンドを許可）はそのままにします。

    これにより、ポート 22 の SSH、HTTP、HTTPS、その他すべてがネットワーク境界でブロックされます。この時点以降は Tailscale 経由でのみ接続できます。

  </Step>

  <Step title="確認する">
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

    `<tailnet-name>` は自分の tailnet 名（`tailscale status` で確認可能）に置き換えます。

  </Step>
</Steps>

## セキュリティ態勢を確認する

VCN をロックダウンし（UDP 41641 のみ開放）、Gateway をループバックにバインドすると、パブリックトラフィックはネットワーク境界でブロックされ、管理アクセスは tailnet のみに限定されます。これにより、従来の VPS 強化手順のいくつかは不要になります。

| 従来の手順         | 必要か？       | 理由                                                                      |
| ------------------ | -------------- | ------------------------------------------------------------------------- |
| UFW ファイアウォール | 不要           | VCN がインスタンスに到達する前にトラフィックをブロックします。             |
| fail2ban           | 不要           | ポート 22 は VCN でブロックされており、総当たり攻撃の表面がありません。    |
| sshd の強化        | 不要           | Tailscale SSH は sshd を使用しません。                                     |
| root ログインの無効化 | 不要         | Tailscale はシステムユーザーではなく tailnet ID で認証します。             |
| SSH キーのみの認証 | 不要           | 同じ理由で、tailnet ID がシステムの SSH キーを置き換えます。               |
| IPv6 の強化        | 通常は不要     | VCN/サブネット設定によります。実際に割り当てられ、公開されている内容を確認してください。 |

引き続き推奨:

- `chmod 700 ~/.openclaw` で認証情報ファイルの権限を制限します。
- `openclaw security audit` で OpenClaw 固有の態勢チェックを実行します。
- OS パッチのために定期的に `sudo apt update && sudo apt upgrade` を実行します。
- [Tailscale admin console](https://login.tailscale.com/admin) でデバイスを定期的に確認します。

簡単な確認コマンド:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM メモ

Always Free ティアは ARM（`aarch64`）です。ほとんどの OpenClaw 機能は問題なく動作しますが、一部のネイティブバイナリには ARM ビルドが必要です。

- Node.js、Telegram、WhatsApp（Baileys）: 純粋な JavaScript で、問題ありません。
- ネイティブコードを含むほとんどの npm パッケージ: 事前ビルド済みの `linux-arm64` アーティファクトがあります。
- 任意の CLI ヘルパー（例: Skills によって同梱される Go/Rust バイナリ）: インストール前に `aarch64` / `linux-arm64` リリースがあるか確認してください。

アーキテクチャは `uname -m` で確認します（`aarch64` と表示されるはずです）。ARM ビルドがないバイナリは、ソースからインストールするかスキップしてください。

## 永続性とバックアップ

OpenClaw の状態は以下に保存されます。

- `~/.openclaw/` — `openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル/プロバイダー状態、セッションデータ。
- `~/.openclaw/workspace/` — エージェントワークスペース（SOUL.md、メモリ、アーティファクト）。

これらは再起動後も保持されます。ポータブルなスナップショットを取得するには:

```bash
openclaw backup create
```

## フォールバック: SSH トンネル

Tailscale Serve が動作しない場合は、ローカルマシンから SSH トンネルを使用します。

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

その後、`http://localhost:18789` を開きます。

## トラブルシューティング

**インスタンス作成が失敗する（「Out of capacity」）** -- 無料ティアの ARM インスタンスは人気があります。別の可用性ドメインを試すか、オフピーク時間帯に再試行してください。

**Tailscale が接続しない** -- 再認証するには `sudo tailscale up --ssh --hostname=openclaw --reset` を実行します。

**Gateway が起動しない** -- `openclaw doctor --non-interactive` を実行し、`journalctl --user -u openclaw-gateway.service -n 50` でログを確認します。

**ARM バイナリの問題** -- ほとんどの npm パッケージは ARM64 で動作します。ネイティブバイナリの場合は、`linux-arm64` または `aarch64` リリースを探してください。`uname -m` でアーキテクチャを確認します。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続
- [Gateway 設定](/ja-JP/gateway/configuration) -- すべての設定オプション
- [更新](/ja-JP/install/updating) -- OpenClaw を最新に保つ

## 関連

- [インストール概要](/ja-JP/install)
- [GCP](/ja-JP/install/gcp)
- [VPS ホスティング](/ja-JP/vps)

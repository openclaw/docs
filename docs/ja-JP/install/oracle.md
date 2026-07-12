---
read_when:
    - Oracle Cloud で OpenClaw をセットアップする
    - OpenClaw 用の無料 VPS ホスティングを探す
    - 小型サーバーで OpenClaw を 24 時間 365 日稼働させたい
summary: Oracle Cloud の Always Free ARM ティアで OpenClaw をホストする
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-11T22:21:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Oracle Cloud の **Always Free** ARM ティア（最大 4 OCPU、24 GB RAM、200 GB ストレージ）で、永続的な OpenClaw Gateway を無料で実行します。

## 前提条件

- Oracle Cloud アカウント（[登録](https://www.oracle.com/cloud/free/)）-- 問題が発生した場合は、[コミュニティの登録ガイド](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)を参照してください
- Tailscale アカウント（[tailscale.com](https://tailscale.com)で無料）
- SSH キーペア
- 約 30 分

## セットアップ

<Steps>
  <Step title="OCI インスタンスを作成する">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) にログインします。
    2. **Compute > Instances > Create Instance** に移動します。
    3. 次のように設定します。
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2（または最大 4）
       - **Memory:** 12 GB（または最大 24 GB）
       - **Boot volume:** 50 GB（最大 200 GB まで無料）
       - **SSH key:** 公開鍵を追加
    4. **Create** をクリックし、パブリック IP アドレスを控えます。

    <Tip>
    「Out of capacity」というメッセージでインスタンスの作成に失敗する場合は、別の可用性ドメインを試すか、後でもう一度試してください。無料ティアの容量には限りがあります。
    </Tip>

  </Step>

  <Step title="接続してシステムを更新する">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    一部の依存関係を ARM 向けにコンパイルするには、`build-essential` が必要です。

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

    以降は Tailscale 経由で接続します：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="OpenClaw をインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    「How do you want to hatch your bot?」と表示されたら、**Do this later** を選択します。

  </Step>

  <Step title="Gateway を設定する">
    安全なリモートアクセスのために、Tailscale Serve とトークン認証を使用します。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    ここでの `gateway.trustedProxies=["127.0.0.1"]` は、ローカルの Tailscale Serve プロキシによる転送元 IP／ローカルクライアントの処理にのみ使用されます。これは `gateway.auth.mode: "trusted-proxy"` **ではありません**。この設定では、差分ビューアーのルートは引き続きフェイルクローズ動作を維持します。転送プロキシヘッダーのない生の `127.0.0.1` ビューアーリクエストには `Diff not found` が返されます。添付ファイルには `mode=file` / `mode=both` を使用してください。共有可能なビューアーリンクが必要な場合は、リモートビューアーを意図的に有効にして `plugins.entries.diffs.config.viewerBaseUrl` を設定するか、プロキシの `baseUrl` を渡します。

  </Step>

  <Step title="VCN のセキュリティを強化する">
    ネットワーク境界で Tailscale 以外のすべてのトラフィックをブロックします。

    1. OCI Console で **Networking > Virtual Cloud Networks** に移動します。
    2. 対象の VCN をクリックし、**Security Lists > Default Security List** に移動します。
    3. `0.0.0.0/0 UDP 41641`（Tailscale）以外のすべての受信ルールを**削除**します。
    4. デフォルトの送信ルール（すべての送信を許可）は維持します。

    これにより、ネットワーク境界でポート 22 の SSH、HTTP、HTTPS、およびその他すべてがブロックされます。以降は Tailscale 経由でのみ接続できます。

  </Step>

  <Step title="確認する">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    tailnet 上の任意のデバイスからコントロール UI にアクセスします。

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` を tailnet 名（`tailscale status` で確認可能）に置き換えます。

  </Step>
</Steps>

## セキュリティ状態を確認する

VCN をロックダウンして UDP 41641 のみを開放し、Gateway をループバックにバインドすると、パブリックトラフィックはネットワーク境界でブロックされ、管理アクセスは tailnet 内に限定されます。そのため、従来の VPS 強化手順のいくつかは不要になります。

| 従来の手順           | 必要か        | 理由                                                                       |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW ファイアウォール | いいえ        | VCN がインスタンスに到達する前にトラフィックをブロックします。                    |
| fail2ban           | いいえ        | ポート 22 は VCN でブロックされるため、ブルートフォース攻撃の対象領域がありません。 |
| sshd の強化         | いいえ        | Tailscale SSH は sshd を使用しません。                                      |
| root ログインの無効化 | いいえ        | Tailscale はシステムユーザーではなく、tailnet のアイデンティティで認証します。     |
| SSH 鍵のみの認証     | いいえ        | 同様に、tailnet のアイデンティティがシステムの SSH 鍵に代わります。                |
| IPv6 の強化          | 通常は不要    | VCN／サブネットの設定によって異なります。実際に割り当て／公開されているものを確認してください。 |

引き続き推奨される事項：

- `chmod 700 ~/.openclaw` で認証情報ファイルの権限を制限します。
- `openclaw security audit` で OpenClaw 固有のセキュリティ状態を確認します。
- OS パッチを適用するため、定期的に `sudo apt update && sudo apt upgrade` を実行します。
- [Tailscale admin console](https://login.tailscale.com/admin) でデバイスを定期的に確認します。

簡易確認コマンド：

```bash
# パブリックポートがリッスンしていないことを確認
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSH が有効であることを確認
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 任意：Tailscale SSH が動作していることを確認した後、sshd を完全に無効化
sudo systemctl disable --now ssh
```

## ARM に関する注意事項

Always Free ティアは ARM（`aarch64`）です。OpenClaw のほとんどの機能は問題なく動作しますが、少数のネイティブバイナリでは ARM ビルドが必要です。

- Node.js、Telegram、WhatsApp（Baileys）：純粋な JavaScript のため、問題はありません。
- ネイティブコードを含むほとんどの npm パッケージ：ビルド済みの `linux-arm64` アーティファクトを利用できます。
- オプションの CLI ヘルパー（例：Skills が提供する Go／Rust バイナリ）：インストール前に `aarch64` / `linux-arm64` リリースがあるか確認してください。

`uname -m` でアーキテクチャを確認します（`aarch64` と表示されるはずです）。ARM ビルドのないバイナリは、ソースからインストールするか、使用を見送ってください。

## 永続化とバックアップ

OpenClaw の状態は次の場所に保存されます。

- `~/.openclaw/` -- `openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル／プロバイダーの状態、セッションデータ。
- `~/.openclaw/workspace/` -- エージェントのワークスペース（SOUL.md、メモリ、アーティファクト）。

これらは再起動後も保持されます。移植可能なスナップショットを作成するには、次を実行します。

```bash
openclaw backup create
```

## 代替手段：SSH トンネル

Tailscale Serve が動作しない場合は、ローカルマシンから SSH トンネルを使用します。

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

次に `http://localhost:18789` を開きます。

## トラブルシューティング

**インスタンスの作成に失敗する（「Out of capacity」）** -- 無料ティアの ARM インスタンスは人気があります。別の可用性ドメインを試すか、利用の少ない時間帯に再試行してください。

**Tailscale が接続できない** -- `sudo tailscale up --ssh --hostname=openclaw --reset` を実行して再認証します。

**Gateway が起動しない** -- `openclaw doctor --non-interactive` を実行し、`journalctl --user -u openclaw-gateway.service -n 50` でログを確認します。

**ARM バイナリの問題** -- ほとんどの npm パッケージは ARM64 で動作します。ネイティブバイナリについては、`linux-arm64` または `aarch64` リリースを探してください。`uname -m` でアーキテクチャを確認します。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway の設定](/ja-JP/gateway/configuration) -- すべての設定オプション
- [更新](/ja-JP/install/updating) -- OpenClaw を最新の状態に保つ

## 関連項目

- [インストールの概要](/ja-JP/install)
- [GCP](/ja-JP/install/gcp)
- [VPS ホスティング](/ja-JP/vps)

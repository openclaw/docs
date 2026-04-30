---
read_when:
    - Oracle Cloud で OpenClaw をセットアップする
    - OpenClaw 向けの低コスト VPS ホスティングを探す
    - 小型サーバーで OpenClaw を 24時間365日動かしたい
summary: Oracle Cloud (Always Free ARM) での OpenClaw
title: Oracle Cloud (プラットフォーム)
x-i18n:
    generated_at: "2026-04-30T05:23:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# Oracle Cloud (OCI) で OpenClaw を使う

## 目標

Oracle Cloud の **Always Free** ARM ティアで永続的な OpenClaw Gateway を実行します。

Oracle の無料ティアは OpenClaw によく適合します（特にすでに OCI アカウントを持っている場合）が、次のトレードオフがあります。

- ARM アーキテクチャ（ほとんどのものは動作しますが、一部のバイナリは x86 専用の場合があります）
- 容量とサインアップが不安定な場合があります

## コスト比較 (2026)

| プロバイダー | プラン | 仕様 | 月額 | メモ |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | 最大 4 OCPU、24GB RAM | $0 | ARM、容量制限あり |
| Hetzner | CX22 | 2 vCPU、4GB RAM | 約 $4 | 最安の有料オプション |
| DigitalOcean | Basic | 1 vCPU、1GB RAM | $6 | 使いやすい UI、優れたドキュメント |
| Vultr | Cloud Compute | 1 vCPU、1GB RAM | $6 | 多数のロケーション |
| Linode | Nanode | 1 vCPU、1GB RAM | $5 | 現在は Akamai の一部 |

---

## 前提条件

- Oracle Cloud アカウント（[サインアップ](https://www.oracle.com/cloud/free/)）— 問題が発生した場合は [コミュニティのサインアップガイド](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) を参照してください
- Tailscale アカウント（[tailscale.com](https://tailscale.com) で無料）
- 約 30 分

## 1) OCI インスタンスを作成する

1. [Oracle Cloud Console](https://cloud.oracle.com/) にログインします
2. **Compute → Instances → Create Instance** に移動します
3. 設定:
   - **名前:** `openclaw`
   - **イメージ:** Ubuntu 24.04 (aarch64)
   - **シェイプ:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU:** 2（または最大 4）
   - **メモリ:** 12 GB（または最大 24 GB）
   - **ブートボリューム:** 50 GB（無料で最大 200 GB）
   - **SSH キー:** 公開鍵を追加します
4. **Create** をクリックします
5. パブリック IP アドレスを控えます

**ヒント:** インスタンス作成が「Out of capacity」で失敗する場合は、別の可用性ドメインを試すか、後で再試行してください。無料ティアの容量は限られています。

## 2) 接続して更新する

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注:** 一部の依存関係を ARM でコンパイルするには `build-essential` が必要です。

## 3) ユーザーとホスト名を設定する

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale をインストールする

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

これにより Tailscale SSH が有効になり、tailnet 上の任意のデバイスから `ssh openclaw` で接続できます。パブリック IP は不要です。

確認:

```bash
tailscale status
```

**今後は Tailscale 経由で接続します:** `ssh ubuntu@openclaw`（または Tailscale IP を使用）。

## 5) OpenClaw をインストールする

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

「How do you want to hatch your bot?」と表示されたら、**"Do this later"** を選択します。

> 注: ARM ネイティブビルドの問題が発生した場合は、Homebrew に進む前にシステムパッケージ（例: `sudo apt install -y build-essential`）から始めてください。

## 6) Gateway（loopback + トークン認証）を設定し、Tailscale Serve を有効にする

デフォルトとしてトークン認証を使用します。予測しやすく、「insecure auth」Control UI フラグを必要としません。

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

ここでの `gateway.trustedProxies=["127.0.0.1"]` は、ローカルの Tailscale Serve プロキシにおける転送 IP / ローカルクライアント処理のためだけのものです。これは **`gateway.auth.mode: "trusted-proxy"` ではありません**。この構成では、差分ビューアールートはフェイルクローズ動作を維持します。転送プロキシヘッダーのない生の `127.0.0.1` ビューアーリクエストは `Diff not found` を返す場合があります。添付ファイルには `mode=file` / `mode=both` を使用するか、共有可能なビューアーリンクが必要な場合は、意図的にリモートビューアーを有効にして `plugins.entries.diffs.config.viewerBaseUrl` を設定します（またはプロキシの `baseUrl` を渡します）。

## 7) 確認する

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) VCN セキュリティをロックダウンする

すべてが動作したら、Tailscale 以外のすべてのトラフィックをブロックするように VCN をロックダウンします。OCI の Virtual Cloud Network はネットワークエッジのファイアウォールとして機能し、トラフィックはインスタンスに到達する前にブロックされます。

1. OCI Console で **Networking → Virtual Cloud Networks** に移動します
2. 自分の VCN → **Security Lists** → Default Security List をクリックします
3. 次以外のすべてのイングレスルールを**削除**します:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. デフォルトのエグレスルールは維持します（すべてのアウトバウンドを許可）

これにより、ポート 22 の SSH、HTTP、HTTPS、およびその他すべてがネットワークエッジでブロックされます。今後は Tailscale 経由でのみ接続できます。

---

## Control UI にアクセスする

Tailscale ネットワーク上の任意のデバイスから:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` を自分の tailnet 名（`tailscale status` で確認可能）に置き換えます。

SSH トンネルは不要です。Tailscale は次を提供します。

- HTTPS 暗号化（自動証明書）
- Tailscale ID による認証
- tailnet 上の任意のデバイス（ノート PC、スマートフォンなど）からのアクセス

---

## セキュリティ: VCN + Tailscale（推奨ベースライン）

VCN をロックダウンし（UDP 41641 のみ開放）、Gateway を loopback にバインドすると、強力な多層防御が得られます。パブリックトラフィックはネットワークエッジでブロックされ、管理アクセスは tailnet 経由で行われます。

この構成では、インターネット全体からの SSH ブルートフォースを止めるためだけに追加のホストベースファイアウォールルールが必要になることは多くありません。ただし、OS を最新に保ち、`openclaw security audit` を実行し、パブリックインターフェイスで誤って待ち受けていないことを確認してください。

### すでに保護済み

| 従来の手順 | 必要？ | 理由 |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW ファイアウォール | いいえ | VCN がトラフィックがインスタンスに到達する前にブロックします |
| fail2ban | いいえ | ポート 22 が VCN でブロックされていればブルートフォースはありません |
| sshd の強化 | いいえ | Tailscale SSH は sshd を使用しません |
| root ログインの無効化 | いいえ | Tailscale はシステムユーザーではなく Tailscale ID を使用します |
| SSH キーのみの認証 | いいえ | Tailscale が tailnet 経由で認証します |
| IPv6 の強化 | 通常は不要 | VCN / サブネット設定に依存します。実際に割り当て / 公開されているものを確認してください |

### 引き続き推奨

- **認証情報の権限:** `chmod 700 ~/.openclaw`
- **セキュリティ監査:** `openclaw security audit`
- **システム更新:** `sudo apt update && sudo apt upgrade` を定期的に実行
- **Tailscale の監視:** [Tailscale 管理コンソール](https://login.tailscale.com/admin) でデバイスを確認

### セキュリティ状態を確認する

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## フォールバック: SSH トンネル

Tailscale Serve が動作しない場合は、SSH トンネルを使用します。

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

その後、`http://localhost:18789` を開きます。

---

## トラブルシューティング

### インスタンス作成に失敗する（「Out of capacity」）

無料ティアの ARM インスタンスは人気があります。次を試してください。

- 別の可用性ドメイン
- オフピーク時間（早朝）に再試行
- シェイプ選択時に「Always Free」フィルターを使用

### Tailscale が接続しない

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway が起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI に到達できない

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### ARM バイナリの問題

一部のツールには ARM ビルドがない場合があります。確認:

```bash
uname -m  # Should show aarch64
```

ほとんどの npm パッケージは問題なく動作します。バイナリについては、`linux-arm64` または `aarch64` リリースを探してください。

---

## 永続化

すべての状態は次に保存されます。

- `~/.openclaw/` — `openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル / プロバイダー状態、セッションデータ
- `~/.openclaw/workspace/` — ワークスペース（SOUL.md、メモリ、アーティファクト）

定期的にバックアップします。

```bash
openclaw backup create
```

---

## 関連

- [Gateway リモートアクセス](/ja-JP/gateway/remote) — その他のリモートアクセスパターン
- [Tailscale 連携](/ja-JP/gateway/tailscale) — Tailscale の完全なドキュメント
- [Gateway 設定](/ja-JP/gateway/configuration) — すべての設定オプション
- [DigitalOcean ガイド](/ja-JP/install/digitalocean) — 有料でサインアップが簡単なものがよい場合
- [Hetzner ガイド](/ja-JP/install/hetzner) — Docker ベースの代替手段

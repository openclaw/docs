---
read_when:
    - Oracle Cloud上でOpenClawをセットアップする
    - OpenClaw向けの低コストVPSホスティングを探している場合
    - 小型サーバー上で24時間365日OpenClawを動かしたい場合
summary: Oracle Cloud（Always Free ARM）上のOpenClaw
title: Oracle Cloud（プラットフォーム）
x-i18n:
    generated_at: "2026-04-24T05:09:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# Oracle Cloud（OCI）上のOpenClaw

## 目的

Oracle Cloudの**Always Free** ARMティア上で、永続的なOpenClaw Gatewayを実行します。

Oracleの無料ティアは、OpenClawに非常に適している場合があります（特に、すでにOCIアカウントを持っている場合）。ただし、次のようなトレードオフがあります。

- ARMアーキテクチャ（多くのものは動作しますが、一部バイナリはx86専用の場合があります）
- 容量やサインアップが不安定なことがある

## 料金比較（2026年）

| プロバイダー | プラン | スペック | 月額 | 備考 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | 最大4 OCPU、24GB RAM | $0       | ARM、容量制限あり |
| Hetzner      | CX22            | 2 vCPU、4GB RAM        | ~ $4     | 最も安い有料オプション |
| DigitalOcean | Basic           | 1 vCPU、1GB RAM        | $6       | UIが簡単、ドキュメントが良い |
| Vultr        | Cloud Compute   | 1 vCPU、1GB RAM        | $6       | ロケーション多数 |
| Linode       | Nanode          | 1 vCPU、1GB RAM        | $5       | 現在はAkamai傘下 |

---

## 前提条件

- Oracle Cloudアカウント（[signup](https://www.oracle.com/cloud/free/)）— 問題が出る場合は[community signup guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)を参照
- Tailscaleアカウント（[tailscale.com](https://tailscale.com)で無料）
- 約30分

## 1) OCIインスタンスを作成する

1. [Oracle Cloud Console](https://cloud.oracle.com/)にログインします
2. **Compute → Instances → Create Instance**へ移動します
3. 次のように設定します:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04（aarch64）
   - **Shape:** `VM.Standard.A1.Flex`（Ampere ARM）
   - **OCPUs:** 2（または最大4）
   - **Memory:** 12 GB（または最大24 GB）
   - **Boot volume:** 50 GB（無料で最大200 GB）
   - **SSH key:** 公開鍵を追加
4. **Create**をクリックします
5. パブリックIPアドレスを控えます

**ヒント:** インスタンス作成が「Out of capacity」で失敗する場合は、別のavailability domainを試すか、後でもう一度試してください。無料ティアの容量は限られています。

## 2) 接続して更新する

```bash
# パブリックIP経由で接続
ssh ubuntu@YOUR_PUBLIC_IP

# システム更新
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注意:** `build-essential`は、一部依存関係のARMコンパイルに必要です。

## 3) ユーザーとhostnameを設定する

```bash
# hostnameを設定
sudo hostnamectl set-hostname openclaw

# ubuntuユーザーのパスワードを設定
sudo passwd ubuntu

# lingeringを有効化（ログアウト後もユーザーサービスを動作させる）
sudo loginctl enable-linger ubuntu
```

## 4) Tailscaleをインストールする

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

これによりTailscale SSHが有効になり、tailnet上の任意のデバイスから`ssh openclaw`で接続できます。パブリックIPは不要です。

確認:

```bash
tailscale status
```

**以後はTailscale経由で接続してください:** `ssh ubuntu@openclaw`（またはTailscale IPを使用）。

## 5) OpenClawをインストールする

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

「How do you want to hatch your bot?」と聞かれたら、**"Do this later"**を選択してください。

> 注意: ARMネイティブビルドの問題に当たった場合は、Homebrewへ手を出す前に、まずシステムパッケージ（例: `sudo apt install -y build-essential`）から始めてください。

## 6) Gatewayを設定する（loopback + token認証）し、Tailscale Serveを有効化する

デフォルトではtoken認証を使用してください。これは予測しやすく、Control UIの「insecure auth」フラグを不要にします。

```bash
# GatewayをVM上でプライベートに保つ
openclaw config set gateway.bind loopback

# Gateway + Control UIに認証を必須化
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Tailscale Serve経由で公開（HTTPS + tailnetアクセス）
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

ここでの`gateway.trustedProxies=["127.0.0.1"]`は、ローカルのTailscale Serveプロキシによるforwarded-IP/local-client処理用です。これは**`gateway.auth.mode: "trusted-proxy"`ではありません**。この構成ではdiff viewerルートはfail-closed動作を維持します。forwarded proxyヘッダーなしの生の`127.0.0.1` viewerリクエストは`Diff not found`を返すことがあります。添付には`mode=file` / `mode=both`を使用するか、共有可能なviewerリンクが必要なら、意図的にリモートviewerを有効化し、`plugins.entries.diffs.config.viewerBaseUrl`（またはプロキシの`baseUrl`）を設定してください。

## 7) 確認する

```bash
# バージョン確認
openclaw --version

# daemonステータス確認
systemctl --user status openclaw-gateway.service

# Tailscale Serve確認
tailscale serve status

# ローカル応答テスト
curl http://localhost:18789
```

## 8) VCNセキュリティをロックダウンする

すべてが動作していることを確認したら、VCNをロックダウンして、Tailscale以外のすべてのトラフィックをブロックします。OCIのVirtual Cloud Networkはネットワークエッジのファイアウォールとして動作します。トラフィックはインスタンスに到達する前にブロックされます。

1. OCI Consoleの**Networking → Virtual Cloud Networks**へ移動
2. VCNをクリック → **Security Lists** → Default Security List
3. 次を除くすべてのingressルールを**削除**:
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. デフォルトのegressルールは維持（すべての送信を許可）

これにより、ポート22のSSH、HTTP、HTTPS、そのほかすべてがネットワークエッジでブロックされます。以後はTailscale経由でのみ接続できます。

---

## Control UIへアクセスする

Tailscaleネットワーク上の任意のデバイスから:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>`は自分のtailnet名に置き換えてください（`tailscale status`で確認できます）。

SSHトンネルは不要です。Tailscaleが提供するもの:

- HTTPS暗号化（証明書は自動）
- Tailscaleアイデンティティによる認証
- tailnet上の任意のデバイス（ノートPC、スマートフォンなど）からのアクセス

---

## セキュリティ: VCN + Tailscale（推奨ベースライン）

VCNをロックダウンし（UDP 41641のみ開放）、Gatewayをloopbackへbindすると、強力な多層防御になります。パブリックトラフィックはネットワークエッジでブロックされ、管理アクセスはtailnet経由で行われます。

このセットアップにより、インターネット全体からのSSH総当たりを止めるためだけの追加のホストベースファイアウォールルールは、しばしば**不要**になります。ただし、OSは引き続き更新し、`openclaw security audit`を実行し、誤ってパブリックインターフェースで待ち受けていないことを確認してください。

### すでに保護されているもの

| 従来の手順 | 必要か？ | 理由 |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFWファイアウォール | 不要 | VCNがトラフィックをインスタンス到達前にブロックする |
| fail2ban           | 不要 | VCNで22番ポートを塞げば総当たりは来ない |
| sshdハードニング | 不要 | Tailscale SSHはsshdを使わない |
| rootログイン無効化 | 不要 | TailscaleはシステムユーザーではなくTailscaleアイデンティティを使う |
| SSH key-only認証 | 不要 | Tailscaleはtailnet経由で認証する |
| IPv6ハードニング | 通常不要 | VCN/サブネット設定による。実際に何が割り当て/公開されているか確認してください |

### それでも推奨されるもの

- **資格情報権限:** `chmod 700 ~/.openclaw`
- **セキュリティ監査:** `openclaw security audit`
- **システム更新:** `sudo apt update && sudo apt upgrade`を定期的に実行
- **Tailscale監視:** [Tailscale admin console](https://login.tailscale.com/admin)でデバイスを確認

### セキュリティ状態を確認する

```bash
# パブリックポートで待ち受けていないことを確認
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSHが有効であることを確認
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 任意: sshdを完全に無効化
sudo systemctl disable --now ssh
```

---

## フォールバック: SSHトンネル

Tailscale Serveが動作しない場合は、SSHトンネルを使ってください。

```bash
# ローカルマシンから（Tailscale経由）
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

その後、`http://localhost:18789`を開きます。

---

## トラブルシューティング

### インスタンス作成に失敗する（"Out of capacity"）

無料ティアARMインスタンスは人気があります。次を試してください。

- 別のavailability domain
- オフピーク時間帯（早朝）に再試行
- shape選択時に「Always Free」フィルターを使用

### Tailscaleが接続しない

```bash
# ステータス確認
sudo tailscale status

# 再認証
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gatewayが起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UIへ到達できない

```bash
# Tailscale Serveが動いていることを確認
tailscale serve status

# gatewayがlistenしていることを確認
curl http://localhost:18789

# 必要なら再起動
systemctl --user restart openclaw-gateway.service
```

### ARMバイナリの問題

一部ツールはARMビルドを持たない場合があります。確認:

```bash
uname -m  # aarch64と表示されるはず
```

ほとんどのnpmパッケージは問題なく動作します。バイナリについては、`linux-arm64`または`aarch64`リリースを探してください。

---

## 永続化

すべての状態は次にあります。

- `~/.openclaw/` — `openclaw.json`、エージェントごとの`auth-profiles.json`、チャネル/プロバイダー状態、およびセッションデータ
- `~/.openclaw/workspace/` — ワークスペース（SOUL.md、memory、artifacts）

定期的にバックアップしてください。

```bash
openclaw backup create
```

---

## 関連

- [Gateway remote access](/ja-JP/gateway/remote) — その他のリモートアクセスパターン
- [Tailscale integration](/ja-JP/gateway/tailscale) — 完全なTailscaleドキュメント
- [Gateway configuration](/ja-JP/gateway/configuration) — すべての設定オプション
- [DigitalOcean guide](/ja-JP/install/digitalocean) — 有料だがサインアップが簡単な選択肢が欲しい場合
- [Hetzner guide](/ja-JP/install/hetzner) — Dockerベースの代替手段

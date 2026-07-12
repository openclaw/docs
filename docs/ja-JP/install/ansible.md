---
read_when:
    - セキュリティ強化を施したサーバーの自動デプロイが必要な場合
    - VPN アクセスを備えたファイアウォール分離環境のセットアップが必要です
    - リモートの Debian/Ubuntu サーバーにデプロイする場合
summary: Ansible、Tailscale VPN、ファイアウォール分離による、自動化され強化された OpenClaw のインストール
title: Ansible
x-i18n:
    generated_at: "2026-07-11T22:18:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw を本番サーバーにデプロイするには、セキュリティ優先のアーキテクチャを採用した自動インストーラー **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** を使用します。

<Info>
Ansible デプロイに関する信頼できる唯一の情報源は、[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) リポジトリです。このページでは概要を簡潔に説明します。
</Info>

## 前提条件

| 要件        | 詳細                                                      |
| ----------- | --------------------------------------------------------- |
| OS          | Debian 11 以降または Ubuntu 20.04 以降                    |
| アクセス    | root または sudo 権限                                     |
| ネットワーク | パッケージをインストールするためのインターネット接続      |
| Ansible     | 2.14 以降（クイックスタートスクリプトによって自動インストール） |

## 導入されるもの

- ファイアウォール優先のセキュリティ：UFW + Docker による分離（SSH + Tailscale のみアクセス可能）
- サービスを公開せずにリモートアクセスするための Tailscale VPN
- localhost のみにバインドされた分離サンドボックスコンテナ用の Docker
- セキュリティ強化と起動時の自動開始を備えた systemd 統合
- 1 コマンドでのセットアップ

## クイックスタート

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされるもの

1. Tailscale（安全なリモートアクセス用のメッシュ VPN）
2. UFW ファイアウォール（SSH + Tailscale のポートのみ）
3. Docker CE + Compose V2（デフォルトのエージェントサンドボックスバックエンド）
4. Node.js と pnpm（OpenClaw には Node 22.19 以降または 23.11 以降が必要。Node 24 を推奨）
5. コンテナ化せず、ホストベースでインストールされる OpenClaw
6. セキュリティ強化を施した systemd サービス

<Note>
Gateway は Docker 内ではなく、ホスト上で直接実行されます。エージェントのサンドボックス化は
任意です。このプレイブックでは、Docker がデフォルトのサンドボックス
バックエンドであるためインストールします。その他のバックエンドについては、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    インストール後のスクリプトに従って OpenClaw を設定します。
  </Step>
  <Step title="Connect messaging channels">
    WhatsApp、Telegram、Discord、または Signal にログインします。
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
    安全なリモートアクセスのために VPN メッシュへ参加します。
  </Step>
</Steps>

### クイックコマンド

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Channel login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## セキュリティアーキテクチャ

4 層の防御モデル：

1. ファイアウォール（UFW）：SSH（22）と Tailscale（41641/udp）のみを公開
2. VPN（Tailscale）：Gateway は VPN メッシュ経由でのみアクセス可能
3. Docker による分離：`DOCKER-USER` iptables チェーンによって外部へのポート公開を防止
4. Systemd のセキュリティ強化：`NoNewPrivileges`、`PrivateTmp`、非特権ユーザー

外部からの攻撃対象領域を確認します。

```bash
nmap -p- YOUR_SERVER_IP
```

開いているのはポート 22（SSH）のみである必要があります。Gateway と Docker は外部からアクセスできない状態に保たれます。

Docker は Gateway の実行用ではなく、エージェントサンドボックス（分離されたツール実行環境）用にインストールされます。サンドボックスの設定については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

## 手動インストール

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
    ```bash
    ./run-playbook.sh
    ```

    または、プレイブックを直接実行してから、セットアップスクリプトを手動で実行します。
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible インストーラーは、OpenClaw を手動で更新できるように設定します。標準的な手順については、[更新](/ja-JP/install/updating)を参照してください。

設定変更後などにプレイブックを再実行するには、次のコマンドを使用します。

```bash
cd openclaw-ansible
./run-playbook.sh
```

この処理は冪等であり、複数回実行しても安全です。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - まず Tailscale VPN 経由で接続してください。Gateway は設計上、その方法でのみアクセスできます。
    - SSH（ポート 22）は常に許可されます。

  </Accordion>
  <Accordion title="Service will not start">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandbox issues">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build the sandbox image if missing (requires a source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Channel login fails">
    `openclaw` ユーザーとして実行していることを確認してください。
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## 高度な設定

セキュリティアーキテクチャとトラブルシューティングの詳細については、openclaw-ansible リポジトリを参照してください。

- [セキュリティアーキテクチャ](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技術詳細](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [トラブルシューティングガイド](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連項目

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible)：完全なデプロイガイド
- [Docker](/ja-JP/install/docker)：コンテナ化された Gateway のセットアップ
- [サンドボックス化](/ja-JP/gateway/sandboxing)：エージェントサンドボックスの設定
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)：エージェントごとの分離

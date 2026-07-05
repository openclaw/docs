---
read_when:
    - セキュリティ強化を備えた自動サーバーデプロイが必要です
    - VPN アクセスを備えたファイアウォール分離セットアップが必要です
    - リモートの Debian/Ubuntu サーバーにデプロイする場合
summary: Ansible、Tailscale VPN、ファイアウォール分離による、自動化され強化された OpenClaw インストール
title: Ansible
x-i18n:
    generated_at: "2026-07-05T11:25:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

**[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** を使用して OpenClaw を本番サーバーにデプロイします。これはセキュリティ優先のアーキテクチャを備えた自動インストーラーです。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) リポジトリは、Ansible デプロイの信頼できる情報源です。このページは簡単な概要です。
</Info>

## 前提条件

| 要件 | 詳細                                                   |
| ----------- | --------------------------------------------------------- |
| OS          | Debian 11+ または Ubuntu 20.04+                               |
| アクセス      | root または sudo 権限                                   |
| ネットワーク     | パッケージインストール用のインターネット接続              |
| Ansible     | 2.14+（クイックスタートスクリプトにより自動でインストール） |

## 得られるもの

- ファイアウォール優先のセキュリティ: UFW + Docker 分離（SSH + Tailscale のみ到達可能）
- サービスを公開せずにリモートアクセスするための Tailscale VPN
- localhost のみのバインドを持つ分離サンドボックスコンテナ用の Docker
- ハードニングと起動時の自動起動を備えた systemd 統合
- 1 コマンドセットアップ

## クイックスタート

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされるもの

1. Tailscale（安全なリモートアクセス用のメッシュ VPN）
2. UFW ファイアウォール（SSH + Tailscale ポートのみ）
3. Docker CE + Compose V2（デフォルトのエージェントサンドボックスバックエンド）
4. Node.js と pnpm（OpenClaw には Node 22.19+ または 23.11+ が必要です。Node 24 を推奨します）
5. OpenClaw。コンテナ化ではなくホストベースでインストールされます
6. セキュリティハードニング付きの systemd サービス

<Note>
Gateway は Docker 内ではなく、ホスト上で直接実行されます。エージェントのサンドボックス化は
任意です。この playbook は、Docker がデフォルトのサンドボックス
バックエンドであるため Docker をインストールします。他のバックエンドについては [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="openclaw ユーザーに切り替える">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="オンボーディングウィザードを実行する">
    インストール後スクリプトが OpenClaw の設定を案内します。
  </Step>
  <Step title="メッセージングチャネルを接続する">
    WhatsApp、Telegram、Discord、または Signal にログインします:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="インストールを確認する">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscale に接続する">
    安全なリモートアクセスのために VPN メッシュに参加します。
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

4 層防御モデル:

1. ファイアウォール（UFW）: SSH（22）と Tailscale（41641/udp）のみを公開
2. VPN（Tailscale）: Gateway は VPN メッシュ経由でのみ到達可能
3. Docker 分離: `DOCKER-USER` iptables チェーンが外部ポート公開を防止
4. Systemd ハードニング: `NoNewPrivileges`、`PrivateTmp`、非特権ユーザー

外部攻撃対象領域を確認します:

```bash
nmap -p- YOUR_SERVER_IP
```

ポート 22（SSH）のみが開いている必要があります。Gateway と Docker はロックダウンされたままです。

Docker はエージェントサンドボックス（分離されたツール実行）のためにインストールされ、Gateway の実行用ではありません。サンドボックス設定については [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 手動インストール

<Steps>
  <Step title="前提条件をインストールする">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="リポジトリをクローンする">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansible コレクションをインストールする">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="playbook を実行する">
    ```bash
    ./run-playbook.sh
    ```

    または、playbook を直接実行してからセットアップスクリプトを手動で実行します:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible インストーラーは、OpenClaw を手動更新用にセットアップします。標準フローについては [更新](/ja-JP/install/updating) を参照してください。

playbook を再実行するには（たとえば、設定変更後）:

```bash
cd openclaw-ansible
./run-playbook.sh
```

これは冪等で、複数回実行しても安全です。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ファイアウォールが接続をブロックする">
    - まず Tailscale VPN 経由で接続してください。Gateway は設計上、その方法でのみ到達可能です。
    - SSH（ポート 22）は常に許可されます。

  </Accordion>
  <Accordion title="サービスが起動しない">
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
  <Accordion title="Docker サンドボックスの問題">
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
  <Accordion title="チャネルログインが失敗する">
    `openclaw` ユーザーとして実行していることを確認してください:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## 高度な設定

詳細なセキュリティアーキテクチャとトラブルシューティングについては、openclaw-ansible リポジトリを参照してください:

- [セキュリティアーキテクチャ](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技術詳細](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [トラブルシューティングガイド](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): 完全なデプロイガイド
- [Docker](/ja-JP/install/docker): コンテナ化された Gateway セットアップ
- [サンドボックス化](/ja-JP/gateway/sandboxing): エージェントサンドボックス設定
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools): エージェントごとの分離

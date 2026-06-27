---
read_when:
    - セキュリティ強化を伴うサーバーの自動デプロイが必要です
    - VPN アクセスを備えたファイアウォール分離型セットアップが必要です
    - リモートの Debian/Ubuntu サーバーにデプロイする場合
summary: Ansible、Tailscale VPN、ファイアウォール分離による、自動化され強化された OpenClaw インストール
title: Ansible
x-i18n:
    generated_at: "2026-06-27T11:47:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw を **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** で本番サーバーにデプロイします -- セキュリティ優先のアーキテクチャを備えた自動インストーラーです。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) リポジトリは、Ansible デプロイの信頼できる情報源です。このページは簡単な概要です。
</Info>

## 前提条件

| 要件        | 詳細                                                      |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ または Ubuntu 20.04+                           |
| **アクセス** | root または sudo 権限                                     |
| **ネットワーク** | パッケージインストール用のインターネット接続              |
| **Ansible** | 2.14+（クイックスタートスクリプトで自動インストール）     |

## 得られるもの

- **ファイアウォール優先のセキュリティ** -- UFW + Docker 分離（SSH + Tailscale のみアクセス可能）
- **Tailscale VPN** -- サービスを公開せずに安全なリモートアクセスを提供
- **Docker** -- 分離されたサンドボックスコンテナ、localhost のみのバインディング
- **多層防御** -- 4 層のセキュリティアーキテクチャ
- **Systemd 連携** -- ハードニング付きで起動時に自動開始
- **ワンコマンドセットアップ** -- 数分で完全なデプロイ

## クイックスタート

ワンコマンドインストール:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされるもの

Ansible playbook は次をインストールして設定します。

1. **Tailscale** -- 安全なリモートアクセス用のメッシュ VPN
2. **UFW ファイアウォール** -- SSH + Tailscale ポートのみ
3. **Docker CE + Compose V2** -- デフォルトのエージェントサンドボックスバックエンド用
4. **Node.js 24 + pnpm** -- ランタイム依存関係（Node 22 LTS、現在は `22.19+`、引き続きサポート）
5. **OpenClaw** -- ホストベース、コンテナ化なし
6. **Systemd サービス** -- セキュリティハードニング付きで自動開始

<Note>
ゲートウェイは（Docker 内ではなく）ホスト上で直接実行されます。エージェントサンドボックス化は任意です。この playbook が Docker をインストールするのは、それがデフォルトのサンドボックスバックエンドだからです。詳細と他のバックエンドについては [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    インストール後スクリプトが OpenClaw 設定の構成を案内します。
  </Step>
  <Step title="Connect messaging providers">
    WhatsApp、Telegram、Discord、または Signal にログインします。
    ```bash
    openclaw channels login
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

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## セキュリティアーキテクチャ

このデプロイは 4 層の防御モデルを使用します。

1. **ファイアウォール（UFW）** -- SSH（22）+ Tailscale（41641/udp）のみを公開
2. **VPN（Tailscale）** -- ゲートウェイは VPN メッシュ経由でのみアクセス可能
3. **Docker 分離** -- DOCKER-USER iptables チェーンが外部ポート公開を防止
4. **Systemd ハードニング** -- NoNewPrivileges、PrivateTmp、非特権ユーザー

外部攻撃面を確認するには:

```bash
nmap -p- YOUR_SERVER_IP
```

ポート 22（SSH）のみが開いている必要があります。その他すべてのサービス（ゲートウェイ、Docker）はロックダウンされます。

Docker はエージェントサンドボックス（分離されたツール実行）のためにインストールされ、ゲートウェイ自体を実行するためではありません。サンドボックス設定については [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 手動インストール

自動化よりも手動で制御したい場合:

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

    または、直接実行してから、その後にセットアップスクリプトを手動で実行します。
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible インストーラーは、手動更新向けに OpenClaw をセットアップします。標準の更新フローについては [更新](/ja-JP/install/updating) を参照してください。

Ansible playbook を再実行するには（たとえば、設定変更のため）:

```bash
cd openclaw-ansible
./run-playbook.sh
```

これは冪等であり、複数回実行しても安全です。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - まず Tailscale VPN 経由でアクセスできることを確認します
    - SSH アクセス（ポート 22）は常に許可されます
    - ゲートウェイは設計上、Tailscale 経由でのみアクセス可能です

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

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Provider login fails">
    `openclaw` ユーザーとして実行していることを確認してください。
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 高度な設定

詳細なセキュリティアーキテクチャとトラブルシューティングについては、openclaw-ansible リポジトリを参照してください。

- [セキュリティアーキテクチャ](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技術的詳細](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [トラブルシューティングガイド](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 完全なデプロイガイド
- [Docker](/ja-JP/install/docker) -- コンテナ化されたゲートウェイセットアップ
- [サンドボックス化](/ja-JP/gateway/sandboxing) -- エージェントサンドボックス設定
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの分離

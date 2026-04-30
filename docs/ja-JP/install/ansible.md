---
read_when:
    - セキュリティ強化を伴う自動サーバーデプロイが必要な場合
    - VPNアクセスを備えたファイアウォール分離型のセットアップが必要です
    - リモートの Debian/Ubuntu サーバーにデプロイする場合
summary: Ansible、Tailscale VPN、ファイアウォール分離による、自動化され堅牢化された OpenClaw インストール
title: Ansible
x-i18n:
    generated_at: "2026-04-30T05:18:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Ansible インストール

**[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** で OpenClaw を本番サーバーにデプロイします -- セキュリティ優先アーキテクチャの自動インストーラーです。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) リポジトリは、Ansible デプロイの信頼できる情報源です。このページはクイック概要です。
</Info>

## 前提条件

| 要件        | 詳細                                                      |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ または Ubuntu 20.04+                           |
| **アクセス** | root または sudo 権限                                    |
| **ネットワーク** | パッケージインストール用のインターネット接続       |
| **Ansible** | 2.14+（クイックスタートスクリプトにより自動インストール） |

## 得られるもの

- **ファイアウォール優先のセキュリティ** -- UFW + Docker 分離（SSH + Tailscale のみアクセス可能）
- **Tailscale VPN** -- サービスを公開せずに安全なリモートアクセスを提供
- **Docker** -- 分離されたサンドボックスコンテナ、localhost 専用バインディング
- **多層防御** -- 4 層のセキュリティアーキテクチャ
- **Systemd 統合** -- ハードニング付きで起動時に自動起動
- **ワンコマンドセットアップ** -- 数分で完全なデプロイ

## クイックスタート

ワンコマンドインストール:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされるもの

Ansible プレイブックは以下をインストールおよび設定します。

1. **Tailscale** -- 安全なリモートアクセス用のメッシュ VPN
2. **UFW ファイアウォール** -- SSH + Tailscale ポートのみ
3. **Docker CE + Compose V2** -- デフォルトのエージェントサンドボックスバックエンド用
4. **Node.js 24 + pnpm** -- ランタイム依存関係（Node 22 LTS、現在は `22.14+` も引き続きサポート）
5. **OpenClaw** -- コンテナ化ではなくホストベース
6. **Systemd サービス** -- セキュリティハードニング付きで自動起動

<Note>
Gateway はホスト上で直接実行されます（Docker 内ではありません）。エージェントのサンドボックス化は
任意です。このプレイブックは Docker がデフォルトのサンドボックス
バックエンドであるため Docker をインストールします。詳細と他のバックエンドについては [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="openclaw ユーザーに切り替える">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="オンボーディングウィザードを実行する">
    インストール後スクリプトが、OpenClaw 設定の構成を案内します。
  </Step>
  <Step title="メッセージングプロバイダーを接続する">
    WhatsApp、Telegram、Discord、または Signal にログインします。
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="インストールを検証する">
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

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## セキュリティアーキテクチャ

このデプロイは 4 層防御モデルを使用します。

1. **ファイアウォール（UFW）** -- SSH（22）+ Tailscale（41641/udp）のみを公開
2. **VPN（Tailscale）** -- Gateway は VPN メッシュ経由でのみアクセス可能
3. **Docker 分離** -- DOCKER-USER iptables チェーンが外部ポート公開を防止
4. **Systemd ハードニング** -- NoNewPrivileges、PrivateTmp、非特権ユーザー

外部攻撃対象領域を検証するには:

```bash
nmap -p- YOUR_SERVER_IP
```

ポート 22（SSH）のみが開いている必要があります。他のすべてのサービス（Gateway、Docker）はロックダウンされています。

Docker はエージェントサンドボックス（分離されたツール実行）のためにインストールされ、Gateway 自体を実行するためではありません。サンドボックス設定については [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 手動インストール

自動化よりも手動制御を優先する場合:

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
  <Step title="プレイブックを実行する">
    ```bash
    ./run-playbook.sh
    ```

    または、直接実行してから後で手動でセットアップスクリプトを実行します。
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible インストーラーは、OpenClaw を手動更新用にセットアップします。標準の更新フローについては [更新](/ja-JP/install/updating) を参照してください。

Ansible プレイブックを再実行するには（たとえば、設定変更のため）:

```bash
cd openclaw-ansible
./run-playbook.sh
```

これは冪等であり、複数回実行しても安全です。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ファイアウォールが接続をブロックする">
    - まず Tailscale VPN 経由でアクセスできることを確認します
    - SSH アクセス（ポート 22）は常に許可されます
    - Gateway は設計上 Tailscale 経由でのみアクセス可能です

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

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="プロバイダーログインに失敗する">
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
- [技術詳細](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [トラブルシューティングガイド](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 完全なデプロイガイド
- [Docker](/ja-JP/install/docker) -- コンテナ化された Gateway セットアップ
- [サンドボックス化](/ja-JP/gateway/sandboxing) -- エージェントサンドボックス設定
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位の分離

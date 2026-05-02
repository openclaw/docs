---
read_when:
    - セキュリティ強化を伴うサーバーの自動デプロイを行いたい場合
    - VPN アクセスを備えたファイアウォールで分離されたセットアップが必要です
    - リモートの Debian/Ubuntu サーバーにデプロイしている場合
summary: Ansible、Tailscale VPN、ファイアウォール分離を使用した、自動化され堅牢化された OpenClaw インストール
title: Ansible
x-i18n:
    generated_at: "2026-05-02T04:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# Ansible インストール

セキュリティ優先アーキテクチャの自動インストーラー **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** で、OpenClaw を本番サーバーにデプロイします。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) リポジトリは、Ansible デプロイの信頼できる情報源です。このページは簡単な概要です。
</Info>

## 前提条件

| 要件        | 詳細                                                      |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ または Ubuntu 20.04+                           |
| **アクセス** | root または sudo 権限                                     |
| **ネットワーク** | パッケージインストール用のインターネット接続              |
| **Ansible** | 2.14+（クイックスタートスクリプトにより自動インストール） |

## 得られるもの

- **ファイアウォール優先のセキュリティ** -- UFW + Docker 分離（SSH + Tailscale のみアクセス可能）
- **Tailscale VPN** -- サービスを公開せずに安全なリモートアクセスを提供
- **Docker** -- 分離されたサンドボックスコンテナ、localhost のみのバインド
- **多層防御** -- 4 層のセキュリティアーキテクチャ
- **Systemd 統合** -- ハードニング付きで起動時に自動開始
- **1 コマンドセットアップ** -- 数分で完全デプロイ

## クイックスタート

1 コマンドインストール:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされるもの

Ansible playbook は次をインストールして設定します。

1. **Tailscale** -- 安全なリモートアクセス用のメッシュ VPN
2. **UFW ファイアウォール** -- SSH + Tailscale ポートのみ
3. **Docker CE + Compose V2** -- デフォルトのエージェントサンドボックスバックエンド用
4. **Node.js 24 + pnpm** -- ランタイム依存関係（Node 22 LTS、現在は `22.14+`、も引き続きサポート）
5. **OpenClaw** -- コンテナ化ではなくホストベース
6. **Systemd サービス** -- セキュリティハードニング付きで自動開始

<Note>
Gateway は（Docker 内ではなく）ホスト上で直接実行されます。エージェントのサンドボックス化は
任意です。この playbook は、デフォルトのサンドボックス
バックエンドであるため Docker をインストールします。詳細と他のバックエンドについては、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="openclaw ユーザーに切り替える">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="オンボーディングウィザードを実行する">
    インストール後スクリプトが OpenClaw 設定の構成を案内します。
  </Step>
  <Step title="メッセージングプロバイダーを接続する">
    WhatsApp、Telegram、Discord、または Signal にログインします。
    ```bash
    openclaw channels login
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

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## セキュリティアーキテクチャ

デプロイは 4 層の防御モデルを使用します。

1. **ファイアウォール（UFW）** -- SSH（22）+ Tailscale（41641/udp）のみを公開
2. **VPN（Tailscale）** -- Gateway は VPN メッシュ経由でのみアクセス可能
3. **Docker 分離** -- DOCKER-USER iptables チェーンが外部ポート公開を防止
4. **Systemd ハードニング** -- NoNewPrivileges、PrivateTmp、非特権ユーザー

外部攻撃対象領域を確認するには:

```bash
nmap -p- YOUR_SERVER_IP
```

ポート 22（SSH）のみが開いている必要があります。他のすべてのサービス（Gateway、Docker）はロックダウンされています。

Docker は Gateway 自体を実行するためではなく、エージェントサンドボックス（分離されたツール実行）のためにインストールされます。サンドボックス設定については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

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
  <Step title="playbook を実行する">
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

Ansible インストーラーは、OpenClaw を手動更新できるようにセットアップします。標準の更新フローについては、[更新](/ja-JP/install/updating)を参照してください。

Ansible playbook を再実行するには（たとえば、設定変更の場合）:

```bash
cd openclaw-ansible
./run-playbook.sh
```

これは冪等であり、複数回実行しても安全です。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ファイアウォールが接続をブロックする">
    - まず Tailscale VPN 経由でアクセスできることを確認してください
    - SSH アクセス（ポート 22）は常に許可されています
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

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
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
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位の分離

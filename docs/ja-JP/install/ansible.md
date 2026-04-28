---
read_when:
    - セキュリティ強化を含む自動化されたサーバーデプロイが必要です
    - VPNアクセスを備えたファイアウォール分離セットアップが必要です
    - リモートのDebian/Ubuntuサーバーにデプロイしています
summary: Ansible、Tailscale VPN、ファイアウォール分離による自動化され強化されたOpenClawインストール
title: Ansible
x-i18n:
    generated_at: "2026-04-21T04:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Ansibleインストール

**[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** を使って本番サーバーにOpenClawをデプロイします。これは、セキュリティ優先のアーキテクチャを備えた自動インストーラーです。

<Info>
Ansibleデプロイの信頼できる唯一の情報源は[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)リポジトリです。このページは簡単な概要です。
</Info>

## 前提条件

| Requirement | 詳細                                                    |
| ----------- | ------------------------------------------------------- |
| **OS**      | Debian 11+ または Ubuntu 20.04+                         |
| **Access**  | rootまたはsudo権限                                      |
| **Network** | パッケージインストール用のインターネット接続            |
| **Ansible** | 2.14+（クイックスタートスクリプトが自動でインストール） |

## 導入されるもの

- **ファイアウォール優先のセキュリティ** -- UFW + Docker分離（SSH + Tailscaleのみアクセス可能）
- **Tailscale VPN** -- サービスを公開せずに安全なリモートアクセスを提供
- **Docker** -- 分離されたsandboxコンテナ、localhost専用バインド
- **多層防御** -- 4層のセキュリティアーキテクチャ
- **Systemd統合** -- セキュリティ強化付きで起動時に自動開始
- **ワンコマンドセットアップ** -- 数分で完全デプロイ

## クイックスタート

ワンコマンドインストール:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされるもの

Ansible playbookは以下をインストールして設定します。

1. **Tailscale** -- 安全なリモートアクセスのためのmesh VPN
2. **UFW firewall** -- SSH + Tailscaleポートのみ
3. **Docker CE + Compose V2** -- デフォルトagent sandbox backend用
4. **Node.js 24 + pnpm** -- runtime dependencies（Node 22 LTS、現在は`22.14+`も引き続きサポート）
5. **OpenClaw** -- コンテナ化せずホスト上で実行
6. **Systemd service** -- セキュリティ強化付きで自動起動

<Note>
gatewayはDocker内ではなくホスト上で直接実行されます。agent sandboxingは
任意ですが、このplaybookはデフォルトのsandbox
backendであるDockerをインストールします。詳細と他のbackendについては[Sandboxing](/ja-JP/gateway/sandboxing)を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="openclawユーザーに切り替える">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="オンボーディングウィザードを実行する">
    インストール後スクリプトが、OpenClaw設定の構成を案内します。
  </Step>
  <Step title="メッセージングproviderを接続する">
    WhatsApp、Telegram、Discord、またはSignalにログインします:
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
  <Step title="Tailscaleに接続する">
    安全なリモートアクセスのためにVPN meshに参加します。
  </Step>
</Steps>

### クイックコマンド

```bash
# serviceの状態を確認
sudo systemctl status openclaw

# live logsを表示
sudo journalctl -u openclaw -f

# gatewayを再起動
sudo systemctl restart openclaw

# providerログイン（openclawユーザーとして実行）
sudo -i -u openclaw
openclaw channels login
```

## セキュリティアーキテクチャ

このデプロイでは4層の防御モデルを使用します。

1. **Firewall（UFW）** -- SSH（22）+ Tailscale（41641/udp）のみを公開
2. **VPN（Tailscale）** -- gatewayはVPN mesh経由でのみアクセス可能
3. **Docker分離** -- DOCKER-USER iptables chainが外部ポート公開を防止
4. **Systemd hardening** -- NoNewPrivileges、PrivateTmp、非特権ユーザー

外部からの攻撃面を確認するには:

```bash
nmap -p- YOUR_SERVER_IP
```

開いているべきなのはポート22（SSH）のみです。その他すべてのサービス（gateway、Docker）はロックダウンされます。

Dockerはgateway自体を動かすためではなく、agent sandboxes（分離されたtool実行）のためにインストールされます。sandbox設定については[Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

## 手動インストール

自動化ではなく手動で制御したい場合:

<Steps>
  <Step title="前提パッケージをインストールする">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="リポジトリをcloneする">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansible collectionsをインストールする">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="playbookを実行する">
    ```bash
    ./run-playbook.sh
    ```

    あるいは、直接実行してから、その後に手動でセットアップスクリプトを実行することもできます:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # その後に実行: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansibleインストーラーは、OpenClawを手動更新向けにセットアップします。標準の更新フローについては[Updating](/ja-JP/install/updating)を参照してください。

Ansible playbookを再実行するには（たとえば設定変更時）:

```bash
cd openclaw-ansible
./run-playbook.sh
```

これは冪等であり、複数回安全に実行できます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ファイアウォールが接続をブロックする">
    - まずTailscale VPN経由でアクセスできることを確認してください
    - SSHアクセス（ポート22）は常に許可されています
    - gatewayは設計上、Tailscale経由でのみアクセス可能です

  </Accordion>
  <Accordion title="serviceが起動しない">
    ```bash
    # logsを確認
    sudo journalctl -u openclaw -n 100

    # 権限を確認
    sudo ls -la /opt/openclaw

    # 手動起動をテスト
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandboxの問題">
    ```bash
    # Dockerが実行中か確認
    sudo systemctl status docker

    # sandbox imageを確認
    sudo docker images | grep openclaw-sandbox

    # sandbox imageがなければビルド
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="providerログインに失敗する">
    `openclaw`ユーザーとして実行していることを確認してください:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 高度な設定

詳細なセキュリティアーキテクチャとトラブルシューティングについては、openclaw-ansibleリポジトリを参照してください。

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 完全なデプロイガイド
- [Docker](/ja-JP/install/docker) -- コンテナ化されたgatewayセットアップ
- [Sandboxing](/ja-JP/gateway/sandboxing) -- agent sandbox設定
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agentごとの分離

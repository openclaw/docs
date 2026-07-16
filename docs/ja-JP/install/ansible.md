---
read_when:
    - セキュリティ強化を施したサーバーの自動デプロイが必要な場合
    - VPN アクセスを備えたファイアウォール分離環境が必要です
    - リモートの Debian/Ubuntu サーバーにデプロイする場合
summary: Ansible、Tailscale VPN、ファイアウォール分離による、自動化され堅牢化された OpenClaw のインストール
title: Ansible
x-i18n:
    generated_at: "2026-07-16T11:57:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

本番サーバーに OpenClaw をデプロイするには、セキュリティを最優先したアーキテクチャの自動インストーラー **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** を使用します。

<Info>
Ansible デプロイに関する信頼できる情報源は [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) リポジトリです。このページでは概要を簡潔に説明します。
</Info>

## 前提条件

| 要件        | 詳細                                                      |
| ----------- | --------------------------------------------------------- |
| OS          | Debian 11+ または Ubuntu 20.04+                           |
| アクセス権  | root または sudo 権限                                     |
| ネットワーク | パッケージのインストールに必要なインターネット接続        |
| Ansible     | 2.14+（クイックスタートスクリプトによって自動インストール） |

## 導入される機能

- ファイアウォール優先のセキュリティ：UFW + Docker 分離（SSH + Tailscale のみに到達可能）
- サービスを公開せずにリモートアクセスできる Tailscale VPN
- local loopback のみにバインドされた分離サンドボックスコンテナ用の Docker
- セキュリティ強化と起動時の自動開始を備えた systemd 連携
- 単一コマンドでのセットアップ

## クイックスタート

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされるもの

1. Tailscale（安全なリモートアクセス用のメッシュ VPN）
2. UFW ファイアウォール（SSH + Tailscale ポートのみ）
3. Docker CE + Compose V2（デフォルトのエージェントサンドボックスバックエンド）
4. Node.js と pnpm（OpenClaw には Node 22.22.3+、24.15+、または 25.9+ が必要です。Node 24 を推奨します）
5. コンテナ化せず、ホストベースでインストールされる OpenClaw
6. セキュリティ強化された systemd サービス

<Note>
Gateway は Docker 内ではなく、ホスト上で直接実行されます。エージェントのサンドボックス化は
任意です。このプレイブックでは、Docker がデフォルトのサンドボックス
バックエンドであるためインストールします。その他のバックエンドについては、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="openclaw ユーザーに切り替える">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="オンボーディングウィザードを実行する">
    インストール後スクリプトに従って OpenClaw を設定します。
  </Step>
  <Step title="メッセージングチャネルを接続する">
    WhatsApp、Telegram、Discord、または Signal にログインします。
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
    安全なリモートアクセスのために VPN メッシュへ参加します。
  </Step>
</Steps>

### クイックコマンド

```bash
# サービスの状態を確認
sudo systemctl status openclaw

# ライブログを表示
sudo journalctl -u openclaw -f

# Gateway を再起動
sudo systemctl restart openclaw

# チャネルにログイン（openclaw ユーザーとして実行）
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## セキュリティアーキテクチャ

4 層の防御モデル：

1. ファイアウォール（UFW）：SSH（22）と Tailscale（41641/udp）のみを公開
2. VPN（Tailscale）：Gateway には VPN メッシュ経由でのみ到達可能
3. Docker 分離：`DOCKER-USER` iptables チェーンによって外部へのポート公開を防止
4. systemd のセキュリティ強化：`NoNewPrivileges`、`PrivateTmp`、非特権ユーザー

外部からの攻撃対象領域を確認します。

```bash
nmap -p- YOUR_SERVER_IP
```

開いているのはポート 22（SSH）のみである必要があります。Gateway と Docker は引き続きアクセスが制限されます。

Docker は Gateway の実行用ではなく、エージェントサンドボックス（分離されたツール実行）用にインストールされます。サンドボックスの設定については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

## 手動インストール

<Steps>
  <Step title="前提パッケージをインストールする">
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

    または、プレイブックを直接実行した後、セットアップスクリプトを手動で実行します。
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # 次に実行：/tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible インストーラーは、OpenClaw を手動で更新するようにセットアップします。標準的な手順については、[更新](/ja-JP/install/updating)を参照してください。

プレイブックを再実行するには（設定変更後など）、次のコマンドを実行します。

```bash
cd openclaw-ansible
./run-playbook.sh
```

これは冪等であり、複数回実行しても安全です。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ファイアウォールによって接続がブロックされる">
    - まず Tailscale VPN 経由で接続してください。Gateway は設計上、その方法でのみ到達できます。
    - SSH（ポート 22）は常に許可されます。

  </Accordion>
  <Accordion title="サービスが起動しない">
    ```bash
    # ログを確認
    sudo journalctl -u openclaw -n 100

    # 権限を確認
    sudo ls -la /opt/openclaw

    # 手動起動をテスト
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker サンドボックスの問題">
    ```bash
    # Docker が実行中であることを確認
    sudo systemctl status docker

    # サンドボックスイメージを確認
    sudo docker images | grep openclaw-sandbox

    # イメージがない場合はサンドボックスイメージをビルド（ソースチェックアウトが必要）
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # ソースチェックアウトなしで npm インストールを使用する場合は、次を参照
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="チャネルへのログインに失敗する">
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
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)：エージェント単位の分離

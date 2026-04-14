---
read_when:
    - LinuxサーバーまたはクラウドVPSでGatewayを実行したい場合
    - ホスティングガイドの概要をすばやく確認する必要があります
    - OpenClaw向けの一般的なLinuxサーバーチューニングを知りたい場合
sidebarTitle: Linux Server
summary: LinuxサーバーまたはクラウドVPSでOpenClawを実行 — プロバイダー選択、アーキテクチャ、チューニング
title: Linuxサーバー
x-i18n:
    generated_at: "2026-04-14T02:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e623f4c770132e01628d66bfb8cd273bbef6dad633b812496c90da5e3e0f1383
    source_path: vps.md
    workflow: 15
---

# Linuxサーバー

任意のLinuxサーバーまたはクラウドVPSでOpenClaw Gatewayを実行できます。このページでは、
プロバイダーの選び方、クラウドデプロイの仕組み、そしてどこでも共通して適用できる一般的なLinuxの
チューニングについて説明します。

## プロバイダーを選ぶ

<CardGroup cols={2}>
  <Card title="Railway" href="/ja-JP/install/railway">ワンクリック、ブラウザー設定</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">ワンクリック、ブラウザー設定</Card>
  <Card title="DigitalOcean" href="/ja-JP/install/digitalocean">シンプルな有料VPS</Card>
  <Card title="Oracle Cloud" href="/ja-JP/install/oracle">Always FreeのARMティア</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner VPS上のDocker</Card>
  <Card title="Hostinger" href="/ja-JP/install/hostinger">ワンクリック設定付きVPS</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ja-JP/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ja-JP/install/exe-dev">HTTPSプロキシ付きVM</Card>
  <Card title="Raspberry Pi" href="/ja-JP/install/raspberry-pi">ARMセルフホスト</Card>
</CardGroup>

**AWS (EC2 / Lightsail / 無料ティア)** も十分に使えます。
コミュニティによる動画ウォークスルーは
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
で公開されています
（コミュニティリソースのため、利用できなくなる可能性があります）。

## クラウド構成の仕組み

- **GatewayはVPS上で実行され**、状態とワークスペースを管理します。
- **Control UI** または **Tailscale/SSH** を通じて、ラップトップやスマートフォンから接続します。
- VPSを信頼できる唯一の情報源として扱い、状態とワークスペースを定期的に**バックアップ**してください。
- 安全なデフォルトとして、Gatewayはloopbackに保持し、SSHトンネルまたはTailscale Serve経由でアクセスしてください。
  `lan` または `tailnet` にバインドする場合は、`gateway.auth.token` または `gateway.auth.password` を必須にしてください。

関連ページ: [Gatewayリモートアクセス](/ja-JP/gateway/remote)、[プラットフォームハブ](/ja-JP/platforms)。

## VPS上の共有企業エージェント

チーム向けに単一のエージェントを実行する構成は、すべてのユーザーが同じ信頼境界内にあり、そのエージェントが業務専用である場合に有効です。

- 専用ランタイム（VPS/VM/コンテナー + 専用OSユーザー/アカウント）で運用してください。
- そのランタイムでは、個人用のApple/Googleアカウントや個人用のブラウザー/パスワードマネージャープロファイルにサインインしないでください。
- ユーザー同士が敵対的な関係にある場合は、gateway/host/OSユーザーごとに分離してください。

セキュリティモデルの詳細: [Security](/ja-JP/gateway/security)。

## VPSでNodeを使う

Gatewayはクラウドに置いたまま、ローカルデバイス
（Mac/iOS/Android/headless）上で**Node** をペアリングできます。
Nodeはローカルの画面/カメラ/canvasおよび `system.run`
機能を提供し、Gatewayはクラウドに置いたままにできます。

ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/cli/nodes)。

## 小型VMおよびARMホスト向けの起動チューニング

低性能VM（またはARMホスト）でCLIコマンドが遅く感じる場合は、Nodeのモジュールコンパイルキャッシュを有効にしてください。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` は、繰り返し実行するコマンドの起動時間を改善します。
- `OPENCLAW_NO_RESPAWN=1` は、自己再起動パスによる追加の起動オーバーヘッドを回避します。
- 最初のコマンド実行でキャッシュが温まり、その後の実行は高速になります。
- Raspberry Pi固有の内容については、[Raspberry Pi](/ja-JP/install/raspberry-pi) を参照してください。

### systemdチューニングチェックリスト（任意）

`systemd` を使用するVMホストでは、次を検討してください。

- 安定した起動パスのためにサービス環境変数を追加する:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 再起動動作を明示的に保つ:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- ランダムI/Oによるコールドスタートのペナルティを減らすため、状態/キャッシュパスにはSSDベースのディスクを推奨します。

標準の `openclaw onboard --install-daemon` パスでは、ユーザーユニットを編集します。

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

意図的にシステムユニットとしてインストールした場合は、
代わりに `sudo systemctl edit openclaw-gateway.service` で
`openclaw-gateway.service` を編集してください。

`Restart=` ポリシーが自動復旧にどう役立つか:
[systemdはサービス復旧を自動化できます](https://www.redhat.com/en/blog/systemd-automate-recovery)。

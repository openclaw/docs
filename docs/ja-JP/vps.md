---
read_when:
    - Linux サーバーまたはクラウド VPS で Gateway を実行したい
    - ホスティングガイドの簡単な全体像が必要です
    - OpenClaw 向けの汎用的な Linux サーバーチューニングを行いたい場合
sidebarTitle: Linux Server
summary: Linux サーバーまたはクラウド VPS で OpenClaw を実行する — プロバイダー選択、アーキテクチャ、チューニング
title: Linux サーバー
x-i18n:
    generated_at: "2026-04-30T05:41:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

任意の Linux サーバーまたはクラウド VPS で OpenClaw Gateway を実行します。このページでは、
プロバイダーの選び方、クラウドデプロイの仕組み、どこでも適用できる汎用的な Linux
チューニングについて説明します。

## プロバイダーを選ぶ

<CardGroup cols={2}>
  <Card title="Railway" href="/ja-JP/install/railway">ワンクリックのブラウザー設定</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">ワンクリックのブラウザー設定</Card>
  <Card title="DigitalOcean" href="/ja-JP/install/digitalocean">シンプルな有料 VPS</Card>
  <Card title="Oracle Cloud" href="/ja-JP/install/oracle">Always Free ARM ティア</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner VPS 上の Docker</Card>
  <Card title="Hostinger" href="/ja-JP/install/hostinger">ワンクリック設定付き VPS</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ja-JP/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ja-JP/install/exe-dev">HTTPS プロキシ付き VM</Card>
  <Card title="Raspberry Pi" href="/ja-JP/install/raspberry-pi">ARM セルフホスト</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** でも問題なく動作します。
コミュニティによる動画ウォークスルーは
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
で利用できます
（コミュニティリソース -- 利用できなくなる場合があります）。

## クラウド設定の仕組み

- **Gateway は VPS 上で実行**され、状態とワークスペースを所有します。
- ノートパソコンまたはスマートフォンから **コントロール UI** または **Tailscale/SSH** 経由で接続します。
- VPS を信頼できる唯一の情報源として扱い、状態とワークスペースを定期的に**バックアップ**します。
- 安全なデフォルト: Gateway を loopback に保持し、SSH トンネルまたは Tailscale Serve 経由でアクセスします。
  `lan` または `tailnet` にバインドする場合は、`gateway.auth.token` または `gateway.auth.password` を必須にしてください。

関連ページ: [Gateway リモートアクセス](/ja-JP/gateway/remote)、[プラットフォームハブ](/ja-JP/platforms)。

## まず管理アクセスを強化する

公開 VPS に OpenClaw をインストールする前に、そのマシン自体をどのように管理するかを決めます。

- Tailnet のみの管理アクセスにしたい場合は、まず Tailscale をインストールし、VPS を
  tailnet に参加させ、Tailscale IP または MagicDNS 名経由で 2 つ目の SSH セッションを確認してから、
  公開 SSH を制限します。
- Tailscale を使用しない場合は、追加のサービスを公開する前に、SSH
  経路に対して同等の強化を適用します。
- これは Gateway アクセスとは別です。OpenClaw を loopback にバインドしたまま、
  ダッシュボードには SSH トンネルまたは Tailscale Serve を使うこともできます。

Tailscale 固有の Gateway オプションは [Tailscale](/ja-JP/gateway/tailscale) にあります。

## VPS 上の共有会社エージェント

すべてのユーザーが同じ信頼境界内にいて、エージェントが業務専用である場合、チーム用に単一のエージェントを実行する構成は有効です。

- 専用ランタイム（VPS/VM/コンテナ + 専用 OS ユーザー/アカウント）上に保持します。
- そのランタイムで個人用の Apple/Google アカウントや、個人用ブラウザー/パスワードマネージャープロファイルにサインインしないでください。
- ユーザー同士が敵対的である場合は、gateway/ホスト/OS ユーザーごとに分離します。

セキュリティモデルの詳細: [セキュリティ](/ja-JP/gateway/security)。

## VPS でノードを使う

Gateway をクラウドに保持し、ローカルデバイス
（Mac/iOS/Android/headless）上の**ノード**をペアリングできます。ノードは、Gateway がクラウドに留まったまま、
ローカルの画面/カメラ/canvas と `system.run`
機能を提供します。

ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

## 小規模 VM と ARM ホスト向けの起動チューニング

低電力 VM（または ARM ホスト）で CLI コマンドが遅く感じる場合は、Node のモジュールコンパイルキャッシュを有効にします。

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
- 最初のコマンド実行でキャッシュがウォームアップされ、その後の実行は高速になります。
- Raspberry Pi 固有の内容は、[Raspberry Pi](/ja-JP/install/raspberry-pi) を参照してください。

### systemd チューニングチェックリスト（任意）

`systemd` を使用する VM ホストでは、次を検討してください。

- 安定した起動パスのためにサービス環境変数を追加します。
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 再起動動作を明示的に保ちます。
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- ランダム I/O によるコールドスタートのペナルティを減らすため、状態/キャッシュパスには SSD バックのディスクを推奨します。

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

意図的にシステムユニットをインストールした場合は、
`sudo systemctl edit openclaw-gateway.service` 経由で
`openclaw-gateway.service` を編集します。

`Restart=` ポリシーが自動復旧にどのように役立つか:
[systemd はサービス復旧を自動化できます](https://www.redhat.com/en/blog/systemd-automate-recovery)。

Linux の OOM 動作、子プロセスの犠牲プロセス選択、`exit 137`
診断については、[Linux のメモリ圧迫と OOM kill](/ja-JP/platforms/linux#memory-pressure-and-oom-kills) を参照してください。

## 関連

- [インストール概要](/ja-JP/install)
- [DigitalOcean](/ja-JP/install/digitalocean)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)

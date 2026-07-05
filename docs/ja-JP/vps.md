---
read_when:
    - Linux サーバーまたはクラウド VPS で Gateway を実行したい場合
    - ホスティングガイドの簡単なマップが必要
    - OpenClaw向けの汎用Linuxサーバーチューニングを行いたい
sidebarTitle: Linux Server
summary: Linux サーバーまたはクラウド VPS で OpenClaw を実行する — プロバイダー選択、アーキテクチャ、チューニング
title: Linux サーバー
x-i18n:
    generated_at: "2026-07-05T11:56:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

任意の Linux サーバーまたはクラウド VPS で OpenClaw Gateway を実行します。このページでは、
プロバイダーの選び方、クラウドデプロイの仕組み、どこでも適用できる汎用的な Linux
チューニングについて説明します。

## プロバイダーを選ぶ

<CardGroup cols={2}>
  <Card title="Azure" href="/ja-JP/install/azure">Linux VM</Card>
  <Card title="DigitalOcean" href="/ja-JP/install/digitalocean">シンプルな有料 VPS</Card>
  <Card title="exe.dev" href="/ja-JP/install/exe-dev">HTTPS プロキシ付き VM</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner VPS 上の Docker</Card>
  <Card title="Hostinger" href="/ja-JP/install/hostinger">ワンクリックセットアップ付き VPS</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">ワンクリックのブラウザーセットアップ</Card>
  <Card title="Oracle Cloud" href="/ja-JP/install/oracle">Always Free ARM tier</Card>
  <Card title="Railway" href="/ja-JP/install/railway">ワンクリックのブラウザーセットアップ</Card>
  <Card title="Raspberry Pi" href="/ja-JP/install/raspberry-pi">ARM セルフホスト</Card>
</CardGroup>

**AWS (EC2 / Lightsail / 無料枠)** も問題なく動作します。
コミュニティによる動画ウォークスルーは
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
で利用できます（コミュニティリソース -- 利用できなくなる可能性があります）。

## クラウドセットアップの仕組み

- **Gateway は VPS 上で実行され**、状態とワークスペースを所有します。
- ラップトップまたはスマートフォンから **Control UI** または **Tailscale/SSH** 経由で接続します。
- VPS を信頼できる唯一の情報源として扱い、状態とワークスペースを定期的に**バックアップ**します。
- セキュアなデフォルト: Gateway を loopback に保ち、SSH トンネルまたは Tailscale Serve 経由でアクセスします。
  `lan` または `tailnet` にバインドする場合、認証が信頼済みプロキシに委任されていない限り、
  Gateway には共有シークレット
  （`gateway.auth.token` または `gateway.auth.password`）が必要です。

関連ページ: [Gateway リモートアクセス](/ja-JP/gateway/remote)、[プラットフォームハブ](/ja-JP/platforms)。

## まず管理者アクセスを強化する

公開 VPS に OpenClaw をインストールする前に、そのマシン自体をどのように管理するかを決めます。

- Tailnet 専用の管理者アクセスの場合: まず Tailscale をインストールし、VPS を自分の
  tailnet に参加させ、Tailscale IP または MagicDNS 名を使った 2 つ目の SSH セッションを確認してから、
  公開 SSH を制限します。
- Tailscale を使わない場合: 追加のサービスを公開する前に、
  SSH 経路に対して同等の強化を適用します。
- これは Gateway アクセスとは別です。OpenClaw を引き続き
  loopback にバインドしたままにし、SSH トンネルまたは Tailscale Serve をダッシュボードに使えます。

Tailscale 固有の Gateway オプションは [Tailscale](/ja-JP/gateway/tailscale) にあります。

## VPS 上の共有会社エージェント

すべてのユーザーが同じ信頼境界内にあり、エージェントが業務専用である場合、
チーム用に単一のエージェントを実行する構成は有効です。

- 専用ランタイム（VPS/VM/コンテナー + 専用 OS ユーザー/アカウント）に配置します。
- そのランタイムを個人の Apple/Google アカウントや個人用ブラウザー/パスワードマネージャープロファイルにサインインさせないでください。
- ユーザー同士が敵対的である場合は、gateway/ホスト/OS ユーザーごとに分離します。

セキュリティモデルの詳細: [セキュリティ](/ja-JP/gateway/security)。

## VPS でノードを使う

Gateway をクラウドに置いたまま、ローカルデバイス
（Mac/iOS/Android/headless）上の**ノード**とペアリングできます。ノードは、Gateway をクラウドに置いたまま、
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

- `NODE_COMPILE_CACHE` は繰り返し実行するコマンドの起動時間を改善します。初回実行でキャッシュがウォームアップされます。
- `OPENCLAW_NO_RESPAWN=1` は通常の Gateway 再起動をプロセス内に保ち、追加のプロセス引き渡しを避け、小規模ホストでの PID 追跡をシンプルに保ちます。
- Raspberry Pi 固有の詳細については、[Raspberry Pi](/ja-JP/install/raspberry-pi) を参照してください。

### systemd チューニングチェックリスト（任意）

`systemd` を使用する VM ホストでは、次を検討してください。

- 安定した起動経路のためのサービス環境変数: `OPENCLAW_NO_RESPAWN=1` と
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 明示的な再起動動作: `Restart=always`、`RestartSec=2`、`TimeoutStartSec=90`
- 状態/キャッシュパスには SSD バックのディスクを使い、ランダム I/O によるコールドスタートのペナルティを減らします。

標準の `openclaw onboard --install-daemon` 経路では、systemd ユーザー
unit がインストールされます。次で編集します。

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

意図的に system unit をインストールした場合は、代わりに
`sudo systemctl edit openclaw-gateway.service` で編集します。

`Restart=` ポリシーが自動復旧に役立つ仕組み:
[systemd はサービス復旧を自動化できる](https://www.redhat.com/en/blog/systemd-automate-recovery)。

Linux の OOM 動作、子プロセスの犠牲プロセス選択、`exit 137`
診断については、[Linux のメモリ圧迫と OOM kill](/ja-JP/platforms/linux#memory-pressure-and-oom-kills) を参照してください。

## 関連

- [インストール概要](/ja-JP/install)
- [DigitalOcean](/ja-JP/install/digitalocean)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)

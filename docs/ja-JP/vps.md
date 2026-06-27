---
read_when:
    - Linux サーバーまたはクラウド VPS で Gateway を実行したい
    - ホスティングガイドの簡単な一覧が必要です
    - OpenClaw 向けの汎用 Linux サーバーチューニングが必要な場合
sidebarTitle: Linux Server
summary: Linux サーバーまたはクラウド VPS で OpenClaw を実行する — プロバイダー選択、アーキテクチャ、チューニング
title: Linux サーバー
x-i18n:
    generated_at: "2026-06-27T13:23:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

OpenClaw Gateway を任意の Linux サーバーまたはクラウド VPS で実行します。このページでは、
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

**AWS (EC2 / Lightsail / 無料利用枠)** も問題なく動作します。
コミュニティによる動画ウォークスルーは
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
で公開されています
（コミュニティリソース -- 利用できなくなる可能性があります）。

## クラウド設定の仕組み

- **Gateway は VPS 上で実行**され、状態とワークスペースを所有します。
- ノート PC やスマートフォンから **Control UI** または **Tailscale/SSH** 経由で接続します。
- VPS を信頼できる唯一の情報源として扱い、状態とワークスペースを定期的に**バックアップ**します。
- セキュアなデフォルト: Gateway は loopback に保持し、SSH トンネルまたは Tailscale Serve 経由でアクセスします。
  `lan` または `tailnet` にバインドする場合は、`gateway.auth.token` または `gateway.auth.password` を必須にします。

関連ページ: [Gateway リモートアクセス](/ja-JP/gateway/remote)、[プラットフォームハブ](/ja-JP/platforms)。

## まず管理アクセスを堅牢化する

公開 VPS に OpenClaw をインストールする前に、そのマシン自体をどのように管理するかを決めてください。

- Tailnet のみの管理アクセスにしたい場合は、まず Tailscale をインストールし、VPS を tailnet に参加させ、
  Tailscale IP または MagicDNS 名経由で 2 つ目の SSH セッションを確認してから、
  公開 SSH を制限します。
- Tailscale を使わない場合は、さらに多くのサービスを公開する前に、SSH
  経路に相当する堅牢化を適用します。
- これは Gateway アクセスとは別です。OpenClaw を loopback にバインドしたままにし、
  ダッシュボードには SSH トンネルまたは Tailscale Serve を使うこともできます。

Tailscale 固有の Gateway オプションは [Tailscale](/ja-JP/gateway/tailscale) にあります。

## VPS 上の共有会社エージェント

すべてのユーザーが同じ信頼境界内にいて、エージェントが業務専用である場合、チーム用に単一のエージェントを実行する構成は有効です。

- 専用ランタイム（VPS/VM/container + 専用 OS ユーザー/アカウント）で維持します。
- そのランタイムを個人の Apple/Google アカウントや個人のブラウザー/パスワードマネージャープロファイルにサインインさせないでください。
- ユーザー同士が敵対的である場合は、gateway/host/OS ユーザー単位で分離します。

セキュリティモデルの詳細: [セキュリティ](/ja-JP/gateway/security)。

## VPS でノードを使う

Gateway をクラウドに置いたまま、ローカルデバイス
（Mac/iOS/Android/headless）上の**ノード**とペアリングできます。ノードは、Gateway がクラウドに残ったまま、
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

- `NODE_COMPILE_CACHE` は、繰り返し実行するコマンドの起動時間を短縮します。
- `OPENCLAW_NO_RESPAWN=1` は、通常の Gateway 再起動をプロセス内に保ち、余分なプロセスの引き渡しを避け、小規模ホストでの PID 追跡をシンプルにします。
- 最初のコマンド実行でキャッシュがウォームアップされ、その後の実行は速くなります。
- Raspberry Pi 固有の情報は、[Raspberry Pi](/ja-JP/install/raspberry-pi) を参照してください。

### systemd チューニングチェックリスト（任意）

`systemd` を使う VM ホストでは、次を検討してください。

- 安定した起動パスのためにサービス環境変数を追加します:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 再起動動作を明示的にします:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 状態/キャッシュパスには SSD バックのディスクを優先し、ランダム I/O によるコールドスタートのペナルティを減らします。

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
`sudo systemctl edit openclaw-gateway.service` で
`openclaw-gateway.service` を編集します。

`Restart=` ポリシーが自動復旧にどう役立つか:
[systemd はサービス復旧を自動化できます](https://www.redhat.com/en/blog/systemd-automate-recovery)。

Linux の OOM 動作、子プロセスの victim 選択、`exit 137`
診断については、[Linux のメモリプレッシャーと OOM kill](/ja-JP/platforms/linux#memory-pressure-and-oom-kills) を参照してください。

## 関連

- [インストール概要](/ja-JP/install)
- [DigitalOcean](/ja-JP/install/digitalocean)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)

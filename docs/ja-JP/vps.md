---
read_when:
    - Linux サーバーまたはクラウド VPS で Gateway を実行する場合
    - ホスティングガイドの概要をすばやく把握したい場合
    - OpenClaw向けの汎用的なLinuxサーバーチューニングを行いたい場合
sidebarTitle: Linux Server
summary: Linux サーバーまたはクラウド VPS で OpenClaw を実行する — プロバイダーの選択、アーキテクチャ、チューニング
title: Linux サーバー
x-i18n:
    generated_at: "2026-07-11T22:49:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

任意の Linux サーバーまたはクラウド VPS で OpenClaw Gateway を実行します。このページでは、
プロバイダーの選択方法、クラウドデプロイの仕組み、あらゆる環境に適用できる一般的な Linux
チューニングについて説明します。

## プロバイダーを選ぶ

<CardGroup cols={2}>
  <Card title="Azure" href="/ja-JP/install/azure">Linux VM</Card>
  <Card title="DigitalOcean" href="/ja-JP/install/digitalocean">シンプルな有料 VPS</Card>
  <Card title="exe.dev" href="/ja-JP/install/exe-dev">HTTPS プロキシ付き VM</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner VPS 上の Docker</Card>
  <Card title="Hostinger" href="/ja-JP/install/hostinger">ワンクリックセットアップ対応 VPS</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">ワンクリックのブラウザーセットアップ</Card>
  <Card title="Oracle Cloud" href="/ja-JP/install/oracle">Always Free ARM ティア</Card>
  <Card title="Railway" href="/ja-JP/install/railway">ワンクリックのブラウザーセットアップ</Card>
  <Card title="Raspberry Pi" href="/ja-JP/install/raspberry-pi">ARM セルフホスト</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 無料利用枠）**も適しています。
コミュニティによる動画チュートリアルを
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
で視聴できます（コミュニティリソースのため、利用できなくなる可能性があります）。

## クラウドセットアップの仕組み

- **Gateway は VPS 上で実行され**、状態とワークスペースを管理します。
- ノートパソコンやスマートフォンから **Control UI** または **Tailscale/SSH** 経由で接続します。
- VPS を信頼できる唯一の情報源として扱い、状態とワークスペースを定期的に**バックアップ**してください。
- 安全なデフォルト設定では、Gateway をループバックに保持し、SSH トンネルまたは Tailscale Serve 経由でアクセスします。
  `lan` または `tailnet` にバインドする場合、認証を信頼済みプロキシに委任しない限り、
  Gateway には共有シークレット（`gateway.auth.token` または `gateway.auth.password`）が必要です。

関連ページ：[Gateway のリモートアクセス](/ja-JP/gateway/remote)、[プラットフォームハブ](/ja-JP/platforms)。

## 最初に管理者アクセスを強化する

公開 VPS に OpenClaw をインストールする前に、そのマシン自体をどのように管理するか
決めてください。

- tailnet のみによる管理者アクセスを使用する場合：最初に Tailscale をインストールし、VPS を
  tailnet に参加させ、Tailscale IP または MagicDNS 名を使用して別の SSH セッションで接続できることを確認してから、
  公開 SSH を制限します。
- Tailscale を使用しない場合：ほかのサービスを公開する前に、
  SSH 接続経路に同等の強化を施します。
- これは Gateway へのアクセスとは別です。OpenClaw を引き続き
  ループバックにバインドし、ダッシュボードへのアクセスに SSH トンネルまたは Tailscale Serve を使用できます。

Tailscale 固有の Gateway オプションについては、[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

## VPS 上の社内共有エージェント

すべてのユーザーが同じ信頼境界内にいて、エージェントを業務専用にする場合、
チームで単一のエージェントを実行する構成は有効です。

- 専用ランタイム（VPS/VM/コンテナと専用の OS ユーザー/アカウント）で実行してください。
- そのランタイムでは、個人の Apple/Google アカウントや個人用ブラウザー/パスワードマネージャーのプロファイルにサインインしないでください。
- ユーザー同士が敵対的である場合は、Gateway、ホスト、または OS ユーザーごとに分離してください。

セキュリティモデルの詳細：[セキュリティ](/ja-JP/gateway/security)。

## VPS で Node を使用する

Gateway をクラウドに維持したまま、ローカルデバイス
（Mac/iOS/Android/ヘッドレス）の **Node** をペアリングできます。Gateway をクラウドに維持しながら、
Node によってローカルの画面、カメラ、キャンバス、および `system.run` 機能を利用できます。

ドキュメント：[Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)。

## 小規模 VM と ARM ホスト向けの起動チューニング

低性能の VM（または ARM ホスト）で CLI コマンドが遅く感じる場合は、Node のモジュールコンパイルキャッシュを有効にします。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` はコマンドを繰り返し起動する際の時間を短縮します。初回実行時にキャッシュが準備されます。
- `OPENCLAW_NO_RESPAWN=1` は通常の Gateway 再起動を同一プロセス内で維持し、余分なプロセスの引き継ぎを避け、小規模ホストでの PID 追跡を簡素化します。
- Raspberry Pi 固有の情報については、[Raspberry Pi](/ja-JP/install/raspberry-pi)を参照してください。

### systemd チューニングチェックリスト（任意）

`systemd` を使用する VM ホストでは、以下を検討してください。

- 安定した起動経路のためのサービス環境変数：`OPENCLAW_NO_RESPAWN=1` および
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 明示的な再起動動作：`Restart=always`、`RestartSec=2`、`TimeoutStartSec=90`
- 状態/キャッシュパスには SSD ベースのディスクを使用し、ランダム I/O によるコールドスタートの遅延を軽減する。

標準の `openclaw onboard --install-daemon` 手順では systemd ユーザー
ユニットがインストールされます。次のコマンドで編集します。

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
`sudo systemctl edit openclaw-gateway.service` で編集してください。

`Restart=` ポリシーが自動復旧に役立つ仕組み：
[systemd でサービス復旧を自動化できます](https://www.redhat.com/en/blog/systemd-automate-recovery)。

Linux の OOM 動作、子プロセスの強制終了対象の選択、および `exit 137`
の診断については、[Linux のメモリ負荷と OOM による強制終了](/ja-JP/platforms/linux#memory-pressure-and-oom-kills)を参照してください。

## 関連情報

- [インストール概要](/ja-JP/install)
- [DigitalOcean](/ja-JP/install/digitalocean)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)

---
read_when:
    - Linuxサーバーまたはcloud VPSでGatewayを実行したい場合
    - ホスティングガイドの簡単な一覧が必要な場合
    - OpenClaw向けの汎用Linuxサーバーチューニングが必要な場合
sidebarTitle: Linux Server
summary: Linuxサーバーまたはcloud VPSでOpenClawを実行する — provider picker、アーキテクチャ、チューニング
title: Linuxサーバー
x-i18n:
    generated_at: "2026-04-24T05:27:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

どのLinuxサーバーやcloud VPSでもOpenClaw Gatewayを実行できます。このページでは、
provider選び、cloud deploymentの仕組み、そしてどこでも適用できる汎用的なLinux
tuningを説明します。

## providerを選ぶ

<CardGroup cols={2}>
  <Card title="Railway" href="/ja-JP/install/railway">ワンクリック、browserセットアップ</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">ワンクリック、browserセットアップ</Card>
  <Card title="DigitalOcean" href="/ja-JP/install/digitalocean">シンプルな有料VPS</Card>
  <Card title="Oracle Cloud" href="/ja-JP/install/oracle">Always Free ARM tier</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner VPS上のDocker</Card>
  <Card title="Hostinger" href="/ja-JP/install/hostinger">ワンクリックセットアップ付きVPS</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ja-JP/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ja-JP/install/exe-dev">HTTPS proxy付きVM</Card>
  <Card title="Raspberry Pi" href="/ja-JP/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS（EC2 / Lightsail / free tier）** でも問題なく動作します。
コミュニティによる動画ウォークスルーは
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
で利用できます
（コミュニティリソースのため、利用できなくなる場合があります）。

## cloudセットアップの仕組み

- **GatewayはVPS上で動作し**、state + workspaceを所有します。
- laptopやphoneから **Control UI** または **Tailscale/SSH** 経由で接続します。
- VPSをsource of truthとして扱い、state + workspaceを定期的に**バックアップ**してください。
- 安全なデフォルトとして、Gatewayはloopback上に置き、SSH tunnelまたはTailscale Serve経由でアクセスしてください。
  `lan` または `tailnet` にbindする場合は、`gateway.auth.token` または `gateway.auth.password` を必須にしてください。

関連ページ: [Gateway remote access](/ja-JP/gateway/remote), [Platforms hub](/ja-JP/platforms)。

## VPS上の共有company agent

同じtrust boundary内にいる全員が使い、agentがbusiness専用である場合、チーム向けに単一agentを実行する構成は妥当です。

- 専用runtime（VPS/VM/container + 専用OS user/account）上に置いてください。
- そのruntimeを個人用のApple/Google accountや個人用browser/password-manager profileにサインインさせないでください。
- ユーザー同士が敵対的である場合は、gateway/host/OS user単位で分割してください。

security modelの詳細: [Security](/ja-JP/gateway/security)。

## VPSでNodeを使う

Gatewayはcloudに置いたまま、ローカルdevice
（Mac/iOS/Android/headless）上に **Node** をpairすることができます。Nodeは、Gatewayをcloudに置いたまま、
ローカルscreen/camera/canvasと `system.run`
capabilityを提供します。

ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/ja-JP/cli/nodes)。

## 小さなVMとARM host向けのstartup tuning

低性能VM（またはARM host）でCLI commandが遅く感じる場合は、Nodeのmodule compile cacheを有効にしてください:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` は、繰り返し実行されるcommandのstartup timeを改善します。
- `OPENCLAW_NO_RESPAWN=1` は、self-respawn pathによる追加startup overheadを避けます。
- 最初のcommand実行でcacheがwarmされ、その後の実行が速くなります。
- Raspberry Pi固有の内容については [Raspberry Pi](/ja-JP/install/raspberry-pi) を参照してください。

### systemd tuning checklist（任意）

`systemd` を使うVM hostでは、次を検討してください:

- 安定したstartup pathのためにservice envを追加する:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- restart動作を明示的に保つ:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- state/cache pathのrandom-I/O cold-start penaltyを減らすため、SSD-backed diskを優先する。

標準の `openclaw onboard --install-daemon` pathでは、user unitを編集してください:

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

意図的にsystem unitをインストールした場合は、代わりに
`sudo systemctl edit openclaw-gateway.service` で
`openclaw-gateway.service` を編集してください。

`Restart=` policyが自動復旧にどう役立つか:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

LinuxのOOM動作、child processのvictim選択、`exit 137`
diagnosticsについては、[Linux memory pressure and OOM kills](/ja-JP/platforms/linux#memory-pressure-and-oom-kills) を参照してください。

## 関連

- [Install overview](/ja-JP/install)
- [DigitalOcean](/ja-JP/install/digitalocean)
- [Fly.io](/ja-JP/install/fly)
- [Hetzner](/ja-JP/install/hetzner)

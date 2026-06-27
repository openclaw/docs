---
read_when:
    - EasyRunner への OpenClaw のデプロイ
    - EasyRunner の Caddy プロキシの背後で Gateway を実行する
    - ホスト型 Gateway の永続ボリュームと認証の選択
summary: Podman と Caddy を使用して EasyRunner 上で OpenClaw Gateway を実行する
title: イージーランナー
x-i18n:
    generated_at: "2026-06-27T12:01:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner は、Caddy プロキシの背後にある小さなコンテナ化アプリとして OpenClaw Gateway をホストできます。このガイドでは、Podman 互換の Compose アプリを実行し、Caddy 経由で HTTPS を公開する EasyRunner ホストを前提とします。

## 始める前に

- ドメインがルーティングされた EasyRunner サーバー。
- ビルド済みまたは公開済みの OpenClaw コンテナイメージ。
- `/home/node/.openclaw` 用の永続 config ボリューム。
- `/workspace` 用の永続ワークスペースボリューム。
- 強力な Gateway トークンまたはパスワード。

可能な場合はデバイス認証を有効のままにしてください。リバースプロキシのデプロイでデバイス ID を正しく伝達できない場合は、まず trusted-proxy 設定を修正してください。危険な認証バイパスは、完全にプライベートでオペレーターが管理するネットワークでのみ使用してください。

## Compose アプリ

次のような形の Compose ファイルで EasyRunner アプリを作成します。

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com` を Gateway ホスト名に置き換えます。`OPENCLAW_GATEWAY_TOKEN` はアプリ定義にコミットせず、EasyRunner のシークレット/環境マネージャーに保存してください。

## OpenClaw を設定する

永続 config ボリューム内では、Gateway がプロキシ経由でのみ到達可能になるようにし、認証を必須にします。

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Caddy が Gateway の TLS を終端する場合は、認証チェックをグローバルに無効化するのではなく、正確なプロキシパスに対して trusted proxy 設定を構成してください。[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

## 検証

ワークステーションから:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner ホストから、アプリログを確認し、Gateway が待ち受けていて、起動時の SecretRef、プラグイン、またはチャネル認証の失敗がないことを確認します。

## 更新とバックアップ

- 新しい OpenClaw イメージを pull またはビルドし、EasyRunner アプリを再デプロイします。
- 更新前に `openclaw-config` ボリュームをバックアップします。
- エージェントが永続的なプロジェクトデータをそこに書き込む場合は、`openclaw-workspace` をバックアップします。
- メジャー更新後は `openclaw doctor` を実行し、config 移行とサービス警告を検出します。

## トラブルシューティング

- `gateway probe` が接続できない: Caddy ホスト名がアプリを指していること、およびコンテナが `0.0.0.0:1455` で待ち受けていることを確認します。
- 認証が失敗する: EasyRunner シークレット内のトークンとローカルクライアントコマンドを同時にローテーションします。
- 復元後にファイルが root 所有になる: マウントされたボリュームを修復し、コンテナユーザーが `/home/node/.openclaw` と `/workspace` に書き込めるようにします。
- ブラウザーまたはチャネルプラグインが失敗する: 必要な外部バイナリ、ネットワーク送信、マウント済み認証情報がコンテナ内で利用可能か確認します。

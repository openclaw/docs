---
read_when:
    - EasyRunner への OpenClaw のデプロイ
    - EasyRunner の Caddy プロキシの背後で Gateway を実行する
    - ホストされた Gateway の永続ボリュームと認証の選択
summary: EasyRunner で Podman と Caddy を使用して OpenClaw Gateway を実行する
title: EasyRunner
x-i18n:
    generated_at: "2026-07-05T11:34:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner は、その Caddy プロキシの背後で OpenClaw Gateway を小さなコンテナ化アプリとしてホストします。このガイドは、Podman 互換の Compose アプリを実行し、Caddy で HTTPS を終端する EasyRunner ホストを前提としています。

## 始める前に

- ドメインがルーティングされた EasyRunner サーバー。
- 公式 OpenClaw イメージ (`ghcr.io/openclaw/openclaw`) または独自ビルド。
- `/home/node/.openclaw` 用の永続 config ボリューム。
- `/home/node/.openclaw/workspace` 用の永続 workspace ボリューム。
- 強力な Gateway トークンまたはパスワード。

可能な場合は device auth を有効のままにしてください。リバースプロキシが
device identity を正しく伝搬できない場合は、まず trusted-proxy 設定を修正してください
（[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。危険な auth
バイパスは、完全にプライベートでオペレーターが管理するネットワークでのみ使用してください。

## Compose アプリ

次のような Compose ファイルで EasyRunner アプリを作成します。

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com` を Gateway のホスト名に置き換えます。
`OPENCLAW_GATEWAY_TOKEN` はアプリ定義にコミットせず、EasyRunner の secret/environment マネージャーに保存してください。イメージはデフォルトで loopback に bind するため、
Caddy がコンテナに到達するには `command` 内の明示的な `--bind lan --port 1455` が必要です。

## OpenClaw を設定する

永続 config ボリューム内では、Gateway がプロキシ経由でのみ到達可能で、
auth を必須にします。

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

Caddy が Gateway の TLS を終端する場合は、auth チェックをグローバルに無効化するのではなく、正確なプロキシ経路に対して trusted-proxy 設定を構成してください。
[Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

## 検証

ワークステーションから:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner ホストからは、`GET /healthz`（liveness）と `GET /readyz`
（readiness）に auth は不要で、イメージ組み込みのコンテナ health check を支えます。また、アプリログで Gateway が listen していること、および起動時の SecretRef、plugin、channel auth の失敗がないことも確認してください。

## 更新とバックアップ

- 新しい OpenClaw イメージを pull または build し、EasyRunner アプリを再デプロイします。
- 更新前に `openclaw-config` ボリュームをバックアップしてください。これには
  `openclaw.json`、`agents/<agentId>/agent/auth-profiles.json`、インストール済み
  plugin パッケージ状態が含まれます。
- agents が永続的なプロジェクトデータを `openclaw-workspace` に書き込む場合は、これもバックアップしてください。
- メジャー更新後に `openclaw doctor` を実行し、config migration と
  service 警告を検出してください。

## トラブルシューティング

- `gateway probe` が接続できない: Caddy のホスト名がアプリを指しており、
  コンテナが `0.0.0.0:1455` で listen していることを確認してください。
- Auth が失敗する: EasyRunner secrets 内のトークンとローカルクライアント
  コマンドを同時にローテーションしてください。
- restore 後にファイルが root 所有になっている: イメージは `node`（uid 1000）として実行されます。
  そのユーザーが `/home/node/.openclaw` と `/home/node/.openclaw/workspace` に書き込めるように、マウントされたボリュームを修復してください。
- ブラウザーまたは channel plugins が失敗する: 必要な外部バイナリ、
  network egress、マウントされた credentials がコンテナ内で利用可能か確認してください。

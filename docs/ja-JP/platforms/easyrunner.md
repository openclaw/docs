---
read_when:
    - EasyRunner への OpenClaw のデプロイ
    - EasyRunner の Caddy プロキシの背後で Gateway を実行する
    - ホスト型Gateway向けの永続ボリュームと認証の選択
summary: Podman と Caddy を使用して EasyRunner 上で OpenClaw Gateway を実行する
title: EasyRunner
x-i18n:
    generated_at: "2026-07-11T22:23:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner は、Caddy プロキシの背後で OpenClaw Gateway を小規模なコンテナ化アプリとしてホストします。このガイドでは、Podman 互換の Compose アプリを実行し、Caddy を通じて HTTPS を終端する EasyRunner ホストを前提とします。

## 始める前に

- ドメインがルーティングされた EasyRunner サーバー。
- 公式の OpenClaw イメージ（`ghcr.io/openclaw/openclaw`）、または独自にビルドしたイメージ。
- `/home/node/.openclaw` 用の永続設定ボリューム。
- `/home/node/.openclaw/workspace` 用の永続ワークスペースボリューム。
- 強力な Gateway トークンまたはパスワード。

可能な限りデバイス認証を有効にしておいてください。リバースプロキシがデバイス ID を正しく伝達できない場合は、まず信頼済みプロキシ設定を修正してください（[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照）。危険な認証バイパスは、完全にプライベートで運用者が管理するネットワーク上でのみ使用してください。

## Compose アプリ

次のような Compose ファイルを使用して EasyRunner アプリを作成します。

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

`openclaw.example.com` を Gateway のホスト名に置き換えてください。`OPENCLAW_GATEWAY_TOKEN` はアプリ定義にコミットせず、EasyRunner のシークレット／環境変数マネージャーに保存してください。イメージはデフォルトでループバックにバインドされるため、Caddy がコンテナに到達するには、`command` で `--bind lan --port 1455` を明示的に指定する必要があります。

## OpenClaw の設定

永続設定ボリューム内では、Gateway にプロキシ経由でのみ到達できるようにし、認証を必須にします。

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

Caddy が Gateway の TLS を終端する場合は、認証チェックをグローバルに無効化するのではなく、正確なプロキシ経路に対して信頼済みプロキシ設定を構成してください。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

## 確認

ワークステーションから次を実行します。

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner ホストでは、`GET /healthz`（稼働確認）と `GET /readyz`（準備完了確認）に認証は不要で、イメージに組み込まれたコンテナのヘルスチェックに使用されます。また、アプリのログを確認し、Gateway が待ち受け状態であり、起動時に SecretRef、plugin、またはチャンネルの認証エラーが発生していないことを確認してください。

## 更新とバックアップ

- 新しい OpenClaw イメージをプルまたはビルドしてから、EasyRunner アプリを再デプロイします。
- 更新前に `openclaw-config` ボリュームをバックアップしてください。このボリュームには、`openclaw.json`、`agents/<agentId>/agent/auth-profiles.json`、インストール済み plugin パッケージの状態が含まれます。
- エージェントが永続的なプロジェクトデータを `openclaw-workspace` に書き込む場合は、そのボリュームもバックアップしてください。
- 大規模な更新後は `openclaw doctor` を実行し、設定の移行やサービスの警告を検出してください。

## トラブルシューティング

- `gateway probe` が接続できない：Caddy のホスト名がアプリを指していること、およびコンテナが `0.0.0.0:1455` で待ち受けていることを確認してください。
- 認証に失敗する：EasyRunner のシークレット内のトークンと、ローカルクライアントのコマンド内のトークンを同時にローテーションしてください。
- 復元後にファイルが root 所有になっている：イメージは `node`（uid 1000）として実行されます。そのユーザーが `/home/node/.openclaw` と `/home/node/.openclaw/workspace` に書き込めるよう、マウントされたボリュームの所有権を修正してください。
- ブラウザーまたはチャンネルの plugin が失敗する：必要な外部バイナリ、外向きネットワーク通信、およびマウントされた認証情報がコンテナ内で利用可能か確認してください。

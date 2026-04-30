---
read_when:
    - Gateway 用に安価で常時稼働する Linux ホストが必要な場合
    - 独自の VPS を運用せずにリモートから Control UI にアクセスしたい場合
summary: リモートアクセスのために exe.dev（VM + HTTPS プロキシ）で OpenClaw Gateway を実行する
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T05:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

目標: exe.dev VM 上で OpenClaw Gateway を実行し、ノート PC から `https://<vm-name>.exe.xyz` で到達できるようにする

このページは exe.dev のデフォルト **exeuntu** イメージを前提としています。別のディストリビューションを選んだ場合は、パッケージを適宜読み替えてください。

## 初心者向けクイックパス

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 必要に応じて auth key/token を入力します
3. VM の横にある「Agent」をクリックし、Shelley がプロビジョニングを完了するまで待ちます
4. `https://<vm-name>.exe.xyz/` を開き、設定済みの共有シークレットで認証します（このガイドではデフォルトで token 認証を使いますが、`gateway.auth.mode` を切り替えれば password 認証も使えます）
5. 保留中のデバイスペアリング要求を `openclaw devices approve <requestId>` で承認します

## 必要なもの

- exe.dev アカウント
- [exe.dev](https://exe.dev) 仮想マシンへの `ssh exe.dev` アクセス（任意）

## Shelley による自動インストール

[exe.dev](https://exe.dev) のエージェントである Shelley は、こちらのプロンプトで OpenClaw を即座にインストールできます。使用するプロンプトは次のとおりです。

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動インストール

## 1) VM を作成する

自分のデバイスから実行します。

```bash
ssh exe.dev new
```

次に接続します。

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
この VM は **ステートフル** に保ってください。OpenClaw は `openclaw.json`、エージェントごとの `auth-profiles.json`、セッション、チャネル/プロバイダーの状態を `~/.openclaw/` 配下に保存し、ワークスペースを `~/.openclaw/workspace/` 配下に保存します。
</Tip>

## 2) 前提パッケージをインストールする（VM 上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw をインストールする

OpenClaw のインストールスクリプトを実行します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx を設定して OpenClaw をポート 8000 にプロキシする

`/etc/nginx/sites-enabled/default` を次の内容で編集します。

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

クライアントから提供されたチェーンを保持するのではなく、転送ヘッダーを上書きしてください。OpenClaw は、明示的に設定されたプロキシからの forwarded IP メタデータだけを信頼し、追加形式の `X-Forwarded-For` チェーンは堅牢化上のリスクとして扱われます。

## 5) OpenClaw にアクセスして権限を付与する

`https://<vm-name>.exe.xyz/` にアクセスします（オンボーディングの Control UI 出力を参照してください）。認証を求められた場合は、VM から設定済みの共有シークレットを貼り付けます。このガイドでは token 認証を使うため、`openclaw config get gateway.auth.token` で `gateway.auth.token` を取得します（または `openclaw doctor --generate-gateway-token` で生成します）。Gateway を password 認証に変更した場合は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使います。`openclaw devices list` と `openclaw devices approve <requestId>` でデバイスを承認します。迷った場合は、ブラウザーから Shelley を使ってください。

## リモートチャネルのセットアップ

リモートホストでは、多数の SSH 呼び出しで `config set` を実行するよりも、1 回の `config patch` 呼び出しを優先してください。実際の token は VM 環境または `~/.openclaw/.env` に保持し、`openclaw.json` には SecretRefs だけを入れてください。

VM 上で、サービス環境に必要なシークレットを含めます。

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

ローカルマシンから、パッチファイルを作成して VM にパイプします。

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

ネストした allowlist をパッチ値そのものにしたい場合は、`--replace-path` を使います。たとえば、Discord チャネル allowlist を置き換える場合です。

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## リモートアクセス

リモートアクセスは [exe.dev](https://exe.dev) の認証によって処理されます。デフォルトでは、ポート 8000 からの HTTP トラフィックは、メール認証付きで `https://<vm-name>.exe.xyz` に転送されます。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

ガイド: [更新](/ja-JP/install/updating)

## 関連

- [リモート Gateway](/ja-JP/gateway/remote)
- [インストール概要](/ja-JP/install)

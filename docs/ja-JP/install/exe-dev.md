---
read_when:
    - Gateway 用の安価な常時稼働 Linux ホストが必要な場合
    - 自分の VPS を運用せずにリモートの Control UI アクセスを利用したい
summary: リモートアクセス用に exe.dev（VM + HTTPS プロキシ）で OpenClaw Gateway を実行する
title: exe.dev
x-i18n:
    generated_at: "2026-07-05T11:31:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86227ad592997b1c8af600fa6258f647bcfd16e03a4fe19b159d48d7bfe6c883
    source_path: install/exe-dev.md
    workflow: 16
---

**目標:** [exe.dev](https://exe.dev) VM 上で OpenClaw Gateway を実行し、`https://<vm-name>.exe.xyz` で到達できるようにする。

このガイドでは、exe.dev のデフォルト **exeuntu** イメージを前提としています。他のディストリビューションでは、パッケージを適宜対応させてください。

## 必要なもの

- exe.dev アカウント
- exe.dev VM への `ssh exe.dev` アクセス（任意、手動セットアップ用）

## 初心者向けクイック手順

1. [https://exe.new/openclaw](https://exe.new/openclaw) を開く
2. 必要に応じて認証キー/トークンを入力する
3. VM の横にある「Agent」をクリックし、Shelley がプロビジョニングを完了するまで待つ
4. `https://<vm-name>.exe.xyz/` を開き、設定済みの共有シークレットで認証する（デフォルトはトークン認証。`gateway.auth.mode` を切り替えればパスワード認証も使えます）
5. `openclaw devices approve <requestId>` で保留中のデバイスペアリング要求を承認する

## Shelley による自動インストール

exe.dev のエージェントである Shelley は、プロンプトから OpenClaw をインストールできます。

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動インストール

<Steps>
  <Step title="VM を作成する">
    デバイスから:

    ```bash
    ssh exe.dev new
    ```

    次に接続します:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    この VM は **ステートフル** に保ってください。OpenClaw は `openclaw.json`、エージェントごとの `auth-profiles.json`、セッション、チャネル/プロバイダー状態を `~/.openclaw/` 配下に保存し、ワークスペースを `~/.openclaw/workspace/` 配下に保存します。
    </Tip>

  </Step>

  <Step title="前提パッケージをインストールする（VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="OpenClaw をインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="nginx をポート 8000 にプロキシするよう設定する">
    `/etc/nginx/sites-enabled/default` を編集します:

    ```nginx
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

    クライアントから渡されたチェーンを保持するのではなく、転送ヘッダーを上書きします。OpenClaw は、明示的に設定されたプロキシからの転送 IP メタデータのみを信頼し、追記形式の `X-Forwarded-For` チェーンは堅牢化上のリスクとして扱われます。

  </Step>

  <Step title="OpenClaw にアクセスしてデバイスを承認する">
    `https://<vm-name>.exe.xyz/` を開きます（オンボーディングの Control UI 出力を参照してください）。認証を求められたら、VM から設定済みの共有シークレットを貼り付けます。

    このガイドではデフォルトでトークン認証を使うため、`openclaw config get gateway.auth.token` で `gateway.auth.token` を取得するか、`openclaw doctor --n` で新しいものを生成します。Gateway をパスワード認証に切り替えた場合は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使います。

    `openclaw devices list` と `openclaw devices approve <requestId>` でデバイスを承認します。迷った場合は、ブラウザーから Shelley を使ってください。

  </Step>
</Steps>

## リモートチャネルのセットアップ

リモートホストでは、`config set` への SSH 呼び出しを何度も行うより、1 回の `config patch` 呼び出しを優先してください。実際のトークンは VM 環境または `~/.openclaw/.env` に保持し、`openclaw.json` には SecretRefs だけを入れます。完全な SecretRef コントラクトについては、[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

VM 上で、サービス環境に必要なシークレットを含めます:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

ローカルマシンからパッチファイルを作成し、それを VM にパイプします:

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

ネストされた許可リストをパッチ値そのものにしたい場合は、`--replace-path` を使います。たとえば Discord チャネル許可リストを置き換える場合:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

完全なチャネル設定リファレンスについては、[Discord](/ja-JP/channels/discord) と [Slack](/ja-JP/channels/slack) を参照してください。

## リモートアクセス

exe.dev はリモートアクセスの認証を処理します。デフォルトでは、ポート 8000 からの HTTP トラフィックがメール認証付きで `https://<vm-name>.exe.xyz` に転送されます。

## 更新

```bash
openclaw update
```

チャネル切り替えと手動リカバリーについては、[更新](/ja-JP/install/updating) を参照してください。

## 関連

- [リモート Gateway](/ja-JP/gateway/remote)
- [インストール概要](/ja-JP/install)

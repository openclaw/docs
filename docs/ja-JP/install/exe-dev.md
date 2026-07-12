---
read_when:
    - Gateway 用の安価な常時稼働 Linux ホストが必要な場合
    - 独自のVPSを運用せずに、Control UIへリモートアクセスしたい場合
summary: リモートアクセス用に exe.dev（VM + HTTPS プロキシ）で OpenClaw Gateway を実行する
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T14:39:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**目標:** OpenClaw Gateway を [exe.dev](https://exe.dev) VM 上で実行し、`https://<vm-name>.exe.xyz` からアクセスできるようにします。

このガイドでは、exe.dev のデフォルトの **exeuntu** イメージを前提としています。他のディストリビューションでは、対応するパッケージに読み替えてください。

## 必要なもの

- exe.dev アカウント
- exe.dev VM への `ssh exe.dev` アクセス（手動セットアップの場合は任意）

## 初心者向けクイック手順

1. [https://exe.new/openclaw](https://exe.new/openclaw) を開きます
2. 必要に応じて認証キーまたはトークンを入力します
3. VM の横にある "Agent" をクリックし、Shelley によるプロビジョニングが完了するまで待ちます
4. `https://<vm-name>.exe.xyz/` を開き、設定した共有シークレットで認証します（デフォルトはトークン認証です。`gateway.auth.mode` を切り替えた場合はパスワード認証も使用できます）
5. `openclaw devices approve <requestId>` で保留中のデバイスペアリング要求を承認します

## Shelley による自動インストール

exe.dev のエージェントである Shelley は、プロンプトから OpenClaw をインストールできます。

```text
この VM に OpenClaw（https://docs.openclaw.ai/install）をセットアップしてください。OpenClaw のオンボーディングには、非対話モードとリスク承認のフラグを使用してください。必要に応じて、提供された認証情報またはトークンを追加してください。デフォルトで有効なサイト設定のルートロケーションで、デフォルトポート 18789 から転送するように nginx を設定し、必ず WebSocket サポートを有効にしてください。ペアリングは "openclaw devices list" と "openclaw devices approve <request id>" で行います。ダッシュボードに OpenClaw のヘルス状態が正常であると表示されることを確認してください。exe.dev がポート 8000 からポート 80/443 への転送と HTTPS を処理するため、最終的な「アクセス可能」アドレスは、ポート指定なしの <vm-name>.exe.xyz にしてください。
```

## 手動インストール

<Steps>
  <Step title="VM を作成する">
    デバイスから次を実行します。

    ```bash
    ssh exe.dev new
    ```

    次に接続します。

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    この VM は**ステートフル**な状態で維持してください。OpenClaw は `openclaw.json`、エージェントごとの `auth-profiles.json`、セッション、チャンネルおよびプロバイダーの状態を `~/.openclaw/` 以下に保存し、ワークスペースを `~/.openclaw/workspace/` 以下に保存します。
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

  <Step title="ポート 8000 にプロキシするよう nginx を設定する">
    `/etc/nginx/sites-enabled/default` を編集します。

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

            # WebSocket サポート
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # 標準プロキシヘッダー
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 長時間接続用のタイムアウト設定
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    クライアントから提供されたチェーンを維持せず、転送ヘッダーを上書きしてください。OpenClaw は、明示的に設定されたプロキシからの転送 IP メタデータのみを信頼し、追記形式の `X-Forwarded-For` チェーンはセキュリティ強化上のリスクとして扱います。

  </Step>

  <Step title="OpenClaw にアクセスしてデバイスを承認する">
    `https://<vm-name>.exe.xyz/` を開きます（オンボーディング時の Control UI 出力を参照してください）。認証を求められた場合は、VM で設定した共有シークレットを貼り付けます。

    このガイドではデフォルトでトークン認証を使用するため、`openclaw config get gateway.auth.token` で `gateway.auth.token` を取得するか、`openclaw doctor --n` で新しいトークンを生成してください。Gateway をパスワード認証に切り替えた場合は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使用します。

    `openclaw devices list` と `openclaw devices approve <requestId>` でデバイスを承認します。不明な場合は、ブラウザーから Shelley を使用してください。

  </Step>
</Steps>

## リモートチャンネルのセットアップ

リモートホストでは、SSH で `config set` を何度も呼び出すより、1 回の `config patch` 呼び出しを推奨します。実際のトークンは VM の環境または `~/.openclaw/.env` に保存し、`openclaw.json` には SecretRef のみを記述してください。SecretRef の完全な仕様については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

VM 上で、サービス環境に必要なシークレットを含めます。

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

ローカルマシンでパッチファイルを作成し、VM にパイプで渡します。

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
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

ネストされた許可リストをパッチの値と完全に一致させる場合は、`--replace-path` を使用します。たとえば、Discord チャンネルの許可リストを置き換える場合は、次のようにします。

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

チャンネル設定の完全なリファレンスについては、[Discord](/ja-JP/channels/discord)および[Slack](/ja-JP/channels/slack)を参照してください。

## リモートアクセス

exe.dev がリモートアクセスの認証を処理します。デフォルトでは、ポート 8000 からの HTTP トラフィックは、メール認証付きで `https://<vm-name>.exe.xyz` に転送されます。

## 更新

```bash
openclaw update
```

チャンネルの切り替えと手動復旧については、[更新](/ja-JP/install/updating)を参照してください。

## 関連項目

- [リモート Gateway](/ja-JP/gateway/remote)
- [インストールの概要](/ja-JP/install)

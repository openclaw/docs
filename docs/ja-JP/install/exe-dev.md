---
read_when:
    - Gateway 用の低コストな常時稼働 Linux ホストが必要な場合
    - 独自の VPS を運用せずにリモートから Control UI にアクセスしたい場合
summary: リモートアクセス用に exe.dev（VM + HTTPS プロキシ）で OpenClaw Gateway を実行する
title: exe.dev
x-i18n:
    generated_at: "2026-07-11T22:20:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**目標:** OpenClaw Gatewayを[exe.dev](https://exe.dev) VM上で実行し、`https://<vm-name>.exe.xyz`でアクセスできるようにします。

このガイドでは、exe.devのデフォルトの**exeuntu**イメージを前提としています。他のディストリビューションでは、対応するパッケージに読み替えてください。

## 必要なもの

- exe.devアカウント
- exe.dev VMへの`ssh exe.dev`アクセス（手動セットアップの場合のみ）

## 初心者向けクイック手順

1. [https://exe.new/openclaw](https://exe.new/openclaw)を開きます
2. 必要に応じて認証キーまたはトークンを入力します
3. VMの横にある「Agent」をクリックし、Shelleyによるプロビジョニングが完了するまで待ちます
4. `https://<vm-name>.exe.xyz/`を開き、設定した共有シークレットで認証します（デフォルトはトークン認証です。`gateway.auth.mode`を切り替えた場合はパスワード認証も使用できます）
5. `openclaw devices approve <requestId>`で保留中のデバイスペアリング要求を承認します

## Shelleyによる自動インストール

exe.devのエージェントであるShelleyは、プロンプトからOpenClawをインストールできます。

```text
このVMにOpenClaw (https://docs.openclaw.ai/install)をセットアップしてください。openclawのオンボーディングには、非対話モードとリスク承認のフラグを使用してください。必要に応じて、指定された認証情報またはトークンを追加してください。nginxを設定して、デフォルトで有効なサイト設定のルートロケーションで、デフォルトポート18789へ転送するようにし、WebSocketサポートを必ず有効にしてください。ペアリングは「openclaw devices list」と「openclaw devices approve <request id>」で行います。ダッシュボードにOpenClawのヘルスが正常であると表示されることを確認してください。exe.devがポート8000からポート80/443への転送とHTTPSを処理するため、最終的な「アクセス可能」なアドレスは、ポート指定なしの<vm-name>.exe.xyzにしてください。
```

## 手動インストール

<Steps>
  <Step title="VMを作成する">
    使用中のデバイスから次を実行します。

    ```bash
    ssh exe.dev new
    ```

    次に接続します。

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    このVMは**ステートフル**な状態を維持してください。OpenClawは`openclaw.json`、エージェントごとの`auth-profiles.json`、セッション、チャンネルおよびプロバイダーの状態を`~/.openclaw/`以下に保存し、ワークスペースを`~/.openclaw/workspace/`以下に保存します。
    </Tip>

  </Step>

  <Step title="前提パッケージをインストールする（VM上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="OpenClawをインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="ポート8000へのプロキシとしてnginxを設定する">
    `/etc/nginx/sites-enabled/default`を編集します。

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

            # WebSocketサポート
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

    クライアントから提供されたチェーンを保持せず、転送ヘッダーを上書きしてください。OpenClawは、明示的に設定されたプロキシからの転送IPメタデータのみを信頼します。また、追記形式の`X-Forwarded-For`チェーンはセキュリティ強化上のリスクとして扱われます。

  </Step>

  <Step title="OpenClawにアクセスしてデバイスを承認する">
    `https://<vm-name>.exe.xyz/`を開きます（オンボーディングによるControl UIの出力を参照してください）。認証を求められた場合は、VMで設定した共有シークレットを貼り付けます。

    このガイドではデフォルトでトークン認証を使用するため、`openclaw config get gateway.auth.token`で`gateway.auth.token`を取得するか、`openclaw doctor --n`で新しいトークンを生成します。Gatewayをパスワード認証に切り替えた場合は、代わりに`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`を使用します。

    `openclaw devices list`と`openclaw devices approve <requestId>`でデバイスを承認します。判断に迷う場合は、ブラウザーからShelleyを使用してください。

  </Step>
</Steps>

## リモートチャンネルのセットアップ

リモートホストでは、`config set`を使用する多数のSSH呼び出しよりも、1回の`config patch`呼び出しを推奨します。実際のトークンはVM環境または`~/.openclaw/.env`に保持し、`openclaw.json`にはSecretRefsのみを記述してください。SecretRefの完全な契約については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

VM上で、サービス環境に必要なシークレットが含まれるようにします。

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

ローカルマシンでパッチファイルを作成し、VMへパイプで渡します。

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

ネストされた許可リストをパッチ値と完全に一致させる必要がある場合は、`--replace-path`を使用します。たとえば、Discordチャンネルの許可リストを置き換える場合は次のようにします。

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

チャンネル設定の完全なリファレンスについては、[Discord](/ja-JP/channels/discord)および[Slack](/ja-JP/channels/slack)を参照してください。

## リモートアクセス

exe.devはリモートアクセスの認証を処理します。デフォルトでは、ポート8000からのHTTPトラフィックが、メール認証付きで`https://<vm-name>.exe.xyz`へ転送されます。

## 更新

```bash
openclaw update
```

チャンネルの切り替えと手動復旧については、[更新](/ja-JP/install/updating)を参照してください。

## 関連項目

- [リモートGateway](/ja-JP/gateway/remote)
- [インストールの概要](/ja-JP/install)

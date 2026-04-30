---
read_when:
    - Fly.io への OpenClaw のデプロイ
    - Fly のボリューム、シークレット、初回実行設定のセットアップ
summary: 永続ストレージと HTTPS を備えた OpenClaw の Fly.io デプロイ手順
title: Fly.io
x-i18n:
    generated_at: "2026-04-30T05:20:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# Fly.io デプロイ

**目標:** 永続ストレージ、自動 HTTPS、Discord/チャネルアクセスを備えた [Fly.io](https://fly.io) マシン上で動作する OpenClaw Gateway。

## 必要なもの

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) がインストール済みであること
- Fly.io アカウント（無料枠で可）
- モデル認証: 選択したモデルプロバイダーの API キー
- チャネル認証情報: Discord ボットトークン、Telegram トークンなど

## 初心者向けクイック手順

1. リポジトリをクローン → `fly.toml` をカスタマイズ
2. アプリ + ボリュームを作成 → シークレットを設定
3. `fly deploy` でデプロイ
4. SSH で入り、設定を作成するかコントロール UI を使用

<Steps>
  <Step title="Fly アプリを作成する">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **ヒント:** 自分に近いリージョンを選択してください。一般的な選択肢: `lhr`（ロンドン）、`iad`（バージニア）、`sjc`（サンノゼ）。

  </Step>

  <Step title="fly.toml を設定する">
    アプリ名と要件に合わせて `fly.toml` を編集します。

    **セキュリティ上の注意:** 既定の設定では公開 URL が公開されます。公開 IP なしの強化デプロイについては、[プライベートデプロイ](#private-deployment-hardened) を参照するか、`fly.private.toml` を使用してください。

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **主な設定:**

    | 設定                           | 理由                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly のプロキシが gateway に到達できるように `0.0.0.0` にバインドします     |
    | `--allow-unconfigured`         | 設定ファイルなしで起動します（後で作成します）                              |
    | `internal_port = 3000`         | Fly のヘルスチェックのために `--port 3000`（または `OPENCLAW_GATEWAY_PORT`）と一致する必要があります |
    | `memory = "2048mb"`            | 512MB は小さすぎます。2GB を推奨します                                      |
    | `OPENCLAW_STATE_DIR = "/data"` | ボリューム上に状態を永続化します                                            |

  </Step>

  <Step title="シークレットを設定する">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **注記:**

    - 非ループバックバインド（`--bind lan`）には、有効な gateway 認証パスが必要です。この Fly.io の例では `OPENCLAW_GATEWAY_TOKEN` を使用しますが、`gateway.auth.password` または正しく設定された非ループバックの `trusted-proxy` デプロイでも要件を満たします。
    - これらのトークンはパスワードと同じように扱ってください。
    - **すべての API キーとトークンには、設定ファイルよりも環境変数を推奨します**。これにより、シークレットが誤って公開またはログ出力される可能性のある `openclaw.json` に入るのを防げます。

  </Step>

  <Step title="デプロイする">
    ```bash
    fly deploy
    ```

    初回デプロイでは Docker イメージをビルドします（約 2〜3 分）。以降のデプロイはより高速です。

    デプロイ後、確認します:

    ```bash
    fly status
    fly logs
    ```

    次のように表示されるはずです:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="設定ファイルを作成する">
    マシンに SSH で入り、適切な設定を作成します:

    ```bash
    fly ssh console
    ```

    設定ディレクトリとファイルを作成します:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **注記:** `OPENCLAW_STATE_DIR=/data` の場合、設定パスは `/data/openclaw.json` です。

    **注記:** `https://my-openclaw.fly.dev` を実際の Fly アプリの
    オリジンに置き換えてください。Gateway の起動時には、ランタイムの
    `--bind` と `--port` の値からローカルのコントロール UI オリジンがシードされるため、
    設定が存在する前でも初回起動を進められますが、
    Fly 経由でブラウザーアクセスするには、正確な HTTPS オリジンが
    `gateway.controlUi.allowedOrigins` に列挙されている必要があります。

    **注記:** Discord トークンは次のどちらからでも取得できます:

    - 環境変数: `DISCORD_BOT_TOKEN`（シークレットには推奨）
    - 設定ファイル: `channels.discord.token`

    環境変数を使用する場合、設定にトークンを追加する必要はありません。gateway は `DISCORD_BOT_TOKEN` を自動的に読み取ります。

    適用するには再起動します:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway にアクセスする">
    ### コントロール UI

    ブラウザーで開きます:

    ```bash
    fly open
    ```

    または `https://my-openclaw.fly.dev/` にアクセスします

    設定済みの共有シークレットで認証します。このガイドでは
    `OPENCLAW_GATEWAY_TOKEN` の gateway トークンを使用します。パスワード認証に切り替えた場合は、
    代わりにそのパスワードを使用してください。

    ### ログ

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH コンソール

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## トラブルシューティング

### 「App is not listening on expected address」

gateway が `0.0.0.0` ではなく `127.0.0.1` にバインドしています。

**修正:** `fly.toml` のプロセスコマンドに `--bind lan` を追加します。

### ヘルスチェック失敗 / 接続拒否

Fly が設定済みポートで gateway に到達できません。

**修正:** `internal_port` が gateway ポートと一致していることを確認してください（`--port 3000` または `OPENCLAW_GATEWAY_PORT=3000` を設定）。

### OOM / メモリの問題

コンテナが再起動し続ける、または強制終了されます。兆候: `SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`、またはサイレント再起動。

**修正:** `fly.toml` でメモリを増やします:

```toml
[[vm]]
  memory = "2048mb"
```

または既存のマシンを更新します:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注記:** 512MB は小さすぎます。1GB でも動作する場合がありますが、負荷時や詳細ログ有効時には OOM になる可能性があります。**2GB を推奨します。**

### Gateway ロックの問題

Gateway が「already running」エラーで起動を拒否します。

これは、コンテナが再起動しても PID ロックファイルがボリューム上に残る場合に発生します。

**修正:** ロックファイルを削除します:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ロックファイルは `/data/gateway.*.lock` にあります（サブディレクトリ内ではありません）。

### 設定が読み取られない

`--allow-unconfigured` は起動ガードをバイパスするだけです。`/data/openclaw.json` を作成または修復するわけではないため、通常のローカル gateway 起動を行いたい場合は、実際の設定が存在し、`gateway.mode="local"` が含まれていることを確認してください。

設定が存在することを確認します:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH 経由で設定を書き込む

`fly ssh console -C` コマンドはシェルリダイレクトをサポートしていません。設定ファイルを書き込むには:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注記:** `fly sftp` はファイルがすでに存在する場合に失敗することがあります。先に削除してください:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状態が永続化されない

再起動後に認証プロファイル、チャネル/プロバイダー状態、またはセッションが失われる場合、
状態ディレクトリがコンテナファイルシステムに書き込まれています。

**修正:** `OPENCLAW_STATE_DIR=/data` が `fly.toml` に設定されていることを確認し、再デプロイしてください。

## 更新

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### マシンコマンドを更新する

フル再デプロイなしで起動コマンドを変更する必要がある場合:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注記:** `fly deploy` の後、マシンコマンドは `fly.toml` 内の内容にリセットされる場合があります。手動変更を行った場合は、デプロイ後に再適用してください。

## プライベートデプロイ（強化）

既定では、Fly は公開 IP を割り当てるため、gateway は `https://your-app.fly.dev` でアクセス可能になります。これは便利ですが、デプロイがインターネットスキャナー（Shodan、Censys など）から発見可能になることを意味します。

**公開露出なし**の強化デプロイには、プライベートテンプレートを使用します。

### プライベートデプロイを使用する場合

- **アウトバウンド**呼び出し/メッセージのみを行う（インバウンド Webhook なし）
- Webhook コールバックに **ngrok または Tailscale** トンネルを使用する
- ブラウザーの代わりに **SSH、プロキシ、または WireGuard** 経由で gateway にアクセスする
- デプロイを**インターネットスキャナーから隠したい**

### セットアップ

標準設定の代わりに `fly.private.toml` を使用します:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

または既存のデプロイを変換します:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list` には `private` タイプの IP のみが表示されるはずです:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### プライベートデプロイへのアクセス

公開 URL がないため、次のいずれかの方法を使用します:

**オプション 1: ローカルプロキシ（最も簡単）**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**オプション 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**オプション 3: SSH のみ**

```bash
fly ssh console -a my-openclaw
```

### プライベートデプロイでのWebhook

公開せずにWebhookコールバック（Twilio、Telnyxなど）が必要な場合:

1. **ngrokトンネル** - コンテナ内またはサイドカーとしてngrokを実行
2. **Tailscale Funnel** - Tailscale経由で特定のパスを公開
3. **アウトバウンドのみ** - 一部のプロバイダー（Twilio）は、Webhookなしでもアウトバウンド通話で問題なく動作します

ngrokを使った音声通話設定の例:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrokトンネルはコンテナ内で実行され、Flyアプリ自体を公開せずに公開Webhook URLを提供します。転送されたホストヘッダーが受け入れられるように、`webhookSecurity.allowedHosts`を公開トンネルのホスト名に設定してください。

### セキュリティ上の利点

| 観点              | 公開         | プライベート |
| ----------------- | ------------ | ---------- |
| インターネットスキャナー | 発見可能     | 非表示     |
| 直接攻撃          | 可能         | ブロック   |
| Control UIアクセス | ブラウザー   | プロキシ/VPN |
| Webhook配信       | 直接         | トンネル経由 |

## 注記

- Fly.ioは**x86アーキテクチャ**を使用します（ARMではありません）
- Dockerfileは両方のアーキテクチャに対応しています
- WhatsApp/Telegramオンボーディングには、`fly ssh console`を使用します
- 永続データは`/data`のボリュームに保存されます
- SignalにはJava + signal-cliが必要です。カスタムイメージを使用し、メモリを2GB以上にしてください。

## コスト

推奨設定（`shared-cpu-2x`、2GB RAM）の場合:

- 使用状況に応じて月額約$10-15
- 無料枠には一定の利用枠が含まれます

詳細は[Fly.ioの料金](https://fly.io/docs/about/pricing/)を参照してください。

## 次のステップ

- メッセージングチャンネルを設定する: [チャンネル](/ja-JP/channels)
- Gatewayを設定する: [Gateway設定](/ja-JP/gateway/configuration)
- OpenClawを最新の状態に保つ: [更新](/ja-JP/install/updating)

## 関連

- [インストール概要](/ja-JP/install)
- [Hetzner](/ja-JP/install/hetzner)
- [Docker](/ja-JP/install/docker)
- [VPSホスティング](/ja-JP/vps)

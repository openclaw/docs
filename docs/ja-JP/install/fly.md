---
read_when:
    - OpenClaw を Fly.io にデプロイしている場合
    - Fly volume、シークレット、初回設定をセットアップしている場合
summary: 永続ストレージと HTTPS を備えた OpenClaw の Fly.io デプロイ手順ガイド
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T05:04:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# Fly.io デプロイ

**目標:** 永続ストレージ、自動 HTTPS、Discord / 各種チャネルアクセスを備えた [Fly.io](https://fly.io) マシン上で OpenClaw Gateway を動作させること。

## 必要なもの

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) がインストールされていること
- Fly.io アカウント（無料枠で可）
- モデル認証: 使用するモデルプロバイダの API キー
- チャネル認証情報: Discord bot token、Telegram token など

## 初心者向けクイックパス

1. リポジトリを clone → `fly.toml` を調整
2. app + volume を作成 → secrets を設定
3. `fly deploy` でデプロイ
4. SSH で入り設定ファイルを作成、または Control UI を使用

<Steps>
  <Step title="Fly アプリを作成">
    ```bash
    # リポジトリを clone
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 新しい Fly アプリを作成（名前は自分で決める）
    fly apps create my-openclaw

    # 永続 volume を作成（通常は 1GB で十分）
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **ヒント:** 自分に近いリージョンを選んでください。一般的な選択肢: `lhr`（ロンドン）、`iad`（バージニア）、`sjc`（サンノゼ）。

  </Step>

  <Step title="fly.toml を設定">
    アプリ名と要件に合わせて `fly.toml` を編集します。

    **セキュリティ注記:** デフォルト設定では公開 URL が公開されます。公開 IP なしのハード化されたデプロイについては、[Private Deployment](#private-deployment-hardened) を参照するか、`fly.private.toml` を使ってください。

    ```toml
    app = "my-openclaw"  # アプリ名
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

    **主要設定:**

    | 設定                           | 理由                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly のプロキシが gateway に到達できるよう、`0.0.0.0` に bind する            |
    | `--allow-unconfigured`         | 設定ファイルなしで起動する（後で作成する）                                  |
    | `internal_port = 3000`         | Fly のヘルスチェックのため、`--port 3000`（または `OPENCLAW_GATEWAY_PORT`）と一致させる必要がある |
    | `memory = "2048mb"`            | 512MB では小さすぎる。2GB 推奨                                              |
    | `OPENCLAW_STATE_DIR = "/data"` | state を volume 上に永続化する                                               |

  </Step>

  <Step title="secrets を設定">
    ```bash
    # 必須: Gateway token（non-loopback bind 用）
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # モデルプロバイダ API キー
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 任意: その他のプロバイダ
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # チャネルトークン
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **注記:**

    - non-loopback bind（`--bind lan`）には、有効な gateway 認証経路が必要です。この Fly.io 例では `OPENCLAW_GATEWAY_TOKEN` を使っていますが、`gateway.auth.password` や、正しく設定された non-loopback `trusted-proxy` デプロイでも要件を満たせます。
    - これらのトークンはパスワード同様に扱ってください。
    - すべての API キーと token には、**設定ファイルより env vars を推奨** します。これにより、誤って `openclaw.json` 内にシークレットを入れて露出したり、ログに残したりすることを防げます。

  </Step>

  <Step title="デプロイ">
    ```bash
    fly deploy
    ```

    初回デプロイでは Docker イメージをビルドします（約 2〜3 分）。以後のデプロイはより高速です。

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

  <Step title="設定ファイルを作成">
    適切な設定を作成するため、マシンに SSH で入ります:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **注記:** `OPENCLAW_STATE_DIR=/data` の場合、設定パスは `/data/openclaw.json` です。

    **注記:** Discord token は次のいずれかから取得できます:

    - 環境変数: `DISCORD_BOT_TOKEN`（シークレットには推奨）
    - 設定ファイル: `channels.discord.token`

    env var を使う場合、設定に token を追加する必要はありません。gateway は `DISCORD_BOT_TOKEN` を自動的に読み取ります。

    適用のため再起動します:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway にアクセス">
    ### Control UI

    ブラウザで開きます:

    ```bash
    fly open
    ```

    または `https://my-openclaw.fly.dev/` にアクセスしてください。

    設定済みの共有シークレットで認証してください。このガイドでは
    `OPENCLAW_GATEWAY_TOKEN` の gateway token を使っています。password 認証に切り替えた場合は、
    代わりにその password を使ってください。

    ### ログ

    ```bash
    fly logs              # ライブログ
    fly logs --no-tail    # 直近のログ
    ```

    ### SSH コンソール

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## トラブルシューティング

### 「App is not listening on expected address」

gateway が `0.0.0.0` ではなく `127.0.0.1` に bind しています。

**修正:** `fly.toml` の process コマンドに `--bind lan` を追加してください。

### ヘルスチェック失敗 / connection refused

Fly が設定されたポートで gateway に到達できていません。

**修正:** `internal_port` が gateway のポートと一致していることを確認してください（`--port 3000` または `OPENCLAW_GATEWAY_PORT=3000` を設定）。

### OOM / メモリ問題

コンテナが再起動し続ける、または kill される。兆候: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, または無言の再起動。

**修正:** `fly.toml` のメモリを増やしてください:

```toml
[[vm]]
  memory = "2048mb"
```

または既存マシンを更新します:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注記:** 512MB は小さすぎます。1GB でも動くことはありますが、負荷時や verbose logging 時に OOM になることがあります。**2GB 推奨** です。

### Gateway Lock Issues

gateway が「already running」エラーで起動を拒否する。

これは、コンテナ再起動時に PID lock ファイルが volume 上に残ると起こります。

**修正:** lock ファイルを削除します:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

lock ファイルは `/data/gateway.*.lock` にあります（サブディレクトリ内ではありません）。

### Config Not Being Read

`--allow-unconfigured` は起動ガードをバイパスするだけです。`/data/openclaw.json` を作成したり修復したりはしないため、実際の設定が存在し、通常のローカル gateway 起動を望む場合は `gateway.mode="local"` を含んでいることを確認してください。

設定が存在するか確認します:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH 経由での設定書き込み

`fly ssh console -C` コマンドはシェルのリダイレクトをサポートしていません。設定ファイルを書き込むには:

```bash
# echo + tee を使う（ローカルからリモートへ pipe）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# または sftp を使う
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注記:** `fly sftp` は、ファイルがすでに存在すると失敗することがあります。先に削除してください:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State Not Persisting

再起動後に auth profile、チャネル / プロバイダ状態、またはセッションが失われる場合、
state dir がコンテナファイルシステムに書き込まれています。

**修正:** `fly.toml` で `OPENCLAW_STATE_DIR=/data` が設定されていることを確認し、再デプロイしてください。

## 更新

```bash
# 最新変更を取得
git pull

# 再デプロイ
fly deploy

# 正常性を確認
fly status
fly logs
```

### マシンコマンドの更新

完全な再デプロイなしで起動コマンドを変更したい場合:

```bash
# machine ID を取得
fly machines list

# コマンドを更新
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# またはメモリ増加付き
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注記:** `fly deploy` 後、マシンコマンドは `fly.toml` に書かれた内容へ戻ることがあります。手動変更を加えた場合は、デプロイ後に再適用してください。

## Private Deployment（Hardened）

デフォルトでは、Fly は公開 IP を割り当てるため、gateway は `https://your-app.fly.dev` で到達可能になります。これは便利ですが、あなたのデプロイがインターネットスキャナ（Shodan, Censys など）から見えることも意味します。

**公開露出なし** のハード化されたデプロイには、private テンプレートを使ってください。

### private deployment を使うべき場合

- **送信専用** の呼び出し / メッセージだけを行う（受信 Webhook は不要）
- Webhook コールバックには **ngrok または Tailscale** トンネルを使う
- gateway へはブラウザではなく **SSH、proxy、または WireGuard** 経由でアクセスする
- デプロイを **インターネットスキャナから隠したい**

### セットアップ

標準設定の代わりに `fly.private.toml` を使います:

```bash
# private config でデプロイ
fly deploy -c fly.private.toml
```

または既存デプロイを変換します:

```bash
# 現在の IP 一覧を表示
fly ips list -a my-openclaw

# 公開 IP を解放
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 今後のデプロイで公開 IP が再割り当てされないよう private config に切り替える
#（[http_service] を削除するか、private テンプレートでデプロイ）
fly deploy -c fly.private.toml

# private 専用 IPv6 を割り当て
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list` には `private` タイプの IP だけが表示されるはずです:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### private deployment へのアクセス方法

公開 URL がないため、次のいずれかを使ってください:

**Option 1: ローカル proxy（もっとも簡単）**

```bash
# ローカルポート 3000 を app に転送
fly proxy 3000:3000 -a my-openclaw

# その後、ブラウザで http://localhost:3000 を開く
```

**Option 2: WireGuard VPN**

```bash
# WireGuard config を作成（初回のみ）
fly wireguard create

# WireGuard クライアントに取り込み、その後 internal IPv6 経由でアクセス
# 例: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3: SSH のみ**

```bash
fly ssh console -a my-openclaw
```

### private deployment での Webhook

公開露出なしで Webhook コールバック（Twilio、Telnyx など）が必要な場合:

1. **ngrok トンネル** - ngrok をコンテナ内または sidecar として実行
2. **Tailscale Funnel** - 特定パスだけを Tailscale 経由で公開
3. **送信専用** - 一部プロバイダ（Twilio など）は Webhook なしでも送信通話だけなら問題なく動く

ngrok を使った voice-call 設定例:

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

ngrok トンネルはコンテナ内で動作し、Fly アプリ自体を公開せずに公開 Webhook URL を提供します。転送された host header を受け入れられるよう、`webhookSecurity.allowedHosts` を公開トンネルのホスト名に設定してください。

### セキュリティ上の利点

| 項目               | Public       | Private    |
| ------------------ | ------------ | ---------- |
| インターネットスキャナ | 発見可能     | 隠蔽される |
| 直接攻撃           | 可能         | ブロックされる |
| Control UI アクセス | ブラウザ     | Proxy/VPN  |
| Webhook 配信       | 直接         | トンネル経由 |

## 注記

- Fly.io は **x86 アーキテクチャ** を使います（ARM ではありません）
- Dockerfile は両アーキテクチャと互換性があります
- WhatsApp / Telegram のオンボーディングには `fly ssh console` を使ってください
- 永続データは volume 上の `/data` に保存されます
- Signal には Java + signal-cli が必要です。カスタムイメージを使い、メモリは 2GB 以上を維持してください。

## コスト

推奨設定（`shared-cpu-2x`, 2GB RAM）では:

- 使用量に応じて月額約 $10〜15
- 無料枠に一定の含みがあります

詳細は [Fly.io pricing](https://fly.io/docs/about/pricing/) を参照してください。

## 次のステップ

- メッセージングチャネルを設定する: [Channels](/ja-JP/channels)
- Gateway を設定する: [Gateway configuration](/ja-JP/gateway/configuration)
- OpenClaw を最新に保つ: [Updating](/ja-JP/install/updating)

## 関連

- [Install overview](/ja-JP/install)
- [Hetzner](/ja-JP/install/hetzner)
- [Docker](/ja-JP/install/docker)
- [VPS hosting](/ja-JP/vps)

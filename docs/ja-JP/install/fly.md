---
read_when:
    - Fly.io に OpenClaw をデプロイする
    - Fly ボリューム、シークレット、初回実行設定のセットアップ
summary: 永続ストレージと HTTPS を備えた OpenClaw の Fly.io デプロイ手順
title: Fly.io
x-i18n:
    generated_at: "2026-07-05T11:26:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**目標:** 永続ストレージ、自動 HTTPS、Discord/チャネルアクセスを備えた [Fly.io](https://fly.io) マシン上で OpenClaw Gateway を実行する。

## 必要なもの

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) がインストール済み
- Fly.io アカウント（無料枠で可）
- モデル認証: 選択したモデルプロバイダーの API キー
- チャネル認証情報: Discord bot token、Telegram token など

## 初心者向けクイック手順

1. リポジトリをクローンし、`fly.toml` をカスタマイズする
2. アプリとボリュームを作成し、シークレットを設定する
3. `fly deploy` でデプロイする
4. SSH で入って設定を作成するか、Control UI を使用する

<Steps>
  <Step title="Fly アプリを作成する">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # pick your own name
    fly apps create my-openclaw

    # 1GB is usually enough
    fly volumes create openclaw_data --size 1 --region iad
    ```

    自分に近いリージョンを選択する。一般的な選択肢: `lhr`（ロンドン）、`iad`（バージニア）、`sjc`（サンノゼ）。

  </Step>

  <Step title="fly.toml を設定する">
    アプリ名と要件に合わせて `fly.toml` を編集する。リポジトリで管理されている `fly.toml` は下記の公開テンプレートで、`deploy/fly.private.toml` は強化済みのパブリック IP なしバリアント（[プライベートデプロイ](#private-deployment-hardened) を参照）。

    ```toml
    app = "my-openclaw"  # your app name
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

    OpenClaw Docker イメージのエントリポイントは `tini` で、デフォルトでは `node openclaw.mjs gateway` を実行する。Fly の `[processes]` は Docker の `CMD` を置き換える（ここでは同じコンパイル済みエントリポイントである `node dist/index.js gateway ...` を直接実行する）が、`ENTRYPOINT` には触れないため、プロセスは引き続き `tini` 配下で実行される。

    **主要設定:**

    | 設定                           | 理由                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly のプロキシが Gateway に到達できるように `0.0.0.0` にバインドする       |
    | `--allow-unconfigured`         | 設定ファイルなしで起動する（後で作成する）                                  |
    | `internal_port = 3000`         | Fly のヘルスチェックのために `--port 3000`（または `OPENCLAW_GATEWAY_PORT`）と一致している必要がある |
    | `memory = "2048mb"`            | 512MB は小さすぎるため、2GB を推奨                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | ボリューム上に状態を永続化する                                              |

  </Step>

  <Step title="シークレットを設定する">
    ```bash
    # required: gateway auth token for non-loopback binding
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # optional: other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    非ループバックバインド（`--bind lan`）には、有効な Gateway 認証パスが必要。この例では `OPENCLAW_GATEWAY_TOKEN` を使用するが、`gateway.auth.password` または正しく設定された非ループバックの信頼済みプロキシデプロイでも要件を満たす。SecretRef コントラクトについては [シークレット管理](/ja-JP/gateway/secrets) を参照。

    これらのトークンはパスワードのように扱う。API キーとトークンは、シークレットが `openclaw.json` に入らないように、設定ファイルではなく env vars/`fly secrets` を優先する。

  </Step>

  <Step title="デプロイする">
    ```bash
    fly deploy
    ```

    初回デプロイでは Docker イメージがビルドされる。デプロイ後に確認する:

    ```bash
    fly status
    fly logs
    ```

    HTTP/WebSocket リスナーが起動すると、Gateway 起動ログに `gateway ready` が出力される。Fly 独自のヘルスチェックは `fly.toml` に従って `internal_port = 3000` を監視する。さらに、イメージの Docker `HEALTHCHECK` ディレクティブはデフォルトポート 18789 の `/healthz` をポーリングするが、このデプロイでは Gateway を `--port 3000` に上書きしているため使用されない。

  </Step>

  <Step title="設定ファイルを作成する">
    マシンに SSH で入り、適切な設定を作成する:

    ```bash
    fly ssh console
    ```

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

    `OPENCLAW_STATE_DIR=/data` の場合、設定パスは `/data/openclaw.json`。

    `https://my-openclaw.fly.dev` を実際の Fly アプリのオリジンに置き換える。Gateway 起動時には、設定が存在する前の初回起動を進められるように、ランタイムの `--bind` と `--port` 値からローカル Control UI オリジンがシードされる。ただし、Fly 経由でブラウザアクセスするには、正確な HTTPS オリジンを `gateway.controlUi.allowedOrigins` に列挙する必要がある。

    Discord トークンは次のいずれかから取得できる:

    - 環境変数 `DISCORD_BOT_TOKEN`（シークレットには推奨）。設定に追加する必要はなく、Gateway が自動的に読み取る
    - 設定ファイル `channels.discord.token`

    再起動して適用する:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway にアクセスする">
    ### Control UI

    ```bash
    fly open
    ```

    または `https://my-openclaw.fly.dev/` にアクセスする。

    設定済みの共有シークレットで認証する: `OPENCLAW_GATEWAY_TOKEN` の Gateway トークン、または password auth に切り替えた場合はそのパスワード。

    ### ログ

    ```bash
    fly logs              # live logs
    fly logs --no-tail    # recent logs
    ```

    ### SSH コンソール

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## トラブルシューティング

### 「App is not listening on expected address」

Gateway が `0.0.0.0` ではなく `127.0.0.1` にバインドしている。

**修正:** `fly.toml` のプロセスコマンドに `--bind lan` を追加する。

### ヘルスチェック失敗 / connection refused

Fly が設定済みポートで Gateway に到達できない。

**修正:** `internal_port` が Gateway ポート（`--port 3000` または `OPENCLAW_GATEWAY_PORT=3000`）と一致していることを確認する。

### OOM / メモリ問題

コンテナが再起動し続ける、または kill される。兆候: `SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`、または無言の再起動。

**修正:** `fly.toml` でメモリを増やす:

```toml
[[vm]]
  memory = "2048mb"
```

または既存のマシンを更新する:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB は小さすぎる。1GB でも動作する場合はあるが、負荷がかかった場合や詳細ログを有効にした場合に OOM になることがある。2GB を推奨。

### Gateway ロックの問題

コンテナ再起動後に「already running」エラーで Gateway が起動を拒否する。

シングルインスタンスロックファイルは、永続 `/data` ボリューム上ではなく `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`（Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`）にあるため、通常は完全なコンテナ再起動でコンテナファイルシステムの残りと一緒に消える。ロックが残り（たとえばコンテナファイルシステムを保持する `fly machine restart`）、起動を妨げる場合は手動で削除する:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 設定が読み取られない

`--allow-unconfigured` は起動ガードを迂回するだけで、`/data/openclaw.json` を作成または修復しない。そのため、実際の設定が存在し、通常のローカル Gateway 起動のために `"gateway": { "mode": "local" }` が含まれていることを確認する。

設定が存在することを確認する:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH 経由で設定を書き込む

`fly ssh console -C` はシェルリダイレクトをサポートしない。設定ファイルを書き込むには:

```bash
# echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# or sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` はファイルがすでに存在する場合に失敗することがある。先に削除する:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状態が永続化されない

再起動後に認証プロファイル、チャネル/プロバイダー状態、またはセッションが失われる場合、状態ディレクトリがボリュームではなくコンテナファイルシステムに書き込まれている。

**修正:** `fly.toml` に `OPENCLAW_STATE_DIR=/data` が設定されていることを確認し、再デプロイする。

## 更新

```bash
git pull
fly deploy
fly status
fly logs
```

ここでは `git pull` + `fly deploy` が管理された手順になる。Dockerfile からイメージを再ビルドするため、CLI/Gateway バージョン、ベース OS イメージ、Dockerfile の変更がすべて一緒に更新される。実行中のコンテナ内での `openclaw update` は同じ操作ではない。イメージは Docker ビルド済みの `dist/` ツリーとして出荷され、検出対象となる `.git` チェックアウトも npm 管理のグローバルインストールも含まないため。VM スタイルのインストールでのそのフローについては [更新](/ja-JP/install/updating) を参照。

### マシンコマンドを更新する

完全な再デプロイなしで起動コマンドを変更するには:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# or with a memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

後で `fly deploy` すると、マシンコマンドは `fly.toml` にある内容へ戻る。再デプロイ後に手動変更を再適用する。

## プライベートデプロイ（強化済み）

デフォルトでは、Fly はパブリック IP を割り当てるため、Gateway は `https://your-app.fly.dev` で到達可能になり、インターネットスキャナー（Shodan、Censys など）から発見可能になる。

**パブリック IP なし** の強化済みデプロイには `deploy/fly.private.toml` を使用する。これは `[http_service]` を省略するため、パブリック ingress は割り当てられない。

### プライベートデプロイを使用する場合

- アウトバウンドの呼び出し/メッセージのみ（インバウンド Webhook なし）
- ngrok または Tailscale トンネルが Webhook コールバックを処理する
- Gateway アクセスはブラウザではなく SSH、プロキシ、または WireGuard 経由
- デプロイをインターネットスキャナーから隠したい

### セットアップ

```bash
fly deploy -c deploy/fly.private.toml
```

または既存のデプロイを変換する:

```bash
# list current IPs
fly ips list -a my-openclaw

# release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# switch to the private config so future deploys do not re-allocate public IPs
fly deploy -c deploy/fly.private.toml

# allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list` には `private` 型の IP だけが表示されるはずです。

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### プライベートデプロイへのアクセス

**オプション 1: ローカルプロキシ（最も簡単）**

```bash
fly proxy 3000:3000 -a my-openclaw
# open http://localhost:3000 in a browser
```

**オプション 2: WireGuard VPN**

```bash
fly wireguard create
# import to a WireGuard client, then access via internal IPv6
# example: http://[fdaa:x:x:x:x::x]:3000
```

**オプション 3: SSH のみ**

```bash
fly ssh console -a my-openclaw
```

### プライベートデプロイでの Webhook

公開せずに Webhook コールバック（Twilio、Telnyx など）を使う場合:

1. **ngrok トンネル**: コンテナ内、またはサイドカーとして ngrok を実行する
2. **Tailscale Funnel**: Tailscale 経由で特定のパスを公開する
3. **アウトバウンドのみ**: 一部のプロバイダー（Twilio）は Webhook なしでアウトバウンド通話に対応します

`plugins.entries.voice-call.config` 配下の ngrok を使った音声通話設定例:

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

ngrok トンネルはコンテナ内で動作し、Fly アプリ自体を公開せずに公開 Webhook URL を提供します。転送されたホストヘッダーが受け入れられるように、`webhookSecurity.allowedHosts` をトンネルのホスト名に設定してください。

### セキュリティ上のトレードオフ

| 観点              | 公開         | プライベート |
| ----------------- | ------------ | ------------ |
| インターネットスキャナー | 発見可能     | 非表示       |
| 直接攻撃          | 可能         | ブロック     |
| Control UI アクセス | ブラウザー   | プロキシ/VPN |
| Webhook 配信      | 直接         | トンネル経由 |

## メモ

- Fly.io は x86 アーキテクチャを使用します。この Dockerfile は x86 と ARM の両方に対応しています。
- WhatsApp/Telegram のオンボーディングには、`fly ssh console` を使用します。
- 永続データは `/data` のボリューム上にあります。
- Signal にはイメージ上に signal-cli（Java ベースの CLI）が必要です。カスタムイメージを使用し、メモリは 2GB 以上を維持してください。

## コスト

推奨設定（`shared-cpu-2x`、2GB RAM）では、使用量にもよりますが月額およそ $10-15 を想定してください。無料枠には一部のベースライン枠が含まれます。現在の料金は [Fly.io の料金](https://fly.io/docs/about/pricing/) を参照してください。

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- Gateway を設定する: [Gateway 設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ: [更新](/ja-JP/install/updating)

## 関連

- [インストール概要](/ja-JP/install)
- [Hetzner](/ja-JP/install/hetzner)
- [Docker](/ja-JP/install/docker)
- [VPS ホスティング](/ja-JP/vps)

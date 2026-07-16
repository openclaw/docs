---
read_when:
    - Fly.io への OpenClaw のデプロイ
    - Fly のボリューム、シークレット、初回実行設定のセットアップ
summary: 永続ストレージと HTTPS を使用して OpenClaw を Fly.io にデプロイする手順ガイド
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T11:41:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**目標:** 永続ストレージ、自動 HTTPS、Discord/チャンネルアクセスを備え、[Fly.io](https://fly.io) マシン上で動作する OpenClaw Gateway。

## 必要なもの

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) がインストール済み
- Fly.io アカウント（無料枠で利用可能）
- モデル認証: 選択したモデルプロバイダーの API キー
- チャンネル認証情報: Discord ボットトークン、Telegram トークンなど

## 初心者向けクイック手順

1. リポジトリをクローンし、`fly.toml` をカスタマイズ
2. アプリとボリュームを作成し、シークレットを設定
3. `fly deploy` でデプロイ
4. SSH で接続して設定を作成するか、Control UI を使用

<Steps>
  <Step title="Fly アプリを作成">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 任意の名前を選択
    fly apps create my-openclaw

    # 通常は 1GB で十分
    fly volumes create openclaw_data --size 1 --region iad
    ```

    現在地に近いリージョンを選択してください。一般的な選択肢: `lhr`（ロンドン）、`iad`（バージニア）、`sjc`（サンノゼ）。

  </Step>

  <Step title="fly.toml を設定">
    アプリ名と要件に合わせて `fly.toml` を編集します。リポジトリで管理されている `fly.toml` は以下に示す公開用テンプレートです。`deploy/fly.private.toml` は強化されたパブリック IP なしのバリアントです（[プライベートデプロイ](#private-deployment-hardened)を参照）。

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

    OpenClaw Docker イメージのエントリーポイントは `tini` で、デフォルトでは `node openclaw.mjs gateway` を実行します。Fly の `[processes]` は、`ENTRYPOINT` に触れることなく Docker の `CMD` を置き換えます（ここでは同じコンパイル済みエントリーポイントである `node dist/index.js gateway ...` を直接実行します）。そのため、プロセスは引き続き `tini` の下で実行されます。

    **主な設定:**

    | 設定                        | 理由                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly のプロキシが Gateway に到達できるよう `0.0.0.0` にバインドします                     |
    | `--allow-unconfigured`         | 設定ファイルなしで起動します（後から作成します）                        |
    | `internal_port = 3000`         | Fly のヘルスチェックのため、`--port 3000`（または `OPENCLAW_GATEWAY_PORT`）と一致させる必要があります |
    | `memory = "2048mb"`            | 512MB では小さすぎます。2GB を推奨します                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | 状態をボリュームに永続化します                                                |

  </Step>

  <Step title="シークレットを設定">
    ```bash
    # 必須: 非ループバックバインド用の Gateway 認証トークン
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # モデルプロバイダーの API キー
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # 任意: その他のプロバイダー
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # チャンネルトークン
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    非ループバックバインド（`--bind lan`）には、有効な Gateway 認証パスが必要です。この例では `OPENCLAW_GATEWAY_TOKEN` を使用しますが、`gateway.auth.password`、または正しく設定された非ループバックの信頼済みプロキシデプロイでも要件を満たします。SecretRef の契約については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

    これらのトークンはパスワードと同様に扱ってください。シークレットが `openclaw.json` に含まれないように、API キーとトークンには設定ファイルよりも環境変数/`fly secrets` を優先してください。

  </Step>

  <Step title="デプロイ">
    ```bash
    fly deploy
    ```

    最初のデプロイで Docker イメージがビルドされます。デプロイ後に確認します。

    ```bash
    fly status
    fly logs
    ```

    HTTP/WebSocket リスナーが起動すると、Gateway の起動ログに `gateway ready` が記録されます。Fly 自体のヘルスチェックは `fly.toml` に従って `internal_port = 3000` を監視します。イメージの Docker `HEALTHCHECK` ディレクティブは、さらにデフォルトポート 18789 の `/healthz` をポーリングしますが、このデプロイでは Gateway を `--port 3000` にオーバーライドしているため使用されません。

  </Step>

  <Step title="設定ファイルを作成">
    マシンに SSH 接続し、適切な設定を作成します。

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

    `OPENCLAW_STATE_DIR=/data` を使用する場合、設定パスは `/data/openclaw.json` です。

    `https://my-openclaw.fly.dev` を実際の Fly アプリのオリジンに置き換えてください。Gateway の起動時に、実行時の `--bind` と `--port` の値からローカル Control UI のオリジンが初期設定されるため、設定が存在しない初回起動でも続行できます。ただし、Fly 経由でブラウザからアクセスするには、`gateway.controlUi.allowedOrigins` に正確な HTTPS オリジンを指定する必要があります。

    Discord トークンは、次のいずれかから取得できます。

    - 環境変数 `DISCORD_BOT_TOKEN`（シークレットには推奨）。設定への追加は不要で、Gateway が自動的に読み取ります
    - 設定ファイル `channels.discord.token`

    再起動して適用します。

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway にアクセス">
    ### Control UI

    ```bash
    fly open
    ```

    または `https://my-openclaw.fly.dev/` にアクセスします。

    設定済みの共有シークレットで認証します。`OPENCLAW_GATEWAY_TOKEN` の Gateway トークン、またはパスワード認証に切り替えた場合はそのパスワードを使用します。

    ### ログ

    ```bash
    fly logs              # ライブログ
    fly logs --no-tail    # 最近のログ
    ```

    ### SSH コンソール

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## トラブルシューティング

### 「App is not listening on expected address」

Gateway が `0.0.0.0` ではなく `127.0.0.1` にバインドされています。

**修正:** `fly.toml` のプロセスコマンドに `--bind lan` を追加します。

### ヘルスチェックの失敗 / 接続拒否

Fly が設定済みポートの Gateway に到達できません。

**修正:** `internal_port` が Gateway のポート（`--port 3000` または `OPENCLAW_GATEWAY_PORT=3000`）と一致していることを確認します。

### OOM / メモリの問題

コンテナが再起動を繰り返すか、強制終了されています。兆候: `SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`、または通知なしの再起動。

**修正:** `fly.toml` でメモリを増やします。

```toml
[[vm]]
  memory = "2048mb"
```

または、既存のマシンを更新します。

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB では小さすぎます。1GB でも動作する場合がありますが、高負荷時や詳細ログの使用時に OOM が発生する可能性があります。2GB を推奨します。

### Gateway のロックに関する問題

コンテナの再起動後、Gateway が「already running」エラーで起動を拒否します。

実行時のロックファイルは `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
および `gateway.state.<hash>.lock`（Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`）にあり、永続 `/data` ボリューム上にはありません。そのため、
通常はコンテナを完全に再起動すると、コンテナファイルシステムの
残りの部分とともにロックファイルも消去されます。ロックが残存し（たとえば、コンテナファイルシステムを保持する
`fly machine restart` の場合）、起動を妨げている場合は、
手動で削除します。

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 設定が読み込まれない

`--allow-unconfigured` は起動ガードを回避するだけです。`/data/openclaw.json` の作成や修復は行わないため、実際の設定が存在し、通常のローカル Gateway 起動用に `"gateway": { "mode": "local" }` が含まれていることを確認してください。

設定が存在することを確認します。

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH 経由で設定を書き込む

`fly ssh console -C` はシェルリダイレクトをサポートしません。設定ファイルを書き込むには、次の手順を使用します。

```bash
# echo + tee（ローカルからリモートへパイプ）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# または sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

ファイルがすでに存在する場合、`fly sftp` は失敗することがあります。先に削除してください。

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状態が永続化されない

再起動後に認証プロファイル、チャンネル/プロバイダーの状態、またはセッションが失われる場合、状態ディレクトリはボリュームではなくコンテナファイルシステムに書き込まれています。

**修正:** `fly.toml` に `OPENCLAW_STATE_DIR=/data` が設定されていることを確認し、再デプロイします。

## 更新

```bash
git pull
fly deploy
fly status
fly logs
```

ここでは `git pull` + `fly deploy` が管理された手順です。Dockerfile からイメージを再ビルドするため、CLI/Gateway のバージョン、ベース OS イメージ、Dockerfile の変更がすべて同時に更新されます。実行中のコンテナ内での `openclaw update` は同じ操作ではありません。イメージは Docker でビルドされた `dist/` ツリーとして提供され、検出対象となる `.git` チェックアウトも npm 管理のグローバルインストールも存在しないためです。VM 形式のインストールでの手順については、[更新](/ja-JP/install/updating)を参照してください。

### マシンコマンドの更新

完全な再デプロイを行わずに起動コマンドを変更するには、次の手順を使用します。

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# またはメモリも増加
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

後で `fly deploy` を実行すると、マシンコマンドは `fly.toml` に記載された内容へ戻ります。再デプロイ後に手動変更を再適用してください。

## プライベートデプロイ（強化版）

デフォルトでは、Fly はパブリック IP を割り当てるため、Gateway は `https://your-app.fly.dev` で到達可能となり、インターネットスキャナー（Shodan、Censys など）から検出されます。

**パブリック IP なし**の強化されたデプロイには `deploy/fly.private.toml` を使用します。`[http_service]` が省略されるため、パブリックイングレスは割り当てられません。

### プライベートデプロイを使用する場合

- 送信通話/メッセージのみ（受信 Webhook なし）
- Webhook コールバックは ngrok または Tailscale トンネルで処理
- Gateway へのアクセスにはブラウザではなく SSH、プロキシ、または WireGuard を使用
- インターネットスキャナーからデプロイを隠す必要がある場合

### セットアップ

```bash
fly deploy -c deploy/fly.private.toml
```

または、既存のデプロイを変換します。

```bash
# 現在の IP を一覧表示
fly ips list -a my-openclaw

# パブリック IP を解放
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 今後のデプロイでパブリック IP が再割り当てされないよう、プライベート設定に切り替える
fly deploy -c deploy/fly.private.toml

# プライベート専用 IPv6 を割り当て
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list` には `private` タイプの IP のみが表示されます。

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### プライベートデプロイへのアクセス

**オプション 1：ローカルプロキシ（最も簡単）**

```bash
fly proxy 3000:3000 -a my-openclaw
# ブラウザーで http://localhost:3000 を開く
```

**オプション 2：WireGuard VPN**

```bash
fly wireguard create
# WireGuard クライアントにインポートし、内部 IPv6 経由でアクセスする
# 例：http://[fdaa:x:x:x:x::x]:3000
```

**オプション 3：SSH のみ**

```bash
fly ssh console -a my-openclaw
```

### プライベートデプロイでの Webhook

パブリックに公開せずに Webhook コールバック（Twilio、Telnyx など）を使用する場合：

1. **ngrok トンネル**：コンテナ内またはサイドカーとして ngrok を実行
2. **Tailscale Funnel**：Tailscale 経由で特定のパスを公開
3. **送信のみ**：一部のプロバイダー（Twilio）は、Webhook なしで発信通話を利用可能

`plugins.entries.voice-call.config` 配下での ngrok を使用した音声通話設定例：

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

ngrok トンネルはコンテナ内で実行され、Fly アプリ自体を公開せずにパブリック Webhook URL を提供します。転送されたホストヘッダーが受け入れられるよう、`webhookSecurity.allowedHosts` をトンネルのホスト名に設定します。

### セキュリティ上のトレードオフ

| 側面                  | パブリック       | プライベート     |
| --------------------- | ---------------- | ---------------- |
| インターネットスキャナー | 検出可能         | 非公開           |
| 直接攻撃              | 可能             | ブロック         |
| Control UI へのアクセス | ブラウザー       | プロキシ/VPN     |
| Webhook の配信        | 直接             | トンネル経由     |

## 注記

- Fly.io は x86 アーキテクチャを使用します。Dockerfile は x86 と ARM の両方に対応しています。
- WhatsApp/Telegram のオンボーディングには、`fly ssh console` を使用します。
- 永続データは `/data` のボリュームに保存されます。
- Signal では、イメージに signal-cli（Java ベースの CLI）が必要です。カスタムイメージを使用し、メモリを 2GB 以上に維持してください。

## コスト

推奨設定（`shared-cpu-2x`、2GB RAM）では、使用量に応じて月額約 $10-15 を見込んでください。無料枠で基本利用分の一部がカバーされます。現在の料金については、[Fly.io の料金](https://fly.io/docs/about/pricing/)を参照してください。

## 次のステップ

- メッセージングチャネルを設定：[チャネル](/ja-JP/channels)
- Gateway を設定：[Gateway の設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に維持：[更新](/ja-JP/install/updating)

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Hetzner](/ja-JP/install/hetzner)
- [Docker](/ja-JP/install/docker)
- [VPS ホスティング](/ja-JP/vps)

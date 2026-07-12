---
read_when:
    - Fly.io への OpenClaw のデプロイ
    - Fly のボリューム、シークレット、初回実行設定のセットアップ
summary: 永続ストレージと HTTPS を使用した OpenClaw の Fly.io への段階的なデプロイ手順
title: Fly.io
x-i18n:
    generated_at: "2026-07-11T22:19:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**目標:** 永続ストレージ、自動 HTTPS、Discord/チャンネルアクセスを備えた [Fly.io](https://fly.io) マシン上で OpenClaw Gateway を実行します。

## 必要なもの

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) がインストール済みであること
- Fly.io アカウント（無料枠で利用可能）
- モデル認証: 選択したモデルプロバイダーの API キー
- チャンネル認証情報: Discord ボットトークン、Telegram トークンなど

## 初心者向けクイック手順

1. リポジトリをクローンし、`fly.toml` をカスタマイズする
2. アプリとボリュームを作成し、シークレットを設定する
3. `fly deploy` でデプロイする
4. SSH で接続して設定を作成するか、Control UI を使用する

<Steps>
  <Step title="Fly アプリを作成する">
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

  <Step title="fly.toml を設定する">
    アプリ名と要件に合わせて `fly.toml` を編集します。リポジトリで管理されている `fly.toml` は、以下に示す公開用テンプレートです。`deploy/fly.private.toml` は、セキュリティを強化したパブリック IP なしのバリアントです（[プライベートデプロイ](#private-deployment-hardened)を参照）。

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

    OpenClaw Docker イメージのエントリーポイントは `tini` であり、デフォルトでは `node openclaw.mjs gateway` を実行します。Fly の `[processes]` は `ENTRYPOINT` に変更を加えずに Docker の `CMD` を置き換えます（ここでは、同じコンパイル済みエントリーポイントである `node dist/index.js gateway ...` を直接実行します）。そのため、プロセスは引き続き `tini` の配下で実行されます。

    **主要な設定:**

    | 設定                           | 理由                                                                                   |
    | ------------------------------ | -------------------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly のプロキシが Gateway に到達できるように `0.0.0.0` にバインドする                   |
    | `--allow-unconfigured`         | 設定ファイルなしで起動する（設定ファイルは後から作成する）                             |
    | `internal_port = 3000`         | Fly のヘルスチェック用に `--port 3000`（または `OPENCLAW_GATEWAY_PORT`）と一致させる必要がある |
    | `memory = "2048mb"`            | 512MB では少なすぎるため、2GB を推奨                                                   |
    | `OPENCLAW_STATE_DIR = "/data"` | ボリューム上に状態を永続化する                                                         |

  </Step>

  <Step title="シークレットを設定する">
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

    非ループバックバインド（`--bind lan`）には、有効な Gateway 認証経路が必要です。この例では `OPENCLAW_GATEWAY_TOKEN` を使用していますが、`gateway.auth.password`、または正しく設定された非ループバックの信頼済みプロキシデプロイでも要件を満たします。SecretRef の契約については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

    これらのトークンはパスワードと同様に扱ってください。シークレットが `openclaw.json` に保存されないよう、API キーとトークンには設定ファイルよりも環境変数/`fly secrets` を使用することを推奨します。

  </Step>

  <Step title="デプロイする">
    ```bash
    fly deploy
    ```

    初回のデプロイでは Docker イメージがビルドされます。デプロイ後に確認します。

    ```bash
    fly status
    fly logs
    ```

    HTTP/WebSocket リスナーが起動すると、Gateway の起動ログに `gateway ready` が出力されます。Fly 自体のヘルスチェックは、`fly.toml` に従って `internal_port = 3000` を監視します。イメージの Docker `HEALTHCHECK` ディレクティブは、さらにデフォルトポート 18789 の `/healthz` をポーリングしますが、このデプロイでは Gateway のポートを `--port 3000` で上書きしているため使用されません。

  </Step>

  <Step title="設定ファイルを作成する">
    適切な設定を作成するため、SSH でマシンに接続します。

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

    `OPENCLAW_STATE_DIR=/data` の場合、設定ファイルのパスは `/data/openclaw.json` です。

    `https://my-openclaw.fly.dev` を実際の Fly アプリのオリジンに置き換えてください。Gateway の起動時には、設定が存在しない初回起動でも処理を続行できるよう、実行時の `--bind` と `--port` の値からローカルの Control UI オリジンが初期設定されます。ただし、Fly 経由でブラウザーからアクセスするには、正確な HTTPS オリジンを `gateway.controlUi.allowedOrigins` に指定する必要があります。

    Discord トークンは、次のいずれかから取得できます。

    - 環境変数 `DISCORD_BOT_TOKEN`（シークレットにはこちらを推奨）。設定への追加は不要で、Gateway が自動的に読み取る
    - 設定ファイルの `channels.discord.token`

    適用するために再起動します。

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

    または、`https://my-openclaw.fly.dev/` にアクセスします。

    設定した共有シークレットで認証します。`OPENCLAW_GATEWAY_TOKEN` の Gateway トークン、またはパスワード認証に切り替えた場合はそのパスワードを使用します。

    ### ログ

    ```bash
    fly logs              # リアルタイムログ
    fly logs --no-tail    # 最近のログ
    ```

    ### SSH コンソール

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## トラブルシューティング

### 「アプリが想定されたアドレスでリッスンしていない」

Gateway が `0.0.0.0` ではなく `127.0.0.1` にバインドされています。

**修正:** `fly.toml` のプロセスコマンドに `--bind lan` を追加します。

### ヘルスチェックの失敗/接続拒否

Fly が設定されたポート上の Gateway に到達できません。

**修正:** `internal_port` が Gateway のポート（`--port 3000` または `OPENCLAW_GATEWAY_PORT=3000`）と一致していることを確認します。

### OOM/メモリの問題

コンテナが繰り返し再起動するか、強制終了されます。兆候: `SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`、またはログを伴わない再起動。

**修正:** `fly.toml` のメモリを増やします。

```toml
[[vm]]
  memory = "2048mb"
```

または、既存のマシンを更新します。

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB では少なすぎます。1GB でも動作する場合がありますが、高負荷時や詳細なログ出力を有効にした場合は OOM が発生する可能性があります。2GB を推奨します。

### Gateway のロックに関する問題

コンテナの再起動後、Gateway が「すでに実行中」というエラーで起動を拒否します。

単一インスタンス用のロックファイルは、永続化された `/data` ボリュームではなく `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`（Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`）にあります。そのため、通常はコンテナを完全に再起動すると、コンテナファイルシステムの残りの部分とともに削除されます。ロックが残り（たとえば、コンテナファイルシステムを保持する `fly machine restart` を実行した場合）、起動を妨げる場合は、手動で削除します。

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 設定が読み込まれない

`--allow-unconfigured` は起動時のガードを回避するだけです。`/data/openclaw.json` の作成や修復は行わないため、実際の設定が存在し、通常のローカル Gateway 起動用に `"gateway": { "mode": "local" }` が含まれていることを確認してください。

設定が存在することを確認します。

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH 経由で設定を書き込む

`fly ssh console -C` はシェルのリダイレクトをサポートしていません。設定ファイルを書き込むには、次の方法を使用します。

```bash
# echo + tee（ローカルからリモートへパイプ）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# または sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

ファイルがすでに存在する場合、`fly sftp` が失敗することがあります。先に削除してください。

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状態が永続化されない

再起動後に認証プロファイル、チャンネル/プロバイダーの状態、またはセッションが失われる場合、状態ディレクトリがボリュームではなくコンテナファイルシステムに書き込まれています。

**修正:** `fly.toml` に `OPENCLAW_STATE_DIR=/data` が設定されていることを確認し、再デプロイします。

## 更新

```bash
git pull
fly deploy
fly status
fly logs
```

ここでは、`git pull` + `fly deploy` が管理された更新手順です。Dockerfile からイメージを再ビルドするため、CLI/Gateway のバージョン、ベース OS イメージ、Dockerfile の変更がすべてまとめて更新されます。実行中のコンテナ内での `openclaw update` は同じ操作ではありません。このイメージは Docker でビルドされた `dist/` ツリーとして提供され、検出対象となる `.git` チェックアウトや npm 管理のグローバルインストールが存在しないためです。VM 形式のインストールにおける更新手順については、[更新](/ja-JP/install/updating)を参照してください。

### マシンのコマンドを更新する

完全な再デプロイを行わずに起動コマンドを変更するには、次を実行します。

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# またはメモリの増量も同時に行う
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

後で `fly deploy` を実行すると、マシンのコマンドは `fly.toml` に指定されている内容へリセットされます。再デプロイ後に手動の変更を再適用してください。

## プライベートデプロイ（セキュリティ強化）

デフォルトでは Fly がパブリック IP を割り当てるため、Gateway は `https://your-app.fly.dev` でアクセス可能になり、インターネットスキャナー（Shodan、Censys など）から検出されます。

**パブリック IP なし**のセキュリティを強化したデプロイには、`deploy/fly.private.toml` を使用します。この設定では `[http_service]` が省略されているため、パブリックな受信経路は割り当てられません。

### プライベートデプロイを使用する場合

- 外向きの呼び出し/メッセージのみを使用する（受信 Webhook は使用しない）
- ngrok または Tailscale トンネルで Webhook コールバックを処理する
- ブラウザーではなく、SSH、プロキシ、または WireGuard 経由で Gateway にアクセスする
- インターネットスキャナーからデプロイを隠す必要がある

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

# プライベート専用 IPv6 を割り当てる
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list` には `private` タイプの IP のみが表示されます。

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### プライベートデプロイへのアクセス

**オプション 1: ローカルプロキシ（最も簡単）**

```bash
fly proxy 3000:3000 -a my-openclaw
# ブラウザで http://localhost:3000 を開く
```

**オプション 2: WireGuard VPN**

```bash
fly wireguard create
# WireGuard クライアントにインポートし、内部 IPv6 経由でアクセスする
# 例: http://[fdaa:x:x:x:x::x]:3000
```

**オプション 3: SSH のみ**

```bash
fly ssh console -a my-openclaw
```

### プライベートデプロイでの Webhook

公開せずに Webhook コールバック（Twilio、Telnyx など）を使用する場合:

1. **ngrok トンネル**: コンテナ内またはサイドカーとして ngrok を実行
2. **Tailscale Funnel**: Tailscale 経由で特定のパスを公開
3. **送信のみ**: 一部のプロバイダー（Twilio）は、Webhook なしで発信通話を利用可能

`plugins.entries.voice-call.config` 配下での ngrok を使用した音声通話設定例:

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

ngrok トンネルはコンテナ内で実行され、Fly アプリ自体を公開することなく、公開 Webhook URL を提供します。転送されたホストヘッダーが受け入れられるように、`webhookSecurity.allowedHosts` をトンネルのホスト名に設定します。

### セキュリティ上のトレードオフ

| 項目                | 公開         | プライベート     |
| ----------------- | ------------ | ---------- |
| インターネットスキャナー | 検出可能      | 非表示       |
| 直接攻撃             | 可能         | ブロック済み   |
| Control UI へのアクセス | ブラウザ      | プロキシ/VPN  |
| Webhook の配信       | 直接         | トンネル経由   |

## 注記

- Fly.io は x86 アーキテクチャを使用します。Dockerfile は x86 と ARM の両方に対応しています。
- WhatsApp/Telegram のオンボーディングには、`fly ssh console` を使用します。
- 永続データは `/data` のボリュームに保存されます。
- Signal には、イメージ内に signal-cli（Java ベースの CLI）が必要です。カスタムイメージを使用し、メモリを 2GB 以上に設定してください。

## コスト

推奨設定（`shared-cpu-2x`、2GB RAM）の場合、使用量に応じて月額約 10～15 ドルを見込んでください。無料枠で基本使用量の一部がカバーされます。現在の料金については、[Fly.io の料金](https://fly.io/docs/about/pricing/)を参照してください。

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- Gateway を設定する: [Gateway の設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ: [更新](/ja-JP/install/updating)

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Hetzner](/ja-JP/install/hetzner)
- [Docker](/ja-JP/install/docker)
- [VPS ホスティング](/ja-JP/vps)

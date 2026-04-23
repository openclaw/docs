---
read_when:
    - Railway に OpenClaw をデプロイする
    - ブラウザベースの Control UI を備えたワンクリックのクラウドデプロイを利用したい場合
summary: ワンクリックテンプレートで Railway に OpenClaw をデプロイする
title: Railway
x-i18n:
    generated_at: "2026-04-23T14:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
---

# Railway

ワンクリックテンプレートで OpenClaw を Railway にデプロイし、Web の Control UI からアクセスします。
これは「サーバー上でターミナルを使わない」最も簡単な方法です。Railway が Gateway を実行してくれます。

## クイックチェックリスト（新規ユーザー向け）

1. **Deploy on Railway**（下記）をクリックします。
2. `/data` にマウントする **Volume** を追加します。
3. 必須の **Variables**（少なくとも `OPENCLAW_GATEWAY_PORT` と `OPENCLAW_GATEWAY_TOKEN`）を設定します。
4. ポート `8080` で **HTTP Proxy** を有効にします。
5. `https://<your-railway-domain>/openclaw` を開き、設定した共有 secret を使って接続します。このテンプレートではデフォルトで `OPENCLAW_GATEWAY_TOKEN` を使用します。これを password auth に置き換えた場合は、その password を使用してください。

## ワンクリックデプロイ

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

デプロイ後、公開 URL は **Railway → your service → Settings → Domains** で確認できます。

Railway は次のいずれかを提供します:

- 生成されたドメイン（多くの場合 `https://<something>.up.railway.app`）、または
- 接続したカスタムドメイン

その後、次を開きます:

- `https://<your-railway-domain>/openclaw` — Control UI

## 利用できるもの

- ホストされた OpenClaw Gateway + Control UI
- Railway Volume（`/data`）による永続ストレージ。これにより `openclaw.json`、
  agent ごとの `auth-profiles.json`、channel/provider の状態、sessions、および
  workspace が再デプロイ後も保持されます

## 必須の Railway 設定

### Public Networking

service の **HTTP Proxy** を有効にします。

- ポート: `8080`

### Volume（必須）

次にマウントされた volume を接続します:

- `/data`

### Variables

service に次の変数を設定します:

- `OPENCLAW_GATEWAY_PORT=8080`（必須 — Public Networking のポートと一致している必要があります）
- `OPENCLAW_GATEWAY_TOKEN`（必須。管理者用 secret として扱ってください）
- `OPENCLAW_STATE_DIR=/data/.openclaw`（推奨）
- `OPENCLAW_WORKSPACE_DIR=/data/workspace`（推奨）

## チャネルを接続する

チャネル設定手順については、`/openclaw` の Control UI を使用するか、Railway の shell 経由で `openclaw onboard` を実行してください:

- [Telegram](/ja-JP/channels/telegram)（最も手早い — bot token だけ）
- [Discord](/ja-JP/channels/discord)
- [All channels](/ja-JP/channels)

## バックアップと移行

state、config、auth profiles、および workspace をエクスポートします:

```bash
openclaw backup create
```

これにより、OpenClaw state と設定済み workspace を含む持ち運び可能なバックアップアーカイブが作成されます。詳細は [Backup](/ja-JP/cli/backup) を参照してください。

## 次のステップ

- メッセージング channels を設定する: [Channels](/ja-JP/channels)
- Gateway を設定する: [Gateway configuration](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ: [Updating](/ja-JP/install/updating)

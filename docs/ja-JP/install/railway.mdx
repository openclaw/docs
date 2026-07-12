---
read_when:
    - OpenClaw を Railway にデプロイする
    - ブラウザベースのコントロール UI を使用できる、ワンクリックのクラウドデプロイが必要な場合
summary: ワンクリックテンプレートで OpenClaw を Railway にデプロイする
title: Railway
x-i18n:
    generated_at: "2026-07-11T22:22:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Railway にワンクリックテンプレートで OpenClaw をデプロイし、Web Control UI からアクセスします。これは最も簡単な「サーバー上でターミナルを使わない」方法です。Railway が Gateway を実行します。

## ワンクリックデプロイ

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Railway にデプロイ
</a>

<Steps>
  <Step title="テンプレートをデプロイ">
    上の **Deploy on Railway** をクリックします。
  </Step>

<Step title="ボリュームを追加">
  `/data` にマウントするボリュームを接続します（状態を永続化するために必須）。
</Step>

  <Step title="変数を設定">
    サービスに必要な **Variables** を設定します。

    - `OPENCLAW_GATEWAY_PORT=8080`（必須 -- Public Networking のポートと一致させる必要があります）
    - `OPENCLAW_GATEWAY_TOKEN`（必須。管理者用シークレットとして扱ってください）
    - `OPENCLAW_STATE_DIR=/data/.openclaw`（推奨）
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace`（推奨）

  </Step>

<Step title="パブリックネットワークを有効化">
  **Public Networking** で、ポート `8080` のサービスに対して **HTTP Proxy** を有効にします。
</Step>

  <Step title="接続">
    **Railway -> your service -> Settings -> Domains** で公開 URL を確認します。生成されたドメイン（通常は `https://<something>.up.railway.app`）または接続したカスタムドメインのいずれかです。

    `https://<your-railway-domain>/openclaw` を開き、設定した共有シークレットを使用して接続します。テンプレートではデフォルトで `OPENCLAW_GATEWAY_TOKEN` を使用します。パスワード認証に変更した場合は、代わりにそのパスワードを使用してください。

  </Step>
</Steps>

## 利用できるもの

- ホストされた OpenClaw Gateway + Control UI
- Railway Volume（`/data`）による永続ストレージ。これにより、`openclaw.json`、エージェントごとの `auth-profiles.json`、チャネルおよびプロバイダーの状態、セッション、ワークスペースが再デプロイ後も維持されます

## チャネルを接続

`/openclaw` の Control UI を使用するか、Railway のシェルで `openclaw onboard` を実行して、チャネルのセットアップ手順を確認します。

- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)（最速 -- 必要なのはボットトークンのみ）
- [すべてのチャネル](/ja-JP/channels)

## バックアップと移行

状態、設定、認証プロファイル、ワークスペースをエクスポートします。

```bash
openclaw backup create
```

これにより、OpenClaw の状態と設定済みのワークスペースを含む、移行可能なバックアップアーカイブが作成されます。詳細は[バックアップ](/ja-JP/cli/backup)を参照してください。

## 次のステップ

- メッセージングチャネルをセットアップする：[チャネル](/ja-JP/channels)
- Gateway を設定する：[Gateway の設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ：[アップデート](/ja-JP/install/updating)

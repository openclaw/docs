---
read_when:
    - OpenClaw を Railway にデプロイする
    - ブラウザベースの Control UI を使って、ワンクリックでクラウドにデプロイしたい
summary: ワンクリックテンプレートで OpenClaw を Railway にデプロイする
title: Railway
x-i18n:
    generated_at: "2026-07-05T11:33:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Railway のワンクリックテンプレートで OpenClaw をデプロイし、Web Control UI からアクセスします。これは最も簡単な「サーバー上でターミナルを使わない」経路です。Railway が Gateway を実行します。

## ワンクリックデプロイ

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Railway にデプロイ
</a>

<Steps>
  <Step title="テンプレートをデプロイ">
    上の **Railway にデプロイ** をクリックします。
  </Step>

<Step title="ボリュームを追加">
  `/data` にマウントされたボリュームをアタッチします（永続状態に必要）。
</Step>

  <Step title="変数を設定">
    サービスに必要な **変数** を設定します。

    - `OPENCLAW_GATEWAY_PORT=8080`（必須 -- パブリックネットワーキングのポートと一致している必要があります）
    - `OPENCLAW_GATEWAY_TOKEN`（必須。管理者シークレットとして扱ってください）
    - `OPENCLAW_STATE_DIR=/data/.openclaw`（推奨）
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace`（推奨）

  </Step>

<Step title="パブリックネットワーキングを有効化">
  **パブリックネットワーキング** で、ポート `8080` のサービスに対して **HTTPプロキシ** を有効にします。
</Step>

  <Step title="接続">
    公開 URL は **Railway -> 自分のサービス -> 設定 -> ドメイン** で確認できます。生成されたドメイン（多くの場合 `https://<something>.up.railway.app`）またはアタッチしたカスタムドメインのいずれかです。

    `https://<your-railway-domain>/openclaw` を開き、設定済みの共有シークレットを使って接続します。テンプレートはデフォルトで `OPENCLAW_GATEWAY_TOKEN` を使用します。パスワード認証に置き換えた場合は、代わりにそのパスワードを使用してください。

  </Step>
</Steps>

## 得られるもの

- ホストされた OpenClaw Gateway + Control UI
- Railway ボリューム（`/data`）による永続ストレージ。これにより、`openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル/プロバイダー状態、セッション、ワークスペースが再デプロイ後も保持されます

## チャネルを接続する

チャネル設定手順には、`/openclaw` の Control UI を使用するか、Railway のシェル経由で `openclaw onboard` を実行します。

- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)（最速 -- ボットトークンだけで済みます）
- [すべてのチャネル](/ja-JP/channels)

## バックアップと移行

状態、設定、認証プロファイル、ワークスペースをエクスポートします。

```bash
openclaw backup create
```

これにより、OpenClaw の状態と設定済みワークスペースを含むポータブルなバックアップアーカイブが作成されます。詳細は [バックアップ](/ja-JP/cli/backup) を参照してください。

## 次のステップ

- メッセージングチャネルを設定する: [チャネル](/ja-JP/channels)
- Gateway を設定する: [Gateway 設定](/ja-JP/gateway/configuration)
- OpenClaw を最新の状態に保つ: [更新](/ja-JP/install/updating)

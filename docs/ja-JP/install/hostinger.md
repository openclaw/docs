---
read_when:
    - Hostinger での OpenClaw のセットアップ
    - OpenClaw向けのマネージドVPSを探す
    - Hostinger の 1-Click OpenClaw を使用する
summary: HostingerでOpenClawをホストする
title: Hostinger
x-i18n:
    generated_at: "2026-07-11T22:19:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Hostinger で永続的な OpenClaw Gateway を実行します。**1-Click** のマネージドデプロイ、または自分で管理する **VPS** インストールのいずれかを選択できます。

## 前提条件

- Hostinger アカウント（[登録](https://www.hostinger.com/openclaw)）
- 約5～10分

## オプション A：1-Click OpenClaw

Hostinger がインフラストラクチャ、Docker、自動更新を処理します。インスタンスを稼働させる最速の方法です。

<Steps>
  <Step title="購入して起動">
    1. [Hostinger OpenClaw ページ](https://www.hostinger.com/openclaw)で、Managed OpenClaw プランを選択し、購入手続きを完了します。

    <Note>
    購入手続き中に、事前購入済みで OpenClaw に即時統合される **Ready-to-Use AI** クレジットを選択できます。他のプロバイダーの外部アカウントや API キーは必要ありません。すぐにチャットを開始できます。または、セットアップ時に Anthropic、OpenAI、Google Gemini、xAI の独自キーを指定できます。
    </Note>

  </Step>

  <Step title="メッセージングチャネルを選択">
    接続するチャネルを1つ以上選択します。

    - **WhatsApp** -- セットアップウィザードに表示される QR コードをスキャンします。
    - **Telegram** -- [BotFather](https://t.me/BotFather) から取得したボットトークンを貼り付けます。

  </Step>

  <Step title="インストールを完了">
    **Finish** をクリックしてインスタンスをデプロイします。準備が完了したら、hPanel の **OpenClaw Overview** から OpenClaw ダッシュボードにアクセスします。
  </Step>

</Steps>

## オプション B：VPS 上の OpenClaw

サーバーをより細かく制御できます。Hostinger は VPS 上に Docker 経由で OpenClaw をデプロイします。hPanel の **Docker Manager** から管理します。

<Steps>
  <Step title="VPS を購入">
    1. [Hostinger OpenClaw ページ](https://www.hostinger.com/openclaw)で、OpenClaw on VPS プランを選択し、購入手続きを完了します。

    <Note>
    購入手続き中に **Ready-to-Use AI** クレジットを選択できます。これは事前購入済みで OpenClaw に即時統合されるため、他のプロバイダーの外部アカウントや API キーを用意せずにチャットを開始できます。
    </Note>

  </Step>

  <Step title="OpenClaw を設定">
    VPS のプロビジョニングが完了したら、設定フィールドに入力します。

    - **Gateway token** -- 自動生成されます。後で使用するために保存してください。
    - **WhatsApp number** -- 国番号を含む電話番号（任意）。
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather) から取得します（任意）。
    - **API keys** -- 購入手続き中に Ready-to-Use AI クレジットを選択しなかった場合にのみ必要です。

  </Step>

  <Step title="OpenClaw を起動">
    **Deploy** をクリックします。起動したら、hPanel で **Open** をクリックして OpenClaw ダッシュボードを開きます。
  </Step>

</Steps>

ログの確認、再起動、更新は、hPanel の Docker Manager インターフェースから実行します。更新するには、Docker Manager で **Update** を押して最新のイメージを取得します。

## セットアップを確認

接続したチャネルでアシスタントに「Hi」と送信します。OpenClaw が応答し、初期設定の手順を案内します。

## トラブルシューティング

**ダッシュボードが読み込まれない** -- コンテナのプロビジョニングが完了するまで数分待ってから、hPanel の Docker Manager ログを確認します。

**Docker コンテナが再起動を繰り返す** -- Docker Manager のログを開き、設定エラー（トークンの欠落、無効な API キー）がないか確認します。

**Telegram ボットが応答しない** -- DM のペアリングが必要な場合、不明な送信者には返信の代わりに短いペアリングコードが送られます。OpenClaw ダッシュボードのチャットから承認するか、コンテナへのシェルアクセスがある場合は `openclaw pairing approve telegram <CODE>` で承認します。[ペアリング](/ja-JP/channels/pairing)を参照してください。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続
- [Gateway の設定](/ja-JP/gateway/configuration) -- すべての設定オプション

## 関連項目

- [インストールの概要](/ja-JP/install)
- [VPS ホスティング](/ja-JP/vps)
- [DigitalOcean](/ja-JP/install/digitalocean)

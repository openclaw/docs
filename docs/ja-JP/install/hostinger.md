---
read_when:
    - Hostinger で OpenClaw をセットアップする
    - OpenClaw 用のマネージド VPS を探す
    - Hostinger 1-Click OpenClaw を使用する
summary: Hostinger で OpenClaw をホストする
title: Hostinger
x-i18n:
    generated_at: "2026-07-05T11:26:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

永続的な OpenClaw Gateway を [Hostinger](https://www.hostinger.com/openclaw) で実行します。**1クリック** のマネージドデプロイとして実行するか、自分で管理する **VPS** インストールとして実行できます。

## 前提条件

- Hostinger アカウント（[登録](https://www.hostinger.com/openclaw)）
- 約 5〜10 分

## オプション A: 1クリック OpenClaw

Hostinger がインフラ、Docker、自動更新を処理します。実行中のインスタンスまでの最速の方法です。

<Steps>
  <Step title="購入して起動">
    1. [Hostinger OpenClaw ページ](https://www.hostinger.com/openclaw)から、マネージド OpenClaw プランを選択してチェックアウトを完了します。

    <Note>
    チェックアウト中に、事前購入済みで OpenClaw 内に即座に統合される **すぐに使える AI** クレジットを選択できます。他のプロバイダーの外部アカウントや API キーは不要です。すぐにチャットを開始できます。別の方法として、セットアップ中に Anthropic、OpenAI、Google Gemini、または xAI の独自キーを指定することもできます。
    </Note>

  </Step>

  <Step title="メッセージングチャネルを選択">
    接続するチャネルを 1 つ以上選択します。

    - **WhatsApp** -- セットアップウィザードに表示される QR コードをスキャンします。
    - **Telegram** -- [BotFather](https://t.me/BotFather) から取得したボットトークンを貼り付けます。

  </Step>

  <Step title="インストールを完了">
    **完了** をクリックしてインスタンスをデプロイします。準備ができたら、hPanel の **OpenClaw 概要** から OpenClaw ダッシュボードにアクセスします。
  </Step>

</Steps>

## オプション B: VPS 上の OpenClaw

サーバーをより細かく制御できます。Hostinger は VPS 上に Docker 経由で OpenClaw をデプロイします。hPanel の **Docker Manager** で管理します。

<Steps>
  <Step title="VPS を購入">
    1. [Hostinger OpenClaw ページ](https://www.hostinger.com/openclaw)から、VPS 上の OpenClaw プランを選択してチェックアウトを完了します。

    <Note>
    チェックアウト中に **すぐに使える AI** クレジットを選択できます。これらは事前購入済みで OpenClaw 内に即座に統合されるため、他のプロバイダーの外部アカウントや API キーなしでチャットを開始できます。
    </Note>

  </Step>

  <Step title="OpenClaw を構成">
    VPS がプロビジョニングされたら、構成フィールドに入力します。

    - **Gateway トークン** -- 自動生成されます。後で使用するために保存してください。
    - **WhatsApp 番号** -- 国番号付きの自分の番号（任意）。
    - **Telegram ボットトークン** -- [BotFather](https://t.me/BotFather) から取得します（任意）。
    - **API キー** -- チェックアウト中にすぐに使える AI クレジットを選択しなかった場合にのみ必要です。

  </Step>

  <Step title="OpenClaw を開始">
    **デプロイ** をクリックします。実行されたら、hPanel で **開く** をクリックして OpenClaw ダッシュボードを開きます。
  </Step>

</Steps>

ログ、再起動、更新は hPanel の Docker Manager インターフェイスから実行します。更新するには、Docker Manager で **更新** を押して最新イメージを取得します。

## セットアップを確認

接続したチャネルでアシスタントに「こんにちは」と送信します。OpenClaw が返信し、初期設定を案内します。

## トラブルシューティング

**ダッシュボードが読み込まれない** -- コンテナのプロビジョニングが完了するまで数分待ってから、hPanel の Docker Manager ログを確認してください。

**Docker コンテナが再起動を繰り返す** -- Docker Manager ログを開き、構成エラー（不足しているトークン、無効な API キー）を探してください。

**Telegram ボットが応答しない** -- DM ペアリングが必要な場合、不明な送信者には返信の代わりに短いペアリングコードが送られます。OpenClaw ダッシュボードチャットから承認するか、コンテナへのシェルアクセスがある場合は `openclaw pairing approve telegram <CODE>` で承認します。[ペアリング](/ja-JP/channels/pairing)を参照してください。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続
- [Gateway 構成](/ja-JP/gateway/configuration) -- すべての構成オプション

## 関連

- [インストール概要](/ja-JP/install)
- [VPS ホスティング](/ja-JP/vps)
- [DigitalOcean](/ja-JP/install/digitalocean)

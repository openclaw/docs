---
read_when:
    - HostingerでOpenClawをセットアップする
    - OpenClaw向けのマネージドVPSを探す
    - Hostingerの1-Click OpenClawを使う
summary: HostingerでOpenClawをホストする
title: Hostinger
x-i18n:
    generated_at: "2026-04-14T02:08:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf173cdcf6344f8ee22e839a27f4e063a3a102186f9acc07c4a33d4794e2c034
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

**1-Click**マネージドデプロイまたは**VPS**インストールで、[Hostinger](https://www.hostinger.com/openclaw)上に永続的なOpenClaw Gatewayを実行します。

## 前提条件

- Hostingerアカウント（[signup](https://www.hostinger.com/openclaw)）
- 約5〜10分

## オプションA: 1-Click OpenClaw

最も早く始められる方法です。インフラ、Docker、自動更新はHostingerが管理します。

<Steps>
  <Step title="購入して起動する">
    1. [Hostinger OpenClawページ](https://www.hostinger.com/openclaw)でManaged OpenClawプランを選び、購入手続きを完了します。

    <Note>
    購入手続き中に、事前購入されてOpenClaw内ですぐに統合される**Ready-to-Use AI**クレジットを選択できます。ほかのプロバイダーの外部アカウントやAPIキーは不要です。すぐにチャットを開始できます。代わりに、セットアップ時にAnthropic、OpenAI、Google Gemini、またはxAIの独自キーを指定することもできます。
    </Note>

  </Step>

  <Step title="メッセージングチャネルを選択する">
    接続するチャネルを1つ以上選択します。

    - **WhatsApp** -- セットアップウィザードに表示されるQRコードをスキャンします。
    - **Telegram** -- [BotFather](https://t.me/BotFather)のボットトークンを貼り付けます。

  </Step>

  <Step title="インストールを完了する">
    **Finish**をクリックしてインスタンスをデプロイします。準備ができたら、hPanelの**OpenClaw Overview**からOpenClawダッシュボードにアクセスします。
  </Step>

</Steps>

## オプションB: VPS上のOpenClaw

サーバーをより細かく制御できます。HostingerがVPS上でDocker経由でOpenClawをデプロイし、hPanelの**Docker Manager**から管理します。

<Steps>
  <Step title="VPSを購入する">
    1. [Hostinger OpenClawページ](https://www.hostinger.com/openclaw)でOpenClaw on VPSプランを選び、購入手続きを完了します。

    <Note>
    購入手続き中に**Ready-to-Use AI**クレジットを選択できます。これは事前購入されてOpenClaw内ですぐに統合されるため、ほかのプロバイダーの外部アカウントやAPIキーなしでチャットを開始できます。
    </Note>

  </Step>

  <Step title="OpenClawを設定する">
    VPSのプロビジョニングが完了したら、設定項目を入力します。

    - **Gateway token** -- 自動生成されます。後で使うために保存してください。
    - **WhatsApp number** -- 国番号を含むあなたの番号（任意）。
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather)から取得したもの（任意）。
    - **API keys** -- 購入手続き中にReady-to-Use AIクレジットを選択しなかった場合にのみ必要です。

  </Step>

  <Step title="OpenClawを起動する">
    **Deploy**をクリックします。起動したら、hPanelで**Open**をクリックしてOpenClawダッシュボードを開きます。
  </Step>

</Steps>

ログ、再起動、更新はすべてhPanelのDocker Managerインターフェースから直接管理します。更新するには、Docker Managerで**Update**を押すと最新イメージが取得されます。

## セットアップを確認する

接続したチャネルで、あなたのアシスタントに「Hi」と送信します。OpenClawが返信し、初期設定を案内します。

## トラブルシューティング

**ダッシュボードが読み込まれない** -- コンテナのプロビジョニングが完了するまで数分待ってください。hPanelでDocker Managerのログを確認します。

**Dockerコンテナが再起動を繰り返す** -- Docker Managerのログを開き、設定エラー（トークン不足、無効なAPIキー）を確認します。

**Telegramボットが応答しない** -- 接続を完了するために、TelegramからのペアリングコードメッセージをOpenClawチャット内に直接メッセージとして送信してください。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discordなどを接続する
- [Gateway設定](/ja-JP/gateway/configuration) -- すべての設定オプション

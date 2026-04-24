---
read_when:
    - HostingerでOpenClawをセットアップする
    - OpenClaw向けのマネージドVPSを探している
    - Hostingerの1クリックOpenClawを使う
summary: HostingerでOpenClawをホストする
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T05:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
---

[Hostinger](https://www.hostinger.com/openclaw) 上で、**1クリック**のマネージドデプロイ、または **VPS** インストールを使って、永続的なOpenClaw Gatewayを実行します。

## 前提条件

- Hostingerアカウント（[signup](https://www.hostinger.com/openclaw)）
- 約5〜10分

## オプションA: 1クリックOpenClaw

最も素早く始める方法です。Hostingerがインフラ、Docker、自動更新を処理します。

<Steps>
  <Step title="購入して起動する">
    1. [Hostinger OpenClawページ](https://www.hostinger.com/openclaw) で、Managed OpenClawプランを選択し、購入手続きを完了します。

    <Note>
    購入時に、事前購入済みでOpenClaw内に即座に統合される **Ready-to-Use AI** クレジットを選べます。外部アカウントや他プロバイダのAPIキーは不要で、すぐにチャットを始められます。あるいは、セットアップ中にAnthropic、OpenAI、Google Gemini、xAIの自分のキーを指定することもできます。
    </Note>

  </Step>

  <Step title="メッセージングチャネルを選ぶ">
    接続するチャネルを1つ以上選択します:

    - **WhatsApp** -- セットアップウィザードに表示されるQRコードをスキャンします。
    - **Telegram** -- [BotFather](https://t.me/BotFather) から取得したボットトークンを貼り付けます。

  </Step>

  <Step title="インストールを完了する">
    **Finish** をクリックしてインスタンスをデプロイします。準備ができたら、hPanel の **OpenClaw Overview** からOpenClawダッシュボードにアクセスします。
  </Step>

</Steps>

## オプションB: VPS上のOpenClaw

サーバーをより細かく制御できます。HostingerはあなたのVPS上にDocker経由でOpenClawをデプロイし、hPanel の **Docker Manager** から管理します。

<Steps>
  <Step title="VPSを購入する">
    1. [Hostinger OpenClawページ](https://www.hostinger.com/openclaw) で、OpenClaw on VPSプランを選択し、購入手続きを完了します。

    <Note>
    購入時に **Ready-to-Use AI** クレジットを選択できます。これは事前購入済みでOpenClaw内に即時統合されるため、外部アカウントや他プロバイダのAPIキーなしでチャットを始められます。
    </Note>

  </Step>

  <Step title="OpenClawを設定する">
    VPSのプロビジョニング後、設定項目を入力します:

    - **Gateway token** -- 自動生成されます。後で使うので保存してください。
    - **WhatsApp number** -- 国番号付きのあなたの番号（任意）。
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather) から取得（任意）。
    - **API keys** -- 購入時にReady-to-Use AIクレジットを選択しなかった場合のみ必要です。

  </Step>

  <Step title="OpenClawを起動する">
    **Deploy** をクリックします。起動したら、hPanel で **Open** をクリックしてOpenClawダッシュボードを開きます。
  </Step>

</Steps>

ログ、再起動、更新は、hPanel のDocker Managerインターフェースから直接管理します。更新するには、Docker Managerの **Update** を押すと最新イメージがpullされます。

## セットアップを確認する

接続したチャネルで、アシスタントに「Hi」と送ってください。OpenClawが返信し、初期設定について案内します。

## トラブルシューティング

**ダッシュボードが読み込まれない** -- コンテナのプロビジョニング完了まで数分待ってください。hPanelのDocker Managerログを確認してください。

**Dockerコンテナが再起動を繰り返す** -- Docker Managerログを開き、設定エラー（トークン不足、無効なAPIキー）がないか確認してください。

**Telegramボットが応答しない** -- 接続を完了するため、Telegramからペアリングコードメッセージを、OpenClawチャット内に直接メッセージとして送ってください。

## 次のステップ

- [Channels](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway設定](/ja-JP/gateway/configuration) -- すべての設定オプション

## 関連

- [インストール概要](/ja-JP/install)
- [VPSホスティング](/ja-JP/vps)
- [DigitalOcean](/ja-JP/install/digitalocean)

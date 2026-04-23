---
read_when:
    - Hostinger で OpenClaw をセットアップする
    - OpenClaw 向けのマネージド VPS を探している場合
    - Hostinger の 1-Click OpenClaw を使う
summary: Hostinger で OpenClaw をホストする
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T14:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

[Hostinger](https://www.hostinger.com/openclaw) で、**1-Click** のマネージドデプロイまたは **VPS** インストールにより、永続的な OpenClaw Gateway を実行できます。

## 前提条件

- Hostinger アカウント（[signup](https://www.hostinger.com/openclaw)）
- 約 5〜10 分

## Option A: 1-Click OpenClaw

最も早く開始できる方法です。インフラ、Docker、自動更新は Hostinger が処理します。

<Steps>
  <Step title="購入して起動する">
    1. [Hostinger OpenClaw ページ](https://www.hostinger.com/openclaw) で、Managed OpenClaw プランを選び、チェックアウトを完了します。

    <Note>
    チェックアウト時に、事前購入済みで OpenClaw 内に即時統合される **Ready-to-Use AI** クレジットを選択できます。他の provider の外部アカウントや API キーは不要です。すぐにチャットを始められます。あるいは、セットアップ中に Anthropic、OpenAI、Google Gemini、xAI の自分のキーを指定することもできます。
    </Note>

  </Step>

  <Step title="メッセージングチャネルを選択する">
    接続するチャネルを 1 つ以上選択します。

    - **WhatsApp** -- セットアップウィザードに表示される QR コードをスキャンします。
    - **Telegram** -- [BotFather](https://t.me/BotFather) のボットトークンを貼り付けます。

  </Step>

  <Step title="インストールを完了する">
    **Finish** をクリックしてインスタンスをデプロイします。準備ができたら、hPanel の **OpenClaw Overview** から OpenClaw ダッシュボードにアクセスします。
  </Step>

</Steps>

## Option B: VPS 上の OpenClaw

サーバーをより細かく制御できます。Hostinger は VPS 上に Docker 経由で OpenClaw をデプロイし、あなたは hPanel の **Docker Manager** で管理します。

<Steps>
  <Step title="VPS を購入する">
    1. [Hostinger OpenClaw ページ](https://www.hostinger.com/openclaw) で、OpenClaw on VPS プランを選び、チェックアウトを完了します。

    <Note>
    チェックアウト時に **Ready-to-Use AI** クレジットを選択できます。これらは事前購入済みで OpenClaw に即時統合されるため、他の provider の外部アカウントや API キーなしでチャットを開始できます。
    </Note>

  </Step>

  <Step title="OpenClaw を設定する">
    VPS のプロビジョニング後、設定フィールドに入力します。

    - **Gateway token** -- 自動生成されます。後で使うため保存してください。
    - **WhatsApp number** -- 国番号付きのあなたの電話番号（任意）。
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather) から取得（任意）。
    - **API keys** -- チェックアウト時に Ready-to-Use AI クレジットを選択しなかった場合にのみ必要です。

  </Step>

  <Step title="OpenClaw を起動する">
    **Deploy** をクリックします。起動後、hPanel で **Open** をクリックして OpenClaw ダッシュボードを開きます。
  </Step>

</Steps>

ログ、再起動、更新はすべて hPanel の Docker Manager インターフェースから直接管理されます。更新するには、Docker Manager の **Update** を押すと最新イメージが取得されます。

## セットアップの確認

接続したチャネルでアシスタントに「Hi」と送ってください。OpenClaw が応答し、初期設定を案内します。

## トラブルシューティング

**ダッシュボードが読み込まれない** -- コンテナのプロビジョニング完了まで数分待ってください。hPanel の Docker Manager ログを確認してください。

**Docker コンテナが再起動を繰り返す** -- Docker Manager ログを開き、設定エラー（トークン不足、無効な API キー）を確認してください。

**Telegram ボットが応答しない** -- 接続を完了するため、Telegram からペアリングコードメッセージを OpenClaw チャット内に直接メッセージとして送信してください。

## 次のステップ

- [チャネル](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続
- [Gateway の設定](/ja-JP/gateway/configuration) -- すべての設定オプション

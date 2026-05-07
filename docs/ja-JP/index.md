---
read_when:
    - 新規ユーザーにOpenClawを紹介する
summary: OpenClaw は、あらゆる OS で動作する AI エージェント向けのマルチチャネルGatewayです。
title: OpenClaw
x-i18n:
    generated_at: "2026-05-07T13:20:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bf82c8551703257e55289d2b82f6436c9900a8afae7ab9b6a655332716ff37b
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _「EXFOLIATE! EXFOLIATE!」_ — たぶん宇宙ロブスター

<p align="center">
  <strong>Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo などを横断してAIエージェントを利用するための、任意のOSで動く Gateway。</strong><br />
  メッセージを送ると、ポケットの中からエージェントの応答を受け取れます。組み込みチャネル、同梱チャネル Plugin、WebChat、モバイルノードをまたいで、1つの Gateway を実行します。
</p>

<Columns>
  <Card title="開始する" href="/ja-JP/start/getting-started" icon="rocket">
    OpenClaw をインストールし、数分で Gateway を起動します。
  </Card>
  <Card title="オンボーディングを実行" href="/ja-JP/start/wizard" icon="sparkles">
    `openclaw onboard` とペアリングフローによるガイド付きセットアップ。
  </Card>
  <Card title="コントロールUIを開く" href="/ja-JP/web/control-ui" icon="layout-dashboard">
    チャット、設定、セッション用のブラウザダッシュボードを起動します。
  </Card>
</Columns>

## OpenClaw とは？

OpenClaw は、好みのチャットアプリやチャネルサーフェス（組み込みチャネルに加え、Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo などの同梱または外部チャネル Plugin）を、Pi のようなAIコーディングエージェントにつなぐ **セルフホスト型 Gateway** です。自分のマシン（またはサーバー）で単一の Gateway プロセスを実行すると、それがメッセージングアプリと常時利用可能なAIアシスタントの橋渡しになります。

**誰向けですか？** データの制御を手放したりホスト型サービスに依存したりせずに、どこからでもメッセージを送れる個人用AIアシスタントが欲しい開発者とパワーユーザー向けです。

**何が違いますか？**

- **セルフホスト型**: 自分のハードウェア上で、自分のルールで動作
- **マルチチャネル**: 1つの Gateway が組み込みチャネルに加え、同梱または外部チャネル Plugin を同時に提供
- **エージェントネイティブ**: ツール利用、セッション、メモリ、マルチエージェントルーティングを備えたコーディングエージェント向けに構築
- **オープンソース**: MITライセンス、コミュニティ主導

**何が必要ですか？** Node 24（推奨）、または互換性のための Node 22 LTS (`22.16+`)、選択したプロバイダーのAPIキー、そして5分です。品質とセキュリティを最良にするには、利用可能な最新世代の最も強力なモデルを使用してください。

## 仕組み

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["Pi agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

Gateway は、セッション、ルーティング、チャネル接続における唯一の信頼できる情報源です。

## 主な機能

<Columns>
  <Card title="マルチチャネル Gateway" icon="network" href="/ja-JP/channels">
    Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat などを単一の Gateway プロセスで利用できます。
  </Card>
  <Card title="Plugin チャネル" icon="plug" href="/ja-JP/tools/plugin">
    同梱 Plugin は、通常の現在リリースで Matrix、Nostr、Twitch、Zalo などを追加します。
  </Card>
  <Card title="マルチエージェントルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    エージェント、ワークスペース、送信者ごとの分離されたセッション。
  </Card>
  <Card title="メディアサポート" icon="image" href="/ja-JP/nodes/images">
    画像、音声、ドキュメントを送受信します。
  </Card>
  <Card title="Web コントロールUI" icon="monitor" href="/ja-JP/web/control-ui">
    チャット、設定、セッション、ノード用のブラウザダッシュボード。
  </Card>
  <Card title="モバイルノード" icon="smartphone" href="/ja-JP/nodes">
    Canvas、カメラ、音声対応ワークフロー向けに iOS と Android のノードをペアリングします。
  </Card>
</Columns>

## クイックスタート

<Steps>
  <Step title="OpenClaw をインストール">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="オンボーディングしてサービスをインストール">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="チャット">
    ブラウザでコントロールUIを開き、メッセージを送信します。

    ```bash
    openclaw dashboard
    ```

    またはチャネル（[Telegram](/ja-JP/channels/telegram) が最速）を接続して、スマートフォンからチャットします。

  </Step>
</Steps>

完全なインストール手順と開発セットアップが必要ですか？[はじめに](/ja-JP/start/getting-started) を参照してください。

## ダッシュボード

Gateway の起動後にブラウザのコントロールUIを開きます。

- ローカルのデフォルト: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- リモートアクセス: [Webサーフェス](/ja-JP/web) と [Tailscale](/ja-JP/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 設定（任意）

設定は `~/.openclaw/openclaw.json` にあります。

- **何もしない**場合、OpenClaw は同梱の Pi バイナリをRPCモードで使用し、送信者ごとのセッションを使います。
- 制限を強めたい場合は、`channels.whatsapp.allowFrom` と（グループの場合は）メンションルールから始めます。

例:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## ここから始める

<Columns>
  <Card title="ドキュメントハブ" href="/ja-JP/start/hubs" icon="book-open">
    すべてのドキュメントとガイドを、ユースケース別に整理しています。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="settings">
    コア Gateway 設定、トークン、プロバイダー設定。
  </Card>
  <Card title="リモートアクセス" href="/ja-JP/gateway/remote" icon="globe">
    SSH と tailnet のアクセスパターン。
  </Card>
  <Card title="チャネル" href="/ja-JP/channels/telegram" icon="message-square">
    Feishu、Microsoft Teams、WhatsApp、Telegram、Discord などのチャネル固有セットアップ。
  </Card>
  <Card title="ノード" href="/ja-JP/nodes" icon="smartphone">
    ペアリング、Canvas、カメラ、デバイスアクションに対応した iOS と Android のノード。
  </Card>
  <Card title="ヘルプ" href="/ja-JP/help" icon="life-buoy">
    よくある修正とトラブルシューティングの入口。
  </Card>
</Columns>

## さらに学ぶ

<Columns>
  <Card title="完全な機能一覧" href="/ja-JP/concepts/features" icon="list">
    チャネル、ルーティング、メディア機能の完全な一覧。
  </Card>
  <Card title="マルチエージェントルーティング" href="/ja-JP/concepts/multi-agent" icon="route">
    ワークスペース分離とエージェントごとのセッション。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security" icon="shield">
    トークン、許可リスト、安全制御。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/gateway/troubleshooting" icon="wrench">
    Gateway の診断と一般的なエラー。
  </Card>
  <Card title="概要とクレジット" href="/ja-JP/reference/credits" icon="info">
    プロジェクトの起源、コントリビューター、ライセンス。
  </Card>
</Columns>

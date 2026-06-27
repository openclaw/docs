---
read_when:
    - 新規ユーザーへのOpenClawの紹介
summary: OpenClaw は、任意の OS で動作する AI エージェント向けのマルチチャネル Gateway です。
title: OpenClaw
x-i18n:
    generated_at: "2026-06-27T11:46:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fcaa54a0a6d7aa62193fd9f03428bbcbfdcb2c00a184bcd6f49e4e093fefc473
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

> _「脱皮しろ！脱皮しろ！」_ — たぶん、宇宙ロブスター

<p align="center">
  <strong>Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo などで AI エージェントを使うための、あらゆる OS に対応した Gateway。</strong><br />
  メッセージを送るだけで、ポケットからエージェントの応答を受け取れます。組み込みチャネル、バンドルされたチャネル Plugin、WebChat、モバイルノードをまたいで 1 つの Gateway を実行できます。
</p>

<Columns>
  <Card title="はじめる" href="/ja-JP/start/getting-started" icon="rocket">
    OpenClaw をインストールし、数分で Gateway を起動します。
  </Card>
  <Card title="オンボーディングを実行" href="/ja-JP/start/wizard" icon="sparkles">
    `openclaw onboard` とペアリングフローによるガイド付きセットアップ。
  </Card>
  <Card title="Control UI を開く" href="/ja-JP/web/control-ui" icon="layout-dashboard">
    チャット、設定、セッション用のブラウザダッシュボードを起動します。
  </Card>
</Columns>

## OpenClaw とは？

OpenClaw は、Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo などの組み込みチャネルや、バンドルまたは外部チャネル Plugin など、お気に入りのチャットアプリやチャネルサーフェスを AI コーディングエージェントにつなぐ **セルフホスト型 Gateway** です。自分のマシン（またはサーバー）で単一の Gateway プロセスを実行すると、それがメッセージングアプリと常時利用可能な AI アシスタントの橋渡しになります。

**誰のためのものですか？** データの制御を手放したりホスト型サービスに依存したりせず、どこからでもメッセージを送れる個人用 AI アシスタントを必要とする開発者やパワーユーザー向けです。

**何が違いますか？**

- **セルフホスト型**: 自分のハードウェアで、自分のルールで動作します
- **マルチチャネル**: 1 つの Gateway が組み込みチャネルに加え、バンドルまたは外部チャネル Plugin を同時に提供します
- **エージェントネイティブ**: ツール利用、セッション、メモリ、マルチエージェントルーティングを備えたコーディングエージェント向けに構築されています
- **オープンソース**: MIT ライセンス、コミュニティ主導

**何が必要ですか？** Node 24（推奨）、または互換性のための Node 22 LTS（`22.19+`）、選択したプロバイダーの API キー、そして 5 分です。最高の品質とセキュリティを得るには、利用可能な最新世代の中で最も強力なモデルを使用してください。

## 仕組み

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["OpenClaw agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

Gateway は、セッション、ルーティング、チャネル接続に関する単一の信頼できる情報源です。

## 主な機能

<Columns>
  <Card title="マルチチャネル Gateway" icon="network" href="/ja-JP/channels">
    単一の Gateway プロセスで Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat などを利用できます。
  </Card>
  <Card title="Plugin チャネル" icon="plug" href="/ja-JP/tools/plugin">
    バンドルされた Plugin により、通常の現行リリースで Matrix、Nostr、Twitch、Zalo などが追加されます。
  </Card>
  <Card title="マルチエージェントルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    エージェント、ワークスペース、送信者ごとの分離されたセッション。
  </Card>
  <Card title="メディアサポート" icon="image" href="/ja-JP/nodes/images">
    画像、音声、ドキュメントを送受信できます。
  </Card>
  <Card title="Web Control UI" icon="monitor" href="/ja-JP/web/control-ui">
    チャット、設定、セッション、ノード用のブラウザダッシュボード。
  </Card>
  <Card title="モバイルノード" icon="smartphone" href="/ja-JP/nodes">
    Canvas、カメラ、音声対応ワークフローのために iOS と Android ノードをペアリングします。
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
    ブラウザで Control UI を開き、メッセージを送信します。

    ```bash
    openclaw dashboard
    ```

    またはチャネル（[Telegram](/ja-JP/channels/telegram) が最速です）を接続して、スマートフォンからチャットします。

  </Step>
</Steps>

完全なインストールと開発セットアップが必要ですか？[はじめに](/ja-JP/start/getting-started) を参照してください。

## ダッシュボード

Gateway の起動後に、ブラウザの Control UI を開きます。

- ローカルのデフォルト: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- リモートアクセス: [Web サーフェス](/ja-JP/web) と [Tailscale](/ja-JP/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 設定（任意）

設定は `~/.openclaw/openclaw.json` にあります。

- **何もしない**場合、OpenClaw は送信者ごとのセッションを備えた、バンドルされた OpenClaw エージェントランタイムを使用します。
- 制限を強化したい場合は、`channels.whatsapp.allowFrom` と（グループでは）メンションルールから始めます。

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
    Feishu、Microsoft Teams、WhatsApp、Telegram、Discord などのチャネル固有のセットアップ。
  </Card>
  <Card title="ノード" href="/ja-JP/nodes" icon="smartphone">
    ペアリング、Canvas、カメラ、デバイスアクションを備えた iOS と Android ノード。
  </Card>
  <Card title="ヘルプ" href="/ja-JP/help" icon="life-buoy">
    一般的な修正とトラブルシューティングの入口。
  </Card>
</Columns>

## 詳細を学ぶ

<Columns>
  <Card title="全機能一覧" href="/ja-JP/concepts/features" icon="list">
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

---
read_when:
    - OpenClawを初めて使う方への紹介
summary: OpenClaw は、あらゆる OS で動作する AI エージェント向けのマルチチャネル Gateway です。
title: OpenClaw
x-i18n:
    generated_at: "2026-07-16T11:42:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe97e7299be4855fd9af21838e0626b5a5c8aafe46d982859e9033f0efec2443
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _「角質除去！角質除去！」_ — おそらく宇宙のロブスター

<p align="center">
  <strong>Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo などの AI エージェントに対応する、あらゆる OS 向けの Gateway。</strong><br />
  メッセージを送信すれば、ポケットからエージェントの応答を受け取れます。チャンネル Plugin、WebChat、モバイル Node 全体で 1 つの Gateway を実行できます。
</p>

<Columns>
  <Card title="はじめる" href="/ja-JP/start/getting-started" icon="rocket">
    OpenClaw をインストールし、数分で Gateway を起動します。
  </Card>
  <Card title="オンボーディングを実行" href="/ja-JP/start/wizard" icon="list-checks">
    `openclaw onboard` とペアリングフローによるガイド付きセットアップです。
  </Card>
  <Card title="チャンネルに接続" href="/ja-JP/channels" icon="message-circle">
    Discord、Signal、Telegram、WhatsApp などをリンクし、どこからでもチャットできます。
  </Card>
  <Card title="Control UI を開く" href="/ja-JP/web/control-ui" icon="layout-dashboard">
    チャット、設定、セッション用のブラウザダッシュボードを起動します。
  </Card>
</Columns>

## ドキュメントを見る

モバイルブラウザでは、デスクトップ用の完全なタブバーが表示されず、セクションメニューのみが表示されることがあります。ページ本文から同じ最上位のドキュメント領域に移動するには、
次のハブリンクを使用してください。

<Columns>
  <Card title="はじめに" href="/ja-JP" icon="rocket">
    概要、ショーケース、最初の手順、セットアップガイドです。
  </Card>
  <Card title="インストール" href="/ja-JP/install" icon="download">
    インストール方法、アップデート、コンテナ、ホスティング、高度なセットアップです。
  </Card>
  <Card title="チャンネル" href="/ja-JP/channels" icon="messages-square">
    メッセージングチャンネル、ペアリング、ルーティング、アクセスグループ、チャンネル QA です。
  </Card>
  <Card title="エージェント" href="/ja-JP/concepts/architecture" icon="bot">
    アーキテクチャ、セッション、コンテキスト、メモリ、マルチエージェントルーティングです。
  </Card>
  <Card title="機能" href="/ja-JP/tools" icon="wand-sparkles">
    ツール、Skills、Cron、Webhook、自動化機能です。
  </Card>
  <Card title="ClawHub" href="/ja-JP/clawhub" icon="store">
    Plugin マーケットプレイス、公開、キュレーション、信頼性に関するガイダンスです。
  </Card>
  <Card title="モデル" href="/ja-JP/providers" icon="brain">
    プロバイダー、モデル設定、フェイルオーバー、ローカルモデルサービスです。
  </Card>
  <Card title="プラットフォーム" href="/ja-JP/platforms" icon="monitor-smartphone">
    macOS、Windows、iOS、Android、Node、Web インターフェースです。
  </Card>
  <Card title="Gateway と運用" href="/ja-JP/gateway" icon="server">
    Gateway の設定、セキュリティ、診断、運用です。
  </Card>
  <Card title="リファレンス" href="/ja-JP/cli" icon="terminal">
    CLI リファレンス、スキーマ、RPC、リリースノート、テンプレートです。
  </Card>
  <Card title="ヘルプ" href="/ja-JP/help" icon="life-buoy">
    トラブルシューティング、FAQ、テスト、診断、環境チェックです。
  </Card>
</Columns>

## OpenClaw とは？

OpenClaw は、お気に入りのチャットアプリ（Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など）をチャンネル Plugin 経由で AI コーディングエージェントに接続する、**セルフホスト型 Gateway**です。自身のマシン（またはサーバー）で 1 つの Gateway プロセスを実行すると、それがメッセージングアプリと常時利用可能な AI アシスタントをつなぐ橋渡し役になります。

**対象ユーザーは？** データの管理権を手放したり、ホスティングサービスに依存したりすることなく、どこからでもメッセージを送れる個人用 AI アシスタントを求める開発者やパワーユーザーを対象としています。

**何が違うのですか？**

- **セルフホスト型**：自身のハードウェア上で、自身のルールに従って実行
- **マルチチャンネル**：1 つの Gateway で、設定済みのすべてのチャンネル Plugin を同時に提供
- **エージェントネイティブ**：ツールの使用、セッション、メモリ、マルチエージェントルーティングを備えたコーディングエージェント向けに構築
- **オープンソース**：MIT ライセンス、コミュニティ主導

**必要なものは？** Node 24.15+（推奨）、互換性のための Node 22 LTS（`22.22.3+`）、または Node 25.9+、選択したプロバイダーの API キー、そして 5 分です。最高の品質とセキュリティを得るには、利用可能な最新世代の最も高性能なモデルを使用してください。

## 仕組み

```mermaid
flowchart LR
  A["チャットアプリ + Plugin"] --> B["Gateway"]
  B --> C["OpenClaw エージェント"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS アプリ"]
  B --> G["iOS および Android Node"]
```

Gateway は、セッション、ルーティング、チャンネル接続における唯一の信頼できる情報源です。

## 主な機能

<Columns>
  <Card title="マルチチャンネル Gateway" icon="network" href="/ja-JP/channels">
    1 つの Gateway プロセスで Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat などに対応します。
  </Card>
  <Card title="Plugin チャンネル" icon="plug" href="/ja-JP/tools/plugin">
    チャンネル Plugin によって Matrix、Nostr、Twitch、Zalo などが追加され、公式 Plugin は必要に応じてインストールされます。
  </Card>
  <Card title="マルチエージェントルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    エージェント、ワークスペース、送信者ごとに分離されたセッションです。
  </Card>
  <Card title="メディア対応" icon="image" href="/ja-JP/nodes/images">
    画像、音声、ドキュメントを送受信できます。
  </Card>
  <Card title="Web Control UI" icon="monitor" href="/ja-JP/web/control-ui">
    チャット、設定、セッション、Node 用のブラウザダッシュボードです。
  </Card>
  <Card title="モバイル Node" icon="smartphone" href="/ja-JP/nodes">
    iOS および Android Node をペアリングし、Canvas、カメラ、音声対応のワークフローを利用できます。
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

    またはチャンネル（[Telegram](/ja-JP/channels/telegram) が最速）に接続し、スマートフォンからチャットします。

  </Step>
</Steps>

完全なインストール手順と開発環境のセットアップが必要ですか？[はじめに](/ja-JP/start/getting-started)を参照してください。

## ダッシュボード

Gateway の起動後、ブラウザの Control UI を開きます。

- ローカルのデフォルト：[http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- リモートアクセス：[Web インターフェース](/ja-JP/web)および[Tailscale](/ja-JP/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 設定（任意）

設定は `~/.openclaw/openclaw.json` にあります。

- **何も設定しない**場合、OpenClaw は同梱の OpenClaw エージェントランタイムを使用します。DM はエージェントのメインセッションを共有し、各グループチャットには個別のセッションが割り当てられます。
- アクセスを制限する場合は、`channels.whatsapp.allowFrom` と（グループの場合は）メンションルールから始めてください。

例：

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
    すべてのドキュメントとガイドをユースケース別に整理しています。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="settings">
    Gateway のコア設定、トークン、プロバイダー設定です。
  </Card>
  <Card title="リモートアクセス" href="/ja-JP/gateway/remote" icon="globe">
    SSH および tailnet のアクセスパターンです。
  </Card>
  <Card title="チャンネル" href="/ja-JP/channels/telegram" icon="message-square">
    Discord、Feishu、Microsoft Teams、Telegram、WhatsApp など、チャンネル固有のセットアップです。
  </Card>
  <Card title="Node" href="/ja-JP/nodes" icon="smartphone">
    ペアリング、Canvas、カメラ、デバイス操作に対応する iOS および Android Node です。
  </Card>
  <Card title="ヘルプ" href="/ja-JP/help" icon="life-buoy">
    一般的な修正方法とトラブルシューティングの入口です。
  </Card>
</Columns>

## 詳細

<Columns>
  <Card title="全機能一覧" href="/ja-JP/concepts/features" icon="list">
    チャンネル、ルーティング、メディア機能の完全な一覧です。
  </Card>
  <Card title="マルチエージェントルーティング" href="/ja-JP/concepts/multi-agent" icon="route">
    ワークスペースの分離とエージェントごとのセッションです。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security" icon="shield">
    トークン、許可リスト、安全性の制御です。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/gateway/troubleshooting" icon="wrench">
    Gateway の診断と一般的なエラーです。
  </Card>
  <Card title="概要とクレジット" href="/ja-JP/reference/credits" icon="info">
    プロジェクトの起源、コントリビューター、ライセンスです。
  </Card>
</Columns>

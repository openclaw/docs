---
read_when:
    - サードパーティ製のOpenClaw Pluginを探したい
    - 自分のPluginを公開または掲載したい
summary: 'コミュニティが保守する OpenClaw Plugin: 閲覧、インストール、自作 Plugin の送信'
title: コミュニティPlugin
x-i18n:
    generated_at: "2026-05-10T19:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Community Plugin は、新しいチャネル、ツール、プロバイダー、その他の機能で OpenClaw を拡張するサードパーティパッケージです。コミュニティによって構築、保守され、通常は [ClawHub](/ja-JP/clawhub) で公開され、単一のコマンドでインストールできます。ClawHub pack のインストールが展開される間、素のパッケージ指定では npm が起動時のデフォルトのままです。

ClawHub は Community Plugin の標準の発見サーフェスです。発見しやすくする目的だけで、あなたの Plugin をここに追加する docs-only PR を開かないでください。代わりに ClawHub で公開してください。

```bash
openclaw plugins install clawhub:<package-name>
```

npm でホストされているパッケージには `openclaw plugins install <package-name>` を使用してください。

## 掲載 Plugin

### Apify

20,000 以上のすぐに使えるスクレイパーで、任意の Web サイトからデータをスクレイピングできます。依頼するだけで、エージェントに Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、EC サイトなどからデータを抽出させられます。

- **npm:** `@apify/apify-openclaw-plugin`
- **リポジトリ:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server の会話向けの独立した OpenClaw ブリッジです。チャットを Codex スレッドにバインドし、プレーンテキストで会話し、再開、計画、レビュー、モデル選択、Compaction などのチャットネイティブなコマンドで制御できます。

- **npm:** `openclaw-codex-app-server`
- **リポジトリ:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream モードを使用した企業向けロボット連携です。任意の DingTalk クライアント経由で、テキスト、画像、ファイルメッセージをサポートします。

- **npm:** `@largezhou/ddingtalk`
- **リポジトリ:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 向けの Lossless Context Management Plugin です。DAG ベースの会話要約と増分 Compaction により、トークン使用量を削減しながら完全なコンテキスト忠実度を保ちます。

- **npm:** `@martian-engineering/lossless-claw`
- **リポジトリ:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

エージェントのトレースを Opik にエクスポートする公式 Plugin です。エージェントの動作、コスト、トークン、エラーなどを監視できます。

- **npm:** `@opik/opik-openclaw`
- **リポジトリ:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

リアルタイムのリップシンク、感情表現、テキスト読み上げを備えた Live2D アバターを OpenClaw エージェントに与えます。AI アセット生成用のクリエイターツールと、Prometheus Marketplace へのワンクリックデプロイが含まれています。現在はアルファ版です。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **リポジトリ:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API 経由で OpenClaw を QQ に接続します。プライベートチャット、グループメンション、チャネルメッセージに加え、音声、画像、動画、ファイルを含むリッチメディアをサポートします。

現在の OpenClaw リリースには QQ Bot がバンドルされています。通常のインストールでは [QQ Bot](/ja-JP/channels/qqbot) のバンドルされたセットアップを使用してください。この外部 Plugin は、Tencent が保守するスタンドアロンパッケージを意図的に使いたい場合にのみインストールしてください。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **リポジトリ:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom チームによる OpenClaw 向け WeCom チャネル Plugin です。WeCom Bot WebSocket 永続接続を基盤とし、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル処理、Markdown フォーマット、組み込みアクセス制御、ドキュメント/会議/メッセージング Skills をサポートします。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **リポジトリ:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent Yuanbao チームによる OpenClaw 向け Yuanbao チャネル Plugin です。WebSocket 永続接続を基盤とし、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル/音声/動画処理、Markdown フォーマット、組み込みアクセス制御、スラッシュコマンドメニューをサポートします。

- **npm:** `openclaw-plugin-yuanbao`
- **リポジトリ:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Plugin を提出する

有用で、ドキュメントが整備され、安全に運用できる Community Plugin を歓迎します。

<Steps>
  <Step title="ClawHub または npm に公開する">
    Plugin は `openclaw plugins install \<package-name\>` でインストール可能である必要があります。
    npm のみの配布が特に必要な場合を除き、[ClawHub](/ja-JP/clawhub) に公開してください。
    完全なガイドは [Plugin の構築](/ja-JP/plugins/building-plugins) を参照してください。

  </Step>

  <Step title="GitHub でホストする">
    ソースコードは、セットアップドキュメントと issue トラッカーを備えた公開リポジトリに置く必要があります。

  </Step>

  <Step title="docs PR はソースドキュメントの変更にのみ使う">
    Plugin を発見しやすくするためだけに docs PR は必要ありません。代わりに ClawHub で公開してください。

    OpenClaw のソースドキュメントに実際のコンテンツ変更が必要な場合にのみ docs PR を開いてください。たとえば、インストール案内の修正や、メインのドキュメントセットに属するクロスリポジトリドキュメントの追加などです。

  </Step>
</Steps>

## 品質基準

| 要件                        | 理由                                          |
| --------------------------- | --------------------------------------------- |
| ClawHub または npm で公開済み | ユーザーは `openclaw plugins install` が動作する必要がある |
| 公開 GitHub リポジトリ      | ソースレビュー、issue 追跡、透明性            |
| セットアップと使用方法のドキュメント | ユーザーは設定方法を知る必要がある            |
| 継続的な保守                | 最近の更新、または迅速な issue 対応           |

労力の少ないラッパー、所有者が不明確なもの、または保守されていないパッケージは却下される場合があります。

## 関連

- [Plugin のインストールと設定](/ja-JP/tools/plugin) — 任意の Plugin をインストールする方法
- [Plugin の構築](/ja-JP/plugins/building-plugins) — 自分で作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest スキーマ

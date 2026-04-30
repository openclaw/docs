---
read_when:
    - サードパーティ製の OpenClaw Plugin を探したい場合
    - 独自のPluginを公開または一覧に掲載したい
summary: 'コミュニティがメンテナンスする OpenClaw Plugin: 閲覧、インストール、自作 Plugin の提出'
title: コミュニティプラグイン
x-i18n:
    generated_at: "2026-04-30T09:34:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

コミュニティ Pluginは、新しいチャネル、ツール、プロバイダー、その他の機能でOpenClawを拡張するサードパーティパッケージです。コミュニティによって構築・保守され、通常は[ClawHub](/ja-JP/tools/clawhub)で公開され、単一のコマンドでインストールできます。まだClawHubに移行していないパッケージについては、npmが引き続き対応済みのフォールバックです。

ClawHubは、コミュニティ Pluginの正規の発見面です。発見しやすくするためだけに、ここへPluginを追加するdocs専用PRを開かないでください。代わりにClawHubで公開してください。

```bash
openclaw plugins install <package-name>
```

OpenClawは最初にClawHubを確認し、自動的にnpmへフォールバックします。

## 掲載されているPlugin

### Apify

20,000以上の既製スクレイパーで、あらゆるWebサイトからデータをスクレイピングできます。エージェントに依頼するだけで、Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、ECサイトなどからデータを抽出できます。

- **npm:** `@apify/apify-openclaw-plugin`
- **リポジトリ:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Serverの会話向けの独立したOpenClawブリッジです。チャットをCodexスレッドに紐付け、プレーンテキストで会話し、再開、計画、レビュー、モデル選択、Compactionなどをチャットネイティブのコマンドで制御できます。

- **npm:** `openclaw-codex-app-server`
- **リポジトリ:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Streamモードを使用するエンタープライズロボット連携です。任意のDingTalkクライアント経由で、テキスト、画像、ファイルメッセージに対応します。

- **npm:** `@largezhou/ddingtalk`
- **リポジトリ:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw向けのLossless Context Management Pluginです。DAGベースの会話要約と増分Compactionにより、トークン使用量を削減しながら完全なコンテキスト忠実度を維持します。

- **npm:** `@martian-engineering/lossless-claw`
- **リポジトリ:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

エージェントトレースをOpikへエクスポートする公式Pluginです。エージェントの動作、コスト、トークン、エラーなどを監視できます。

- **npm:** `@opik/opik-openclaw`
- **リポジトリ:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

リアルタイムのリップシンク、感情表現、テキスト読み上げを備えたLive2DアバターをOpenClawエージェントに付与します。AIアセット生成用のクリエイターツールと、Prometheus Marketplaceへのワンクリックデプロイが含まれます。現在はアルファ版です。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **リポジトリ:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API経由でOpenClawをQQに接続します。プライベートチャット、グループメンション、チャネルメッセージ、音声、画像、動画、ファイルを含むリッチメディアに対応します。

現在のOpenClawリリースにはQQ Botがバンドルされています。通常のインストールでは[QQ Bot](/ja-JP/channels/qqbot)のバンドルされたセットアップを使用してください。この外部Pluginは、Tencentが保守するスタンドアロンパッケージを意図的に使いたい場合にのみインストールしてください。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **リポジトリ:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeComチームによるOpenClaw向けWeComチャネルPluginです。WeCom Bot WebSocket永続接続を利用し、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル処理、Markdown書式設定、組み込みアクセス制御、ドキュメント/会議/メッセージングSkillsに対応します。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **リポジトリ:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent YuanbaoチームによるOpenClaw向けYuanbaoチャネルPluginです。WebSocket永続接続を利用し、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル/音声/動画処理、Markdown書式設定、組み込みアクセス制御、スラッシュコマンドメニューに対応します。

- **npm:** `openclaw-plugin-yuanbao`
- **リポジトリ:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Pluginを送信する

有用で、文書化され、安全に運用できるコミュニティ Pluginを歓迎します。

<Steps>
  <Step title="Publish to ClawHub or npm">
    Pluginは`openclaw plugins install \<package-name\>`でインストールできる必要があります。
    npmのみでの配布が特に必要な場合を除き、[ClawHub](/ja-JP/tools/clawhub)で公開してください。
    完全なガイドについては[Pluginの構築](/ja-JP/plugins/building-plugins)を参照してください。

  </Step>

  <Step title="Host on GitHub">
    ソースコードは、セットアップdocsと課題トラッカーを備えた公開リポジトリに置く必要があります。

  </Step>

  <Step title="Use docs PRs only for source-doc changes">
    Pluginを発見しやすくするためだけにdocs PRは必要ありません。代わりにClawHubで公開してください。

    OpenClawのソースdocsに実際の内容変更が必要な場合にのみ、docs PRを開いてください。たとえば、インストール手順の修正や、メインdocsセットに属するクロスリポジトリ文書の追加などです。

  </Step>
</Steps>

## 品質基準

| 要件                        | 理由                                          |
| --------------------------- | --------------------------------------------- |
| ClawHubまたはnpmで公開済み  | ユーザーは`openclaw plugins install`が動作する必要がある |
| 公開GitHubリポジトリ        | ソースレビュー、課題追跡、透明性              |
| セットアップと使用方法のdocs | ユーザーは設定方法を知る必要がある            |
| Activeな保守                | 最近の更新、または課題への応答的な対応        |

低労力のラッパー、所有者が不明確なもの、保守されていないパッケージは却下される場合があります。

## 関連

- [Pluginのインストールと設定](/ja-JP/tools/plugin) — 任意のPluginをインストールする方法
- [Pluginの構築](/ja-JP/plugins/building-plugins) — 独自のものを作成する
- [Pluginマニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ

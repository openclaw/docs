---
read_when:
    - サードパーティ製の OpenClaw Plugin を探したい
    - 自分の Plugin を公開または掲載したい
summary: 'コミュニティが保守する OpenClaw Plugin: 閲覧、インストール、自作 Plugin の投稿'
title: コミュニティ Plugin
x-i18n:
    generated_at: "2026-04-30T05:24:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

コミュニティPluginは、新しいチャネル、ツール、プロバイダー、またはその他の機能でOpenClawを拡張するサードパーティパッケージです。コミュニティによって構築および保守され、通常は[ClawHub](/ja-JP/tools/clawhub)で公開され、単一のコマンドでインストールできます。まだClawHubへ移行していないパッケージについては、npmも引き続き対応済みのフォールバックです。

ClawHubは、コミュニティPluginの標準的な発見面です。見つけやすくするためだけにPluginをここへ追加するdocsのみのPRを開かないでください。代わりにClawHubで公開してください。

```bash
openclaw plugins install <package-name>
```

OpenClawはまずClawHubを確認し、自動的にnpmへフォールバックします。

## 掲載Plugin

### Apify

20,000以上の既製スクレイパーで、あらゆるWebサイトからデータをスクレイピングします。エージェントに依頼するだけで、Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、Eコマースサイトなどからデータを抽出できます。

- **npm:** `@apify/apify-openclaw-plugin`
- **リポジトリ:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Serverの会話向けの独立したOpenClawブリッジです。チャットをCodexスレッドに紐づけ、プレーンテキストで会話し、再開、計画、レビュー、モデル選択、Compactionなどのためのチャットネイティブなコマンドで制御できます。

- **npm:** `openclaw-codex-app-server`
- **リポジトリ:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Streamモードを使用したエンタープライズロボット連携です。任意のDingTalkクライアント経由で、テキスト、画像、ファイルメッセージに対応します。

- **npm:** `@largezhou/ddingtalk`
- **リポジトリ:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw向けのLossless Context Management Pluginです。DAGベースの会話要約とインクリメンタルなCompactionにより、トークン使用量を削減しながら完全なコンテキスト忠実性を保持します。

- **npm:** `@martian-engineering/lossless-claw`
- **リポジトリ:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

エージェントトレースをOpikへエクスポートする公式Pluginです。エージェントの挙動、コスト、トークン、エラーなどを監視できます。

- **npm:** `@opik/opik-openclaw`
- **リポジトリ:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

リアルタイムのリップシンク、感情表現、テキスト読み上げを備えたLive2DアバターをOpenClawエージェントに付与します。AIアセット生成用のクリエイターツールと、Prometheus Marketplaceへのワンクリックデプロイを含みます。現在はアルファ版です。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **リポジトリ:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API経由でOpenClawをQQに接続します。プライベートチャット、グループメンション、チャネルメッセージ、音声、画像、動画、ファイルを含むリッチメディアに対応します。

現在のOpenClawリリースにはQQ Botが同梱されています。通常のインストールでは[QQ Bot](/ja-JP/channels/qqbot)の同梱セットアップを使用してください。この外部Pluginは、Tencentが保守するスタンドアロンパッケージを意図的に使いたい場合にのみインストールしてください。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **リポジトリ:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeComチームによるOpenClaw向けWeComチャネルPluginです。WeCom Bot WebSocket永続接続を基盤としており、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル処理、Markdown書式、組み込みアクセス制御、ドキュメント/ミーティング/メッセージングSkillsに対応します。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **リポジトリ:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent YuanbaoチームによるOpenClaw向けYuanbaoチャネルPluginです。WebSocket永続接続を基盤としており、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル/音声/動画処理、Markdown書式、組み込みアクセス制御、スラッシュコマンドメニューに対応します。

- **npm:** `openclaw-plugin-yuanbao`
- **リポジトリ:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Pluginを提出する

有用で、ドキュメントがあり、安全に運用できるコミュニティPluginを歓迎します。

<Steps>
  <Step title="ClawHubまたはnpmで公開する">
    Pluginは`openclaw plugins install \<package-name\>`でインストール可能である必要があります。
    npmのみの配布が特に必要でない限り、[ClawHub](/ja-JP/tools/clawhub)で公開してください。
    完全なガイドについては、[Pluginの構築](/ja-JP/plugins/building-plugins)を参照してください。

  </Step>

  <Step title="GitHubでホストする">
    ソースコードは、セットアップドキュメントと課題トラッカーを備えた公開リポジトリに置く必要があります。

  </Step>

  <Step title="docs PRはソースドキュメント変更にのみ使用する">
    Pluginを見つけやすくするためだけにdocs PRは不要です。代わりにClawHubで公開してください。

    OpenClawのソースドキュメントに実際のコンテンツ変更が必要な場合にのみ、docs PRを開いてください。たとえば、インストール案内の修正や、メインのドキュメントセットに属するクロスリポジトリのドキュメント追加などです。

  </Step>
</Steps>

## 品質基準

| 要件                        | 理由                                          |
| --------------------------- | --------------------------------------------- |
| ClawHubまたはnpmで公開済み  | ユーザーは`openclaw plugins install`が動作する必要があります |
| 公開GitHubリポジトリ        | ソースレビュー、課題追跡、透明性              |
| セットアップと使用方法のドキュメント | ユーザーは構成方法を知る必要があります        |
| 活発な保守                  | 最近の更新、または迅速な課題対応              |

低品質なラッパー、不明確な所有者、または保守されていないパッケージは却下される場合があります。

## 関連

- [Pluginのインストールと設定](/ja-JP/tools/plugin) — 任意のPluginをインストールする方法
- [Pluginの構築](/ja-JP/plugins/building-plugins) — 独自のPluginを作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifestスキーマ

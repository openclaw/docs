---
read_when:
    - サードパーティ製のOpenClaw Pluginを探したい
    - 自分のPluginを公開または一覧表示したい
summary: 'コミュニティが保守する OpenClaw Plugin: 閲覧、インストール、自作のPluginを投稿'
title: コミュニティPlugin
x-i18n:
    generated_at: "2026-05-02T20:51:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

コミュニティプラグインは、新しいチャネル、ツール、プロバイダー、その他の機能で OpenClaw を拡張するサードパーティパッケージです。コミュニティによって構築・保守され、通常は [ClawHub](/ja-JP/tools/clawhub) で公開され、単一のコマンドでインストールできます。ClawHub パックインストールの展開中も、裸のパッケージ指定では npm が起動時のデフォルトのままです。

ClawHub はコミュニティプラグインの標準的な発見面です。発見されやすくするためだけに、ここへプラグインを追加する docs-only PR を開かないでください。代わりに ClawHub で公開してください。

```bash
openclaw plugins install clawhub:<package-name>
```

npm でホストされているパッケージには `openclaw plugins install <package-name>` を使用してください。

## 掲載プラグイン

### Apify

20,000 以上のすぐに使えるスクレイパーで、任意のウェブサイトからデータをスクレイピングします。依頼するだけで、エージェントに Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、e コマースサイトなどからデータを抽出させられます。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server の会話のための独立した OpenClaw ブリッジです。チャットを Codex スレッドにバインドし、プレーンテキストで会話し、再開、計画、レビュー、モデル選択、Compaction などのチャットネイティブなコマンドで制御できます。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream モードを使用した企業向けロボット連携です。任意の DingTalk クライアント経由で、テキスト、画像、ファイルメッセージをサポートします。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 向けの Lossless Context Management プラグインです。DAG ベースの会話要約と増分 Compaction により、トークン使用量を削減しながら完全なコンテキスト忠実度を維持します。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

エージェントトレースを Opik にエクスポートする公式プラグインです。エージェントの動作、コスト、トークン、エラーなどを監視します。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw エージェントに、リアルタイムのリップシンク、感情表現、テキスト読み上げを備えた Live2D アバターを与えます。AI アセット生成用のクリエイターツールと、Prometheus Marketplace へのワンクリックデプロイが含まれます。現在はアルファ版です。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API 経由で OpenClaw を QQ に接続します。プライベートチャット、グループメンション、チャネルメッセージ、音声、画像、動画、ファイルを含むリッチメディアをサポートします。

現在の OpenClaw リリースには QQ Bot がバンドルされています。通常のインストールでは [QQ Bot](/ja-JP/channels/qqbot) のバンドルされたセットアップを使用してください。この外部プラグインは、Tencent が保守するスタンドアロンパッケージを意図的に使いたい場合にのみインストールしてください。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom チームによる OpenClaw 向け WeCom チャネルプラグインです。WeCom Bot WebSocket 永続接続を基盤とし、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル処理、Markdown フォーマット、組み込みアクセス制御、ドキュメント/会議/メッセージング Skills をサポートします。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent Yuanbao チームによる OpenClaw 向け Yuanbao チャネルプラグインです。WebSocket 永続接続を基盤とし、ダイレクトメッセージとグループチャット、ストリーミング返信、プロアクティブメッセージング、画像/ファイル/音声/動画処理、Markdown フォーマット、組み込みアクセス制御、スラッシュコマンドメニューをサポートします。

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## プラグインを提出する

有用で、文書化され、安全に運用できるコミュニティプラグインを歓迎します。

<Steps>
  <Step title="ClawHub または npm に公開する">
    プラグインは `openclaw plugins install \<package-name\>` でインストール可能である必要があります。
    npm のみでの配布が明確に必要な場合を除き、[ClawHub](/ja-JP/tools/clawhub) に公開してください。
    完全なガイドは [プラグインの構築](/ja-JP/plugins/building-plugins) を参照してください。

  </Step>

  <Step title="GitHub でホストする">
    ソースコードは、セットアップドキュメントと issue トラッカーを備えた公開リポジトリに置く必要があります。

  </Step>

  <Step title="docs PR はソースドキュメントの変更にのみ使用する">
    プラグインを発見可能にするためだけに docs PR は必要ありません。代わりに ClawHub で公開してください。

    OpenClaw のソースドキュメントに、インストールガイダンスの修正やメインドキュメントセットに属するクロスリポジトリドキュメントの追加など、実際のコンテンツ変更が必要な場合にのみ docs PR を開いてください。

  </Step>
</Steps>

## 品質基準

| 要件                        | 理由                                          |
| --------------------------- | --------------------------------------------- |
| ClawHub または npm で公開済み | ユーザーは `openclaw plugins install` が動作することを必要とします |
| 公開 GitHub リポジトリ      | ソースレビュー、issue 追跡、透明性            |
| セットアップと使用方法のドキュメント | ユーザーは設定方法を知る必要があります        |
| アクティブな保守            | 最近の更新、または応答のある issue 対応       |

労力の低いラッパー、不明確な所有者、または保守されていないパッケージは却下される場合があります。

## 関連

- [プラグインのインストールと設定](/ja-JP/tools/plugin) — 任意のプラグインをインストールする方法
- [プラグインの構築](/ja-JP/plugins/building-plugins) — 自分で作成する
- [プラグインマニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ

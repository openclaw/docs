---
read_when:
    - サードパーティーの OpenClaw Plugins を探したい場合
    - 自分の Plugin を公開または一覧表示したい場合
summary: 'コミュニティ管理の OpenClaw Plugins: 閲覧、インストール、自作 Plugin の投稿'
title: コミュニティ Plugins
x-i18n:
    generated_at: "2026-04-24T05:10:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

コミュニティ Plugins は、新しい
チャンネル、tools、プロバイダー、またはその他の capabilities で OpenClaw を拡張するサードパーティーパッケージです。コミュニティによって構築・保守され、[ClawHub](/ja-JP/tools/clawhub) または npm で公開され、単一コマンドでインストールできます。

ClawHub はコミュニティ Plugins の正規の discovery サーフェスです。見つけやすくするためだけに、このページへ自分の Plugin を追加する docs-only PR を開かないでください。代わりに ClawHub で公開してください。

```bash
openclaw plugins install <package-name>
```

OpenClaw は最初に ClawHub を確認し、自動的に npm にフォールバックします。

## 掲載されている Plugins

### Apify

20,000 以上の既製スクレーパーを使って、任意の Web サイトからデータをスクレイプします。Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、EC サイトなどから、依頼するだけでエージェントにデータを抽出させることができます。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server 会話向けの独立した OpenClaw ブリッジです。チャットを
Codex スレッドに bind し、平文で会話し、resume、planning、review、model 選択、Compaction などをチャットネイティブコマンドで制御できます。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream mode を使ったエンタープライズロボット統合です。任意の DingTalk クライアント経由でテキスト、画像、ファイルメッセージをサポートします。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 向け Lossless Context Management Plugin。DAG ベースの会話
要約と増分 Compaction により、token 使用量を減らしつつ、完全なコンテキスト忠実性を保持します。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

エージェントトレースを Opik にエクスポートする公式 Plugin。エージェントの動作、
コスト、token、エラーなどを監視できます。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw エージェントに、リアルタイム lip-sync、感情表現、
Text-to-speech を備えた Live2D アバターを与えます。AI アセット生成用の creator tools
と、Prometheus Marketplace へのワンクリック配備が含まれます。現在 alpha です。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API 経由で OpenClaw を QQ に接続します。プライベートチャット、グループ
mention、チャンネルメッセージ、および音声、画像、動画、
ファイルを含むリッチメディアをサポートします。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom チームによる OpenClaw 向け WeCom チャンネル Plugin。WeCom Bot WebSocket 永続接続を基盤とし、ダイレクトメッセージとグループ
チャット、ストリーミング返信、能動メッセージング、画像/ファイル処理、Markdown
整形、組み込みアクセス制御、およびドキュメント/会議/メッセージング Skills をサポートします。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## 自分の Plugin を投稿する

有用で、文書化されていて、安全に運用できるコミュニティ Plugins を歓迎します。

<Steps>
  <Step title="ClawHub または npm に公開する">
    あなたの Plugin は `openclaw plugins install \<package-name\>` でインストール可能でなければなりません。
    [ClawHub](/ja-JP/tools/clawhub)（推奨）または npm に公開してください。
    完全なガイドは [Building Plugins](/ja-JP/plugins/building-plugins) を参照してください。

  </Step>

  <Step title="GitHub で公開する">
    ソースコードは、セットアップドキュメントと issue
    tracker を備えた public repository にある必要があります。

  </Step>

  <Step title="source ドキュメント変更にのみ docs PR を使う">
    自分の Plugin を見つけやすくするためだけに docs PR は必要ありません。代わりに
    ClawHub で公開してください。

    docs PR を開くのは、OpenClaw の source docs に実際の内容変更が必要な場合だけにしてください。
    たとえば、インストールガイダンスの修正や、メイン docs セットに属する
    cross-repo ドキュメントの追加などです。

  </Step>
</Steps>

## 品質基準

| Requirement | 理由 |
| --------------------------- | --------------------------------------------- |
| ClawHub または npm で公開されていること | ユーザーが `openclaw plugins install` を使える必要がある |
| Public GitHub repo | ソースレビュー、issue 追跡、透明性 |
| セットアップと使用方法の docs | ユーザーが設定方法を知る必要がある |
| 継続的な保守 | 最近の更新または迅速な issue 対応 |

手間のかかっていないラッパー、所有者が不明確なもの、または保守されていないパッケージは却下されることがあります。

## 関連

- [Install and Configure Plugins](/ja-JP/tools/plugin) — 任意の Plugin をインストールする方法
- [Building Plugins](/ja-JP/plugins/building-plugins) — 自分のものを作る
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema

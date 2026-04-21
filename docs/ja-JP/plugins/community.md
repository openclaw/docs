---
read_when:
    - サードパーティの OpenClaw Plugin を探したい場合
    - 自分の Plugin を公開または掲載したい場合
summary: 'コミュニティ管理の OpenClaw Plugin: 閲覧、インストール、自作 Plugin の提出'
title: コミュニティ Plugin
x-i18n:
    generated_at: "2026-04-21T04:48:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# コミュニティ Plugin

コミュニティ Plugin は、OpenClaw を新しい
チャネル、ツール、provider、その他の機能で拡張するサードパーティパッケージです。これらはコミュニティによって作成・保守され、
[ClawHub](/ja-JP/tools/clawhub) または npm に公開され、
単一コマンドでインストールできます。

ClawHub はコミュニティ Plugin の正規の発見サーフェスです。見つけてもらうためだけに
ここへ Plugin を追加する docs-only PR は開かないでください。代わりに
ClawHub に公開してください。

```bash
openclaw plugins install <package-name>
```

OpenClaw は最初に ClawHub を確認し、自動的に npm にフォールバックします。

## 掲載されている Plugin

### Apify

20,000 以上の既製スクレイパーを使って、あらゆる Web サイトからデータをスクレイプします。エージェントに
Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、EC サイトなどから
データを抽出させることが、依頼するだけで可能です。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server 会話向けの独立した OpenClaw bridge。チャットを
Codex スレッドに bind し、プレーンテキストで対話し、resume、planning、review、model 選択、
Compaction などをチャットネイティブなコマンドで制御できます。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream モードを使ったエンタープライズ robot 統合。任意の DingTalk クライアント経由で、
テキスト、画像、ファイルメッセージをサポートします。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 向けの Lossless Context Management Plugin。DAG ベースの会話
要約を incremental Compaction とともに提供し、トークン使用量を削減しながら
完全なコンテキスト忠実性を維持します。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

エージェントトレースを Opik にエクスポートする公式 Plugin。エージェントの挙動、
コスト、トークン、エラーなどを監視できます。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw エージェントに、リアルタイム lip-sync、感情表現、
text-to-speech を備えた Live2D アバターを付与します。AI アセット生成用の creator ツールと、
Prometheus Marketplace へのワンクリックデプロイも含みます。現在 alpha です。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API 経由で OpenClaw を QQ に接続します。プライベートチャット、グループ
メンション、channel メッセージ、音声、画像、動画、
ファイルを含むリッチメディアをサポートします。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom チームによる OpenClaw 向け WeCom チャネル Plugin。WeCom Bot の WebSocket 永続接続を基盤とし、
ダイレクトメッセージとグループチャット、ストリーミング返信、能動的メッセージ送信、画像／ファイル処理、Markdown
整形、組み込みアクセス制御、ドキュメント／会議／メッセージング Skills をサポートします。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Plugin を提出する

有用で、文書化されており、安全に運用できるコミュニティ Plugin を歓迎します。

<Steps>
  <Step title="ClawHub または npm に公開する">
    あなたの Plugin は `openclaw plugins install \<package-name\>` でインストールできる必要があります。
    [ClawHub](/ja-JP/tools/clawhub)（推奨）または npm に公開してください。
    完全なガイドについては [Building Plugins](/ja-JP/plugins/building-plugins) を参照してください。

  </Step>

  <Step title="GitHub でホストする">
    ソースコードは、セットアップドキュメントと issue
    tracker を備えた公開リポジトリに置かれている必要があります。

  </Step>

  <Step title="docs PR はソースドキュメント変更にのみ使う">
    あなたの Plugin を見つけてもらうためだけに docs PR は必要ありません。代わりに
    ClawHub に公開してください。

    docs PR を開くのは、OpenClaw のソースドキュメントに実際の内容変更が必要な場合だけにしてください。
    たとえば、インストール手順の修正や、メインの docs セットに属する
    cross-repo ドキュメントの追加などです。

  </Step>
</Steps>

## 品質基準

| Requirement | 理由 |
| --------------------------- | --------------------------------------------- |
| ClawHub または npm で公開されていること | ユーザーが `openclaw plugins install` を使える必要があるため |
| 公開 GitHub repo | ソースレビュー、issue 追跡、透明性のため |
| セットアップと使用方法の docs | ユーザーが設定方法を知る必要があるため |
| アクティブな保守 | 最近の更新または応答性のある issue 対応 |

手間をかけていない wrapper、所有者が不明確なもの、または保守されていないパッケージは、掲載を断る場合があります。

## 関連

- [Install and Configure Plugins](/ja-JP/tools/plugin) — 任意の Plugin のインストール方法
- [Building Plugins](/ja-JP/plugins/building-plugins) — 自分のものを作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema

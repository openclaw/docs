---
doc-schema-version: 1
read_when:
    - サードパーティ製 OpenClaw plugins を探したい
    - 自分のPluginをClawHubで公開または掲載したい
summary: コミュニティが管理する OpenClaw プラグインを見つけて公開する
title: コミュニティ Plugin
x-i18n:
    generated_at: "2026-07-05T11:36:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

コミュニティPluginは、チャンネル、ツール、プロバイダー、フック、またはその他の機能でOpenClawを拡張するサードパーティパッケージです。公開コミュニティPluginの主な発見場所として[ClawHub](/clawhub)を使用します。

## Pluginを探す

CLIからClawHubを検索します。

```bash
openclaw plugins search "calendar"
```

明示的なソースプレフィックスを付けてClawHub Pluginをインストールします。

```bash
openclaw plugins install clawhub:<package-name>
```

ローンチ移行期間中は、npmも直接インストールの対応パスとして残ります。

```bash
openclaw plugins install npm:<package-name>
```

一般的なインストール、更新、検査、アンインストールの例については、[Pluginを管理する](/ja-JP/plugins/manage-plugins)を使用します。完全なコマンドリファレンスとソース選択ルールについては、[`openclaw plugins`](/ja-JP/cli/plugins)を使用します。

## Pluginを公開する

公開コミュニティPluginをClawHubで公開し、OpenClawユーザーが発見してインストールできるようにします。ClawHubはライブのパッケージ一覧、リリース履歴、スキャン状態、インストールのヒントを所有します。ドキュメントでは静的なサードパーティPluginカタログを維持しません。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

公開する前に、Pluginにパッケージメタデータ、Pluginマニフェスト、セットアップドキュメント、明確なメンテナンス所有者があることを確認します。ClawHubはリリースを作成する前に、所有者スコープ、パッケージ名、バージョン、ファイル制限、ソースメタデータを検証し、その後レビューと検証が完了するまで、新しいリリースを通常のインストールおよびダウンロード面から非表示にします。

公開前のチェックリスト:

| 要件                 | 理由                                                |
| -------------------- | --------------------------------------------------- |
| ClawHubで公開済み    | ユーザーには`openclaw plugins install`ヒントが必要 |
| 公開GitHubリポジトリ | ソースレビュー、課題追跡、透明性                    |
| セットアップと使用方法のドキュメント | ユーザーは設定方法を知る必要がある |
| アクティブなメンテナンス | 最近の更新または応答性のある課題対応            |

完全な公開契約:

- [ClawHub公開](/ja-JP/clawhub/publishing) - 所有者、スコープ、リリース、レビュー、パッケージ検証、パッケージ移管
- [Pluginの構築](/ja-JP/plugins/building-plugins) - Pluginパッケージの形状と初回公開ワークフロー
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - ネイティブPluginマニフェストフィールド

## 関連

- [Plugins](/ja-JP/tools/plugin) - インストール、設定、再起動、トラブルシューティング
- [Pluginを管理する](/ja-JP/plugins/manage-plugins) - コマンド例
- [ClawHub公開](/ja-JP/clawhub/publishing) - 公開とリリースのルール

---
doc-schema-version: 1
read_when:
    - サードパーティ製の OpenClaw Plugin を探したい
    - ClawHubで独自のPluginを公開または掲載したい
summary: コミュニティ管理のOpenClaw Pluginを見つけて公開する
title: コミュニティ Plugin
x-i18n:
    generated_at: "2026-06-27T12:14:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

コミュニティ Plugin は、チャネル、ツール、プロバイダー、フック、またはその他の機能で OpenClaw を拡張するサードパーティパッケージです。公開コミュニティ Plugin の主要な発見面として [ClawHub](/ja-JP/clawhub) を使用してください。

## Plugin を探す

CLI から ClawHub を検索します。

```bash
openclaw plugins search "calendar"
```

明示的なソースプレフィックスを指定して ClawHub Plugin をインストールします。

```bash
openclaw plugins install clawhub:<package-name>
```

npm は、ローンチ移行期間中もサポートされる直接インストールパスです。

```bash
openclaw plugins install npm:<package-name>
```

一般的なインストール、更新、検査、アンインストールの例については、[Plugin を管理する](/ja-JP/plugins/manage-plugins) を使用してください。完全なコマンドリファレンスとソース選択ルールについては、[`openclaw plugins`](/ja-JP/cli/plugins) を使用してください。

## Plugin を公開する

OpenClaw ユーザーに見つけてインストールしてもらいたい公開コミュニティ Plugin は、ClawHub で公開します。ClawHub はライブのパッケージ一覧、リリース履歴、スキャン状態、インストールヒントを所有します。ドキュメントでは静的なサードパーティ Plugin カタログを維持しません。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

公開する前に、Plugin にパッケージメタデータ、Plugin マニフェスト、セットアップドキュメント、明確なメンテナンス所有者があることを確認してください。ClawHub はリリースを作成する前に、所有者スコープ、パッケージ名、バージョン、ファイル制限、ソースメタデータを検証します。その後、レビューと検証が完了するまで、新しいリリースを通常のインストールおよびダウンロード面から非表示にします。

公開前にこのチェックリストを使用してください。

| 要件                 | 理由                                                |
| -------------------- | --------------------------------------------------- |
| ClawHub で公開済み   | ユーザーには `openclaw plugins install` ヒントが機能する必要がある |
| 公開 GitHub リポジトリ | ソースレビュー、Issue 追跡、透明性                 |
| セットアップと使用方法のドキュメント | ユーザーは設定方法を知る必要がある              |
| アクティブなメンテナンス | 最近の更新または迅速な Issue 対応                 |

完全な公開契約については、これらのページを使用してください。

- [ClawHub 公開](/ja-JP/clawhub/publishing) では、所有者、スコープ、リリース、レビュー、パッケージ検証、パッケージ移管について説明します。
- [Plugin の構築](/ja-JP/plugins/building-plugins) では、Plugin パッケージの形状と最初の公開ワークフローを示します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest) では、ネイティブ Plugin マニフェストフィールドを定義します。

## 関連

- [Plugins](/ja-JP/tools/plugin) - インストール、設定、再起動、トラブルシューティング
- [Plugin を管理する](/ja-JP/plugins/manage-plugins) - コマンド例
- [ClawHub 公開](/ja-JP/clawhub/publishing) - 公開とリリースのルール

---
read_when:
    - リスト、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub のリスティング、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-06-28T05:02:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw のスキルとプラグインのレジストリーレイヤーです。ユーザーがパッケージを発見する場所、公開者がバージョンをリリースする場所、そして OpenClaw がそれらのパッケージを安全にインストールおよび更新するために必要なメタデータを提供します。

## レジストリーレコード

各公開リスティングは、次を含むレジストリーレコードです。

- オーナーとスラッグまたはパッケージ名
- 1 つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソース帰属
- `latest` などの変更履歴とタグ情報
- ダウンロード、インストール、スターのシグナル
- セキュリティスキャンとモデレーションの状態

リスティングページは、ユーザーがインストール前にスキルやプラグインが何を行うと主張しているかを確認するための正規の場所です。

## Skills

スキルは、`SKILL.md` を中心としたバージョン付きのテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` の frontmatter を読み取り、スキル名、説明、要件、環境変数、メタデータを把握します。正確なメタデータは重要です。ユーザーがそのスキルをインストールするか判断しやすくなり、自動スキャンが宣言された動作と観測された動作の不一致を検出しやすくなるためです。

[スキル形式](/ja-JP/clawhub/skill-format) を参照してください。

## プラグイン

プラグインは、パッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、互換性情報、ソースリンク、成果物、バージョンレコードを保存します。

OpenClaw が ClawHub からプラグインをインストールするとき、インストール前に公開されている互換性メタデータを確認します。パッケージレコードには、API 互換性、最低 Gateway バージョン、ホストターゲット、環境要件、成果物のダイジェストを含めることができます。

レジストリーを信頼できる情報源にしたい場合は、明示的な ClawHub インストール元を使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は、認証済みレジストリーワークフローに `clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするには、ドライランを使用します。その後、公開ページには公開されたメタデータ、ファイル、ソース帰属、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストール元メタデータを記録するため、後で更新時に同じレジストリーパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外でレジストリー管理のスキルフォルダーを使いたいユーザー向けに、直接のスキルインストールおよび更新ワークフローもサポートします。

## セキュリティ状態

ClawHub は公開に開かれていますが、リリースには引き続きアップロードゲート、自動チェック、ユーザー報告、モデレーターの対応が適用されます。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、またはブロックされたコンテンツは、診断のためにオーナーには表示されたまま、公開検索やインストールフローから消えることがあります。

[セキュリティ](/ja-JP/clawhub/security)、[セキュリティ監査](/ja-JP/clawhub/security-audits)、[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)、[許容される利用](/ja-JP/clawhub/acceptable-usage) を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロードのための公開読み取り API を公開しています。サードパーティのカタログは、正規の ClawHub リスティングへリンクし、レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api) と [HTTP API](/ja-JP/clawhub/http-api) を参照してください。

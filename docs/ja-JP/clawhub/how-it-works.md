---
read_when:
    - 掲載情報、バージョン、インストール、公開、モデレーションについて
summary: ClawHub の掲載情報、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-05-12T15:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は、OpenClaw の Skills と Plugin のレジストリ層です。ユーザーには
パッケージを見つける場所を、公開者にはバージョンをリリースする場所を提供し、
OpenClaw にはそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- オーナーとスラッグ、またはパッケージ名
- 1つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソース帰属
- `latest` などの変更履歴とタグ情報
- ダウンロード、インストール、スター、コメントのシグナル
- セキュリティスキャンとモデレーションの状態

リスティングページは、ユーザーがインストール前に Skills または
Plugin が何を行うと主張しているかを確認するための正規の場所です。

## Skills

Skills は、`SKILL.md` を中心としたバージョン管理されたテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` のフロントマターを読み取り、Skills の名前、
説明、要件、環境変数、メタデータを理解します。正確な
メタデータは重要です。ユーザーがその Skills をインストールするか判断する助けになり、
自動スキャンが宣言された動作と観測された動作の不一致を検出する助けになるためです。

[Skills 形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugin

Plugin はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、
互換性情報、ソースリンク、アーティファクト、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールするとき、インストール前に公開されている互換性
メタデータを確認します。パッケージレコードには、API 互換性、
最低 Gateway バージョン、ホストターゲット、環境要件、アーティファクト
ダイジェストを含めることができます。

レジストリを信頼できる唯一の情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は、認証付きレジストリワークフローに `clawhub`
CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするには、ドライランを使用します。その後、公開ページには
公開済みのメタデータ、ファイル、ソース帰属、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースメタデータを記録するため、後で同じ
レジストリパッケージに対して更新を解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外で
レジストリ管理の Skills フォルダーを使いたいユーザー向けに、直接の Skills インストールおよび
更新ワークフローもサポートします。

## セキュリティ状態

ClawHub は公開に対してオープンですが、リリースは引き続きアップロードゲート、
自動チェック、ユーザーレポート、モデレーターの対応の対象です。

公開ページでは、利用可能な場合にスキャン概要が表示されます。保留、非表示、
またはブロックされたコンテンツは、診断のためにオーナーには表示されたままでも、
公開検索やインストールフローから消えることがあります。

[セキュリティ + モデレーション](/ja-JP/clawhub/security)と
[許容される利用](/ja-JP/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロード用の公開読み取り API を公開しています。サードパーティのカタログは、正規の ClawHub リスティングへリンクし、
レート制限を尊重し、推奨されているかのような表現を避ける場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api) と [HTTP API](/ja-JP/clawhub/http-api)を参照してください。

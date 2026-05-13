---
read_when:
    - リスティング、バージョン、インストール、公開、モデレーションについて理解する
summary: ClawHub の掲載、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-05-13T04:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw の Skills と Plugin のためのレジストリ層です。ユーザーがパッケージを
見つける場所を提供し、公開者がバージョンをリリースする場所を提供し、
OpenClaw がそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- 所有者とスラッグまたはパッケージ名
- 1 つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソースの帰属
- `latest` などの変更履歴とタグ情報
- ダウンロード、インストール、スター、コメントのシグナル
- セキュリティスキャンとモデレーションの状態

リスティングページは、ユーザーがインストール前に Skills または
Plugin が何を行うと主張しているかを確認するための正規の場所です。

## Skills

Skills は `SKILL.md` を中心とした、バージョン管理されたテキストバンドルです。補助ファイル、
例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` の frontmatter を読み取り、Skills 名、
説明、要件、環境変数、メタデータを理解します。正確な
メタデータは、ユーザーがその Skills をインストールするかどうかを判断する助けになり、
自動スキャンが宣言された動作と観測された動作の不一致を検出する助けにもなるため重要です。

[Skills 形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugin

Plugin はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、
互換性情報、ソースリンク、成果物、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールするときは、インストール前に公開されている互換性
メタデータを確認します。パッケージレコードには、API 互換性、
最小 Gateway バージョン、ホストターゲット、環境要件、成果物
ダイジェストを含めることができます。

レジストリを信頼できる唯一の情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は認証済みのレジストリワークフローに `clawhub`
CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするには dry run を使用します。その後、公開ページに
公開済みメタデータ、ファイル、ソースの帰属、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースのメタデータを記録するため、後で更新時に同じ
レジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外で
レジストリ管理の Skills フォルダーを使いたいユーザー向けに、Skills の直接インストールと
更新ワークフローにも対応しています。

## セキュリティ状態

ClawHub は公開に開かれていますが、リリースは引き続きアップロードゲート、
自動チェック、ユーザーレポート、モデレーターの対応の対象となります。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、
またはブロックされたコンテンツは、所有者には診断のために表示されたまま、
公開検索やインストールフローから消える場合があります。

[セキュリティ + モデレーション](/ja-JP/clawhub/security)と
[許容される利用](/ja-JP/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、
ダウンロード用の公開読み取り API を公開しています。サードパーティのカタログは、正規の ClawHub リスティングへリンクし、
レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api)と [HTTP API](/ja-JP/clawhub/http-api)を参照してください。

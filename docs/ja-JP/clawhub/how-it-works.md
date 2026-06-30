---
read_when:
    - 一覧、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub の一覧、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-06-30T13:45:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw の Skills と Plugin のレジストリレイヤーです。ユーザーには
パッケージを見つける場所を、公開者にはバージョンをリリースする場所を提供し、
OpenClaw がそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- オーナーとスラッグ、またはパッケージ名
- 1 つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソース帰属
- `latest` などの changelog とタグ情報
- ダウンロード、インストール、スターのシグナル
- セキュリティスキャンとモデレーションの状態

リスティングページは、ユーザーがインストール前に Skills または
Plugin が何を行うと主張しているかを確認するための正規の場所です。

## Skills

Skills は `SKILL.md` を中心とした、バージョン管理されたテキストバンドルです。補助ファイル、
例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` の frontmatter を読み取り、Skills の名前、
説明、要件、環境変数、メタデータを理解します。正確な
メタデータは重要です。ユーザーが Skills をインストールするか判断しやすくなり、
自動スキャンが宣言された動作と観測された動作の不一致を検出しやすくなるためです。

[Skills の形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugin

Plugin はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、
互換性情報、ソースリンク、アーティファクト、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールするとき、インストール前に公開されている互換性
メタデータを確認します。パッケージレコードには API 互換性、
最小 Gateway バージョン、ホストターゲット、環境要件、アーティファクト
ダイジェストを含めることができます。

レジストリを信頼できる唯一の情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は `clawhub`
CLI を使用して、認証済みのレジストリワークフローを実行します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするには dry run を使用します。その後、公開ページに
公開済みメタデータ、ファイル、ソース帰属、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースのメタデータを記録するため、後で更新時に同じ
レジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外で
レジストリ管理の Skills フォルダーを使いたいユーザー向けに、Skills の直接インストールと
更新ワークフローもサポートします。

## セキュリティ状態

ClawHub は公開に対してオープンですが、リリースは引き続きアップロードゲート、
自動チェック、ユーザー報告、モデレーターの対応の対象です。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、
またはブロックされたコンテンツは、オーナーには診断用に表示されたまま、
公開検索やインストールフローから消える場合があります。

[セキュリティ](/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、
[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)、および
[許容される使用](/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロードのための公開読み取り API を公開しています。
サードパーティのカタログは、正規の ClawHub リスティングにリンクし、
レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/clawhub/api) と [HTTP API](/clawhub/http-api)を参照してください。

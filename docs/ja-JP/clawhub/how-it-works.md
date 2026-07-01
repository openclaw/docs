---
read_when:
    - 一覧、バージョン、インストール、公開、モデレーションの理解
summary: ClawHub の掲載情報、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-07-01T15:18:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw の Skills と plugins のレジストリ層です。ユーザーに
パッケージを発見する場所を提供し、公開者にバージョンをリリースする場所を提供し、
OpenClaw がそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- 所有者と slug またはパッケージ名
- 1 つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソースの帰属情報
- `latest` などの changelog とタグ情報
- ダウンロード、インストール、スターのシグナル
- セキュリティスキャンとモデレーションの状態

リスティングページは、ユーザーがインストール前に Skill または
Plugin が何を行うと主張しているかを確認するための正規の場所です。

## Skills

Skill は `SKILL.md` を中心とした、バージョン管理されたテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` の frontmatter を読み取り、Skill の名前、説明、要件、環境変数、メタデータを理解します。正確なメタデータは重要です。ユーザーが Skill をインストールするか判断する助けになり、自動スキャンが宣言された動作と観測された動作の不一致を検出する助けにもなるためです。

[Skill 形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugins

Plugins はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、互換性情報、ソースリンク、アーティファクト、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールするとき、インストール前に提示された互換性メタデータを確認します。パッケージレコードには、API 互換性、最小 Gateway バージョン、ホストターゲット、環境要件、アーティファクトダイジェストを含めることができます。

レジストリを信頼できる唯一の情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は認証済みレジストリワークフローに `clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするには dry run を使用します。その後、公開ページには公開済みのメタデータ、ファイル、ソースの帰属情報、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースのメタデータを記録するため、後で更新時に同じレジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペース外でレジストリ管理の Skill フォルダーを使いたいユーザー向けに、直接の Skill インストールおよび更新ワークフローにも対応しています。

## セキュリティ状態

ClawHub は公開に開かれていますが、リリースは引き続きアップロードゲート、自動チェック、ユーザー報告、モデレーターの対応の対象です。

公開ページは、利用可能な場合にスキャン概要を表示します。保留、非表示、またはブロックされたコンテンツは、診断のために所有者には表示されたまま、公開検索やインストールフローから消えることがあります。

[セキュリティ](/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)、および
[許容される使用](/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロード向けの公開読み取り API を提供します。サードパーティカタログは、正規の ClawHub リスティングへリンクし、レート制限を尊重し、承認を示唆しない場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api)および [HTTP API](/clawhub/http-api)を参照してください。

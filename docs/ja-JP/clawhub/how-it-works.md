---
read_when:
    - 一覧、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub の掲載、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-07-04T10:26:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw の Skills とプラグインのレジストリ層です。ユーザーには
パッケージを見つける場所を、公開者にはバージョンをリリースする場所を提供し、
OpenClaw にはそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- オーナーとスラッグまたはパッケージ名
- 1つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソース帰属
- `latest` などの変更履歴とタグ情報
- ダウンロード、インストール、スターのシグナル
- セキュリティスキャンとモデレーションのステータス

リスティングページは、ユーザーがインストール前に Skill や
プラグインが何を行うと主張しているかを確認するための正規の場所です。

## Skills

Skill は `SKILL.md` を中心としたバージョン管理されたテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` のフロントマターを読み取り、Skill 名、
説明、要件、環境変数、メタデータを理解します。正確な
メタデータは重要です。ユーザーが Skill をインストールするかどうかを判断しやすくし、
自動スキャンが宣言された動作と観測された動作の不一致を検出しやすくするためです。

[Skill 形式](/ja-JP/clawhub/skill-format)を参照してください。

## プラグイン

プラグインはパッケージ化された OpenClaw 拡張機能です。ClawHub はパッケージメタデータ、
互換性情報、ソースリンク、成果物、バージョンレコードを保存します。

OpenClaw が ClawHub からプラグインをインストールするとき、インストール前に公開されている互換性
メタデータを確認します。パッケージレコードには、API 互換性、
最小 Gateway バージョン、ホストターゲット、環境要件、成果物
ダイジェストを含めることができます。

レジストリを信頼できる唯一の情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は、認証済みレジストリワークフローに `clawhub`
CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするにはドライランを使用します。その後、公開ページには
公開されたメタデータ、ファイル、ソース帰属、スキャンステータスが表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースメタデータを記録するため、更新時に後から同じ
レジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外で
レジストリ管理の Skill フォルダーを使いたいユーザー向けに、直接の Skill インストールおよび
更新ワークフローもサポートします。

## セキュリティ状態

ClawHub は公開に開かれていますが、リリースには引き続きアップロードゲート、
自動チェック、ユーザー報告、モデレーターの対応が適用されます。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、
またはブロックされたコンテンツは、診断のためにオーナーには表示されたまま、
公開検索やインストールフローから消える場合があります。

[セキュリティ](/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、
[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)、および
[許容される使用](/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、
ダウンロードのための公開読み取り API を公開します。サードパーティのカタログは、正規の ClawHub リスティングにリンクし、
レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api) と [HTTP API](/clawhub/http-api)を参照してください。

---
read_when:
    - 掲載情報、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub の掲載情報、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-05-12T00:56:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は、OpenClaw の skills と plugins のレジストリ層です。ユーザーには
パッケージを見つける場所を、公開者にはバージョンをリリースする場所を提供し、
OpenClaw にはそれらのパッケージを安全にインストールして更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- オーナーとスラッグまたはパッケージ名
- 1つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソースの帰属情報
- `latest` などの changelog とタグ情報
- ダウンロード、インストール、スター、コメントのシグナル
- セキュリティスキャンとモデレーションの状態

リスティングページは、skill または plugin が何を行うと主張しているかを
ユーザーがインストール前に確認するための正規の場所です。

## Skills

skill は `SKILL.md` を中心とした、バージョン管理されたテキストバンドルです。
補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` の frontmatter を読み取り、skill の名前、説明、
要件、環境変数、メタデータを理解します。正確なメタデータは重要です。
ユーザーがその skill をインストールするかどうかを判断する助けになり、
自動スキャンが宣言された動作と観測された動作の不一致を検出する助けにもなるためです。

[Skill 形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugins

Plugins はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、
互換性情報、ソースリンク、成果物、バージョンレコードを保存します。

OpenClaw が ClawHub から plugin をインストールするときは、インストール前に
告知された互換性メタデータを確認します。パッケージレコードには、API 互換性、
最小 Gateway バージョン、ホストターゲット、環境要件、成果物ダイジェストを含めることができます。

レジストリを信頼できる情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は、認証済みレジストリワークフローに
`clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決後のペイロードをプレビューするには dry run を使用します。その後、公開ページに
公開済みメタデータ、ファイル、ソースの帰属情報、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースメタデータを記録するため、後で更新するときに同じ
レジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外で
レジストリ管理の skill フォルダーを使いたいユーザー向けに、直接の skill インストールと
更新ワークフローにも対応しています。

## セキュリティ状態

ClawHub は公開に開かれていますが、リリースは引き続きアップロードゲート、
自動チェック、ユーザー報告、モデレーターの対応の対象です。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、
またはブロックされたコンテンツは、診断のためにオーナーには表示されたまま、
公開検索やインストールフローから消えることがあります。

[セキュリティ + モデレーション](/ja-JP/clawhub/security)と
[許容される使用](/ja-JP/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロードのための公開読み取り API を公開します。
サードパーティカタログは、正規の ClawHub リスティングへリンクバックし、
レート制限を尊重し、推奨を示唆しない限り、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api)と [HTTP API](/ja-JP/clawhub/http-api)を参照してください。

---
read_when:
    - 掲載情報、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub の掲載、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-05-11T20:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw Skills と Plugin のレジストリ層です。ユーザーにはパッケージを発見する場所を、公開者にはバージョンをリリースする場所を提供し、OpenClaw にはそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- オーナーとスラッグまたはパッケージ名
- 1 つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソース属性
- `latest` などの変更履歴とタグ情報
- ダウンロード、インストール、スター、コメントのシグナル
- セキュリティスキャンとモデレーションのステータス

リスティングページは、ユーザーがインストール前に Skills や Plugin が何を行うと主張しているかを確認するための正規の場所です。

## Skills

Skill は `SKILL.md` を中心としたバージョン付きテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` の frontmatter を読み取り、Skill の名前、説明、要件、環境変数、メタデータを理解します。正確なメタデータは重要です。ユーザーが Skill をインストールするかどうかを判断する助けになり、自動スキャンが宣言された動作と観測された動作の不一致を検出する助けにもなるためです。

[Skill 形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugin

Plugin はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、互換性情報、ソースリンク、アーティファクト、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールするとき、インストール前に公表されている互換性メタデータを確認します。パッケージレコードには、API 互換性、最小 Gateway バージョン、ホストターゲット、環境要件、アーティファクトダイジェストを含めることができます。

レジストリを信頼できる情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は、認証済みレジストリワークフローに `clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするには、ドライランを使用します。その後、公開ページには公開されたメタデータ、ファイル、ソース属性、スキャンステータスが表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースのメタデータを記録するため、後で更新時に同じレジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外でレジストリ管理の Skill フォルダーを使いたいユーザー向けに、直接の Skill インストールおよび更新ワークフローもサポートします。

## セキュリティ状態

ClawHub は公開に対して開かれていますが、リリースは引き続きアップロードゲート、自動チェック、ユーザーレポート、モデレーターの対応の対象です。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、またはブロックされたコンテンツは、診断や異議申し立てのためにオーナーには表示されたまま、公開検索やインストールフローから消えることがあります。

[セキュリティ + モデレーション](/ja-JP/clawhub/security)と[許容される使用](/ja-JP/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロードのための公開読み取り API を公開しています。サードパーティのカタログは、正規の ClawHub リスティングへリンクし、レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api)と[HTTP API](/ja-JP/clawhub/http-api)を参照してください。

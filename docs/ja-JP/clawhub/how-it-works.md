---
read_when:
    - リスト、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub の掲載、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-07-03T00:51:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw の Skills とプラグインのレジストリ層です。ユーザーがパッケージを見つける場所を提供し、公開者がバージョンをリリースする場所を提供し、OpenClaw がそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リスティングは、以下を含むレジストリレコードです。

- 所有者とスラッグまたはパッケージ名
- 1 つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソース帰属
- `latest` などの changelog とタグ情報
- ダウンロード、インストール、スターのシグナル
- セキュリティスキャンとモデレーションのステータス

リスティングページは、ユーザーがインストール前に Skill またはプラグインが何を行うと主張しているかを確認するための正規の場所です。

## Skills

Skill は `SKILL.md` を中心としたバージョン付きテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` の frontmatter を読み取り、Skill 名、説明、要件、環境変数、メタデータを理解します。正確なメタデータは重要です。ユーザーが Skill をインストールするかどうかを判断する助けになり、自動スキャンが宣言された動作と観測された動作の不一致を検出する助けになるためです。

[Skill 形式](/ja-JP/clawhub/skill-format)を参照してください。

## プラグイン

プラグインはパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、互換性情報、ソースリンク、アーティファクト、バージョンレコードを保存します。

OpenClaw が ClawHub からプラグインをインストールするときは、インストール前に公開されている互換性メタデータを確認します。パッケージレコードには、API 互換性、最小 Gateway バージョン、ホストターゲット、環境要件、アーティファクトダイジェストを含めることができます。

レジストリを信頼できる情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は認証付きレジストリワークフローに `clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決されたペイロードをプレビューするにはドライランを使用します。その後、公開ページには公開済みメタデータ、ファイル、ソース帰属、スキャンステータスが表示されます。

## インストールと更新

OpenClaw のインストールコマンドは ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースのメタデータを記録するため、後で更新時に同じレジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外でレジストリ管理の Skill フォルダーを使いたいユーザー向けに、直接 Skill をインストールおよび更新するワークフローにも対応しています。

## セキュリティ状態

ClawHub は公開に開かれていますが、リリースには引き続きアップロードゲート、自動チェック、ユーザーレポート、モデレーター対応が適用されます。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、またはブロックされたコンテンツは、診断のため所有者には表示されたまま、公開検索やインストールフローから消えることがあります。

[セキュリティ](/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)、および[許容される利用](/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロードのための公開読み取り API を公開しています。サードパーティカタログは、正規の ClawHub リスティングへリンクし、レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api) と [HTTP API](/clawhub/http-api)を参照してください。

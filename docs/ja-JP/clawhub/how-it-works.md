---
read_when:
    - リスト、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub の掲載、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-06-28T07:41:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw のスキルとプラグインのレジストリレイヤーです。ユーザーがパッケージを発見できる場所、公開者がバージョンをリリースできる場所、そして OpenClaw がそれらのパッケージを安全にインストールおよび更新するために必要なメタデータを提供します。

## レジストリレコード

各公開リスティングは、次を含むレジストリレコードです。

- 所有者とスラッグまたはパッケージ名
- 1つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソースの帰属情報
- `latest` などの変更履歴とタグ情報
- ダウンロード、インストール、スターのシグナル
- セキュリティスキャンとモデレーションの状態

リスティングページは、ユーザーがインストール前にスキルやプラグインが何を行うと主張しているかを確認するための正規の場所です。

## Skills

スキルは、`SKILL.md` を中心としたバージョン管理されたテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` のフロントマターを読み取り、スキル名、説明、要件、環境変数、メタデータを把握します。正確なメタデータは重要です。ユーザーがスキルをインストールするか判断しやすくなり、自動スキャンが宣言された動作と観測された動作の不一致を検出しやすくなるためです。

[Skill形式](/ja-JP/clawhub/skill-format) を参照してください。

## Plugin

Plugin はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、互換性情報、ソースリンク、成果物、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールするとき、インストール前に提示された互換性メタデータを確認します。パッケージレコードには、API 互換性、最小 Gateway バージョン、ホストターゲット、環境要件、成果物ダイジェストを含めることができます。

レジストリを信頼できる情報源にしたい場合は、明示的な ClawHub インストールソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開により、新しい不変のバージョンレコードが作成されます。公開者は認証済みレジストリワークフローに `clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みペイロードをプレビューするには、ドライランを使用します。その後、公開ページに公開済みメタデータ、ファイル、ソースの帰属情報、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースのメタデータを記録するため、後で更新時に同じレジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外でレジストリ管理のスキルフォルダーを使いたいユーザー向けに、直接のスキルインストールおよび更新ワークフローもサポートします。

## セキュリティ状態

ClawHub は公開に対して開かれていますが、リリースには引き続きアップロードゲート、自動チェック、ユーザーレポート、モデレーターの対応が適用されます。

公開ページには、利用可能な場合にスキャン概要が表示されます。保留、非表示、またはブロックされたコンテンツは、診断のために所有者には表示されたまま、公開検索やインストールフローから消えることがあります。

[セキュリティ](/ja-JP/clawhub/security)、[セキュリティ監査](/ja-JP/clawhub/security-audits)、[モデレーションとアカウントの安全性](/ja-JP/clawhub/moderation)、[許容される使用](/ja-JP/clawhub/acceptable-usage) を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロードのための公開読み取り API を公開します。サードパーティのカタログは、正規の ClawHub リスティングにリンクし、レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/ja-JP/clawhub/api) と [HTTP API](/ja-JP/clawhub/http-api) を参照してください。

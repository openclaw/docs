---
read_when:
    - リスト、バージョン、インストール、公開、モデレーションを理解する
summary: ClawHub のリスティング、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-07-06T21:46:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw の Skills と plugins のレジストリレイヤーです。ユーザーにパッケージを発見する場所を提供し、公開者にバージョンをリリースする場所を提供し、OpenClaw がそれらのパッケージを安全にインストールおよび更新するために十分なメタデータを提供します。

## レジストリレコード

各公開リストは、次を含むレジストリレコードです。

- オーナーとスラッグまたはパッケージ名
- 1つ以上の公開済みバージョン
- メタデータ、概要、ファイル、ソース帰属
- `latest` などの変更履歴とタグ情報
- ダウンロード、インストール、スターのシグナル
- セキュリティスキャンとモデレーションのステータス

リストページは、ユーザーがインストール前に skill または plugin が何を行うと主張しているかを確認するための正規の場所です。

## Skills

skill は `SKILL.md` を中心とするバージョン管理されたテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` のフロントマターを読み取り、skill 名、説明、要件、環境変数、メタデータを理解します。正確なメタデータは、ユーザーが skill をインストールするかどうかを判断する助けになり、自動スキャンが宣言された動作と観測された動作の不一致を検出する助けにもなるため重要です。

[Skill 形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugins

Plugins はパッケージ化された OpenClaw 拡張です。ClawHub はパッケージメタデータ、互換性情報、ソースリンク、アーティファクト、バージョンレコードを保存します。

OpenClaw が ClawHub から plugin をインストールするとき、インストール前に提示された互換性メタデータを確認します。パッケージレコードには、API 互換性、最小 gateway バージョン、ホストターゲット、環境要件、アーティファクトダイジェストを含めることができます。

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

アップロード前に解決済みペイロードをプレビューするには、ドライランを使用します。その後、公開ページに公開済みメタデータ、ファイル、ソース帰属、スキャンステータスが表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストールソースメタデータを記録するため、後で同じレジストリパッケージを解決して更新できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外部でレジストリ管理の skill フォルダーを使用したいユーザー向けに、直接 skill をインストールおよび更新するワークフローもサポートします。

## セキュリティ状態

ClawHub は公開に開かれていますが、リリースは引き続きアップロードゲート、自動チェック、ユーザーレポート、モデレーターの対応の対象です。

公開ページでは、利用可能な場合にスキャン概要が表示されます。保留、非表示、またはブロックされたコンテンツは、診断のためにオーナーには表示されたまま、公開検索やインストールフローから消えることがあります。

[セキュリティ](/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウントの安全性](/ja-JP/clawhub/moderation)、および[許容される使用](/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、発見、検索、パッケージ詳細、ダウンロードのための公開読み取り API を公開しています。サードパーティのカタログは、正規の ClawHub リストへリンクし、レート制限を尊重し、推奨を示唆しない場合に、これらの API を使用できます。

[公開 API](/clawhub/api) と [HTTP API](/clawhub/http-api)を参照してください。

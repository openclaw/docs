---
read_when:
    - 掲載、バージョン、インストール、公開、モデレーションについて理解する
summary: ClawHub の掲載情報、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-07-11T22:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は OpenClaw のスキルと Plugin のレジストリ層です。ユーザーにはパッケージを見つける場所を、公開者にはバージョンをリリースする場所を提供し、OpenClaw がそれらのパッケージを安全にインストールおよび更新するために必要なメタデータを提供します。

## レジストリレコード

各公開リストは、以下を含むレジストリレコードです。

- 所有者とスラッグまたはパッケージ名
- 公開済みの 1 つ以上のバージョン
- メタデータ、概要、ファイル、ソースの帰属情報
- 変更履歴、および `latest` などのタグ情報
- ダウンロード、インストール、お気に入り登録の指標
- セキュリティスキャンとモデレーションの状態

リストページは、スキルや Plugin が何を行うと説明しているかを、ユーザーがインストール前に確認するための正規の場所です。

## スキル

スキルは、`SKILL.md` を中心とするバージョン管理されたテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` のフロントマターを読み取り、スキル名、説明、要件、環境変数、メタデータを把握します。正確なメタデータは、ユーザーがスキルをインストールするかどうかを判断する助けとなり、自動スキャンが宣言された動作と観測された動作の不一致を検出する助けにもなるため、重要です。

[スキルの形式](/clawhub/skill-format)を参照してください。

## Plugin

Plugin は、パッケージ化された OpenClaw の拡張機能です。ClawHub は、パッケージのメタデータ、互換性情報、ソースリンク、成果物、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールする際は、インストール前に提示された互換性メタデータを確認します。パッケージレコードには、API の互換性、Gateway の最低バージョン、対象ホスト、環境要件、成果物のダイジェストを含めることができます。

レジストリを信頼できる唯一の情報源として使用する場合は、ClawHub のインストール元を明示的に指定します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は、認証が必要なレジストリ操作に `clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みのペイロードを確認するには、ドライランを使用します。その後、公開ページに、公開済みのメタデータ、ファイル、ソースの帰属情報、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージソースとして使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストール元のメタデータを記録するため、後から更新する際に同じレジストリパッケージを解決できます。ClawHub CLI は、完全な OpenClaw ワークスペースの外部でレジストリ管理のスキルフォルダーを使用したいユーザー向けに、スキルを直接インストールおよび更新するワークフローもサポートしています。

## セキュリティ状態

ClawHub では自由に公開できますが、リリースは引き続き、アップロード時のゲート、自動チェック、ユーザーからの報告、モデレーターによる措置の対象となります。

公開ページには、利用可能な場合、スキャンの概要が表示されます。保留、非表示、またはブロックされたコンテンツは、所有者が診断のために引き続き確認できる一方で、公開検索やインストールフローには表示されなくなる場合があります。

[セキュリティ](/ja-JP/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウントの安全性](/ja-JP/clawhub/moderation)、[許容される利用方法](/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、探索、検索、パッケージの詳細、ダウンロードのための公開読み取り API を提供しています。サードパーティのカタログは、正規の ClawHub リストへのリンクを設置し、レート制限を順守し、推奨を受けていると誤解させる表現を避ける場合に、これらの API を使用できます。

[公開 API](/clawhub/api)および [HTTP API](/clawhub/http-api)を参照してください。

---
read_when:
    - リスティング、バージョン、インストール、公開、モデレーションについて理解する
summary: ClawHub のリスト、バージョン、インストール、公開、スキャン、更新の仕組み。
x-i18n:
    generated_at: "2026-07-12T21:28:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub の仕組み

ClawHub は、OpenClaw の Skills と Plugin のためのレジストリレイヤーです。ユーザーにはパッケージを見つける場所を、公開者にはバージョンをリリースする場所を提供し、OpenClaw がそれらのパッケージを安全にインストールおよび更新するために必要なメタデータを提供します。

## レジストリレコード

各公開リストは、以下を含むレジストリレコードです。

- 所有者とスラッグまたはパッケージ名
- 公開済みの 1 つ以上のバージョン
- メタデータ、概要、ファイル、ソースの帰属情報
- 変更履歴と `latest` などのタグ情報
- ダウンロード、インストール、お気に入り登録の指標
- セキュリティスキャンとモデレーションの状態

リストページは、Skill や Plugin をインストールする前に、それらがどのような機能をうたっているかをユーザーが確認するための正式な場所です。

## Skills

Skill は、`SKILL.md` を中心とするバージョン管理されたテキストバンドルです。補助ファイル、例、テンプレート、スクリプトを含めることができます。

ClawHub は `SKILL.md` のフロントマターを読み取り、Skill の名前、説明、要件、環境変数、メタデータを把握します。正確なメタデータは、ユーザーが Skill をインストールするかどうかを判断するのに役立ち、自動スキャンが宣言された動作と観測された動作の不一致を検出するのにも役立つため、重要です。

[Skill の形式](/ja-JP/clawhub/skill-format)を参照してください。

## Plugin

Plugin は、パッケージ化された OpenClaw の拡張機能です。ClawHub は、パッケージのメタデータ、互換性情報、ソースリンク、成果物、バージョンレコードを保存します。

OpenClaw が ClawHub から Plugin をインストールするときは、インストール前に提示された互換性メタデータを確認します。パッケージレコードには、API の互換性、Gateway の最小バージョン、対象ホスト、環境要件、成果物のダイジェストを含めることができます。

レジストリを信頼できる唯一の情報源として使用する場合は、ClawHub のインストール元を明示的に指定します。

```bash
openclaw plugins install clawhub:<package>
```

## 公開

公開すると、新しい不変のバージョンレコードが作成されます。公開者は、認証が必要なレジストリのワークフローに `clawhub` CLI を使用します。

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

アップロード前に解決済みのペイロードを確認するには、ドライランを使用します。その後、公開ページに、公開されたメタデータ、ファイル、ソースの帰属情報、スキャン状態が表示されます。

## インストールと更新

OpenClaw のインストールコマンドは、ClawHub をパッケージの取得元として使用します。

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw はインストール元のメタデータを記録するため、後で同じレジストリパッケージを解決して更新できます。また、ClawHub CLI は、完全な OpenClaw ワークスペースの外部でレジストリ管理の Skill フォルダーを使用するユーザー向けに、Skill を直接インストールおよび更新するワークフローもサポートしています。

## セキュリティ状態

ClawHub では誰でも公開できますが、リリースには引き続きアップロード時のゲート、自動チェック、ユーザーからの報告、モデレーターによる措置が適用されます。

公開ページには、利用可能な場合はスキャンの概要が表示されます。保留、非表示、またはブロックされたコンテンツは、所有者が診断のために引き続き確認できる一方で、公開検索やインストールフローには表示されなくなる場合があります。

[セキュリティ](/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウントの安全性](/ja-JP/clawhub/moderation)、[許容される利用方法](/clawhub/acceptable-usage)を参照してください。

## API アクセス

ClawHub は、検出、検索、パッケージの詳細、ダウンロードのための公開読み取り API を提供します。サードパーティのカタログは、ClawHub の正式なリストへのリンクを掲載し、レート制限を遵守し、推奨されていると誤解させる表現を避ける場合に、これらの API を使用できます。

[公開 API](/clawhub/api)および [HTTP API](/clawhub/http-api)を参照してください。

---
read_when:
    - ClawHub のセキュリティ問題を報告する
    - ClawHub の脆弱性開示を理解する
    - ClawHubプラットフォームの問題とサードパーティのSkillまたはPluginの問題を区別する
sidebarTitle: Security
summary: ClawHub のセキュリティ問題を報告する方法と、脆弱性が公開されるタイミング。
title: セキュリティ
x-i18n:
    generated_at: "2026-06-28T07:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# セキュリティ

ClawHub のセキュリティ問題は、`openclaw/clawhub` の GitHub Security Advisories を通じて報告できます。

ClawHub 自体の脆弱性には GitHub Security Advisories を使用してください。適切な ClawHub アドバイザリ報告には、次のバグが含まれます。

- ClawHub の Web サイト、API、または CLI
- レジストリへの公開、ダウンロード、インストール、またはアーティファクトの整合性
- 認証、認可、または API トークン
- スキャン、モデレーション、または報告処理

サードパーティの skill または plugin 自身のソースコードに含まれる脆弱性については、ClawHub アドバイザリを使用しないでください。それらは、ClawHub の掲載情報からリンクされている公開者またはソースリポジトリに直接報告してください。

## 脆弱性の開示

ClawHub はホスト型クラウドアプリケーションであるため、ClawHub サービスの脆弱性はデフォルトでは公開開示されません。実際のユーザー影響の証拠がある場合、またはユーザーが対応を取る必要がある場合に公開開示されます。

実際のユーザー影響の例には、悪用の確認、ユーザーデータまたはシークレットの露出、プラットフォーム障害によって悪意のあるコンテンツがユーザーに到達したこと、またはユーザーに認証情報のローテーション、ローカルソフトウェアの更新、その他の保護措置を必要とさせる問題が含まれます。

ユーザーがインストールしたソフトウェアの脆弱性は公開開示されます。たとえば、ユーザーがローカルで更新する必要がある ClawHub CLI パッケージ、バイナリ、ライブラリ、その他のリリースアーティファクトです。

## 関連ページ

インストール時の監査ラベル、リスクレベル、検出事項、および解釈については、[セキュリティ監査](/ja-JP/clawhub/security-audits)を参照してください。

マーケットプレイス報告、モデレーション保留、非表示の掲載、禁止、およびアカウント状態については、[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)を参照してください。

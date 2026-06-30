---
read_when:
    - ClawHub セキュリティ問題の報告
    - ClawHub の脆弱性開示を理解する
    - ClawHub プラットフォームの問題とサードパーティのスキルまたはプラグインの問題を区別する
sidebarTitle: Security
summary: ClawHub のセキュリティ問題を報告する方法と、脆弱性がいつ公開されるか。
title: セキュリティ
x-i18n:
    generated_at: "2026-06-30T22:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# セキュリティ

ClawHub のセキュリティ問題は、`openclaw/clawhub` の GitHub Security Advisories を通じて報告できます。

ClawHub 自体の脆弱性には GitHub Security Advisories を使用してください。良い ClawHub advisory レポートには、以下のバグが含まれます。

- ClawHub のウェブサイト、API、または CLI
- レジストリ公開、ダウンロード、インストール、またはアーティファクトの完全性
- 認証、認可、または API トークン
- スキャン、モデレーション、またはレポート処理

サードパーティの skill やプラグイン自身のソースコードにある脆弱性には、ClawHub advisories を使用しないでください。ClawHub listing からリンクされている公開元またはソースリポジトリへ直接報告してください。

## 脆弱性の開示

ClawHub はホスト型クラウドアプリケーションであるため、ClawHub サービスの脆弱性はデフォルトでは公開されません。実際のユーザー影響の証拠がある場合、またはユーザーが対応を取る必要がある場合に公開されます。

実際のユーザー影響の例には、確認済みの悪用、ユーザーデータやシークレットの露出、プラットフォームの障害によって悪意あるコンテンツがユーザーに届くこと、またはユーザーが認証情報をローテーションする、ローカルソフトウェアを更新する、その他の保護措置を取る必要がある問題が含まれます。

ユーザーがインストールしたソフトウェアの脆弱性は公開されます。たとえば、ClawHub CLI パッケージ、バイナリ、ライブラリ、またはユーザーがローカルで更新する必要があるその他のリリースアーティファクトなどです。

## 関連ページ

インストール時の監査ラベル、リスクレベル、検出事項、および解釈については、[セキュリティ監査](/clawhub/security-audits)を参照してください。

マーケットプレイスのレポート、モデレーション保留、非表示の listing、禁止、およびアカウントの状態については、[モデレーションとアカウント安全性](/clawhub/moderation)を参照してください。

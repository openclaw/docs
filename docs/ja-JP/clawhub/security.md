---
read_when:
    - ClawHubのセキュリティ問題を報告する
    - ClawHub の脆弱性開示を理解する
    - ClawHub プラットフォームの問題とサードパーティの skill または plugin の問題を区別する
sidebarTitle: Security
summary: ClawHub のセキュリティ問題を報告する方法と、脆弱性がいつ公開されるか。
title: セキュリティ
x-i18n:
    generated_at: "2026-07-05T01:54:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# セキュリティ

ClawHub のセキュリティ問題は、`openclaw/clawhub` の GitHub Security Advisories を通じて報告できます。

ClawHub 自体の脆弱性には GitHub Security Advisories を使用してください。適切な ClawHub アドバイザリーレポートには、次のバグが含まれます。

- ClawHub ウェブサイト、API、または CLI
- レジストリ公開、ダウンロード、インストール、またはアーティファクトの完全性
- 認証、認可、または API トークン
- スキャン、モデレーション、またはレポート処理

サードパーティの skill または plugin 自身のソースコードの脆弱性には、ClawHub アドバイザリーを使用しないでください。ClawHub リストからリンクされている公開元またはソースリポジトリに直接報告してください。

## 脆弱性の開示

ClawHub はホスト型クラウドアプリケーションであるため、ClawHub サービスの脆弱性はデフォルトでは公開されません。実際のユーザー影響の証拠がある場合、またはユーザーが対応する必要がある場合に公開されます。

実際のユーザー影響の例には、確認された悪用、ユーザーデータやシークレットの露出、プラットフォーム障害によって悪意のあるコンテンツがユーザーに届くこと、またはユーザーが認証情報をローテーションしたり、ローカルソフトウェアを更新したり、その他の保護措置を取る必要がある問題が含まれます。

ユーザーがインストールするソフトウェアの脆弱性は公開されます。たとえば、ユーザーがローカルで更新する必要がある ClawHub CLI パッケージ、バイナリ、ライブラリ、その他のリリースアーティファクトなどです。

## 関連ページ

インストール時の監査ラベル、リスクレベル、検出事項、解釈については、[セキュリティ監査](/clawhub/security-audits)を参照してください。

マーケットプレイスのレポート、モデレーション保留、非表示リスト、禁止、アカウントの状態については、[モデレーションとアカウントの安全性](/clawhub/moderation)を参照してください。

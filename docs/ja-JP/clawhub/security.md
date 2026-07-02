---
read_when:
    - ClawHub のセキュリティ問題を報告する
    - ClawHub の脆弱性開示を理解する
    - ClawHub プラットフォームの問題とサードパーティのスキルまたはプラグインの問題を区別する
sidebarTitle: Security
summary: ClawHub のセキュリティ問題を報告する方法と、脆弱性が公開されるタイミング。
title: セキュリティ
x-i18n:
    generated_at: "2026-07-02T13:58:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# セキュリティ

ClawHub のセキュリティ問題は、`openclaw/clawhub` の GitHub Security Advisories を通じて報告できます。

ClawHub 自体の脆弱性には GitHub Security Advisories を使用してください。適切な ClawHub advisory レポートには、次のバグが含まれます。

- ClawHub のウェブサイト、API、または CLI
- レジストリ公開、ダウンロード、インストール、またはアーティファクトの完全性
- 認証、認可、または API トークン
- スキャン、モデレーション、またはレポート処理

サードパーティの skill または plugin 独自のソースコード内の脆弱性には、ClawHub advisories を使用しないでください。ClawHub の掲載情報からリンクされている公開元またはソースリポジトリに直接報告してください。

## 脆弱性の開示

ClawHub はホスト型クラウドアプリケーションであるため、ClawHub サービスの脆弱性はデフォルトでは公開されません。実際のユーザー影響の証拠がある場合、またはユーザーが対応を取る必要がある場合に公開されます。

実際のユーザー影響の例には、悪用の確認、ユーザーデータやシークレットの露出、プラットフォーム障害により悪意のあるコンテンツがユーザーに到達したこと、またはユーザーが認証情報のローテーション、ローカルソフトウェアの更新、その他の保護措置を取る必要がある問題が含まれます。

ユーザーがインストールしたソフトウェア内の脆弱性は公開されます。これには、ユーザーがローカルで更新する必要がある ClawHub CLI パッケージ、バイナリ、ライブラリ、その他のリリースアーティファクトなどが含まれます。

## 関連ページ

インストール時の監査ラベル、リスクレベル、検出事項、および解釈については、[セキュリティ監査](/clawhub/security-audits) を参照してください。

マーケットプレイスのレポート、モデレーション保留、非表示の掲載、禁止措置、アカウントの状態については、[モデレーションとアカウント安全性](/clawhub/moderation) を参照してください。

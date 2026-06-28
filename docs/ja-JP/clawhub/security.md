---
read_when:
    - ClawHub のセキュリティ問題を報告する
    - ClawHub の脆弱性開示を理解する
    - ClawHub プラットフォームの問題とサードパーティの skill または plugin の問題を区別する
sidebarTitle: Security
summary: ClawHub のセキュリティ問題を報告する方法と、脆弱性が公開されるタイミング。
title: セキュリティ
x-i18n:
    generated_at: "2026-06-28T00:11:55Z"
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
- レジストリ公開、ダウンロード、インストール、または成果物の完全性
- 認証、認可、または API トークン
- スキャン、モデレーション、または報告処理

サードパーティのスキルまたはプラグイン自身のソースコードにある脆弱性には、ClawHub アドバイザリを使用しないでください。ClawHub の掲載情報からリンクされている公開元またはソースリポジトリに直接報告してください。

## 脆弱性の開示

ClawHub はホスト型クラウドアプリケーションであるため、ClawHub サービスの脆弱性はデフォルトでは公開されません。実際のユーザー影響の証拠がある場合、またはユーザーが対応を取る必要がある場合に公開されます。

実際のユーザー影響の例には、確認済みの悪用、ユーザーデータやシークレットの露出、プラットフォーム障害によって悪意のあるコンテンツがユーザーに届くこと、またはユーザーが認証情報のローテーション、ローカルソフトウェアの更新、その他の保護措置を取る必要がある問題が含まれます。

ユーザーがローカルで更新する必要がある ClawHub CLI パッケージ、バイナリ、ライブラリ、その他のリリース成果物など、ユーザーがインストールしたソフトウェアの脆弱性は公開されます。

## 関連ページ

インストール時の監査ラベル、リスクレベル、検出事項、および解釈については、[セキュリティ監査](/ja-JP/clawhub/security-audits) を参照してください。

マーケットプレイスの報告、モデレーション保留、非表示の掲載、禁止、アカウント状態については、[モデレーションとアカウントの安全性](/ja-JP/clawhub/moderation) を参照してください。

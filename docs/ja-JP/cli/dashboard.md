---
read_when:
    - 現在のトークンで Control UI を開きたい場合
    - ブラウザを起動せずに URL を表示したい場合
summary: '`openclaw dashboard` の CLI リファレンス（Control UI を開く）'
title: ダッシュボード
x-i18n:
    generated_at: "2026-04-24T04:50:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

現在の認証を使用して Control UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注:

- `dashboard` は、可能な場合は設定された `gateway.auth.token` SecretRef を解決します。
- SecretRef 管理トークン（解決済みまたは未解決）の場合、`dashboard` は外部シークレットがターミナル出力、クリップボード履歴、またはブラウザ起動引数に露出しないよう、トークン化されていない URL を表示/コピー/オープンします。
- `gateway.auth.token` が SecretRef 管理だがこのコマンド経路では未解決の場合、このコマンドは無効なトークンプレースホルダーを埋め込む代わりに、トークン化されていない URL と明示的な対処ガイダンスを表示します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ダッシュボード](/ja-JP/web/dashboard)

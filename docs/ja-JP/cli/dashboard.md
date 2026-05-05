---
read_when:
    - 現在のトークンを使ってコントロール UI を開きたい
    - ブラウザーを起動せずに URL を出力したい場合
summary: '`openclaw dashboard`（コントロールUIを開く）のCLIリファレンス'
title: ダッシュボード
x-i18n:
    generated_at: "2026-05-05T01:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

現在の認証を使用して Control UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注記:

- `dashboard` は、可能な場合に設定済みの `gateway.auth.token` SecretRefs を解決します。
- `dashboard` は `gateway.tls.enabled` に従います。TLS が有効な Gateway は
  `https://` Control UI URL を表示/開き、`wss://` 経由で接続します。
- トークン認証されたダッシュボード URL のクリップボード/ブラウザー配信に失敗した場合、
  `dashboard` は安全な手動認証ヒントをログに記録し、トークン値を出力せずに
  `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token`、フラグメントキー `token` を示します。
- SecretRef で管理されたトークン（解決済みまたは未解決）の場合、`dashboard` はターミナル出力、クリップボード履歴、ブラウザー起動引数で外部シークレットを公開しないように、トークン化されていない URL を表示/コピー/開きます。
- `gateway.auth.token` が SecretRef で管理されているものの、このコマンドパスで未解決の場合、コマンドは無効なトークンプレースホルダーを埋め込む代わりに、トークン化されていない URL と明示的な修復手順を表示します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ダッシュボード](/ja-JP/web/dashboard)

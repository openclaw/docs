---
read_when:
    - 現在のトークンで Control UI を開きたい
    - ブラウザーを起動せずに URL を出力したい場合
summary: '`openclaw dashboard` のCLIリファレンス（Control UIを開く）'
title: ダッシュボード
x-i18n:
    generated_at: "2026-07-05T11:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79c5e0884fca90c582499b73d49a72dccb09dd60cd1777c95040f540a3e539f3
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

現在の認証を使用して Control UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: URL を出力しますが、ブラウザーは起動しません。
- `--yes`: 必要な場合にプロンプトを表示せずに Gateway を起動またはインストールします。

注記:

- 可能な場合は、設定済みの `gateway.auth.token` SecretRefs を解決します。
- `gateway.tls.enabled` に従います。TLS が有効な Gateway は `https://` の Control UI URL を出力または開き、`wss://` 経由で接続します。
- SecretRef 管理のトークン (解決済みまたは未解決) については、出力、コピー、または開かれる URL にトークンが含まれることはないため、外部シークレットがターミナル出力、クリップボード履歴、またはブラウザー起動引数に漏れることはありません。
- `gateway.auth.token` が SecretRef 管理だが未解決の場合、このコマンドは無効なトークンプレースホルダーではなく、トークンを含まない URL と修復ガイダンスを出力します。
- トークン認証付き URL のクリップボードまたはブラウザーへの配信が失敗した場合、このコマンドはトークン値を出力せずに、`OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token`、URL フラグメントキー `token` を示す安全な手動認証ヒントをログに記録します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Dashboard](/ja-JP/web/dashboard)

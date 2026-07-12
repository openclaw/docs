---
read_when:
    - 現在のトークンで Control UI を開く場合
    - ブラウザを起動せずに URL を表示したい場合
summary: '`openclaw dashboard` の CLI リファレンス（Control UI を開く）'
title: ダッシュボード
x-i18n:
    generated_at: "2026-07-11T22:05:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

現在の認証情報を使用して Control UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: URL を表示しますが、ブラウザーは起動しません。
- `--yes`: 必要に応じて、確認を求めずに Gateway を起動またはインストールします。

注意:

- 可能な場合は、設定された `gateway.auth.token` の SecretRef を解決します。
- `gateway.tls.enabled` に従います。TLS が有効な Gateway では、`https://` の Control UI URL を表示して開き、`wss://` で接続します。
- `lan` またはワイルドカードの `custom` バインドの場合、ワイルドカードはブラウザーの接続先にはできないため、同一ホストからの起動では常にループバックを使用します。平文の `tailnet` および `custom` バインドでも、ブラウザーがセキュアコンテキストを使用できるように `127.0.0.1` を使用します。TLS が有効で特定のホストを指定している場合は、証明書名と一致するよう、設定されたアドレスを維持します。
- 特定インターフェースへのバインドに対して、認証済みのループバック URL を提供する前に、コマンドは設定されたインターフェースを検査し、そのインターフェースと `127.0.0.1` が同じ Gateway プロセスによって所有されていることを確認します。リスナーの所有者が曖昧な場合は、安全側に倒して失敗し、状態を確認するための案内を表示します。
- SecretRef で管理されるトークンについては、解決済みか未解決かにかかわらず、表示、コピー、または起動される URL にトークンが含まれることはありません。そのため、外部シークレットがターミナル出力、クリップボード履歴、またはブラウザー起動引数に漏れることはありません。
- `gateway.auth.token` が SecretRef で管理されているものの未解決の場合、コマンドは無効なトークンプレースホルダーの代わりに、トークンを含まない URL と修正方法の案内を表示します。
- トークン認証 URL のクリップボードまたはブラウザーへの受け渡しに失敗した場合、コマンドはトークン値を表示せずに、`OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token`、および URL フラグメントキー `token` を示す、安全な手動認証のヒントをログに記録します。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [ダッシュボード](/ja-JP/web/dashboard)

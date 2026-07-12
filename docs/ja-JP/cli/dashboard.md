---
read_when:
    - 現在のトークンで Control UI を開く場合
    - ブラウザを起動せずに URL を表示したい場合
summary: '`openclaw dashboard`（Control UI を開く）の CLI リファレンス'
title: ダッシュボード
x-i18n:
    generated_at: "2026-07-12T14:22:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
- `--yes`: 必要な場合、確認を求めずに Gateway を起動またはインストールします。

注:

- 可能な場合、設定済みの `gateway.auth.token` SecretRef を解決します。
- `gateway.tls.enabled` の設定に従います。TLS が有効な Gateway では、`https://` の Control UI URL を表示して開き、`wss://` 経由で接続します。
- `lan` またはワイルドカードの `custom` バインドでは、ワイルドカードはブラウザーの接続先にできないため、同じホストからの起動では常にループバックを使用します。平文の `tailnet` および `custom` バインドでも、ブラウザーでセキュアコンテキストを確保するために `127.0.0.1` を使用します。TLS が有効な特定ホストでは、証明書名が一致するように設定済みのアドレスを維持します。
- 特定インターフェースへのバインドに対して認証済みのループバック URL を提供する前に、コマンドは設定済みのインターフェースを検査し、そのインターフェースと `127.0.0.1` が同じ Gateway プロセスによって所有されていることを確認します。リスナーの所有者が曖昧な場合は、ステータス確認の案内を表示して安全側に失敗します。
- SecretRef で管理されるトークンは、解決済みか未解決かにかかわらず、表示、コピー、または開かれる URL に含まれません。そのため、外部シークレットが端末出力、クリップボード履歴、またはブラウザー起動引数に漏洩することはありません。
- `gateway.auth.token` が SecretRef で管理されているものの未解決の場合、無効なトークンプレースホルダーの代わりに、トークンを含まない URL と修復手順を表示します。
- トークン認証付き URL のクリップボードまたはブラウザーへの受け渡しに失敗した場合、コマンドはトークン値を表示せずに、`OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token`、および URL フラグメントキー `token` を示す、安全な手動認証のヒントをログに記録します。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [ダッシュボード](/ja-JP/web/dashboard)

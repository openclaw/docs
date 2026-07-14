---
read_when:
    - 現在のトークンで Control UI を開く場合
    - ブラウザを起動せずに URL を表示したい場合
summary: '`openclaw dashboard` の CLI リファレンス（Control UI を開く）'
title: ダッシュボード
x-i18n:
    generated_at: "2026-07-14T13:34:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

現在の認証を使用して Control UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: URL を出力しますが、ブラウザーは起動しません。
- `--json`: ブラウザーを開く、クリップボードを使用する、プロンプトを表示する、または Gateway を起動することなく、機械可読な接続オブジェクトを 1 つ出力します。
- `--yes`: 必要な場合、プロンプトを表示せずに Gateway を起動またはインストールします。

## 機械可読出力

解決済みの Control UI URL を必要とするデスクトップ統合やスクリプトでは、`--json` を使用します。

```bash
openclaw dashboard --json
```

レスポンスには `url`、`httpUrl`、`wsUrl`、`port`、および `tokenIncluded` が含まれます。Gateway の準備ができていない場合、コマンドは `{"ok":false,"reason":"..."}` を返し、0 以外の終了コードで終了します。SecretRef で管理されるトークンは、`url` に含まれることはありません。

注記:

- 可能な場合、設定済みの `gateway.auth.token` SecretRef を解決します。
- `gateway.tls.enabled` に従います。TLS が有効な Gateway は、`https://` の Control UI URL を出力または開き、`wss://` 経由で接続します。
- `lan` またはワイルドカードの `custom` バインドでは、ワイルドカードはブラウザーの接続先ではないため、同一ホストからの起動では常にループバックを使用します。平文の `tailnet` および `custom` バインドでも、ブラウザーにセキュアコンテキストを提供するために `127.0.0.1` を使用します。TLS が有効な特定ホストでは、証明書名と一致するよう、設定されたアドレスを維持します。
- 特定インターフェースへのバインドに対して認証済みループバック URL を提供する前に、コマンドは設定済みインターフェースをプローブし、そのインターフェースと `127.0.0.1` が同じ Gateway プロセスによって所有されていることを確認します。リスナーの所有権が曖昧な場合は、安全側に倒して失敗し、ステータス確認の手順を示します。
- SecretRef で管理されるトークンでは、解決済みか未解決かにかかわらず、出力、コピー、または開かれる URL にトークンが含まれることはありません。そのため、外部シークレットがターミナル出力、クリップボード履歴、またはブラウザー起動引数に漏洩することはありません。
- `gateway.auth.token` が SecretRef で管理されているものの未解決の場合、コマンドは無効なトークンプレースホルダーではなく、トークンを含まない URL と修復手順を出力します。
- トークン認証 URL のクリップボードまたはブラウザーへの受け渡しに失敗した場合、コマンドはトークン値を出力せず、`OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token`、および URL フラグメントキー `token` を示す、安全な手動認証のヒントをログに記録します。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [ダッシュボード](/ja-JP/web/dashboard)

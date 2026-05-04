---
read_when:
    - デプロイ前に、運用者が管理するプロキシルーティングを検証する必要があります
    - デバッグのために OpenClaw のトランスポートトラフィックをローカルでキャプチャする必要がある
    - デバッグプロキシのセッション、ブロブ、または組み込みクエリプリセットを確認したい場合
summary: オペレーター管理のプロキシ検証とローカルデバッグプロキシキャプチャインスペクターを含む、`openclaw proxy` の CLI リファレンス
title: プロキシ
x-i18n:
    generated_at: "2026-05-04T04:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

オペレーター管理プロキシルーティングを検証するか、ローカルの明示的なデバッグプロキシを実行して、キャプチャされたトラフィックを調査します。

OpenClaw のプロキシルーティングを有効にする前に、`validate` を使用してオペレーター管理フォワードプロキシを事前確認します。その他のコマンドは、トランスポートレベルの調査用デバッグツールです。ローカルプロキシの起動、キャプチャを有効にした子コマンドの実行、キャプチャセッションの一覧表示、一般的なトラフィックパターンのクエリ、キャプチャされた blob の読み取り、ローカルキャプチャデータの削除を実行できます。

## コマンド

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 検証

`openclaw proxy validate` は、`--proxy-url`、設定、または `OPENCLAW_PROXY_URL` から有効なオペレーター管理プロキシ URL を確認します。プロキシが有効化および設定されていない場合は、設定の問題として報告します。設定を変更する前の一回限りの事前確認には `--proxy-url` を使用します。デフォルトでは、公開宛先がプロキシ経由で成功すること、およびプロキシが一時的な loopback カナリアに到達できないことを検証します。カスタム拒否宛先はフェイルクローズです。デプロイ固有の拒否シグナルを別途検証できる場合を除き、HTTP レスポンスと曖昧なトランスポート障害はいずれも失敗になります。

オプション:

- `--json`: 機械可読 JSON を出力します。
- `--proxy-url <url>`: 設定または環境変数の代わりに、このプロキシ URL を検証します。
- `--allowed-url <url>`: プロキシ経由で成功することが想定される宛先を追加します。複数の宛先を確認するには繰り返します。
- `--denied-url <url>`: プロキシによってブロックされることが想定される宛先を追加します。複数の宛先を確認するには繰り返します。
- `--timeout-ms <ms>`: リクエストごとのタイムアウトをミリ秒で指定します。

デプロイのガイダンスと拒否セマンティクスについては、[ネットワークプロキシ](/ja-JP/security/network-proxy)を参照してください。

## クエリプリセット

`openclaw proxy query --preset <name>` は次を受け付けます。

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注記

- `start` は、`--host` が設定されていない限り、デフォルトで `127.0.0.1` になります。
- `run` はローカルデバッグプロキシを起動し、その後 `--` の後にあるコマンドを実行します。
- デバッグプロキシの直接アップストリーム転送は、診断のためにアップストリームソケットを開きます。OpenClaw 管理プロキシモードが有効な場合、プロキシリクエストと CONNECT トンネルの直接転送はデフォルトで無効です。承認済みのローカル診断の場合にのみ、`OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` を設定してください。
- `validate` は、プロキシ設定または宛先チェックが失敗した場合、コード 1 で終了します。
- キャプチャはローカルデバッグデータです。完了したら `openclaw proxy purge` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ネットワークプロキシ](/ja-JP/security/network-proxy)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

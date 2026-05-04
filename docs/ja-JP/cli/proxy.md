---
read_when:
    - デプロイ前にオペレーター管理のプロキシルーティングを検証する必要があります
    - デバッグのために、OpenClaw のトランスポートトラフィックをローカルでキャプチャする必要があります
    - デバッグプロキシセッション、ブロブ、または組み込みクエリプリセットを確認したい場合
summary: '`openclaw proxy` の CLI リファレンス。オペレーター管理のプロキシ検証とローカルデバッグプロキシキャプチャインスペクターを含む'
title: プロキシ
x-i18n:
    generated_at: "2026-05-04T18:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

オペレーター管理のプロキシルーティングを検証するか、ローカルの明示的デバッグプロキシを実行して
キャプチャされたトラフィックを調査します。

OpenClaw のプロキシルーティングを有効にする前に、`validate` を使ってオペレーター管理の
フォワードプロキシを事前確認します。その他のコマンドは、トランスポートレベルの調査用の
デバッグツールです。ローカルプロキシの起動、キャプチャを有効にした子コマンドの実行、
キャプチャセッションの一覧表示、一般的なトラフィックパターンのクエリ、キャプチャされた
blob の読み取り、ローカルキャプチャデータの削除ができます。

## コマンド

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 検証

`openclaw proxy validate` は、`--proxy-url`、設定、または `OPENCLAW_PROXY_URL` から
有効なオペレーター管理プロキシ URL を確認します。プロキシが有効化および設定されていない場合は
設定の問題を報告します。設定を変更する前の一回限りの事前確認には `--proxy-url` を使ってください。
デフォルトでは、公開宛先がプロキシ経由で成功すること、およびプロキシが一時的なループバックカナリアへ
到達できないことを検証します。カスタム拒否宛先は fail-closed です。デプロイ固有の拒否シグナルを
別途検証できない限り、HTTP レスポンスと曖昧なトランスポート障害はいずれも失敗になります。
`--apns-reachable` を追加すると、APNs HTTP/2 CONNECT トンネルもプロキシ経由で開き、
サンドボックス APNs が応答することを確認します。このプローブは意図的に無効なプロバイダートークンを
使用するため、APNs の `403 InvalidProviderToken` レスポンスは到達可能性を示す成功シグナルです。

オプション:

- `--json`: 機械可読な JSON を出力します。
- `--proxy-url <url>`: 設定または環境変数の代わりに、このプロキシ URL を検証します。
- `--allowed-url <url>`: プロキシ経由で成功することが期待される宛先を追加します。複数の宛先を確認するには繰り返します。
- `--denied-url <url>`: プロキシによってブロックされることが期待される宛先を追加します。複数の宛先を確認するには繰り返します。
- `--apns-reachable`: サンドボックス APNs HTTP/2 がプロキシ経由で到達可能であることも検証します。
- `--apns-authority <url>`: `--apns-reachable` でプローブする APNs authority（デフォルトは `https://api.sandbox.push.apple.com`、本番は `https://api.push.apple.com`）。
- `--timeout-ms <ms>`: リクエストごとのタイムアウト（ミリ秒）。

デプロイのガイダンスと拒否セマンティクスについては、[ネットワークプロキシ](/ja-JP/security/network-proxy)を参照してください。

## クエリプリセット

`openclaw proxy query --preset <name>` は次を受け付けます:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注記

- `start` は、`--host` が設定されていない限り、デフォルトで `127.0.0.1` になります。
- `run` はローカルデバッグプロキシを起動し、その後 `--` の後ろのコマンドを実行します。
- デバッグプロキシの直接アップストリーム転送は、診断用にアップストリームソケットを開きます。OpenClaw 管理プロキシモードが有効な場合、プロキシリクエストと CONNECT トンネルの直接転送はデフォルトで無効です。承認済みのローカル診断の場合にのみ、`OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` を設定してください。
- `validate` は、プロキシ設定または宛先チェックが失敗するとコード 1 で終了します。
- キャプチャはローカルデバッグデータです。完了したら `openclaw proxy purge` を使ってください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ネットワークプロキシ](/ja-JP/security/network-proxy)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

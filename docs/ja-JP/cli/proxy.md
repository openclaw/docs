---
read_when:
    - デプロイ前に、オペレーター管理のプロキシルーティングを検証する必要があります
    - デバッグのために OpenClaw のトランスポートトラフィックをローカルでキャプチャする必要がある
    - デバッグプロキシセッション、blob、または組み込みクエリプリセットを調査したい場合
summary: '`openclaw proxy` の CLI リファレンス。オペレーター管理プロキシの検証とローカルデバッグプロキシのキャプチャインスペクターを含む'
title: プロキシ
x-i18n:
    generated_at: "2026-06-27T11:00:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

オペレーター管理のプロキシルーティングを検証するか、ローカルの明示的なデバッグプロキシを実行して
キャプチャされたトラフィックを調査します。

OpenClaw のプロキシルーティングを有効にする前に、オペレーター管理のフォワードプロキシを事前確認するには `validate` を使用します。その他のコマンドは
トランスポートレベルの調査用デバッグツールです。ローカルプロキシの起動、キャプチャを有効にした子コマンドの実行、キャプチャセッションの一覧表示、一般的なトラフィックパターンの照会、
キャプチャ済み blob の読み取り、ローカルキャプチャデータの削除ができます。

## コマンド

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 検証

`openclaw proxy validate` は、`--proxy-url`、設定、または `OPENCLAW_PROXY_URL` から有効なオペレーター管理プロキシ URL を確認します。マネージドプロキシ URL には、プレーンなフォワードプロキシリスナーには `http://` を使用でき、OpenClaw がプロキシリクエストを送信する前にプロキシエンドポイントへ TLS を開く必要がある場合は `https://` を使用できます。プロキシが有効化および設定されていない場合は設定問題として報告します。設定を変更する前の一回限りの事前確認には `--proxy-url` を使用してください。HTTPS プロキシエンドポイントへの TLS 接続でプライベート CA を信頼するには `--proxy-ca-file` を追加します。既定では、公開宛先がプロキシ経由で成功することと、プロキシが一時的なループバックカナリアへ到達できないことを検証します。カスタムの拒否宛先は fail-closed です。デプロイ固有の拒否シグナルを別途検証できない限り、HTTP レスポンスと曖昧なトランスポート失敗はいずれも失敗になります。プロキシ経由で APNs HTTP/2 CONNECT トンネルも開き、サンドボックス APNs が応答することを確認するには `--apns-reachable` を追加します。このプローブは意図的に無効なプロバイダートークンを使用するため、APNs の `403 InvalidProviderToken` レスポンスは到達可能性の成功シグナルです。

オプション:

- `--json`: 機械可読 JSON を出力します。
- `--proxy-url <url>`: 設定または環境変数の代わりに、この `http://` または `https://` プロキシ URL を検証します。
- `--proxy-ca-file <path>`: HTTPS プロキシエンドポイントの TLS 検証で、この PEM CA ファイルを信頼します。
- `--allowed-url <url>`: プロキシ経由で成功することが期待される宛先を追加します。複数の宛先を確認するには繰り返します。
- `--denied-url <url>`: プロキシによってブロックされることが期待される宛先を追加します。複数の宛先を確認するには繰り返します。
- `--apns-reachable`: サンドボックス APNs HTTP/2 がプロキシ経由で到達可能であることも検証します。
- `--apns-authority <url>`: `--apns-reachable` でプローブする APNs authority（既定は `https://api.sandbox.push.apple.com`、本番は `https://api.push.apple.com`）。
- `--timeout-ms <ms>`: リクエストごとのタイムアウト（ミリ秒）。

デプロイのガイダンスと拒否セマンティクスについては [ネットワークプロキシ](/ja-JP/security/network-proxy) を参照してください。

## クエリプリセット

`openclaw proxy query --preset <name>` は以下を受け付けます。

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注記

- `start` は `--host` が設定されていない限り、既定で `127.0.0.1` を使用します。
- `run` はローカルデバッグプロキシを起動してから、`--` の後のコマンドを実行します。
- デバッグプロキシの直接アップストリーム転送は、診断用にアップストリームソケットを開きます。OpenClaw のマネージドプロキシモードが有効な場合、プロキシリクエストと CONNECT トンネルの直接転送は既定で無効です。承認済みのローカル診断でのみ `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` を設定してください。
- `validate` は、プロキシ設定または宛先チェックが失敗すると終了コード 1 で終了します。
- キャプチャはローカルデバッグデータです。完了したら `openclaw proxy purge` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ネットワークプロキシ](/ja-JP/security/network-proxy)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

---
read_when:
    - デプロイ前にオペレーター管理のプロキシルーティングを検証する必要があります。
    - OpenClaw のトランスポートトラフィックをデバッグのためにローカルでキャプチャする必要がある
    - デバッグプロキシセッション、Blob、または組み込みクエリプリセットを調査したい
summary: '`openclaw proxy` の CLI リファレンス。オペレーター管理プロキシの検証とローカルデバッグプロキシのキャプチャインスペクターを含む'
title: プロキシ
x-i18n:
    generated_at: "2026-07-05T11:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

オペレーター管理のプロキシルーティングを検証するか、ローカルの明示的なデバッグプロキシを実行してキャプチャされたトラフィックを調査します。

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` は、オペレーター管理のフォワードプロキシを事前確認します。残りはトランスポートレベルの調査用デバッグツールです。ローカルのキャプチャプロキシの起動、そこを経由した子コマンドの実行、キャプチャセッションの一覧表示、トラフィックパターンのクエリ、キャプチャされた blob の読み取り、ローカルキャプチャデータのパージを行います。

## 検証

`--proxy-url`、設定 (`proxy.proxyUrl`)、または `OPENCLAW_PROXY_URL` から、有効なオペレーター管理プロキシ URL をこの優先順位で確認します。プロキシが有効化および設定されていない場合は設定上の問題として報告します。設定に触れずに一回限りの事前確認を行うには `--proxy-url` を渡します。

管理対象プロキシ URL では、プレーンなフォワードプロキシリスナーには `http://` を使い、OpenClaw がプロキシリクエストを送る前にプロキシエンドポイント自体へ TLS を開く必要がある場合は `https://` を使います。その TLS 接続でプライベート CA を信頼するには `--proxy-ca-file` を使います。

デフォルトでは次を実行します。

- `https://example.com/` に対する 1 つの **許可** チェック (`--allowed-url` で上書き/追加、繰り返し指定可)
- 一時的なループバックカナリアに対する 1 つの **拒否** チェック (`--denied-url` で上書き、繰り返し指定可)

カスタムの `--denied-url` ターゲットはフェイルクローズです。デプロイ固有の拒否シグナルを独立して検証できない限り、HTTP レスポンスと曖昧なトランスポート失敗の両方が失敗として扱われます。組み込みのループバックカナリアは、トランスポートエラーがブロックの証拠として扱われる唯一のターゲットです。

`--apns-reachable` を追加すると、プロキシ経由で APNs HTTP/2 CONNECT トンネルも開き、サンドボックス APNs が応答することを確認します。このプローブは意図的に無効なプロバイダートークンを送信するため、APNs の `403 InvalidProviderToken` レスポンスは到達可能性の成功シグナルとして扱われます (失敗ではありません)。

### オプション

| フラグ                   | 効果                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | 機械可読 JSON を出力                                                                                                 |
| `--proxy-url <url>`      | 設定や環境変数の代わりに、この `http://`/`https://` プロキシ URL を検証                                               |
| `--proxy-ca-file <path>` | HTTPS プロキシエンドポイントの TLS 検証で、この PEM CA ファイルを信頼                                                |
| `--allowed-url <url>`    | プロキシ経由で成功することが期待される宛先 (繰り返し指定可)                                                         |
| `--denied-url <url>`     | プロキシによってブロックされることが期待される宛先 (繰り返し指定可)                                                 |
| `--apns-reachable`       | サンドボックス APNs HTTP/2 がプロキシ経由で到達可能であることも検証                                                  |
| `--apns-authority <url>` | プローブする APNs オーソリティ (デフォルト `https://api.sandbox.push.apple.com`; 本番は `https://api.push.apple.com`) |
| `--timeout-ms <ms>`      | リクエストごとのタイムアウト                                                                                         |

プロキシ設定または宛先チェックが失敗すると、コード 1 で終了します。

デプロイのガイダンスと拒否セマンティクスについては、[ネットワークプロキシ](/ja-JP/security/network-proxy) を参照してください。

## デバッグプロキシ

`start` はローカルのキャプチャプロキシを起動し、その URL、CA 証明書パス、キャプチャ DB パスを出力します。停止するには Ctrl+C を使います。`--host` が設定されていない限り、デフォルトでは `127.0.0.1` にバインドします。

`run` はローカルデバッグプロキシを起動し、その後、プロキシ環境を適用した状態で、独自のキャプチャセッションの下で `<cmd...>` (`--` の後) を実行します。

デバッグプロキシの直接アップストリーム転送は、診断のためにアップストリームソケットを開きます。OpenClaw 管理プロキシモードが有効な場合、プロキシリクエストと CONNECT トンネルの直接転送はデフォルトで無効です。承認されたローカル診断の場合のみ、`OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` を設定してください。

`coverage` は、どのトランスポートがキャプチャ対象、プロキシ専用、または未カバーかを示す JSON レポート (`summary` + トランスポートごとの `entries`) を出力します。

`sessions` は最近のキャプチャセッションを一覧表示します (`--limit`、デフォルト 20)。

`query --preset <name>` は、キャプチャされたトラフィックに対して組み込みクエリを実行します。必要に応じて `--session <id>` にスコープできます。プリセット:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` は、キャプチャされたペイロード blob の生コンテンツを出力します。

`purge` は、キャプチャされたすべてのトラフィックメタデータと blob を削除します。キャプチャはローカルデバッグデータです。完了したらパージしてください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ネットワークプロキシ](/ja-JP/security/network-proxy)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

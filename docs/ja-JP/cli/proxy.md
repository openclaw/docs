---
read_when:
    - デプロイ前に、オペレーターが管理するプロキシルーティングを検証する必要があります
    - デバッグのために OpenClaw のトランスポート通信をローカルでキャプチャする必要があります
    - デバッグプロキシのセッション、BLOB、または組み込みのクエリプリセットを確認したい場合
summary: オペレーター管理のプロキシ検証とローカルデバッグ用プロキシキャプチャインスペクターを含む、`openclaw proxy` の CLI リファレンス
title: プロキシ
x-i18n:
    generated_at: "2026-07-11T22:08:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

オペレーター管理のプロキシルーティングを検証するか、ローカルの明示的なデバッグプロキシを実行して、キャプチャされたトラフィックを調査します。

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

`validate` は、オペレーター管理のフォワードプロキシを事前検証します。その他はトランスポートレベルの調査用デバッグツールです。ローカルのキャプチャプロキシの起動、それを経由した子コマンドの実行、キャプチャセッションの一覧表示、トラフィックパターンの照会、キャプチャされた BLOB の読み取り、ローカルキャプチャデータの削除を行えます。

## 検証

`--proxy-url`、設定（`proxy.proxyUrl`）、`OPENCLAW_PROXY_URL` の優先順位で、実際に使用されるオペレーター管理プロキシ URL を確認します。プロキシが有効化および設定されていない場合は、設定上の問題として報告します。設定を変更せずに一度だけ事前検証するには、`--proxy-url` を渡します。

管理対象プロキシ URL では、通常のフォワードプロキシリスナーには `http://` を使用します。OpenClaw がプロキシリクエストを送信する前にプロキシエンドポイント自体への TLS 接続を確立する必要がある場合は、`https://` を使用します。その TLS 接続でプライベート CA を信頼するには、`--proxy-ca-file` を使用します。

デフォルトでは、次を実行します。

- `https://example.com/` に対する 1 件の**許可**チェック（`--allowed-url` で上書きまたは追加可能、複数指定可能）
- 一時的なループバックカナリアに対する 1 件の**拒否**チェック（`--denied-url` で上書き可能、複数指定可能）

カスタムの `--denied-url` ターゲットはフェイルクローズ方式です。デプロイ固有の拒否シグナルを別途検証できない限り、HTTP レスポンスと曖昧なトランスポート障害はいずれも失敗と見なされます。トランスポートエラーをブロックの証拠として扱うのは、組み込みのループバックカナリアだけです。

プロキシ経由で APNs HTTP/2 CONNECT トンネルも開き、サンドボックス APNs が応答することを確認するには、`--apns-reachable` を追加します。このプローブは意図的に無効なプロバイダートークンを送信するため、APNs の `403 InvalidProviderToken` レスポンスは、失敗ではなく到達可能であることを示す正常なシグナルとして扱われます。

### オプション

| フラグ                   | 効果                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | 機械可読な JSON を出力する                                                                                             |
| `--proxy-url <url>`      | 設定や環境変数の代わりに、この `http://`/`https://` プロキシ URL を検証する                                             |
| `--proxy-ca-file <path>` | HTTPS プロキシエンドポイントの TLS 検証で、この PEM CA ファイルを信頼する                                               |
| `--allowed-url <url>`    | プロキシ経由で成功することが期待される送信先（複数指定可能）                                                           |
| `--denied-url <url>`     | プロキシによってブロックされることが期待される送信先（複数指定可能）                                                   |
| `--apns-reachable`       | サンドボックス APNs HTTP/2 にプロキシ経由で到達可能であることも検証する                                                 |
| `--apns-authority <url>` | 検証する APNs オーソリティ（デフォルトは `https://api.sandbox.push.apple.com`、本番環境は `https://api.push.apple.com`） |
| `--timeout-ms <ms>`      | リクエストごとのタイムアウト                                                                                           |

プロキシ設定または送信先チェックが失敗した場合は、終了コード 1 で終了します。

デプロイに関するガイダンスと拒否のセマンティクスについては、[ネットワークプロキシ](/ja-JP/security/network-proxy)を参照してください。

## デバッグプロキシ

`start` はローカルのキャプチャプロキシを起動し、その URL、CA 証明書のパス、キャプチャ DB のパスを出力します。停止するには Ctrl+C を押します。`--host` が設定されていない場合は、デフォルトで `127.0.0.1` にバインドします。

`run` はローカルデバッグプロキシを起動し、プロキシ環境変数を適用して、独自のキャプチャセッション内で `<cmd...>`（`--` の後）を実行します。

デバッグプロキシの直接アップストリーム転送では、診断のためにアップストリームソケットを開きます。OpenClaw の管理対象プロキシモードが有効な場合、プロキシリクエストおよび CONNECT トンネルの直接転送はデフォルトで無効になります。承認済みのローカル診断でのみ、`OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` を設定してください。

`coverage` は、どのトランスポートがキャプチャ対象、プロキシ専用、または未対応であるかを示す JSON レポート（`summary` とトランスポートごとの `entries`）を出力します。

`sessions` は最近のキャプチャセッションを一覧表示します（`--limit`、デフォルトは 20）。

`query --preset <name>` は、キャプチャされたトラフィックに対して組み込みクエリを実行します。必要に応じて `--session <id>` で対象を限定できます。プリセットは次のとおりです。

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` は、キャプチャされたペイロード BLOB の生コンテンツを出力します。

`purge` は、キャプチャされたすべてのトラフィックメタデータと BLOB を削除します。キャプチャはローカルのデバッグデータです。作業が完了したら削除してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [ネットワークプロキシ](/ja-JP/security/network-proxy)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

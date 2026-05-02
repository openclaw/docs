---
read_when:
    - デプロイ前に、オペレーター管理のプロキシルーティングを検証する必要があります
    - デバッグのために OpenClaw のトランスポートトラフィックをローカルでキャプチャする必要があります
    - デバッグプロキシセッション、ブロブ、または組み込みクエリプリセットを確認したい場合
summary: オペレーター管理プロキシの検証とローカルデバッグプロキシのキャプチャインスペクターを含む、`openclaw proxy` の CLI リファレンス
title: プロキシ
x-i18n:
    generated_at: "2026-05-02T04:52:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

オペレーター管理のプロキシルーティングを検証するか、ローカルの明示的なデバッグプロキシを実行して
キャプチャされたトラフィックを調査します。

OpenClaw のプロキシルーティングを有効にする前に、オペレーター管理のフォワードプロキシを事前確認するには
`validate` を使用します。その他のコマンドは、トランスポートレベルの調査用デバッグツールです。
ローカルプロキシの起動、キャプチャを有効にした子コマンドの実行、キャプチャセッションの一覧表示、
一般的なトラフィックパターンのクエリ、キャプチャされた blob の読み取り、ローカルキャプチャデータの削除を実行できます。

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

`openclaw proxy validate` は、`--proxy-url`、設定、または `OPENCLAW_PROXY_URL` から得られる
有効なオペレーター管理プロキシ URL を確認します。プロキシが有効化および設定されていない場合は
設定の問題を報告します。設定を変更する前に一度だけ事前確認するには `--proxy-url` を使用します。
デフォルトでは、公開宛先がプロキシ経由で成功することと、プロキシが一時的な loopback カナリアに到達できないことを検証します。
カスタムの拒否宛先はフェイルクローズです。デプロイ固有の拒否シグナルを別途検証できない限り、
HTTP レスポンスと曖昧なトランスポート障害はいずれも失敗になります。

オプション:

- `--json`: 機械可読の JSON を出力します。
- `--proxy-url <url>`: 設定または環境変数の代わりに、このプロキシ URL を検証します。
- `--allowed-url <url>`: プロキシ経由で成功することが期待される宛先を追加します。複数の宛先を確認するには繰り返し指定します。
- `--denied-url <url>`: プロキシによってブロックされることが期待される宛先を追加します。複数の宛先を確認するには繰り返し指定します。
- `--timeout-ms <ms>`: リクエストごとのタイムアウトをミリ秒単位で指定します。

デプロイのガイダンスと拒否セマンティクスについては、[ネットワークプロキシ](/ja-JP/security/network-proxy)を参照してください。

## クエリプリセット

`openclaw proxy query --preset <name>` は以下を受け付けます。

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注記

- `start` は、`--host` が設定されていない限り、デフォルトで `127.0.0.1` になります。
- `run` はローカルデバッグプロキシを起動し、その後 `--` の後のコマンドを実行します。
- `validate` は、プロキシ設定または宛先チェックが失敗した場合、コード 1 で終了します。
- キャプチャはローカルデバッグデータです。完了したら `openclaw proxy purge` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ネットワークプロキシ](/ja-JP/security/network-proxy)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

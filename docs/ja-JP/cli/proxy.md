---
read_when:
    - デバッグのために OpenClaw のトランスポートトラフィックをローカルでキャプチャしたい場合
    - デバッグプロキシのセッション、blob、または組み込みクエリプリセットを確認したい場合
summary: '`openclaw proxy` の CLI リファレンス。ローカルデバッグプロキシおよびキャプチャインスペクターです'
title: プロキシ
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T04:51:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

ローカルの明示的なデバッグプロキシを実行し、キャプチャしたトラフィックを確認します。

これはトランスポートレベルの調査のためのデバッグコマンドです。ローカルプロキシの起動、
キャプチャを有効にした子コマンドの実行、キャプチャセッションの一覧表示、
一般的なトラフィックパターンのクエリ、キャプチャした blob の読み取り、
ローカルキャプチャデータの削除ができます。

## コマンド

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## クエリプリセット

`openclaw proxy query --preset <name>` で指定できるもの:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注意

- `start` は、`--host` が設定されていない限り、デフォルトで `127.0.0.1` を使用します。
- `run` はローカルのデバッグプロキシを起動し、その後 `--` の後ろのコマンドを実行します。
- キャプチャはローカルのデバッグデータです。終了したら `openclaw proxy purge` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Trusted proxy 認証](/ja-JP/gateway/trusted-proxy-auth)

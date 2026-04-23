---
read_when:
    - デバッグのために OpenClaw の転送トラフィックをローカルでキャプチャする必要がある
    - デバッグプロキシのセッション、blob、または組み込みクエリプリセットを確認したい
summary: '`openclaw proxy` の CLI リファレンス、ローカルデバッグプロキシとキャプチャインスペクター'
title: proxy
x-i18n:
    generated_at: "2026-04-23T14:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

ローカルの明示的デバッグプロキシを実行し、キャプチャしたトラフィックを確認します。

これは転送レベルの調査向けデバッグコマンドです。ローカルプロキシの起動、キャプチャを有効にした子コマンドの実行、キャプチャセッションの一覧表示、一般的なトラフィックパターンの問い合わせ、キャプチャした blob の読み取り、ローカルキャプチャデータの削除ができます。

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

`openclaw proxy query --preset <name>` では次を受け付けます。

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注記

- `start` は `--host` が設定されていない限り、既定で `127.0.0.1` を使います。
- `run` はローカルデバッグプロキシを起動し、その後 `--` の後ろのコマンドを実行します。
- キャプチャはローカルのデバッグデータです。完了したら `openclaw proxy purge` を使ってください。

---
read_when:
    - グローバルなログレベルを上げずに、対象を絞ったデバッグログが必要な場合
    - サポートのためにサブシステム固有のログを取得する必要がある場合
summary: 対象を絞ったデバッグログのための診断フラグ
title: 診断フラグ
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T04:55:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

診断フラグを使うと、どこでも詳細ログを有効にせずに、対象を絞ったデバッグログを有効化できます。フラグはオプトイン方式で、サブシステム側がそれを確認しない限り効果はありません。

## 仕組み

- フラグは文字列です（大文字小文字は区別されません）。
- フラグはconfigまたはenv overrideで有効化できます。
- ワイルドカードをサポートします:
  - `telegram.*` は `telegram.http` に一致します
  - `*` はすべてのフラグを有効化します

## configで有効化

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

複数フラグ:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

フラグを変更したらGatewayを再起動してください。

## env override（一時利用）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

すべてのフラグを無効化:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## ログの出力先

フラグは標準の診断ログファイルにログを出力します。デフォルトでは:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` を設定している場合は、代わりにそのパスを使います。ログはJSONLです（1行ごとに1つのJSONオブジェクト）。redactionは `logging.redactSensitive` に基づいて引き続き適用されます。

## ログの抽出

最新のログファイルを選ぶ:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP診断で絞り込む:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

または、再現しながらtailする:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモートGatewayでは、`openclaw logs --follow` も使えます（[/cli/logs](/ja-JP/cli/logs) を参照）。

## 注

- `logging.level` が `warn` より高く設定されている場合、これらのログは抑制されることがあります。デフォルトの `info` なら問題ありません。
- フラグは有効のままでも安全です。影響するのは特定のサブシステムのログ量だけです。
- ログ出力先、レベル、redactionを変更するには [/logging](/ja-JP/logging) を使ってください。

## 関連

- [Gateway diagnostics](/ja-JP/gateway/diagnostics)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)

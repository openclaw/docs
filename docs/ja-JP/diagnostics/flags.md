---
read_when:
    - 全体のログレベルを上げずに、対象を絞ったデバッグログが必要な場合
    - サポートのためにサブシステム固有のログを取得する必要があります
summary: 対象を絞ったデバッグログ用の診断フラグ
title: 診断フラグ
x-i18n:
    generated_at: "2026-04-30T05:10:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

診断フラグを使うと、全体で詳細ログを有効にせずに、対象を絞ったデバッグログを有効化できます。フラグはオプトインであり、サブシステムがそれを確認しない限り効果はありません。

## 仕組み

- フラグは文字列です（大文字と小文字は区別されません）。
- 設定、または環境変数によるオーバーライドでフラグを有効化できます。
- ワイルドカードがサポートされています。
  - `telegram.*` は `telegram.http` に一致します
  - `*` はすべてのフラグを有効化します

## 設定で有効化する

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

複数のフラグ:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

フラグを変更した後は Gateway を再起動してください。

## 環境変数オーバーライド（一時的）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

すべてのフラグを無効化します。

```bash
OPENCLAW_DIAGNOSTICS=0
```

## タイムラインアーティファクト

`timeline` フラグは、外部 QA ハーネス向けに、構造化された起動時および実行時のタイミングイベントを書き込みます。

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

設定でも有効化できます。

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

タイムラインファイルのパスは引き続き `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` から取得されます。`timeline` が設定からのみ有効化されている場合、OpenClaw はまだ設定を読み込んでいないため、最初期の設定読み込みスパンは出力されません。以降の起動スパンでは設定フラグが使用されます。

`OPENCLAW_DIAGNOSTICS=1`、`OPENCLAW_DIAGNOSTICS=all`、`OPENCLAW_DIAGNOSTICS=*` も、すべての診断フラグを有効化するため、タイムラインを有効化します。JSONL タイミングアーティファクトだけが必要な場合は `timeline` を優先してください。

タイムラインレコードは `openclaw.diagnostics.v1` エンベロープを使用します。イベントには、プロセス ID、フェーズ名、スパン名、継続時間、Plugin ID、依存関係の数、イベントループ遅延サンプル、プロバイダー操作名、子プロセスの終了状態、起動エラーの名前やメッセージを含めることができます。タイムラインファイルはローカル診断アーティファクトとして扱ってください。自分のマシンの外部へ共有する前に内容を確認してください。

## ログの出力先

フラグは標準の診断ログファイルにログを出力します。既定では次のとおりです。

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` を設定している場合は、代わりにそのパスを使用します。ログは JSONL です（1 行につき 1 つの JSON オブジェクト）。`logging.redactSensitive` に基づく秘匿処理は引き続き適用されます。

## ログを抽出する

最新のログファイルを選びます。

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 診断で絞り込みます。

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

または、再現しながら tail します。

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモート Gateway では、`openclaw logs --follow` も使用できます（[/cli/logs](/ja-JP/cli/logs) を参照）。

## メモ

- `logging.level` が `warn` より高く設定されている場合、これらのログは抑制されることがあります。既定の `info` で問題ありません。
- フラグは有効のままにしても安全です。特定のサブシステムのログ量にのみ影響します。
- ログの出力先、レベル、秘匿処理を変更するには [/logging](/ja-JP/logging) を使用してください。

## 関連

- [Gateway 診断](/ja-JP/gateway/diagnostics)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

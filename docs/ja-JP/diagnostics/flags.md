---
read_when:
    - グローバルなログレベルを上げずに、対象を絞ったデバッグログが必要です
    - サポート用にサブシステム固有のログを取得する必要がある
summary: ターゲット指定のデバッグログ用診断フラグ
title: 診断フラグ
x-i18n:
    generated_at: "2026-06-27T11:20:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

診断フラグを使うと、全体で詳細ログを有効にせずに、対象を絞ったデバッグログを有効にできます。フラグはオプトインであり、サブシステムがそれを確認しない限り効果はありません。

## 仕組み

- フラグは文字列です（大文字と小文字は区別されません）。
- config または env override でフラグを有効にできます。
- ワイルドカードがサポートされています。
  - `telegram.*` は `telegram.http` に一致します
  - `*` はすべてのフラグを有効にします

## config で有効化

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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

フラグを変更した後は Gateway を再起動してください。

## Env override（一時的）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

すべてのフラグを無効化:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` はプロセスレベルの無効化 override です。そのプロセスについて、env と config の両方のフラグを無効にします。

## プロファイリングフラグ

Profiler フラグを使うと、グローバルなログレベルを上げずに、対象を絞ったタイミング span を有効にできます。デフォルトでは無効です。

1 回の Gateway 実行ですべての profiler 制御 span を有効にします。

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

reply-dispatch profiler span のみを有効にします。

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Codex app-server の起動/tool/thread profiler span のみを有効にします。

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

config から profiler フラグを有効にします。

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

config フラグを変更した後は Gateway を再起動してください。profiler フラグを無効にするには、`diagnostics.flags` から削除して再起動します。config で profiler フラグが有効になっている場合でも、すべての診断フラグを一時的に無効にするには、次のようにプロセスを開始します。

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## タイムラインアーティファクト

`timeline` フラグは、外部 QA ハーネス向けに構造化された起動時および実行時のタイミングイベントを書き込みます。

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

config でも有効にできます。

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

タイムラインファイルのパスは引き続き `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` から取得されます。`timeline` が config からのみ有効にされている場合、OpenClaw はまだ config を読み込んでいないため、最も早い config 読み込み span は出力されません。それ以降の起動 span は config フラグを使用します。

`OPENCLAW_DIAGNOSTICS=1`、`OPENCLAW_DIAGNOSTICS=all`、`OPENCLAW_DIAGNOSTICS=*` も、すべての診断フラグを有効にするため、タイムラインを有効にします。JSONL タイミングアーティファクトだけが必要な場合は `timeline` を優先してください。

タイムラインレコードは `openclaw.diagnostics.v1` エンベロープを使用します。イベントには、プロセス ID、フェーズ名、span 名、期間、Plugin ID、依存関係数、イベントループ遅延サンプル、プロバイダー操作名、子プロセスの終了状態、起動エラーの名前/メッセージを含めることができます。タイムラインファイルはローカル診断アーティファクトとして扱い、自分のマシンの外部に共有する前に確認してください。

## ログの出力先

フラグは標準の診断ログファイルにログを出力します。デフォルトは次のとおりです。

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` を設定している場合は、代わりにそのパスを使用します。ログは JSONL です（1 行につき 1 つの JSON オブジェクト）。`logging.redactSensitive` に基づく秘匿化は引き続き適用されます。

## ログの抽出

最新のログファイルを選択します。

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 診断をフィルタリングします。

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP 診断をフィルタリングします。

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

または、再現しながら tail します。

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモート Gateway では、`openclaw logs --follow` も使用できます（[/cli/logs](/ja-JP/cli/logs) を参照）。

## 注記

- `logging.level` が `warn` より高く設定されている場合、これらのログは抑制されることがあります。デフォルトの `info` で問題ありません。
- `brave.http` は Brave Search のリクエスト URL/クエリパラメーター、レスポンスステータス/タイミング、キャッシュの hit/miss/write イベントをログに記録します。API キーやレスポンス本文はログに記録しませんが、検索クエリは機密性が高い場合があります。
- フラグは有効にしたままでも安全です。特定のサブシステムのログ量にのみ影響します。
- ログの出力先、レベル、秘匿化を変更するには [/logging](/ja-JP/logging) を使用してください。

## 関連

- [Gateway 診断](/ja-JP/gateway/diagnostics)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

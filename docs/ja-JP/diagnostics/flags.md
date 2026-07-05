---
read_when:
    - 対象を絞ったデバッグログが必要だが、グローバルなログレベルは上げたくない
    - サポート用にサブシステム固有のログを取得する必要がある
summary: 対象を絞ったデバッグログ用の診断フラグ
title: 診断フラグ
x-i18n:
    generated_at: "2026-07-05T11:19:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

診断フラグは、`logging.level` をグローバルに上げることなく、1 つのサブシステムに対して追加ログを有効にします。サブシステムがそのフラグを確認しない限り、フラグは効果を持ちません。

## 仕組み

- フラグは大文字と小文字を区別しない文字列で、config 内の `diagnostics.flags` と `OPENCLAW_DIAGNOSTICS` env オーバーライドから解決され、重複排除されて小文字化されます。
- `name.*` は `name` 自体と `name.` 配下のすべてに一致します（たとえば `telegram.*` は `telegram.http` に一致します）。
- `*` または `all` はすべてのフラグを有効にします。
- config の `diagnostics.flags` を変更した後は Gateway を再起動してください。ホットリロードされません。

## 既知のフラグ

| フラグ           | 有効にするもの                                            |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API HTTP エラーログ                          |
| `brave.http`     | Brave Search リクエスト/レスポンス/キャッシュログ         |
| `profiler`       | 応答ステージプロファイラーと Codex app-server プロファイラー（両方） |
| `reply.profiler` | 応答ステージプロファイラーのみ                            |
| `codex.profiler` | Codex app-server プロファイラーのみ                       |
| `timeline`       | 構造化 JSONL タイムラインアーティファクト（下記参照）      |

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

## env オーバーライド（一回限り）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

値はカンマまたは空白で分割されます。特別な値:

| 値                          | 効果                                     |
| --------------------------- | ---------------------------------------- |
| `0`, `false`, `off`, `none` | すべてのフラグを無効にし、config も上書きします |
| `1`, `true`, `all`, `*`     | すべてのフラグを有効にします             |

`OPENCLAW_DIAGNOSTICS=0` は、そのプロセスで env と config の両方からのフラグを無効にします。ファイルを編集せずに、config で有効のまま残っているプロファイラーフラグを一時的に静かにする場合に便利です。

## プロファイラーフラグ

プロファイラーフラグは軽量なタイミング span を制御します。オフのときはオーバーヘッドを追加しません。

1 回の Gateway 実行ですべてのプロファイラー制御 span を有効にする:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

応答ディスパッチプロファイラー span のみを有効にする:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Codex app-server の起動/ツール/スレッドプロファイラー span のみを有効にする:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` は応答プロファイラーと Codex プロファイラーの両方を有効にします。片方だけを有効にするには、スコープ付きフラグ名を使用してください。

または config に設定します:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

config フラグを変更した後は Gateway を再起動してください。プロファイラーフラグを無効にするには、`diagnostics.flags` から削除して再起動するか、その実行で `OPENCLAW_DIAGNOSTICS=0` を指定してプロセスを開始し、すべての診断フラグを上書きします。

## タイムラインアーティファクト

`timeline` フラグ（エイリアス: `diagnostics.timeline`）は、外部 QA ハーネス向けに、構造化された起動時およびランタイムのタイミングイベントを JSONL として書き込みます:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

または config で有効にします:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

出力パスは、フラグ自体が config で設定されている場合でも、常に `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` から取得されます。パス用の config キーはありません。`timeline` が config からのみ有効になっている場合、OpenClaw がまだ config を読んでいないため、最初期の config 読み込み span は欠落します。後続の起動 span は通常どおり取得されます。

`OPENCLAW_DIAGNOSTICS=1`、`=all`、`=*` も、すべてのフラグを有効にするため、タイムラインを有効にします。JSONL アーティファクトだけが必要で、他のすべての診断フラグは不要な場合は、スコープ付きの `timeline` フラグを優先してください。

タイムライン内のイベントループ遅延サンプルには、`timeline` に加えてもう 1 つのオプトインが必要です。タイムラインを有効にしたうえで、`OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`（または `on`/`true`/`yes`）を設定してください。

タイムラインレコードは `openclaw.diagnostics.v1` エンベロープを使用し、プロセス ID、フェーズ名、span 名、所要時間、Plugin ID、依存関係数、イベントループ遅延サンプル、プロバイダー操作名、子プロセス終了状態、起動エラー名/メッセージを含むことがあります。タイムラインファイルはローカル診断アーティファクトとして扱い、自分のマシンの外部に共有する前に確認してください。

## ログの出力先

フラグは標準の診断ログファイルにログを出力します。デフォルト:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` を設定している場合は、代わりにそのパスを使用します。ログは JSONL（1 行に 1 つの JSON オブジェクト）です。`logging.redactSensitive` に基づく墨消しは引き続き適用されます。ログパス解決、ローテーション、墨消しモデルの全体については [Logging](/ja-JP/logging) を参照してください。

## ログを抽出

最新のログファイルを選ぶ:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 診断をフィルターする:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP 診断をフィルターする:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

または再現中に tail する:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモート Gateway では、代わりに `openclaw logs --follow` を使用してください（[/cli/logs](/ja-JP/cli/logs) を参照）。

## 注記

- `logging.level` が `warn` より高く設定されている場合、フラグ制御のログが抑制されることがあります。デフォルトの `info` で問題ありません。
- `brave.http` は Brave Search のリクエスト URL/クエリパラメーター、レスポンスステータス/タイミング、キャッシュヒット/ミス/書き込みイベントをログに記録します。API キー（リクエストヘッダーとして送信）やレスポンス本文はログに記録しませんが、検索クエリは機微な情報になり得ます。
- フラグは有効のままにしても安全です。特定のサブシステムのログ量にのみ影響します。
- ログの出力先、レベル、墨消しを変更するには [/logging](/ja-JP/logging) を使用してください。

## 関連

- [Gateway 診断](/ja-JP/gateway/diagnostics)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

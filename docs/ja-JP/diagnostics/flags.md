---
read_when:
    - グローバルのログレベルを上げずに、対象を絞ったデバッグログが必要です
    - サポートのためにサブシステム固有のログを収集する必要があります
summary: 対象を絞ったデバッグログ用の診断フラグ
title: 診断フラグ
x-i18n:
    generated_at: "2026-07-11T22:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

診断フラグを使用すると、`logging.level` をグローバルに引き上げることなく、1つのサブシステムの追加ログを有効にできます。サブシステム側で確認されないフラグは効果を持ちません。

## 仕組み

- フラグは大文字と小文字を区別しない文字列です。設定の `diagnostics.flags` と環境変数による上書き `OPENCLAW_DIAGNOSTICS` から解決され、重複が除去されて小文字に変換されます。
- `name.*` は `name` 自体と `name.` 配下のすべてに一致します（たとえば、`telegram.*` は `telegram.http` に一致します）。
- `*` または `all` を指定すると、すべてのフラグが有効になります。
- 設定の `diagnostics.flags` を変更した後は Gateway を再起動してください。ホットリロードはされません。

## 既知のフラグ

| フラグ           | 有効になる機能                                            |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API の HTTP エラーログ                       |
| `brave.http`     | Brave Search のリクエスト、レスポンス、キャッシュのログ  |
| `profiler`       | 応答ステージと Codex app-server のプロファイラー（両方） |
| `reply.profiler` | 応答ステージのプロファイラーのみ                          |
| `codex.profiler` | Codex app-server のプロファイラーのみ                     |
| `timeline`       | 構造化 JSONL タイムライン成果物（下記参照）               |

## 設定で有効にする

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

複数のフラグ：

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## 環境変数による上書き（一時的）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

値はカンマまたは空白で分割されます。特殊な値：

| 値                          | 効果                                           |
| --------------------------- | ---------------------------------------------- |
| `0`, `false`, `off`, `none` | 設定も上書きし、すべてのフラグを無効にする     |
| `1`, `true`, `all`, `*`     | すべてのフラグを有効にする                     |

`OPENCLAW_DIAGNOSTICS=0` は、そのプロセスについて環境変数と設定の両方からのフラグを無効にします。ファイルを編集せずに、設定で有効なままになっているプロファイラーフラグを一時的に抑制する場合に便利です。

## プロファイラーフラグ

プロファイラーフラグは軽量な計測スパンを制御します。無効時にはオーバーヘッドが発生しません。

1回の Gateway 実行ですべてのプロファイラー対象スパンを有効にする：

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

応答ディスパッチのプロファイラースパンだけを有効にする：

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Codex app-server の起動、ツール、スレッドのプロファイラースパンだけを有効にする：

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` は応答プロファイラーと Codex プロファイラーの両方を有効にします。片方だけを有効にするには、スコープ付きのフラグ名を使用してください。

または、設定で指定します：

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

設定のフラグを変更した後は Gateway を再起動してください。プロファイラーフラグを無効にするには、`diagnostics.flags` から削除して再起動するか、`OPENCLAW_DIAGNOSTICS=0` を指定してプロセスを起動し、その実行におけるすべての診断フラグを上書きします。

## タイムライン成果物

`timeline` フラグ（別名：`diagnostics.timeline`）は、外部の QA ハーネス向けに、構造化された起動時および実行時のタイミングイベントを JSONL として書き込みます：

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

または、設定で有効にします：

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

フラグ自体を設定で指定した場合でも、出力パスは常に `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` から取得されます。パス用の設定キーはありません。`timeline` を設定だけで有効にした場合、OpenClaw がまだ設定を読み込んでいないため、最初期の設定読み込みスパンは記録されません。それ以降の起動スパンは通常どおり記録されます。

`OPENCLAW_DIAGNOSTICS=1`、`=all`、`=*` も、すべてのフラグを有効にするため、タイムラインを有効にします。JSONL 成果物だけが必要で、ほかのすべての診断フラグは不要な場合は、スコープ付きの `timeline` フラグを使用してください。

タイムライン内のイベントループ遅延サンプルには、`timeline` に加えてもう1つの明示的な有効化が必要です。タイムラインを有効にしたうえで、`OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`（または `on`、`true`、`yes`）を設定してください。

タイムラインレコードは `openclaw.diagnostics.v1` エンベロープを使用し、プロセス ID、フェーズ名、スパン名、所要時間、Plugin ID、依存関係数、イベントループ遅延サンプル、プロバイダー操作名、子プロセスの終了状態、起動エラーの名前やメッセージを含む場合があります。タイムラインファイルはローカルの診断成果物として扱い、自分のマシン外に共有する前に内容を確認してください。

## ログの出力先

フラグによるログは、標準の診断ログファイルに出力されます。デフォルト：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` を設定している場合は、代わりにそのパスが使用されます。ログは JSONL（1行につき1つの JSON オブジェクト）です。`logging.redactSensitive` に基づくマスキングは引き続き適用されます。ログパスの完全な解決方法、ローテーション、マスキングのモデルについては、[ログ](/ja-JP/logging)を参照してください。

## ログを抽出する

最新のログファイルを選択する：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 診断で絞り込む：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP 診断で絞り込む：

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

または、再現操作を行いながら追跡する：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモートの Gateway では、代わりに `openclaw logs --follow` を使用してください（[/cli/logs](/ja-JP/cli/logs)を参照）。

## 注意事項

- `logging.level` が `warn` より高く設定されている場合、フラグで制御されるログが抑制されることがあります。デフォルトの `info` で問題ありません。
- `brave.http` は、Brave Search のリクエスト URL とクエリパラメーター、レスポンスのステータスとタイミング、キャッシュのヒット、ミス、書き込みイベントを記録します。API キー（リクエストヘッダーとして送信）やレスポンス本文は記録しませんが、検索クエリには機密情報が含まれる可能性があります。
- フラグを有効のままにしても安全です。該当するサブシステムのログ量にのみ影響します。
- ログの出力先、レベル、マスキングを変更するには、[/logging](/ja-JP/logging)を使用してください。

## 関連項目

- [Gateway の診断](/ja-JP/gateway/diagnostics)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)

---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションの一覧表示 + 使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-06-27T11:02:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存済みの会話セッションを一覧表示します。

セッション一覧は、チャネルやプロバイダーの稼働確認ではありません。セッションストアに永続化された会話行を表示します。静かな Discord、Slack、Telegram、またはその他のチャネルは、メッセージが処理されて新しいセッション行が作成されるまで、新しいセッション行を作らずに正常に再接続できます。ライブのチャネル接続性が必要な場合は、`openclaw channels status --probe`、`openclaw status --deep`、または `openclaw health --verbose` を使用します。

`openclaw sessions` と Gateway の `sessions.list` レスポンスは、長期間稼働する大規模なストアが CLI プロセスや Gateway イベントループを占有しないよう、デフォルトで上限が設定されています。CLI はデフォルトで最新 100 件のセッションを返します。より小さい、または大きい範囲が必要な場合は `--limit <n>` を渡し、意図的にストア全体が必要な場合は `--limit all` を渡します。呼び出し元がさらに行が存在することを表示する必要がある場合、JSON レスポンスには `totalCount`、`limitApplied`、`hasMore` が含まれます。

RPC クライアントは、広い統合ディスカバリーソースを維持しつつ、現在設定に存在するエージェントの行だけを返すために `configuredAgentsOnly: true` を渡せます。Control UI はこのモードをデフォルトで使用するため、削除済みまたはディスク上にのみ存在するエージェントストアが Sessions ビューに再表示されません。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

スコープ選択:

- デフォルト: 設定済みのデフォルトエージェントストア
- `--verbose`: 詳細ログ
- `--agent <id>`: 設定済みエージェントストア 1 件
- `--all-agents`: 設定済みのすべてのエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` とは併用できません）
- `--limit <n|all>`: 出力する最大行数（デフォルトは `100`。`all` は完全な出力を復元します）

保存済みセッションの人間が読める trajectory 進捗を追跡します:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` は、最近の trajectory JSONL イベントをコンパクトな進捗行としてレンダリングします。`--session-key` がない場合は、まず実行中のセッションを追跡し、その後で最新の保存済みセッションを追跡します。`--tail <count>` は follow モードの前に出力する既存イベント数を制御します。デフォルトは `80` で、`0` は現在の末尾から開始します。`--follow` は、`<session>.trajectory-path.json` で参照される移動済みファイルを含め、選択した trajectory ファイルの監視を継続します。

進捗ビューは意図的に保守的です。プロンプトテキスト、ツール引数、ツール結果本文は出力されません。ツール呼び出しはツール名を `{...redacted...}` とともに表示します。ツール結果は `ok`、`error`、`done` などのステータスを表示します。モデル完了行はプロバイダー/モデルと終端ステータスを表示します。

保存済みセッションの trajectory バンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が exec リクエストを承認した後に `/export-trajectory` スラッシュコマンドが使用するコマンドパスです。出力ディレクトリは常に、選択したワークスペース配下の `.openclaw/trajectory-exports/` 内に解決されます。

`openclaw sessions --all-agents` は設定済みのエージェントストアを読み取ります。Gateway と ACP のセッションディスカバリーはより広く、デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルート配下で見つかったディスク上のみのストアも含みます。これらの検出済みストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外のパスはスキップされます。

JSON の例:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## クリーンアップメンテナンス

次の書き込みサイクルを待たずに、今すぐメンテナンスを実行します:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は設定の `session.maintenance` 設定を使用します:

- スコープ注記: `openclaw sessions cleanup` はセッションストア、トランスクリプト、trajectory サイドカーを保守します。Cron 実行履歴は削除しません。これは [Cron 設定](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.keepLines` によって管理され、[Cron メンテナンス](/ja-JP/automation/cron-jobs#maintenance) で説明されています。
- クリーンアップは、`session.maintenance.pruneAfter` より古い未参照のプライマリトランスクリプト、Compaction チェックポイント、trajectory サイドカーも削除します。`sessions.json` からまだ参照されているファイルは保持されます。
- クリーンアップは、短命の Gateway モデル実行プローブのクリーンアップを `modelRunPruned` として別に報告します。これは `agent:*:explicit:model-run-<uuid>` のような厳密で明示的なキーにのみ一致します。固定保持期間は `24h` ですが、これは圧力ゲート付きです。セッションエントリのメンテナンスまたは上限圧力に達した場合にのみ、古いプローブ行を削除します。実行時には、モデル実行クリーンアップはグローバルな古いデータのクリーンアップと上限適用の前に行われます。

- `--dry-run`: 書き込みを行わずに、削除または上限適用されるエントリ数をプレビューします。
  - テキストモードでは、ドライランはセッションごとのアクションテーブル（`Action`、`Key`、`Age`、`Model`、`Flags`）に加え、セッションラベルごとにグループ化された概要を出力するため、保持されるものと削除されるものを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。
- `--fix-missing`: トランスクリプトファイルが存在しない、またはヘッダーのみ/空のエントリを、通常ならまだ経過時間や件数の条件に達していない場合でも削除します。
- `--fix-dm-scope`: `session.dmScope` が `main` の場合、以前の `per-peer`、`per-channel-peer`、または `per-account-channel-peer` ルーティングによって残された古いピアキー付き direct-DM 行を廃止します。まず `--dry-run` を使用してください。クリーンアップを適用すると、それらの行は `sessions.json` から削除され、トランスクリプトは削除済みアーカイブとして保持されます。
- `--active-key <key>`: 特定のアクティブキーをディスク予算による退避から保護します。グループセッションやスレッドスコープのチャットセッションなど、耐久性のある外部会話ポインターも、経過時間/件数/ディスク予算メンテナンスによって保持されます。
- `--agent <id>`: 設定済みエージェントストア 1 件に対してクリーンアップを実行します。
- `--all-agents`: 設定済みのすべてのエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON 概要を出力します。`--all-agents` の場合、出力にはストアごとの概要が含まれます。

Gateway に到達可能な場合、設定済みエージェントストアに対するドライランではないクリーンアップは Gateway 経由で送信されるため、ランタイムトラフィックと同じセッションストアライターを共有します。ストアファイルを明示的にオフライン修復するには `--store <path>` を使用します。

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## セッションを Compact する

詰まった、または大きくなりすぎたセッションのコンテキスト予算を回収します。`openclaw sessions compact <key>` は、`sessions.compact` Gateway RPC のファーストクラスラッパーであり、実行中の Gateway が必要です。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` がない場合、Gateway は LLM でトランスクリプトを要約します。これは時間がかかることがあるため、デフォルトの `--timeout` は `180000` ms です。
- `--max-lines <n>` を指定すると、最後の `n` 行のトランスクリプトに切り詰め、以前のトランスクリプトを `.bak` サイドカーとしてアーカイブします。
- `--agent <id>`: セッションを所有するエージェント。`global` キーでは必須です。
- `--url` / `--token` / `--password`: Gateway 接続の上書き。
- `--timeout <ms>`: ミリ秒単位の RPC タイムアウト。
- `--json`: 生の RPC ペイロードを出力します。

Gateway が Compaction 失敗を報告した場合、または到達不能な場合、このコマンドは 0 以外で終了します。そのため、cron やスクリプトがサイレントな no-op を成功と誤認することはありません。

> 注: `openclaw agent --message '/compact ...'` は Compaction パスではありません。CLI からのスラッシュコマンドは authorized-sender チェックによって拒否されます。この呼び出しは、サイレントに no-op になるのではなく、ここを指す案内とともに 0 以外で終了します。

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` は次を受け付けます:

| フィールド | 型 | 必須 | 説明 |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | はい      | Compact するセッションキー（例: `agent:main:main`）。    |
| `agentId`  | string      | いいえ       | セッションを所有するエージェント ID（`global` キー用）。        |
| `maxLines` | integer ≥ 1 | いいえ       | LLM 要約の代わりに最後の N 行へ切り詰めます。 |

LLM 要約レスポンスの例:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

切り詰めレスポンスの例（`--max-lines 200`）:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## 関連

- セッション設定: [設定リファレンス](/ja-JP/gateway/config-agents#session)
- [CLI リファレンス](/ja-JP/cli)
- [セッション管理](/ja-JP/concepts/session)

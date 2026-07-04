---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションの一覧表示 + 使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-07-04T20:24:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存された会話セッションを一覧表示します。

セッション一覧は、チャネル/プロバイダーの稼働確認ではありません。セッションストアに永続化された会話行を表示します。静かな Discord、Slack、Telegram、またはその他のチャネルは、メッセージが処理されて新しいセッション行が作成されるまで、正常に再接続しても新しいセッション行を作成しないことがあります。ライブのチャネル接続性が必要な場合は、`openclaw channels status --probe`、`openclaw status --deep`、または `openclaw health --verbose` を使用してください。

`openclaw sessions` と Gateway `sessions.list` のレスポンスは、長期間運用される大きなストアが CLI プロセスや Gateway イベントループを占有しないよう、デフォルトで上限が設定されています。CLI はデフォルトで最新の 100 セッションを返します。より小さい/大きい範囲を指定するには `--limit <n>` を渡し、意図的にストア全体が必要な場合は `--limit all` を渡します。JSON レスポンスには、呼び出し元が追加行の存在を示す必要がある場合に備えて、`totalCount`、`limitApplied`、`hasMore` が含まれます。

RPC クライアントは `configuredAgentsOnly: true` を渡すことで、広い結合ディスカバリーソースを維持しつつ、現在 config に存在するエージェントの行だけを返せます。Control UI はデフォルトでこのモードを使用するため、削除済みまたはディスク上にのみ存在するエージェントストアが Sessions ビューに再表示されません。

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
- `--agent <id>`: 1 つの設定済みエージェントストア
- `--all-agents`: すべての設定済みエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` と組み合わせ不可）
- `--limit <n|all>`: 出力する最大行数（デフォルトは `100`; `all` は完全な出力を復元）

保存済みセッションの人間が読める trajectory 進行状況を tail します:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` は、最近の trajectory JSONL イベントをコンパクトな進行状況行として描画します。`--session-key` がない場合、まず実行中のセッションを tail し、その後最新の保存済みセッションを tail します。`--tail <count>` は follow モードの前に出力する既存イベント数を制御します。デフォルトは `80` で、`0` は現在の末尾から開始します。`--follow` は、`<session>.trajectory-path.json` によって参照される移動済みファイルを含め、選択された trajectory ファイルを監視し続けます。

進行状況ビューは意図的に保守的です。プロンプト本文、ツール引数、ツール結果本文は出力されません。ツール呼び出しはツール名と `{...redacted...}` を表示します。ツール結果は `ok`、`error`、`done` などのステータスを表示します。モデル完了行はプロバイダー/モデルと終端ステータスを表示します。

保存済みセッションの trajectory バンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、オーナーが exec リクエストを承認した後に `/export-trajectory` スラッシュコマンドで使用されるコマンドパスです。出力ディレクトリは常に、選択されたワークスペース配下の `.openclaw/trajectory-exports/` 内に解決されます。

`openclaw sessions --all-agents` は設定済みエージェントストアを読み取ります。Gateway と ACP のセッションディスカバリーはより広く、デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルート配下で見つかった、ディスク上にのみ存在するストアも含みます。これらの検出されたストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外パスはスキップされます。

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

## クリーンアップ保守

次の書き込みサイクルを待たずに、今すぐ保守を実行します:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は config の `session.maintenance` 設定を使用します:

- スコープの注記: `openclaw sessions cleanup` はセッションストア、トランスクリプト、trajectory サイドカーを保守します。Cron 実行履歴は削除しません。これは [Cron 設定](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.keepLines` によって管理され、[Cron 保守](/ja-JP/automation/cron-jobs#maintenance) で説明されています。
- クリーンアップは、`session.maintenance.pruneAfter` より古い未参照のプライマリトランスクリプト、Compaction チェックポイント、trajectory サイドカーも削除します。`sessions.json` からまだ参照されているファイルは保持されます。
- クリーンアップは、短命の gateway model-run probe クリーンアップを `modelRunPruned` として別に報告します。これは `agent:*:explicit:model-run-<uuid>` のような厳密で明示的なキーにのみ一致します。固定保持期間は `24h` ですが、これは負荷条件付きです。セッションエントリーの保守/上限圧力に達した場合にのみ、古い probe 行を削除します。実行される場合、model-run クリーンアップはグローバルな古いエントリーのクリーンアップと上限制御の前に行われます。

- `--dry-run`: 書き込まずに、削除/上限制御されるエントリー数をプレビューします。
  - テキストモードでは、dry-run はセッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）に加え、セッションラベル別にグループ化された概要を出力するため、保持されるものと削除されるものを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でも保守を適用します。
- `--fix-missing`: トランスクリプトファイルが存在しない、またはヘッダーのみ/空であるエントリーを、通常ならまだ経過時間/件数の条件に該当しない場合でも削除します。
- `--fix-dm-scope`: `session.dmScope` が `main` の場合、以前の `per-peer`、`per-channel-peer`、または `per-account-channel-peer` ルーティングによって残された古い peer-keyed direct-DM 行を退役させます。まず `--dry-run` を使用してください。クリーンアップを適用すると、それらの行は `sessions.json` から削除され、トランスクリプトは削除済みアーカイブとして保持されます。
- `--active-key <key>`: 特定のアクティブキーをディスク予算による退避から保護します。グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターも、経過時間/件数/ディスク予算の保守で保持されます。
- `--agent <id>`: 1 つの設定済みエージェントストアに対してクリーンアップを実行します。
- `--all-agents`: すべての設定済みエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON 概要を出力します。`--all-agents` と併用すると、出力にはストアごとの概要が 1 つずつ含まれます。

Gateway に到達できる場合、設定済みエージェントストアに対する dry-run ではないクリーンアップは Gateway 経由で送信されるため、ランタイムトラフィックと同じセッションストアライターを共有します。ストアファイルを明示的にオフライン修復するには `--store <path>` を使用してください。

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

## セッションをコンパクト化する

行き詰まった、または過大になったセッションのコンテキスト予算を回収します。`openclaw sessions compact <key>` は `sessions.compact` gateway RPC の第一級ラッパーであり、実行中の gateway が必要です。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` がない場合、gateway は LLM でトランスクリプトを要約します。CLI はデフォルトではクライアント期限を課しません。gateway が設定済みの compaction ライフサイクルを所有します。
- `--max-lines <n>` を指定すると、最後の `n` トランスクリプト行に切り詰め、以前のトランスクリプトを `.bak` サイドカーとしてアーカイブします。
- `--agent <id>`: セッションを所有するエージェント。`global` キーでは必須です。
- `--url` / `--token` / `--password`: gateway 接続の上書き。
- `--timeout <ms>`: 任意のクライアント側 RPC タイムアウト（ミリ秒）。
- `--json`: 生の RPC ペイロードを出力します。

gateway が Compaction の失敗を報告した場合、または到達不能な場合、このコマンドはゼロ以外で終了するため、Cron とスクリプトが無言の no-op を成功と誤認することはありません。

> 注: `openclaw agent --message '/compact ...'` は **Compaction パスではありません**。CLI からのスラッシュコマンドは authorized-sender チェックで拒否されます。その呼び出しは、無言で no-op になるのではなく、ここを指す案内とともにゼロ以外で終了します。

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` は次を受け付けます:

| フィールド | 型 | 必須 | 説明 |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | はい      | コンパクト化するセッションキー（例: `agent:main:main`）。    |
| `agentId`  | string      | いいえ       | セッションを所有するエージェント id（`global` キー用）。        |
| `maxLines` | integer ≥ 1 | いいえ       | LLM 要約の代わりに最後の N 行に切り詰めます。 |

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

- セッション config: [設定リファレンス](/ja-JP/gateway/config-agents#session)
- [CLI リファレンス](/ja-JP/cli)
- [セッション管理](/ja-JP/concepts/session)

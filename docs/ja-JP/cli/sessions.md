---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい場合
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションの一覧表示 + 使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-05-07T13:15:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存された会話セッションを一覧表示します。

セッション一覧は、チャンネル/プロバイダーの稼働確認ではありません。セッションストアに永続化された会話行を表示します。静かな Discord、Slack、Telegram、その他のチャンネルは、メッセージが処理されて新しいセッション行が作成されるまで、再接続に成功していても表示上は変わらないことがあります。ライブのチャンネル接続性が必要な場合は、`openclaw channels status --probe`、`openclaw status --deep`、または `openclaw health --verbose` を使用してください。

`openclaw sessions` と Gateway の `sessions.list` レスポンスは、長期間使われた大きなストアが CLI プロセスや Gateway イベントループを占有しないよう、デフォルトで上限が設定されています。CLI はデフォルトで最新の 100 セッションを返します。より小さい/大きい範囲が必要な場合は `--limit <n>` を渡し、意図的にストア全体が必要な場合は `--limit all` を渡します。呼び出し側がさらに行が存在することを表示する必要がある場合、JSON レスポンスには `totalCount`、`limitApplied`、`hasMore` が含まれます。

RPC クライアントは、広い統合検出ソースを維持しつつ、現在設定に存在するエージェントの行だけを返すために `configuredAgentsOnly: true` を渡せます。Control UI はこのモードをデフォルトで使用するため、削除済みまたはディスク上にだけ存在するエージェントストアがセッションビューに再表示されません。

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

- デフォルト: 設定済みデフォルトエージェントストア
- `--verbose`: 詳細ログ
- `--agent <id>`: 設定済みエージェントストア 1 つ
- `--all-agents`: すべての設定済みエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` と組み合わせることはできません）
- `--limit <n|all>`: 出力する最大行数（デフォルトは `100`、`all` は完全な出力を復元）

保存されたセッションの trajectory バンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が exec リクエストを承認した後に `/export-trajectory` スラッシュコマンドが使用するコマンドパスです。出力ディレクトリは、選択されたワークスペース配下の `.openclaw/trajectory-exports/` 内に常に解決されます。

`openclaw sessions --all-agents` は設定済みエージェントストアを読み取ります。Gateway と ACP のセッション検出はより広範で、デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルート配下で見つかった、ディスク上にだけ存在するストアも含めます。検出されたストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外パスはスキップされます。

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

- スコープ注記: `openclaw sessions cleanup` は、セッションストア、トランスクリプト、trajectory サイドカーをメンテナンスします。cron 実行ログ（`cron/runs/<jobId>.jsonl`）は削除しません。cron 実行ログは [Cron 設定](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` と `cron.runLog.keepLines` によって管理され、[Cron メンテナンス](/ja-JP/automation/cron-jobs#maintenance) で説明されています。
- クリーンアップは、`session.maintenance.pruneAfter` より古い未参照のプライマリトランスクリプト、compaction チェックポイント、trajectory サイドカーも削除します。`sessions.json` からまだ参照されているファイルは保持されます。

- `--dry-run`: 書き込みを行わずに、削除/上限適用されるエントリ数をプレビューします。
  - テキストモードでは、dry-run はセッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）を出力するため、保持されるものと削除されるものを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。
- `--fix-missing`: トランスクリプトファイルが欠落しているエントリを、通常ならまだ経過時間/件数の対象外であっても削除します。
- `--fix-dm-scope`: `session.dmScope` が `main` の場合、以前の `per-peer`、`per-channel-peer`、または `per-account-channel-peer` ルーティングによって残された古い peer-keyed の direct-DM 行を廃止します。最初に `--dry-run` を使用してください。クリーンアップを適用すると、それらの行は `sessions.json` から削除され、対応するトランスクリプトは削除済みアーカイブとして保持されます。
- `--active-key <key>`: 特定のアクティブキーをディスク容量予算による退避から保護します。グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターも、経過時間/件数/ディスク容量予算メンテナンスによって保持されます。
- `--agent <id>`: 設定済みエージェントストア 1 つに対してクリーンアップを実行します。
- `--all-agents`: すべての設定済みエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON サマリーを出力します。`--all-agents` と一緒に使うと、出力にはストアごとのサマリーが含まれます。

Gateway に到達できる場合、設定済みエージェントストアに対する dry-run ではないクリーンアップは Gateway 経由で送信され、実行時トラフィックと同じセッションストアライターを共有します。ストアファイルを明示的にオフライン修復するには `--store <path>` を使用してください。

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

関連:

- セッション設定: [設定リファレンス](/ja-JP/gateway/config-agents#session)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セッション管理](/ja-JP/concepts/session)

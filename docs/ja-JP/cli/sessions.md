---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションの一覧表示 + 使用法）'
title: セッション
x-i18n:
    generated_at: "2026-05-05T08:25:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存された会話セッションを一覧表示します。

セッション一覧はチャネル/プロバイダーの稼働状況チェックではありません。セッションストアに永続化された
会話行を表示します。静かな Discord、Slack、Telegram、または
その他のチャネルは、新しいセッション行を作成しなくても、メッセージが処理されるまで正常に再接続できます。
ライブのチャネル接続性が必要な場合は、`openclaw channels status --probe`、
`openclaw status --deep`、または `openclaw health --verbose` を使用してください。

`openclaw sessions` と Gateway `sessions.list` のレスポンスは、
大規模で長期間存続するストアが CLI プロセスや Gateway の
イベントループを占有しないように、デフォルトで上限が設定されています。CLI はデフォルトで最新の 100 セッションを返します。
より小さい/大きい範囲が必要な場合は `--limit <n>` を渡し、意図的に
ストア全体が必要な場合は `--limit all` を渡してください。JSON レスポンスには、呼び出し元がさらに行が存在することを表示する必要がある場合に備えて、
`totalCount`、`limitApplied`、`hasMore` が含まれます。

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

- デフォルト: 構成済みのデフォルトエージェントストア
- `--verbose`: 詳細ログ
- `--agent <id>`: 構成済みエージェントストア 1 つ
- `--all-agents`: 構成済みのすべてのエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` と組み合わせることはできません）
- `--limit <n|all>`: 出力する最大行数（デフォルトは `100`; `all` で全出力を復元）

保存されたセッションの trajectory バンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、オーナーが実行リクエストを承認した後に `/export-trajectory` スラッシュコマンドで使用されるコマンドパスです。
出力ディレクトリは常に、選択されたワークスペース配下の
`.openclaw/trajectory-exports/` 内に解決されます。

`openclaw sessions --all-agents` は構成済みのエージェントストアを読み取ります。Gateway と ACP の
セッション検出はより広範で、デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルートの下にある
ディスクのみのストアも含めます。これらの検出されたストアは、エージェントルート内の通常の
`sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外パスはスキップされます。

JSON 例:

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

今すぐメンテナンスを実行します（次の書き込みサイクルを待たない場合）:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は構成の `session.maintenance` 設定を使用します:

- スコープ注記: `openclaw sessions cleanup` はセッションストア、トランスクリプト、trajectory サイドカーをメンテナンスします。Cron 実行ログ（`cron/runs/<jobId>.jsonl`）は削除しません。これらは [Cron 構成](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` と `cron.runLog.keepLines` によって管理され、[Cron メンテナンス](/ja-JP/automation/cron-jobs#maintenance) で説明されています。
- クリーンアップは、`session.maintenance.pruneAfter` より古い未参照のプライマリトランスクリプト、Compaction チェックポイント、trajectory サイドカーも削除します。`sessions.json` からまだ参照されているファイルは保持されます。

- `--dry-run`: 書き込みを行わずに、削除/上限適用されるエントリ数をプレビューします。
  - テキストモードでは、dry-run はセッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）を出力するため、保持されるものと削除されるものを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。
- `--fix-missing`: トランスクリプトファイルが欠落しているエントリを削除します。通常はまだ経過時間/数の条件に該当しない場合でも削除します。
- `--active-key <key>`: 特定のアクティブキーをディスク予算による退避から保護します。グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターも、経過時間/数/ディスク予算のメンテナンスによって保持されます。
- `--agent <id>`: 構成済みエージェントストア 1 つに対してクリーンアップを実行します。
- `--all-agents`: 構成済みのすべてのエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON サマリーを出力します。`--all-agents` を指定した場合、出力にはストアごとのサマリーが含まれます。

Gateway に到達できる場合、構成済みエージェントストアに対する dry-run ではないクリーンアップは
Gateway 経由で送信されるため、ランタイムトラフィックと同じセッションストアライターを共有します。
ストアファイルの明示的なオフライン修復には `--store <path>` を使用してください。

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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

関連:

- セッション構成: [構成リファレンス](/ja-JP/gateway/config-agents#session)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セッション管理](/ja-JP/concepts/session)

---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションの一覧表示 + 使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-05-04T07:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存済みの会話セッションを一覧表示します。

セッション一覧は、チャンネルやプロバイダーの稼働状況チェックではありません。セッションストアから永続化された会話行を表示します。静かな Discord、Slack、Telegram、またはその他のチャンネルは、新しいセッション行を作成しなくても、メッセージが処理されるまで正常に再接続できます。ライブのチャンネル接続性が必要な場合は、`openclaw channels status --probe`、`openclaw status --deep`、または `openclaw health --verbose` を使用してください。

Gateway の `sessions.list` レスポンスはデフォルトで制限されているため、大規模で長期間存続するストアが Gateway のイベントループを占有することはありません。別の結果ウィンドウが必要な場合は、RPC クライアントから明示的に正の `limit` を渡してください。呼び出し元がさらに行が存在することを示す必要がある場合、レスポンスには `totalCount`、`limitApplied`、`hasMore` が含まれます。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

スコープ選択:

- デフォルト: 設定済みのデフォルトエージェントストア
- `--verbose`: 詳細ログ
- `--agent <id>`: 設定済みエージェントストア 1 つ
- `--all-agents`: 設定済みのすべてのエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` と組み合わせることはできません）

保存済みセッションの軌跡バンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が実行リクエストを承認した後に `/export-trajectory` スラッシュコマンドで使用されるコマンドパスです。出力ディレクトリは常に、選択されたワークスペース配下の `.openclaw/trajectory-exports/` 内に解決されます。

`openclaw sessions --all-agents` は設定済みエージェントストアを読み取ります。Gateway と ACP のセッション検出はより広範です。デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルート配下で見つかった、ディスク上にのみ存在するストアも含まれます。検出されたストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外のパスはスキップされます。

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は設定の `session.maintenance` 設定を使用します:

- スコープの注記: `openclaw sessions cleanup` は、セッションストア、トランスクリプト、軌跡サイドカーを保守します。cron 実行ログ（`cron/runs/<jobId>.jsonl`）は削除しません。これは [Cron 設定](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` と `cron.runLog.keepLines` によって管理され、[Cron 保守](/ja-JP/automation/cron-jobs#maintenance) で説明されています。

- `--dry-run`: 書き込みを行わずに、削除または上限制限されるエントリ数をプレビューします。
  - テキストモードでは、dry-run はセッションごとのアクションテーブル（`Action`、`Key`、`Age`、`Model`、`Flags`）を出力するため、保持されるものと削除されるものを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でも保守を適用します。
- `--fix-missing`: トランスクリプトファイルが見つからないエントリを、通常ならまだ経過時間や件数の条件から外れない場合でも削除します。
- `--active-key <key>`: 特定のアクティブキーをディスク容量予算による退避から保護します。グループセッションやスレッド単位のチャットセッションなど、永続的な外部会話ポインターも、経過時間、件数、ディスク容量予算による保守で保持されます。
- `--agent <id>`: 設定済みエージェントストア 1 つに対してクリーンアップを実行します。
- `--all-agents`: 設定済みのすべてのエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON サマリーを出力します。`--all-agents` を指定した場合、出力にはストアごとのサマリーが含まれます。

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

- セッション設定: [設定リファレンス](/ja-JP/gateway/config-agents#session)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セッション管理](/ja-JP/concepts/session)

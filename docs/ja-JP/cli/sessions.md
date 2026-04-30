---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションの一覧表示 + 使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-04-30T05:06:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存済みの会話セッションを一覧表示します。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

スコープ選択:

- デフォルト: 構成済みのデフォルトエージェントストア
- `--verbose`: 詳細ログ
- `--agent <id>`: 構成済みエージェントストアを 1 つ指定
- `--all-agents`: 構成済みのすべてのエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` や `--all-agents` とは併用不可）

保存済みセッションのトラジェクトリバンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が exec リクエストを承認した後に `/export-trajectory` スラッシュコマンドで使用されるコマンドパスです。出力ディレクトリは、選択されたワークスペース配下の `.openclaw/trajectory-exports/` 内に常に解決されます。

`openclaw sessions --all-agents` は構成済みエージェントストアを読み取ります。Gateway と ACP のセッション検出はより広範で、デフォルトの `agents/` ルート、またはテンプレート化された `session.store` ルート配下で見つかる、ディスク上にのみ存在するストアも含みます。検出されたストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外パスはスキップされます。

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

`openclaw sessions cleanup` は config の `session.maintenance` 設定を使用します:

- スコープ注記: `openclaw sessions cleanup` は、セッションストア、トランスクリプト、トラジェクトリのサイドカーを保守します。cron 実行ログ（`cron/runs/<jobId>.jsonl`）は削除しません。これらは [Cron 構成](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` と `cron.runLog.keepLines` で管理され、[Cron 保守](/ja-JP/automation/cron-jobs#maintenance) で説明されています。

- `--dry-run`: 書き込みなしで、削除または上限適用されるエントリ数をプレビューします。
  - テキストモードでは、dry-run はセッションごとのアクション表（`Action`, `Key`, `Age`, `Model`, `Flags`）を出力するため、何が保持され、何が削除されるかを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でも保守を適用します。
- `--fix-missing`: トランスクリプトファイルが欠落しているエントリを、通常ならまだ経過時間や件数で対象外になる場合でも削除します。
- `--active-key <key>`: 特定のアクティブキーをディスク容量制限による退避から保護します。
- `--agent <id>`: 構成済みエージェントストアを 1 つ指定して cleanup を実行します。
- `--all-agents`: 構成済みのすべてのエージェントストアに対して cleanup を実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON サマリーを出力します。`--all-agents` を指定した場合、出力にはストアごとのサマリーが含まれます。

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

- セッション config: [構成リファレンス](/ja-JP/gateway/config-agents#session)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セッション管理](/ja-JP/concepts/session)

---
read_when:
    - 保存済みセッションを一覧表示して最近のアクティビティを確認したい
summary: '`openclaw sessions` のCLIリファレンス（保存済みセッションと使用状況を一覧表示する）'
title: セッション
x-i18n:
    generated_at: "2026-04-24T04:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

保存済み会話セッションを一覧表示します。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

スコープ選択:

- デフォルト: 設定されたデフォルトエージェントストア
- `--verbose`: 詳細ログ
- `--agent <id>`: 1つの設定済みエージェントストア
- `--all-agents`: すべての設定済みエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` と併用不可）

`openclaw sessions --all-agents` は設定済みエージェントストアを読み取ります。GatewayとACPのセッション検出はより広範です。これらには、デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルートの下で見つかったディスクのみのストアも含まれます。これらの検出されたストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外のパスはスキップされます。

JSONの例:

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

## クリーンアップメンテナンス

次回の書き込みサイクルを待たずに、今すぐメンテナンスを実行します:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は、設定の `session.maintenance` を使用します:

- スコープに関する注記: `openclaw sessions cleanup` がメンテナンスするのは、セッションストア/トランスクリプトのみです。Cron実行ログ（`cron/runs/<jobId>.jsonl`）は削除しません。これらは [Cron設定](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` と `cron.runLog.keepLines` で管理され、[Cronメンテナンス](/ja-JP/automation/cron-jobs#maintenance) で説明されています。

- `--dry-run`: 書き込まずに、いくつのエントリが削除/上限適用されるかをプレビューします。
  - テキストモードでは、dry-run はセッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）を出力するため、どれが保持され、どれが削除されるかを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` であってもメンテナンスを適用します。
- `--fix-missing`: トランスクリプトファイルが欠落しているエントリを削除します。通常ならまだ経過時間/件数上限に達していなくても削除されます。
- `--active-key <key>`: 特定のactive keyをディスク予算による退避から保護します。
- `--agent <id>`: 1つの設定済みエージェントストアに対してクリーンアップを実行します。
- `--all-agents`: すべての設定済みエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSONサマリーを出力します。`--all-agents` と併用した場合、出力にはストアごとのサマリーが含まれます。

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

- [CLIリファレンス](/ja-JP/cli)
- [セッション管理](/ja-JP/concepts/session)

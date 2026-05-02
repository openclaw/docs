---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい場合
summary: '`openclaw sessions` のコマンドラインリファレンス（保存済みセッションの一覧表示 + 使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-05-02T20:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存済みの会話セッションを一覧表示します。

セッション一覧は、チャンネル/プロバイダーの稼働状況チェックではありません。セッションストアから永続化済みの会話行を表示します。静かな Discord、Slack、Telegram、またはその他のチャンネルは、メッセージが処理されるまで新しいセッション行を作成せずに正常に再接続できます。ライブのチャンネル接続性が必要な場合は、`openclaw channels status --probe`、`openclaw status --deep`、または `openclaw health --verbose` を使用してください。

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
- `--agent <id>`: 1 つの設定済みエージェントストア
- `--all-agents`: すべての設定済みエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` と併用不可）

保存済みセッションの軌跡バンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が exec リクエストを承認した後に `/export-trajectory` スラッシュコマンドで使用されるコマンドパスです。出力ディレクトリは、選択されたワークスペース配下の `.openclaw/trajectory-exports/` 内に常に解決されます。

`openclaw sessions --all-agents` は設定済みエージェントストアを読み取ります。Gateway と ACP のセッション検出はより広範です。デフォルトの `agents/` ルート、またはテンプレート化された `session.store` ルート配下で見つかったディスク上のみのストアも含まれます。検出されたストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外パスはスキップされます。

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

## クリーンアップメンテナンス

次の書き込みサイクルを待たずに、今すぐメンテナンスを実行します:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は設定の `session.maintenance` 設定を使用します:

- スコープメモ: `openclaw sessions cleanup` はセッションストア、トランスクリプト、軌跡サイドカーをメンテナンスします。Cron 実行ログ（`cron/runs/<jobId>.jsonl`）は剪定しません。これらは [Cron 設定](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` と `cron.runLog.keepLines` によって管理され、[Cron メンテナンス](/ja-JP/automation/cron-jobs#maintenance) で説明されています。

- `--dry-run`: 書き込みを行わずに、何件のエントリが剪定/上限適用されるかをプレビューします。
  - テキストモードでは、ドライランはセッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）を出力するため、保持されるものと削除されるものを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。
- `--fix-missing`: トランスクリプトファイルが欠落しているエントリを、通常はまだ経過時間/件数の対象外であっても削除します。
- `--active-key <key>`: 特定のアクティブキーをディスク容量制限による退避から保護します。グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターも、経過時間/件数/ディスク容量制限メンテナンスで保持されます。
- `--agent <id>`: 1 つの設定済みエージェントストアに対してクリーンアップを実行します。
- `--all-agents`: すべての設定済みエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON サマリーを出力します。`--all-agents` の場合、出力にはストアごとに 1 つのサマリーが含まれます。

Gateway に到達できる場合、設定済みエージェントストアの非ドライランクリーンアップは Gateway 経由で送信されるため、実行時トラフィックと同じセッションストア書き込み側を共有します。ストアファイルを明示的にオフライン修復する場合は `--store <path>` を使用してください。

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

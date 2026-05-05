---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい場合
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッション一覧 + 使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-05-05T01:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存済みの会話セッションを一覧表示します。

セッション一覧は channel/provider の生存確認ではありません。セッションストアに永続化された
会話行を表示します。静かな Discord、Slack、Telegram、または
その他のチャンネルは、メッセージが処理されて新しいセッション行が作成されるまでの間も、
正常に再接続できます。ライブのチャンネル接続性が必要な場合は
`openclaw channels status --probe`、`openclaw status --deep`、または
`openclaw health --verbose` を使用してください。

`openclaw sessions` と Gateway `sessions.list` のレスポンスは、長期間存続する大規模なストアが CLI プロセスや Gateway
イベントループを占有しないように、デフォルトで上限が設定されています。CLI はデフォルトで最新の 100 セッションを返します。より小さい/大きい範囲にするには
`--limit <n>` を渡し、意図的にストア全体が必要な場合は `--limit all` を渡してください。JSON レスポンスには、呼び出し元がさらに行が存在することを示す必要がある場合に備えて、`totalCount`、`limitApplied`、および
`hasMore` が含まれます。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

スコープの選択:

- default: 設定済みのデフォルトエージェントストア
- `--verbose`: 詳細ログ
- `--agent <id>`: 1 つの設定済みエージェントストア
- `--all-agents`: すべての設定済みエージェントストアを集約
- `--store <path>`: 明示的なストアパス（`--agent` または `--all-agents` とは併用不可）
- `--limit <n|all>`: 出力する最大行数（デフォルトは `100`; `all` は完全な出力に戻します）

保存済みセッションの trajectory バンドルをエクスポートします:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が exec リクエストを承認した後に `/export-trajectory` スラッシュコマンドで使用されるコマンドパスです。出力ディレクトリは常に、選択したワークスペース配下の
`.openclaw/trajectory-exports/` 内に解決されます。

`openclaw sessions --all-agents` は設定済みエージェントストアを読み取ります。Gateway と ACP
のセッション検出はより広範で、デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルート配下で見つかったディスク上のみのストアも含まれます。検出されたストアは、エージェントルート内の通常の `sessions.json` ファイルに解決される必要があります。シンボリックリンクとルート外パスはスキップされます。

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は設定の `session.maintenance` 設定を使用します:

- スコープに関する注記: `openclaw sessions cleanup` はセッションストア、トランスクリプト、および trajectory サイドカーをメンテナンスします。これは cron 実行ログ（`cron/runs/<jobId>.jsonl`）を削除しません。cron 実行ログは [Cron 設定](/ja-JP/automation/cron-jobs#configuration) の `cron.runLog.maxBytes` と `cron.runLog.keepLines` で管理され、[Cron メンテナンス](/ja-JP/automation/cron-jobs#maintenance) で説明されています。

- `--dry-run`: 書き込まずに、いくつのエントリが削除/上限適用されるかをプレビューします。
  - テキストモードでは、dry-run はセッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）を出力するため、何が保持され、何が削除されるかを確認できます。
- `--enforce`: `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。
- `--fix-missing`: トランスクリプトファイルが欠落しているエントリを、通常はまだ経過時間/件数の対象外であっても削除します。
- `--active-key <key>`: 特定のアクティブキーをディスク予算による退避から保護します。グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターも、経過時間/件数/ディスク予算メンテナンスで保持されます。
- `--agent <id>`: 1 つの設定済みエージェントストアに対してクリーンアップを実行します。
- `--all-agents`: すべての設定済みエージェントストアに対してクリーンアップを実行します。
- `--store <path>`: 特定の `sessions.json` ファイルに対して実行します。
- `--json`: JSON サマリーを出力します。`--all-agents` を指定した場合、出力にはストアごとのサマリーが含まれます。

Gateway に到達できる場合、設定済みエージェントストアの非 dry-run クリーンアップは
Gateway 経由で送信されるため、ランタイムトラフィックと同じセッションストアライターを共有します。ストアファイルの明示的なオフライン修復には `--store <path>` を使用してください。

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

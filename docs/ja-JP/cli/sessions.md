---
read_when:
    - 保存済みのセッションを一覧表示し、最近のアクティビティを確認する場合
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションと使用状況の一覧）'
title: セッション
x-i18n:
    generated_at: "2026-07-16T11:32:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存されている会話セッションを一覧表示します。

セッション一覧は、チャンネル／プロバイダーの稼働状況を確認するものではありません。セッションストアに永続化された
会話行を表示します。非アクティブな Discord、Slack、Telegram、または
その他のチャンネルは、メッセージが処理されて新しいセッション行が作成される前でも、
正常に再接続できます。チャンネルのライブ接続状態を確認する必要がある場合は、
`openclaw channels status --probe`、`openclaw status --deep`、または `openclaw health --verbose` を使用してください。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

フラグ：

| フラグ                 | 説明                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | 設定済みの単一エージェントストア（デフォルト：設定済みのデフォルトエージェント）。        |
| `--all-agents`       | 設定済みのすべてのエージェントストアを集約します。                                 |
| `--store <path>`     | 明示的なストアパス（`--agent` または `--all-agents` とは併用不可）。 |
| `--active <minutes>` | 過去 N 分以内に更新されたセッションのみを表示します。                  |
| `--limit <n\|all>`   | 出力する最大行数（デフォルトは `100`、`all` で全件出力に戻します）。        |
| `--json`             | 機械可読形式で出力します。                                               |
| `--verbose`          | 詳細ログを出力します。                                                       |

`openclaw sessions` と Gateway の `sessions.list` RPC はデフォルトで上限が設定されており、
大規模で長期間使用されているストアが CLI プロセスや Gateway のイベントループを
占有しないようになっています。CLI はデフォルトで最新の 100 セッションを返します。取得範囲を
小さく／大きくするには `--limit <n>` を、ストア全体が明示的に必要な場合は
`--limit all` を渡してください。呼び出し元がさらに行が存在することを示す必要がある場合、
JSON レスポンスには `totalCount`、`limitApplied`、および `hasMore`
が含まれます。

RPC クライアントは `configuredAgentsOnly: true` を渡すことで、広範な統合検出ソースを
維持しつつ、現在設定に存在するエージェントの行だけを返せます。
Control UI はデフォルトでこのモードを使用するため、削除済みまたはディスク上にのみ存在する
エージェントストアが Sessions ビューに再表示されることはありません。

`--all-agents` は設定済みのエージェントストアを読み取ります。Gateway と ACP のセッション
検出はより広範で、設定済みのエージェントルートまたはテンプレート化された
`session.store` ルートから解決された SQLite ストアも含まれます。従来のセレクターパスは
エージェントルート内に解決される必要があり、シンボリックリンクおよびルート外のパスは
スキップされます。

`openclaw sessions --all-agents --json`：

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## 軌跡の進行状況を追跡する

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` は、最近のランタイム軌跡イベントを簡潔な
進行状況行として表示します。`--session-key` を指定しない場合、まず実行中のセッションを追跡し、その後
保存済みの最新セッションを追跡します。`--tail <count>` は、追跡モードの前に
既存イベントをいくつ表示するかを制御します。デフォルトは `80` で、`0` は現在の末尾から開始します。
`--follow` は、選択された SQLite ベースのセッションまたは明示的に指定した
従来の軌跡ファイルを監視し続けます。

進行状況ビューは意図的に保守的です。プロンプトテキスト、ツール引数、
およびツール結果の本文は出力されません。ツール呼び出しではツール名と
`{...redacted...}` が表示され、ツール結果では `ok`、`error`、または `done` などの状態が表示されます。
モデル完了行にはプロバイダー／モデルと終了状態が表示されます。

## 軌跡バンドルをエクスポートする

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が実行要求を承認した後に `/export-trajectory` スラッシュコマンドが使用する
コマンドパスです。出力ディレクトリは、選択したワークスペース内の
`.openclaw/trajectory-exports/` の下に必ず解決されます。

## クリーンアップメンテナンス

次の書き込みサイクルを待たずに、メンテナンスを今すぐ実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は設定の `session.maintenance` 設定を使用します
（[設定リファレンス](/ja-JP/gateway/config-agents#session)）。

- 対象範囲に関する注意：`openclaw sessions cleanup` はセッションストア、
  トランスクリプト、軌跡行、および従来の軌跡サイドカーを保守します。
  ジョブごとに最新の 2000 行が自動的に保持される Cron 実行履歴は削除しません
  （[Cron の設定](/ja-JP/automation/cron-jobs#configuration)）。
- クリーンアップでは、参照されていない従来／アーカイブのトランスクリプト成果物、
  Compaction チェックポイント、および `session.maintenance.pruneAfter` より古い
  軌跡サイドカーも削除します。SQLite セッション行から引き続き参照されている
  成果物は保持されます。
- クリーンアップでは、短期間のみ存在する Gateway モデル実行プローブのクリーンアップが
  `modelRunPruned` として別途報告されます。これは
  `agent:*:explicit:model-run-<uuid>` の形式を持つ厳密で明示的なキーにのみ一致します。保持期間は固定の
  `24h` で、負荷条件によって制限されます。セッションエントリの
  メンテナンス／上限圧力に達した場合にのみ、古いプローブ行を削除します。実行される場合、
  モデル実行のクリーンアップは、グローバルな古いデータのクリーンアップおよび上限適用より先に
  行われます。

フラグ：

| フラグ                 | 説明                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 書き込みを行わずに、削除／上限適用されるエントリ数をプレビューします。テキストモードでは、セッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）と、セッションラベル別にグループ化された概要を出力します。                                                                                                       |
| `--enforce`          | `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。                                                                                                                                                                                                                                          |
| `--fix-missing`      | 通常であればまだ経過時間／件数による削除対象にならない場合でも、アーカイブ済みトランスクリプト成果物が存在しないか、ヘッダーのみ／空である従来のエントリを削除します。                                                                                                                                                             |
| `--fix-dm-scope`     | `session.dmScope` が `main` の場合、以前の `per-peer`、`per-channel-peer`、または `per-account-channel-peer` のルーティングによって残された、ピアキー形式の古い直接 DM 行を廃止します。最初に `--dry-run` を使用してください。適用すると、それらの行が SQLite から削除され、従来のトランスクリプト成果物は削除済みアーカイブとして保持されます。 |
| `--active-key <key>` | ディスク容量上限による退避から、特定のアクティブキーを保護します。グループセッションやスレッド単位のチャットセッションなど、永続的な外部会話ポインターも、経過時間／件数／ディスク容量上限のメンテナンスによって保持されます。                                                                                               |
| `--agent <id>`       | 設定済みの単一エージェントストアに対してクリーンアップを実行します。                                                                                                                                                                                                                                                                |
| `--all-agents`       | 設定済みのすべてのエージェントストアに対してクリーンアップを実行します。                                                                                                                                                                                                                                                               |
| `--store <path>`     | 特定の従来のストアセレクターパスに対して実行します。                                                                                                                                                                                                                                                         |
| `--json`             | JSON の概要を出力します。`--all-agents` を指定すると、出力にはストアごとの概要が含まれます。                                                                                                                                                                                                                          |

Gateway に到達可能な場合、設定済みエージェントストアに対するドライラン以外のクリーンアップは
Gateway を通じて送信され、ランタイムトラフィックと同じセッションストアライターを
共有します。従来のストアセレクターを明示的にオフライン修復する場合は、
`--store <path>` を使用してください。

`openclaw sessions cleanup --all-agents --dry-run --json`：

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

## セッションを圧縮する

停止状態または過大になったセッションのコンテキスト容量を回収します。`openclaw sessions
compact <key>` は `sessions.compact`
Gateway RPC の正式なラッパーであり、実行中の Gateway が必要です。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` を指定しない場合、Gateway の LLM がトランスクリプトを要約します。CLI は
  デフォルトではクライアント側の期限を設定せず、設定済みの
  Compaction ライフサイクルは Gateway が管理します。
- `--max-lines <n>` を指定すると、最後の `n` 行までトランスクリプトを切り詰め、
  以前のトランスクリプトを `.bak` サイドカーとしてアーカイブします。
- `--agent <id>`：セッションを所有するエージェント。`global` キーでは必須です。
- `--url`／`--token`／`--password`：Gateway 接続の上書き設定。
- `--timeout <ms>`：オプションのクライアント側 RPC タイムアウト（ミリ秒）。
- `--json`：未加工の RPC ペイロードを出力します。

Gateway が Compaction の失敗を報告した場合や到達不能な場合、コマンドはゼロ以外の終了コードで終了するため、Cron やスクリプトが何も実行されないサイレントな処理を成功と誤認することはありません。

<Note>
`openclaw agent --message '/compact ...'` は Compaction のパスでは**ありません**。CLI からのスラッシュコマンドは、許可された送信者のチェックによって拒否されます。その呼び出しは何も実行せずに終了するのではなく、ここを案内するガイダンスとともにゼロ以外の終了コードで終了します。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` は以下を受け付けます。

| フィールド      | 型        | 必須 | 説明                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | はい      | Compaction するセッションキー（例: `agent:main:main`）。    |
| `agentId`  | string      | いいえ       | セッションを所有するエージェント ID（`global` キーの場合）。        |
| `maxLines` | integer ≥ 1 | いいえ       | LLM による要約の代わりに、末尾の N 行までに切り詰めます。 |

LLM による要約レスポンスの例:

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

## 関連項目

- [セッション設定](/ja-JP/gateway/config-agents#session)
- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [CLI リファレンス](/ja-JP/cli)

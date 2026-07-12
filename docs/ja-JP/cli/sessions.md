---
read_when:
    - 保存されているセッションの一覧と最近のアクティビティを確認したい場合
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションと使用状況の一覧）'
title: セッション
x-i18n:
    generated_at: "2026-07-12T14:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存されている会話セッションを一覧表示します。

セッション一覧は、チャネルやプロバイダーの稼働確認ではありません。セッションストアに永続化された
会話行を表示します。通信のない Discord、Slack、Telegram、または
その他のチャネルは、メッセージが処理されて新しいセッション行が作成される前でも、
正常に再接続できます。チャネルの接続状態をリアルタイムで確認する必要がある場合は、
`openclaw channels status --probe`、`openclaw status --deep`、または
`openclaw health --verbose` を使用してください。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

フラグ:

| フラグ                 | 説明                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | 構成済みのエージェントストアを1つ指定します（デフォルト: 構成済みのデフォルトエージェント）。        |
| `--all-agents`       | 構成済みのすべてのエージェントストアを集約します。                                 |
| `--store <path>`     | 明示的なストアパスを指定します（`--agent` または `--all-agents` と併用不可）。 |
| `--active <minutes>` | 過去 N 分以内に更新されたセッションのみを表示します。                  |
| `--limit <n\|all>`   | 出力する最大行数（デフォルトは `100`。`all` で全件出力に戻します）。        |
| `--json`             | 機械可読形式で出力します。                                               |
| `--verbose`          | 詳細なログを出力します。                                                       |

`openclaw sessions` と Gateway の `sessions.list` RPC は、大規模で長期間使用される
ストアが CLI プロセスや Gateway のイベントループを占有しないよう、デフォルトで
件数が制限されています。CLI はデフォルトで最新の100セッションを返します。より小さい、または
大きい範囲には `--limit <n>` を指定し、意図的にストア全体が必要な場合は
`--limit all` を指定してください。JSON レスポンスには、呼び出し元が追加の行の存在を
示せるように、`totalCount`、`limitApplied`、`hasMore` が含まれます。

RPC クライアントは `configuredAgentsOnly: true` を渡すことで、広範な統合
検出ソースを維持しつつ、現在構成に存在するエージェントの行のみを返せます。
Control UI はデフォルトでこのモードを使用するため、削除済みまたはディスク上にのみ存在するエージェントストアが
Sessions ビューに再表示されることはありません。

`--all-agents` は構成済みのエージェントストアを読み取ります。Gateway と ACP のセッション
検出はより広範で、構成済みのエージェントルートまたはテンプレート化された `session.store`
ルートから解決された SQLite ストアも含まれます。従来のセレクターパスは
エージェントルート内に解決される必要があり、シンボリックリンクとルート外のパスは
スキップされます。

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## 軌跡の進捗を追跡する

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` は、最近のランタイム軌跡イベントを簡潔な
進捗行として表示します。`--session-key` を指定しない場合、まず実行中のセッションを追跡し、その後
保存されている最新のセッションを追跡します。`--tail <count>` は、追跡モードの開始前に出力する
既存イベントの数を制御します。デフォルトは `80` で、`0` を指定すると現在の末尾から開始します。
`--follow` は、選択した SQLite ベースのセッション、または明示的に指定した
従来の軌跡ファイルを継続して監視します。

進捗ビューは意図的に控えめな表示になっています。プロンプトテキスト、ツール引数、
ツール結果の本文は出力されません。ツール呼び出しはツール名と
`{...redacted...}` を表示し、ツール結果は `ok`、`error`、`done` などのステータスを表示し、
モデル完了行はプロバイダー、モデル、終了ステータスを表示します。

## 軌跡バンドルをエクスポートする

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が実行リクエストを承認した後に `/export-trajectory` スラッシュコマンドが
使用するコマンドパスです。出力ディレクトリは、選択したワークスペース配下の
`.openclaw/trajectory-exports/` 内に必ず解決されます。

## クリーンアップメンテナンス

次の書き込みサイクルを待たずに、今すぐメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は、構成の `session.maintenance` 設定
（[構成リファレンス](/ja-JP/gateway/config-agents#session)）を使用します。

- 対象範囲に関する注記: `openclaw sessions cleanup` は、セッションストア、
  トランスクリプト、軌跡行、従来の軌跡サイドカーをメンテナンスします。
  `cron.runLog.keepLines` で管理される Cron 実行履歴は削除しません
  （[Cron の構成](/ja-JP/automation/cron-jobs#configuration)）。
- クリーンアップでは、参照されていない従来形式またはアーカイブ済みのトランスクリプト成果物、
  Compaction チェックポイント、および `session.maintenance.pruneAfter` より古い
  軌跡サイドカーも削除します。SQLite のセッション行から引き続き参照されている成果物は
  保持されます。
- クリーンアップでは、短期間のみ存在する Gateway モデル実行プローブのクリーンアップを
  `modelRunPruned` として個別に報告します。これは、
  `agent:*:explicit:model-run-<uuid>` 形式の厳密かつ明示的なキーにのみ一致します。保持期間は固定で
  `24h` であり、負荷条件に基づいて実行されます。セッションエントリの
  メンテナンスまたは上限制約が発生した場合にのみ、古いプローブ行を削除します。実行時には、
  モデル実行のクリーンアップがグローバルな古いデータのクリーンアップと上限適用より先に
  行われます。

フラグ:

| フラグ                 | 説明                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 書き込みを行わず、削除または上限適用されるエントリ数をプレビューします。テキストモードでは、セッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）と、セッションラベル別にグループ化した概要を出力します。                                                                                                       |
| `--enforce`          | `session.maintenance.mode` が `warn` の場合でもメンテナンスを適用します。                                                                                                                                                                                                                                          |
| `--fix-missing`      | アーカイブ済みトランスクリプト成果物が欠落しているか、ヘッダーのみまたは空である従来のエントリを、通常の経過時間や件数による削除対象でなくても削除します。                                                                                                                                                             |
| `--fix-dm-scope`     | `session.dmScope` が `main` の場合、以前の `per-peer`、`per-channel-peer`、または `per-account-channel-peer` ルーティングによって残された、古いピアキー形式のダイレクト DM 行を廃止します。最初に `--dry-run` を使用してください。適用すると、それらの行を SQLite から削除し、従来のトランスクリプト成果物を削除済みアーカイブとして保持します。 |
| `--active-key <key>` | 特定のアクティブキーをディスク容量上限による退避から保護します。グループセッションやスレッド単位のチャットセッションなど、永続的な外部会話ポインターも、経過時間、件数、ディスク容量上限に基づくメンテナンスで保持されます。                                                                                               |
| `--agent <id>`       | 構成済みのエージェントストアを1つ指定してクリーンアップを実行します。                                                                                                                                                                                                                                                                |
| `--all-agents`       | 構成済みのすべてのエージェントストアに対してクリーンアップを実行します。                                                                                                                                                                                                                                                               |
| `--store <path>`     | 特定の従来ストアのセレクターパスに対して実行します。                                                                                                                                                                                                                                                         |
| `--json`             | JSON 形式の概要を出力します。`--all-agents` を指定した場合、ストアごとの概要が1つずつ出力されます。                                                                                                                                                                                                                          |

Gateway に到達できる場合、構成済みエージェントストアに対するドライラン以外のクリーンアップは
Gateway を経由して送信され、ランタイムトラフィックと同じセッションストアライターを
共有します。従来ストアのセレクターを明示的にオフライン修復する場合は、
`--store <path>` を使用してください。

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

## セッションを圧縮する

停止状態または過大になったセッションのコンテキスト容量を回収します。`openclaw sessions
compact <key>` は、`sessions.compact` Gateway RPC の正式なラッパーであり、
実行中の Gateway が必要です。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` を指定しない場合、Gateway の LLM がトランスクリプトを要約します。CLI は
  デフォルトではクライアント側の期限を設定せず、Gateway が構成済みの
  Compaction ライフサイクルを管理します。
- `--max-lines <n>` を指定すると、トランスクリプトを末尾の `n` 行に切り詰め、
  以前のトランスクリプトを `.bak` サイドカーとしてアーカイブします。
- `--agent <id>`: セッションを所有するエージェント。`global` キーでは必須です。
- `--url` / `--token` / `--password`: Gateway 接続のオーバーライド。
- `--timeout <ms>`: オプションのクライアント側 RPC タイムアウト（ミリ秒）。
- `--json`: 生の RPC ペイロードを出力します。

Gateway が Compaction の失敗を報告した場合や Gateway に到達できない場合、
コマンドはゼロ以外の終了コードで終了します。そのため、Cron やスクリプトが
何も行われなかった状態を誤って成功と判断することはありません。

<Note>
`openclaw agent --message '/compact ...'` は Compaction の実行経路では**ありません**。CLI からの
スラッシュコマンドは、承認済み送信者チェックによって拒否されます。この呼び出しは、
何もせず暗黙に終了するのではなく、ここを参照する案内とともにゼロ以外の終了コードで
終了します。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` は以下を受け付けます。

| フィールド | 型 | 必須 | 説明 |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key` | string | はい | Compaction するセッションキー（例: `agent:main:main`）。 |
| `agentId` | string | いいえ | セッションを所有するエージェント ID（`global` キー用）。 |
| `maxLines` | integer ≥ 1 | いいえ | LLM による要約の代わりに、末尾の N 行までに切り詰めます。 |

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

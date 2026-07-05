---
read_when:
    - 保存済みセッションを一覧表示し、最近のアクティビティを確認したい場合
summary: '`openclaw sessions` の CLI リファレンス（保存済みセッションの一覧と使用方法）'
title: セッション
x-i18n:
    generated_at: "2026-07-05T11:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 849a7576557574cf1a48b17e1d4f444605afed09c675177cf12cf18f91a355b3
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

保存済みの会話セッションを一覧表示します。

セッション一覧はチャネル/プロバイダーの生存確認ではありません。セッションストアに永続化された
会話行を表示します。静かな Discord、Slack、Telegram、または
その他のチャネルは、メッセージが処理されるまで新しいセッション行を
作成せずに正常に再接続できます。ライブの
チャネル接続性が必要な場合は、`openclaw channels status --probe`、
`openclaw status --deep`、または `openclaw health --verbose` を使用します。

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

| フラグ               | 説明                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | 設定済みのエージェントストア 1 つ（デフォルト: 設定済みのデフォルトエージェント）。 |
| `--all-agents`       | すべての設定済みエージェントストアを集約します。                       |
| `--store <path>`     | 明示的なストアパス（`--agent` または `--all-agents` と併用不可）。      |
| `--active <minutes>` | 過去 N 分以内に更新されたセッションのみを表示します。                  |
| `--limit <n\|all>`   | 出力する最大行数（デフォルト `100`; `all` で完全な出力に戻します）。   |
| `--json`             | 機械可読な出力。                                                       |
| `--verbose`          | 詳細ログ。                                                             |

`openclaw sessions` と Gateway `sessions.list` RPC はデフォルトで上限があるため、
大規模で長寿命のストアが CLI プロセスや Gateway イベント
ループを占有することはありません。CLI はデフォルトで最新の 100 セッションを返します。
より小さい/大きい範囲には `--limit <n>` を渡し、意図的に
ストア全体が必要な場合は `--limit all` を渡します。JSON レスポンスには、呼び出し元が
さらに行が存在することを示す必要がある場合に備えて、`totalCount`、`limitApplied`、`hasMore`
が含まれます。

RPC クライアントは、広範な結合
検出ソースを維持しつつ、現在設定に存在するエージェントの行のみを返すために `configuredAgentsOnly: true` を渡せます。
Control UI はデフォルトでこのモードを使用するため、削除済みまたはディスクのみのエージェントストアが
Sessions ビューに再表示されません。

`--all-agents` は設定済みエージェントストアを読み取ります。Gateway と ACP セッション
検出はより広範です。デフォルトの `agents/` ルートまたはテンプレート化された `session.store` ルートの下で見つかった
ディスクのみのストアも含みます。検出された
ストアはエージェントルート内の通常の `sessions.json` ファイルに解決される必要があり、
シンボリックリンクとルート外パスはスキップされます。

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.5" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## 末尾の軌跡進行状況

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` は、最近の軌跡 JSONL イベントをコンパクトな
進行状況行として描画します。`--session-key` がない場合、まず実行中のセッションを追跡し、その後
最新の保存済みセッションを追跡します。`--tail <count>` は follow モードの前に
既存イベントを何件出力するかを制御します。デフォルトは `80` で、`0` は現在の末尾から開始します。
`--follow` は、`<session>.trajectory-path.json` によって参照される移動済み
ファイルを含め、選択された軌跡ファイルの監視を続けます。

進行状況ビューは意図的に保守的です。プロンプトテキスト、ツール引数、
ツール結果本文は出力されません。ツール呼び出しはツール名を
`{...redacted...}` とともに表示します。ツール結果は `ok`、`error`、`done` などのステータスを表示します。
モデル完了行はプロバイダー/モデルと終了ステータスを表示します。

## 軌跡バンドルをエクスポート

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

これは、所有者が exec リクエストを承認した後に `/export-trajectory` スラッシュコマンドで使用される
コマンドパスです。出力ディレクトリは常に、選択されたワークスペース配下の
`.openclaw/trajectory-exports/` 内に解決されます。

## クリーンアップ保守

次の書き込みサイクルを待たずに、今すぐ保守を実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` は、設定の `session.maintenance` 設定を使用します
（[設定リファレンス](/ja-JP/gateway/config-agents#session)）。

- スコープ注記: `openclaw sessions cleanup` はセッションストア、
  トランスクリプト、軌跡サイドカーを保守します。cron 実行履歴は刈り込みません。
  これは `cron.runLog.keepLines`
  （[Cron 設定](/ja-JP/automation/cron-jobs#configuration)）で管理されます。
- クリーンアップは、`session.maintenance.pruneAfter` より古い未参照のプライマリトランスクリプト、compaction
  チェックポイント、軌跡サイドカーも刈り込みます。
  `sessions.json` からまだ参照されているファイルは保持されます。
- クリーンアップは、短命の Gateway モデル実行プローブのクリーンアップを
  `modelRunPruned` として別途報告します。これは
  `agent:*:explicit:model-run-<uuid>` の形をした厳密で明示的なキーにのみ一致します。保持期間は固定の `24h` で、
  プレッシャーゲート付きです。セッションエントリ
  保守/上限プレッシャーに達した場合にのみ、古いプローブ行を削除します。実行時、モデル実行クリーンアップは
  グローバルな古い行のクリーンアップと上限制御の前に行われます。

フラグ:

| フラグ               | 説明                                                                                                                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 書き込みなしで、刈り込み/上限制御されるエントリ数をプレビューします。テキストモードでは、セッションごとのアクション表（`Action`、`Key`、`Age`、`Model`、`Flags`）と、セッションラベル別にグループ化されたサマリーを出力します。 |
| `--enforce`          | `session.maintenance.mode` が `warn` の場合でも保守を適用します。                                                                                                                                                                                                                                  |
| `--fix-missing`      | トランスクリプトファイルが見つからない、またはヘッダーのみ/空のエントリを、通常はまだ期限/件数超過の対象にならない場合でも削除します。                                                                                                                                                         |
| `--fix-dm-scope`     | `session.dmScope` が `main` の場合、以前の `per-peer`、`per-channel-peer`、または `per-account-channel-peer` ルーティングによって残された古いピアキー付き直接 DM 行を廃止します。最初に `--dry-run` を使用してください。適用すると、それらの行は `sessions.json` から削除され、トランスクリプトは削除済みアーカイブとして保持されます。 |
| `--active-key <key>` | 特定のアクティブキーをディスク予算エビクションから保護します。グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターも、期限/件数/ディスク予算保守によって保持されます。                                                        |
| `--agent <id>`       | 設定済みエージェントストア 1 つに対してクリーンアップを実行します。                                                                                                                                                                                                                                |
| `--all-agents`       | すべての設定済みエージェントストアに対してクリーンアップを実行します。                                                                                                                                                                                                                              |
| `--store <path>`     | 特定の `sessions.json` ファイルに対して実行します。                                                                                                                                                                                                                                                |
| `--json`             | JSON サマリーを出力します。`--all-agents` の場合、出力にはストアごとのサマリーが 1 つ含まれます。                                                                                                                                                                                                  |

Gateway に到達できる場合、設定済みエージェントストアに対する非 dry-run クリーンアップは
Gateway 経由で送信されるため、実行時トラフィックと同じセッションストアライターを共有します。
ストアファイルの明示的なオフライン修復には `--store <path>` を使用します。

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

## セッションをコンパクト化

詰まった、または肥大化したセッションのコンテキスト予算を回収します。`openclaw sessions
compact <key>` は `sessions.compact`
Gateway RPC の第一級ラッパーであり、実行中の Gateway が必要です。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` がない場合、Gateway は LLM でトランスクリプトを要約します。CLI
  はデフォルトでクライアント期限を課しません。Gateway が
  設定済みの Compaction ライフサイクルを所有します。
- `--max-lines <n>` がある場合、最後の `n` トランスクリプト行に切り詰め、
  以前のトランスクリプトを `.bak` サイドカーとしてアーカイブします。
- `--agent <id>`: セッションを所有するエージェント。`global` キーでは必須です。
- `--url` / `--token` / `--password`: Gateway 接続のオーバーライド。
- `--timeout <ms>`: 任意のクライアント側 RPC タイムアウト（ミリ秒）。
- `--json`: 生の RPC ペイロードを出力します。

Gateway が Compaction の失敗を報告した場合、または到達不能な場合、コマンドは非ゼロで終了するため、
cron やスクリプトが無言の no-op を成功と誤認することはありません。

<Note>
`openclaw agent --message '/compact ...'` は **Compaction** パスではありません。CLI からのスラッシュ
コマンドは authorized-sender チェックによって拒否されます。その
呼び出しは、無言で no-op するのではなく、ここを指すガイダンスとともに非ゼロで終了します。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` は次を受け付けます。

| フィールド | 型          | 必須 | 説明                                                       |
| ---------- | ----------- | ---- | ---------------------------------------------------------- |
| `key`      | 文字列      | はい | Compaction するセッションキー（例: `agent:main:main`）。    |
| `agentId`  | 文字列      | いいえ | セッションを所有するエージェント ID（`global` キー用）。 |
| `maxLines` | 整数 ≥ 1    | いいえ | LLM 要約の代わりに最後の N 行へ切り詰めます。 |

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

- [セッション設定](/ja-JP/gateway/config-agents#session)
- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [CLI リファレンス](/ja-JP/cli)

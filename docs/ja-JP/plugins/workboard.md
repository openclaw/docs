---
read_when:
    - Control UI に Kanban スタイルのワークボードが必要です
    - バンドルされた Workboard Plugin を有効化または無効化しています
    - 外部のプロジェクト管理ツールなしで、計画済みのエージェント作業を追跡したい
summary: エージェント所有カードとセッション引き継ぎ用の任意のダッシュボードワークボード
title: Workboard Plugin
x-i18n:
    generated_at: "2026-07-05T11:42:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70ac13ef747af38e49eb49866a9bae7a06f53b8b0b5765f47d0d0cfd2d7b4bc1
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Pluginは、[Control UI](/ja-JP/web/control-ui) に任意のKanban形式のボードを追加します。エージェント向けサイズの作業カード、エージェントへの割り当て、カードのタスク、実行、ダッシュボードセッションへ戻るリンクを提供します。

Workboardは意図的に小さく保たれています。1つのOpenClaw Gatewayのローカル運用作業を追跡します。GitHub Issues、Linear、Jira、その他のチーム向けプロジェクト管理システムの代替ではありません。

## 有効化

Workboardはバンドルされていますが、デフォルトでは無効です。

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

Workboardタブがダッシュボードのナビゲーションに表示されます。タブが表示されていてもPluginが無効、または `plugins.allow`/`plugins.deny` によってブロックされている場合、タブにはカードデータの代わりにPluginが利用不可である状態が表示されます。

## 設定

WorkboardにはPlugin固有の設定はありません。標準のPluginエントリで有効化または無効化します。

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## カードフィールド

| フィールド | 値 |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status` | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done` |
| `priority` | `low`, `normal`, `high`, `urgent` |
| `labels` | 自由形式の文字列 |
| `agentId` | 任意の割り当て済みエージェント |
| リンクされた参照 | 任意のタスク、実行、セッション、またはソースURL |
| `execution` | カードから開始されたCodex/Claude実行の任意のメタデータ（エンジン、モード、モデル、セッション、実行ID、ステータス） |

カードには、試行、コメント、リンク、証跡、アーティファクト、自動化設定、添付、ワーカーログ、ワーカープロトコル状態、クレーム、診断、通知、テンプレートID、アーカイブ状態、古いセッションの検出に関するコンパクトなメタデータに加えて、最近のイベント一覧（`created`, `edited`, `moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`, `execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`, `link_added`, `proof_added`, `artifact_added`, `attachment_added`, `diagnostic`, `notification`, `dispatch`, `orchestration`, `protocol_violation`, `archived`, `unarchived`, `stale`）も保持します。このメタデータにより、オペレーターはリンクされたセッションを開かなくても、カードがボード上をどのように移動したかを確認できます。これはローカル運用コンテキストであり、セッショントランスクリプトやGitHub Issue履歴の代替ではありません。

カードはPlugin自身のGateway状態に保存され、そのGatewayの他のOpenClaw状態と一緒に移動します（[ストレージ](#storage) を参照）。

## カードから作業を開始する

リンクされていないカードから直接作業を開始できます。

- **Codexを実行** / **Claudeを実行** は、明示的なエンジンでタスク追跡付きエージェント実行を開始し、カードのプロンプトを送信して、カードを `running` にします。Codexの実行では `openai/gpt-5.5` を使用し、Claudeの実行では `anthropic/claude-sonnet-4-6` を使用します。
- **Codexを開く** / **Claudeを開く** は、カードのプロンプトを送信したりカードを移動したりせずに、リンクされたダッシュボードセッションを作成します。ボードに紐づいたままの手動作業に使用します。

自律的な開始では、Gatewayのタスク追跡付きエージェント実行パス（Codex/Claudeが明示的に選択されない限り、デフォルトのエージェントとモデル）を使用します。その後、Workboardは結果のタスク、実行ID、セッションキーをカードへリンクします。リンクされた各実行は、試行サマリー（エンジン、モード、モデル、実行ID、タイムスタンプ、ステータス、累積失敗回数）も記録するため、繰り返し発生する失敗が見える状態に保たれます。

ダッシュボードは、Gatewayタスク台帳からタスクステータスを更新し、タスクID、実行ID、またはリンクされたセッションキーによってタスクをカードに照合します。キュー済みまたは実行中のタスクはカードのライフサイクルをアクティブに保ちます。完了、失敗、タイムアウト、またはキャンセルされたタスクは、リンクされたセッションと同じ同期ルールを使用して、カードを `review` または `blocked` へ進めます（[セッションライフサイクル同期](#session-lifecycle-sync) を参照）。

## エージェントツール

| ツール | 目的 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list` | クレーム/診断状態を含むコンパクトなカードを一覧表示します。任意のボードフィルターを指定できます。 |
| `workboard_read` | 1枚のカードに加え、範囲を限定したワーカーコンテキスト（メモ、試行、コメント、リンク、証跡、アーティファクト、親の結果、最近の担当者作業、アクティブな診断）を返します。 |
| `workboard_create` | 任意の親、テナント、Skills、ボード、ワークスペースメタデータ、冪等性キー、実行時間制限、再試行予算を含むカードを作成します。 |
| `workboard_link` | 親を子カードにリンクします。子はすべての親が `done` に到達するまで `todo` のままになり、その後ディスパッチ昇格によって `ready` に移動します。 |
| `workboard_claim` | 呼び出し元エージェント用にカードをクレームします。`backlog`/`todo`/`ready` を `running` に移動します。 |
| `workboard_heartbeat` | 長時間の実行中にクレームのHeartbeatを更新します。 |
| `workboard_release` | 完了、一時停止、または引き継ぎ後にクレームを解放します。カードを次のステータスへ移動できます。 |
| `workboard_complete` / `workboard_block` | 最終サマリー、証跡、アーティファクト、作成カードマニフェスト（完了カードへリンクし返されたカードを参照する必要があります）、またはブロッカー理由のための構造化ライフサイクルツールです。 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete` | 小さなカード添付をPlugin SQLite状態に保存し、カードにインデックスして、ワーカーコンテキストに公開します。 |
| `workboard_worker_log` / `workboard_protocol_violation` | ワーカーログ行を記録し、自動ワーカーが `workboard_complete`/`workboard_block` を呼び出さずに停止した場合にカードをブロックします。 |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete` | 永続化されたボードメタデータ（表示名、説明、アーカイブ状態、デフォルトワークスペース）を管理します。 |
| `workboard_runs` | カードに対する永続化された実行試行履歴を返します。 |
| `workboard_specify` | 粗いトリアージ/バックログカードを明確化された `todo` カードに変換し、仕様サマリーをカードに記録します。 |
| `workboard_decompose` | 親のオーケストレーションカードを、ボード/テナントメタデータを継承するリンク済みの子に展開します。作成カードマニフェストを使って親を完了できます。 |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 通知サブスクリプションを管理します。イベント読み取りはリプレイセーフです。`advance` は永続カーソルを進めるため、呼び出し元は完了/失敗/古いカードイベントを失ったり二重に読んだりすることなく再開できます。 |
| `workboard_boards` / `workboard_stats` | ボード名前空間とキュー統計を調べます。 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim` | 停滞した作業を復旧または引き継ぎます。 |
| `workboard_comment` / `workboard_proof` | 引き継ぎメモを追加するか、証跡/アーティファクト参照を添付します。 |
| `workboard_unblock` | ブロックされた作業を `todo` に戻します。 |
| `workboard_dispatch` | 依存関係の昇格または古いクレームのクリーンアップを促します。 |

claim 済みカードは、呼び出し元が `workboard_claim` から返された claim token を保持していない限り、他のエージェントからの agent-tool mutation を拒否します。agent tool または Gateway RPC 呼び出しから返されるすべてのカードでは `metadata.claim.token` が `[redacted]` にマスクされます（トークン自体は `workboard_claim` からのみ、一度だけトップレベルで返されます）。そのため、ダッシュボードのオペレーターや他のエージェントは、利用可能なトークンを見ることなく claim 状態を確認できます。復旧は `workboard_promote`/`workboard_reassign`/`workboard_reclaim` を通じて行い、これらはトークンを必要としません。

## ディスパッチ

ディスパッチは Gateway ローカルです。任意の OS プロセスは起動しません。通常の OpenClaw サブエージェントセッションが引き続き実行を所有します。1 回のディスパッチパスでは次を行います。

1. 依存関係が ready になったカードを昇格します。
2. ready カードにディスパッチ metadata を記録します。
3. 期限切れの claim またはタイムアウトした run をブロックします。
4. ボード設定済みの triage カードをオーケストレーション候補としてマークします。
5. ready カードの小さなバッチを claim し、Gateway サブエージェントランタイムを通じて worker run を開始します。

worker は、境界付けられたカードコンテキストと、Workboard ツールを通じてカードの heartbeat、完了、またはブロックに必要な claim token を受け取ります。

### worker の選択

各パスは **デフォルトで最大 3 worker** を開始します。ready カードは priority、position、creation time の順に並べられます。1 回のパスでは owner/agent ごとに 1 枚のカードだけを開始し、ボード上ですでに running または review の作業を持つ owner はスキップします。アーカイブ済みカード、アクティブな claim を持つカード、`ready` status ではないカードは worker 開始の対象になりません（ただし、ディスパッチのデータ側、つまり stale-claim cleanup、dependency promotion、timeout cleanup の影響は受けることがあります）。

session key は board/card ごとに決定論的です。そのため、繰り返しディスパッチしても無関係なセッションを作成するのではなく、同じ worker lane に戻ります。

- 割り当て済みカード: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未割り当てカード: `subagent:workboard-<boardId>-<cardId>`（Gateway が設定済みのデフォルト agent を解決します）

カードが claim された後に worker を開始できない場合、Workboard はカードをブロックし、claim をクリアし、run-start failure を記録し、worker log 行を追加します。これはダッシュボード、CLI JSON、agent tools、card diagnostics に表示されます。

### エントリポイント

- ダッシュボードのディスパッチアクション
- `openclaw workboard dispatch`
- command 対応チャネル上の `/workboard dispatch`

3 つすべては、Gateway が利用可能な場合に Gateway サブエージェントランタイムを使用します。CLI にはオペレーター用の fallback が 1 つあります。Gateway 呼び出しが connection/unavailable エラー（または古い Gateway の `unknown method` エラー）で失敗し、明示的な `--url`/`--token` target も、設定済み remote Gateway（`OPENCLAW_GATEWAY_URL` または `gateway.mode: remote`）も適用されない場合、CLI は local SQLite state に対して data-only dispatch を実行します。これにより依存関係の昇格、stale claim の cleanup、timed-out run のブロックはできますが、worker は開始できません。到達可能な Gateway からの auth、permission、validation failure は unavailable として扱われません。それらは command error として表面化し、明示的な `--url`/`--token` target が指定された場合の Gateway failure も同様です。

board metadata では `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee`、`orchestratorProfile` を設定できます。OpenClaw はこの intent を記録し、worker context で公開します。実際の specification/decomposition は引き続き通常の Workboard tools を通じて実行されます。

## CLI と slash command

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` のテキスト出力はデフォルトでアーカイブ済みカードを非表示にします（`--include-archived` で上書き）。`--json` は既存スクリプトで使われる full-card contract に合わせ、常にアーカイブ済みカードを含めます。`show` は曖昧でない id prefix を受け付けます。`list`、`create`、`show` は常に local plugin state を直接読み書きします。実行中の Gateway を呼び出すのは `dispatch` だけで、上記の fallback を使用します。

すべての flags、JSON 出力、Gateway fallback behavior、id-prefix handling、dispatch selection rules、troubleshooting については [Workboard CLI](/ja-JP/cli/workboard) を参照してください。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、`/workboard dispatch` は CLI を反映します。List と show は、権限のある任意の command sender 向けの read operation です。Create と dispatch には、chat surface 上では owner status、または `operator.write`/`operator.admin` を持つ Gateway client が必要です。

## セッション lifecycle sync

カードは既存のダッシュボードセッション、またはカードから作業を開始したときに作成されるセッションにリンクできます。リンクされたカードは、session lifecycle を inline で表示します: running、stale、linked idle、done、failed、missing。Sessions タブから **Add to Workboard** で既存セッションを capture することもできます。カードはそのセッションにリンクし、session label または直近の user prompt を title として使用し、利用可能な場合は直近の user prompt と最新の assistant response から notes を初期化します。

リンク先セッションが見つからなくなった場合でも、カードは context のためにリンクされたままになり、新しいセッションへ restart する start control も引き続き提供します。アクティブなリンク済みセッションが最近の活動を報告しなくなった場合、Workboard はカードを `stale` としてマークし、lifecycle が解消するまでそれを metadata として保存します。

カードが active work state にある間、Workboard はリンク済みセッションに追従します。

| リンク済みセッション state            | カード status |
| ------------------------------------- | ----------- |
| active                                | `running`   |
| completed                             | `review`    |
| failed、killed、timed out、または aborted | `blocked`   |

**手動 review state が優先されます。** カードを `review`、`blocked`、`done` に移動すると、そのカードを `todo` または `running` に戻すまで auto-sync は停止します。

カードの開始には通常の Gateway session を使用します。Workboard は card metadata と link だけを保存します。conversation transcript、model selection、run lifecycle は通常の session system が所有し続けます。live linked card で **Stop** を使用すると、active run を abort できます。Workboard はそのカードを `blocked` としてマークし、follow-up 用に表示されたままにします。

新しいカードは Workboard template（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）から開始できます。template は title、notes、labels、priority を事前入力します。template id は card metadata として保存されます。

## ダッシュボード workflow

1. Control UI で Workboard タブを開きます。
2. title、notes、priority、labels、任意の agent、任意の linked session を指定してカードを作成します。または Sessions を開き、既存セッションに対して **Add to Workboard** を選択します。
3. カードを列間でドラッグするか、compact status control に focus して menu または ArrowLeft/ArrowRight を使用します。
4. カードから作業を開始し、ダッシュボードセッションを作成または再利用します。
5. agent が作業している間、カードからリンク済みセッションを開きます。
6. lifecycle sync によって running work が `review`/`blocked` に移動した後、受け入れたらカードを手動で `done` に移動します。

## Diagnostics

Diagnostics は local card metadata から計算されます。組み込み check は次を flag します。

| 種類                        | 条件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 1 時間以上更新されていない、割り当て済みの `todo`/`backlog`/`ready` カード。             |
| `running_without_heartbeat` | 20 分以上 claim heartbeat または execution update がない `running` カード。 |
| `blocked_too_long`          | 24 時間以上更新されていない `blocked` カード。                                   |
| `repeated_failures`         | カードの tracked failure count が 2 以上に達した。                                |
| `missing_proof`             | proof、artifact、attachment がない `done` カード。                          |
| `orphaned_session`          | `sessionKey` はあるが `execution` metadata がない `running` カード。                |

## Permissions

Gateway RPC methods は `workboard.*` 配下にあります。

| Scope            | Methods                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、attachment list/get、notification event reads、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、attachment add/delete、worker log、protocol violation、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、notification subscribe/delete/advance |

`operator.admin` を必要とする RPC method はありません。read-only operator access で接続されたブラウザーは board を inspect できますが、カードを変更することはできません。

## Storage

Workboard は、OpenClaw state directory 配下の plugin-owned relational SQLite database に durable data を保存します。boards、cards、labels、lifecycle events、run attempts、comments、dependency links、proof、artifact references、attachment metadata and blobs、diagnostics、notifications、worker logs、protocol state、subscriptions はすべて Workboard tables に保存されます（plugin key-value entries ではありません）。card export は、attachment blob contents を inline 化せずに board narrative を保持します。

`.28` release で Workboard を使用していた installation は、`openclaw doctor --fix` を実行して、shipped legacy plugin-state namespace（`workboard.cards`、`workboard.boards`、`workboard.notify`、存在する場合は `workboard.attachments`）を relational database に migrate できます。

## Troubleshooting

**タブに Workboard is unavailable と表示される**

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` が設定されている場合は、そこに `workboard` を追加します。`plugins.deny` に `workboard` が含まれている場合は、Plugin を有効化する前に削除します。

**カードが保存されない**

browser connection に `operator.write` access があることを確認します。read-only operator session はカードを list できますが、create、edit、move、delete はできません。

**カードを開始しても期待したセッションが開かない**

カードの agent id と linked session を確認し、Sessions または Chat を開いて実際の run state を inspect します。

**ディスパッチで worker が開始されない**

active claim のない `ready` カードが少なくとも 1 枚あることを確認します。

```bash
openclaw workboard list --status ready
```

CLI が data-only dispatch を報告する場合は、Gateway を開始または再起動して再試行します。data-only dispatch は local board state を更新しますが、subagent worker runs は開始できません。同じ owner または agent の別カードがすでに running または review 待ちの場合も、カードがスキップされることがあります。同じ owner にさらに dispatch する前に、その active work を complete、block、または release してください。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Workboard CLI](/ja-JP/cli/workboard)
- [Plugins](/ja-JP/tools/plugin)
- [Plugin を管理する](/ja-JP/plugins/manage-plugins)
- [Sessions](/ja-JP/concepts/session)

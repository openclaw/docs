---
read_when:
    - Control UI に Kanban スタイルの作業ボードが必要である
    - バンドルされた Workboard plugin を有効化または無効化しています
    - 外部のプロジェクトマネージャーなしで計画済みのエージェント作業を追跡したい
summary: エージェント所有のカードとセッション引き継ぎ用の任意のダッシュボード作業ボード
title: Workboard Plugin
x-i18n:
    generated_at: "2026-07-06T21:52:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e76d9f64d6117b1a9486270e385d79334a11b2658853473beaf9fb23f8327b00
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard プラグインは、オプションのカンバン形式ボードを
[Control UI](/ja-JP/web/control-ui) に追加します。エージェントサイズの作業カード、エージェントへの割り当て、
カードのタスク、実行、ダッシュボードセッションへのリンクを提供します。

Workboard は意図的に小さく作られています。1つの
OpenClaw Gateway のローカル運用作業を追跡します。GitHub Issues、Linear、Jira、その他の
チーム向けプロジェクト管理システムの代替ではありません。

## 有効化

Workboard はバンドルされていますが、デフォルトでは無効です。

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

プラグインを有効にすると、Workboard タブがダッシュボードのナビゲーションに表示されます。
無効な間は、タブはナビゲーションから非表示のままです。プラグインが無効、または
`plugins.allow`/`plugins.deny` によってブロックされている状態で
`/workboard` ルートを直接開くと、カードデータではなく
プラグイン利用不可の状態が表示されます。

## 設定

Workboard にはプラグイン固有の設定はありません。標準の
プラグインエントリで有効化/無効化します。

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

| フィールド  | 値                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | 自由形式の文字列                                                                                              |
| `agentId`   | 任意の割り当て先エージェント                                                                                  |
| linked refs | 任意のタスク、実行、セッション、またはソース URL                                                              |
| `execution` | カードから開始された Codex/Claude 実行の任意メタデータ（エンジン、モード、モデル、セッション、実行 ID、状態） |

カードには、試行、コメント、リンク、証跡、
アーティファクト、自動化設定、添付ファイル、ワーカーログ、ワーカープロトコル
状態、クレーム、診断、通知、テンプレート ID、アーカイブ状態、
古いセッションの検出に関するコンパクトなメタデータと、最近のイベント一覧（`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`）も保持されます。このメタデータにより、
オペレーターはリンクされたセッションを開かなくても、カードがボード内をどのように移動したかを確認できます。
これはローカルの運用コンテキストであり、セッションの文字起こしや GitHub Issue 履歴の代替ではありません。

カードはプラグイン自身の Gateway 状態に保存され、その
Gateway の他の OpenClaw 状態と一緒に移動します（[ストレージ](#storage)を参照）。

## カードから作業を開始する

リンクされていないカードは、直接作業を開始できます。

- **Run Codex** / **Run Claude** は、明示的なエンジンでタスク追跡付きエージェント実行を開始し、
  カードのプロンプトを送信し、カードを `running` にします。Codex
  実行は `openai/gpt-5.5` を使用し、Claude 実行は `anthropic/claude-sonnet-4-6` を使用します。
- **Open Codex** / **Open Claude** は、カードのプロンプトを送信したり
  カードを移動したりせずに、リンクされたダッシュボードセッションを作成します。ボードに紐づいたまま行う
  手動作業向けです。

自律開始では、Gateway のタスク追跡付きエージェント実行パスを使用します（Codex/Claude を明示的に選択しない限り、
デフォルトのエージェントとモデル）。その後、Workboard は
結果のタスク、実行 ID、セッションキーをカードへリンクします。リンクされた各
実行は、試行サマリー（エンジン、モード、モデル、実行 ID、
タイムスタンプ、状態、ローリング失敗回数）も記録するため、繰り返しの失敗が可視化されたままになります。

ダッシュボードは Gateway タスク台帳からタスク状態を更新し、
タスク ID、実行 ID、またはリンクされたセッションキーでタスクをカードに照合します。キュー中/実行中の
タスクはカードのライフサイクルをアクティブに保ちます。完了、失敗、タイムアウト、または
キャンセルされたタスクは、リンクされたセッションと同じ同期
ルールを使用してカードを `review` または `blocked` に進めます（[セッションライフサイクル同期](#session-lifecycle-sync)を参照）。

## エージェントツール

| ツール                                                                                                                                           | 目的                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | クレーム/診断状態を含むコンパクトなカードを一覧表示します。任意のボードフィルターを指定できます。                                                                                        |
| `workboard_read`                                                                                                                                 | 1つのカードと、範囲を制限したワーカーコンテキスト（ノート、試行、コメント、リンク、証跡、アーティファクト、親の結果、最近の担当者作業、アクティブな診断）を返します。                   |
| `workboard_create`                                                                                                                               | 任意の親、テナント、Skills、ボード、ワークスペースメタデータ、冪等性キー、実行時間上限、再試行予算を指定してカードを作成します。                                                         |
| `workboard_link`                                                                                                                                 | 親を子カードにリンクします。すべての親が `done` になるまで子は `todo` のままで、その後ディスパッチ昇格により `ready` へ移動します。                                                      |
| `workboard_claim`                                                                                                                                | 呼び出し元エージェントがカードをクレームします。`backlog`/`todo`/`ready` を `running` に移動します。                                                                                     |
| `workboard_heartbeat`                                                                                                                            | 長時間の実行中にクレームの Heartbeat を更新します。                                                                                                                                       |
| `workboard_release`                                                                                                                              | 完了、一時停止、または引き継ぎ後にクレームを解放します。カードを次の状態へ移動することもできます。                                                                                       |
| `workboard_complete` / `workboard_block`                                                                                                         | 最終サマリー、証跡、アーティファクト、作成カードのマニフェスト（完了したカードにリンクし戻されたカードを参照する必要があります）、またはブロッカー理由のための構造化ライフサイクルツールです。 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 小さなカード添付ファイルをプラグイン SQLite 状態に保存し、カード上でインデックス化し、ワーカーコンテキストに公開します。                                                                  |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | ワーカーログ行を記録し、自動ワーカーが `workboard_complete`/`workboard_block` を呼び出さずに停止した場合にカードをブロックします。                                                       |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 永続化されたボードメタデータ（表示名、説明、アーカイブ状態、デフォルトワークスペース）を管理します。                                                                                     |
| `workboard_runs`                                                                                                                                 | カードの永続化された実行試行履歴を返します。                                                                                                                                              |
| `workboard_specify`                                                                                                                              | 粗いトリアージ/バックログカードを明確化された `todo` カードに変換します。仕様サマリーをカードに記録します。                                                                              |
| `workboard_decompose`                                                                                                                            | 親のオーケストレーションカードを、ボード/テナントメタデータを継承したリンク済みの子に展開します。作成カードのマニフェストを使って親を完了できます。                                     |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 通知サブスクリプションを管理します。イベント読み取りはリプレイ安全です。`advance` は永続カーソルを進めるため、呼び出し元は完了/失敗/古いカードイベントを失ったり二重読み取りしたりせずに再開できます。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | ボード名前空間とキュー統計を確認します。                                                                                                                                                  |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 停滞した作業を復旧または引き継ぎます。                                                                                                                                                    |
| `workboard_comment` / `workboard_proof`                                                                                                          | 引き継ぎノートを追加するか、証跡/アーティファクト参照を添付します。                                                                                                                       |
| `workboard_unblock`                                                                                                                              | ブロックされた作業を `todo` に戻します。                                                                                                                                                  |
| `workboard_dispatch`                                                                                                                             | 依存関係の昇格または古いクレームのクリーンアップを促します。                                                                                                                            |

claim 済みのカードは、呼び出し元が `workboard_claim` から返された claim token を保持していない限り、他の agent tool による変更を拒否します。agent tool または Gateway RPC 呼び出しから返されるすべてのカードでは、`metadata.claim.token` が `[redacted]` に秘匿されます（token 自体は `workboard_claim` からのみ、トップレベルで一度だけ返されます）。そのため、ダッシュボードのオペレーターや他のエージェントは、使用可能な token を見ることなく claim 状態を検査できます。復旧は `workboard_promote`/`workboard_reassign`/`workboard_reclaim` を通じて行い、これらは token を必要としません。

## ディスパッチ

ディスパッチは Gateway ローカルです。任意の OS プロセスを起動するわけではありません。通常の OpenClaw サブエージェントセッションが引き続き実行を所有します。1 回のディスパッチパスは次を行います。

1. 依存関係が ready になったカードを昇格します。
2. ready カードにディスパッチメタデータを記録します。
3. 期限切れの claim またはタイムアウトした run をブロックします。
4. ボード設定済みの triage カードをオーケストレーション候補としてマークします。
5. ready カードの小さなバッチを claim し、Gateway サブエージェントランタイムを通じて worker run を開始します。

worker は、Workboard tools を通じてカードの heartbeat、complete、block を行うために必要な claim token と、範囲が限定されたカードコンテキストを受け取ります。

### worker の選択

各パスは**デフォルトで最大 3 worker**を開始します。ready カードは、優先度、位置、作成時刻の順に並べられます。1 回のパスで開始するカードは owner/agent ごとに 1 枚だけで、ボード上にすでに実行中またはレビュー中の作業がある owner はスキップされます。アーカイブ済みカード、アクティブな claim を持つカード、`ready` ステータスではないカードが worker 開始対象に選ばれることはありません（ただし、古い claim のクリーンアップ、依存関係の昇格、タイムアウトのクリーンアップといったディスパッチのデータ側の処理の影響を受けることはあります）。

セッションキーは board/card ごとに決定的です。そのため、ディスパッチを繰り返しても無関係なセッションを作成せず、同じ worker レーンに戻ります。

- 割り当て済みカード: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未割り当てカード: `subagent:workboard-<boardId>-<cardId>`（Gateway が設定済みのデフォルト agent を解決します）

カードが claim された後に worker を開始できない場合、Workboard はカードをブロックし、claim をクリアし、run 開始失敗を記録し、worker ログ行を追加します。これはダッシュボード、CLI JSON、agent tools、カード診断で表示されます。

### エントリーポイント

- ダッシュボードのディスパッチ操作
- `openclaw workboard dispatch`
- コマンド対応チャンネル上の `/workboard dispatch`

3 つすべてが、Gateway が利用可能な場合は Gateway サブエージェントランタイムを使用します。CLI にはオペレーター向けのフォールバックが 1 つあります。Gateway 呼び出しが接続/利用不可エラー（または古い Gateway の `unknown method` エラー）で失敗し、明示的な `--url`/`--token` ターゲットがなく、設定済みのリモート Gateway（`OPENCLAW_GATEWAY_URL` または `gateway.mode: remote`）も適用されない場合、CLI はローカル SQLite 状態に対してデータのみのディスパッチを実行します。これは依存関係の昇格、古い claim のクリーンアップ、タイムアウトした run のブロックはできますが、worker は開始できません。到達可能な Gateway からの認証、権限、検証の失敗は利用不可として扱われません。それらはコマンドエラーとして表示され、明示的な `--url`/`--token` ターゲットが指定された場合の Gateway 失敗も同様です。

ボードメタデータでは `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee`、`orchestratorProfile` を設定できます。OpenClaw はこの意図を記録し、worker コンテキストで公開します。実際の仕様化/分解は引き続き通常の Workboard tools を通じて実行されます。

## CLI とスラッシュコマンド

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` のテキスト出力はデフォルトでアーカイブ済みカードを非表示にします（`--include-archived` で上書き）。`--json` は常にアーカイブ済みカードを含め、既存スクリプトが使用するフルカード契約と一致します。`show` は曖昧でない id プレフィックスを受け付けます。`list`、`create`、`show` は常にローカル Plugin 状態を直接読み書きします。実行中の Gateway を呼び出すのは `dispatch` のみで、上記のフォールバックがあります。

すべてのフラグ、JSON 出力、Gateway フォールバック動作、id プレフィックス処理、ディスパッチ選択ルール、トラブルシューティングについては、[Workboard CLI](/ja-JP/cli/workboard) を参照してください。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、`/workboard dispatch` は CLI と対応します。list と show は、認可済みの任意のコマンド送信者に対する読み取り操作です。create と dispatch には、チャットサーフェス上の owner ステータス、または `operator.write`/`operator.admin` を持つ Gateway クライアントが必要です。

## セッションライフサイクル同期

カードは既存のダッシュボードセッション、またはカードから作業を開始したときに作成されたセッションにリンクできます。リンク済みカードは、実行中、古い状態、リンク済みアイドル、完了、失敗、見つからない、といったセッションライフサイクルをインラインで表示します。Sessions タブから **Add to Workboard** で既存セッションを取り込むこともできます。カードはそのセッションにリンクし、セッションラベルまたは最近のユーザープロンプトをタイトルとして使用し、利用可能な場合は最近のユーザープロンプトと最新の assistant 応答からノートを初期化します。

リンク済みセッションが見つからなくなっても、カードはコンテキストのためにリンクを保持し、新しいセッションへ再起動するための開始コントロールも引き続き提供します。アクティブなリンク済みセッションが最近のアクティビティを報告しなくなった場合、Workboard はカードを `stale` とマークし、ライフサイクルがそれを解消するまでメタデータとして保存します。

カードがアクティブな作業状態にある間、Workboard はリンク済みセッションに追従します。

| リンク済みセッション状態              | カードステータス |
| ------------------------------------- | ----------- |
| active                                | `running`   |
| completed                             | `review`    |
| failed、killed、timed out、aborted | `blocked`   |

**手動レビュー状態が優先されます。** カードを `review`、`blocked`、`done` に移動すると、そのカードを `todo` または `running` に戻すまで自動同期は停止します。

カードの開始には通常の Gateway セッションを使用します。Workboard はカードメタデータとリンクのみを保存します。会話 transcript、モデル選択、run ライフサイクルは通常のセッションシステムが所有し続けます。稼働中のリンク済みカードで **Stop** を使用すると、アクティブな run を中止できます。Workboard はそのカードを `blocked` とマークし、フォローアップのために表示され続けるようにします。

新しいカードは Workboard テンプレート（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）から開始できます。テンプレートはタイトル、ノート、ラベル、優先度を事前入力します。テンプレート id はカードメタデータとして保存されます。

## ダッシュボードワークフロー

1. Control UI で Workboard タブを開きます。
2. タイトル、ノート、優先度、ラベル、任意の agent、任意のリンク済みセッションを持つカードを作成します。または Sessions を開き、既存セッションに対して **Add to Workboard** を選びます。
3. カードを列間でドラッグするか、コンパクトなステータスコントロールにフォーカスしてメニューまたは ArrowLeft/ArrowRight を使用します。
4. カードから作業を開始し、ダッシュボードセッションを作成または再利用します。
5. agent が作業している間、カードからリンク済みセッションを開きます。
6. ライフサイクル同期により実行中の作業を `review`/`blocked` に移動させ、承認されたら手動でカードを `done` に移動します。

## 診断

診断はローカルカードメタデータから計算されます。組み込みチェックは次を検出します。

| 種類                        | 条件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 割り当て済みの `todo`/`backlog`/`ready` カードが 1 時間超更新されていない。             |
| `running_without_heartbeat` | `running` カードに claim heartbeat または実行更新が 20 分超ない。 |
| `blocked_too_long`          | `blocked` カードが 24 時間超更新されていない。                                   |
| `repeated_failures`         | カードで追跡された失敗回数が 2 回以上に達した。                                |
| `missing_proof`             | proof、artifact、attachment のない `done` カード。                          |
| `orphaned_session`          | `sessionKey` はあるが `execution` メタデータがない `running` カード。                |

## 権限

Gateway RPC メソッドは `workboard.*` 配下にあります。

| スコープ            | メソッド                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、attachment list/get、notification event reads、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、attachment add/delete、worker log、protocol violation、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、notification subscribe/delete/advance |

`operator.admin` を必要とする RPC メソッドはありません。読み取り専用の operator アクセスで接続されたブラウザーはボードを検査できますが、カードを変更することはできません。

## ストレージ

Workboard は、OpenClaw 状態ディレクトリ配下の Plugin 所有のリレーショナル SQLite データベースに永続データを保存します。boards、cards、labels、lifecycle events、run attempts、comments、dependency links、proof、artifact references、attachment metadata and blobs、diagnostics、notifications、worker logs、protocol state、subscriptions はすべて Workboard テーブルに格納されます（Plugin key-value entries ではありません）。カード export は、attachment blob の内容をインライン化せずにボードの narrative を保持します。

`.28` リリースで Workboard を使用していたインストールでは、`openclaw doctor --fix` を実行して、出荷済みのレガシー Plugin 状態名前空間（`workboard.cards`、`workboard.boards`、`workboard.notify`、存在する場合は `workboard.attachments`）をリレーショナルデータベースに移行できます。

## トラブルシューティング

**タブに Workboard is unavailable と表示される**

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` が設定されている場合は、そこに `workboard` を追加します。`plugins.deny` に `workboard` が含まれている場合は、Plugin を有効化する前に削除します。

**カードが保存されない**

ブラウザー接続に `operator.write` アクセスがあることを確認します。読み取り専用の operator セッションはカードを一覧できますが、作成、編集、移動、削除はできません。

**カードを開始しても期待したセッションが開かない**

カードの agent id とリンク済みセッションを確認し、Sessions または Chat を開いて実際の run 状態を検査します。

**ディスパッチしても worker が開始されない**

アクティブな claim のない `ready` カードが少なくとも 1 枚あることを確認します。

```bash
openclaw workboard list --status ready
```

CLI がデータのみのディスパッチを報告する場合は、Gateway を開始または再起動して再試行します。データのみのディスパッチはローカルボード状態を更新しますが、サブエージェント worker run を開始できません。同じ owner または agent の別のカードがすでに実行中またはレビュー待ちの場合にも、カードがスキップされることがあります。同じ owner に対してさらにディスパッチする前に、そのアクティブな作業を complete、block、または release してください。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Workboard CLI](/ja-JP/cli/workboard)
- [Plugins](/ja-JP/tools/plugin)
- [Manage plugins](/ja-JP/plugins/manage-plugins)
- [Sessions](/ja-JP/concepts/session)

---
read_when:
    - Control UI にカンバン形式の作業ボードが必要な場合
    - バンドルされている Workboard Plugin を有効または無効にしています
    - 外部のプロジェクト管理ツールを使わずに、計画されたエージェントの作業を追跡したい場合
summary: エージェントが所有するカードとセッション引き継ぎのためのオプションのダッシュボードワークボード
title: Workboard Plugin
x-i18n:
    generated_at: "2026-07-12T14:44:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Plugin は、
[Control UI](/ja-JP/web/control-ui) にオプションのカンバン形式のボードを追加します。エージェント向けサイズの作業カード、エージェントへの割り当て、
およびカードのタスク、実行、ダッシュボードセッションに戻るリンクを提供します。

Workboard は意図的に小規模に設計されています。1 つの
OpenClaw Gateway のローカル運用作業を追跡します。GitHub Issues、Linear、Jira、
その他のチーム向けプロジェクト管理システムを置き換えるものではありません。

## 有効化

Workboard は同梱されていますが、デフォルトでは無効です。

1. Control UI で **Plugin** を開くか、設定済みの Control UI ベースパスを基準に
   `/settings/plugins` を使用します。たとえば、ベースパスが `/openclaw` の場合は
   `/openclaw/settings/plugins` を使用します。
2. **Workboard** を見つけ、**有効化** を選択します。Workboard は
   OpenClaw に同梱されているため、**インストール** 操作は不要です。
3. UI に再起動が必要と表示された場合は、Gateway を再起動します。

Plugin ランタイムの読み込み後、ダッシュボードのナビゲーションに Workboard タブが表示されます。
無効な間は、タブはナビゲーションに表示されません。Plugin が無効な場合や
`plugins.allow`/`plugins.deny` によってブロックされている場合に
`/workboard` ルートを直接開くと、カードデータの代わりに
Plugin を利用できない状態が表示されます。

同等の CLI ワークフローは次のとおりです。

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## 設定

Workboard に Plugin 固有の設定はありません。標準の
Plugin エントリで有効化または無効化します。

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

## カードのフィールド

| フィールド  | 値                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`                     |
| `priority`  | `low`、`normal`、`high`、`urgent`                                                                             |
| `labels`    | 自由形式の文字列                                                                                              |
| `agentId`   | オプションの割り当て済みエージェント                                                                          |
| リンク済み参照 | オプションのタスク、実行、セッション、またはソース URL                                                     |
| `execution` | カードから開始された Codex/Claude 実行のオプションのメタデータ（エンジン、モード、モデル、セッション、実行 ID、ステータス） |

カードには、試行、コメント、リンク、証明、
成果物、自動化設定、添付ファイル、ワーカーログ、ワーカープロトコルの
状態、要求権、診断、通知、テンプレート ID、アーカイブ状態、
古いセッションの検出に関するコンパクトなメタデータと、最近のイベント一覧（`created`、`edited`、
`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、
`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、
`link_added`、`proof_added`、`artifact_added`、`attachment_added`、
`diagnostic`、`notification`、`dispatch`、`orchestration`、
`protocol_violation`、`archived`、`unarchived`、`stale`）も含まれます。このメタデータにより、
オペレーターはリンクされたセッションを開かなくても、カードがボード内をどのように移動したかを確認できます。
これはローカルの運用コンテキストであり、セッションの
トランスクリプトや GitHub Issue の履歴を置き換えるものではありません。

カードは Plugin 独自の Gateway 状態に保存され、その Gateway の他の
OpenClaw 状態とともに移動します（[ストレージ](#storage)を参照）。

## カードから作業を開始する

リンクされていないカードから直接作業を開始できます。

- **Codex を実行** / **Claude を実行** は、明示的なエンジンを指定して
  タスク追跡対象のエージェント実行を開始し、カードのプロンプトを送信して、カードを `running` にします。Codex
  の実行では `openai/gpt-5.6-sol`、Claude の実行では `anthropic/claude-sonnet-4-6` を使用します。
- **Codex を開く** / **Claude を開く** は、カードのプロンプトを送信したり
  カードを移動したりせずに、リンクされたダッシュボードセッションを作成します。これは、ボードとの関連付けを維持した
  手動作業に使用します。

自律的な開始では、Gateway のタスク追跡対象エージェント実行パス（Codex/Claude を明示的に選択しない限り、
デフォルトのエージェントとモデル）を使用します。その後、Workboard は
生成されたタスク、実行 ID、セッションキーをカードにリンクします。リンクされた各
実行には、試行の概要（エンジン、モード、モデル、実行 ID、
タイムスタンプ、ステータス、累積失敗回数）も記録されるため、繰り返し発生する失敗を確認できます。

ダッシュボードは Gateway のタスク台帳からタスクのステータスを更新し、
タスク ID、実行 ID、またはリンクされたセッションキーによってタスクとカードを照合します。キュー投入済みまたは実行中の
タスクでは、カードのライフサイクルがアクティブに保たれます。完了、失敗、タイムアウト、または
キャンセルされたタスクは、リンクされたセッションと同じ同期
ルールを使用してカードを `review` または `blocked` に移動します（[セッションライフサイクルの同期](#session-lifecycle-sync)を参照）。

## エージェントツール

| ツール                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | クレーム／診断状態を含むコンパクトなカード一覧を表示します。任意でボードを絞り込めます。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 1 件のカードと、範囲を限定したワーカーコンテキスト（メモ、試行、コメント、リンク、証明、アーティファクト、親の結果、担当者の最近の作業、アクティブな診断）を返します。                               |
| `workboard_create`                                                                                                                               | 任意の親、テナント、Skills、ボード、ワークスペースメタデータ、冪等性キー、実行時間制限、再試行予算を指定してカードを作成します。                                                             |
| `workboard_link`                                                                                                                                 | 親を子カードにリンクします。すべての親が `done` に達するまで、子は `todo` のままです。その後、ディスパッチによる昇格で `ready` に移動します。                                                     |
| `workboard_claim`                                                                                                                                | 呼び出し元エージェントがカードをクレームします。`backlog`／`todo`／`ready` を `running` に移動します。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 長時間の実行中にクレームの Heartbeat を更新します。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 完了、一時停止、または引き継ぎ後にクレームを解放します。カードを次のステータスへ移動することもできます。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 最終概要、証明、アーティファクト、作成済みカードのマニフェスト（完了したカードへリンクされているカードを参照する必要があります）、またはブロック理由を扱う構造化ライフサイクルツールです。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 小さなカード添付ファイルを Plugin の SQLite 状態に保存し、カード上でインデックス化して、ワーカーコンテキストで公開します。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | ワーカーログ行を記録し、自動ワーカーが `workboard_complete`／`workboard_block` を呼び出さずに停止した場合はカードをブロックします。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 永続化されたボードメタデータ（表示名、説明、アーカイブ状態、デフォルトワークスペース）を管理します。                                                                                            |
| `workboard_runs`                                                                                                                                 | カードについて永続化された実行試行履歴を返します。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 大まかなトリアージ／バックログカードを明確化された `todo` カードに変換し、仕様概要をカードに記録します。                                                                                      |
| `workboard_decompose`                                                                                                                            | 親オーケストレーションカードをリンクされた子に展開し、ボード／テナントメタデータを継承します。作成済みカードのマニフェストを使って親を完了することもできます。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 通知サブスクリプションを管理します。イベント読み取りは安全に再実行できます。`advance` は永続カーソルを移動し、呼び出し元が完了／失敗／期限切れカードイベントを取りこぼしたり重複して読み取ったりせずに再開できるようにします。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | ボードの名前空間とキュー統計を確認します。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 停滞した作業を復旧または引き継ぎます。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 引き継ぎメモを追加するか、証明／アーティファクトの参照を添付します。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | ブロックされた作業を `todo` に戻します。                                                                                                                                                         |
| `workboard_dispatch`                                                                                                                             | 依存関係の昇格または期限切れクレームのクリーンアップを促します。                                                                                                                                        |

クレーム済みカードは、呼び出し元が `workboard_claim` から返されたクレームトークンを
保持していない限り、他のエージェントによるエージェントツールの変更を拒否します。
エージェントツールまたは Gateway RPC 呼び出しが返すすべてのカードでは、
`metadata.claim.token` が `[redacted]` に秘匿されます
（トークン自体は `workboard_claim` からのみ、トップレベルで一度だけ返されます）。
これにより、ダッシュボードのオペレーターや他のエージェントは、利用可能なトークンを
一切見ることなくクレーム状態を確認できます。復旧には
`workboard_promote`／`workboard_reassign`／`workboard_reclaim` を使用し、
これらはトークンを必要としません。

## ディスパッチ

ディスパッチは Gateway ローカルです。任意の OS プロセスを起動することはありません。
実行は引き続き通常の OpenClaw サブエージェントセッションが担います。1 回のディスパッチ処理では、
次を行います。

1. 依存関係が準備できたカードを昇格します。
2. 準備済みカードにディスパッチメタデータを記録します。
3. 期限切れのクレームまたはタイムアウトした実行をブロックします。
4. ボードで構成されたトリアージカードをオーケストレーション候補としてマークします。
5. 準備済みカードの小さなバッチをクレームし、
   Gateway サブエージェントランタイムを通じてワーカー実行を開始します。

ワーカーには、範囲を限定したカードコンテキストに加えて、Workboard ツールを通じて
Heartbeat の送信、カードの完了、またはブロックを行うために必要なクレームトークンが渡されます。

### ワーカーの選択

各処理では、デフォルトで **最大 3 ワーカー**を開始します。準備済みカードは、
優先度、位置、作成時刻の順で並べられます。1 回の処理で開始するカードは
所有者／エージェントごとに 1 件のみで、ボード上ですでに実行中またはレビュー中の作業がある
所有者はスキップされます。アーカイブ済みカード、アクティブなクレームがあるカード、
およびステータスが `ready` でないカードがワーカー開始の対象になることはありません
（ただし、ディスパッチのデータ処理側、つまり期限切れクレームのクリーンアップ、
依存関係の昇格、タイムアウトのクリーンアップの影響を受けることはあります）。

セッションキーはボード／カードごとに決定論的に生成されるため、ディスパッチを繰り返しても
無関係なセッションを作成せず、同じワーカーレーンにルーティングされます。

- 割り当て済みカード: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未割り当てカード: `subagent:workboard-<boardId>-<cardId>`（Gateway が
  構成済みのデフォルトエージェントを解決します）

カードがクレームされた後にワーカーを開始できない場合、Workboard はカードを
ブロックし、クレームをクリアし、実行開始の失敗を記録して、ワーカーログ行を
追加します。これはダッシュボード、CLI JSON、エージェントツール、カード診断で
確認できます。

### エントリーポイント

- ダッシュボードのディスパッチアクション
- `openclaw workboard dispatch`
- コマンド対応チャネル上の `/workboard dispatch`

Gateway が利用可能な場合、3 つすべてが Gateway サブエージェントランタイムを使用します。
CLI にはオペレーター向けのフォールバックが 1 つあります。Gateway 呼び出しが
接続／利用不可エラー（または古い Gateway の `unknown method` エラー）で失敗し、
明示的な `--url`／`--token` ターゲットがなく、構成済みのリモート Gateway
（`OPENCLAW_GATEWAY_URL` または `gateway.mode: remote`）も適用されない場合、
CLI はローカルの SQLite 状態に対してデータのみのディスパッチを実行します。
依存関係の昇格、期限切れクレームのクリーンアップ、タイムアウトした実行のブロックは
できますが、ワーカーは開始できません。到達可能な Gateway からの認証、権限、
検証の失敗は利用不可として扱われず、コマンドエラーとして表示されます。
明示的な `--url`／`--token` ターゲットが指定された場合の Gateway の失敗も
同様にコマンドエラーになります。

ボードメタデータでは、`autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee`、`orchestratorProfile` を設定できます。OpenClaw はこの意図を
記録し、ワーカーコンテキストで公開します。実際の仕様化／分解は引き続き通常の
Workboard ツールを通じて実行されます。

## CLI とスラッシュコマンド

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` のテキスト出力では、デフォルトでアーカイブ済みカードが非表示になります
（`--include-archived` で上書きできます）。`--json` には常にアーカイブ済みカードが
含まれ、既存のスクリプトが使用する完全なカードの契約と一致します。`show` は一意に
特定できる ID プレフィックスを受け付けます。`list`、`create`、`show` は常にローカルの
Plugin 状態を直接読み書きします。実行中の Gateway を呼び出すのは `dispatch` のみで、
前述のフォールバックが適用されます。

完全なフラグ、JSON 出力、Gateway のフォールバック動作、ID プレフィックスの処理、
ディスパッチの選択ルール、トラブルシューティングについては、
[Workboard CLI](/ja-JP/cli/workboard) を参照してください。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、
`/workboard dispatch` は CLI に対応しています。list と show は、認可された
すべてのコマンド送信者が実行できる読み取り操作です。create と dispatch には、
チャット画面では所有者ステータスが必要です。または、Gateway クライアントに
`operator.write`／`operator.admin` が必要です。

## セッションライフサイクルの同期

カードは、既存のダッシュボードセッション、またはカードから作業を開始したときに作成されるセッションにリンクできます。リンク済みカードには、セッションのライフサイクル（実行中、古い状態、リンク済みアイドル、完了、失敗、欠落）がインラインで表示されます。Sessions タブの **Add to Workboard** から既存のセッションを取り込むこともできます。カードはそのセッションにリンクされ、セッションラベルまたは最近のユーザープロンプトをタイトルとして使用し、利用可能な場合は最近のユーザープロンプトと最新のアシスタント応答からメモを初期設定します。

リンク先セッションが見つからなくなっても、カードはコンテキストのためにリンクを維持し、新しいセッションで再開するための開始コントロールを引き続き表示します。アクティブなリンク先セッションから最近のアクティビティが報告されなくなると、Workboard はカードを `stale` としてマークし、ライフサイクルによって解除されるまでその状態をメタデータとして保存します。

カードがアクティブな作業状態にある間、Workboard はリンク先セッションに追従します。

| リンク先セッションの状態                  | カードのステータス |
| ------------------------------------- | ----------- |
| アクティブ                                | `running`   |
| 完了                             | `review`    |
| 失敗、強制終了、タイムアウト、または中止 | `blocked`   |

**手動のレビューステータスが優先されます。** カードを `review`、`blocked`、または `done` に移動すると、そのカードを `todo` または `running` に戻すまで自動同期が停止します。

カードの開始には通常の Gateway セッションが使用されます。Workboard が保存するのはカードのメタデータとリンクのみです。会話トランスクリプト、モデル選択、および実行ライフサイクルは、引き続き通常のセッションシステムによって管理されます。稼働中のリンク済みカードで **Stop** を使用すると、アクティブな実行を中止できます。Workboard はそのカードを `blocked` としてマークし、フォローアップできるよう表示を維持します。

新しいカードは、Workboard テンプレート（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）から開始できます。テンプレートはタイトル、メモ、ラベル、優先度を事前入力し、テンプレート ID はカードのメタデータとして保存されます。

## ダッシュボードのワークフロー

1. Control UI で Workboard タブを開きます。
2. タイトル、メモ、優先度、ラベル、任意のエージェント、任意のリンク先セッションを指定してカードを作成します。または Sessions を開き、既存のセッションに対して **Add to Workboard** を選択します。
3. カードを列間でドラッグするか、コンパクトなステータスコントロールにフォーカスして、メニューまたは ArrowLeft/ArrowRight を使用します。
4. カードから作業を開始して、ダッシュボードセッションを作成または再利用します。
5. エージェントの作業中に、カードからリンク先セッションを開きます。
6. ライフサイクル同期によって実行中の作業が `review`/`blocked` に移動するのを待ち、承認したらカードを手動で `done` に移動します。

## 診断

診断はローカルのカードメタデータから計算されます。組み込みチェックでは次の状態が検出されます。

| 種類                        | 条件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 担当者が割り当てられた `todo`/`backlog`/`ready` カードが 1 時間を超えて更新されていない。             |
| `running_without_heartbeat` | `running` カードに対して、20 分を超えてクレーム Heartbeat または実行更新がない。 |
| `blocked_too_long`          | `blocked` カードが 24 時間を超えて更新されていない。                                   |
| `repeated_failures`         | カードで追跡される失敗回数が 2 回以上に達している。                                |
| `missing_proof`             | `done` カードに証明、成果物、添付ファイルのいずれもない。                          |
| `orphaned_session`          | `running` カードに `sessionKey` があるが、`execution` メタデータがない。                |

## 権限

Gateway RPC メソッドは `workboard.*` 配下にあります。

| スコープ            | メソッド                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、添付ファイルの一覧取得/取得、通知イベントの読み取り、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、作成/更新/移動/削除/コメント/リンク/依存関係リンク/証明/成果物、添付ファイルの追加/削除、ワーカーログ、プロトコル違反、クレーム/Heartbeat/解放/昇格/再割り当て/再クレーム/完了/ブロック/ブロック解除、`cards.dispatch`、`cards.bulk`、アーカイブ、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知の購読/削除/進行 |

`operator.admin` を必要とする RPC メソッドはありません。読み取り専用のオペレーターアクセスで接続されたブラウザーはボードを確認できますが、カードを変更することはできません。

## ストレージ

Workboard は永続データを、OpenClaw の状態ディレクトリ配下にある Plugin 所有のリレーショナル SQLite データベースに保存します。ボード、カード、ラベル、ライフサイクルイベント、実行試行、コメント、依存関係リンク、証明、成果物参照、添付ファイルのメタデータと BLOB、診断、通知、ワーカーログ、プロトコル状態、購読はすべて Workboard のテーブルに保存されます（Plugin のキー・バリューエントリには保存されません）。カードのエクスポートでは、添付ファイルの BLOB 内容をインライン化せずに、ボードの経緯が保持されます。

`.28` リリースで Workboard を使用していたインストール環境では、`openclaw doctor --fix` を実行して、リリース済みの旧 Plugin 状態名前空間（`workboard.cards`、`workboard.boards`、`workboard.notify`、および存在する場合は `workboard.attachments`）をリレーショナルデータベースに移行できます。

## トラブルシューティング

**タブに Workboard が利用できないと表示される**

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` が設定されている場合は、そこに `workboard` を追加します。`plugins.deny` に `workboard` が含まれている場合は、Plugin を有効にする前に削除します。

**カードが保存されない**

ブラウザー接続に `operator.write` アクセス権があることを確認します。読み取り専用のオペレーターセッションではカードを一覧表示できますが、作成、編集、移動、削除はできません。

**カードを開始しても想定したセッションが開かない**

カードのエージェント ID とリンク先セッションを確認し、Sessions または Chat を開いて実際の実行状態を調べます。

**ディスパッチしてもワーカーが開始されない**

アクティブなクレームのない `ready` カードが少なくとも 1 件あることを確認します。

```bash
openclaw workboard list --status ready
```

CLI がデータのみのディスパッチを報告する場合は、Gateway を起動または再起動してから再試行します。データのみのディスパッチではローカルボードの状態は更新されますが、サブエージェントのワーカー実行を開始できません。同じ所有者またはエージェントの別のカードがすでに実行中またはレビュー待ちの場合も、カードがスキップされることがあります。同じ所有者に対してさらにディスパッチする前に、そのアクティブな作業を完了、ブロック、または解放してください。

## 関連項目

- [Control UI](/ja-JP/web/control-ui)
- [Workboard CLI](/ja-JP/cli/workboard)
- [Plugin](/ja-JP/tools/plugin)
- [Plugin を管理する](/ja-JP/plugins/manage-plugins)
- [セッション](/ja-JP/concepts/session)

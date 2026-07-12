---
read_when:
    - Control UI にカンバン形式の作業ボードが必要であること
    - バンドルされた Workboard Plugin を有効または無効にしています
    - 外部のプロジェクト管理ツールを使わずに、計画されたエージェントの作業を追跡したい場合
summary: エージェントが所有するカードとセッション引き継ぎのためのオプションのダッシュボード作業ボード
title: Workboard Plugin
x-i18n:
    generated_at: "2026-07-11T22:34:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Pluginは、[Control UI](/ja-JP/web/control-ui)にオプションのカンバン形式のボードを追加します。エージェント向けサイズの作業カード、エージェントへの割り当て、カードのタスク、実行、ダッシュボードセッションへのリンクを提供します。

Workboardは意図的に小規模に設計されています。1つのOpenClaw Gatewayにおけるローカルな運用作業を追跡します。GitHub Issues、Linear、Jira、その他のチーム向けプロジェクト管理システムを置き換えるものではありません。

## 有効化

Workboardは同梱されていますが、デフォルトでは無効です。

1. Control UIで**Plugin**を開くか、設定済みのControl UIベースパスを基準とする`/settings/plugins`を使用します。たとえば、ベースパスが`/openclaw`の場合は`/openclaw/settings/plugins`を使用します。
2. **Workboard**を見つけて**有効化**を選択します。WorkboardはOpenClawに同梱されているため、**インストール**操作は必要ありません。
3. UIに再起動が必要と表示された場合は、Gatewayを再起動します。

Pluginランタイムが読み込まれると、ダッシュボードのナビゲーションにWorkboardタブが表示されます。無効になっている間、タブはナビゲーションに表示されません。Pluginが無効になっているか、`plugins.allow`/`plugins.deny`によってブロックされている状態で`/workboard`ルートを直接開くと、カードデータの代わりにPluginを利用できない状態が表示されます。

同等のCLIワークフローは次のとおりです。

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## 設定

WorkboardにはPlugin固有の設定はありません。標準のPluginエントリを使用して有効化または無効化します。

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
| `agentId`   | 任意の割り当て済みエージェント                                                                                |
| リンク参照  | 任意のタスク、実行、セッション、またはソースURL                                                              |
| `execution` | カードから開始したCodex/Claude実行の任意のメタデータ（エンジン、モード、モデル、セッション、実行ID、状態）   |

カードには、試行、コメント、リンク、証明、成果物、自動化設定、添付ファイル、ワーカーログ、ワーカープロトコルの状態、要求、診断、通知、テンプレートID、アーカイブ状態、古いセッションの検出に関するコンパクトなメタデータと、最近のイベント一覧（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）も含まれます。このメタデータにより、オペレーターはリンクされたセッションを開かなくても、カードがボード内をどのように移動したかを確認できます。これはローカルな運用コンテキストであり、セッションのトランスクリプトやGitHub Issueの履歴を置き換えるものではありません。

カードはPlugin独自のGateway状態に保存され、そのGatewayの他のOpenClaw状態とともに移動します（[ストレージ](#storage)を参照）。

## カードから作業を開始する

リンクされていないカードから直接作業を開始できます。

- **Codexを実行** / **Claudeを実行**は、明示的なエンジンを指定してタスク追跡対象のエージェント実行を開始し、カードのプロンプトを送信して、カードを`running`にします。Codexの実行では`openai/gpt-5.6-sol`を使用し、Claudeの実行では`anthropic/claude-sonnet-4-6`を使用します。
- **Codexを開く** / **Claudeを開く**は、カードのプロンプトを送信したりカードを移動したりせず、リンクされたダッシュボードセッションを作成します。ボードとの関連付けを維持したまま手動で作業する場合に使用します。

自律的な開始では、Gatewayのタスク追跡対象エージェント実行パスを使用します（CodexまたはClaudeを明示的に選択しない限り、デフォルトのエージェントとモデルを使用します）。その後、Workboardは生成されたタスク、実行ID、セッションキーをカードにリンクします。リンクされた各実行には試行の概要（エンジン、モード、モデル、実行ID、タイムスタンプ、状態、連続失敗回数）も記録されるため、失敗が繰り返されても確認できます。

ダッシュボードはGatewayのタスク台帳からタスクの状態を更新し、タスクID、実行ID、またはリンクされたセッションキーを使用してタスクとカードを照合します。キュー待ちまたは実行中のタスクがある間、カードのライフサイクルはアクティブな状態を維持します。完了、失敗、タイムアウト、またはキャンセルされたタスクがある場合、リンクされたセッションと同じ同期ルールを使用して、カードを`review`または`blocked`へ移動します（[セッションのライフサイクル同期](#session-lifecycle-sync)を参照）。

## エージェントツール

| ツール                                                                                                                                             | 目的                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | クレーム／診断状態を含む簡潔なカード一覧を表示します。ボードによる絞り込みは任意です。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 1 件のカードと、範囲を限定したワーカーコンテキスト（メモ、試行、コメント、リンク、証拠、アーティファクト、親の結果、担当者の最近の作業、アクティブな診断）を返します。                               |
| `workboard_create`                                                                                                                               | 親、テナント、Skills、ボード、ワークスペースメタデータ、冪等性キー、実行時間上限、再試行回数を任意で指定してカードを作成します。                                                             |
| `workboard_link`                                                                                                                                 | 親を子カードにリンクします。すべての親が `done` に到達するまで子は `todo` のままとなり、その後ディスパッチによる昇格で `ready` に移動します。                                                     |
| `workboard_claim`                                                                                                                                | 呼び出し元エージェント用にカードをクレームし、`backlog`／`todo`／`ready` から `running` に移動します。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 長時間の実行中にクレームの Heartbeat を更新します。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 完了、一時停止、または引き継ぎ後にクレームを解放します。カードを次のステータスへ移動することもできます。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 最終要約、証拠、アーティファクト、作成カードのマニフェスト（完了したカードへのリンクがあるカードを参照する必要があります）、またはブロック理由を扱う構造化ライフサイクルツールです。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 小さなカード添付ファイルを Plugin の SQLite 状態に保存し、カードに索引付けして、ワーカーコンテキストで公開します。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | ワーカーログ行を記録し、自動化されたワーカーが `workboard_complete`／`workboard_block` を呼ばずに停止した場合にカードをブロックします。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 永続化されたボードメタデータ（表示名、説明、アーカイブ状態、デフォルトワークスペース）を管理します。                                                                                            |
| `workboard_runs`                                                                                                                                 | カードの永続化された実行試行履歴を返します。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 大まかなトリアージ／バックログカードを明確化された `todo` カードに変換し、仕様の要約をカードに記録します。                                                                                      |
| `workboard_decompose`                                                                                                                            | 親オーケストレーションカードをリンクされた子カードへ展開し、ボード／テナントのメタデータを継承します。作成カードのマニフェストとともに親を完了することもできます。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 通知サブスクリプションを管理します。イベントの読み取りは安全に再実行できます。`advance` は永続カーソルを進め、呼び出し元が完了／失敗／期限切れカードのイベントを失ったり二重に読んだりせず再開できるようにします。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | ボードの名前空間とキュー統計を確認します。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 停滞した作業を復旧または引き継ぎます。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 引き継ぎメモを追加するか、証拠／アーティファクトの参照を添付します。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | ブロックされた作業を `todo` に戻します。                                                                                                                                                         |
| `workboard_dispatch`                                                                                                                             | 依存関係の昇格または期限切れクレームのクリーンアップを促します。                                                                                                                                        |

クレーム済みカードでは、呼び出し元が `workboard_claim` から返されたクレームトークンを
保持していない限り、他のエージェントによるエージェントツールの変更操作を拒否します。
エージェントツールまたは Gateway RPC 呼び出しから返されるすべてのカードでは、
`metadata.claim.token` が `[redacted]` に編集されます（トークン自体は
`workboard_claim` からのみ、トップレベルで一度だけ返されます）。これにより、
ダッシュボードのオペレーターや他のエージェントは、使用可能なトークンを目にすることなく
クレーム状態を確認できます。復旧は
`workboard_promote`／`workboard_reassign`／`workboard_reclaim` を通じて行い、
これらにはトークンは不要です。

## ディスパッチ

ディスパッチは Gateway 内で完結し、任意の OS プロセスを生成しません。通常の
OpenClaw サブエージェントセッションが引き続き実行を担います。1 回のディスパッチ処理では、
次の処理を行います。

1. 依存関係が準備済みのカードを昇格します。
2. 準備済みカードにディスパッチメタデータを記録します。
3. 期限切れのクレームまたはタイムアウトした実行をブロックします。
4. ボードで設定されたトリアージカードをオーケストレーション候補としてマークします。
5. 準備済みカードの小さなバッチをクレームし、Gateway のサブエージェントランタイムを通じて
   ワーカー実行を開始します。

ワーカーには、範囲を限定したカードコンテキストに加えて、Workboard ツールを通じて
Heartbeat、完了、またはブロックを行うために必要なクレームトークンが渡されます。

### ワーカーの選択

各処理では、デフォルトで **最大 3 ワーカー**を開始します。準備済みカードは
優先度、位置、作成時刻の順に並べられます。1 回の処理で開始されるカードは
所有者／エージェントごとに 1 件のみで、ボード上ですでに実行中またはレビュー中の作業がある
所有者はスキップされます。アーカイブ済みカード、アクティブなクレームを持つカード、
およびステータスが `ready` でないカードがワーカー開始に選択されることはありません
（ただし、ディスパッチのデータ処理側、つまり期限切れクレームのクリーンアップ、
依存関係の昇格、タイムアウトのクリーンアップの影響を受ける場合はあります）。

セッションキーはボード／カードごとに決定的に生成されるため、ディスパッチを繰り返しても
無関係なセッションを作成せず、同じワーカーレーンに戻されます。

- 割り当て済みカード: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未割り当てカード: `subagent:workboard-<boardId>-<cardId>`（Gateway が
  設定済みのデフォルトエージェントを解決します）

カードのクレーム後にワーカーを開始できない場合、Workboard はカードをブロックし、
クレームを解除し、実行開始の失敗を記録して、ワーカーログ行を追加します。このログは
ダッシュボード、CLI JSON、エージェントツール、カード診断で確認できます。

### エントリーポイント

- ダッシュボードのディスパッチ操作
- `openclaw workboard dispatch`
- コマンド対応チャンネルでの `/workboard dispatch`

Gateway が利用可能な場合、3 つすべてが Gateway のサブエージェントランタイムを使用します。
CLI にはオペレーター向けのフォールバックが 1 つあります。Gateway 呼び出しが
接続／利用不可エラー（または古い Gateway の `unknown method` エラー）で失敗し、
明示的な `--url`／`--token` の対象がなく、設定済みのリモート Gateway
（`OPENCLAW_GATEWAY_URL` または `gateway.mode: remote`）も適用されない場合、
CLI はローカルの SQLite 状態に対してデータ処理のみのディスパッチを実行します。
依存関係の昇格、期限切れクレームのクリーンアップ、タイムアウトした実行のブロックは
可能ですが、ワーカーは開始できません。到達可能な Gateway からの認証、権限、
検証の失敗は利用不可として扱われず、コマンドエラーとして表示されます。明示的な
`--url`／`--token` の対象が指定されている場合は、Gateway のいかなる失敗も
同様にコマンドエラーになります。

ボードメタデータでは、`autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee`、`orchestratorProfile` を設定できます。OpenClaw はこの意図を
記録してワーカーコンテキストで公開しますが、実際の仕様化／分解は引き続き通常の
Workboard ツールを通じて実行されます。

## CLI とスラッシュコマンド

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` のテキスト出力では、デフォルトでアーカイブ済みカードを非表示にします
（`--include-archived` で上書きできます）。`--json` では常にアーカイブ済みカードを含め、
既存のスクリプトで使用される完全カード契約に合わせます。`show` は一意に特定できる
ID プレフィックスを受け付けます。`list`、`create`、`show` は常にローカルの Plugin 状態を
直接読み書きします。実行中の Gateway を呼び出すのは `dispatch` のみで、
前述のフォールバックが適用されます。

すべてのフラグ、JSON 出力、Gateway のフォールバック動作、ID プレフィックスの処理、
ディスパッチ選択ルール、トラブルシューティングについては、
[Workboard CLI](/ja-JP/cli/workboard) を参照してください。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、
`/workboard dispatch` は CLI と同じ動作をします。list と show は、認可された
すべてのコマンド送信者が実行できる読み取り操作です。create と dispatch には、
チャット画面では所有者ステータスが必要であり、Gateway クライアントでは
`operator.write`／`operator.admin` が必要です。

## セッションライフサイクルの同期

カードは、既存のダッシュボードセッション、またはカードから作業を開始したときに作成されるセッションにリンクできます。リンクされたカードには、セッションのライフサイクル（実行中、古い状態、リンク済みアイドル、完了、失敗、欠落）がインラインで表示されます。Sessions タブの **Add to Workboard** を使って既存のセッションを取り込むこともできます。カードはそのセッションにリンクされ、セッションラベルまたは最近のユーザープロンプトをタイトルとして使用し、利用可能な場合は最近のユーザープロンプトと最新のアシスタント応答からメモを初期設定します。

リンクされたセッションが見つからなくなっても、カードはコンテキスト保持のためリンクされたままとなり、新しいセッションで再開するための開始コントロールも引き続き表示されます。アクティブなリンク済みセッションから最近のアクティビティが報告されなくなると、Workboard はカードを `stale` としてマークし、ライフサイクルによって解除されるまでその状態をメタデータとして保存します。

カードがアクティブな作業状態にある間、Workboard はリンクされたセッションに追従します。

| リンクされたセッションの状態        | カードのステータス |
| ------------------------------------- | ----------- |
| アクティブ                            | `running`   |
| 完了                                  | `review`    |
| 失敗、強制終了、タイムアウト、中止    | `blocked`   |

**手動のレビューステータスが優先されます。** カードを `review`、`blocked`、または `done` に移動すると、そのカードを `todo` または `running` に戻すまで自動同期が停止します。

カードを開始すると通常の Gateway セッションが使用されます。Workboard が保存するのはカードのメタデータとリンクのみです。会話のトランスクリプト、モデルの選択、実行ライフサイクルは、通常のセッションシステムが引き続き管理します。実行中のリンク済みカードで **Stop** を使うと、アクティブな実行を中止できます。Workboard はそのカードを `blocked` としてマークし、フォローアップできるよう表示したままにします。

新しいカードは Workboard テンプレート（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）から開始できます。テンプレートはタイトル、メモ、ラベル、優先度を事前入力し、テンプレート ID はカードのメタデータとして保存されます。

## ダッシュボードのワークフロー

1. Control UI で Workboard タブを開きます。
2. タイトル、メモ、優先度、ラベル、任意のエージェント、任意のリンク先セッションを指定してカードを作成します。または Sessions を開き、既存のセッションで **Add to Workboard** を選択します。
3. カードを列間でドラッグするか、コンパクトなステータスコントロールにフォーカスして、メニューまたは ArrowLeft/ArrowRight を使用します。
4. カードから作業を開始し、ダッシュボードセッションを作成または再利用します。
5. エージェントが作業している間、カードからリンクされたセッションを開きます。
6. ライフサイクル同期によって実行中の作業が `review`/`blocked` に移動するのを待ち、承認後にカードを手動で `done` に移動します。

## 診断

診断はローカルのカードメタデータから算出されます。組み込みチェックでは次の状態が検出されます。

| 種類                        | 条件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 担当者が割り当てられた `todo`/`backlog`/`ready` カードが1時間以上更新されていない。             |
| `running_without_heartbeat` | `running` カードで、クレームの Heartbeat または実行更新が20分以上ない。 |
| `blocked_too_long`          | `blocked` カードが24時間以上更新されていない。                                   |
| `repeated_failures`         | カードで追跡されている失敗回数が2回以上に達している。                                |
| `missing_proof`             | `done` カードに証明、成果物、添付ファイルがない。                          |
| `orphaned_session`          | `running` カードに `sessionKey` はあるが、`execution` メタデータがない。                |

## 権限

Gateway RPC メソッドは `workboard.*` 配下にあります。

| スコープ            | メソッド                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、添付ファイルの一覧取得、通知イベントの読み取り、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、作成/更新/移動/削除/コメント/リンク/依存関係リンク/証明/成果物、添付ファイルの追加/削除、ワーカーログ、プロトコル違反、クレーム/Heartbeat/解放/昇格/再割り当て/再クレーム/完了/ブロック/ブロック解除、`cards.dispatch`、`cards.bulk`、アーカイブ、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知の購読/削除/進行 |

`operator.admin` を必要とする RPC メソッドはありません。読み取り専用のオペレーターアクセスで接続されたブラウザはボードを確認できますが、カードを変更することはできません。

## ストレージ

Workboard は、OpenClaw の状態ディレクトリ内にある Plugin 所有のリレーショナル SQLite データベースに永続データを保存します。ボード、カード、ラベル、ライフサイクルイベント、実行試行、コメント、依存関係リンク、証明、成果物参照、添付ファイルのメタデータと BLOB、診断、通知、ワーカーログ、プロトコル状態、購読はすべて Workboard のテーブルに保存され、Plugin のキー・バリューエントリには保存されません。カードのエクスポートでは、添付ファイルの BLOB 内容をインライン化せずに、ボードの経緯が保持されます。

`.28` リリースで Workboard を使用していた環境では、`openclaw doctor --fix` を実行すると、リリース済みの旧 Plugin 状態名前空間（`workboard.cards`、`workboard.boards`、`workboard.notify`、および存在する場合は `workboard.attachments`）をリレーショナルデータベースへ移行できます。

## トラブルシューティング

**タブに Workboard が利用できないと表示される**

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` が設定されている場合は、そこに `workboard` を追加します。`plugins.deny` に `workboard` が含まれている場合は、Plugin を有効にする前に削除します。

**カードが保存されない**

ブラウザ接続に `operator.write` アクセスがあることを確認します。読み取り専用のオペレーターセッションではカードを一覧表示できますが、作成、編集、移動、削除はできません。

**カードを開始しても想定したセッションが開かない**

カードのエージェント ID とリンクされたセッションを確認し、Sessions または Chat を開いて実際の実行状態を確認します。

**ディスパッチでワーカーが開始されない**

アクティブなクレームがない `ready` カードが少なくとも1件あることを確認します。

```bash
openclaw workboard list --status ready
```

CLI がデータのみのディスパッチを報告する場合は、Gateway を開始または再起動してから再試行します。データのみのディスパッチはローカルのボード状態を更新しますが、サブエージェントのワーカー実行は開始できません。同じ所有者またはエージェントの別のカードがすでに実行中かレビュー待ちの場合も、カードがスキップされることがあります。同じ所有者についてさらにディスパッチする前に、そのアクティブな作業を完了、ブロック、または解放してください。

## 関連項目

- [Control UI](/ja-JP/web/control-ui)
- [Workboard CLI](/ja-JP/cli/workboard)
- [Plugins](/ja-JP/tools/plugin)
- [Plugin の管理](/ja-JP/plugins/manage-plugins)
- [セッション](/ja-JP/concepts/session)

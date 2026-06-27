---
read_when:
    - Control UI に Kanban 形式の作業ボードが必要である
    - バンドルされた Workboard プラグインを有効化または無効化しています
    - 外部のプロジェクトマネージャーを使わずに、計画されたエージェント作業を追跡したい
summary: エージェント所有カードとセッション引き継ぎ用の任意のダッシュボードワークボード
title: Workboard plugin
x-i18n:
    generated_at: "2026-06-27T12:37:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Plugin は、[Control UI](/ja-JP/web/control-ui) に任意の Kanban スタイルのボードを追加します。エージェント単位の作業カードを集め、エージェントに割り当て、リンクされたバックグラウンドタスク、実行、ダッシュボードセッションを 1 枚のカードから追跡するために使います。

Workboard は意図的に小さく作られています。OpenClaw Gateway のローカル運用作業を追跡するものであり、GitHub Issues、Linear、Jira、その他のチーム向けプロジェクト管理システムの代替ではありません。

## デフォルト状態

Workboard はバンドルされた Plugin であり、Plugin 設定で有効にしない限りデフォルトでは無効です。

次のコマンドで有効にします。

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

次にダッシュボードを開きます。

```bash
openclaw dashboard
```

Workboard タブがダッシュボードのナビゲーションに表示されます。タブが見えていても、Plugin が無効になっているか、`plugins.allow` / `plugins.deny` によってブロックされている場合、ビューにはローカルカードデータではなく Plugin 利用不可の状態が表示されます。

## カードに含まれる内容

各カードには次が保存されます。

- タイトルとメモ
- ステータス: `triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、
  `review`、`blocked`、または `done`
- 優先度: `low`、`normal`、`high`、または `urgent`
- ラベル
- 任意のエージェント id
- 任意のリンクされたタスク、実行、セッション、またはソース URL
- カードから開始された Codex または Claude 実行の任意の実行メタデータ
- 試行、コメント、リンク、証拠、アーティファクト、自動化、
  添付、ワーカーログ、ワーカープロトコル状態、クレーム、診断、
  通知、テンプレート、アーカイブ状態、古いセッション検出のコンパクトなメタデータ
- 作成、移動、リンク、クレーム、Heartbeat、
  試行、証拠、アーティファクト、診断、通知、ディスパッチ、アーカイブ、古い状態、
  またはエージェント更新などの最近のカードイベント

カードは Plugin の Gateway 状態に保存されます。カードは Gateway 状態ディレクトリにローカルであり、その Gateway の他の OpenClaw 状態と一緒に移動します。

Workboard はカードごとのコンパクトなメタデータを保持するため、オペレーターはリンクされたセッションを開かなくても、カードがボード上でどのように移動したかを確認できます。イベント、試行サマリー、証拠スニペット、関連リンク、コメント、アーカイブマーカー、古いセッションマーカーは意図的にローカルメタデータです。これらはセッショントランスクリプトや GitHub issue 履歴を置き換えるものではありません。

## カード実行とタスク

リンクされていないカードは、カードから作業を開始できます。自律的な開始では Gateway のタスク追跡付きエージェント実行パスを使い、その後 Workboard が結果のタスク、実行 id、セッションキーをカードへリンクし直します。開始では Gateway に設定されたデフォルトのエージェントとモデルを使います。Codex と Claude のアクションは、任意の明示的なモデル選択です。

- Run Codex または Run Claude は、タスクに裏付けられたエージェント実行を開始し、カードプロンプトを送信して、カードを `running` にマークします。
- Open Codex または Open Claude は、カードプロンプトの送信やカードの移動をせずに、リンクされたダッシュボードセッションを作成します。これにより、ボードに接続したまま手動で作業できます。

実行メタデータには、選択されたエンジン、モード、モデル参照、セッションキー、実行 id、利用可能な場合のタスク id、ライフサイクルステータスがカードに保存されます。Codex 実行は `openai/gpt-5.5` を使い、Claude 実行は `anthropic/claude-sonnet-4-6` を使います。

リンクされた各実行は、同じカードレコードにも試行サマリーを記録します。試行サマリーは、エンジン、モード、モデル、実行 id、タイムスタンプ、ステータス、累積失敗回数を保持するため、繰り返し発生する失敗がボード上で見えるままになります。

ダッシュボードは Gateway タスク台帳からタスクステータスを更新し、タスク id、実行 id、またはリンクされたセッションキーによってタスクをカードへ対応付けます。タスクがキューに入っているか実行中の場合、カードライフサイクルにはアクティブなタスク状態が表示されます。タスクが完了、失敗、タイムアウト、またはキャンセルされた場合、カードライフサイクルはリンクされたセッションと同じライフサイクル同期を使って review または blocked ステータスへ移行します。

## エージェント連携

Workboard は、ボードを意識したワークフロー向けに任意のエージェントツールも公開します。

- `workboard_list` は、任意のボードフィルターとともに、クレーム状態と診断状態を含むコンパクトなカード一覧を表示します。
- `workboard_read` は、1 枚のカードと、メモ、試行、コメント、リンク、証拠、アーティファクト、親の結果、最近の担当者作業、アクティブ診断から構築された制限付きワーカーコンテキストを返します。
- `workboard_create` は、任意の親、テナント、Skills、
  ボード、ワークスペースメタデータ、冪等性キー、ランタイム制限、リトライ予算を持つカードを作成します。
- `workboard_link` は、親カードを子カードにリンクします。すべての親が `done` に到達するまで、子は `todo` のままです。その後、ディスパッチの昇格によって `ready` に移動します。
- `workboard_claim` は、呼び出し元エージェントのためにカードをクレームし、backlog、todo、または ready のカードを `running` に移動します。
- `workboard_heartbeat` は、長時間の実行中にクレーム Heartbeat を更新します。
- `workboard_release` は、完了、一時停止、または引き継ぎ後にクレームを解放し、カードを次のステータスへ移動できます。
- `workboard_complete` と `workboard_block` は、最終サマリー、証拠、アーティファクト、作成カードマニフェスト、ブロッカー理由のための構造化ライフサイクルツールです。作成カードマニフェストは、完了したカードへリンクし返されたカードを参照する必要があります。これにより、実体のない子カードがサマリーに入るのを防ぎます。
- `workboard_attachment_add`、`workboard_attachment_read`、および
  `workboard_attachment_delete` は、小さなカード添付を Plugin SQLite
  状態に保存し、カード上でインデックス化し、ワーカーコンテキストで公開します。
- `workboard_worker_log` と `workboard_protocol_violation` は、ワーカーログ行を記録し、自動ワーカーが `workboard_complete` または `workboard_block` を呼び出さずに停止した場合にカードをブロックします。
- `workboard_board_create`、`workboard_board_archive`、および
  `workboard_board_delete` は、表示名、説明、アーカイブ状態、デフォルトワークスペースなどの永続化されたボードメタデータを管理します。
- `workboard_runs` は、カードに保存された永続化済みの実行試行履歴を返します。
- `workboard_specify` は、粗い triage または backlog カードを明確化された `todo` カードに変換し、仕様サマリーをカードに記録します。
- `workboard_decompose` は、親オーケストレーションカードをリンクされた子に展開し、ボードとテナントメタデータを継承し、作成カードマニフェスト付きで親を完了できます。
- `workboard_notify_subscribe`、`workboard_notify_list`、
  `workboard_notify_events`、`workboard_notify_advance`、および
  `workboard_notify_unsubscribe` は、Plugin 状態内の通知サブスクリプションを管理します。イベント読み取りは再生しても安全です。advance ツールは永続カーソルを移動するため、呼び出し元は完了、失敗、または古いカードイベントを失ったり二重読み取りしたりせずに再開できます。
- `workboard_boards`、`workboard_stats`、`workboard_promote`、
  `workboard_reassign`、`workboard_reclaim`、`workboard_comment`、
  `workboard_proof`、`workboard_unblock`、および `workboard_dispatch` により、エージェントはボード名前空間の検査、キュー統計の表示、停止した作業の復旧、引き継ぎメモの追加、証拠またはアーティファクト参照の添付、ブロックされた作業の `todo` への戻し、依存関係の昇格または古いクレームのクリーンアップの促進ができます。

クレーム済みカードは、呼び出し元が `workboard_claim` によって返されたクレームトークンを持っていない限り、他のエージェントからのエージェントツール変更を拒否します。ダッシュボードオペレーターは引き続き通常の Gateway RPC サーフェスを使い、カードを復旧または再割り当てできます。

Workboard は、OpenClaw 状態ディレクトリ配下の Plugin 所有のリレーショナル SQLite データベースに永続的なボードデータを保存します。ボード、カード、ラベル、ライフサイクルイベント、実行試行、コメント、依存関係リンク、証拠、アーティファクト参照、添付メタデータと blob、診断、通知、ワーカーログ、プロトコル状態、サブスクリプションは、Plugin キーバリューエントリではなく Workboard テーブルに永続化されます。カードエクスポートでは、添付 blob の内容をインライン化せずにボードの流れが保持されます。

`.28` リリースで Workboard を使っていたインストールでは、`openclaw doctor --fix` を実行して、出荷済みのレガシー Plugin 状態名前空間
（`workboard.cards`、`workboard.boards`、および `workboard.notify`）をリレーショナルデータベースへ移行できます。レガシーの `workboard.attachments` 名前空間が存在する場合、doctor はそれらの添付 blob も移行します。

Workboard 診断は、ローカルカードメタデータから計算されます。組み込みチェックは、待機時間が長すぎる割り当て済みカード、最近の Heartbeat がない実行中カード、注意が必要な blocked カード、繰り返しの失敗、証拠のない done カード、緩いセッションリンクしか持たない実行中カードにフラグを立てます。

ディスパッチは意図的に Gateway ローカルです。任意のオペレーティングシステムプロセスを生成しません。通常の OpenClaw サブエージェントセッションが引き続き実行を所有します。ディスパッチアクションは、依存関係が ready になったカードを昇格し、ready カードにディスパッチメタデータを記録し、期限切れのクレームまたはタイムアウトした実行をブロックし、ボード設定済みの triage カードをオーケストレーション候補としてマークしてから、少量の ready カードをクレームし、Gateway サブエージェントランタイムを通じてワーカー実行を開始します。割り当て済みカードは `agent:<id>:subagent:workboard-*` ワーカーセッションキーを使い、未割り当てカードはスコープなしの `subagent:workboard-*` キーを使うため、Gateway は引き続き設定済みのデフォルトエージェントを解決します。ワーカーは、制限付きカードコンテキストに加えて、Workboard ツールを通じてカードに Heartbeat し、完了し、またはブロックするために必要なクレームトークンを受け取ります。

### ディスパッチワーカーの選択

各ディスパッチパスは、デフォルトで最大 3 つのワーカーを開始します。Ready カードは優先度、位置、作成時刻の順に並べられ、その後、重複したアクティブ所有を避けるようにフィルターされます。1 回のパスでは、特定の所有者またはエージェントについて 1 枚のカードだけがディスパッチで開始され、ボード上に running または review の作業をすでに持つ所有者はスキップされます。

アーカイブ済みカード、アクティブなクレームを持つカード、`ready` ステータスではないカードは、ワーカー開始の対象として選択されません。古いクレーム、依存関係の昇格、またはタイムアウトのクリーンアップが適用される場合は、ディスパッチのデータ側の処理による影響を受けることがあります。

### ワーカープロンプトとライフサイクル

ワーカープロンプトには、カードタイトル、制限付きのメモとコンテキスト、割り当てられたボード、Workboard ワーカープロトコルが含まれます。また、クレーム所有者とクレームトークンも含まれるため、別のアクターにカードを奪われることなく、ワーカーは `workboard_heartbeat`、`workboard_complete`、または `workboard_block` を呼び出せます。

ワーカーが正常に開始されると、Workboard はセッションキー、実行 id、エンジン、モード、モデルラベル、ステータス、ワーカーログをカードに保存します。セッションキーはボードとカードに対して決定的であるため、繰り返しディスパッチしても無関係なセッションを作成するのではなく、同じワーカーレーンへルーティングされます。

カードがクレームされた後にワーカーを開始できない場合、Workboard はカードをブロックし、クレームをクリアし、実行開始失敗を記録し、ワーカーログ行を追加します。その失敗は、ダッシュボード、CLI JSON、エージェントツール、カード診断で確認できます。

### ディスパッチのエントリポイント

Ready カードのワーカー開始は、次から実行できます。

- ダッシュボードのディスパッチアクション
- `openclaw workboard dispatch`
- コマンド対応チャネル上の `/workboard dispatch`

3 つのエントリポイントはすべて、Gateway が利用可能な場合に Gateway サブエージェントランタイムを使います。CLI には追加のオペレーター向けフォールバックが 1 つあります。Gateway がオフラインであるか Workboard ディスパッチメソッドを公開しておらず、明示的な `--url` または `--token` ターゲットが指定されていない場合、ローカル SQLite 状態に対してデータのみのディスパッチを実行します。このフォールバックは依存関係の昇格、古いクレームのクリーンアップ、タイムアウトした実行のブロックはできますが、ワーカーを開始することはできません。

ボードメタデータには、`autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee`、`orchestratorProfile` などのオーケストレーション設定を含めることができます。OpenClaw はオーケストレーションの意図を記録し、ワーカーコンテキストで公開します。実際の仕様化と分解は、引き続き通常の Workboard ツールを通じて行われます。

## CLI とスラッシュコマンド

Plugin はルート CLI コマンドを登録します。

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` は実行中の Gateway を呼び出すため、worker の起動にはダッシュボードと同じ subagent runtime が使用されます。Gateway が利用できない場合は、dependency promotion、stale-claim cleanup、timeout blocking を引き続き実行できるように、data-only dispatch にフォールバックします。認証、権限、検証の失敗は引き続きコマンドエラーとして表示され、明示的な `--url` または `--token` ターゲットの失敗も同様です。

`/workboard` スラッシュコマンドは、同じコンパクトな operator パスをサポートします:
`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、および
`/workboard dispatch`。list と show は、許可されたコマンド送信者向けの読み取り操作です。create と dispatch には、チャットサーフェス上の owner status、または `operator.write` か `operator.admin` を持つ Gateway クライアントが必要です。

コマンドフラグ、JSON 出力、Gateway フォールバック動作、曖昧さのない ID プレフィックス処理、dispatch 選択ルール、トラブルシューティングについては、[Workboard CLI](/ja-JP/cli/workboard) を参照してください。

## セッションライフサイクル同期

カードは、既存のダッシュボードセッション、またはカードから作業を開始したときに作成されるセッションにリンクできます。リンクされたカードには、セッションライフサイクルがインラインで表示されます:
実行中、stale、linked idle、完了、失敗、または missing。

リンクされたセッションが見つからない場合、カードはコンテキストのためにリンクされたままになり、新しいダッシュボードセッションで作業を再開できるように開始コントロールも引き続き表示されます。アクティブなリンク済みセッションが最近のアクティビティを報告しなくなると、Workboard はカードを stale としてマークし、ライフサイクルがそれをクリアするまで、そのマーカーをカードメタデータとして保存します。

Sessions タブから既存のダッシュボードセッションを「Workboard に追加」で取り込むこともできます。カードはそのセッションにリンクされ、セッションラベルまたは最近のユーザープロンプトをタイトルとして使用し、チャット履歴が利用可能な場合は、最近のユーザープロンプトと最新の assistant 応答からメモを初期化します。

カードがまだアクティブな作業状態にある間、Workboard はリンク済みセッションに追従します:

- アクティブなリンク済みセッション -> `running`
- 完了したリンク済みセッション -> `review`
- 失敗、kill、タイムアウト、または中止されたリンク済みセッション -> `blocked`

手動の review 状態が優先されます。カードを `review`、`blocked`、または `done` に移動すると、そのカードを `todo` または `running` に戻すまで、Workboard はそのカードの自動移動を停止します。

## ダッシュボードワークフロー

1. Control UI で Workboard タブを開きます。
2. タイトル、メモ、優先度、ラベル、任意のエージェント、任意のリンク済みセッションを指定してカードを作成します。
3. または Sessions を開き、既存のセッションに対して「Workboard に追加」を選択します。
4. カラム間でカードをドラッグするか、カード上のコンパクトなステータスコントロールにフォーカスし、そのメニューまたは ArrowLeft/ArrowRight を使用します。
5. カードから作業を開始して、ダッシュボードセッションを作成または再利用します。
6. エージェントが作業している間、カードからリンク済みセッションを開きます。
7. ライフサイクル同期により実行中の作業を review または blocked に移動させ、承認されたらカードを手動で done に移動します。

カードの開始には通常の Gateway セッションが使用されます。Workboard Plugin はカードメタデータとリンクのみを保存します。会話トランスクリプト、モデル選択、run ライフサイクルは、通常のセッションシステムが引き続き所有します。

ライブのリンク済みカードで Stop を使用すると、アクティブなセッション run を中止できます。Workboard はそのカードを `blocked` としてマークし、フォローアップ用に見える状態のままにします。

新しいカードは、bugfix、docs、release、PR review、または plugin work 用の Workboard テンプレートから開始できます。テンプレートはタイトル、メモ、ラベル、優先度を事前入力し、選択されたテンプレート ID はカードメタデータとして保存されます。

## 権限

Plugin は `workboard.*` 名前空間の下に Gateway RPC メソッドを登録します:

- `workboard.cards.list` には `operator.read` が必要です
- `workboard.cards.export` には `operator.read` が必要です
- `workboard.cards.diagnostics` には `operator.read` が必要です
- `workboard.cards.diagnostics.refresh` には `operator.write` が必要です
- attachment list/get と notification event reads には `operator.read` が必要です
- notification cursor advancement には `operator.write` が必要です
- create、update、move、delete、comment、link、dependency link、proof、artifact、
  attachment add/delete、worker log、protocol violation、claim、heartbeat、
  release、complete、block、unblock、dispatch、bulk、archive メソッドには
  `operator.write` が必要です

読み取り専用の operator アクセスで接続されたブラウザーはボードを確認できますが、カードを変更することはできません。

## 設定

現在、Workboard には Plugin 固有の設定はありません。標準の Plugin エントリで有効化または無効化します:

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

再び無効化するには、次を使用します:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## トラブルシューティング

### タブに Workboard が利用できないと表示される

Plugin ポリシーを確認します:

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` が設定されている場合は、その allowlist に `workboard` を追加します。
`plugins.deny` に `workboard` が含まれている場合は、Plugin を有効化する前に削除します。

### カードが保存されない

ブラウザー接続に `operator.write` アクセスがあることを確認します。読み取り専用の operator セッションはカードを一覧表示できますが、作成、編集、移動、削除はできません。

### カードを開始しても想定したセッションが開かない

Workboard は通常のダッシュボードセッションへのリンクを作成します。カードの agent id とリンク済みセッションを確認し、その後 Sessions または Chat ビューを開いて実際の run 状態を確認します。

### dispatch で worker が開始されない

アクティブな claim のない `ready` カードが少なくとも 1 つあることを確認します:

```bash
openclaw workboard list --status ready
```

CLI が data-only dispatch を報告する場合は、Gateway を開始または再起動して再試行します。data-only dispatch はローカルボード状態を更新しますが、subagent worker run を開始することはできません。

同じ owner または agent の別のカードがすでに実行中または review 待ちの場合も、カードはスキップされることがあります。同じ owner に対してさらに作業を dispatch する前に、そのアクティブな作業を complete、block、または release してください。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Workboard CLI](/ja-JP/cli/workboard)
- [Plugin](/ja-JP/tools/plugin)
- [Plugin を管理](/ja-JP/plugins/manage-plugins)
- [セッション](/ja-JP/concepts/session)

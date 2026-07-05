---
read_when:
    - mac メニュー UI またはステータスロジックの調整
summary: メニューバーのステータスロジックとユーザーに表示される内容
title: メニューバー
x-i18n:
    generated_at: "2026-07-05T11:35:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 表示内容

- 現在のエージェント作業状態は、メニューバーアイコンとメニューの最初のステータス行に表示されます。
- 作業がアクティブな間、ヘルスステータスは非表示になります。すべてのセッションがアイドルになると再び表示されます。
- ルートの「コンテキスト」項目は、ルートメニュー内で展開する代わりに、最近のセッションを含むサブメニューを開きます。
- ルートメニューの「ノード」ブロックには、クライアントやプレゼンス項目ではなく、ペアリング済みの**デバイス**のみが一覧表示されます（`node.list` 由来）。
- プロバイダー使用状況スナップショットが利用可能な場合、コンテキストの下にルートの「使用状況」セクションが表示され、利用可能な場合はその後にコスト詳細が続きます。

## 状態モデル

- ソース: `WorkActivityStore`（`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`）。
- イベントは `runId` を持つ `ControlAgentEvent` として到着します。ハンドラー（`ControlChannel.routeWorkActivity`）はイベントペイロードから `sessionKey` を読み取り、存在しない場合は `"main"` をデフォルトにします。
- 優先順位: メインセッション（デフォルトでは `sessionKey == "main"`）が常に優先されます。メインがアクティブな場合、その状態が即座に表示されます。メインがアイドルの場合は、直近でアクティブだった非メインセッションが代わりに表示されます。ストアはアクティビティの途中で切り替わりません。現在のセッションがアイドルになるか、メインがアクティブになったときだけ切り替わります。
- アクティビティの種類:
  - `job`: 高レベルのコマンド実行（`state: started|streaming|done|error|...`）。
  - `tool`: `name` と任意の `meta`/`args` を持つ `phase: start|result`。

## IconState 列挙型（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（デバッグオーバーライド）

### ActivityKind -> バッジシンボル

`ActivityKind` は `ToolKind`（`bash`、`read`、`write`、`edit`、`attach`、`other`）または単独の `job` をラップします。それぞれが、生き物アイコンの上に描画される SF Symbol バッジ（`IconState.badgeSymbolName`）にマッピングされます。

| 種類            | シンボル                           |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### ビジュアルマッピング

- `idle`: 通常の生き物、バッジなし。
- `workingMain`: シンボル付きバッジ、完全なティント（`.primary` の強調）、脚の「作業中」アニメーション。
- `workingOther`: シンボル付きバッジ、抑えたティント（`.secondary` の強調）、走り回る動きなし。
- `overridden`: 実際のアクティビティに関係なく、選択されたシンボル/ティントを使用します。

## コンテキストサブメニュー

- ルートメニューにはセッション数/状態付きの「コンテキスト」行が 1 つ表示され、サブメニュー（`MenuSessionsInjector`）を開きます。
- サブメニューヘッダーには、過去 24 時間のアクティブセッション数が表示されます。
- 各セッション行は、トークンバー、経過時間、プレビュー、thinking/verbose トグル、リセット、compact、削除アクションを保持します。
- 読み込み中、切断、セッション読み込みエラーのメッセージは、コンテキストサブメニュー内に表示されます。
- 使用量とコストのセクションはコンテキストの下のルートレベルに残るため、サブメニューを開かなくても一目で確認できます。

## ステータス行のテキスト（メニュー）

- 作業がアクティブな間: `<Session role> · <activity label>`（`MenuContentView` 内の `"\(roleLabel) · \(activity.label)"`）。ここでロールラベルは `Main` または `Other` です。
- アイドル時: ヘルス概要にフォールバックします。

## イベント取り込み

- ソース: control-channel の `agent` イベント。`ControlChannel.routeWorkActivity(from:)` によってルーティングされます。
- 解析されるフィールド:
  - 開始/停止用の `data.state` を持つ `stream: "job"`。
  - `data.phase`、`data.name`、任意の `data.meta`/`data.args` を持つ `stream: "tool"`。
- ツールラベルは `ToolDisplayRegistry.resolve(name:args:meta:)` から取得されます。解決できない名前は生のツール名にフォールバックします。

## デバッグ上書き

- 設定 > デバッグ > 「アイコン上書き」ピッカー:
  - `System (auto)`（デフォルト）
  - `Working: main` / `Working: other`（ツール種別ごと: bash、read、write、edit、other）
  - `Idle`
- `UserDefaults` キー `openclaw.iconOverride` に保存され、`IconState.overridden` にマッピングされます。

## テストチェックリスト

- メインセッションジョブをトリガーする: アイコンが即座に切り替わり、ステータス行にメインラベルが表示されます。
- メインがアイドルの間に非メインセッションジョブをトリガーする: アイコン/ステータスに非メインセッションが表示され、完了するまで安定したままになります。
- 別のセッションがアクティブな間にメインを開始する: アイコンが即座にメインへ切り替わります。
- 短時間にツールが連続する: バッジはちらつきません（完了したツールをクリアする前の 2 秒の猶予ウィンドウ、`WorkActivityStore.toolResultGrace`）。
- すべてのセッションがアイドルになると、ヘルス行が再表示されます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [メニューバーアイコン](/ja-JP/platforms/mac/icon)

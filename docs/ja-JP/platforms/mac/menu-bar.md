---
read_when:
    - macOSメニューのUIまたはステータスロジックの調整
summary: メニューバーのステータス判定ロジックとユーザーに表示される内容
title: メニューバー
x-i18n:
    generated_at: "2026-07-11T22:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 表示内容

- 現在のエージェントの作業状態は、メニューバーアイコンとメニューの最初のステータス行に表示されます。
- 作業中はヘルスステータスが非表示になり、すべてのセッションがアイドル状態になると再表示されます。
- ルートの「コンテキスト」項目を開くと、ルートメニュー内で展開する代わりに、最近のセッションを含むサブメニューが表示されます。
- ルートメニューの「Node」ブロックには、クライアントやプレゼンスのエントリではなく、ペアリング済みの**デバイス**のみ（`node.list` から取得）が一覧表示されます。
- プロバイダーの使用量スナップショットが利用可能な場合、ルートの「使用量」セクションが「コンテキスト」の下に表示され、コストの詳細が利用可能な場合はその後に続きます。

## 状態モデル

- ソース: `WorkActivityStore`（`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`）。
- イベントは `runId` を持つ `ControlAgentEvent` として到着します。ハンドラー（`ControlChannel.routeWorkActivity`）はイベントペイロードから `sessionKey` を読み取り、存在しない場合はデフォルトで `"main"` を使用します。
- 優先順位: メインセッション（デフォルトでは `sessionKey == "main"`）が常に優先されます。メインがアクティブな場合、その状態が即座に表示されます。メインがアイドル状態の場合は、最後にアクティブだったメイン以外のセッションが代わりに表示されます。ストアはアクティビティの途中では切り替わらず、現在のセッションがアイドル状態になるか、メインがアクティブになった場合にのみ切り替わります。
- アクティビティの種類:
  - `job`: 上位レベルのコマンド実行（`state: started|streaming|done|error|...`）。
  - `tool`: `name` と、任意の `meta`/`args` を持つ `phase: start|result`。

## IconState 列挙型（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（デバッグ用オーバーライド）

### ActivityKind -> バッジシンボル

`ActivityKind` は、`ToolKind`（`bash`、`read`、`write`、`edit`、`attach`、`other`）または単独の `job` をラップします。それぞれは、クリッターアイコンの上に描画される SF Symbols のバッジ（`IconState.badgeSymbolName`）に対応します。

| 種類            | シンボル                           |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### 視覚的な対応

- `idle`: 通常のクリッターで、バッジはありません。
- `workingMain`: シンボル付きのバッジ、通常の濃さ（`.primary` の強調度）、脚の「作業中」アニメーション。
- `workingOther`: シンボル付きのバッジ、抑えた濃さ（`.secondary` の強調度）、走り回るアニメーションなし。
- `overridden`: 実際のアクティビティに関係なく、選択したシンボルと色合いを使用します。

## コンテキストのサブメニュー

- ルートメニューにはセッション数とステータスを示す「コンテキスト」行が1つ表示され、そこからサブメニュー（`MenuSessionsInjector`）が開きます。
- サブメニューのヘッダーには、過去24時間のアクティブなセッション数が表示されます。
- 各セッション行には、トークンバー、経過時間、プレビュー、思考表示と詳細表示の切り替え、リセット、圧縮、削除の各操作が引き続き表示されます。
- 読み込み中、切断状態、セッション読み込みエラーのメッセージは、コンテキストのサブメニュー内に表示されます。
- 使用量とコストのセクションはコンテキストの下のルート階層に残るため、サブメニューを開かなくてもひと目で確認できます。

## ステータス行のテキスト（メニュー）

- 作業中: `<Session role> · <activity label>`（`MenuContentView` では `"\(roleLabel) · \(activity.label)"`）。ロールラベルは `Main` または `Other`。
- アイドル時: ヘルス概要にフォールバックします。

## イベントの取り込み

- ソース: コントロールチャネルの `agent` イベント。`ControlChannel.routeWorkActivity(from:)` によってルーティングされます。
- 解析されるフィールド:
  - 開始/停止を示す `data.state` を持つ `stream: "job"`。
  - `data.phase`、`data.name`、任意の `data.meta`/`data.args` を持つ `stream: "tool"`。
- ツールのラベルは `ToolDisplayRegistry.resolve(name:args:meta:)` から取得されます。解決できない名前の場合は、生のツール名にフォールバックします。

## デバッグオーバーライド

- Settings > Debug > "Icon override" ピッカー：
  - `System (auto)`（デフォルト）
  - `Working: main` / `Working: other`（ツール種別ごと：bash、読み取り、書き込み、編集、その他）
  - `Idle`
- `UserDefaults` のキー `openclaw.iconOverride` に保存され、`IconState.overridden` にマッピングされます。

## テストチェックリスト

- メインセッションのジョブをトリガーする：アイコンが即座に切り替わり、ステータス行にメインのラベルが表示される。
- メインがアイドル中に非メインセッションのジョブをトリガーする：アイコンとステータスに非メインセッションが表示され、完了するまで安定した状態を維持する。
- 別のセッションがアクティブな間にメインを開始する：アイコンが即座にメインへ切り替わる。
- ツールを短時間に連続実行する：バッジがちらつかない（完了したツールをクリアする前に 2 秒の猶予時間、`WorkActivityStore.toolResultGrace`）。
- すべてのセッションがアイドル状態になると、ヘルス行が再表示される。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [メニューバーアイコン](/ja-JP/platforms/mac/icon)

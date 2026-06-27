---
read_when:
    - Mac メニューのユーザーインターフェイスまたはステータスロジックの調整
summary: メニューバーのステータスロジックとユーザーに表示される内容
title: メニューバー
x-i18n:
    generated_at: "2026-05-06T05:12:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 表示内容

- 現在のエージェント作業状態を、メニューバーアイコンとメニューの最初のステータス行に表示します。
- 作業がアクティブな間はヘルスステータスを非表示にし、すべてのセッションがアイドルになると再表示します。
- ルートの「コンテキスト」サブメニューには、最近のセッションをルートメニュー内で直接展開する代わりに格納します。
- ルートメニューの「ノード」ブロックには **デバイス** のみ（`node.list` 経由のペアリング済みノード）を表示し、クライアント/プレゼンス項目は表示しません。
- プロバイダー使用状況のスナップショットが利用可能な場合、コンテキストの下にルートの「使用状況」セクションが表示され、利用可能な場合は使用コストの詳細が続きます。

## 状態モデル

- セッション: イベントは `runId`（実行ごと）とペイロード内の `sessionKey` を伴って到着します。「main」セッションはキー `main` です。存在しない場合は、直近に更新されたセッションへフォールバックします。
- 優先順位: main が常に優先されます。main がアクティブな場合、その状態を即座に表示します。main がアイドルの場合、直近でアクティブだった main 以外のセッションを表示します。アクティビティ中に表示を頻繁に切り替えることはありません。現在のセッションがアイドルになるか、main がアクティブになったときだけ切り替えます。
- アクティビティ種別:
  - `job`: 高レベルのコマンド実行（`state: started|streaming|done|error`）。
  - `tool`: `toolName` と `meta/args` を伴う `phase: start|result`。

## IconState enum（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（デバッグオーバーライド）

### ActivityKind → グリフ

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- デフォルト → 🛠️

### 視覚的な対応

- `idle`: 通常の critter。
- `workingMain`: グリフ付きバッジ、フルティント、脚の「作業中」アニメーション。
- `workingOther`: グリフ付きバッジ、控えめなティント、走り回る動きなし。
- `overridden`: アクティビティに関係なく、選択されたグリフ/ティントを使用します。

## コンテキストサブメニュー

- ルートメニューには、セッション数/ステータスを表示してサブメニューを開く「コンテキスト」行が 1 つ表示されます。
- コンテキストサブメニューのヘッダーには、過去 24 時間のアクティブセッション数が表示されます。
- 各セッション行は、トークンバー、経過時間、プレビュー、thinking/verbose、リセット、compact、削除の各アクションを保持します。
- 読み込み中、切断中、セッション読み込みエラーのメッセージは、コンテキストサブメニュー内に表示されます。
- プロバイダー使用状況と使用コストの詳細は、サブメニューを開かなくても一目で確認できるように、コンテキストの下のルートレベルに残ります。

## ステータス行テキスト（メニュー）

- 作業がアクティブな間: `<Session role> · <activity label>`
  - 例: `Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- アイドル時: ヘルス概要へフォールバックします。

## イベント取り込み

- ソース: control-channel の `agent` イベント（`ControlChannel.handleAgentEvent`）。
- 解析されるフィールド:
  - 開始/停止用の `data.state` を伴う `stream: "job"`。
  - `data.phase`、`name`、任意の `meta`/`args` を伴う `stream: "tool"`。
- ラベル:
  - `exec`: `args.command` の最初の行。
  - `read`/`write`: 短縮されたパス。
  - `edit`: パスに加えて、`meta`/diff 件数から推測した変更種別。
  - フォールバック: ツール名。

## デバッグオーバーライド

- 設定 ▸ デバッグ ▸ 「アイコンオーバーライド」ピッカー:
  - `System (auto)`（デフォルト）
  - `Working: main`（ツール種別ごと）
  - `Working: other`（ツール種別ごと）
  - `Idle`
- `@AppStorage("iconOverride")` 経由で保存され、`IconState.overridden` にマッピングされます。

## テストチェックリスト

- main セッションジョブをトリガーする: アイコンが即座に切り替わり、ステータス行に main ラベルが表示されることを確認します。
- main がアイドルの間に main 以外のセッションジョブをトリガーする: アイコン/ステータスが main 以外を表示し、完了するまで安定していることを確認します。
- 他のセッションがアクティブな間に main を開始する: アイコンが即座に main に切り替わります。
- 短時間のツールバースト: バッジがちらつかないことを確認します（ツール結果に対する TTL 猶予）。
- すべてのセッションがアイドルになると、ヘルス行が再表示されます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [メニューバーアイコン](/ja-JP/platforms/mac/icon)

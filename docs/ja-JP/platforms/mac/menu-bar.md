---
read_when:
    - mac メニュー UI やステータスロジックを調整すること
summary: メニューバーのステータスロジックと、ユーザーに表示される内容
title: メニューバー
x-i18n:
    generated_at: "2026-04-24T05:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# メニューバーのステータスロジック

## 何が表示されるか

- 現在のエージェント作業状態を、メニューバーアイコンとメニューの最初のステータス行に表示します。
- 作業中はヘルスステータスは非表示になります。すべてのセッションが idle に戻ると再表示されます。
- メニュー内の「Nodes」ブロックには、**devices** のみが表示されます（`node.list` 経由の paired Node）。client/presence エントリーは表示されません。
- プロバイダー使用量スナップショットが利用可能な場合は、Context の下に「Usage」セクションが表示されます。

## 状態モデル

- セッション: event は `runId`（実行ごと）と payload 内の `sessionKey` とともに到着します。「main」セッションはキー `main` です。存在しない場合は、最後に更新されたセッションにフォールバックします。
- 優先順位: 常に main が優先されます。main がアクティブなら、その状態が即座に表示されます。main が idle の場合は、最後にアクティブだった非 main セッションが表示されます。アクティビティの途中で頻繁に切り替えることはなく、現在のセッションが idle になるか、main がアクティブになったときだけ切り替えます。
- アクティビティ種別:
  - `job`: 高レベルのコマンド実行（`state: started|streaming|done|error`）。
  - `tool`: `toolName` と `meta/args` を伴う `phase: start|result`。

## IconState enum（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（デバッグ上書き）

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- デフォルト → 🛠️

### 視覚的マッピング

- `idle`: 通常の critter。
- `workingMain`: glyph 付きバッジ、フル tint、脚の「working」アニメーション。
- `workingOther`: glyph 付きバッジ、抑えた tint、scurry なし。
- `overridden`: アクティビティに関係なく、選択された glyph/tint を使います。

## ステータス行のテキスト（メニュー）

- 作業中: `<Session role> · <activity label>`
  - 例: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- idle 時: ヘルス要約にフォールバックします。

## Event 取り込み

- ソース: control-channel の `agent` event（`ControlChannel.handleAgentEvent`）。
- 解析されるフィールド:
  - `data.state` を持つ `stream: "job"`（開始/停止用）。
  - `data.phase`, `name`, 任意の `meta`/`args` を持つ `stream: "tool"`。
- ラベル:
  - `exec`: `args.command` の最初の行。
  - `read`/`write`: 短縮されたパス。
  - `edit`: パス + `meta`/diff 数から推定した変更種別。
  - フォールバック: tool 名。

## デバッグ上書き

- Settings ▸ Debug ▸ 「Icon override」 picker:
  - `System (auto)`（デフォルト）
  - `Working: main`（tool 種別ごと）
  - `Working: other`（tool 種別ごと）
  - `Idle`
- `@AppStorage("iconOverride")` で保存され、`IconState.overridden` にマップされます。

## テストチェックリスト

- main セッション job をトリガーする: アイコンが即座に切り替わり、ステータス行に main ラベルが表示されることを確認する。
- main が idle のときに非 main セッション job をトリガーする: アイコン/ステータスに非 main が表示され、完了まで安定していることを確認する。
- 他がアクティブなときに main を開始する: アイコンが即座に main に切り替わること。
- 急速な tool バースト: バッジが点滅しないことを確認する（tool result に対する TTL grace）。
- すべてのセッションが idle になるとヘルス行が再表示されること。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [Menu bar icon](/ja-JP/platforms/mac/icon)

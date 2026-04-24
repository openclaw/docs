---
read_when:
    - プロバイダーの使用状況/クォータ表示機能を接続している場合
    - 使用状況追跡の動作や認証要件を説明する必要がある場合
summary: 使用状況追跡の表示機能と認証情報の要件
title: 使用状況追跡
x-i18n:
    generated_at: "2026-04-24T04:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## 概要

- プロバイダーの使用状況/クォータを、その使用状況エンドポイントから直接取得します。
- 推定コストは使わず、プロバイダーが報告するウィンドウのみを使用します。
- 人間向けのステータス出力は、上流 API が消費済みクォータ、残りクォータ、または生の件数だけを報告する場合でも、`X% left` に正規化されます。
- セッションレベルの `/status` と `session_status` は、ライブセッションスナップショットの情報が少ない場合、最新のトランスクリプト使用状況エントリーにフォールバックできます。このフォールバックは、欠けている token/cache カウンターを補い、アクティブなランタイムモデルラベルを復元でき、セッションメタデータが欠けているか小さい場合には、より大きい prompt 指向の合計を優先します。既存の非ゼロのライブ値がある場合は、そちらが優先されます。

## 表示場所

- チャット内の `/status`: セッショントークン + 推定コスト（API キーのみ）を含む、絵文字付きステータスカード。プロバイダー使用状況は、利用可能な場合、**現在のモデルプロバイダー**について正規化された `X% left` ウィンドウとして表示されます。
- チャット内の `/usage off|tokens|full`: 応答ごとの使用状況フッター（OAuth では token のみ表示）。
- チャット内の `/usage cost`: OpenClaw セッションログから集計されたローカルコストサマリー。
- CLI: `openclaw status --usage` は、プロバイダーごとの完全な内訳を表示します。
- CLI: `openclaw channels list` は、プロバイダー設定とともに同じ使用状況スナップショットを表示します（スキップするには `--no-usage` を使用）。
- macOS メニューバー: Context 配下の「Usage」セクション（利用可能な場合のみ）。

## プロバイダーと認証情報

- **Anthropic (Claude)**: auth profile 内の OAuth トークン。
- **GitHub Copilot**: auth profile 内の OAuth トークン。
- **Gemini CLI**: auth profile 内の OAuth トークン。
  - JSON 使用状況は `stats` にフォールバックします。`stats.cached` は
    `cacheRead` に正規化されます。
- **OpenAI Codex**: auth profile 内の OAuth トークン（存在する場合は accountId を使用）。
- **MiniMax**: API キー、または MiniMax OAuth auth profile。OpenClaw は
  `minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax クォータ
  サーフェスとして扱い、存在する場合は保存済み MiniMax OAuth を優先し、そうでなければ
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` にフォールバックします。
  MiniMax の生の `usage_percent` / `usagePercent` フィールドは**残り**
  クォータを意味するため、OpenClaw は表示前にそれらを反転します。件数ベースのフィールドが存在する場合は、そちらが優先されます。
  - coding-plan のウィンドウラベルは、存在する場合はプロバイダーの hours/minutes フィールドから取得され、それがなければ `start_time` / `end_time` の範囲にフォールバックします。
  - coding-plan エンドポイントが `model_remains` を返す場合、OpenClaw は chat-model エントリーを優先し、明示的な `window_hours` / `window_minutes` フィールドがない場合はタイムスタンプからウィンドウラベルを導出し、plan ラベルにモデル名を含めます。
- **Xiaomi MiMo**: env/config/auth store 経由の API キー（`XIAOMI_API_KEY`）。
- **z.ai**: env/config/auth store 経由の API キー。

使用可能なプロバイダー使用状況認証が解決できない場合、使用状況は非表示になります。プロバイダーは Plugin 固有の使用状況認証ロジックを提供できます。そうでない場合、OpenClaw は auth profile、環境変数、または config から一致する OAuth/API キー認証情報にフォールバックします。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)

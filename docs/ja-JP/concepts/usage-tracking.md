---
read_when:
    - プロバイダーの使用量/クォータ関連画面を組み込んでいる
    - 使用状況追跡の挙動または認証要件を説明する必要がある
summary: 使用状況追跡のサーフェスと認証情報要件
title: 使用状況の追跡
x-i18n:
    generated_at: "2026-05-06T09:04:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 概要

- プロバイダーの使用状況/クォータを、その使用状況エンドポイントから直接取得します。
- 推定コストはありません。プロバイダーが報告したウィンドウのみです。
- 人間が読みやすいステータス出力は、上流 API が消費済みクォータ、残りクォータ、または生のカウントのみを報告する場合でも、`X% left` に正規化されます。
- セッションレベルの `/status` と `session_status` は、ライブセッションのスナップショットがまばらな場合、最新のトランスクリプト使用状況エントリにフォールバックできます。このフォールバックは欠落しているトークン/キャッシュカウンターを埋め、アクティブなランタイムモデルラベルを復元でき、セッションメタデータが欠落しているか小さい場合は、プロンプト指向の大きい合計を優先します。既存のゼロでないライブ値は引き続き優先されます。

## 表示される場所

- チャット内の `/status`: セッショントークン + 推定コスト（APIキーのみ）を含む絵文字の多いステータスカード。プロバイダー使用状況は、利用可能な場合に**現在のモデルプロバイダー**について、正規化された `X% left` ウィンドウとして表示されます。
- チャット内の `/usage off|tokens|full`: 応答ごとの使用状況フッター（OAuth はトークンのみ表示）。
- チャット内の `/usage cost`: OpenClaw セッションログから集計されたローカルコスト概要。
- CLI: `openclaw status --usage` はプロバイダーごとの完全な内訳を出力します。
- CLI: `openclaw channels list` はプロバイダー設定とともに同じ使用状況スナップショットを出力します（スキップするには `--no-usage` を使用）。
- macOS メニューバー: Context 配下の「使用状況」セクション（利用可能な場合のみ）。

## プロバイダー + 認証情報

- **Anthropic (Claude)**: 認証プロファイル内の OAuth トークン。
- **GitHub Copilot**: 認証プロファイル内の OAuth トークン。
- **Gemini CLI**: 認証プロファイル内の OAuth トークン。
  - JSON 使用状況は `stats` にフォールバックします。`stats.cached` は `cacheRead` に正規化されます。
- **OpenAI Codex**: 認証プロファイル内の OAuth トークン（存在する場合は accountId を使用）。
- **MiniMax**: APIキーまたは MiniMax OAuth 認証プロファイル。OpenClaw は `minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax クォータサーフェスとして扱い、保存済みの MiniMax OAuth が存在する場合はそれを優先し、それ以外の場合は `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` にフォールバックします。使用状況ポーリングは、設定されている場合は `models.providers.minimax-portal.baseUrl` または `models.providers.minimax.baseUrl` から Coding Plan ホストを導出し、それ以外の場合は MiniMax CN ホストを使用します。MiniMax の生の `usage_percent` / `usagePercent` フィールドは**残り**クォータを意味するため、OpenClaw は表示前にそれらを反転します。カウントベースのフィールドが存在する場合はそちらが優先されます。
  - Coding-plan ウィンドウラベルは、存在する場合はプロバイダーの時間/分フィールドから取得され、その後 `start_time` / `end_time` の範囲にフォールバックします。
  - coding-plan エンドポイントが `model_remains` を返す場合、OpenClaw はチャットモデルのエントリを優先し、明示的な `window_hours` / `window_minutes` フィールドがない場合はタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- **Xiaomi MiMo**: env/config/auth store 経由の APIキー（`XIAOMI_API_KEY`）。
- **z.ai**: env/config/auth store 経由の APIキー。

使用可能なプロバイダー使用状況の認証情報を解決できない場合、使用状況は非表示になります。プロバイダーは Plugin 固有の使用状況認証ロジックを提供できます。それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth/APIキー認証情報にフォールバックします。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用状況とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)

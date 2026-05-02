---
read_when:
    - プロバイダーの使用量/クォータサーフェスを接続している
    - 使用状況トラッキングの動作または認証要件を説明する必要がある
summary: 使用状況追跡のサーフェスと認証情報の要件
title: 使用状況の追跡
x-i18n:
    generated_at: "2026-05-02T20:46:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 概要

- プロバイダーの usage エンドポイントから使用量/クォータを直接取得します。
- 推定コストはありません。プロバイダーが報告したウィンドウのみを表示します。
- 人間が読めるステータス出力は、上流 API が消費済みクォータ、残りクォータ、または生のカウントのみを報告する場合でも、`X% left` に正規化されます。
- セッションレベルの `/status` と `session_status` は、ライブセッションスナップショットの情報が少ない場合、最新のトランスクリプト使用量エントリにフォールバックできます。このフォールバックは、不足しているトークン/キャッシュカウンターを補完し、アクティブなランタイムモデルラベルを復元でき、セッションメタデータが欠落しているか小さい場合は、プロンプト指向の大きい合計を優先します。既存のゼロでないライブ値が引き続き優先されます。

## 表示される場所

- チャット内の `/status`: セッショントークン + 推定コストを含む絵文字豊富なステータスカード（API キーのみ）。プロバイダー使用量は、利用可能な場合、**現在のモデルプロバイダー**について正規化された `X% left` ウィンドウとして表示されます。
- チャット内の `/usage off|tokens|full`: レスポンスごとの使用量フッター（OAuth はトークンのみを表示）。
- チャット内の `/usage cost`: OpenClaw セッションログから集計したローカルコスト概要。
- CLI: `openclaw status --usage` はプロバイダーごとの完全な内訳を出力します。
- CLI: `openclaw channels list` はプロバイダー設定とともに同じ使用量スナップショットを出力します（スキップするには `--no-usage` を使用）。
- macOS メニューバー: Context 配下の「使用量」セクション（利用可能な場合のみ）。

## プロバイダー + 認証情報

- **Anthropic (Claude)**: 認証プロファイル内の OAuth トークン。
- **GitHub Copilot**: 認証プロファイル内の OAuth トークン。
- **Gemini CLI**: 認証プロファイル内の OAuth トークン。
  - JSON 使用量は `stats` にフォールバックします。`stats.cached` は `cacheRead` に正規化されます。
- **OpenAI Codex**: 認証プロファイル内の OAuth トークン（存在する場合は accountId を使用）。
- **MiniMax**: API キーまたは MiniMax OAuth 認証プロファイル。OpenClaw は `minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax クォータサーフェスとして扱い、保存済みの MiniMax OAuth が存在する場合はそれを優先し、それ以外の場合は `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` にフォールバックします。使用量ポーリングは、設定されている場合は `models.providers.minimax-portal.baseUrl` または `models.providers.minimax.baseUrl` から Coding Plan ホストを導出し、それ以外の場合は MiniMax CN ホストを使用します。MiniMax の生の `usage_percent` / `usagePercent` フィールドは**残り**クォータを意味するため、OpenClaw は表示前にそれらを反転します。カウントベースのフィールドが存在する場合は、それらが優先されます。
  - Coding Plan のウィンドウラベルは、存在する場合はプロバイダーの時間/分フィールドから取得し、その後 `start_time` / `end_time` の期間にフォールバックします。
  - Coding Plan エンドポイントが `model_remains` を返す場合、OpenClaw はチャットモデルのエントリを優先し、明示的な `window_hours` / `window_minutes` フィールドがない場合はタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- **Xiaomi MiMo**: env/config/auth ストア経由の API キー（`XIAOMI_API_KEY`）。
- **z.ai**: env/config/auth ストア経由の API キー。

使用可能なプロバイダー使用量認証を解決できない場合、使用量は非表示になります。プロバイダーは Plugin 固有の使用量認証ロジックを提供できます。それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth/API キー認証情報にフォールバックします。

## 関連情報

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)

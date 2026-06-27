---
read_when:
    - メニューバーアイコンの動作を変更する
summary: macOS における OpenClaw のメニューバーアイコンの状態とアニメーション
title: メニューバーアイコン
x-i18n:
    generated_at: "2026-05-06T09:07:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# メニューバーアイコンの状態

著者: steipete · 更新日: 2025-12-06 · スコープ: macOS アプリ (`apps/macos`)

- **アイドル:** 通常のアイコンアニメーション（まばたき、時折の小さな揺れ）。
- **一時停止:** ステータス項目は `appearsDisabled` を使用し、動きはありません。
- **音声トリガー（大きな耳）:** 音声ウェイク検出器は、ウェイクワードが聞こえたときに `AppState.triggerVoiceEars(ttl: nil)` を呼び出し、発話のキャプチャ中は `earBoostActive=true` を維持します。耳は拡大（1.9 倍）し、読みやすさのために円形の耳穴が付き、その後 1 秒間の無音後に `stopVoiceEars()` で元に戻ります。アプリ内音声パイプラインからのみ発火します。
- **作業中（エージェント実行中）:** `AppState.isWorking=true` は「しっぽ/脚が小走りする」マイクロモーションを駆動します。作業の進行中は、脚の揺れが速くなり、わずかなオフセットが加わります。現在は WebChat エージェント実行の前後で切り替えられています。他の長時間タスクを接続するときは、同じ切り替えを追加してください。

接続ポイント

- 音声ウェイク: runtime/tester は、トリガー時に `AppState.triggerVoiceEars(ttl: nil)` を呼び出し、キャプチャウィンドウに合わせて 1 秒間の無音後に `stopVoiceEars()` を呼び出します。
- エージェントのアクティビティ: 作業区間の前後で `AppStateStore.shared.setWorking(true/false)` を設定します（WebChat エージェント呼び出しでは対応済み）。アニメーションが停止しない状態を避けるため、区間は短く保ち、`defer` ブロックでリセットしてください。

形状とサイズ

- ベースアイコンは `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` で描画されます。
- 耳のスケールのデフォルトは `1.0` です。音声ブーストでは全体フレームを変更せずに `earScale=1.9` を設定し、`earHoles=true` を切り替えます（18×18 pt のテンプレート画像を 36×36 px の Retina バッキングストアにレンダリング）。
- 小走りは、最大約 1.0 の脚の揺れと小さな水平の揺さぶりを使用します。既存のアイドル時の揺れがある場合は、それに加算されます。

動作上の注意

- 耳/作業中の外部 CLI/broker 切り替えはありません。意図しないばたつきを避けるため、アプリ自身のシグナル内部に保ってください。
- ジョブがハングした場合でもアイコンがすぐに基準状態へ戻るように、TTL は短く（&lt;10 秒）保ってください。

## 関連

- [メニューバー](/ja-JP/platforms/mac/menu-bar)
- [macOS アプリ](/ja-JP/platforms/macos)

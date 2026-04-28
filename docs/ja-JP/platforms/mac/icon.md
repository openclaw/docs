---
read_when:
    - メニューバーアイコンの動作を変更する
summary: macOS上のOpenClawのメニューバーアイコン状態とアニメーション
title: メニューバーアイコン
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# メニューバーアイコンの状態

作成者: steipete · 更新日: 2025-12-06 · 対象範囲: macOSアプリ（`apps/macos`）

- **Idle:** 通常のアイコンアニメーション（まばたき、時々の小さな揺れ）。
- **Paused:** status itemは `appearsDisabled` を使用し、動きはありません。
- **Voice trigger（大きな耳）:** 音声ウェイク検出器は、ウェイクワードが聞こえると `AppState.triggerVoiceEars(ttl: nil)` を呼び出し、発話の取り込み中は `earBoostActive=true` を維持します。耳は拡大し（1.9倍）、視認性のために円形の耳穴が付き、1秒の無音後に `stopVoiceEars()` で戻ります。アプリ内の音声パイプラインからのみ発火します。
- **Working（agent実行中）:** `AppState.isWorking=true` は「しっぽ/脚がせかせか動く」マイクロモーションを駆動します。作業中は、脚の揺れが速くなり、わずかにオフセットします。現在はWebChatのagent実行時に切り替えています。他の長時間タスクにも組み込むときは、同じ切り替えを追加してください。

接続ポイント

- Voice wake: runtime/testerは、トリガー時に `AppState.triggerVoiceEars(ttl: nil)` を呼び、取り込みウィンドウに合わせるため、1秒の無音後に `stopVoiceEars()` を呼びます。
- Agent activity: 作業区間の前後で `AppStateStore.shared.setWorking(true/false)` を設定します（WebChatのagent呼び出しではすでに実施済み）。アニメーションが固着しないよう、区間は短く保ち、`defer` ブロックでリセットしてください。

形状とサイズ

- ベースアイコンは `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` で描画されます。
- 耳のスケールのデフォルトは `1.0` です。音声ブーストでは `earScale=1.9` を設定し、全体フレームは変えずに `earHoles=true` を切り替えます（18×18 ptのtemplate imageを36×36 pxのRetina backing storeに描画）。
- Scurryは最大で約 `1.0` の脚の揺れと、小さな水平方向の揺れを使います。既存のidle時の揺れに加算されます。

動作上の注意

- 耳/workingに対する外部CLI/brokerトグルはありません。意図しない頻繁な切り替えを避けるため、アプリ自身のシグナル内部だけに留めてください。
- ジョブがハングした場合でもアイコンがすぐベースラインに戻るよう、TTLは短く（&lt;10秒）保ってください。

## 関連

- [Menu bar](/ja-JP/platforms/mac/menu-bar)
- [macOS app](/ja-JP/platforms/macos)

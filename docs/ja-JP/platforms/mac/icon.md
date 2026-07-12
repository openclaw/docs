---
read_when:
    - メニューバーアイコンの動作を変更する
summary: macOS版OpenClawのメニューバーアイコンの状態とアニメーション
title: メニューバーアイコン
x-i18n:
    generated_at: "2026-07-12T14:39:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# メニューバーアイコンの状態

対象範囲：macOS アプリ（`apps/macos`）。レンダリング：`CritterIconRenderer.makeIcon(...)`。アニメーション／状態の連携：`CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`。

## 状態

| 状態                  | トリガー                                  | 表示                                                                                                |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| アイドル              | デフォルト                                | 通常のまばたき／揺れアニメーション。目を開いている間は光沢のある輝きを維持                         |
| 一時停止              | `isPaused=true`                           | 目を開けたまま触角が垂れる（「勤務時間外」）。動きなし                                             |
| スリープ              | Gateway が切断済み／未設定                | 触角が垂れ、目が閉じて `⌣ ⌣` のまぶたになる。動きなし                                              |
| お祝い                | メッセージ送信時（`sendCelebrationTick`） | 約 0.9s の間、目が楽しげな `∩ ∩` の弧に変わり、脚を蹴り上げる                                      |
| 音声ウェイク（大きな耳） | ウェイクワードを検出                      | 触角がまっすぐ上向きになり、より高く伸びる（`earScale=1.9`）。無音になると元に戻る                 |
| 作業中                | `isWorking=true` または有効な `IconState` | 脚の揺れが高速化（`legWiggle` は最大 `1.0`）し、小さな水平オフセットが加わる。アイドル時の揺れに加算 |

セッションにアクティブなジョブまたはツールがある場合、ツールアクティビティバッジ（SF Symbol の円形バッジ。たとえば exec では `chevron.left.slash.chevron.right`）を同じクリッターアイコンの上に表示できます。このバッジは `IconState`／`ActivityKind` から取得されます。完全な状態モデルについては、[メニューバー](/ja-JP/platforms/mac/menu-bar)を参照してください。

## 音声ウェイク時の耳

- トリガー：`AppStateStore.shared.triggerVoiceEars(ttl: nil)`。音声ウェイクのキャプチャパイプライン（`VoiceWakeRuntime`）および音声ウェイクのデバッグ／テストツール（`VoiceWakeTester`、`VoiceWakeOverlayController`）から呼び出されます。
- 停止：`stopVoiceEars()`。キャプチャの確定時に呼び出されます。
- 確定前の無音時間：通常は `2.0s`。トリガーワードだけが検出され、その後に発話が続かなかった場合は `5.0s`（`VoiceWakeRuntime.silenceWindow`／`triggerOnlySilenceWindow`）。
- 強調表示中は、アイドル時のまばたき／揺れ／脚／耳のタイマーが一時停止します（`CritterStatusLabel+Behavior` では `earBoostActive` がアニメーションタスクを制御します）。

## 形状とサイズ

- キャンバス：18x18pt のテンプレート画像。Retina でアイコンを鮮明に保つため、36x36px のビットマップバッキングストア（2x）にレンダリングされます。
- 耳のスケールはデフォルトで `1.0`。音声ブーストでは全体のフレームを変更せずに `earScale=1.9` に設定します。
- `antennaDroop`（0-1）は、一時停止およびスリープ時のポーズで触角を下向きに折り曲げます。
- 脚の素早い動きには、最大 `1.0` の `legWiggle` と小さな水平揺れを使用します。

## 動作上の注意

- 耳や作業中状態を切り替える外部 CLI／ブローカーのトグルはありません。意図しない頻繁な切り替わりを避けるため、どちらもアプリ内部のシグナル（`AppState.setWorking`、`AppState.triggerVoiceEars`）によって駆動されます。
- ジョブが停止した場合でもアイコンがすぐに基準状態へ戻るよう、新しい TTL は短く（10s を十分に下回る値に）設定してください。

## 関連項目

- [メニューバー](/ja-JP/platforms/mac/menu-bar)
- [macOS アプリ](/ja-JP/platforms/macos)

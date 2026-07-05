---
read_when:
    - メニューバーアイコンの動作を変更する
summary: macOS 版 OpenClaw のメニューバーアイコンの状態とアニメーション
title: メニューバーアイコン
x-i18n:
    generated_at: "2026-07-05T11:34:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7a096ad148e83f368624e750c1e50c965d8a34a6255a09a19c568e7e88a5868
    source_path: platforms/mac/icon.md
    workflow: 16
---

# メニューバーアイコンの状態

範囲: macOS アプリ (`apps/macos`)。レンダリング: `CritterIconRenderer.makeIcon(...)`。アニメーション/状態の配線: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`。

## 状態

| 状態                  | トリガー                                  | 見た目                                                                                              |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| アイドル              | デフォルト                                | 通常のまばたき/揺れアニメーション                                                                  |
| 一時停止              | `isPaused=true`                           | ステータス項目が `appearsDisabled` を使用し、動きなし                                               |
| 音声ウェイク (大きな耳) | ウェイクワードを検知                      | 耳が `earHoles=true` (読みやすさのための円形の穴) で `1.9x` に拡大し、無音後に戻る                 |
| 作業中                | `isWorking=true` またはアクティブな `IconState` | より速い脚の揺れ (`legWiggle` は最大 `1.0`) に小さな水平オフセットを追加し、アイドル時の揺れに加算 |

セッションにアクティブなジョブまたはツールがある場合、ツールアクティビティバッジ (SF Symbol のパック、例: exec 用の `chevron.left.slash.chevron.right`) を同じクリッターアイコンの上に描画できる。このバッジは `IconState`/`ActivityKind` から来る。完全な状態モデルについては [メニューバー](/ja-JP/platforms/mac/menu-bar) を参照。

## 音声ウェイクの耳

- トリガー: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`。音声ウェイクのキャプチャパイプライン (`VoiceWakeRuntime`) と、音声ウェイクのデバッグ/テストツール (`VoiceWakeTester`, `VoiceWakeOverlayController`) から呼び出される。
- 停止: `stopVoiceEars()`。キャプチャの確定時に呼び出される。
- 確定前の無音ウィンドウ: 通常は `2.0s`。トリガーワードだけが聞こえ、その後に発話が続かなかった場合は `5.0s` (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`)。
- ブースト中は、アイドルのまばたき/揺れ/脚/耳のタイマーが一時停止される (`earBoostActive` が `CritterStatusLabel+Behavior` のアニメーションタスクをゲートする)。

## 形状とサイズ

- キャンバス: 18x18pt のテンプレート画像。Retina でアイコンを鮮明に保つため、36x36px のビットマップバッキングストア (2x) にレンダリングされる。
- 耳のスケールはデフォルトで `1.0`。音声ブーストでは全体のフレームを変えずに `earScale=1.9` と `earHoles=true` を設定する。
- 脚の小走りは、小さな水平ジグルとともに最大 `1.0` の `legWiggle` を使用する。

## 挙動上の注意

- 耳や作業中状態の外部 CLI/ブローカートグルはない。どちらも偶発的なばたつきを避けるため、アプリシグナル (`AppState.setWorking`, `AppState.triggerVoiceEars`) によって内部的に駆動される。
- ジョブがハングした場合にアイコンがすばやくベースラインへ戻るよう、新しい TTL は短く (10s を大きく下回る) 保つ。

## 関連

- [メニューバー](/ja-JP/platforms/mac/menu-bar)
- [macOS アプリ](/ja-JP/platforms/macos)

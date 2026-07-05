---
read_when:
    - 音声オーバーレイの動作を調整する
summary: ウェイクワードとプッシュツートークが重なる場合の音声オーバーレイのライフサイクル
title: 音声オーバーレイ
x-i18n:
    generated_at: "2026-07-05T11:36:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 音声オーバーレイのライフサイクル (macOS)

対象: macOS アプリのコントリビューター。目標: ウェイクワードとプッシュトゥトークが重なったときも、音声オーバーレイを予測可能に保つ。

## 動作

- ウェイクワードによってオーバーレイがすでに表示されていて、ユーザーがホットキーを押した場合、ホットキーセッションはテキストをリセットせず、既存のテキストを引き継ぐ。ホットキーを押している間、オーバーレイは表示されたままになる。離したとき: トリム済みテキストがあれば送信し、なければ閉じる。
- ウェイクワード単独では、無音時に引き続き自動送信される。プッシュトゥトークは離した時点ですぐに送信する。

## 実装

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) は、アクティブな音声セッションの唯一の所有者。これは actor ではなく、`@MainActor @Observable` シングルトン。API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`。各セッションは `UUID` トークンを持つ。古いトークンや一致しないトークンでの呼び出しは破棄される。
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) はオーバーレイを描画し、ユーザー操作 (`requestSend`, `dismiss`) をセッショントークン経由でコーディネーターへ戻す。セッション状態自体は所有しない。
- プッシュトゥトーク (`VoicePushToTalk.begin()`) は、表示中のオーバーレイテキストを `adoptedPrefix` として引き継ぐ (`VoiceSessionCoordinator.shared.snapshot()` 経由)。これにより、ウェイクオーバーレイが表示されている間にホットキーを押しても、テキストを保持し、新しい発話を追加できる。離したとき、最終トランスクリプトを最大 1.5 秒待ってから、現在のテキストへフォールバックする。
- `dismiss` 時、オーバーレイは `VoiceSessionCoordinator.overlayDidDismiss` を呼び出す。これにより `VoiceWakeRuntime.refresh(state:)` がトリガーされ、手動の X 閉じ、空テキストでの閉じ、送信後の閉じのいずれでも、ウェイクワードのリスニングが再開される。
- 統一された送信パス: トリム済みテキストが空なら閉じる。そうでなければ、`sendNow` が送信チャイムを一度再生し、`VoiceWakeForwarder` 経由で転送してから閉じる。

## ログ

音声サブシステムは `ai.openclaw`。各コンポーネントはそれぞれのカテゴリでログを記録する。

| カテゴリ                | コンポーネント                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | プッシュトゥトークのホットキーとキャプチャ                 |
| `voicewake.runtime`     | ウェイクワードランタイム                               |
| `voicewake.chime`       | チャイム再生                                  |
| `voicewake.sync`        | グローバル設定同期                            |
| `voicewake.forward`     | トランスクリプト転送                           |
| `voicewake.meter`       | マイクレベルモニター                               |

## デバッグチェックリスト

- 固着したオーバーレイを再現しながらログをストリームする:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- アクティブなセッショントークンが 1 つだけであることを確認する。古いコールバックはコーディネーターによって破棄される。
- プッシュトゥトークを離したとき、アクティブなトークンで必ず `end()` が呼ばれることを確認する。テキストが空の場合は、チャイムや送信なしで閉じることを想定する。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [音声ウェイク (macOS)](/ja-JP/platforms/mac/voicewake)
- [トークモード](/ja-JP/nodes/talk)

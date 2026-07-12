---
read_when:
    - 音声オーバーレイの動作を調整する
summary: ウェイクワードとプッシュ・トゥ・トークが重複した場合の音声オーバーレイのライフサイクル
title: 音声オーバーレイ
x-i18n:
    generated_at: "2026-07-11T22:25:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 音声オーバーレイのライフサイクル（macOS）

対象読者: macOS アプリのコントリビューター。目的: ウェイクワードとプッシュトゥトークが重なったときも、音声オーバーレイを予測可能な状態に保つこと。

## 動作

- ウェイクワードによってオーバーレイがすでに表示されている状態でユーザーがホットキーを押すと、ホットキーセッションはテキストをリセットせず、既存のテキストを引き継ぎます。ホットキーを押している間、オーバーレイは表示されたままになります。キーを離したとき: 前後の空白を除去したテキストがあれば送信し、なければ閉じます。
- ウェイクワードのみの場合は、従来どおり無音を検出すると自動送信されます。プッシュトゥトークの場合は、キーを離すと即座に送信されます。

## 実装

- `VoiceSessionCoordinator`（`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`）は、アクティブな音声セッションを一元的に管理します。これは actor ではなく、`@MainActor @Observable` のシングルトンです。API: `startSession`、`updatePartial`、`finalize`、`sendNow`、`dismiss`、`updateLevel`、`snapshot`。各セッションは `UUID` トークンを保持し、古いトークンまたは一致しないトークンを使用した呼び出しは破棄されます。
- `VoiceWakeOverlayController`（`VoiceWakeOverlayController+Session.swift`）はオーバーレイを描画し、ユーザー操作（`requestSend`、`dismiss`）をセッショントークン経由でコーディネーターに転送します。セッション状態自体を保持することはありません。
- プッシュトゥトーク（`VoicePushToTalk.begin()`）は、表示中のオーバーレイにあるテキストを（`VoiceSessionCoordinator.shared.snapshot()` を介して）`adoptedPrefix` として引き継ぎます。そのため、ウェイクオーバーレイの表示中にホットキーを押してもテキストが保持され、新しい音声認識結果が追加されます。キーを離すと、最終的な文字起こしを最大 1.5 秒待機してから、現在のテキストにフォールバックします。
- `dismiss` 時に、オーバーレイは `VoiceSessionCoordinator.overlayDidDismiss` を呼び出します。これにより `VoiceWakeRuntime.refresh(state:)` がトリガーされるため、X ボタンによる手動終了、空テキストによる終了、送信後の終了のいずれの場合も、ウェイクワードの待ち受けが再開されます。
- 統一された送信経路: 前後の空白を除去したテキストが空なら閉じます。それ以外の場合、`sendNow` が送信チャイムを一度だけ再生し、`VoiceWakeForwarder` を介して転送してから閉じます。

## ログ記録

音声サブシステムは `ai.openclaw` です。各コンポーネントはそれぞれ独自のカテゴリでログを記録します。

| カテゴリ                | コンポーネント                                  |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | プッシュトゥトークのホットキーと音声取り込み    |
| `voicewake.runtime`     | ウェイクワードのランタイム                      |
| `voicewake.chime`       | チャイムの再生                                  |
| `voicewake.sync`        | グローバル設定の同期                            |
| `voicewake.forward`     | 文字起こしの転送                                |
| `voicewake.meter`       | マイクレベルのモニター                          |

## デバッグチェックリスト

- オーバーレイが消えない問題を再現しながらログをストリーミングします。

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- アクティブなセッショントークンが 1 つだけであることを確認します。古いコールバックはコーディネーターによって破棄されます。
- プッシュトゥトークのキーを離したときに、アクティブなトークンを指定して必ず `end()` が呼び出されることを確認します。テキストが空の場合は、チャイムの再生や送信を行わずに閉じることが期待されます。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [音声ウェイク（macOS）](/ja-JP/platforms/mac/voicewake)
- [トークモード](/ja-JP/nodes/talk)

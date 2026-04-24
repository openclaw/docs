---
read_when:
    - 音声オーバーレイの動作を調整する
summary: ウェイクワードとプッシュツートークが重なったときの音声オーバーレイのライフサイクル
title: 音声オーバーレイ
x-i18n:
    generated_at: "2026-04-24T05:08:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# 音声オーバーレイのライフサイクル（macOS）

対象読者: macOSアプリのコントリビューター。目的: ウェイクワードとプッシュツートークが重なったときでも、音声オーバーレイの動作を予測可能に保つこと。

## 現在の意図

- ウェイクワードによりオーバーレイがすでに表示されている状態でユーザーがホットキーを押した場合、ホットキーセッションは既存のテキストをリセットせずに_引き継ぐ_。ホットキーが押されている間、オーバーレイは表示されたままになる。ユーザーがキーを離したとき: 前後空白を除いたテキストがあれば送信し、なければ閉じる。
- ウェイクワード単独では、無音時に引き続き自動送信する。プッシュツートークでは、キーを離した時点で即時送信する。

## 実装済み（2025年12月9日）

- オーバーレイセッションは、キャプチャごと（ウェイクワードまたはプッシュツートーク）にトークンを持つようになった。トークンが一致しない partial/final/send/dismiss/level 更新は破棄されるため、古いコールバックを回避できる。
- プッシュツートークは、表示中のオーバーレイテキストをプレフィックスとして引き継ぐ（つまり、ウェイクオーバーレイが表示されている間にホットキーを押すと、そのテキストを保持したまま新しい音声を追加する）。現在のテキストへフォールバックする前に、最大1.5秒間 final transcript を待つ。
- Chime/overlay のログは、カテゴリ `voicewake.overlay`、`voicewake.ptt`、`voicewake.chime` で `info` レベル出力される（セッション開始、partial、final、send、dismiss、chime reason）。

## 次のステップ

1. **VoiceSessionCoordinator（actor）**
   - 常にちょうど1つの `VoiceSession` を所有する。
   - API（トークンベース）: `beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 古いトークンを持つコールバックは破棄する（古いrecognizerがオーバーレイを再表示するのを防ぐ）。

2. **VoiceSession（モデル）**
   - フィールド: `token`、`source`（wakeWord|pushToTalk）、committed/volatile text、chime flags、timers（auto-send、idle）、`overlayMode`（display|editing|sending）、cooldown deadline。

3. **オーバーレイbinding**
   - `VoiceSessionPublisher`（`ObservableObject`）が、アクティブなセッションをSwiftUIへミラーする。
   - `VoiceWakeOverlayView` はpublisher経由でのみ描画する。グローバルsingletonを直接変更してはならない。
   - オーバーレイのユーザー操作（`sendNow`、`dismiss`、`edit`）は、セッショントークン付きでcoordinatorへコールバックする。

4. **統一された送信経路**
   - `endCapture` 時: 前後空白を除いたテキストが空なら閉じる。そうでなければ `performSend(session:)`（send chimeを1回だけ鳴らし、転送し、閉じる）。
   - プッシュツートーク: 遅延なし。ウェイクワード: 自動送信用の任意遅延あり。
   - プッシュツートーク終了後、ウェイクランタイムに短いcooldownを適用し、ウェイクワードが即座に再トリガーしないようにする。

5. **ログ**
   - Coordinatorは、subsystem `ai.openclaw`、カテゴリ `voicewake.overlay` と `voicewake.chime` で `.info` ログを出力する。
   - 主なイベント: `session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## デバッグチェックリスト

- 張り付いたオーバーレイを再現しながらログをストリームする:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- アクティブなセッショントークンが1つだけであることを確認する。古いコールバックはcoordinatorによって破棄されるはず。
- プッシュツートークのキー解放で、常にアクティブトークン付きの `endCapture` が呼ばれることを確認する。テキストが空なら、chimeもsendもなく `dismiss` になるはず。

## 移行ステップ（推奨）

1. `VoiceSessionCoordinator`、`VoiceSession`、`VoiceSessionPublisher` を追加する。
2. `VoiceWakeRuntime` を、`VoiceWakeOverlayController` を直接触るのではなく、セッションの作成/更新/終了を行うようリファクタする。
3. `VoicePushToTalk` を、既存セッションを引き継ぎ、キー解放時に `endCapture` を呼ぶようリファクタする。ランタイムcooldownも適用する。
4. `VoiceWakeOverlayController` をpublisherに接続し、runtime/PTTからの直接呼び出しを削除する。
5. セッション引き継ぎ、cooldown、空テキスト時のdismissに対する統合テストを追加する。

## 関連

- [macOSアプリ](/ja-JP/platforms/macos)
- [Voice wake（macOS）](/ja-JP/platforms/mac/voicewake)
- [Talk mode](/ja-JP/nodes/talk)

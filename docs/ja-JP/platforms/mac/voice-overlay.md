---
read_when:
    - 音声オーバーレイ動作の調整
summary: ウェイクワードとプッシュトゥトークが重なる場合の音声オーバーレイのライフサイクル
title: 音声オーバーレイ
x-i18n:
    generated_at: "2026-05-06T09:07:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 音声オーバーレイのライフサイクル (macOS)

対象: macOS アプリのコントリビューター。目的: ウェイクワードとプッシュトゥトークが重なったときに、音声オーバーレイの挙動を予測可能に保つ。

## 現在の意図

- オーバーレイがすでにウェイクワードによって表示されていて、ユーザーがホットキーを押した場合、ホットキーセッションは既存のテキストをリセットせずに_引き継ぐ_。ホットキーが押されている間、オーバーレイは表示されたままになる。ユーザーが離したとき: トリム後のテキストがあれば送信し、なければ閉じる。
- ウェイクワード単独では、無音時に引き続き自動送信される。プッシュトゥトークは離した時点ですぐ送信される。

## 実装済み (2025年12月9日)

- オーバーレイセッションは、キャプチャごとにトークン (ウェイクワードまたはプッシュトゥトーク) を持つようになった。トークンが一致しない場合、部分/最終/送信/閉じる/レベル更新は破棄され、古いコールバックを回避する。
- プッシュトゥトークは、表示中のオーバーレイテキストをプレフィックスとして引き継ぐ (そのため、ウェイクオーバーレイが表示されている間にホットキーを押すと、テキストを保持して新しい発話を追加する)。現在のテキストへフォールバックする前に、最終トランスクリプトを最大 1.5 秒待つ。
- チャイム/オーバーレイのログは、カテゴリ `voicewake.overlay`、`voicewake.ptt`、`voicewake.chime` で `info` として出力される (セッション開始、部分、最終、送信、閉じる、チャイム理由)。

## 次の手順

1. **VoiceSessionCoordinator (アクター)**
   - 同時にちょうど 1 つの `VoiceSession` を所有する。
   - API (トークンベース): `beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 古いトークンを持つコールバックを破棄する (古い認識器がオーバーレイを再表示するのを防ぐ)。
2. **VoiceSession (モデル)**
   - フィールド: `token`、`source` (`wakeWord|pushToTalk`)、確定/揮発テキスト、チャイムフラグ、タイマー (自動送信、アイドル)、`overlayMode` (`display|editing|sending`)、クールダウン期限。
3. **オーバーレイバインディング**
   - `VoiceSessionPublisher` (`ObservableObject`) は、アクティブなセッションを SwiftUI にミラーする。
   - `VoiceWakeOverlayView` はパブリッシャー経由でのみ描画する。グローバルシングルトンを直接変更しない。
   - オーバーレイのユーザー操作 (`sendNow`、`dismiss`、`edit`) は、セッショントークンとともにコーディネーターへコールバックする。
4. **統一された送信パス**
   - `endCapture` 時: トリム後のテキストが空 → 閉じる。そうでなければ `performSend(session:)` (送信チャイムを一度だけ鳴らし、転送し、閉じる)。
   - プッシュトゥトーク: 遅延なし。ウェイクワード: 自動送信用の任意の遅延。
   - プッシュトゥトーク終了後、ウェイクランタイムに短いクールダウンを適用し、ウェイクワードがすぐに再トリガーされないようにする。
5. **ログ**
   - コーディネーターは、サブシステム `ai.openclaw`、カテゴリ `voicewake.overlay` と `voicewake.chime` で `.info` ログを出力する。
   - 主要イベント: `session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## デバッグチェックリスト

- 固着するオーバーレイを再現しながらログをストリームする:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- アクティブなセッショントークンが 1 つだけであることを確認する。古いコールバックはコーディネーターによって破棄されるべきである。
- プッシュトゥトークのリリースが、常にアクティブなトークンで `endCapture` を呼ぶことを確認する。テキストが空の場合は、チャイムや送信なしで `dismiss` されることを期待する。

## 移行手順 (推奨)

1. `VoiceSessionCoordinator`、`VoiceSession`、`VoiceSessionPublisher` を追加する。
2. `VoiceWakeRuntime` をリファクタリングし、`VoiceWakeOverlayController` に直接触れるのではなく、セッションを作成/更新/終了するようにする。
3. `VoicePushToTalk` をリファクタリングし、既存セッションを引き継いでリリース時に `endCapture` を呼ぶようにする。ランタイムのクールダウンを適用する。
4. `VoiceWakeOverlayController` をパブリッシャーに接続する。ランタイム/PTT からの直接呼び出しを削除する。
5. セッションの引き継ぎ、クールダウン、空テキストの閉じる動作について統合テストを追加する。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [音声ウェイク (macOS)](/ja-JP/platforms/mac/voicewake)
- [トークモード](/ja-JP/nodes/talk)

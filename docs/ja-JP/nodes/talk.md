---
read_when:
    - macOS/iOS/Android で Talk モードを実装する場合
    - 音声/TTS/割り込み動作を変更する შემთხვევაში
summary: 'Talk モード: ElevenLabs TTS による連続音声会話'
title: Talk モード
x-i18n:
    generated_at: "2026-04-24T05:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Talk モードは、連続した音声会話ループです。

1. 音声を聞き取る
2. transcript をモデルへ送る（メインセッション、`chat.send`）
3. 応答を待つ
4. 設定された Talk プロバイダー（`talk.speak`）で読み上げる

## 動作（macOS）

- Talk モード有効中は**常時表示オーバーレイ**。
- **Listening → Thinking → Speaking** のフェーズ遷移。
- **短い間**（無音ウィンドウ）があると、現在の transcript が送信される。
- 返信は **WebChat に書き込まれる**（入力した場合と同じ）。
- **音声による割り込み**（デフォルトでオン）: アシスタントが話している間にユーザーが話し始めた場合、再生を停止し、次のプロンプト用に割り込みタイムスタンプを記録する。

## 返信内の音声 directive

アシスタントは、音声を制御するために返信の先頭に**単一の JSON 行**を付けることができます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。
- 不明なキーは無視される。
- `once: true` は現在の返信にのみ適用される。
- `once` がない場合、その音声は Talk モードの新しいデフォルトになる。
- JSON 行は TTS 再生前に取り除かれる。

サポートされるキー:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate`（WPM）, `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config（`~/.openclaw/openclaw.json`）

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

デフォルト:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定時、Talk は transcript 送信前のプラットフォームデフォルトの待機時間を維持する（`macOS と Android では 700 ms、iOS では 900 ms`）
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックする（または API キーが利用可能な場合は最初の ElevenLabs voice）
- `modelId`: 未設定時のデフォルトは `eleven_v3`
- `apiKey`: `ELEVENLABS_API_KEY` にフォールバックする（または利用可能なら Gateway shell profile）
- `outputFormat`: macOS/iOS ではデフォルトで `pcm_44100`、Android では `pcm_24000`（MP3 ストリーミングを強制するには `mp3_*` を設定）

## macOS UI

- メニューバートグル: **Talk**
- Config タブ: **Talk Mode** グループ（voice id + 割り込みトグル）
- オーバーレイ:
  - **Listening**: マイクレベルに応じてクラウドが脈動
  - **Thinking**: 沈み込むアニメーション
  - **Speaking**: 放射状のリング
  - クラウドをクリック: 読み上げを停止
  - X をクリック: Talk モードを終了

## 注意

- Speech + Microphone 権限が必要。
- セッションキー `main` に対して `chat.send` を使う。
- Gateway は、アクティブな Talk プロバイダーを使って `talk.speak` 経由で Talk 再生を解決する。Android は、その RPC が利用できない場合にのみローカル system TTS にフォールバックする。
- `eleven_v3` の `stability` は `0.0`、`0.5`、`1.0` に検証される。他のモデルでは `0..1` を受け付ける。
- `latency_tier` は設定時に `0..4` に検証される。
- Android は、低レイテンシ AudioTrack ストリーミング用に `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` の出力形式をサポートする。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [音声とボイスノート](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

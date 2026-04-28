---
read_when:
    - macOS/iOS/AndroidでのTalk mode実装
    - voice/TTS/interrupt動作の変更
summary: 'Talk mode: 設定済みTTS providerを使った継続的な音声会話'
title: Talk mode
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:34:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

Talk modeは、継続的な音声会話ループです:

1. 音声を聞き取る
2. transcriptをmodelへ送る（main session、`chat.send`）
3. 応答を待つ
4. 設定されたTalk provider（`talk.speak`）でそれを読み上げる

## 動作（macOS）

- Talk modeが有効な間は**常時表示overlay**。
- **Listening → Thinking → Speaking** のフェーズ遷移。
- **短いポーズ**（無音ウィンドウ）で、現在のtranscriptが送信されます。
- 返信は**WebChatに書き込まれます**（入力した場合と同じ）。
- **発話で中断**（デフォルトでオン）: assistantが話している間にユーザーが話し始めると、再生を停止し、次のプロンプト用に中断timestampを記録します。

## 返信内のvoice directive

assistantは、voiceを制御するために、返信の先頭に**1行だけのJSON** を付けることができます:

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行だけが対象です。
- 未知のkeyは無視されます。
- `once: true` は現在の返信にだけ適用されます。
- `once` がない場合、そのvoiceがTalk modeの新しいデフォルトになります。
- JSON行はTTS再生前に除去されます。

サポートされるkey:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate`（WPM）、`stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 設定（`~/.openclaw/openclaw.json`）

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

デフォルト:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定時、Talkはtranscript送信前のplatformデフォルトpause windowを使います（macOSとAndroidでは `700 ms`、iOSでは `900 ms`）
- `provider`: アクティブなTalk providerを選択します。macOSローカル再生経路には `elevenlabs`、`mlx`、`system` を使います。
- `providers.<provider>.voiceId`: ElevenLabsでは `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックします（またはAPI keyが利用可能な場合は最初のElevenLabs voice）。
- `providers.elevenlabs.modelId`: 未設定時は `eleven_v3` がデフォルトです。
- `providers.mlx.modelId`: 未設定時は `mlx-community/Soprano-80M-bf16` がデフォルトです。
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` にフォールバックします（または利用可能ならgateway shell profile）。
- `speechLocale`: iOS/macOS上のオンデバイスTalk音声認識用の任意のBCP 47 locale id。未設定ならdeviceデフォルトを使います。
- `outputFormat`: macOS/iOSではデフォルトで `pcm_44100`、Androidでは `pcm_24000`（MP3ストリーミングを強制するには `mp3_*` を設定）

## macOS UI

- メニューバー切り替え: **Talk**
- Config tab: **Talk Mode** グループ（voice id + interrupt切り替え）
- Overlay:
  - **Listening**: mic levelに応じてcloudが脈動
  - **Thinking**: 沈み込むアニメーション
  - **Speaking**: 放射状のリング
  - cloudをクリック: 読み上げ停止
  - Xをクリック: Talk mode終了

## Android UI

- Voice tab切り替え: **Talk**
- 手動 **Mic** と **Talk** は相互排他的なruntime capture modeです。
- 手動Micは、appがforegroundを離れるか、ユーザーがVoice tabを離れると停止します。
- Talk Modeは、オフに切り替えるかAndroid nodeが切断されるまで実行を続け、アクティブ中はAndroidのmicrophone foreground-service typeを使います。

## 注記

- Speech + Microphone permissionが必要です。
- session key `main` に対して `chat.send` を使います。
- gatewayは、アクティブなTalk providerを使って `talk.speak` 経由でTalk再生を解決します。Androidは、そのRPCが利用できない場合にのみローカルsystem TTSへフォールバックします。
- macOSローカルMLX再生は、存在する場合は同梱の `openclaw-mlx-tts` helperを、なければ `PATH` 上の実行ファイルを使います。開発中にcustom helper binaryを指したい場合は `OPENCLAW_MLX_TTS_BIN` を設定してください。
- `eleven_v3` の `stability` は `0.0`、`0.5`、`1.0` に検証されます。他のmodelは `0..1` を受け付けます。
- `latency_tier` は、設定時に `0..4` に検証されます。
- Androidは、低遅延AudioTrackストリーミング用に `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` のoutput formatをサポートします。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [Audio and voice notes](/ja-JP/nodes/audio)
- [Media understanding](/ja-JP/nodes/media-understanding)

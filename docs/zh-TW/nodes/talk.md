---
read_when:
    - 在 macOS/iOS/Android 上實作對話模式
    - 變更語音/TTS/中斷行為
summary: 交談模式：使用已設定的 TTS 提供者進行連續語音對話
title: 交談模式
x-i18n:
    generated_at: "2026-04-30T03:18:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 16
---

語音對話模式是一個連續的語音對話迴圈：

1. 聆聽語音
2. 將逐字稿傳送給模型（主工作階段，chat.send）
3. 等待回覆
4. 透過已設定的語音對話提供者（`talk.speak`）朗讀回覆

## 行為 (macOS)

- 啟用語音對話模式時，會顯示**常駐覆蓋層**。
- **聆聽 → 思考 → 說話** 階段轉換。
- 在出現**短暫停頓**（靜音時間窗）時，會送出目前的逐字稿。
- 回覆會**寫入 WebChat**（與打字相同）。
- **語音打斷**（預設開啟）：如果使用者在助理說話時開始說話，我們會停止播放，並為下一個提示記錄打斷時間戳。

## 回覆中的語音指令

助理可在回覆前加上一行 **JSON**，以控制語音：

```json
{ "voice": "<voice-id>", "once": true }
```

規則：

- 僅限第一個非空白行。
- 未知鍵會被忽略。
- `once: true` 僅套用於目前回覆。
- 若沒有 `once`，該語音會成為語音對話模式的新預設值。
- JSON 行會在 TTS 播放前移除。

支援的鍵：

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 設定 (`~/.openclaw/openclaw.json`)

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

預設值：

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定時，語音對話模式會在傳送逐字稿前使用平台預設的暫停時間窗（`700 ms on macOS and Android, 900 ms on iOS`）
- `provider`: 選取作用中的語音對話提供者。對於 macOS 本機播放路徑，請使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`: 若是 ElevenLabs，會回退至 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API 金鑰可用時使用第一個 ElevenLabs 語音）。
- `providers.elevenlabs.modelId`: 未設定時預設為 `eleven_v3`。
- `providers.mlx.modelId`: 未設定時預設為 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`: 會回退至 `ELEVENLABS_API_KEY`（或 Gateway shell profile，如果可用）。
- `speechLocale`: 選用的 BCP 47 地區設定 ID，用於 iOS/macOS 裝置端語音對話語音辨識。保留未設定即可使用裝置預設值。
- `outputFormat`: 在 macOS/iOS 上預設為 `pcm_44100`，在 Android 上預設為 `pcm_24000`（設定 `mp3_*` 以強制使用 MP3 串流）

## macOS 使用者介面

- 選單列切換項：**語音對話**
- 設定分頁：**語音對話模式** 群組（語音 ID + 打斷切換項）
- 覆蓋層：
  - **聆聽**：雲朵會隨麥克風音量脈動
  - **思考**：下沉動畫
  - **說話**：向外放射的環
  - 點按雲朵：停止說話
  - 點按 X：離開語音對話模式

## Android 使用者介面

- 語音分頁切換項：**語音對話**
- 手動**麥克風**與**語音對話**是互斥的執行期擷取模式。
- 手動麥克風會在應用程式離開前景或使用者離開語音分頁時停止。
- 語音對話模式會持續執行，直到被切換關閉或 Android Node 中斷連線；啟用期間會使用 Android 的麥克風前景服務類型。

## 注意事項

- 需要語音辨識與麥克風權限。
- 針對工作階段鍵 `main` 使用 `chat.send`。
- Gateway 會透過 `talk.speak` 使用作用中的語音對話提供者處理語音對話播放。只有在該 RPC 不可用時，Android 才會回退到本機系統 TTS。
- macOS 本機 MLX 播放會在存在時使用隨附的 `openclaw-mlx-tts` 輔助程式，否則使用 `PATH` 上的可執行檔。開發期間，設定 `OPENCLAW_MLX_TTS_BIN` 指向自訂輔助程式二進位檔。
- `stability` 對於 `eleven_v3` 會驗證為 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- `latency_tier` 設定時會驗證為 `0..4`。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，用於低延遲 AudioTrack 串流。

## 相關內容

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊與語音備註](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

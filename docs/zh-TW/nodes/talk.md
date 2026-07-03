---
read_when:
    - 實作 macOS/iOS/Android 上的 Talk 模式
    - 變更語音/TTS/中斷行為
summary: 說話模式：透過本機 STT/TTS 與即時語音進行連續語音對話
title: 對話模式
x-i18n:
    generated_at: "2026-07-03T00:52:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

語音對話模式有兩種執行階段形態：

- 原生 macOS/iOS/Android 語音對話使用本機語音辨識、閘道聊天，以及 `talk.speak` TTS。節點會通告 `talk` 能力，並宣告它們支援的 `talk.*` 命令。
- iOS 語音對話會針對選擇 `webrtc` 或省略傳輸方式的 OpenAI 即時設定，使用由用戶端擁有的 WebRTC。明確的 `gateway-relay`、`provider-websocket`，以及非 OpenAI 即時設定會留在由閘道擁有的轉送上；非即時設定則使用原生語音迴圈。
- 瀏覽器語音對話會針對用戶端擁有的 `webrtc` 和 `provider-websocket` 工作階段使用 `talk.client.create`，或針對閘道擁有的 `gateway-relay` 工作階段使用 `talk.session.create`。`managed-room` 保留給閘道交接和對講機房間使用。
- Android 語音對話可以透過 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 選擇加入由閘道擁有的即時轉送工作階段。否則會維持使用原生語音辨識、閘道聊天，以及 `talk.speak`。
- 僅轉錄用戶端在需要字幕或聽寫且不需要助理語音回應時，會使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，接著使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`。

原生語音對話是一個連續語音交談迴圈：

1. 聆聽語音
2. 透過作用中的工作階段將轉錄文字傳送給模型
3. 等待回應
4. 透過已設定的語音對話提供者（`talk.speak`）朗讀回應

由用戶端擁有的即時語音對話會透過 `talk.client.toolCall` 轉送提供者工具呼叫；這些用戶端不會為即時諮詢直接呼叫 `chat.send`。
即時諮詢作用中時，語音對話用戶端可以使用 `talk.client.steer` 或
`talk.session.steer`，將語音輸入分類為 `status`、`steer`、`cancel` 或
`followup`。被接受的導向會排入作用中的內嵌執行；被拒絕的
導向會傳回結構化原因，例如 `no_active_run`、`not_streaming`
或 `compacting`。

僅轉錄語音對話會發出與即時和 STT/TTS 工作階段相同的通用語音對話事件信封，但使用 `mode: "transcription"` 和 `brain: "none"`。它用於字幕、聽寫，以及僅觀察的語音擷取；一次性上傳的語音備忘錄仍使用媒體/音訊路徑。

## 行為（macOS）

- 啟用語音對話模式時顯示**永遠置頂覆蓋層**。
- **聆聽 → 思考 → 說話**階段轉換。
- 在**短暫停頓**（靜音視窗）時，會傳送目前的轉錄文字。
- 回覆會**寫入 WebChat**（與輸入文字相同）。
- **語音中斷**（預設開啟）：如果使用者在助理說話時開始說話，我們會停止播放，並記錄中斷時間戳以供下一個提示使用。

## 回覆中的語音指令

助理可以在回覆前加上一個**單行 JSON** 來控制語音：

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

預設值：

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定時，語音對話會在傳送轉錄文字前保留平台預設的停頓視窗（`macOS 和 Android 上為 700 ms，iOS 上為 900 ms`）
- `provider`: 選取作用中的語音對話提供者。對於 macOS 本機播放路徑，請使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`: ElevenLabs 會回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API 金鑰可用時使用第一個 ElevenLabs 語音）。
- `providers.elevenlabs.modelId`: 未設定時預設為 `eleven_v3`。
- `providers.mlx.modelId`: 未設定時預設為 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`: 回退到 `ELEVENLABS_API_KEY`（或可用時的閘道 shell 設定檔）。
- `consultThinkingLevel`: 可選的思考層級覆寫，用於即時 `openclaw_agent_consult` 呼叫背後的完整 OpenClaw 代理執行。
- `consultFastMode`: 可選的快速模式覆寫，用於即時 `openclaw_agent_consult` 呼叫。
- `realtime.provider`: 選取作用中的即時語音提供者。WebRTC 請使用 `openai`，提供者 WebSocket 請使用 `google`，或透過閘道轉送使用僅橋接的提供者。
- `realtime.providers.<provider>` 儲存提供者擁有的即時設定。瀏覽器只會收到短暫或受限的工作階段憑證，絕不會收到標準 API 金鑰。
- `realtime.providers.openai.voice`: 內建 OpenAI Realtime 語音 ID。目前 `gpt-realtime-2` 的語音為 `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin` 和 `cedar`；建議使用 `marin` 和 `cedar` 以取得最佳品質。
- `realtime.transport`: `webrtc` 會在 iOS 和瀏覽器中使用由用戶端擁有的 OpenAI WebRTC。`provider-websocket` 由瀏覽器擁有，但在 iOS 上仍留在閘道轉送上。`gateway-relay` 會將提供者音訊保留在閘道上；Android 只針對此傳輸使用即時功能，否則維持其原生 STT/TTS 迴圈。
- `realtime.brain`: `agent-consult` 會透過閘道政策路由即時工具呼叫；`direct-tools` 是舊版直接工具相容行為；`none` 用於轉錄或外部編排。
- `realtime.consultRouting`: `provider-direct` 會在提供者略過 `openclaw_agent_consult` 時保留提供者的直接回覆；`force-agent-consult` 會讓閘道轉送改為透過 OpenClaw 路由已完成的使用者轉錄文字。
- `realtime.instructions`: 將面向提供者的系統指示附加到 OpenClaw 內建的即時提示。用於語音風格和語氣；OpenClaw 會保留預設的 `openclaw_agent_consult` 指引。
- `talk.catalog` 會公開每個提供者的有效模式、傳輸、brain 策略、即時音訊格式和能力旗標，讓第一方語音對話用戶端可以避免不支援的組合。
- 串流轉錄提供者會透過 `talk.catalog.transcription` 探索。目前的閘道轉送會使用 Voice Call 串流提供者設定，直到新增專用的語音對話轉錄設定介面。
- `speechLocale`: iOS/macOS 裝置端語音對話語音辨識的可選 BCP 47 語言環境 ID。保留未設定即可使用裝置預設值。
- `outputFormat`: 在 macOS/iOS 上預設為 `pcm_44100`，在 Android 上預設為 `pcm_24000`（設定 `mp3_*` 可強制 MP3 串流）

## macOS 介面

- 選單列切換：**語音對話**
- 設定分頁：**語音對話模式**群組（語音 ID + 中斷切換）
- 覆蓋層：
  - **聆聽**：雲朵會隨麥克風音量脈動
  - **思考**：下沉動畫
  - **說話**：放射環
  - 點擊雲朵：停止說話
  - 點擊 X：結束語音對話模式

## Android 介面

- 語音分頁切換：**語音對話**
- 手動**麥克風**和**語音對話**是互斥的執行階段擷取模式。
- 手動麥克風和即時語音對話會優先使用已連線的 Bluetooth Classic 或 BLE 耳機麥克風。如果中斷連線，應用程式會要求另一個耳機輸入，或讓 Android 使用預設麥克風；停止擷取會還原預設麥克風偏好設定。
- 手動麥克風會在應用程式離開前景或使用者離開語音分頁時停止。
- 語音對話模式會持續執行，直到被切換關閉或 Android 節點中斷連線，且作用中時會使用 Android 的麥克風前景服務類型。

## 備註

- 需要語音 + 麥克風權限。
- 原生語音對話使用作用中的閘道工作階段，且只有在回應事件不可用時才會回退到歷史輪詢。
- 由用戶端擁有的即時語音對話會使用 `talk.client.toolCall` 進行 `openclaw_agent_consult`，而不是將 `chat.send` 暴露給提供者擁有的工作階段。
- 僅轉錄語音對話使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；用戶端會訂閱 `talk.event` 以取得部分/最終轉錄文字更新。
- 閘道會使用作用中的語音對話提供者，透過 `talk.speak` 解析語音對話播放。Android 只有在該 RPC 不可用時才會回退到本機系統 TTS。
- macOS 本機 MLX 播放會在存在時使用隨附的 `openclaw-mlx-tts` 輔助程式，或使用 `PATH` 上的可執行檔。開發期間可設定 `OPENCLAW_MLX_TTS_BIN` 指向自訂輔助二進位檔。
- `eleven_v3` 的 `stability` 會驗證為 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 設定 `latency_tier` 時，會驗證為 `0..4`。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，用於低延遲 AudioTrack 串流。

## 相關

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊和語音備忘錄](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

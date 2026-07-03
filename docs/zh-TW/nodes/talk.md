---
read_when:
    - 在 macOS/iOS/Android 上實作 Talk 模式
    - 變更語音/TTS/中斷行為
summary: Talk 模式：透過本機 STT/TTS 與即時語音進行連續語音對話
title: 交談模式
x-i18n:
    generated_at: "2026-07-03T09:22:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式有兩種執行階段形態：

- 原生 macOS/iOS/Android Talk 使用本機語音辨識、閘道聊天，以及 `talk.speak` TTS。節點會宣告 `talk` 能力，並宣告其支援的 `talk.*` 命令。
- iOS Talk 對於選擇 `webrtc` 或省略傳輸的 OpenAI 即時設定，使用由用戶端擁有的 WebRTC。明確的 `gateway-relay`、`provider-websocket`，以及非 OpenAI 的即時設定會保留在由閘道擁有的中繼；非即時設定則使用原生語音迴圈。
- 瀏覽器 Talk 對由用戶端擁有的 `webrtc` 和 `provider-websocket` 工作階段使用 `talk.client.create`，或對由閘道擁有的 `gateway-relay` 工作階段使用 `talk.session.create`。`managed-room` 保留給閘道交接與對講機房間。
- Android Talk 可以透過 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 選擇使用由閘道擁有的即時中繼工作階段。否則它會維持在原生語音辨識、閘道聊天，以及 `talk.speak`。
- 僅轉錄用戶端會使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然後在需要字幕或聽寫且不需要助理語音回應時，使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`。

原生 Talk 是連續語音對話迴圈：

1. 聆聽語音
2. 透過作用中的工作階段將轉錄傳送給模型
3. 等待回應
4. 透過設定的 Talk 提供者朗讀回應（`talk.speak`）

由用戶端擁有的即時 Talk 會透過 `talk.client.toolCall` 轉送提供者工具呼叫；這些用戶端不會直接呼叫 `chat.send` 來進行即時諮詢。
當即時諮詢作用中時，Talk 用戶端可以使用 `talk.client.steer` 或
`talk.session.steer`，將語音輸入分類為 `status`、`steer`、`cancel` 或
`followup`。被接受的導向會排入作用中的嵌入式執行；被拒絕的
導向會回傳結構化原因，例如 `no_active_run`、`not_streaming`
或 `compacting`。

僅轉錄 Talk 會發出與即時和 STT/TTS 工作階段相同的通用 Talk 事件封套，但使用 `mode: "transcription"` 和 `brain: "none"`。它用於字幕、聽寫，以及僅觀察的語音擷取；一次性上傳的語音備註仍使用媒體/音訊路徑。

## 行為（macOS）

- 啟用 Talk 模式時顯示**永遠置頂覆蓋層**。
- **聆聽 → 思考 → 說話**階段轉換。
- 在**短暫停頓**（靜音視窗）時，傳送目前轉錄。
- 回覆會**寫入 WebChat**（與輸入相同）。
- **語音打斷**（預設開啟）：如果使用者在助理說話時開始講話，我們會停止播放，並記錄打斷時間戳以供下一個提示使用。

## 回覆中的語音指令

助理可以在回覆前加上一個**單行 JSON** 來控制語音：

```json
{ "voice": "<voice-id>", "once": true }
```

規則：

- 只看第一個非空行。
- 未知鍵會被忽略。
- `once: true` 只套用於目前回覆。
- 若沒有 `once`，該語音會成為 Talk 模式的新預設值。
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
- `silenceTimeoutMs`: 未設定時，Talk 會在傳送轉錄前保留平台預設的暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）
- `provider`: 選擇作用中的 Talk 提供者。對 macOS 本機播放路徑使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`: 對 ElevenLabs 回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API 金鑰可用時使用第一個 ElevenLabs 語音）。
- `providers.elevenlabs.modelId`: 未設定時預設為 `eleven_v3`。
- `providers.mlx.modelId`: 未設定時預設為 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`: 回退到 `ELEVENLABS_API_KEY`（或可用時使用閘道 shell 設定檔）。
- `consultThinkingLevel`: 即時 `openclaw_agent_consult` 呼叫背後完整 OpenClaw 代理執行的選用思考層級覆寫。
- `consultFastMode`: 即時 `openclaw_agent_consult` 呼叫的選用快速模式覆寫。
- `realtime.provider`: 選擇作用中的即時語音提供者。對 WebRTC 使用 `openai`，對提供者 WebSocket 使用 `google`，或透過閘道中繼使用僅橋接提供者。
- `realtime.providers.<provider>` 儲存由提供者擁有的即時設定。瀏覽器只會收到暫時性或受限的工作階段憑證，絕不會收到標準 API 金鑰。
- `realtime.providers.openai.voice`: 內建 OpenAI Realtime 語音 ID。目前的 `gpt-realtime-2` 語音為 `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin` 和 `cedar`；建議使用 `marin` 和 `cedar` 以取得最佳品質。
- `realtime.transport`: `webrtc` 在 iOS 和瀏覽器中使用由用戶端擁有的 OpenAI WebRTC。`provider-websocket` 由瀏覽器擁有，但在 iOS 上會保留在閘道中繼。`gateway-relay` 會將提供者音訊保留在閘道上；Android 只對此傳輸使用即時模式，否則會維持其原生 STT/TTS 迴圈。
- `realtime.brain`: `agent-consult` 會透過閘道政策路由即時工具呼叫；`direct-tools` 是舊版直接工具相容行為；`none` 用於轉錄或外部編排。
- `realtime.consultRouting`: `provider-direct` 會在提供者略過 `openclaw_agent_consult` 時保留提供者的直接回覆；`force-agent-consult` 則讓閘道中繼改為透過 OpenClaw 路由最終使用者轉錄。
- `realtime.instructions`: 將面向提供者的系統指示附加到 OpenClaw 內建的即時提示。用它來設定語音風格與語氣；OpenClaw 會保留預設的 `openclaw_agent_consult` 指引。
- `talk.catalog` 會公開標準提供者 ID 和登錄別名，以及每個提供者的有效模式、傳輸、brain 策略、即時音訊格式、能力旗標，以及執行階段選取的就緒結果。第一方 Talk 用戶端應使用該目錄，而不是在本機維護提供者別名；省略群組就緒狀態的舊版閘道是未驗證，而不是確定未設定。
- 串流轉錄提供者會透過 `talk.catalog.transcription` 探索。目前的閘道中繼會使用 Voice Call 串流提供者設定，直到加入專用的 Talk 轉錄設定介面。
- `speechLocale`: iOS/macOS 上裝置端 Talk 語音辨識的選用 BCP 47 語言環境 ID。保留未設定以使用裝置預設值。
- `outputFormat`: 在 macOS/iOS 上預設為 `pcm_44100`，在 Android 上預設為 `pcm_24000`（設定 `mp3_*` 以強制 MP3 串流）

## macOS 介面

- 選單列切換：**Talk**
- 設定分頁：**Talk Mode** 群組（語音 ID + 打斷切換）
- 覆蓋層：
  - **聆聽**：雲朵隨麥克風音量脈動
  - **思考**：下沉動畫
  - **說話**：放射環
  - 點擊雲朵：停止說話
  - 點擊 X：退出 Talk 模式

## Android 介面

- 語音分頁切換：**Talk**
- 手動 **Mic** 和 **Talk** 是互斥的執行階段擷取模式。
- 手動 Mic 和即時 Talk 會優先使用已連線的 Bluetooth Classic 或 BLE 耳機麥克風。如果連線中斷，應用程式會要求另一個耳機輸入，或讓 Android 使用預設麥克風；停止擷取會還原預設麥克風偏好設定。
- 當應用程式離開前景，或使用者離開語音分頁時，手動 Mic 會停止。
- Talk 模式會持續執行，直到被切換關閉或 Android 節點中斷連線，並在作用中時使用 Android 的麥克風前景服務類型。

## 備註

- 需要語音與麥克風權限。
- 原生 Talk 使用作用中的閘道工作階段，且只在回應事件不可用時回退到歷史輪詢。
- 由用戶端擁有的即時 Talk 使用 `talk.client.toolCall` 來進行 `openclaw_agent_consult`，而不是將 `chat.send` 暴露給由提供者擁有的工作階段。
- 僅轉錄 Talk 使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；用戶端會訂閱 `talk.event` 以取得部分/最終轉錄更新。
- 閘道會使用作用中的 Talk 提供者，透過 `talk.speak` 解析 Talk 播放。只有當該 RPC 不可用時，Android 才會回退到本機系統 TTS。
- macOS 本機 MLX 播放會在存在時使用隨附的 `openclaw-mlx-tts` 輔助程式，或使用 `PATH` 上的可執行檔。在開發期間，設定 `OPENCLAW_MLX_TTS_BIN` 以指向自訂輔助程式二進位檔。
- `eleven_v3` 的 `stability` 會驗證為 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 設定時，`latency_tier` 會驗證為 `0..4`。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，以進行低延遲 AudioTrack 串流。

## 相關

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊與語音備註](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

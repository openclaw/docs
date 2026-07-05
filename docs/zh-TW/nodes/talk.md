---
read_when:
    - 在 macOS/iOS/Android 上實作 Talk 模式
    - 變更語音/TTS/中斷行為
summary: 交談模式：跨本機 STT/TTS 與即時語音的連續語音對話
title: 對話模式
x-i18n:
    generated_at: "2026-07-05T11:25:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fd8976b29ad6618337886aa58473c8459c4c5f7e67162f19cfbe1a61e4e4b65
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式涵蓋五種執行階段形態：

- **原生 macOS/iOS/Android Talk**：本機語音辨識、閘道聊天，以及 `talk.speak` TTS。節點會通告 `talk` 能力，並宣告支援哪些 `talk.*` 命令。
- **iOS Talk（即時）**：針對選擇 `webrtc` 傳輸或省略傳輸的 OpenAI 即時設定，使用客戶端擁有的 WebRTC。明確的 `gateway-relay`、`provider-websocket`，以及非 OpenAI 即時設定會留在閘道擁有的轉送上；非即時設定則使用原生語音迴圈。
- **瀏覽器 Talk**：客戶端擁有的 `webrtc`/`provider-websocket` 工作階段使用 `talk.client.create`，閘道擁有的 `gateway-relay` 工作階段使用 `talk.session.create`。`managed-room` 保留給閘道交接和對講機房間。
- **Android Talk（即時）**：透過 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 選擇啟用。否則 Android 會維持使用原生語音辨識、閘道聊天，以及 `talk.speak`。
- **僅轉錄客戶端**：`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，接著使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`，可在沒有助理語音回應的情況下進行字幕/聽寫。一次性上傳的語音記事仍使用 [媒體理解](/zh-TW/nodes/media-understanding) 音訊路徑。

原生 Talk 是一個連續迴圈：聆聽語音、透過作用中的工作階段將轉錄稿傳送給模型、等待回應，然後透過已設定的 Talk 提供者（`talk.speak`）朗讀。

客戶端擁有的即時 Talk 會透過 `talk.client.toolCall` 轉送提供者工具呼叫，而不是直接呼叫 `chat.send`。即時諮詢作用中時，客戶端可以呼叫 `talk.client.steer` 或 `talk.session.steer`，將口語輸入分類為 `status`、`steer`、`cancel` 或 `followup`。接受的導向會排入作用中的嵌入式執行；拒絕的導向會傳回原因，例如 `no_active_run`、`not_streaming` 或 `compacting`。

僅轉錄 Talk 會發出與即時和 STT/TTS 工作階段相同的 Talk 事件封套，但使用 `mode: "transcription"` 和 `brain: "none"`。所有 Talk 工作階段都會在 `talk.event` 頻道上廣播事件；客戶端訂閱該頻道，以取得部分/最終轉錄更新（`transcript.delta`/`transcript.done`）和其他工作階段遙測。

## 行為 (macOS)

- Talk 模式啟用時，疊加層永遠顯示。
- **聆聽 &rarr; 思考 &rarr; 說話** 階段轉換。
- 短暫停頓（靜音視窗）時，會傳送目前的轉錄稿。
- 回覆會寫入 WebChat（與輸入相同）。
- **語音打斷**（預設開啟）：如果使用者在助理說話時講話，播放會停止，且打斷時間戳記會記錄供下一個提示使用。

## 回覆中的語音指令

助理可以在回覆前加上一行 JSON 來控制語音：

```json
{ "voice": "<voice-id>", "once": true }
```

規則：

- 僅限第一個非空白行；JSON 行會在 TTS 播放前移除。
- 未知鍵會被忽略。
- `once: true` 僅套用於目前回覆；若沒有它，該語音會成為新的 Talk 模式預設值。

支援的鍵：`voice` / `voice_id` / `voiceId`、`model` / `model_id` / `modelId`、`speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`、`seed`、`normalize`、`lang`、`output_format`、`latency_tier`、`once`。

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

| 鍵                                      | 預設值                                    | 備註                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                               | -                                          | 作用中的 Talk TTS 提供者。針對 macOS 本機播放路徑使用 `elevenlabs`、`mlx` 或 `system`。                                                                                                                                                                           |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs 會退回使用 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`，或在有 API 金鑰時使用第一個可用語音。                                                                                                                                                           |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                          |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                          |
| `providers.elevenlabs.apiKey`            | -                                          | 會退回使用 `ELEVENLABS_API_KEY`（或可用時使用閘道 shell 設定檔）。                                                                                                                                                                                              |
| `speechLocale`                           | 裝置預設值                             | iOS/macOS 上裝置端 Talk 語音辨識的 BCP 47 語言地區 ID。                                                                                                                                                                                                     |
| `silenceTimeoutMs`                       | `700` ms macOS/Android，`900` ms iOS       | Talk 傳送轉錄稿前的暫停視窗。                                                                                                                                                                                                                           |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                          |
| `outputFormat`                           | `pcm_44100` macOS/iOS，`pcm_24000` Android | 設為 `mp3_*` 以強制 MP3 串流。                                                                                                                                                                                                                                      |
| `consultThinkingLevel`                   | 未設定                                      | 即時 `openclaw_agent_consult` 呼叫背後代理執行的思考等級覆寫。                                                                                                                                                                                |
| `consultFastMode`                        | 未設定                                      | 即時 `openclaw_agent_consult` 呼叫的快速模式覆寫。                                                                                                                                                                                                          |
| `realtime.provider`                      | -                                          | `openai` 用於 WebRTC，`google` 用於提供者 WebSocket，或透過閘道轉送使用僅橋接的提供者。                                                                                                                                                                   |
| `realtime.providers.<id>`                | -                                          | 提供者擁有的即時設定。瀏覽器只會收到臨時/受限的工作階段憑證，絕不會收到標準 API 金鑰。                                                                                                                                               |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 內建 OpenAI Realtime 語音 ID（較舊的 `voice` 鍵仍可運作，但已棄用）。目前 `gpt-realtime-2` 語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`；建議使用 `marin` 和 `cedar` 以取得最佳品質。 |
| `realtime.transport`                     | -                                          | `webrtc`：iOS 和瀏覽器中的客戶端擁有 OpenAI WebRTC。`provider-websocket`：瀏覽器擁有，在 iOS 上會留在閘道轉送。`gateway-relay`：讓提供者音訊保留在閘道上；Android 只有搭配此傳輸才會使用即時模式。                                |
| `realtime.brain`                         | -                                          | `agent-consult` 透過閘道政策路由即時工具呼叫；`direct-tools` 是舊版直接工具相容性；`none` 用於轉錄/外部編排。                                                                                               |
| `realtime.consultRouting`                | -                                          | 當提供者略過 `openclaw_agent_consult` 時，`provider-direct` 會保留提供者的直接回覆；`force-agent-consult` 則會改為透過 OpenClaw 路由最終使用者轉錄稿。                                                                                        |
| `realtime.instructions`                  | -                                          | 將面向提供者的系統指示附加到 OpenClaw 內建即時提示（語音風格/語氣）；預設的 `openclaw_agent_consult` 指引會保留。                                                                                                              |

`talk.catalog` 會公開標準提供者 ID 和註冊表別名、每個提供者的有效模式/傳輸/brain 策略/即時音訊格式/能力旗標，以及執行階段選取的就緒結果。第一方 Talk 客戶端應讀取該目錄，而不是在本機維護提供者別名；對於省略群組就緒狀態的較舊閘道，應視為未驗證，而不是明確認定為未設定。串流轉錄提供者會透過 `talk.catalog.transcription` 探索；目前的閘道轉送會使用 Voice Call 串流提供者設定，直到專用的 Talk 轉錄設定介面推出為止。

## macOS UI

- 選單列切換：**Talk**
- 設定分頁：**Talk Mode** 群組（語音 ID + 中斷切換）
- 覆蓋層：正在聆聽（雲朵隨麥克風音量脈動）&rarr; 正在思考（下沉動畫）&rarr; 正在說話（向外輻射圓環）。按一下雲朵可停止說話，按一下 X 可退出 Talk 模式。

## Android UI

- 語音分頁切換：**Talk**
- 手動 **Mic** 和 **Talk** 是互斥的擷取模式。
- 手動 Mic 和即時 Talk 會優先使用已連線的 Bluetooth Classic 或 BLE 耳機麥克風；如果連線中斷，應用程式會要求另一個耳機輸入，或退回預設麥克風，並在擷取停止後還原預設偏好設定。
- 手動 Mic 會在應用程式離開前景或使用者離開語音分頁時停止。
- Talk Mode 會持續執行，直到切換為關閉或節點中斷連線，並在作用中時使用 Android 的麥克風前景服務類型。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，用於低延遲 `AudioTrack` 串流。

## 備註

- 需要語音 + 麥克風權限。
- 原生 Talk 使用作用中的閘道工作階段，並且只在回應事件無法使用時退回歷史輪詢。
- 閘道會透過 `talk.speak` 使用作用中的 Talk 提供者解析 Talk 播放。Android 只在該 RPC 無法使用時退回本機系統 TTS。
- macOS 本機 MLX 播放會在存在時使用隨附的 `openclaw-mlx-tts` 輔助程式，或使用 `PATH` 上的可執行檔。開發期間可設定 `OPENCLAW_MLX_TTS_BIN` 指向自訂輔助程式二進位檔。
- 語音指令值範圍（ElevenLabs）：`stability`、`similarity` 和 `style` 接受 `0..1`；`speed` 接受 `0.5..2`；`latency_tier` 接受 `0..4`。

## 相關

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊與語音備註](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

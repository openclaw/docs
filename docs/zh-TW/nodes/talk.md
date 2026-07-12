---
read_when:
    - 在 macOS/iOS/Android 上實作對話模式
    - 變更語音／文字轉語音／中斷行為
summary: 對話模式：透過本機 STT/TTS 與即時語音進行持續語音對話
title: 對話模式
x-i18n:
    generated_at: "2026-07-12T14:34:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式涵蓋五種執行階段形態：

- **原生 macOS/iOS/Android Talk**：本機語音辨識、閘道聊天，以及 `talk.speak` TTS。節點會公告 `talk` 功能，並宣告其支援的 `talk.*` 命令。
- **iOS Talk（即時）**：對於選擇 `webrtc` 傳輸或省略傳輸設定的 OpenAI 即時設定，由用戶端負責 WebRTC。明確指定 `gateway-relay`、`provider-websocket` 的設定，以及非 OpenAI 即時設定，仍會使用由閘道負責的中繼；非即時設定則使用原生語音迴圈。
- **瀏覽器 Talk**：用戶端負責的 `webrtc`/`provider-websocket` 工作階段使用 `talk.client.create`，由閘道負責的 `gateway-relay` 工作階段則使用 `talk.session.create`。`managed-room` 保留供閘道移交和對講機房間使用。
- **Android Talk（即時）**：使用 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 選擇啟用。否則，Android 會維持使用原生語音辨識、閘道聊天和 `talk.speak`。
- **僅轉錄用戶端**：使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，接著使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`，在不需要助理語音回應的情況下提供字幕／聽寫。單次上傳的語音留言仍使用[媒體理解](/zh-TW/nodes/media-understanding)音訊路徑。

原生 Talk 是一個持續迴圈：聆聽語音、透過作用中的工作階段將轉錄文字傳送給模型、等待回應，然後透過已設定的 Talk 提供者（`talk.speak`）朗讀回應。

由用戶端負責的即時 Talk 會透過 `talk.client.toolCall` 轉送提供者工具呼叫，而不是直接呼叫 `chat.send`。即時諮詢進行期間，用戶端可以呼叫 `talk.client.steer` 或 `talk.session.steer`，將語音輸入分類為 `status`、`steer`、`cancel` 或 `followup`。接受的引導會排入作用中的內嵌執行；遭拒的引導則會傳回 `no_active_run`、`not_streaming` 或 `compacting` 等原因。

僅轉錄 Talk 會發出與即時及 STT/TTS 工作階段相同的 Talk 事件封套，但使用 `mode: "transcription"` 和 `brain: "none"`。所有 Talk 工作階段都會在 `talk.event` 頻道廣播事件；用戶端會訂閱此頻道，以接收部分／最終轉錄更新（`transcript.delta`/`transcript.done`）及其他工作階段遙測資料。

## 行為（macOS）

- 啟用 Talk 模式時，永遠顯示浮動視窗。
- **聆聽 &rarr; 思考 &rarr; 說話**階段轉換。
- 短暫停頓（靜音時間窗）後，會傳送目前的轉錄文字。
- 回覆會寫入 WebChat（與輸入文字相同）。
- **語音中斷**（預設開啟）：如果使用者在助理說話時開口，系統會停止播放，並記錄中斷時間戳記供下一個提示使用。

## 回覆中的語音指示詞

助理可以在回覆前加上一行 JSON 來控制語音：

```json
{ "voice": "<voice-id>", "once": true }
```

規則：

- 僅限第一個非空白行；TTS 播放前會移除該 JSON 行。
- 未知的鍵會被忽略。
- `once: true` 僅套用於目前的回覆；若未指定，該語音會成為新的 Talk 模式預設值。

支援的鍵：`voice` / `voice_id` / `voiceId`、`model` / `model_id` / `modelId`、`speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`、`seed`、`normalize`、`lang`、`output_format`、`latency_tier`、`once`。

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "溫暖地說話，並保持回答簡短。",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| 鍵                                       | 預設值                                     | 備註                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | 作用中的 Talk TTS 提供者。macOS 本機播放路徑可使用 `elevenlabs`、`mlx` 或 `system`。                                                                                                                                                                                        |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs 會依序回退至 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`，或在有 API 金鑰時使用第一個可用的語音。                                                                                                                                                                    |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | 回退至 `ELEVENLABS_API_KEY`（若可用，也會使用閘道 shell 設定檔）。                                                                                                                                                                                                         |
| `speechLocale`                           | 裝置預設值                                 | iOS/macOS 上裝置端 Talk 語音辨識所使用的 BCP 47 地區設定 ID。                                                                                                                                                                                                              |
| `silenceTimeoutMs`                       | `700` ms macOS/Android，`900` ms iOS       | Talk 傳送轉錄文字前的停頓時間窗。                                                                                                                                                                                                                                          |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS，`pcm_24000` Android | 設為 `mp3_*` 以強制使用 MP3 串流。                                                                                                                                                                                                                                         |
| `consultThinkingLevel`                   | 未設定                                     | 為即時 `openclaw_agent_consult` 呼叫背後的代理程式執行覆寫思考等級。                                                                                                                                                                                                       |
| `consultFastMode`                        | 未設定                                     | 為即時 `openclaw_agent_consult` 呼叫覆寫快速模式。                                                                                                                                                                                                                         |
| `realtime.provider`                      | -                                          | WebRTC 使用 `openai`，提供者 WebSocket 使用 `google`，或透過閘道中繼使用僅支援橋接的提供者。                                                                                                                                                                                |
| `realtime.providers.<id>`                | -                                          | 由提供者負責的即時設定。瀏覽器只會收到暫時性／受限制的工作階段認證資訊，絕不會收到標準 API 金鑰。                                                                                                                                                                           |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 內建 OpenAI Realtime 語音 ID（較舊的 `voice` 鍵仍可使用，但已淘汰）。目前的 `gpt-realtime-2.1` 語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`；建議使用 `marin` 和 `cedar` 以獲得最佳品質。 |
| `realtime.transport`                     | -                                          | `webrtc`：在 iOS 和瀏覽器中由用戶端負責的 OpenAI WebRTC。`provider-websocket`：由瀏覽器負責，在 iOS 上仍使用閘道中繼。`gateway-relay`：讓提供者音訊保留在閘道上；Android 只有使用此傳輸方式時才會採用即時模式。                                                                  |
| `realtime.brain`                         | -                                          | `agent-consult` 會透過閘道原則路由即時工具呼叫；`direct-tools` 是舊版直接工具相容模式；`none` 用於轉錄／外部協調。                                                                                                                                                           |
| `realtime.consultRouting`                | -                                          | 當提供者略過 `openclaw_agent_consult` 時，`provider-direct` 會保留提供者的直接回覆；`force-agent-consult` 則改為透過 OpenClaw 路由已完成的使用者轉錄文字。                                                                                                                    |
| `realtime.instructions`                  | -                                          | 將面向提供者的系統指示附加至 OpenClaw 內建的即時提示（語音風格／語調）；預設的 `openclaw_agent_consult` 指引會保留。                                                                                                                                                        |

`talk.catalog` 會公開標準提供者 ID 與登錄別名、每個提供者的有效模式／傳輸方式／大腦策略／即時音訊格式／能力旗標，以及執行階段所選取的就緒狀態結果。第一方 Talk 用戶端應讀取該目錄，而非在本機維護提供者別名；若較舊的閘道未提供群組就緒狀態，應將其視為未經驗證，而非明確認定為尚未設定。串流轉錄提供者會透過 `talk.catalog.transcription` 探索；在專用的 Talk 轉錄設定介面推出前，目前的閘道中繼會使用 Voice Call 串流提供者設定。

## macOS 使用者介面

- 選單列切換開關：**Talk**
- 設定分頁：**Talk Mode** 群組（語音 ID + 中斷切換開關）
- 浮動介面：圓球會呈現通用的對話波形（與 iOS、watchOS 及 Android 共用）。聆聽時會跟隨即時麥克風音量，說話時會跟隨實際的 TTS 播放包絡，思考時則會柔和地起伏。按一下圓球可暫停／繼續，按兩下可停止說話，按一下 X 可結束 Talk 模式。

## Android 使用者介面

- 語音分頁切換開關：**Talk**
- 手動 **Mic** 與 **Talk** 是互斥的擷取模式。
- 手動 Mic 與即時 Talk 會優先使用已連線的 Bluetooth Classic 或 BLE 耳機麥克風；若連線中斷，應用程式會要求使用另一個耳機輸入，或改用預設麥克風，並在擷取停止後恢復預設偏好設定。
- 當應用程式離開前景或使用者離開語音分頁時，手動 Mic 會停止。
- Talk Mode 會持續執行，直到關閉切換開關或節點中斷連線；啟用期間會使用 Android 的麥克風前景服務類型。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，以進行低延遲 `AudioTrack` 串流。

## 注意事項

- 需要語音辨識與麥克風權限。
- 原生 Talk 使用作用中的閘道工作階段，且僅在回應事件無法使用時，才會退回以歷史記錄輪詢。
- 閘道會透過 `talk.speak`，使用作用中的 Talk 提供者解析 Talk 播放。Android 僅在該 RPC 無法使用時，才會退回使用本機系統 TTS。
- macOS 本機 MLX 播放會在隨附的 `openclaw-mlx-tts` 輔助程式存在時使用它，否則使用 `PATH` 中的可執行檔。開發期間可設定 `OPENCLAW_MLX_TTS_BIN`，使其指向自訂的輔助程式二進位檔。
- 語音指令值範圍（ElevenLabs）：`stability`、`similarity` 和 `style` 接受 `0..1`；`speed` 接受 `0.5..2`；`latency_tier` 接受 `0..4`。

## 相關內容

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊與語音備註](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

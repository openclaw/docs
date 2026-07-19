---
read_when:
    - 在 macOS/iOS/Android 上實作對話模式
    - 變更語音、TTS 與中斷行為
summary: 對話模式：透過本機 STT/TTS 與即時語音進行持續的語音對話
title: 對話模式
x-i18n:
    generated_at: "2026-07-19T13:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1cb76789212054ce782703b9a456f5e809c0a45d1af5665445b17fcba4fd8f93
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式涵蓋五種執行階段形式：

- **原生 macOS/iOS/Android Talk**：本機語音辨識、閘道聊天，以及 `talk.speak` TTS。節點會公告 `talk` 功能，並宣告支援哪些 `talk.*` 命令。
- **iOS Talk（即時）**：對於選取 `webrtc` 傳輸方式或省略傳輸方式的 OpenAI 即時設定，由用戶端自行管理 WebRTC。明確的 `gateway-relay`、`provider-websocket` 及非 OpenAI 即時設定仍使用閘道管理的中繼；非即時設定則使用原生語音迴圈。
- **瀏覽器 Talk**：用戶端管理的 `webrtc`/`provider-websocket` 工作階段使用 `talk.client.create`，閘道管理的 `gateway-relay` 工作階段則使用 `talk.session.create`。`managed-room` 保留供閘道移交和對講機房間使用。
- **Android Talk（即時）**：透過 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 選擇啟用。否則 Android 會繼續使用原生語音辨識、閘道聊天及 `talk.speak`。
- **僅轉錄用戶端**：依序使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`，提供字幕／聽寫功能，但不產生助理語音回覆。單次上傳的語音留言仍使用[媒體理解](/zh-TW/nodes/media-understanding)音訊路徑。

原生 Talk 是一個持續迴圈：聆聽語音、透過作用中的工作階段將轉錄內容傳送給模型、等待回覆，然後使用已設定的 Talk 提供者（`talk.speak`）朗讀回覆。

用戶端管理的即時 Talk 會透過 `talk.client.toolCall` 轉送提供者工具呼叫，而非直接呼叫 `chat.send`。即時諮詢作用期間，用戶端可以呼叫 `talk.client.steer` 或 `talk.session.steer`，將語音輸入分類為 `status`、`steer`、`cancel` 或 `followup`。接受的引導會排入作用中的內嵌執行佇列；遭拒的引導則會傳回原因，例如 `no_active_run`、`not_streaming` 或 `compacting`。

已定稿的即時使用者和助理發言一律即時附加至作用中的代理程式工作階段，因此後續聊天與語音互動會共用同一份歷程記錄。用戶端管理的傳輸方式會使用穩定的項目 ID 回報已定稿的轉錄內容；閘道中繼工作階段則會在伺服器端附加相同事件。提供者工作階段也會收到 Discord 語音所使用、有範圍限制的即時設定檔情境。

源自語音的諮詢執行，在執行傳送訊息、控制節點、瀏覽器／電腦操作、服務變更、破壞性 Shell 命令或發布等高影響操作前，必須取得新的、明確的口頭確認。該確認僅適用於確切遭封鎖的工具引數，且只能使用一次；其他不相關的並行執行不受影響。通話結束時，OpenClaw 可針對會造成變更的工具，將精簡的**語音通話變更**摘要傳送至該工作階段最後一個非 WebChat 傳遞目標。

僅轉錄 Talk 會發出與即時和 STT/TTS 工作階段相同的 Talk 事件封裝，但使用 `mode: "transcription"` 和 `brain: "none"`。所有 Talk 工作階段都會在 `talk.event` 頻道上廣播事件；用戶端會訂閱此頻道，以接收部分／最終轉錄更新（`transcript.delta`/`transcript.done`）及其他工作階段遙測資料。

瀏覽器 Video Talk 適用於 OpenAI Realtime WebRTC 和 Google Live
提供者 WebSocket 工作階段。當 `describe_view` 要求視覺情境時，
OpenAI 會收到單張有範圍限制的 JPEG；它不會收到持續的攝影機
軌道。Google Live 會直接從瀏覽器接收有範圍限制的 JPEG 畫格，
最高每秒一個畫格，而 `describe_view` 會回報攝影機串流
狀態。在這兩種情況下，攝影機畫格都會略過閘道，而停止 Talk
會釋放攝影機和麥克風軌道。

## 行為（macOS）

- 啟用 Talk 模式時，覆疊層會持續顯示。
- **聆聽中 &rarr; 思考中 &rarr; 說話中**階段轉換。
- 短暫停頓（靜音時間範圍）後，會傳送目前的轉錄內容。
- 回覆會寫入 WebChat（與輸入文字相同）。
- **語音中斷**（預設開啟）：如果使用者在助理說話時開口，播放會停止，且中斷時間戳記會記錄供下一個提示使用。

## 回覆中的語音指令

助理可以在回覆開頭加上一行 JSON 來控制語音：

```json
{ "voice": "<voice-id>", "once": true }
```

規則：

- 僅限第一個非空白行；TTS 播放前會移除該 JSON 行。
- 未知的鍵會被忽略。
- `once: true` 僅適用於目前的回覆；若未指定，該語音會成為新的 Talk 模式預設值。

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
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| 鍵                                       | 預設值                                     | 備註                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | 主動 Talk TTS 提供者。macOS 本機播放路徑請使用 `elevenlabs`、`mlx` 或 `system`。                                                                                                                                                                             |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs 會改用 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`，或第一個具有 API 金鑰的可用語音。                                                                                                                                                             |
| `speechLocale`                           | 裝置預設值                             | Android、iOS 與 macOS 語音辨識所使用的 BCP 47 語言地區設定。Android 也會將語言部分轉送至即時輸入轉錄。                                                                                                                                |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | 改用 `ELEVENLABS_API_KEY`（若可用，則改用閘道 shell 設定檔）。                                                                                                                                                                                                |
| `speechLocale`                           | 裝置預設值                             | iOS/macOS 裝置端 Talk 語音辨識所使用的 BCP 47 語言地區 ID。                                                                                                                                                                                                       |
| `silenceTimeoutMs`                       | `700` ms macOS/Android，`900` ms iOS       | Talk 傳送轉錄文字前的暫停時間窗。                                                                                                                                                                                                                             |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS，`pcm_24000` Android | 設定 `mp3_*` 以強制使用 MP3 串流。                                                                                                                                                                                                                                        |
| `consultThinkingLevel`                   | 未設定                                      | 即時 `openclaw_agent_consult` 呼叫背後之代理程式執行的思考層級覆寫。                                                                                                                                                                                  |
| `consultFastMode`                        | 未設定                                      | 即時 `openclaw_agent_consult` 呼叫的快速模式覆寫。                                                                                                                                                                                                            |
| `realtime.provider`                      | -                                          | WebRTC 使用 `openai`、提供者 WebSocket 使用 `google`，或透過閘道轉送使用僅限橋接的提供者。                                                                                                                                                                     |
| `realtime.providers.<id>`                | -                                          | 由提供者擁有的即時設定。瀏覽器只會收到暫時性／受限的工作階段認證資訊，絕不會收到標準 API 金鑰。                                                                                                                                                 |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 內建 OpenAI Realtime 語音 ID（較舊的 `voice` 鍵仍可運作，但已淘汰）。目前的 `gpt-realtime-2.1` 語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`；建議使用 `marin` 和 `cedar`，以獲得最佳品質。 |
| `realtime.transport`                     | -                                          | `webrtc`：iOS 與瀏覽器中由用戶端擁有的 OpenAI WebRTC。`provider-websocket`：由瀏覽器擁有，在 iOS 上維持使用閘道轉送。`gateway-relay`：將提供者音訊保留在閘道上；Android 僅在使用此傳輸方式時採用即時模式。                                  |
| `realtime.brain`                         | -                                          | `agent-consult` 透過閘道政策路由即時工具呼叫；`direct-tools` 是舊版直接工具相容模式；`none` 用於轉錄／外部協調。                                                                                                 |
| `realtime.consultRouting`                | -                                          | 當提供者略過 `openclaw_agent_consult` 時，`provider-direct` 會保留提供者的直接回覆；`force-agent-consult` 則改為透過 OpenClaw 路由已完成的使用者轉錄文字。                                                                                          |
| `realtime.instructions`                  | -                                          | 將面向提供者的系統指示附加至 OpenClaw 內建的即時提示詞（語音風格／語調）；預設的 `openclaw_agent_consult` 指引會予以保留。                                                                                                                |

`talk.catalog` 會公開標準提供者 ID 與登錄別名、每個提供者的有效模式／傳輸方式／大腦策略／即時音訊格式／能力旗標，以及執行階段選定的就緒結果。第一方 Talk 用戶端應讀取該目錄，而不是在本機維護提供者別名；若較舊的閘道省略群組就緒狀態，應將其視為未經驗證，而非明確認定尚未設定。串流轉錄提供者會透過 `talk.catalog.transcription` 探索；目前的閘道轉送會使用 Voice Call 串流提供者設定，直到推出專用的 Talk 轉錄設定介面。

## macOS 使用者介面

- 選單列切換開關：**Talk**
- 設定分頁：**Talk Mode** 群組（語音 ID + 中斷切換開關）
- 浮層：球體會顯示通用 Talk 波形（與 iOS、watchOS 和 Android 共用）。聆聽時會跟隨即時麥克風音量，說話時會跟隨實際的 TTS 播放包絡，思考時則會輕柔地呼吸。按一下球體可暫停／繼續，按兩下可停止說話，按一下 X 可退出 Talk 模式。

## Android 使用者介面

- Android 的主要導覽項目為 **Home**、**Chat** 和 **Settings**。語音輸入
  位於 Chat 編輯器中，而非獨立的 Voice 分頁。
- 輕觸編輯器麥克風即可使用裝置端聽寫。長按可錄製
  語音記事附件。從 Talk 波形啟動持續 Talk。
- 聽寫、語音記事錄製與 Talk 是彼此互斥的麥克風
  路徑；啟動其中一項會停止或阻擋其他項目。
- 即時 Talk 會優先使用已連線的 Bluetooth Classic 或 BLE 耳機
  麥克風；若連線中斷，應用程式會要求使用另一個耳機輸入，或
  改用預設麥克風，並在擷取停止後
  恢復預設偏好設定。
- 當應用程式離開前景，或
  使用者離開 Chat 時，聽寫與語音記事錄製會停止。
- Talk Mode 會持續執行，直到切換為關閉或節點中斷連線；啟用期間會使用 Android 的麥克風前景服務類型。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，以進行低延遲 `AudioTrack` 串流。

## 備註

- 需要語音 + 麥克風權限。
- 原生 Talk 會使用作用中的閘道工作階段，僅在無法取得回應事件時改用歷史記錄輪詢。
- 閘道會使用作用中的 Talk 提供者，透過 `talk.speak` 解析 Talk 播放。Android 僅在該 RPC 無法使用時，才會改用本機系統 TTS。
- macOS 本機 MLX 播放會使用隨附的 `openclaw-mlx-tts` 輔助程式（若存在），或使用 `PATH` 上的可執行檔。開發期間可設定 `OPENCLAW_MLX_TTS_BIN`，使其指向自訂輔助二進位檔。
- 語音指令值範圍（ElevenLabs）：`stability`、`similarity` 和 `style` 接受 `0..1`；`speed` 接受 `0.5..2`；`latency_tier` 接受 `0..4`。

## 相關內容

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊與語音記事](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

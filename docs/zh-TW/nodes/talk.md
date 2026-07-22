---
read_when:
    - 在 macOS/iOS/Android 上實作對話模式
    - 變更語音／文字轉語音／中斷行為
summary: 對話模式：透過本機 STT/TTS 與即時語音進行連續語音對話
title: 對話模式
x-i18n:
    generated_at: "2026-07-21T22:39:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b21319eee169ba898331f87279a2b2a5170441131a1e9cdc85c15b268d165e21
    source_path: nodes/talk.md
    workflow: 16
---

對話模式涵蓋五種執行階段形式：

- **原生 macOS/iOS/Android 對話**：原生語音辨識、閘道聊天，以及 `talk.speak` TTS。macOS/iOS 上的 Apple Speech 辨識可能會使用網路服務；Android 的行為取決於已安裝的語音服務。節點會公告 `talk` 功能，並宣告其支援哪些 `talk.*` 命令。
- **iOS 對話（即時）**：對於選取 `webrtc` 傳輸或省略傳輸的 OpenAI 即時設定，由用戶端擁有 WebRTC。明確指定的 `gateway-relay`、`provider-websocket`，以及非 OpenAI 即時設定仍使用閘道擁有的中繼；非即時設定則使用原生語音迴圈。
- **瀏覽器對話**：用戶端擁有的 `webrtc`/`provider-websocket` 工作階段使用 `talk.client.create`，閘道擁有的 `gateway-relay` 工作階段則使用 `talk.session.create`。`managed-room` 保留供閘道交接和對講機房間使用。
- **Android 對話（即時）**：透過 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 選擇啟用。否則，Android 會繼續使用原生語音辨識、閘道聊天和 `talk.speak`。
- **僅轉錄用戶端**：依序使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`，在沒有助理語音回應的情況下提供字幕／聽寫。單次上傳的語音留言仍使用[媒體理解](/zh-TW/nodes/media-understanding)音訊路徑。

原生對話是一個連續迴圈：聆聽語音、透過作用中的工作階段將轉錄文字傳送至模型、等待回應，接著透過已設定的對話提供者（`talk.speak`）朗讀回應。

用戶端擁有的即時對話會透過 `talk.client.toolCall` 轉送提供者工具呼叫，而非直接呼叫 `chat.send`。即時諮詢作用中時，用戶端可以呼叫 `talk.client.steer` 或 `talk.session.steer`，將口述輸入分類為 `status`、`steer`、`cancel` 或 `followup`。接受的引導會排入作用中的內嵌執行；遭拒的引導會傳回原因，例如 `no_active_run`、`not_streaming` 或 `compacting`。

已定稿的即時使用者與助理話語一律會即時附加至作用中的代理程式工作階段，因此後續聊天與語音輪次會共用同一份歷程記錄。用戶端擁有的傳輸會使用穩定的項目 ID 回報其已定稿轉錄文字；閘道中繼工作階段則在伺服器端附加相同事件。提供者工作階段也會收到 Discord 語音所使用的有限即時設定檔情境。

語音發起的諮詢執行，在進行傳送訊息、控制節點、瀏覽器／電腦操作、服務變更、破壞性殼層命令或發布等高影響操作前，必須取得新的、明確無誤的口頭確認。該確認僅適用於遭封鎖工具的確切引數，且只能使用一次；其他不相關的並行執行不受影響。通話結束時，OpenClaw 可以將異動工具的精簡**語音通話變更**摘要，傳送至該工作階段最後一個非 WebChat 的傳遞目標。

僅轉錄對話會發出與即時和 STT/TTS 工作階段相同的對話事件封包，但使用 `mode: "transcription"` 和 `brain: "none"`。所有對話工作階段都會在 `talk.event` 頻道上廣播事件；用戶端會訂閱該頻道，以接收部分／最終轉錄文字更新（`transcript.delta`/`transcript.done`）及其他工作階段遙測資料。

瀏覽器視訊對話適用於 OpenAI Realtime WebRTC 和 Google Live
提供者 WebSocket 工作階段。當 `describe_view` 要求視覺情境時，
OpenAI 會取得一張大小受限的 JPEG；它不會收到連續的攝影機軌道。
Google Live 會直接從瀏覽器接收大小受限的 JPEG 畫面，頻率最高為
每秒一個畫面，而 `describe_view` 會回報攝影機串流狀態。在這兩種
情況下，攝影機畫面都會略過閘道，停止對話則會釋放攝影機與麥克風軌道。

## 行為（macOS）

- 啟用對話模式時，覆疊介面會持續顯示。
- **聆聽 &rarr; 思考 &rarr; 說話**階段轉換。
- 短暫停頓（靜音時間窗）後，會傳送目前的轉錄文字。
- 回覆會寫入 WebChat（與輸入文字相同）。
- **語音中斷**（預設開啟）：如果使用者在助理說話時開口，播放會停止，且中斷時間戳記會記錄下來供下一個提示使用。

## 回覆中的語音指令

助理可以在回覆前加上一行 JSON 來控制語音：

```json
{ "voice": "<voice-id>", "once": true }
```

規則：

- 僅限第一個非空白行；TTS 播放前會移除該 JSON 行。
- 未知的鍵會被忽略。
- `once: true` 僅套用於目前的回覆；若未指定，該語音會成為新的對話模式預設值。

支援的鍵：`voice` / `voice_id` / `voiceId`、`model` / `model_id` / `modelId`、`speed`、`rate`（每分鐘字數）、`stability`、`similarity`、`style`、`speakerBoost`、`seed`、`normalize`、`lang`、`output_format`、`latency_tier`、`once`。

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
| `provider`                               | -                                          | Active Talk TTS 提供者。macOS 本機播放路徑請使用 `elevenlabs`、`mlx` 或 `system`。                                                                                                                                                                             |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs 會回退至 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`，或使用第一個具有 API 金鑰的可用語音。                                                                                                                                                             |
| `speechLocale`                           | 裝置預設值                             | Android、iOS 與 macOS 原生語音辨識使用的 BCP 47 語言地區設定。Apple Speech 可能使用網路服務；Android 也會將語言部分轉送至即時輸入轉錄。                                                                                  |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | 回退至 `ELEVENLABS_API_KEY`（若可用，則使用閘道 shell 設定檔）。                                                                                                                                                                                                |
| `silenceTimeoutMs`                       | macOS/Android 為 `700` ms，iOS 為 `900` ms       | Talk 傳送轉錄內容前的暫停時間窗口。                                                                                                                                                                                                                             |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | macOS/iOS 為 `pcm_44100`，Android 為 `pcm_24000` | 設定 `mp3_*` 以強制使用 MP3 串流。                                                                                                                                                                                                                                        |
| `consultThinkingLevel`                   | 未設定                                      | 即時 `openclaw_agent_consult` 呼叫背後之代理程式執行的思考層級覆寫。                                                                                                                                                                                  |
| `consultFastMode`                        | 未設定                                      | 即時 `openclaw_agent_consult` 呼叫的快速模式覆寫。                                                                                                                                                                                                            |
| `realtime.provider`                      | -                                          | `openai` 用於 WebRTC，`google` 用於提供者 WebSocket，或透過閘道轉送使用僅支援橋接的提供者。                                                                                                                                                                     |
| `realtime.providers.<id>`                | -                                          | 由提供者擁有的即時設定。瀏覽器只會收到暫時性／受限的工作階段認證資訊，絕不會收到標準 API 金鑰。                                                                                                                                                 |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 內建 OpenAI Realtime 語音 ID（較舊的 `voice` 鍵仍可使用，但已棄用）。目前的 `gpt-realtime-2.1` 語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`；建議使用 `marin` 和 `cedar` 以獲得最佳品質。 |
| `realtime.transport`                     | -                                          | `webrtc`：在 iOS 與瀏覽器中由用戶端擁有的 OpenAI WebRTC。`provider-websocket`：由瀏覽器擁有，在 iOS 上仍透過閘道轉送。`gateway-relay`：將提供者音訊保留在閘道上；Android 僅在使用此傳輸方式時採用即時模式。                                  |
| `realtime.brain`                         | -                                          | `agent-consult` 透過閘道政策路由即時工具呼叫；`direct-tools` 是舊版直接工具相容模式；`none` 用於轉錄／外部協調。                                                                                                 |
| `realtime.consultRouting`                | -                                          | 當提供者略過 `openclaw_agent_consult` 時，`provider-direct` 會保留提供者的直接回覆；`force-agent-consult` 則改為透過 OpenClaw 路由已定稿的使用者轉錄內容。                                                                                          |
| `realtime.instructions`                  | -                                          | 將面向提供者的系統指示附加至 OpenClaw 內建的即時提示（語音風格／語調）；預設的 `openclaw_agent_consult` 指引會予以保留。                                                                                                                |

`talk.catalog` 會公開標準提供者 ID 與登錄別名、每個提供者的有效模式／傳輸方式／大腦策略／即時音訊格式／能力旗標，以及執行階段選定的就緒結果。第一方 Talk 用戶端應讀取該目錄，而非在本機維護提供者別名；如果較舊的閘道省略群組就緒狀態，應視為未經驗證，而非明確認定為尚未設定。串流轉錄提供者透過 `talk.catalog.transcription` 探索；目前的閘道轉送會使用 Voice Call 串流提供者設定，直到推出專用的 Talk 轉錄設定介面。

## macOS 使用者介面

- 選單列切換開關：**Talk**
- 設定分頁：**Talk 模式**群組（語音 ID + 中斷切換開關）
- 浮動層：圓球會呈現通用 Talk 波形（與 iOS、watchOS 和 Android 共用）。聆聽時會跟隨即時麥克風音量，說話時會跟隨實際 TTS 播放包絡，思考時則會柔和地脈動。按一下圓球可暫停／繼續，按兩下可停止說話，按一下 X 可結束 Talk 模式。

## Android 使用者介面

- Android 的主要導覽項目為 **首頁**、**聊天**與**設定**。語音輸入
  位於聊天訊息編寫器中，而非獨立的語音分頁。
- 點選訊息編寫器的麥克風即可使用裝置端聽寫。長按可錄製
  語音備忘附件。從 Talk 波形開始持續 Talk。
- 聽寫、語音備忘錄製和 Talk 是互斥的麥克風
  路徑；啟動其中一項會停止或阻擋其他項目。
- 即時 Talk 會優先使用已連線的 Bluetooth Classic 或 BLE 耳機
  麥克風；若其連線中斷，應用程式會要求使用另一個耳機輸入，或
  回退至預設麥克風，並在擷取停止後還原預設偏好設定。
- 當應用程式離開前景或
  使用者離開聊天時，聽寫和語音備忘錄製會停止。
- Talk 模式會持續執行，直到將其關閉或節點中斷連線；啟用期間會使用 Android 的麥克風前景服務類型。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，以進行低延遲 `AudioTrack` 串流。

## 備註

- 需要語音與麥克風權限。
- 原生 Talk 使用作用中的閘道工作階段，且只有在回應事件不可用時才會回退至歷程輪詢。
- 閘道會使用作用中的 Talk 提供者，透過 `talk.speak` 解析 Talk 播放。Android 只有在該 RPC 不可用時才會回退至本機系統 TTS。
- macOS 本機 MLX 播放會在內附的 `openclaw-mlx-tts` 輔助程式存在時使用該程式，否則使用 `PATH` 上的可執行檔。開發期間可設定 `OPENCLAW_MLX_TTS_BIN`，使其指向自訂輔助程式二進位檔。
- 語音指令值範圍（ElevenLabs）：`stability`、`similarity` 和 `style` 接受 `0..1`；`speed` 接受 `0.5..2`；`latency_tier` 接受 `0..4`。

## 相關內容

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊與語音備忘](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

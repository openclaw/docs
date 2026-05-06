---
read_when:
    - 在 macOS/iOS/Android 上實作對話模式
    - 變更語音/TTS/中斷行為
summary: Talk 模式：透過本機 STT/TTS 和即時語音進行連續語音對話
title: 交談模式
x-i18n:
    generated_at: "2026-05-06T02:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

語音對話模式有兩種執行階段形態：

- 原生 macOS/iOS/Android 語音對話使用本機語音辨識、Gateway 聊天和 `talk.speak` TTS。節點會公告 `talk` 能力，並宣告它們支援的 `talk.*` 命令。
- 瀏覽器語音對話使用 `talk.client.create` 建立由用戶端擁有的 `webrtc` 和 `provider-websocket` 工作階段，或使用 `talk.session.create` 建立由 Gateway 擁有的 `gateway-relay` 工作階段。`managed-room` 保留給 Gateway 交接和對講機房間使用。
- 僅轉錄用戶端使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然後在需要無助理語音回應的字幕或聽寫時，使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`。

原生語音對話是一個連續的語音對話迴圈：

1. 聆聽語音
2. 透過作用中的工作階段將逐字稿傳送給模型
3. 等待回應
4. 透過已設定的語音對話提供者朗讀回應（`talk.speak`）

瀏覽器即時語音對話會透過 `talk.client.toolCall` 轉送提供者工具呼叫；瀏覽器用戶端不會直接呼叫 `chat.send` 進行即時諮詢。

僅轉錄語音對話會發出與即時和 STT/TTS 工作階段相同的共用語音對話事件封套，但使用 `mode: "transcription"` 和 `brain: "none"`。它適用於字幕、聽寫和僅觀察的語音擷取；一次性上傳的語音備註仍使用媒體/音訊路徑。

## 行為（macOS）

- 啟用語音對話模式時，會顯示**常駐浮層**。
- **聆聽 → 思考 → 說話** 階段轉換。
- 在**短暫停頓**（靜音視窗）時，會送出目前逐字稿。
- 回覆會**寫入 WebChat**（與輸入文字相同）。
- **語音打斷**（預設開啟）：如果使用者在助理說話時開始說話，我們會停止播放，並記錄打斷時間戳記供下一個提示使用。

## 回覆中的語音指令

助理可在回覆前加上一個**單行 JSON** 來控制語音：

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
- `speed`、`rate` (WPM)、`stability`、`similarity`、`style`、`speakerBoost`
- `seed`、`normalize`、`lang`、`output_format`、`latency_tier`
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
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

預設值：

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未設定時，語音對話會在送出逐字稿前保留平台預設的暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）
- `provider`：選取作用中的語音對話提供者。macOS 本機播放路徑請使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`：ElevenLabs 會退回使用 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API 金鑰可用時使用第一個 ElevenLabs 語音）。
- `providers.elevenlabs.modelId`：未設定時預設為 `eleven_v3`。
- `providers.mlx.modelId`：未設定時預設為 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`：退回使用 `ELEVENLABS_API_KEY`（或可用時使用 gateway shell profile）。
- `realtime.provider`：選取作用中的瀏覽器/伺服器即時語音提供者。WebRTC 請使用 `openai`，提供者 WebSocket 請使用 `google`，或透過 Gateway relay 使用僅橋接提供者。
- `realtime.providers.<provider>` 儲存由提供者擁有的即時設定。瀏覽器只會收到臨時或受限的工作階段憑證，絕不會收到標準 API 金鑰。
- `realtime.brain`：`agent-consult` 會透過 Gateway 政策路由即時工具呼叫；`direct-tools` 是僅限擁有者的相容行為；`none` 用於轉錄或外部編排。
- `talk.catalog` 會公開每個提供者的有效模式、傳輸、brain 策略、即時音訊格式和能力旗標，讓第一方語音對話用戶端可避開不支援的組合。
- 串流轉錄提供者會透過 `talk.catalog.transcription` 探索。在專用語音對話轉錄設定介面新增前，目前的 Gateway relay 會使用語音通話串流提供者設定。
- `speechLocale`：iOS/macOS 裝置端語音對話語音辨識的選用 BCP 47 語言環境 ID。保留未設定即可使用裝置預設值。
- `outputFormat`：macOS/iOS 預設為 `pcm_44100`，Android 預設為 `pcm_24000`（設定 `mp3_*` 可強制使用 MP3 串流）

## macOS UI

- 選單列切換：**語音對話**
- 設定分頁：**語音對話模式** 群組（語音 ID + 打斷切換）
- 浮層：
  - **聆聽**：雲朵會隨麥克風音量脈動
  - **思考**：下沉動畫
  - **說話**：放射環
  - 點擊雲朵：停止說話
  - 點擊 X：退出語音對話模式

## Android UI

- 語音分頁切換：**語音對話**
- 手動 **Mic** 和 **語音對話** 是互斥的執行階段擷取模式。
- 當應用程式離開前景，或使用者離開語音分頁時，手動 Mic 會停止。
- 語音對話模式會持續執行，直到被切換關閉或 Android 節點中斷連線，且在作用中時會使用 Android 的麥克風前景服務類型。

## 注意事項

- 需要語音 + 麥克風權限。
- 原生語音對話使用作用中的 Gateway 工作階段，並且只有在回應事件不可用時才退回使用歷史記錄輪詢。
- 瀏覽器即時語音對話會對 `openclaw_agent_consult` 使用 `talk.client.toolCall`，而不是將 `chat.send` 暴露給提供者擁有的瀏覽器工作階段。
- 僅轉錄語音對話使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；用戶端訂閱 `talk.event` 以取得部分/最終逐字稿更新。
- gateway 會使用作用中的語音對話提供者，透過 `talk.speak` 解析語音對話播放。Android 只有在該 RPC 不可用時才會退回使用本機系統 TTS。
- macOS 本機 MLX 播放會在存在時使用內建的 `openclaw-mlx-tts` 輔助程式，或使用 `PATH` 上的可執行檔。開發期間可設定 `OPENCLAW_MLX_TTS_BIN` 指向自訂輔助程式二進位檔。
- `eleven_v3` 的 `stability` 會驗證為 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 設定 `latency_tier` 時，會驗證為 `0..4`。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 輸出格式，用於低延遲 AudioTrack 串流。

## 相關

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊和語音備註](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

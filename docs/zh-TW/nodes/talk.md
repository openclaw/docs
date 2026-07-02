---
read_when:
    - 在 macOS/iOS/Android 上實作 Talk 模式
    - 變更語音/TTS/中斷行為
summary: 對話模式：跨本機 STT/TTS 與即時語音的連續語音對話
title: 交談模式
x-i18n:
    generated_at: "2026-07-02T22:22:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式有兩種執行階段形態：

- 原生 macOS/iOS/Android Talk 使用本機語音辨識、閘道聊天和 `talk.speak` TTS。節點會宣告 `talk` capability，並宣告其支援的 `talk.*` commands。
- iOS Talk 會針對選取 `webrtc` 或省略 transport 的 OpenAI realtime 設定，使用 client-owned WebRTC。明確的 `gateway-relay`、`provider-websocket` 和非 OpenAI realtime 設定會留在 Gateway-owned relay；非 realtime 設定則使用原生語音迴圈。
- 瀏覽器 Talk 會使用 `talk.client.create` 建立 client-owned `webrtc` 和 `provider-websocket` sessions，或使用 `talk.session.create` 建立 Gateway-owned `gateway-relay` sessions。`managed-room` 保留給閘道 handoff 和對講機 rooms。
- Android Talk 可以透過 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 選擇加入 Gateway-owned realtime relay sessions。否則會維持使用原生語音辨識、閘道聊天和 `talk.speak`。
- 僅轉錄 clients 使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然後在需要字幕或聽寫且不需要助理語音回應時，使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`。

原生 Talk 是連續語音對話迴圈：

1. 聆聽語音
2. 透過作用中的 session 將轉錄文字傳送給模型
3. 等待回應
4. 透過已設定的 Talk provider（`talk.speak`）播放語音

Client-owned realtime Talk 會透過 `talk.client.toolCall` 轉送 provider tool calls；這些 clients 不會為 realtime consults 直接呼叫 `chat.send`。
當 realtime consult 作用中時，Talk clients 可以使用 `talk.client.steer` 或
`talk.session.steer` 將語音輸入分類為 `status`、`steer`、`cancel` 或
`followup`。被接受的 steering 會排入作用中的 embedded run；被拒絕的
steering 會回傳結構化原因，例如 `no_active_run`、`not_streaming`
或 `compacting`。

僅轉錄 Talk 會發出與 realtime 和 STT/TTS sessions 相同的通用 Talk event envelope，但使用 `mode: "transcription"` 和 `brain: "none"`。它用於字幕、聽寫和僅觀察的語音擷取；一次性上傳的語音備註仍使用 media/audio path。

## 行為（macOS）

- Talk 模式啟用時顯示**永遠置頂 overlay**。
- **Listening → Thinking → Speaking** 階段轉換。
- 在**短暫停頓**（靜音視窗）時，會送出目前的轉錄文字。
- 回覆會**寫入 WebChat**（與打字相同）。
- **語音中斷**（預設開啟）：如果使用者在助理說話時開始說話，我們會停止播放，並記錄中斷時間戳供下一個 prompt 使用。

## 回覆中的語音指示

助理可以在回覆前加上一個**單行 JSON** 來控制語音：

```json
{ "voice": "<voice-id>", "once": true }
```

規則：

- 僅限第一個非空白行。
- 未知 keys 會被忽略。
- `once: true` 只套用於目前回覆。
- 若沒有 `once`，該語音會成為 Talk 模式的新預設值。
- TTS 播放前會移除 JSON 行。

支援的 keys：

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
- `silenceTimeoutMs`: 未設定時，Talk 會在送出轉錄文字前保留平台預設的暫停視窗（`700 ms on macOS and Android, 900 ms on iOS`）
- `provider`: 選取作用中的 Talk provider。macOS 本機播放路徑使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`: ElevenLabs 會 fallback 至 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API key 可用時使用第一個 ElevenLabs voice）。
- `providers.elevenlabs.modelId`: 未設定時預設為 `eleven_v3`。
- `providers.mlx.modelId`: 未設定時預設為 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`: fallback 至 `ELEVENLABS_API_KEY`（或可用時使用 gateway shell profile）。
- `consultThinkingLevel`: realtime `openclaw_agent_consult` calls 後方完整 OpenClaw agent run 的可選 thinking level override。
- `consultFastMode`: realtime `openclaw_agent_consult` calls 的可選 fast-mode override。
- `realtime.provider`: 選取作用中的 realtime voice provider。WebRTC 使用 `openai`，provider WebSocket 使用 `google`，或透過閘道 relay 使用 bridge-only provider。
- `realtime.providers.<provider>` 儲存 provider-owned realtime config。瀏覽器只會收到 ephemeral 或受限制的 session credentials，絕不會收到標準 API key。
- `realtime.providers.openai.voice`: 內建 OpenAI Realtime voice id。目前 `gpt-realtime-2` voices 為 `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin` 和 `cedar`；建議使用 `marin` 和 `cedar` 以取得最佳品質。
- `realtime.transport`: `webrtc` 在 iOS 和瀏覽器中使用 client-owned OpenAI WebRTC。`provider-websocket` 由瀏覽器擁有，但在 iOS 上仍留在閘道 relay。`gateway-relay` 讓 provider audio 保持在閘道；Android 只對此 transport 使用 realtime，否則維持其原生 STT/TTS 迴圈。
- `realtime.brain`: `agent-consult` 透過閘道 policy 路由 realtime tool calls；`direct-tools` 是 legacy direct-tool compatibility 行為；`none` 用於轉錄或外部 orchestration。
- `realtime.consultRouting`: `provider-direct` 會在 provider 跳過 `openclaw_agent_consult` 時保留 provider 的直接回覆；`force-agent-consult` 則讓閘道 relay 透過 OpenClaw 路由 finalized user transcripts。
- `realtime.instructions`: 將面向 provider 的 system instructions 附加到 OpenClaw 內建 realtime prompt。用於語音風格和語調；OpenClaw 會保留預設的 `openclaw_agent_consult` guidance。
- `talk.catalog` 公開每個 provider 的有效 modes、transports、brain strategies、realtime audio formats 和 capability flags，讓第一方 Talk clients 可以避免不支援的組合。
- Streaming transcription providers 會透過 `talk.catalog.transcription` 探索。目前的閘道 relay 會使用 Voice Call streaming provider config，直到新增專用的 Talk transcription config surface。
- `speechLocale`: iOS/macOS 裝置端 Talk 語音辨識的可選 BCP 47 locale id。未設定則使用裝置預設值。
- `outputFormat`: macOS/iOS 預設為 `pcm_44100`，Android 預設為 `pcm_24000`（設定 `mp3_*` 可強制 MP3 streaming）

## macOS UI

- 選單列切換：**Talk**
- 設定分頁：**Talk Mode** 群組（voice id + interrupt toggle）
- Overlay：
  - **Listening**：cloud 隨 mic level pulse
  - **Thinking**：sinking animation
  - **Speaking**：radiating rings
  - 點擊 cloud：停止說話
  - 點擊 X：退出 Talk 模式

## Android UI

- Voice 分頁切換：**Talk**
- 手動 **Mic** 和 **Talk** 是互斥的執行階段擷取模式。
- 當 app 離開前景或使用者離開 Voice 分頁時，手動 Mic 會停止。
- Talk Mode 會持續執行，直到被關閉或 Android 節點中斷連線，且作用中時使用 Android 的 microphone foreground-service type。

## 備註

- 需要 Speech + Microphone 權限。
- 原生 Talk 使用作用中的閘道 session，且只有在 response events 不可用時才 fallback 至 history polling。
- Client-owned realtime Talk 使用 `talk.client.toolCall` 處理 `openclaw_agent_consult`，而不是將 `chat.send` 暴露給 provider-owned sessions。
- 僅轉錄 Talk 使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；clients 會訂閱 `talk.event` 取得 partial/final transcript updates。
- gateway 會使用作用中的 Talk provider，透過 `talk.speak` 解析 Talk playback。Android 只會在該 RPC 不可用時 fallback 至本機 system TTS。
- macOS 本機 MLX playback 會在存在時使用 bundled `openclaw-mlx-tts` helper，或使用 `PATH` 上的可執行檔。開發期間可設定 `OPENCLAW_MLX_TTS_BIN` 指向自訂 helper binary。
- `eleven_v3` 的 `stability` 會驗證為 `0.0`、`0.5` 或 `1.0`；其他 models 接受 `0..1`。
- 設定 `latency_tier` 時會驗證為 `0..4`。
- Android 支援 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` output formats，以進行低延遲 AudioTrack streaming。

## 相關

- [語音喚醒](/zh-TW/nodes/voicewake)
- [音訊和語音備註](/zh-TW/nodes/audio)
- [媒體理解](/zh-TW/nodes/media-understanding)

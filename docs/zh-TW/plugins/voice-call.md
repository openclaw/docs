---
read_when:
    - 您想要從 OpenClaw 撥出語音通話
    - 您正在設定或開發 voice-call Plugin
    - 你需要電話通訊上的即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥打對外語音通話並接聽來電，並可選擇啟用即時語音和串流轉錄
title: 語音通話 Plugin
x-i18n:
    generated_at: "2026-04-30T03:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls for OpenClaw via a Plugin. 支援出站通知、
多輪對話、全雙工即時語音、串流
轉錄，以及具允許清單政策的入站通話。

**目前提供者：** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (開發/無網路)。

<Note>
Voice Call Plugin 會在 **Gateway 程序內部** 執行。如果你使用
遠端 Gateway，請在執行 Gateway 的機器上安裝並設定 Plugin，
然後重新啟動 Gateway 以載入它。
</Note>

## 快速開始

<Steps>
  <Step title="安裝 Plugin">
    <Tabs>
      <Tab title="從 npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="從本機資料夾（開發）">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    如果 npm 回報 OpenClaw 擁有的套件已棄用，該套件版本
    來自較舊的外部套件發行列；請使用目前已封裝的 OpenClaw
    建置，或在較新的 npm 套件發布前使用本機資料夾路徑。

    之後請重新啟動 Gateway，讓 Plugin 載入。

  </Step>
  <Step title="設定提供者和 Webhook">
    在 `plugins.entries.voice-call.config` 下設定 config（完整形狀請參閱下方
    [設定](#configuration)）。至少需要：
    `provider`、提供者憑證、`fromNumber`，以及可公開
    存取的 Webhook URL。
  </Step>
  <Step title="驗證設定">
    ```bash
    openclaw voicecall setup
    ```

    預設輸出適合在聊天記錄和終端機中閱讀。它會檢查
    Plugin 是否啟用、提供者憑證、Webhook 曝露，以及
    是否只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。腳本請使用
    `--json`。

  </Step>
  <Step title="煙霧測試">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都是 dry run。加入 `--yes` 才會實際撥出一通短暫的
    出站通知通話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對於 Twilio、Telnyx 和 Plivo，設定必須解析為 **公開 Webhook URL**。
如果 `publicUrl`、通道 URL、Tailscale URL，或 serve 後備方案
解析到 loopback 或私有網路空間，設定會失敗，而不是
啟動無法接收電信業者 Webhook 的提供者。
</Warning>

## 設定

如果 `enabled: true` 但所選提供者缺少憑證，
Gateway 啟動時會記錄 setup-incomplete 警告，列出缺少的 keys，並
略過啟動 runtime。Commands、RPC 呼叫和代理工具在使用時仍會
回傳確切缺少的提供者設定。

<Note>
Voice-call 憑證接受 SecretRefs。`plugins.entries.voice-call.config.twilio.authToken` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 會透過標準 SecretRef 表面解析；請參閱 [SecretRef 憑證表面](/zh-TW/reference/secretref-credential-surface)。
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="提供者曝露與安全性注意事項">
    - Twilio、Telnyx 和 Plivo 都需要 **可公開存取** 的 Webhook URL。
    - `mock` 是本機開發提供者（不進行網路呼叫）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 為 true。
    - `skipSignatureVerification` 僅供本機測試使用。
    - 在 ngrok 免費方案中，將 `publicUrl` 設為確切的 ngrok URL；簽章驗證一律強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 只會在 `tunnel.provider="ngrok"` 且 `serve.bind` 為 loopback（ngrok 本機代理）時，允許簽章無效的 Twilio Webhook。僅供本機開發使用。
    - Ngrok 免費方案 URL 可能會變更或加入中介頁行為；如果 `publicUrl` 偏移，Twilio 簽章會失敗。正式環境：建議使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="串流連線上限">
    - `streaming.preStartTimeoutMs` 會關閉從未傳送有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections` 會限制未驗證 pre-start socket 的總數。
    - `streaming.maxPendingConnectionsPerIp` 會限制每個來源 IP 的未驗證 pre-start socket 數量。
    - `streaming.maxConnections` 會限制開啟中的媒體串流 socket 總數（pending + active）。

  </Accordion>
  <Accordion title="舊版 config 遷移">
    使用 `provider: "log"`、`twilio.from` 或舊版
    `streaming.*` OpenAI keys 的較舊 config，會由 `openclaw doctor --fix` 改寫。
    Runtime 後備方案目前仍接受舊的 voice-call keys，但
    改寫路徑是 `openclaw doctor --fix`，且 compat shim 是
    暫時性的。

    自動遷移的 streaming keys：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 即時語音對話

`realtime` 會為即時通話
音訊選取全雙工即時語音提供者。它與 `streaming` 分開，後者只會將音訊轉送到
即時轉錄提供者。

<Warning>
`realtime.enabled` 不能與 `streaming.enabled` 組合使用。每通通話請選擇一種
音訊模式。
</Warning>

目前 runtime 行為：

- Twilio Media Streams 支援 `realtime.enabled`。
- `realtime.provider` 是選用項。如果未設定，Voice Call 會使用第一個已註冊的即時語音提供者。
- 內建即時語音提供者：Google Gemini Live (`google`) 和 OpenAI (`openai`)，由其提供者 Plugin 註冊。
- 提供者擁有的原始 config 位於 `realtime.providers.<providerId>` 下。
- Voice Call 預設公開共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入的推理、目前資訊，或一般 OpenClaw 工具時，即時模型可以呼叫它。
- 如果 `realtime.provider` 指向未註冊的提供者，或完全沒有註冊任何即時語音提供者，Voice Call 會記錄警告並略過即時媒體，而不是讓整個 Plugin 失敗。
- Consult 工作階段 keys 會在可用時重用現有語音工作階段，然後退回使用來電者/被叫者電話號碼，讓後續 consult 呼叫在通話期間保留上下文。

### 工具政策

`realtime.toolPolicy` 控制 consult 執行：

| 政策             | 行為                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公開 consult 工具，並將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 公開 consult 工具，並讓一般代理使用正常的代理工具政策。                                                      |
| `none`           | 不公開 consult 工具。自訂 `realtime.tools` 仍會傳遞給即時提供者。                               |

### 即時提供者範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API key 來自 `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型
    `gemini-2.5-flash-native-audio-preview-12-2025`；voice `Kore`。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

請參閱 [Google 提供者](/zh-TW/providers/google) 和
[OpenAI 提供者](/zh-TW/providers/openai)，了解提供者專屬的即時語音
選項。

## 串流轉錄

`streaming` 會為即時通話音訊選取即時轉錄提供者。

目前 runtime 行為：

- `streaming.provider` 是選用項。如果未設定，Voice Call 會使用第一個已註冊的即時轉錄提供者。
- 內建即時轉錄提供者：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由其提供者 Plugin 註冊。
- 提供者擁有的原始 config 位於 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向未註冊的提供者，或沒有任何已註冊的提供者，Voice Call 會記錄警告並略過媒體串流，而不是讓整個 Plugin 失敗。

### 串流提供者範例

<Tabs>
  <Tab title="OpenAI">
    預設值：API key `streaming.providers.openai.apiKey` 或
    `OPENAI_API_KEY`；模型 `gpt-4o-transcribe`；`silenceDurationMs: 800`；
    `vadThreshold: 0.5`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    預設值：API 金鑰 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；
    端點 `wss://api.x.ai/v1/stt`；編碼 `mulaw`；取樣率 `8000`；
    `endpointingMs: 800`；`interimResults: true`。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## 通話的 TTS

語音通話會使用核心 `messages.tts` 設定，在通話中串流語音。你可以在 Plugin 設定下以**相同結構**覆寫它，這會與 `messages.tts` 進行深度合併。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**語音通話會忽略 Microsoft 語音。** 電話音訊需要 PCM；目前的 Microsoft 傳輸未公開電話 PCM 輸出。
</Warning>

行為說明：

- Plugin 設定內的舊版 `tts.<provider>` 鍵（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會退回使用提供者原生語音。
- 如果 Twilio 媒體串流已啟用，語音通話不會退回使用 TwiML `<Say>`。如果在該狀態下電話 TTS 無法使用，播放請求會失敗，而不是混合兩條播放路徑。
- 當電話 TTS 退回到次要提供者時，語音通話會記錄包含提供者鏈（`from`、`to`、`attempts`）的警告，方便除錯。
- 當 Twilio 插話或串流拆除清除待處理的 TTS 佇列時，已排入佇列的播放請求會完成結算，而不是讓來電者等待播放完成而卡住。

### TTS 範例

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## 來電

來電策略預設為 `disabled`。若要啟用來電，請設定：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保證等級的來電顯示篩選。Plugin 會正規化提供者供應的 `From` 值，並將其與 `allowFrom` 比對。Webhook 驗證會驗證提供者投遞與承載資料完整性，但它**不會**證明 PSTN/VoIP 來電號碼的所有權。請將 `allowFrom` 視為來電顯示篩選，而不是強式來電者身分。
</Warning>

自動回覆使用代理系統。可透過 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 調整。

### 語音輸出合約

對於自動回覆，語音通話會將嚴格的語音輸出合約附加到系統提示：

```text
{"spoken":"..."}
```

語音通話會防禦性地擷取語音文字：

- 忽略標記為推理/錯誤內容的承載資料。
- 解析直接 JSON、圍欄 JSON，或行內 `"spoken"` 鍵。
- 退回使用純文字，並移除可能是規劃/中繼說明的開頭段落。

這會讓語音播放聚焦在面向來電者的文字，並避免將規劃文字洩漏到音訊中。

### 對話啟動行為

對於外撥 `conversation` 通話，第一則訊息處理會繫結至即時播放狀態：

- 只有在初始問候語正在主動播放時，才會抑制插話佇列清除與自動回覆。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會維持佇列狀態以便重試。
- Twilio 串流的初始播放會在串流連線時開始，沒有額外延遲。
- 插話會中止作用中的播放，並清除已排入佇列但尚未播放的 Twilio TTS 項目。已清除的項目會解析為已略過，因此後續回覆邏輯可以繼續，不必等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流自身的開場輪次。語音通話**不會**針對該初始訊息送出舊版 `<Say>` TwiML 更新，因此外撥 `<Connect><Stream>` 工作階段會保持附加狀態。

### Twilio 串流中斷寬限

當 Twilio 媒體串流中斷連線時，語音通話會等待 **2000 毫秒** 後才自動結束通話：

- 如果串流在該時間窗內重新連線，會取消自動結束。
- 如果寬限期後沒有串流重新註冊，通話會被結束，以避免作用中的通話卡住。

## 過期通話清除器

使用 `staleCallReaperSeconds` 結束從未收到終止 Webhook 的通話（例如永不完成的通知模式通話）。預設值為 `0`（停用）。

建議範圍：

- **正式環境：** 通知式流程使用 `120` 至 `300` 秒。
- 請讓此值**高於 `maxDurationSeconds`**，讓一般通話能完成。良好的起始值是 `maxDurationSeconds + 30–60` 秒。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook 安全性

當 Gateway 前方有 Proxy 或通道時，Plugin 會重建公開 URL 以進行簽章驗證。這些選項控制信任哪些轉送標頭：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許清單中的轉送標頭主機。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在沒有允許清單的情況下信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  只有在請求遠端 IP 符合清單時，才信任轉送標頭。
</ParamField>

其他保護：

- Twilio 和 Plivo 已啟用 Webhook **重放保護**。重放的有效 Webhook 請求會收到確認，但會略過副作用。
- Twilio 對話輪次會在 `<Gather>` 回呼中包含每輪權杖，因此過期/重放的語音回呼無法滿足較新的待處理逐字稿輪次。
- 當缺少提供者要求的簽章標頭時，未驗證的 Webhook 請求會在讀取本文前遭拒。
- voice-call Webhook 會使用共用的預先驗證本文設定檔（64 KB / 5 秒），並在簽章驗證前套用每 IP 進行中請求上限。

使用穩定公開主機的範例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` 會從預設的 voice-call 儲存路徑讀取 `calls.jsonl`。使用 `--file <path>` 指向不同記錄，並使用 `--last <n>` 將分析限制為最後 N 筆記錄（預設 200）。輸出包含輪次延遲與聆聽等待時間的 p50/p90/p99。

## 代理工具

工具名稱：`voice_call`。

| 動作            | 引數                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

此儲存庫在 `skills/voice-call/SKILL.md` 提供相符的技能文件。

## Gateway RPC

| 方法                 | 引數                      |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## 相關

- [對話模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

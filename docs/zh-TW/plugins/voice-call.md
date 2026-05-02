---
read_when:
    - 您想從 OpenClaw 撥打外撥語音電話
    - 你正在設定或開發語音通話 Plugin
    - 你需要在電話通訊中使用即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥打外撥語音通話並接聽來電，並可選用即時語音與串流轉錄
title: 語音通話 Plugin
x-i18n:
    generated_at: "2026-05-02T21:02:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

透過 Plugin 為 OpenClaw 提供語音通話。支援外撥通知、多輪對話、全雙工即時語音、串流轉錄，以及具允許清單政策的來電。

**目前的供應商：** `twilio`（Programmable Voice + Media Streams）、`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput speech）、`mock`（開發用／無網路）。

<Note>
Voice Call Plugin 會在 **Gateway 行程內**執行。如果你使用遠端 Gateway，請在執行 Gateway 的機器上安裝並設定 Plugin，然後重新啟動 Gateway 以載入它。
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

    如果 npm 回報 OpenClaw 擁有的套件已棄用，該套件版本來自較舊的外部套件序列；請使用目前封裝的 OpenClaw 建置，或在較新的 npm 套件發布前使用本機資料夾路徑。

    之後重新啟動 Gateway，讓 Plugin 載入。

  </Step>
  <Step title="設定供應商與 Webhook">
    在 `plugins.entries.voice-call.config` 下設定組態（完整結構請見下方的[設定](#configuration)）。至少需要：`provider`、供應商憑證、`fromNumber`，以及可公開存取的 Webhook URL。
  </Step>
  <Step title="驗證設定">
    ```bash
    openclaw voicecall setup
    ```

    預設輸出可在聊天記錄與終端機中閱讀。它會檢查 Plugin 啟用狀態、供應商憑證、Webhook 曝露，以及是否只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。腳本請使用 `--json`。

  </Step>
  <Step title="冒煙測試">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都是試跑。加入 `--yes` 才會實際撥打一通簡短的外撥通知電話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對於 Twilio、Telnyx 和 Plivo，設定必須解析為**公開 Webhook URL**。如果 `publicUrl`、通道 URL、Tailscale URL 或 serve 後援解析到 loopback 或私人網路空間，設定會失敗，而不是啟動無法接收電信業者 Webhook 的供應商。
</Warning>

## 設定

如果 `enabled: true` 但所選供應商缺少憑證，Gateway 啟動時會記錄設定未完成的警告，列出缺少的鍵，並略過啟動執行階段。命令、RPC 呼叫和 agent 工具在使用時仍會回傳確切缺少的供應商組態。

<Note>
Voice-call 憑證接受 SecretRefs。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 會透過標準 SecretRef 介面解析；請參閱 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
  <Accordion title="供應商曝露與安全性注意事項">
    - Twilio、Telnyx 和 Plivo 全都需要**可公開存取**的 Webhook URL。
    - `mock` 是本機開發供應商（不進行網路呼叫）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 為 true。
    - `skipSignatureVerification` 僅供本機測試使用。
    - 在 ngrok 免費層級，將 `publicUrl` 設為確切的 ngrok URL；簽章驗證一律強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 只會在 `tunnel.provider="ngrok"` 且 `serve.bind` 為 loopback（ngrok 本機代理程式）時，允許簽章無效的 Twilio Webhook。僅限本機開發。
    - Ngrok 免費層級 URL 可能會變更或加入中介頁面行為；如果 `publicUrl` 漂移，Twilio 簽章會失敗。正式環境：建議使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="串流連線上限">
    - `streaming.preStartTimeoutMs` 會關閉從未傳送有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections` 限制未驗證 pre-start socket 的總數。
    - `streaming.maxPendingConnectionsPerIp` 限制每個來源 IP 的未驗證 pre-start socket 數量。
    - `streaming.maxConnections` 限制開啟中的 media stream socket 總數（pending + active）。

  </Accordion>
  <Accordion title="舊版設定遷移">
    使用 `provider: "log"`、`twilio.from` 或舊版 `streaming.*` OpenAI 鍵的較舊組態，會由 `openclaw doctor --fix` 重新寫入。執行階段後援目前仍接受舊的 voice-call 鍵，但重寫路徑是 `openclaw doctor --fix`，相容性 shim 也是暫時性的。

    自動遷移的串流鍵：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 工作階段範圍

預設情況下，Voice Call 使用 `sessionScope: "per-phone"`，因此來自同一位來電者的重複通話會保留對話記憶。若每一通電信業者通話都應以全新脈絡開始，請設定 `sessionScope: "per-call"`，例如接待、預約、IVR，或同一個電話號碼可能代表不同會議的 Google Meet 橋接流程。

## 即時語音對話

`realtime` 會為即時通話音訊選擇全雙工即時語音供應商。它與 `streaming` 分開，後者只會將音訊轉送給即時轉錄供應商。

<Warning>
`realtime.enabled` 不能與 `streaming.enabled` 結合使用。每通電話請選擇一種音訊模式。
</Warning>

目前的執行階段行為：

- Twilio Media Streams 支援 `realtime.enabled`。
- `realtime.provider` 是選用項。如果未設定，Voice Call 會使用第一個已註冊的即時語音供應商。
- 隨附的即時語音供應商：Google Gemini Live（`google`）和 OpenAI（`openai`），由其供應商 Plugin 註冊。
- 供應商擁有的原始組態位於 `realtime.providers.<providerId>` 下。
- Voice Call 預設曝露共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入的推理、目前資訊或一般 OpenClaw 工具時，即時模型可以呼叫它。
- `realtime.fastContext.enabled` 預設關閉。啟用後，Voice Call 會先為 consult 問題搜尋已索引的記憶／工作階段脈絡，並在 `realtime.fastContext.timeoutMs` 內將這些片段回傳給即時模型；只有在 `realtime.fastContext.fallbackToConsult` 為 true 時，才會後援到完整的 consult agent。
- 如果 `realtime.provider` 指向未註冊的供應商，或完全沒有註冊即時語音供應商，Voice Call 會記錄警告並略過即時媒體，而不是讓整個 Plugin 失敗。
- Consult 工作階段鍵會在可用時重用已儲存的通話工作階段，然後後援到設定的 `sessionScope`（預設為 `per-phone`，隔離通話則為 `per-call`）。

### 工具政策

`realtime.toolPolicy` 控制 consult 執行：

| 政策             | 行為                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 曝露 consult 工具，並將一般 agent 限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 曝露 consult 工具，並讓一般 agent 使用正常的 agent 工具政策。                                                      |
| `none`           | 不曝露 consult 工具。自訂 `realtime.tools` 仍會傳遞給即時供應商。                               |

### 即時供應商範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API key 來自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型 `gemini-2.5-flash-native-audio-preview-12-2025`；語音 `Kore`。

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

請參閱 [Google 供應商](/zh-TW/providers/google) 和 [OpenAI 供應商](/zh-TW/providers/openai)，了解供應商特定的即時語音選項。

## 串流轉錄

`streaming` 會為即時通話音訊選擇即時轉錄供應商。

目前的執行階段行為：

- `streaming.provider` 是選用項目。如果未設定，Voice Call 會使用第一個已註冊的即時轉錄供應商。
- 內建即時轉錄供應商：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由各自的供應商 Plugin 註冊。
- 供應商擁有的原始設定位於 `streaming.providers.<providerId>` 底下。
- Twilio 傳送已接受的串流 `start` 訊息後，Voice Call 會立即註冊該串流，在供應商連線期間透過轉錄供應商佇列處理傳入媒體，並且只會在即時轉錄就緒後才開始初始問候語。
- 如果 `streaming.provider` 指向未註冊的供應商，或沒有任何供應商已註冊，Voice Call 會記錄警告並略過媒體串流，而不是讓整個 Plugin 失敗。

### 串流供應商範例

<Tabs>
  <Tab title="OpenAI">
    預設值：API 金鑰 `streaming.providers.openai.apiKey` 或
    `OPENAI_API_KEY`；模型 `gpt-4o-transcribe`；`silenceDurationMs: 800`；
    `vadThreshold: 0.5`。

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

Voice Call 會使用核心 `messages.tts` 設定來進行通話中的串流語音。你可以在 Plugin 設定底下用**相同結構**覆寫它，它會與 `messages.tts` 深度合併。

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
**語音通話會忽略 Microsoft speech。** 電話語音需要 PCM；目前的 Microsoft 傳輸未公開電話 PCM 輸出。
</Warning>

行為備註：

- Plugin 設定內的舊版 `tts.<provider>` 鍵（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會退回供應商原生語音。
- 如果 Twilio 媒體串流已在作用中，Voice Call 不會退回 TwiML `<Say>`。如果在該狀態下無法使用電話 TTS，播放請求會失敗，而不是混用兩條播放路徑。
- 當電話 TTS 退回次要供應商時，Voice Call 會記錄包含供應商鏈（`from`、`to`、`attempts`）的警告以便除錯。
- 當 Twilio 插話或串流關閉清除待處理的 TTS 佇列時，已佇列的播放請求會完成，而不是讓來電者一直等待播放完成。

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

來電原則預設為 `disabled`。若要啟用來電，請設定：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保證性的來電顯示篩選。此 Plugin 會正規化供應商提供的 `From` 值，並將它與 `allowFrom` 比較。Webhook 驗證會驗證供應商傳遞與承載完整性，但它**不會**證明 PSTN/VoIP 來電號碼所有權。請將 `allowFrom` 視為來電顯示篩選，而不是強式來電者身分。
</Warning>

自動回應會使用 agent 系統。可透過 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 調整。

### 每個號碼的路由

當一個 Voice Call Plugin 接收多個電話號碼的來電，且每個號碼都應像不同線路一樣運作時，請使用 `numbers`。例如，一個號碼可以使用輕鬆的個人助理，而另一個號碼則使用商務角色、不同的回應 agent，以及不同的 TTS 語音。

路由會從供應商提供的已撥 `To` 號碼選取。鍵必須是 E.164 號碼。來電抵達時，Voice Call 會解析一次符合的路由，將符合的路由儲存在通話記錄上，並將該有效設定重用於問候語、傳統自動回應路徑、即時諮詢路徑，以及 TTS 播放。如果沒有路由符合，會使用全域 Voice Call 設定。撥出通話不使用 `numbers`；發起通話時請明確傳入撥出目標、訊息和工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值會在全域 Voice Call `tts` 設定上深度合併，因此通常只需要覆寫供應商語音：

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### 語音輸出合約

對於自動回應，Voice Call 會在系統提示後附加嚴格的語音輸出合約：

```text
{"spoken":"..."}
```

Voice Call 會防禦性地擷取語音文字：

- 忽略標記為推理/錯誤內容的承載。
- 解析直接 JSON、圍欄 JSON，或內嵌 `"spoken"` 鍵。
- 退回純文字，並移除可能是規劃/後設的前導段落。

這會讓語音播放聚焦在面向來電者的文字，並避免將規劃文字洩漏到音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，第一則訊息處理會繫結到即時播放狀態：

- 只有在初始問候語正在主動播放時，才會抑制插話佇列清除和自動回應。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會保持佇列狀態以供重試。
- Twilio 串流的初始播放會在串流連線時開始，不會有額外延遲。
- 插話會中止作用中的播放，並清除已佇列但尚未播放的 Twilio TTS 項目。已清除的項目會解析為已略過，因此後續回應邏輯可以繼續，而不必等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流自己的開場回合。Voice Call **不會**為該初始訊息發布舊版 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會保持附加。

### Twilio 串流中斷寬限

當 Twilio 媒體串流中斷時，Voice Call 會等待 **2000 ms** 才自動結束通話：

- 如果串流在該視窗內重新連線，會取消自動結束。
- 如果寬限期後沒有串流重新註冊，通話會結束以防止作用中通話卡住。

## 過期通話清理器

使用 `staleCallReaperSeconds` 來結束從未收到終止 Webhook 的通話（例如永遠未完成的通知模式通話）。預設值為 `0`（停用）。

建議範圍：

- **正式環境：** 對通知樣式流程使用 `120`–`300` 秒。
- 請將此值保持為**高於 `maxDurationSeconds`**，讓一般通話能夠完成。良好的起點是 `maxDurationSeconds + 30–60` 秒。

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

當 Proxy 或 tunnel 位於 Gateway 前方時，Plugin 會重建公開 URL 以進行簽章驗證。這些選項控制哪些轉送標頭會受到信任：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許清單中的轉送標頭主機。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在沒有允許清單的情況下信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  僅在請求遠端 IP 符合清單時信任轉送標頭。
</ParamField>

其他保護：

- Twilio 和 Plivo 已啟用 Webhook **重放保護**。重放的有效 Webhook 請求會被確認，但會略過副作用。
- Twilio 對話回合會在 `<Gather>` callback 中包含每回合 token，因此過期/重放的語音 callback 無法滿足較新的待處理轉錄回合。
- 當缺少供應商所需的簽章標頭時，未驗證的 Webhook 請求會在讀取本文前遭拒絕。
- voice-call Webhook 會使用共用的預先驗證本文設定檔（64 KB / 5 秒），並在簽章驗證前套用每 IP 進行中上限。

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

當 Gateway 已在執行時，操作性 `voicecall` 命令會委派給 Gateway 擁有的 voice-call 執行階段，因此 CLI 不會綁定第二個 Webhook 伺服器。如果無法連線到 Gateway，這些命令會退回獨立 CLI 執行階段。

`latency` 會從預設語音通話儲存路徑讀取 `calls.jsonl`。
使用 `--file <path>` 指向不同記錄檔，使用 `--last <n>` 將
分析限制為最後 N 筆記錄（預設 200）。輸出包含回合延遲與聆聽等待時間的
p50/p90/p99。

## 代理工具

工具名稱：`voice_call`。

| 動作            | 引數                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

此 repo 在 `skills/voice-call/SKILL.md` 隨附相符的 skill 文件。

## Gateway RPC

| 方法                 | 引數                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` 只在搭配 `mode: "conversation"` 時有效。通知模式通話
若需要連線後數字，應在通話存在後使用 `voicecall.dtmf`。

## 疑難排解

### 設定未通過 Webhook 暴露檢查

請從執行 Gateway 的相同環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須是綠色。已
設定的 `publicUrl` 若指向本機或私有網路空間仍會失敗，因為電信業者無法回呼
這些位址。不要使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

Twilio 通知模式外撥通話會在建立通話請求中直接傳送初始 `<Say>` TwiML，
因此第一段語音訊息不依賴 Twilio 擷取 Webhook TwiML。狀態回呼、對話通話、
連線前 DTMF、即時串流，以及連線後通話控制仍需要公開 Webhook。

使用一種公開暴露路徑：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

變更設定後，重新啟動或重新載入 Gateway，然後執行：

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

除非傳入 `--yes`，否則 `voicecall smoke` 是空跑。

### 提供者認證資訊失敗

檢查所選提供者與必要認證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和
  `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

認證資訊必須存在於 Gateway 主機上。編輯本機 shell profile
不會影響已在執行中的 Gateway，直到它重新啟動或重新載入其
環境。

### 通話開始但提供者 Webhook 未抵達

確認提供者主控台指向確切的公開 Webhook URL：

```text
https://voice.example.com/voice/webhook
```

接著檢查執行階段狀態：

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

常見原因：

- `publicUrl` 指向與 `serve.path` 不同的路徑。
- Gateway 啟動後 tunnel URL 已變更。
- Proxy 轉送請求，但移除或重寫 host/proto 標頭。
- 防火牆或 DNS 將公開主機名稱路由到 Gateway 以外的位置。
- Gateway 重新啟動時未啟用 Voice Call Plugin。

當 Gateway 前方有 reverse proxy 或 tunnel 時，將
`webhookSecurity.allowedHosts` 設為公開主機名稱，或針對已知 proxy 位址使用
`webhookSecurity.trustedProxyIPs`。只有在 proxy 邊界由你控制時，才使用
`webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

提供者簽章會依 OpenClaw 從傳入請求重建的公開 URL 進行檢查。
如果簽章失敗：

- 確認提供者 Webhook URL 與 `publicUrl` 完全相符，包含
  scheme、host 和 path。
- 對於 ngrok free-tier URL，當 tunnel 主機名稱變更時更新 `publicUrl`。
- 確保 proxy 保留原始 host 和 proto 標頭，或設定
  `webhookSecurity.allowedHosts`。
- 不要在本機測試以外啟用 `skipSignatureVerification`。

### Google Meet Twilio 加入失敗

Google Meet 使用此 Plugin 進行 Twilio 撥入加入。先驗證 Voice Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

接著明確驗證 Google Meet transport：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 為綠色，但 Meet 參與者從未加入，請檢查 Meet
撥入號碼、PIN 和 `--dtmf-sequence`。電話通話可能正常，但
會議會拒絕或忽略不正確的 DTMF 序列。

Google Meet 會將 Meet DTMF 序列和介紹文字傳給 `voicecall.start`。
對於 Twilio 通話，Voice Call 會先提供 DTMF TwiML，重新導向回
Webhook，然後開啟即時媒體串流，使已儲存的介紹在電話參與者加入會議後
產生。

使用 `openclaw logs --follow` 查看即時階段追蹤。健康的 Twilio Meet
加入會依此順序記錄：

- Google Meet 將 Twilio 加入委派給 Voice Call。
- Voice Call 儲存連線前 DTMF TwiML。
- Twilio 初始 TwiML 在即時處理前被消耗並提供。
- Voice Call 為 Twilio 通話提供即時 TwiML。
- 即時橋接啟動，並已排入初始問候。

`openclaw voicecall tail` 仍會顯示持久化的通話記錄；它對於
通話狀態和逐字稿很有用，但並非每個 Webhook/即時轉換都會出現在
那裡。

### 即時通話沒有語音

確認只啟用一種音訊模式。`realtime.enabled` 和
`streaming.enabled` 不能同時為 true。

對於即時 Twilio 通話，另請驗證：

- 已載入並註冊即時提供者 Plugin。
- `realtime.provider` 未設定，或命名已註冊的提供者。
- Gateway 程序可使用提供者 API key。
- `openclaw logs --follow` 顯示已提供即時 TwiML、即時橋接
  已啟動，且初始問候已排入。

## 相關

- [交談模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

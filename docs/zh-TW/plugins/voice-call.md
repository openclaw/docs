---
read_when:
    - 您想要從 OpenClaw 撥打外撥語音通話
    - 你正在設定或開發語音通話 Plugin
    - 你需要在電話系統上使用即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥打外撥語音通話並接聽來電，並可選用即時語音和串流轉錄
title: 語音通話 Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

透過 Plugin 為 OpenClaw 提供語音通話。支援撥出通知、
多輪對話、全雙工即時語音、串流
轉錄，以及搭配允許清單政策的來電。

**目前的提供者：** `twilio`（Programmable Voice + Media Streams）、
`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput
speech）、`mock`（開發用／無網路）。

<Note>
Voice Call Plugin 會在 **Gateway 程序內部** 執行。如果你使用
遠端 Gateway，請在執行 Gateway 的機器上安裝並設定此 Plugin，
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

    使用裸套件名稱以跟隨目前的官方發行標籤。只有在需要可重現安裝時，
    才釘選精確版本。

    之後重新啟動 Gateway，讓 Plugin 載入。

  </Step>
  <Step title="設定提供者與 Webhook">
    在 `plugins.entries.voice-call.config` 下設定組態（完整形狀請見下方
    [組態](#configuration)）。至少需要：
    `provider`、提供者憑證、`fromNumber`，以及可公開
    連線的 Webhook URL。
  </Step>
  <Step title="驗證設定">
    ```bash
    openclaw voicecall setup
    ```

    預設輸出可在聊天記錄與終端機中閱讀。它會檢查
    Plugin 是否已啟用、提供者憑證、Webhook 暴露，以及是否
    只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。腳本請使用
    `--json`。

  </Step>
  <Step title="煙霧測試">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都是試跑。加入 `--yes` 才會實際撥打一通短暫的
    撥出通知電話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對 Twilio、Telnyx 和 Plivo 而言，設定必須解析為 **公開 Webhook URL**。
如果 `publicUrl`、通道 URL、Tailscale URL 或 serve 後援
解析到 loopback 或私有網路空間，設定會失敗，而不是
啟動無法接收電信業者 Webhook 的提供者。
</Warning>

## 組態

如果 `enabled: true`，但所選提供者缺少憑證，
Gateway 啟動時會記錄 setup-incomplete 警告，列出缺少的鍵，
並略過啟動 runtime。指令、RPC 呼叫與代理工具在使用時仍會
回傳確切缺少的提供者組態。

<Note>
語音通話憑證接受 SecretRefs。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 會透過標準 SecretRef 介面解析；請參閱 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
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
  <Accordion title="提供者暴露與安全性注意事項">
    - Twilio、Telnyx 和 Plivo 都需要 **可公開連線** 的 Webhook URL。
    - `mock` 是本機開發提供者（不進行網路呼叫）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 為 true。
    - `skipSignatureVerification` 僅供本機測試使用。
    - 在 ngrok 免費層，請將 `publicUrl` 設為精確的 ngrok URL；簽章驗證一律強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 只有在 `tunnel.provider="ngrok"` 且 `serve.bind` 是 loopback（ngrok 本機代理）時，才允許簽章無效的 Twilio Webhook。僅供本機開發。
    - Ngrok 免費層 URL 可能變更或加入插頁行為；如果 `publicUrl` 漂移，Twilio 簽章會失敗。正式環境：偏好使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="串流連線上限">
    - `streaming.preStartTimeoutMs` 會關閉從未傳送有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections` 限制未驗證的 pre-start socket 總數。
    - `streaming.maxPendingConnectionsPerIp` 限制每個來源 IP 的未驗證 pre-start socket。
    - `streaming.maxConnections` 限制已開啟媒體串流 socket 的總數（pending + active）。

  </Accordion>
  <Accordion title="舊版組態遷移">
    使用 `provider: "log"`、`twilio.from` 或舊版
    `streaming.*` OpenAI 鍵的較舊組態，會由 `openclaw doctor --fix`
    重新寫入。Runtime 後援目前仍接受舊的 voice-call 鍵，但
    重寫路徑是 `openclaw doctor --fix`，相容 shim
    是暫時性的。

    自動遷移的串流鍵：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 工作階段範圍

預設情況下，Voice Call 使用 `sessionScope: "per-phone"`，讓來自
同一來電者的重複通話保留對話記憶。當每通電信業者通話都應以全新情境開始時，
請設定 `sessionScope: "per-call"`，例如接待、
預約、IVR，或同一個電話號碼可能代表不同會議的 Google Meet 橋接流程。

## 即時語音對話

`realtime` 會為即時通話音訊選擇全雙工即時語音提供者。
它不同於 `streaming`，後者只會將音訊轉送給
即時轉錄提供者。

<Warning>
`realtime.enabled` 不能與 `streaming.enabled` 合併使用。每通電話請選擇一種
音訊模式。
</Warning>

目前 runtime 行為：

- Twilio Media Streams 支援 `realtime.enabled`。
- `realtime.provider` 是選用的。若未設定，Voice Call 會使用第一個已註冊的即時語音提供者。
- 內建的即時語音提供者：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的提供者 Plugin 註冊。
- 提供者擁有的原始組態位於 `realtime.providers.<providerId>` 下。
- Voice Call 預設會暴露共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入推理、目前資訊或一般 OpenClaw 工具時，即時模型可以呼叫它。
- `realtime.fastContext.enabled` 預設關閉。啟用後，Voice Call 會先搜尋已索引的記憶體／工作階段情境來回答諮詢問題，並在 `realtime.fastContext.timeoutMs` 內將那些片段回傳給即時模型；只有在 `realtime.fastContext.fallbackToConsult` 為 true 時，才會後援到完整諮詢代理。
- 如果 `realtime.provider` 指向未註冊的提供者，或完全沒有註冊任何即時語音提供者，Voice Call 會記錄警告並略過即時媒體，而不是讓整個 Plugin 失敗。
- 可用時，諮詢工作階段鍵會重用已儲存的通話工作階段，接著後援到已設定的 `sessionScope`（預設為 `per-phone`，隔離通話則為 `per-call`）。

### 工具政策

`realtime.toolPolicy` 控制諮詢執行：

| 政策             | 行為                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露諮詢工具，並將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 暴露諮詢工具，並讓一般代理使用正常的代理工具政策。                                                                                       |
| `none`           | 不暴露諮詢工具。自訂 `realtime.tools` 仍會傳遞給即時提供者。                                                                             |

### 即時提供者範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API 金鑰來自 `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型為
    `gemini-2.5-flash-native-audio-preview-12-2025`；語音為 `Kore`。

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

如需提供者專屬的即時語音選項，請參閱 [Google 提供者](/zh-TW/providers/google) 和
[OpenAI 提供者](/zh-TW/providers/openai)。

## 串流轉錄

`streaming` 會為即時通話音訊選擇即時轉錄提供者。

目前 runtime 行為：

- `streaming.provider` 是選用項。如果未設定，語音通話會使用第一個已註冊的即時轉錄提供者。
- 內建即時轉錄提供者：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由其提供者 Plugins 註冊。
- 提供者擁有的原始設定位於 `streaming.providers.<providerId>` 下。
- Twilio 傳送已接受的串流 `start` 訊息後，語音通話會立即註冊串流，在提供者連線期間透過轉錄提供者佇列傳入媒體，並且只在即時轉錄準備好後才開始初始問候。
- 如果 `streaming.provider` 指向未註冊的提供者，或沒有任何提供者已註冊，語音通話會記錄警告並略過媒體串流，而不是讓整個 Plugin 失敗。

### 串流提供者範例

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

語音通話會使用核心 `messages.tts` 設定來進行通話上的串流語音。你可以在 Plugin 設定下以**相同形狀**覆寫它——它會與 `messages.tts` 深度合併。

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
**語音通話會忽略 Microsoft 語音。** 電話音訊需要 PCM；
目前的 Microsoft 傳輸不公開電話 PCM 輸出。
</Warning>

行為備註：

- Plugin 設定內的舊版 `tts.<provider>` 鍵（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；已提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會退回使用提供者原生語音。
- 如果 Twilio 媒體串流已啟用，語音通話不會退回到 TwiML `<Say>`。如果在該狀態下無法使用電話 TTS，播放請求會失敗，而不是混用兩條播放路徑。
- 當電話 TTS 退回到次要提供者時，語音通話會記錄含有提供者鏈（`from`、`to`、`attempts`）的警告，以便偵錯。
- 當 Twilio 插話或串流拆除清除待處理的 TTS 佇列時，已排入佇列的播放請求會結算，而不是讓來電者一直等待播放完成。

### TTS 範例

<Tabs>
  <Tab title="僅核心 TTS">
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
  <Tab title="覆寫為 ElevenLabs（僅通話）">
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
  <Tab title="OpenAI 模型覆寫（深度合併）">
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

來電政策預設為 `disabled`。若要啟用來電，請設定：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保證度的來電者 ID 篩選。此
Plugin 會正規化提供者提供的 `From` 值，並將其與
`allowFrom` 比較。Webhook 驗證會驗證提供者交付與
payload 完整性，但它**不會**證明 PSTN/VoIP 來電號碼
所有權。請將 `allowFrom` 視為來電者 ID 篩選，而不是強式來電者
身分。
</Warning>

自動回應使用代理系統。使用 `responseModel`、
`responseSystemPrompt` 和 `responseTimeoutMs` 進行調整。

### 每個號碼的路由

當一個語音通話 Plugin 接收多個電話號碼的來電，且每個號碼應該像不同線路一樣運作時，請使用 `numbers`。例如，一個
號碼可以使用輕鬆的個人助理，而另一個號碼可以使用商務
角色、不同的回應代理，以及不同的 TTS 語音。

路由會從提供者提供的撥入 `To` 號碼選取。鍵必須是
E.164 號碼。來電抵達時，語音通話會解析一次相符路由，
將相符路由儲存在通話記錄上，並針對問候語、經典自動回應路徑、即時諮詢路徑，以及 TTS
播放重用該有效設定。如果沒有相符路由，會使用全域語音通話設定。
撥出電話不使用 `numbers`；啟動通話時請明確傳入撥出目標、訊息和
工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值會深度合併到全域語音通話 `tts` 設定之上，因此
你通常只需要覆寫提供者語音：

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

對於自動回應，語音通話會在系統提示後附加嚴格的語音輸出合約：

```text
{"spoken":"..."}
```

語音通話會以防禦性方式擷取語音文字：

- 忽略標記為推理/錯誤內容的 payload。
- 剖析直接 JSON、圍欄 JSON，或內嵌 `"spoken"` 鍵。
- 退回到純文字，並移除可能是規劃/後設前導的段落。

這會讓語音播放聚焦在面向來電者的文字，並避免
將規劃文字洩漏到音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，第一則訊息處理會與即時
播放狀態綁定：

- 只有在初始問候語正在主動說話時，才會抑制插話佇列清除與自動回應。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會保留在佇列中以供重試。
- Twilio 串流的初始播放會在串流連線時開始，不會有額外延遲。
- 插話會中止作用中的播放，並清除已排入佇列但尚未播放的 Twilio TTS 項目。已清除項目會解析為已略過，因此後續回應邏輯可以繼續，不必等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流自己的開場回合。語音通話**不會**為該初始訊息發布舊版 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會保持附接。

### Twilio 串流中斷連線寬限期

當 Twilio 媒體串流中斷連線時，語音通話會等待 **2000 ms** 後才
自動結束通話：

- 如果串流在該時間窗內重新連線，自動結束會取消。
- 如果寬限期後沒有串流重新註冊，通話會結束，以避免卡住的作用中通話。

## 陳舊通話回收器

使用 `staleCallReaperSeconds` 結束從未收到終端
Webhook 的通話（例如永遠未完成的通知模式通話）。預設值
為 `0`（停用）。

建議範圍：

- **Production：** 通知樣式流程使用 `120`–`300` 秒。
- 請讓此值**高於 `maxDurationSeconds`**，讓一般通話可以完成。良好的起始點是 `maxDurationSeconds + 30–60` 秒。

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

當代理或隧道位於 Gateway 前方時，此 Plugin
會重建公開 URL 以進行簽章驗證。這些選項
控制信任哪些轉送標頭：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許清單中的轉送標頭主機。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  信任轉送標頭，不使用允許清單。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  只有在請求遠端 IP 符合清單時，才信任轉送標頭。
</ParamField>

其他保護：

- 已為 Twilio 和 Plivo 啟用 Webhook **重放保護**。重放的有效 Webhook 請求會被確認，但會略過副作用。
- Twilio 對話回合會在 `<Gather>` 回呼中包含每回合權杖，因此陳舊/重放的語音回呼無法滿足較新的待處理轉錄回合。
- 當缺少提供者必要的簽章標頭時，未驗證的 Webhook 請求會在讀取主體前遭拒絕。
- voice-call Webhook 使用共用的預先驗證主體設定檔（64 KB / 5 秒），並在簽章驗證前套用每個 IP 的進行中上限。

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

當 Gateway 已在執行時，操作性的 `voicecall` 命令會委派給
Gateway 擁有的 voice-call 執行階段，因此 CLI 不會繫結第二個
Webhook 伺服器。如果沒有可連線的 Gateway，這些命令會退回到
獨立 CLI 執行階段。

`latency` 會從預設的語音通話儲存路徑讀取 `calls.jsonl`。
使用 `--file <path>` 指向不同的記錄檔，並使用 `--last <n>` 將分析限制在最後 N 筆記錄（預設 200）。輸出包含回合延遲與聆聽等待時間的 p50/p90/p99。

## 代理程式工具

工具名稱：`voice_call`。

| 動作            | 引數                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

此 repo 隨附位於 `skills/voice-call/SKILL.md` 的對應 Skills 文件。

## Gateway RPC

| 方法                 | 引數                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` 只有搭配 `mode: "conversation"` 時才有效。通知模式通話若需要接通後的數字，應在通話存在後使用 `voicecall.dtmf`。

## 疑難排解

### 設定無法公開 Webhook

請從執行 Gateway 的同一個環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。已設定的 `publicUrl` 若指向本機或私人網路空間仍會失敗，因為電信業者無法回呼到這些位址。請不要使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

Twilio 通知模式的撥出電話會在建立通話請求中直接傳送初始 `<Say>` TwiML，因此第一段語音訊息不依賴 Twilio 擷取 Webhook TwiML。不過，狀態回呼、對話通話、接通前 DTMF、即時串流，以及接通後通話控制仍需要公開 Webhook。

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

除非傳入 `--yes`，否則 `voicecall smoke` 是一次試跑。

### 提供者憑證失敗

檢查選取的提供者與必要憑證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或 `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和 `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

憑證必須存在於 Gateway 主機上。編輯本機 shell profile 不會影響已在執行中的 Gateway，直到它重新啟動或重新載入其環境為止。

### 通話已開始但提供者 Webhook 沒有送達

確認提供者主控台指向確切的公開 Webhook URL：

```text
https://voice.example.com/voice/webhook
```

然後檢查執行階段狀態：

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

常見原因：

- `publicUrl` 指向與 `serve.path` 不同的路徑。
- Gateway 啟動後，通道 URL 已變更。
- Proxy 轉送請求，但移除或改寫了 host/proto 標頭。
- 防火牆或 DNS 將公開主機名稱路由到 Gateway 以外的位置。
- Gateway 重新啟動時未啟用 Voice Call Plugin。

當反向 Proxy 或通道位於 Gateway 前方時，請將 `webhookSecurity.allowedHosts` 設為公開主機名稱，或對已知 Proxy 位址使用 `webhookSecurity.trustedProxyIPs`。只有在 Proxy 邊界由你控制時，才使用 `webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

提供者簽章會依據 OpenClaw 從傳入請求重建的公開 URL 進行檢查。如果簽章失敗：

- 確認提供者 Webhook URL 與 `publicUrl` 完全相符，包括 scheme、host 和 path。
- 對於 ngrok 免費層 URL，當通道主機名稱變更時，請更新 `publicUrl`。
- 確保 Proxy 保留原始 host 和 proto 標頭，或設定 `webhookSecurity.allowedHosts`。
- 不要在本機測試以外啟用 `skipSignatureVerification`。

### Google Meet Twilio 加入失敗

Google Meet 使用此 Plugin 進行 Twilio 撥入加入。請先驗證 Voice Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

然後明確驗證 Google Meet 傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 為綠色，但 Meet 參與者從未加入，請檢查 Meet 撥入號碼、PIN 和 `--dtmf-sequence`。電話通話可能正常，但會議可能因不正確的 DTMF 序列而拒絕或忽略。

Google Meet 會將 Meet DTMF 序列與開場文字傳遞給 `voicecall.start`。對於 Twilio 通話，Voice Call 會先提供 DTMF TwiML，重新導向回 Webhook，然後開啟即時媒體串流，因此儲存的開場白會在電話參與者加入會議後產生。

使用 `openclaw logs --follow` 查看即時階段追蹤。健康的 Twilio Meet 加入會依照此順序記錄：

- Google Meet 將 Twilio 加入委派給 Voice Call。
- Voice Call 儲存接通前 DTMF TwiML。
- Twilio 初始 TwiML 會在即時處理前被取用並提供。
- Voice Call 為 Twilio 通話提供即時 TwiML。
- 即時橋接會在初始問候語已排入佇列的情況下啟動。

`openclaw voicecall tail` 仍會顯示已持久化的通話記錄；它對通話狀態和逐字稿很有用，但並非每個 Webhook/即時轉換都會出現在其中。

### 即時通話沒有語音

確認只啟用一種音訊模式。`realtime.enabled` 和 `streaming.enabled` 不能同時為 true。

對於即時 Twilio 通話，也請驗證：

- 已載入並註冊即時提供者 Plugin。
- `realtime.provider` 未設定，或命名一個已註冊的提供者。
- Gateway 程序可以取得提供者 API 金鑰。
- `openclaw logs --follow` 顯示即時 TwiML 已提供、即時橋接已啟動，且初始問候語已排入佇列。

## 相關內容

- [對話模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

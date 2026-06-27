---
read_when:
    - 你想要從 OpenClaw 撥出語音通話
    - 您正在設定或開發語音通話外掛
    - 你需要在電話系統上進行即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥出並接聽語音通話，可選用即時語音與串流轉錄功能
title: 語音通話外掛
x-i18n:
    generated_at: "2026-06-27T19:50:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

透過外掛為 OpenClaw 提供語音通話。支援外撥通知、多輪對話、全雙工即時語音、串流轉錄，以及具備允許清單政策的來電。

**目前提供者：** `twilio`（Programmable Voice + Media Streams）、`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput speech）、`mock`（開發用／無網路）。

<Note>
Voice Call 外掛會在**閘道行程內**執行。如果你使用遠端閘道，請在執行閘道的機器上安裝並設定此外掛，然後重新啟動閘道以載入它。
</Note>

## 快速開始

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    使用裸套件名稱可跟隨目前的官方發行標籤。只有在需要可重現安裝時，才釘選精確版本。

    之後重新啟動閘道，讓外掛載入。

  </Step>
  <Step title="Configure provider and webhook">
    在 `plugins.entries.voice-call.config` 下設定組態（完整形狀請見下方的
    [設定](#configuration)）。至少需要：`provider`、提供者憑證、`fromNumber`，以及可公開連線的網路鉤子 URL。
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    預設輸出可在聊天記錄與終端機中閱讀。它會檢查外掛是否啟用、提供者憑證、網路鉤子是否公開，以及是否只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。腳本請使用 `--json`。

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都是模擬執行。加入 `--yes` 才會實際撥出一通短暫的外撥通知電話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對於 Twilio、Telnyx 和 Plivo，設定必須解析為**公開網路鉤子 URL**。如果 `publicUrl`、通道 URL、Tailscale URL，或 serve 後援解析到 local loopback 或私有網路空間，設定會失敗，而不是啟動無法接收電信業者網路鉤子的提供者。
</Warning>

## 設定

如果 `enabled: true` 但所選提供者缺少憑證，閘道啟動時會記錄設定未完成警告，列出缺少的鍵，並略過啟動執行階段。命令、RPC 呼叫和代理工具在使用時仍會回傳精確缺少的提供者設定。

<Note>
語音通話憑證接受 SecretRefs。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 會透過標準 SecretRef 介面解析；請見 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Provider exposure and security notes">
    - Twilio、Telnyx 和 Plivo 都需要**可公開連線**的網路鉤子 URL。
    - `mock` 是本機開發提供者（不進行網路呼叫）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 為 true。
    - `skipSignatureVerification` 僅供本機測試使用。
    - 在 ngrok 免費層，請將 `publicUrl` 設為精確的 ngrok URL；簽章驗證一律會強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 只在 `tunnel.provider="ngrok"` 且 `serve.bind` 是 local loopback（ngrok 本機代理）時，允許簽章無效的 Twilio 網路鉤子。僅限本機開發。
    - Ngrok 免費層 URL 可能變更或加入插頁行為；如果 `publicUrl` 偏移，Twilio 簽章會失敗。正式環境：建議使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` 會關閉從未傳送有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections` 會限制未驗證的啟動前 socket 總數。
    - `streaming.maxPendingConnectionsPerIp` 會限制每個來源 IP 的未驗證啟動前 socket 數量。
    - `streaming.maxConnections` 會限制開啟中的媒體串流 socket 總數（待處理 + 作用中）。

  </Accordion>
  <Accordion title="Legacy config migrations">
    使用 `provider: "log"`、`twilio.from` 或舊版 `streaming.*` OpenAI 鍵的舊設定，會由 `openclaw doctor --fix` 重寫。執行階段後援目前仍接受舊的語音通話鍵，但重寫路徑是 `openclaw doctor --fix`，且相容性 shim 是暫時的。

    自動遷移的串流鍵：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 工作階段範圍

預設情況下，Voice Call 會使用 `sessionScope: "per-phone"`，因此同一來電者重複來電時會保留對話記憶。當每通電信業者通話都應以全新情境開始時，請設定 `sessionScope: "per-call"`，例如接待、預約、IVR，或同一電話號碼可能代表不同會議的 Google Meet 橋接流程。

Voice Call 會將產生的工作階段鍵儲存在已設定的代理命名空間下（`agent:<agentId>:voice:*`），讓通話記憶在閘道重新啟動後的工作階段鍵標準化過程中仍可保留。原始明確整合鍵使用相同的代理命名空間。標準 `agent:<configuredAgentId>:*` 鍵會保留該擁有者，其主要別名會遵循核心 `session.mainKey` 和全域範圍。外部或格式錯誤的 `agent:*` 輸入會作為不透明鍵，限定在已設定的代理下；`global` 和 `unknown` 仍是全域哨兵值。閘道啟動時會提升舊的原始鍵，來源是預設或 `{agentId}` 範本化儲存區，且其路徑能證明唯一擁有者。在固定自訂儲存區中，含糊的舊版資料列會保持不變，因為它們沒有足夠資訊可選擇擁有者；新的通話會使用標準的代理範圍歷史記錄。

## 即時語音對話

`realtime` 會為即時通話音訊選擇全雙工即時語音提供者。它與 `streaming` 分開，後者只會將音訊轉發給即時轉錄提供者。

<Warning>
`realtime.enabled` 不能與 `streaming.enabled` 同時使用。每通電話只能選擇一種音訊模式。
</Warning>

目前執行階段行為：

- Twilio Media Streams 支援 `realtime.enabled`。
- `realtime.provider` 是選用的。如果未設定，Voice Call 會使用第一個已註冊的即時語音提供者。
- 內建即時語音提供者：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的提供者外掛註冊。
- 提供者擁有的原始設定位於 `realtime.providers.<providerId>` 下。
- Voice Call 預設公開共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入推理、目前資訊或一般 OpenClaw 工具時，即時模型可以呼叫它。
- `realtime.consultPolicy` 可選擇性加入指引，說明即時模型何時應呼叫 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 預設關閉。啟用時，Voice Call 會在工作階段設定時，將有界代理身分和選取的工作區檔案膠囊注入即時提供者指令。
- `realtime.fastContext.enabled` 預設關閉。啟用時，Voice Call 會先針對諮詢問題搜尋已索引的記憶／工作階段情境，並在 `realtime.fastContext.timeoutMs` 內將那些片段回傳給即時模型；只有在 `realtime.fastContext.fallbackToConsult` 為 true 時，才會退回完整諮詢代理。
- 如果 `realtime.provider` 指向未註冊的提供者，或完全沒有註冊任何即時語音提供者，Voice Call 會記錄警告並略過即時媒體，而不是讓整個外掛失敗。
- 諮詢工作階段鍵會在可用時重用已儲存的通話工作階段，然後退回已設定的 `sessionScope`（預設為 `per-phone`，隔離通話則為 `per-call`）。

### 工具政策

`realtime.toolPolicy` 會控制諮詢執行：

| 政策             | 行為                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公開諮詢工具，並將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 公開諮詢工具，並讓一般代理使用正常的代理工具政策。                                                      |
| `none`           | 不公開諮詢工具。自訂 `realtime.tools` 仍會傳遞給即時提供者。                               |

`realtime.consultPolicy` 只控制即時模型指令：

| 政策          | 指引                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 保留預設提示，並讓提供者決定何時呼叫諮詢工具。              |
| `substantive` | 直接回答簡單的對話銜接內容，並在事實、記憶、工具或情境之前先諮詢。 |
| `always`      | 每次實質回答前都先諮詢。                                                        |

### 代理語音情境

啟用 `realtime.agentContext`，讓語音橋接器在一般回合中不必支付完整代理諮詢往返成本，也能聽起來像已設定的 OpenClaw 代理。情境膠囊會在即時工作階段建立時加入一次，因此不會增加每回合延遲。對 `openclaw_agent_consult` 的呼叫仍會執行完整的 OpenClaw 代理，並應用於工具工作、目前資訊、記憶查詢或工作區狀態。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### 即時供應者範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API 金鑰來自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型為 `gemini-2.5-flash-native-audio-preview-12-2025`；語音為 `Kore`。`sessionResumption` 和 `contextWindowCompression` 預設會對較長且可重新連線的通話啟用。使用 `silenceDurationMs`、`startSensitivity` 和 `endSensitivity` 來調整電話音訊上更快的輪流對話。

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

請參閱 [Google 供應者](/zh-TW/providers/google) 和 [OpenAI 供應者](/zh-TW/providers/openai)，了解供應者專屬的即時語音選項。

## 串流轉錄

`streaming` 會為即時通話音訊選取即時轉錄供應者。

目前執行階段行為：

- `streaming.provider` 是選填。如果未設定，語音通話會使用第一個已註冊的即時轉錄供應者。
- 內建即時轉錄供應者：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由各自的供應者外掛註冊。
- 供應者擁有的原始設定位於 `streaming.providers.<providerId>` 下。
- Twilio 傳送已接受串流的 `start` 訊息後，語音通話會立即註冊串流，在供應者連線期間透過轉錄供應者佇列處理傳入媒體，並且只在即時轉錄就緒後才開始初始問候。
- 如果 `streaming.provider` 指向未註冊的供應者，或沒有任何供應者已註冊，語音通話會記錄警告並略過媒體串流，而不是讓整個外掛失敗。

### 串流供應者範例

<Tabs>
  <Tab title="OpenAI">
    預設值：API 金鑰 `streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`；模型 `gpt-4o-transcribe`；`silenceDurationMs: 800`；`vadThreshold: 0.5`。

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
    預設值：API 金鑰 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；端點 `wss://api.x.ai/v1/stt`；編碼 `mulaw`；取樣率 `8000`；`endpointingMs: 800`；`interimResults: true`。

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

語音通話會使用核心 `messages.tts` 設定來串流通話語音。你可以在外掛設定下以**相同形狀**覆寫它，它會與 `messages.tts` 深度合併。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**語音通話會忽略 Microsoft 語音。**電話音訊需要 PCM；目前的 Microsoft 傳輸未公開電話 PCM 輸出。
</Warning>

行為備註：

- 外掛設定中的舊版 `tts.<provider>` 鍵（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會回退到供應者原生語音。
- 如果 Twilio 媒體串流已啟用，語音通話不會回退到 TwiML `<Say>`。如果在該狀態下電話 TTS 不可用，播放請求會失敗，而不是混用兩條播放路徑。
- 當電話 TTS 回退到次要供應者時，語音通話會記錄含有供應者鏈（`from`、`to`、`attempts`）的警告，以便偵錯。
- 當 Twilio 插話或串流拆除清除待處理 TTS 佇列時，已排隊的播放請求會結束，而不是讓等待播放完成的來電者卡住。

### TTS 範例

<Tabs>
  <Tab title="僅核心 TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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
`inboundPolicy: "allowlist"` 是低保證程度的來電號碼篩選。外掛會正規化供應者提供的 `From` 值，並將其與 `allowFrom` 比較。網路鉤子驗證會驗證供應者傳遞和承載完整性，但它**不會**證明 PSTN/VoIP 來電號碼所有權。請將 `allowFrom` 視為來電顯示篩選，而不是強式來電者身分。
</Warning>

自動回應使用代理系統。使用 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 進行調整。

### 依號碼路由

當一個語音通話外掛接收多個電話號碼的來電，且每個號碼都應像不同線路一樣運作時，請使用 `numbers`。例如，一個號碼可以使用輕鬆的個人助理，而另一個使用商務角色、不同的回應代理和不同的 TTS 語音。

路由會從供應者提供的撥入 `To` 號碼選取。鍵必須是 E.164 號碼。來電抵達時，語音通話會解析相符路由一次，將相符路由儲存在通話記錄上，並重複使用該有效設定來處理問候、傳統自動回應路徑、即時諮詢路徑和 TTS 播放。如果沒有路由相符，則會使用全域語音通話設定。撥出通話不使用 `numbers`；發起通話時請明確傳入撥出目標、訊息和工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值會深度合併到全域語音通話 `tts` 設定之上，因此通常只需覆寫供應者語音：

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
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

語音通話會防禦性地擷取語音文字：

- 忽略標示為推理/錯誤內容的承載。
- 剖析直接 JSON、圍欄 JSON 或行內 `"spoken"` 鍵。
- 回退到純文字，並移除可能的規劃/中繼前導段落。

這會讓語音播放聚焦於面向來電者的文字，並避免將規劃文字洩漏到音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，第一則訊息處理會繫結到即時播放狀態：

- 只有在初始問候正在主動播放時，才會抑制插話佇列清除和自動回應。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會保留在佇列中等待重試。
- Twilio 串流的初始播放會在串流連線時開始，不會有額外延遲。
- 插話會中止主動播放，並清除已排隊但尚未播放的 Twilio TTS 項目。已清除的項目會解析為已略過，因此後續回應邏輯可以繼續，而無需等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流自己的開場回合。語音通話**不會**為該初始訊息發布舊版 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會保持連接。

### Twilio 串流中斷寬限

當 Twilio 媒體串流中斷連線時，Voice Call 會等待 **2000 ms**，然後
自動結束通話：

- 如果串流在該時間窗口內重新連線，會取消自動結束。
- 如果寬限期過後沒有串流重新註冊，通話會被結束，以避免卡住的進行中通話。

## 過期通話清理器

使用 `staleCallReaperSeconds` 結束從未收到終止
網路鉤子的通話（例如永遠未完成的通知模式通話）。預設值
為 `0`（停用）。

建議範圍：

- **Production:** 通知樣式流程使用 `120`–`300` 秒。
- 將此值保持為**高於 `maxDurationSeconds`**，讓一般通話可以完成。良好的起點是 `maxDurationSeconds + 30–60` 秒。

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

## 網路鉤子安全性

當代理或通道位於閘道前方時，外掛會重建公開 URL
以進行簽章驗證。這些選項會控制信任哪些轉送標頭：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許來自轉送標頭的主機清單。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在沒有允許清單的情況下信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  只有在請求遠端 IP 符合清單時，才信任轉送標頭。
</ParamField>

其他保護：

- Twilio 和 Plivo 已啟用網路鉤子**重放保護**。重放的有效網路鉤子請求會被確認，但會略過副作用。
- Twilio 對話回合會在 `<Gather>` 回呼中包含每回合權杖，因此過期或重放的語音回呼無法滿足較新的待處理轉錄回合。
- 當缺少提供者所需的簽章標頭時，未驗證的網路鉤子請求會在讀取本文前被拒絕。
- voice-call 網路鉤子會使用共用的預先驗證本文設定檔（64 KB / 5 秒），並在簽章驗證前加入每 IP 的進行中上限。

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

## 命令列介面

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

當閘道已在執行時，操作型 `voicecall` 命令會委派給
閘道擁有的 voice-call 執行階段，因此命令列介面不會繫結第二個
網路鉤子伺服器。如果無法連上閘道，命令會退回到
獨立命令列介面執行階段。

`latency` 會從預設 voice-call 儲存路徑讀取 `calls.jsonl`。
使用 `--file <path>` 指向不同記錄，並使用 `--last <n>` 將
分析限制為最後 N 筆記錄（預設 200）。輸出包含回合延遲與
聆聽等待時間的 p50/p90/p99。

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

voice-call 外掛隨附相符的代理技能。

## 閘道 RPC

| 方法                 | 引數                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` 只在搭配 `mode: "conversation"` 時有效。通知模式通話
如果需要連線後
數字，應在通話存在後使用 `voicecall.dtmf`。

## 疑難排解

### 設定無法暴露網路鉤子

從執行閘道的相同環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。已
設定的 `publicUrl` 若指向本機或私人網路
空間仍會失敗，因為電信業者無法回呼這些位址。不要使用
`localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

Twilio 通知模式撥出通話會在
建立通話請求中直接傳送其初始 `<Say>` TwiML，因此第一段語音訊息不依賴 Twilio
擷取網路鉤子 TwiML。狀態回呼、對話通話、連線前 DTMF、即時串流和連線後通話
控制仍需要公開網路鉤子。

使用一個公開暴露路徑：

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

變更設定後，重新啟動或重新載入閘道，然後執行：

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

除非你傳入 `--yes`，否則 `voicecall smoke` 是試跑。

### 提供者憑證失敗

檢查選取的提供者和必要憑證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和
  `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

憑證必須存在於閘道主機上。編輯本機 shell 設定檔不會
影響已在執行的閘道，直到它重新啟動或重新載入其
環境。

### 通話開始但提供者網路鉤子未抵達

確認提供者主控台指向確切的公開網路鉤子 URL：

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
- 通道 URL 在閘道啟動後已變更。
- 代理轉送請求，但移除或改寫 host/proto 標頭。
- 防火牆或 DNS 將公開主機名稱路由到閘道以外的位置。
- 閘道在未啟用 Voice Call 外掛的情況下重新啟動。

當反向代理或通道位於閘道前方時，將
`webhookSecurity.allowedHosts` 設為公開主機名稱，或針對已知代理位址使用
`webhookSecurity.trustedProxyIPs`。只有在代理邊界由你
控制時，才使用 `webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

提供者簽章會依照 OpenClaw 從傳入請求重建的公開 URL
進行檢查。如果簽章失敗：

- 確認提供者網路鉤子 URL 完全符合 `publicUrl`，包括
  配置、主機和路徑。
- 對於 ngrok 免費層 URL，當通道主機名稱變更時更新 `publicUrl`。
- 確保代理保留原始 host 和 proto 標頭，或設定
  `webhookSecurity.allowedHosts`。
- 不要在本機測試以外啟用 `skipSignatureVerification`。

### Google Meet Twilio 加入失敗

Google Meet 使用此外掛進行 Twilio 撥入加入。請先驗證 Voice Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

接著明確驗證 Google Meet 傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 為綠色，但 Meet 參與者從未加入，請檢查 Meet
撥入號碼、PIN 和 `--dtmf-sequence`。電話通話可以是正常的，但
會議可能拒絕或忽略不正確的 DTMF 序列。

Google Meet 會透過 `voicecall.start` 啟動 Twilio 電話線路，並帶有
連線前 DTMF 序列。由 PIN 衍生的序列會包含 Google Meet 外掛的
`voiceCall.dtmfDelayMs` 作為前置 Twilio 等待數字。預設值為 12 秒，
因為 Meet 撥入提示可能較晚抵達。Voice Call 接著會在請求開場問候前
重新導向回即時處理。

使用 `openclaw logs --follow` 查看即時階段追蹤。健康的 Twilio Meet
加入會依此順序記錄：

- Google Meet 將 Twilio 加入委派給 Voice Call。
- Voice Call 儲存連線前 DTMF TwiML。
- Twilio 初始 TwiML 在即時處理前被取用並提供。
- Voice Call 為 Twilio 通話提供即時 TwiML。
- Google Meet 在 DTMF 後延遲後使用 `voicecall.speak` 請求開場語音。

`openclaw voicecall tail` 仍會顯示已持久化的通話記錄；它對
通話狀態和轉錄很有用，但並非每個網路鉤子/即時轉換都會出現在
其中。

### 即時通話沒有語音

確認只啟用一種音訊模式。`realtime.enabled` 和
`streaming.enabled` 不能同時為 true。

對於即時 Twilio 通話，也請驗證：

- 已載入並註冊即時提供者外掛。
- `realtime.provider` 未設定，或命名已註冊的提供者。
- 提供者 API 金鑰可供閘道程序使用。
- `openclaw logs --follow` 顯示已提供即時 TwiML、即時橋接
  已啟動，且初始問候已排入佇列。

## 相關

- [交談模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

---
read_when:
    - 您想從 OpenClaw 撥打外撥語音通話
    - 你正在設定或開發語音通話 Plugin
    - 你需要電話通訊中的即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥出及接聽語音通話，可選用即時語音與串流轉錄
title: 語音通話 Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

透過 Plugin 為 OpenClaw 提供語音通話。支援對外通知、多輪對話、全雙工即時語音、串流轉錄，以及具備允許清單原則的來電。

**目前的提供者：** `twilio`（Programmable Voice + Media Streams）、`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput speech）、`mock`（開發/無網路）。

<Note>
Voice Call Plugin 會在 **Gateway 程序內** 執行。如果你使用遠端 Gateway，請在執行 Gateway 的機器上安裝並設定此 Plugin，然後重新啟動 Gateway 以載入它。
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

    使用裸套件名稱即可跟隨目前的官方發行標籤。只有在需要可重現安裝時，才釘選精確版本。

    之後重新啟動 Gateway，讓 Plugin 載入。

  </Step>
  <Step title="Configure provider and webhook">
    在 `plugins.entries.voice-call.config` 下設定組態（完整結構請參閱下方的
    [設定](#configuration)）。至少需要：
    `provider`、提供者憑證、`fromNumber`，以及可公開連線的 Webhook URL。
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    預設輸出適合在聊天記錄和終端機中閱讀。它會檢查 Plugin 是否啟用、提供者憑證、Webhook 暴露情況，以及是否只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。腳本請使用 `--json`。

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都是 dry run。加入 `--yes` 以實際撥打一通簡短的對外通知通話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對於 Twilio、Telnyx 和 Plivo，設定必須解析為 **公開 Webhook URL**。
如果 `publicUrl`、通道 URL、Tailscale URL，或 serve 後援解析為 loopback 或私人網路空間，設定會失敗，而不是啟動無法接收電信業者 Webhook 的提供者。
</Warning>

## 設定

如果 `enabled: true`，但所選提供者缺少憑證，Gateway 啟動時會記錄 setup-incomplete 警告，列出缺少的鍵，並略過啟動 runtime。指令、RPC 呼叫和 agent 工具在使用時仍會回傳確切缺少的提供者設定。

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
  <Accordion title="Provider exposure and security notes">
    - Twilio、Telnyx 和 Plivo 都需要 **可公開連線的** Webhook URL。
    - `mock` 是本機開發提供者（沒有網路呼叫）。
    - 除非 `skipSignatureVerification` 為 true，否則 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
    - `skipSignatureVerification` 僅供本機測試使用。
    - 在 ngrok 免費層，請將 `publicUrl` 設為確切的 ngrok URL；簽章驗證一律會強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 僅在 `tunnel.provider="ngrok"` 且 `serve.bind` 為 loopback（ngrok 本機 agent）時，允許帶有無效簽章的 Twilio Webhook。僅限本機開發。
    - Ngrok 免費層 URL 可能會變更或加入插頁行為；如果 `publicUrl` 漂移，Twilio 簽章會失敗。正式環境：建議使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` 會關閉從未送出有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections` 會限制未驗證 pre-start socket 的總數。
    - `streaming.maxPendingConnectionsPerIp` 會限制每個來源 IP 的未驗證 pre-start socket 數量。
    - `streaming.maxConnections` 會限制開啟中的 media stream socket 總數（pending + active）。

  </Accordion>
  <Accordion title="Legacy config migrations">
    使用 `provider: "log"`、`twilio.from` 或舊版 `streaming.*` OpenAI 鍵的舊組態，會由 `openclaw doctor --fix` 重寫。
    runtime 後援目前仍接受舊的 voice-call 鍵，但重寫路徑是 `openclaw doctor --fix`，而相容性 shim 是暫時的。

    自動遷移的串流鍵：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 工作階段範圍

Voice Call 預設使用 `sessionScope: "per-phone"`，因此來自同一來電者的重複通話會保留對話記憶。當每通電信業者通話都應該以全新上下文開始時，請設定 `sessionScope: "per-call"`，例如接待、預約、IVR，或同一個電話號碼可能代表不同會議的 Google Meet bridge 流程。

## 即時語音對話

`realtime` 會選取全雙工即時語音提供者來處理即時通話音訊。它與 `streaming` 分開，後者只會將音訊轉發給即時轉錄提供者。

<Warning>
`realtime.enabled` 不能與 `streaming.enabled` 搭配使用。每通通話請選擇一種音訊模式。
</Warning>

目前的 runtime 行為：

- Twilio Media Streams 支援 `realtime.enabled`。
- `realtime.provider` 是選用項目。如果未設定，Voice Call 會使用第一個已註冊的即時語音提供者。
- 內建的即時語音提供者：Google Gemini Live（`google`）和 OpenAI（`openai`），由其提供者 Plugin 註冊。
- 提供者擁有的原始組態位於 `realtime.providers.<providerId>` 下。
- Voice Call 預設公開共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入推理、目前資訊，或一般 OpenClaw 工具時，即時模型可以呼叫它。
- `realtime.consultPolicy` 可選擇性加入指引，說明即時模型何時應呼叫 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 預設關閉。啟用時，Voice Call 會在工作階段設定時，將有界限的 agent 身分、系統提示覆寫，以及選取的工作區檔案 capsule 注入即時提供者指令。
- `realtime.fastContext.enabled` 預設關閉。啟用時，Voice Call 會先針對 consult 問題搜尋已索引的記憶/工作階段上下文，並在 `realtime.fastContext.timeoutMs` 內將這些片段回傳給即時模型；只有在 `realtime.fastContext.fallbackToConsult` 為 true 時，才會後援到完整 consult agent。
- 如果 `realtime.provider` 指向未註冊的提供者，或完全沒有註冊即時語音提供者，Voice Call 會記錄警告並略過即時媒體，而不是讓整個 Plugin 失敗。
- consult 工作階段鍵會在可用時重用已儲存的通話工作階段，然後後援到設定的 `sessionScope`（預設為 `per-phone`，或隔離通話使用 `per-call`）。

### 工具原則

`realtime.toolPolicy` 控制 consult 執行：

| 原則             | 行為                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公開 consult 工具，並將一般 agent 限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 公開 consult 工具，並讓一般 agent 使用一般 agent 工具原則。                                                      |
| `none`           | 不公開 consult 工具。自訂 `realtime.tools` 仍會傳遞給即時提供者。                               |

`realtime.consultPolicy` 只控制即時模型指令：

| 原則          | 指引                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 保留預設提示，並讓提供者決定何時呼叫 consult 工具。              |
| `substantive` | 直接回答簡單的對話銜接內容，並在事實、記憶、工具或上下文前 consult。 |
| `always`      | 在每個實質回答前 consult。                                                        |

### Agent 語音上下文

當語音 bridge 應該聽起來像已設定的 OpenClaw agent，但又不想在普通輪次支付完整 agent-consult 往返成本時，請啟用 `realtime.agentContext`。上下文 capsule 會在即時工作階段建立時加入一次，因此不會增加每輪延遲。對 `openclaw_agent_consult` 的呼叫仍會執行完整 OpenClaw agent，並應用於工具工作、目前資訊、記憶查詢，或工作區狀態。

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
              includeSystemPrompt: true,
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

### 即時提供者範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API 金鑰來自 `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型為
    `gemini-2.5-flash-native-audio-preview-12-2025`；語音為 `Kore`。
    `sessionResumption` 和 `contextWindowCompression` 預設會為較長、
    可重新連線的通話啟用。使用 `silenceDurationMs`、`startSensitivity` 和
    `endSensitivity` 來調整電話音訊上更快的輪流發話。

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
                    voice: "Kore",
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

請參閱 [Google 提供者](/zh-TW/providers/google) 和
[OpenAI 提供者](/zh-TW/providers/openai)，了解提供者專屬的即時語音
選項。

## 串流轉錄

`streaming` 會為即時通話音訊選取即時轉錄提供者。

目前的執行階段行為：

- `streaming.provider` 是選用的。如果未設定，語音通話會使用第一個已註冊的即時轉錄提供者。
- 內建即時轉錄提供者：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由其提供者 Plugin 註冊。
- 提供者擁有的原始設定位於 `streaming.providers.<providerId>` 下。
- Twilio 傳送已接受的串流 `start` 訊息後，語音通話會立即註冊串流，在提供者連線期間透過轉錄提供者佇列化傳入媒體，並且只在即時轉錄就緒後才開始初始問候語。
- 如果 `streaming.provider` 指向未註冊的提供者，或沒有任何提供者已註冊，語音通話會記錄警告並略過媒體串流，而不是讓整個 Plugin 失敗。

### 串流提供者範例

<Tabs>
  <Tab title="OpenAI">
    預設值：API 金鑰為 `streaming.providers.openai.apiKey` 或
    `OPENAI_API_KEY`；模型為 `gpt-4o-transcribe`；`silenceDurationMs: 800`；
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
    預設值：API 金鑰為 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；
    端點為 `wss://api.x.ai/v1/stt`；編碼為 `mulaw`；取樣率為 `8000`；
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

語音通話會使用核心 `messages.tts` 設定來在通話中串流
語音。你可以在 Plugin 設定下用**相同形狀**覆寫它，它會與
`messages.tts` 深度合併。

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
**Microsoft 語音會被語音通話忽略。** 電話音訊需要 PCM；
目前的 Microsoft 傳輸不會公開電話 PCM 輸出。
</Warning>

行為注意事項：

- Plugin 設定內的舊版 `tts.<provider>` 鍵（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；已提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會退回使用提供者原生語音。
- 如果 Twilio 媒體串流已在作用中，語音通話不會退回使用 TwiML `<Say>`。如果該狀態下電話 TTS 不可用，播放請求會失敗，而不是混用兩條播放路徑。
- 當電話 TTS 退回使用次要提供者時，語音通話會記錄包含提供者鏈（`from`、`to`、`attempts`）的警告，方便偵錯。
- 當 Twilio 插話或串流拆除清除待處理的 TTS 佇列時，已佇列的播放請求會結算，而不是讓來電者在等待播放完成時卡住。

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

## 傳入通話

傳入政策預設為 `disabled`。若要啟用傳入通話，請設定：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保證的來電顯示篩選。
Plugin 會正規化提供者提供的 `From` 值，並將其與
`allowFrom` 比較。Webhook 驗證會驗證提供者傳遞和
酬載完整性，但它**不會**證明 PSTN/VoIP 來電號碼
所有權。請將 `allowFrom` 視為來電顯示篩選，而不是強來電者
身分。
</Warning>

自動回應會使用代理系統。使用 `responseModel`、
`responseSystemPrompt` 和 `responseTimeoutMs` 進行調整。

### 依號碼路由

當一個語音通話 Plugin 接收多個電話號碼的通話，且每個號碼都應像不同線路一樣運作時，請使用 `numbers`。例如，一個
號碼可以使用隨性的個人助理，而另一個號碼使用商務
角色、不同的回應代理和不同的 TTS 語音。

路由會從提供者提供的已撥 `To` 號碼中選取。鍵必須是
E.164 號碼。通話抵達時，語音通話會解析相符路由一次，
將相符路由儲存在通話記錄上，並為問候語、傳統自動回應路徑、即時諮詢路徑和 TTS
播放重複使用該有效設定。如果沒有路由相符，則使用全域語音通話設定。
撥出通話不使用 `numbers`；發起通話時明確傳入撥出目標、訊息和
工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值會深度合併到全域語音通話 `tts` 設定之上，因此
通常只需要覆寫提供者語音：

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

對於自動回應，語音通話會將嚴格的語音輸出合約附加到
系統提示：

```text
{"spoken":"..."}
```

語音通話會防禦性地擷取語音文字：

- 忽略標記為推理/錯誤內容的酬載。
- 剖析直接 JSON、圍欄 JSON 或內嵌 `"spoken"` 鍵。
- 退回使用純文字，並移除可能是規劃/中繼前導的段落。

這會讓語音播放專注於面向來電者的文字，並避免
將規劃文字洩漏到音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，第一則訊息處理會綁定至即時
播放狀態：

- 只有在初始問候語正在主動發聲時，才會抑制插話佇列清除和自動回應。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會保持佇列中以便重試。
- Twilio 串流的初始播放會在串流連線時開始，沒有額外延遲。
- 插話會中止作用中的播放，並清除已佇列但尚未播放的 Twilio TTS 項目。已清除的項目會解析為已略過，因此後續回應邏輯可以繼續，而不必等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流自己的開場輪次。語音通話**不會**為該初始訊息發佈舊版 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會保持連接。

### Twilio 串流斷線寬限

當 Twilio 媒體串流斷線時，語音通話會等待 **2000 ms** 後才
自動結束通話：

- 如果串流在該時間窗內重新連線，自動結束會被取消。
- 如果寬限期後沒有串流重新註冊，通話會被結束，以防止作用中的通話卡住。

## 過期通話清理器

使用 `staleCallReaperSeconds` 來結束從未收到終止
Webhook 的通話（例如，永遠不完成的通知模式通話）。預設值
為 `0`（已停用）。

建議範圍：

- **正式環境：** 用於通知式流程時設為 `120`–`300` 秒。
- 讓此值**高於 `maxDurationSeconds`**，以便一般呼叫能夠完成。良好的起始值是 `maxDurationSeconds + 30–60` 秒。

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

當代理或通道位於 Gateway 前方時，Plugin 會重建公開 URL 以進行簽章驗證。這些選項會控制要信任哪些轉送標頭：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許來自轉送標頭的主機清單。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在沒有允許清單的情況下信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  只有在請求遠端 IP 符合清單時，才信任轉送標頭。
</ParamField>

額外保護：

- Twilio 和 Plivo 已啟用 Webhook **重放保護**。重放的有效 Webhook 請求會被確認，但會跳過副作用。
- Twilio 對話回合會在 `<Gather>` 回呼中包含每回合權杖，因此過期或重放的語音回呼無法滿足較新的待處理轉錄回合。
- 當缺少供應商要求的簽章標頭時，未驗證的 Webhook 請求會在讀取主體前遭到拒絕。
- 語音通話 Webhook 使用共用的預先驗證主體設定檔（64 KB / 5 秒），並在簽章驗證前加上每個 IP 的進行中上限。

具有穩定公開主機的範例：

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

當 Gateway 已在執行時，操作性的 `voicecall` 命令會委派給 Gateway 擁有的語音通話執行階段，因此 CLI 不會綁定第二個 Webhook 伺服器。如果無法連到 Gateway，這些命令會退回使用獨立 CLI 執行階段。

`latency` 會從預設語音通話儲存路徑讀取 `calls.jsonl`。使用 `--file <path>` 指向不同記錄，並使用 `--last <n>` 將分析限制為最後 N 筆記錄（預設 200）。輸出包含回合延遲和聆聽等待時間的 p50/p90/p99。

## Agent 工具

工具名稱：`voice_call`。

| 動作            | 引數                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

此儲存庫在 `skills/voice-call/SKILL.md` 隨附相符的 skill 文件。

## Gateway RPC

| 方法                 | 引數                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` 只有在 `mode: "conversation"` 時有效。通知模式通話若需要連線後按鍵，應在通話存在後使用 `voicecall.dtmf`。

## 疑難排解

### 設定無法暴露 Webhook

從執行 Gateway 的相同環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。已設定的 `publicUrl` 若指向本機或私人網路空間仍會失敗，因為電信業者無法回呼到這些位址。請勿使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

Twilio 通知模式外撥通話會直接在建立通話請求中傳送初始 `<Say>` TwiML，因此第一段語音訊息不依賴 Twilio 擷取 Webhook TwiML。狀態回呼、對話通話、連線前 DTMF、即時串流，以及連線後通話控制仍需要公開 Webhook。

使用一條公開暴露路徑：

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

除非傳入 `--yes`，否則 `voicecall smoke` 是試執行。

### 供應商憑證失敗

檢查所選供應商和必要的憑證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或 `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和 `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

憑證必須存在於 Gateway 主機上。編輯本機 shell 設定檔不會影響已在執行的 Gateway，直到它重新啟動或重新載入其環境為止。

### 通話已開始但供應商 Webhook 未抵達

確認供應商主控台指向確切的公開 Webhook URL：

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
- 代理轉送了請求，但移除或改寫了 host/proto 標頭。
- 防火牆或 DNS 將公開主機名稱路由到 Gateway 以外的位置。
- Gateway 重新啟動時未啟用 Voice Call Plugin。

當反向代理或通道位於 Gateway 前方時，請將 `webhookSecurity.allowedHosts` 設為公開主機名稱，或針對已知代理位址使用 `webhookSecurity.trustedProxyIPs`。只有在代理邊界由你控制時，才使用 `webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

供應商簽章會根據 OpenClaw 從傳入請求重建的公開 URL 進行檢查。如果簽章失敗：

- 確認供應商 Webhook URL 與 `publicUrl` 完全相符，包括 scheme、host 和 path。
- 對於 ngrok 免費層 URL，當通道主機名稱變更時更新 `publicUrl`。
- 確保代理保留原始 host 和 proto 標頭，或設定 `webhookSecurity.allowedHosts`。
- 請勿在本機測試以外啟用 `skipSignatureVerification`。

### Google Meet Twilio 加入失敗

Google Meet 使用此 Plugin 進行 Twilio 撥入加入。請先驗證 Voice Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

接著明確驗證 Google Meet 傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 為綠色但 Meet 參與者從未加入，請檢查 Meet 撥入號碼、PIN 和 `--dtmf-sequence`。電話通話可能是正常的，而會議仍可能因錯誤的 DTMF 序列而拒絕或忽略。

Google Meet 會透過 `voicecall.start` 搭配連線前 DTMF 序列啟動 Twilio 電話端。由 PIN 衍生的序列會包含 Google Meet Plugin 的 `voiceCall.dtmfDelayMs` 作為前置 Twilio 等待數字。預設值為 12 秒，因為 Meet 撥入提示可能較晚出現。Voice Call 接著會在請求介紹問候之前重新導向回即時處理。

使用 `openclaw logs --follow` 查看即時階段追蹤。正常的 Twilio Meet 加入會依序記錄：

- Google Meet 將 Twilio 加入委派給 Voice Call。
- Voice Call 儲存連線前 DTMF TwiML。
- Twilio 初始 TwiML 會在即時處理前被取用並提供。
- Voice Call 為 Twilio 通話提供即時 TwiML。
- Google Meet 在 DTMF 後延遲之後使用 `voicecall.speak` 請求介紹語音。

`openclaw voicecall tail` 仍會顯示持久化的通話記錄；它對通話狀態和轉錄很有用，但不是每個 Webhook 或即時轉換都會出現在那裡。

### 即時通話沒有語音

確認只啟用一種音訊模式。`realtime.enabled` 和 `streaming.enabled` 不能同時為 true。

對於即時 Twilio 通話，也請驗證：

- 已載入並註冊即時供應商 Plugin。
- `realtime.provider` 未設定，或指定已註冊的供應商。
- Gateway 程序可使用供應商 API 金鑰。
- `openclaw logs --follow` 顯示已提供即時 TwiML、即時橋接已啟動，且初始問候已排入佇列。

## 相關

- [Talk mode](/zh-TW/nodes/talk)
- [Text-to-speech](/zh-TW/tools/tts)
- [Voice wake](/zh-TW/nodes/voicewake)

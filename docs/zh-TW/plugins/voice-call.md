---
read_when:
    - 您想從 OpenClaw 撥出語音通話
    - 您正在設定或開發語音通話 Plugin
    - 你需要在電話通訊中使用即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥打外撥語音電話並接聽來電，並可選擇使用即時語音與串流轉錄功能
title: 語音通話 Plugin
x-i18n:
    generated_at: "2026-05-04T07:05:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

透過 Plugin 為 OpenClaw 提供語音通話。支援外撥通知、多輪對話、全雙工即時語音、串流轉錄，以及使用允許清單政策的來電。

**目前的供應商：** `twilio`（Programmable Voice + Media Streams）、`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput speech）、`mock`（開發用/無網路）。

<Note>
Voice Call Plugin 會在 **Gateway 程序內部** 執行。如果你使用遠端 Gateway，請在執行 Gateway 的機器上安裝並設定 Plugin，然後重新啟動 Gateway 以載入它。
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

    使用未加版本的套件來跟隨目前的官方發布標籤。只有在需要可重現的安裝時，才釘選精確版本。

    之後請重新啟動 Gateway，讓 Plugin 載入。

  </Step>
  <Step title="Configure provider and webhook">
    在 `plugins.entries.voice-call.config` 下設定組態（完整結構請參閱下方的
    [組態](#configuration)）。至少需要：
    `provider`、供應商憑證、`fromNumber`，以及可由公開網路連到的 Webhook URL。
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    預設輸出適合在聊天記錄和終端機中閱讀。它會檢查
    Plugin 是否啟用、供應商憑證、Webhook 暴露狀態，以及是否
    只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。腳本請使用
    `--json`。

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都是乾跑。加入 `--yes` 才會實際撥出一通短暫的
    外撥通知電話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對於 Twilio、Telnyx 和 Plivo，設定必須解析為**公開 Webhook URL**。
如果 `publicUrl`、通道 URL、Tailscale URL 或 serve 後援
解析到 loopback 或私人網路空間，設定會失敗，而不是
啟動一個無法接收電信業者 Webhook 的供應商。
</Warning>

## 組態

如果 `enabled: true`，但所選供應商缺少憑證，
Gateway 啟動時會記錄 setup-incomplete 警告，列出缺少的鍵，並
略過啟動執行階段。命令、RPC 呼叫和代理工具在使用時仍會
回傳精確缺少的供應商組態。

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
  <Accordion title="Provider exposure and security notes">
    - Twilio、Telnyx 和 Plivo 都需要**可由公開網路連到**的 Webhook URL。
    - `mock` 是本機開發供應商（不進行網路呼叫）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 為 true。
    - `skipSignatureVerification` 僅供本機測試使用。
    - 在 ngrok 免費方案上，將 `publicUrl` 設為精確的 ngrok URL；簽章驗證一律強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 只會在 `tunnel.provider="ngrok"` 且 `serve.bind` 為 loopback（ngrok 本機代理程式）時，允許簽章無效的 Twilio Webhook。僅限本機開發使用。
    - Ngrok 免費方案 URL 可能會變更或加入插頁行為；如果 `publicUrl` 漂移，Twilio 簽章會失敗。正式環境：建議使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` 會關閉從未傳送有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections` 會限制未驗證 pre-start socket 的總數。
    - `streaming.maxPendingConnectionsPerIp` 會限制每個來源 IP 的未驗證 pre-start socket 數量。
    - `streaming.maxConnections` 會限制開啟中媒體串流 socket 的總數（pending + active）。

  </Accordion>
  <Accordion title="Legacy config migrations">
    使用 `provider: "log"`、`twilio.from` 或舊版
    `streaming.*` OpenAI 鍵的舊組態，會由 `openclaw doctor --fix` 重寫。
    執行階段後援目前仍接受舊的 voice-call 鍵，但
    重寫路徑是 `openclaw doctor --fix`，相容性 shim 是
    暫時的。

    自動遷移的串流鍵：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 工作階段範圍

預設情況下，Voice Call 使用 `sessionScope: "per-phone"`，讓同一位來電者的重複來電
保留對話記憶。當每通電信業者通話都應從全新情境開始時，請設定 `sessionScope: "per-call"`，例如接待、
預約、IVR，或同一個電話號碼可能代表不同會議的 Google Meet 橋接流程。

## 即時語音對話

`realtime` 會為即時通話音訊選擇全雙工即時語音供應商。
它與 `streaming` 分離，後者只會將音訊轉送給
即時轉錄供應商。

<Warning>
`realtime.enabled` 不能與 `streaming.enabled` 合併使用。每通電話請選擇一種
音訊模式。
</Warning>

目前的執行階段行為：

- Twilio Media Streams 支援 `realtime.enabled`。
- `realtime.provider` 是選用項目。若未設定，Voice Call 會使用第一個已註冊的即時語音供應商。
- 內建即時語音供應商：Google Gemini Live（`google`）和 OpenAI（`openai`），由其供應商 Plugin 註冊。
- 供應商擁有的原始組態位於 `realtime.providers.<providerId>` 下。
- Voice Call 預設暴露共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入推理、最新資訊或一般 OpenClaw 工具時，即時模型可以呼叫它。
- `realtime.fastContext.enabled` 預設關閉。啟用後，Voice Call 會先搜尋已索引的記憶/工作階段情境，以回答諮詢問題，並在 `realtime.fastContext.timeoutMs` 內將那些片段回傳給即時模型；只有在 `realtime.fastContext.fallbackToConsult` 為 true 時，才會後援到完整諮詢代理。
- 如果 `realtime.provider` 指向未註冊的供應商，或完全沒有註冊即時語音供應商，Voice Call 會記錄警告並略過即時媒體，而不是讓整個 Plugin 失敗。
- 諮詢工作階段鍵會在可用時重用已儲存的通話工作階段，然後後援到設定的 `sessionScope`（預設為 `per-phone`，隔離通話則為 `per-call`）。

### 工具政策

`realtime.toolPolicy` 會控制諮詢執行：

| 政策             | 行為                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露諮詢工具，並將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 暴露諮詢工具，並讓一般代理使用正常的代理工具政策。                                                                                       |
| `none`           | 不暴露諮詢工具。自訂 `realtime.tools` 仍會傳遞給即時供應商。                                                                              |

### 即時供應商範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API key 來自 `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型
    `gemini-2.5-flash-native-audio-preview-12-2025`；語音 `Kore`。
    對於較長且可重新連線的通話，`sessionResumption` 和 `contextWindowCompression` 預設開啟。
    使用 `silenceDurationMs`、`startSensitivity` 和
    `endSensitivity` 來調整電話音訊上的更快輪替對話。

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

請參閱 [Google 提供者](/zh-TW/providers/google)和
[OpenAI 提供者](/zh-TW/providers/openai)，了解提供者專屬的即時語音
選項。

## 串流轉錄

`streaming` 會為即時通話音訊選擇一個即時轉錄提供者。

目前執行階段行為：

- `streaming.provider` 是選用項目。若未設定，語音通話會使用第一個已註冊的即時轉錄提供者。
- 內建即時轉錄提供者：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由各自的提供者 Plugin 註冊。
- 提供者擁有的原始設定位於 `streaming.providers.<providerId>` 之下。
- Twilio 傳送已接受的串流 `start` 訊息後，語音通話會立即註冊串流，在提供者連線期間透過轉錄提供者佇列輸入媒體，並且只有在即時轉錄就緒後才開始初始問候語。
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

## 通話用 TTS

語音通話會使用核心 `messages.tts` 設定來進行通話中的串流
語音。你可以在 Plugin 設定下以**相同形狀**覆寫它，
它會與 `messages.tts` 進行深度合併。

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
**Microsoft 語音會在語音通話中被忽略。** 電話語音需要 PCM；
目前的 Microsoft 傳輸未公開電話用 PCM 輸出。
</Warning>

行為備註：

- Plugin 設定中的舊版 `tts.<provider>` 鍵（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會退回使用提供者原生語音。
- 如果 Twilio 媒體串流已經啟用，語音通話不會退回 TwiML `<Say>`。如果在該狀態下無法使用電話 TTS，播放要求會失敗，而不是混用兩條播放路徑。
- 當電話 TTS 退回次要提供者時，語音通話會記錄包含提供者鏈 (`from`, `to`, `attempts`) 的警告，以供除錯。
- 當 Twilio 插話或串流拆除清除待處理 TTS 佇列時，已佇列的播放要求會完成結算，而不是讓來電者一直等待播放完成。

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
`inboundPolicy: "allowlist"` 是低保證度的來電顯示篩選。此
Plugin 會正規化提供者提供的 `From` 值，並將其與
`allowFrom` 比較。Webhook 驗證會驗證提供者傳遞與
承載完整性，但**不會**證明 PSTN/VoIP 來電號碼
所有權。請將 `allowFrom` 視為來電顯示篩選，而不是強式來電者
身分。
</Warning>

自動回應使用代理系統。可透過 `responseModel`、
`responseSystemPrompt` 和 `responseTimeoutMs` 調整。

### 依號碼路由

當一個語音通話 Plugin 接收多個電話號碼的來電，且每個號碼都應像不同線路一樣運作時，請使用 `numbers`。例如，一個
號碼可以使用輕鬆的個人助理，而另一個號碼則使用商務
人格、不同的回應代理，以及不同的 TTS 聲音。

路由會從提供者提供的已撥 `To` 號碼中選取。鍵必須是
E.164 號碼。來電抵達時，語音通話會解析相符路由一次，
將相符路由儲存在通話記錄上，並將該有效設定
重用於問候語、傳統自動回應路徑、即時諮詢路徑和 TTS
播放。若沒有相符路由，則使用全域語音通話設定。
撥出通話不使用 `numbers`；發起通話時請明確傳入撥出目標、訊息和
工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值會深度合併到全域語音通話 `tts` 設定上，因此
你通常只需要覆寫提供者聲音：

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

語音通話會以防禦方式擷取語音文字：

- 忽略標記為推理/錯誤內容的承載。
- 解析直接 JSON、圍欄 JSON，或內嵌 `"spoken"` 鍵。
- 退回純文字，並移除可能的規劃/中繼前導段落。

這會讓語音播放專注於面向來電者的文字，並避免
將規劃文字洩漏到音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，第一則訊息處理會綁定至即時
播放狀態：

- 插話佇列清除與自動回應只會在初始問候語正在主動播放時被抑制。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會保留在佇列中以供重試。
- Twilio 串流的初始播放會在串流連線時開始，不會有額外延遲。
- 插話會中止作用中播放，並清除已佇列但尚未播放的 Twilio TTS 項目。已清除項目會解析為已略過，因此後續回應邏輯可以繼續，而不必等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流自己的開場回合。語音通話**不會**針對該初始訊息發布舊版 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會保持附加。

### Twilio 串流中斷寬限

當 Twilio 媒體串流中斷連線時，語音通話會等待 **2000 ms** 後才
自動結束通話：

- 如果串流在該時間窗內重新連線，會取消自動結束。
- 如果寬限期後沒有串流重新註冊，通話會結束，以防止卡住的作用中通話。

## 過期通話清理器

使用 `staleCallReaperSeconds` 來結束從未收到終止
Webhook 的通話（例如永遠不會完成的通知模式通話）。預設值
為 `0`（停用）。

建議範圍：

- **正式環境：** 對於通知式流程，使用 `120`–`300` 秒。
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

## Webhook 安全性

當 Proxy 或通道位於 Gateway 前方時，此 Plugin
會重建公開 URL 以進行簽章驗證。這些選項
控制哪些轉送標頭受信任：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許來自轉送標頭的主機清單。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在沒有允許清單的情況下信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  只有在要求的遠端 IP 符合清單時才信任轉送標頭。
</ParamField>

其他保護：

- Twilio 和 Plivo 已啟用 Webhook **重放保護**。重放的有效 Webhook 要求會被確認，但會略過副作用。
- Twilio 對話回合會在 `<Gather>` 回呼中包含每回合 Token，因此過期/重放的語音回呼無法滿足較新的待處理轉錄回合。
- 未驗證的 Webhook 要求會在讀取本文前被拒絕，條件是缺少提供者必要的簽章標頭。
- voice-call Webhook 使用共用的預先驗證本文設定檔（64 KB / 5 秒），並在簽章驗證前加上每 IP 進行中上限。

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

當 Gateway 已在執行時，操作用的 `voicecall` 命令會委派給 Gateway 擁有的語音通話執行階段，因此 CLI 不會綁定第二個 Webhook 伺服器。如果無法連上 Gateway，命令會回退到獨立的 CLI 執行階段。

`latency` 會從預設語音通話儲存路徑讀取 `calls.jsonl`。
使用 `--file <path>` 指向不同的記錄檔，並使用 `--last <n>` 將分析限制在最後 N 筆記錄（預設 200）。輸出包含回合延遲與聆聽等待時間的 p50/p90/p99。

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

`dtmfSequence` 只在搭配 `mode: "conversation"` 時有效。通知模式通話如果需要連線後數字，應該在通話建立後使用 `voicecall.dtmf`。

## 疑難排解

### 設定無法公開 Webhook

請從執行 Gateway 的同一個環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。已設定的 `publicUrl` 如果指向本機或私人網路空間仍會失敗，因為電信業者無法回呼到這些位址。請勿使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

Twilio 通知模式外撥通話會在建立通話請求中直接傳送初始 `<Say>` TwiML，因此第一則語音訊息不依賴 Twilio 擷取 Webhook TwiML。狀態回呼、對話通話、連線前 DTMF、即時串流和連線後通話控制仍然需要公開 Webhook。

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

除非傳入 `--yes`，否則 `voicecall smoke` 是試執行。

### Provider 認證失敗

檢查所選 Provider 和必要的認證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和
  `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

認證必須存在於 Gateway 主機上。編輯本機 shell 設定檔不會影響已在執行的 Gateway，直到它重新啟動或重新載入其環境為止。

### 通話已開始，但 Provider Webhook 未抵達

確認 Provider 主控台指向精確的公開 Webhook URL：

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
- Gateway 啟動後通道 URL 已變更。
- Proxy 轉送請求，但移除或重寫 host/proto 標頭。
- 防火牆或 DNS 將公開主機名稱路由到 Gateway 以外的位置。
- Gateway 在未啟用 Voice Call Plugin 的情況下重新啟動。

當反向 Proxy 或通道位於 Gateway 前方時，請將 `webhookSecurity.allowedHosts` 設為公開主機名稱，或對已知 Proxy 位址使用 `webhookSecurity.trustedProxyIPs`。只有在 Proxy 邊界由你控制時，才使用 `webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

Provider 簽章會根據 OpenClaw 從傳入請求重建的公開 URL 進行檢查。如果簽章失敗：

- 確認 Provider Webhook URL 與 `publicUrl` 完全相符，包括 scheme、host 和 path。
- 對於 ngrok 免費層 URL，請在通道主機名稱變更時更新 `publicUrl`。
- 確保 Proxy 保留原始 host 和 proto 標頭，或設定 `webhookSecurity.allowedHosts`。
- 不要在本機測試之外啟用 `skipSignatureVerification`。

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

如果 Voice Call 顯示正常但 Meet 參與者從未加入，請檢查 Meet 撥入號碼、PIN 和 `--dtmf-sequence`。電話通話可能正常，但會議可能因不正確的 DTMF 序列而拒絕或忽略。

Google Meet 會將 Meet DTMF 序列和介紹文字傳給 `voicecall.start`。對於 Twilio 通話，Voice Call 會先提供 DTMF TwiML，重新導向回 Webhook，然後開啟即時媒體串流，因此儲存的介紹會在電話參與者加入會議後產生。

使用 `openclaw logs --follow` 查看即時階段追蹤。健康的 Twilio Meet 加入會依序記錄：

- Google Meet 將 Twilio 加入委派給 Voice Call。
- Voice Call 儲存連線前 DTMF TwiML。
- Twilio 初始 TwiML 會在即時處理前被取用並提供。
- Voice Call 為 Twilio 通話提供即時 TwiML。
- 即時橋接會在初始問候排入佇列後啟動。

`openclaw voicecall tail` 仍會顯示已持久化的通話記錄；它適合用於通話狀態與逐字稿，但並非每個 Webhook/即時轉換都會出現在其中。

### 即時通話沒有語音

確認只啟用一種音訊模式。`realtime.enabled` 和 `streaming.enabled` 不能同時為 true。

對於即時 Twilio 通話，也請驗證：

- 已載入並註冊即時 Provider Plugin。
- `realtime.provider` 未設定，或命名了一個已註冊的 Provider。
- Provider API 金鑰可供 Gateway 程序使用。
- `openclaw logs --follow` 顯示已提供即時 TwiML、即時橋接已啟動，且初始問候已排入佇列。

## 相關

- [通話模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

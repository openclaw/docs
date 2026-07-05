---
read_when:
    - 您想要從 OpenClaw 撥出語音通話
    - 你正在設定或開發語音通話外掛
    - 你需要電話語音上的即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥出並接聽語音通話，可選用即時語音與串流轉錄功能
title: 語音通話外掛
x-i18n:
    generated_at: "2026-07-05T11:34:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6691a5764bd537a3782a2236e3f5744d411576c0f864b20a01f12096d8f7068
    source_path: plugins/voice-call.md
    workflow: 16
---

透過外掛為 OpenClaw 提供語音通話：撥出通知、多輪
對話、全雙工即時語音、串流轉錄，以及
具允許清單政策的來電。

**提供者：** `mock`（開發用，無網路）、`plivo`（Voice API + XML transfer +
GetInput speech）、`telnyx`（Call Control v2）、`twilio`（Programmable Voice +
Media Streams）。

<Note>
Voice Call 外掛會在 **閘道程序內** 執行。如果你使用
遠端閘道，請在執行閘道的機器上安裝並設定此外掛，
然後重新啟動閘道以載入它。
</Note>

## 快速開始

<Steps>
  <Step title="安裝外掛">
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

    使用裸套件名稱以跟隨目前的發行標籤。只有在需要可重現的安裝時，
    才釘選精確版本。之後請重新啟動閘道，
    讓外掛載入。

  </Step>
  <Step title="設定提供者與網路鉤子">
    在 `plugins.entries.voice-call.config` 底下設定組態（見下方
    [設定](#configuration)）。最低需求：`provider`、提供者
    認證、`fromNumber`，以及可公開連線的網路鉤子 URL。
  </Step>
  <Step title="驗證設定">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    檢查外掛是否啟用、提供者認證、網路鉤子曝光，以及
    是否只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。

  </Step>
  <Step title="煙霧測試">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都是試跑。加入 `--yes` 以撥打一通簡短的撥出
    通知電話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對於 Twilio、Telnyx 和 Plivo，設定必須解析為 **公開網路鉤子 URL**。
如果 `publicUrl`、通道 URL、Tailscale URL，或 serve 備援
解析到 loopback 或私有網路空間，設定會失敗，而不是
啟動一個無法接收電信商網路鉤子的提供者。
</Warning>

## 設定

如果 `enabled: true` 但所選提供者缺少認證，閘道
啟動時會記錄一則設定未完成警告，列出缺少的鍵，並略過
啟動執行階段。命令、RPC 呼叫和代理工具在使用時仍會回傳
精確缺少的設定。

<Note>
Voice-call 認證接受 SecretRefs。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 會透過標準 SecretRef 介面解析；請參閱 [SecretRef 認證介面](/zh-TW/reference/secretref-credential-surface)。
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
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### 設定參考

上方未顯示的 `plugins.entries.voice-call.config` 頂層鍵：

| 鍵                              | 預設值       | 備註                                                                                   |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 總開關。                                                                               |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。請參閱[來電](#inbound-calls)。       |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"` 的 E.164 允許清單。                                      |
| `maxDurationSeconds`            | `300`        | 每通電話的硬性通話時長上限，無論是否已接聽都會強制執行。                             |
| `staleCallReaperSeconds`        | `120`        | 請參閱[過期通話清理器](#stale-call-reaper)。`0` 會停用它。                            |
| `silenceTimeoutMs`              | `800`        | 傳統（非即時）流程的語音結束靜音偵測。                                               |
| `transcriptTimeoutMs`           | `180000`     | 放棄某一輪之前，等待來電者轉錄文字的最長時間。                                       |
| `ringTimeoutMs`                 | `30000`      | 撥出電話的響鈴逾時。                                                                 |
| `maxConcurrentCalls`            | `1`          | 超過此限制的撥出電話會被拒絕。                                                       |
| `outbound.notifyHangupDelaySec` | `3`          | 通知模式中，TTS 之後自動掛斷前等待的秒數。                                           |
| `skipSignatureVerification`     | `false`      | 僅限本機測試；切勿在正式環境啟用。                                                   |
| `store`                         | unset        | 覆寫預設的 `~/.openclaw/voice-calls` 通話記錄路徑。                                  |
| `agentId`                       | `"main"`     | 用於回應產生和工作階段儲存的代理。                                                   |
| `responseModel`                 | unset        | 覆寫傳統（非即時）回應的預設模型。                                                   |
| `responseSystemPrompt`          | generated    | 傳統回應的自訂系統提示。                                                             |
| `responseTimeoutMs`             | `30000`      | 傳統回應產生的逾時時間（毫秒）。                                                     |

<AccordionGroup>
  <Accordion title="提供者曝光與安全注意事項">
    - Twilio、Telnyx 和 Plivo 都需要 **可公開連線** 的網路鉤子 URL。
    - `mock` 是本機開發提供者（不進行網路呼叫）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 為 true。
    - `skipSignatureVerification` 僅供本機測試使用。
    - 在 ngrok 免費方案上，請將 `publicUrl` 設為精確的 ngrok URL；簽章驗證一律會強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 只有在 `tunnel.provider="ngrok"` 且 `serve.bind` 為 loopback（ngrok 本機代理程式）時，才允許簽章無效的 Twilio 網路鉤子。本機開發專用。
    - Ngrok 免費方案 URL 可能會變更或加入插頁行為；如果 `publicUrl` 偏移，Twilio 簽章會失敗。正式環境：建議使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="串流連線上限">
    - `streaming.preStartTimeoutMs`（預設 `5000`）會關閉從未傳送有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections`（預設 `32`）會限制未驗證的預啟動 socket 總數。
    - `streaming.maxPendingConnectionsPerIp`（預設 `4`）會限制每個來源 IP 的未驗證預啟動 socket 數量。
    - `streaming.maxConnections`（預設 `128`）會限制所有開啟的媒體串流 socket（待處理 + 作用中）。

  </Accordion>
  <Accordion title="舊版設定遷移">
    設定剖析會自動正規化這些舊版鍵，並記錄
    指出替代路徑的警告；此 shim 會在未來
    版本（`2026.6.0`）移除，因此請執行 `openclaw doctor --fix`，將已提交的
    設定改寫為標準形狀：

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` 已移除（即時內容現在使用產生的代理提示）

  </Accordion>
</AccordionGroup>

## 工作階段範圍

預設情況下，Voice Call 使用 `sessionScope: "per-phone"`，因此來自
同一位來電者的重複來電會保留對話記憶。當
每通電信商通話都應以全新內容開始時，請設定 `sessionScope: "per-call"`，
例如接待、訂位、IVR，或 Google Meet 橋接流程，其中相同電話號碼可能
代表不同會議。

Voice Call 會將產生的工作階段鍵儲存在設定的代理命名空間下
（`agent:<agentId>:voice:*`）。原始明確整合鍵會解析到
相同命名空間：標準的 `agent:<configuredAgentId>:*` 鍵會保留該
擁有者，並遵循核心 `session.mainKey`/全域範圍別名；外來或
格式錯誤的 `agent:*` 輸入會以不透明鍵的形式限定在設定的
代理底下；`global` 和 `unknown` 仍為全域哨兵值。

## 即時語音對話

`realtime` 會為即時通話音訊選擇全雙工即時語音提供者。
它與 `streaming` 分開，後者只會將音訊轉送給即時
轉錄提供者。

<Warning>
`realtime.enabled` 不能與 `streaming.enabled` 合併使用。每通電話請選擇一種
音訊模式。
</Warning>

目前的執行階段行為：

- Twilio 和 Telnyx 支援 `realtime.enabled`。
- `realtime.provider` 是選用設定。若未設定，語音通話會使用第一個已註冊的即時語音提供者。
- 內建即時語音提供者：Google Gemini Live (`google`) 和 OpenAI (`openai`)，由其提供者外掛註冊。
- 提供者擁有的原始設定位於 `realtime.providers.<providerId>` 下。
- 語音通話預設公開共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入的推理、即時資訊或一般 OpenClaw 工具時，即時模型可以呼叫它。
- `realtime.consultPolicy` 可選擇性加入指引，說明即時模型應在何時呼叫 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 預設關閉。啟用後，語音通話會在工作階段設定時，將有界的代理身分和選取的工作區檔案膠囊注入即時提供者指令。
- `realtime.fastContext.enabled` 預設關閉。啟用後，語音通話會先在已索引的記憶/工作階段內容中搜尋諮詢問題，並在 `realtime.fastContext.timeoutMs` 內將這些片段傳回即時模型；只有在 `realtime.fastContext.fallbackToConsult` 為 true 時，才會後援到完整諮詢代理。
- 如果 `realtime.provider` 指向未註冊的提供者，或完全沒有註冊任何即時語音提供者，語音通話會記錄警告並略過即時媒體，而不是讓整個外掛失敗。
- 當 `realtime.enabled` 為 true 時，`inboundPolicy` 不得為 `"disabled"`；`validateProviderConfig` 會拒絕這個組合。
- 諮詢工作階段金鑰會在可用時重用已儲存的通話工作階段，然後後援到已設定的 `sessionScope`（預設為 `per-phone`，隔離通話則為 `per-call`）。

### 工具政策

`realtime.toolPolicy` 控制諮詢執行：

| 政策             | 行為                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公開諮詢工具，並將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 公開諮詢工具，並讓一般代理使用一般代理工具政策。                                                      |
| `none`           | 不公開諮詢工具。自訂 `realtime.tools` 仍會傳遞給即時提供者。                               |

`realtime.consultPolicy` 只控制即時模型指令：

| 政策          | 指引                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 保留預設提示，並讓提供者決定何時呼叫諮詢工具。              |
| `substantive` | 直接回答簡單的對話銜接內容，並在事實、記憶、工具或內容之前先諮詢。 |
| `always`      | 在每個實質回答之前先諮詢。                                                        |

### 代理語音內容

當語音橋接應聽起來像已設定的 OpenClaw 代理，但又不想在一般輪次支付完整代理諮詢往返成本時，請啟用 `realtime.agentContext`。內容膠囊會在建立即時工作階段時加入一次，因此不會增加每輪延遲。對 `openclaw_agent_consult` 的呼叫仍會執行完整 OpenClaw 代理，並應用於工具工作、即時資訊、記憶查詢或工作區狀態。

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

### 即時提供者範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API 金鑰來自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`；模型 `gemini-2.5-flash-native-audio-preview-12-2025`；語音 `Kore`。`sessionResumption` 和 `contextWindowCompression` 預設開啟，適合較長且可重新連線的通話。使用 `silenceDurationMs`、`startSensitivity` 和 `endSensitivity` 來調整電話語音中的更快速輪替發話。

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

如需提供者專屬的即時語音選項，請參閱 [Google 提供者](/zh-TW/providers/google) 和 [OpenAI 提供者](/zh-TW/providers/openai)。

## 串流轉錄

`streaming` 會為即時通話音訊選取即時轉錄提供者。

目前執行階段行為：

- `streaming.provider` 是選用設定。若未設定，語音通話會使用第一個已註冊的即時轉錄提供者。
- 內建即時轉錄提供者：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由其提供者外掛註冊。
- 提供者擁有的原始設定位於 `streaming.providers.<providerId>` 下。
- Twilio 傳送已接受的串流 `start` 訊息後，語音通話會立即註冊串流，在提供者連線時透過轉錄提供者佇列化傳入媒體，並且只有在即時轉錄就緒後才開始初始問候。
- 如果 `streaming.provider` 指向未註冊的提供者，或沒有註冊任何提供者，語音通話會記錄警告並略過媒體串流，而不是讓整個外掛失敗。

### 串流提供者範例

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
    預設值：API 金鑰 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`（若兩者皆未設定，會後援到 xAI OAuth 驗證設定檔）；端點 `wss://api.x.ai/v1/stt`；編碼 `mulaw`；取樣率 `8000`；`endpointingMs: 800`；`interimResults: true`。

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
**Microsoft speech 會在語音通話中被忽略。** 電話語音合成需要實作電話目標輸出的提供者；Microsoft speech 提供者沒有實作，因此會在通話中略過它，改為嘗試後援鏈中的其他提供者。
</Warning>

行為備註：

- 外掛設定中的舊版 `tts.<provider>` 金鑰（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；已提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會後援到提供者原生語音。
- 如果 Twilio 媒體串流已啟用，語音通話不會後援到 TwiML `<Say>`。如果在該狀態下無法使用電話 TTS，播放請求會失敗，而不是混用兩條播放路徑。
- 當電話 TTS 後援到次要提供者時，語音通話會記錄包含提供者鏈（`from`、`to`、`attempts`）的警告，以便偵錯。
- 當 Twilio 插話或串流拆除清除待處理 TTS 佇列時，已佇列的播放請求會完成結算，而不是讓等待播放完成的來電者卡住。

### TTS 範例

<Tabs>
  <Tab title="Core TTS only">
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
`inboundPolicy: "allowlist"` 是低保證程度的來電者 ID 篩選。外掛會正規化提供者提供的 `From` 值，並將其與 `allowFrom` 比較。網路鉤子驗證會驗證提供者投遞與酬載完整性，但它**不會**證明 PSTN/VoIP 來電號碼的所有權。請將 `allowFrom` 視為來電者 ID 過濾，而不是強式來電者身分。
</Warning>

自動回應使用代理系統。請用 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 調整。

### 依號碼路由

當一個 Voice Call 外掛接收多個電話號碼的來電，且每個號碼都應像不同線路一樣運作時，請使用 `numbers`。例如，一個號碼可以使用輕鬆的個人助理，而另一個號碼使用商務 persona、不同的回應代理，以及不同的 TTS 語音。

路由會根據提供者提供的已撥 `To` 號碼選取。鍵必須是 E.164 號碼。來電抵達時，Voice Call 會解析一次相符路由，將相符路由儲存在通話記錄上，並重複使用該有效設定於問候語、傳統自動回應路徑、即時諮詢路徑與 TTS 播放。如果沒有相符路由，則使用全域 Voice Call 設定。撥出通話不使用 `numbers`；起始通話時請明確傳入撥出目標、訊息和工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值會深度合併到全域 Voice Call `tts` 設定上，因此你通常只需要覆寫提供者語音：

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

針對自動回應，Voice Call 會在系統提示後附加嚴格的語音輸出合約，要求回覆 `{"spoken":"..."}` JSON。Voice Call 會防禦性地擷取語音文字：

- 忽略標記為推理/錯誤內容的酬載。
- 解析直接 JSON、圍欄 JSON，或行內 `"spoken"` 鍵。
- 回退為純文字，並移除疑似規劃/中繼說明的前導段落。

這會讓語音播放聚焦於面向來電者的文字，並避免將規劃文字洩漏到音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，第一則訊息處理會繫結到即時播放狀態：

- 只有在初始問候語正在主動播放時，插話佇列清除與自動回應才會被抑制。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會保持佇列狀態以便重試。
- Twilio 串流的初始播放會在串流連線時開始，不會有額外延遲。
- 插話會中止作用中播放，並清除已排隊但尚未播放的 Twilio TTS 項目。被清除的項目會解析為已略過，因此後續回應邏輯可以繼續，而不必等待永遠不會播放的音訊。
- 即時語音對話使用即時串流自己的開場回合。Voice Call **不會**為該初始訊息張貼舊式 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會保持附加。

### Twilio 串流中斷寬限

當 Twilio 媒體串流中斷連線時，Voice Call 會等待 **2000 ms** 後才自動結束通話：

- 如果串流在該時間窗內重新連線，自動結束會被取消。
- 如果寬限期後沒有串流重新註冊，通話會被結束，以防止卡住的作用中通話。

## 過期通話清理器

使用 `staleCallReaperSeconds`（預設 **120**）來結束從未接聽且從未到達即時對話狀態的通話，例如提供者從未投遞終止網路鉤子的通知模式通話。設為 `0` 可停用。

清理器每 30 秒執行一次，且只會結束沒有 `answeredAt` 時間戳記、且尚未處於終止或即時（`speaking`/`listening`）狀態的通話，因此已接聽的對話永遠不會被此計時器清理；`maxDurationSeconds`（預設 300）是另一個上限，用於結束執行太久的已接聽通話。

對於電信業者可能較慢投遞響鈴/接聽網路鉤子的通知式流程，請將 `staleCallReaperSeconds` 提高到超過預設值，避免緩慢但正常的通話過早被清理；`120`-`300` 秒是合理的正式環境範圍。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## 網路鉤子安全性

當代理或通道位於閘道前方時，外掛會重建公開 URL 以進行簽章驗證。這些選項控制哪些轉送標頭受信任：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  來自轉送標頭的主機允許清單。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在沒有允許清單的情況下信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  只有在請求遠端 IP 符合清單時才信任轉送標頭。
</ParamField>

額外保護：

- Twilio、Telnyx 和 Plivo 會啟用網路鉤子**重放保護**。重放的有效網路鉤子請求會被確認，但會略過副作用。
- Twilio 對話回合會在 `<Gather>` 回呼中包含每回合權杖，因此過期/重放的語音回呼無法滿足較新的待處理逐字稿回合。
- 當缺少提供者必要的簽章標頭時，未驗證的網路鉤子請求會在讀取本文前遭拒。
- voice-call 網路鉤子會使用共享的預驗證本文讀取設定檔（本文最大 64 KB、5 秒讀取逾時），並在簽章驗證前套用每鍵進行中上限（預設每個鍵 8 個並行請求）。

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

當閘道已在執行時，操作性的 `voicecall` 命令會委派給閘道擁有的 voice-call 執行階段，因此命令列介面不會綁定第二個網路鉤子伺服器。如果無法連到閘道，命令會回退到獨立命令列介面執行階段。

`latency` 會從預設 voice-call 儲存路徑讀取 `calls.jsonl`。使用 `--file <path>` 指向不同記錄，並使用 `--last <n>` 將分析限制在最後 N 筆記錄（預設 200）。輸出包含回合延遲與聆聽等待時間的 min/max/avg、p50 和 p95。

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

| 方法                        | 引數                                                             | 備註                                                                      |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | 當省略 `to` 時，回退為 `toNumber` 設定。                                  |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | 與 `initiate` 相同，但也接受連線前 `dtmfSequence`。                       |
| `voicecall.continue`        | `callId`, `message`                                              | 封鎖直到回合解析；回傳逐字稿。                                            |
| `voicecall.continue.start`  | `callId`, `message`                                              | 非同步變體：立即回傳 `operationId`。                                      |
| `voicecall.continue.result` | `operationId`                                                    | 輪詢待處理的 `voicecall.continue.start` 操作以取得結果。                  |
| `voicecall.speak`           | `callId`, `message`                                              | 不等待即發話；當 `realtime.enabled` 時使用即時橋接。                     |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | 省略 `callId` 可列出所有作用中通話。                                      |

`dtmfSequence` 只在 `mode: "conversation"` 時有效；通知模式通話若需要連線後數字，應在通話存在後使用 `voicecall.dtmf`。

## 疑難排解

### 設定無法暴露網路鉤子

請從執行閘道的相同環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。設定的 `publicUrl` 指向本機或私人網路空間時仍會失敗，因為電信業者無法回呼到那些位址。請勿將 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` 或其他電信業者級 NAT 範圍用作 `publicUrl`。

Twilio 通知模式撥出通話會在建立通話請求中直接傳送初始 `<Say>` TwiML，因此第一段語音訊息不依賴 Twilio 擷取網路鉤子 TwiML。狀態回呼、對話通話、連線前 DTMF、即時串流，以及連線後通話控制仍需要公開網路鉤子。

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

除非你傳入 `--yes`，否則 `voicecall smoke` 是試執行。

### 提供者憑證失敗

檢查選取的提供者與必要的憑證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 與 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 與 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 與
  `fromNumber`，或 `TELNYX_API_KEY`、`TELNYX_CONNECTION_ID` 與
  `TELNYX_PUBLIC_KEY`。
- Plivo：`plivo.authId`、`plivo.authToken` 與 `fromNumber`，或
  `PLIVO_AUTH_ID` 與 `PLIVO_AUTH_TOKEN`。

認證資料必須存在於閘道主機上。編輯本機 shell 設定檔
不會影響已在執行中的閘道，直到它重新啟動或重新載入其
環境。

### 通話開始但供應商網路鉤子未送達

確認供應商主控台指向確切的公開網路鉤子 URL：

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
- 閘道啟動後，通道 URL 已變更。
- 代理轉送了請求，但移除或重寫了 host/proto 標頭。
- 防火牆或 DNS 將公開主機名稱路由到閘道以外的位置。
- 閘道重新啟動時未啟用語音通話外掛。

當反向代理或通道位於閘道前方時，請將
`webhookSecurity.allowedHosts` 設為公開主機名稱，或針對已知代理位址使用
`webhookSecurity.trustedProxyIPs`。只有在代理邊界
受你控制時，才使用 `webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

供應商簽章會依據 OpenClaw 從傳入請求重建的公開 URL 進行檢查。
如果簽章失敗：

- 確認供應商網路鉤子 URL 與 `publicUrl` 完全相符，包括 scheme、host 與 path。
- 對於 ngrok 免費方案 URL，當通道主機名稱變更時更新 `publicUrl`。
- 確保代理保留原始 host 與 proto 標頭，或設定 `webhookSecurity.allowedHosts`。
- 不要在本機測試以外啟用 `skipSignatureVerification`。

### Google Meet Twilio 加入失敗

Google Meet 會使用此外掛進行 Twilio 撥入加入。請先驗證語音
通話：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

接著明確驗證 Google Meet 傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

如果語音通話正常但 Meet 參與者從未加入，請檢查 Meet
撥入號碼、PIN 與 `--dtmf-sequence`。電話通話可能是正常的，
但會議可能會拒絕或忽略不正確的 DTMF 序列。

Google Meet 會透過 `voicecall.start` 啟動 Twilio 電話通話端，
並使用預先連線 DTMF 序列。由 PIN 衍生的序列包含 Google Meet
外掛的 `voiceCall.dtmfDelayMs`（預設 **12000 ms**）作為前置 Twilio
等待數字，因為 Meet 撥入提示可能會較晚出現。接著語音通話會
在要求開場問候之前重新導向回即時處理。

使用 `openclaw logs --follow` 查看即時階段追蹤。正常的 Twilio Meet
加入會依此順序記錄：

- Google Meet 將 Twilio 加入委派給語音通話。
- 語音通話儲存預先連線 DTMF TwiML。
- Twilio 初始 TwiML 會在即時處理之前被取用並提供。
- 語音通話為 Twilio 通話提供即時 TwiML。
- Google Meet 在 DTMF 後延遲之後，使用 `voicecall.speak` 要求開場語音。

`openclaw voicecall tail` 仍會顯示已持久化的通話記錄；這對
通話狀態與逐字稿很有用，但並非每個網路鉤子/即時轉換
都會出現在那裡。

### 即時通話沒有語音

確認只啟用一種音訊模式：`realtime.enabled` 與
`streaming.enabled` 不能同時為 true。

對於即時 Twilio/Telnyx 通話，另請驗證：

- 已載入並註冊即時供應商外掛。
- `realtime.provider` 未設定，或命名了一個已註冊的供應商。
- 供應商 API 金鑰可供閘道程序使用。
- `openclaw logs --follow` 顯示已提供即時 TwiML、即時橋接已啟動，且初始問候已排入佇列。

## 相關

- [交談模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

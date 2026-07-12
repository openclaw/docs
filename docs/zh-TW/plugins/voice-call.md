---
read_when:
    - 你想要從 OpenClaw 撥出語音電話
    - 您正在設定或開發語音通話外掛
    - 你需要在電話通訊中使用即時語音或串流轉錄功能
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥出及接聽語音通話，並可選用即時語音與串流轉錄功能
title: 語音通話外掛
x-i18n:
    generated_at: "2026-07-11T21:39:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

透過外掛為 OpenClaw 提供語音通話功能：撥出通知、多輪
對話、全雙工即時語音、串流轉錄，以及
具有允許清單政策的來電。

**供應商：** `mock`（開發用，無網路）、`plivo`（Voice API + XML 轉接 +
GetInput 語音）、`telnyx`（Call Control v2）、`twilio`（Programmable Voice +
Media Streams）。

<Note>
語音通話外掛會在**閘道程序內部**執行。如果使用
遠端閘道，請在執行閘道的機器上安裝並設定此外掛，
然後重新啟動閘道以載入它。
</Note>

## 快速開始

<Steps>
  <Step title="安裝外掛">
    <Tabs>
      <Tab title="從 npm 安裝">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="從本機資料夾安裝（開發用）">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    使用不含版本的套件名稱，以跟隨目前的發行標籤。只有在需要可重現的
    安裝時，才固定使用確切版本。之後請重新啟動閘道，
    讓外掛載入。

  </Step>
  <Step title="設定供應商與網路鉤子">
    請在 `plugins.entries.voice-call.config` 下設定組態（請參閱下方的
    [組態](#configuration)）。至少需要：`provider`、供應商
    憑證、`fromNumber`，以及可從公網存取的網路鉤子 URL。
  </Step>
  <Step title="驗證設定">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    檢查外掛是否已啟用、供應商憑證、網路鉤子是否公開，
    以及僅啟用一種音訊模式（`streaming` 或 `realtime`）。

  </Step>
  <Step title="冒煙測試">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都只會試執行。加上 `--yes` 即可撥出簡短的
    通知電話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對 Twilio、Telnyx 與 Plivo 而言，設定最終必須解析為**公用網路鉤子 URL**。
如果 `publicUrl`、通道 URL、Tailscale URL 或服務備援
解析到 local loopback 或私有網路空間，設定會失敗，而不會
啟動無法接收電信商網路鉤子的供應商。
</Warning>

## 組態

如果 `enabled: true`，但所選供應商缺少憑證，閘道
啟動時會記錄設定未完成的警告及缺少的鍵，並略過
啟動執行階段。使用命令、RPC 呼叫與代理工具時，仍會傳回
確切缺少的組態。

<Note>
語音通話憑證接受 SecretRef。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 與 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 會透過標準 SecretRef 介面解析；請參閱 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 或 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // Twilio 也可使用 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards，請問需要什麼協助？",
              responseSystemPrompt: "你是一位回答精簡的棒球卡專家。",
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
            // region: "ie1", // 選用：us1 | ie1 | au1；預設為 us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 來自 Mission Control Portal 的 Telnyx 網路鉤子公開金鑰
            //（Base64；也可透過 TELNYX_PUBLIC_KEY 設定）。
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // 網路鉤子伺服器
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // 網路鉤子安全性（建議用於通道／Proxy）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公開存取方式（擇一）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* 請參閱串流轉錄 */ },
          realtime: { enabled: false /* 請參閱即時語音對話 */ },
        },
      },
    },
  },
}
```

### 組態參考

上方未列出的 `plugins.entries.voice-call.config` 頂層鍵：

| 鍵                              | 預設值       | 備註                                                                                   |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 主開關。                                                                               |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。請參閱[來電](#inbound-calls)。       |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"` 使用的 E.164 允許清單。                                   |
| `maxDurationSeconds`            | `300`        | 每通電話的硬性時間上限，無論是否已接聽都會強制執行。                                  |
| `staleCallReaperSeconds`        | `120`        | 請參閱[過時通話清理器](#stale-call-reaper)。`0` 會停用此功能。                        |
| `silenceTimeoutMs`              | `800`        | 傳統（非即時）流程用於偵測語音結束的靜音時間。                                        |
| `transcriptTimeoutMs`           | `180000`     | 在放棄該輪之前，等待來電者轉錄內容的最長時間。                                        |
| `ringTimeoutMs`                 | `30000`      | 撥出電話的響鈴逾時時間。                                                               |
| `maxConcurrentCalls`            | `1`          | 超過此限制的撥出電話會遭拒絕。                                                         |
| `outbound.notifyHangupDelaySec` | `3`          | 通知模式下，在 TTS 完成後等待多少秒再自動掛斷。                                       |
| `skipSignatureVerification`     | `false`      | 僅供本機測試；切勿在正式環境中啟用。                                                   |
| `store`                         | 未設定       | 覆寫預設的 `~/.openclaw/voice-calls` 通話記錄路徑。                                    |
| `agentId`                       | `"main"`     | 用於產生回應及儲存工作階段的代理。                                                     |
| `responseModel`                 | 未設定       | 覆寫傳統（非即時）回應的預設模型。                                                     |
| `responseSystemPrompt`          | 自動產生     | 傳統回應使用的自訂系統提示。                                                           |
| `responseTimeoutMs`             | `30000`      | 產生傳統回應的逾時時間（毫秒）。                                                       |

Twilio 預設使用其 US1 REST 端點。若要在支援的
非美國區域處理通話，請將 `twilio.region` 設為 `ie1` 或 `au1`，並使用
該區域的憑證。請參閱
[Twilio 的非美國 REST API 指南](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)。

<AccordionGroup>
  <Accordion title="供應商公開存取與安全性備註">
    - Twilio、Telnyx 與 Plivo 都需要**可從公網存取**的網路鉤子 URL。
    - `mock` 是本機開發用供應商（不進行網路呼叫）。
    - 除非 `skipSignatureVerification` 為 true，否則 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
    - `skipSignatureVerification` 僅供本機測試。
    - 使用 ngrok 免費方案時，請將 `publicUrl` 設為確切的 ngrok URL；簽章驗證一律強制執行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 僅在 `tunnel.provider="ngrok"` 且 `serve.bind` 為 local loopback（ngrok 本機代理程式）時，才允許簽章無效的 Twilio 網路鉤子。僅供本機開發。
    - Ngrok 免費方案 URL 可能變更或加入插頁行為；如果 `publicUrl` 發生偏移，Twilio 簽章會失敗。正式環境：建議使用穩定網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="串流連線上限">
    - `streaming.preStartTimeoutMs`（預設 `5000`）會關閉從未傳送有效 `start` frame 的 socket。
    - `streaming.maxPendingConnections`（預設 `32`）限制未驗證的啟動前 socket 總數。
    - `streaming.maxPendingConnectionsPerIp`（預設 `4`）限制每個來源 IP 未驗證的啟動前 socket 數量。
    - `streaming.maxConnections`（預設 `128`）限制所有開啟的媒體串流 socket（待處理 + 使用中）。

  </Accordion>
  <Accordion title="舊版組態遷移">
    組態剖析會自動正規化這些舊版鍵，並記錄
    指明替代路徑的警告；此相容層會在未來的
    版本（`2026.6.0`）移除，因此請執行 `openclaw doctor --fix`，將已提交的
    組態改寫為標準形態：

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

語音通話預設使用 `sessionScope: "per-phone"`，讓同一位來電者
重複來電時保留對話記憶。如果每次電信商通話都應使用全新內容，
請設定 `sessionScope: "per-call"`，例如接待、預約、IVR 或 Google Meet
橋接流程；在這些流程中，同一個電話號碼可能代表不同的會議。

語音通話會將產生的工作階段鍵儲存在所設定的代理命名空間下
（`agent:<agentId>:voice:*`）。明確指定的原始整合鍵會解析到
相同命名空間：標準的 `agent:<configuredAgentId>:*` 鍵會保留該
擁有者，並遵循核心 `session.mainKey`／全域範圍別名設定；外部或
格式錯誤的 `agent:*` 輸入會在所設定的代理下，作為不透明鍵限定範圍；
`global` 與 `unknown` 仍為全域哨兵值。

## 即時語音對話

`realtime` 會選取全雙工即時語音供應商來處理現場通話音訊。
它與 `streaming` 不同，後者只會將音訊轉送至即時
轉錄供應商。

<Warning>
`realtime.enabled` 無法與 `streaming.enabled` 同時使用。每通電話只能選擇一種
音訊模式。
</Warning>

目前的執行階段行為：

- Twilio 和 Telnyx 支援 `realtime.enabled`。
- `realtime.provider` 為選用設定。若未設定，語音通話會使用第一個已註冊的即時語音供應商。
- 內建的即時語音供應商：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的供應商外掛註冊。
- 供應商所擁有的原始設定位於 `realtime.providers.<providerId>`。
- 語音通話預設提供共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入的推理、最新資訊或一般 OpenClaw 工具時，即時模型可以呼叫此工具。
- `realtime.consultPolicy` 可選擇性新增指引，說明即時模型應在何時呼叫 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 預設關閉。啟用後，語音通話會在工作階段設定期間，將受限範圍的代理程式身分資訊及所選工作區檔案的內容摘要注入即時供應商的指示中。
- `realtime.fastContext.enabled` 預設關閉。啟用後，語音通話會先在已建立索引的記憶體／工作階段情境中搜尋諮詢問題，並在 `realtime.fastContext.timeoutMs` 內將這些片段傳回即時模型；只有當 `realtime.fastContext.fallbackToConsult` 為 true 時，才會退回使用完整的諮詢代理程式。
- 如果 `realtime.provider` 指向未註冊的供應商，或完全沒有註冊任何即時語音供應商，語音通話會記錄警告並略過即時媒體，而不會讓整個外掛失敗。
- 當 `realtime.enabled` 為 true 時，`inboundPolicy` 不得為 `"disabled"`；`validateProviderConfig` 會拒絕此組合。
- 若已有儲存的通話工作階段，諮詢工作階段金鑰會重複使用該工作階段；否則會退回使用已設定的 `sessionScope`（預設為 `per-phone`，隔離通話則使用 `per-call`）。

### 工具政策

`realtime.toolPolicy` 控制諮詢執行：

| 政策             | 行為                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 提供諮詢工具，並將一般代理程式限制為只能使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 提供諮詢工具，並允許一般代理程式使用正常的代理程式工具政策。                                                      |
| `none`           | 不提供諮詢工具。自訂的 `realtime.tools` 仍會傳遞給即時供應商。                               |

`realtime.consultPolicy` 僅控制即時模型的指示：

| 政策          | 指引                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 保留預設提示詞，並由供應商決定何時呼叫諮詢工具。              |
| `substantive` | 直接回答簡單的對話銜接內容；涉及事實、記憶、工具或情境前先進行諮詢。 |
| `always`      | 每次提供實質回答前都先進行諮詢。                                                        |

### 代理程式語音情境

若希望語音橋接器的表達方式符合已設定的 OpenClaw 代理程式，
又不希望一般對話回合承擔完整代理程式諮詢的往返成本，請啟用
`realtime.agentContext`。情境摘要只會在建立即時工作階段時加入一次，
因此不會增加每回合的延遲。對 `openclaw_agent_consult` 的呼叫仍會執行
完整的 OpenClaw 代理程式，應用於工具操作、最新資訊、記憶查詢或
工作區狀態。

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

### 即時供應商範例

<Tabs>
  <Tab title="Google Gemini Live">
    預設值：API 金鑰來自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY`
    或 `GOOGLE_API_KEY`；模型為 `gemini-3.1-flash-live-preview`；
    語音為 `Kore`。對於時間較長且可重新連線的通話，
    `sessionResumption` 和 `contextWindowCompression` 預設為開啟。
    使用 `silenceDurationMs`、`startSensitivity` 和 `endSensitivity`
    調整電話音訊的快速對話輪替。

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
                    model: "gemini-3.1-flash-live-preview",
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

如需供應商專屬的即時語音選項，請參閱 [Google 供應商](/zh-TW/providers/google)和
[OpenAI 供應商](/zh-TW/providers/openai)。

## 串流轉錄

`streaming` 為即時通話音訊選擇即時轉錄供應商。

目前的執行階段行為：

- `streaming.provider` 為選用設定。若未設定，語音通話會使用第一個已註冊的即時轉錄供應商。
- 內建的即時轉錄供應商：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由各自的供應商外掛註冊。
- 供應商所擁有的原始設定位於 `streaming.providers.<providerId>`。
- Twilio 傳送已接受的串流 `start` 訊息後，語音通話會立即註冊串流，在供應商連線期間透過轉錄供應商將傳入媒體排入佇列，並只在即時轉錄就緒後才開始初始問候語。
- 如果 `streaming.provider` 指向未註冊的供應商，或未註冊任何供應商，語音通話會記錄警告並略過媒體串流，而不會讓整個外掛失敗。

### 串流供應商範例

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
    預設值：API 金鑰為 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`
    （若兩者皆未設定，則退回使用 xAI OAuth 驗證設定檔）；端點為
    `wss://api.x.ai/v1/stt`；編碼為 `mulaw`；取樣率為 `8000`；
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

語音通話使用核心 `messages.tts` 設定，為通話提供串流語音。
你可以在外掛設定中使用**相同結構**覆寫此設定——它會與
`messages.tts` 進行深度合併。

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
**語音通話會忽略 Microsoft 語音。** 電話語音合成需要實作
電話目標輸出的供應商；Microsoft 語音供應商並未實作，因此通話時
會略過它，改為嘗試備援鏈中的其他供應商。
</Warning>

行為說明：

- 外掛設定內的舊版 `tts.<provider>` 金鑰（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會退回使用供應商原生語音。
- 如果 Twilio 媒體串流已在使用中，語音通話不會退回使用 TwiML `<Say>`。若在此狀態下無法使用電話 TTS，播放請求會失敗，而不會混用兩種播放路徑。
- 當電話 TTS 退回使用次要供應商時，語音通話會記錄包含供應商鏈（`from`、`to`、`attempts`）的警告，以供偵錯。
- 當 Twilio 插話或串流終止清除待處理的 TTS 佇列時，已排入佇列的播放請求會完成結算，而不會讓等待播放完成的呼叫端持續停滯。

### TTS 範例

<Tabs>
  <Tab title="僅使用核心 TTS">
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
  <Tab title="覆寫為 ElevenLabs（僅限通話）">
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
`inboundPolicy: "allowlist"` 是低保證度的來電顯示篩選機制。此外掛會將供應商提供的 `From` 值正規化，並與 `allowFrom` 比較。網路鉤子驗證可驗證供應商傳遞來源及酬載完整性，但**無法**證明 PSTN/VoIP 來電號碼的所有權。請將 `allowFrom` 視為來電顯示篩選，而非可靠的來電者身分驗證。
</Warning>

自動回應使用代理系統。可透過 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 進行調整。

### 依號碼路由

當一個 Voice Call 外掛接收多個電話號碼的來電，且每個號碼應如同不同線路般運作時，請使用 `numbers`。例如，一個號碼可以使用輕鬆風格的個人助理，另一個號碼則使用商務角色、不同的回應代理和不同的 TTS 語音。

路由會根據供應商提供的被撥 `To` 號碼選取。鍵必須是 E.164 號碼。來電時，Voice Call 會解析一次相符的路由，將相符路由儲存在通話記錄中，並將該有效設定重複用於問候語、傳統自動回應路徑、即時諮詢路徑和 TTS 播放。若沒有相符路由，則使用全域 Voice Call 設定。撥出電話不使用 `numbers`；發起通話時，請明確傳入撥出目標、訊息和工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

路由的 `tts` 值會深度合併至全域 Voice Call `tts` 設定之上，因此通常只需覆寫供應商語音：

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

### 語音輸出契約

對於自動回應，Voice Call 會在系統提示詞後附加嚴格的語音輸出契約，要求以 `{"spoken":"..."}` JSON 格式回覆。Voice Call 會以防禦性方式擷取語音文字：

- 忽略標記為推理或錯誤內容的酬載。
- 解析直接 JSON、圍欄式 JSON 或行內 `"spoken"` 鍵。
- 後援為純文字，並移除可能屬於規劃或中繼說明的開頭段落。

這能讓語音播放聚焦於提供給來電者的文字，並避免將規劃文字洩漏至音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，第一則訊息的處理會與即時播放狀態綁定：

- 僅在初始問候語正在播放時，才會抑制插話佇列清除和自動回應。
- 若初始播放失敗，通話會返回 `listening`，且初始訊息仍留在佇列中以供重試。
- Twilio 串流的初始播放會在串流連線時立即開始，不會額外延遲。
- 插話會中止目前播放，並清除已排入佇列但尚未播放的 Twilio TTS 項目。遭清除的項目會解析為已跳過，讓後續回應邏輯可繼續執行，而不必等待永遠不會播放的音訊。
- 即時語音對話使用即時串流本身的開場輪次。Voice Call **不會**針對該初始訊息發布舊式 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會維持連接。

### Twilio 串流中斷寬限期

Twilio 媒體串流中斷時，Voice Call 會等待 **2000 毫秒**後再自動結束通話：

- 若串流在該時段內重新連線，會取消自動結束。
- 若寬限期後沒有串流重新註冊，則結束通話，以防止通話持續卡在啟用狀態。

## 過時通話清理器

使用 `staleCallReaperSeconds`（預設為 **120**）結束從未接聽且從未進入即時對話狀態的通話，例如供應商從未傳遞終止網路鉤子的通知模式通話。設為 `0` 可停用。

清理器每 30 秒執行一次，且只會結束沒有 `answeredAt` 時間戳記、尚未處於終止或即時（`speaking`/`listening`）狀態的通話，因此已接聽的對話絕不會被此計時器清理；`maxDurationSeconds`（預設為 300）是另一項上限，用於結束持續過久的已接聽通話。

對於電信業者可能較慢才傳遞響鈴或接聽網路鉤子的通知型流程，請將 `staleCallReaperSeconds` 提高至預設值以上，以免過早清理速度較慢但仍屬正常的通話；在正式環境中，`120` 至 `300` 秒是合理的範圍。

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

當閘道前方有 Proxy 或通道時，此外掛會重建公用 URL 以進行簽章驗證。以下選項控制要信任哪些轉送標頭：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許來自轉送標頭的主機清單。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  無需允許清單即可信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  僅當請求的遠端 IP 與清單相符時，才信任轉送標頭。
</ParamField>

其他保護措施：

- Twilio、Telnyx 和 Plivo 已啟用網路鉤子**重播防護**。遭重播的有效網路鉤子請求會被確認接收，但會略過其副作用。
- Twilio 對話輪次會在 `<Gather>` 回呼中包含每輪權杖，因此過時或遭重播的語音回呼無法滿足較新的待處理逐字稿輪次。
- 當缺少供應商要求的簽章標頭時，未驗證的網路鉤子請求會在讀取本文前遭拒。
- voice-call 網路鉤子會使用共用的驗證前本文讀取設定檔（本文上限 64 KB、讀取逾時 5 秒），並在簽章驗證前套用每個鍵的進行中請求上限（預設每個鍵 8 個並行請求）。

使用穩定公用主機的範例：

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

當閘道已在執行時，操作型 `voicecall` 命令會委派給閘道擁有的 voice-call 執行階段，因此命令列介面不會繫結第二個網路鉤子伺服器。若無法連線至任何閘道，命令會後援至獨立的命令列介面執行階段。

`latency` 會從預設 voice-call 儲存路徑讀取 `calls.jsonl`。使用 `--file <path>` 指向不同的記錄檔，並使用 `--last <n>` 將分析限制為最後 N 筆記錄（預設為 200）。輸出包含輪次延遲和聆聽等待時間的最小值、最大值、平均值、p50 與 p95。

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

voice-call 外掛隨附相符的代理 Skills。

## 閘道 RPC

| 方法                        | 引數                                                             | 備註                                                                          |
| --------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | 省略 `to` 時，後援至 `toNumber` 設定。                                        |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | 與 `initiate` 相同，但也接受連線前的 `dtmfSequence`。                         |
| `voicecall.continue`        | `callId`, `message`                                              | 阻塞至輪次完成；傳回逐字稿。                                                  |
| `voicecall.continue.start`  | `callId`, `message`                                              | 非同步變體：立即傳回 `operationId`。                                          |
| `voicecall.continue.result` | `operationId`                                                    | 輪詢待處理的 `voicecall.continue.start` 操作以取得結果。                      |
| `voicecall.speak`           | `callId`, `message`                                              | 不等待即進行語音播放；當 `realtime.enabled` 時使用即時橋接。                  |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                               |
| `voicecall.end`             | `callId`                                                         |                                                                               |
| `voicecall.status`          | `callId?`                                                        | 省略 `callId` 可列出所有啟用中的通話。                                        |

`dtmfSequence` 僅適用於 `mode: "conversation"`；若通知模式通話需要在連線後傳送數字，應在通話建立後使用 `voicecall.dtmf`。

## 疑難排解

### 設定網路鉤子公開存取失敗

請從執行閘道的相同環境中執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。已設定的 `publicUrl` 若指向本機或私人網路空間，仍會失敗，因為電信業者無法回呼這些位址。請勿將 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` 或其他電信業者級 NAT 範圍用作 `publicUrl`。

Twilio 通知模式撥出通話會直接在建立通話請求中傳送初始 `<Say>` TwiML，因此第一則語音訊息不依賴 Twilio 擷取網路鉤子 TwiML。狀態回呼、對話通話、連線前 DTMF、即時串流和連線後通話控制仍需要公用網路鉤子。

請使用一種公用公開存取路徑：

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

變更設定後，請重新啟動或重新載入閘道，然後執行：

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

除非傳入 `--yes`，否則 `voicecall smoke` 只會進行模擬執行。

### 供應商憑證失敗

檢查所選供應商及必要的憑證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和
  `fromNumber`，或 `TELNYX_API_KEY`、`TELNYX_CONNECTION_ID` 和
  `TELNYX_PUBLIC_KEY`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`，或
  `PLIVO_AUTH_ID` 和 `PLIVO_AUTH_TOKEN`。

憑證必須存在於閘道主機上。在閘道重新啟動或重新載入其環境之前，編輯本機 shell 設定檔不會影響已在執行中的閘道。

### 通話已開始，但未收到供應商的網路鉤子

確認供應商控制台指向確切的公開網路鉤子 URL：

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

- `publicUrl` 指向的路徑與 `serve.path` 不同。
- 通道 URL 在閘道啟動後發生變更。
- Proxy 轉送了要求，但移除或改寫了主機／通訊協定標頭。
- 防火牆或 DNS 將公開主機名稱路由到閘道以外的位置。
- 閘道重新啟動時未啟用語音通話外掛。

當閘道前方有反向 Proxy 或通道時，請將
`webhookSecurity.allowedHosts` 設為公開主機名稱，或針對已知的 Proxy 位址使用
`webhookSecurity.trustedProxyIPs`。只有在 Proxy 邊界由您控制時，才使用
`webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

供應商簽章會根據 OpenClaw 從傳入要求重建的公開 URL 進行檢查。如果簽章驗證失敗：

- 確認供應商的網路鉤子 URL 與 `publicUrl` 完全相符，包括通訊協定、主機和路徑。
- 對於 ngrok 免費方案的 URL，請在通道主機名稱變更時更新 `publicUrl`。
- 確保 Proxy 保留原始主機和通訊協定標頭，或設定 `webhookSecurity.allowedHosts`。
- 請勿在本機測試以外的環境啟用 `skipSignatureVerification`。

### Google Meet 的 Twilio 加入失敗

Google Meet 使用此外掛進行 Twilio 撥入加入。首先驗證語音通話：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

接著明確驗證 Google Meet 傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

如果語音通話狀態正常，但 Meet 參與者始終未加入，請檢查 Meet 撥入號碼、PIN 和 `--dtmf-sequence`。即使電話通話狀態正常，會議仍可能因 DTMF 序列錯誤而拒絕或忽略該序列。

Google Meet 透過 `voicecall.start` 啟動 Twilio 電話連線，並使用連線前 DTMF 序列。由 PIN 衍生的序列會將 Google Meet 外掛的 `voiceCall.dtmfDelayMs`（預設為 **12000 毫秒**）作為前置的 Twilio 等待數字，因為 Meet 撥入提示可能較晚才出現。接著，語音通話會在要求播放開場問候語之前，重新導向回即時處理。

使用 `openclaw logs --follow` 查看即時階段追蹤。正常的 Twilio Meet 加入會依序記錄以下內容：

- Google Meet 將 Twilio 加入委派給語音通話。
- 語音通話儲存連線前 DTMF TwiML。
- 在即時處理之前，先取用並提供 Twilio 初始 TwiML。
- 語音通話為 Twilio 通話提供即時 TwiML。
- Google Meet 在 DTMF 後延遲結束後，使用 `voicecall.speak` 要求播放開場語音。

`openclaw voicecall tail` 仍會顯示已持久化的通話記錄；這對檢視通話狀態和逐字稿很有用，但並非每個網路鉤子／即時轉換都會顯示於其中。

### 即時通話沒有語音

確認只啟用一種音訊模式：`realtime.enabled` 和
`streaming.enabled` 不可同時為 true。

對於即時 Twilio／Telnyx 通話，也請驗證：

- 已載入並註冊即時供應商外掛。
- `realtime.provider` 未設定，或指定已註冊的供應商。
- 閘道程序可取得供應商 API 金鑰。
- `openclaw logs --follow` 顯示已提供即時 TwiML、即時橋接已啟動，且初始問候語已排入佇列。

## 相關內容

- [對話模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

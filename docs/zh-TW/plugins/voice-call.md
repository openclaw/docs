---
read_when:
    - 你想要從 OpenClaw 撥出語音電話
    - 你正在設定或開發語音通話外掛
    - 你需要在電話通訊中使用即時語音或串流轉錄功能
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥打外撥語音通話並接聽來電，並可選用即時語音和串流轉錄功能
title: 語音通話外掛
x-i18n:
    generated_at: "2026-07-14T14:04:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: d5cc3700f6d63f2bb1db2b3d0a5f9128c89719d06b48721c32db3d85353e423f
    source_path: plugins/voice-call.md
    workflow: 16
---

透過外掛為 OpenClaw 提供語音通話：外撥通知、多輪
對話、全雙工即時語音、串流轉錄，以及
具備允許清單原則的來電。

**供應商：** `mock`（開發用，無網路）、`plivo`（Voice API + XML 轉接 +
GetInput 語音）、`telnyx`（Call Control v2）、`twilio`（Programmable Voice +
Media Streams）。

<Note>
Voice Call 外掛在**閘道程序內部**執行。如果你使用
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

    使用未指定版本的套件以跟隨目前的發行標籤。只有在需要可重現的
    安裝時，才固定確切版本。之後請重新啟動閘道，
    以便載入外掛。

  </Step>
  <Step title="設定供應商與網路鉤子">
    在 `plugins.entries.voice-call.config` 下設定組態（請參閱下方的
    [組態](#configuration)）。至少需要：`provider`、供應商
    認證資訊、`fromNumber`，以及可從公網存取的網路鉤子 URL。
  </Step>
  <Step title="驗證設定">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    檢查外掛是否啟用、供應商認證資訊、網路鉤子是否對外公開，以及
    是否只有一種音訊模式（`streaming` 或 `realtime`）處於啟用狀態。

  </Step>
  <Step title="冒煙測試">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    兩者預設都只會試跑。加入 `--yes` 以撥出一通簡短的
    通知電話：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
對於 Twilio、Telnyx 和 Plivo，設定必須解析為**公開網路鉤子 URL**。
如果 `publicUrl`、通道 URL、Tailscale URL 或服務備援
解析為迴送位址或私人網路空間，設定會失敗，而不會
啟動無法接收電信業者網路鉤子的供應商。
</Warning>

## 組態

如果 `enabled: true`，但所選供應商缺少認證資訊，閘道
啟動時會記錄設定未完成的警告與缺少的金鑰，並略過
啟動執行階段。命令、RPC 呼叫及代理程式工具在使用時仍會傳回
確切缺少的組態。

<Note>
語音通話認證資訊接受 SecretRef。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 會透過標準 SecretRef 介面解析；請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。
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
            // Mission Control Portal 中的 Telnyx 網路鉤子公開金鑰
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

          streaming: { enabled: true /* 僅限 Twilio；請參閱「串流轉錄」 */ },
          realtime: { enabled: false /* 請參閱「即時語音對話」 */ },
        },
      },
    },
  },
}
```

### 組態參考

上方未列出的 `plugins.entries.voice-call.config` 頂層金鑰：

| 金鑰                             | 預設值      | 備註                                                                                  |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 總開關。                                                                  |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。請參閱[來電](#inbound-calls)。 |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"` 的 E.164 允許清單。                                      |
| `maxDurationSeconds`            | `300`        | 每通電話的強制通話時間上限，無論是否已接聽都會執行。                     |
| `staleCallReaperSeconds`        | `120`        | 請參閱[過期通話清理程式](#stale-call-reaper)。`0` 會停用它。                          |
| `silenceTimeoutMs`              | `800`        | 傳統（非即時）流程的語音結束靜音偵測。                   |
| `transcriptTimeoutMs`           | `180000`     | 放棄該輪對話前，等待來電者轉錄內容的最長時間。                           |
| `ringTimeoutMs`                 | `30000`      | 外撥電話的響鈴逾時。                                                       |
| `maxConcurrentCalls`            | `1`          | 超過此限制的外撥電話會遭到拒絕。                                         |
| `outbound.notifyHangupDelaySec` | `3`          | 通知模式下，TTS 結束後等待自動掛斷的秒數。                           |
| `skipSignatureVerification`     | `false`      | 僅供本機測試；切勿在正式環境中啟用。                                        |
| `store`                         | 未設定        | 覆寫預設的 `~/.openclaw/voice-calls` 通話記錄路徑。                         |
| `agentId`                       | `"main"`     | 用於產生回應與儲存工作階段的代理程式。                                |
| `responseModel`                 | 未設定        | 覆寫傳統（非即時）回應的預設模型。                      |
| `responseSystemPrompt`          | 已產生    | 傳統回應的自訂系統提示詞。                                            |
| `responseTimeoutMs`             | `30000`      | 傳統回應產生的逾時時間（毫秒）。                                          |

Twilio 預設使用其 US1 REST 端點。若要在支援的
非美國區域處理通話，請將 `twilio.region` 設為 `ie1` 或 `au1`，並使用
該區域的認證資訊。請參閱
[Twilio 的非美國 REST API 指南](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)。

<AccordionGroup>
  <Accordion title="供應商公開存取與安全性備註">
    - Twilio、Telnyx 和 Plivo 都需要**可從公網存取**的網路鉤子 URL。
    - `mock` 是本機開發供應商（不進行網路呼叫）。
    - 除非 `skipSignatureVerification` 為 true，否則 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
    - `skipSignatureVerification` 僅供本機測試。
    - 使用 ngrok 免費方案時，請將 `publicUrl` 設為確切的 ngrok URL；一律強制執行簽章驗證。
    - 只有當 `tunnel.provider="ngrok"` 且 `serve.bind` 為迴送位址（ngrok 本機代理程式）時，`tunnel.allowNgrokFreeTierLoopbackBypass: true` 才允許簽章無效的 Twilio 網路鉤子。僅供本機開發。
    - ngrok 免費方案的 URL 可能會變更或加入插頁行為；如果 `publicUrl` 發生偏移，Twilio 簽章驗證將失敗。正式環境：建議使用穩定的網域或 Tailscale funnel。

  </Accordion>
  <Accordion title="串流連線上限">
    - `streaming.preStartTimeoutMs`（預設為 `5000`）會關閉從未傳送有效 `start` 訊框的通訊端。
    - `streaming.maxPendingConnections`（預設為 `32`）限制所有未驗證身分且尚未開始的通訊端總數。
    - `streaming.maxPendingConnectionsPerIp`（預設為 `4`）限制每個來源 IP 未驗證身分且尚未開始的通訊端數量。
    - `streaming.maxConnections`（預設為 `128`）限制所有開啟的媒體串流通訊端（等待中 + 使用中）。

  </Accordion>
  <Accordion title="舊版組態遷移">
    組態剖析會自動正規化這些舊版金鑰，並記錄
    指出替代路徑的警告；此相容層將在未來的
    版本（`2026.6.0`）中移除，因此請執行 `openclaw doctor --fix`，將已提交的
    組態重寫為標準形態：

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` 已移除（即時內容現在使用產生的代理程式提示詞）

  </Accordion>
</AccordionGroup>

## 工作階段範圍

Voice Call 預設使用 `sessionScope: "per-phone"`，因此來自
同一來電者的重複通話會保留對話記憶。當
每通電信業者電話都應以全新內容開始時，請設定 `sessionScope: "per-call"`，例如接待、
預約、IVR 或 Google Meet 橋接流程，因為其中同一電話號碼可能
代表不同的會議。

Voice Call 會將產生的工作階段金鑰儲存在已設定的代理程式命名空間
（`agent:<agentId>:voice:*`）下。明確指定的原始整合金鑰會解析至
相同的命名空間：標準 `agent:<configuredAgentId>:*` 金鑰會保留該
擁有者，並遵循核心 `session.mainKey`/全域範圍別名；外部或
格式錯誤的 `agent:*` 輸入會在已設定的代理程式下，設為具有範圍的不透明金鑰；
`global` 和 `unknown` 仍為全域哨兵值。

## 即時語音對話

`realtime` 會選取全雙工即時語音供應商，以處理通話中的即時音訊。
它與 `streaming` 不同，後者只會將音訊轉送至即時
轉錄供應商。

<Warning>
`realtime.enabled` 無法與 `streaming.enabled` 搭配使用。每通
電話只能選擇一種音訊模式。
</Warning>

目前的執行階段行為：

- `realtime.enabled` 支援 Twilio 和 Telnyx。
- `realtime.provider` 為選用設定。若未設定，語音通話會使用第一個已註冊的即時語音提供者。
- 內建的即時語音提供者：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的提供者外掛註冊。
- 由提供者擁有的原始設定位於 `realtime.providers.<providerId>` 下。
- 語音通話預設提供共用的 `openclaw_agent_consult` 即時工具。當來電者要求更深入的推理、目前資訊或一般 OpenClaw 工具時，即時模型可以呼叫該工具。
- `realtime.consultPolicy` 可選擇性加入指引，說明即時模型應在何時呼叫 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 預設為關閉。啟用後，語音通話會在工作階段設定期間，將有界限的代理程式身分與所選工作區檔案摘要注入即時提供者的指示中。
- `realtime.fastContext.enabled` 預設為關閉。啟用後，語音通話會先在已建立索引的記憶體／工作階段情境中搜尋諮詢問題，並在 `realtime.fastContext.timeoutMs` 內將這些片段傳回即時模型；只有當 `realtime.fastContext.fallbackToConsult` 為 true 時，才會改用完整的諮詢代理程式。
- 如果 `realtime.provider` 指向未註冊的提供者，或完全沒有註冊任何即時語音提供者，語音通話會記錄警告並略過即時媒體，而不會讓整個外掛失敗。
- 當 `realtime.enabled` 為 true 時，`inboundPolicy` 不得為 `"disabled"`；`validateProviderConfig` 會拒絕此組合。
- 若有已儲存的通話工作階段，諮詢工作階段金鑰會優先重複使用該工作階段，否則改用已設定的 `sessionScope`（預設為 `per-phone`，隔離通話則為 `per-call`）。

### 工具原則

`realtime.toolPolicy` 控制諮詢執行：

| 原則           | 行為                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 提供諮詢工具，並將一般代理程式限制為只能使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 提供諮詢工具，並允許一般代理程式使用正常的代理程式工具原則。                                                      |
| `none`           | 不提供諮詢工具。自訂 `realtime.tools` 仍會傳遞給即時提供者。                               |

`realtime.consultPolicy` 僅控制即時模型的指示：

| 原則        | 指引                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 保留預設提示詞，並由提供者決定何時呼叫諮詢工具。              |
| `substantive` | 直接回答簡單的對話銜接內容；在回答事實、記憶、工具或情境相關內容前先進行諮詢。 |
| `always`      | 在每次實質回答前進行諮詢。                                                        |

### 代理程式語音情境

當語音橋接應呈現已設定 OpenClaw 代理程式的風格，而不希望每次一般對話都承擔完整代理程式諮詢的往返成本時，請啟用 `realtime.agentContext`。情境摘要只會在建立即時工作階段時加入一次，因此不會增加每輪對話的延遲。呼叫 `openclaw_agent_consult` 仍會執行完整的 OpenClaw 代理程式，應用於工具操作、目前資訊、記憶查詢或工作區狀態。

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
    預設值：API 金鑰來自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY`
    或 `GOOGLE_API_KEY`；模型為 `gemini-3.1-flash-live-preview`；
    語音為 `Kore`。`sessionResumption` 和 `contextWindowCompression` 預設開啟，
    適用於較長且可重新連線的通話。使用 `silenceDurationMs`、
    `startSensitivity` 和 `endSensitivity`，可調整電話音訊以加快輪流對話速度。

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
                instructions: "簡短地說。在使用更深入的工具前呼叫 openclaw_agent_consult。",
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

如需提供者專屬的即時語音選項，請參閱 [Google 提供者](/zh-TW/providers/google) 和
[OpenAI 提供者](/zh-TW/providers/openai)。

## 串流轉錄

`streaming` 會將 Twilio Media Streams 連接至即時轉錄提供者。
傳統串流路徑需要 `provider: "twilio"`；使用
Telnyx、Plivo 或 mock 的設定會遭拒。Telnyx 即時音訊則使用另外驗證的
`realtime.enabled` 路徑。

目前的執行階段行為：

- `streaming.provider` 為選用設定。若未設定，語音通話會使用第一個已註冊的即時轉錄提供者。
- 內建的即時轉錄提供者：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由各自的提供者外掛註冊。
- 由提供者擁有的原始設定位於 `streaming.providers.<providerId>` 下。
- Twilio 傳送已接受的串流 `start` 訊息後，語音通話會立即註冊該串流，在提供者連線期間將傳入媒體排入佇列並交由轉錄提供者處理，且只會在即時轉錄就緒後開始初始問候語。
- 如果 `streaming.provider` 指向未註冊的提供者，或未註冊任何提供者，語音通話會記錄警告並略過媒體串流，而不會讓整個外掛失敗。

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
                    apiKey: "sk-...", // 若已設定 OPENAI_API_KEY，則可省略
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
    預設值：API 金鑰為 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`（若兩者皆未設定，
    則改用 xAI OAuth 驗證設定檔）；端點為
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
                    apiKey: "${XAI_API_KEY}", // 若已設定 XAI_API_KEY，則可省略
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

語音通話會使用核心 `messages.tts` 設定來處理通話中的串流語音。
你可以在外掛設定下使用**相同結構**加以覆寫——
它會與 `messages.tts` 進行深層合併。

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
**語音通話會忽略 Microsoft 語音。** 電話語音合成需要
實作電話目標輸出的提供者；Microsoft 語音提供者未實作此功能，
因此通話時會略過它，並改為嘗試後援鏈中的其他提供者。
</Warning>

行為說明：

- 外掛設定中的舊版 `tts.<provider>` 金鑰（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會改用提供者原生語音。
- 如果 Twilio 媒體串流已啟用，語音通話不會改用 TwiML `<Say>`。如果在此狀態下無法使用電話 TTS，播放要求會失敗，而不會混用兩種播放路徑。
- 當電話 TTS 改用次要提供者時，語音通話會記錄包含提供者鏈（`from`、`to`、`attempts`）的警告，以供偵錯。
- 當 Twilio 插話或串流拆除清除待處理的 TTS 佇列時，已排入佇列的播放要求會完成結算，而不會讓等待播放完成的來電者一直停滯。

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
  <Tab title="覆寫 OpenAI 模型（深度合併）">
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
`inboundPolicy: "allowlist"` 是低可信度的來電顯示篩選機制。外掛會將供應商提供的 `From` 值正規化，並與 `allowFrom` 比較。
網路鉤子驗證會確認供應商的傳遞來源與承載資料完整性，
但**無法**證明 PSTN/VoIP 來電號碼的所有權。請將
`allowFrom` 視為來電顯示篩選，而非可靠的來電者身分驗證。
</Warning>

自動回覆使用代理系統。可透過 `responseModel`、
`responseSystemPrompt` 和 `responseTimeoutMs` 進行調整。

### 依號碼路由

當一個語音通話外掛接收多個電話號碼的來電，且每個號碼應如不同線路般運作時，請使用 `numbers`。例如，
其中一個號碼可以使用輕鬆風格的個人助理，而另一個則使用商務
角色、不同的回覆代理及不同的 TTS 語音。

路由會依據供應商提供的被撥 `To` 號碼選取。索引鍵必須
是 E.164 號碼。來電抵達時，語音通話會解析一次相符的
路由，將相符路由儲存於通話記錄中，並在問候語、傳統自動回覆路徑、即時
諮詢路徑及 TTS 播放中重複使用該有效設定。若沒有相符的路由，則使用全域語音通話
設定。撥出通話不會使用 `numbers`；發起通話時，請明確傳入撥出
目標、訊息及工作階段。

路由覆寫目前支援：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值會深度合併並覆寫全域語音通話 `tts` 設定，因此
通常只需覆寫供應商語音：

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

對於自動回覆，語音通話會在系統提示詞後附加嚴格的語音輸出契約，
要求回覆 `{"spoken":"..."}` JSON。語音通話會以防禦性方式
擷取語音文字：

- 忽略標記為推理／錯誤內容的承載資料。
- 解析直接 JSON、圍欄 JSON 或行內 `"spoken"` 索引鍵。
- 退回使用純文字，並移除可能屬於規劃／中繼內容的開頭段落。

如此可讓語音播放聚焦於面向來電者的文字，並避免將
規劃文字洩漏至音訊中。

### 對話啟動行為

對於撥出的 `conversation` 通話，首則訊息的處理會與即時
播放狀態連動：

- 僅在初始問候語實際播放期間，才會抑制插話佇列清除與自動回覆。
- 若初始播放失敗，通話會返回 `listening`，且初始訊息會保留於佇列中以供重試。
- Twilio 串流的初始播放會在串流連線時立即開始，不會額外延遲。
- 插話會中止進行中的播放，並清除已排入佇列但尚未播放的 Twilio TTS 項目。已清除的項目會解析為已略過，讓後續回覆邏輯可以繼續，而不必等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流本身的開場輪次。語音通話**不會**針對該初始訊息發布傳統的 `<Say>` TwiML 更新，因此撥出的 `<Connect><Stream>` 工作階段會維持連接。

### Twilio 串流中斷寬限期

當 Twilio 媒體串流中斷時，語音通話會等待 **2000 ms**，再
自動結束通話：

- 若串流在此期間重新連線，便會取消自動結束。
- 若寬限期後仍無串流重新註冊，便會結束通話，以防止通話卡在進行中狀態。

## 過期通話清理器

使用 `staleCallReaperSeconds`（預設為 **120**）來結束始終未接聽，
且從未進入即時對話狀態的通話，例如供應商始終未傳遞終止網路鉤子的通知模式
通話。將其設為 `0` 即可
停用。

清理器每 30 秒執行一次，且只會結束沒有
`answeredAt` 時間戳記、尚未處於終止或即時
（`speaking`/`listening`）狀態的通話，因此已接聽的對話絕不會被此計時器清理；
`maxDurationSeconds`（預設為 300）是另一項上限，用於
結束持續過久的已接聽通話。

對於電信業者可能較慢傳遞響鈴／接聽
網路鉤子的通知型流程，請將 `staleCallReaperSeconds` 提高至預設值以上，以免正常但較慢的
通話過早遭到清理；`120`-`300` 秒是合理的正式環境
範圍。

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

當代理伺服器或通道位於閘道前方時，外掛會重建
用於簽章驗證的公開 URL。以下選項控制信任哪些
轉送標頭：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許來自轉送標頭的主機清單。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  無需允許清單即可信任轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  僅在要求的遠端 IP 符合清單時信任轉送標頭。
</ParamField>

其他保護措施：

- Twilio、Telnyx 和 Plivo 已啟用網路鉤子**重播保護**。重播的有效網路鉤子要求會收到確認，但不會執行副作用。
- Twilio 對話輪次會在 `<Gather>` 回呼中包含每輪權杖，因此過期／重播的語音回呼無法滿足較新的待處理逐字稿輪次。
- 若缺少供應商要求的簽章標頭，未經驗證的網路鉤子要求會在讀取本文前遭到拒絕。
- 語音通話網路鉤子使用共用的預先驗證本文讀取設定檔（本文上限為 64 KB，讀取逾時為 5 秒），並在簽章驗證前套用每個索引鍵的進行中要求上限（每個索引鍵預設為 8 個並行要求）。

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
openclaw voicecall start --to "+15555550123"   # call 的別名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # 從記錄中彙整輪次延遲
openclaw voicecall expose --mode funnel
```

當閘道已在執行時，操作型 `voicecall` 指令
會委派給閘道所擁有的語音通話執行階段，使命令列介面不會繫結第二個
網路鉤子伺服器。若無法連線至閘道，指令會退回使用
獨立的命令列介面執行階段。

`latency` 會從預設語音通話儲存路徑讀取 `calls.jsonl`。使用
`--file <path>` 指向其他記錄，並使用 `--last <n>` 將
分析限制為最後 N 筆記錄（預設為 200）。輸出包含輪次延遲與聆聽等待時間的
最小值／最大值／平均值、p50 和 p95。

## 代理工具

工具名稱：`voice_call`。

| 動作          | 引數                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

語音通話外掛隨附相符的代理 skill。

## 閘道 RPC

| 方法                      | 引數                                                             | 備註                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | 省略 `to` 時，會回退使用 `toNumber` 設定。                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | 與 `initiate` 相同，但也接受連線前的 `dtmfSequence`。           |
| `voicecall.continue`        | `callId`, `message`                                              | 阻塞直到該回合完成；傳回逐字稿。                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | 非同步變體：立即傳回 `operationId`。                      |
| `voicecall.continue.result` | `operationId`                                                    | 輪詢待處理的 `voicecall.continue.start` 作業以取得結果。      |
| `voicecall.speak`           | `callId`, `message`                                              | 不等待即開始說話；當 `realtime.enabled` 時使用即時橋接。 |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | 省略 `callId` 以列出所有進行中的通話。                                   |

`dtmfSequence` 僅適用於 `mode: "conversation"`；若通知模式通話需要在連線後
輸入數字，應在通話建立後使用 `voicecall.dtmf`。

## 疑難排解

### 設定無法公開網路鉤子

請從執行閘道的相同環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。即使已
設定 `publicUrl`，若其指向本機或私人
網路空間仍會失敗，因為電信業者無法回呼這些位址。
請勿使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` 或其他電信業者級 NAT
範圍作為 `publicUrl`。

Twilio 通知模式的撥出通話會在建立通話的請求中直接傳送初始 `<Say>` TwiML，
因此第一段語音訊息不依賴
Twilio 擷取網路鉤子 TwiML。狀態回呼、對話通話、連線前 DTMF、即時串流和
連線後通話控制仍需要公開網路鉤子。

請使用一種公開存取方式：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // 或
          tunnel: { provider: "ngrok" },
          // 或
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

除非傳入 `--yes`，否則 `voicecall smoke` 僅會進行模擬執行。

### 提供者認證資訊失敗

請檢查所選的提供者及必要的認證資訊欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和
  `fromNumber`，或 `TELNYX_API_KEY`、`TELNYX_CONNECTION_ID` 和
  `TELNYX_PUBLIC_KEY`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`，或
  `PLIVO_AUTH_ID` 和 `PLIVO_AUTH_TOKEN`。

認證資訊必須存在於閘道主機上。編輯本機 Shell 設定檔
不會影響已在執行中的閘道，直到其重新啟動或重新載入
環境為止。

### 通話已開始，但未收到提供者的網路鉤子

請確認提供者主控台指向確切的公開網路鉤子 URL：

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
- 通道 URL 在閘道啟動後發生變更。
- Proxy 轉送了請求，但移除或改寫了主機／通訊協定標頭。
- 防火牆或 DNS 將公開主機名稱路由至閘道以外的位置。
- 重新啟動閘道時未啟用語音通話外掛。

若閘道前方有反向 Proxy 或通道，請將
`webhookSecurity.allowedHosts` 設為公開主機名稱，或對已知的 Proxy 位址使用
`webhookSecurity.trustedProxyIPs`。僅當 Proxy 邊界
由你控制時，才能使用 `webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

提供者簽章會根據 OpenClaw 從傳入請求重建的公開 URL
進行檢查。若簽章驗證失敗：

- 確認提供者網路鉤子 URL 與 `publicUrl` 完全相符，包括通訊協定、主機和路徑。
- 對於 ngrok 免費方案 URL，當通道主機名稱變更時，請更新 `publicUrl`。
- 確保 Proxy 保留原始主機和通訊協定標頭，或設定 `webhookSecurity.allowedHosts`。
- 請勿在本機測試以外的環境啟用 `skipSignatureVerification`。

### Google Meet 的 Twilio 加入失敗

Google Meet 使用此外掛透過 Twilio 撥號加入。請先驗證語音
通話：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

接著明確驗證 Google Meet 傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

如果語音通話狀態為綠色，但 Meet 參與者始終未加入，請檢查 Meet
撥入號碼、PIN 和 `--dtmf-sequence`。電話通話可能正常，
但會議可能拒絕或忽略錯誤的 DTMF 序列。

Google Meet 透過 `voicecall.start` 啟動 Twilio 電話端，
並使用連線前 DTMF 序列。由 PIN 衍生的序列會包含 Google Meet
外掛的 `voiceCall.dtmfDelayMs`（預設為 **12000 ms**）作為前導 Twilio
等待數字，因為 Meet 撥入提示可能較晚出現。語音通話接著會在請求
開場問候語之前，重新導向回即時處理。

使用 `openclaw logs --follow` 查看即時階段追蹤。正常的 Twilio Meet
加入會依下列順序記錄：

- Google Meet 將 Twilio 加入作業委派給語音通話。
- 語音通話儲存連線前 DTMF TwiML。
- 在即時處理前取用並提供 Twilio 初始 TwiML。
- 語音通話為 Twilio 通話提供即時 TwiML。
- Google Meet 在 DTMF 後延遲結束後，以 `voicecall.speak` 請求開場語音。

`openclaw voicecall tail` 仍會顯示已保存的通話記錄；這對
通話狀態和逐字稿很有用，但並非每個網路鉤子／即時轉換
都會顯示在其中。

### 即時通話沒有語音

請確認只啟用一種音訊模式：`realtime.enabled` 和
`streaming.enabled` 不能同時為 true。

對於即時 Twilio／Telnyx 通話，還需確認：

- 已載入並註冊即時提供者外掛。
- `realtime.provider` 未設定，或指定已註冊的提供者。
- 閘道程序可取得提供者 API 金鑰。
- `openclaw logs --follow` 顯示已提供即時 TwiML、即時橋接已啟動，且初始問候語已排入佇列。

## 相關內容

- [對話模式](/zh-TW/nodes/talk)
- [文字轉語音](/zh-TW/tools/tts)
- [語音喚醒](/zh-TW/nodes/voicewake)

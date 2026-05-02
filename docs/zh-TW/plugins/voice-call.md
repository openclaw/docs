---
read_when:
    - 你想要從 OpenClaw 撥打外撥語音通話
    - 你正在設定或開發 voice-call Plugin
    - 你需要在電話系統上使用即時語音或串流轉錄
sidebarTitle: Voice call
summary: 透過 Twilio、Telnyx 或 Plivo 撥出並接聽語音通話，並可選用即時語音和串流轉錄
title: 語音通話 Plugin
x-i18n:
    generated_at: "2026-05-02T02:57:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: cde64fa054743d4ed3f146042bd65532af0e9eb5b792b088a856889b3d2cb3c9
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls for OpenClaw via a plugin. Supports outbound notifications,
multi-turn conversations, full-duplex realtime voice, streaming
transcription, and inbound calls with allowlist policies.

**Current providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/no network).

<Note>
The Voice Call plugin runs **inside the Gateway process**. If you use a
remote Gateway, install and configure the plugin on the machine running
the Gateway, then restart the Gateway to load it.
</Note>

## Quick start

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

    If npm reports the OpenClaw-owned package as deprecated, that package version
    is from an older external package train; use a current packaged OpenClaw
    build or the local folder path until a newer npm package is published.

    Restart the Gateway afterwards so the plugin loads.

  </Step>
  <Step title="Configure provider and webhook">
    Set config under `plugins.entries.voice-call.config` (see
    [Configuration](#configuration) below for the full shape). At minimum:
    `provider`, provider credentials, `fromNumber`, and a publicly
    reachable webhook URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    The default output is readable in chat logs and terminals. It checks
    plugin enablement, provider credentials, webhook exposure, and that
    only one audio mode (`streaming` or `realtime`) is active. Use
    `--json` for scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Both are dry runs by default. Add `--yes` to actually place a short
    outbound notify call:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
For Twilio, Telnyx, and Plivo, setup must resolve to a **public webhook URL**.
If `publicUrl`, the tunnel URL, the Tailscale URL, or the serve fallback
resolves to loopback or private network space, setup fails instead of
starting a provider that cannot receive carrier webhooks.
</Warning>

## Configuration

If `enabled: true` but the selected provider is missing credentials,
Gateway startup logs a setup-incomplete warning with the missing keys and
skips starting the runtime. Commands, RPC calls, and agent tools still
return the exact missing provider configuration when used.

<Note>
Voice-call credentials accept SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, and `plugins.entries.voice-call.config.tts.providers.*.apiKey` resolve through the standard SecretRef surface; see [SecretRef credential surface](/zh-TW/reference/secretref-credential-surface).
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx, and Plivo all require a **publicly reachable** webhook URL.
    - `mock` is a local dev provider (no network calls).
    - Telnyx requires `telnyx.publicKey` (or `TELNYX_PUBLIC_KEY`) unless `skipSignatureVerification` is true.
    - `skipSignatureVerification` is for local testing only.
    - On ngrok free tier, set `publicUrl` to the exact ngrok URL; signature verification is always enforced.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` allows Twilio webhooks with invalid signatures **only** when `tunnel.provider="ngrok"` and `serve.bind` is loopback (ngrok local agent). Local dev only.
    - Ngrok free-tier URLs can change or add interstitial behaviour; if `publicUrl` drifts, Twilio signatures fail. Production: prefer a stable domain or a Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` closes sockets that never send a valid `start` frame.
    - `streaming.maxPendingConnections` caps total unauthenticated pre-start sockets.
    - `streaming.maxPendingConnectionsPerIp` caps unauthenticated pre-start sockets per source IP.
    - `streaming.maxConnections` caps total open media stream sockets (pending + active).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Older configs using `provider: "log"`, `twilio.from`, or legacy
    `streaming.*` OpenAI keys are rewritten by `openclaw doctor --fix`.
    Runtime fallback still accepts the old voice-call keys for now, but
    the rewrite path is `openclaw doctor --fix` and the compat shim is
    temporary.

    Auto-migrated streaming keys:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Realtime voice conversations

`realtime` selects a full-duplex realtime voice provider for live call
audio. It is separate from `streaming`, which only forwards audio to
realtime transcription providers.

<Warning>
`realtime.enabled` cannot be combined with `streaming.enabled`. Pick one
audio mode per call.
</Warning>

Current runtime behaviour:

- `realtime.enabled` is supported for Twilio Media Streams.
- `realtime.provider` is optional. If unset, Voice Call uses the first registered realtime voice provider.
- Bundled realtime voice providers: Google Gemini Live (`google`) and OpenAI (`openai`), registered by their provider plugins.
- Provider-owned raw config lives under `realtime.providers.<providerId>`.
- Voice Call exposes the shared `openclaw_agent_consult` realtime tool by default. The realtime model can call it when the caller asks for deeper reasoning, current information, or normal OpenClaw tools.
- `realtime.fastContext.enabled` is default-off. When enabled, Voice Call first searches indexed memory/session context for the consult question and returns those snippets to the realtime model within `realtime.fastContext.timeoutMs` before falling back to the full consult agent only if `realtime.fastContext.fallbackToConsult` is true.
- If `realtime.provider` points at an unregistered provider, or no realtime voice provider is registered at all, Voice Call logs a warning and skips realtime media instead of failing the whole plugin.
- Consult session keys reuse the existing voice session when available, then fall back to the caller/callee phone number so follow-up consult calls keep context during the call.

### Tool policy

`realtime.toolPolicy` controls the consult run:

| Policy           | Behavior                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose the consult tool and limit the regular agent to `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, and `memory_get`. |
| `owner`          | Expose the consult tool and let the regular agent use the normal agent tool policy.                                                      |
| `none`           | Do not expose the consult tool. Custom `realtime.tools` are still passed through to the realtime provider.                               |

### Realtime provider examples

<Tabs>
  <Tab title="Google Gemini Live">
    Defaults: API key from `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; voice `Kore`.

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

See [Google provider](/zh-TW/providers/google) and
[OpenAI provider](/zh-TW/providers/openai) for provider-specific realtime voice
options.

## Streaming transcription

`streaming` selects a realtime transcription provider for live call audio.

Current runtime behavior:

- `streaming.provider` 是選用的。如果未設定，Voice Call 會使用第一個已註冊的即時轉錄供應商。
- 隨附的即時轉錄供應商：Deepgram (`deepgram`)、ElevenLabs (`elevenlabs`)、Mistral (`mistral`)、OpenAI (`openai`) 和 xAI (`xai`)，由各自的供應商 Plugin 註冊。
- 供應商擁有的原始設定位於 `streaming.providers.<providerId>` 之下。
- Twilio 傳送已接受串流的 `start` 訊息後，Voice Call 會立即註冊該串流，並在供應商連線時透過轉錄供應商排佇列處理傳入媒體，且只會在即時轉錄就緒後開始初始問候。
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

Voice Call 會使用核心 `messages.tts` 設定，在通話中進行串流
語音。你可以在 Plugin 設定下以
**相同形狀**覆寫它，並且它會與 `messages.tts` 深度合併。

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
**Microsoft 語音會在語音通話中被忽略。** 電話音訊需要 PCM；
目前的 Microsoft 傳輸不會公開電話 PCM 輸出。
</Warning>

行為備註：

- Plugin 設定中的舊版 `tts.<provider>` 鍵（`openai`、`elevenlabs`、`microsoft`、`edge`）會由 `openclaw doctor --fix` 修復；提交的設定應使用 `tts.providers.<provider>`。
- 啟用 Twilio 媒體串流時會使用核心 TTS；否則通話會退回到供應商原生語音。
- 如果 Twilio 媒體串流已在使用中，Voice Call 不會退回到 TwiML `<Say>`。如果該狀態下無法使用電話 TTS，播放要求會失敗，而不是混用兩條播放路徑。
- 當電話 TTS 退回到次要供應商時，Voice Call 會記錄包含供應商鏈（`from`、`to`、`attempts`）的警告，以利偵錯。
- 當 Twilio 插話或串流拆除清除待處理的 TTS 佇列時，已排佇列的播放要求會完成結算，而不是讓呼叫者在等待播放完成時卡住。

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

來電政策預設為 `disabled`。若要啟用來電，請設定：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保證的來電號碼篩選。該
Plugin 會正規化供應商提供的 `From` 值，並與
`allowFrom` 比較。Webhook 驗證會驗證供應商交付與
酬載完整性，但它**不會**證明 PSTN/VoIP 來電號碼
擁有權。請將 `allowFrom` 視為來電號碼篩選，而不是強式來電者
身分。
</Warning>

自動回應使用代理系統。可透過 `responseModel`、
`responseSystemPrompt` 和 `responseTimeoutMs` 調整。

### 語音輸出合約

對於自動回應，Voice Call 會在系統提示後附加嚴格的語音輸出合約：

```text
{"spoken":"..."}
```

Voice Call 會防禦性地擷取語音文字：

- 忽略標記為推理/錯誤內容的酬載。
- 解析直接 JSON、圍欄 JSON，或內嵌 `"spoken"` 鍵。
- 退回到純文字，並移除可能的規劃/中繼前導段落。

這可讓語音播放聚焦於面向呼叫者的文字，並避免
將規劃文字洩漏到音訊中。

### 對話啟動行為

對於外撥 `conversation` 通話，第一則訊息處理會繫結到即時
播放狀態：

- 只有在初始問候正在主動說話時，才會抑制插話佇列清除與自動回應。
- 如果初始播放失敗，通話會回到 `listening`，且初始訊息會保持排佇列以供重試。
- Twilio 串流的初始播放會在串流連線時開始，不會有額外延遲。
- 插話會中止主動播放，並清除已排佇列但尚未開始播放的 Twilio TTS 項目。已清除的項目會解析為已略過，因此後續回應邏輯可繼續，而不必等待永遠不會播放的音訊。
- 即時語音對話會使用即時串流本身的開場回合。Voice Call **不會**為該初始訊息送出舊版 `<Say>` TwiML 更新，因此外撥 `<Connect><Stream>` 工作階段會保持附加。

### Twilio 串流中斷寬限期

當 Twilio 媒體串流中斷時，Voice Call 會等待 **2000 ms** 才
自動結束通話：

- 如果串流在該時間窗內重新連線，會取消自動結束。
- 如果寬限期後沒有串流重新註冊，通話會結束，以防止卡住的作用中通話。

## 過期通話清理器

使用 `staleCallReaperSeconds` 結束從未收到終端
Webhook 的通話（例如永不完成的通知模式通話）。預設值
為 `0`（停用）。

建議範圍：

- **生產環境：** 通知樣式流程使用 `120`–`300` 秒。
- 請將此值保持為**高於 `maxDurationSeconds`**，讓正常通話可以完成。良好的起點是 `maxDurationSeconds + 30–60` 秒。

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

當代理或通道位於 Gateway 前方時，Plugin 會
重建用於簽章驗證的公開 URL。這些選項
控制哪些轉送標頭受信任：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允許清單中的轉送標頭主機。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  信任沒有允許清單的轉送標頭。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  只有在要求的遠端 IP 符合清單時，才信任轉送標頭。
</ParamField>

其他保護：

- Twilio 和 Plivo 會啟用 Webhook **重放保護**。重放的有效 Webhook 要求會被確認，但會略過副作用。
- Twilio 對話回合會在 `<Gather>` 回呼中包含每回合權杖，因此過期/重放的語音回呼無法滿足較新的待處理轉錄回合。
- 未經驗證的 Webhook 要求在缺少供應商必要簽章標頭時，會在讀取本文之前被拒絕。
- voice-call Webhook 會使用共用的預先驗證本文設定檔（64 KB / 5 秒），並在簽章驗證前加上每 IP 進行中的上限。

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

當 Gateway 已在執行時，操作性的 `voicecall` 命令會委派
給 Gateway 擁有的 voice-call 執行階段，因此 CLI 不會繫結第二個
Webhook 伺服器。如果無法連線到 Gateway，命令會退回到
獨立 CLI 執行階段。

`latency` 會從預設 voice-call 儲存路徑讀取 `calls.jsonl`。
使用 `--file <path>` 指向不同的記錄，並使用 `--last <n>` 將
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

`dtmfSequence` 只有搭配 `mode: "conversation"` 才有效。通知模式通話
如果需要連線後數字，應在通話存在後使用 `voicecall.dtmf`。

## 疑難排解

### 設定無法公開 Webhook

從執行 Gateway 的相同環境執行設定：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

對於 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必須為綠色。已設定的 `publicUrl` 若指向本機或私人網路空間，仍會失敗，因為電信業者無法回呼這些位址。請勿使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

Twilio notify-mode 外撥通話會直接在 create-call 請求中傳送初始 `<Say>` TwiML，因此第一段語音訊息不依賴 Twilio 擷取 Webhook TwiML。狀態回呼、對話通話、連線前 DTMF、即時串流和連線後通話控制仍需要公開 Webhook。

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

變更設定後，重新啟動或重新載入 Gateway，然後執行：

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

除非你傳入 `--yes`，否則 `voicecall smoke` 是模擬執行。

### 供應商憑證失敗

檢查所選供應商和必要憑證欄位：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或 `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和 `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

憑證必須存在於 Gateway 主機上。編輯本機 shell profile 不會影響已在執行中的 Gateway，直到它重新啟動或重新載入其環境。

### 通話開始但供應商 Webhook 未抵達

確認供應商主控台指向確切的公開 Webhook URL：

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
- Gateway 啟動後，通道 URL 已變更。
- Proxy 轉送請求，但移除或改寫 host/proto 標頭。
- 防火牆或 DNS 將公開主機名稱路由到 Gateway 以外的位置。
- Gateway 重新啟動時未啟用 Voice Call Plugin。

當反向 Proxy 或通道位於 Gateway 前方時，將 `webhookSecurity.allowedHosts` 設為公開主機名稱，或對已知 Proxy 位址使用 `webhookSecurity.trustedProxyIPs`。只有當 Proxy 邊界在你的控制之下時，才使用 `webhookSecurity.trustForwardingHeaders`。

### 簽章驗證失敗

供應商簽章會依照 OpenClaw 從傳入請求重建的公開 URL 進行檢查。如果簽章失敗：

- 確認供應商 Webhook URL 與 `publicUrl` 完全相符，包括 scheme、host 和 path。
- 對於 ngrok 免費層 URL，當通道主機名稱變更時更新 `publicUrl`。
- 確保 Proxy 保留原始 host 和 proto 標頭，或設定 `webhookSecurity.allowedHosts`。
- 不要在本機測試以外啟用 `skipSignatureVerification`。

### Google Meet Twilio 加入失敗

Google Meet 使用此 Plugin 進行 Twilio 撥入加入。先驗證 Voice Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

接著明確驗證 Google Meet 傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 為綠色，但 Meet 參與者從未加入，請檢查 Meet 撥入號碼、PIN 和 `--dtmf-sequence`。電話通話可能正常，但會議會拒絕或忽略不正確的 DTMF 序列。

Google Meet 會將 Meet DTMF 序列和介紹文字傳給 `voicecall.start`。對於 Twilio 通話，Voice Call 會先提供 DTMF TwiML，重新導向回 Webhook，然後開啟即時媒體串流，讓已儲存的介紹在電話參與者加入會議後產生。

使用 `openclaw logs --follow` 查看即時階段追蹤。正常的 Twilio Meet 加入會依序記錄：

- Google Meet 將 Twilio 加入委派給 Voice Call。
- Voice Call 儲存連線前 DTMF TwiML。
- Twilio 初始 TwiML 會在即時處理前被取用並提供。
- Voice Call 為 Twilio 通話提供即時 TwiML。
- 即時橋接啟動，且初始問候已排入佇列。

`openclaw voicecall tail` 仍會顯示持久化的通話記錄；它適合用於通話狀態和逐字稿，但不是每個 Webhook/即時轉換都會出現在那裡。

### 即時通話沒有語音

確認只啟用一種音訊模式。`realtime.enabled` 和 `streaming.enabled` 不能同時為 true。

對於即時 Twilio 通話，也請確認：

- 已載入並註冊即時供應商 Plugin。
- `realtime.provider` 未設定，或命名一個已註冊的供應商。
- Gateway 程序可使用供應商 API key。
- `openclaw logs --follow` 顯示即時 TwiML 已提供、即時橋接已啟動，且初始問候已排入佇列。

## 相關

- [Talk mode](/zh-TW/nodes/talk)
- [Text-to-speech](/zh-TW/tools/tts)
- [Voice wake](/zh-TW/nodes/voicewake)

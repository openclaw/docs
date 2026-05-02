---
read_when:
    - 為回覆啟用文字轉語音
    - 設定 TTS 提供者、備援鏈或角色
    - 使用 /tts 命令或指令
sidebarTitle: Text to speech (TTS)
summary: 對外回覆的文字轉語音 — 提供者、角色設定、斜線指令與依通道輸出
title: 文字轉語音
x-i18n:
    generated_at: "2026-05-02T22:22:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: daf4d7bc86afe14f7c181eee56e2bc77906ed78b4aaabb2fc855847f5a4366f9
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw 可以將外送回覆轉換成橫跨 **14 個語音供應商**的音訊，並在 Feishu、Matrix、Telegram 和 WhatsApp 上傳送原生語音訊息，在其他地方傳送音訊附件，以及為電話和 Talk 提供 PCM/Ulaw 串流。

## 快速開始

<Steps>
  <Step title="選擇供應商">
    OpenAI 和 ElevenLabs 是最可靠的託管選項。Microsoft 和
    Local CLI 不需要 API 金鑰即可運作。完整清單請參閱[供應商矩陣](#supported-providers)。
  </Step>
  <Step title="設定 API 金鑰">
    匯出供應商的環境變數（例如 `OPENAI_API_KEY`、
    `ELEVENLABS_API_KEY`）。Microsoft 和 Local CLI 不需要金鑰。
  </Step>
  <Step title="在設定中啟用">
    設定 `messages.tts.auto: "always"` 和 `messages.tts.provider`：

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="在聊天中試用">
    `/tts status` 會顯示目前狀態。`/tts audio Hello from OpenClaw`
    會傳送一次性音訊回覆。
  </Step>
</Steps>

<Note>
Auto-TTS 預設為**關閉**。當未設定 `messages.tts.provider` 時，
OpenClaw 會依登錄檔自動選取順序挑選第一個已設定的供應商。
內建的 `tts` agent 工具僅限明確意圖使用：一般聊天會保持文字，
除非使用者要求音訊、使用 `/tts`，或啟用 Auto-TTS/指示詞語音。
</Note>

## 支援的供應商

| 供應商            | 驗證                                                                                                             | 備註                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（也支援 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`）        | 原生 Ogg/Opus 語音備註輸出和電話。                                      |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 相容 TTS。預設為 `hexgrad/Kokoro-82M`。                          |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 或 `XI_API_KEY`                                                                             | 語音複製、多語言，並可透過 `seed` 決定性產生。                          |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                                                                             | Gemini API TTS；可透過 `promptTemplate: "audio-profile-v1"` 感知 persona。 |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 語音備註和電話輸出。                                                    |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 串流 TTS API。原生 Opus 語音備註和 PCM 電話。                           |
| **Local CLI**     | 無                                                                                                               | 執行已設定的本機 TTS 命令。                                             |
| **Microsoft**     | 無                                                                                                               | 透過 `node-edge-tts` 使用公開 Edge 神經 TTS。盡力服務，無 SLA。         |
| **MiniMax**       | `MINIMAX_API_KEY`（或 Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）      | T2A v2 API。預設為 `speech-2.8-hd`。                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 也用於自動摘要；支援 persona `instructions`。                           |
| **OpenRouter**    | `OPENROUTER_API_KEY`（可重用 `models.providers.openrouter.apiKey`）                                              | 預設模型 `hexgrad/kokoro-82m`。                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（舊版 AppID/token：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                         |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 共用的圖片、影片和語音供應商。                                          |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 批次 TTS。**不**支援原生 Opus 語音備註。                            |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | 透過 Xiaomi chat completions 使用 MiMo TTS。                            |

如果已設定多個供應商，會先使用選取的供應商，其他供應商則作為備援選項。
自動摘要使用 `summaryModel`（或 `agents.defaults.model.primary`），
因此若你保持摘要啟用，該供應商也必須完成驗證。

<Warning>
內建的 **Microsoft** 供應商會透過 `node-edge-tts` 使用 Microsoft Edge 的線上神經 TTS
服務。這是一個沒有公開 SLA 或配額的公開網路服務，請視為盡力服務。
舊版供應商 id `edge` 會正規化為 `microsoft`，且 `openclaw doctor --fix`
會重寫已保存的設定；新的設定應一律使用 `microsoft`。
</Warning>

## 設定

TTS 設定位於 `~/.openclaw/openclaw.json` 中的 `messages.tts`。選擇一個
預設集並調整供應商區塊：

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft（無金鑰）">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### 每個 agent 的語音覆寫

當某個 agent 應使用不同的供應商、語音、模型、persona 或 Auto-TTS 模式時，
請使用 `agents.list[].tts`。agent 區塊會深度合併到 `messages.tts` 之上，
因此供應商憑證可以保留在全域供應商設定中：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

若要固定每個 agent 的 persona，請在供應商設定旁設定 `agents.list[].tts.persona`，
它只會針對該 agent 覆寫全域 `messages.tts.persona`。

自動回覆、`/tts audio`、`/tts status` 和 `tts` agent 工具的優先順序：

1. `messages.tts`
2. 作用中的 `agents.list[].tts`
3. 頻道覆寫，當頻道支援 `channels.<channel>.tts` 時
4. 帳號覆寫，當頻道傳遞 `channels.<channel>.accounts.<id>.tts` 時
5. 此主機的本機 `/tts` 偏好設定
6. 內嵌 `[[tts:...]]` 指令，當[模型覆寫](#model-driven-directives)啟用時

頻道與帳號覆寫使用與 `messages.tts` 相同的形狀，並會深度合併到較早的層之上，因此共用的提供者憑證可以保留在
`messages.tts` 中，而頻道或機器人帳號只變更語音、模型、角色，
或自動模式：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## 角色

**角色**是穩定的語音身分，可跨提供者以決定性的方式套用。它可以偏好某個提供者、定義與提供者無關的提示意圖，並攜帶特定提供者的語音、模型、提示模板、種子與語音設定綁定。

### 最小角色

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### 完整角色（與提供者無關的提示）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### 角色解析

作用中的角色會以決定性方式選取：

1. `/tts persona <id>` 本機偏好設定，如果已設定。
2. `messages.tts.persona`，如果已設定。
3. 無角色。

提供者選取會先採用明確設定：

1. 直接覆寫（CLI、gateway、Talk、允許的 TTS 指令）。
2. `/tts provider <id>` 本機偏好設定。
3. 作用中角色的 `provider`。
4. `messages.tts.provider`。
5. 登錄檔自動選取。

對每次提供者嘗試，OpenClaw 會依此順序合併設定：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 受信任的請求覆寫
4. 允許的模型發出 TTS 指令覆寫

### 提供者如何使用角色提示

角色提示欄位（`profile`、`scene`、`sampleContext`、`style`、`accent`、
`pacing`、`constraints`）是**與提供者無關**的。每個提供者會決定如何使用它們：

<AccordionGroup>
  <Accordion title="Google Gemini">
    只有在有效的 Google 提供者設定設為 `promptTemplate: "audio-profile-v1"`
    或 `personaPrompt` 時，才會將角色提示欄位包裝到 Gemini TTS 提示結構中。
    較舊的 `audioProfile` 與 `speakerName` 欄位仍會作為 Google 專用提示文字前置加入。
    `[[tts:text]]` 區塊內的內嵌音訊標籤，例如
    `[whispers]` 或 `[laughs]`，會保留在 Gemini 轉錄稿中；OpenClaw 不會產生這些標籤。
  </Accordion>
  <Accordion title="OpenAI">
    只有在未設定明確的 OpenAI `instructions` 時，才會將角色提示欄位對應到請求的 `instructions` 欄位。
    明確的 `instructions` 永遠優先。
  </Accordion>
  <Accordion title="其他提供者">
    只會使用
    `personas.<id>.providers.<provider>` 下方的提供者專用角色綁定。角色提示欄位會被忽略，
    除非提供者實作自己的角色提示對應。
  </Accordion>
</AccordionGroup>

### 備援政策

`fallbackPolicy` 控制角色對嘗試的提供者**沒有綁定**時的行為：

| 政策                | 行為                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **預設。** 與提供者無關的提示欄位仍可使用；提供者可以使用或忽略它們。                                                                          |
| `provider-defaults` | 該次嘗試的提示準備會省略角色；提供者會使用其中性預設值，同時繼續備援到其他提供者。                                                           |
| `fail`              | 以 `reasonCode: "not_configured"` 和 `personaBinding: "missing"` 跳過該提供者嘗試。仍會嘗試備援提供者。                                      |

只有當**每個**嘗試的提供者都被跳過或失敗時，整個 TTS 請求才會失敗。

## 模型驅動指令

預設情況下，助理**可以**發出 `[[tts:...]]` 指令，為單一回覆覆寫語音、模型或速度，並可加上選用的
`[[tts:text]]...[[/tts:text]]` 區塊，用於只應出現在音訊中的表現提示：

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

當 `messages.tts.auto` 為 `"tagged"` 時，**必須有指令**才會觸發音訊。串流區塊傳遞會在頻道看見之前，從可見文字中移除指令，即使它們被拆分到相鄰區塊也一樣。

除非 `modelOverrides.allowProvider: true`，否則會忽略 `provider=...`。當回覆宣告 `provider=...` 時，該指令中的其他鍵只會由該提供者解析；不支援的鍵會被移除，並回報為 TTS 指令警告。

**可用的指令鍵：**

- `provider`（已註冊的提供者 ID；需要 `allowProvider: true`）
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0–10）
- `pitch`（MiniMax 整數音高，−12 到 12；小數值會被截斷）
- `emotion`（Volcengine 情緒標籤）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**完全停用模型覆寫：**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**允許切換提供者，同時保留其他旋鈕可設定：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash 指令

單一指令 `/tts`。在 Discord 上，OpenClaw 也會註冊 `/voice`，因為
`/tts` 是內建的 Discord 指令 — 文字 `/tts ...` 仍可運作。

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
指令需要授權的傳送者（套用允許清單/擁有者規則），且必須啟用
`commands.text` 或原生指令註冊。
</Note>

行為備註：

- `/tts on` 會將本機 TTS 偏好設定寫入 `always`；`/tts off` 會將其寫入 `off`。
- `/tts chat on|off|default` 會為目前聊天寫入工作階段範圍的自動 TTS 覆寫。
- `/tts persona <id>` 會寫入本機角色偏好設定；`/tts persona off` 會清除它。
- `/tts latest` 會從目前工作階段轉錄中讀取最新的助理回覆，並將其作為音訊傳送一次。它只會在工作階段項目上儲存該回覆的雜湊，以抑制重複語音傳送。
- `/tts audio` 會產生一次性的音訊回覆（**不會**開啟 TTS）。
- `limit` 和 `summary` 會儲存在**本機偏好設定**中，而不是主設定。
- `/tts status` 會包含最新嘗試的備援診斷 — `Fallback: <primary> -> <used>`、`Attempts: ...`，以及每次嘗試的詳細資料（`provider:outcome(reasonCode) latency`）。
- `/status` 會在啟用 TTS 時顯示作用中的 TTS 模式，以及已設定的提供者、模型、語音和已清理的自訂端點中繼資料。

## 每位使用者偏好設定

Slash 指令會將本機覆寫寫入 `prefsPath`。預設為
`~/.openclaw/settings/tts.json`；可用 `OPENCLAW_TTS_PREFS` 環境變數
或 `messages.tts.prefsPath` 覆寫。

| 儲存欄位    | 效果                                            |
| ------------ | ----------------------------------------------- |
| `auto`       | 本機自動 TTS 覆寫（`always`、`off`、…）        |
| `provider`   | 本機主要提供者覆寫                              |
| `persona`    | 本機角色覆寫                                    |
| `maxLength`  | 摘要門檻（預設 `1500` 字元）                   |
| `summarize`  | 摘要切換（預設 `true`）                        |

這些會覆寫來自 `messages.tts` 加上該主機作用中
`agents.list[].tts` 區塊的有效設定。

## 輸出格式（固定）

TTS 語音傳遞由頻道能力驅動。頻道 Plugin 會宣告語音風格的 TTS 是否應要求提供者使用原生 `voice-note` 目標，或保留一般 `audio-file` 合成，並只將相容的輸出標記為語音傳遞。

- **支援語音備註的通道**：語音備註回覆優先使用 Opus（ElevenLabs 的 `opus_48000_64`、OpenAI 的 `opus`）。
  - 48kHz / 64kbps 是語音訊息的良好取捨。
- **Feishu / WhatsApp**：當語音備註回覆產生為 MP3/WebM/WAV/M4A
  或其他可能的音訊檔案時，通道 Plugin 會先用 `ffmpeg` 將其轉碼為 48kHz
  Ogg/Opus，再傳送原生語音訊息。WhatsApp 會透過 Baileys `audio` payload 傳送
  結果，並使用 `ptt: true` 和 `audio/ogg; codecs=opus`。如果轉換失敗，Feishu 會收到原始
  檔案作為附件；WhatsApp 傳送會失敗，而不是張貼不相容的
  PTT payload。
- **BlueBubbles**：讓供應商合成維持在一般音訊檔案路徑；MP3
  和 CAF 輸出會標記為用於 iMessage 語音備忘錄傳送。
- **其他通道**：MP3（ElevenLabs 的 `mp3_44100_128`、OpenAI 的 `mp3`）。
  - 44.1kHz / 128kbps 是語音清晰度的預設平衡。
- **MiniMax**：一般音訊附件使用 MP3（`speech-2.8-hd` 模型，32kHz 取樣率）。對於通道宣告的語音備註目標，若通道宣告支援轉碼，OpenClaw 會在傳送前使用 `ffmpeg` 將 MiniMax MP3 轉碼為 48kHz Opus。
- **Xiaomi MiMo**：預設使用 MP3，設定時可使用 WAV。對於通道宣告的語音備註目標，若通道宣告支援轉碼，OpenClaw 會在傳送前使用 `ffmpeg` 將 Xiaomi 輸出轉碼為 48kHz Opus。
- **本機 CLI**：使用已設定的 `outputFormat`。語音備註目標會
  轉換為 Ogg/Opus，電話語音輸出則會使用 `ffmpeg` 轉換為原始 16 kHz 單聲道 PCM。
- **Google Gemini**：Gemini API TTS 會回傳原始 24kHz PCM。OpenClaw 會將它包裝為 WAV 用於音訊附件、轉碼為 48kHz Opus 用於語音備註目標，並直接回傳 PCM 用於 Talk/電話語音。
- **Gradium**：音訊附件使用 WAV，語音備註目標使用 Opus，電話語音使用 8 kHz 的 `ulaw_8000`。
- **Inworld**：一般音訊附件使用 MP3，語音備註目標使用原生 `OGG_OPUS`，Talk/電話語音使用 22050 Hz 的原始 `PCM`。
- **xAI**：預設使用 MP3；`responseFormat` 可為 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批次 REST TTS endpoint，並回傳完整音訊附件；此供應商路徑不使用 xAI 的串流 TTS WebSocket。此路徑不支援原生 Opus 語音備註格式。
- **Microsoft**：使用 `microsoft.outputFormat`（預設為 `audio-24khz-48kbitrate-mono-mp3`）。
  - 內建 transport 接受 `outputFormat`，但服務不一定提供所有格式。
  - 輸出格式值遵循 Microsoft Speech 輸出格式（包含 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果需要
    保證使用 Opus 語音訊息，請使用 OpenAI/ElevenLabs。
  - 如果已設定的 Microsoft 輸出格式失敗，OpenClaw 會以 MP3 重試。

OpenAI/ElevenLabs 輸出格式會依通道固定（見上方）。

## 自動 TTS 行為

啟用 `messages.tts.auto` 時，OpenClaw 會：

- 如果回覆已包含媒體或 `MEDIA:` 指令，則略過 TTS。
- 略過很短的回覆（少於 10 個字元）。
- 啟用摘要時，使用
  `summaryModel`（或 `agents.defaults.model.primary`）摘要長回覆。
- 將產生的音訊附加到回覆。
- 在 `mode: "final"` 中，文字串流完成後，仍會為串流的最終回覆傳送純音訊 TTS；
  產生的媒體會經過與一般回覆附件相同的
  通道媒體正規化。

如果回覆超過 `maxLength`，且摘要已關閉（或摘要模型沒有 API 金鑰），
則會略過音訊並傳送一般文字回覆。

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## 依通道區分的輸出格式

  | 目標                                  | 格式                                                                                                                                     |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | 語音筆記回覆偏好使用 **Opus**（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。48 kHz / 64 kbps 可平衡清晰度與大小。 |
  | 其他頻道                              | **MP3**（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。44.1 kHz / 128 kbps 是語音預設值。                                 |
  | Talk / 電話                           | 供應商原生 **PCM**（Inworld 22050 Hz，Google 24 kHz），或 Gradium 的 `ulaw_8000` 用於電話。                                 |

  各供應商注意事項：

  - **Feishu / WhatsApp 轉碼：** 當語音筆記回覆以 MP3/WebM/WAV/M4A 到達時，頻道 Plugin 會使用 `ffmpeg` 轉碼為 48 kHz Ogg/Opus。WhatsApp 會透過 Baileys 以 `ptt: true` 和 `audio/ogg; codecs=opus` 傳送。如果轉換失敗：Feishu 會退回附加原始檔案；WhatsApp 傳送會失敗，而不是發布不相容的 PTT 酬載。
  - **MiniMax / Xiaomi MiMo：** 預設 MP3（MiniMax `speech-2.8-hd` 為 32 kHz）；透過 `ffmpeg` 為語音筆記目標轉碼為 48 kHz Opus。
  - **本機 CLI：** 使用設定的 `outputFormat`。語音筆記目標會轉換為 Ogg/Opus，電話輸出會轉換為原始 16 kHz 單聲道 PCM。
  - **Google Gemini：** 傳回原始 24 kHz PCM。OpenClaw 會包裝為 WAV 供附件使用、為語音筆記目標轉碼為 48 kHz Opus，並針對 Talk/電話直接傳回 PCM。
  - **Inworld：** MP3 附件、原生 `OGG_OPUS` 語音筆記、Talk/電話使用原始 `PCM` 22050 Hz。
  - **xAI：** 預設為 MP3；`responseFormat` 可以是 `mp3|wav|pcm|mulaw|alaw`。使用 xAI 的批次 REST 端點 — **不** 使用串流 WebSocket TTS。不支援原生 Opus 語音筆記格式。
  - **Microsoft：** 使用 `microsoft.outputFormat`（預設 `audio-24khz-48kbitrate-mono-mp3`）。Telegram `sendVoice` 接受 OGG/MP3/M4A；如果需要保證 Opus 語音訊息，請使用 OpenAI/ElevenLabs。如果設定的 Microsoft 格式失敗，OpenClaw 會以 MP3 重試。

  OpenAI 和 ElevenLabs 的輸出格式會依上述各頻道固定。

  ## 欄位參考

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自動 TTS 模式。`inbound` 只會在收到入站語音訊息後傳送音訊；`tagged` 只會在回覆包含 `[[tts:...]]` 指令或 `[[tts:text]]` 區塊時傳送音訊。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      舊版切換項。`openclaw doctor --fix` 會將其遷移到 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` 除了最終回覆，也包含工具/區塊回覆。
    </ParamField>
    <ParamField path="provider" type="string">
      語音供應商 ID。未設定時，OpenClaw 會使用登錄檔自動選取順序中的第一個已設定供應商。舊版 `provider: "edge"` 會由 `openclaw doctor --fix` 重寫為 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      來自 `personas` 的作用中 persona ID。會正規化為小寫。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      穩定的口語身分。欄位：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。請參閱 [Personas](#personas)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用於自動摘要的廉價模型；預設為 `agents.defaults.model.primary`。接受 `provider/model` 或已設定的模型別名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允許模型發出 TTS 指令。`enabled` 預設為 `true`；`allowProvider` 預設為 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      由供應商擁有、以語音供應商 ID 作為鍵的設定。舊版直接區塊（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）會由 `openclaw doctor --fix` 重寫；只提交 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 輸入字元數的硬性上限。`/tts audio` 會在超過時失敗。
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      請求逾時時間，單位為毫秒。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆寫本機偏好設定 JSON 路徑（供應商/限制/摘要）。預設 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 區域（例如 `eastus`）。Env：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">選用的 Azure Speech 端點覆寫（別名 `baseUrl`）。</ParamField>
    <ParamField path="voice" type="string">Azure 語音 ShortName。預設 `en-US-JennyNeural`。</ParamField>
    <ParamField path="lang" type="string">SSML 語言代碼。預設 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">標準音訊的 Azure `X-Microsoft-OutputFormat`。預設 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">語音筆記輸出的 Azure `X-Microsoft-OutputFormat`。預設 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">退回使用 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 ID（例如 `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs 語音 ID。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（各為 `0..1`）、`useSpeakerBoost`（`true|false`）、`speed`（`0.5..2.0`，`1.0` = 正常）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文字正規化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 字母 ISO 639-1（例如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">整數 `0..4294967295`，用於盡力提供確定性。</ParamField>
    <ParamField path="baseUrl" type="string">覆寫 ElevenLabs API 基底 URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">退回使用 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。若省略，TTS 可以在退回 env 前重用 `models.providers.google.apiKey`。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。預設 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="voiceName" type="string">Gemini 預建語音名稱。預設 `Kore`。別名：`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">在口說文字前加上的自然語言風格提示。</ParamField>
    <ParamField path="speakerName" type="string">當你的提示使用具名說話者時，在口說文字前加上的選用說話者標籤。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>設定為 `audio-profile-v1`，以確定性的 Gemini TTS 提示結構包裝作用中 persona 提示欄位。</ParamField>
    <ParamField path="personaPrompt" type="string">附加到範本 Director's Notes 的 Google 專用額外 persona 提示文字。</ParamField>
    <ParamField path="baseUrl" type="string">只接受 `https://generativelanguage.googleapis.com`。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">環境變數：`GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.gradium.ai`。</ParamField>
    <ParamField path="voiceId" type="string">預設為 Emma (`YTpq7expH9539ERJ`)。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld 主要設定

    <ParamField path="apiKey" type="string">環境變數：`INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">預設為 `inworld-tts-1.5-max`。另有：`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="voiceId" type="string">預設為 `Sarah`。</ParamField>
    <ParamField path="temperature" type="number">取樣溫度 `0..2`。</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS 的本機可執行檔或命令字串。</ParamField>
    <ParamField path="args" type="string[]">命令引數。支援 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 預留位置。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>預期的 CLI 輸出格式。音訊附件預設為 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令逾時時間，單位為毫秒。預設為 `120000`。</ParamField>
    <ParamField path="cwd" type="string">選用的命令工作目錄。</ParamField>
    <ParamField path="env" type="Record<string, string>">命令的選用環境覆寫。</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">允許使用 Microsoft 語音。</ParamField>
    <ParamField path="voice" type="string">Microsoft neural voice 名稱（例如 `en-US-MichelleNeural`）。</ParamField>
    <ParamField path="lang" type="string">語言代碼（例如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 輸出格式。預設為 `audio-24khz-48kbitrate-mono-mp3`。隨附的 Edge 後端傳輸不支援所有格式。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字串（例如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">在音訊檔案旁寫入 JSON 字幕。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 語音請求的 Proxy URL。</ParamField>
    <ParamField path="timeoutMs" type="number">請求逾時覆寫（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>舊版別名。執行 `openclaw doctor --fix`，將持久化設定重寫為 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">會退回使用 `MINIMAX_API_KEY`。Token Plan 驗證可透過 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.minimax.io`。環境變數：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">預設為 `speech-2.8-hd`。環境變數：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="voiceId" type="string">預設為 `English_expressive_narrator`。環境變數：`MINIMAX_TTS_VOICE_ID`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。預設為 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。預設為 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整數 `-12..12`。預設為 `0`。小數值會在請求前被截斷。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">會退回使用 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 ID（例如 `gpt-4o-mini-tts`）。</ParamField>
    <ParamField path="voice" type="string">語音名稱（例如 `alloy`、`cedar`）。</ParamField>
    <ParamField path="instructions" type="string">明確的 OpenAI `instructions` 欄位。設定後，角色提示欄位**不會**自動對應。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">在產生的 OpenAI TTS 欄位之後，合併到 `/audio/speech` 請求本文中的額外 JSON 欄位。可用於 OpenAI 相容端點，例如需要 `lang` 等供應商特定鍵的 Kokoro；不安全的 prototype 鍵會被忽略。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆寫 OpenAI TTS 端點。解析順序：設定 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非預設值會被視為 OpenAI 相容的 TTS 端點，因此可接受自訂模型和語音名稱。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">環境變數：`OPENROUTER_API_KEY`。可重複使用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://openrouter.ai/api/v1`。舊版 `https://openrouter.ai/v1` 會被正規化。</ParamField>
    <ParamField path="model" type="string">預設為 `hexgrad/kokoro-82m`。別名：`modelId`。</ParamField>
    <ParamField path="voice" type="string">預設為 `af_alloy`。別名：`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>預設為 `mp3`。</ParamField>
    <ParamField path="speed" type="number">供應商原生速度覆寫。</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">環境變數：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">預設為 `seed-tts-1.0`。環境變數：`VOLCENGINE_TTS_RESOURCE_ID`。當你的專案具備 TTS 2.0 權益時，請使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">App key 標頭。預設為 `aGjiRDfUWi`。環境變數：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆寫 Seed Speech TTS HTTP 端點。環境變數：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="voice" type="string">語音類型。預設為 `en_female_anna_mars_bigtts`。環境變數：`VOLCENGINE_TTS_VOICE`。</ParamField>
    <ParamField path="speedRatio" type="number">供應商原生速度比例。</ParamField>
    <ParamField path="emotion" type="string">供應商原生情緒標籤。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>舊版 Volcengine Speech Console 欄位。環境變數：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（預設為 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">環境變數：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.x.ai/v1`。環境變數：`XAI_BASE_URL`。</ParamField>
    <ParamField path="voiceId" type="string">預設為 `eve`。即時語音：`ara`、`eve`、`leo`、`rex`、`sal`、`una`。</ParamField>
    <ParamField path="language" type="string">BCP-47 語言代碼或 `auto`。預設為 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>預設為 `mp3`。</ParamField>
    <ParamField path="speed" type="number">供應商原生速度覆寫。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">環境變數：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.xiaomimimo.com/v1`。環境變數：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">預設為 `mimo-v2.5-tts`。環境變數：`XIAOMI_TTS_MODEL`。也支援 `mimo-v2-tts`。</ParamField>
    <ParamField path="voice" type="string">預設為 `mimo_default`。環境變數：`XIAOMI_TTS_VOICE`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>預設為 `mp3`。環境變數：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">選用的自然語言風格指示，會以使用者訊息傳送；不會被朗讀。</ParamField>
  </Accordion>
</AccordionGroup>

## 代理工具

`tts` 工具會將文字轉為語音，並回傳音訊附件供回覆傳送使用。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音訊會以語音訊息傳送，而不是檔案附件。當 `ffmpeg` 可用時，Feishu 和 WhatsApp 可在此路徑上轉碼非 Opus 的 TTS 輸出。

WhatsApp 會透過 Baileys 將音訊作為 PTT 語音備註（帶有 `ptt: true` 的 `audio`）傳送，並且會將可見文字與 PTT 音訊**分開**傳送，因為客戶端不一定會一致地在語音備註上呈現字幕。

此工具接受選用的 `channel` 和 `timeoutMs` 欄位；`timeoutMs` 是每次呼叫的供應商請求逾時時間，單位為毫秒。

## Gateway RPC

| 方法              | 用途                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | 讀取目前的 TTS 狀態和上次嘗試。         |
| `tts.enable`      | 將本機自動偏好設定為 `always`。         |
| `tts.disable`     | 將本機自動偏好設定為 `off`。            |
| `tts.convert`     | 一次性文字 → 音訊。                     |
| `tts.setProvider` | 設定本機供應商偏好。                    |
| `tts.setPersona`  | 設定本機角色偏好。                      |
| `tts.providers`   | 列出已設定的供應商和狀態。              |

## 服務連結

- [OpenAI 文字轉語音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 參考](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST 文字轉語音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech 供應商](/zh-TW/providers/azure-speech)
- [ElevenLabs 文字轉語音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 驗證](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/zh-TW/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/zh-TW/providers/volcengine#text-to-speech)
- [Xiaomi MiMo 語音合成](/zh-TW/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 輸出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI 文字轉語音](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 相關

- [媒體概覽](/zh-TW/tools/media-overview)
- [音樂生成](/zh-TW/tools/music-generation)
- [影片生成](/zh-TW/tools/video-generation)
- [Slash commands](/zh-TW/tools/slash-commands)
- [語音通話 Plugin](/zh-TW/plugins/voice-call)

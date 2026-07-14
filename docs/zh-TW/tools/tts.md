---
read_when:
    - 啟用回覆的文字轉語音功能
    - 設定 TTS 提供者、備援鏈或角色設定
    - 使用 /tts 命令或指示詞
sidebarTitle: Text to speech (TTS)
summary: 外送回覆的文字轉語音功能 — 提供者、語音角色、斜線命令與各頻道輸出
title: 文字轉語音
x-i18n:
    generated_at: "2026-07-14T14:12:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw 可透過 **14 個語音供應商**將輸出回覆轉換為音訊：
在 Feishu、Matrix、Telegram 和 WhatsApp 上使用原生語音訊息；在其他各處使用音訊
附件；並為電話與 Talk 提供 PCM/Ulaw 串流。

TTS 是 Talk `stt-tts` 模式的語音輸出部分（`talk.speak` 呼叫也使用
相同的合成路徑）。供應商原生的 `realtime` Talk 工作階段會在即時供應商
內合成語音；`transcription` 工作階段則絕不合成助理語音回覆。

## 快速開始

<Steps>
  <Step title="選擇供應商">
    OpenAI 和 ElevenLabs 是最可靠的託管選項。Microsoft 和
    本機命令列介面無須 API 金鑰即可運作。完整清單請參閱[供應商矩陣](#supported-providers)。
  </Step>
  <Step title="設定 API 金鑰">
    匯出供應商的環境變數（例如 `OPENAI_API_KEY`、
    `ELEVENLABS_API_KEY`）。Microsoft 和本機命令列介面不需要金鑰。
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
    會傳送一次性的音訊回覆。
  </Step>
</Steps>

<Note>
自動 TTS 預設為**關閉**。未設定 `messages.tts.provider` 時，
OpenClaw 會依登錄檔的自動選擇順序，挑選第一個已設定的供應商。
內建的 `tts` 代理程式工具僅供明確意圖使用：一般聊天仍會使用
文字，除非使用者要求音訊、使用 `/tts`，或啟用自動 TTS／指示詞
語音。
</Note>

## 支援的供應商

| 供應商            | 驗證                                                                                                             | 備註                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（亦支援 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`）          | 原生 Ogg/Opus 語音訊息輸出與電話語音。                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | 與 OpenAI 相容的 TTS。預設為 `hexgrad/Kokoro-82M`。                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 或 `XI_API_KEY`                                                                             | 支援語音複製、多語言，並可透過 `seed` 實現確定性；以串流方式供 Discord 語音播放。 |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                                                                             | Gemini API 批次 TTS；可透過 `promptTemplate: "audio-profile-v1"` 感知角色設定。               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 語音訊息與電話語音輸出。                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 串流 TTS API。原生 Opus 語音訊息與 PCM 電話語音。                                |
| **本機命令列介面**     | 無                                                                                                             | 執行已設定的本機 TTS 命令。                                                        |
| **Microsoft**     | 無                                                                                                             | 透過 `node-edge-tts` 使用公用 Edge 神經網路 TTS。盡力提供，不保證服務等級。                            |
| **MiniMax**       | `MINIMAX_API_KEY`（或權杖方案：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）      | T2A v2 API。預設為 `speech-2.8-hd`。                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 也用於自動摘要；支援角色設定 `instructions`。                                |
| **OpenRouter**    | `OPENROUTER_API_KEY`（可重複使用 `models.providers.openrouter.apiKey`）                                            | 預設模型為 `hexgrad/kokoro-82m`。                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（舊版 AppID／權杖：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 共用的圖片、影片與語音供應商。                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 批次 TTS。**不**支援原生 Opus 語音訊息。                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | 透過 Xiaomi 聊天補全使用 MiMo TTS。                                                   |

若已設定多個供應商，會優先使用所選供應商，其他供應商則作為備援選項。
自動摘要會使用 `summaryModel`（或
`agents.defaults.model.primary`），因此若保持啟用摘要，
也必須為該供應商完成驗證。

<Warning>
隨附的 **Microsoft** 供應商會透過 `node-edge-tts` 使用 Microsoft Edge 的線上神經網路 TTS
服務。這是未公布服務等級協議或配額的公用網路服務，
應視為盡力提供。舊版供應商 ID `edge` 會正規化為
`microsoft`，而 `openclaw doctor --fix` 會重寫已保存的
設定；新設定應一律使用 `microsoft`。
</Warning>

## 設定

TTS 設定位於 `~/.openclaw/openclaw.json` 的 `messages.tts` 之下。請選擇
預設範本並調整供應商區塊。以下顯示的 `speakerVoice`/`speakerVoiceId`
欄位是標準欄位；各供應商自己的 `voice`/`voiceId`/
`voiceName` 欄位名稱仍可作為舊版別名使用。

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // 選用的自然語言風格提示詞：
          // audioProfile: "以平靜的 Podcast 主持人口吻說話。",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="本機命令列介面">
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
  <Tab title="Microsoft（無須金鑰）">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

若使用 Xiaomi `mimo-v2.5-tts-voicedesign`，請省略 `speakerVoice`，並將 `style` 設為
語音設計提示詞。OpenClaw 會將該提示詞作為 TTS `user` 訊息傳送，
且不會為 voicedesign 模型傳送 `audio.voice`。

### 每個代理程式的語音覆寫

當某個代理程式需要使用不同的提供者、語音、模型、角色設定或自動 TTS 模式時，請使用 `agents.list[].tts`。代理程式區塊會深度合併並覆寫
`messages.tts`，因此提供者認證資訊可以保留在全域提供者設定中：

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

若要為每個代理程式固定角色設定，請在提供者設定旁設定 `agents.list[].tts.persona`；它只會為該代理程式覆寫全域 `messages.tts.persona`。

自動回覆、`/tts audio`、`/tts status` 與
`tts` 代理程式工具的優先順序：

1. `messages.tts`
2. 作用中的 `agents.list[].tts`
3. 頻道覆寫（當頻道支援 `channels.<channel>.tts` 時）
4. 帳號覆寫（當頻道傳遞 `channels.<channel>.accounts.<id>.tts` 時）
5. 此主機的本機 `/tts` 偏好設定
6. 啟用[模型驅動指令](#model-driven-directives)時的行內 `[[tts:...]]` 指令

頻道與帳號覆寫使用與 `messages.tts` 相同的結構，並會深度合併並覆寫較早的層級，因此共用的提供者認證資訊可保留在
`messages.tts` 中，而頻道或機器人帳號只需變更說話者語音、模型、角色設定或自動模式：

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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## 角色設定

**角色設定**是可在不同提供者間以確定性方式套用的穩定口語身分。它可以偏好某個提供者、定義與提供者無關的提示意圖，並攜帶語音、模型、提示範本、種子及語音設定等提供者專屬繫結。

### 最小角色設定

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "旁白",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### 完整角色設定（與提供者無關的提示）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "冷面而溫暖的英國管家旁白。",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "一位才智出眾的英國管家。冷面、風趣、溫暖、迷人、情感豐富，絕不流於平庸。",
            scene: "寧靜的深夜書房。以近距離收音為可信賴的操作者敘述。",
            sampleContext: "說話者正以簡潔的自信與冷面式溫暖，回答一項私密的技術請求。",
            style: "優雅、內斂，略帶笑意。",
            accent: "英式英語。",
            pacing: "節奏沉穩，穿插短暫的戲劇性停頓。",
            constraints: ["不要朗讀設定值。", "不要解釋角色設定。"],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

### 角色設定解析

作用中的角色設定會以確定性方式選取：

1. 本機 `/tts persona <id>` 偏好設定（若已設定）。
2. `messages.tts.persona`（若已設定）。
3. 無角色設定。

提供者選擇會優先採用明確指定：

1. 直接覆寫（命令列介面、閘道、Talk、允許的 TTS 指令）。
2. 本機 `/tts provider <id>` 偏好設定。
3. 作用中角色設定的 `provider`。
4. `messages.tts.provider`。
5. 登錄檔自動選取。

每次嘗試提供者時，OpenClaw 會依下列順序合併設定：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 受信任的請求覆寫
4. 允許的模型輸出 TTS 指令覆寫

### 提供者如何使用角色設定提示

角色設定提示欄位（`profile`、`scene`、`sampleContext`、`style`、`accent`、
`pacing`、`constraints`）**與提供者無關**。各提供者自行決定如何使用這些欄位：

<AccordionGroup>
  <Accordion title="Google Gemini">
    僅當有效的 Google 提供者設定設置了 `promptTemplate: "audio-profile-v1"`
    或 `personaPrompt` 時，才會將角色設定提示欄位包裝成 Gemini TTS 提示結構。較舊的 `audioProfile` 與 `speakerName` 欄位仍會作為 Google 專屬提示文字加在前方。`[[tts:text]]` 區塊內的
    `[whispers]` 或 `[laughs]` 等行內音訊標籤會保留在 Gemini 逐字稿中；OpenClaw 不會產生這些標籤。
  </Accordion>
  <Accordion title="OpenAI">
    僅當未設定明確的 OpenAI `instructions` 時，才會將角色設定提示欄位對應至請求的 `instructions` 欄位。明確的 `instructions` 一律優先。
  </Accordion>
  <Accordion title="其他提供者">
    僅使用 `personas.<id>.providers.<provider>` 下的提供者專屬角色設定繫結。除非提供者實作自己的角色設定提示對應，否則會忽略角色設定提示欄位。
  </Accordion>
</AccordionGroup>

### 備援政策

`fallbackPolicy` 控制角色設定對嘗試使用的提供者**沒有繫結**時的行為：

| 政策              | 行為                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **預設。**與提供者無關的提示欄位仍可使用；提供者可以使用或忽略它們。                                            |
| `provider-defaults` | 該次嘗試的提示準備會省略角色設定；提供者使用其中性預設值，同時繼續備援至其他提供者。 |
| `fail`              | 以 `reasonCode: "not_configured"` 和 `personaBinding: "missing"` 略過該提供者嘗試。仍會嘗試備援提供者。              |

只有在嘗試的**每個**提供者都被略過或失敗時，整個 TTS 請求才會失敗。

Talk 工作階段的提供者選擇以工作階段為範圍。Talk 用戶端應從 `talk.catalog` 選擇提供者 ID、模型 ID、語音 ID 與地區設定，並透過 Talk 工作階段或交接請求傳遞。開啟語音工作階段不應變更 `messages.tts` 或全域 Talk 提供者預設值。

## 模型驅動指令

預設情況下，助理**可以**輸出 `[[tts:...]]` 指令，為單一回覆覆寫語音、模型或速度，並可選擇加入 `[[tts:text]]...[[/tts:text]]` 區塊，用於只應出現在音訊中的表達提示：

```text
給你。

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]]（笑）再讀一次這首歌。[[/tts:text]]
```

當 `messages.tts.auto` 為 `"tagged"` 時，必須有**指令**才會觸發音訊。串流區塊傳遞會在頻道收到內容之前，從可見文字中移除指令，即使指令被拆分至相鄰區塊也一樣。

除非 `modelOverrides.allowProvider: true`，否則會忽略 `provider=...`。當回覆宣告 `provider=...` 時，該指令中的其他索引鍵只會由該提供者解析；不支援的索引鍵會被移除，並回報為 TTS 指令警告。

**可用的指令索引鍵：**

- `provider`（已登錄的提供者 ID；需要 `allowProvider: true`）
- `speakerVoice` / `speakerVoiceId`（舊版別名：`voice`、`voiceName`、`voice_name`、`google_voice`、`voiceId`）
- `model` / `google_model`
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，`(0, 10]`）
- `pitch`（MiniMax 整數音高，−12 至 12；小數值會被截斷）
- `emotion`（Volcengine 情緒標籤）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**完全停用模型覆寫：**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**允許切換提供者，同時保持其他控制項可設定：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } }
```

## 斜線命令

單一命令 `/tts`。在 Discord 上，OpenClaw 也會登錄 `/voice`，因為
`/tts` 是 Discord 的內建命令；文字 `/tts ...` 仍可使用。

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
命令需要經授權的傳送者（適用允許清單／擁有者規則），而且必須啟用
`commands.text` 或原生命令登錄。
</Note>

行為注意事項：

- `/tts on` 將本機 TTS 偏好設定寫入 `always`；`/tts off` 則寫入 `off`。
- `/tts chat on|off|default` 為目前聊天寫入工作階段範圍的自動 TTS 覆寫。
- `/tts persona <id>` 寫入本機角色設定偏好；`/tts persona off` 會將其清除。
- `/tts latest` 從目前工作階段逐字稿讀取最新的助理回覆，並將其作為音訊傳送一次。它只會在工作階段項目中儲存該回覆的雜湊，以避免重複傳送語音。
- `/tts audio` 產生一次性音訊回覆（**不會**開啟 TTS）。
- `/tts limit <chars>` 接受 **100–4096**（4096 是 Telegram 說明文字／訊息上限）；超出此範圍的值會被拒絕。
- `limit` 與 `summary` 儲存在**本機偏好設定**中，而非主要設定。
- `/tts status` 包含最新嘗試的備援診斷資訊，包括 `Fallback: <primary> -> <used>`、`Attempts: ...`，以及每次嘗試的詳細資料（`provider:outcome(reasonCode) latency`）。
- 啟用 TTS 時，`/status` 會顯示作用中的 TTS 模式，以及已設定的提供者、模型、語音和經清理的自訂端點中繼資料。

## 每位使用者的偏好設定

斜線命令會將本機覆寫寫入 `prefsPath`。預設值為
`~/.openclaw/settings/tts.json`；可使用 `OPENCLAW_TTS_PREFS` 環境變數
或 `messages.tts.prefsPath` 覆寫。

| 儲存的欄位 | 效果                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | 本機自動 TTS 覆寫（`always`、`off`、…）                                     |
| `provider`   | 本機主要供應商覆寫                                                  |
| `persona`    | 本機角色設定覆寫                                                           |
| `maxLength`  | 摘要／截斷閾值（預設 `1500` 個字元，`/tts limit` 範圍為 100–4096） |
| `summarize`  | 摘要開關（預設 `true`）                                                  |

這些設定會覆寫來自 `messages.tts` 的有效設定，以及該主機目前使用中的
`agents.list[].tts` 區塊。

## 輸出格式

TTS 語音傳送由頻道功能決定。頻道外掛會宣告：
語音形式的 TTS 是否應要求供應商提供原生 `voice-note` 目標，或
維持一般的 `audio-file` 合成；以及頻道是否會在傳送前對
非原生輸出進行轉碼。

| 目標                                  | 格式                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 語音訊息回覆偏好使用 **Opus**（ElevenLabs 的 `opus_48000_64`、OpenAI 的 `opus`）。48 kHz / 64 kbps 可兼顧清晰度與檔案大小。 |
| 其他頻道                              | **MP3**（ElevenLabs 的 `mp3_44100_128`、OpenAI 的 `mp3`）。44.1 kHz / 128 kbps 是語音品質與檔案大小的預設平衡。                  |
| Talk / 電話通訊                       | 供應商原生 **PCM**（Inworld 22050 Hz、Google 24 kHz），或使用 Gradium 的 `ulaw_8000` 進行電話通訊。                                 |

各供應商注意事項：

- **Feishu / WhatsApp 轉碼：**當語音訊息回覆產生 MP3/WebM/WAV/M4A 或其他可能的音訊檔案時，頻道外掛會在傳送原生語音訊息前，使用 `ffmpeg`（`libopus`，64 kbps）將其轉碼為 48 kHz Ogg/Opus。WhatsApp 會透過 Baileys 的 `audio` 承載資料傳送結果，並使用 `ptt: true` 和 `audio/ogg; codecs=opus`。轉碼失敗時：Feishu 會攔截錯誤，改以一般附件傳送原始檔案；WhatsApp 沒有後備機制，因此傳送本身會失敗，而不會發布不相容的 PTT 承載資料。
- **MiniMax：**一般音訊附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 取樣率）；對於頻道宣告的語音訊息目標，會使用 `ffmpeg` 轉碼為 48 kHz Opus。
- **Xiaomi MiMo：**預設使用 MP3，設定後也可使用 WAV；對於頻道宣告的語音訊息目標，會使用 `ffmpeg` 轉碼為 48 kHz Opus。
- **本機命令列介面：**使用設定的 `outputFormat`。語音訊息目標會轉換為 Ogg/Opus，電話通訊輸出則會使用 `ffmpeg` 轉換為原始 16 kHz 單聲道 PCM。
- **Google Gemini：**傳回原始 24 kHz PCM。OpenClaw 會將其封裝為 WAV 以用於音訊附件、轉碼為 48 kHz Opus 以用於語音訊息目標，並直接傳回 PCM 以用於 Talk／電話通訊。
- **Gradium：**音訊附件使用 WAV、語音訊息目標使用 Opus，電話通訊則使用 8 kHz 的 `ulaw_8000`。
- **Inworld：**一般音訊附件使用 MP3、語音訊息目標使用原生 `OGG_OPUS`，Talk／電話通訊則使用 22050 Hz 的原始 `PCM`。
- **xAI：**預設使用 MP3；音訊檔案合成的緩衝與串流輸出皆可使用 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。語音訊息目標的串流與緩衝後備輸出均使用 MP3，因為 xAI 的 `pcm`、`mulaw` 和 `alaw` 輸出是不含標頭的原始音訊。緩衝合成使用 xAI 的批次 REST `/v1/tts` 端點；`textToSpeechStream` 使用原生 `wss://api.x.ai/v1/tts`。這不是即時語音合約。不支援原生 Opus 語音訊息格式。
- **Microsoft：**使用 `microsoft.outputFormat`（預設為 `audio-24khz-48kbitrate-mono-mp3`）。
  - 隨附的傳輸層接受 `outputFormat`，但服務不一定提供所有格式。
  - 輸出格式值遵循 Microsoft Speech 輸出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如需確保使用 Opus 語音訊息，請使用 OpenAI/ElevenLabs。
  - 如果設定的 Microsoft 輸出格式失敗，OpenClaw 會改用 MP3 重試。
  - 未設定明確的語音覆寫且使用預設英文語音時，如果回覆文字以 CJK 字元為主，OpenClaw 會自動切換至中文神經網路語音（`zh-CN-XiaoxiaoNeural`、`zh-CN` 地區設定）。

OpenAI 和 ElevenLabs 的輸出格式會依頻道固定為上方所列格式。

## 自動 TTS 行為

啟用 `messages.tts.auto` 時，OpenClaw 會：

- 如果回覆已包含結構化媒體，則略過 TTS。
- 略過非常短的回覆（少於 10 個字元）。
- 啟用摘要時，使用
  `summaryModel`（或 `agents.defaults.model.primary`）摘要長回覆。
- 將產生的音訊附加至回覆。
- 在 `mode: "final"` 中，文字串流完成後，仍會針對串流的最終回覆傳送僅含音訊的 TTS；產生的媒體會經過與一般回覆附件相同的頻道媒體正規化處理。

如果回覆超過 `maxLength`，OpenClaw 絕不會直接略過音訊：

- **啟用摘要**（預設）且摘要模型可用：將文字摘要至約 `maxLength` 個字元，然後合成摘要。
- **停用摘要**、摘要失敗，或沒有摘要模型可用的 API 金鑰：將文字截斷至 `maxLength` 個字元，並合成截斷後的文字。

```text
回覆 -> 已啟用 TTS？
  否  -> 傳送文字
  是 -> 有媒體／內容很短？
          是 -> 傳送文字
          否  -> 長度超過限制？
                   否  -> TTS -> 附加音訊
                   是 -> 摘要已啟用且可用？
                            否  -> 截斷 -> TTS -> 附加音訊
                            是 -> 摘要 -> TTS -> 附加音訊
```

## 欄位參考

<AccordionGroup>
  <Accordion title="頂層 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自動 TTS 模式。`inbound` 僅在收到語音訊息後傳送音訊；`tagged` 僅在回覆包含 `[[tts:...]]` 指令或 `[[tts:text]]` 區塊時傳送音訊。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      舊版切換設定。`openclaw doctor --fix` 會將其遷移至 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` 除了最終回覆外，也包含工具／區塊回覆。
    </ParamField>
    <ParamField path="provider" type="string">
      語音服務供應商 ID。未設定時，OpenClaw 會依登錄檔自動選取順序，使用第一個已設定的服務供應商。舊版 `provider: "edge"` 會由 `openclaw doctor --fix` 重寫為 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      來自 `personas` 的目前角色 ID。會正規化為小寫。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      穩定的語音身分。欄位：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。請參閱[角色](#personas)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用於自動摘要的低成本模型；預設為 `agents.defaults.model.primary`。接受 `provider/model` 或已設定的模型別名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允許模型輸出 TTS 指令。`enabled` 預設為 `true`；`allowProvider` 預設為 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      以語音服務供應商 ID 為索引鍵、由服務供應商擁有的設定。舊版直接區塊（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）會由 `openclaw doctor --fix` 重寫；請只提交 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS 輸入字元數的硬性上限。超過時，`/tts audio`、`tts.convert` 和 `tts.speak` 會失敗。
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      請求逾時時間，以毫秒為單位。若已設定每次呼叫的 `timeoutMs`（代理程式工具、閘道），則以其為準；否則，明確設定的 `messages.tts.timeoutMs` 優先於任何由外掛提供的服務供應商預設值。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆寫本機偏好設定 JSON 路徑（服務供應商／限制／摘要）。預設為 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">環境變數：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 區域（例如 `eastus`）。環境變數：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">選用的 Azure Speech 端點覆寫（別名 `baseUrl`）。</ParamField>
    <ParamField path="speakerVoice" type="string">Azure 語音 ShortName。預設為 `en-US-JennyNeural`。舊版別名：`voice`。</ParamField>
    <ParamField path="lang" type="string">SSML 語言代碼。預設為 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">標準音訊使用的 Azure `X-Microsoft-OutputFormat`。預設為 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">語音留言輸出使用的 Azure `X-Microsoft-OutputFormat`。預設為 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">後援使用 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 ID。預設為 `eleven_multilingual_v2`。舊版 ID `eleven_turbo_v2_5`/`eleven_turbo_v2` 會正規化為相符的 `flash` 模型。</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs 語音 ID。預設為 `pMsXgVXv3BLzUgSXRplE`。舊版別名：`voiceId`。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（各為 `0..1`，預設值為 `0.5`/`0.75`/`0`）、`useSpeakerBoost`（`true|false`，預設值為 `true`）、`speed`（`0.5..2.0`，預設值為 `1.0`）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文字正規化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 字母 ISO 639-1（例如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">用於盡可能實現確定性的整數 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">覆寫 ElevenLabs API 基底 URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">回退使用 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。若省略，TTS 可在回退至環境變數前重用 `models.providers.google.apiKey`。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。預設為 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini 預建語音名稱。預設為 `Kore`。舊版別名：`voiceName`、`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">附加於語音文字前的自然語言風格提示。</ParamField>
    <ParamField path="speakerName" type="string">當提示使用具名說話者時，可選擇附加於語音文字前的說話者標籤。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>設為 `audio-profile-v1`，以確定性的 Gemini TTS 提示結構包裝作用中的角色提示欄位。</ParamField>
    <ParamField path="personaPrompt" type="string">附加至範本 Director's Notes 的 Google 專用額外角色提示文字。</ParamField>
    <ParamField path="baseUrl" type="string">僅接受 `https://generativelanguage.googleapis.com`。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">環境變數：`GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">位於 `api.gradium.ai` 的 HTTPS Gradium API URL。預設為 `https://api.gradium.ai`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">預設為 Emma（`YTpq7expH9539ERJ`）。舊版別名：`voiceId`。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld 主要設定

    <ParamField path="apiKey" type="string">環境變數：`INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">預設為 `inworld-tts-1.5-max`。亦可使用：`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">預設為 `Sarah`。舊版別名：`voiceId`。</ParamField>
    <ParamField path="temperature" type="number">取樣溫度 `0..2`（不含 0）。</ParamField>

  </Accordion>

  <Accordion title="本機命令列介面 (tts-local-cli)">
    <ParamField path="command" type="string">用於命令列介面 TTS 的本機可執行檔或命令字串。</ParamField>
    <ParamField path="args" type="string[]">命令引數。支援 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 預留位置。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>預期的命令列介面輸出格式。音訊附件預設為 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令逾時時間（毫秒）。預設為 `120000`。</ParamField>
    <ParamField path="cwd" type="string">可選的命令工作目錄。</ParamField>
    <ParamField path="env" type="Record<string, string>">命令的可選環境變數覆寫。</ParamField>

    命令標準輸出與產生或轉換後的音訊上限為 50 MiB。診斷標準錯誤輸出上限為 1 MiB。任一限制遭超過時，OpenClaw 會終止命令並讓合成失敗。

  </Accordion>

  <Accordion title="Microsoft（不需 API 金鑰）">
    <ParamField path="enabled" type="boolean" default="true">允許使用 Microsoft 語音。</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft 神經語音名稱（例如 `en-US-MichelleNeural`）。舊版別名：`voice`。若使用預設英文語音且回覆文字主要為 CJK 字元，OpenClaw 會自動切換至 `zh-CN-XiaoxiaoNeural`。</ParamField>
    <ParamField path="lang" type="string">語言代碼（例如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 輸出格式。預設為 `audio-24khz-48kbitrate-mono-mp3`。隨附的 Edge 後端傳輸不支援所有格式。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字串（例如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">在音訊檔案旁寫入 JSON 字幕。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 語音請求的 Proxy URL。</ParamField>
    <ParamField path="timeoutMs" type="number">請求逾時覆寫值（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>舊版別名。執行 `openclaw doctor --fix`，將持久化設定重寫為 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">回退使用 `MINIMAX_API_KEY`。透過 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY` 進行 Token Plan 驗證。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.minimax.io`。環境變數：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">預設為 `speech-2.8-hd`。環境變數：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">預設為 `English_expressive_narrator`。環境變數：`MINIMAX_TTS_VOICE_ID`。舊版別名：`voiceId`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。預設為 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。預設為 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整數 `-12..12`。預設為 `0`。小數值會在請求前截斷。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">回退使用 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 ID。預設為 `gpt-4o-mini-tts`。</ParamField>
    <ParamField path="speakerVoice" type="string">語音名稱（例如 `alloy`、`cedar`）。預設為 `coral`。舊版別名：`voice`。</ParamField>
    <ParamField path="instructions" type="string">明確的 OpenAI `instructions` 欄位。設定後，角色提示欄位**不會**自動對應。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">在產生的 OpenAI TTS 欄位之後，合併至 `/audio/speech` 請求本文的額外 JSON 欄位。可用於 Kokoro 等需要 `lang` 之類供應商專用金鑰的 OpenAI 相容端點；不安全的原型金鑰會遭忽略。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆寫 OpenAI TTS 端點。解析順序：設定 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非預設值會視為 OpenAI 相容的 TTS 端點，因此可接受自訂模型與語音名稱，且 `speed` 不再進行 `0.25..4.0` 範圍檢查。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">環境變數：`OPENROUTER_API_KEY`。可重用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://openrouter.ai/api/v1`。舊版 `https://openrouter.ai/v1` 會正規化。</ParamField>
    <ParamField path="model" type="string">預設為 `hexgrad/kokoro-82m`。別名：`modelId`。</ParamField>
    <ParamField path="speakerVoice" type="string">預設為 `af_alloy`。舊版別名：`voice`、`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>預設為 `mp3`。</ParamField>
    <ParamField path="speed" type="number">供應商原生的速度覆寫值。</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">環境變數：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">預設為 `seed-tts-1.0`。環境變數：`VOLCENGINE_TTS_RESOURCE_ID`。當你的專案具有 TTS 2.0 使用權限時，請使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">應用程式金鑰標頭。預設為 `aGjiRDfUWi`。環境變數：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆寫 Seed Speech TTS HTTP 端點。環境變數：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="speakerVoice" type="string">語音類型。預設為 `en_female_anna_mars_bigtts`。環境變數：`VOLCENGINE_TTS_VOICE`。舊版別名：`voice`。</ParamField>
    <ParamField path="speedRatio" type="number">供應商原生速度比例，`0.2..3`。</ParamField>
    <ParamField path="emotion" type="string">供應商原生情緒標籤。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>舊版 Volcengine Speech Console 欄位。環境變數：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（預設為 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">環境變數：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.x.ai/v1`。環境變數：`XAI_BASE_URL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">預設為 `eve`。具有驗證資訊時，`openclaw infer tts voices --provider xai` 會擷取目前的內建目錄；沒有驗證資訊時，則列出離線回退項目 `ara`、`eve`、`leo`、`rex` 及 `sal`。即使帳戶自訂語音 ID 不在內建清單中，也會照常轉送。舊版別名：`voiceId`。</ParamField>
    <ParamField path="language" type="string">BCP-47 語言代碼或 `auto`。預設為 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>預設為 `mp3`。</ParamField>
    <ParamField path="speed" type="number">供應商原生的速度覆寫值，`0.7..1.5`。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">環境變數：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">預設為 `https://api.xiaomimimo.com/v1`。環境變數：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">預設為 `mimo-v2.5-tts`。環境變數：`XIAOMI_TTS_MODEL`。亦支援 `mimo-v2-tts` 和 `mimo-v2.5-tts-voicedesign`。</ParamField>
    <ParamField path="speakerVoice" type="string">預設語音模型的預設值為 `mimo_default`。環境變數：`XIAOMI_TTS_VOICE`。舊版別名：`voice`。使用 `mimo-v2.5-tts-voicedesign` 時不會傳送。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>預設為 `mp3`。環境變數：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">以使用者訊息傳送的可選自然語言風格指示；不會朗讀。對於 `mimo-v2.5-tts-voicedesign`，這是語音設計提示；省略時，OpenClaw 會提供預設值。</ParamField>
  </Accordion>
</AccordionGroup>

## Agent 工具

`tts` 工具會將文字轉換為語音，並傳回音訊附件以供
傳遞回覆。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音訊會
以語音訊息而非檔案附件傳遞。當 `ffmpeg` 可用時，Feishu 和
WhatsApp 可在此路徑上對非 Opus TTS 輸出進行轉碼。

WhatsApp 會透過 Baileys 將音訊作為 PTT 語音留言傳送（`audio` 搭配
`ptt: true`），並將可見文字與 PTT 音訊**分開**傳送，因為
用戶端無法一致地在語音留言上顯示說明文字。

此工具接受可選的 `channel` 和 `timeoutMs` 欄位；`timeoutMs` 是
每次呼叫的供應商請求逾時時間（毫秒）。每次呼叫的值會覆寫
`messages.tts.timeoutMs`；已設定的 TTS 逾時時間會覆寫任何由外掛指定的
供應商預設值。

## 閘道 RPC

| 方法              | 用途                                         |
| ----------------- | -------------------------------------------- |
| `tts.status`      | 讀取目前的 TTS 狀態與上次嘗試。              |
| `tts.enable`      | 將本機自動偏好設定為 `always`。    |
| `tts.disable`     | 將本機自動偏好設定為 `off`。       |
| `tts.convert`     | 單次將文字轉換為音訊。                       |
| `tts.setProvider` | 設定本機供應商偏好。                         |
| `tts.personas`    | 列出已設定的角色與目前啟用的角色。           |
| `tts.setPersona`  | 設定本機角色偏好。                           |
| `tts.providers`   | 列出已設定的供應商及其狀態。                 |

## 服務連結

- [OpenAI 文字轉語音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 參考文件](https://platform.openai.com/docs/api-reference/audio)
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

## 相關內容

- [媒體概覽](/zh-TW/tools/media-overview)
- [音樂生成](/zh-TW/tools/music-generation)
- [影片生成](/zh-TW/tools/video-generation)
- [斜線命令](/zh-TW/tools/slash-commands)
- [語音通話外掛](/zh-TW/plugins/voice-call)

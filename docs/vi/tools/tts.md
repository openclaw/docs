---
read_when:
    - Bật tính năng chuyển văn bản thành giọng nói cho câu trả lời
    - Cấu hình nhà cung cấp TTS, chuỗi dự phòng hoặc nhân cách
    - Sử dụng lệnh hoặc chỉ thị /tts
sidebarTitle: Text to speech (TTS)
summary: Chuyển văn bản thành giọng nói cho phản hồi gửi đi — nhà cung cấp, persona, lệnh gạch chéo và đầu ra theo từng kênh
title: Chuyển văn bản thành giọng nói
x-i18n:
    generated_at: "2026-04-29T23:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw có thể chuyển đổi các phản hồi gửi đi thành âm thanh qua **14 nhà cung cấp giọng nói**
và gửi tin nhắn thoại gốc trên Feishu, Matrix, Telegram và WhatsApp,
tệp đính kèm âm thanh ở mọi nơi khác, cùng luồng PCM/Ulaw cho điện thoại và Talk.

## Bắt đầu nhanh

<Steps>
  <Step title="Chọn một nhà cung cấp">
    OpenAI và ElevenLabs là các tùy chọn được lưu trữ đáng tin cậy nhất. Microsoft và
    Local CLI hoạt động mà không cần khóa API. Xem [ma trận nhà cung cấp](#supported-providers)
    để biết danh sách đầy đủ.
  </Step>
  <Step title="Đặt khóa API">
    Xuất biến môi trường cho nhà cung cấp của bạn (ví dụ `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft và Local CLI không cần khóa.
  </Step>
  <Step title="Bật trong cấu hình">
    Đặt `messages.tts.auto: "always"` và `messages.tts.provider`:

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
  <Step title="Thử trong cuộc trò chuyện">
    `/tts status` hiển thị trạng thái hiện tại. `/tts audio Hello from OpenClaw`
    gửi một phản hồi âm thanh dùng một lần.
  </Step>
</Steps>

<Note>
Auto-TTS mặc định **tắt**. Khi chưa đặt `messages.tts.provider`,
OpenClaw chọn nhà cung cấp đã cấu hình đầu tiên theo thứ tự tự động chọn của registry.
</Note>

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp      | Xác thực                                                                                                         | Ghi chú                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (cũng có `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | Đầu ra ghi chú thoại Ogg/Opus gốc và điện thoại.                         |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS tương thích OpenAI. Mặc định là `hexgrad/Kokoro-82M`.                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` hoặc `XI_API_KEY`                                                                           | Nhân bản giọng nói, đa ngôn ngữ, xác định qua `seed`.                    |
| **Google Gemini** | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`                                                                           | TTS Gemini API; nhận biết persona qua `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Đầu ra ghi chú thoại và điện thoại.                                      |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS truyền trực tuyến. Ghi chú thoại Opus gốc và điện thoại PCM.     |
| **Local CLI**     | không có                                                                                                         | Chạy lệnh TTS cục bộ đã cấu hình.                                       |
| **Microsoft**     | không có                                                                                                         | TTS thần kinh Edge công khai qua `node-edge-tts`. Nỗ lực tối đa, không có SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (hoặc Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)    | API T2A v2. Mặc định là `speech-2.8-hd`.                                 |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Cũng dùng cho tóm tắt tự động; hỗ trợ persona `instructions`.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (có thể tái sử dụng `models.providers.openrouter.apiKey`)                                   | Mô hình mặc định `hexgrad/kokoro-82m`.                                   |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` hoặc `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token cũ: `VOLCENGINE_TTS_APPID`/`_TOKEN`)   | API HTTP BytePlus Seed Speech.                                           |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Nhà cung cấp hình ảnh, video và giọng nói dùng chung.                    |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS theo lô của xAI. Ghi chú thoại Opus gốc **không** được hỗ trợ.       |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS thông qua completions trò chuyện của Xiaomi.                    |

Nếu nhiều nhà cung cấp được cấu hình, nhà cung cấp đã chọn sẽ được dùng trước và
các nhà cung cấp còn lại là tùy chọn dự phòng. Tóm tắt tự động dùng `summaryModel` (hoặc
`agents.defaults.model.primary`), vì vậy nhà cung cấp đó cũng phải được xác thực
nếu bạn tiếp tục bật tóm tắt.

<Warning>
Nhà cung cấp **Microsoft** đi kèm sử dụng dịch vụ TTS neural trực tuyến của Microsoft Edge
thông qua `node-edge-tts`. Đây là một dịch vụ web công khai không có
SLA hoặc hạn mức được công bố — hãy xem là dịch vụ theo nỗ lực tối đa. id nhà cung cấp cũ `edge` được
chuẩn hóa thành `microsoft` và `openclaw doctor --fix` sẽ viết lại cấu hình
đã lưu; cấu hình mới phải luôn dùng `microsoft`.
</Warning>

## Cấu hình

Cấu hình TTS nằm trong `messages.tts` ở `~/.openclaw/openclaw.json`. Chọn một
preset và điều chỉnh khối nhà cung cấp:

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
  <Tab title="Microsoft (no key)">
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

### Ghi đè giọng nói theo từng agent

Dùng `agents.list[].tts` khi một agent cần phát thoại bằng nhà cung cấp,
giọng nói, model, persona hoặc chế độ auto-TTS khác. Khối agent được trộn sâu lên trên
`messages.tts`, nên thông tin xác thực của nhà cung cấp có thể giữ trong cấu hình nhà cung cấp toàn cục:

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

Để ghim persona theo từng agent, đặt `agents.list[].tts.persona` cùng với cấu hình
nhà cung cấp — nó chỉ ghi đè `messages.tts.persona` toàn cục cho agent đó.

Thứ tự ưu tiên cho trả lời tự động, `/tts audio`, `/tts status`, và công cụ agent
`tts`:

1. `messages.tts`
2. `agents.list[].tts` đang hoạt động
3. ghi đè kênh, khi kênh hỗ trợ `channels.<channel>.tts`
4. ghi đè tài khoản, khi kênh truyền `channels.<channel>.accounts.<id>.tts`
5. tùy chọn `/tts` cục bộ cho máy chủ này
6. chỉ thị nội dòng `[[tts:...]]` khi bật [ghi đè do model điều khiển](#model-driven-directives)

Các ghi đè theo kênh và tài khoản dùng cùng cấu trúc với `messages.tts` và
hợp nhất sâu lên các lớp trước đó, vì vậy thông tin xác thực nhà cung cấp dùng
chung có thể nằm trong `messages.tts` trong khi một kênh hoặc tài khoản bot chỉ
thay đổi giọng nói, mô hình, chân dung, hoặc chế độ tự động:

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

## Chân dung

Một **chân dung** là một danh tính giọng nói ổn định có thể được áp dụng một cách
xác định trên nhiều nhà cung cấp. Nó có thể ưu tiên một nhà cung cấp, định nghĩa
ý định lời nhắc trung lập với nhà cung cấp, và mang các liên kết riêng theo nhà
cung cấp cho giọng nói, mô hình, mẫu lời nhắc, seed, và thiết lập giọng nói.

### Chân dung tối thiểu

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

### Chân dung đầy đủ (lời nhắc trung lập với nhà cung cấp)

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

### Phân giải chân dung

Chân dung đang hoạt động được chọn một cách xác định:

1. Tùy chọn cục bộ `/tts persona <id>`, nếu đã đặt.
2. `messages.tts.persona`, nếu đã đặt.
3. Không có chân dung.

Việc chọn nhà cung cấp chạy theo thứ tự ưu tiên rõ ràng trước:

1. Ghi đè trực tiếp (CLI, gateway, Talk, chỉ thị TTS được phép).
2. Tùy chọn cục bộ `/tts provider <id>`.
3. `provider` của chân dung đang hoạt động.
4. `messages.tts.provider`.
5. Tự động chọn từ registry.

Với mỗi lần thử nhà cung cấp, OpenClaw hợp nhất cấu hình theo thứ tự này:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Ghi đè yêu cầu tin cậy
4. Ghi đè chỉ thị TTS do mô hình phát ra được phép

### Cách nhà cung cấp dùng lời nhắc chân dung

Các trường lời nhắc chân dung (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) là **trung lập với nhà cung cấp**. Mỗi nhà cung cấp quyết định
cách dùng chúng:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Bọc các trường lời nhắc chân dung trong cấu trúc lời nhắc Gemini TTS **chỉ khi**
    cấu hình nhà cung cấp Google có hiệu lực đặt `promptTemplate: "audio-profile-v1"`
    hoặc `personaPrompt`. Các trường cũ hơn `audioProfile` và `speakerName` vẫn
    được thêm vào đầu dưới dạng văn bản lời nhắc riêng cho Google. Các thẻ âm thanh
    nội tuyến như `[whispers]` hoặc `[laughs]` bên trong khối `[[tts:text]]` được giữ
    nguyên trong bản ghi Gemini; OpenClaw không tạo các thẻ này.
  </Accordion>
  <Accordion title="OpenAI">
    Ánh xạ các trường lời nhắc chân dung vào trường `instructions` của yêu cầu **chỉ khi**
    không có `instructions` OpenAI rõ ràng nào được cấu hình. `instructions` rõ ràng
    luôn thắng.
  </Accordion>
  <Accordion title="Nhà cung cấp khác">
    Chỉ dùng các liên kết chân dung riêng theo nhà cung cấp bên dưới
    `personas.<id>.providers.<provider>`. Các trường lời nhắc chân dung bị bỏ qua
    trừ khi nhà cung cấp triển khai ánh xạ lời nhắc chân dung riêng.
  </Accordion>
</AccordionGroup>

### Chính sách dự phòng

`fallbackPolicy` kiểm soát hành vi khi một chân dung **không có liên kết** cho
nhà cung cấp được thử:

| Chính sách          | Hành vi                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Mặc định.** Các trường lời nhắc trung lập với nhà cung cấp vẫn khả dụng; nhà cung cấp có thể dùng hoặc bỏ qua chúng.                          |
| `provider-defaults` | Chân dung bị bỏ khỏi bước chuẩn bị lời nhắc cho lần thử đó; nhà cung cấp dùng mặc định trung lập của mình trong khi tiếp tục dự phòng sang nhà cung cấp khác. |
| `fail`              | Bỏ qua lần thử nhà cung cấp đó với `reasonCode: "not_configured"` và `personaBinding: "missing"`. Các nhà cung cấp dự phòng vẫn được thử.       |

Toàn bộ yêu cầu TTS chỉ thất bại khi **mọi** nhà cung cấp được thử đều bị bỏ qua
hoặc thất bại.

## Chỉ thị do mô hình điều khiển

Theo mặc định, trợ lý **có thể** phát ra các chỉ thị `[[tts:...]]` để ghi đè
giọng nói, mô hình, hoặc tốc độ cho một phản hồi, cùng với một khối tùy chọn
`[[tts:text]]...[[/tts:text]]` cho các gợi ý biểu cảm chỉ nên xuất hiện trong
âm thanh:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Khi `messages.tts.auto` là `"tagged"`, **bắt buộc phải có chỉ thị** để kích hoạt
âm thanh. Việc phân phối khối streaming loại bỏ chỉ thị khỏi văn bản hiển thị
trước khi kênh thấy chúng, kể cả khi bị tách qua các khối liền kề.

`provider=...` bị bỏ qua trừ khi `modelOverrides.allowProvider: true`. Khi một
phản hồi khai báo `provider=...`, các khóa khác trong chỉ thị đó chỉ được phân
tích bởi nhà cung cấp đó; các khóa không được hỗ trợ bị loại bỏ và được báo cáo
dưới dạng cảnh báo chỉ thị TTS.

**Các khóa chỉ thị khả dụng:**

- `provider` (id nhà cung cấp đã đăng ký; yêu cầu `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (âm lượng MiniMax, 0–10)
- `pitch` (cao độ nguyên MiniMax, −12 đến 12; giá trị thập phân bị cắt bỏ)
- `emotion` (thẻ cảm xúc Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Tắt hoàn toàn ghi đè mô hình:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Cho phép chuyển đổi nhà cung cấp trong khi vẫn giữ các nút chỉnh khác có thể cấu hình:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Lệnh slash

Một lệnh duy nhất `/tts`. Trên Discord, OpenClaw cũng đăng ký `/voice` vì
`/tts` là lệnh tích hợp sẵn của Discord — văn bản `/tts ...` vẫn hoạt động.

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
Lệnh yêu cầu người gửi được ủy quyền (áp dụng quy tắc allowlist/chủ sở hữu) và
`commands.text` hoặc đăng ký lệnh gốc phải được bật.
</Note>

Ghi chú hành vi:

- `/tts on` ghi tùy chọn TTS cục bộ thành `always`; `/tts off` ghi thành `off`.
- `/tts chat on|off|default` ghi một ghi đè auto-TTS theo phạm vi phiên cho cuộc trò chuyện hiện tại.
- `/tts persona <id>` ghi tùy chọn chân dung cục bộ; `/tts persona off` xóa nó.
- `/tts latest` đọc phản hồi trợ lý mới nhất từ bản ghi phiên hiện tại và gửi nó dưới dạng âm thanh một lần. Nó chỉ lưu hash của phản hồi đó trên mục phiên để ngăn gửi giọng nói trùng lặp.
- `/tts audio` tạo một phản hồi âm thanh một lần (**không** bật TTS).
- `limit` và `summary` được lưu trong **tùy chọn cục bộ**, không phải cấu hình chính.
- `/tts status` bao gồm chẩn đoán dự phòng cho lần thử mới nhất — `Fallback: <primary> -> <used>`, `Attempts: ...`, và chi tiết theo từng lần thử (`provider:outcome(reasonCode) latency`).
- `/status` hiển thị chế độ TTS đang hoạt động cùng nhà cung cấp, mô hình, giọng nói đã cấu hình, và siêu dữ liệu endpoint tùy chỉnh đã được làm sạch khi TTS được bật.

## Tùy chọn theo người dùng

Các lệnh slash ghi ghi đè cục bộ vào `prefsPath`. Mặc định là
`~/.openclaw/settings/tts.json`; ghi đè bằng biến môi trường `OPENCLAW_TTS_PREFS`
hoặc `messages.tts.prefsPath`.

| Trường đã lưu | Hiệu lực                                      |
| ------------ | --------------------------------------------- |
| `auto`       | Ghi đè auto-TTS cục bộ (`always`, `off`, …)   |
| `provider`   | Ghi đè nhà cung cấp chính cục bộ              |
| `persona`    | Ghi đè chân dung cục bộ                       |
| `maxLength`  | Ngưỡng tóm tắt (mặc định `1500` ký tự)        |
| `summarize`  | Công tắc tóm tắt (mặc định `true`)            |

Những trường này ghi đè cấu hình có hiệu lực từ `messages.tts` cộng với khối
`agents.list[].tts` đang hoạt động cho host đó.

## Định dạng đầu ra (cố định)

Việc phân phối giọng nói TTS được điều khiển bởi năng lực kênh. Các plugin kênh
quảng bá liệu TTS kiểu giọng nói nên yêu cầu nhà cung cấp dùng đích `voice-note`
gốc hay giữ tổng hợp `audio-file` thông thường và chỉ đánh dấu đầu ra tương thích
để phân phối giọng nói.

- **Các kênh hỗ trợ ghi chú thoại**: câu trả lời ghi chú thoại ưu tiên Opus (`opus_48000_64` từ ElevenLabs, `opus` từ OpenAI).
  - 48kHz / 64kbps là mức đánh đổi phù hợp cho tin nhắn thoại.
- **Feishu / WhatsApp**: khi câu trả lời ghi chú thoại được tạo dưới dạng MP3/WebM/WAV/M4A
  hoặc một tệp có khả năng là âm thanh khác, Plugin kênh sẽ chuyển mã tệp đó sang
  Ogg/Opus 48kHz bằng `ffmpeg` trước khi gửi tin nhắn thoại gốc. WhatsApp gửi
  kết quả qua tải trọng `audio` của Baileys với `ptt: true` và
  `audio/ogg; codecs=opus`. Nếu chuyển đổi thất bại, Feishu nhận tệp gốc
  dưới dạng tệp đính kèm; lượt gửi WhatsApp sẽ thất bại thay vì đăng tải trọng
  PTT không tương thích.
- **BlueBubbles**: giữ quá trình tổng hợp của nhà cung cấp trên đường dẫn tệp âm thanh thông thường; đầu ra MP3
  và CAF được đánh dấu để gửi bản ghi nhớ thoại iMessage.
- **Các kênh khác**: MP3 (`mp3_44100_128` từ ElevenLabs, `mp3` từ OpenAI).
  - 44.1kHz / 128kbps là mức cân bằng mặc định cho độ rõ của giọng nói.
- **MiniMax**: MP3 (mô hình `speech-2.8-hd`, tần số lấy mẫu 32kHz) cho tệp đính kèm âm thanh thông thường. Đối với các mục tiêu ghi chú thoại do kênh quảng bá, OpenClaw chuyển mã MP3 của MiniMax sang Opus 48kHz bằng `ffmpeg` trước khi phân phối khi kênh quảng bá khả năng chuyển mã.
- **Xiaomi MiMo**: mặc định là MP3, hoặc WAV khi được cấu hình. Đối với các mục tiêu ghi chú thoại do kênh quảng bá, OpenClaw chuyển mã đầu ra Xiaomi sang Opus 48kHz bằng `ffmpeg` trước khi phân phối khi kênh quảng bá khả năng chuyển mã.
- **CLI cục bộ**: sử dụng `outputFormat` đã cấu hình. Các mục tiêu ghi chú thoại được
  chuyển đổi sang Ogg/Opus và đầu ra điện thoại được chuyển đổi sang PCM đơn âm 16 kHz thô
  bằng `ffmpeg`.
- **Google Gemini**: TTS API Gemini trả về PCM 24kHz thô. OpenClaw bọc nó dưới dạng WAV cho tệp đính kèm âm thanh, chuyển mã sang Opus 48kHz cho mục tiêu ghi chú thoại, và trả về PCM trực tiếp cho Talk/điện thoại.
- **Gradium**: WAV cho tệp đính kèm âm thanh, Opus cho mục tiêu ghi chú thoại, và `ulaw_8000` ở 8 kHz cho điện thoại.
- **Inworld**: MP3 cho tệp đính kèm âm thanh thông thường, `OGG_OPUS` gốc cho mục tiêu ghi chú thoại, và `PCM` thô ở 22050 Hz cho Talk/điện thoại.
- **xAI**: mặc định là MP3; `responseFormat` có thể là `mp3`, `wav`, `pcm`, `mulaw`, hoặc `alaw`. OpenClaw sử dụng điểm cuối TTS REST theo lô của xAI và trả về một tệp đính kèm âm thanh hoàn chỉnh; WebSocket TTS phát trực tuyến của xAI không được đường dẫn nhà cung cấp này sử dụng. Đường dẫn này không hỗ trợ định dạng ghi chú thoại Opus gốc.
- **Microsoft**: sử dụng `microsoft.outputFormat` (mặc định `audio-24khz-48kbitrate-mono-mp3`).
  - Phương thức truyền tải đi kèm chấp nhận `outputFormat`, nhưng không phải tất cả định dạng đều có sẵn từ dịch vụ.
  - Giá trị định dạng đầu ra tuân theo các định dạng đầu ra Microsoft Speech (bao gồm Ogg/WebM Opus).
  - Telegram `sendVoice` chấp nhận OGG/MP3/M4A; hãy dùng OpenAI/ElevenLabs nếu bạn cần
    tin nhắn thoại Opus được bảo đảm.
  - Nếu định dạng đầu ra Microsoft đã cấu hình thất bại, OpenClaw thử lại bằng MP3.

Định dạng đầu ra OpenAI/ElevenLabs được cố định theo từng kênh (xem ở trên).

## Hành vi Auto-TTS

Khi `messages.tts.auto` được bật, OpenClaw:

- Bỏ qua TTS nếu câu trả lời đã chứa phương tiện hoặc chỉ thị `MEDIA:`.
- Bỏ qua các câu trả lời rất ngắn (dưới 10 ký tự).
- Tóm tắt các câu trả lời dài khi tính năng tóm tắt được bật, sử dụng
  `summaryModel` (hoặc `agents.defaults.model.primary`).
- Đính kèm âm thanh đã tạo vào câu trả lời.
- Trong `mode: "final"`, vẫn gửi TTS chỉ có âm thanh cho các câu trả lời cuối cùng được phát trực tuyến
  sau khi luồng văn bản hoàn tất; phương tiện đã tạo đi qua cùng quá trình
  chuẩn hóa phương tiện của kênh như các tệp đính kèm câu trả lời thông thường.

Nếu câu trả lời vượt quá `maxLength` và tính năng tóm tắt bị tắt (hoặc không có khóa API cho
mô hình tóm tắt), âm thanh sẽ bị bỏ qua và câu trả lời văn bản thông thường được gửi.

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

## Định dạng đầu ra theo kênh

  | Đích                                  | Định dạng                                                                                                                             |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Phản hồi tin nhắn thoại ưu tiên **Opus** (`opus_48000_64` từ ElevenLabs, `opus` từ OpenAI). 48 kHz / 64 kbps cân bằng độ rõ và kích thước. |
  | Các kênh khác                         | **MP3** (`mp3_44100_128` từ ElevenLabs, `mp3` từ OpenAI). 44.1 kHz / 128 kbps mặc định cho giọng nói.                                 |
  | Talk / điện thoại                     | **PCM** gốc của nhà cung cấp (Inworld 22050 Hz, Google 24 kHz), hoặc `ulaw_8000` từ Gradium cho điện thoại.                           |

  Ghi chú theo từng nhà cung cấp:

  - **Chuyển mã Feishu / WhatsApp:** Khi phản hồi tin nhắn thoại đến dưới dạng MP3/WebM/WAV/M4A, Plugin kênh chuyển mã sang 48 kHz Ogg/Opus bằng `ffmpeg`. WhatsApp gửi qua Baileys với `ptt: true` và `audio/ogg; codecs=opus`. Nếu chuyển đổi thất bại: Feishu quay lại đính kèm tệp gốc; WhatsApp gửi thất bại thay vì đăng tải payload PTT không tương thích.
  - **MiniMax / Xiaomi MiMo:** Mặc định MP3 (32 kHz cho MiniMax `speech-2.8-hd`); được chuyển mã sang 48 kHz Opus cho các đích tin nhắn thoại qua `ffmpeg`.
  - **CLI cục bộ:** Sử dụng `outputFormat` đã cấu hình. Các đích tin nhắn thoại được chuyển đổi sang Ogg/Opus và đầu ra điện thoại sang PCM mono 16 kHz thô.
  - **Google Gemini:** Trả về PCM thô 24 kHz. OpenClaw bọc dưới dạng WAV cho tệp đính kèm, chuyển mã sang 48 kHz Opus cho các đích tin nhắn thoại, trả về PCM trực tiếp cho Talk/điện thoại.
  - **Inworld:** Tệp đính kèm MP3, tin nhắn thoại `OGG_OPUS` gốc, `PCM` thô 22050 Hz cho Talk/điện thoại.
  - **xAI:** Mặc định MP3; `responseFormat` có thể là `mp3|wav|pcm|mulaw|alaw`. Sử dụng endpoint batch REST của xAI — TTS WebSocket phát trực tuyến **không** được dùng. Định dạng tin nhắn thoại Opus gốc **không** được hỗ trợ.
  - **Microsoft:** Sử dụng `microsoft.outputFormat` (mặc định `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` chấp nhận OGG/MP3/M4A; dùng OpenAI/ElevenLabs nếu bạn cần tin nhắn thoại Opus được đảm bảo. Nếu định dạng Microsoft đã cấu hình thất bại, OpenClaw thử lại với MP3.

  Định dạng đầu ra OpenAI và ElevenLabs được cố định theo từng kênh như liệt kê ở trên.

  ## Tham chiếu trường

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Chế độ Auto-TTS. `inbound` chỉ gửi âm thanh sau một tin nhắn thoại đến; `tagged` chỉ gửi âm thanh khi phản hồi bao gồm chỉ thị `[[tts:...]]` hoặc khối `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Công tắc kế thừa. `openclaw doctor --fix` di chuyển giá trị này sang `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` bao gồm phản hồi công cụ/khối ngoài phản hồi cuối cùng.
    </ParamField>
    <ParamField path="provider" type="string">
      ID nhà cung cấp giọng nói. Khi chưa đặt, OpenClaw sử dụng nhà cung cấp đã cấu hình đầu tiên trong thứ tự tự động chọn của registry. `provider: "edge"` kế thừa được `openclaw doctor --fix` viết lại thành `"microsoft"`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID persona đang hoạt động từ `personas`. Được chuẩn hóa thành chữ thường.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Danh tính nói ổn định. Trường: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Xem [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Mô hình rẻ cho tự động tóm tắt; mặc định là `agents.defaults.model.primary`. Chấp nhận `provider/model` hoặc alias mô hình đã cấu hình.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Cho phép mô hình phát ra chỉ thị TTS. `enabled` mặc định là `true`; `allowProvider` mặc định là `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Thiết lập do nhà cung cấp sở hữu, được khóa theo ID nhà cung cấp giọng nói. Các khối trực tiếp kế thừa (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) được `openclaw doctor --fix` viết lại; chỉ commit `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Giới hạn cứng cho số ký tự đầu vào TTS. `/tts audio` thất bại nếu vượt quá.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Thời gian chờ yêu cầu tính bằng mili giây.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Ghi đè đường dẫn JSON tùy chọn cục bộ (nhà cung cấp/giới hạn/tóm tắt). Mặc định `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, hoặc `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Vùng Azure Speech (ví dụ `eastus`). Env: `AZURE_SPEECH_REGION` hoặc `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Ghi đè endpoint Azure Speech tùy chọn (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName giọng nói Azure. Mặc định `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Mã ngôn ngữ SSML. Mặc định `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` cho âm thanh tiêu chuẩn. Mặc định `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` cho đầu ra tin nhắn thoại. Mặc định `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Dự phòng về `ELEVENLABS_API_KEY` hoặc `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID mô hình (ví dụ `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ID giọng nói ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (mỗi giá trị `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = bình thường).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Chế độ chuẩn hóa văn bản.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 gồm 2 chữ cái (ví dụ `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Số nguyên `0..4294967295` cho tính tất định theo nỗ lực tốt nhất.</ParamField>
    <ParamField path="baseUrl" type="string">Ghi đè URL cơ sở API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Dự phòng về `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Nếu bỏ qua, TTS có thể dùng lại `models.providers.google.apiKey` trước khi dự phòng về env.</ParamField>
    <ParamField path="model" type="string">Mô hình TTS Gemini. Mặc định `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Tên giọng nói dựng sẵn của Gemini. Mặc định `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt phong cách bằng ngôn ngữ tự nhiên được thêm trước văn bản sẽ nói.</ParamField>
    <ParamField path="speakerName" type="string">Nhãn người nói tùy chọn được thêm trước văn bản sẽ nói khi prompt của bạn dùng một người nói được đặt tên.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Đặt thành `audio-profile-v1` để bọc các trường prompt persona đang hoạt động trong cấu trúc prompt TTS Gemini tất định.</ParamField>
    <ParamField path="personaPrompt" type="string">Văn bản prompt persona bổ sung dành riêng cho Google, được nối vào Ghi chú của Đạo diễn trong mẫu.</ParamField>
    <ParamField path="baseUrl" type="string">Chỉ chấp nhận `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Mặc định Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Mặc định `inworld-tts-1.5-max`. Ngoài ra: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Mặc định `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Nhiệt độ lấy mẫu `0..2`.</ParamField>
  </Accordion>

  <Accordion title="CLI cục bộ (tts-local-cli)">
    <ParamField path="command" type="string">Tệp thực thi cục bộ hoặc chuỗi lệnh cho CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Đối số lệnh. Hỗ trợ các placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Định dạng đầu ra CLI dự kiến. Mặc định `mp3` cho tệp đính kèm âm thanh.</ParamField>
    <ParamField path="timeoutMs" type="number">Thời gian chờ lệnh tính bằng mili giây. Mặc định `120000`.</ParamField>
    <ParamField path="cwd" type="string">Thư mục làm việc tùy chọn của lệnh.</ParamField>
    <ParamField path="env" type="Record<string, string>">Các ghi đè môi trường tùy chọn cho lệnh.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (không có khóa API)">
    <ParamField path="enabled" type="boolean" default="true">Cho phép sử dụng giọng nói Microsoft.</ParamField>
    <ParamField path="voice" type="string">Tên giọng neural Microsoft (ví dụ: `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Mã ngôn ngữ (ví dụ: `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Định dạng đầu ra Microsoft. Mặc định `audio-24khz-48kbitrate-mono-mp3`. Không phải định dạng nào cũng được transport dựa trên Edge đi kèm hỗ trợ.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Chuỗi phần trăm (ví dụ: `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Ghi phụ đề JSON cùng với tệp âm thanh.</ParamField>
    <ParamField path="proxy" type="string">URL proxy cho yêu cầu giọng nói Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Ghi đè thời gian chờ yêu cầu (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Bí danh legacy. Chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu thành `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Dự phòng về `MINIMAX_API_KEY`. Xác thực Token Plan qua `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, hoặc `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Mặc định `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Mặc định `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Mặc định `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Mặc định `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Số nguyên `-12..12`. Mặc định `0`. Giá trị thập phân bị cắt bỏ trước yêu cầu.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Dự phòng về `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID mô hình OpenAI TTS (ví dụ: `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Tên giọng nói (ví dụ: `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Trường `instructions` rõ ràng của OpenAI. Khi được đặt, các trường lời nhắc persona **không** được tự động ánh xạ.</ParamField>
    <ParamField path="baseUrl" type="string">
      Ghi đè endpoint OpenAI TTS. Thứ tự phân giải: cấu hình → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Các giá trị không mặc định được xem là endpoint TTS tương thích OpenAI, vì vậy tên mô hình và giọng nói tùy chỉnh được chấp nhận.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Có thể dùng lại `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://openrouter.ai/api/v1`. Legacy `https://openrouter.ai/v1` được chuẩn hóa.</ParamField>
    <ParamField path="model" type="string">Mặc định `hexgrad/kokoro-82m`. Bí danh: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Mặc định `af_alloy`. Bí danh: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Mặc định `mp3`.</ParamField>
    <ParamField path="speed" type="number">Ghi đè tốc độ gốc của nhà cung cấp.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` hoặc `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Mặc định `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Dùng `seed-tts-2.0` khi dự án của bạn có quyền sử dụng TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Header khóa ứng dụng. Mặc định `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Ghi đè endpoint HTTP Seed Speech TTS. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Kiểu giọng nói. Mặc định `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Tỷ lệ tốc độ gốc của nhà cung cấp.</ParamField>
    <ParamField path="emotion" type="string">Thẻ cảm xúc gốc của nhà cung cấp.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Các trường Volcengine Speech Console legacy. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (mặc định `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Mặc định `eve`. Giọng nói live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Mã ngôn ngữ BCP-47 hoặc `auto`. Mặc định `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Mặc định `mp3`.</ParamField>
    <ParamField path="speed" type="number">Ghi đè tốc độ gốc của nhà cung cấp.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Mặc định `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Cũng hỗ trợ `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Mặc định `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Mặc định `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Chỉ dẫn phong cách bằng ngôn ngữ tự nhiên tùy chọn được gửi dưới dạng tin nhắn người dùng; không được đọc thành tiếng.</ParamField>
  </Accordion>
</AccordionGroup>

## Công cụ agent

Công cụ `tts` chuyển đổi văn bản thành giọng nói và trả về tệp đính kèm âm thanh để
gửi phản hồi. Trên Feishu, Matrix, Telegram và WhatsApp, âm thanh được
gửi dưới dạng tin nhắn thoại thay vì tệp đính kèm. Feishu và
WhatsApp có thể chuyển mã đầu ra TTS không phải Opus trên đường dẫn này khi có
`ffmpeg`.

WhatsApp gửi âm thanh qua Baileys dưới dạng ghi chú thoại PTT (`audio` với
`ptt: true`) và gửi văn bản hiển thị **riêng biệt** với âm thanh PTT vì
client không hiển thị nhất quán chú thích trên ghi chú thoại.

Công cụ chấp nhận các trường `channel` và `timeoutMs` tùy chọn; `timeoutMs` là
thời gian chờ yêu cầu nhà cung cấp cho mỗi lệnh gọi, tính bằng mili giây.

## Gateway RPC

| Phương thức       | Mục đích                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Đọc trạng thái TTS hiện tại và lần thử gần nhất. |
| `tts.enable`      | Đặt tùy chọn tự động cục bộ thành `always`. |
| `tts.disable`     | Đặt tùy chọn tự động cục bộ thành `off`. |
| `tts.convert`     | Chuyển đổi một lần văn bản → âm thanh. |
| `tts.setProvider` | Đặt tùy chọn nhà cung cấp cục bộ. |
| `tts.setPersona`  | Đặt tùy chọn persona cục bộ. |
| `tts.providers`   | Liệt kê các nhà cung cấp đã cấu hình và trạng thái. |

## Liên kết dịch vụ

- [Hướng dẫn chuyển văn bản thành giọng nói của OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Tài liệu tham khảo OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST chuyển văn bản thành giọng nói](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Nhà cung cấp Azure Speech](/vi/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Xác thực ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/vi/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/vi/providers/volcengine#text-to-speech)
- [Tổng hợp giọng nói Xiaomi MiMo](/vi/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Định dạng đầu ra Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI chuyển văn bản thành giọng nói](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Liên quan

- [Tổng quan về phương tiện](/vi/tools/media-overview)
- [Tạo nhạc](/vi/tools/music-generation)
- [Tạo video](/vi/tools/video-generation)
- [Lệnh slash](/vi/tools/slash-commands)
- [Plugin gọi thoại](/vi/plugins/voice-call)

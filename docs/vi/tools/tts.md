---
read_when:
    - Bật tính năng chuyển văn bản thành giọng nói cho câu trả lời
    - Cấu hình nhà cung cấp TTS, chuỗi dự phòng hoặc persona
    - Sử dụng lệnh hoặc chỉ thị /tts
sidebarTitle: Text to speech (TTS)
summary: Chuyển văn bản thành giọng nói cho phản hồi gửi đi — nhà cung cấp, đặc trưng giọng nói, lệnh gạch chéo và đầu ra theo từng kênh
title: Chuyển văn bản thành giọng nói
x-i18n:
    generated_at: "2026-07-16T15:21:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw chuyển đổi các phản hồi gửi đi thành âm thanh qua **14 nhà cung cấp giọng nói**:
tin nhắn thoại gốc trên Feishu, Matrix, Telegram và WhatsApp; tệp đính kèm
âm thanh ở mọi nơi khác; cùng luồng PCM/Ulaw cho điện thoại và Talk.

TTS là phần đầu ra giọng nói trong chế độ `stt-tts` của Talk (`talk.speak` gọi
cùng đường tổng hợp này). Các phiên Talk `realtime` gốc của nhà cung cấp tổng hợp
giọng nói bên trong nhà cung cấp thời gian thực; các phiên `transcription` không bao giờ
tổng hợp phản hồi bằng giọng nói của trợ lý.

## Bắt đầu nhanh

<Steps>
  <Step title="Chọn nhà cung cấp">
    OpenAI và ElevenLabs là các lựa chọn dịch vụ lưu trữ đáng tin cậy nhất. Microsoft và
    CLI cục bộ hoạt động mà không cần khóa API. Xem [ma trận nhà cung cấp](#supported-providers)
    để biết danh sách đầy đủ.
  </Step>
  <Step title="Đặt khóa API">
    Xuất biến môi trường cho nhà cung cấp của bạn (ví dụ: `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft và CLI cục bộ không cần khóa.
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
TTS tự động mặc định **tắt**. Khi `messages.tts.provider` chưa được đặt,
OpenClaw chọn nhà cung cấp được cấu hình đầu tiên theo thứ tự tự động chọn trong sổ đăng ký.
Công cụ tác nhân `tts` tích hợp sẵn chỉ dành cho ý định rõ ràng: cuộc trò chuyện thông thường vẫn ở dạng
văn bản, trừ khi người dùng yêu cầu âm thanh, sử dụng `/tts` hoặc bật giọng nói
TTS tự động/chỉ thị.
</Note>

## Các nhà cung cấp được hỗ trợ

| Nhà cung cấp       | Xác thực                                                                                                          | Ghi chú                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (cũng có `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | Đầu ra ghi chú thoại Ogg/Opus gốc và điện thoại.                                             |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                               | TTS tương thích OpenAI. Mặc định là `hexgrad/Kokoro-82M`.                                      |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` hoặc `XI_API_KEY`                                                                        | Nhân bản giọng nói, đa ngôn ngữ, xác định qua `seed`; truyền trực tuyến để phát giọng nói trên Discord. |
| **Google Gemini** | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`                                                                        | TTS hàng loạt qua API Gemini; nhận biết nhân vật qua `promptTemplate: "audio-profile-v1"`.                     |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                               | Đầu ra ghi chú thoại và điện thoại.                                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                               | API TTS truyền trực tuyến. Ghi chú thoại Opus gốc và điện thoại PCM.                         |
| **CLI cục bộ**    | không có                                                                                                         | Chạy lệnh TTS cục bộ đã cấu hình.                                                           |
| **Microsoft**     | không có                                                                                                         | TTS nơ-ron Edge công khai qua `node-edge-tts`. Cung cấp theo khả năng, không có SLA.      |
| **MiniMax**       | `MINIMAX_API_KEY` (hoặc Gói Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                   | API T2A v2. Mặc định là `speech-2.8-hd`.                                                  |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                               | Cũng được dùng để tự động tóm tắt; hỗ trợ nhân vật `instructions`.                       |
| **OpenRouter**    | `OPENROUTER_API_KEY` (có thể dùng lại `models.providers.openrouter.apiKey`)                                                          | Mô hình mặc định `hexgrad/kokoro-82m`.                                                        |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` hoặc `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token cũ: `VOLCENGINE_TTS_APPID`/`_TOKEN`)                | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                               | Nhà cung cấp dùng chung cho hình ảnh, video và giọng nói.                                   |
| **xAI**           | `XAI_API_KEY`                                                                                               | TTS hàng loạt của xAI. Ghi chú thoại Opus gốc **không** được hỗ trợ.                         |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                               | TTS MiMo thông qua tính năng hoàn tất cuộc trò chuyện của Xiaomi.                           |

Nếu nhiều nhà cung cấp được cấu hình, nhà cung cấp đã chọn sẽ được dùng trước và
các nhà cung cấp khác là phương án dự phòng. Tự động tóm tắt sử dụng `summaryModel` (hoặc
`agents.defaults.model.primary`), vì vậy nhà cung cấp đó cũng phải được xác thực
nếu bạn tiếp tục bật tính năng tóm tắt.

<Warning>
Nhà cung cấp **Microsoft** đi kèm sử dụng dịch vụ TTS nơ-ron trực tuyến của Microsoft Edge
qua `node-edge-tts`. Đây là dịch vụ web công khai không có SLA hoặc hạn mức
được công bố — hãy coi đây là dịch vụ cung cấp theo khả năng. ID nhà cung cấp cũ `edge` được
chuẩn hóa thành `microsoft` và `openclaw doctor --fix` ghi lại cấu hình
đã lưu; cấu hình mới phải luôn sử dụng `microsoft`.
</Warning>

## Cấu hình

Cấu hình TTS nằm trong `messages.tts` tại `~/.openclaw/openclaw.json`. Chọn một
cấu hình đặt sẵn và điều chỉnh khối nhà cung cấp. Các trường `speakerVoice`/`speakerVoiceId`
được hiển thị bên dưới là chuẩn; tên trường `voice`/`voiceId`/
`voiceName` riêng của từng nhà cung cấp vẫn hoạt động dưới dạng bí danh cũ.

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
          // Lời nhắc kiểu ngôn ngữ tự nhiên tùy chọn:
          // audioProfile: "Nói bằng giọng điệu bình tĩnh như người dẫn podcast.",
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
  <Tab title="CLI cục bộ">
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
  <Tab title="Microsoft (không cần khóa)">
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

Đối với Xiaomi `mimo-v2.5-tts-voicedesign`, hãy bỏ qua `speakerVoice` và đặt `style` thành
lời nhắc thiết kế giọng nói. OpenClaw gửi lời nhắc đó dưới dạng thông điệp TTS `user`
và không gửi `audio.voice` cho mô hình voicedesign.

### Ghi đè giọng nói theo từng agent

Sử dụng `agents.list[].tts` khi một agent cần nói bằng nhà cung cấp, giọng nói, mô hình, persona hoặc chế độ TTS tự động khác. Khối agent được hợp nhất sâu lên trên
`messages.tts`, vì vậy thông tin xác thực của nhà cung cấp có thể được giữ trong cấu hình nhà cung cấp toàn cục:

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

Để cố định persona cho từng agent, hãy đặt `agents.list[].tts.persona` cùng với cấu hình nhà cung cấp — giá trị này chỉ ghi đè `messages.tts.persona` toàn cục cho agent đó.

Thứ tự ưu tiên cho phản hồi tự động, `/tts audio`, `/tts status` và công cụ agent
`tts`:

1. `messages.tts`
2. `agents.list[].tts` đang hoạt động
3. ghi đè kênh, khi kênh hỗ trợ `channels.<channel>.tts`
4. ghi đè tài khoản, khi kênh truyền `channels.<channel>.accounts.<id>.tts`
5. tùy chọn `/tts` cục bộ cho máy chủ này
6. chỉ thị `[[tts:...]]` nội tuyến khi [ghi đè do mô hình điều khiển](#model-driven-directives) được bật

Các ghi đè kênh và tài khoản sử dụng cùng cấu trúc với `messages.tts` và được hợp nhất sâu lên trên các lớp trước đó, vì vậy thông tin xác thực dùng chung của nhà cung cấp có thể được giữ trong
`messages.tts`, trong khi một kênh hoặc tài khoản bot chỉ thay đổi giọng người nói, mô hình, persona hoặc chế độ tự động:

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

## Persona

Một **persona** là danh tính giọng nói ổn định có thể được áp dụng một cách xác định trên nhiều nhà cung cấp. Persona có thể ưu tiên một nhà cung cấp, xác định ý định lời nhắc trung lập với nhà cung cấp và chứa các liên kết dành riêng cho nhà cung cấp đối với giọng nói, mô hình, mẫu lời nhắc, seed và cài đặt giọng nói.

### Persona tối giản

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

### Persona đầy đủ (lời nhắc trung lập với nhà cung cấp)

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

### Phân giải persona

Persona đang hoạt động được chọn một cách xác định:

1. tùy chọn cục bộ `/tts persona <id>`, nếu được đặt.
2. `messages.tts.persona`, nếu được đặt.
3. Không có persona.

Việc chọn nhà cung cấp ưu tiên các giá trị tường minh trước:

1. Ghi đè trực tiếp (CLI, gateway, Talk, các chỉ thị TTS được phép).
2. Tùy chọn cục bộ `/tts provider <id>`.
3. `provider` của persona đang hoạt động.
4. `messages.tts.provider`.
5. Tự động chọn từ registry.

Với mỗi lần thử nhà cung cấp, OpenClaw hợp nhất cấu hình theo thứ tự sau:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Ghi đè yêu cầu đáng tin cậy
4. Ghi đè chỉ thị TTS do mô hình phát ra được phép

### Cách các nhà cung cấp sử dụng lời nhắc persona

Các trường lời nhắc persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) **trung lập với nhà cung cấp**. Mỗi nhà cung cấp quyết định cách sử dụng chúng:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Bao bọc các trường lời nhắc persona trong cấu trúc lời nhắc TTS của Gemini **chỉ khi**
    cấu hình nhà cung cấp Google hiệu dụng đặt `promptTemplate: "audio-profile-v1"`
    hoặc `personaPrompt`. Các trường cũ hơn `audioProfile` và `speakerName`
    vẫn được thêm vào đầu dưới dạng văn bản lời nhắc dành riêng cho Google. Các thẻ âm thanh nội tuyến như
    `[whispers]` hoặc `[laughs]` bên trong khối `[[tts:text]]` được giữ nguyên
    trong bản chép lời Gemini; OpenClaw không tạo ra các thẻ này.
  </Accordion>
  <Accordion title="OpenAI">
    Ánh xạ các trường lời nhắc persona sang trường `instructions` của yêu cầu **chỉ khi**
    không có `instructions` OpenAI tường minh nào được cấu hình. `instructions`
    tường minh luôn được ưu tiên.
  </Accordion>
  <Accordion title="Các nhà cung cấp khác">
    Chỉ sử dụng các liên kết persona dành riêng cho nhà cung cấp trong
    `personas.<id>.providers.<provider>`. Các trường lời nhắc persona bị bỏ qua
    trừ khi nhà cung cấp triển khai ánh xạ lời nhắc persona riêng.
  </Accordion>
</AccordionGroup>

### Chính sách dự phòng

`fallbackPolicy` kiểm soát hành vi khi persona **không có liên kết** cho nhà cung cấp đang được thử:

| Chính sách              | Hành vi                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Mặc định.** Các trường lời nhắc trung lập với nhà cung cấp vẫn khả dụng; nhà cung cấp có thể sử dụng hoặc bỏ qua chúng.                                            |
| `provider-defaults` | Persona bị loại khỏi quá trình chuẩn bị lời nhắc cho lần thử đó; nhà cung cấp sử dụng các giá trị mặc định trung lập trong khi tiếp tục dự phòng sang các nhà cung cấp khác. |
| `fail`              | Bỏ qua lần thử nhà cung cấp đó với `reasonCode: "not_configured"` và `personaBinding: "missing"`. Các nhà cung cấp dự phòng vẫn được thử.              |

Toàn bộ yêu cầu TTS chỉ thất bại khi **mọi** nhà cung cấp được thử đều bị bỏ qua hoặc thất bại.

Việc chọn nhà cung cấp cho phiên Talk có phạm vi theo phiên. Ứng dụng Talk nên chọn
ID nhà cung cấp, ID mô hình, ID giọng nói và locale từ `talk.catalog` rồi truyền
chúng qua yêu cầu phiên Talk hoặc bàn giao. Việc mở một phiên giọng nói không nên
thay đổi `messages.tts` hoặc các giá trị mặc định của nhà cung cấp Talk toàn cục.

## Chỉ thị do mô hình điều khiển

Theo mặc định, trợ lý **có thể** phát ra chỉ thị `[[tts:...]]` để ghi đè
giọng nói, mô hình hoặc tốc độ cho một phản hồi duy nhất, cùng với một khối
`[[tts:text]]...[[/tts:text]]` tùy chọn dành cho các tín hiệu biểu cảm chỉ nên xuất hiện trong
âm thanh:

```text
Đây nhé.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](cười) Đọc lại bài hát một lần nữa.[[/tts:text]]
```

Khi `messages.tts.auto` là `"tagged"`, **bắt buộc phải có chỉ thị** để kích hoạt
âm thanh. Cơ chế phân phối khối dạng luồng loại bỏ các chỉ thị khỏi văn bản hiển thị trước khi
kênh nhận được chúng, ngay cả khi chúng bị tách giữa các khối liền kề.

`provider=...` bị bỏ qua trừ khi `modelOverrides.allowProvider: true`. Khi một
phản hồi khai báo `provider=...`, các khóa khác trong chỉ thị đó chỉ được
nhà cung cấp đó phân tích cú pháp; các khóa không được hỗ trợ sẽ bị loại bỏ và được báo cáo dưới dạng cảnh báo
chỉ thị TTS.

**Các khóa chỉ thị khả dụng:**

- `provider` (ID nhà cung cấp đã đăng ký; yêu cầu `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (bí danh cũ: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (âm lượng MiniMax, `(0, 10]`)
- `pitch` (cao độ nguyên MiniMax, −12 đến 12; các giá trị thập phân bị cắt bỏ)
- `emotion` (thẻ cảm xúc Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Tắt hoàn toàn ghi đè của mô hình:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Cho phép chuyển đổi nhà cung cấp trong khi vẫn có thể cấu hình các tham số khác:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Lệnh gạch chéo

Lệnh duy nhất `/tts`. Trên Discord, OpenClaw cũng đăng ký `/voice` vì
`/tts` là một lệnh tích hợp sẵn của Discord — văn bản `/tts ...` vẫn hoạt động.

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
Các lệnh yêu cầu người gửi được ủy quyền (áp dụng quy tắc danh sách cho phép/chủ sở hữu) và
`commands.text` hoặc tính năng đăng ký lệnh gốc phải được bật.
</Note>

Ghi chú về hành vi:

- `/tts on` ghi tùy chọn TTS cục bộ vào `always`; `/tts off` ghi tùy chọn đó vào `off`.
- `/tts chat on|off|default` ghi một ghi đè TTS tự động có phạm vi phiên cho cuộc trò chuyện hiện tại.
- `/tts persona <id>` ghi tùy chọn persona cục bộ; `/tts persona off` xóa tùy chọn đó.
- `/tts latest` đọc phản hồi gần nhất của trợ lý từ bản chép lời của phiên hiện tại và gửi phản hồi đó dưới dạng âm thanh một lần. Lệnh chỉ lưu hàm băm của phản hồi đó trong mục nhập phiên để ngăn gửi trùng lặp bằng giọng nói.
- `/tts audio` tạo một phản hồi âm thanh dùng một lần (**không** bật TTS).
- `/tts limit <chars>` chấp nhận **100–4096** (4096 là giới hạn tối đa của chú thích/tin nhắn Telegram); các giá trị ngoài phạm vi đó bị từ chối.
- `limit` và `summary` được lưu trong **tùy chọn cục bộ**, không phải cấu hình chính.
- `/tts status` bao gồm chẩn đoán dự phòng cho lần thử gần nhất — `Fallback: <primary> -> <used>`, `Attempts: ...` và chi tiết theo từng lần thử (`provider:outcome(reasonCode) latency`).
- `/status` hiển thị chế độ TTS đang hoạt động cùng với nhà cung cấp, mô hình, giọng nói đã cấu hình và siêu dữ liệu điểm cuối tùy chỉnh đã được làm sạch khi TTS được bật.

## Tùy chọn theo từng người dùng

Các lệnh gạch chéo ghi ghi đè cục bộ vào `prefsPath`. Giá trị mặc định là
`~/.openclaw/settings/tts.json`; ghi đè bằng biến môi trường `OPENCLAW_TTS_PREFS`
hoặc `messages.tts.prefsPath`.

| Trường được lưu | Tác dụng                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Ghi đè tự động TTS cục bộ (`always`, `off`, …)                                     |
| `provider`   | Ghi đè nhà cung cấp chính cục bộ                                                  |
| `persona`    | Ghi đè nhân dạng cục bộ                                                           |
| `maxLength`  | Ngưỡng tóm tắt/cắt ngắn (mặc định `1500` ký tự, phạm vi `/tts limit` 100–4096) |
| `summarize`  | Bật/tắt tóm tắt (mặc định `true`)                                                  |

Các giá trị này ghi đè cấu hình có hiệu lực từ `messages.tts` cùng với khối
`agents.list[].tts` đang hoạt động cho máy chủ đó.

## Định dạng đầu ra

Việc phân phối giọng nói TTS được điều khiển bởi khả năng của kênh. Các plugin kênh khai báo
liệu TTS kiểu giọng nói có nên yêu cầu nhà cung cấp sử dụng đích `voice-note` gốc hay
tiếp tục tổng hợp `audio-file` thông thường, cũng như liệu kênh có chuyển mã
đầu ra không phải định dạng gốc trước khi gửi hay không.

| Đích                                | Định dạng                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Phản hồi dạng tin nhắn thoại ưu tiên **Opus** (`opus_48000_64` từ ElevenLabs, `opus` từ OpenAI). 48 kHz / 64 kbps cân bằng giữa độ rõ và kích thước. |
| Các kênh khác                        | **MP3** (`mp3_44100_128` từ ElevenLabs, `mp3` từ OpenAI). 44.1 kHz / 128 kbps là mức cân bằng mặc định cho giọng nói.                  |
| Talk / điện thoại                      | **PCM** gốc của nhà cung cấp (Inworld 22050 Hz, Google 24 kHz), hoặc `ulaw_8000` từ Gradium cho điện thoại.                                 |

Lưu ý theo từng nhà cung cấp:

- **Chuyển mã Feishu / WhatsApp:** khi phản hồi dạng tin nhắn thoại có định dạng MP3/WebM/WAV/M4A hoặc một tệp có khả năng là âm thanh khác, plugin kênh sẽ chuyển mã thành Ogg/Opus 48 kHz bằng `ffmpeg` (`libopus`, 64 kbps) trước khi gửi tin nhắn thoại gốc. WhatsApp gửi kết quả qua tải trọng Baileys `audio` với `ptt: true` và `audio/ogg; codecs=opus`. Khi chuyển mã thất bại: Feishu bắt lỗi và chuyển sang gửi tệp gốc dưới dạng tệp đính kèm thông thường; WhatsApp không có phương án dự phòng, vì vậy thao tác gửi sẽ thất bại thay vì đăng tải trọng PTT không tương thích.
- **MiniMax:** MP3 (mô hình `speech-2.8-hd`, tốc độ lấy mẫu 32 kHz) cho tệp đính kèm âm thanh thông thường; được chuyển mã thành Opus 48 kHz bằng `ffmpeg` cho các đích tin nhắn thoại do kênh khai báo.
- **Xiaomi MiMo:** MP3 theo mặc định, hoặc WAV khi được cấu hình; được chuyển mã thành Opus 48 kHz bằng `ffmpeg` cho các đích tin nhắn thoại do kênh khai báo.
- **CLI cục bộ:** sử dụng `outputFormat` đã cấu hình. Các đích tin nhắn thoại được chuyển đổi thành Ogg/Opus và đầu ra điện thoại được chuyển đổi thành PCM mono 16 kHz thô bằng `ffmpeg`.
- **Google Gemini:** trả về PCM 24 kHz thô. OpenClaw đóng gói thành WAV cho các tệp đính kèm âm thanh, chuyển mã thành Opus 48 kHz cho các đích tin nhắn thoại và trả về PCM trực tiếp cho Talk/điện thoại.
- **Gradium:** WAV cho tệp đính kèm âm thanh, Opus cho đích tin nhắn thoại và `ulaw_8000` ở 8 kHz cho điện thoại.
- **Inworld:** MP3 cho tệp đính kèm âm thanh thông thường, `OGG_OPUS` gốc cho đích tin nhắn thoại và `PCM` thô ở 22050 Hz cho Talk/điện thoại.
- **xAI:** MP3 theo mặc định; quá trình tổng hợp tệp âm thanh có thể sử dụng `mp3`, `wav`, `pcm`, `mulaw` hoặc `alaw` cho cả đầu ra có bộ đệm và phát trực tuyến. Các đích tin nhắn thoại sử dụng MP3 khi phát trực tuyến và làm phương án dự phòng có bộ đệm vì đầu ra `pcm`, `mulaw` và `alaw` của xAI là âm thanh thô không có phần đầu. Quá trình tổng hợp có bộ đệm sử dụng điểm cuối REST theo lô `/v1/tts` của xAI; `textToSpeechStream` sử dụng `wss://api.x.ai/v1/tts` gốc. Đây không phải là hợp đồng giọng nói thời gian thực. Định dạng tin nhắn thoại Opus gốc không được hỗ trợ.
- **Microsoft:** sử dụng `microsoft.outputFormat` (mặc định `audio-24khz-48kbitrate-mono-mp3`).
  - Phương thức truyền tải đi kèm chấp nhận một `outputFormat`, nhưng dịch vụ không cung cấp tất cả định dạng.
  - Các giá trị định dạng đầu ra tuân theo định dạng đầu ra của Microsoft Speech (bao gồm Ogg/WebM Opus).
  - Telegram `sendVoice` chấp nhận OGG/MP3/M4A; hãy sử dụng OpenAI/ElevenLabs nếu bạn cần bảo đảm tin nhắn thoại Opus.
  - Nếu định dạng đầu ra Microsoft đã cấu hình thất bại, OpenClaw sẽ thử lại bằng MP3.
  - Khi không đặt ghi đè giọng nói rõ ràng và sử dụng giọng tiếng Anh mặc định, OpenClaw tự động chuyển sang giọng thần kinh tiếng Trung (`zh-CN-XiaoxiaoNeural`, ngôn ngữ `zh-CN`) nếu văn bản phản hồi chủ yếu là CJK.

Định dạng đầu ra của OpenAI và ElevenLabs được cố định theo từng kênh như liệt kê ở trên.

## Hành vi tự động TTS

Khi `messages.tts.auto` được bật, OpenClaw:

- Bỏ qua TTS nếu phản hồi đã chứa nội dung đa phương tiện có cấu trúc.
- Bỏ qua các phản hồi rất ngắn (dưới 10 ký tự).
- Tóm tắt các phản hồi dài khi tính năng tóm tắt được bật, bằng cách sử dụng
  `summaryModel` (hoặc `agents.defaults.model.primary`).
- Đính kèm âm thanh đã tạo vào phản hồi.
- Trong `mode: "final"`, vẫn gửi TTS chỉ có âm thanh cho các phản hồi cuối được truyền trực tiếp
  sau khi luồng văn bản hoàn tất; nội dung đa phương tiện đã tạo trải qua cùng quy trình
  chuẩn hóa nội dung đa phương tiện của kênh như các tệp đính kèm phản hồi thông thường.

Nếu phản hồi vượt quá `maxLength`, OpenClaw không bao giờ bỏ qua hoàn toàn âm thanh:

- **Bật tóm tắt** (mặc định) và có mô hình tóm tắt: tóm tắt
  văn bản còn khoảng `maxLength` ký tự, sau đó tổng hợp giọng nói từ bản tóm tắt.
- **Tắt tóm tắt**, quá trình tóm tắt thất bại hoặc không có khóa API cho
  mô hình tóm tắt: cắt ngắn văn bản còn `maxLength` ký tự và tổng hợp giọng nói từ
  văn bản đã cắt ngắn.

```text
Phản hồi -> TTS được bật?
  không -> gửi văn bản
  có    -> có nội dung đa phương tiện / quá ngắn?
             có    -> gửi văn bản
             không -> độ dài > giới hạn?
                        không -> TTS -> đính kèm âm thanh
                        có    -> tính năng tóm tắt được bật và khả dụng?
                                   không -> cắt ngắn -> TTS -> đính kèm âm thanh
                                   có    -> tóm tắt -> TTS -> đính kèm âm thanh
```

## Tham chiếu trường

<AccordionGroup>
  <Accordion title="messages.tts.* cấp cao nhất">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Chế độ TTS tự động. `inbound` chỉ gửi âm thanh sau tin nhắn thoại đến; `tagged` chỉ gửi âm thanh khi phản hồi bao gồm các chỉ thị `[[tts:...]]` hoặc một khối `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Công tắc cũ. `openclaw doctor --fix` di chuyển công tắc này sang `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` bao gồm các phản hồi của công cụ/khối ngoài các phản hồi cuối.
    </ParamField>
    <ParamField path="provider" type="string">
      ID nhà cung cấp giọng nói. Khi không được đặt, OpenClaw sử dụng nhà cung cấp đầu tiên đã cấu hình theo thứ tự tự động chọn trong sổ đăng ký. `provider: "edge"` cũ được `openclaw doctor --fix` viết lại thành `"microsoft"`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID persona đang hoạt động từ `personas`. Được chuẩn hóa thành chữ thường.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Danh tính giọng nói ổn định. Các trường: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Xem [Persona](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Mô hình chi phí thấp để tự động tóm tắt; mặc định là `agents.defaults.model.primary`. Chấp nhận `provider/model` hoặc bí danh mô hình đã cấu hình.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Cho phép mô hình phát ra các chỉ thị TTS. `enabled` mặc định là `true`; `allowProvider` mặc định là `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Các cài đặt do nhà cung cấp sở hữu, được định danh bằng ID nhà cung cấp giọng nói. Các khối trực tiếp cũ (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) được `openclaw doctor --fix` viết lại; chỉ commit `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Giới hạn cứng đối với số ký tự đầu vào TTS. `/tts audio`, `tts.convert` và `tts.speak` sẽ thất bại nếu vượt quá giới hạn.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Thời gian chờ yêu cầu tính bằng mili giây. `timeoutMs` theo từng lệnh gọi (công cụ tác nhân, Gateway) được ưu tiên khi được đặt; nếu không, `messages.tts.timeoutMs` được cấu hình rõ ràng sẽ được ưu tiên hơn mọi giá trị mặc định của nhà cung cấp do plugin đặt.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Ghi đè đường dẫn JSON tùy chọn cục bộ (nhà cung cấp/giới hạn/tóm tắt). Mặc định là `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Biến môi trường: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` hoặc `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Khu vực Azure Speech (ví dụ: `eastus`). Biến môi trường: `AZURE_SPEECH_REGION` hoặc `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Tùy chọn ghi đè điểm cuối Azure Speech (bí danh `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName của giọng nói Azure. Mặc định là `en-US-JennyNeural`. Bí danh cũ: `voice`.</ParamField>
    <ParamField path="lang" type="string">Mã ngôn ngữ SSML. Mặc định là `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` của Azure dành cho âm thanh tiêu chuẩn. Mặc định là `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` của Azure dành cho đầu ra ghi chú thoại. Mặc định là `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Dự phòng dùng `ELEVENLABS_API_KEY` hoặc `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID mô hình. Mặc định là `eleven_multilingual_v2`. Các ID cũ `eleven_turbo_v2_5`/`eleven_turbo_v2` được chuẩn hóa thành mô hình `flash` tương ứng.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ID giọng nói ElevenLabs. Mặc định là `pMsXgVXv3BLzUgSXRplE`. Bí danh cũ: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (mỗi trường là `0..1`, mặc định lần lượt là `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, mặc định là `true`), `speed` (`0.5..2.0`, mặc định là `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Chế độ chuẩn hóa văn bản.</ParamField>
    <ParamField path="languageCode" type="string">Mã ISO 639-1 gồm 2 chữ cái (ví dụ: `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Số nguyên `0..4294967295` để đạt tính xác định trong khả năng tốt nhất.</ParamField>
    <ParamField path="baseUrl" type="string">Ghi đè URL cơ sở của API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Dùng dự phòng `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Nếu bỏ qua, TTS có thể tái sử dụng `models.providers.google.apiKey` trước khi dùng biến môi trường dự phòng.</ParamField>
    <ParamField path="model" type="string">Mô hình TTS Gemini. Mặc định `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tên giọng nói dựng sẵn của Gemini. Mặc định `Kore`. Bí danh cũ: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Lời nhắc phong cách bằng ngôn ngữ tự nhiên được thêm vào trước văn bản cần đọc.</ParamField>
    <ParamField path="speakerName" type="string">Nhãn người nói tùy chọn được thêm vào trước văn bản cần đọc khi lời nhắc sử dụng người nói có tên.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Đặt thành `audio-profile-v1` để bao bọc các trường lời nhắc nhân dạng đang hoạt động trong một cấu trúc lời nhắc TTS Gemini có tính xác định.</ParamField>
    <ParamField path="personaPrompt" type="string">Văn bản lời nhắc nhân dạng bổ sung dành riêng cho Google, được nối vào Ghi chú của Đạo diễn trong mẫu.</ParamField>
    <ParamField path="baseUrl" type="string">Chỉ chấp nhận `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Biến môi trường: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL API Gradium HTTPS trên `api.gradium.ai`. Mặc định `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Mặc định Emma (`YTpq7expH9539ERJ`). Bí danh cũ: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld chính

    <ParamField path="apiKey" type="string">Biến môi trường: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Mặc định `inworld-tts-1.5-max`. Ngoài ra: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Mặc định `Sarah`. Bí danh cũ: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Nhiệt độ lấy mẫu `0..2` (không bao gồm 0).</ParamField>

  </Accordion>

  <Accordion title="CLI cục bộ (tts-local-cli)">
    <ParamField path="command" type="string">Tệp thực thi cục bộ hoặc chuỗi lệnh cho TTS qua CLI.</ParamField>
    <ParamField path="args" type="string[]">Đối số lệnh. Hỗ trợ các phần giữ chỗ `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Định dạng đầu ra CLI dự kiến. Mặc định `mp3` cho tệp đính kèm âm thanh.</ParamField>
    <ParamField path="timeoutMs" type="number">Thời gian chờ lệnh tính bằng mili giây. Mặc định `120000`.</ParamField>
    <ParamField path="cwd" type="string">Thư mục làm việc tùy chọn của lệnh.</ParamField>
    <ParamField path="env" type="Record<string, string>">Các giá trị ghi đè biến môi trường tùy chọn cho lệnh.</ParamField>

    Đầu ra chuẩn của lệnh và âm thanh được tạo hoặc chuyển đổi bị giới hạn ở 50 MiB. Đầu ra lỗi chẩn đoán bị giới hạn ở 1 MiB. OpenClaw chấm dứt lệnh và báo tổng hợp thất bại khi vượt quá một trong hai giới hạn.

  </Accordion>

  <Accordion title="Microsoft (không cần khóa API)">
    <ParamField path="enabled" type="boolean" default="true">Cho phép sử dụng giọng nói Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Tên giọng nói nơ-ron của Microsoft (ví dụ: `en-US-MichelleNeural`). Bí danh cũ: `voice`. Nếu đang dùng giọng tiếng Anh mặc định và văn bản trả lời chủ yếu là ký tự CJK, OpenClaw tự động chuyển sang `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Mã ngôn ngữ (ví dụ: `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Định dạng đầu ra Microsoft. Mặc định `audio-24khz-48kbitrate-mono-mp3`. Không phải tất cả định dạng đều được phương thức truyền tải dựa trên Edge đi kèm hỗ trợ.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Chuỗi phần trăm (ví dụ: `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Ghi phụ đề JSON cùng với tệp âm thanh.</ParamField>
    <ParamField path="proxy" type="string">URL proxy cho các yêu cầu giọng nói Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Giá trị ghi đè thời gian chờ yêu cầu (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Bí danh cũ. Chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu thành `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Dùng dự phòng `MINIMAX_API_KEY`. Xác thực Token Plan qua `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` hoặc `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.minimax.io`. Biến môi trường: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Mặc định `speech-2.8-hd`. Biến môi trường: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Mặc định `English_expressive_narrator`. Biến môi trường: `MINIMAX_TTS_VOICE_ID`. Bí danh cũ: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Mặc định `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Mặc định `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Số nguyên `-12..12`. Mặc định `0`. Các giá trị thập phân bị cắt phần lẻ trước khi gửi yêu cầu.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Dùng dự phòng `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID mô hình TTS OpenAI. Mặc định `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tên giọng nói (ví dụ: `alloy`, `cedar`). Mặc định `coral`. Bí danh cũ: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Trường `instructions` OpenAI tường minh. Khi được đặt, các trường lời nhắc nhân dạng **không** được tự động ánh xạ.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Các trường JSON bổ sung được hợp nhất vào phần thân yêu cầu `/audio/speech` sau các trường TTS OpenAI đã tạo. Dùng trường này cho các điểm cuối tương thích với OpenAI như Kokoro yêu cầu khóa dành riêng cho nhà cung cấp như `lang`; các khóa nguyên mẫu không an toàn sẽ bị bỏ qua.</ParamField>
    <ParamField path="baseUrl" type="string">
      Ghi đè điểm cuối TTS OpenAI. Thứ tự phân giải: cấu hình → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Các giá trị không phải mặc định được coi là điểm cuối TTS tương thích với OpenAI, vì vậy tên mô hình và giọng nói tùy chỉnh được chấp nhận, đồng thời `speed` không còn được kiểm tra phạm vi `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Biến môi trường: `OPENROUTER_API_KEY`. Có thể tái sử dụng `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://openrouter.ai/api/v1`. `https://openrouter.ai/v1` cũ được chuẩn hóa.</ParamField>
    <ParamField path="model" type="string">Mặc định `hexgrad/kokoro-82m`. Bí danh: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Mặc định `af_alloy`. Bí danh cũ: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Mặc định `mp3`.</ParamField>
    <ParamField path="speed" type="number">Giá trị ghi đè tốc độ gốc của nhà cung cấp.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Biến môi trường: `VOLCENGINE_TTS_API_KEY` hoặc `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Mặc định `seed-tts-1.0`. Biến môi trường: `VOLCENGINE_TTS_RESOURCE_ID`. Dùng `seed-tts-2.0` khi dự án có quyền sử dụng TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Tiêu đề khóa ứng dụng. Mặc định `aGjiRDfUWi`. Biến môi trường: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Ghi đè điểm cuối HTTP TTS Seed Speech. Biến môi trường: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Loại giọng nói. Mặc định `en_female_anna_mars_bigtts`. Biến môi trường: `VOLCENGINE_TTS_VOICE`. Bí danh cũ: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Tỷ lệ tốc độ gốc của nhà cung cấp, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Thẻ cảm xúc gốc của nhà cung cấp.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated">Các trường Volcengine Speech Console cũ. Biến môi trường: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (mặc định `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Biến môi trường: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.x.ai/v1`. Biến môi trường: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Mặc định `eve`. Khi có xác thực, `openclaw infer tts voices --provider xai` tìm nạp danh mục tích hợp hiện tại; khi không có xác thực, lệnh này liệt kê các phương án dự phòng ngoại tuyến `ara`, `eve`, `leo`, `rex` và `sal`. ID giọng nói tùy chỉnh của tài khoản vẫn được chuyển tiếp ngay cả khi không có trong danh sách tích hợp. Bí danh cũ: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Mã ngôn ngữ BCP-47 hoặc `auto`. Mặc định `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Mặc định `mp3`.</ParamField>
    <ParamField path="speed" type="number">Giá trị ghi đè tốc độ gốc của nhà cung cấp, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Biến môi trường: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mặc định `https://api.xiaomimimo.com/v1`. Biến môi trường: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Mặc định `mimo-v2.5-tts`. Biến môi trường: `XIAOMI_TTS_MODEL`. Cũng hỗ trợ `mimo-v2-tts` và `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Mặc định `mimo_default` cho các mô hình giọng nói cài sẵn. Biến môi trường: `XIAOMI_TTS_VOICE`. Bí danh cũ: `voice`. Không được gửi cho `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Mặc định `mp3`. Biến môi trường: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Chỉ dẫn phong cách tùy chọn bằng ngôn ngữ tự nhiên được gửi dưới dạng tin nhắn của người dùng; không được đọc thành tiếng. Đối với `mimo-v2.5-tts-voicedesign`, đây là lời nhắc thiết kế giọng nói; OpenClaw cung cấp giá trị mặc định khi bỏ qua.</ParamField>
  </Accordion>
</AccordionGroup>

## Công cụ tác nhân

Công cụ `tts` chuyển đổi văn bản thành giọng nói và trả về tệp đính kèm âm thanh để
gửi trong câu trả lời. Trên Feishu, Matrix, Telegram và WhatsApp, âm thanh được
gửi dưới dạng tin nhắn thoại thay vì tệp đính kèm. Feishu và
WhatsApp có thể chuyển mã đầu ra TTS không phải Opus trên đường dẫn này khi
có sẵn `ffmpeg`.

WhatsApp gửi âm thanh qua Baileys dưới dạng ghi chú thoại PTT (`audio` với
`ptt: true`) và gửi văn bản hiển thị **riêng biệt** với âm thanh PTT vì
các ứng dụng khách không hiển thị chú thích trên ghi chú thoại một cách nhất quán.

Công cụ chấp nhận các trường `channel` và `timeoutMs` tùy chọn; `timeoutMs` là
thời gian chờ yêu cầu nhà cung cấp cho mỗi lần gọi, tính bằng mili giây. Các giá trị cho mỗi lần gọi ghi đè
`messages.tts.timeoutMs`; thời gian chờ TTS đã cấu hình ghi đè mọi giá trị mặc định
của nhà cung cấp do Plugin thiết lập.

## RPC Gateway

| Phương thức            | Mục đích                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Đọc trạng thái TTS hiện tại và lần thử gần nhất.     |
| `tts.enable`      | Đặt tùy chọn tự động cục bộ thành `always`.       |
| `tts.disable`     | Đặt tùy chọn tự động cục bộ thành `off`.          |
| `tts.convert`     | Chuyển văn bản thành âm thanh một lần.                        |
| `tts.setProvider` | Đặt tùy chọn nhà cung cấp cục bộ.               |
| `tts.personas`    | Liệt kê các persona đã cấu hình và persona đang hoạt động. |
| `tts.setPersona`  | Đặt tùy chọn persona cục bộ.                |
| `tts.providers`   | Liệt kê các nhà cung cấp đã cấu hình và trạng thái.        |

## Liên kết dịch vụ

- [Hướng dẫn chuyển văn bản thành giọng nói của OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Tài liệu tham khảo OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Chuyển văn bản thành giọng nói qua REST của Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Nhà cung cấp Azure Speech](/vi/providers/azure-speech)
- [Chuyển văn bản thành giọng nói của ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Xác thực ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/vi/providers/gradium)
- [API TTS của Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS của Volcengine](/vi/providers/volcengine#text-to-speech)
- [Tổng hợp giọng nói Xiaomi MiMo](/vi/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Các định dạng đầu ra giọng nói của Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Chuyển văn bản thành giọng nói của xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Nội dung liên quan

- [Tổng quan về phương tiện](/vi/tools/media-overview)
- [Tạo nhạc](/vi/tools/music-generation)
- [Tạo video](/vi/tools/video-generation)
- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)

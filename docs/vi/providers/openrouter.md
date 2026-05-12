---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình qua OpenRouter trong OpenClaw
    - Bạn muốn sử dụng OpenRouter để tạo hình ảnh
    - Bạn muốn sử dụng OpenRouter để tạo video
summary: Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter cung cấp một **API hợp nhất** định tuyến yêu cầu đến nhiều mô hình phía sau một
endpoint và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết OpenAI SDK hoạt động bằng cách đổi URL cơ sở.

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API của bạn">
    Tạo khóa API tại [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Tùy chọn) Chuyển sang một mô hình cụ thể">
    Onboarding mặc định dùng `openrouter/auto`. Chọn một mô hình cụ thể sau:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Ví dụ cấu hình

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Tham chiếu mô hình

<Note>
Tham chiếu mô hình theo mẫu `openrouter/<provider>/<model>`. Để xem danh sách đầy đủ các nhà cung cấp và mô hình
có sẵn, hãy xem [/concepts/model-providers](/vi/concepts/model-providers).
</Note>

Ví dụ dự phòng đi kèm:

| Tham chiếu mô hình               | Ghi chú                           |
| --------------------------------- | --------------------------------- |
| `openrouter/auto`                 | Định tuyến tự động của OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 qua MoonshotAI          |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 qua MoonshotAI          |

## Tạo hình ảnh

OpenRouter cũng có thể hỗ trợ công cụ `image_generate`. Dùng một mô hình hình ảnh OpenRouter trong `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw gửi yêu cầu hình ảnh đến API hình ảnh chat completions của OpenRouter với `modalities: ["image", "text"]`. Các mô hình hình ảnh Gemini nhận các gợi ý `aspectRatio` và `resolution` được hỗ trợ thông qua `image_config` của OpenRouter. Dùng `agents.defaults.imageGenerationModel.timeoutMs` cho các mô hình hình ảnh OpenRouter chậm hơn; tham số `timeoutMs` theo từng lần gọi của công cụ `image_generate` vẫn được ưu tiên.

## Tạo video

OpenRouter cũng có thể hỗ trợ công cụ `video_generate` thông qua API `/videos` bất đồng bộ của nó. Dùng một mô hình video OpenRouter trong `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw gửi các tác vụ text-to-video và image-to-video đến OpenRouter, thăm dò
`polling_url` được trả về, rồi tải video đã hoàn tất từ
`unsigned_urls` của OpenRouter hoặc endpoint nội dung tác vụ đã được tài liệu hóa.
Theo mặc định, hình ảnh tham chiếu được gửi dưới dạng hình ảnh khung đầu/cuối; các hình ảnh
được gắn thẻ `reference_image` được gửi dưới dạng tham chiếu đầu vào của OpenRouter. Mặc định
`google/veo-3.1-fast` đi kèm công bố các thời lượng 4/6/8
giây hiện được hỗ trợ, độ phân giải `720P`/`1080P`, và tỷ lệ khung hình
`16:9`/`9:16`. Video-to-video không được đăng ký cho OpenRouter vì API tạo video
upstream hiện chỉ chấp nhận văn bản và tham chiếu hình ảnh.

## Text-to-speech

OpenRouter cũng có thể được dùng làm nhà cung cấp TTS thông qua endpoint
`/audio/speech` tương thích với OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Nếu bỏ qua `messages.tts.providers.openrouter.apiKey`, TTS sẽ dùng lại
`models.providers.openrouter.apiKey`, rồi đến `OPENROUTER_API_KEY`.

## Speech-to-text (âm thanh đầu vào)

OpenRouter có thể phiên âm tệp đính kèm giọng nói/âm thanh đầu vào thông qua đường dẫn
`tools.media.audio` dùng chung bằng endpoint STT của nó (`/audio/transcriptions`).
Điều này áp dụng cho mọi Plugin kênh chuyển tiếp giọng nói/âm thanh đầu vào vào
bước kiểm tra trước hiểu phương tiện.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw gửi yêu cầu STT của OpenRouter dưới dạng JSON với âm thanh base64 trong
`input_audio` (hợp đồng STT của OpenRouter), không phải dưới dạng tải lên biểu mẫu OpenAI multipart.

## Xác thực và header

OpenRouter sử dụng token Bearer với khóa API của bạn ở bên dưới.

Trên các yêu cầu OpenRouter thực (`https://openrouter.ai/api/v1`), OpenClaw cũng thêm
các header ghi nhận ứng dụng đã được tài liệu hóa của OpenRouter:

| Header                    | Giá trị                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                 |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                            |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Nếu bạn trỏ lại nhà cung cấp OpenRouter sang một proxy hoặc URL cơ sở khác, OpenClaw
**không** chèn các header dành riêng cho OpenRouter đó hoặc các dấu mốc bộ nhớ đệm Anthropic.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Lưu bộ nhớ đệm phản hồi">
    Lưu bộ nhớ đệm phản hồi của OpenRouter là tùy chọn bật. Bật theo từng mô hình OpenRouter bằng
    tham số mô hình:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw gửi `X-OpenRouter-Cache: true` và, khi được cấu hình,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` buộc làm mới cho
    yêu cầu hiện tại và lưu phản hồi thay thế. Các bí danh snake_case
    (`response_cache`, `response_cache_ttl_seconds`, và
    `response_cache_clear`) cũng được chấp nhận.

    Điều này tách biệt với lưu bộ nhớ đệm prompt của nhà cung cấp và các dấu mốc
    `cache_control` Anthropic của OpenRouter. Nó chỉ được áp dụng trên các tuyến
    `openrouter.ai` đã xác minh, không áp dụng cho URL cơ sở proxy tùy chỉnh.

  </Accordion>

  <Accordion title="Dấu mốc bộ nhớ đệm Anthropic">
    Trên các tuyến OpenRouter đã xác minh, tham chiếu mô hình Anthropic giữ các
    dấu mốc `cache_control` Anthropic dành riêng cho OpenRouter mà OpenClaw dùng để
    tái sử dụng bộ nhớ đệm prompt tốt hơn trên các khối prompt hệ thống/nhà phát triển.
  </Accordion>

  <Accordion title="Điền trước suy luận Anthropic">
    Trên các tuyến OpenRouter đã xác minh, tham chiếu mô hình Anthropic có bật suy luận
    sẽ bỏ các lượt điền trước assistant ở cuối trước khi yêu cầu đến OpenRouter,
    khớp với yêu cầu của Anthropic rằng hội thoại suy luận phải kết thúc bằng một lượt người dùng.
  </Accordion>

  <Accordion title="Chèn suy nghĩ / suy luận">
    Trên các tuyến không phải `auto` được hỗ trợ, OpenClaw ánh xạ mức suy nghĩ đã chọn sang
    payload suy luận proxy của OpenRouter. Gợi ý mô hình không được hỗ trợ và
    `openrouter/auto` sẽ bỏ qua việc chèn suy luận đó. Hunter Alpha cũng bỏ qua
    suy luận proxy cho các tham chiếu mô hình đã cấu hình nhưng lỗi thời vì OpenRouter có thể
    trả về văn bản câu trả lời cuối cùng trong các trường suy luận cho tuyến đã ngừng dùng đó.
  </Accordion>

  <Accordion title="Phát lại suy luận DeepSeek V4">
    Trên các tuyến OpenRouter đã xác minh, `openrouter/deepseek/deepseek-v4-flash` và
    `openrouter/deepseek/deepseek-v4-pro` điền `reasoning_content` bị thiếu vào
    các lượt assistant được phát lại để các hội thoại suy nghĩ/công cụ giữ đúng dạng tiếp nối
    mà DeepSeek V4 yêu cầu. OpenClaw gửi các giá trị
    `reasoning_effort` được OpenRouter hỗ trợ cho những tuyến này; `xhigh` là mức được công bố
    cao nhất, và các ghi đè `max` lỗi thời được ánh xạ sang `xhigh`.
  </Accordion>

  <Accordion title="Định dạng yêu cầu chỉ dành cho OpenAI">
    OpenRouter vẫn chạy qua đường dẫn tương thích OpenAI kiểu proxy, nên
    định dạng yêu cầu chỉ dành cho OpenAI gốc như `serviceTier`, `store` của Responses,
    payload tương thích suy luận OpenAI, và gợi ý bộ nhớ đệm prompt không được chuyển tiếp.
  </Accordion>

  <Accordion title="Tuyến được Gemini hỗ trợ">
    Tham chiếu OpenRouter được Gemini hỗ trợ vẫn nằm trên đường dẫn proxy-Gemini: OpenClaw giữ
    việc làm sạch chữ ký suy nghĩ của Gemini ở đó, nhưng không bật xác thực phát lại Gemini gốc
    hoặc viết lại bootstrap.
  </Accordion>

  <Accordion title="Siêu dữ liệu định tuyến nhà cung cấp">
    Nếu bạn truyền định tuyến nhà cung cấp OpenRouter trong tham số mô hình, OpenClaw chuyển tiếp
    nó dưới dạng siêu dữ liệu định tuyến OpenRouter trước khi các wrapper stream dùng chung chạy.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho agent, mô hình và nhà cung cấp.
  </Card>
</CardGroup>

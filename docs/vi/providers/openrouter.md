---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình qua OpenRouter trong OpenClaw
    - Bạn muốn sử dụng OpenRouter để tạo hình ảnh
    - Bạn muốn sử dụng OpenRouter để tạo video
summary: Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-29T23:08:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter cung cấp một **API hợp nhất** định tuyến yêu cầu đến nhiều mô hình phía sau một
endpoint và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết SDK OpenAI hoạt động bằng cách chuyển đổi URL cơ sở.

## Bắt đầu

<Steps>
  <Step title="Get your API key">
    Tạo khóa API tại [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    Onboarding mặc định là `openrouter/auto`. Chọn một mô hình cụ thể sau:

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
Tham chiếu mô hình tuân theo mẫu `openrouter/<provider>/<model>`. Để xem danh sách đầy đủ
các provider và mô hình có sẵn, hãy xem [/concepts/model-providers](/vi/concepts/model-providers).
</Note>

Ví dụ fallback đi kèm:

| Tham chiếu mô hình               | Ghi chú                         |
| --------------------------------- | ------------------------------- |
| `openrouter/auto`                 | Định tuyến tự động OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 qua MoonshotAI        |

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

OpenClaw gửi yêu cầu hình ảnh đến API hình ảnh chat completions của OpenRouter với `modalities: ["image", "text"]`. Các mô hình hình ảnh Gemini nhận gợi ý `aspectRatio` và `resolution` được hỗ trợ thông qua `image_config` của OpenRouter. Dùng `agents.defaults.imageGenerationModel.timeoutMs` cho các mô hình hình ảnh OpenRouter chậm hơn; tham số `timeoutMs` theo từng lần gọi của công cụ `image_generate` vẫn được ưu tiên.

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

OpenClaw gửi tác vụ text-to-video và image-to-video đến OpenRouter, thăm dò
`polling_url` được trả về, rồi tải video hoàn tất xuống từ
`unsigned_urls` của OpenRouter hoặc endpoint nội dung tác vụ đã được tài liệu hóa.
Theo mặc định, hình ảnh tham chiếu được gửi dưới dạng hình ảnh khung đầu/cuối; hình ảnh
được gắn thẻ `reference_image` được gửi dưới dạng tham chiếu đầu vào OpenRouter. Giá trị mặc định
`google/veo-3.1-fast` đi kèm công bố các thời lượng 4/6/8
giây hiện được hỗ trợ, độ phân giải `720P`/`1080P`, và tỷ lệ khung hình
`16:9`/`9:16`. Video-to-video không được đăng ký cho OpenRouter vì API
tạo video upstream hiện chỉ chấp nhận văn bản và tham chiếu hình ảnh.

## Chuyển văn bản thành giọng nói

OpenRouter cũng có thể được dùng làm provider TTS thông qua endpoint
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

## Xác thực và header

OpenRouter ngầm dùng token Bearer với khóa API của bạn.

Trên các yêu cầu OpenRouter thật (`https://openrouter.ai/api/v1`), OpenClaw cũng thêm
các header gán nguồn ứng dụng đã được OpenRouter tài liệu hóa:

| Header                    | Giá trị                |
| ------------------------- | ---------------------- |
| `HTTP-Referer`            | `https://openclaw.ai`  |
| `X-OpenRouter-Title`      | `OpenClaw`             |
| `X-OpenRouter-Categories` | `cli-agent`            |

<Warning>
Nếu bạn trỏ lại provider OpenRouter đến một proxy hoặc URL cơ sở khác, OpenClaw
**không** chèn các header dành riêng cho OpenRouter đó hoặc marker bộ nhớ đệm Anthropic.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    Trên các tuyến OpenRouter đã xác minh, tham chiếu mô hình Anthropic giữ lại
    các marker `cache_control` Anthropic dành riêng cho OpenRouter mà OpenClaw dùng để
    tái sử dụng prompt-cache tốt hơn trên các khối prompt hệ thống/nhà phát triển.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Trên các tuyến non-`auto` được hỗ trợ, OpenClaw ánh xạ cấp độ suy nghĩ đã chọn sang
    payload suy luận proxy của OpenRouter. Gợi ý mô hình không được hỗ trợ và
    `openrouter/auto` sẽ bỏ qua việc chèn suy luận đó. Hunter Alpha cũng bỏ qua
    suy luận proxy cho các tham chiếu mô hình đã cấu hình nhưng lỗi thời vì OpenRouter có thể
    trả về văn bản câu trả lời cuối cùng trong các trường suy luận cho tuyến đã ngừng dùng đó.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter vẫn chạy qua đường dẫn tương thích OpenAI kiểu proxy, nên
    việc định hình yêu cầu chỉ dành cho OpenAI nguyên bản như `serviceTier`, Responses `store`,
    payload tương thích suy luận OpenAI, và gợi ý prompt-cache sẽ không được chuyển tiếp.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Các tham chiếu OpenRouter được Gemini hỗ trợ vẫn ở trên đường dẫn proxy-Gemini: OpenClaw giữ
    quá trình làm sạch chữ ký suy nghĩ Gemini tại đó, nhưng không bật xác thực phát lại Gemini
    nguyên bản hoặc ghi lại bootstrap.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Nếu bạn truyền định tuyến provider OpenRouter trong tham số mô hình, OpenClaw sẽ chuyển tiếp
    nó dưới dạng siêu dữ liệu định tuyến OpenRouter trước khi các wrapper stream dùng chung chạy.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu mô hình, và hành vi failover.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho agent, mô hình, và provider.
  </Card>
</CardGroup>

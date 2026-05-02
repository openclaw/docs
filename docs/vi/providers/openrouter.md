---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình thông qua OpenRouter trong OpenClaw
    - Bạn muốn dùng OpenRouter để tạo hình ảnh
    - Bạn muốn sử dụng OpenRouter để tạo video
summary: Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T10:51:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter cung cấp một **API hợp nhất** định tuyến yêu cầu tới nhiều mô hình phía sau một
điểm cuối và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết SDK OpenAI hoạt động bằng cách chuyển URL cơ sở.

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API của bạn">
    Tạo khóa API tại [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Tùy chọn) Chuyển sang một mô hình cụ thể">
    Quy trình thiết lập ban đầu mặc định dùng `openrouter/auto`. Chọn một mô hình cụ thể sau:

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
các nhà cung cấp và mô hình có sẵn, xem [/concepts/model-providers](/vi/concepts/model-providers).
</Note>

Ví dụ dự phòng đi kèm:

| Tham chiếu mô hình                | Ghi chú                      |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Định tuyến tự động của OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 qua MoonshotAI     |

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

OpenClaw gửi yêu cầu hình ảnh tới API hình ảnh chat completions của OpenRouter với `modalities: ["image", "text"]`. Các mô hình hình ảnh Gemini nhận các gợi ý `aspectRatio` và `resolution` được hỗ trợ thông qua `image_config` của OpenRouter. Dùng `agents.defaults.imageGenerationModel.timeoutMs` cho các mô hình hình ảnh OpenRouter chậm hơn; tham số `timeoutMs` theo từng lệnh gọi của công cụ `image_generate` vẫn được ưu tiên.

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

OpenClaw gửi các tác vụ văn bản thành video và hình ảnh thành video tới OpenRouter, thăm dò
`polling_url` được trả về, rồi tải xuống video đã hoàn tất từ
`unsigned_urls` của OpenRouter hoặc điểm cuối nội dung tác vụ được tài liệu hóa.
Theo mặc định, ảnh tham chiếu được gửi dưới dạng ảnh khung đầu/cuối; ảnh
được gắn thẻ `reference_image` được gửi dưới dạng tham chiếu đầu vào OpenRouter. Giá trị mặc định
`google/veo-3.1-fast` đi kèm công bố các thời lượng 4/6/8
giây hiện được hỗ trợ, độ phân giải `720P`/`1080P`, và tỷ lệ khung hình
`16:9`/`9:16`. Video thành video không được đăng ký cho OpenRouter vì API
tạo video thượng nguồn hiện chỉ chấp nhận tham chiếu văn bản và hình ảnh.

## Văn bản thành giọng nói

OpenRouter cũng có thể được dùng làm nhà cung cấp TTS thông qua điểm cuối
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

OpenRouter dùng token Bearer với khóa API của bạn ở bên dưới.

Trên các yêu cầu OpenRouter thật (`https://openrouter.ai/api/v1`), OpenClaw cũng thêm
các header gán nguồn ứng dụng được OpenRouter tài liệu hóa:

| Header                    | Giá trị               |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Nếu bạn trỏ lại nhà cung cấp OpenRouter tới một proxy hoặc URL cơ sở khác, OpenClaw
**không** chèn các header dành riêng cho OpenRouter đó hoặc các dấu mốc bộ nhớ đệm Anthropic.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Dấu mốc bộ nhớ đệm Anthropic">
    Trên các tuyến OpenRouter đã xác minh, tham chiếu mô hình Anthropic giữ lại
    các dấu mốc `cache_control` Anthropic dành riêng cho OpenRouter mà OpenClaw dùng để
    tái sử dụng bộ nhớ đệm prompt tốt hơn trên các khối prompt hệ thống/nhà phát triển.
  </Accordion>

  <Accordion title="Điền sẵn suy luận Anthropic">
    Trên các tuyến OpenRouter đã xác minh, tham chiếu mô hình Anthropic có bật suy luận
    sẽ loại bỏ các lượt điền sẵn assistant ở cuối trước khi yêu cầu tới OpenRouter,
    khớp với yêu cầu của Anthropic rằng hội thoại suy luận phải kết thúc bằng một lượt
    người dùng.
  </Accordion>

  <Accordion title="Chèn tư duy / suy luận">
    Trên các tuyến không phải `auto` được hỗ trợ, OpenClaw ánh xạ mức tư duy đã chọn tới
    payload suy luận proxy của OpenRouter. Các gợi ý mô hình không được hỗ trợ và
    `openrouter/auto` bỏ qua bước chèn suy luận đó. Hunter Alpha cũng bỏ qua
    suy luận proxy cho các tham chiếu mô hình đã cấu hình nhưng lỗi thời vì OpenRouter có thể
    trả về văn bản câu trả lời cuối trong các trường suy luận cho tuyến đã ngừng dùng đó.
  </Accordion>

  <Accordion title="Phát lại suy luận DeepSeek V4">
    Trên các tuyến OpenRouter đã xác minh, `openrouter/deepseek/deepseek-v4-flash` và
    `openrouter/deepseek/deepseek-v4-pro` điền `reasoning_content` còn thiếu trên
    các lượt assistant được phát lại để hội thoại tư duy/công cụ giữ đúng hình dạng
    theo dõi bắt buộc của DeepSeek V4.
  </Accordion>

  <Accordion title="Định hình yêu cầu chỉ dành cho OpenAI">
    OpenRouter vẫn chạy qua đường dẫn tương thích OpenAI kiểu proxy, vì vậy
    việc định hình yêu cầu chỉ dành cho OpenAI gốc như `serviceTier`, Responses `store`,
    payload tương thích suy luận OpenAI, và gợi ý bộ nhớ đệm prompt không được chuyển tiếp.
  </Accordion>

  <Accordion title="Tuyến dựa trên Gemini">
    Tham chiếu OpenRouter dựa trên Gemini vẫn nằm trên đường dẫn proxy-Gemini: OpenClaw giữ
    việc làm sạch chữ ký tư duy Gemini ở đó, nhưng không bật xác thực phát lại Gemini gốc
    hoặc viết lại bootstrap.
  </Accordion>

  <Accordion title="Siêu dữ liệu định tuyến nhà cung cấp">
    Nếu bạn truyền định tuyến nhà cung cấp OpenRouter trong tham số mô hình, OpenClaw chuyển tiếp
    nó dưới dạng siêu dữ liệu định tuyến OpenRouter trước khi các trình bao stream dùng chung chạy.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho agent, mô hình, và nhà cung cấp.
  </Card>
</CardGroup>

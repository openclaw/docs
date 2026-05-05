---
read_when:
    - Bạn muốn dùng một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình thông qua OpenRouter trong OpenClaw
    - Bạn muốn sử dụng OpenRouter để tạo hình ảnh
    - Bạn muốn sử dụng OpenRouter để tạo video
summary: Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:49:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter cung cấp một **API hợp nhất** định tuyến yêu cầu đến nhiều mô hình phía sau một
endpoint và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết SDK OpenAI hoạt động bằng cách chuyển base URL.

## Bắt đầu

<Steps>
  <Step title="Nhận khóa API của bạn">
    Tạo khóa API tại [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Tùy chọn) Chuyển sang một mô hình cụ thể">
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
các nhà cung cấp và mô hình hiện có, xem [/concepts/model-providers](/vi/concepts/model-providers).
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

OpenClaw gửi yêu cầu hình ảnh đến API hình ảnh chat completions của OpenRouter với `modalities: ["image", "text"]`. Các mô hình hình ảnh Gemini nhận gợi ý `aspectRatio` và `resolution` được hỗ trợ thông qua `image_config` của OpenRouter. Dùng `agents.defaults.imageGenerationModel.timeoutMs` cho các mô hình hình ảnh OpenRouter chậm hơn; tham số `timeoutMs` theo từng lệnh gọi của công cụ `image_generate` vẫn được ưu tiên.

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
`polling_url` được trả về, rồi tải xuống video hoàn tất từ
`unsigned_urls` của OpenRouter hoặc endpoint nội dung tác vụ được tài liệu hóa.
Theo mặc định, hình ảnh tham chiếu được gửi dưới dạng hình ảnh khung đầu/cuối; hình ảnh
được gắn thẻ `reference_image` được gửi dưới dạng tham chiếu đầu vào của OpenRouter. Mặc định
`google/veo-3.1-fast` đi kèm công bố các thời lượng 4/6/8
giây hiện được hỗ trợ, độ phân giải `720P`/`1080P`, và tỷ lệ khung hình
`16:9`/`9:16`. Video-to-video không được đăng ký cho OpenRouter vì API
tạo video upstream hiện chấp nhận tham chiếu văn bản và hình ảnh.

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

Nếu bỏ qua `messages.tts.providers.openrouter.apiKey`, TTS sẽ tái sử dụng
`models.providers.openrouter.apiKey`, rồi đến `OPENROUTER_API_KEY`.

## Xác thực và header

OpenRouter sử dụng Bearer token với khóa API của bạn ở bên dưới.

Trên các yêu cầu OpenRouter thực (`https://openrouter.ai/api/v1`), OpenClaw cũng thêm
các header ghi nhận ứng dụng được OpenRouter tài liệu hóa:

| Header                    | Giá trị                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Nếu bạn trỏ lại nhà cung cấp OpenRouter đến một proxy hoặc base URL khác, OpenClaw
**không** chèn các header dành riêng cho OpenRouter đó hoặc marker bộ nhớ đệm Anthropic.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Bộ nhớ đệm phản hồi">
    Bộ nhớ đệm phản hồi của OpenRouter là tùy chọn bật rõ ràng. Bật theo từng mô hình OpenRouter bằng
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

    Điều này tách biệt với bộ nhớ đệm prompt của nhà cung cấp và các marker
    `cache_control` Anthropic của OpenRouter. Nó chỉ được áp dụng trên các route
    `openrouter.ai` đã xác minh, không áp dụng cho base URL proxy tùy chỉnh.

  </Accordion>

  <Accordion title="Marker bộ nhớ đệm Anthropic">
    Trên các route OpenRouter đã xác minh, tham chiếu mô hình Anthropic giữ các
    marker `cache_control` Anthropic dành riêng cho OpenRouter mà OpenClaw dùng để
    tái sử dụng bộ nhớ đệm prompt tốt hơn trên các khối prompt hệ thống/nhà phát triển.
  </Accordion>

  <Accordion title="Nạp trước suy luận Anthropic">
    Trên các route OpenRouter đã xác minh, tham chiếu mô hình Anthropic có bật suy luận
    sẽ loại bỏ các lượt nạp trước trợ lý ở cuối trước khi yêu cầu đến OpenRouter,
    khớp với yêu cầu của Anthropic rằng hội thoại suy luận phải kết thúc bằng một lượt
    người dùng.
  </Accordion>

  <Accordion title="Chèn thinking / reasoning">
    Trên các route không phải `auto` được hỗ trợ, OpenClaw ánh xạ mức thinking đã chọn sang
    payload suy luận proxy OpenRouter. Gợi ý mô hình không được hỗ trợ và
    `openrouter/auto` bỏ qua việc chèn suy luận đó. Hunter Alpha cũng bỏ qua
    suy luận proxy cho các tham chiếu mô hình được cấu hình đã cũ vì OpenRouter có thể
    trả về văn bản câu trả lời cuối cùng trong các trường suy luận cho route đã ngừng dùng đó.
  </Accordion>

  <Accordion title="Phát lại suy luận DeepSeek V4">
    Trên các route OpenRouter đã xác minh, `openrouter/deepseek/deepseek-v4-flash` và
    `openrouter/deepseek/deepseek-v4-pro` điền `reasoning_content` bị thiếu trên
    các lượt trợ lý được phát lại để hội thoại thinking/công cụ giữ đúng dạng theo dõi bắt buộc của DeepSeek V4. OpenClaw gửi các giá trị
    `reasoning_effort` được OpenRouter hỗ trợ cho các route này; `xhigh` là mức được công bố
    cao nhất, và các ghi đè `max` đã cũ được ánh xạ sang `xhigh`.
  </Accordion>

  <Accordion title="Định dạng yêu cầu chỉ dành cho OpenAI">
    OpenRouter vẫn chạy qua đường dẫn tương thích OpenAI theo kiểu proxy, nên
    định dạng yêu cầu chỉ dành riêng cho OpenAI gốc như `serviceTier`, Responses `store`,
    payload tương thích suy luận OpenAI, và gợi ý bộ nhớ đệm prompt không được chuyển tiếp.
  </Accordion>

  <Accordion title="Route dùng Gemini phía sau">
    Tham chiếu OpenRouter dùng Gemini phía sau vẫn nằm trên đường dẫn proxy-Gemini: OpenClaw giữ
    quá trình làm sạch chữ ký suy nghĩ Gemini tại đó, nhưng không bật xác thực phát lại Gemini gốc
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

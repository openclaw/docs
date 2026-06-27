---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình qua OpenRouter trong OpenClaw
    - Bạn muốn sử dụng OpenRouter để tạo hình ảnh
    - Bạn muốn dùng OpenRouter để tạo nhạc
    - Bạn muốn dùng OpenRouter để tạo video
summary: Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:05:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter cung cấp một **API hợp nhất** định tuyến yêu cầu tới nhiều mô hình phía sau một
endpoint và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết SDK OpenAI hoạt động bằng cách chuyển URL cơ sở.

## Bắt đầu

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw mở luồng đăng nhập trình duyệt của OpenRouter, trao đổi mã
        PKCE lấy khóa API OpenRouter, rồi lưu khóa đó trong hồ sơ xác thực
        OpenRouter mặc định. Trên máy chủ từ xa/không có giao diện, OpenClaw in
        URL đăng nhập và yêu cầu bạn dán URL chuyển hướng sau khi đăng nhập.
      </Step>
      <Step title="(Optional) Switch to a specific model">
        Onboarding mặc định dùng `openrouter/auto`. Chọn một mô hình cụ thể sau:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get your API key">
        Tạo khóa API tại [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Run API-key onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Switch to a specific model">
        Onboarding mặc định dùng `openrouter/auto`. Chọn một mô hình cụ thể sau:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

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
Tham chiếu mô hình theo mẫu `openrouter/<provider>/<model>`. Để xem danh sách đầy đủ các
nhà cung cấp và mô hình có sẵn, xem [/concepts/model-providers](/vi/concepts/model-providers).
</Note>

Ví dụ dự phòng được đóng gói:

| Tham chiếu mô hình               | Ghi chú                        |
| --------------------------------- | ------------------------------ |
| `openrouter/auto`                 | Định tuyến tự động OpenRouter  |
| `openrouter/openrouter/fusion`    | Bộ định tuyến OpenRouter Fusion |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 qua MoonshotAI       |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 qua MoonshotAI       |

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

OpenClaw gửi yêu cầu hình ảnh tới API hình ảnh chat completions của OpenRouter với `modalities: ["image", "text"]`. Các mô hình hình ảnh Gemini nhận gợi ý `aspectRatio` và `resolution` được hỗ trợ thông qua `image_config` của OpenRouter. Dùng `agents.defaults.imageGenerationModel.timeoutMs` cho các mô hình hình ảnh OpenRouter chậm hơn; tham số `timeoutMs` theo từng lần gọi của công cụ `image_generate` vẫn được ưu tiên.

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

OpenClaw gửi tác vụ văn bản-thành-video và hình ảnh-thành-video tới OpenRouter, thăm dò
`polling_url` được trả về, rồi tải xuống video hoàn tất từ
`unsigned_urls` của OpenRouter hoặc endpoint nội dung tác vụ được tài liệu hóa.
Theo mặc định, hình ảnh tham chiếu được gửi dưới dạng hình ảnh khung đầu/cuối; hình ảnh
được gắn thẻ `reference_image` được gửi dưới dạng tham chiếu đầu vào OpenRouter. Mặc định
`google/veo-3.1-fast` được đóng gói công bố các thời lượng 4/6/8 giây hiện được hỗ trợ,
độ phân giải `720P`/`1080P`, và tỷ lệ khung hình `16:9`/`9:16`. Video-thành-video không
được đăng ký cho OpenRouter vì API tạo video upstream hiện chỉ chấp nhận tham chiếu văn bản và hình ảnh.

## Tạo nhạc

OpenRouter cũng có thể hỗ trợ công cụ `music_generate` thông qua đầu ra âm thanh
chat completions. Dùng một mô hình âm thanh OpenRouter trong
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Nhà cung cấp nhạc OpenRouter được đóng gói mặc định dùng
`google/lyria-3-pro-preview` và cũng cung cấp
`google/lyria-3-clip-preview`. OpenClaw gửi `modalities: ["text",
"audio"]`, bật truyền trực tuyến, thu thập các đoạn âm thanh được truyền trực tuyến, rồi lưu
kết quả dưới dạng phương tiện đã tạo để gửi qua kênh. Hình ảnh tham chiếu được
chấp nhận cho các mô hình Lyria thông qua tham số `music_generate image=...` dùng chung.

## Văn bản-thành-giọng nói

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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Nếu bỏ qua `messages.tts.providers.openrouter.apiKey`, TTS dùng lại
`models.providers.openrouter.apiKey`, rồi đến `OPENROUTER_API_KEY`.

## Giọng nói-thành-văn bản (âm thanh đầu vào)

OpenRouter có thể chép lời tệp đính kèm giọng nói/âm thanh đầu vào thông qua đường dẫn
`tools.media.audio` dùng chung bằng endpoint STT của nó (`/audio/transcriptions`).
Điều này áp dụng cho mọi Plugin kênh chuyển tiếp giọng nói/âm thanh đầu vào vào
bước kiểm tra trước để hiểu phương tiện.

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

OpenClaw gửi yêu cầu STT OpenRouter dưới dạng JSON với âm thanh base64 trong
`input_audio` (hợp đồng STT OpenRouter), không phải dưới dạng tải lên biểu mẫu OpenAI multipart.

## Bộ định tuyến Fusion

Dùng OpenRouter Fusion khi bạn muốn một tham chiếu mô hình OpenClaw yêu cầu nhiều
mô hình OpenRouter chạy song song, để OpenRouter đánh giá câu trả lời của chúng, và trả về một
phản hồi cuối cùng duy nhất qua endpoint nhà cung cấp OpenRouter thông thường. Vì
slug mô hình upstream là `openrouter/fusion`, tham chiếu mô hình OpenClaw bao gồm
cả tiền tố nhà cung cấp OpenClaw và namespace OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

Cấu hình bảng và mô hình đánh giá của Fusion thông qua `params.extraBody` của mô hình. Các
trường đó được chuyển tiếp vào thân yêu cầu chat-completions của OpenRouter. Fusion
hoạt động với cả onboarding OAuth OpenRouter hoặc onboarding khóa API; nếu bạn dùng
OAuth, hãy bỏ dòng `env.OPENROUTER_API_KEY` khỏi ví dụ bên dưới.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

Danh sách `analysis_models` là bảng chạy song song, còn `model` bên trong cấu hình Plugin
Fusion là mô hình đánh giá. Không đặt `tool_choice` cấp cao nhất thành
`"required"` trong các lượt agent/chat OpenClaw thông thường để cố ép Fusion;
các lượt OpenClaw có thể bao gồm định nghĩa công cụ OpenClaw, và lựa chọn công cụ bắt buộc
cấp cao nhất có thể yêu cầu một trong các công cụ đó thay vì bộ định tuyến Fusion. Khi
cấu hình Plugin Fusion này hiện diện, OpenClaw cũng thêm một ghi chú system-prompt
đã làm sạch với các mô hình phân tích và mô hình đánh giá đã cấu hình để
agent có thể trả lời câu hỏi về bảng Fusion hiện tại của nó. Các trường `extraBody`
khác không được sao chép vào prompt.

Fusion chậm hơn theo thiết kế. OpenRouter có thể gửi cùng một prompt OpenClaw tới
nhiều mô hình phân tích rồi chạy bước đánh giá/tổng hợp cuối cùng, nên độ trễ
thường cao hơn so với yêu cầu trực tiếp một mô hình. Dùng Fusion cho các câu trả lời có cân nhắc,
chất lượng cao hoặc các đường leo thang, không dùng làm mặc định cho
chat nhạy với độ trễ. Để phản hồi nhanh hơn, giữ bảng nhỏ và chọn
các mô hình phân tích và đánh giá nhanh hơn.

Kiểm thử tham chiếu đã cấu hình bằng một lần gọi mô hình cục bộ một lượt:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Xác thực và header

OpenRouter dùng token Bearer với khóa API của bạn ở bên dưới. OpenRouter
OAuth là luồng đăng nhập PKCE phát hành một khóa API OpenRouter, nên OpenClaw lưu
kết quả dưới dạng cùng hồ sơ xác thực khóa API `openrouter:default` được dùng bởi
đường dẫn thiết lập khóa API thủ công.

Với một bản cài đặt hiện có, hãy đăng nhập hoặc xoay vòng khóa OpenRouter đã lưu mà không
chạy lại toàn bộ onboarding:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Dùng `openclaw models auth login --provider openrouter --method api-key` khi
bạn muốn dán một khóa đã tạo thủ công tại OpenRouter.

Trên các yêu cầu OpenRouter thật (`https://openrouter.ai/api/v1`), OpenClaw cũng thêm
các header quy kết ứng dụng được tài liệu hóa của OpenRouter:

| Header                    | Giá trị                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Nếu bạn trỏ lại nhà cung cấp OpenRouter tới một proxy hoặc URL cơ sở khác, OpenClaw
**không** chèn các header riêng cho OpenRouter đó hoặc dấu cache Anthropic.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Response caching">
    Cache phản hồi OpenRouter là tùy chọn bật. Bật theo từng mô hình OpenRouter bằng
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
    yêu cầu hiện tại và lưu phản hồi thay thế. Các alias snake_case
    (`response_cache`, `response_cache_ttl_seconds`, và
    `response_cache_clear`) cũng được chấp nhận.

    Điều này tách biệt với cache prompt của nhà cung cấp và với các dấu
    `cache_control` Anthropic của OpenRouter. Nó chỉ được áp dụng trên các route
    `openrouter.ai` đã xác minh, không áp dụng cho URL cơ sở proxy tùy chỉnh.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Trên các route OpenRouter đã xác minh, tham chiếu mô hình Anthropic giữ các
    dấu `cache_control` Anthropic riêng cho OpenRouter mà OpenClaw dùng để
    tái sử dụng prompt-cache tốt hơn trên các khối prompt system/developer.
  </Accordion>

  <Accordion title="Điền sẵn suy luận Anthropic">
    Trên các tuyến OpenRouter đã được xác minh, các tham chiếu mô hình Anthropic có bật suy luận
    sẽ bỏ các lượt điền sẵn trợ lý ở cuối trước khi yêu cầu đến OpenRouter,
    khớp với yêu cầu của Anthropic rằng các cuộc hội thoại suy luận phải kết thúc bằng một lượt
    người dùng.
  </Accordion>

  <Accordion title="Chèn thinking / reasoning">
    Trên các tuyến không phải `auto` được hỗ trợ, OpenClaw ánh xạ mức thinking đã chọn sang
    payload suy luận proxy của OpenRouter. Các gợi ý mô hình không được hỗ trợ và
    `openrouter/auto` bỏ qua phần chèn suy luận đó. Hunter Alpha cũng bỏ qua
    suy luận proxy cho các tham chiếu mô hình đã cấu hình nhưng cũ vì OpenRouter có thể
    trả về văn bản câu trả lời cuối cùng trong các trường suy luận cho tuyến đã ngừng hoạt động đó.
  </Accordion>

  <Accordion title="Phát lại suy luận DeepSeek V4">
    Trên các tuyến OpenRouter đã được xác minh, `openrouter/deepseek/deepseek-v4-flash` và
    `openrouter/deepseek/deepseek-v4-pro` điền `reasoning_content` còn thiếu trên
    các lượt trợ lý được phát lại để các cuộc hội thoại thinking/công cụ giữ đúng dạng theo dõi bắt buộc của DeepSeek V4.
    OpenClaw gửi các giá trị `reasoning_effort` được OpenRouter hỗ trợ
    cho các tuyến này; `xhigh` là mức cao nhất được quảng bá,
    và các ghi đè `max` cũ được ánh xạ sang `xhigh`.
  </Accordion>

  <Accordion title="Định hình yêu cầu chỉ dành cho OpenAI">
    OpenRouter vẫn chạy qua đường dẫn tương thích OpenAI kiểu proxy, nên
    việc định hình yêu cầu chỉ dành riêng cho OpenAI như `serviceTier`, Responses `store`,
    payload tương thích suy luận của OpenAI và gợi ý prompt-cache không được chuyển tiếp.
  </Accordion>

  <Accordion title="Các tuyến dựa trên Gemini">
    Các tham chiếu OpenRouter dựa trên Gemini vẫn ở trên đường dẫn proxy-Gemini: OpenClaw giữ
    việc làm sạch chữ ký suy nghĩ Gemini ở đó, nhưng không bật xác thực phát lại Gemini
    gốc hoặc các lần viết lại bootstrap.
  </Accordion>

  <Accordion title="Siêu dữ liệu định tuyến nhà cung cấp">
    OpenRouter hỗ trợ một đối tượng yêu cầu `provider` để định tuyến nhà cung cấp
    bên dưới. Cấu hình một chính sách mặc định cho tất cả yêu cầu mô hình văn bản OpenRouter
    bằng `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw chuyển tiếp đối tượng đó đến OpenRouter dưới dạng payload `provider`
    của yêu cầu. Dùng các trường snake_case được OpenRouter ghi trong tài liệu, bao gồm `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr`, và `enforce_distillable_text`.

    Tham số theo từng mô hình vẫn ghi đè đối tượng định tuyến toàn nhà cung cấp:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Điều này chỉ áp dụng trên các tuyến chat-completions của OpenRouter. Các tuyến Anthropic,
    Google, OpenAI trực tiếp hoặc nhà cung cấp tùy chỉnh sẽ bỏ qua tham số định tuyến OpenRouter.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tài liệu tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ cho tác tử, mô hình và nhà cung cấp.
  </Card>
</CardGroup>

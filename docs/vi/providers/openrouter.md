---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình qua OpenRouter trong OpenClaw
    - Bạn muốn sử dụng OpenRouter để tạo hình ảnh
    - Bạn muốn dùng OpenRouter để tạo nhạc
    - Bạn muốn sử dụng OpenRouter để tạo video
summary: Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:45:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter cung cấp một **API hợp nhất** định tuyến yêu cầu tới nhiều mô hình phía sau một
điểm cuối và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết SDK OpenAI hoạt động bằng cách chuyển URL cơ sở.

## Bắt đầu

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw mở luồng đăng nhập bằng trình duyệt của OpenRouter, trao đổi mã
        PKCE lấy khóa API OpenRouter, rồi lưu khóa đó vào hồ sơ xác thực
        OpenRouter mặc định. Trên máy chủ từ xa/không có giao diện, OpenClaw in
        URL đăng nhập và yêu cầu bạn dán URL chuyển hướng sau khi đăng nhập.
      </Step>
      <Step title="(Optional) Switch to a specific model">
        Thiết lập ban đầu mặc định dùng `openrouter/auto`. Chọn một mô hình cụ thể sau:

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
        Thiết lập ban đầu mặc định dùng `openrouter/auto`. Chọn một mô hình cụ thể sau:

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
Tham chiếu mô hình theo mẫu `openrouter/<provider>/<model>`. Để xem danh sách đầy đủ
các nhà cung cấp và mô hình có sẵn, xem [/concepts/model-providers](/vi/concepts/model-providers).
</Note>

Ví dụ dự phòng đi kèm:

| Tham chiếu mô hình                | Ghi chú                      |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Định tuyến tự động OpenRouter |
| `openrouter/openrouter/fusion`    | Bộ định tuyến OpenRouter Fusion |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 qua MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 qua MoonshotAI     |

## Tạo hình ảnh

OpenRouter cũng có thể làm nền cho công cụ `image_generate`. Dùng một mô hình hình ảnh OpenRouter trong `agents.defaults.imageGenerationModel`:

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

OpenClaw gửi yêu cầu hình ảnh tới API hình ảnh chat completions của OpenRouter với `modalities: ["image", "text"]`. Các mô hình hình ảnh Gemini nhận gợi ý `aspectRatio` và `resolution` được hỗ trợ thông qua `image_config` của OpenRouter. Dùng `agents.defaults.imageGenerationModel.timeoutMs` cho các mô hình hình ảnh OpenRouter chậm hơn; tham số `timeoutMs` theo từng lệnh gọi của công cụ `image_generate` vẫn được ưu tiên.

## Tạo video

OpenRouter cũng có thể làm nền cho công cụ `video_generate` thông qua API `/videos` bất đồng bộ của nó. Dùng một mô hình video OpenRouter trong `agents.defaults.videoGenerationModel`:

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

OpenClaw gửi tác vụ văn bản-sang-video và hình ảnh-sang-video tới OpenRouter, thăm dò
`polling_url` được trả về, rồi tải video đã hoàn tất từ
`unsigned_urls` của OpenRouter hoặc điểm cuối nội dung tác vụ đã được tài liệu hóa.
Theo mặc định, hình ảnh tham chiếu được gửi dưới dạng hình ảnh khung đầu/cuối; hình ảnh
được gắn thẻ `reference_image` được gửi dưới dạng tham chiếu đầu vào OpenRouter. Mặc định
`google/veo-3.1-fast` đi kèm công bố các khoảng thời lượng 4/6/8
giây hiện được hỗ trợ, độ phân giải `720P`/`1080P`, và tỷ lệ khung hình
`16:9`/`9:16`. Video-sang-video không được đăng ký cho OpenRouter vì API
tạo video upstream hiện chỉ chấp nhận văn bản và tham chiếu hình ảnh.

## Tạo nhạc

OpenRouter cũng có thể làm nền cho công cụ `music_generate` thông qua đầu ra âm thanh
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

Nhà cung cấp nhạc OpenRouter đi kèm mặc định dùng
`google/lyria-3-pro-preview` và cũng cung cấp
`google/lyria-3-clip-preview`. OpenClaw gửi `modalities: ["text",
"audio"]`, bật truyền phát, thu thập các đoạn âm thanh được truyền phát, rồi lưu
kết quả dưới dạng phương tiện được tạo để gửi qua kênh. Hình ảnh tham chiếu được
chấp nhận cho các mô hình Lyria thông qua tham số `music_generate image=...`
dùng chung.

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

## Giọng nói thành văn bản (âm thanh đầu vào)

OpenRouter có thể phiên âm tệp đính kèm giọng nói/âm thanh đầu vào thông qua đường dẫn
`tools.media.audio` dùng chung bằng điểm cuối STT của nó (`/audio/transcriptions`).
Điều này áp dụng cho mọi Plugin kênh chuyển tiếp giọng nói/âm thanh đầu vào vào
bước chuẩn bị hiểu phương tiện.

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
`input_audio` (hợp đồng STT của OpenRouter), không phải dưới dạng bản tải lên biểu mẫu OpenAI multipart.

## Bộ định tuyến Fusion

Dùng OpenRouter Fusion khi bạn muốn một tham chiếu mô hình OpenClaw hỏi nhiều
mô hình OpenRouter song song, để OpenRouter đánh giá câu trả lời của chúng, rồi trả về một
phản hồi cuối duy nhất thông qua điểm cuối nhà cung cấp OpenRouter thông thường. Vì
slug mô hình upstream là `openrouter/fusion`, tham chiếu mô hình OpenClaw bao gồm
cả tiền tố nhà cung cấp OpenClaw và không gian tên OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

Cấu hình nhóm phân tích và mô hình đánh giá của Fusion thông qua `params.extraBody` của mô hình. Các
trường đó được chuyển tiếp vào thân yêu cầu chat-completions của OpenRouter. Fusion
hoạt động với cả thiết lập OAuth OpenRouter hoặc thiết lập khóa API; nếu bạn dùng
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

Danh sách `analysis_models` là nhóm phân tích song song, và `model` bên trong cấu hình Plugin
Fusion là mô hình đánh giá. Không đặt `tool_choice` cấp cao nhất thành
`"required"` trong các lượt agent/chat OpenClaw thông thường để cố ép dùng Fusion;
các lượt OpenClaw có thể bao gồm định nghĩa công cụ OpenClaw, và lựa chọn công cụ bắt buộc
cấp cao nhất có thể yêu cầu một trong các công cụ đó thay vì bộ định tuyến Fusion. Khi
cấu hình Plugin Fusion này có mặt, OpenClaw cũng thêm một ghi chú
system-prompt đã làm sạch với các mô hình phân tích và mô hình đánh giá đã cấu hình để
agent có thể trả lời câu hỏi về nhóm Fusion hiện tại của nó. Các trường `extraBody`
khác không được sao chép vào prompt.

Fusion chậm hơn theo thiết kế. OpenRouter có thể gửi cùng một prompt OpenClaw tới
nhiều mô hình phân tích rồi chạy bước đánh giá/tổng hợp cuối cùng, nên độ trễ
thường cao hơn yêu cầu trực tiếp tới một mô hình duy nhất. Dùng Fusion cho các câu trả lời
cân nhắc kỹ, chất lượng cao hoặc các đường dẫn leo thang, không dùng làm mặc định cho
chat nhạy cảm với độ trễ. Để phản hồi nhanh hơn, giữ nhóm nhỏ và chọn
mô hình phân tích và đánh giá nhanh hơn.

Kiểm thử tham chiếu đã cấu hình bằng một lệnh gọi mô hình cục bộ một lần:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Xác thực và header

OpenRouter dùng mã thông báo Bearer với khóa API của bạn ở bên dưới. OpenRouter
OAuth là luồng đăng nhập PKCE phát hành khóa API OpenRouter, nên OpenClaw lưu
kết quả dưới dạng cùng hồ sơ xác thực khóa API `openrouter:default` mà đường dẫn
thiết lập khóa API thủ công sử dụng.

Với bản cài đặt hiện có, đăng nhập hoặc xoay vòng khóa OpenRouter đã lưu mà không
chạy lại toàn bộ thiết lập ban đầu:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Dùng `openclaw models auth login --provider openrouter --method api-key` khi
bạn muốn dán khóa đã tạo thủ công tại OpenRouter.

Trên các yêu cầu OpenRouter thật (`https://openrouter.ai/api/v1`), OpenClaw cũng thêm
các header quy thuộc ứng dụng đã được OpenRouter tài liệu hóa:

| Header                    | Giá trị                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Nếu bạn trỏ lại nhà cung cấp OpenRouter tới một proxy hoặc URL cơ sở khác, OpenClaw
**không** chèn các header đặc thù OpenRouter đó hoặc dấu cache Anthropic.
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
    yêu cầu hiện tại và lưu phản hồi thay thế. Các bí danh snake_case
    (`response_cache`, `response_cache_ttl_seconds`, và
    `response_cache_clear`) cũng được chấp nhận.

    Điều này tách biệt với cache prompt của nhà cung cấp và với các dấu
    `cache_control` Anthropic của OpenRouter. Nó chỉ được áp dụng trên các tuyến
    `openrouter.ai` đã xác minh, không áp dụng cho URL cơ sở proxy tùy chỉnh.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Trên các tuyến OpenRouter đã xác minh, tham chiếu mô hình Anthropic giữ các
    dấu `cache_control` Anthropic đặc thù OpenRouter mà OpenClaw dùng để
    tái sử dụng prompt-cache tốt hơn trên các khối prompt hệ thống/nhà phát triển.
  </Accordion>

  <Accordion title="Điền sẵn phần reasoning của Anthropic">
    Trên các tuyến OpenRouter đã được xác minh, các tham chiếu mô hình Anthropic có bật reasoning
    sẽ loại bỏ các lượt điền sẵn cuối của trợ lý trước khi yêu cầu đến OpenRouter,
    khớp với yêu cầu của Anthropic rằng các cuộc hội thoại reasoning phải kết thúc bằng một lượt
    của người dùng.
  </Accordion>

  <Accordion title="Chèn thinking / reasoning">
    Trên các tuyến không phải `auto` được hỗ trợ, OpenClaw ánh xạ cấp thinking đã chọn sang
    các payload reasoning proxy của OpenRouter. Các gợi ý mô hình không được hỗ trợ và
    `openrouter/auto` sẽ bỏ qua việc chèn reasoning đó. Hunter Alpha cũng bỏ qua
    reasoning proxy cho các tham chiếu mô hình đã cấu hình nhưng lỗi thời vì OpenRouter có thể
    trả về văn bản câu trả lời cuối cùng trong các trường reasoning cho tuyến đã ngừng dùng đó.
  </Accordion>

  <Accordion title="Phát lại reasoning của DeepSeek V4">
    Trên các tuyến OpenRouter đã được xác minh, `openrouter/deepseek/deepseek-v4-flash` và
    `openrouter/deepseek/deepseek-v4-pro` điền `reasoning_content` còn thiếu trên
    các lượt trợ lý được phát lại để các cuộc hội thoại thinking/công cụ giữ đúng hình dạng theo dõi bắt buộc của DeepSeek V4. OpenClaw gửi các giá trị
    `reasoning.effort` được OpenRouter hỗ trợ cho các tuyến này; các mức không tắt thấp hơn ánh xạ sang
    `high`, và các ghi đè `max` lỗi thời được ánh xạ sang `xhigh`.
  </Accordion>

  <Accordion title="Định hình yêu cầu chỉ dành cho OpenAI">
    OpenRouter vẫn chạy qua đường dẫn tương thích OpenAI kiểu proxy, vì vậy
    định hình yêu cầu chỉ dành cho OpenAI gốc như `serviceTier`, Responses `store`,
    các payload tương thích reasoning của OpenAI và gợi ý bộ nhớ đệm prompt không được chuyển tiếp.
  </Accordion>

  <Accordion title="Các tuyến dùng Gemini làm nền">
    Các tham chiếu OpenRouter dùng Gemini làm nền vẫn ở trên đường dẫn proxy-Gemini: OpenClaw giữ
    việc làm sạch chữ ký suy nghĩ của Gemini ở đó, nhưng không bật xác thực phát lại Gemini gốc
    hoặc viết lại bootstrap.
  </Accordion>

  <Accordion title="Siêu dữ liệu định tuyến nhà cung cấp">
    OpenRouter hỗ trợ một đối tượng yêu cầu `provider` cho định tuyến nhà cung cấp bên dưới.
    Cấu hình chính sách mặc định cho tất cả yêu cầu mô hình văn bản OpenRouter
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

    OpenClaw chuyển tiếp đối tượng đó đến OpenRouter dưới dạng payload yêu cầu `provider`.
    Sử dụng các trường snake_case được OpenRouter ghi tài liệu, bao gồm `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr`, và `enforce_distillable_text`.

    Các tham số theo từng mô hình vẫn ghi đè đối tượng định tuyến toàn nhà cung cấp:

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
    Google, OpenAI trực tiếp, hoặc nhà cung cấp tùy chỉnh sẽ bỏ qua tham số định tuyến OpenRouter.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho tác tử, mô hình, và nhà cung cấp.
  </Card>
</CardGroup>

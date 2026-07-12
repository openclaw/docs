---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình qua OpenRouter trong OpenClaw
    - Bạn muốn sử dụng OpenRouter để tạo hình ảnh
    - Bạn muốn sử dụng OpenRouter để tạo nhạc
    - Bạn muốn sử dụng OpenRouter để tạo video
summary: Sử dụng API hợp nhất của OpenRouter để truy cập nhiều mô hình trong OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T08:16:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter định tuyến các yêu cầu đến nhiều mô hình thông qua một API và một khóa duy nhất. Dịch vụ này
tương thích với OpenAI, vì vậy OpenClaw giao tiếp với nó qua cùng phương thức truyền tải kiểu
`openai-completions` được sử dụng cho các nhà cung cấp proxy khác.

## Bắt đầu

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Chạy quy trình thiết lập OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw mở luồng đăng nhập qua trình duyệt của OpenRouter (PKCE), trao đổi
        mã để lấy khóa API OpenRouter và lưu khóa đó vào hồ sơ xác thực
        OpenRouter mặc định. Trên máy chủ từ xa/không có giao diện, OpenClaw in
        URL đăng nhập và yêu cầu bạn dán URL chuyển hướng sau khi đăng nhập.
      </Step>
      <Step title="(Không bắt buộc) Chuyển sang một mô hình cụ thể">
        Quy trình thiết lập mặc định sử dụng `openrouter/auto`. Bạn có thể chọn một mô hình cụ thể sau:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Khóa API">
    <Steps>
      <Step title="Lấy khóa API của bạn">
        Tạo khóa API tại [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Chạy quy trình thiết lập bằng khóa API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Không bắt buộc) Chuyển sang một mô hình cụ thể">
        Quy trình thiết lập mặc định sử dụng `openrouter/auto`. Bạn có thể chọn một mô hình cụ thể sau:

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
Tham chiếu mô hình tuân theo mẫu `openrouter/<provider>/<model>`. Để xem danh sách đầy đủ
các nhà cung cấp và mô hình hiện có, hãy xem [/concepts/model-providers](/vi/concepts/model-providers).
</Note>

Các mô hình dự phòng được đóng gói sẵn, dùng khi không thể khám phá danh mục trực tiếp:

| Tham chiếu mô hình                | Ghi chú                              |
| --------------------------------- | ------------------------------------ |
| `openrouter/auto`                 | OpenRouter tự động định tuyến         |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 thông qua MoonshotAI        |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 thông qua MoonshotAI        |

Mọi tham chiếu `openrouter/<provider>/<model>` khác, bao gồm
`openrouter/openrouter/fusion` (xem [bộ định tuyến Fusion](#fusion-router)), đều được phân giải
động dựa trên danh mục mô hình trực tiếp của OpenRouter.

## Tạo hình ảnh

OpenRouter có thể cung cấp nền tảng cho công cụ `image_generate`. Đặt một mô hình hình ảnh OpenRouter
trong `agents.defaults.imageGenerationModel`:

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

OpenClaw gửi các yêu cầu hình ảnh đến API hình ảnh hoàn tất hội thoại của OpenRouter với
`modalities: ["image", "text"]`. Các mô hình hình ảnh Gemini còn nhận thêm
gợi ý `aspectRatio` và `resolution` thông qua `image_config` của OpenRouter; các
mô hình hình ảnh khác thì không. Sử dụng `agents.defaults.imageGenerationModel.timeoutMs` cho
các mô hình chậm hơn; giá trị `timeoutMs` theo từng lệnh gọi của công cụ `image_generate` vẫn được ưu tiên.

## Tạo video

OpenRouter có thể cung cấp nền tảng cho công cụ `video_generate` thông qua API
`/videos` bất đồng bộ. Đặt một mô hình video OpenRouter trong
`agents.defaults.videoGenerationModel`:

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

OpenClaw gửi các tác vụ chuyển văn bản thành video và hình ảnh thành video, thăm dò
`polling_url` được trả về và tải video hoàn tất từ `unsigned_urls` của OpenRouter
hoặc điểm cuối nội dung của tác vụ. Theo mặc định, hình ảnh tham chiếu được dùng làm
khung hình đầu/cuối; thay vào đó, các hình ảnh được gắn thẻ `reference_image` sẽ được gửi
làm tham chiếu đầu vào. Mặc định `google/veo-3.1-fast` được đóng gói sẵn hỗ trợ thời lượng
4/6/8 giây, độ phân giải `720P`/`1080P` và tỷ lệ khung hình `16:9`/`9:16`.
Không hỗ trợ chuyển video thành video: API thượng nguồn chỉ chấp nhận văn bản và
hình ảnh tham chiếu.

## Tạo nhạc

OpenRouter có thể cung cấp nền tảng cho công cụ `music_generate` thông qua đầu ra âm thanh
của API hoàn tất hội thoại. Đặt một mô hình âm thanh OpenRouter trong
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

Nhà cung cấp nhạc OpenRouter được đóng gói sẵn mặc định sử dụng `google/lyria-3-pro-preview`
và cũng cung cấp `google/lyria-3-clip-preview`. OpenClaw gửi `modalities:
["text", "audio"]`, truyền phát phản hồi, thu thập các đoạn âm thanh và lưu
kết quả dưới dạng nội dung đa phương tiện được tạo để phân phối qua kênh. Các mô hình Lyria chấp nhận một
hình ảnh tham chiếu thông qua tham số dùng chung `music_generate image=...`.
Âm thanh truyền phát, việc lưu giữ bản chép lời và lớp bao sự kiện SSE được tạo ra
bị giới hạn bởi `agents.defaults.mediaMaxMb` (giới hạn âm thanh mặc định là 16 MB).

## Chuyển văn bản thành giọng nói

OpenRouter có thể hoạt động như một nhà cung cấp TTS thông qua điểm cuối
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

Nếu `messages.tts.providers.openrouter.apiKey` bị bỏ qua, TTS sẽ lần lượt dùng
`models.providers.openrouter.apiKey`, rồi `OPENROUTER_API_KEY` làm phương án dự phòng.

## Chuyển giọng nói thành văn bản (âm thanh đầu vào)

OpenRouter có thể phiên âm các tệp đính kèm giọng nói/âm thanh đầu vào thông qua
đường dẫn dùng chung `tools.media.audio`, bằng điểm cuối STT (`/audio/transcriptions`).
Điều này áp dụng cho mọi Plugin kênh chuyển tiếp giọng nói/âm thanh đầu vào
sang bước kiểm tra sơ bộ để nhận hiểu nội dung đa phương tiện.

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

OpenClaw gửi yêu cầu STT tới OpenRouter dưới dạng JSON, với âm thanh mã hóa base64
trong `input_audio` (theo hợp đồng STT của OpenRouter), thay vì dưới dạng tệp tải lên
qua biểu mẫu OpenAI nhiều phần.

## Bộ định tuyến Fusion

OpenRouter Fusion gửi một tham chiếu mô hình OpenClaw đến nhiều mô hình OpenRouter
song song, để OpenRouter đánh giá câu trả lời của chúng, rồi trả về một phản hồi cuối
cùng thông qua điểm cuối OpenRouter thông thường. Định danh mô hình phía thượng nguồn là
`openrouter/fusion`, vì vậy tham chiếu mô hình OpenClaw chứa cả tiền tố nhà cung cấp
OpenClaw và không gian tên OpenRouter phía thượng nguồn:

```bash
openclaw models set openrouter/openrouter/fusion
```

Cấu hình nhóm mô hình và mô hình đánh giá của Fusion thông qua `params.extraBody`
của mô hình; các trường này được chuyển tiếp trực tiếp vào phần thân yêu cầu
hoàn thành trò chuyện của OpenRouter. Fusion hoạt động với cả quy trình thiết lập
bằng OAuth hoặc khóa API; nếu dùng OAuth, hãy bỏ dòng `env.OPENROUTER_API_KEY`
bên dưới.

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

`analysis_models` là nhóm mô hình chạy song song; `model` bên trong cấu hình Plugin
Fusion là mô hình đánh giá. Không đặt `tool_choice` cấp cao nhất thành `"required"`
trong các lượt tác tử/trò chuyện thông thường để cố buộc dùng Fusion: các lượt OpenClaw
có thể bao gồm định nghĩa công cụ riêng, và lựa chọn bắt buộc dùng công cụ ở cấp cao nhất
có thể chọn một trong các công cụ đó thay vì bộ định tuyến Fusion. Khi có cấu hình Plugin
Fusion này, OpenClaw thêm một ghi chú đã được làm sạch vào lời nhắc hệ thống, liệt kê các
mô hình phân tích đã cấu hình và mô hình đánh giá, để tác tử có thể trả lời câu hỏi về
chính nhóm Fusion của mình. Các trường `extraBody` khác không được sao chép vào lời nhắc.

Fusion được thiết kế để chậm hơn: OpenRouter phân phối lời nhắc đến nhiều mô hình
phân tích, sau đó chạy một bước đánh giá/tổng hợp, nên độ trễ cao hơn yêu cầu trực tiếp
đến một mô hình duy nhất. Hãy dùng Fusion cho các câu trả lời có chủ đích, chất lượng cao
hoặc các lộ trình chuyển cấp, không dùng làm lựa chọn mặc định nhạy cảm với độ trễ.
Giữ nhóm mô hình ở quy mô nhỏ và chọn các mô hình phân tích/đánh giá nhanh hơn để nhận
phản hồi nhanh hơn.

Kiểm thử một tham chiếu đã cấu hình bằng lệnh gọi cục bộ một lần:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Xác thực và tiêu đề

OpenRouter sử dụng mã thông báo Bearer lấy từ khóa API của bạn. OAuth của OpenRouter
là một luồng đăng nhập PKCE cấp khóa API OpenRouter, vì vậy OpenClaw lưu kết quả trong
cùng hồ sơ xác thực bằng khóa API `openrouter:default` được dùng khi thiết lập khóa API
thủ công.

Để đăng nhập hoặc xoay vòng khóa đã lưu trên một bản cài đặt hiện có mà không phải chạy
lại toàn bộ quy trình thiết lập ban đầu:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Trên các yêu cầu OpenRouter đã xác minh (`https://openrouter.ai/api/v1`), OpenClaw thêm
các tiêu đề ghi nhận ứng dụng theo tài liệu của OpenRouter:

| Tiêu đề                   | Giá trị                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Nếu bạn chuyển nhà cung cấp OpenRouter sang một proxy hoặc URL cơ sở khác, OpenClaw
sẽ **không** chèn các tiêu đề dành riêng cho OpenRouter hoặc các dấu mốc bộ nhớ đệm Anthropic đó.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Bộ nhớ đệm phản hồi">
    Bộ nhớ đệm phản hồi của OpenRouter là tính năng phải chủ động bật. Bật riêng cho từng mô hình:

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
    yêu cầu hiện tại và lưu phản hồi thay thế. Các bí danh kiểu snake_case
    (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`) đều được chấp nhận, cũng như `responseCacheTtl` /
    `response_cache_ttl` không có hậu tố `Seconds`.

    Tính năng này tách biệt với bộ nhớ đệm lời nhắc của nhà cung cấp và các
    dấu mốc `cache_control` Anthropic của OpenRouter. Nó chỉ áp dụng trên các
    tuyến `openrouter.ai` đã xác minh, không áp dụng cho URL cơ sở proxy tùy chỉnh.

  </Accordion>

  <Accordion title="Dấu mốc bộ nhớ đệm Anthropic">
    Trên các tuyến OpenRouter đã xác minh, tham chiếu mô hình Anthropic giữ lại
    các dấu mốc `cache_control` Anthropic của OpenRouter để tái sử dụng bộ nhớ đệm
    lời nhắc tốt hơn cho các khối lời nhắc hệ thống/nhà phát triển.
  </Accordion>

  <Accordion title="Prefill suy luận Anthropic">
    Trên các tuyến OpenRouter đã được xác minh, các tham chiếu mô hình Anthropic có bật suy luận
    sẽ loại bỏ các lượt prefill cuối của trợ lý trước khi yêu cầu đến
    OpenRouter, phù hợp với yêu cầu của Anthropic rằng hội thoại suy luận
    phải kết thúc bằng một lượt của người dùng.
  </Accordion>

  <Accordion title="Chèn tư duy / suy luận">
    Trên các tuyến không phải `auto` được hỗ trợ, OpenClaw ánh xạ mức tư duy đã chọn
    sang payload suy luận proxy của OpenRouter. `openrouter/auto` và các gợi ý
    mô hình không được hỗ trợ sẽ bỏ qua thao tác chèn đó. Các tham chiếu `openrouter/hunter-alpha`
    cũ cũng bỏ qua thao tác này vì OpenRouter có thể trả về văn bản câu trả lời cuối cùng trong các trường
    suy luận trên tuyến đã ngừng hoạt động đó.
  </Accordion>

  <Accordion title="Phát lại suy luận DeepSeek V4">
    Trên các tuyến OpenRouter đã được xác minh, `openrouter/deepseek/deepseek-v4-flash` và
    `openrouter/deepseek/deepseek-v4-pro` điền `reasoning_content` còn thiếu trong
    các lượt trợ lý được phát lại, duy trì hội thoại tư duy/công cụ theo
    định dạng tiếp nối bắt buộc của DeepSeek V4. OpenClaw gửi các giá trị
    `reasoning.effort` được OpenRouter hỗ trợ cho các tuyến này: `xhigh`/`max` ánh xạ thành `xhigh`,
    mọi mức khác không phải tắt đều ánh xạ thành `high`.
  </Accordion>

  <Accordion title="Định hình yêu cầu chỉ dành cho OpenAI">
    OpenRouter chạy qua đường dẫn tương thích OpenAI kiểu proxy, vì vậy việc
    định hình yêu cầu chỉ dành cho OpenAI gốc như `serviceTier`, `store` của Responses,
    các payload tương thích suy luận OpenAI và các gợi ý bộ nhớ đệm prompt sẽ không được chuyển tiếp.
  </Accordion>

  <Accordion title="Các tuyến dựa trên Gemini">
    Các tham chiếu OpenRouter dựa trên Gemini vẫn ở đường dẫn proxy-Gemini: OpenClaw duy trì
    việc làm sạch chữ ký tư duy Gemini tại đó, nhưng không bật
    xác thực phát lại hoặc viết lại khởi tạo gốc của Gemini.
  </Accordion>

  <Accordion title="Siêu dữ liệu định tuyến nhà cung cấp">
    OpenRouter hỗ trợ đối tượng yêu cầu `provider` để định tuyến nhà cung cấp
    nền tảng. Cấu hình chính sách mặc định cho mọi yêu cầu mô hình văn bản OpenRouter
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
    của yêu cầu. Hãy sử dụng các trường snake_case được tài liệu OpenRouter quy định, bao gồm `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` và `enforce_distillable_text`.

    Các tham số theo từng mô hình ghi đè đối tượng định tuyến chung của nhà cung cấp:

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

    Điều này chỉ áp dụng trên các tuyến hoàn tất trò chuyện OpenRouter. Các tuyến Anthropic,
    Google, OpenAI trực tiếp hoặc tuyến nhà cung cấp tùy chỉnh sẽ bỏ qua các tham số định tuyến OpenRouter.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ cho tác tử, mô hình và nhà cung cấp.
  </Card>
</CardGroup>

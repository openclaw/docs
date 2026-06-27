---
read_when:
    - Bạn muốn các mô hình MiniMax trong OpenClaw
    - Bạn cần hướng dẫn thiết lập MiniMax
summary: Sử dụng các mô hình MiniMax trong OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:04:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M3**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Token Plan search API

Provider split:

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Text, image generation, music generation, video generation, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Text, image generation, music generation, video generation, image understanding, speech             |

## Built-in catalog

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Chat (reasoning) | Default hosted reasoning model           |
| `MiniMax-M2.7`           | Chat (reasoning) | Previous hosted reasoning model          |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Faster M2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | Image understanding model                |
| `image-01`               | Image generation | Text-to-image and image-to-image editing |
| `music-2.6`              | Music generation | Default music model                      |
| `music-2.5`              | Music generation | Previous music generation tier           |
| `music-2.0`              | Music generation | Legacy music generation tier             |
| `MiniMax-Hailuo-2.3`     | Video generation | Text-to-video and image reference flows  |

## Getting started

Choose your preferred auth method and follow the setup steps.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Best for:** quick setup with MiniMax Coding Plan via OAuth, no API key required.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            This authenticates against `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            This authenticates against `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Referral link for MiniMax Coding Plan (10% off): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Best for:** hosted MiniMax with Anthropic-compatible API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            This configures `api.minimax.io` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            This configures `api.minimaxi.com` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config example

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax M2.x thinking by default unless you explicitly set `thinking` yourself. M2.x's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly. MiniMax-M3 (and forward-compatible M3.x) is exempt from this default: M3 emits proper Anthropic thinking blocks and requires thinking active to produce visible content, so OpenClaw keeps M3 on the provider's omitted/adaptive thinking path.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Choose **Model/auth** from the menu.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Pick one of the available MiniMax options:

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | International OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China OAuth (Coding Plan) |
    | `minimax-global-api` | International API key |
    | `minimax-cn-api` | China API key |

  </Step>
  <Step title="Pick your default model">
    Select your default model when prompted.
  </Step>
</Steps>

## Capabilities

### Image generation

The MiniMax plugin registers the `image-01` model for the `image_generate` tool. It supports:

- **Text-to-image generation** with aspect ratio control
- **Image-to-image editing** (subject reference) with aspect ratio control
- Up to **9 output images** per request
- Up to **1 reference image** per edit request
- Supported aspect ratios: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

To use MiniMax for image generation, set it as the image generation provider:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

The plugin uses the same `MINIMAX_API_KEY` or OAuth auth as the text models. No additional configuration is needed if MiniMax is already set up.

Both `minimax` and `minimax-portal` register `image_generate` with the same
`image-01` model. API-key setups use `MINIMAX_API_KEY`; OAuth setups can use
the bundled `minimax-portal` auth path instead.

Image generation always uses MiniMax's dedicated image endpoint
(`/v1/image_generation`) and ignores `models.providers.minimax.baseUrl`,
since that field configures the chat/Anthropic-compatible base URL. Set
`MINIMAX_API_HOST=https://api.minimaxi.com` to route image generation
through the CN endpoint; the default global endpoint is
`https://api.minimax.io`.

When onboarding or API-key setup writes explicit `models.providers.minimax`
entries, OpenClaw materializes `MiniMax-M3`, `MiniMax-M2.7`, and
`MiniMax-M2.7-highspeed` as chat models. M3 advertises text and image input;
image understanding remains exposed separately through the plugin-owned
`MiniMax-VL-01` media provider.

<Note>
See [Image Generation](/vi/tools/image-generation) for shared tool parameters, provider selection, and failover behavior.
</Note>

### Text-to-speech

The bundled `minimax` plugin registers MiniMax T2A v2 as a speech provider for
`messages.tts`.

- Default TTS model: `speech-2.8-hd`
- Default voice: `English_expressive_narrator`
- Supported bundled model ids include `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, and `speech-01-turbo`.
- Auth resolution is `messages.tts.providers.minimax.apiKey`, then
  `minimax-portal` OAuth/token auth profiles, then Token Plan environment
  keys (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), then `MINIMAX_API_KEY`.
- If no TTS host is configured, OpenClaw reuses the configured
  `minimax-portal` OAuth host and strips Anthropic-compatible path suffixes
  such as `/anthropic`.
- Normal audio attachments stay MP3.
- Voice-note targets such as Feishu and Telegram are transcoded from MiniMax
  MP3 to 48kHz Opus with `ffmpeg`, because the Feishu/Lark file API only
  accepts `file_type: "opus"` for native audio messages.
- MiniMax T2A accepts fractional `speed` and `vol`, but `pitch` is sent as an
  integer; OpenClaw truncates fractional `pitch` values before the API request.

| Setting                                         | Env var                | Default                       | Description                      |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API host.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model id.                    |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Voice id used for speech output. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Playback speed, `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Integer pitch shift, `-12..12`.  |

### Music generation

The bundled MiniMax plugin registers music generation through the shared
`music_generate` tool for both `minimax` and `minimax-portal`.

- Mô hình nhạc mặc định: `minimax/music-2.6`
- Mô hình nhạc OAuth: `minimax-portal/music-2.6`
- Cũng hỗ trợ `minimax/music-2.5` và `minimax/music-2.0`
- Điều khiển prompt: `lyrics`, `instrumental`
- Định dạng đầu ra: `mp3`
- Các lượt chạy có phiên hỗ trợ sẽ tách ra qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

Để dùng MiniMax làm nhà cung cấp nhạc mặc định:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Xem [Tạo nhạc](/vi/tools/music-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

### Tạo video

Plugin MiniMax đi kèm đăng ký tạo video thông qua công cụ dùng chung
`video_generate` cho cả `minimax` và `minimax-portal`.

- Mô hình video mặc định: `minimax/MiniMax-Hailuo-2.3`
- Mô hình video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Chế độ: luồng văn bản thành video và tham chiếu một hình ảnh
- Hỗ trợ `aspectRatio` và `resolution`

Để dùng MiniMax làm nhà cung cấp video mặc định:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

### Hiểu hình ảnh

Plugin MiniMax đăng ký khả năng hiểu hình ảnh tách biệt với danh mục
văn bản:

| ID nhà cung cấp  | Mô hình hình ảnh mặc định |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Đó là lý do định tuyến phương tiện tự động có thể dùng khả năng hiểu hình ảnh của MiniMax ngay cả
khi danh mục nhà cung cấp văn bản đi kèm cũng bao gồm các tham chiếu trò chuyện M3 có khả năng xử lý hình ảnh.

### Tìm kiếm web

Plugin MiniMax cũng đăng ký `web_search` thông qua API tìm kiếm MiniMax Token Plan.

- ID nhà cung cấp: `minimax`
- Kết quả có cấu trúc: tiêu đề, URL, đoạn trích, truy vấn liên quan
- Biến môi trường ưu tiên: `MINIMAX_CODE_PLAN_KEY`
- Bí danh môi trường được chấp nhận: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Dự phòng tương thích: `MINIMAX_API_KEY` khi biến này đã trỏ tới thông tin xác thực token-plan
- Tái sử dụng vùng: `plugins.entries.minimax.config.webSearch.region`, rồi `MINIMAX_API_HOST`, rồi các URL cơ sở của nhà cung cấp MiniMax
- Tìm kiếm vẫn ở ID nhà cung cấp `minimax`; thiết lập OAuth CN/toàn cầu có thể điều hướng vùng gián tiếp thông qua `models.providers.minimax-portal.baseUrl` và có thể cung cấp xác thực bearer thông qua `MINIMAX_OAUTH_TOKEN`

Cấu hình nằm dưới `plugins.entries.minimax.config.webSearch.*`.

<Note>
Xem [Tìm kiếm MiniMax](/vi/tools/minimax-search) để biết cấu hình và cách dùng tìm kiếm web đầy đủ.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tùy chọn cấu hình">
    | Tùy chọn | Mô tả |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Ưu tiên `https://api.minimax.io/anthropic` (tương thích Anthropic); `https://api.minimax.io/v1` là tùy chọn cho payload tương thích OpenAI |
    | `models.providers.minimax.api` | Ưu tiên `anthropic-messages`; `openai-completions` là tùy chọn cho payload tương thích OpenAI |
    | `models.providers.minimax.apiKey` | Khóa API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Định nghĩa `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Đặt bí danh cho các mô hình bạn muốn đưa vào allowlist |
    | `models.mode` | Giữ `merge` nếu bạn muốn thêm MiniMax cùng với các mục tích hợp sẵn |
  </Accordion>

  <Accordion title="Mặc định Thinking">
    Trên `api: "anthropic-messages"`, OpenClaw chèn `thinking: { type: "disabled" }` cho các mô hình MiniMax M2.x trừ khi thinking đã được đặt rõ ràng trong tham số/cấu hình.

    Điều này ngăn endpoint streaming của M2.x phát ra `reasoning_content` trong các đoạn delta kiểu OpenAI, vốn sẽ làm lộ suy luận nội bộ trong đầu ra hiển thị.

    MiniMax-M3 (và M3.x) được miễn trừ: M3 phát ra các khối thinking Anthropic đúng chuẩn và trả về mảng `content` rỗng với `stop_reason: "end_turn"` khi thinking bị tắt, nên wrapper giữ M3 trên đường dẫn thinking bị bỏ qua/thích ứng của nhà cung cấp.

  </Accordion>

  <Accordion title="Chế độ nhanh">
    `/fast on` hoặc `params.fastMode: true` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed` trên đường dẫn stream tương thích Anthropic.
  </Accordion>

  <Accordion title="Ví dụ dự phòng">
    **Phù hợp nhất cho:** giữ mô hình thế hệ mới nhất mạnh nhất của bạn làm chính, chuyển đổi dự phòng sang MiniMax M2.7. Ví dụ bên dưới dùng Opus làm mô hình chính cụ thể; hãy thay bằng mô hình chính thế hệ mới nhất bạn ưa dùng.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chi tiết sử dụng Coding Plan">
    - API sử dụng Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` hoặc `https://api.minimax.io/v1/token_plan/remains` (yêu cầu khóa coding plan).
    - Việc thăm dò mức sử dụng lấy host từ `models.providers.minimax-portal.baseUrl` hoặc `models.providers.minimax.baseUrl` khi được cấu hình, vì vậy các thiết lập toàn cầu dùng `https://api.minimax.io/anthropic` sẽ thăm dò `api.minimax.io`. URL cơ sở bị thiếu hoặc sai định dạng sẽ giữ dự phòng CN để tương thích.
    - OpenClaw chuẩn hóa mức sử dụng coding-plan của MiniMax sang cùng màn hình `% left` được các nhà cung cấp khác dùng. Các trường thô `usage_percent` / `usagePercent` của MiniMax là hạn mức còn lại, không phải hạn mức đã tiêu thụ, nên OpenClaw đảo ngược chúng. Các trường dựa trên số lượng được ưu tiên khi có.
    - Khi API trả về `model_remains`, OpenClaw ưu tiên mục mô hình trò chuyện, suy ra nhãn cửa sổ từ `start_time` / `end_time` khi cần, và đưa tên mô hình đã chọn vào nhãn gói để các cửa sổ coding-plan dễ phân biệt hơn.
    - Ảnh chụp nhanh mức sử dụng coi `minimax`, `minimax-cn` và `minimax-portal` là cùng một bề mặt hạn mức MiniMax, và ưu tiên OAuth MiniMax đã lưu trước khi dự phòng về các biến môi trường khóa Coding Plan.

  </Accordion>
</AccordionGroup>

## Ghi chú

- Tham chiếu mô hình đi theo đường dẫn xác thực:
  - Thiết lập khóa API: `minimax/<model>`
  - Thiết lập OAuth: `minimax-portal/<model>`
- Mô hình trò chuyện mặc định: `MiniMax-M3`
- Mô hình trò chuyện thay thế: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding và thiết lập khóa API trực tiếp ghi định nghĩa mô hình cho M3 và cả hai biến thể M2.7
- Hiểu hình ảnh dùng nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin sở hữu
- Cập nhật giá trị giá trong `models.json` nếu bạn cần theo dõi chi phí chính xác
- Dùng `openclaw models list` để xác nhận ID nhà cung cấp hiện tại, rồi chuyển bằng `openclaw models set minimax/MiniMax-M3` hoặc `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Liên kết giới thiệu cho MiniMax Coding Plan (giảm 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) để biết quy tắc nhà cung cấp.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title='"Mô hình không xác định: minimax/MiniMax-M3"'>
    Điều này thường có nghĩa là **nhà cung cấp MiniMax chưa được cấu hình** (không có mục nhà cung cấp khớp và không tìm thấy hồ sơ xác thực/khóa môi trường MiniMax). Bản sửa cho phát hiện này có trong **2026.1.12**. Sửa bằng cách:

    - Nâng cấp lên **2026.1.12** (hoặc chạy từ mã nguồn `main`), rồi khởi động lại gateway.
    - Chạy `openclaw configure` và chọn một tùy chọn xác thực **MiniMax**, hoặc
    - Thêm thủ công khối `models.providers.minimax` hoặc `models.providers.minimax-portal` khớp, hoặc
    - Đặt `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, hoặc một hồ sơ xác thực MiniMax để nhà cung cấp khớp có thể được chèn.

    Đảm bảo ID mô hình **phân biệt chữ hoa chữ thường**:

    - Đường dẫn khóa API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7`, hoặc `minimax/MiniMax-M2.7-highspeed`
    - Đường dẫn OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7`, hoặc `minimax-portal/MiniMax-M2.7-highspeed`

    Sau đó kiểm tra lại bằng:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [FAQ](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Tham số công cụ nhạc dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tìm kiếm MiniMax" href="/vi/tools/minimax-search" icon="magnifying-glass">
    Cấu hình tìm kiếm web qua MiniMax Token Plan.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và FAQ.
  </Card>
</CardGroup>

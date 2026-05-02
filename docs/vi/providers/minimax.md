---
read_when:
    - Bạn muốn dùng các mô hình MiniMax trong OpenClaw
    - Bạn cần hướng dẫn thiết lập MiniMax
summary: Sử dụng các mô hình MiniMax trong OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T10:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

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
| `MiniMax-M2.7`           | Chat (reasoning) | Default hosted reasoning model           |
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
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M2.7`.
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax thinking by default unless you explicitly set `thinking` yourself. MiniMax's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="Khởi chạy trình hướng dẫn">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Chọn Model/auth">
    Chọn **Model/auth** từ menu.
  </Step>
  <Step title="Chọn một tùy chọn xác thực MiniMax">
    Chọn một trong các tùy chọn MiniMax có sẵn:

    | Lựa chọn xác thực | Mô tả |
    | --- | --- |
    | `minimax-global-oauth` | OAuth quốc tế (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Trung Quốc (Coding Plan) |
    | `minimax-global-api` | Khóa API quốc tế |
    | `minimax-cn-api` | Khóa API Trung Quốc |

  </Step>
  <Step title="Chọn mô hình mặc định của bạn">
    Chọn mô hình mặc định của bạn khi được nhắc.
  </Step>
</Steps>

## Khả năng

### Tạo hình ảnh

Plugin MiniMax đăng ký mô hình `image-01` cho công cụ `image_generate`. Công cụ này hỗ trợ:

- **Tạo hình ảnh từ văn bản** với khả năng kiểm soát tỷ lệ khung hình
- **Chỉnh sửa hình ảnh từ hình ảnh** (tham chiếu chủ thể) với khả năng kiểm soát tỷ lệ khung hình
- Tối đa **9 hình ảnh đầu ra** cho mỗi yêu cầu
- Tối đa **1 hình ảnh tham chiếu** cho mỗi yêu cầu chỉnh sửa
- Các tỷ lệ khung hình được hỗ trợ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Để dùng MiniMax cho tạo hình ảnh, hãy đặt MiniMax làm nhà cung cấp tạo hình ảnh:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin sử dụng cùng `MINIMAX_API_KEY` hoặc xác thực OAuth như các mô hình văn bản. Không cần cấu hình bổ sung nếu MiniMax đã được thiết lập.

Cả `minimax` và `minimax-portal` đều đăng ký `image_generate` với cùng mô hình
`image-01`. Các thiết lập khóa API dùng `MINIMAX_API_KEY`; các thiết lập OAuth có thể dùng
đường dẫn xác thực `minimax-portal` đi kèm thay thế.

Tạo hình ảnh luôn dùng endpoint hình ảnh chuyên dụng của MiniMax
(`/v1/image_generation`) và bỏ qua `models.providers.minimax.baseUrl`,
vì trường đó cấu hình URL cơ sở tương thích chat/Anthropic. Đặt
`MINIMAX_API_HOST=https://api.minimaxi.com` để định tuyến tạo hình ảnh
qua endpoint CN; endpoint toàn cầu mặc định là
`https://api.minimax.io`.

Khi onboarding hoặc thiết lập khóa API ghi các mục `models.providers.minimax`
rõ ràng, OpenClaw hiện thực hóa `MiniMax-M2.7` và
`MiniMax-M2.7-highspeed` dưới dạng các mô hình chat chỉ dành cho văn bản. Khả năng hiểu hình ảnh
được cung cấp riêng thông qua nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin sở hữu.

<Note>
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

### Chuyển văn bản thành giọng nói

Plugin `minimax` đi kèm đăng ký MiniMax T2A v2 làm nhà cung cấp giọng nói cho
`messages.tts`.

- Mô hình TTS mặc định: `speech-2.8-hd`
- Giọng nói mặc định: `English_expressive_narrator`
- Các id mô hình đi kèm được hỗ trợ bao gồm `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, và `speech-01-turbo`.
- Thứ tự phân giải xác thực là `messages.tts.providers.minimax.apiKey`, sau đó
  hồ sơ xác thực OAuth/token `minimax-portal`, sau đó các khóa môi trường
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), rồi `MINIMAX_API_KEY`.
- Nếu chưa cấu hình máy chủ TTS, OpenClaw dùng lại máy chủ OAuth
  `minimax-portal` đã cấu hình và loại bỏ các hậu tố đường dẫn tương thích Anthropic
  như `/anthropic`.
- Tệp đính kèm âm thanh thông thường vẫn là MP3.
- Các đích ghi chú thoại như Feishu và Telegram được chuyển mã từ MP3 của MiniMax
  sang Opus 48kHz bằng `ffmpeg`, vì API tệp Feishu/Lark chỉ
  chấp nhận `file_type: "opus"` cho tin nhắn âm thanh gốc.
- MiniMax T2A chấp nhận `speed` và `vol` dạng số thập phân, nhưng `pitch` được gửi dưới dạng
  số nguyên; OpenClaw cắt bỏ phần thập phân của giá trị `pitch` trước yêu cầu API.

| Cài đặt                                  | Biến môi trường        | Mặc định                      | Mô tả                            |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Máy chủ API MiniMax T2A.         |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id mô hình TTS.                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id giọng nói dùng cho đầu ra giọng nói. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Tốc độ phát, `0.5..2.0`.         |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Âm lượng, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Dịch cao độ số nguyên, `-12..12`. |

### Tạo nhạc

Plugin MiniMax đi kèm đăng ký tạo nhạc thông qua công cụ dùng chung
`music_generate` cho cả `minimax` và `minimax-portal`.

- Mô hình nhạc mặc định: `minimax/music-2.6`
- Mô hình nhạc OAuth: `minimax-portal/music-2.6`
- Cũng hỗ trợ `minimax/music-2.5` và `minimax/music-2.0`
- Điều khiển prompt: `lyrics`, `instrumental`, `durationSeconds`
- Định dạng đầu ra: `mp3`
- Các lần chạy có phiên hỗ trợ tách ra thông qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

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
Xem [Tạo nhạc](/vi/tools/music-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển dự phòng.
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

Plugin MiniMax đăng ký khả năng hiểu hình ảnh tách biệt với danh mục văn bản:

| ID nhà cung cấp  | Mô hình hình ảnh mặc định |
| ---------------- | ------------------------- |
| `minimax`        | `MiniMax-VL-01`           |
| `minimax-portal` | `MiniMax-VL-01`           |

Đó là lý do định tuyến phương tiện tự động có thể dùng khả năng hiểu hình ảnh của MiniMax ngay cả khi danh mục nhà cung cấp văn bản tích hợp vẫn chỉ hiển thị các tham chiếu trò chuyện M2.7 dạng chỉ văn bản.

### Tìm kiếm web

Plugin MiniMax cũng đăng ký `web_search` thông qua API tìm kiếm MiniMax Token Plan.

- ID nhà cung cấp: `minimax`
- Kết quả có cấu trúc: tiêu đề, URL, đoạn trích, truy vấn liên quan
- Biến môi trường ưu tiên: `MINIMAX_CODE_PLAN_KEY`
- Bí danh môi trường được chấp nhận: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Dự phòng tương thích: `MINIMAX_API_KEY` khi nó đã trỏ đến thông tin xác thực token-plan
- Tái sử dụng khu vực: `plugins.entries.minimax.config.webSearch.region`, rồi `MINIMAX_API_HOST`, rồi các URL cơ sở của nhà cung cấp MiniMax
- Tìm kiếm vẫn dùng ID nhà cung cấp `minimax`; thiết lập OAuth CN/toàn cầu có thể điều hướng khu vực gián tiếp qua `models.providers.minimax-portal.baseUrl` và có thể cung cấp xác thực bearer qua `MINIMAX_OAUTH_TOKEN`

Cấu hình nằm trong `plugins.entries.minimax.config.webSearch.*`.

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
    | `models.mode` | Giữ `merge` nếu bạn muốn thêm MiniMax bên cạnh các mục tích hợp sẵn |
  </Accordion>

  <Accordion title="Mặc định thinking">
    Với `api: "anthropic-messages"`, OpenClaw chèn `thinking: { type: "disabled" }` trừ khi thinking đã được đặt rõ ràng trong params/config.

    Điều này ngăn endpoint phát trực tuyến của MiniMax phát ra `reasoning_content` trong các đoạn delta kiểu OpenAI, vốn sẽ làm rò rỉ suy luận nội bộ vào đầu ra hiển thị.

  </Accordion>

  <Accordion title="Chế độ nhanh">
    `/fast on` hoặc `params.fastMode: true` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed` trên đường dẫn stream tương thích Anthropic.
  </Accordion>

  <Accordion title="Ví dụ dự phòng">
    **Phù hợp nhất để:** giữ mô hình thế hệ mới nhất mạnh nhất của bạn làm chính, chuyển đổi dự phòng sang MiniMax M2.7. Ví dụ bên dưới dùng Opus làm mô hình chính cụ thể; hãy thay bằng mô hình chính thế hệ mới nhất bạn ưa dùng.

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
    - API mức sử dụng Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` hoặc `https://api.minimax.io/v1/token_plan/remains` (yêu cầu khóa coding plan).
    - Việc thăm dò mức sử dụng suy ra host từ `models.providers.minimax-portal.baseUrl` hoặc `models.providers.minimax.baseUrl` khi được cấu hình, nên các thiết lập toàn cầu dùng `https://api.minimax.io/anthropic` sẽ thăm dò `api.minimax.io`. URL cơ sở bị thiếu hoặc không đúng định dạng sẽ giữ dự phòng CN để tương thích.
    - OpenClaw chuẩn hóa mức sử dụng coding-plan của MiniMax về cùng hiển thị `% còn lại` như các nhà cung cấp khác. Các trường thô `usage_percent` / `usagePercent` của MiniMax là hạn mức còn lại, không phải hạn mức đã dùng, nên OpenClaw đảo ngược chúng. Các trường dựa trên số lượng được ưu tiên khi có mặt.
    - Khi API trả về `model_remains`, OpenClaw ưu tiên mục mô hình trò chuyện, suy ra nhãn cửa sổ từ `start_time` / `end_time` khi cần, và đưa tên mô hình được chọn vào nhãn gói để các cửa sổ coding-plan dễ phân biệt hơn.
    - Ảnh chụp nhanh mức sử dụng coi `minimax`, `minimax-cn` và `minimax-portal` là cùng một bề mặt hạn mức MiniMax, và ưu tiên OAuth MiniMax đã lưu trước khi dự phòng về các biến môi trường khóa Coding Plan.

  </Accordion>
</AccordionGroup>

## Ghi chú

- Tham chiếu mô hình tuân theo đường dẫn xác thực:
  - Thiết lập bằng khóa API: `minimax/<model>`
  - Thiết lập OAuth: `minimax-portal/<model>`
- Mô hình trò chuyện mặc định: `MiniMax-M2.7`
- Mô hình trò chuyện thay thế: `MiniMax-M2.7-highspeed`
- Onboarding và thiết lập khóa API trực tiếp ghi các định nghĩa mô hình chỉ văn bản cho cả hai biến thể M2.7
- Hiểu hình ảnh dùng nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin sở hữu
- Cập nhật giá trị giá trong `models.json` nếu bạn cần theo dõi chi phí chính xác
- Dùng `openclaw models list` để xác nhận ID nhà cung cấp hiện tại, rồi chuyển bằng `openclaw models set minimax/MiniMax-M2.7` hoặc `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Liên kết giới thiệu cho MiniMax Coding Plan (giảm 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) để biết quy tắc nhà cung cấp.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title='"Mô hình không xác định: minimax/MiniMax-M2.7"'>
    Điều này thường có nghĩa là **nhà cung cấp MiniMax chưa được cấu hình** (không có mục nhà cung cấp khớp và không tìm thấy hồ sơ xác thực/khóa môi trường MiniMax). Bản sửa cho phát hiện này có trong **2026.1.12**. Cách sửa:

    - Nâng cấp lên **2026.1.12** (hoặc chạy từ nguồn `main`), rồi khởi động lại gateway.
    - Chạy `openclaw configure` và chọn một tùy chọn xác thực **MiniMax**, hoặc
    - Thêm thủ công khối `models.providers.minimax` hoặc `models.providers.minimax-portal` khớp, hoặc
    - Đặt `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, hoặc một hồ sơ xác thực MiniMax để nhà cung cấp khớp có thể được chèn vào.

    Đảm bảo ID mô hình **phân biệt chữ hoa chữ thường**:

    - Đường dẫn khóa API: `minimax/MiniMax-M2.7` hoặc `minimax/MiniMax-M2.7-highspeed`
    - Đường dẫn OAuth: `minimax-portal/MiniMax-M2.7` hoặc `minimax-portal/MiniMax-M2.7-highspeed`

    Sau đó kiểm tra lại bằng:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Các tham số công cụ âm nhạc dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tìm kiếm MiniMax" href="/vi/tools/minimax-search" icon="magnifying-glass">
    Cấu hình tìm kiếm web qua MiniMax Token Plan.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>

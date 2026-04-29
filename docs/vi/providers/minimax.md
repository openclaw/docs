---
read_when:
    - Bạn muốn dùng các mô hình MiniMax trong OpenClaw
    - Bạn cần hướng dẫn thiết lập MiniMax
summary: Sử dụng các mô hình MiniMax trong OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-29T23:07:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

MiniMax cũng cung cấp:

- Tổng hợp giọng nói tích hợp qua T2A v2
- Hiểu hình ảnh tích hợp qua `MiniMax-VL-01`
- Tạo nhạc tích hợp qua `music-2.6`
- `web_search` tích hợp thông qua API tìm kiếm MiniMax Coding Plan

Tách nhà cung cấp:

| ID nhà cung cấp  | Xác thực | Khả năng                                                                                            |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Khóa API | Văn bản, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói, tìm kiếm web                  |
| `minimax-portal` | OAuth    | Văn bản, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói                                |

## Danh mục tích hợp sẵn

| Model                    | Loại             | Mô tả                                      |
| ------------------------ | ---------------- | ------------------------------------------ |
| `MiniMax-M2.7`           | Chat (lập luận)  | Model lập luận được lưu trữ mặc định       |
| `MiniMax-M2.7-highspeed` | Chat (lập luận)  | Tầng lập luận M2.7 nhanh hơn               |
| `MiniMax-VL-01`          | Thị giác         | Model hiểu hình ảnh                        |
| `image-01`               | Tạo hình ảnh     | Tạo ảnh từ văn bản và chỉnh sửa ảnh từ ảnh |
| `music-2.6`              | Tạo nhạc         | Model nhạc mặc định                        |
| `music-2.5`              | Tạo nhạc         | Tầng tạo nhạc trước đó                     |
| `music-2.0`              | Tạo nhạc         | Tầng tạo nhạc cũ                           |
| `MiniMax-Hailuo-2.3`     | Tạo video        | Luồng tạo video từ văn bản và tham chiếu ảnh |

## Bắt đầu

Chọn phương thức xác thực bạn muốn dùng và làm theo các bước thiết lập.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Phù hợp nhất cho:** thiết lập nhanh với MiniMax Coding Plan qua OAuth, không cần khóa API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Thao tác này xác thực với `api.minimax.io`.
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

            Thao tác này xác thực với `api.minimaxi.com`.
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
    Thiết lập OAuth sử dụng id nhà cung cấp `minimax-portal`. Tham chiếu model theo dạng `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Liên kết giới thiệu cho MiniMax Coding Plan (giảm 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Phù hợp nhất cho:** MiniMax được lưu trữ với API tương thích Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Thao tác này cấu hình `api.minimax.io` làm URL cơ sở.
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

            Thao tác này cấu hình `api.minimaxi.com` làm URL cơ sở.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Ví dụ cấu hình

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
    Trên đường dẫn streaming tương thích Anthropic, OpenClaw mặc định tắt tính năng thinking của MiniMax trừ khi bạn tự đặt rõ `thinking`. Endpoint streaming của MiniMax phát ra `reasoning_content` trong các đoạn delta kiểu OpenAI thay vì các khối thinking gốc của Anthropic, điều này có thể làm rò rỉ lập luận nội bộ vào đầu ra hiển thị nếu được bật ngầm.
    </Warning>

    <Note>
    Thiết lập bằng khóa API sử dụng id nhà cung cấp `minimax`. Tham chiếu model theo dạng `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Cấu hình qua `openclaw configure`

Dùng trình hướng dẫn cấu hình tương tác để thiết lập MiniMax mà không cần chỉnh sửa JSON:

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
    | `minimax-global-oauth` | OAuth quốc tế (Gói Coding) |
    | `minimax-cn-oauth` | OAuth Trung Quốc (Gói Coding) |
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

- **Tạo văn bản thành hình ảnh** với điều khiển tỷ lệ khung hình
- **Chỉnh sửa hình ảnh thành hình ảnh** (tham chiếu chủ thể) với điều khiển tỷ lệ khung hình
- Tối đa **9 hình ảnh đầu ra** cho mỗi yêu cầu
- Tối đa **1 hình ảnh tham chiếu** cho mỗi yêu cầu chỉnh sửa
- Các tỷ lệ khung hình được hỗ trợ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Để dùng MiniMax cho tạo hình ảnh, đặt nó làm nhà cung cấp tạo hình ảnh:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin dùng cùng `MINIMAX_API_KEY` hoặc xác thực OAuth như các mô hình văn bản. Không cần cấu hình bổ sung nếu MiniMax đã được thiết lập.

Cả `minimax` và `minimax-portal` đều đăng ký `image_generate` với cùng
mô hình `image-01`. Các thiết lập khóa API dùng `MINIMAX_API_KEY`; các thiết lập OAuth có thể dùng
đường dẫn xác thực `minimax-portal` đi kèm thay thế.

Tạo hình ảnh luôn dùng endpoint hình ảnh chuyên dụng của MiniMax
(`/v1/image_generation`) và bỏ qua `models.providers.minimax.baseUrl`,
vì trường đó cấu hình URL cơ sở tương thích chat/Anthropic. Đặt
`MINIMAX_API_HOST=https://api.minimaxi.com` để định tuyến tạo hình ảnh
qua endpoint CN; endpoint toàn cầu mặc định là
`https://api.minimax.io`.

Khi onboarding hoặc thiết lập khóa API ghi các mục `models.providers.minimax`
tường minh, OpenClaw hiện thực hóa `MiniMax-M2.7` và
`MiniMax-M2.7-highspeed` dưới dạng các mô hình chat chỉ dùng văn bản. Khả năng hiểu hình ảnh được
phơi bày riêng thông qua nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin sở hữu.

<Note>
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

### Văn bản thành giọng nói

Plugin `minimax` đi kèm đăng ký MiniMax T2A v2 làm nhà cung cấp giọng nói cho
`messages.tts`.

- Mô hình TTS mặc định: `speech-2.8-hd`
- Giọng mặc định: `English_expressive_narrator`
- Các id mô hình đi kèm được hỗ trợ bao gồm `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` và `speech-01-turbo`.
- Thứ tự phân giải xác thực là `messages.tts.providers.minimax.apiKey`, sau đó
  các hồ sơ xác thực OAuth/token `minimax-portal`, sau đó các khóa môi trường
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), rồi `MINIMAX_API_KEY`.
- Nếu không cấu hình host TTS, OpenClaw dùng lại host OAuth
  `minimax-portal` đã cấu hình và loại bỏ các hậu tố đường dẫn tương thích Anthropic
  như `/anthropic`.
- Tệp đính kèm âm thanh thông thường vẫn là MP3.
- Các đích ghi chú thoại như Feishu và Telegram được chuyển mã từ MP3
  MiniMax sang Opus 48kHz bằng `ffmpeg`, vì API tệp Feishu/Lark chỉ
  chấp nhận `file_type: "opus"` cho tin nhắn âm thanh gốc.
- MiniMax T2A chấp nhận `speed` và `vol` dạng số thập phân, nhưng `pitch` được gửi dưới dạng
  số nguyên; OpenClaw cắt bỏ phần thập phân của các giá trị `pitch` trước yêu cầu API.

| Cài đặt                                  | Biến môi trường        | Mặc định                      | Mô tả                            |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id mô hình TTS.                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id giọng dùng cho đầu ra giọng nói. |
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
- Các lần chạy có phiên hỗ trợ sẽ tách ra thông qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

### Hiểu hình ảnh

Plugin MiniMax đăng ký khả năng hiểu hình ảnh riêng với danh mục văn bản:

| ID nhà cung cấp  | Mô hình hình ảnh mặc định |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Đó là lý do định tuyến phương tiện tự động có thể dùng khả năng hiểu hình ảnh của MiniMax ngay cả khi danh mục nhà cung cấp văn bản đi kèm vẫn hiển thị các tham chiếu trò chuyện M2.7 chỉ dành cho văn bản.

### Tìm kiếm web

Plugin MiniMax cũng đăng ký `web_search` thông qua API tìm kiếm MiniMax Coding Plan.

- ID nhà cung cấp: `minimax`
- Kết quả có cấu trúc: tiêu đề, URL, đoạn trích, truy vấn liên quan
- Biến môi trường ưu tiên: `MINIMAX_CODE_PLAN_KEY`
- Bí danh môi trường được chấp nhận: `MINIMAX_CODING_API_KEY`
- Dự phòng tương thích: `MINIMAX_API_KEY` khi biến này đã trỏ đến token coding-plan
- Tái sử dụng vùng: `plugins.entries.minimax.config.webSearch.region`, sau đó `MINIMAX_API_HOST`, rồi các URL cơ sở của nhà cung cấp MiniMax
- Tìm kiếm vẫn nằm trên ID nhà cung cấp `minimax`; thiết lập OAuth CN/toàn cầu vẫn có thể điều hướng vùng gián tiếp thông qua `models.providers.minimax-portal.baseUrl`

Cấu hình nằm dưới `plugins.entries.minimax.config.webSearch.*`.

<Note>
Xem [Tìm kiếm MiniMax](/vi/tools/minimax-search) để biết cấu hình và cách dùng tìm kiếm web đầy đủ.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Configuration options">
    | Tùy chọn | Mô tả |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Ưu tiên `https://api.minimax.io/anthropic` (tương thích Anthropic); `https://api.minimax.io/v1` là tùy chọn cho payload tương thích OpenAI |
    | `models.providers.minimax.api` | Ưu tiên `anthropic-messages`; `openai-completions` là tùy chọn cho payload tương thích OpenAI |
    | `models.providers.minimax.apiKey` | Khóa API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Định nghĩa `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Đặt bí danh cho các mô hình bạn muốn có trong danh sách cho phép |
    | `models.mode` | Giữ `merge` nếu bạn muốn thêm MiniMax cùng với các mô hình tích hợp sẵn |
  </Accordion>

  <Accordion title="Thinking defaults">
    Trên `api: "anthropic-messages"`, OpenClaw chèn `thinking: { type: "disabled" }` trừ khi thinking đã được đặt rõ trong tham số/cấu hình.

    Điều này ngăn endpoint phát trực tuyến của MiniMax phát ra `reasoning_content` trong các đoạn delta kiểu OpenAI, vốn sẽ làm lộ suy luận nội bộ vào đầu ra hiển thị.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` hoặc `params.fastMode: true` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed` trên đường dẫn phát trực tuyến tương thích Anthropic.
  </Accordion>

  <Accordion title="Fallback example">
    **Phù hợp nhất để:** giữ mô hình thế hệ mới nhất mạnh nhất của bạn làm chính, chuyển dự phòng sang MiniMax M2.7. Ví dụ bên dưới dùng Opus làm mô hình chính cụ thể; hãy đổi sang mô hình chính thế hệ mới nhất bạn ưu tiên.

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

  <Accordion title="Coding Plan usage details">
    - API mức dùng Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (yêu cầu khóa coding plan).
    - OpenClaw chuẩn hóa mức dùng coding-plan của MiniMax sang cùng hiển thị `% còn lại` được các nhà cung cấp khác dùng. Các trường thô `usage_percent` / `usagePercent` của MiniMax là hạn mức còn lại, không phải hạn mức đã tiêu thụ, nên OpenClaw đảo ngược chúng. Các trường dựa trên số lượng được ưu tiên khi có.
    - Khi API trả về `model_remains`, OpenClaw ưu tiên mục mô hình trò chuyện, suy ra nhãn cửa sổ từ `start_time` / `end_time` khi cần, và đưa tên mô hình đã chọn vào nhãn gói để các cửa sổ coding-plan dễ phân biệt hơn.
    - Ảnh chụp nhanh mức dùng coi `minimax`, `minimax-cn` và `minimax-portal` là cùng một bề mặt hạn mức MiniMax, và ưu tiên MiniMax OAuth đã lưu trước khi chuyển dự phòng sang các biến môi trường khóa Coding Plan.

  </Accordion>
</AccordionGroup>

## Ghi chú

- Tham chiếu mô hình đi theo đường dẫn xác thực:
  - Thiết lập khóa API: `minimax/<model>`
  - Thiết lập OAuth: `minimax-portal/<model>`
- Mô hình trò chuyện mặc định: `MiniMax-M2.7`
- Mô hình trò chuyện thay thế: `MiniMax-M2.7-highspeed`
- Onboarding và thiết lập khóa API trực tiếp ghi các định nghĩa mô hình chỉ dành cho văn bản cho cả hai biến thể M2.7
- Hiểu hình ảnh dùng nhà cung cấp phương tiện `MiniMax-VL-01` do plugin sở hữu
- Cập nhật giá trị định giá trong `models.json` nếu bạn cần theo dõi chi phí chính xác
- Dùng `openclaw models list` để xác nhận ID nhà cung cấp hiện tại, rồi chuyển bằng `openclaw models set minimax/MiniMax-M2.7` hoặc `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Liên kết giới thiệu cho MiniMax Coding Plan (giảm 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) để biết quy tắc nhà cung cấp.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Điều này thường có nghĩa là **nhà cung cấp MiniMax chưa được cấu hình** (không có mục nhà cung cấp khớp và không tìm thấy hồ sơ xác thực/khóa môi trường MiniMax). Bản sửa cho việc phát hiện này có trong **2026.1.12**. Cách sửa:

    - Nâng cấp lên **2026.1.12** (hoặc chạy từ source `main`), rồi khởi động lại gateway.
    - Chạy `openclaw configure` và chọn một tùy chọn xác thực **MiniMax**, hoặc
    - Thêm thủ công khối `models.providers.minimax` hoặc `models.providers.minimax-portal` khớp, hoặc
    - Đặt `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, hoặc hồ sơ xác thực MiniMax để nhà cung cấp khớp có thể được chèn vào.

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
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Image generation" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Music generation" href="/vi/tools/music-generation" icon="music">
    Tham số công cụ âm nhạc dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="MiniMax Search" href="/vi/tools/minimax-search" icon="magnifying-glass">
    Cấu hình tìm kiếm web qua MiniMax Coding Plan.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>

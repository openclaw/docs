---
read_when:
    - Bạn muốn sử dụng các mô hình MiniMax trong OpenClaw
    - Bạn cần hướng dẫn thiết lập MiniMax
summary: Sử dụng các mô hình MiniMax trong OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-19T06:19:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ce1329cedc88128aaca3eb132be433f7115edb30368dda6df7ab115cc46031c
    source_path: providers/minimax.md
    workflow: 16
---

Plugin `minimax` đi kèm đăng ký hai nhà cung cấp cùng năm khả năng: trò chuyện, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói (T2A v2) và tìm kiếm web.

| ID nhà cung cấp      | Xác thực    | Khả năng                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Khóa API | Văn bản, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói, tìm kiếm web |
| `minimax-portal` | OAuth   | Văn bản, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói             |

<Tip>
Liên kết giới thiệu cho MiniMax Coding Plan (giảm 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

## Danh mục tích hợp sẵn

| Mô hình                    | Loại             | Mô tả                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Trò chuyện (suy luận) | Mô hình suy luận được lưu trữ mặc định           |
| `MiniMax-M2.7`           | Trò chuyện (suy luận) | Mô hình suy luận được lưu trữ trước đó          |
| `MiniMax-M2.7-highspeed` | Trò chuyện (suy luận) | Cấp suy luận M2.7 nhanh hơn               |
| `MiniMax-VL-01`          | Thị giác           | Mô hình hiểu hình ảnh                |
| `image-01`               | Tạo hình ảnh | Chuyển văn bản thành hình ảnh và chỉnh sửa từ hình ảnh sang hình ảnh |
| `music-2.6`              | Tạo nhạc | Mô hình âm nhạc mặc định                      |
| `MiniMax-Hailuo-2.3`     | Tạo video | Luồng chuyển văn bản thành video và hình ảnh thành video   |

Tham chiếu mô hình tuân theo phương thức xác thực: `minimax/<model>` cho thiết lập bằng khóa API, `minimax-portal/<model>` cho thiết lập bằng OAuth.

## Bắt đầu

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Phù hợp nhất cho:** thiết lập nhanh với MiniMax Coding Plan qua OAuth, không yêu cầu khóa API.

    <Tabs>
      <Tab title="Quốc tế">
        <Steps>
          <Step title="Chạy quy trình thiết lập ban đầu">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL cơ sở của nhà cung cấp sau khi thiết lập: `api.minimax.io`.
          </Step>
          <Step title="Xác minh mô hình có sẵn">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Trung Quốc">
        <Steps>
          <Step title="Chạy quy trình thiết lập ban đầu">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL cơ sở của nhà cung cấp sau khi thiết lập: `api.minimaxi.com`.
          </Step>
          <Step title="Xác minh mô hình có sẵn">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Các thiết lập OAuth sử dụng ID nhà cung cấp `minimax-portal`. Tham chiếu mô hình có dạng `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Khóa API">
    **Phù hợp nhất cho:** MiniMax được lưu trữ với API tương thích Anthropic.

    <Tabs>
      <Tab title="Quốc tế">
        <Steps>
          <Step title="Chạy quy trình thiết lập ban đầu">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Thao tác này cấu hình `api.minimax.io` làm URL cơ sở.
          </Step>
          <Step title="Xác minh mô hình có sẵn">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Trung Quốc">
        <Steps>
          <Step title="Chạy quy trình thiết lập ban đầu">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Thao tác này cấu hình `api.minimaxi.com` làm URL cơ sở.
          </Step>
          <Step title="Xác minh mô hình có sẵn">
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
    Điểm cuối truyền phát tương thích Anthropic của MiniMax-M2.x phát `reasoning_content` trong các đoạn delta kiểu OpenAI thay vì các khối suy nghĩ Anthropic gốc, khiến suy luận nội bộ bị lộ trong đầu ra hiển thị nếu tính năng suy nghĩ được ngầm bật. OpenClaw mặc định tắt suy nghĩ của M2.x, trừ khi bạn tự đặt rõ ràng `thinking`. MiniMax-M3 (và M3.x tương thích về sau) được miễn trừ: M3 phát các khối suy nghĩ Anthropic đúng chuẩn và yêu cầu tính năng suy nghĩ hoạt động để tạo nội dung hiển thị, vì vậy OpenClaw duy trì M3 trên cơ chế suy nghĩ thích ứng của nhà cung cấp. Xem phần Mặc định về suy nghĩ trong Cấu hình nâng cao bên dưới.
    </Warning>

    <Note>
    Các thiết lập bằng khóa API sử dụng ID nhà cung cấp `minimax`. Tham chiếu mô hình có dạng `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Cấu hình qua `openclaw configure`

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
    | Lựa chọn xác thực            | Mô tả                        |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | OAuth quốc tế (Coding Plan)  |
    | `minimax-cn-oauth`     | OAuth Trung Quốc (Coding Plan)          |
    | `minimax-global-api`   | Khóa API quốc tế              |
    | `minimax-cn-api`       | Khóa API Trung Quốc                      |
  </Step>
  <Step title="Chọn mô hình mặc định">
    Chọn mô hình mặc định khi được nhắc.
  </Step>
</Steps>

## Khả năng

### Tạo hình ảnh

Plugin MiniMax đăng ký mô hình `image-01` cho công cụ `image_generate` trên cả `minimax` và `minimax-portal`, sử dụng lại cùng `MINIMAX_API_KEY` hoặc thông tin xác thực OAuth như các mô hình văn bản.

- Tạo hình ảnh từ văn bản và chỉnh sửa từ hình ảnh sang hình ảnh (tham chiếu chủ thể), cả hai đều có tính năng kiểm soát tỷ lệ khung hình
- Tối đa 9 hình ảnh đầu ra cho mỗi yêu cầu, 1 hình ảnh tham chiếu cho mỗi yêu cầu chỉnh sửa
- Các tỷ lệ khung hình được hỗ trợ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Tính năng tạo hình ảnh luôn sử dụng điểm cuối hình ảnh chuyên dụng của MiniMax (`/v1/image_generation`) và bỏ qua `models.providers.minimax.baseUrl`, vì trường đó cấu hình URL cơ sở tương thích với trò chuyện/Anthropic. Đặt `MINIMAX_API_HOST=https://api.minimaxi.com` để định tuyến việc tạo hình ảnh qua điểm cuối CN; điểm cuối toàn cầu mặc định là `https://api.minimax.io`.

<Note>
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

### Chuyển văn bản thành giọng nói

Plugin `minimax` đi kèm đăng ký MiniMax T2A v2 làm nhà cung cấp giọng nói cho `messages.tts`.

- Mô hình TTS mặc định: `speech-2.8-hd`
- Giọng nói mặc định: `English_expressive_narrator`
- ID mô hình đi kèm: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`
- Thứ tự phân giải xác thực: `messages.tts.providers.minimax.apiKey`, sau đó là các hồ sơ xác thực OAuth/token `minimax-portal`, tiếp theo là các khóa môi trường Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), rồi đến `MINIMAX_API_KEY`
- Nếu không cấu hình máy chủ TTS, OpenClaw sử dụng lại máy chủ OAuth `minimax-portal` đã cấu hình và loại bỏ các hậu tố đường dẫn tương thích Anthropic như `/anthropic`
- Các tệp đính kèm âm thanh thông thường vẫn ở định dạng MP3. Các đích ghi chú thoại (Feishu, Telegram và các kênh khác yêu cầu tệp đính kèm tương thích với ghi chú thoại) được chuyển mã từ MP3 của MiniMax sang Opus 48kHz bằng `ffmpeg`, vì chẳng hạn API tệp Feishu/Lark chỉ chấp nhận `file_type: "opus"` cho tin nhắn âm thanh gốc
- MiniMax T2A chấp nhận `speed` và `vol` dạng phân số, nhưng `pitch` được gửi dưới dạng số nguyên; OpenClaw cắt bỏ phần thập phân của các giá trị `pitch` trước yêu cầu API

| Cài đặt                                  | Biến môi trường                | Mặc định                       | Mô tả                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Máy chủ API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID mô hình TTS.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID giọng nói dùng cho đầu ra giọng nói. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Tốc độ phát, `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Âm lượng, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Độ dịch cao độ dạng số nguyên, `-12..12`.  |

### Tạo nhạc

Plugin MiniMax đi kèm đăng ký tính năng tạo nhạc thông qua công cụ dùng chung `music_generate` cho cả `minimax` và `minimax-portal`.

- Mô hình âm nhạc mặc định: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Cũng hỗ trợ `music-2.6-free`, `music-cover` và `music-cover-free`
- Các tham số điều khiển lời nhắc: `lyrics`, `instrumental`
- Định dạng đầu ra: `mp3`
- Các lượt chạy có phiên hỗ trợ sẽ tách ra thông qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Xem [Tạo nhạc](/vi/tools/music-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

### Tạo video

Plugin MiniMax đi kèm đăng ký tính năng tạo video thông qua công cụ dùng chung `video_generate` cho cả `minimax` và `minimax-portal`.

- Mô hình video mặc định: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Cũng hỗ trợ `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` và `I2V-01`
- Chế độ: luồng văn bản thành video và luồng tham chiếu một hình ảnh
- Hỗ trợ `resolution` (`768P` hoặc `1080P` trên các mô hình Hailuo 2.3/02); `aspectRatio` không được hỗ trợ và sẽ bị bỏ qua

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

### Hiểu hình ảnh

Plugin MiniMax đăng ký khả năng hiểu hình ảnh riêng biệt với danh mục văn bản:

| ID nhà cung cấp      | Mô hình hình ảnh mặc định | Trích xuất văn bản PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

Đó là lý do định tuyến phương tiện tự động có thể sử dụng khả năng hiểu hình ảnh của MiniMax ngay cả khi danh mục nhà cung cấp văn bản đi kèm cũng chứa các tham chiếu trò chuyện M3 có khả năng xử lý hình ảnh. Khả năng hiểu PDF chỉ sử dụng `MiniMax-M2.7` để trích xuất văn bản; MiniMax không đăng ký đường dẫn chuyển đổi PDF thành hình ảnh.

### Tìm kiếm web

Plugin MiniMax cũng đăng ký `web_search` thông qua API tìm kiếm MiniMax Token Plan (`/v1/coding_plan/search`).

- ID nhà cung cấp: `minimax`
- Kết quả có cấu trúc: tiêu đề, URL, đoạn trích, truy vấn liên quan
- Biến môi trường ưu tiên: `MINIMAX_CODE_PLAN_KEY`
- Bí danh biến môi trường được chấp nhận: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Phương án dự phòng tương thích: `MINIMAX_API_KEY` khi biến này đã trỏ đến thông tin xác thực của gói token
- Tái sử dụng khu vực: `plugins.entries.minimax.config.webSearch.region`, sau đó `MINIMAX_API_HOST`, rồi đến các URL cơ sở của nhà cung cấp MiniMax
- Tìm kiếm vẫn dùng ID nhà cung cấp `minimax`; thiết lập OAuth CN/toàn cầu có thể gián tiếp điều hướng khu vực thông qua `models.providers.minimax-portal.baseUrl` và có thể cung cấp xác thực bearer thông qua `MINIMAX_OAUTH_TOKEN`

Cấu hình nằm trong `plugins.entries.minimax.config.webSearch.*`.

<Note>
Xem [Tìm kiếm MiniMax](/vi/tools/minimax-search) để biết đầy đủ cấu hình và cách sử dụng tìm kiếm web.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tùy chọn cấu hình">
    | Tùy chọn | Mô tả |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Ưu tiên `https://api.minimax.io/anthropic` (tương thích Anthropic); `https://api.minimax.io/v1` là tùy chọn dành cho payload tương thích OpenAI |
    | `models.providers.minimax.api` | Ưu tiên `anthropic-messages`; `openai-completions` là tùy chọn dành cho payload tương thích OpenAI |
    | `models.providers.minimax.apiKey` | Khóa API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Xác định `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Bí danh, tham số và siêu dữ liệu cho từng mô hình |
    | `agents.defaults.modelPolicy.allow` | Danh sách cho phép mô hình tường minh, không bắt buộc |
    | `models.mode` | Giữ `merge` nếu bạn muốn thêm MiniMax bên cạnh các thành phần tích hợp sẵn |
  </Accordion>

  <Accordion title="Giá trị mặc định của suy luận">
    Trên `api: "anthropic-messages"`, OpenClaw chèn `thinking: { type: "disabled" }` cho các mô hình MiniMax M2.x, trừ khi một wrapper trước đó đã đặt trường `thinking` trong payload. Điều này ngăn endpoint truyền phát của M2.x phát ra `reasoning_content` trong các đoạn delta kiểu OpenAI, vốn sẽ làm lộ suy luận nội bộ trong đầu ra hiển thị.

    MiniMax-M3 (và M3.x) được miễn: M3 trả về một mảng `content` trống cùng với `stop_reason: "end_turn"` khi suy luận bị tắt, vì vậy OpenClaw loại bỏ giá trị tắt mặc định ngầm định cho M3 và khi mức suy luận được đặt, buộc sử dụng `thinking: { type: "adaptive" }`.

    Các mức suy luận khả dụng theo họ mô hình:

    | Họ mô hình   | Mức                                   | Mặc định    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Chế độ nhanh">
    `/fast on` hoặc `params.fastMode: true` ghi lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed` trên đường dẫn truyền phát tương thích Anthropic (`api: "anthropic-messages"`, nhà cung cấp `minimax` hoặc `minimax-portal`).
  </Accordion>

  <Accordion title="Ví dụ chuyển đổi dự phòng">
    **Phù hợp nhất để:** giữ mô hình thế hệ mới nhất mạnh nhất làm mô hình chính và chuyển đổi dự phòng sang MiniMax M2.7. Ví dụ dưới đây sử dụng Opus làm mô hình chính cụ thể; hãy thay bằng mô hình chính thế hệ mới nhất mà bạn ưu tiên.

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
    - Việc thăm dò mức sử dụng lấy máy chủ từ `models.providers.minimax-portal.baseUrl` hoặc `models.providers.minimax.baseUrl` khi được cấu hình, vì vậy các thiết lập toàn cầu sử dụng `https://api.minimax.io/anthropic` sẽ thăm dò `api.minimax.io`. URL cơ sở bị thiếu hoặc sai định dạng vẫn sử dụng phương án dự phòng CN để đảm bảo khả năng tương thích.
    - OpenClaw chuẩn hóa mức sử dụng coding plan của MiniMax theo cùng kiểu hiển thị `% left` được các nhà cung cấp khác sử dụng. Các trường `usage_percent` / `usagePercent` thô của MiniMax biểu thị hạn mức còn lại, không phải hạn mức đã tiêu thụ, nên OpenClaw đảo ngược chúng. Các trường dựa trên số lượng được ưu tiên khi có.
    - Khi API trả về `model_remains`, OpenClaw ưu tiên mục mô hình trò chuyện, lấy nhãn cửa sổ từ `start_time` / `end_time` khi cần và đưa tên mô hình đã chọn vào nhãn gói để dễ phân biệt các cửa sổ coding plan hơn.
    - Các ảnh chụp nhanh mức sử dụng coi `minimax`, `minimax-cn`, `minimax-portal` và `minimax-portal-cn` là cùng một bề mặt hạn mức MiniMax, đồng thời ưu tiên OAuth MiniMax đã lưu trước khi chuyển sang các biến môi trường khóa Coding Plan.

  </Accordion>
</AccordionGroup>

## Ghi chú

- Mô hình trò chuyện mặc định: `MiniMax-M3`. Các mô hình trò chuyện thay thế: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Quy trình làm quen và thiết lập trực tiếp bằng khóa API ghi định nghĩa mô hình cho M3 và cả hai biến thể M2.7
- Khả năng hiểu hình ảnh sử dụng nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin sở hữu
- Cập nhật các giá trị định giá trong `models.json` nếu bạn cần theo dõi chi phí chính xác
- Dùng `openclaw models list` để xác nhận ID nhà cung cấp hiện tại, sau đó chuyển đổi bằng `openclaw models set minimax/MiniMax-M3` hoặc `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) để biết các quy tắc về nhà cung cấp.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title='"Mô hình không xác định: minimax/MiniMax-M3"'>
    Điều này thường có nghĩa là **nhà cung cấp MiniMax chưa được cấu hình** (không tìm thấy mục nhà cung cấp phù hợp cũng như hồ sơ xác thực/khóa môi trường MiniMax). Khắc phục bằng cách:

    - Chạy `openclaw configure` và chọn một tùy chọn xác thực **MiniMax**, hoặc
    - Thêm khối `models.providers.minimax` hoặc `models.providers.minimax-portal` phù hợp theo cách thủ công, hoặc
    - Đặt `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` hoặc một hồ sơ xác thực MiniMax để có thể chèn nhà cung cấp phù hợp.

    Đảm bảo ID mô hình **phân biệt chữ hoa chữ thường**:

    - Đường dẫn khóa API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` hoặc `minimax/MiniMax-M2.7-highspeed`
    - Đường dẫn OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` hoặc `minimax-portal/MiniMax-M2.7-highspeed`

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
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và cách chọn nhà cung cấp.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Các tham số công cụ âm nhạc dùng chung và cách chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và cách chọn nhà cung cấp.
  </Card>
  <Card title="Tìm kiếm MiniMax" href="/vi/tools/minimax-search" icon="magnifying-glass">
    Cấu hình tìm kiếm web thông qua MiniMax Token Plan.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>

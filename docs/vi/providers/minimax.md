---
read_when:
    - Bạn muốn sử dụng các mô hình MiniMax trong OpenClaw
    - Bạn cần hướng dẫn thiết lập MiniMax
summary: Sử dụng các mô hình MiniMax trong OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T08:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Plugin `minimax` đi kèm đăng ký hai nhà cung cấp cùng năm khả năng: trò chuyện, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói (T2A v2) và tìm kiếm web.

  | ID nhà cung cấp  | Xác thực | Khả năng                                                                                                   |
  | ---------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
  | `minimax`        | Khóa API | Văn bản, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói, tìm kiếm web                          |
  | `minimax-portal` | OAuth    | Văn bản, tạo hình ảnh, tạo nhạc, tạo video, hiểu hình ảnh, giọng nói                                       |

  <Tip>
  Liên kết giới thiệu MiniMax Coding Plan (giảm 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Danh mục tích hợp sẵn

  | Mô hình                  | Loại                   | Mô tả                                      |
  | ------------------------ | ---------------------- | ------------------------------------------ |
  | `MiniMax-M3`             | Trò chuyện (suy luận)  | Mô hình suy luận lưu trữ mặc định          |
  | `MiniMax-M2.7`           | Trò chuyện (suy luận)  | Mô hình suy luận lưu trữ trước đó           |
  | `MiniMax-M2.7-highspeed` | Trò chuyện (suy luận)  | Cấp suy luận M2.7 nhanh hơn                 |
  | `MiniMax-VL-01`          | Thị giác               | Mô hình hiểu hình ảnh                      |
  | `image-01`               | Tạo hình ảnh           | Chuyển văn bản thành hình ảnh và chỉnh sửa từ hình ảnh sang hình ảnh |
  | `music-2.6`              | Tạo nhạc               | Mô hình âm nhạc mặc định                   |
  | `MiniMax-Hailuo-2.3`     | Tạo video              | Quy trình chuyển văn bản thành video và hình ảnh thành video |

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
          <Step title="Xác minh mô hình khả dụng">
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
          <Step title="Xác minh mô hình khả dụng">
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
          <Step title="Xác minh mô hình khả dụng">
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
          <Step title="Xác minh mô hình khả dụng">
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
    Điểm cuối truyền phát tương thích Anthropic của MiniMax-M2.x phát `reasoning_content` trong các đoạn delta theo kiểu OpenAI thay vì các khối suy nghĩ Anthropic nguyên bản, khiến suy luận nội bộ bị lộ trong đầu ra hiển thị nếu chế độ suy nghĩ được ngầm bật. OpenClaw mặc định tắt chế độ suy nghĩ của M2.x, trừ khi bạn tự đặt `thinking` một cách rõ ràng. MiniMax-M3 (và các phiên bản M3.x tương thích về sau) được miễn trừ: M3 phát các khối suy nghĩ Anthropic đúng chuẩn và yêu cầu chế độ suy nghĩ hoạt động để tạo nội dung hiển thị, vì vậy OpenClaw duy trì M3 trên cơ chế suy nghĩ thích ứng của nhà cung cấp. Xem phần Mặc định về chế độ suy nghĩ trong mục Cấu hình nâng cao bên dưới.
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
  <Step title="Chọn mô hình/xác thực">
    Chọn **Mô hình/xác thực** từ trình đơn.
  </Step>
  <Step title="Chọn một tùy chọn xác thực MiniMax">
    | Lựa chọn xác thực      | Mô tả                               |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | OAuth quốc tế (Gói lập trình)       |
    | `minimax-cn-oauth`     | OAuth Trung Quốc (Gói lập trình)    |
    | `minimax-global-api`   | Khóa API quốc tế                    |
    | `minimax-cn-api`       | Khóa API Trung Quốc                 |
  </Step>
  <Step title="Chọn mô hình mặc định">
    Chọn mô hình mặc định khi được nhắc.
  </Step>
</Steps>

## Khả năng

### Tạo hình ảnh

Plugin MiniMax đăng ký mô hình `image-01` cho công cụ `image_generate` trên cả `minimax` và `minimax-portal`, sử dụng lại cùng `MINIMAX_API_KEY` hoặc thông tin xác thực OAuth như các mô hình văn bản.

- Tạo ảnh từ văn bản và chỉnh sửa ảnh dựa trên ảnh (tham chiếu chủ thể), cả hai đều hỗ trợ kiểm soát tỷ lệ khung hình
- Tối đa 9 ảnh đầu ra cho mỗi yêu cầu, 1 ảnh tham chiếu cho mỗi yêu cầu chỉnh sửa
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

Việc tạo hình ảnh luôn sử dụng điểm cuối dành riêng cho hình ảnh của MiniMax (`/v1/image_generation`) và bỏ qua `models.providers.minimax.baseUrl`, vì trường đó dùng để cấu hình URL cơ sở tương thích với trò chuyện/Anthropic. Đặt `MINIMAX_API_HOST=https://api.minimaxi.com` để định tuyến việc tạo hình ảnh qua điểm cuối Trung Quốc; điểm cuối toàn cầu mặc định là `https://api.minimax.io`.

<Note>
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

### Chuyển văn bản thành giọng nói

Plugin `minimax` đi kèm đăng ký MiniMax T2A v2 làm nhà cung cấp giọng nói cho `messages.tts`.

- Mô hình TTS mặc định: `speech-2.8-hd`
- Giọng nói mặc định: `English_expressive_narrator`
- Các mã định danh mô hình đi kèm: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Thứ tự phân giải thông tin xác thực: `messages.tts.providers.minimax.apiKey`, sau đó là các hồ sơ xác thực OAuth/token của `minimax-portal`, tiếp theo là các khóa môi trường của Gói token (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), rồi đến `MINIMAX_API_KEY`
- Nếu chưa cấu hình máy chủ TTS, OpenClaw sử dụng lại máy chủ OAuth `minimax-portal` đã cấu hình và loại bỏ các hậu tố đường dẫn tương thích với Anthropic như `/anthropic`
- Các tệp âm thanh đính kèm thông thường vẫn ở định dạng MP3. Các đích ghi chú thoại (Feishu, Telegram và các kênh khác yêu cầu tệp đính kèm tương thích với ghi chú thoại) được chuyển mã từ MP3 của MiniMax sang Opus 48 kHz bằng `ffmpeg`, vì chẳng hạn API tệp của Feishu/Lark chỉ chấp nhận `file_type: "opus"` cho tin nhắn âm thanh gốc
- MiniMax T2A chấp nhận giá trị thập phân cho `speed` và `vol`, nhưng `pitch` được gửi dưới dạng số nguyên; OpenClaw cắt bỏ phần thập phân của giá trị `pitch` trước khi gửi yêu cầu API

| Cài đặt                                  | Biến môi trường        | Mặc định                      | Mô tả                                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------------ |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Máy chủ API MiniMax T2A.                   |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Mã định danh mô hình TTS.                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Mã định danh giọng nói dùng cho đầu ra.    |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Tốc độ phát, `0.5..2.0`.                   |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Âm lượng, `(0, 10]`.                       |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Độ dịch cao độ dạng số nguyên, `-12..12`.  |

### Tạo nhạc

Plugin MiniMax đi kèm đăng ký khả năng tạo nhạc thông qua công cụ dùng chung `music_generate` cho cả `minimax` và `minimax-portal`.

- Mô hình nhạc mặc định: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Cũng hỗ trợ `music-2.6-free`, `music-cover` và `music-cover-free`
- Các tham số điều khiển lời nhắc: `lyrics`, `instrumental`
- Định dạng đầu ra: `mp3`
- Các lượt chạy dựa trên phiên được tách ra thông qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

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

Plugin MiniMax đi kèm đăng ký khả năng tạo video thông qua công cụ dùng chung `video_generate` cho cả `minimax` và `minimax-portal`.

- Mô hình video mặc định: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Cũng hỗ trợ `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` và `I2V-01`
- Chế độ: chuyển văn bản thành video và các luồng tham chiếu một hình ảnh
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

Plugin MiniMax đăng ký chức năng hiểu hình ảnh riêng biệt với danh mục văn bản:

| ID nhà cung cấp   | Mô hình hình ảnh mặc định | Trích xuất văn bản PDF |
| ----------------- | ------------------------- | ---------------------- |
| `minimax`         | `MiniMax-VL-01`           | `MiniMax-M2.7`         |
| `minimax-portal`  | `MiniMax-VL-01`           | `MiniMax-M2.7`         |

Đó là lý do cơ chế định tuyến phương tiện tự động có thể sử dụng chức năng hiểu hình ảnh của MiniMax ngay cả khi danh mục nhà cung cấp văn bản đi kèm cũng chứa các tham chiếu trò chuyện M3 có khả năng xử lý hình ảnh. Chức năng hiểu PDF chỉ sử dụng `MiniMax-M2.7` để trích xuất văn bản; MiniMax không đăng ký đường dẫn chuyển đổi PDF thành hình ảnh.

### Tìm kiếm web

Plugin MiniMax cũng đăng ký `web_search` thông qua API tìm kiếm MiniMax Token Plan (`/v1/coding_plan/search`).

- ID nhà cung cấp: `minimax`
- Kết quả có cấu trúc: tiêu đề, URL, đoạn trích, truy vấn liên quan
- Biến môi trường ưu tiên: `MINIMAX_CODE_PLAN_KEY`
- Bí danh biến môi trường được chấp nhận: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Phương án dự phòng tương thích: `MINIMAX_API_KEY` khi biến này đã trỏ đến thông tin xác thực của gói token
- Tái sử dụng khu vực: `plugins.entries.minimax.config.webSearch.region`, sau đó `MINIMAX_API_HOST`, rồi đến các URL cơ sở của nhà cung cấp MiniMax
- Tìm kiếm vẫn dùng ID nhà cung cấp `minimax`; thiết lập OAuth Trung Quốc/toàn cầu có thể gián tiếp điều hướng khu vực thông qua `models.providers.minimax-portal.baseUrl` và có thể cung cấp xác thực bearer thông qua `MINIMAX_OAUTH_TOKEN`

Cấu hình nằm trong `plugins.entries.minimax.config.webSearch.*`.

<Note>
Xem [Tìm kiếm MiniMax](/vi/tools/minimax-search) để biết đầy đủ cách cấu hình và sử dụng tìm kiếm web.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tùy chọn cấu hình">
    | Tùy chọn | Mô tả |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Ưu tiên `https://api.minimax.io/anthropic` (tương thích Anthropic); `https://api.minimax.io/v1` là tùy chọn dành cho payload tương thích OpenAI |
    | `models.providers.minimax.api` | Ưu tiên `anthropic-messages`; `openai-completions` là tùy chọn dành cho payload tương thích OpenAI |
    | `models.providers.minimax.apiKey` | Khóa API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Định nghĩa `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Đặt bí danh cho các mô hình bạn muốn đưa vào danh sách cho phép |
    | `models.mode` | Giữ `merge` nếu bạn muốn thêm MiniMax bên cạnh các mô hình tích hợp sẵn |
  </Accordion>

  <Accordion title="Mặc định về suy luận">
    Khi dùng `api: "anthropic-messages"`, OpenClaw chèn `thinking: { type: "disabled" }` cho các mô hình MiniMax M2.x, trừ khi một trình bao bọc trước đó đã đặt trường `thinking` trong payload. Điều này ngăn điểm cuối truyền phát của M2.x phát `reasoning_content` trong các phần delta theo kiểu OpenAI, vốn sẽ làm lộ suy luận nội bộ trong đầu ra hiển thị.

    MiniMax-M3 (và M3.x) được miễn: M3 trả về mảng `content` trống với `stop_reason: "end_turn"` khi tính năng suy luận bị tắt, vì vậy OpenClaw loại bỏ mặc định tắt ngầm định đối với M3 và khi đã đặt mức suy luận, thay vào đó buộc dùng `thinking: { type: "adaptive" }`.

    Các mức suy luận khả dụng theo họ mô hình:

    | Họ mô hình      | Mức độ                                    | Mặc định   |
    | --------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`    | `off`, `adaptive`                         | `adaptive` |
    | `MiniMax-M2.x`  | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Chế độ nhanh">
    `/fast on` hoặc `params.fastMode: true` chuyển `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed` trên đường dẫn truyền phát tương thích Anthropic (`api: "anthropic-messages"`, nhà cung cấp `minimax` hoặc `minimax-portal`).
  </Accordion>

  <Accordion title="Ví dụ về phương án dự phòng">
    **Phù hợp nhất khi:** giữ mô hình thế hệ mới nhất và mạnh nhất của bạn làm mô hình chính, đồng thời chuyển đổi dự phòng sang MiniMax M2.7. Ví dụ dưới đây dùng Opus làm mô hình chính cụ thể; hãy thay bằng mô hình chính thế hệ mới nhất mà bạn ưu tiên.

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
    - API mức sử dụng Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` hoặc `https://api.minimax.io/v1/token_plan/remains` (yêu cầu khóa gói lập trình).
    - Cơ chế thăm dò mức sử dụng lấy máy chủ từ `models.providers.minimax-portal.baseUrl` hoặc `models.providers.minimax.baseUrl` khi được cấu hình, vì vậy các thiết lập toàn cầu dùng `https://api.minimax.io/anthropic` sẽ thăm dò `api.minimax.io`. URL cơ sở bị thiếu hoặc không đúng định dạng vẫn dùng phương án dự phòng Trung Quốc để duy trì khả năng tương thích.
    - OpenClaw chuẩn hóa mức sử dụng gói lập trình MiniMax theo cùng cách hiển thị `% còn lại` được các nhà cung cấp khác sử dụng. Các trường thô `usage_percent` / `usagePercent` của MiniMax biểu thị hạn mức còn lại, không phải hạn mức đã dùng, nên OpenClaw đảo ngược chúng. Các trường dựa trên số lượng được ưu tiên khi có.
    - Khi API trả về `model_remains`, OpenClaw ưu tiên mục mô hình trò chuyện, suy ra nhãn khoảng thời gian từ `start_time` / `end_time` khi cần và đưa tên mô hình đã chọn vào nhãn gói để dễ phân biệt các khoảng thời gian của gói lập trình.
    - Ảnh chụp nhanh mức sử dụng coi `minimax`, `minimax-cn`, `minimax-portal` và `minimax-portal-cn` là cùng một bề mặt hạn mức MiniMax, đồng thời ưu tiên OAuth MiniMax đã lưu trước khi dùng dự phòng là các biến môi trường khóa Coding Plan.

  </Accordion>
</AccordionGroup>

## Ghi chú

- Mô hình trò chuyện mặc định: `MiniMax-M3`. Các mô hình trò chuyện thay thế: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Quy trình thiết lập ban đầu và thiết lập trực tiếp bằng khóa API ghi định nghĩa mô hình cho M3 và cả hai biến thể M2.7
- Chức năng hiểu hình ảnh sử dụng nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin sở hữu
- Cập nhật các giá trị định giá trong `models.json` nếu bạn cần theo dõi chi phí chính xác
- Dùng `openclaw models list` để xác nhận ID nhà cung cấp hiện tại, sau đó chuyển đổi bằng `openclaw models set minimax/MiniMax-M3` hoặc `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) để biết các quy tắc về nhà cung cấp.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title='"Mô hình không xác định: minimax/MiniMax-M3"'>
    Điều này thường có nghĩa là **nhà cung cấp MiniMax chưa được cấu hình** (không có mục nhà cung cấp tương ứng và không tìm thấy hồ sơ xác thực hoặc khóa môi trường MiniMax). Khắc phục bằng cách:

    - Chạy `openclaw configure` và chọn một tùy chọn xác thực **MiniMax**, hoặc
    - Thêm thủ công khối `models.providers.minimax` hoặc `models.providers.minimax-portal` tương ứng, hoặc
    - Đặt `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` hoặc một hồ sơ xác thực MiniMax để có thể chèn nhà cung cấp tương ứng.

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
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
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
    Hướng dẫn khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>

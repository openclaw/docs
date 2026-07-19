---
read_when:
    - Bạn muốn sử dụng các mô hình Google Gemini với OpenClaw
    - Bạn cần khóa API hoặc luồng xác thực OAuth
summary: Thiết lập Google Gemini (khóa API + OAuth, tạo hình ảnh, hiểu nội dung đa phương tiện, TTS, tìm kiếm trên web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-19T06:19:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475864f0327ce678b92abb4e35fc2df42b0498ae6fd3c738eff8dd85a35a5458
    source_path: providers/google.md
    workflow: 16
---

Plugin Google cung cấp quyền truy cập vào các mô hình Gemini thông qua Google AI Studio, cùng với khả năng tạo hình ảnh, hiểu nội dung đa phương tiện (hình ảnh/âm thanh/video), chuyển văn bản thành giọng nói và tìm kiếm trên web qua Gemini Grounding.

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- API: Google Gemini API
- Tùy chọn runtime: `agentRuntime.id: "google-gemini-cli"` tái sử dụng OAuth của Gemini CLI trong khi vẫn giữ các tham chiếu mô hình ở dạng chuẩn là `google/*`.

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** quyền truy cập Gemini API tiêu chuẩn thông qua Google AI Studio.

    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa miễn phí trong [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Hoặc truyền khóa trực tiếp:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Xác minh mô hình khả dụng">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Cả `GEMINI_API_KEY` và `GOOGLE_API_KEY` đều được chấp nhận. Hãy dùng biến bạn đã cấu hình.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Phù hợp nhất cho:** đăng nhập bằng tài khoản Google qua OAuth của Gemini CLI thay vì sử dụng khóa API riêng.

    <Warning>
    Nhà cung cấp `google-gemini-cli` là một tích hợp không chính thức. Một số người dùng
    báo cáo tài khoản bị hạn chế khi sử dụng OAuth theo cách này. Bạn tự chịu rủi ro khi sử dụng.
    </Warning>

    <Steps>
      <Step title="Cài đặt Gemini CLI">
        Lệnh `gemini` cục bộ phải khả dụng trên `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # hoặc npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw hỗ trợ cả bản cài đặt Homebrew và bản cài đặt npm toàn cục, bao gồm
        các bố cục Windows/npm phổ biến.
      </Step>
      <Step title="Đăng nhập qua OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Xác minh mô hình khả dụng">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Mô hình mặc định: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Bí danh: `gemini-cli`

    ID mô hình Gemini API của Gemini 3.1 Pro là `gemini-3.1-pro-preview`. OpenClaw chấp nhận dạng ngắn hơn `google/gemini-3.1-pro` làm bí danh tiện dụng và chuẩn hóa nó trước khi gọi nhà cung cấp.

    **Biến môi trường:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Nếu các yêu cầu OAuth của Gemini CLI thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc
    `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway rồi thử lại.
    </Note>

    <Note>
    Nếu đăng nhập thất bại trước khi luồng trình duyệt bắt đầu, hãy đảm bảo lệnh
    `gemini` cục bộ đã được cài đặt và có trên `PATH`.
    </Note>

    Tính năng tự động phát hiện trong quy trình thiết lập ban đầu liệt kê thông tin đăng nhập Gemini CLI hiện có nhưng không bao giờ
    tự động kiểm tra vì Gemini CLI không có phép thăm dò không dùng công cụ. Chọn OAuth của Gemini CLI
    hoặc khóa Gemini API để tiếp tục.

    Các tham chiếu mô hình `google-gemini-cli/*` là bí danh tương thích cũ. Cấu hình mới
    nên sử dụng tham chiếu mô hình `google/*` cùng runtime `google-gemini-cli`
    khi cần thực thi Gemini CLI cục bộ.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` đã ngừng hoạt động vào 2026-03-09; hãy sử dụng `google/gemini-3.1-pro-preview` thay thế. Chạy lại quy trình thiết lập khóa Gemini API (`openclaw onboard --auth-choice gemini-api-key` hoặc `openclaw models auth login --provider google`) sẽ ghi đè một giá trị mặc định đã cấu hình nhưng lỗi thời bằng mô hình hiện tại.
</Note>

## Khả năng

| Khả năng                     | Được hỗ trợ                    |
| ---------------------------- | ------------------------------ |
| Hoàn thành hội thoại         | Có                             |
| Tạo hình ảnh                 | Có                             |
| Tạo nhạc                     | Có                             |
| Chuyển văn bản thành giọng nói | Có                           |
| Giọng nói thời gian thực     | Có (Google Live API)           |
| Hiểu hình ảnh                | Có                             |
| Phiên âm thanh               | Có                             |
| Hiểu video                   | Có                             |
| Tìm kiếm web (Grounding)     | Có                             |
| Tư duy/lập luận              | Có (Gemini 2.5+ / Gemini 3+)   |
| Các mô hình Gemma 4          | Có                             |

## Tìm kiếm web

Nhà cung cấp tìm kiếm web `gemini` đi kèm sử dụng khả năng grounding của Google Search trong Gemini.
Cấu hình khóa tìm kiếm chuyên dụng trong `plugins.entries.google.config.webSearch`,
hoặc cho phép tái sử dụng `models.providers.google.apiKey` sau `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // không bắt buộc nếu GEMINI_API_KEY hoặc models.providers.google.apiKey được đặt
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // dự phòng về models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Thứ tự ưu tiên thông tin xác thực là `webSearch.apiKey` chuyên dụng, sau đó là `GEMINI_API_KEY`,
rồi `models.providers.google.apiKey`. `webSearch.baseUrl` là tùy chọn và
dành cho proxy của đơn vị vận hành hoặc các điểm cuối tương thích với Gemini API; khi bị bỏ qua,
tìm kiếm web Gemini sẽ tái sử dụng `models.providers.google.baseUrl`. Xem
[Tìm kiếm Gemini](/vi/tools/gemini-search) để biết hành vi công cụ dành riêng cho nhà cung cấp.

<Tip>
Các mô hình Gemini 3 sử dụng `thinkingLevel` thay vì `thinkingBudget`. OpenClaw ánh xạ
các điều khiển lập luận của Gemini 3, Gemini 3.1 và bí danh `gemini-*-latest` sang
`thinkingLevel` để các lượt chạy mặc định/độ trễ thấp không gửi các giá trị
`thinkingBudget` bị vô hiệu hóa.

`/think adaptive` giữ nguyên ngữ nghĩa tư duy động của Google thay vì chọn
một mức OpenClaw cố định. Gemini 3 và Gemini 3.1 bỏ qua `thinkingLevel` cố định để
Google có thể chọn mức; Gemini 2.5 gửi giá trị đặc biệt động
`thinkingBudget: -1` của Google.

Các mô hình Gemma 4 (ví dụ `gemma-4-26b-a4b-it`) hỗ trợ chế độ tư duy. OpenClaw
viết lại `thinkingBudget` thành `thinkingLevel` của Google được hỗ trợ cho Gemma 4.
Đặt tư duy thành `off` sẽ duy trì trạng thái tắt tư duy thay vì ánh xạ sang
`MINIMAL`.

Gemini 2.5 Pro chỉ hoạt động ở chế độ tư duy và từ chối giá trị
`thinkingBudget: 0` được đặt rõ ràng; OpenClaw loại bỏ giá trị đó khỏi các yêu cầu Gemini 2.5 Pro
thay vì gửi đi.
</Tip>

## Tạo hình ảnh

Nhà cung cấp tạo hình ảnh `google` đi kèm mặc định sử dụng
`google/gemini-3.1-flash-image`.

- Cũng hỗ trợ `google/gemini-3-pro-image`
- Tạo: tối đa 4 hình ảnh cho mỗi yêu cầu
- Chế độ chỉnh sửa: đã bật, tối đa 5 hình ảnh đầu vào
- Điều khiển hình học: `size`, `aspectRatio` và `resolution`

Để sử dụng Google làm nhà cung cấp hình ảnh mặc định:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image",
      },
    },
  },
}
```

<Note>
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Tạo video

Plugin `google` đi kèm cũng đăng ký khả năng tạo video thông qua
công cụ `video_generate` dùng chung.

- Mô hình video mặc định: `google/veo-3.1-fast-generate-preview`
- Chế độ: văn bản thành video, hình ảnh thành video và các luồng tham chiếu một video
- Hỗ trợ `aspectRatio` (`16:9`, `9:16`) và `resolution` (`720P`, `1080P`); hiện nay Veo không hỗ trợ đầu ra âm thanh
- Thời lượng được hỗ trợ: **4, 6 hoặc 8 giây** (các giá trị khác được điều chỉnh về giá trị được phép gần nhất)

Để sử dụng Google làm nhà cung cấp video mặc định:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Tạo nhạc

Plugin `google` đi kèm cũng đăng ký khả năng tạo nhạc thông qua
công cụ `music_generate` dùng chung.

- Mô hình nhạc mặc định: `google/lyria-3-clip-preview`
- Cũng hỗ trợ `google/lyria-3-pro-preview`
- Điều khiển lời nhắc: `lyrics` và `instrumental`
- Định dạng đầu ra: mặc định là `mp3`, cùng với `wav` trên `google/lyria-3-pro-preview`
- Đầu vào tham chiếu: tối đa 10 hình ảnh
- Các lượt chạy dựa trên phiên được tách qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

Để sử dụng Google làm nhà cung cấp nhạc mặc định:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Xem [Tạo nhạc](/vi/tools/music-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Chuyển văn bản thành giọng nói

Nhà cung cấp giọng nói `google` đi kèm sử dụng đường dẫn TTS của Gemini API với
`gemini-3.1-flash-tts-preview`.

- Giọng nói mặc định: `Kore`
- Xác thực: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- Đầu ra: WAV cho tệp đính kèm TTS thông thường, Opus cho đích ghi chú thoại, PCM cho Talk/điện thoại
- Đầu ra ghi chú thoại: PCM của Google được đóng gói dưới dạng WAV và chuyển mã thành Opus 48 kHz bằng `ffmpeg`

Đường dẫn Gemini TTS theo lô của Google trả về âm thanh đã tạo trong phản hồi
`generateContent` đã hoàn tất. Đối với các cuộc hội thoại bằng giọng nói có độ trễ thấp nhất, hãy sử dụng
nhà cung cấp giọng nói thời gian thực của Google dựa trên Gemini Live API thay vì TTS
theo lô.

Để sử dụng Google làm nhà cung cấp TTS mặc định:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Nói chuyên nghiệp với giọng điềm tĩnh.",
        },
      },
    },
  },
}
```

TTS của Gemini API sử dụng lời nhắc bằng ngôn ngữ tự nhiên để kiểm soát phong cách. Đặt
`audioProfile` để thêm một lời nhắc phong cách có thể tái sử dụng trước văn bản được đọc. Đặt
`speakerName` khi văn bản lời nhắc đề cập đến một người nói có tên.

TTS của Gemini API cũng chấp nhận các thẻ âm thanh biểu cảm trong dấu ngoặc vuông trong văn bản,
chẳng hạn như `[whispers]` hoặc `[laughs]`. Để các thẻ không xuất hiện trong phản hồi trò chuyện
nhưng vẫn gửi chúng đến TTS, hãy đặt chúng bên trong một khối `[[tts:text]]...[[/tts:text]]`:

```text
Đây là văn bản phản hồi sạch.

[[tts:text]][whispers] Đây là phiên bản được đọc thành tiếng.[[/tts:text]]
```

<Note>
Khóa API của Google Cloud Console bị giới hạn cho Gemini API hợp lệ với
nhà cung cấp này. Đây không phải là đường dẫn Cloud Text-to-Speech API riêng biệt.
</Note>

## Giọng nói thời gian thực

Plugin `google` đi kèm đăng ký một nhà cung cấp giọng nói thời gian thực dựa trên
Gemini Live API cho các cầu nối âm thanh phía backend như Voice Call và Google Meet.

| Cài đặt                    | Đường dẫn cấu hình                                                   | Mặc định                                                                                     |
| -------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Mô hình                    | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                             |
| Giọng nói                  | `...google.voice`                                                    | `Kore`                                                                           |
| Nhiệt độ                   | `...google.temperature`                                                    | (chưa đặt)                                                                                   |
| Độ nhạy bắt đầu VAD        | `...google.startSensitivity`                                                    | (chưa đặt)                                                                                   |
| Độ nhạy kết thúc VAD       | `...google.endSensitivity`                                                    | (chưa đặt)                                                                                   |
| Thời lượng im lặng         | `...google.silenceDurationMs`                                                    | (chưa đặt)                                                                                   |
| Xử lý hoạt động            | `...google.activityHandling`                                                    | Mặc định của Google, `start-of-activity-interrupts`                                                      |
| Phạm vi lượt hội thoại     | `...google.turnCoverage`                                                    | Mặc định của Google, `audio-activity-and-all-video`                                                      |
| Tắt VAD tự động            | `...google.automaticActivityDetectionDisabled`                                                    | `false`                                                                           |
| Tiếp tục phiên             | `...google.sessionResumption`                                                    | `true`                                                                           |
| Nén ngữ cảnh               | `...google.contextWindowCompression`                                                    | `true`                                                                           |
| Khóa API                   | `...google.apiKey`                                                    | Dự phòng sang `models.providers.google.apiKey`, `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`                 |

Ví dụ về cấu hình thời gian thực cho Cuộc gọi thoại:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API sử dụng âm thanh hai chiều và gọi hàm qua WebSocket.
OpenClaw điều chỉnh âm thanh cầu nối điện thoại/Meet cho luồng PCM Live API của Gemini và
duy trì các lệnh gọi công cụ trên hợp đồng giọng nói thời gian thực dùng chung. Để trống `temperature`
trừ khi cần thay đổi việc lấy mẫu; OpenClaw bỏ qua các giá trị không dương
vì Google Live có thể trả về bản chép lời không có âm thanh đối với `temperature: 0`.
Tính năng chép lời của Gemini API được bật mà không cần `languageCodes`; SDK Google
hiện tại từ chối các gợi ý mã ngôn ngữ trên đường dẫn API này.
</Note>

<Note>
Gemini 3.1 Live tiếp nhận văn bản hội thoại qua đầu vào thời gian thực và sử dụng
cách gọi hàm tuần tự. OpenClaw bỏ qua `NON_BLOCKING` cũ, việc lập lịch
phản hồi hàm và các trường hội thoại cảm xúc cho mô hình này. Nên dùng
`thinkingLevel`; các giá trị dương đã cấu hình cho `thinkingBudget` được ánh xạ tới
mức được hỗ trợ gần nhất, còn `-1` giữ nguyên giá trị mặc định của Google. Xem
[so sánh khả năng của Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Talk trong Control UI hỗ trợ các phiên Google Live trên trình duyệt bằng token dùng một lần
có giới hạn. Trong Video Talk, trình duyệt gửi trực tiếp các khung hình JPEG có giới hạn tới
Google Live với mức tối đa của nhà cung cấp là một khung hình mỗi giây. Hàm
`describe_view` báo cáo luồng camera đó có đang hoạt động hay không.
Các khung hình camera không đi qua Gateway. Những nhà cung cấp giọng nói thời gian thực
chỉ dành cho backend cũng có thể chạy qua cơ chế truyền tiếp Gateway chung, qua đó
giữ thông tin xác thực của nhà cung cấp trên Gateway.
</Note>

Để người bảo trì xác minh trực tiếp, hãy chạy
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Bài kiểm tra nhanh cũng bao quát các đường dẫn backend/WebRTC của OpenAI; nhánh Google tạo
cùng dạng token Live API có giới hạn mà Talk trong Control UI sử dụng, mở điểm cuối
WebSocket của trình duyệt, gửi tải trọng thiết lập ban đầu cùng một khung hình JPEG, rồi
xác minh phản hồi văn bản và vòng khứ hồi của hàm `describe_view`.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tái sử dụng trực tiếp bộ nhớ đệm Gemini">
    Đối với các lượt chạy trực tiếp bằng Gemini API (`api: "google-generative-ai"`), OpenClaw
    chuyển tiếp mã định danh `cachedContent` đã cấu hình tới các yêu cầu Gemini.

    - Cấu hình tham số theo từng mô hình hoặc trên toàn cục bằng
      `cachedContent` hoặc `cached_content` cũ
    - Tham số từ phạm vi cụ thể hơn (cấp mô hình thay vì toàn cục) luôn được ưu tiên.
      Trong cùng một phạm vi, nếu cả hai khóa đều được đặt, `cached_content` được ưu tiên.
      Chỉ sử dụng một khóa cho mỗi phạm vi để tránh kết quả ngoài dự kiến.
    - Giá trị ví dụ: `cachedContents/prebuilt-context`
    - Mức sử dụng khi khớp bộ nhớ đệm Gemini được chuẩn hóa thành `cacheRead` của OpenClaw từ
      `cachedContentTokenCount` ở thượng nguồn

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Lưu ý sử dụng Gemini CLI">
    Khi sử dụng nhà cung cấp OAuth `google-gemini-cli`, OpenClaw mặc định sử dụng đầu ra
    `stream-json` của Gemini CLI và chuẩn hóa mức sử dụng từ tải trọng
    `stats` cuối cùng. Các giá trị ghi đè `--output-format json` cũ vẫn sử dụng
    trình phân tích cú pháp JSON.

    - Văn bản phản hồi được truyền trực tuyến đến từ các sự kiện `message` của trợ lý.
    - Đối với đầu ra JSON cũ, văn bản phản hồi đến từ trường `response` trong JSON của CLI.
    - Mức sử dụng dự phòng sang `stats` khi CLI để trống `usage`.
    - `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
    - Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Thiết lập môi trường và daemon">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy bảo đảm `GEMINI_API_KEY`
    khả dụng cho tiến trình đó (ví dụ: trong `~/.openclaw/.env` hoặc qua
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Các tham số công cụ âm nhạc dùng chung và lựa chọn nhà cung cấp.
  </Card>
</CardGroup>

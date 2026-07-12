---
read_when:
    - Bạn muốn sử dụng các mô hình Google Gemini với OpenClaw
    - Bạn cần khóa API hoặc luồng xác thực OAuth
summary: Thiết lập Google Gemini (khóa API + OAuth, tạo hình ảnh, hiểu nội dung đa phương tiện, TTS, tìm kiếm web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T08:20:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Plugin Google cung cấp quyền truy cập vào các mô hình Gemini thông qua Google AI Studio, cùng với khả năng tạo hình ảnh, hiểu nội dung đa phương tiện (hình ảnh/âm thanh/video), chuyển văn bản thành giọng nói và tìm kiếm trên web qua Gemini Grounding.

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- API: Google Gemini API
- Tùy chọn runtime: `agentRuntime.id: "google-gemini-cli"` tái sử dụng OAuth của Gemini CLI trong khi vẫn giữ tham chiếu mô hình ở dạng chuẩn `google/*`.

## Bắt đầu

Chọn phương thức xác thực bạn muốn dùng và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** quyền truy cập Gemini API tiêu chuẩn thông qua Google AI Studio.

    <Steps>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Hoặc truyền trực tiếp khóa:

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
    **Phù hợp nhất cho:** tái sử dụng phiên đăng nhập Gemini CLI hiện có qua PKCE OAuth thay vì dùng một khóa API riêng.

    <Warning>
    Nhà cung cấp `google-gemini-cli` là một tích hợp không chính thức. Một số người dùng
    báo cáo tài khoản bị hạn chế khi sử dụng OAuth theo cách này. Bạn tự chịu rủi ro khi sử dụng.
    </Warning>

    <Steps>
      <Step title="Cài đặt Gemini CLI">
        Lệnh `gemini` cục bộ phải khả dụng trong `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # hoặc npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw hỗ trợ cả bản cài đặt qua Homebrew và bản cài đặt npm toàn cục, bao gồm
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

    ID mô hình Gemini API của Gemini 3.1 Pro là `gemini-3.1-pro-preview`. OpenClaw chấp nhận dạng ngắn hơn `google/gemini-3.1-pro` như một bí danh tiện dụng và chuẩn hóa nó trước khi gọi nhà cung cấp.

    **Biến môi trường:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Nếu các yêu cầu OAuth của Gemini CLI thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc
    `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway rồi thử lại.
    </Note>

    <Note>
    Nếu đăng nhập thất bại trước khi luồng trình duyệt bắt đầu, hãy bảo đảm lệnh `gemini`
    cục bộ đã được cài đặt và nằm trong `PATH`.
    </Note>

    Các tham chiếu mô hình `google-gemini-cli/*` là bí danh tương thích cũ. Cấu hình
    mới nên dùng tham chiếu mô hình `google/*` cùng runtime `google-gemini-cli`
    khi muốn thực thi Gemini CLI cục bộ.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` đã ngừng hoạt động vào ngày 2026-03-09; hãy dùng `google/gemini-3.1-pro-preview` thay thế. Việc chạy lại thiết lập khóa Gemini API (`openclaw onboard --auth-choice gemini-api-key` hoặc `openclaw models auth login --provider google`) sẽ ghi lại mô hình mặc định đã cấu hình nhưng lỗi thời thành mô hình hiện tại.
</Note>

## Khả năng

| Khả năng                     | Được hỗ trợ                    |
| ---------------------------- | ------------------------------ |
| Hoàn tất hội thoại            | Có                             |
| Tạo hình ảnh                  | Có                             |
| Tạo nhạc                      | Có                             |
| Chuyển văn bản thành giọng nói | Có                           |
| Giọng nói thời gian thực      | Có (Google Live API)           |
| Hiểu hình ảnh                 | Có                             |
| Phiên âm âm thanh             | Có                             |
| Hiểu video                    | Có                             |
| Tìm kiếm web (Grounding)      | Có                             |
| Suy nghĩ/lập luận             | Có (Gemini 2.5+ / Gemini 3+)   |
| Các mô hình Gemma 4           | Có                             |

## Tìm kiếm web

Nhà cung cấp tìm kiếm web `gemini` được đóng gói sẵn sử dụng khả năng Grounding của Google Search trong Gemini.
Cấu hình một khóa tìm kiếm chuyên dụng tại `plugins.entries.google.config.webSearch`,
hoặc để nó tái sử dụng `models.providers.google.apiKey` sau `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // không bắt buộc nếu đã đặt GEMINI_API_KEY hoặc models.providers.google.apiKey
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
rồi đến `models.providers.google.apiKey`. `webSearch.baseUrl` là tùy chọn và
dành cho proxy của đơn vị vận hành hoặc điểm cuối tương thích với Gemini API; khi bị lược bỏ,
tìm kiếm web Gemini sẽ tái sử dụng `models.providers.google.baseUrl`. Xem
[Tìm kiếm Gemini](/vi/tools/gemini-search) để biết hành vi công cụ dành riêng cho nhà cung cấp.

<Tip>
Các mô hình Gemini 3 sử dụng `thinkingLevel` thay vì `thinkingBudget`. OpenClaw ánh xạ
các điều khiển lập luận của Gemini 3, Gemini 3.1 và bí danh `gemini-*-latest` sang
`thinkingLevel` để các lần chạy mặc định/độ trễ thấp không gửi giá trị
`thinkingBudget` đã bị vô hiệu hóa.

`/think adaptive` giữ nguyên ngữ nghĩa suy nghĩ động của Google thay vì chọn
một mức OpenClaw cố định. Gemini 3 và Gemini 3.1 không gửi `thinkingLevel` cố định để
Google có thể chọn mức; Gemini 2.5 gửi giá trị đánh dấu động của Google
`thinkingBudget: -1`.

Các mô hình Gemma 4 (ví dụ `gemma-4-26b-a4b-it`) hỗ trợ chế độ suy nghĩ. OpenClaw
chuyển `thinkingBudget` thành `thinkingLevel` được Google hỗ trợ cho Gemma 4.
Việc đặt chế độ suy nghĩ thành `off` sẽ tiếp tục vô hiệu hóa suy nghĩ thay vì ánh xạ sang
`MINIMAL`.

Gemini 2.5 Pro chỉ hoạt động ở chế độ suy nghĩ và từ chối giá trị
`thinkingBudget: 0` được đặt rõ ràng; OpenClaw loại bỏ giá trị đó khỏi các yêu cầu Gemini 2.5 Pro
thay vì gửi nó.
</Tip>

## Tạo hình ảnh

Nhà cung cấp tạo hình ảnh `google` được đóng gói sẵn mặc định sử dụng
`google/gemini-3.1-flash-image-preview`.

- Cũng hỗ trợ `google/gemini-3-pro-image-preview`
- Tạo: tối đa 4 hình ảnh cho mỗi yêu cầu
- Chế độ chỉnh sửa: được bật, tối đa 5 hình ảnh đầu vào
- Điều khiển hình học: `size`, `aspectRatio` và `resolution`

Để dùng Google làm nhà cung cấp hình ảnh mặc định:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Tạo video

Plugin `google` được đóng gói sẵn cũng đăng ký khả năng tạo video thông qua công cụ dùng chung
`video_generate`.

- Mô hình video mặc định: `google/veo-3.1-fast-generate-preview`
- Chế độ: văn bản thành video, hình ảnh thành video và các luồng tham chiếu một video
- Hỗ trợ `aspectRatio` (`16:9`, `9:16`) và `resolution` (`720P`, `1080P`); Veo hiện không hỗ trợ đầu ra âm thanh
- Thời lượng được hỗ trợ: **4, 6 hoặc 8 giây** (các giá trị khác được làm tròn về giá trị cho phép gần nhất)

Để dùng Google làm nhà cung cấp video mặc định:

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Tạo nhạc

Plugin `google` được đóng gói sẵn cũng đăng ký khả năng tạo nhạc thông qua công cụ dùng chung
`music_generate`.

- Mô hình nhạc mặc định: `google/lyria-3-clip-preview`
- Cũng hỗ trợ `google/lyria-3-pro-preview`
- Điều khiển lời nhắc: `lyrics` và `instrumental`
- Định dạng đầu ra: mặc định là `mp3`, thêm `wav` trên `google/lyria-3-pro-preview`
- Đầu vào tham chiếu: tối đa 10 hình ảnh
- Các lần chạy có phiên hỗ trợ sẽ tách ra qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

Để dùng Google làm nhà cung cấp nhạc mặc định:

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
Xem [Tạo nhạc](/vi/tools/music-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Chuyển văn bản thành giọng nói

Nhà cung cấp giọng nói `google` được đóng gói sẵn sử dụng đường dẫn TTS của Gemini API với
`gemini-3.1-flash-tts-preview`.

- Giọng mặc định: `Kore`
- Xác thực: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- Đầu ra: WAV cho tệp đính kèm TTS thông thường, Opus cho đích ghi chú thoại, PCM cho Talk/điện thoại
- Đầu ra ghi chú thoại: PCM của Google được đóng gói thành WAV và chuyển mã thành Opus 48 kHz bằng `ffmpeg`

Đường dẫn TTS Gemini theo lô của Google trả về âm thanh đã tạo trong phản hồi
`generateContent` hoàn tất. Để có các cuộc hội thoại bằng giọng nói với độ trễ thấp nhất, hãy dùng
nhà cung cấp giọng nói thời gian thực của Google dựa trên Gemini Live API thay cho TTS
theo lô.

Để dùng Google làm nhà cung cấp TTS mặc định:

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

TTS của Gemini API sử dụng lời nhắc bằng ngôn ngữ tự nhiên để điều khiển phong cách. Đặt
`audioProfile` để thêm một lời nhắc phong cách có thể tái sử dụng trước văn bản được đọc. Đặt
`speakerName` khi văn bản lời nhắc của bạn đề cập đến một người nói có tên.

TTS của Gemini API cũng chấp nhận các thẻ âm thanh biểu cảm trong ngoặc vuông trong văn bản,
chẳng hạn như `[whispers]` hoặc `[laughs]`. Để không hiển thị các thẻ trong câu trả lời trò chuyện
nhưng vẫn gửi chúng tới TTS, hãy đặt chúng bên trong khối `[[tts:text]]...[[/tts:text]]`:

```text
Đây là văn bản trả lời sạch.

[[tts:text]][whispers] Đây là phiên bản được đọc.[[/tts:text]]
```

<Note>
Khóa API của Google Cloud Console được giới hạn cho Gemini API là hợp lệ đối với
nhà cung cấp này. Đây không phải là đường dẫn Cloud Text-to-Speech API riêng biệt.
</Note>

## Giọng nói thời gian thực

Plugin `google` được đóng gói sẵn đăng ký một nhà cung cấp giọng nói thời gian thực dựa trên
Gemini Live API dành cho các cầu nối âm thanh phía máy chủ như Voice Call và Google Meet.

| Cài đặt                         | Đường dẫn cấu hình                                                   | Mặc định                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Mô hình                         | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-3.1-flash-live-preview`                                                                              |
| Giọng nói                       | `...google.voice`                                                    | `Kore`                                                                                                       |
| Nhiệt độ                        | `...google.temperature`                                              | (chưa đặt)                                                                                                   |
| Độ nhạy bắt đầu VAD             | `...google.startSensitivity`                                         | (chưa đặt)                                                                                                   |
| Độ nhạy kết thúc VAD            | `...google.endSensitivity`                                           | (chưa đặt)                                                                                                   |
| Thời lượng im lặng              | `...google.silenceDurationMs`                                        | (chưa đặt)                                                                                                   |
| Xử lý hoạt động                 | `...google.activityHandling`                                         | Mặc định của Google, `start-of-activity-interrupts`                                                          |
| Phạm vi lượt hội thoại          | `...google.turnCoverage`                                             | Mặc định của Google, `audio-activity-and-all-video`                                                          |
| Tắt VAD tự động                 | `...google.automaticActivityDetectionDisabled`                       | `false`                                                                                                      |
| Tiếp tục phiên                  | `...google.sessionResumption`                                        | `true`                                                                                                       |
| Nén ngữ cảnh                    | `...google.contextWindowCompression`                                 | `true`                                                                                                       |
| Khóa API                        | `...google.apiKey`                                                   | Dự phòng sang `models.providers.google.apiKey`, `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`                       |

Ví dụ về cấu hình thời gian thực cho cuộc gọi thoại:

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
OpenClaw điều chỉnh âm thanh từ cầu nối điện thoại/Meet cho luồng PCM Live API của Gemini và
duy trì các lệnh gọi công cụ trên hợp đồng thoại thời gian thực dùng chung. Hãy để `temperature`
ở trạng thái chưa đặt, trừ khi bạn cần thay đổi cách lấy mẫu; OpenClaw bỏ qua các giá trị không dương
vì Google Live có thể trả về bản chép lời mà không có âm thanh khi dùng `temperature: 0`.
Tính năng chép lời của Gemini API được bật mà không có `languageCodes`; SDK Google hiện tại
từ chối các gợi ý mã ngôn ngữ trên đường dẫn API này.
</Note>

<Note>
Gemini 3.1 Live chấp nhận văn bản hội thoại thông qua đầu vào thời gian thực và sử dụng
cơ chế gọi hàm tuần tự. OpenClaw bỏ qua các trường cũ `NON_BLOCKING`, lập lịch
phản hồi hàm và hội thoại cảm xúc đối với mô hình này. Nên ưu tiên
`thinkingLevel`; các giá trị `thinkingBudget` dương đã cấu hình được ánh xạ sang
mức được hỗ trợ gần nhất, còn `-1` giữ nguyên giá trị mặc định của Google. Xem
[phần so sánh khả năng của Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Talk trong Control UI hỗ trợ các phiên Google Live trên trình duyệt bằng token
dùng một lần có giới hạn. Các nhà cung cấp thoại thời gian thực chỉ chạy ở backend
cũng có thể hoạt động thông qua cơ chế truyền tiếp chung của Gateway, nhờ đó thông tin xác thực
của nhà cung cấp được giữ trên Gateway.
</Note>

Để người bảo trì xác minh trực tiếp, hãy chạy
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Bài kiểm tra nhanh cũng bao phủ các đường dẫn backend/WebRTC của OpenAI; phần Google tạo
cùng một dạng token Live API có giới hạn được Talk trong Control UI sử dụng, mở điểm cuối
WebSocket của trình duyệt, gửi tải trọng thiết lập ban đầu và chờ
`setupComplete`.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Đối với các lượt chạy trực tiếp qua Gemini API (`api: "google-generative-ai"`), OpenClaw
    chuyển tiếp mã định danh `cachedContent` đã cấu hình đến các yêu cầu Gemini.

    - Cấu hình tham số theo từng mô hình hoặc trên toàn cục bằng
      `cachedContent` hoặc `cached_content` cũ
    - Tham số từ phạm vi cụ thể hơn (cấp mô hình thay vì toàn cục) luôn được ưu tiên.
      Trong cùng một phạm vi, nếu cả hai khóa đều được đặt, `cached_content` được ưu tiên.
      Chỉ sử dụng một khóa cho mỗi phạm vi để tránh kết quả ngoài dự kiến.
    - Giá trị ví dụ: `cachedContents/prebuilt-context`
    - Mức sử dụng khi trúng bộ nhớ đệm Gemini được chuẩn hóa thành `cacheRead` của OpenClaw từ
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

  <Accordion title="Gemini CLI usage notes">
    Khi sử dụng nhà cung cấp OAuth `google-gemini-cli`, OpenClaw mặc định sử dụng
    đầu ra `stream-json` của Gemini CLI và chuẩn hóa mức sử dụng từ tải trọng
    `stats` cuối cùng. Các giá trị ghi đè `--output-format json` cũ vẫn sử dụng
    trình phân tích cú pháp JSON.

    - Văn bản phản hồi được truyền trực tuyến lấy từ các sự kiện `message` của trợ lý.
    - Với đầu ra JSON cũ, văn bản phản hồi lấy từ trường `response` trong JSON của CLI.
    - Mức sử dụng dự phòng sang `stats` khi CLI để trống `usage`.
    - `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
    - Nếu thiếu `stats.input`, OpenClaw suy ra số token đầu vào từ
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Nếu Gateway chạy dưới dạng tiến trình nền (launchd/systemd), hãy bảo đảm `GEMINI_API_KEY`
    khả dụng cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc thông qua
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Image generation" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Music generation" href="/vi/tools/music-generation" icon="music">
    Các tham số công cụ âm nhạc dùng chung và lựa chọn nhà cung cấp.
  </Card>
</CardGroup>

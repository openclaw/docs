---
read_when:
    - Bạn muốn sử dụng các mô hình Google Gemini với OpenClaw
    - Bạn cần khóa API hoặc luồng xác thực OAuth
summary: Thiết lập Google Gemini (khóa API + OAuth, tạo hình ảnh, hiểu nội dung phương tiện, TTS, tìm kiếm trên web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-29T23:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Plugin Google cung cấp quyền truy cập vào các mô hình Gemini thông qua Google AI Studio, cùng với
tạo hình ảnh, hiểu phương tiện (hình ảnh/âm thanh/video), chuyển văn bản thành giọng nói và tìm kiếm web thông qua
Gemini Grounding.

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- API: Google Gemini API
- Tùy chọn runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  tái sử dụng OAuth của Gemini CLI trong khi vẫn giữ các tham chiếu mô hình ở dạng chuẩn là `google/*`.

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** quyền truy cập Gemini API tiêu chuẩn thông qua Google AI Studio.

    <Steps>
      <Step title="Chạy hướng dẫn thiết lập ban đầu">
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
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Các biến môi trường `GEMINI_API_KEY` và `GOOGLE_API_KEY` đều được chấp nhận. Hãy dùng biến bạn đã cấu hình sẵn.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Phù hợp nhất cho:** tái sử dụng phiên đăng nhập Gemini CLI hiện có qua PKCE OAuth thay vì dùng một khóa API riêng.

    <Warning>
    Nhà cung cấp `google-gemini-cli` là một tích hợp không chính thức. Một số người dùng
    báo cáo các hạn chế tài khoản khi dùng OAuth theo cách này. Hãy tự chịu rủi ro khi sử dụng.
    </Warning>

    <Steps>
      <Step title="Cài đặt Gemini CLI">
        Lệnh `gemini` cục bộ phải có sẵn trên `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw hỗ trợ cả cài đặt qua Homebrew và cài đặt npm toàn cục, bao gồm
        các bố cục Windows/npm phổ biến.
      </Step>
      <Step title="Đăng nhập qua OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Mô hình mặc định: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Bí danh: `gemini-cli`

    ID mô hình Gemini API của Gemini 3.1 Pro là `gemini-3.1-pro-preview`. OpenClaw chấp nhận dạng ngắn hơn `google/gemini-3.1-pro` như một bí danh tiện lợi và chuẩn hóa nó trước các lệnh gọi nhà cung cấp.

    **Biến môi trường:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Hoặc các biến thể `GEMINI_CLI_*`.)

    <Note>
    Nếu các yêu cầu Gemini CLI OAuth thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc
    `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ gateway rồi thử lại.
    </Note>

    <Note>
    Nếu đăng nhập thất bại trước khi luồng trình duyệt bắt đầu, hãy đảm bảo lệnh `gemini`
    cục bộ đã được cài đặt và có trên `PATH`.
    </Note>

    Các tham chiếu mô hình `google-gemini-cli/*` là bí danh tương thích cũ. Cấu hình mới
    nên dùng tham chiếu mô hình `google/*` cùng với runtime `google-gemini-cli`
    khi muốn thực thi Gemini CLI cục bộ.

  </Tab>
</Tabs>

## Khả năng

| Khả năng               | Được hỗ trợ                   |
| ---------------------- | ----------------------------- |
| Hoàn tất trò chuyện    | Có                            |
| Tạo hình ảnh           | Có                            |
| Tạo nhạc               | Có                            |
| Chuyển văn bản thành giọng nói | Có                    |
| Giọng nói thời gian thực | Có (Google Live API)        |
| Hiểu hình ảnh          | Có                            |
| Chép lời âm thanh      | Có                            |
| Hiểu video             | Có                            |
| Tìm kiếm web (Grounding) | Có                          |
| Suy nghĩ/lập luận      | Có (Gemini 2.5+ / Gemini 3+) |
| Mô hình Gemma 4        | Có                            |

<Tip>
Các mô hình Gemini 3 dùng `thinkingLevel` thay vì `thinkingBudget`. OpenClaw ánh xạ
các điều khiển lập luận của Gemini 3, Gemini 3.1 và bí danh `gemini-*-latest` sang
`thinkingLevel` để các lượt chạy mặc định/độ trễ thấp không gửi các giá trị
`thinkingBudget` đã bị tắt.

`/think adaptive` giữ ngữ nghĩa suy nghĩ động của Google thay vì chọn
một mức OpenClaw cố định. Gemini 3 và Gemini 3.1 bỏ qua `thinkingLevel` cố định để
Google có thể chọn mức; Gemini 2.5 gửi sentinel động của Google
`thinkingBudget: -1`.

Các mô hình Gemma 4 (ví dụ `gemma-4-26b-a4b-it`) hỗ trợ chế độ suy nghĩ. OpenClaw
ghi lại `thinkingBudget` thành một `thinkingLevel` của Google được hỗ trợ cho Gemma 4.
Đặt suy nghĩ thành `off` sẽ giữ trạng thái tắt suy nghĩ thay vì ánh xạ sang
`MINIMAL`.
</Tip>

## Tạo hình ảnh

Nhà cung cấp tạo hình ảnh `google` đi kèm mặc định dùng
`google/gemini-3.1-flash-image-preview`.

- Cũng hỗ trợ `google/gemini-3-pro-image-preview`
- Tạo: tối đa 4 hình ảnh mỗi yêu cầu
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
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Tạo video

Plugin `google` đi kèm cũng đăng ký tạo video thông qua công cụ dùng chung
`video_generate`.

- Mô hình video mặc định: `google/veo-3.1-fast-generate-preview`
- Chế độ: luồng văn bản thành video, hình ảnh thành video và tham chiếu một video
- Hỗ trợ `aspectRatio`, `resolution` và `audio`
- Giới hạn thời lượng hiện tại: **4 đến 8 giây**

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Tạo nhạc

Plugin `google` đi kèm cũng đăng ký tạo nhạc thông qua công cụ dùng chung
`music_generate`.

- Mô hình nhạc mặc định: `google/lyria-3-clip-preview`
- Cũng hỗ trợ `google/lyria-3-pro-preview`
- Điều khiển prompt: `lyrics` và `instrumental`
- Định dạng đầu ra: mặc định là `mp3`, cộng thêm `wav` trên `google/lyria-3-pro-preview`
- Đầu vào tham chiếu: tối đa 10 hình ảnh
- Các lượt chạy được hỗ trợ bằng phiên sẽ tách ra qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

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
Xem [Tạo nhạc](/vi/tools/music-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Chuyển văn bản thành giọng nói

Nhà cung cấp giọng nói `google` đi kèm dùng đường dẫn TTS của Gemini API với
`gemini-3.1-flash-tts-preview`.

- Giọng mặc định: `Kore`
- Xác thực: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- Đầu ra: WAV cho tệp đính kèm TTS thông thường, Opus cho mục tiêu ghi chú thoại, PCM cho Talk/điện thoại
- Đầu ra ghi chú thoại: Google PCM được bọc thành WAV và chuyển mã sang Opus 48 kHz bằng `ffmpeg`

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS dùng prompt ngôn ngữ tự nhiên để điều khiển phong cách. Đặt
`audioProfile` để thêm trước một prompt phong cách có thể tái sử dụng trước văn bản được đọc. Đặt
`speakerName` khi văn bản prompt của bạn đề cập đến một người nói có tên.

Gemini API TTS cũng chấp nhận các thẻ âm thanh biểu cảm trong ngoặc vuông trong văn bản,
chẳng hạn như `[whispers]` hoặc `[laughs]`. Để giữ các thẻ không xuất hiện trong phản hồi trò chuyện hiển thị
trong khi vẫn gửi chúng đến TTS, hãy đặt chúng bên trong khối `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Khóa API Google Cloud Console bị giới hạn cho Gemini API hợp lệ với
nhà cung cấp này. Đây không phải là đường dẫn Cloud Text-to-Speech API riêng.
</Note>

## Giọng nói thời gian thực

Plugin `google` đi kèm đăng ký một nhà cung cấp giọng nói thời gian thực dựa trên
Gemini Live API cho các cầu nối âm thanh backend như Voice Call và Google Meet.

| Cài đặt               | Đường dẫn cấu hình                                                  | Mặc định                                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Mô hình               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Giọng                 | `...google.voice`                                                   | `Kore`                                                                                |
| Nhiệt độ              | `...google.temperature`                                             | (chưa đặt)                                                                            |
| Độ nhạy bắt đầu VAD   | `...google.startSensitivity`                                        | (chưa đặt)                                                                            |
| Độ nhạy kết thúc VAD  | `...google.endSensitivity`                                          | (chưa đặt)                                                                            |
| Thời lượng im lặng    | `...google.silenceDurationMs`                                       | (chưa đặt)                                                                            |
| Xử lý hoạt động       | `...google.activityHandling`                                        | Mặc định của Google, `start-of-activity-interrupts`                                   |
| Phạm vi lượt          | `...google.turnCoverage`                                            | Mặc định của Google, `only-activity`                                                  |
| Tắt VAD tự động       | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Khóa API              | `...google.apiKey`                                                  | Dự phòng về `models.providers.google.apiKey`, `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` |

Ví dụ cấu hình giọng nói thời gian thực cho Voice Call:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
OpenClaw điều chỉnh âm thanh cầu nối điện thoại/Meet cho luồng Gemini PCM Live API và
giữ các lệnh gọi công cụ trên hợp đồng giọng nói thời gian thực dùng chung. Để `temperature`
chưa đặt trừ khi bạn cần thay đổi cách lấy mẫu; OpenClaw bỏ qua các giá trị không dương
vì Google Live có thể trả về bản chép lời mà không có âm thanh khi `temperature: 0`.
Tính năng chép lời Gemini API được bật mà không có `languageCodes`; Google
SDK hiện tại từ chối gợi ý mã ngôn ngữ trên đường dẫn API này.
</Note>

<Note>
Control UI Talk hỗ trợ các phiên trình duyệt Google Live với token dùng một lần
bị giới hạn. Các nhà cung cấp giọng nói thời gian thực chỉ chạy ở backend cũng có thể chạy qua
giao thức vận chuyển chuyển tiếp Gateway chung, nhờ đó thông tin xác thực của nhà cung cấp được giữ trên Gateway.
</Note>

Để xác minh trực tiếp dành cho maintainer, chạy
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Nhánh Google tạo cùng dạng token Live API bị giới hạn mà Control
UI Talk sử dụng, mở endpoint WebSocket của trình duyệt, gửi payload thiết lập ban đầu,
và chờ `setupComplete`.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tái sử dụng trực tiếp bộ nhớ đệm Gemini">
    Với các lần chạy trực tiếp Gemini API (`api: "google-generative-ai"`), OpenClaw
    chuyển tiếp handle `cachedContent` đã cấu hình vào các yêu cầu Gemini.

    - Cấu hình tham số theo từng model hoặc toàn cục bằng
      `cachedContent` hoặc `cached_content` cũ
    - Nếu có cả hai, `cachedContent` được ưu tiên
    - Giá trị ví dụ: `cachedContents/prebuilt-context`
    - Lượt dùng trúng bộ nhớ đệm Gemini được chuẩn hóa thành `cacheRead` của OpenClaw từ
      `cachedContentTokenCount` từ upstream

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

  <Accordion title="Ghi chú sử dụng Gemini CLI JSON">
    Khi dùng nhà cung cấp OAuth `google-gemini-cli`, OpenClaw chuẩn hóa
    đầu ra CLI JSON như sau:

    - Văn bản phản hồi đến từ trường `response` trong CLI JSON.
    - Dữ liệu sử dụng rơi về `stats` khi CLI để trống `usage`.
    - `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
    - Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Thiết lập môi trường và daemon">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy bảo đảm `GEMINI_API_KEY`
    khả dụng cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu model, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Các tham số công cụ nhạc dùng chung và lựa chọn nhà cung cấp.
  </Card>
</CardGroup>

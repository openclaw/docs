---
read_when:
    - Bạn muốn sử dụng các mô hình Google Gemini với OpenClaw
    - Bạn cần khóa API hoặc luồng xác thực OAuth
summary: Thiết lập Google Gemini (khóa API + OAuth, tạo hình ảnh, hiểu nội dung đa phương tiện, TTS, tìm kiếm web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-11T20:35:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740ff99392d352e8c0f479af6002c52195b0c40e3ef688289d27dec583174847
    source_path: providers/google.md
    workflow: 16
---

Plugin Google cung cấp quyền truy cập vào các mô hình Gemini thông qua Google AI Studio, cùng với
tạo hình ảnh, hiểu nội dung phương tiện (hình ảnh/âm thanh/video), chuyển văn bản thành giọng nói và tìm kiếm web qua
Gemini Grounding.

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- API: Google Gemini API
- Tùy chọn thời gian chạy: nhà cung cấp/mô hình `agentRuntime.id: "google-gemini-cli"`
  tái sử dụng OAuth của Gemini CLI trong khi vẫn giữ tham chiếu mô hình ở dạng chuẩn là `google/*`.

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** quyền truy cập Gemini API tiêu chuẩn thông qua Google AI Studio.

    <Steps>
      <Step title="Chạy quy trình giới thiệu">
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
    Cả hai biến môi trường `GEMINI_API_KEY` và `GOOGLE_API_KEY` đều được chấp nhận. Hãy dùng biến bạn đã cấu hình.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Phù hợp nhất cho:** tái sử dụng thông tin đăng nhập Gemini CLI hiện có qua PKCE OAuth thay vì dùng một khóa API riêng.

    <Warning>
    Nhà cung cấp `google-gemini-cli` là một tích hợp không chính thức. Một số người dùng
    báo cáo gặp hạn chế tài khoản khi dùng OAuth theo cách này. Hãy tự chịu rủi ro khi sử dụng.
    </Warning>

    <Steps>
      <Step title="Cài đặt Gemini CLI">
        Lệnh cục bộ `gemini` phải có sẵn trên `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
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
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Mô hình mặc định: `google/gemini-3.1-pro-preview`
    - Thời gian chạy: `google-gemini-cli`
    - Bí danh: `gemini-cli`

    ID mô hình Gemini API của Gemini 3.1 Pro là `gemini-3.1-pro-preview`. OpenClaw chấp nhận dạng ngắn hơn `google/gemini-3.1-pro` như một bí danh tiện lợi và chuẩn hóa nó trước khi gọi nhà cung cấp.

    **Biến môi trường:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Hoặc các biến thể `GEMINI_CLI_*`.)

    <Note>
    Nếu các yêu cầu OAuth của Gemini CLI thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc
    `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway rồi thử lại.
    </Note>

    <Note>
    Nếu đăng nhập thất bại trước khi luồng trình duyệt bắt đầu, hãy đảm bảo lệnh cục bộ `gemini`
    đã được cài đặt và nằm trên `PATH`.
    </Note>

    Tham chiếu mô hình `google-gemini-cli/*` là các bí danh tương thích cũ. Cấu hình
    mới nên dùng tham chiếu mô hình `google/*` cùng với thời gian chạy `google-gemini-cli`
    khi muốn thực thi Gemini CLI cục bộ.

  </Tab>
</Tabs>

## Khả năng

| Khả năng               | Được hỗ trợ                   |
| ---------------------- | ----------------------------- |
| Hoàn thành hội thoại   | Có                            |
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

## Tìm kiếm web

Nhà cung cấp tìm kiếm web `gemini` đi kèm sử dụng grounding Google Search của Gemini.
Cấu hình một khóa tìm kiếm chuyên dụng trong `plugins.entries.google.config.webSearch`,
hoặc để nó tái sử dụng `models.providers.google.apiKey` sau `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Thứ tự ưu tiên thông tin xác thực là `webSearch.apiKey` chuyên dụng, rồi `GEMINI_API_KEY`,
rồi `models.providers.google.apiKey`. `webSearch.baseUrl` là tùy chọn và
tồn tại cho proxy của người vận hành hoặc các điểm cuối Gemini API tương thích; khi bị bỏ qua,
tìm kiếm web Gemini tái sử dụng `models.providers.google.baseUrl`. Xem
[Tìm kiếm Gemini](/vi/tools/gemini-search) để biết hành vi công cụ dành riêng cho nhà cung cấp.

<Tip>
Các mô hình Gemini 3 dùng `thinkingLevel` thay vì `thinkingBudget`. OpenClaw ánh xạ
các điều khiển lập luận của Gemini 3, Gemini 3.1 và bí danh `gemini-*-latest` sang
`thinkingLevel` để các lần chạy mặc định/độ trễ thấp không gửi giá trị
`thinkingBudget` đã tắt.

`/think adaptive` giữ ngữ nghĩa suy nghĩ động của Google thay vì chọn
một mức OpenClaw cố định. Gemini 3 và Gemini 3.1 bỏ qua `thinkingLevel` cố định để
Google có thể chọn mức; Gemini 2.5 gửi sentinel động của Google
`thinkingBudget: -1`.

Các mô hình Gemma 4 (ví dụ `gemma-4-26b-a4b-it`) hỗ trợ chế độ suy nghĩ. OpenClaw
ghi lại `thinkingBudget` thành `thinkingLevel` của Google được hỗ trợ cho Gemma 4.
Đặt suy nghĩ thành `off` giữ nguyên trạng thái tắt suy nghĩ thay vì ánh xạ sang
`MINIMAL`.
</Tip>

## Tạo hình ảnh

Nhà cung cấp tạo hình ảnh `google` đi kèm mặc định dùng
`google/gemini-3.1-flash-image-preview`.

- Cũng hỗ trợ `google/gemini-3-pro-image-preview`
- Tạo: tối đa 4 hình ảnh mỗi yêu cầu
- Chế độ chỉnh sửa: bật, tối đa 5 hình ảnh đầu vào
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
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Tạo video

Plugin `google` đi kèm cũng đăng ký tạo video thông qua công cụ dùng chung
`video_generate`.

- Mô hình video mặc định: `google/veo-3.1-fast-generate-preview`
- Chế độ: luồng văn bản-thành-video, hình ảnh-thành-video và tham chiếu một video
- Hỗ trợ `aspectRatio` (`16:9`, `9:16`) và `resolution` (`720P`, `1080P`); đầu ra âm thanh hiện không được Veo hỗ trợ
- Thời lượng được hỗ trợ: **4, 6 hoặc 8 giây** (các giá trị khác sẽ được làm khớp về giá trị được phép gần nhất)

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Tạo nhạc

Plugin `google` đi kèm cũng đăng ký tạo nhạc thông qua công cụ dùng chung
`music_generate`.

- Mô hình nhạc mặc định: `google/lyria-3-clip-preview`
- Cũng hỗ trợ `google/lyria-3-pro-preview`
- Điều khiển lời nhắc: `lyrics` và `instrumental`
- Định dạng đầu ra: mặc định là `mp3`, cộng thêm `wav` trên `google/lyria-3-pro-preview`
- Đầu vào tham chiếu: tối đa 10 hình ảnh
- Các lần chạy dựa trên phiên sẽ tách ra qua luồng tác vụ/trạng thái dùng chung, bao gồm `action: "status"`

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
Xem [Tạo nhạc](/vi/tools/music-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Chuyển văn bản thành giọng nói

Nhà cung cấp giọng nói `google` đi kèm sử dụng đường dẫn TTS của Gemini API với
`gemini-3.1-flash-tts-preview`.

- Giọng mặc định: `Kore`
- Xác thực: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`
- Đầu ra: WAV cho tệp đính kèm TTS thông thường, Opus cho mục tiêu ghi chú thoại, PCM cho Talk/điện thoại
- Đầu ra ghi chú thoại: Google PCM được bọc dưới dạng WAV và chuyển mã sang Opus 48 kHz bằng `ffmpeg`

Đường dẫn TTS Gemini theo lô của Google trả về âm thanh đã tạo trong phản hồi
`generateContent` hoàn tất. Để có các cuộc trò chuyện bằng giọng nói có độ trễ thấp nhất, hãy dùng
nhà cung cấp giọng nói thời gian thực của Google dựa trên Gemini Live API thay vì TTS
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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS sử dụng lời nhắc ngôn ngữ tự nhiên để điều khiển phong cách. Đặt
`audioProfile` để thêm một lời nhắc phong cách có thể tái sử dụng trước văn bản được đọc. Đặt
`speakerName` khi văn bản lời nhắc của bạn nhắc đến một người nói có tên.

Gemini API TTS cũng chấp nhận các thẻ âm thanh biểu cảm trong ngoặc vuông trong văn bản,
chẳng hạn như `[whispers]` hoặc `[laughs]`. Để giữ các thẻ khỏi phản hồi trò chuyện hiển thị
trong khi vẫn gửi chúng đến TTS, hãy đặt chúng bên trong một khối `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Khóa API Google Cloud Console bị giới hạn cho Gemini API hợp lệ với
nhà cung cấp này. Đây không phải là đường dẫn Cloud Text-to-Speech API riêng biệt.
</Note>

## Giọng nói thời gian thực

Plugin `google` đi kèm đăng ký một nhà cung cấp giọng nói thời gian thực dựa trên
Gemini Live API cho các cầu nối âm thanh backend như Voice Call và Google Meet.

| Cài đặt               | Đường dẫn cấu hình                                                  | Mặc định                                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Mô hình               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Giọng nói             | `...google.voice`                                                   | `Kore`                                                                                |
| Nhiệt độ              | `...google.temperature`                                             | (chưa đặt)                                                                            |
| Độ nhạy bắt đầu VAD   | `...google.startSensitivity`                                        | (chưa đặt)                                                                            |
| Độ nhạy kết thúc VAD  | `...google.endSensitivity`                                          | (chưa đặt)                                                                            |
| Thời lượng im lặng    | `...google.silenceDurationMs`                                       | (chưa đặt)                                                                            |
| Xử lý hoạt động       | `...google.activityHandling`                                        | Mặc định của Google, `start-of-activity-interrupts`                                   |
| Phạm vi lượt          | `...google.turnCoverage`                                            | Mặc định của Google, `only-activity`                                                  |
| Tắt VAD tự động       | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Khôi phục phiên       | `...google.sessionResumption`                                       | `true`                                                                                |
| Nén ngữ cảnh          | `...google.contextWindowCompression`                                | `true`                                                                                |
| Khóa API              | `...google.apiKey`                                                  | Dự phòng về `models.providers.google.apiKey`, `GEMINI_API_KEY`, hoặc `GOOGLE_API_KEY` |

Ví dụ cấu hình thời gian thực cho Voice Call:

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
Google Live API dùng âm thanh hai chiều và gọi hàm qua WebSocket.
OpenClaw điều chỉnh âm thanh cầu nối điện thoại/Meet sang luồng PCM Live API của Gemini và
giữ các lệnh gọi công cụ trên hợp đồng giọng nói thời gian thực dùng chung. Hãy để `temperature`
chưa đặt trừ khi bạn cần thay đổi lấy mẫu; OpenClaw bỏ qua các giá trị không dương
vì Google Live có thể trả về bản chép lời không có âm thanh với `temperature: 0`.
Tính năng chép lời của Gemini API được bật mà không có `languageCodes`; Google
SDK hiện tại từ chối gợi ý mã ngôn ngữ trên đường dẫn API này.
</Note>

<Note>
Control UI Talk hỗ trợ các phiên trình duyệt Google Live bằng token dùng một lần có ràng buộc.
Các nhà cung cấp giọng nói thời gian thực chỉ chạy ở backend cũng có thể chạy qua
phương tiện truyền tải chuyển tiếp Gateway chung, giữ thông tin xác thực của nhà cung cấp trên Gateway.
</Note>

Để xác minh trực tiếp dành cho maintainer, hãy chạy
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Bài smoke cũng bao phủ các đường dẫn backend/WebRTC của OpenAI; nhánh Google tạo cùng
dạng token Live API có ràng buộc mà Control UI Talk dùng, mở endpoint WebSocket
của trình duyệt, gửi payload thiết lập ban đầu và chờ
`setupComplete`.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tái sử dụng cache Gemini trực tiếp">
    Với các lần chạy Gemini API trực tiếp (`api: "google-generative-ai"`), OpenClaw
    truyền handle `cachedContent` đã cấu hình tới các yêu cầu Gemini.

    - Cấu hình tham số theo từng mô hình hoặc toàn cục bằng
      `cachedContent` hoặc `cached_content` cũ
    - Nếu có cả hai, `cachedContent` được ưu tiên
    - Giá trị ví dụ: `cachedContents/prebuilt-context`
    - Mức sử dụng cache-hit của Gemini được chuẩn hóa thành `cacheRead` của OpenClaw từ
      `cachedContentTokenCount` thượng nguồn

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

  <Accordion title="Ghi chú sử dụng JSON của Gemini CLI">
    Khi dùng nhà cung cấp OAuth `google-gemini-cli`, OpenClaw chuẩn hóa
    đầu ra JSON của CLI như sau:

    - Văn bản trả lời đến từ trường `response` trong JSON của CLI.
    - Mức sử dụng dự phòng về `stats` khi CLI để trống `usage`.
    - `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
    - Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Thiết lập môi trường và daemon">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `GEMINI_API_KEY`
    có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Tham số công cụ âm nhạc dùng chung và lựa chọn nhà cung cấp.
  </Card>
</CardGroup>

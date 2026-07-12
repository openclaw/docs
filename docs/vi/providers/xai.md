---
read_when:
    - Bạn muốn sử dụng các mô hình Grok trong OpenClaw
    - Bạn đang cấu hình thông tin xác thực xAI hoặc mã định danh mô hình
summary: Sử dụng các mô hình xAI Grok trong OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T08:18:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw đi kèm Plugin nhà cung cấp `xai` tích hợp sẵn dành cho các mô hình Grok. Lộ trình
được khuyến nghị là Grok OAuth với gói đăng ký SuperGrok hoặc X Premium
đủ điều kiện. Gateway, cấu hình, định tuyến và công cụ vẫn chạy cục bộ; chỉ các
yêu cầu Grok được gửi tới API của xAI.

OAuth không yêu cầu khóa API xAI hoặc ứng dụng Grok Build. xAI vẫn có thể
hiển thị Grok Build trên màn hình đồng ý vì OpenClaw sử dụng ứng dụng OAuth
dùng chung của xAI.

## Thiết lập

<Steps>
  <Step title="Cài đặt mới">
    Chạy quy trình thiết lập ban đầu kèm cài đặt daemon, sau đó chọn xAI/Grok OAuth tại
    bước mô hình/xác thực:

    ```bash
    openclaw onboard --install-daemon
    ```

    Trên VPS hoặc qua SSH, hãy chọn trực tiếp xAI OAuth; phương thức này sử dụng xác minh
    bằng mã thiết bị và không cần callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Bản cài đặt hiện có">
    Chỉ đăng nhập vào xAI; không chạy lại toàn bộ quy trình thiết lập ban đầu chỉ để kết nối Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Đặt riêng Grok làm mô hình mặc định:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Chỉ chạy lại toàn bộ quy trình thiết lập ban đầu nếu bạn chủ ý muốn thay đổi Gateway,
    daemon, kênh, không gian làm việc hoặc các lựa chọn thiết lập khác.

  </Step>
  <Step title="Lộ trình dùng khóa API">
    Thiết lập bằng khóa API vẫn hoạt động với các khóa từ xAI Console và các bề mặt đa phương tiện
    cần cấu hình nhà cung cấp dựa trên khóa:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Chọn mô hình">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw sử dụng xAI Responses API làm phương thức truyền tải xAI tích hợp sẵn. Cùng một
thông tin xác thực từ `openclaw models auth login --provider xai --method oauth` hoặc
`--method api-key` cũng hỗ trợ `web_search` (mã nhà cung cấp `grok`), `x_search`,
`code_execution`, giọng nói/phiên âm và tính năng tạo hình ảnh/video của xAI. Nếu bạn
lưu khóa xAI tại `plugins.entries.xai.config.webSearch.apiKey`, nhà cung cấp
mô hình xAI tích hợp sẵn cũng tái sử dụng khóa đó làm phương án dự phòng.
</Note>

## Khắc phục sự cố OAuth

- Với SSH, Docker, VPS hoặc các thiết lập từ xa khác, hãy dùng
  `openclaw models auth login --provider xai --method oauth`; lệnh này sử dụng
  xác minh bằng mã thiết bị, không phải callback localhost.
- Nếu đăng nhập thành công nhưng Grok không phải mô hình mặc định, hãy chạy
  `openclaw models set xai/grok-4.3`.
- Kiểm tra các hồ sơ xác thực xAI đã lưu:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI quyết định tài khoản nào có thể nhận token API OAuth. Nếu một tài khoản
  không đủ điều kiện, hãy dùng lộ trình khóa API hoặc kiểm tra gói đăng ký phía xAI.

<Tip>
Hãy dùng `xai-oauth` khi đăng nhập từ SSH, Docker hoặc VPS. OpenClaw sẽ hiển thị một
URL và mã ngắn; hoàn tất đăng nhập trong bất kỳ trình duyệt cục bộ nào trong khi tiến trình
từ xa thăm dò xAI để chờ hoàn tất trao đổi token.
</Tip>

## Danh mục tích hợp sẵn

Các mã có thể chọn trong trình chọn mô hình. Plugin vẫn phân giải các mã Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast và Grok Code cũ cho các cấu hình hiện có;
xem [khả năng tương thích cũ và các bí danh thay đổi](#legacy-compatibility-and-moving-aliases).

| Dòng            | Mã mô hình                                                   |
| --------------- | ------------------------------------------------------------ |
| Grok 4.5        | `grok-4.5` (bí danh: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1  | `grok-build-0.1`                                             |
| Grok 4.3        | `grok-4.3` (bí danh: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20       | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Hãy dùng `grok-4.5` cho trò chuyện thông thường, lập trình và tác vụ tác tử tại những nơi mô hình này khả dụng.
Grok 4.3 vẫn là lựa chọn thiết lập mặc định an toàn theo khu vực; `grok-build-0.1` và cả hai
biến thể Grok 4.20 có ngày vẫn có thể được chọn.
</Tip>

## Phạm vi tính năng

Plugin tích hợp sẵn ánh xạ các API xAI được hỗ trợ vào các hợp đồng nhà cung cấp và
công cụ dùng chung của OpenClaw. Các khả năng không phù hợp với hợp đồng dùng chung được liệt kê
bên dưới hoặc trong phần giới hạn đã biết.

| Khả năng của xAI              | Bề mặt OpenClaw                         | Trạng thái                                                         |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Trò chuyện / Responses        | Nhà cung cấp mô hình `xai/<model>`      | Có                                                                 |
| Tìm kiếm web phía máy chủ     | Nhà cung cấp `grok` của `web_search`    | Có                                                                 |
| Tìm kiếm X phía máy chủ       | Công cụ `x_search`                      | Có                                                                 |
| Thực thi mã phía máy chủ      | Công cụ `code_execution`                | Có                                                                 |
| Hình ảnh                      | `image_generate`                        | Có                                                                 |
| Video                         | `video_generate`                        | Quy trình đầy đủ kiểu cổ điển; Video 1.5 chuyển hình ảnh thành video |
| Chuyển văn bản thành giọng nói theo lô | `messages.tts.provider: "xai"` / `tts` | Có                                                              |
| TTS truyền trực tiếp          | -                                       | Nhà cung cấp xAI chưa triển khai                                   |
| Chuyển giọng nói thành văn bản theo lô | Hiểu nội dung đa phương tiện `tools.media.audio` | Có                                                     |
| Chuyển giọng nói thành văn bản truyền trực tiếp | Voice Call `streaming.provider: "xai"` | Có                                                   |
| Giọng nói thời gian thực      | -                                       | Chưa được cung cấp; cần hợp đồng phiên/WebSocket khác               |
| Tệp / tác vụ theo lô          | Chỉ tương thích với API mô hình chung   | Không phải công cụ OpenClaw hạng nhất                               |

<Note>
OpenClaw sử dụng các API REST hình ảnh/video/TTS/STT của xAI để tạo nội dung đa phương tiện và
phiên âm theo lô, WebSocket STT truyền trực tiếp của xAI để phiên âm cuộc gọi thoại
trực tiếp, cùng Responses API cho trò chuyện, tìm kiếm và các công cụ
thực thi mã.
</Note>

### Khả năng tương thích với chế độ nhanh cũ

`/fast on` hoặc `agents.defaults.models["xai/<model>"].params.fastMode: true`
vẫn viết lại các cấu hình xAI cũ như sau. Các mã đích này chỉ được
giữ lại để tương thích; hãy dùng các mô hình hiện có thể chọn cho cấu hình
mới.

| Mô hình nguồn  | Đích chế độ nhanh  |
| -------------- | ------------------ |
| `grok-3`       | `grok-3-fast`      |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`      |
| `grok-4-0709`  | `grok-4-fast`      |

### Khả năng tương thích cũ và các bí danh thay đổi

Các bí danh cũ được chuẩn hóa như sau:

| Bí danh cũ                                                    | Mã đã chuẩn hóa   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Các mã 0309 có ngày là những mục có thể chọn trong danh mục. OpenClaw gửi nguyên văn tất cả
bí danh Grok 4.20 hiện tại khác để xAI tiếp tục kiểm soát ngữ nghĩa của các bí danh ổn định,
mới nhất, beta, thử nghiệm và có ngày. Bí danh toàn cục `grok-latest` cũng được
giữ nguyên văn.

xAI đã ngừng sử dụng các mã chính xác sau. OpenClaw giữ chúng dưới dạng các hàng tương thích
ẩn cho những cấu hình đã phát hành, với giới hạn và giá của các đích chuyển hướng
hiện tại:

| Mã đã ngừng sử dụng                                                   | Hành vi hiện tại                         |
| -------------------------------------------------------------------- | ---------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 với mức suy luận `low`          |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 với suy luận bị tắt             |
| `grok-code-fast-1`                                                   | Grok Build 0.1                           |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality               |

`openclaw doctor --fix` cập nhật các giá trị mặc định đã lưu cho công cụ máy chủ xAI và
slug hình ảnh chất lượng đã ngừng sử dụng, xóa các hàng danh mục được tạo đã lỗi thời và sửa chữa
siêu dữ liệu ngữ cảnh lỗi thời trên các hàng 4.20 đang hoạt động. Lệnh này không ghim các bí danh 4.20
`beta-latest` đang hoạt động vào một ảnh chụp nhanh có ngày.

## Tính năng

<Warning>
  `x_search` và `code_execution` chạy trên máy chủ của xAI. xAI tính phí 5 USD cho mỗi 1.000
  lần gọi công cụ, cộng thêm token đầu vào và đầu ra của mô hình. Khi bỏ qua thiết lập
  `enabled` của từng công cụ, OpenClaw chỉ cung cấp công cụ đó cho một mô hình xAI đang hoạt động.
  Nhà cung cấp mô hình đã biết không phải xAI yêu cầu đặt rõ `enabled: true` cho từng công cụ;
  nhà cung cấp bị thiếu hoặc không thể phân giải sẽ mặc định từ chối. Luôn cần xác thực xAI,
  và `enabled: false` sẽ tắt công cụ đối với mọi nhà cung cấp.
</Warning>

<AccordionGroup>
  <Accordion title="Tìm kiếm web">
    Nhà cung cấp tìm kiếm web `grok` tích hợp sẵn ưu tiên xAI OAuth, sau đó dùng dự phòng
    `XAI_API_KEY` hoặc khóa tìm kiếm web của Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Tạo video">
    Plugin `xai` tích hợp sẵn đăng ký tính năng tạo video thông qua công cụ dùng chung
    `video_generate`.

    - Mô hình mặc định: `xai/grok-imagine-video`
    - Mô hình bổ sung: `xai/grok-imagine-video-1.5`
    - Các chế độ cổ điển: chuyển văn bản thành video, chuyển hình ảnh thành video, tạo từ hình ảnh tham chiếu,
      chỉnh sửa video từ xa và mở rộng video từ xa
    - Chế độ Video 1.5: chỉ chuyển hình ảnh thành video, với đúng một hình ảnh khung hình đầu tiên
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      chế độ chuyển hình ảnh thành video cổ điển và Video 1.5 kế thừa tỷ lệ của hình ảnh nguồn khi
      bị bỏ qua
    - Độ phân giải: cổ điển `480P`/`720P`; Video 1.5 cũng hỗ trợ `1080P`; tất cả
      chế độ tạo đều mặc định là `480P`
    - Thời lượng: 1-15 giây cho tạo/chuyển hình ảnh thành video, 1-10 giây khi
      sử dụng vai trò `reference_image` cổ điển, 2-10 giây cho tính năng mở rộng cổ điển
    - Tạo từ hình ảnh tham chiếu: đặt `imageRoles` thành `reference_image` cho
      mọi hình ảnh được cung cấp; xAI chấp nhận tối đa 7 hình ảnh như vậy
    - Chỉnh sửa/mở rộng video kế thừa tỷ lệ khung hình và độ phân giải của video đầu vào;
      các thao tác này không chấp nhận ghi đè thông số hình học
    - Thời gian chờ thao tác mặc định: 600 giây, trừ khi đặt `video_generate.timeoutMs`
      hoặc `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    Không chấp nhận bộ đệm video cục bộ. Hãy dùng URL `http(s)` từ xa cho đầu vào
    chỉnh sửa/mở rộng video. Chuyển hình ảnh thành video chấp nhận bộ đệm hình ảnh cục bộ vì
    OpenClaw mã hóa chúng thành URL dữ liệu cho xAI.
    </Warning>

    Video 1.5 cũng nhận dạng các mã định danh `grok-imagine-video-1.5-preview` và
    `grok-imagine-video-1.5-2026-05-30` của xAI. OpenClaw chuyển tiếp nguyên vẹn
    mã định danh đã chọn, nhưng áp dụng cùng quy tắc xác thực chỉ dành cho hình ảnh.

    Để dùng xAI làm nhà cung cấp video mặc định:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung,
    cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo hình ảnh">
    Plugin `xai` tích hợp sẵn đăng ký tính năng tạo hình ảnh thông qua công cụ dùng chung
    `image_generate`.

    - Mô hình hình ảnh mặc định: `xai/grok-imagine-image`
    - Mô hình bổ sung: `xai/grok-imagine-image-quality`
    - Chế độ: văn bản thành hình ảnh và chỉnh sửa bằng hình ảnh tham chiếu
    - Đầu vào tham chiếu: một `image` hoặc tối đa ba `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Độ phân giải: `1K`, `2K`
    - Số lượng: tối đa 4 hình ảnh
    - Thời gian chờ thao tác mặc định: 600 giây, trừ khi đã đặt
      `image_generate.timeoutMs` hoặc `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw yêu cầu xAI trả về phản hồi hình ảnh `b64_json` để nội dung phương tiện
    được tạo có thể được lưu trữ và phân phối qua luồng đính kèm thông thường của kênh.
    Hình ảnh tham chiếu cục bộ được chuyển đổi thành URL dữ liệu; tham chiếu `http(s)`
    từ xa được chuyển tiếp nguyên trạng.

    Để dùng xAI làm nhà cung cấp hình ảnh mặc định:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI cũng cung cấp tài liệu về `quality`, `mask`, `user` và tỷ lệ khung hình `auto`.
    Hiện tại, OpenClaw chỉ chuyển tiếp các điều khiển hình ảnh dùng chung giữa các nhà cung cấp;
    các tùy chọn chỉ dành riêng cho nền tảng này không được cung cấp qua `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Văn bản thành giọng nói">
    Plugin `xai` đi kèm đăng ký chức năng văn bản thành giọng nói thông qua bề mặt
    nhà cung cấp `tts` dùng chung.

    - Giọng nói: danh mục trực tiếp có xác thực từ xAI; liệt kê bằng
      `openclaw infer tts voices --provider xai`
    - Giọng nói dự phòng ngoại tuyến: `ara`, `eve`, `leo`, `rex`, `sal`
    - Giọng nói mặc định: `eve`
    - ID giọng nói tùy chỉnh của tài khoản vẫn được chuyển tiếp ngay cả khi không có
      trong phản hồi danh mục tích hợp sẵn
    - Định dạng: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Ngôn ngữ: mã BCP-47 hoặc `auto`
    - Tốc độ: ghi đè tốc độ gốc của nhà cung cấp
    - Không hỗ trợ định dạng tin nhắn thoại Opus gốc

    Để dùng xAI làm nhà cung cấp TTS mặc định:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw sử dụng điểm cuối xử lý theo lô `/v1/tts` và danh mục
    `/v1/tts/voices` có xác thực của xAI. xAI cũng cung cấp TTS truyền trực tuyến qua WebSocket,
    nhưng nhà cung cấp xAI đi kèm chưa triển khai điểm móc truyền trực tuyến đó.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói thành văn bản">
    Plugin `xai` đi kèm đăng ký chức năng chuyển giọng nói thành văn bản theo lô
    thông qua bề mặt phiên âm hiểu nội dung phương tiện của OpenClaw.

    - Điểm cuối: xAI REST `/v1/stt`
    - Đường dẫn đầu vào: tải tệp âm thanh lên theo dạng multipart
    - Lựa chọn mô hình: xAI chọn mô hình phiên âm nội bộ; điểm cuối không có
      bộ chọn mô hình
    - Được sử dụng ở mọi nơi mà chức năng phiên âm âm thanh đầu vào đọc `tools.media.audio`,
      bao gồm các đoạn trong kênh thoại Discord và tệp đính kèm âm thanh của kênh

    Để buộc sử dụng xAI cho việc phiên âm âm thanh đầu vào:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    Có thể cung cấp ngôn ngữ qua cấu hình phương tiện âm thanh dùng chung hoặc yêu cầu
    phiên âm cho từng lệnh gọi. Bề mặt dùng chung của OpenClaw chấp nhận gợi ý lời nhắc,
    nhưng tích hợp STT REST của xAI chỉ chuyển tiếp tệp và ngôn ngữ vì chỉ các trường đó
    ánh xạ tới điểm cuối công khai hiện tại của xAI.

  </Accordion>

  <Accordion title="Truyền trực tuyến giọng nói thành văn bản">
    Plugin `xai` đi kèm cũng đăng ký một nhà cung cấp phiên âm thời gian thực
    cho âm thanh cuộc gọi thoại trực tiếp.

    - Điểm cuối: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Kiểu mã hóa mặc định: `mulaw`
    - Tần số lấy mẫu mặc định: `8000`
    - Phát hiện điểm kết thúc mặc định: `800ms`
    - Bản phiên âm tạm thời: được bật theo mặc định

    Luồng phương tiện Twilio của Voice Call gửi các khung âm thanh G.711 mu-law, vì vậy
    nhà cung cấp xAI chuyển tiếp trực tiếp các khung đó mà không chuyển mã:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Cấu hình thuộc quyền sở hữu của nhà cung cấp nằm tại
    `plugins.entries.voice-call.config.streaming.providers.xai`. Các khóa được hỗ trợ
    gồm `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` hoặc
    `alaw`), `interimResults`, `endpointingMs` và `language`.

    <Note>
    Nhà cung cấp truyền trực tuyến này dành cho luồng phiên âm thời gian thực của Voice Call.
    Discord ghi lại các đoạn ngắn và thay vào đó sử dụng luồng phiên âm theo lô
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Cấu hình x_search">
    Plugin xAI đi kèm cung cấp `x_search` dưới dạng một công cụ OpenClaw để
    tìm kiếm nội dung trên X (trước đây là Twitter) thông qua Grok.

    Đường dẫn cấu hình: `plugins.entries.xai.config.xSearch`

    | Khóa              | Kiểu    | Mặc định                  | Mô tả                                                    |
    | ----------------- | ------- | ------------------------- | -------------------------------------------------------- |
    | `enabled`         | boolean | Tự động cho các mô hình xAI | Tắt hoặc chủ động bật cho một nhà cung cấp không phải xAI đã biết |
    | `model`           | string  | `grok-4.3`                | Mô hình dùng cho các yêu cầu x_search                    |
    | `baseUrl`         | string  | -                         | Ghi đè URL cơ sở Responses của xAI                       |
    | `inlineCitations` | boolean | -                         | Bao gồm trích dẫn nội tuyến trong kết quả                |
    | `maxTurns`        | number  | -                         | Số lượt hội thoại tối đa                                 |
    | `timeoutSeconds`  | number  | `30`                      | Thời gian chờ yêu cầu tính bằng giây                     |
    | `cacheTtlMinutes` | number  | `15`                      | Thời gian tồn tại của bộ nhớ đệm tính bằng phút          |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cấu hình thực thi mã">
    Plugin xAI đi kèm cung cấp `code_execution` dưới dạng một công cụ OpenClaw để
    thực thi mã từ xa trong môi trường hộp cát của xAI.

    Đường dẫn cấu hình: `plugins.entries.xai.config.codeExecution`

    | Khóa             | Kiểu    | Mặc định                  | Mô tả                                                    |
    | ---------------- | ------- | ------------------------- | -------------------------------------------------------- |
    | `enabled`        | boolean | Tự động cho các mô hình xAI | Tắt hoặc chủ động bật cho một nhà cung cấp không phải xAI đã biết |
    | `model`          | string  | `grok-4.3`                | Mô hình dùng cho các yêu cầu thực thi mã                 |
    | `maxTurns`       | number  | -                         | Số lượt hội thoại tối đa                                 |
    | `timeoutSeconds` | number  | `30`                      | Thời gian chờ yêu cầu tính bằng giây                     |

    <Note>
    Đây là hoạt động thực thi từ xa trong hộp cát xAI, không phải [`exec`](/vi/tools/exec) cục bộ.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Các giới hạn đã biết">
    - Xác thực xAI có thể sử dụng khóa API, biến môi trường, phương án dự phòng từ cấu hình
      Plugin hoặc OAuth với tài khoản xAI đủ điều kiện. OAuth sử dụng xác minh bằng mã thiết bị
      mà không cần gọi lại localhost. xAI quyết định tài khoản nào có thể nhận mã thông báo API
      OAuth và trang đồng ý có thể hiển thị Grok Build mặc dù OpenClaw không yêu cầu ứng dụng
      Grok Build.
    - Hiện tại OpenClaw không cung cấp dòng mô hình đa tác nhân của xAI. xAI
      phục vụ các mô hình này qua Responses API, nhưng chúng không chấp nhận các công cụ
      phía máy khách hoặc công cụ tùy chỉnh được vòng lặp tác nhân dùng chung của OpenClaw sử dụng.
      Xem
      [các giới hạn về đa tác nhân của xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Giọng nói thời gian thực của xAI chưa được đăng ký làm nhà cung cấp OpenClaw.
      Tính năng này cần một hợp đồng phiên thoại hai chiều khác với STT theo lô
      hoặc phiên âm truyền trực tuyến.
    - `quality` hình ảnh, `mask` hình ảnh và tỷ lệ khung hình `auto` gốc của xAI
      chưa được cung cấp cho đến khi công cụ `image_generate` dùng chung có các
      điều khiển tương ứng giữa các nhà cung cấp.
  </Accordion>

  <Accordion title="Ghi chú nâng cao">
    - OpenClaw tự động áp dụng các bản sửa tương thích dành riêng cho xAI về lược đồ công cụ
      và lệnh gọi công cụ trên đường dẫn trình chạy dùng chung.
    - Các yêu cầu xAI gốc mặc định dùng `tool_stream: true`. Đặt
      `agents.defaults.models["xai/<model>"].params.tool_stream` thành `false`
      để tắt.
    - Trình bao bọc xAI đi kèm loại bỏ các giới hạn lược đồ đếm phần tử không được hỗ trợ
      và các khóa tải trọng *effort* suy luận không được hỗ trợ trước khi gửi yêu cầu xAI gốc.
      Grok 4.5 hỗ trợ mức nỗ lực thấp, trung bình và cao (mặc định là cao).
      Grok 4.3 hỗ trợ không có, thấp, trung bình và cao (mặc định là thấp).
      Các mô hình xAI khác có khả năng suy luận không cung cấp điều khiển mức nỗ lực có thể cấu hình,
      nhưng vẫn yêu cầu `include: ["reasoning.encrypted_content"]` để nội dung suy luận
      đã mã hóa trước đó có thể được phát lại trong các lượt tiếp theo.
    - `web_search`, `x_search` và `code_execution` được cung cấp dưới dạng các công cụ OpenClaw.
      OpenClaw chỉ gắn công cụ tích hợp sẵn cụ thể của xAI mà mỗi công cụ cần vào yêu cầu
      của công cụ đó, thay vì gắn mọi công cụ gốc vào mọi lượt trò chuyện.
    - `web_search` của Grok đọc `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` đọc `plugins.entries.xai.config.xSearch.baseUrl`, sau đó
      dùng URL cơ sở tìm kiếm web của Grok làm phương án dự phòng.
    - `x_search` và `code_execution` thuộc quyền sở hữu của Plugin xAI đi kèm,
      thay vì được mã hóa cứng trong môi trường chạy mô hình lõi.
    - `code_execution` là hoạt động thực thi từ xa trong hộp cát xAI, không phải
      [`exec`](/vi/tools/exec) cục bộ.
  </Accordion>
</AccordionGroup>

## Kiểm thử trực tiếp

Các đường dẫn phương tiện xAI được bao phủ bởi kiểm thử đơn vị và các bộ kiểm thử trực tiếp
cần chủ động bật. Xuất `XAI_API_KEY` trong môi trường tiến trình trước khi chạy các phép thăm dò trực tiếp.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Tệp kiểm thử trực tiếp dành riêng cho nhà cung cấp tổng hợp TTS thông thường, TTS PCM
phù hợp với điện thoại, phiên âm âm thanh qua STT hàng loạt của xAI, truyền phát cùng luồng PCM đó qua STT
thời gian thực của xAI, tạo đầu ra văn bản thành hình ảnh và chỉnh sửa một hình ảnh tham chiếu.
Tệp kiểm thử trực tiếp dùng chung cho hình ảnh xác minh cùng nhà cung cấp xAI đó thông qua
quy trình lựa chọn thời gian chạy, chuyển đổi dự phòng, chuẩn hóa và đính kèm phương tiện của OpenClaw. Trường hợp Video 1.5
tùy chọn gửi một hình ảnh khung hình đầu tiên được tạo ở độ phân giải 1080P và
xác minh việc tải xuống video đã hoàn tất.

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số dùng chung của công cụ video và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tất cả nhà cung cấp" href="/vi/providers/index" icon="grid-2">
    Tổng quan rộng hơn về các nhà cung cấp.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và cách khắc phục.
  </Card>
</CardGroup>

---
read_when:
    - Bạn muốn sử dụng các mô hình Grok trong OpenClaw
    - Bạn đang cấu hình xác thực xAI hoặc mã định danh mô hình
summary: Sử dụng các mô hình xAI Grok trong OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T15:46:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw đi kèm một plugin nhà cung cấp `xai` tích hợp sẵn cho các mô hình Grok. Lộ trình
được khuyến nghị là Grok OAuth với gói đăng ký SuperGrok hoặc X Premium
đủ điều kiện. Gateway, cấu hình, định tuyến và các công cụ vẫn chạy cục bộ; chỉ các yêu cầu
Grok mới được gửi đến API của xAI.

OAuth không yêu cầu khóa API xAI hoặc ứng dụng Grok Build. xAI vẫn có thể
hiển thị Grok Build trên màn hình đồng ý vì OpenClaw sử dụng ứng dụng khách
OAuth dùng chung của xAI.

## Thiết lập

<Steps>
  <Step title="Cài đặt mới">
    Chạy quy trình hướng dẫn ban đầu kèm cài đặt daemon, sau đó chọn xAI/Grok OAuth ở bước
    mô hình/xác thực:

    ```bash
    openclaw onboard --install-daemon
    ```

    Trên VPS hoặc qua SSH, chọn trực tiếp xAI OAuth; phương thức này sử dụng quy trình
    xác minh bằng mã thiết bị và không cần callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Bản cài đặt hiện có">
    Chỉ đăng nhập vào xAI; không chạy lại toàn bộ quy trình hướng dẫn ban đầu chỉ để kết nối Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Đặt riêng Grok làm mô hình mặc định:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Chỉ chạy lại toàn bộ quy trình hướng dẫn ban đầu nếu bạn chủ ý muốn thay đổi Gateway,
    daemon, kênh, không gian làm việc hoặc các lựa chọn thiết lập khác.

  </Step>
  <Step title="Lộ trình dùng khóa API">
    Thiết lập bằng khóa API vẫn hoạt động với các khóa xAI Console và các bề mặt đa phương tiện
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
`--method api-key` cũng hỗ trợ `web_search` (id nhà cung cấp `grok`), `x_search`,
`code_execution`, giọng nói/phiên âm và tính năng tạo hình ảnh/video của xAI. Nếu bạn
lưu một khóa xAI trong `plugins.entries.xai.config.webSearch.apiKey`, nhà cung cấp mô hình xAI
tích hợp sẵn cũng tái sử dụng khóa đó làm phương án dự phòng.
</Note>

## Khắc phục sự cố OAuth

- Đối với SSH, Docker, VPS hoặc các thiết lập từ xa khác, hãy dùng
  `openclaw models auth login --provider xai --method oauth`; phương thức này sử dụng
  xác minh bằng mã thiết bị, không dùng callback localhost.
- Nếu đăng nhập thành công nhưng Grok không phải là mô hình mặc định, hãy chạy
  `openclaw models set xai/grok-4.3`.
- Kiểm tra các hồ sơ xác thực xAI đã lưu:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI quyết định tài khoản nào có thể nhận token API OAuth. Nếu một tài khoản
  không đủ điều kiện, hãy sử dụng lộ trình dùng khóa API hoặc kiểm tra gói đăng ký ở phía xAI.

<Tip>
Dùng `xai-oauth` khi đăng nhập từ SSH, Docker hoặc VPS. OpenClaw hiển thị một
URL và mã ngắn; hoàn tất đăng nhập trong bất kỳ trình duyệt cục bộ nào trong khi tiến trình
từ xa thăm dò xAI để chờ quá trình trao đổi token hoàn tất.
</Tip>

## Danh mục tích hợp sẵn

Các id có thể chọn trong trình chọn mô hình. Plugin vẫn phân giải các id Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast và Grok Code cũ cho các cấu hình hiện có;
xem [khả năng tương thích cũ và các bí danh thay đổi](#legacy-compatibility-and-moving-aliases).

| Dòng            | Id mô hình                                                    |
| --------------- | ------------------------------------------------------------ |
| Grok 4.5        | `grok-4.5` (bí danh: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1  | `grok-build-0.1`                                             |
| Grok 4.3        | `grok-4.3` (bí danh: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20       | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Dùng `grok-4.5` cho trò chuyện thông thường, lập trình và công việc tác tử ở nơi mô hình này khả dụng.
Grok 4.3 vẫn là lựa chọn mặc định an toàn theo khu vực; `grok-build-0.1` và cả hai
biến thể Grok 4.20 có ngày vẫn có thể được chọn.
</Tip>

## Phạm vi tính năng

Plugin tích hợp sẵn ánh xạ các API xAI được hỗ trợ vào các hợp đồng công cụ và nhà cung cấp
dùng chung của OpenClaw. Các khả năng không phù hợp với hợp đồng dùng chung được liệt kê
bên dưới hoặc trong phần giới hạn đã biết.

| Khả năng của xAI            | Bề mặt OpenClaw                         | Trạng thái                                            |
| --------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Trò chuyện / Responses      | Nhà cung cấp mô hình `xai/<model>` | Có                                                   |
| Tìm kiếm web phía máy chủ   | Nhà cung cấp `web_search` `grok` | Có                                                   |
| Tìm kiếm X phía máy chủ     | Công cụ `x_search`              | Có                                                   |
| Thực thi mã phía máy chủ    | Công cụ `code_execution`              | Có                                                   |
| Hình ảnh                    | `image_generate`                       | Có                                                   |
| Video                       | `video_generate`                       | Có                                                   |
| Chuyển văn bản thành giọng nói theo lô | `messages.tts.provider: "xai"` / `tts` | Có                                      |
| TTS phát trực tuyến         | `textToSpeechStream`                       | Có qua `wss://api.x.ai/v1/tts` (không phải giọng nói thời gian thực) |
| Chuyển giọng nói thành văn bản theo lô | Khả năng hiểu phương tiện `tools.media.audio` | Có                                  |
| Chuyển giọng nói thành văn bản phát trực tuyến | Voice Call `streaming.provider: "xai"` | Có                                      |
| Giọng nói thời gian thực    | Talk `talk.realtime.provider: "xai"`                  | Có; chuyển tiếp qua Gateway cho các Node Talk gốc    |
| Tệp / lô                    | Chỉ tương thích với API mô hình chung   | Không phải công cụ OpenClaw hạng nhất                |

<Note>
OpenClaw sử dụng các API REST hình ảnh/video/TTS/STT của xAI để tạo phương tiện và
phiên âm theo lô, WebSocket STT phát trực tuyến của xAI để phiên âm cuộc gọi thoại
trực tiếp, WebSocket Grok Voice Agent của xAI cho các phiên Talk thời gian thực,
và Responses API cho trò chuyện, tìm kiếm cùng các công cụ thực thi mã.
</Note>

### Khả năng tương thích với chế độ nhanh cũ

`/fast on` hoặc `agents.defaults.models["xai/<model>"].params.fastMode: true`
vẫn chuyển đổi các cấu hình xAI cũ như sau. Các id đích này
chỉ được duy trì để tương thích; hãy dùng các mô hình hiện có thể chọn cho cấu hình
mới.

| Mô hình nguồn       | Đích chế độ nhanh   |
| ------------------ | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### Khả năng tương thích cũ và các bí danh thay đổi

Các bí danh cũ được chuẩn hóa như sau:

| Bí danh cũ                                                    | Id đã chuẩn hóa   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Các id 0309 có ngày là các mục có thể chọn trong danh mục. OpenClaw gửi nguyên văn mọi
bí danh Grok 4.20 hiện tại khác để xAI tiếp tục kiểm soát ngữ nghĩa của các bí danh ổn định, mới nhất,
beta, thử nghiệm và có ngày. Bí danh toàn cục `grok-latest` cũng
được giữ nguyên văn.

xAI đã ngừng sử dụng chính xác các id sau. OpenClaw giữ chúng dưới dạng các hàng tương thích
ẩn cho những cấu hình đã phát hành, với các giới hạn và mức giá của đích
chuyển hướng hiện tại:

| Id đã ngừng sử dụng                                                   | Hành vi hiện tại                          |
| -------------------------------------------------------------------- | ---------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 với suy luận `low` |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 với suy luận bị tắt              |
| `grok-code-fast-1`                                                   | Grok Build 0.1                            |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality                |

`openclaw doctor --fix` cập nhật các giá trị mặc định công cụ máy chủ xAI được lưu bền vững và
slug hình ảnh chất lượng đã ngừng sử dụng, loại bỏ các hàng danh mục được tạo đã lỗi thời và sửa
siêu dữ liệu ngữ cảnh lỗi thời trên các hàng 4.20 đang hoạt động. Thao tác này không ghim các bí danh
`beta-latest` 4.20 đang hoạt động vào một ảnh chụp nhanh có ngày.

## Tính năng

<Warning>
  `x_search` và `code_execution` chạy trên máy chủ của xAI. xAI tính phí $5 cho mỗi 1.000
  lần gọi công cụ, cộng với token đầu vào và đầu ra của mô hình. Khi bỏ qua cài đặt
  `enabled` của từng công cụ, OpenClaw chỉ cung cấp công cụ đó cho một mô hình xAI đang hoạt động.
  Một nhà cung cấp mô hình không phải xAI đã biết yêu cầu `enabled: true` rõ ràng cho từng công cụ;
  nhà cung cấp bị thiếu hoặc không thể phân giải sẽ đóng theo hướng an toàn. Luôn yêu cầu xác thực xAI,
  và `enabled: false` vô hiệu hóa công cụ đối với mọi nhà cung cấp.
</Warning>

<AccordionGroup>
  <Accordion title="Tìm kiếm web">
    Nhà cung cấp tìm kiếm web `grok` tích hợp sẵn ưu tiên xAI OAuth, sau đó chuyển sang
    `XAI_API_KEY` hoặc khóa tìm kiếm web của plugin làm phương án dự phòng:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Tạo video">
    Plugin `xai` tích hợp sẵn đăng ký tính năng tạo video thông qua công cụ
    `video_generate` dùng chung.

    - Mô hình mặc định: `xai/grok-imagine-video`
    - Mô hình bổ sung: `xai/grok-imagine-video-1.5`
    - Các chế độ cổ điển: văn bản thành video, hình ảnh thành video, tạo từ hình ảnh tham chiếu,
      chỉnh sửa video từ xa và kéo dài video từ xa
    - Chế độ Video 1.5: chỉ hình ảnh thành video, với chính xác một hình ảnh khung hình đầu tiên
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      chế độ cổ điển và hình ảnh thành video của Video 1.5 kế thừa tỷ lệ của hình ảnh nguồn khi
      bỏ qua
    - Độ phân giải: chế độ cổ điển `480P`/`720P`; Video 1.5 cũng hỗ trợ `1080P`; mọi
      chế độ tạo đều mặc định là `480P`
    - Thời lượng: 1-15 giây cho tạo video/hình ảnh thành video, 1-10 giây khi
      dùng các vai trò `reference_image` cổ điển, 2-10 giây cho tính năng kéo dài cổ điển
    - Tạo từ hình ảnh tham chiếu: đặt `imageRoles` thành `reference_image` cho
      mọi hình ảnh được cung cấp; xAI chấp nhận tối đa 7 hình ảnh như vậy
    - Chỉnh sửa/kéo dài video kế thừa tỷ lệ khung hình và độ phân giải của video đầu vào;
      các thao tác đó không chấp nhận ghi đè hình học
    - Thời gian chờ thao tác mặc định: 600 giây trừ khi đặt `video_generate.timeoutMs`
      hoặc `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    Không chấp nhận bộ đệm video cục bộ. Hãy dùng các URL `http(s)` từ xa cho đầu vào
    chỉnh sửa/kéo dài video. Tính năng hình ảnh thành video chấp nhận bộ đệm hình ảnh cục bộ vì
    OpenClaw mã hóa chúng thành URL dữ liệu cho xAI.
    </Warning>

    Video 1.5 cũng nhận diện các định danh `grok-imagine-video-1.5-preview` và
    `grok-imagine-video-1.5-2026-05-30` của xAI. OpenClaw chuyển tiếp nguyên vẹn
    định danh đã chọn nhưng áp dụng cùng quy trình xác thực chỉ dành cho hình ảnh.

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
    Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ
    dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo hình ảnh">
    Plugin `xai` tích hợp sẵn đăng ký tính năng tạo hình ảnh thông qua công cụ
    `image_generate` dùng chung.

    - Mô hình hình ảnh mặc định: `xai/grok-imagine-image`
    - Mô hình bổ sung: `xai/grok-imagine-image-quality`
    - Chế độ: chuyển văn bản thành hình ảnh và chỉnh sửa bằng hình ảnh tham chiếu
    - Đầu vào tham chiếu: một `image` hoặc tối đa ba `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Độ phân giải: `1K`, `2K`
    - Số lượng: tối đa 4 hình ảnh
    - Thời gian chờ thao tác mặc định: 600 giây, trừ khi `image_generate.timeoutMs`
      hoặc `agents.defaults.imageGenerationModel.timeoutMs` được đặt

    OpenClaw yêu cầu xAI trả về phản hồi hình ảnh `b64_json` để nội dung đa phương tiện được tạo có thể
    được lưu trữ và phân phối qua đường dẫn tệp đính kèm thông thường của kênh. Hình ảnh
    tham chiếu cục bộ được chuyển đổi thành URL dữ liệu; các tham chiếu `http(s)` từ xa
    được chuyển tiếp mà không thay đổi.

    Để sử dụng xAI làm nhà cung cấp hình ảnh mặc định:

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
    xAI cũng ghi nhận `quality`, `mask`, `user` và tỷ lệ khung hình `auto`.
    Hiện tại, OpenClaw chỉ chuyển tiếp các tùy chọn điều khiển hình ảnh dùng chung giữa các nhà cung cấp;
    những tùy chọn riêng này không được cung cấp qua `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Chuyển văn bản thành giọng nói">
    Plugin `xai` đi kèm đăng ký tính năng chuyển văn bản thành giọng nói qua bề mặt nhà cung cấp
    `tts` dùng chung.

    - Giọng nói: danh mục trực tiếp đã xác thực từ xAI; liệt kê bằng
      `openclaw infer tts voices --provider xai`
    - Giọng nói dự phòng ngoại tuyến: `ara`, `eve`, `leo`, `rex`, `sal`
    - Giọng nói mặc định: `eve`
    - ID giọng nói tùy chỉnh của tài khoản vẫn được chuyển tiếp ngay cả khi không có trong
      phản hồi danh mục tích hợp sẵn
    - Định dạng: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Ngôn ngữ: mã BCP-47 hoặc `auto`
    - Tốc độ: ghi đè tốc độ gốc của nhà cung cấp
    - Định dạng tin nhắn thoại Opus gốc không được hỗ trợ

    Để sử dụng xAI làm nhà cung cấp TTS mặc định:

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
    OpenClaw sử dụng điểm cuối `/v1/tts` theo lô của xAI để tổng hợp có bộ đệm,
    khám phá danh mục `/v1/tts/voices` đã xác thực và `wss://api.x.ai/v1/tts` gốc
    để tổng hợp phát trực tuyến. Tính năng phát trực tuyến bị giới hạn ở
    máy chủ `api.x.ai` gốc, vì vậy các giá trị `baseUrl` tùy chỉnh bị từ chối trên
    đường dẫn này. Tính năng này sử dụng các tùy chọn điều khiển hiện có về ngôn ngữ, giọng nói, codec và tốc độ; các giá trị mặc định của xAI
    được áp dụng cho tốc độ lấy mẫu và tốc độ bit. Việc tổng hợp tệp âm thanh tuân theo tất cả
    codec đã cấu hình. Các đích tin nhắn thoại sử dụng MP3 cho cả phát trực tuyến và phương án dự phòng
    có bộ đệm vì codec thô của xAI không mang siêu dữ liệu codec/tốc độ. Luồng
    gửi `text.delta` rồi
    `text.done`, nhận `audio.delta`, `audio.done` hoặc `error`, đồng thời áp dụng
    `timeoutMs` khi không hoạt động, được làm mới với mỗi đoạn âm thanh. Tính năng này tách biệt với
    các phiên thoại thời gian thực. Xem hợp đồng [API TTS phát trực tuyến](https://docs.x.ai/developers/rest-api-reference/inference/voice) của xAI.
    </Note>

  </Accordion>

  <Accordion title="Chuyển giọng nói thành văn bản">
    Plugin `xai` đi kèm đăng ký tính năng chuyển giọng nói thành văn bản theo lô qua
    bề mặt phiên âm hiểu nội dung đa phương tiện của OpenClaw.

    - Điểm cuối: xAI REST `/v1/stt`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Lựa chọn mô hình: xAI chọn mô hình phiên âm nội bộ; điểm cuối
      không có bộ chọn mô hình
    - Được sử dụng ở mọi nơi mà tính năng phiên âm âm thanh đầu vào đọc `tools.media.audio`,
      bao gồm các đoạn kênh thoại Discord và tệp âm thanh đính kèm trong kênh

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

    Có thể cung cấp ngôn ngữ qua cấu hình nội dung âm thanh dùng chung hoặc theo từng yêu cầu
    phiên âm. Bề mặt OpenClaw dùng chung chấp nhận gợi ý lời nhắc, nhưng phần tích hợp
    STT REST của xAI chỉ chuyển tiếp tệp và ngôn ngữ
    vì chúng ánh xạ đến điểm cuối xAI công khai hiện tại.

  </Accordion>

  <Accordion title="Chuyển giọng nói thành văn bản phát trực tuyến">
    Plugin `xai` đi kèm cũng đăng ký một nhà cung cấp phiên âm thời gian thực
    cho âm thanh cuộc gọi thoại trực tiếp.

    - Điểm cuối: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Kiểu mã hóa mặc định: `mulaw`
    - Tốc độ lấy mẫu mặc định: `8000`
    - Phát hiện điểm kết thúc mặc định: `800ms`
    - Bản phiên âm tạm thời: được bật theo mặc định

    Luồng nội dung đa phương tiện Twilio của Cuộc gọi thoại gửi các khung âm thanh G.711 mu-law, vì vậy
    nhà cung cấp xAI chuyển tiếp trực tiếp các khung này mà không chuyển mã:

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

    Cấu hình do nhà cung cấp sở hữu nằm trong
    `plugins.entries.voice-call.config.streaming.providers.xai`. Các khóa được hỗ trợ
    gồm `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` hoặc
    `alaw`), `interimResults`, `endpointingMs` và `language`.

    <Note>
    Nhà cung cấp phát trực tuyến này dành cho đường dẫn phiên âm thời gian thực của Cuộc gọi thoại.
    Tính năng thoại của Discord ghi lại các đoạn ngắn và thay vào đó sử dụng đường dẫn phiên âm
    `tools.media.audio` theo lô.
    </Note>

  </Accordion>

  <Accordion title="Thoại thời gian thực (Talk)">
    Plugin `xai` đi kèm đăng ký các phiên Grok Voice Agent thời gian thực cho
    chế độ Talk qua hợp đồng `registerRealtimeVoiceProvider` dùng chung.

    - Điểm cuối: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Mô hình mặc định: `grok-voice-latest`
    - Giọng nói mặc định: `eve`
    - Phương thức truyền tải: `gateway-relay` (các đường dẫn chuyển tiếp của iOS, Android và Control UI)
    - Âm thanh: PCM16 24 kHz hoặc G.711 µ-law 8 kHz
    - Ngắt lời: VAD máy chủ xAI ngắt phản hồi; OpenClaw xóa phần phát lại đang chờ
      và cắt bỏ lịch sử chưa phát của nhà cung cấp

    Cấu hình Talk trên Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Chỉ chọn tham gia nếu việc phát lại phiên ở phía nhà cung cấp là chấp nhận được.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Cấu hình do nhà cung cấp sở hữu cũng được phân giải từ
    `plugins.entries.voice-call.config.realtime.providers.xai` khi Cuộc gọi thoại
    hoặc các bộ chọn thời gian thực dùng chung tái sử dụng cùng một ánh xạ nhà cung cấp. Các khóa được hỗ trợ gồm
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` và `sessionResumption`.
    `reasoningEffort` chỉ chấp nhận `high` hoặc `none`, tương ứng với API Voice Agent của xAI.

    VAD máy chủ của xAI luôn tạo phản hồi và xử lý việc ngắt âm thanh.
    Sử dụng `consultRouting: "provider-direct"`; giao thức Voice Agent của xAI không hỗ trợ
    định tuyến bắt buộc bản phiên âm và tắt tính năng ngắt âm thanh đầu vào.

    <Note>
    OAuth xAI hoặc `XAI_API_KEY` có thể xác thực thoại thời gian thực. WebRTC do trình duyệt sở hữu
    chưa thuộc bề mặt nhà cung cấp này; hãy sử dụng Talk qua gateway-relay trên
    các Node gốc hoặc đường dẫn chuyển tiếp của Control UI.
    </Note>

    <Note>
    `sessionResumption` mặc định là `false`. Khi được đặt thành `true`, OpenClaw yêu cầu
    xAI giữ lại đủ trạng thái phiên để tiếp tục cùng một cuộc trò chuyện sau khi
    kết nối lại, rồi kết nối lại bằng ID cuộc trò chuyện được trả về. Hãy để tính năng này
    tắt khi việc phát lại/lưu giữ ở phía nhà cung cấp không được chấp nhận; khi đó các socket bị gián đoạn
    sẽ đóng khi có lỗi thay vì âm thầm bắt đầu một cuộc trò chuyện mới.
    </Note>

  </Accordion>

  <Accordion title="Cấu hình x_search">
    Plugin xAI đi kèm cung cấp `x_search` dưới dạng công cụ OpenClaw để
    tìm kiếm nội dung X (trước đây là Twitter) qua Grok.

    Đường dẫn cấu hình: `plugins.entries.xai.config.xSearch`

    | Khóa               | Kiểu    | Mặc định                   | Mô tả                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Tự động đối với mô hình xAI  | Tắt hoặc chọn bật cho một nhà cung cấp không phải xAI đã biết |
    | `model`           | string  | `grok-4.3`                | Mô hình dùng cho các yêu cầu x_search                 |
    | `baseUrl`         | string  | -                         | Ghi đè URL cơ sở Responses của xAI                  |
    | `inlineCitations` | boolean | -                         | Bao gồm trích dẫn nội tuyến trong kết quả              |
    | `maxTurns`        | number  | -                         | Số lượt hội thoại tối đa                       |
    | `timeoutSeconds`  | number  | `30`                      | Thời gian chờ yêu cầu tính bằng giây                       |
    | `cacheTtlMinutes` | number  | `15`                      | Thời gian tồn tại của bộ nhớ đệm tính bằng phút                    |

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
    Plugin xAI đi kèm cung cấp `code_execution` dưới dạng công cụ OpenClaw để
    thực thi mã từ xa trong môi trường sandbox của xAI.

    Đường dẫn cấu hình: `plugins.entries.xai.config.codeExecution`

    | Khóa              | Kiểu    | Mặc định                  | Mô tả                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | Tự động đối với mô hình xAI | Tắt hoặc chọn bật cho một nhà cung cấp không phải xAI đã biết |
    | `model`          | string  | `grok-4.3`               | Mô hình dùng cho các yêu cầu thực thi mã           |
    | `maxTurns`       | number  | -                        | Số lượt hội thoại tối đa                       |
    | `timeoutSeconds` | number  | `30`                     | Thời gian chờ yêu cầu tính bằng giây                       |

    <Note>
    Đây là việc thực thi từ xa trong sandbox xAI, không phải [`exec`](/vi/tools/exec) cục bộ.
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
    - Xác thực xAI có thể sử dụng khóa API, biến môi trường, phương án dự phòng
      từ cấu hình plugin hoặc OAuth với tài khoản xAI đủ điều kiện. OAuth sử dụng
      quy trình xác minh bằng mã thiết bị mà không cần callback localhost. xAI quyết định
      tài khoản nào có thể nhận mã thông báo API OAuth, và trang đồng ý có thể hiển thị Grok Build
      mặc dù OpenClaw không yêu cầu ứng dụng Grok Build.
    - OpenClaw hiện chưa cung cấp dòng mô hình đa tác tử của xAI. xAI
      phục vụ các mô hình này thông qua Responses API, nhưng chúng không chấp nhận
      các công cụ phía máy khách hoặc công cụ tùy chỉnh được vòng lặp tác tử dùng chung của OpenClaw sử dụng.
      Xem
      [các giới hạn về đa tác tử của xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Giọng nói Realtime của xAI hiện chỉ cung cấp phương thức truyền Talk qua chuyển tiếp Gateway.
      Các phiên WebSocket của nhà cung cấp do trình duyệt quản lý vẫn chưa được tích hợp
      trong Control UI.
    - Hình ảnh xAI `quality`, hình ảnh `mask` và các tỷ lệ khung hình bổ sung chỉ dành cho chế độ gốc
      chưa được cung cấp cho đến khi công cụ `image_generate` dùng chung có các tùy chọn điều khiển
      tương ứng giữa các nhà cung cấp.
  </Accordion>

  <Accordion title="Ghi chú nâng cao">
    - OpenClaw tự động áp dụng các bản sửa tương thích dành riêng cho xAI đối với lược đồ công cụ
      và lệnh gọi công cụ trên đường dẫn trình chạy dùng chung.
    - Các yêu cầu xAI gốc mặc định `tool_stream: true`. Đặt
      `agents.defaults.models["xai/<model>"].params.tool_stream` thành `false`
      để tắt tính năng này.
    - Trình bao xAI đi kèm loại bỏ các giới hạn số lượng contains không được hỗ trợ trong lược đồ
      và các khóa tải trọng *effort* suy luận không được hỗ trợ trước khi gửi yêu cầu
      xAI gốc. Grok 4.5 hỗ trợ mức nỗ lực thấp, trung bình và
      cao (mặc định là cao). Grok 4.3 hỗ trợ mức không có, thấp, trung bình và cao
      (mặc định là thấp). Các mô hình xAI khác có khả năng suy luận không cung cấp
      tùy chọn điều khiển mức nỗ lực có thể cấu hình, nhưng vẫn yêu cầu
      `include: ["reasoning.encrypted_content"]` để có thể phát lại nội dung suy luận đã mã hóa trước đó
      trong các lượt tiếp theo.
    - `web_search`, `x_search` và `code_execution` được cung cấp dưới dạng công cụ của OpenClaw.
      OpenClaw chỉ đính kèm chức năng tích hợp sẵn cụ thể của xAI mà mỗi công cụ cần
      vào yêu cầu của công cụ đó, thay vì đính kèm mọi công cụ gốc vào mọi
      lượt trò chuyện.
    - Grok `web_search` đọc `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` đọc `plugins.entries.xai.config.xSearch.baseUrl`, sau đó
      chuyển sang dùng URL cơ sở tìm kiếm web của Grok làm phương án dự phòng.
    - `x_search` và `code_execution` thuộc quyền sở hữu của plugin xAI đi kèm
      thay vì được mã hóa cứng trong runtime mô hình lõi.
    - `code_execution` là quá trình thực thi trong sandbox xAI từ xa, không phải
      [`exec`](/vi/tools/exec) cục bộ.
  </Accordion>
</AccordionGroup>

## Kiểm thử trực tiếp

Các đường dẫn phương tiện xAI được bao phủ bởi kiểm thử đơn vị và các bộ kiểm thử trực tiếp tùy chọn. Hãy xuất
`XAI_API_KEY` trong môi trường tiến trình trước khi chạy các phép thăm dò trực tiếp.

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
phù hợp với điện thoại, phiên âm âm thanh thông qua STT hàng loạt của xAI, truyền phát cùng dữ liệu PCM qua STT
Realtime của xAI, tạo đầu ra văn bản thành hình ảnh và chỉnh sửa một hình ảnh tham chiếu.
Tệp kiểm thử trực tiếp hình ảnh dùng chung xác minh cùng nhà cung cấp xAI thông qua
đường dẫn lựa chọn runtime, dự phòng, chuẩn hóa và đính kèm phương tiện của OpenClaw. Trường hợp
Video 1.5 tùy chọn gửi một hình ảnh khung hình đầu tiên được tạo ở độ phân giải 1080P và
xác minh việc tải xuống video đã hoàn tất.

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số của công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tất cả nhà cung cấp" href="/vi/providers/index" icon="grid-2">
    Tổng quan rộng hơn về các nhà cung cấp.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và cách khắc phục.
  </Card>
</CardGroup>

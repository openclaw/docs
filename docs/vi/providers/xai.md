---
read_when:
    - Bạn muốn sử dụng các mô hình Grok trong OpenClaw
    - Bạn đang cấu hình xác thực xAI hoặc ID mô hình
summary: Sử dụng các mô hình xAI Grok trong OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:06:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw cung cấp sẵn Plugin nhà cung cấp `xai` cho các mô hình Grok. Với hầu hết
người dùng, đường dẫn được khuyến nghị là Grok OAuth với gói đăng ký SuperGrok hoặc X Premium
đủ điều kiện. OpenClaw vẫn ưu tiên cục bộ: Gateway, cấu hình, định tuyến và
công cụ chạy trên máy của bạn, trong khi các yêu cầu mô hình Grok xác thực qua xAI
và được gửi đến API của xAI.

OAuth không yêu cầu khóa API xAI, và không yêu cầu ứng dụng Grok Build.
xAI vẫn có thể hiển thị Grok Build trên màn hình đồng ý vì OpenClaw sử dụng
OAuth client dùng chung của xAI.

## Chọn đường dẫn thiết lập

Dùng đường dẫn khớp với trạng thái cài đặt OpenClaw của bạn:

<Steps>
  <Step title="Cài đặt OpenClaw mới">
    Chạy quy trình khởi tạo với cài đặt daemon khi bạn đang thiết lập Gateway
    cục bộ mới, rồi chọn tùy chọn xAI/Grok OAuth ở bước mô hình/xác thực:

    ```bash
    openclaw onboard --install-daemon
    ```

    Trên VPS hoặc qua SSH, chọn xAI OAuth trực tiếp; OpenClaw sử dụng xác minh
    mã thiết bị và không yêu cầu callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth không yêu cầu khóa API xAI. OpenClaw không yêu cầu ứng dụng Grok
    Build. xAI vẫn có thể gắn nhãn ứng dụng đồng ý là Grok Build vì
    OpenClaw sử dụng OAuth client dùng chung của xAI.

  </Step>
  <Step title="Cài đặt OpenClaw hiện có">
    Nếu OpenClaw đã được cấu hình, chỉ đăng nhập vào xAI. Đừng chạy lại toàn bộ
    quy trình khởi tạo hoặc cài đặt lại daemon chỉ để kết nối Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Để đặt Grok làm mô hình mặc định sau khi đăng nhập, áp dụng riêng:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Chỉ chạy lại toàn bộ quy trình khởi tạo nếu bạn chủ ý muốn thay đổi Gateway,
    daemon, kênh, workspace hoặc các lựa chọn thiết lập khác.

  </Step>
  <Step title="Đường dẫn khóa API">
    Thiết lập khóa API vẫn hoạt động với khóa xAI Console và với các bề mặt media
    yêu cầu cấu hình nhà cung cấp dựa trên khóa:

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
OpenClaw sử dụng xAI Responses API làm transport xAI được cung cấp sẵn. Cùng
thông tin xác thực từ `openclaw models auth login --provider xai --method oauth` hoặc
`openclaw models auth login --provider xai --method api-key` cũng có thể vận hành các tính năng hạng nhất
`web_search`, `x_search`, `code_execution` từ xa và tạo ảnh/video xAI.
Giọng nói và phiên âm hiện yêu cầu `XAI_API_KEY` hoặc cấu hình nhà cung cấp.
`web_search` dựa trên Grok ưu tiên xAI OAuth và dự phòng về `XAI_API_KEY` hoặc
cấu hình tìm kiếm web của plugin.
Nếu bạn lưu khóa xAI dưới `plugins.entries.xai.config.webSearch.apiKey`,
nhà cung cấp mô hình xAI được cung cấp sẵn cũng tái sử dụng khóa đó làm dự phòng.
Đặt `plugins.entries.xai.config.webSearch.baseUrl` để định tuyến `web_search` của Grok
và, theo mặc định, `x_search` qua proxy xAI Responses của operator.
Tinh chỉnh `code_execution` nằm dưới `plugins.entries.xai.config.codeExecution`.
</Note>

## Khắc phục sự cố OAuth

- Với SSH, Docker, VPS hoặc các thiết lập từ xa khác, dùng
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth sử dụng
  xác minh mã thiết bị thay vì callback localhost.
- Nếu đăng nhập thành công nhưng Grok không phải mô hình mặc định, chạy
  `openclaw models set xai/grok-4.3`.
- Để kiểm tra các hồ sơ xác thực xAI đã lưu, chạy:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI quyết định tài khoản nào có thể nhận token API OAuth. Nếu một tài khoản
  không đủ điều kiện, hãy thử đường dẫn khóa API hoặc kiểm tra gói đăng ký phía xAI.

<Tip>
Dùng `xai-oauth` khi đăng nhập từ SSH, Docker hoặc VPS. OpenClaw in ra một
URL xAI và mã ngắn; hoàn tất đăng nhập trong bất kỳ trình duyệt cục bộ nào trong khi
tiến trình từ xa thăm dò xAI để hoàn tất trao đổi token.
</Tip>

## Danh mục tích hợp sẵn

OpenClaw bao gồm sẵn các mô hình chat xAI hiện tại, được sắp xếp mới nhất
trước trong bộ chọn mô hình:

| Dòng           | ID mô hình                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin vẫn phân giải chuyển tiếp các slug Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast và Grok Code cũ hơn cho các cấu hình hiện có. Các alias Grok Code Fast chính thức
chuẩn hóa thành `grok-build-0.1`; OpenClaw không còn hiển thị các slug upstream
đã ngừng khác trong danh mục có thể chọn.

<Tip>
Dùng `grok-4.3` cho chat nói chung và `grok-build-0.1` cho workload tập trung vào
build/lập trình, trừ khi bạn rõ ràng cần một alias beta Grok 4.20.
</Tip>

## Phạm vi tính năng OpenClaw

Plugin được cung cấp sẵn ánh xạ bề mặt API công khai hiện tại của xAI vào các
hợp đồng nhà cung cấp và công cụ dùng chung của OpenClaw. Những khả năng không khớp
hợp đồng dùng chung (ví dụ TTS streaming và giọng nói realtime) không được phơi bày - xem bảng
bên dưới.

| Khả năng xAI                | Bề mặt OpenClaw                          | Trạng thái                                                          |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses            | Nhà cung cấp mô hình `xai/<model>`        | Có                                                                  |
| Tìm kiếm web phía máy chủ   | Nhà cung cấp `web_search` `grok`          | Có                                                                  |
| Tìm kiếm X phía máy chủ     | Công cụ `x_search`                        | Có                                                                  |
| Thực thi mã phía máy chủ    | Công cụ `code_execution`                  | Có                                                                  |
| Ảnh                         | `image_generate`                          | Có                                                                  |
| Video                       | `video_generate`                          | Có                                                                  |
| Chuyển văn bản thành giọng nói theo lô | `messages.tts.provider: "xai"` / `tts` | Có                                                                 |
| TTS streaming               | -                                         | Không phơi bày; hợp đồng TTS của OpenClaw trả về bộ đệm âm thanh hoàn chỉnh |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu media        | Có                                                                  |
| Chuyển giọng nói thành văn bản streaming | Voice Call `streaming.provider: "xai"` | Có                                                                 |
| Giọng nói realtime          | -                                         | Chưa phơi bày; hợp đồng phiên/WebSocket khác                        |
| Tệp / lô                    | Chỉ tương thích API mô hình chung         | Không phải công cụ OpenClaw hạng nhất                               |

<Note>
OpenClaw sử dụng các API REST ảnh/video/TTS/STT của xAI cho tạo media,
giọng nói và phiên âm theo lô, WebSocket STT streaming của xAI cho phiên âm
cuộc gọi thoại trực tiếp, và Responses API cho mô hình, tìm kiếm và
công cụ thực thi mã. Các tính năng cần hợp đồng OpenClaw khác, chẳng hạn
phiên giọng nói realtime, được ghi tài liệu ở đây như khả năng upstream thay vì
hành vi plugin ẩn.
</Note>

### Ánh xạ chế độ nhanh

`/fast on` hoặc `agents.defaults.models["xai/<model>"].params.fastMode: true`
viết lại yêu cầu xAI gốc như sau:

| Mô hình nguồn  | Đích chế độ nhanh |
| -------------- | ----------------- |
| `grok-3`       | `grok-3-fast`     |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`     |
| `grok-4-0709`  | `grok-4-fast`     |

### Alias tương thích kế thừa

Các alias kế thừa vẫn chuẩn hóa thành ID được cung cấp sẵn chính tắc:

| Alias kế thừa             | ID chính tắc                          |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Tính năng

<AccordionGroup>
  <Accordion title="Tìm kiếm web">
    Nhà cung cấp tìm kiếm web `grok` được cung cấp sẵn ưu tiên xAI OAuth, rồi dự phòng
    về `XAI_API_KEY` hoặc khóa tìm kiếm web của plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Tạo video">
    Plugin `xai` được cung cấp sẵn đăng ký tạo video thông qua công cụ dùng chung
    `video_generate`.

    - Mô hình video mặc định: `xai/grok-imagine-video`
    - Chế độ: văn bản thành video, ảnh thành video, tạo ảnh tham chiếu, chỉnh sửa
      video từ xa và mở rộng video từ xa
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Độ phân giải: `480P`, `720P`
    - Thời lượng: 1-15 giây cho tạo/ảnh thành video, 1-10 giây khi
      dùng vai trò `reference_image`, 2-10 giây cho mở rộng
    - Tạo ảnh tham chiếu: đặt `imageRoles` thành `reference_image` cho
      mọi ảnh được cung cấp; xAI chấp nhận tối đa 7 ảnh như vậy
    - Thời gian chờ thao tác mặc định: 600 giây trừ khi `video_generate.timeoutMs`
      hoặc `agents.defaults.videoGenerationModel.timeoutMs` được đặt

    <Warning>
    Bộ đệm video cục bộ không được chấp nhận. Dùng URL `http(s)` từ xa cho
    đầu vào chỉnh sửa/mở rộng video. Ảnh thành video chấp nhận bộ đệm ảnh cục bộ vì
    OpenClaw có thể mã hóa chúng thành data URL cho xAI.
    </Warning>

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
    Xem [Tạo video](/vi/tools/video-generation) để biết tham số công cụ dùng chung,
    lựa chọn nhà cung cấp và hành vi chuyển dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo ảnh">
    Plugin `xai` được cung cấp sẵn đăng ký tạo ảnh thông qua công cụ dùng chung
    `image_generate`.

    - Mô hình ảnh mặc định: `xai/grok-imagine-image`
    - Mô hình bổ sung: `xai/grok-imagine-image-quality`
    - Chế độ: văn bản thành ảnh và chỉnh sửa ảnh tham chiếu
    - Đầu vào tham chiếu: một `image` hoặc tối đa năm `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Độ phân giải: `1K`, `2K`
    - Số lượng: tối đa 4 ảnh
    - Thời gian chờ thao tác mặc định: 600 giây trừ khi `image_generate.timeoutMs`
      hoặc `agents.defaults.imageGenerationModel.timeoutMs` được đặt

    OpenClaw yêu cầu xAI trả về ảnh dạng `b64_json` để media đã tạo có thể được
    lưu trữ và gửi qua đường dẫn tệp đính kèm kênh thông thường. Ảnh tham chiếu
    cục bộ được chuyển đổi thành data URL; tham chiếu `http(s)` từ xa được
    chuyển tiếp nguyên trạng.

    Để dùng xAI làm nhà cung cấp ảnh mặc định:

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
    xAI cũng ghi tài liệu về `quality`, `mask`, `user`, và các tỷ lệ gốc bổ sung
    như `1:2`, `2:1`, `9:20`, và `20:9`. Hiện tại OpenClaw chỉ chuyển tiếp các
    điều khiển hình ảnh dùng chung giữa các nhà cung cấp; các nút điều chỉnh chỉ dành cho gốc không được hỗ trợ
    được cố ý không phơi bày qua `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Chuyển văn bản thành giọng nói">
    Plugin `xai` đi kèm đăng ký chuyển văn bản thành giọng nói thông qua bề mặt nhà cung cấp `tts`
    dùng chung.

    - Giọng nói: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Giọng nói mặc định: `eve`
    - Định dạng: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Ngôn ngữ: mã BCP-47 hoặc `auto`
    - Tốc độ: ghi đè tốc độ gốc của nhà cung cấp
    - Định dạng ghi chú thoại Opus gốc không được hỗ trợ

    Để dùng xAI làm nhà cung cấp TTS mặc định:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw dùng endpoint `/v1/tts` theo lô của xAI. xAI cũng cung cấp TTS phát trực tuyến
    qua WebSocket, nhưng hợp đồng nhà cung cấp giọng nói của OpenClaw hiện yêu cầu
    một bộ đệm âm thanh hoàn chỉnh trước khi gửi phản hồi.
    </Note>

  </Accordion>

  <Accordion title="Chuyển giọng nói thành văn bản">
    Plugin `xai` đi kèm đăng ký chuyển giọng nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu phương tiện của OpenClaw.

    - Mô hình mặc định: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Đường dẫn đầu vào: tải lên tệp âm thanh dạng multipart
    - Được OpenClaw hỗ trợ ở mọi nơi phiên âm âm thanh đầu vào dùng
      `tools.media.audio`, bao gồm các đoạn kênh thoại Discord và
      tệp đính kèm âm thanh của kênh

    Để bắt buộc dùng xAI cho phiên âm âm thanh đầu vào:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Ngôn ngữ có thể được cung cấp qua cấu hình phương tiện âm thanh dùng chung hoặc qua yêu cầu
    phiên âm theo từng lệnh gọi. Gợi ý prompt được bề mặt OpenClaw dùng chung
    chấp nhận, nhưng tích hợp xAI REST STT chỉ chuyển tiếp tệp, mô hình, và
    ngôn ngữ vì các trường đó ánh xạ rõ ràng tới endpoint xAI công khai hiện tại.

  </Accordion>

  <Accordion title="Chuyển giọng nói thành văn bản phát trực tuyến">
    Plugin `xai` đi kèm cũng đăng ký một nhà cung cấp phiên âm thời gian thực
    cho âm thanh cuộc gọi thoại trực tiếp.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Mã hóa mặc định: `mulaw`
    - Tần số lấy mẫu mặc định: `8000`
    - Phân đoạn kết thúc mặc định: `800ms`
    - Bản phiên âm tạm thời: bật theo mặc định

    Luồng phương tiện Twilio của Voice Call gửi các khung âm thanh G.711 µ-law, nên
    nhà cung cấp xAI có thể chuyển tiếp trực tiếp các khung đó mà không cần chuyển mã:

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

    Cấu hình do nhà cung cấp sở hữu nằm dưới
    `plugins.entries.voice-call.config.streaming.providers.xai`. Các khóa được hỗ trợ
    là `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, hoặc
    `alaw`), `interimResults`, `endpointingMs`, và `language`.

    <Note>
    Nhà cung cấp phát trực tuyến này dành cho đường dẫn phiên âm thời gian thực của Voice Call.
    Giọng nói Discord hiện ghi lại các đoạn ngắn và dùng đường dẫn phiên âm theo lô
    `tools.media.audio` thay thế.
    </Note>

  </Accordion>

  <Accordion title="Cấu hình x_search">
    Plugin xAI đi kèm phơi bày `x_search` dưới dạng một công cụ OpenClaw để tìm kiếm
    nội dung X (trước đây là Twitter) qua Grok.

    Đường dẫn cấu hình: `plugins.entries.xai.config.xSearch`

    | Khóa               | Kiểu    | Mặc định           | Mô tả                                  |
    | ------------------ | ------- | ------------------ | -------------------------------------- |
    | `enabled`          | boolean | -                  | Bật hoặc tắt x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | Mô hình dùng cho yêu cầu x_search      |
    | `baseUrl`          | string  | -                  | Ghi đè URL cơ sở xAI Responses         |
    | `inlineCitations`  | boolean | -                  | Bao gồm trích dẫn nội dòng trong kết quả |
    | `maxTurns`         | number  | -                  | Số lượt hội thoại tối đa               |
    | `timeoutSeconds`   | number  | -                  | Thời gian chờ yêu cầu tính bằng giây   |
    | `cacheTtlMinutes`  | number  | -                  | Thời gian sống của bộ nhớ đệm tính bằng phút |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    Plugin xAI đi kèm phơi bày `code_execution` dưới dạng một công cụ OpenClaw để
    thực thi mã từ xa trong môi trường sandbox của xAI.

    Đường dẫn cấu hình: `plugins.entries.xai.config.codeExecution`

    | Khóa              | Kiểu    | Mặc định                 | Mô tả                                  |
    | ----------------- | ------- | ------------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true` (nếu có khóa)     | Bật hoặc tắt thực thi mã               |
    | `model`           | string  | `grok-4-1-fast`          | Mô hình dùng cho yêu cầu thực thi mã   |
    | `maxTurns`        | number  | -                        | Số lượt hội thoại tối đa               |
    | `timeoutSeconds`  | number  | -                        | Thời gian chờ yêu cầu tính bằng giây   |

    <Note>
    Đây là thực thi sandbox xAI từ xa, không phải [`exec`](/vi/tools/exec) cục bộ.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Giới hạn đã biết">
    - Xác thực xAI có thể dùng khóa API, biến môi trường, dự phòng cấu hình Plugin,
      hoặc OAuth với tài khoản xAI đủ điều kiện. OAuth dùng xác minh mã thiết bị
      mà không cần callback localhost. xAI quyết định tài khoản nào có thể nhận token API
      OAuth, và trang đồng ý có thể hiển thị Grok Build dù OpenClaw
      không yêu cầu ứng dụng Grok Build.
    - OpenClaw hiện chưa phơi bày họ mô hình đa tác nhân của xAI. xAI
      phục vụ các mô hình này qua Responses API, nhưng chúng không chấp nhận
      công cụ phía máy khách hoặc công cụ tùy chỉnh được vòng lặp tác nhân dùng chung của OpenClaw sử dụng. Xem
      [giới hạn đa tác nhân của xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Giọng nói xAI Realtime chưa được đăng ký làm nhà cung cấp OpenClaw. Nó
      cần một hợp đồng phiên giọng nói hai chiều khác với STT theo lô hoặc
      phiên âm phát trực tuyến.
    - `quality` hình ảnh xAI, `mask` hình ảnh, và các tỷ lệ khung hình bổ sung chỉ dành cho gốc
      chưa được phơi bày cho đến khi công cụ `image_generate` dùng chung có các
      điều khiển tương ứng giữa các nhà cung cấp.
  </Accordion>

  <Accordion title="Ghi chú nâng cao">
    - OpenClaw tự động áp dụng các bản sửa tương thích lược đồ công cụ và lệnh gọi công cụ
      dành riêng cho xAI trên đường dẫn runner dùng chung.
    - Yêu cầu xAI gốc mặc định `tool_stream: true`. Đặt
      `agents.defaults.models["xai/<model>"].params.tool_stream` thành `false` để
      tắt tính năng này.
    - Wrapper xAI đi kèm loại bỏ các cờ lược đồ công cụ nghiêm ngặt không được hỗ trợ và
      khóa payload *effort* suy luận trước khi gửi yêu cầu xAI gốc. Chỉ
      `grok-4.3` / `grok-4.3-*` quảng bá effort suy luận có thể cấu hình; tất cả
      các mô hình xAI có khả năng suy luận khác vẫn yêu cầu
      `include: ["reasoning.encrypted_content"]` để suy luận đã mã hóa trước đó
      có thể được phát lại ở các lượt tiếp theo.
    - `web_search`, `x_search`, và `code_execution` được phơi bày dưới dạng công cụ OpenClaw.
      OpenClaw bật đúng công cụ tích hợp xAI cần thiết bên trong từng yêu cầu công cụ
      thay vì gắn mọi công cụ gốc vào từng lượt chat.
    - Grok `web_search` đọc `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` đọc `plugins.entries.xai.config.xSearch.baseUrl`, rồi
      dự phòng về URL cơ sở tìm kiếm web của Grok.
    - `x_search` và `code_execution` do Plugin xAI đi kèm sở hữu
      thay vì được mã hóa cứng vào runtime mô hình lõi.
    - `code_execution` là thực thi sandbox xAI từ xa, không phải
      [`exec`](/vi/tools/exec) cục bộ.
  </Accordion>
</AccordionGroup>

## Kiểm thử trực tiếp

Các đường dẫn phương tiện xAI được bao phủ bởi kiểm thử đơn vị và các bộ kiểm thử trực tiếp bật tùy chọn. Xuất
`XAI_API_KEY` trong môi trường tiến trình trước khi chạy các probe trực tiếp.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Tệp trực tiếp dành riêng cho nhà cung cấp tổng hợp TTS thông thường, TTS PCM thân thiện với điện thoại,
phiên âm âm thanh qua xAI batch STT, phát trực tuyến cùng PCM đó qua xAI
realtime STT, tạo đầu ra văn bản thành hình ảnh, và chỉnh sửa một hình ảnh tham chiếu. Tệp trực tiếp
hình ảnh dùng chung xác minh cùng nhà cung cấp xAI qua đường dẫn lựa chọn runtime,
dự phòng, chuẩn hóa, và tệp đính kèm phương tiện của OpenClaw.

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tất cả nhà cung cấp" href="/vi/providers/index" icon="grid-2">
    Tổng quan rộng hơn về nhà cung cấp.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và cách sửa.
  </Card>
</CardGroup>

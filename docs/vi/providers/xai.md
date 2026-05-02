---
read_when:
    - Bạn muốn sử dụng các mô hình Grok trong OpenClaw
    - Bạn đang cấu hình xác thực xAI hoặc ID mô hình
summary: Sử dụng các mô hình xAI Grok trong OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T10:51:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw cung cấp Plugin nhà cung cấp `xai` đi kèm cho các mô hình Grok.

## Bắt đầu

<Steps>
  <Step title="Tạo khóa API">
    Tạo khóa API trong [bảng điều khiển xAI](https://console.x.ai/).
  </Step>
  <Step title="Đặt khóa API của bạn">
    Đặt `XAI_API_KEY`, hoặc chạy:

    ```bash
    openclaw onboard --auth-choice xai-api-key
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
OpenClaw sử dụng xAI Responses API làm phương thức truyền tải xAI đi kèm. Cùng một
`XAI_API_KEY` cũng có thể cấp nguồn cho `web_search` dựa trên Grok, `x_search`
hạng nhất, và `code_execution` từ xa.
Nếu bạn lưu khóa xAI trong `plugins.entries.xai.config.webSearch.apiKey`,
nhà cung cấp mô hình xAI đi kèm cũng sẽ dùng lại khóa đó làm phương án dự phòng.
Đặt `plugins.entries.xai.config.webSearch.baseUrl` để định tuyến `web_search`
của Grok và, theo mặc định, `x_search` qua proxy xAI Responses của nhà vận hành.
Tinh chỉnh `code_execution` nằm trong `plugins.entries.xai.config.codeExecution`.
</Note>

## Danh mục tích hợp sẵn

OpenClaw bao gồm sẵn các họ mô hình xAI này:

| Họ             | ID mô hình                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin cũng phân giải chuyển tiếp các ID `grok-4*` và `grok-code-fast*` mới hơn khi
chúng tuân theo cùng dạng API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast`, và các biến thể `grok-4.20-beta-*`
là các tham chiếu Grok hiện có khả năng xử lý hình ảnh trong danh mục đi kèm.
</Tip>

## Phạm vi hỗ trợ tính năng OpenClaw

Plugin đi kèm ánh xạ bề mặt API công khai hiện tại của xAI vào các hợp đồng
nhà cung cấp và công cụ dùng chung của OpenClaw. Các khả năng không phù hợp với
hợp đồng dùng chung (ví dụ TTS phát trực tuyến và giọng nói thời gian thực) sẽ
không được hiển thị — xem bảng bên dưới.

| Khả năng của xAI           | Bề mặt OpenClaw                          | Trạng thái                                                          |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | nhà cung cấp mô hình `xai/<model>`        | Có                                                                  |
| Tìm kiếm web phía máy chủ  | nhà cung cấp `web_search` `grok`          | Có                                                                  |
| Tìm kiếm X phía máy chủ    | công cụ `x_search`                        | Có                                                                  |
| Thực thi mã phía máy chủ   | công cụ `code_execution`                  | Có                                                                  |
| Hình ảnh                   | `image_generate`                          | Có                                                                  |
| Video                      | `video_generate`                          | Có                                                                  |
| Text-to-speech theo lô     | `messages.tts.provider: "xai"` / `tts`    | Có                                                                  |
| TTS phát trực tuyến        | —                                         | Không hiển thị; hợp đồng TTS của OpenClaw trả về bộ đệm âm thanh hoàn chỉnh |
| Speech-to-text theo lô     | `tools.media.audio` / hiểu phương tiện    | Có                                                                  |
| Speech-to-text phát trực tuyến | Voice Call `streaming.provider: "xai"` | Có                                                                  |
| Giọng nói thời gian thực   | —                                         | Chưa hiển thị; hợp đồng phiên/WebSocket khác                        |
| Tệp / lô                   | Chỉ tương thích API mô hình chung         | Không phải là công cụ OpenClaw hạng nhất                            |

<Note>
OpenClaw sử dụng các API REST hình ảnh/video/TTS/STT của xAI để tạo phương tiện,
lời nói, và phiên âm theo lô, WebSocket STT phát trực tuyến của xAI để phiên âm
cuộc gọi thoại trực tiếp, và Responses API cho các công cụ mô hình, tìm kiếm,
và thực thi mã. Các tính năng cần hợp đồng OpenClaw khác, chẳng hạn như
phiên giọng nói thời gian thực, được ghi tài liệu ở đây như các khả năng thượng nguồn
thay vì hành vi Plugin ẩn.
</Note>

### Ánh xạ chế độ nhanh

`/fast on` hoặc `agents.defaults.models["xai/<model>"].params.fastMode: true`
viết lại các yêu cầu xAI gốc như sau:

| Mô hình nguồn | Đích chế độ nhanh |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Bí danh tương thích cũ

Các bí danh cũ vẫn được chuẩn hóa về ID đi kèm chuẩn tắc:

| Bí danh cũ                | ID chuẩn tắc                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Tính năng

<AccordionGroup>
  <Accordion title="Tìm kiếm web">
    Nhà cung cấp tìm kiếm web `grok` đi kèm cũng sử dụng `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Tạo video">
    Plugin `xai` đi kèm đăng ký tạo video thông qua công cụ dùng chung
    `video_generate`.

    - Mô hình video mặc định: `xai/grok-imagine-video`
    - Chế độ: văn bản thành video, hình ảnh thành video, tạo hình ảnh tham chiếu, chỉnh sửa
      video từ xa, và mở rộng video từ xa
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Độ phân giải: `480P`, `720P`
    - Thời lượng: 1-15 giây cho tạo/hình ảnh thành video, 1-10 giây khi
      dùng vai trò `reference_image`, 2-10 giây cho mở rộng
    - Tạo hình ảnh tham chiếu: đặt `imageRoles` thành `reference_image` cho
      mọi hình ảnh được cung cấp; xAI chấp nhận tối đa 7 hình ảnh như vậy

    <Warning>
    Bộ đệm video cục bộ không được chấp nhận. Dùng URL `http(s)` từ xa cho
    đầu vào chỉnh sửa/mở rộng video. Hình ảnh thành video chấp nhận bộ đệm hình ảnh cục bộ vì
    OpenClaw có thể mã hóa chúng thành URL dữ liệu cho xAI.
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
    Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung,
    lựa chọn nhà cung cấp, và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo hình ảnh">
    Plugin `xai` đi kèm đăng ký tạo hình ảnh thông qua công cụ dùng chung
    `image_generate`.

    - Mô hình hình ảnh mặc định: `xai/grok-imagine-image`
    - Mô hình bổ sung: `xai/grok-imagine-image-pro`
    - Chế độ: văn bản thành hình ảnh và chỉnh sửa hình ảnh tham chiếu
    - Đầu vào tham chiếu: một `image` hoặc tối đa năm `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Độ phân giải: `1K`, `2K`
    - Số lượng: tối đa 4 hình ảnh

    OpenClaw yêu cầu xAI trả về phản hồi hình ảnh `b64_json` để phương tiện được tạo có thể
    được lưu trữ và phân phối qua đường dẫn tệp đính kèm kênh thông thường. Hình ảnh
    tham chiếu cục bộ được chuyển đổi thành URL dữ liệu; tham chiếu `http(s)` từ xa được
    chuyển tiếp nguyên trạng.

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
    xAI cũng ghi tài liệu `quality`, `mask`, `user`, và các tỷ lệ gốc bổ sung
    như `1:2`, `2:1`, `9:20`, và `20:9`. Hiện nay OpenClaw chỉ chuyển tiếp các
    điều khiển hình ảnh dùng chung giữa các nhà cung cấp; các núm điều chỉnh chỉ có trong bản gốc không được hỗ trợ
    chủ ý không được hiển thị qua `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Plugin `xai` đi kèm đăng ký text-to-speech thông qua bề mặt nhà cung cấp `tts`
    dùng chung.

    - Giọng: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Giọng mặc định: `eve`
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
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw sử dụng endpoint `/v1/tts` theo lô của xAI. xAI cũng cung cấp TTS phát trực tuyến
    qua WebSocket, nhưng hợp đồng nhà cung cấp lời nói của OpenClaw hiện yêu cầu
    một bộ đệm âm thanh hoàn chỉnh trước khi gửi phản hồi.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `xai` đi kèm đăng ký speech-to-text theo lô thông qua
    bề mặt phiên âm hiểu phương tiện của OpenClaw.

    - Mô hình mặc định: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi phiên âm âm thanh đầu vào sử dụng
      `tools.media.audio`, bao gồm các đoạn kênh thoại Discord và
      tệp đính kèm âm thanh của kênh

    Để buộc dùng xAI cho phiên âm âm thanh đầu vào:

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

    Có thể cung cấp ngôn ngữ thông qua cấu hình phương tiện âm thanh dùng chung hoặc theo từng lệnh gọi
    yêu cầu phiên âm. Gợi ý prompt được bề mặt OpenClaw dùng chung chấp nhận,
    nhưng tích hợp xAI REST STT chỉ chuyển tiếp tệp, mô hình, và
    ngôn ngữ vì chúng ánh xạ rõ ràng tới endpoint xAI công khai hiện tại.

  </Accordion>

  <Accordion title="Speech-to-text phát trực tuyến">
    Plugin `xai` đi kèm cũng đăng ký nhà cung cấp phiên âm thời gian thực
    cho âm thanh cuộc gọi thoại trực tiếp.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Mã hóa mặc định: `mulaw`
    - Tần số lấy mẫu mặc định: `8000`
    - Phát hiện điểm kết thúc mặc định: `800ms`
    - Bản ghi tạm thời: được bật theo mặc định

    Luồng phương tiện Twilio của Voice Call gửi các khung âm thanh G.711 µ-law, vì vậy
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

    Cấu hình do provider sở hữu nằm trong
    `plugins.entries.voice-call.config.streaming.providers.xai`. Các khóa được hỗ trợ
    là `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, hoặc
    `alaw`), `interimResults`, `endpointingMs`, và `language`.

    <Note>
    Streaming provider này dành cho đường dẫn phiên âm theo thời gian thực của Voice Call.
    Thoại trên Discord hiện ghi lại các đoạn ngắn và dùng đường dẫn phiên âm theo lô
    `tools.media.audio` thay thế.
    </Note>

  </Accordion>

  <Accordion title="Cấu hình x_search">
    Plugin xAI đi kèm cung cấp `x_search` dưới dạng công cụ OpenClaw để tìm kiếm
    nội dung X (trước đây là Twitter) thông qua Grok.

    Đường dẫn cấu hình: `plugins.entries.xai.config.xSearch`

    | Khóa               | Kiểu    | Mặc định           | Mô tả                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Bật hoặc tắt x_search                |
    | `model`            | string  | `grok-4-1-fast`    | Model dùng cho các yêu cầu x_search  |
    | `baseUrl`          | string  | —                  | Ghi đè URL cơ sở của xAI Responses   |
    | `inlineCitations`  | boolean | —                  | Bao gồm trích dẫn nội tuyến trong kết quả |
    | `maxTurns`         | number  | —                  | Số lượt hội thoại tối đa             |
    | `timeoutSeconds`   | number  | —                  | Thời gian chờ yêu cầu tính bằng giây |
    | `cacheTtlMinutes`  | number  | —                  | Thời gian sống của bộ nhớ đệm tính bằng phút |

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
    Plugin xAI đi kèm cung cấp `code_execution` dưới dạng công cụ OpenClaw để
    thực thi mã từ xa trong môi trường sandbox của xAI.

    Đường dẫn cấu hình: `plugins.entries.xai.config.codeExecution`

    | Khóa              | Kiểu    | Mặc định                 | Mô tả                                   |
    | ----------------- | ------- | ------------------------ | --------------------------------------- |
    | `enabled`         | boolean | `true` (nếu có khóa)     | Bật hoặc tắt thực thi mã                |
    | `model`           | string  | `grok-4-1-fast`          | Model dùng cho các yêu cầu thực thi mã  |
    | `maxTurns`        | number  | —                        | Số lượt hội thoại tối đa                |
    | `timeoutSeconds`  | number  | —                        | Thời gian chờ yêu cầu tính bằng giây    |

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
    - Xác thực hiện chỉ dùng khóa API. Chưa có luồng xAI OAuth hoặc device-code trong
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` không được hỗ trợ trên
      đường dẫn provider xAI thông thường vì nó yêu cầu bề mặt API upstream khác
      với transport xAI chuẩn của OpenClaw.
    - Thoại xAI Realtime chưa được đăng ký làm OpenClaw provider. Nó
      cần một hợp đồng phiên thoại hai chiều khác với STT theo lô hoặc
      phiên âm streaming.
    - `quality` của ảnh xAI, `mask` của ảnh, và các tỷ lệ khung hình bổ sung chỉ có trên native
      chưa được cung cấp cho đến khi công cụ `image_generate` dùng chung có các
      điều khiển đa provider tương ứng.
  </Accordion>

  <Accordion title="Ghi chú nâng cao">
    - OpenClaw tự động áp dụng các bản sửa tương thích riêng cho xAI về tool-schema và tool-call
      trên đường dẫn runner dùng chung.
    - Các yêu cầu xAI native mặc định là `tool_stream: true`. Đặt
      `agents.defaults.models["xai/<model>"].params.tool_stream` thành `false` để
      tắt nó.
    - Wrapper xAI đi kèm loại bỏ các cờ strict tool-schema không được hỗ trợ và
      các khóa payload reasoning trước khi gửi yêu cầu xAI native.
    - `web_search`, `x_search`, và `code_execution` được cung cấp dưới dạng công cụ OpenClaw.
      OpenClaw bật built-in xAI cụ thể mà nó cần trong mỗi yêu cầu công cụ
      thay vì gắn tất cả công cụ native vào mọi lượt chat.
    - Grok `web_search` đọc `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` đọc `plugins.entries.xai.config.xSearch.baseUrl`, sau đó
      quay về URL cơ sở Grok web-search.
    - `x_search` và `code_execution` thuộc sở hữu của Plugin xAI đi kèm thay vì
      được mã hóa cứng vào runtime model lõi.
    - `code_execution` là thực thi sandbox xAI từ xa, không phải
      [`exec`](/vi/tools/exec) cục bộ.
  </Accordion>
</AccordionGroup>

## Kiểm thử trực tiếp

Các đường dẫn media xAI được bao phủ bởi kiểm thử đơn vị và bộ kiểm thử trực tiếp chọn tham gia. Các
lệnh trực tiếp tải secret từ login shell của bạn, bao gồm `~/.profile`, trước khi
thăm dò `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Tệp trực tiếp dành riêng cho provider tổng hợp TTS thông thường, TTS PCM thân thiện với điện thoại,
phiên âm âm thanh qua STT theo lô của xAI, stream cùng PCM đó qua STT realtime của xAI,
tạo đầu ra text-to-image, và chỉnh sửa một ảnh tham chiếu. Tệp trực tiếp hình ảnh dùng chung
xác minh cùng provider xAI thông qua đường dẫn chọn runtime, fallback, chuẩn hóa,
và đính kèm media của OpenClaw.

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu model, và hành vi failover.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tất cả provider" href="/vi/providers/index" icon="grid-2">
    Tổng quan provider rộng hơn.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề phổ biến và cách khắc phục.
  </Card>
</CardGroup>

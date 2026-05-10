---
read_when:
    - Bạn muốn sử dụng các mô hình Grok trong OpenClaw
    - Bạn đang cấu hình xác thực xAI hoặc mã định danh mô hình
summary: Sử dụng các mô hình xAI Grok trong OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-10T19:49:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: f11c31e7ff39e7e13465b48d819db3921a32ed624676a57dc38f97c0dbd21e46
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw cung cấp kèm một Plugin nhà cung cấp `xai` cho các mô hình Grok.

## Bắt đầu

<Steps>
  <Step title="Tạo API key">
    Tạo API key trong [bảng điều khiển xAI](https://console.x.ai/).
  </Step>
  <Step title="Thiết lập API key của bạn">
    Thiết lập `XAI_API_KEY`, hoặc chạy:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Chọn một mô hình">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw dùng xAI Responses API làm transport xAI tích hợp. Cùng API key từ `openclaw onboard --auth-choice xai-api-key` cũng có thể cấp nguồn cho `x_search` hạng nhất và `code_execution` từ xa; `XAI_API_KEY` hoặc cấu hình tìm kiếm web của Plugin cũng có thể cấp nguồn cho `web_search` dựa trên Grok.
Nếu bạn lưu một khóa xAI dưới `plugins.entries.xai.config.webSearch.apiKey`,
nhà cung cấp mô hình xAI tích hợp cũng dùng lại khóa đó làm phương án dự phòng.
Thiết lập `plugins.entries.xai.config.webSearch.baseUrl` để định tuyến Grok `web_search`
và, theo mặc định, `x_search` qua proxy xAI Responses của operator.
Tinh chỉnh `code_execution` nằm dưới `plugins.entries.xai.config.codeExecution`.
</Note>

## Danh mục tích hợp

OpenClaw bao gồm sẵn các họ mô hình xAI sau:

| Họ             | ID mô hình                                                                |
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
là các ref Grok hiện tại có hỗ trợ hình ảnh trong danh mục tích hợp.
</Tip>

## Phạm vi hỗ trợ tính năng của OpenClaw

Plugin tích hợp ánh xạ bề mặt API công khai hiện tại của xAI vào các hợp đồng
nhà cung cấp và công cụ dùng chung của OpenClaw. Các năng lực không khớp với hợp đồng dùng chung
(ví dụ TTS phát trực tuyến và giọng nói thời gian thực) không được hiển thị - xem bảng
bên dưới.

| Năng lực xAI               | Bề mặt OpenClaw                           | Trạng thái                                                           |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Trò chuyện / Responses     | Nhà cung cấp mô hình `xai/<model>`        | Có                                                                  |
| Tìm kiếm web phía máy chủ  | Nhà cung cấp `web_search` `grok`          | Có                                                                  |
| Tìm kiếm X phía máy chủ    | Công cụ `x_search`                        | Có                                                                  |
| Thực thi mã phía máy chủ   | Công cụ `code_execution`                  | Có                                                                  |
| Hình ảnh                   | `image_generate`                          | Có                                                                  |
| Video                      | `video_generate`                          | Có                                                                  |
| Text-to-speech theo lô     | `messages.tts.provider: "xai"` / `tts`    | Có                                                                  |
| TTS phát trực tuyến        | -                                         | Không được hiển thị; hợp đồng TTS của OpenClaw trả về bộ đệm âm thanh hoàn chỉnh |
| Speech-to-text theo lô     | `tools.media.audio` / hiểu phương tiện    | Có                                                                  |
| Speech-to-text phát trực tuyến | Voice Call `streaming.provider: "xai"` | Có                                                                  |
| Giọng nói thời gian thực   | -                                         | Chưa được hiển thị; hợp đồng phiên/WebSocket khác                   |
| Tệp / lô                   | Chỉ tương thích API mô hình chung         | Không phải công cụ OpenClaw hạng nhất                               |

<Note>
OpenClaw dùng các API REST hình ảnh/video/TTS/STT của xAI để tạo phương tiện,
giọng nói và phiên âm theo lô, WebSocket STT phát trực tuyến của xAI cho phiên âm
cuộc gọi thoại trực tiếp, và Responses API cho mô hình, tìm kiếm, và
công cụ thực thi mã. Các tính năng cần hợp đồng OpenClaw khác, chẳng hạn như
phiên giọng nói thời gian thực, được ghi lại ở đây như năng lực upstream thay vì
hành vi Plugin ẩn.
</Note>

### Ánh xạ chế độ nhanh

`/fast on` hoặc `agents.defaults.models["xai/<model>"].params.fastMode: true`
ghi lại các yêu cầu xAI gốc như sau:

| Mô hình nguồn | Đích chế độ nhanh |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Bí danh tương thích kế thừa

Các bí danh kế thừa vẫn được chuẩn hóa về ID tích hợp chuẩn:

| Bí danh kế thừa            | ID chuẩn                               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Tính năng

<AccordionGroup>
  <Accordion title="Tìm kiếm web">
    Nhà cung cấp tìm kiếm web `grok` tích hợp có thể dùng `XAI_API_KEY` hoặc khóa
    tìm kiếm web của Plugin:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Tạo video">
    Plugin `xai` tích hợp đăng ký tạo video thông qua công cụ dùng chung
    `video_generate`.

    - Mô hình video mặc định: `xai/grok-imagine-video`
    - Chế độ: text-to-video, image-to-video, tạo reference-image, chỉnh sửa video từ xa, và mở rộng video từ xa
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Độ phân giải: `480P`, `720P`
    - Thời lượng: 1-15 giây cho tạo/video từ hình ảnh, 1-10 giây khi dùng vai trò `reference_image`, 2-10 giây cho mở rộng
    - Tạo reference-image: đặt `imageRoles` thành `reference_image` cho
      mọi hình ảnh được cung cấp; xAI chấp nhận tối đa 7 hình ảnh như vậy

    <Warning>
    Không chấp nhận bộ đệm video cục bộ. Hãy dùng URL `http(s)` từ xa cho
    đầu vào chỉnh sửa/mở rộng video. Image-to-video chấp nhận bộ đệm hình ảnh cục bộ vì
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
    Xem [Tạo video](/vi/tools/video-generation) để biết tham số công cụ dùng chung,
    lựa chọn nhà cung cấp, và hành vi failover.
    </Note>

  </Accordion>

  <Accordion title="Tạo hình ảnh">
    Plugin `xai` tích hợp đăng ký tạo hình ảnh thông qua công cụ dùng chung
    `image_generate`.

    - Mô hình hình ảnh mặc định: `xai/grok-imagine-image`
    - Mô hình bổ sung: `xai/grok-imagine-image-pro`
    - Chế độ: text-to-image và chỉnh sửa reference-image
    - Đầu vào tham chiếu: một `image` hoặc tối đa năm `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Độ phân giải: `1K`, `2K`
    - Số lượng: tối đa 4 hình ảnh

    OpenClaw yêu cầu xAI trả về phản hồi hình ảnh `b64_json` để phương tiện được tạo có thể được
    lưu trữ và gửi qua đường dẫn tệp đính kèm kênh thông thường. Hình ảnh tham chiếu
    cục bộ được chuyển đổi thành URL dữ liệu; tham chiếu `http(s)` từ xa được
    truyền nguyên trạng.

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
    xAI cũng ghi lại `quality`, `mask`, `user`, và các tỷ lệ gốc bổ sung
    như `1:2`, `2:1`, `9:20`, và `20:9`. Hiện tại OpenClaw chỉ chuyển tiếp
    các điều khiển hình ảnh dùng chung đa nhà cung cấp; các núm chỉnh chỉ-gốc không được hỗ trợ
    cố ý không được hiển thị qua `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Plugin `xai` tích hợp đăng ký text-to-speech thông qua bề mặt nhà cung cấp `tts`
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
    OpenClaw dùng endpoint `/v1/tts` theo lô của xAI. xAI cũng cung cấp TTS phát trực tuyến
    qua WebSocket, nhưng hợp đồng nhà cung cấp giọng nói của OpenClaw hiện yêu cầu
    một bộ đệm âm thanh hoàn chỉnh trước khi gửi phản hồi.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `xai` tích hợp đăng ký speech-to-text theo lô thông qua bề mặt phiên âm
    hiểu phương tiện của OpenClaw.

    - Mô hình mặc định: `grok-stt`
    - Endpoint: REST xAI `/v1/stt`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi phiên âm âm thanh đến dùng
      `tools.media.audio`, bao gồm các đoạn kênh thoại Discord và
      tệp đính kèm âm thanh của kênh

    Để buộc dùng xAI cho phiên âm âm thanh đến:

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

    Ngôn ngữ có thể được cung cấp qua cấu hình phương tiện âm thanh dùng chung hoặc yêu cầu
    phiên âm theo từng lệnh gọi. Gợi ý prompt được bề mặt OpenClaw dùng chung
    chấp nhận, nhưng tích hợp REST STT của xAI chỉ chuyển tiếp tệp, mô hình, và
    ngôn ngữ vì các trường đó ánh xạ rõ ràng tới endpoint xAI công khai hiện tại.

  </Accordion>

  <Accordion title="Speech-to-text phát trực tuyến">
    Plugin `xai` tích hợp cũng đăng ký một nhà cung cấp phiên âm thời gian thực
    cho âm thanh cuộc gọi thoại trực tiếp.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Mã hóa mặc định: `mulaw`
    - Tần số lấy mẫu mặc định: `8000`
    - Endpointing mặc định: `800ms`
    - Bản chép lời tạm thời: được bật theo mặc định

    Luồng phương tiện Twilio của Voice Call gửi các khung âm thanh G.711 µ-law, vì vậy
    nhà cung cấp xAI có thể chuyển tiếp các khung đó trực tiếp mà không cần chuyển mã:

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

    Cấu hình do provider sở hữu nằm dưới
    `plugins.entries.voice-call.config.streaming.providers.xai`. Các khóa được hỗ trợ
    là `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, hoặc
    `alaw`), `interimResults`, `endpointingMs`, và `language`.

    <Note>
    Provider truyền phát này dành cho đường dẫn phiên âm thời gian thực của Voice Call.
    Giọng nói Discord hiện ghi các đoạn ngắn và thay vào đó dùng đường dẫn phiên âm
    theo lô `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Cấu hình x_search">
    Plugin xAI được đóng gói sẵn cung cấp `x_search` làm công cụ OpenClaw để tìm kiếm
    nội dung X (trước đây là Twitter) thông qua Grok.

    Đường dẫn cấu hình: `plugins.entries.xai.config.xSearch`

    | Khóa               | Kiểu    | Mặc định          | Mô tả                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Bật hoặc tắt x_search                |
    | `model`            | string  | `grok-4-1-fast`    | Model dùng cho các yêu cầu x_search  |
    | `baseUrl`          | string  | -                  | Ghi đè URL cơ sở xAI Responses       |
    | `inlineCitations`  | boolean | -                  | Bao gồm trích dẫn nội tuyến trong kết quả |
    | `maxTurns`         | number  | -                  | Số lượt hội thoại tối đa             |
    | `timeoutSeconds`   | number  | -                  | Thời gian chờ yêu cầu tính bằng giây |
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
    Plugin xAI được đóng gói sẵn cung cấp `code_execution` làm công cụ OpenClaw để
    thực thi mã từ xa trong môi trường sandbox của xAI.

    Đường dẫn cấu hình: `plugins.entries.xai.config.codeExecution`

    | Khóa              | Kiểu    | Mặc định          | Mô tả                                  |
    | ----------------- | ------- | ------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true` (nếu có khóa) | Bật hoặc tắt thực thi mã             |
    | `model`           | string  | `grok-4-1-fast`    | Model dùng cho các yêu cầu thực thi mã |
    | `maxTurns`        | number  | -                  | Số lượt hội thoại tối đa               |
    | `timeoutSeconds`  | number  | -                  | Thời gian chờ yêu cầu tính bằng giây   |

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
    - Hiện nay xác thực chỉ dùng khóa API. Khóa API có thể được lưu trong hồ sơ
      xác thực xAI, biến môi trường, hoặc cấu hình plugin; OpenClaw chưa có
      luồng OAuth hoặc device-code của xAI.
    - `grok-4.20-multi-agent-experimental-beta-0304` không được hỗ trợ trên đường dẫn
      provider xAI thông thường vì nó yêu cầu bề mặt API upstream khác với
      transport xAI tiêu chuẩn của OpenClaw.
    - Giọng nói xAI Realtime chưa được đăng ký làm provider OpenClaw. Nó
      cần một hợp đồng phiên giọng nói hai chiều khác với STT theo lô hoặc
      phiên âm truyền phát.
    - `quality` của ảnh xAI, `mask` của ảnh, và các tỷ lệ khung hình bổ sung
      chỉ dành riêng cho native chưa được cung cấp cho đến khi công cụ
      `image_generate` dùng chung có các điều khiển tương ứng trên nhiều provider.
  </Accordion>

  <Accordion title="Ghi chú nâng cao">
    - OpenClaw tự động áp dụng các bản sửa tương thích riêng cho xAI về schema công cụ
      và lệnh gọi công cụ trên đường dẫn runner dùng chung.
    - Các yêu cầu xAI native mặc định là `tool_stream: true`. Đặt
      `agents.defaults.models["xai/<model>"].params.tool_stream` thành `false` để
      tắt tùy chọn này.
    - Wrapper xAI được đóng gói sẵn loại bỏ các cờ schema công cụ strict không được hỗ trợ và
      các khóa payload reasoning trước khi gửi yêu cầu xAI native.
    - `web_search`, `x_search`, và `code_execution` được cung cấp dưới dạng công cụ OpenClaw.
      OpenClaw bật đúng built-in xAI cụ thể cần thiết bên trong từng yêu cầu công cụ
      thay vì gắn tất cả công cụ native vào mọi lượt chat.
    - Grok `web_search` đọc `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` đọc `plugins.entries.xai.config.xSearch.baseUrl`, rồi
      fallback về URL cơ sở tìm kiếm web của Grok.
    - `x_search` và `code_execution` thuộc sở hữu của Plugin xAI được đóng gói sẵn
      thay vì được mã hóa cứng vào runtime model lõi.
    - `code_execution` là thực thi sandbox xAI từ xa, không phải
      [`exec`](/vi/tools/exec) cục bộ.
  </Accordion>
</AccordionGroup>

## Kiểm thử trực tiếp

Các đường dẫn media xAI được bao phủ bởi kiểm thử đơn vị và các bộ kiểm thử trực tiếp bật theo lựa chọn. Các lệnh trực tiếp
tải bí mật từ shell đăng nhập của bạn, bao gồm `~/.profile`, trước khi
thăm dò `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Tệp trực tiếp riêng cho provider tổng hợp TTS thông thường, TTS PCM thân thiện với điện thoại,
phiên âm âm thanh qua STT theo lô của xAI, truyền phát cùng PCM đó qua STT
thời gian thực của xAI, tạo đầu ra văn bản thành ảnh, và chỉnh sửa một ảnh tham chiếu. Tệp
trực tiếp ảnh dùng chung xác minh cùng provider xAI thông qua đường dẫn
chọn runtime, fallback, chuẩn hóa, và đính kèm media của OpenClaw.

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu model, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tất cả provider" href="/vi/providers/index" icon="grid-2">
    Tổng quan rộng hơn về provider.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và cách khắc phục.
  </Card>
</CardGroup>

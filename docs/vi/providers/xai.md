---
read_when:
    - Bạn muốn sử dụng các mô hình Grok trong OpenClaw
    - Bạn đang cấu hình xác thực xAI hoặc ID mô hình
summary: Sử dụng các mô hình xAI Grok trong OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-29T23:10:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw đi kèm một provider plugin `xai` được tích hợp sẵn cho các mô hình Grok.

## Bắt đầu

<Steps>
  <Step title="Tạo khóa API">
    Tạo một khóa API trong [console xAI](https://console.x.ai/).
  </Step>
  <Step title="Đặt khóa API của bạn">
    Đặt `XAI_API_KEY`, hoặc chạy:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Chọn một mô hình">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw sử dụng API Responses của xAI làm cơ chế truyền tải xAI tích hợp sẵn. Cùng một
`XAI_API_KEY` cũng có thể cấp nguồn cho `web_search` dựa trên Grok, `x_search`
hạng nhất, và `code_execution` từ xa.
Nếu bạn lưu một khóa xAI dưới `plugins.entries.xai.config.webSearch.apiKey`,
provider mô hình xAI tích hợp sẵn cũng sẽ dùng lại khóa đó làm phương án dự phòng.
Tinh chỉnh `code_execution` nằm dưới `plugins.entries.xai.config.codeExecution`.
</Note>

## Danh mục tích hợp sẵn

OpenClaw bao gồm sẵn các họ mô hình xAI này:

| Họ             | ID mô hình                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin này cũng chuyển tiếp và phân giải các id `grok-4*` và `grok-code-fast*` mới hơn khi
chúng tuân theo cùng dạng API.

<Tip>
`grok-4-fast`, `grok-4-1-fast`, và các biến thể `grok-4.20-beta-*` là những ref
Grok hiện hỗ trợ hình ảnh trong danh mục tích hợp sẵn.
</Tip>

## Phạm vi hỗ trợ tính năng của OpenClaw

Plugin tích hợp sẵn ánh xạ bề mặt API công khai hiện tại của xAI vào các hợp đồng
provider và công cụ dùng chung của OpenClaw. Những khả năng không phù hợp với hợp đồng dùng chung
(ví dụ TTS phát trực tuyến và giọng nói thời gian thực) không được hiển thị — xem bảng
bên dưới.

| Khả năng của xAI              | Bề mặt OpenClaw                          | Trạng thái                                                         |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Chat / Responses              | provider mô hình `xai/<model>`            | Có                                                                 |
| Tìm kiếm web phía máy chủ     | provider `web_search` `grok`              | Có                                                                 |
| Tìm kiếm X phía máy chủ       | công cụ `x_search`                        | Có                                                                 |
| Thực thi mã phía máy chủ      | công cụ `code_execution`                  | Có                                                                 |
| Hình ảnh                      | `image_generate`                          | Có                                                                 |
| Video                         | `video_generate`                          | Có                                                                 |
| Chuyển văn bản thành giọng nói theo lô | `messages.tts.provider: "xai"` / `tts` | Có                                                          |
| TTS phát trực tuyến           | —                                         | Không được hiển thị; hợp đồng TTS của OpenClaw trả về bộ đệm âm thanh hoàn chỉnh |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu media     | Có                                                                 |
| Chuyển giọng nói thành văn bản phát trực tuyến | Voice Call `streaming.provider: "xai"` | Có                                                        |
| Giọng nói thời gian thực      | —                                         | Chưa được hiển thị; hợp đồng phiên/WebSocket khác                  |
| Tệp / lô                      | Chỉ tương thích API mô hình chung         | Không phải công cụ OpenClaw hạng nhất                              |

<Note>
OpenClaw sử dụng các API REST hình ảnh/video/TTS/STT của xAI cho tạo media,
giọng nói, và phiên âm theo lô, WebSocket STT phát trực tuyến của xAI cho phiên âm
cuộc gọi thoại trực tiếp, và API Responses cho mô hình, tìm kiếm, và
các công cụ thực thi mã. Các tính năng cần hợp đồng OpenClaw khác, chẳng hạn như
phiên giọng nói thời gian thực, được tài liệu hóa ở đây dưới dạng khả năng thượng nguồn
thay vì hành vi plugin ẩn.
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

Các bí danh cũ vẫn được chuẩn hóa về các id tích hợp sẵn chuẩn:

| Bí danh cũ                | Id chuẩn                              |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Tính năng

<AccordionGroup>
  <Accordion title="Tìm kiếm web">
    Provider tìm kiếm web `grok` tích hợp sẵn cũng dùng `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Tạo video">
    Plugin `xai` tích hợp sẵn đăng ký tạo video thông qua công cụ dùng chung
    `video_generate`.

    - Mô hình video mặc định: `xai/grok-imagine-video`
    - Chế độ: văn bản thành video, hình ảnh thành video, tạo bằng hình ảnh tham chiếu, chỉnh sửa
      video từ xa, và mở rộng video từ xa
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Độ phân giải: `480P`, `720P`
    - Thời lượng: 1-15 giây cho tạo/hình ảnh thành video, 1-10 giây khi
      dùng vai trò `reference_image`, 2-10 giây cho mở rộng
    - Tạo bằng hình ảnh tham chiếu: đặt `imageRoles` thành `reference_image` cho
      mọi hình ảnh được cung cấp; xAI chấp nhận tối đa 7 hình ảnh như vậy

    <Warning>
    Bộ đệm video cục bộ không được chấp nhận. Dùng URL `http(s)` từ xa cho
    đầu vào chỉnh sửa/mở rộng video. Hình ảnh thành video chấp nhận bộ đệm hình ảnh cục bộ vì
    OpenClaw có thể mã hóa chúng thành data URL cho xAI.
    </Warning>

    Để dùng xAI làm provider video mặc định:

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
    lựa chọn provider, và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo hình ảnh">
    Plugin `xai` tích hợp sẵn đăng ký tạo hình ảnh thông qua công cụ dùng chung
    `image_generate`.

    - Mô hình hình ảnh mặc định: `xai/grok-imagine-image`
    - Mô hình bổ sung: `xai/grok-imagine-image-pro`
    - Chế độ: văn bản thành hình ảnh và chỉnh sửa bằng hình ảnh tham chiếu
    - Đầu vào tham chiếu: một `image` hoặc tối đa năm `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Độ phân giải: `1K`, `2K`
    - Số lượng: tối đa 4 hình ảnh

    OpenClaw yêu cầu xAI trả về phản hồi hình ảnh `b64_json` để media được tạo có thể được
    lưu trữ và gửi qua đường dẫn tệp đính kèm kênh thông thường. Hình ảnh tham chiếu
    cục bộ được chuyển đổi thành data URL; tham chiếu `http(s)` từ xa được
    truyền nguyên trạng.

    Để dùng xAI làm provider hình ảnh mặc định:

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
    xAI cũng tài liệu hóa `quality`, `mask`, `user`, và các tỷ lệ gốc bổ sung
    như `1:2`, `2:1`, `9:20`, và `20:9`. OpenClaw hiện chỉ chuyển tiếp các
    điều khiển hình ảnh dùng chung giữa các provider; những núm chỉnh chỉ có ở bản gốc
    không được hỗ trợ sẽ cố ý không được hiển thị qua `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Chuyển văn bản thành giọng nói">
    Plugin `xai` tích hợp sẵn đăng ký chuyển văn bản thành giọng nói thông qua bề mặt provider `tts`
    dùng chung.

    - Giọng: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Giọng mặc định: `eve`
    - Định dạng: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Ngôn ngữ: mã BCP-47 hoặc `auto`
    - Tốc độ: ghi đè tốc độ gốc của provider
    - Định dạng ghi chú thoại Opus gốc không được hỗ trợ

    Để dùng xAI làm provider TTS mặc định:

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
    qua WebSocket, nhưng hợp đồng provider giọng nói của OpenClaw hiện yêu cầu
    một bộ đệm âm thanh hoàn chỉnh trước khi gửi trả lời.
    </Note>

  </Accordion>

  <Accordion title="Chuyển giọng nói thành văn bản">
    Plugin `xai` tích hợp sẵn đăng ký chuyển giọng nói thành văn bản theo lô thông qua bề mặt
    phiên âm hiểu media của OpenClaw.

    - Mô hình mặc định: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi phiên âm âm thanh đến sử dụng
      `tools.media.audio`, bao gồm các đoạn kênh thoại Discord và
      tệp đính kèm âm thanh kênh

    Để bắt buộc dùng xAI cho phiên âm âm thanh đến:

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

    Ngôn ngữ có thể được cung cấp thông qua cấu hình media âm thanh dùng chung hoặc theo từng
    yêu cầu phiên âm. Gợi ý prompt được bề mặt OpenClaw dùng chung chấp nhận,
    nhưng tích hợp xAI REST STT chỉ chuyển tiếp tệp, mô hình, và
    ngôn ngữ vì chúng ánh xạ rõ ràng tới endpoint công khai hiện tại của xAI.

  </Accordion>

  <Accordion title="Chuyển giọng nói thành văn bản phát trực tuyến">
    Plugin `xai` tích hợp sẵn cũng đăng ký một provider phiên âm thời gian thực
    cho âm thanh cuộc gọi thoại trực tiếp.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Mã hóa mặc định: `mulaw`
    - Tần số lấy mẫu mặc định: `8000`
    - Phát hiện điểm kết thúc mặc định: `800ms`
    - Bản phiên âm tạm thời: bật theo mặc định

    Luồng media Twilio của Voice Call gửi các khung âm thanh G.711 µ-law, nên
    provider xAI có thể chuyển tiếp trực tiếp các khung đó mà không cần chuyển mã:

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

    Cấu hình thuộc sở hữu provider nằm dưới
    `plugins.entries.voice-call.config.streaming.providers.xai`. Các khóa được hỗ trợ
    là `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, hoặc
    `alaw`), `interimResults`, `endpointingMs`, và `language`.

    <Note>
    Nhà cung cấp streaming này dành cho đường dẫn phiên âm thời gian thực của Cuộc gọi thoại.
    Âm thanh Discord hiện ghi các phân đoạn ngắn và thay vào đó dùng đường dẫn phiên âm theo lô
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Cấu hình x_search">
    Plugin xAI đi kèm cung cấp `x_search` làm công cụ OpenClaw để tìm kiếm
    nội dung X (trước đây là Twitter) thông qua Grok.

    Đường dẫn cấu hình: `plugins.entries.xai.config.xSearch`

    | Khóa               | Kiểu    | Mặc định           | Mô tả                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Bật hoặc tắt x_search                |
    | `model`            | string  | `grok-4-1-fast`    | Model dùng cho các yêu cầu x_search  |
    | `inlineCitations`  | boolean | —                  | Bao gồm trích dẫn nội tuyến trong kết quả |
    | `maxTurns`         | number  | —                  | Số lượt hội thoại tối đa             |
    | `timeoutSeconds`   | number  | —                  | Thời gian chờ yêu cầu tính bằng giây |
    | `cacheTtlMinutes`  | number  | —                  | Thời gian tồn tại của bộ nhớ đệm tính bằng phút |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    Plugin xAI đi kèm cung cấp `code_execution` làm công cụ OpenClaw để
    thực thi mã từ xa trong môi trường sandbox của xAI.

    Đường dẫn cấu hình: `plugins.entries.xai.config.codeExecution`

    | Khóa              | Kiểu    | Mặc định           | Mô tả                                  |
    | ----------------- | ------- | ------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true` (nếu có khóa) | Bật hoặc tắt thực thi mã             |
    | `model`           | string  | `grok-4-1-fast`    | Model dùng cho các yêu cầu thực thi mã |
    | `maxTurns`        | number  | —                  | Số lượt hội thoại tối đa               |
    | `timeoutSeconds`  | number  | —                  | Thời gian chờ yêu cầu tính bằng giây   |

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
    - Hiện nay xác thực chỉ dùng khóa API. Chưa có luồng OAuth hoặc mã thiết bị xAI trong
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` không được hỗ trợ trên
      đường dẫn nhà cung cấp xAI thông thường vì nó yêu cầu một bề mặt API thượng nguồn
      khác với transport xAI tiêu chuẩn của OpenClaw.
    - Giọng nói thời gian thực của xAI chưa được đăng ký làm nhà cung cấp OpenClaw.
      Nó cần một hợp đồng phiên thoại hai chiều khác với STT theo lô hoặc
      phiên âm streaming.
    - `quality` của ảnh xAI, `mask` của ảnh và các tỷ lệ khung hình bổ sung chỉ dành cho native
      chưa được cung cấp cho đến khi công cụ `image_generate` dùng chung có các
      điều khiển đa nhà cung cấp tương ứng.
  </Accordion>

  <Accordion title="Ghi chú nâng cao">
    - OpenClaw tự động áp dụng các bản sửa tương thích lược đồ công cụ và lệnh gọi công cụ
      riêng cho xAI trên đường dẫn runner dùng chung.
    - Các yêu cầu xAI native mặc định `tool_stream: true`. Đặt
      `agents.defaults.models["xai/<model>"].params.tool_stream` thành `false` để
      tắt nó.
    - Wrapper xAI đi kèm loại bỏ các cờ lược đồ công cụ nghiêm ngặt không được hỗ trợ và
      khóa payload reasoning trước khi gửi yêu cầu xAI native.
    - `web_search`, `x_search` và `code_execution` được cung cấp làm công cụ OpenClaw.
      OpenClaw bật built-in xAI cụ thể cần dùng bên trong từng yêu cầu công cụ
      thay vì gắn tất cả công cụ native vào mọi lượt chat.
    - `x_search` và `code_execution` thuộc sở hữu của Plugin xAI đi kèm thay vì
      được hardcode vào runtime model lõi.
    - `code_execution` là thực thi sandbox xAI từ xa, không phải
      [`exec`](/vi/tools/exec) cục bộ.
  </Accordion>
</AccordionGroup>

## Kiểm thử live

Các đường dẫn media xAI được bao phủ bởi kiểm thử đơn vị và các bộ kiểm thử live tùy chọn. Các lệnh live
tải secret từ shell đăng nhập của bạn, bao gồm `~/.profile`, trước khi
kiểm tra `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Tệp live dành riêng cho nhà cung cấp tổng hợp TTS thông thường, TTS PCM
thân thiện với điện thoại, phiên âm âm thanh qua STT theo lô của xAI, stream cùng PCM đó qua STT
thời gian thực của xAI, tạo đầu ra text-to-image và chỉnh sửa ảnh tham chiếu. Tệp live
ảnh dùng chung xác minh cùng nhà cung cấp xAI thông qua đường dẫn
chọn runtime, fallback, chuẩn hóa và đính kèm media của OpenClaw.

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu model và hành vi failover.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tất cả nhà cung cấp" href="/vi/providers/index" icon="grid-2">
    Tổng quan rộng hơn về nhà cung cấp.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và cách khắc phục.
  </Card>
</CardGroup>

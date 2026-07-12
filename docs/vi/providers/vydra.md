---
read_when:
    - Bạn muốn tạo nội dung đa phương tiện bằng Vydra trong OpenClaw
    - Bạn cần hướng dẫn thiết lập khóa API Vydra
summary: Sử dụng hình ảnh, video và giọng nói Vydra trong OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T08:20:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra đi kèm bổ sung:

- Tạo hình ảnh qua `vydra/grok-imagine`
- Tạo video qua `vydra/veo3` (văn bản thành video) và `vydra/kling` (hình ảnh thành video)
- Tổng hợp giọng nói qua tuyến TTS của Vydra sử dụng ElevenLabs

OpenClaw sử dụng cùng một `VYDRA_API_KEY` cho cả ba khả năng.

| Thuộc tính             | Giá trị                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| ID nhà cung cấp        | `vydra`                                                                   |
| Plugin                 | đi kèm, `enabledByDefault: true`                                          |
| Biến môi trường xác thực | `VYDRA_API_KEY`                                                         |
| Cờ thiết lập ban đầu   | `--auth-choice vydra-api-key`                                             |
| Cờ CLI trực tiếp       | `--vydra-api-key <key>`                                                   |
| Hợp đồng               | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL cơ sở              | `https://www.vydra.ai/api/v1` (sử dụng máy chủ `www`)                     |

<Warning>
Sử dụng `https://www.vydra.ai/api/v1` làm URL cơ sở. Máy chủ miền gốc của Vydra (`https://vydra.ai/api/v1`) hiện chuyển hướng đến `www`. Một số trình khách HTTP loại bỏ `Authorization` khi chuyển hướng giữa các máy chủ, khiến khóa API hợp lệ bị báo lỗi xác thực gây hiểu nhầm. Plugin đi kèm chuẩn hóa mọi URL cơ sở `vydra.ai` đã cấu hình thành `www.vydra.ai` để tránh sự cố này.
</Warning>

## Thiết lập

<Steps>
  <Step title="Chạy quy trình thiết lập ban đầu tương tác">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Hoặc đặt trực tiếp biến môi trường:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Chọn một khả năng mặc định">
    Chọn một hoặc nhiều khả năng bên dưới (hình ảnh, video hoặc giọng nói) và áp dụng cấu hình tương ứng.
  </Step>
</Steps>

## Khả năng

<AccordionGroup>
  <Accordion title="Tạo hình ảnh">
    Mô hình hình ảnh mặc định và duy nhất đi kèm:

    - `vydra/grok-imagine`

    Đặt mô hình này làm nhà cung cấp hình ảnh mặc định:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    Hỗ trợ đi kèm chỉ chuyển văn bản thành hình ảnh, tối đa một hình ảnh cho mỗi yêu cầu. Các tuyến chỉnh sửa được Vydra lưu trữ yêu cầu URL hình ảnh từ xa và Plugin đi kèm không bổ sung cầu nối tải lên dành riêng cho Vydra.

    <Note>
    Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo video">
    Các mô hình video đã đăng ký:

    - `vydra/veo3` để chuyển văn bản thành video (từ chối đầu vào tham chiếu hình ảnh)
    - `vydra/kling` để chuyển hình ảnh thành video (yêu cầu chính xác một URL hình ảnh từ xa)

    Đặt Vydra làm nhà cung cấp video mặc định:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Lưu ý:

    - `vydra/kling` từ chối ngay từ đầu việc tải tệp cục bộ lên; chỉ tham chiếu URL hình ảnh từ xa mới hoạt động.
    - Tuyến HTTP `kling` của Vydra chưa nhất quán về việc yêu cầu `image_url` hay `video_url`; nhà cung cấp đi kèm gửi cùng một URL hình ảnh từ xa trong cả hai trường.
    - Plugin đi kèm duy trì cách tiếp cận thận trọng và không chuyển tiếp các tùy chọn kiểu chưa được lập tài liệu như tỷ lệ khung hình, độ phân giải, hình mờ hoặc âm thanh được tạo.

    <Note>
    Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Kiểm thử trực tiếp video">
    Phạm vi kiểm thử trực tiếp dành riêng cho nhà cung cấp:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Tệp kiểm thử trực tiếp Vydra đi kèm bao quát:

    - `vydra/veo3` chuyển văn bản thành video
    - `vydra/kling` chuyển hình ảnh thành video bằng URL hình ảnh từ xa

    Ghi đè dữ liệu mẫu hình ảnh từ xa khi cần:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Tổng hợp giọng nói">
    Đặt Vydra làm nhà cung cấp giọng nói:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Giá trị mặc định:

    - Mô hình: `elevenlabs/tts`
    - ID giọng nói: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    Plugin đi kèm cung cấp một giọng nói mặc định đã được xác nhận hoạt động tốt này và trả về các tệp âm thanh MP3.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Danh mục nhà cung cấp" href="/vi/providers/index" icon="list">
    Duyệt qua tất cả nhà cung cấp hiện có.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và cách chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và cách chọn nhà cung cấp.
  </Card>
  <Card title="Tài liệu tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Giá trị mặc định của tác tử và cấu hình mô hình.
  </Card>
</CardGroup>

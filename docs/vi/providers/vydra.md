---
read_when:
    - Bạn muốn tạo nội dung đa phương tiện bằng Vydra trong OpenClaw
    - Bạn cần hướng dẫn thiết lập khóa API Vydra
summary: Sử dụng hình ảnh, video và giọng nói của Vydra trong OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-29T23:10:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra được đóng gói kèm thêm:

- Tạo hình ảnh qua `vydra/grok-imagine`
- Tạo video qua `vydra/veo3` và `vydra/kling`
- Tổng hợp giọng nói qua tuyến TTS của Vydra được hỗ trợ bởi ElevenLabs

OpenClaw dùng cùng một `VYDRA_API_KEY` cho cả ba khả năng.

<Warning>
Dùng `https://www.vydra.ai/api/v1` làm URL cơ sở.

Máy chủ apex của Vydra (`https://vydra.ai/api/v1`) hiện chuyển hướng đến `www`. Một số HTTP client bỏ `Authorization` trong lần chuyển hướng chéo máy chủ đó, khiến một khóa API hợp lệ trở thành lỗi xác thực gây hiểu nhầm. Plugin được đóng gói kèm dùng trực tiếp URL cơ sở `www` để tránh điều đó.
</Warning>

## Thiết lập

<Steps>
  <Step title="Chạy onboarding tương tác">
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
    Mô hình hình ảnh mặc định:

    - `vydra/grok-imagine`

    Đặt nó làm nhà cung cấp hình ảnh mặc định:

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

    Hỗ trợ được đóng gói kèm hiện tại chỉ là văn bản sang hình ảnh. Các tuyến chỉnh sửa được lưu trữ của Vydra yêu cầu URL hình ảnh từ xa, và OpenClaw chưa thêm cầu nối tải lên riêng cho Vydra trong Plugin được đóng gói kèm.

    <Note>
    Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo video">
    Các mô hình video đã đăng ký:

    - `vydra/veo3` cho văn bản sang video
    - `vydra/kling` cho hình ảnh sang video

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

    Ghi chú:

    - `vydra/veo3` được đóng gói kèm chỉ dưới dạng văn bản sang video.
    - `vydra/kling` hiện yêu cầu một tham chiếu URL hình ảnh từ xa. Các lượt tải lên tệp cục bộ bị từ chối ngay từ đầu.
    - Tuyến HTTP `kling` hiện tại của Vydra chưa nhất quán về việc nó yêu cầu `image_url` hay `video_url`; nhà cung cấp được đóng gói kèm ánh xạ cùng một URL hình ảnh từ xa vào cả hai trường.
    - Plugin được đóng gói kèm giữ cách tiếp cận thận trọng và không chuyển tiếp các nút chỉnh kiểu chưa được tài liệu hóa như tỷ lệ khung hình, độ phân giải, watermark hoặc âm thanh được tạo.

    <Note>
    Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Kiểm thử trực tiếp video">
    Phạm vi kiểm thử trực tiếp riêng cho nhà cung cấp:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Tệp kiểm thử trực tiếp Vydra được đóng gói kèm hiện bao gồm:

    - `vydra/veo3` văn bản sang video
    - `vydra/kling` hình ảnh sang video sử dụng một URL hình ảnh từ xa

    Ghi đè fixture hình ảnh từ xa khi cần:

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

    Mặc định:

    - Mô hình: `elevenlabs/tts`
    - ID giọng nói: `21m00Tcm4TlvDq8ikWAM`

    Plugin được đóng gói kèm hiện hiển thị một giọng nói mặc định đã biết là hoạt động tốt và trả về các tệp âm thanh MP3.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Thư mục nhà cung cấp" href="/vi/providers/index" icon="list">
    Duyệt tất cả nhà cung cấp hiện có.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Mặc định của agent và cấu hình mô hình.
  </Card>
</CardGroup>

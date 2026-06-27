---
read_when:
    - Bạn muốn tạo nội dung đa phương tiện bằng Vydra trong OpenClaw
    - Bạn cần hướng dẫn thiết lập khóa API Vydra
summary: Sử dụng hình ảnh, video và giọng nói Vydra trong OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:06:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra được đóng gói kèm bổ sung:

- Tạo hình ảnh qua `vydra/grok-imagine`
- Tạo video qua `vydra/veo3` và `vydra/kling`
- Tổng hợp giọng nói qua tuyến TTS dùng ElevenLabs của Vydra

OpenClaw dùng cùng một `VYDRA_API_KEY` cho cả ba năng lực.

| Thuộc tính                  | Giá trị                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| ID nhà cung cấp             | `vydra`                                                                   |
| Plugin                      | được đóng gói kèm, `enabledByDefault: true`                               |
| Biến môi trường xác thực    | `VYDRA_API_KEY`                                                           |
| Cờ thiết lập ban đầu        | `--auth-choice vydra-api-key`                                             |
| Cờ CLI trực tiếp            | `--vydra-api-key <key>`                                                   |
| Hợp đồng                    | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL cơ sở                   | `https://www.vydra.ai/api/v1` (dùng máy chủ `www`)                        |

<Warning>
  Dùng `https://www.vydra.ai/api/v1` làm URL cơ sở. Máy chủ apex của Vydra (`https://vydra.ai/api/v1`) hiện chuyển hướng đến `www`. Một số HTTP client bỏ `Authorization` trên chuyển hướng khác máy chủ đó, khiến một khóa API hợp lệ trở thành lỗi xác thực gây hiểu nhầm. Plugin được đóng gói kèm dùng trực tiếp URL cơ sở `www` để tránh điều đó.
</Warning>

## Thiết lập

<Steps>
  <Step title="Chạy thiết lập ban đầu tương tác">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Hoặc đặt biến môi trường trực tiếp:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Chọn một năng lực mặc định">
    Chọn một hoặc nhiều năng lực bên dưới (hình ảnh, video hoặc giọng nói) và áp dụng cấu hình tương ứng.
  </Step>
</Steps>

## Năng lực

<AccordionGroup>
  <Accordion title="Tạo hình ảnh">
    Mô hình hình ảnh mặc định:

    - `vydra/grok-imagine`

    Đặt làm nhà cung cấp hình ảnh mặc định:

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

    Hỗ trợ được đóng gói kèm hiện chỉ là text-to-image. Các tuyến chỉnh sửa được Vydra lưu trữ yêu cầu URL hình ảnh từ xa, và OpenClaw chưa thêm cầu nối tải lên riêng cho Vydra trong Plugin được đóng gói kèm.

    <Note>
    Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
    </Note>

  </Accordion>

  <Accordion title="Tạo video">
    Các mô hình video đã đăng ký:

    - `vydra/veo3` cho text-to-video
    - `vydra/kling` cho image-to-video

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

    - `vydra/veo3` được đóng gói kèm chỉ dưới dạng text-to-video.
    - `vydra/kling` hiện yêu cầu một tham chiếu URL hình ảnh từ xa. Tải lên tệp cục bộ bị từ chối ngay từ đầu.
    - Tuyến HTTP `kling` hiện tại của Vydra không nhất quán về việc yêu cầu `image_url` hay `video_url`; nhà cung cấp được đóng gói kèm ánh xạ cùng URL hình ảnh từ xa vào cả hai trường.
    - Plugin được đóng gói kèm giữ cách tiếp cận thận trọng và không chuyển tiếp các núm điều chỉnh kiểu chưa được tài liệu hóa như tỷ lệ khung hình, độ phân giải, watermark hoặc âm thanh được tạo.

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

    Tệp trực tiếp Vydra được đóng gói kèm hiện bao phủ:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video dùng một URL hình ảnh từ xa

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
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Mặc định:

    - Mô hình: `elevenlabs/tts`
    - ID giọng nói: `21m00Tcm4TlvDq8ikWAM`

    Plugin được đóng gói kèm hiện phơi bày một giọng nói mặc định đã biết là hoạt động tốt và trả về các tệp âm thanh MP3.

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
    Giá trị mặc định của agent và cấu hình mô hình.
  </Card>
</CardGroup>

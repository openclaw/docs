---
read_when:
    - Bạn muốn tổng hợp giọng nói Inworld cho các phản hồi gửi đi
    - Bạn cần đầu ra thoại PCM cho điện thoại hoặc ghi chú thoại OGG_OPUS từ Inworld
summary: Chuyển văn bản thành giọng nói dạng phát trực tuyến của Inworld cho các phản hồi của OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-29T23:07:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 16
---

Inworld là nhà cung cấp chuyển văn bản thành giọng nói (TTS) dạng phát trực tuyến. Trong OpenClaw, nhà cung cấp này tổng hợp âm thanh phản hồi gửi đi (mặc định là MP3, OGG_OPUS cho ghi chú thoại) và âm thanh PCM cho các kênh điện thoại như Voice Call.

OpenClaw gửi yêu cầu đến endpoint TTS phát trực tuyến của Inworld, nối các đoạn âm thanh base64 được trả về thành một bộ đệm duy nhất, rồi chuyển kết quả vào pipeline âm thanh phản hồi tiêu chuẩn.

| Chi tiết        | Giá trị                                                     |
| ------------- | ----------------------------------------------------------- |
| Trang web       | [inworld.ai](https://inworld.ai)                            |
| Tài liệu          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Xác thực          | `INWORLD_API_KEY` (HTTP Basic, thông tin xác thực Base64 từ dashboard) |
| Giọng mặc định | `Sarah`                                                     |
| Mô hình mặc định | `inworld-tts-1.5-max`                                       |

## Bắt đầu

<Steps>
  <Step title="Thiết lập API key của bạn">
    Sao chép thông tin xác thực từ dashboard Inworld của bạn (Workspace > API Keys)
    và đặt làm biến môi trường. Giá trị này được gửi nguyên văn dưới dạng thông tin
    xác thực HTTP Basic, vì vậy không mã hóa Base64 lại hoặc chuyển đổi thành bearer
    token.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Chọn Inworld trong messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Gửi tin nhắn">
    Gửi phản hồi qua bất kỳ kênh nào đã kết nối. OpenClaw tổng hợp âm thanh bằng
    Inworld và phân phối dưới dạng MP3 (hoặc OGG_OPUS khi kênh yêu cầu ghi chú thoại).
  </Step>
</Steps>

## Tùy chọn cấu hình

| Tùy chọn        | Đường dẫn                                         | Mô tả                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Thông tin xác thực Base64 từ dashboard. Dùng dự phòng `INWORLD_API_KEY`.     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Ghi đè URL cơ sở của API Inworld (mặc định `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Mã định danh giọng nói (mặc định `Sarah`).                               |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID mô hình TTS (mặc định `inworld-tts-1.5-max`).                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | Nhiệt độ lấy mẫu `0..2` (tùy chọn).                           |

## Ghi chú

<AccordionGroup>
  <Accordion title="Xác thực">
    Inworld dùng xác thực HTTP Basic với một chuỗi thông tin xác thực được mã hóa
    Base64 duy nhất. Sao chép nguyên văn từ dashboard Inworld. Nhà cung cấp gửi
    chuỗi đó dưới dạng `Authorization: Basic <apiKey>` mà không mã hóa thêm, vì vậy
    không tự mã hóa Base64 và không truyền token kiểu bearer.
    Xem [ghi chú xác thực TTS](/vi/tools/tts#inworld-primary) để biết cùng lưu ý này.
  </Accordion>
  <Accordion title="Mô hình">
    Các ID mô hình được hỗ trợ: `inworld-tts-1.5-max` (mặc định),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Đầu ra âm thanh">
    Phản hồi mặc định dùng MP3. Khi mục tiêu kênh là `voice-note`,
    OpenClaw yêu cầu Inworld dùng `OGG_OPUS` để âm thanh phát như bong bóng thoại
    gốc. Tổng hợp cho điện thoại dùng `PCM` thô ở 22050 Hz để cấp cho cầu nối
    điện thoại.
  </Accordion>
  <Accordion title="Endpoint tùy chỉnh">
    Ghi đè host API bằng `messages.tts.providers.inworld.baseUrl`.
    Dấu gạch chéo ở cuối sẽ được loại bỏ trước khi gửi yêu cầu.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="waveform-lines">
    Tổng quan TTS, nhà cung cấp và cấu hình `messages.tts`.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ, bao gồm cài đặt `messages.tts`.
  </Card>
  <Card title="Nhà cung cấp" href="/vi/providers" icon="grid">
    Tất cả nhà cung cấp OpenClaw được đóng gói sẵn.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và các bước gỡ lỗi.
  </Card>
</CardGroup>

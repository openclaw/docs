---
read_when:
    - Bạn muốn sử dụng tính năng tổng hợp giọng nói của Inworld cho các phản hồi gửi đi
    - Bạn cần đầu ra âm thanh thoại PCM hoặc ghi chú thoại OGG_OPUS từ Inworld
summary: Chuyển văn bản thành giọng nói trực tuyến bằng Inworld cho các phản hồi của OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T08:20:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld là nhà cung cấp chuyển văn bản thành giọng nói (TTS) dạng phát trực tuyến. Trong OpenClaw, Inworld tổng hợp âm thanh cho câu trả lời gửi đi (MP3 theo mặc định, OGG_OPUS cho tin nhắn thoại) và âm thanh PCM thô cho các kênh điện thoại như Voice Call.

OpenClaw gửi yêu cầu đến điểm cuối TTS phát trực tuyến của Inworld, nối các đoạn âm thanh base64 được trả về thành một bộ đệm duy nhất rồi chuyển kết quả cho quy trình xử lý âm thanh trả lời tiêu chuẩn.

| Thuộc tính          | Giá trị                                                               |
| ------------------- | --------------------------------------------------------------------- |
| Mã nhà cung cấp     | `inworld`                                                             |
| Plugin              | gói bên ngoài chính thức (`@openclaw/inworld-speech`)                 |
| Hợp đồng            | `speechProviders` (chỉ TTS)                                           |
| Biến môi trường xác thực | `INWORLD_API_KEY` (HTTP Basic, thông tin xác thực Base64 từ bảng điều khiển) |
| URL cơ sở           | `https://api.inworld.ai`                                              |
| Giọng nói mặc định  | `Sarah`                                                               |
| Mô hình mặc định    | `inworld-tts-1.5-max`                                                 |
| Đầu ra              | MP3 (mặc định), OGG_OPUS (tin nhắn thoại), PCM 22050 Hz (điện thoại) |
| Trang web           | [inworld.ai](https://inworld.ai)                                      |
| Tài liệu            | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)            |

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Thiết lập khóa API">
    Sao chép thông tin xác thực từ bảng điều khiển Inworld (Workspace > API Keys) và đặt làm biến môi trường. Giá trị được gửi nguyên trạng dưới dạng thông tin xác thực HTTP Basic, vì vậy không mã hóa lại bằng Base64 hoặc chuyển đổi thành mã thông báo bearer.

    ```bash
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
    Gửi câu trả lời qua bất kỳ kênh nào đã kết nối. OpenClaw tổng hợp âm thanh bằng Inworld và gửi dưới dạng MP3 (hoặc OGG_OPUS khi kênh yêu cầu tin nhắn thoại).
  </Step>
</Steps>

## Tùy chọn cấu hình

| Tùy chọn      | Đường dẫn                                    | Mô tả                                                                  |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Thông tin xác thực Base64 từ bảng điều khiển. Dự phòng bằng `INWORLD_API_KEY`. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Ghi đè URL cơ sở của API Inworld (mặc định `https://api.inworld.ai`).  |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Mã định danh giọng nói (mặc định `Sarah`). Bí danh cũ: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Mã mô hình TTS (mặc định `inworld-tts-1.5-max`).                       |
| `temperature` | `messages.tts.providers.inworld.temperature` | Nhiệt độ lấy mẫu, từ `0` (không bao gồm) đến `2` (tùy chọn).          |

## Ghi chú

<AccordionGroup>
  <Accordion title="Xác thực">
    Inworld sử dụng xác thực HTTP Basic với một chuỗi thông tin xác thực duy nhất được mã hóa Base64. Sao chép nguyên trạng chuỗi này từ bảng điều khiển Inworld. Nhà cung cấp gửi chuỗi dưới dạng `Authorization: Basic <apiKey>` mà không mã hóa thêm, vì vậy không tự mã hóa lại bằng Base64 và không truyền mã thông báo kiểu bearer. Xem [ghi chú xác thực TTS](/vi/tools/tts#inworld-primary) để biết cảnh báo tương tự.
  </Accordion>
  <Accordion title="Mô hình">
    Các mã mô hình được hỗ trợ: `inworld-tts-1.5-max` (mặc định), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Đầu ra âm thanh">
    Câu trả lời sử dụng MP3 theo mặc định. Khi đích của kênh là `voice-note`, OpenClaw yêu cầu Inworld cung cấp `OGG_OPUS` để âm thanh phát dưới dạng bong bóng thoại gốc. Việc tổng hợp cho điện thoại sử dụng `PCM` thô ở tần số 22050 Hz để cấp dữ liệu cho cầu nối điện thoại.
  </Accordion>
  <Accordion title="Điểm cuối tùy chỉnh">
    Ghi đè máy chủ API bằng `messages.tts.providers.inworld.baseUrl`. Dấu gạch chéo ở cuối sẽ bị loại bỏ trước khi gửi yêu cầu.
  </Accordion>
</AccordionGroup>

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="waveform-lines">
    Tổng quan về TTS, các nhà cung cấp và cấu hình `messages.tts`.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham khảo cấu hình đầy đủ, bao gồm các thiết lập `messages.tts`.
  </Card>
  <Card title="Nhà cung cấp" href="/vi/providers" icon="grid">
    Tất cả các nhà cung cấp được OpenClaw hỗ trợ.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và các bước gỡ lỗi.
  </Card>
</CardGroup>

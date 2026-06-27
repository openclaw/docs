---
read_when:
    - Bạn muốn tính năng tổng hợp giọng nói của Inworld cho các câu trả lời gửi đi
    - Bạn cần đầu ra ghi chú thoại ở định dạng PCM telephony hoặc OGG_OPUS từ Inworld
summary: Chuyển văn bản thành giọng nói dạng phát trực tuyến của Inworld cho các phản hồi OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:04:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld là nhà cung cấp chuyển văn bản thành giọng nói (TTS) phát trực tuyến. Trong OpenClaw, nó
tổng hợp âm thanh phản hồi gửi đi (mặc định là MP3, OGG_OPUS cho ghi chú thoại)
và âm thanh PCM cho các kênh điện thoại như Cuộc gọi thoại.

OpenClaw gửi yêu cầu đến endpoint TTS phát trực tuyến của Inworld, nối các
đoạn âm thanh base64 được trả về thành một bộ đệm duy nhất, rồi chuyển kết quả
vào pipeline âm thanh phản hồi tiêu chuẩn.

| Thuộc tính       | Giá trị                                                         |
| --------------- | --------------------------------------------------------------- |
| ID nhà cung cấp | `inworld`                                                       |
| Plugin          | gói bên ngoài chính thức                                        |
| Hợp đồng        | `speechProviders` (chỉ TTS)                                     |
| Biến env xác thực | `INWORLD_API_KEY` (HTTP Basic, thông tin xác thực dashboard Base64) |
| URL cơ sở       | `https://api.inworld.ai`                                        |
| Giọng mặc định  | `Sarah`                                                         |
| Mô hình mặc định | `inworld-tts-1.5-max`                                           |
| Đầu ra          | MP3 (mặc định), OGG_OPUS (ghi chú thoại), PCM 22050 Hz (điện thoại) |
| Website         | [inworld.ai](https://inworld.ai)                                |
| Tài liệu        | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Cài đặt plugin

Cài đặt plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Set your API key">
    Sao chép thông tin xác thực từ dashboard Inworld của bạn (Workspace > API Keys)
    và đặt nó làm biến env. Giá trị được gửi nguyên văn dưới dạng thông tin xác thực
    HTTP Basic, vì vậy đừng mã hóa Base64 lại hoặc chuyển nó thành bearer
    token.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Gửi một phản hồi qua bất kỳ kênh nào đã kết nối. OpenClaw tổng hợp
    âm thanh bằng Inworld và phân phối dưới dạng MP3 (hoặc OGG_OPUS khi kênh
    mong đợi một ghi chú thoại).
  </Step>
</Steps>

## Tùy chọn cấu hình

| Tùy chọn         | Đường dẫn                                      | Mô tả                                                             |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Thông tin xác thực dashboard Base64. Dự phòng sang `INWORLD_API_KEY`. |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Ghi đè URL cơ sở API Inworld (mặc định `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Mã định danh giọng nói (mặc định `Sarah`).                        |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | ID mô hình TTS (mặc định `inworld-tts-1.5-max`).                  |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Nhiệt độ lấy mẫu `0..2` (tùy chọn).                               |

## Ghi chú

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld dùng xác thực HTTP Basic với một chuỗi thông tin xác thực
    được mã hóa Base64 duy nhất. Sao chép nguyên văn từ dashboard Inworld.
    Nhà cung cấp gửi nó dưới dạng `Authorization: Basic <apiKey>` mà không
    mã hóa thêm, vì vậy đừng tự mã hóa Base64 và đừng truyền token kiểu bearer.
    Xem [ghi chú xác thực TTS](/vi/tools/tts#inworld-primary) để biết lưu ý tương tự.
  </Accordion>
  <Accordion title="Models">
    Các ID mô hình được hỗ trợ: `inworld-tts-1.5-max` (mặc định),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio outputs">
    Phản hồi mặc định dùng MP3. Khi mục tiêu kênh là `voice-note`,
    OpenClaw yêu cầu Inworld dùng `OGG_OPUS` để âm thanh phát như một
    bong bóng thoại gốc. Tổng hợp cho điện thoại dùng `PCM` thô ở 22050 Hz
    để cấp cho cầu nối điện thoại.
  </Accordion>
  <Accordion title="Custom endpoints">
    Ghi đè host API bằng `messages.tts.providers.inworld.baseUrl`.
    Dấu gạch chéo ở cuối sẽ bị loại bỏ trước khi gửi yêu cầu.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/vi/tools/tts" icon="waveform-lines">
    Tổng quan về TTS, nhà cung cấp và cấu hình `messages.tts`.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration" icon="gear">
    Tham chiếu cấu hình đầy đủ, bao gồm các thiết lập `messages.tts`.
  </Card>
  <Card title="Providers" href="/vi/providers" icon="grid">
    Tất cả nhà cung cấp OpenClaw được hỗ trợ.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và bước gỡ lỗi.
  </Card>
</CardGroup>

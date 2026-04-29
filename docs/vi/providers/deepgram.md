---
read_when:
    - Bạn muốn dùng tính năng chuyển giọng nói thành văn bản của Deepgram cho các tệp đính kèm âm thanh
    - Bạn muốn sử dụng tính năng chuyển lời nói thành văn bản theo thời gian thực của Deepgram cho cuộc gọi thoại
    - Bạn cần một ví dụ cấu hình Deepgram nhanh gọn
summary: Phiên âm bằng Deepgram cho tin nhắn thoại đến
title: Deepgram
x-i18n:
    generated_at: "2026-04-29T23:05:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram là một API chuyển giọng nói thành văn bản. Trong OpenClaw, nó được dùng để phiên âm âm thanh/ghi chú thoại gửi đến thông qua `tools.media.audio` và cho STT phát trực tuyến của Voice Call thông qua `plugins.entries.voice-call.config.streaming`.

Đối với phiên âm theo lô, OpenClaw tải toàn bộ tệp âm thanh lên Deepgram và chèn bản phiên âm vào quy trình trả lời (`{{Transcript}}` + khối `[Audio]`). Đối với phát trực tuyến Voice Call, OpenClaw chuyển tiếp các khung G.711 u-law trực tiếp qua endpoint WebSocket `listen` của Deepgram và phát ra bản phiên âm một phần hoặc cuối cùng khi Deepgram trả về.

| Chi tiết      | Giá trị                                                    |
| ------------- | ---------------------------------------------------------- |
| Trang web     | [deepgram.com](https://deepgram.com)                       |
| Tài liệu      | [developers.deepgram.com](https://developers.deepgram.com) |
| Xác thực      | `DEEPGRAM_API_KEY`                                         |
| Mô hình mặc định | `nova-3`                                                |

## Bắt đầu

<Steps>
  <Step title="Set your API key">
    Thêm khóa API Deepgram của bạn vào môi trường:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Enable the audio provider">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a voice note">
    Gửi một tin nhắn âm thanh qua bất kỳ kênh nào đã kết nối. OpenClaw phiên âm tin nhắn đó qua Deepgram và chèn bản phiên âm vào quy trình trả lời.
  </Step>
</Steps>

## Tùy chọn cấu hình

| Tùy chọn         | Đường dẫn                                                   | Mô tả                                      |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------ |
| `model`          | `tools.media.audio.models[].model`                           | ID mô hình Deepgram (mặc định: `nova-3`)   |
| `language`       | `tools.media.audio.models[].language`                        | Gợi ý ngôn ngữ (tùy chọn)                  |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Bật phát hiện ngôn ngữ (tùy chọn)          |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`       | Bật dấu câu (tùy chọn)                     |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`    | Bật định dạng thông minh (tùy chọn)        |

<Tabs>
  <Tab title="With language hint">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="With Deepgram options">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT phát trực tuyến Voice Call

Plugin `deepgram` đi kèm cũng đăng ký một nhà cung cấp phiên âm thời gian thực cho Plugin Voice Call.

| Thiết lập       | Đường dẫn cấu hình                                                   | Mặc định                         |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| Khóa API        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Dự phòng về `DEEPGRAM_API_KEY`   |
| Mô hình         | `...deepgram.model`                                                     | `nova-3`                         |
| Ngôn ngữ        | `...deepgram.language`                                                  | (chưa đặt)                       |
| Mã hóa          | `...deepgram.encoding`                                                  | `mulaw`                          |
| Tốc độ mẫu      | `...deepgram.sampleRate`                                                | `8000`                           |
| Ngắt cuối đoạn  | `...deepgram.endpointingMs`                                             | `800`                            |
| Kết quả tạm thời | `...deepgram.interimResults`                                           | `true`                           |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call nhận âm thanh điện thoại dưới dạng G.711 u-law 8 kHz. Nhà cung cấp phát trực tuyến Deepgram mặc định dùng `encoding: "mulaw"` và `sampleRate: 8000`, vì vậy có thể chuyển tiếp trực tiếp các khung phương tiện Twilio.
</Note>

## Ghi chú

<AccordionGroup>
  <Accordion title="Authentication">
    Xác thực tuân theo thứ tự xác thực nhà cung cấp tiêu chuẩn. `DEEPGRAM_API_KEY` là cách đơn giản nhất.
  </Accordion>
  <Accordion title="Proxy and custom endpoints">
    Ghi đè endpoint hoặc header bằng `tools.media.audio.baseUrl` và `tools.media.audio.headers` khi dùng proxy.
  </Accordion>
  <Accordion title="Output behavior">
    Đầu ra tuân theo cùng các quy tắc âm thanh như những nhà cung cấp khác (giới hạn kích thước, thời gian chờ, chèn bản phiên âm).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Media tools" href="/vi/tools/media-overview" icon="photo-film">
    Tổng quan về quy trình xử lý âm thanh, hình ảnh và video.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration" icon="gear">
    Tham chiếu cấu hình đầy đủ, bao gồm các thiết lập công cụ phương tiện.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và bước gỡ lỗi.
  </Card>
  <Card title="FAQ" href="/vi/help/faq" icon="circle-question">
    Các câu hỏi thường gặp về thiết lập OpenClaw.
  </Card>
</CardGroup>

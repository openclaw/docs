---
read_when:
    - Bạn muốn sử dụng tính năng chuyển giọng nói thành văn bản của Deepgram cho các tệp âm thanh đính kèm
    - Bạn muốn sử dụng tính năng phiên âm trực tuyến của Deepgram cho Cuộc gọi thoại
    - Bạn cần một ví dụ cấu hình Deepgram nhanh chóng
summary: Phiên âm bằng Deepgram cho tin nhắn thoại đến
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T15:44:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram là một API chuyển giọng nói thành văn bản. OpenClaw sử dụng API này để phiên âm âm thanh/ghi chú thoại đầu vào thông qua `tools.media.audio` và để truyền trực tiếp STT cho Cuộc gọi thoại thông qua `plugins.entries.voice-call.config.streaming`.

Phiên âm hàng loạt tải toàn bộ tệp âm thanh lên Deepgram và đưa bản phiên âm vào quy trình phản hồi (khối `{{Transcript}}` + `[Audio]`).
Tính năng truyền trực tiếp Cuộc gọi thoại chuyển tiếp các khung G.711 u-law theo thời gian thực qua điểm cuối WebSocket `listen` của Deepgram và phát ra các bản phiên âm từng phần/hoàn chỉnh khi Deepgram trả về.

| Chi tiết      | Giá trị                                                    |
| ------------- | ---------------------------------------------------------- |
| Trang web     | [deepgram.com](https://deepgram.com)                       |
| Tài liệu      | [developers.deepgram.com](https://developers.deepgram.com) |
| Xác thực      | `DEEPGRAM_API_KEY`                                         |
| Mô hình mặc định | `nova-3`                                      |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Bật nhà cung cấp âm thanh">
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
  <Step title="Gửi ghi chú thoại">
    Gửi một tin nhắn âm thanh qua bất kỳ kênh nào đã kết nối. OpenClaw phiên âm
    qua Deepgram và đưa bản phiên âm vào quy trình phản hồi.
  </Step>
</Steps>

## Tùy chọn cấu hình

| Tùy chọn  | Đường dẫn                            | Mô tả                                  |
| ---------- | ------------------------------------- | -------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID mô hình Deepgram (mặc định: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Gợi ý ngôn ngữ (không bắt buộc)        |

`providerOptions.deepgram` hợp nhất trực tiếp các tham số truy vấn bổ sung vào yêu cầu
Deepgram `/listen`, vì vậy có thể sử dụng mọi tên tham số được Deepgram hỗ trợ
(ví dụ: `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="Có gợi ý ngôn ngữ">
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
  <Tab title="Có tùy chọn Deepgram">
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

## STT truyền trực tiếp cho Cuộc gọi thoại

Plugin `deepgram` đi kèm cũng đăng ký một nhà cung cấp phiên âm theo thời gian thực
cho Plugin Cuộc gọi thoại.

| Cài đặt        | Đường dẫn cấu hình                                                      | Mặc định                                     |
| -------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| Khóa API       | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Dùng `DEEPGRAM_API_KEY` làm phương án dự phòng |
| URL cơ sở      | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` hoặc API công khai của Deepgram |
| Mô hình        | `...deepgram.model`                                                     | `nova-3`                            |
| Ngôn ngữ       | `...deepgram.language`                                                  | (chưa đặt)                                   |
| Mã hóa         | `...deepgram.encoding`                                                  | `mulaw`                            |
| Tần số lấy mẫu | `...deepgram.sampleRate`                                                | `8000`                            |
| Phân đoạn điểm cuối | `...deepgram.endpointingMs`                                        | `800`                            |
| Kết quả tạm thời | `...deepgram.interimResults`                                          | `true`                            |

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

Đối với [điểm cuối tùy chỉnh của Deepgram](https://developers.deepgram.com/reference/custom-endpoints),
hãy đặt `baseUrl` thành gốc điểm cuối, bao gồm mọi đường dẫn cơ sở nhưng không bao gồm `/listen`.
Các điểm cuối theo thời gian thực chấp nhận `http://`, `https://`, `ws://` và `wss://`. HTTP
được ánh xạ sang WS, HTTPS được ánh xạ sang WSS, còn các lược đồ WebSocket được chỉ định rõ ràng sẽ không thay đổi.
URL không hợp lệ và các lược đồ khác sẽ gây lỗi trong quá trình thiết lập phiên.

<Note>
Cuộc gọi thoại nhận âm thanh điện thoại dưới dạng G.711 u-law 8 kHz. Nhà cung cấp
truyền trực tiếp Deepgram mặc định sử dụng `encoding: "mulaw"` và `sampleRate: 8000`, vì vậy
có thể chuyển tiếp trực tiếp các khung phương tiện Twilio.
</Note>

## Ghi chú

<AccordionGroup>
  <Accordion title="Xác thực">
    Quá trình xác thực tuân theo thứ tự xác thực nhà cung cấp tiêu chuẩn. `DEEPGRAM_API_KEY` là
    cách đơn giản nhất.
  </Accordion>
  <Accordion title="Proxy và điểm cuối tùy chỉnh">
    Ghi đè các điểm cuối hoặc tiêu đề bằng `tools.media.audio.baseUrl` và
    `tools.media.audio.headers` khi sử dụng proxy.
  </Accordion>
  <Accordion title="Hành vi đầu ra">
    Đầu ra tuân theo các quy tắc âm thanh giống như các nhà cung cấp khác (giới hạn kích thước, thời gian chờ,
    đưa bản phiên âm vào quy trình).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ phương tiện" href="/vi/tools/media-overview" icon="photo-film">
    Tổng quan về quy trình xử lý âm thanh, hình ảnh và video.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham khảo cấu hình đầy đủ, bao gồm các cài đặt công cụ phương tiện.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và các bước gỡ lỗi.
  </Card>
  <Card title="Câu hỏi thường gặp" href="/vi/help/faq" icon="circle-question">
    Các câu hỏi thường gặp về việc thiết lập OpenClaw.
  </Card>
</CardGroup>

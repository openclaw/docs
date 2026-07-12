---
read_when:
    - Bạn muốn sử dụng tính năng chuyển giọng nói thành văn bản của Deepgram cho các tệp âm thanh đính kèm
    - Bạn muốn sử dụng tính năng chuyển lời nói thành văn bản trực tuyến của Deepgram cho Cuộc gọi thoại
    - Bạn cần một ví dụ cấu hình Deepgram nhanh gọn
summary: Chuyển lời bằng Deepgram cho tin nhắn thoại đến
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T08:15:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram là một API chuyển giọng nói thành văn bản. OpenClaw sử dụng API này để phiên âm âm thanh/ghi chú thoại đầu vào thông qua `tools.media.audio` và để phát trực tuyến STT cho Cuộc gọi thoại thông qua `plugins.entries.voice-call.config.streaming`.

Tính năng phiên âm hàng loạt tải toàn bộ tệp âm thanh lên Deepgram và chèn bản phiên âm vào quy trình phản hồi (khối `{{Transcript}}` + `[Audio]`). Tính năng phát trực tuyến Cuộc gọi thoại chuyển tiếp các khung G.711 u-law trực tiếp qua điểm cuối WebSocket `listen` của Deepgram và phát ra các bản phiên âm từng phần/hoàn chỉnh khi Deepgram trả về.

| Chi tiết         | Giá trị                                                    |
| ---------------- | ---------------------------------------------------------- |
| Trang web        | [deepgram.com](https://deepgram.com)                       |
| Tài liệu         | [developers.deepgram.com](https://developers.deepgram.com) |
| Xác thực         | `DEEPGRAM_API_KEY`                                         |
| Mô hình mặc định | `nova-3`                                                   |

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
    Gửi tin nhắn âm thanh qua bất kỳ kênh nào đã kết nối. OpenClaw phiên âm tin nhắn đó
    qua Deepgram và chèn bản phiên âm vào quy trình phản hồi.
  </Step>
</Steps>

## Các tùy chọn cấu hình

| Tùy chọn   | Đường dẫn                            | Mô tả                                  |
| ---------- | ------------------------------------ | -------------------------------------- |
| `model`    | `tools.media.audio.models[].model`   | ID mô hình Deepgram (mặc định: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Gợi ý ngôn ngữ (không bắt buộc)        |

`providerOptions.deepgram` hợp nhất các tham số truy vấn bổ sung trực tiếp vào yêu cầu
`/listen` của Deepgram, vì vậy mọi tên tham số được Deepgram hỗ trợ đều hoạt động
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
  <Tab title="Có các tùy chọn Deepgram">
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

## STT phát trực tuyến cho Cuộc gọi thoại

Plugin `deepgram` đi kèm cũng đăng ký một nhà cung cấp phiên âm theo thời gian thực
cho Plugin Cuộc gọi thoại.

| Cài đặt           | Đường dẫn cấu hình                                                      | Mặc định                              |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| Khóa API          | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Dùng `DEEPGRAM_API_KEY` nếu không đặt |
| Mô hình           | `...deepgram.model`                                                     | `nova-3`                              |
| Ngôn ngữ          | `...deepgram.language`                                                  | (chưa đặt)                            |
| Mã hóa            | `...deepgram.encoding`                                                  | `mulaw`                               |
| Tần số lấy mẫu    | `...deepgram.sampleRate`                                                | `8000`                                |
| Phân định điểm cuối | `...deepgram.endpointingMs`                                           | `800`                                 |
| Kết quả tạm thời  | `...deepgram.interimResults`                                            | `true`                                |

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
Cuộc gọi thoại nhận âm thanh điện thoại dưới dạng G.711 u-law 8 kHz. Nhà cung cấp
phát trực tuyến Deepgram mặc định dùng `encoding: "mulaw"` và `sampleRate: 8000`, vì vậy
các khung phương tiện Twilio có thể được chuyển tiếp trực tiếp.
</Note>

## Ghi chú

<AccordionGroup>
  <Accordion title="Xác thực">
    Quá trình xác thực tuân theo thứ tự xác thực nhà cung cấp tiêu chuẩn. `DEEPGRAM_API_KEY` là
    cách đơn giản nhất.
  </Accordion>
  <Accordion title="Proxy và điểm cuối tùy chỉnh">
    Ghi đè điểm cuối hoặc tiêu đề bằng `tools.media.audio.baseUrl` và
    `tools.media.audio.headers` khi sử dụng proxy.
  </Accordion>
  <Accordion title="Hành vi đầu ra">
    Đầu ra tuân theo cùng các quy tắc âm thanh như những nhà cung cấp khác (giới hạn kích thước, thời gian chờ,
    chèn bản phiên âm).
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
    Các sự cố thường gặp và những bước gỡ lỗi.
  </Card>
  <Card title="Câu hỏi thường gặp" href="/vi/help/faq" icon="circle-question">
    Các câu hỏi thường gặp về việc thiết lập OpenClaw.
  </Card>
</CardGroup>

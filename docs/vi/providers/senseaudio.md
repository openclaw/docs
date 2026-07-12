---
read_when:
    - Bạn muốn sử dụng tính năng chuyển giọng nói thành văn bản của SenseAudio cho các tệp âm thanh đính kèm
    - Bạn cần biến môi trường chứa khóa API SenseAudio hoặc đường dẫn cấu hình âm thanh
summary: Chuyển giọng nói thành văn bản hàng loạt bằng SenseAudio cho các tin nhắn thoại đến
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T08:22:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio phiên âm âm thanh đầu vào và các tệp đính kèm ghi chú thoại thông qua quy trình `tools.media.audio` dùng chung của OpenClaw. OpenClaw gửi âm thanh multipart đến điểm cuối phiên âm tương thích với OpenAI và chèn văn bản trả về dưới dạng `{{Transcript}}` cùng với một khối `[Audio]`.

| Thuộc tính             | Giá trị                                          |
| ---------------------- | ------------------------------------------------ |
| ID nhà cung cấp        | `senseaudio`                                     |
| Plugin                 | đi kèm, `enabledByDefault: true`                  |
| Hợp đồng               | `mediaUnderstandingProviders` (âm thanh)         |
| Biến môi trường xác thực | `SENSEAUDIO_API_KEY`                           |
| Mô hình mặc định       | `senseaudio-asr-pro-1.5-260319`                  |
| URL mặc định           | `https://api.senseaudio.cn/v1`                   |
| Trang web              | [senseaudio.cn](https://senseaudio.cn)           |
| Tài liệu               | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API của bạn">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Bật nhà cung cấp âm thanh">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Gửi ghi chú thoại">
    Gửi tin nhắn âm thanh qua bất kỳ kênh nào đã kết nối. OpenClaw tải âm thanh
    lên SenseAudio và sử dụng bản phiên âm trong quy trình phản hồi.
  </Step>
</Steps>

## Tùy chọn

| Tùy chọn   | Đường dẫn                            | Mô tả                                      |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | ID mô hình ASR của SenseAudio              |
| `language` | `tools.media.audio.models[].language` | Gợi ý ngôn ngữ tùy chọn                    |
| `prompt`   | `tools.media.audio.prompt`            | Lời nhắc phiên âm tùy chọn                 |
| `baseUrl`  | `tools.media.audio.baseUrl` hoặc mô hình | Ghi đè URL cơ sở tương thích với OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Các tiêu đề yêu cầu bổ sung                |

<Note>
Trong OpenClaw, SenseAudio chỉ hỗ trợ STT theo lô. Tính năng phiên âm theo thời gian thực của Cuộc gọi thoại
tiếp tục sử dụng các nhà cung cấp có hỗ trợ STT truyền trực tuyến.
</Note>

## Liên quan

- [Hiểu nội dung phương tiện (âm thanh)](/vi/nodes/audio)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)

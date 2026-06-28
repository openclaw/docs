---
read_when:
    - Bạn muốn dùng tính năng chuyển lời nói thành văn bản của SenseAudio cho tệp đính kèm âm thanh
    - Bạn cần biến môi trường khóa API SenseAudio hoặc đường dẫn cấu hình âm thanh
summary: Chuyển giọng nói thành văn bản hàng loạt bằng SenseAudio cho ghi chú thoại đến
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:27:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SenseAudio có thể chép lại âm thanh đầu vào và tệp đính kèm ghi chú thoại thông qua pipeline `tools.media.audio` dùng chung của OpenClaw. OpenClaw gửi âm thanh multipart đến endpoint chép lời tương thích với OpenAI và chèn văn bản được trả về dưới dạng `{{Transcript}}` cùng một khối `[Audio]`.

| Thuộc tính    | Giá trị                                          |
| ------------- | ------------------------------------------------ |
| ID nhà cung cấp | `senseaudio`                                   |
| Plugin        | được đóng gói kèm, `enabledByDefault: true`      |
| Hợp đồng      | `mediaUnderstandingProviders` (âm thanh)         |
| Biến môi trường xác thực | `SENSEAUDIO_API_KEY`                 |
| Mô hình mặc định | `senseaudio-asr-pro-1.5-260319`               |
| URL mặc định  | `https://api.senseaudio.cn/v1`                   |
| Trang web     | [senseaudio.cn](https://senseaudio.cn)           |
| Tài liệu      | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Bắt đầu

<Steps>
  <Step title="Set your API key">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    Gửi một tin nhắn âm thanh qua bất kỳ kênh nào đã kết nối. OpenClaw tải
    âm thanh lên SenseAudio và sử dụng bản chép lời trong pipeline trả lời.
  </Step>
</Steps>

## Tùy chọn

| Tùy chọn   | Đường dẫn                            | Mô tả                               |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID mô hình ASR của SenseAudio       |
| `language` | `tools.media.audio.models[].language` | Gợi ý ngôn ngữ tùy chọn             |
| `prompt`   | `tools.media.audio.prompt`            | Lời nhắc chép lời tùy chọn          |
| `baseUrl`  | `tools.media.audio.baseUrl` hoặc mô hình | Ghi đè base tương thích với OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Header yêu cầu bổ sung              |

<Note>
SenseAudio chỉ là STT theo lô trong OpenClaw. Chép lời thời gian thực cho Cuộc gọi thoại
tiếp tục dùng các nhà cung cấp hỗ trợ STT streaming.
</Note>

## Liên quan

- [Hiểu phương tiện (âm thanh)](/vi/nodes/audio)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)

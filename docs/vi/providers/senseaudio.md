---
read_when:
    - Bạn muốn dùng tính năng chuyển giọng nói thành văn bản của SenseAudio cho các tệp đính kèm âm thanh
    - Bạn cần biến môi trường khóa API SenseAudio hoặc đường dẫn cấu hình âm thanh
summary: SenseAudio chuyển giọng nói thành văn bản theo lô cho ghi âm thoại đến
title: SenseAudio
x-i18n:
    generated_at: "2026-04-29T23:09:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 16
---

# SenseAudio

SenseAudio có thể phiên âm các tệp đính kèm âm thanh/ghi chú thoại đến thông qua
pipeline `tools.media.audio` dùng chung của OpenClaw. OpenClaw gửi âm thanh multipart
đến điểm cuối phiên âm tương thích với OpenAI và chèn văn bản trả về
dưới dạng `{{Transcript}}` cùng với một khối `[Audio]`.

| Chi tiết       | Giá trị                                          |
| -------------- | ------------------------------------------------ |
| Trang web      | [senseaudio.cn](https://senseaudio.cn)           |
| Tài liệu       | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Xác thực       | `SENSEAUDIO_API_KEY`                             |
| Mô hình mặc định | `senseaudio-asr-pro-1.5-260319`                |
| URL mặc định   | `https://api.senseaudio.cn/v1`                   |

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
    Gửi một tin nhắn âm thanh qua bất kỳ kênh đã kết nối nào. OpenClaw tải
    âm thanh lên SenseAudio và sử dụng bản phiên âm trong pipeline phản hồi.
  </Step>
</Steps>

## Tùy chọn

| Tùy chọn   | Đường dẫn                            | Mô tả                                   |
| ---------- | ------------------------------------- | --------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | id mô hình ASR của SenseAudio           |
| `language` | `tools.media.audio.models[].language` | Gợi ý ngôn ngữ tùy chọn                 |
| `prompt`   | `tools.media.audio.prompt`            | Lời nhắc phiên âm tùy chọn              |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | Ghi đè base tương thích với OpenAI      |
| `headers`  | `tools.media.audio.request.headers`   | Header yêu cầu bổ sung                  |

<Note>
SenseAudio chỉ là STT theo lô trong OpenClaw. Phiên âm thời gian thực cho Cuộc gọi thoại
tiếp tục sử dụng các nhà cung cấp hỗ trợ STT truyền phát.
</Note>

---
read_when:
    - Bạn muốn dùng Gradium cho tính năng chuyển văn bản thành giọng nói
    - Bạn cần cấu hình khóa API Gradium, giọng nói hoặc mã thông báo chỉ thị
summary: Sử dụng tính năng chuyển văn bản thành giọng nói của Gradium trong OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-16T14:55:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) là nhà cung cấp chuyển văn bản thành giọng nói cho OpenClaw. Dịch vụ này tạo các phản hồi âm thanh tiêu chuẩn (WAV), đầu ra Opus tương thích với tin nhắn thoại và âm thanh u-law 8 kHz cho các giao diện điện thoại.

| Thuộc tính      | Giá trị                                |
| ------------- | ------------------------------------ |
| ID nhà cung cấp   | `gradium`                            |
| Xác thực          | `GRADIUM_API_KEY` hoặc cấu hình `apiKey` |
| URL cơ sở      | `https://api.gradium.ai` (mặc định)   |
| Giọng nói mặc định | `Emma` (`YTpq7expH9539ERJ`)          |

## Cài đặt Plugin

Gradium là một Plugin bên ngoài chính thức. Cài đặt Plugin này, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Thiết lập

Tạo khóa API Gradium, sau đó cung cấp khóa này qua biến môi trường hoặc khóa cấu hình. Cấu hình được ưu tiên hơn biến môi trường.

<Tabs>
  <Tab title="Biến môi trường">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Khóa cấu hình">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Cấu hình

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Khóa                                             | Kiểu   | Mô tả                                                                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | chuỗi | Khóa API đã được phân giải. Hỗ trợ `${ENV}` và các tham chiếu bí mật.                                                    |
| `messages.tts.providers.gradium.baseUrl`        | chuỗi | URL API Gradium HTTPS trên `api.gradium.ai`. Dấu gạch chéo ở cuối sẽ bị loại bỏ. Mặc định là `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | chuỗi | ID giọng nói mặc định được sử dụng khi không có chỉ thị ghi đè.                                            |

Định dạng đầu ra được chọn tự động theo giao diện đích (xem [Đầu ra](#output)) và không thể cấu hình trong `openclaw.json`.

## Giọng nói

| Tên               | ID giọng nói           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(mặc định)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Ghi đè giọng nói cho từng tin nhắn

Khi chính sách giọng nói đang hoạt động cho phép ghi đè giọng nói, hãy chuyển đổi giọng nói ngay trong nội dung bằng mã chỉ thị (mọi dạng sau đều tương đương và đều nhận ID giọng nói gốc của nhà cung cấp):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Nếu chính sách giọng nói vô hiệu hóa việc ghi đè giọng nói, chỉ thị sẽ được xử lý nhưng bị bỏ qua.

## Đầu ra

Định dạng đầu ra được chọn theo giao diện đích; nhà cung cấp không tổng hợp các định dạng khác.

| Đích         | Định dạng      | Phần mở rộng tệp | Tần số lấy mẫu | Cờ tương thích với giọng nói |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| Âm thanh tiêu chuẩn | `wav`       | `.wav`   | nhà cung cấp    | không                    |
| Tin nhắn thoại     | `opus`      | `.opus`  | nhà cung cấp    | có                   |
| Điện thoại      | `ulaw_8000` | không áp dụng      | 8 kHz       | không áp dụng                   |

## Thứ tự tự động chọn

Trong số các nhà cung cấp TTS đã cấu hình, thứ tự tự động chọn của Gradium là `30`. Xem [Chuyển văn bản thành giọng nói](/vi/tools/tts) để biết cách OpenClaw chọn nhà cung cấp đang hoạt động khi `messages.tts.provider` không được cố định.

## Liên quan

- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Tổng quan về phương tiện](/vi/tools/media-overview)

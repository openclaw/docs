---
read_when:
    - Bạn muốn dùng Gradium để chuyển văn bản thành giọng nói
    - Bạn cần khóa API Gradium hoặc cấu hình giọng nói
summary: Sử dụng tính năng chuyển văn bản thành giọng nói của Gradium trong OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-29T23:06:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 16
---

Gradium là nhà cung cấp văn bản thành giọng nói được tích hợp sẵn cho OpenClaw. Nó có thể tạo phản hồi âm thanh thông thường, đầu ra Opus tương thích với ghi chú thoại và âm thanh u-law 8 kHz cho các giao diện điện thoại.

## Thiết lập

Tạo khóa API Gradium, sau đó cung cấp khóa đó cho OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Bạn cũng có thể lưu khóa trong cấu hình tại `messages.tts.providers.gradium.apiKey`.

## Cấu hình

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## Giọng nói

| Tên       | ID giọng nói       |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Giọng nói mặc định: Emma.

## Đầu ra

- Các phản hồi dạng tệp âm thanh sử dụng WAV.
- Các phản hồi dạng ghi chú thoại sử dụng Opus và được đánh dấu là tương thích với giọng nói.
- Tổng hợp âm thanh điện thoại sử dụng `ulaw_8000` ở 8 kHz.

## Liên quan

- [Văn bản thành giọng nói](/vi/tools/tts)
- [Tổng quan về phương tiện](/vi/tools/media-overview)

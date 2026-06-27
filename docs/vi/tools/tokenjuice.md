---
read_when:
    - Bạn muốn kết quả công cụ `exec` hoặc `bash` ngắn hơn trong OpenClaw
    - Bạn muốn cài đặt hoặc bật Plugin Tokenjuice
    - Bạn cần hiểu tokenjuice thay đổi những gì và để nguyên thô những gì
summary: Nén gọn các kết quả công cụ exec và bash nhiều nhiễu bằng Plugin Tokenjuice tùy chọn
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:19:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` là một Plugin bên ngoài tùy chọn, dùng để nén các kết quả công cụ `exec` và `bash`
nhiễu sau khi lệnh đã chạy xong.

Nó thay đổi `tool_result` được trả về, không phải chính lệnh đó. Tokenjuice
không viết lại đầu vào shell, chạy lại lệnh, hoặc thay đổi mã thoát.

Hiện nay, điều này áp dụng cho các lần chạy nhúng của OpenClaw và các công cụ động của OpenClaw trong bộ khung app-server của Codex. Tokenjuice nối vào middleware kết quả công cụ của OpenClaw và
cắt gọn đầu ra trước khi đưa lại vào phiên bộ khung đang hoạt động.

## Bật Plugin

Cài đặt một lần:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Sau đó bật nó:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Tương đương:

```bash
openclaw plugins enable tokenjuice
```

Nếu bạn muốn chỉnh sửa cấu hình trực tiếp:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice thay đổi những gì

- Nén các kết quả `exec` và `bash` nhiễu trước khi chúng được đưa lại vào phiên.
- Giữ nguyên việc thực thi lệnh ban đầu.
- Giữ nguyên các lần đọc nội dung tệp chính xác và các lệnh khác mà tokenjuice nên để ở dạng thô.
- Luôn là tùy chọn bật thủ công: tắt Plugin nếu bạn muốn đầu ra nguyên văn ở mọi nơi.

## Xác minh Plugin đang hoạt động

1. Bật Plugin.
2. Bắt đầu một phiên có thể gọi `exec`.
3. Chạy một lệnh nhiều nhiễu, chẳng hạn như `git status`.
4. Kiểm tra rằng kết quả công cụ được trả về ngắn hơn và có cấu trúc hơn so với đầu ra shell thô.

## Tắt Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Hoặc:

```bash
openclaw plugins disable tokenjuice
```

## Liên quan

- [Công cụ Exec](/vi/tools/exec)
- [Các mức suy nghĩ](/vi/tools/thinking)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)

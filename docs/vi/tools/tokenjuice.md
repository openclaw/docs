---
read_when:
    - Bạn muốn kết quả công cụ `exec` hoặc `bash` ngắn gọn hơn trong OpenClaw
    - Bạn muốn cài đặt hoặc bật Plugin Tokenjuice
    - Bạn cần hiểu tokenjuice thay đổi những gì và giữ nguyên những gì.
summary: Nén các kết quả nhiều nhiễu của công cụ exec và bash bằng Plugin Tokenjuice tùy chọn
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T08:28:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` là một plugin bên ngoài tùy chọn giúp thu gọn các kết quả nhiều nhiễu của công cụ `exec` và `bash`
sau khi lệnh đã chạy xong.

Plugin này thay đổi `tool_result` được trả về, không thay đổi bản thân lệnh. Tokenjuice
không viết lại đầu vào shell, chạy lại lệnh hoặc thay đổi mã thoát.

Hiện tại, cơ chế này áp dụng cho các lượt chạy nhúng của OpenClaw và các công cụ động của OpenClaw trong bộ khung
app-server của Codex. Tokenjuice tích hợp vào middleware xử lý kết quả công cụ của OpenClaw và
rút gọn đầu ra trước khi trả lại cho phiên bộ khung đang hoạt động.

## Bật plugin

Cài đặt một lần:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Sau đó bật plugin:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Lệnh tương đương:

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

## Những gì tokenjuice thay đổi

- Thu gọn các kết quả nhiều nhiễu của `exec` và `bash` trước khi chúng được đưa trở lại phiên.
- Giữ nguyên hoàn toàn quá trình thực thi lệnh ban đầu.
- Áp dụng chính sách kiểm kê an toàn: thao tác đọc chính xác nội dung tệp vẫn giữ nguyên đầu ra thô, các lệnh kiểm kê kho lưu trữ độc lập có thể được thu gọn, còn các chuỗi lệnh hỗn hợp không an toàn vẫn giữ nguyên đầu ra thô.
- Luôn yêu cầu chủ động bật: hãy tắt plugin nếu bạn muốn đầu ra nguyên văn ở mọi nơi.

## Xác minh plugin đang hoạt động

1. Bật plugin.
2. Bắt đầu một phiên có thể gọi `exec`.
3. Chạy một lệnh tạo nhiều đầu ra, chẳng hạn như `git status`.
4. Kiểm tra xem kết quả công cụ được trả về có ngắn gọn và có cấu trúc rõ ràng hơn đầu ra shell thô hay không.

## Tắt plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Hoặc:

```bash
openclaw plugins disable tokenjuice
```

## Liên quan

- [Công cụ Exec](/vi/tools/exec)
- [Các mức suy luận](/vi/tools/thinking)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)

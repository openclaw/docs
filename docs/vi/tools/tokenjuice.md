---
read_when:
    - Bạn muốn kết quả công cụ `exec` hoặc `bash` ngắn hơn trong OpenClaw
    - Bạn muốn bật Plugin tokenjuice đi kèm
    - Bạn cần hiểu tokenjuice thay đổi những gì và giữ nguyên những gì ở dạng thô
summary: Thu gọn kết quả công cụ exec và bash nhiều nhiễu bằng một Plugin đi kèm tùy chọn
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-29T23:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` là một Plugin đi kèm tùy chọn, dùng để nén gọn các kết quả công cụ `exec` và `bash`
nhiễu sau khi lệnh đã chạy xong.

Nó thay đổi `tool_result` được trả về, chứ không thay đổi chính lệnh đó. Tokenjuice không
ghi lại đầu vào shell, chạy lại lệnh, hoặc thay đổi mã thoát.

Hiện tại, cơ chế này áp dụng cho các lượt chạy nhúng PI và các công cụ động của OpenClaw trong bộ khung chạy app-server của Codex. Tokenjuice móc vào middleware kết quả công cụ của OpenClaw và
cắt gọn đầu ra trước khi nó được đưa trở lại phiên bộ khung chạy đang hoạt động.

## Bật Plugin

Đường nhanh:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Tương đương:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw đã phát hành kèm Plugin này. Không có bước `plugins install`
hoặc `tokenjuice install openclaw` riêng.

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

## tokenjuice thay đổi gì

- Nén gọn các kết quả `exec` và `bash` nhiễu trước khi chúng được đưa trở lại phiên.
- Giữ nguyên việc thực thi lệnh gốc.
- Giữ nguyên chính xác các lần đọc nội dung tệp và các lệnh khác mà tokenjuice nên để ở dạng thô.
- Duy trì cơ chế chọn tham gia: tắt Plugin nếu bạn muốn đầu ra nguyên văn ở mọi nơi.

## Xác minh nó đang hoạt động

1. Bật Plugin.
2. Bắt đầu một phiên có thể gọi `exec`.
3. Chạy một lệnh nhiễu như `git status`.
4. Kiểm tra rằng kết quả công cụ được trả về ngắn hơn và có cấu trúc hơn đầu ra shell thô.

## Tắt Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Hoặc:

```bash
openclaw plugins disable tokenjuice
```

## Liên quan

- [Công cụ exec](/vi/tools/exec)
- [Mức suy nghĩ](/vi/tools/thinking)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)

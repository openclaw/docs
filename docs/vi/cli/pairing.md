---
read_when:
    - Bạn đang dùng tin nhắn trực tiếp ở chế độ ghép nối và cần phê duyệt người gửi
summary: Tài liệu tham khảo CLI cho `openclaw pairing` (phê duyệt/liệt kê yêu cầu ghép đôi)
title: Ghép đôi
x-i18n:
    generated_at: "2026-04-29T22:33:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Phê duyệt hoặc kiểm tra các yêu cầu ghép đôi qua tin nhắn trực tiếp (đối với các kênh hỗ trợ ghép đôi).

Liên quan:

- Luồng ghép đôi: [Ghép đôi](/vi/channels/pairing)

## Lệnh

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Liệt kê các yêu cầu ghép đôi đang chờ cho một kênh.

Tùy chọn:

- `[channel]`: id kênh theo vị trí
- `--channel <channel>`: id kênh tường minh
- `--account <accountId>`: id tài khoản cho các kênh nhiều tài khoản
- `--json`: đầu ra cho máy đọc được

Ghi chú:

- Nếu nhiều kênh có khả năng ghép đôi được cấu hình, bạn phải cung cấp một kênh theo vị trí hoặc bằng `--channel`.
- Các kênh tiện ích mở rộng được phép miễn là id kênh hợp lệ.

## `pairing approve`

Phê duyệt một mã ghép đôi đang chờ và cho phép người gửi đó.

Cách dùng:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` khi đúng một kênh có khả năng ghép đôi được cấu hình

Tùy chọn:

- `--channel <channel>`: id kênh tường minh
- `--account <accountId>`: id tài khoản cho các kênh nhiều tài khoản
- `--notify`: gửi xác nhận lại cho người yêu cầu trên cùng kênh

Khởi tạo chủ sở hữu:

- Nếu `commands.ownerAllowFrom` trống khi bạn phê duyệt một mã ghép đôi, OpenClaw cũng ghi lại người gửi đã được phê duyệt làm chủ sở hữu lệnh, bằng một mục trong phạm vi kênh như `telegram:123456789`.
- Thao tác này chỉ khởi tạo chủ sở hữu đầu tiên. Các phê duyệt ghép đôi sau đó không thay thế hoặc mở rộng `commands.ownerAllowFrom`.
- Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm như `/diagnostics`, `/export-trajectory`, `/config`, và phê duyệt exec.

## Ghi chú

- Đầu vào kênh: truyền theo vị trí (`pairing list telegram`) hoặc bằng `--channel <channel>`.
- `pairing list` hỗ trợ `--account <accountId>` cho các kênh nhiều tài khoản.
- `pairing approve` hỗ trợ `--account <accountId>` và `--notify`.
- Nếu chỉ một kênh có khả năng ghép đôi được cấu hình, `pairing approve <code>` được phép.
- Nếu bạn đã phê duyệt một người gửi trước khi cơ chế khởi tạo này tồn tại, hãy chạy `openclaw doctor`; lệnh này cảnh báo khi chưa có chủ sở hữu lệnh nào được cấu hình và hiển thị lệnh `openclaw config set commands.ownerAllowFrom ...` để khắc phục.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Ghép đôi kênh](/vi/channels/pairing)

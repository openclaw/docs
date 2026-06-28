---
read_when:
    - Bạn đang dùng tin nhắn riêng ở chế độ ghép nối và cần phê duyệt người gửi
summary: Tham chiếu CLI cho `openclaw pairing` (yêu cầu ghép nối approve/list)
title: Ghép nối
x-i18n:
    generated_at: "2026-05-06T17:54:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw pairing`

Phê duyệt hoặc kiểm tra các yêu cầu ghép nối qua DM (đối với các kênh hỗ trợ ghép nối).

Liên quan:

- Luồng ghép nối: [Ghép nối](/vi/channels/pairing)

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

Liệt kê các yêu cầu ghép nối đang chờ cho một kênh.

Tùy chọn:

- `[channel]`: mã định danh kênh dạng tham số vị trí
- `--channel <channel>`: mã định danh kênh tường minh
- `--account <accountId>`: mã định danh tài khoản cho các kênh nhiều tài khoản
- `--json`: đầu ra máy có thể đọc

Ghi chú:

- Nếu nhiều kênh có khả năng ghép nối đã được cấu hình, bạn phải cung cấp một kênh dưới dạng tham số vị trí hoặc bằng `--channel`.
- Các kênh Plugin được phép miễn là mã định danh kênh hợp lệ.

## `pairing approve`

Phê duyệt một mã ghép nối đang chờ và cho phép người gửi đó.

Cách dùng:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` khi đúng một kênh có khả năng ghép nối đã được cấu hình

Tùy chọn:

- `--channel <channel>`: mã định danh kênh tường minh
- `--account <accountId>`: mã định danh tài khoản cho các kênh nhiều tài khoản
- `--notify`: gửi xác nhận lại cho người yêu cầu trên cùng kênh

Khởi tạo chủ sở hữu:

- Nếu `commands.ownerAllowFrom` trống khi bạn phê duyệt một mã ghép nối, OpenClaw cũng ghi lại người gửi đã được phê duyệt làm chủ sở hữu lệnh, sử dụng một mục có phạm vi theo kênh như `telegram:123456789`.
- Việc này chỉ khởi tạo chủ sở hữu đầu tiên. Các lần phê duyệt ghép nối sau đó không thay thế hoặc mở rộng `commands.ownerAllowFrom`.
- Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm như `/diagnostics`, `/export-trajectory`, `/config`, và phê duyệt exec.

## Ghi chú

- Đầu vào kênh: truyền dưới dạng tham số vị trí (`pairing list telegram`) hoặc bằng `--channel <channel>`.
- `pairing list` hỗ trợ `--account <accountId>` cho các kênh nhiều tài khoản.
- `pairing approve` hỗ trợ `--account <accountId>` và `--notify`.
- Nếu chỉ một kênh có khả năng ghép nối đã được cấu hình, `pairing approve <code>` được phép.
- Nếu bạn đã phê duyệt một người gửi trước khi cơ chế khởi tạo này tồn tại, hãy chạy `openclaw doctor`; lệnh này cảnh báo khi chưa cấu hình chủ sở hữu lệnh và hiển thị lệnh `openclaw config set commands.ownerAllowFrom ...` để khắc phục.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghép nối kênh](/vi/channels/pairing)

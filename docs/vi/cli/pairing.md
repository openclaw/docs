---
read_when:
    - Bạn đang sử dụng tin nhắn trực tiếp ở chế độ ghép đôi và cần phê duyệt người gửi
summary: Tài liệu tham khảo CLI cho `openclaw pairing` (phê duyệt/liệt kê yêu cầu ghép nối)
title: Ghép nối
x-i18n:
    generated_at: "2026-07-16T14:14:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Phê duyệt hoặc kiểm tra các yêu cầu ghép nối DM cho những kênh hỗ trợ ghép nối (chỉ DM trò chuyện - ghép nối node/thiết bị sử dụng `openclaw devices`).

Liên quan: [Luồng ghép nối](/vi/channels/pairing)

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

Liệt kê các yêu cầu ghép nối đang chờ xử lý cho một kênh.

| Tùy chọn                | Mô tả                                  |
| ----------------------- | -------------------------------------- |
| `[channel]`      | mã định danh kênh theo vị trí           |
| `--channel <channel>`      | mã định danh kênh được chỉ định rõ      |
| `--account <accountId>`      | mã định danh tài khoản cho kênh đa tài khoản |
| `--json`      | đầu ra có thể được máy đọc              |

Nếu đã cấu hình nhiều kênh có khả năng ghép nối, hãy truyền một kênh theo vị trí hoặc bằng `--channel`. Các kênh mở rộng hoạt động miễn là mã định danh kênh hợp lệ.

## `pairing approve`

Phê duyệt một mã ghép nối đang chờ xử lý và cho phép người gửi đó.

Cách dùng:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` khi chỉ có đúng một kênh có khả năng ghép nối được cấu hình

Tùy chọn: `--channel <channel>`, `--account <accountId>`, `--notify` (gửi xác nhận lại cho người yêu cầu trên cùng kênh).

### Khởi tạo chủ sở hữu

Nếu `commands.ownerAllowFrom` trống khi bạn phê duyệt một mã ghép nối, OpenClaw cũng ghi nhận người gửi đã được phê duyệt là chủ sở hữu lệnh, bằng một mục có phạm vi theo kênh như `telegram:123456789`. Thao tác này chỉ khởi tạo chủ sở hữu đầu tiên - các lần phê duyệt ghép nối sau đó không bao giờ thay thế hoặc mở rộng `commands.ownerAllowFrom`.

Chủ sở hữu lệnh là tài khoản của người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt những hành động nguy hiểm như `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` và các yêu cầu phê duyệt thực thi. Ghép nối chỉ cho phép người gửi trò chuyện với tác nhân; bản thân thao tác này không cấp đặc quyền chủ sở hữu ngoài lần khởi tạo duy nhất này.

Nếu bạn đã phê duyệt một người gửi trước khi cơ chế khởi tạo này tồn tại, hãy chạy `openclaw doctor`; lệnh này cảnh báo khi chưa cấu hình chủ sở hữu lệnh và hiển thị chính xác lệnh `openclaw config set commands.ownerAllowFrom ...` để khắc phục.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghép nối kênh](/vi/channels/pairing)

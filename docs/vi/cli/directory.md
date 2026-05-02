---
read_when:
    - Bạn muốn tra cứu mã định danh của liên hệ/nhóm/chính bạn cho một kênh
    - Bạn đang phát triển một bộ điều hợp thư mục kênh
summary: Tài liệu tham chiếu CLI cho `openclaw directory` (bản thân, các đồng cấp, nhóm)
title: Thư mục
x-i18n:
    generated_at: "2026-05-02T10:36:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Tra cứu thư mục cho các kênh hỗ trợ tính năng này (liên hệ/đối tượng ngang hàng, nhóm và “tôi”).

## Cờ phổ biến

- `--channel <name>`: id/bí danh kênh (bắt buộc khi cấu hình nhiều kênh; tự động khi chỉ cấu hình một kênh)
- `--account <id>`: id tài khoản (mặc định: mặc định của kênh)
- `--json`: xuất JSON

## Ghi chú

- `directory` nhằm giúp bạn tìm các ID có thể dán vào các lệnh khác (đặc biệt là `openclaw message send --target ...`).
- Với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép / nhóm đã cấu hình) thay vì thư mục nhà cung cấp trực tiếp.
- Các Plugin kênh đã cài đặt vẫn có thể không hỗ trợ thư mục; trong trường hợp đó, lệnh sẽ báo thao tác thư mục không được hỗ trợ thay vì cài đặt lại Plugin.
- Đầu ra mặc định là `id` (và đôi khi là `name`) được phân tách bằng tab; dùng `--json` để viết script.

## Dùng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID (theo kênh)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (nhóm)
- Telegram: `@username` hoặc id cuộc trò chuyện dạng số; nhóm là các id dạng số
- Slack: `user:U…` và `channel:C…`
- Discord: `user:<id>` và `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, hoặc `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` và `conversation:<id>`
- Zalo (Plugin): id người dùng (Bot API)
- Zalo Personal / `zalouser` (Plugin): id luồng (DM/nhóm) từ `zca` (`me`, `friend list`, `group list`)

## Bản thân ("me")

```bash
openclaw directory self --channel zalouser
```

## Đối tượng ngang hàng (liên hệ/người dùng)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Nhóm

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)

---
read_when:
    - Bạn muốn tra cứu mã định danh của liên hệ/nhóm/chính mình cho một kênh
    - Bạn đang phát triển một bộ điều hợp thư mục kênh
summary: Tài liệu tham chiếu CLI cho `openclaw directory` (bản thân, đồng cấp, nhóm)
title: Thư mục
x-i18n:
    generated_at: "2026-05-02T20:41:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Tra cứu thư mục cho các kênh hỗ trợ tính năng này (liên hệ/peer, nhóm và “tôi”).

## Cờ chung

- `--channel <name>`: id/bí danh kênh (bắt buộc khi cấu hình nhiều kênh; tự động khi chỉ cấu hình một kênh)
- `--account <id>`: id tài khoản (mặc định: mặc định của kênh)
- `--json`: xuất JSON

## Ghi chú

- `directory` nhằm giúp bạn tìm các ID có thể dán vào các lệnh khác (đặc biệt là `openclaw message send --target ...`).
- Với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép / nhóm đã cấu hình) thay vì thư mục nhà cung cấp trực tiếp.
- Các Plugin kênh đã cài đặt vẫn có thể không hỗ trợ thư mục; trong trường hợp đó, lệnh sẽ báo thao tác thư mục không được hỗ trợ thay vì cài đặt lại Plugin.
- Đầu ra mặc định là `id` (và đôi khi là `name`) được phân tách bằng tab; dùng `--json` để viết script.

## Sử dụng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID (theo kênh)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (nhóm), `120363123456789@newsletter` (mục tiêu gửi đi Channel/Newsletter)
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

## Peer (liên hệ/người dùng)

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

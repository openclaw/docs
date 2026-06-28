---
read_when:
    - Bạn muốn tra cứu ID của liên hệ/nhóm/bản thân cho một kênh
    - Bạn đang phát triển một bộ điều hợp thư mục kênh
summary: Tài liệu tham chiếu CLI cho `openclaw directory` (bản thân, các đối tượng ngang hàng, nhóm)
title: Thư mục
x-i18n:
    generated_at: "2026-05-06T17:52:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw directory`

Tra cứu thư mục cho các kênh hỗ trợ tính năng này (liên hệ/đồng cấp, nhóm và "tôi").

## Cờ chung

- `--channel <name>`: id/bí danh kênh (bắt buộc khi nhiều kênh được cấu hình; tự động khi chỉ có một kênh được cấu hình)
- `--account <id>`: id tài khoản (mặc định: mặc định của kênh)
- `--json`: xuất JSON

## Ghi chú

- `directory` nhằm giúp bạn tìm các ID có thể dán vào lệnh khác (đặc biệt là `openclaw message send --target ...`).
- Với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép / nhóm đã cấu hình) thay vì một thư mục nhà cung cấp trực tiếp.
- Các Plugin kênh đã cài đặt vẫn có thể không hỗ trợ thư mục; trong trường hợp đó, lệnh sẽ báo thao tác thư mục không được hỗ trợ thay vì cài đặt lại Plugin.
- Đầu ra mặc định là `id` (và đôi khi là `name`) được phân tách bằng tab; dùng `--json` để viết script.

## Sử dụng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID (theo kênh)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (nhóm), `120363123456789@newsletter` (đích gửi đi của Kênh/Bản tin)
- Telegram: `@username` hoặc id cuộc trò chuyện dạng số; nhóm là các id dạng số
- Slack: `user:U…` và `channel:C…`
- Discord: `user:<id>` và `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, hoặc `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` và `conversation:<id>`
- Zalo (Plugin): id người dùng (Bot API)
- Zalo Personal / `zalouser` (Plugin): id luồng (DM/nhóm) từ `zca` (`me`, `friend list`, `group list`)

## Bản thân ("tôi")

```bash
openclaw directory self --channel zalouser
```

## Đồng cấp (liên hệ/người dùng)

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

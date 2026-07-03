---
read_when:
    - Bạn muốn tra cứu mã định danh của liên hệ/nhóm/chính bạn cho một kênh
    - Bạn đang phát triển một bộ điều hợp thư mục kênh
summary: Tham chiếu CLI cho `openclaw directory` (bản thân, các ngang hàng, nhóm)
title: Thư mục
x-i18n:
    generated_at: "2026-07-03T15:33:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Tra cứu thư mục cho các kênh hỗ trợ tính năng này (liên hệ/peer, nhóm và "tôi").

## Cờ thông dụng

- `--channel <name>`: id/bí danh kênh (bắt buộc khi cấu hình nhiều kênh; tự động khi chỉ cấu hình một kênh)
- `--account <id>`: id tài khoản (mặc định: mặc định của kênh)
- `--json`: xuất JSON

## Ghi chú

- `directory` nhằm giúp bạn tìm các ID có thể dán vào lệnh khác (đặc biệt là `openclaw message send --target ...`).
- Với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép / nhóm đã cấu hình) thay vì thư mục nhà cung cấp trực tiếp.
- Các Plugin kênh đã cài đặt vẫn có thể không hỗ trợ thư mục; trong trường hợp đó, lệnh báo thao tác thư mục không được hỗ trợ thay vì cài đặt lại Plugin.
- Đầu ra mặc định là `id` (và đôi khi là `name`) được phân tách bằng tab; dùng `--json` cho scripting.

## Dùng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID (theo kênh)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (nhóm), `120363123456789@newsletter` (đích gửi đi Channel/Newsletter)
- Signal: bí danh đã cấu hình phân giải thành đích DM E.164/UUID hoặc đích nhóm `group:<id>`
- Telegram: `@username` hoặc id chat dạng số; nhóm là id dạng số
- Slack: `user:U…` và `channel:C…`
- Discord: `user:<id>` và `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, hoặc `#alias:server`
- Microsoft Teams (plugin): `user:<id>` và `conversation:<id>`
- Zalo (plugin): id người dùng (Bot API)
- Zalo Personal / `zalouser` (plugin): id luồng (DM/nhóm) từ `zca` (`me`, `friend list`, `group list`)

## Bản thân ("tôi")

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

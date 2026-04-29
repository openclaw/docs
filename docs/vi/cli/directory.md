---
read_when:
    - Bạn muốn tra cứu ID liên hệ/nhóm/bản thân cho một kênh
    - Bạn đang phát triển một bộ điều hợp thư mục kênh
summary: Tài liệu tham chiếu CLI cho `openclaw directory` (bản thân, các bên ngang hàng, nhóm)
title: Thư mục
x-i18n:
    generated_at: "2026-04-29T22:31:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Tra cứu danh bạ cho các kênh hỗ trợ việc này (danh bạ/đối tượng ngang hàng, nhóm và “tôi”).

## Cờ chung

- `--channel <name>`: id/bí danh kênh (bắt buộc khi cấu hình nhiều kênh; tự động khi chỉ cấu hình một kênh)
- `--account <id>`: id tài khoản (mặc định: mặc định của kênh)
- `--json`: xuất JSON

## Ghi chú

- `directory` nhằm giúp bạn tìm các ID có thể dán vào lệnh khác (đặc biệt là `openclaw message send --target ...`).
- Với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép / nhóm đã cấu hình) thay vì danh bạ nhà cung cấp trực tiếp.
- Đầu ra mặc định là `id` (và đôi khi là `name`) được phân tách bằng tab; dùng `--json` cho kịch bản.

## Sử dụng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID (theo kênh)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (nhóm)
- Telegram: `@username` hoặc id cuộc trò chuyện dạng số; nhóm là các id dạng số
- Slack: `user:U…` và `channel:C…`
- Discord: `user:<id>` và `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, hoặc `#alias:server`
- Microsoft Teams (plugin): `user:<id>` và `conversation:<id>`
- Zalo (plugin): id người dùng (Bot API)
- Zalo Personal / `zalouser` (plugin): id luồng (DM/nhóm) từ `zca` (`me`, `friend list`, `group list`)

## Bản thân ("me")

```bash
openclaw directory self --channel zalouser
```

## Đối tượng ngang hàng (danh bạ/người dùng)

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

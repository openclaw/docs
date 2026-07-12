---
read_when:
    - Bạn muốn tra cứu mã định danh của danh bạ/nhóm/bản thân cho một kênh
    - Bạn đang phát triển một bộ điều hợp thư mục kênh
summary: Tài liệu tham khảo CLI cho `openclaw directory` (bản thân, các thiết bị ngang hàng, nhóm)
title: Thư mục
x-i18n:
    generated_at: "2026-07-12T07:49:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Tra cứu danh bạ cho các kênh hỗ trợ tính năng này: liên hệ/đối tác, nhóm và "tôi" (bản thân).

Kết quả được dùng để dán vào các lệnh khác, đặc biệt là `openclaw message send --target ...`.

## Cờ thông dụng

- `--channel <name>`: id/bí danh kênh (bắt buộc khi cấu hình nhiều kênh; được tự động chọn khi chỉ cấu hình một kênh)
- `--account <id>`: id tài khoản (mặc định: giá trị mặc định của kênh)
- `--json`: xuất JSON

Đầu ra mặc định (không phải JSON) là `id` (và đôi khi là `name`), được phân tách bằng ký tự tab.

## Ghi chú

- Đối với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép / các nhóm đã cấu hình) thay vì danh bạ trực tiếp từ nhà cung cấp.
- Plugin kênh đã được cài đặt có thể không hỗ trợ danh bạ. Trong trường hợp đó, lệnh sẽ báo thao tác không được hỗ trợ; lệnh không cố cài đặt lại hoặc nâng cấp Plugin để bổ sung khả năng hỗ trợ.

## Sử dụng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID theo kênh

| Kênh                                | Định dạng id đích                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (tin nhắn trực tiếp), `1234567890-1234567890@g.us` (nhóm), `120363123456789@newsletter` (Kênh/Bản tin, chỉ gửi đi) |
| Signal                              | Các bí danh đã cấu hình được phân giải thành đích tin nhắn trực tiếp E.164/UUID hoặc đích nhóm `group:<id>`                 |
| Telegram                            | `@username` hoặc id cuộc trò chuyện dạng số; các nhóm sử dụng id dạng số                                                    |
| Slack                               | `user:U…` và `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` và `channel:<id>`                                                                                              |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` hoặc `#alias:server`                                                             |
| Microsoft Teams (Plugin)            | `user:<id>` và `conversation:<id>`                                                                                         |
| Zalo (Plugin)                       | Id người dùng (API Bot)                                                                                                    |
| Zalo Personal / `zalouser` (Plugin) | Id luồng (tin nhắn trực tiếp/nhóm), từ `zca` (`me`, `friend list`, `group list`)                                            |

## Bản thân ("tôi")

```bash
openclaw directory self --channel zalouser
```

## Đối tác (liên hệ/người dùng)

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

- [Tài liệu tham khảo CLI](/vi/cli)

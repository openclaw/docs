---
read_when:
    - Bạn muốn tra cứu ID của liên hệ/nhóm/bản thân cho một kênh
    - Bạn đang phát triển một bộ điều hợp thư mục kênh
summary: Tham chiếu CLI cho `openclaw directory` (bản thân, các peer, các nhóm)
title: Thư mục
x-i18n:
    generated_at: "2026-07-19T05:39:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33f1cabd0954f2e6e6affbfbff9f8e1f543bffebc54baff7c1ffaa21778744a0
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Tra cứu thư mục cho các kênh hỗ trợ tính năng này: liên hệ/đối tác, nhóm và "tôi" (bản thân).

Kết quả được dùng để dán vào các lệnh khác, đặc biệt là `openclaw message send --target ...`.

## Cờ chung

- `--channel <name>`: id/bí danh kênh (bắt buộc khi cấu hình nhiều kênh; được tự động chọn khi chỉ cấu hình một kênh)
- `--account <id>`: id tài khoản (mặc định: giá trị mặc định của kênh)
- `--json`: xuất JSON

Đầu ra mặc định (không phải JSON) là `id` (và đôi khi là `name`), được phân tách bằng một ký tự tab.

## Ghi chú

- Đối với nhiều kênh, kết quả dựa trên cấu hình (danh sách cho phép / nhóm đã cấu hình) thay vì thư mục trực tiếp của nhà cung cấp.
- Danh sách nhóm WhatsApp là dữ liệu trực tiếp. Các lượt tra cứu qua Gateway tái sử dụng kết nối do Gateway sở hữu; lệnh độc lập chỉ mở phiên đã liên kết khi không có tiến trình nào khác sở hữu tài khoản đó, nếu không sẽ báo rằng các nhóm trực tiếp không khả dụng.
- Plugin kênh đã cài đặt có thể không hỗ trợ thư mục. Trong trường hợp đó, lệnh sẽ báo thao tác không được hỗ trợ; lệnh không cố cài đặt lại hoặc nâng cấp Plugin để bổ sung hỗ trợ.

## Sử dụng kết quả với `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Định dạng ID theo kênh

| Kênh                                | Định dạng id đích                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (tin nhắn trực tiếp), `1234567890-1234567890@g.us` (nhóm), `120363123456789@newsletter` (Kênh/Bản tin, chỉ gửi đi) |
| Signal                              | Các bí danh đã cấu hình phân giải thành đích tin nhắn trực tiếp E.164/UUID hoặc đích nhóm `group:<id>`                                           |
| Telegram                            | `@username` hoặc id cuộc trò chuyện dạng số; nhóm sử dụng id dạng số                                                                      |
| Slack                               | `user:U…` và `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` và `channel:<id>`                                                                                              |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` hoặc `#alias:server`                                                              |
| Microsoft Teams (Plugin)            | `user:<id>` và `conversation:<id>`                                                                                         |
| Zalo (Plugin)                       | Id người dùng (Bot API)                                                                                                           |
| Zalo Personal / `zalouser` (Plugin) | Id luồng (tin nhắn trực tiếp/nhóm), từ `zca` (`me`, `friend list`, `group list`)                                                        |

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

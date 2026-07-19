---
read_when:
    - Bạn muốn một giao diện người dùng trên terminal cho Gateway (thân thiện với truy cập từ xa)
    - Bạn muốn truyền url/token/session từ các script
    - Bạn muốn chạy TUI ở chế độ nhúng cục bộ mà không cần Gateway
    - Bạn muốn sử dụng openclaw chat hoặc openclaw tui --local
summary: Tài liệu tham khảo CLI cho `openclaw tui` (giao diện người dùng đầu cuối được Gateway hỗ trợ hoặc nhúng cục bộ)
title: TUI
x-i18n:
    generated_at: "2026-07-19T16:58:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5406f25bbd22c64867296c15112fafcaf8e1580c759e5fdc81fccfb62ae1e318
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Mở giao diện người dùng terminal được kết nối với Gateway hoặc chạy giao diện này ở chế độ nhúng cục bộ.

Hướng dẫn liên quan: [TUI](/vi/web/tui)

## Tùy chọn

| Cờ                           | Mặc định                                  | Mô tả                                                                               |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `--local`           | `false`                        | Chạy với runtime tác nhân nhúng cục bộ thay vì Gateway.                             |
| `--url <url>`           | `gateway.remote.url` từ cấu hình            | URL WebSocket của Gateway.                                                          |
| `--token <token>`           | (không có)                                | Token Gateway nếu được yêu cầu.                                                     |
| `--password <pass>`           | (không có)                                | Mật khẩu Gateway nếu được yêu cầu.                                                  |
| `--tls-fingerprint <sha256>`           | `gateway.remote.tlsFingerprint`                        | Dấu vân tay chứng chỉ TLS dự kiến cho Gateway `wss://` được ghim.         |
| `--session <key>`           | `main` (hoặc `global` khi phạm vi là toàn cục) | Khóa phiên. Bên trong không gian làm việc của tác nhân, hệ thống tự động chọn tác nhân đó trừ khi có tiền tố. |
| `--deliver`           | `false`                        | Gửi phản hồi của trợ lý qua các kênh đã cấu hình.                                   |
| `--thinking <level>`           | (mặc định của mô hình)                    | Ghi đè mức độ suy luận.                                                             |
| `--message <text>`           | (không có)                                | Gửi thông báo ban đầu sau khi kết nối.                                              |
| `--timeout-ms <ms>`           | `agents.defaults.timeoutSeconds`                        | Thời gian chờ của tác nhân. Các giá trị không hợp lệ sẽ ghi cảnh báo và bị bỏ qua. |
| `--history-limit <n>`           | `200`                        | Số mục lịch sử cần tải khi đính kèm.                                                |

Các bí danh: `openclaw chat` và `openclaw terminal` gọi lệnh này với
`--local` được ngầm định.

## Ghi chú

- `--local` không thể kết hợp với `--url`, `--token`, `--password` hoặc `--tls-fingerprint`.
- `tui` phân giải các SecretRef xác thực Gateway đã cấu hình cho xác thực bằng token/mật khẩu
  khi có thể (các nhà cung cấp `env`/`file`/`exec`).
- Khi không có URL hoặc cổng được chỉ định rõ ràng, `tui` sử dụng cổng Gateway cục bộ đang hoạt động
  do Gateway đang chạy ghi lại. `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT` và cấu hình Gateway từ xa được chỉ định rõ ràng vẫn được ưu tiên.
- Khi được khởi chạy từ bên trong thư mục không gian làm việc của tác nhân đã cấu hình, TUI tự động chọn
  tác nhân đó làm giá trị mặc định cho khóa phiên (trừ khi `--session` được đặt rõ ràng
  thành `agent:<id>:...`).
- Chế độ cục bộ sử dụng trực tiếp runtime tác nhân nhúng. Hầu hết các công cụ cục bộ đều hoạt động,
  nhưng các tính năng chỉ dành cho Gateway không khả dụng.
- Chế độ cục bộ thêm `/auth [provider]` vào bề mặt lệnh TUI.
- Các cổng phê duyệt Plugin vẫn áp dụng trong chế độ cục bộ: các công cụ yêu cầu phê duyệt
  sẽ nhắc đưa ra quyết định trong terminal, không có nội dung nào được âm thầm tự động phê duyệt.
- [Mục tiêu](/vi/tools/goal) của phiên xuất hiện ở chân trang và có thể được quản lý bằng
  `/goal`.

## Ví dụ

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "So sánh cấu hình của tôi với tài liệu và cho tôi biết cần sửa gì"
# khi chạy bên trong không gian làm việc của tác nhân, tự động suy ra tác nhân đó
openclaw tui --session bugfix
```

## Vòng lặp sửa chữa cấu hình

Sử dụng chế độ cục bộ để runtime tác nhân nhúng kiểm tra cấu hình hiện tại, so sánh
cấu hình đó với tài liệu và hỗ trợ sửa chữa ngay từ cùng một terminal.

Nếu `openclaw config validate` đã gặp lỗi, trước tiên hãy chạy `openclaw configure` hoặc
`openclaw doctor --fix`; `openclaw chat` không bỏ qua cơ chế bảo vệ
đối với cấu hình không hợp lệ.

```bash
openclaw chat
```

Sau đó, bên trong TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Áp dụng các bản sửa lỗi có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`, sau đó
chạy lại `openclaw config validate`. Xem [TUI](/vi/web/tui) và
[Cấu hình](/vi/cli/config).

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [TUI](/vi/web/tui)
- [Mục tiêu](/vi/tools/goal)

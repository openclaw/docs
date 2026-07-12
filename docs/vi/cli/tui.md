---
read_when:
    - Bạn muốn một giao diện người dùng trên terminal cho Gateway (thân thiện với truy cập từ xa)
    - Bạn muốn truyền url/token/session từ các tập lệnh
    - Bạn muốn chạy TUI ở chế độ nhúng cục bộ mà không cần Gateway
    - Bạn muốn sử dụng openclaw chat hoặc openclaw tui --local
summary: Tài liệu tham khảo CLI cho `openclaw tui` (giao diện người dùng đầu cuối được Gateway hỗ trợ hoặc nhúng cục bộ)
title: TUI
x-i18n:
    generated_at: "2026-07-12T07:46:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Mở giao diện người dùng đầu cuối được kết nối với Gateway hoặc chạy giao diện đó ở chế độ nhúng cục bộ.

Hướng dẫn liên quan: [TUI](/vi/web/tui)

## Tùy chọn

| Cờ                           | Mặc định                                  | Mô tả                                                                                                     |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Chạy với môi trường thực thi tác nhân nhúng cục bộ thay vì Gateway.                                       |
| `--url <url>`                | `gateway.remote.url` từ cấu hình          | URL WebSocket của Gateway.                                                                                |
| `--token <token>`            | (không có)                                | Token Gateway nếu bắt buộc.                                                                               |
| `--password <pass>`          | (không có)                                | Mật khẩu Gateway nếu bắt buộc.                                                                            |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Dấu vân tay chứng chỉ TLS dự kiến cho Gateway `wss://` được ghim.                                         |
| `--session <key>`            | `main` (hoặc `global` khi phạm vi là toàn cục) | Khóa phiên. Trong không gian làm việc của tác nhân, tự động chọn tác nhân đó trừ khi có tiền tố.       |
| `--deliver`                  | `false`                                   | Chuyển câu trả lời của trợ lý qua các kênh đã cấu hình.                                                   |
| `--thinking <level>`         | (mặc định của mô hình)                    | Ghi đè mức độ suy luận.                                                                                    |
| `--message <text>`           | (không có)                                | Gửi thông điệp ban đầu sau khi kết nối.                                                                   |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Thời gian chờ của tác nhân. Giá trị không hợp lệ sẽ ghi cảnh báo và bị bỏ qua.                            |
| `--history-limit <n>`        | `200`                                     | Số mục lịch sử cần tải khi đính kèm.                                                                      |

Các bí danh `openclaw chat` và `openclaw terminal` gọi lệnh này với `--local` được ngầm định.

## Ghi chú

- Không thể kết hợp `--local` với `--url`, `--token`, `--password` hoặc `--tls-fingerprint`.
- Khi có thể, `tui` phân giải các SecretRef xác thực Gateway đã cấu hình để xác thực bằng token/mật khẩu (các trình cung cấp `env`/`file`/`exec`).
- Khi không chỉ định rõ URL hoặc cổng, `tui` sử dụng cổng Gateway cục bộ đang hoạt động do Gateway đang chạy ghi lại. `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` và cấu hình Gateway từ xa được chỉ định rõ vẫn có mức ưu tiên cao hơn.
- Khi được khởi chạy bên trong thư mục không gian làm việc của tác nhân đã cấu hình, TUI tự động chọn tác nhân đó làm giá trị mặc định cho khóa phiên (trừ khi `--session` được chỉ định rõ là `agent:<id>:...`).
- Để hiển thị tên máy chủ Gateway trong chân trang đối với các kết nối dựa trên URL không phải cục bộ, hãy chạy `openclaw config set tui.footer.showRemoteHost true`. Tùy chọn này mặc định bị tắt và không bao giờ hiển thị đối với các kết nối local loopback hoặc kết nối nhúng cục bộ.
- Chế độ cục bộ sử dụng trực tiếp môi trường thực thi tác nhân nhúng. Hầu hết công cụ cục bộ đều hoạt động, nhưng các tính năng chỉ dành cho Gateway sẽ không khả dụng.
- Chế độ cục bộ thêm `/auth [provider]` vào tập lệnh TUI.
- Các cổng phê duyệt Plugin vẫn áp dụng trong chế độ cục bộ: những công cụ yêu cầu phê duyệt sẽ nhắc đưa ra quyết định trong đầu cuối; không có nội dung nào được âm thầm tự động phê duyệt.
- [Mục tiêu](/vi/tools/goal) của phiên xuất hiện trong chân trang và có thể được quản lý bằng `/goal`.

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

## Vòng lặp sửa cấu hình

Sử dụng chế độ cục bộ để tác nhân nhúng kiểm tra cấu hình hiện tại, so sánh cấu hình đó với tài liệu và hỗ trợ sửa cấu hình ngay trong cùng một đầu cuối.

Nếu `openclaw config validate` đã thất bại, trước tiên hãy chạy `openclaw configure` hoặc `openclaw doctor --fix`; `openclaw chat` không bỏ qua cơ chế bảo vệ đối với cấu hình không hợp lệ.

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

Áp dụng các bản sửa lỗi có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`, rồi chạy lại `openclaw config validate`. Xem [TUI](/vi/web/tui) và [Cấu hình](/vi/cli/config).

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [TUI](/vi/web/tui)
- [Mục tiêu](/vi/tools/goal)

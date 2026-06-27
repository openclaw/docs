---
read_when:
    - Bạn muốn một giao diện người dùng trong terminal cho Gateway (thân thiện với truy cập từ xa)
    - Bạn muốn truyền url/token/session từ scripts
    - Bạn muốn chạy TUI ở chế độ nhúng cục bộ mà không cần Gateway
    - Bạn muốn dùng openclaw chat hoặc openclaw tui --local
summary: Tham chiếu CLI cho `openclaw tui` (TUI được Gateway hỗ trợ hoặc nhúng cục bộ)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Mở UI trong terminal được kết nối với Gateway, hoặc chạy ở chế độ nhúng cục bộ.

Liên quan:

- Hướng dẫn TUI: [TUI](/vi/web/tui)

## Tùy chọn

| Cờ                    | Mặc định                                  | Mô tả                                                                               |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Chạy với runtime tác nhân nhúng cục bộ thay vì Gateway.                             |
| `--url <url>`         | `gateway.remote.url` từ cấu hình          | URL WebSocket của Gateway.                                                          |
| `--token <token>`     | (không có)                                | Token Gateway nếu cần.                                                              |
| `--password <pass>`   | (không có)                                | Mật khẩu Gateway nếu cần.                                                           |
| `--session <key>`     | `main` (hoặc `global` khi phạm vi là toàn cục) | Khóa phiên. Bên trong không gian làm việc của tác nhân, khóa này tự chọn tác nhân đó trừ khi có tiền tố. |
| `--deliver`           | `false`                                   | Gửi phản hồi của trợ lý qua các kênh đã cấu hình.                                   |
| `--thinking <level>`  | (mặc định của mô hình)                    | Ghi đè mức suy nghĩ.                                                                |
| `--message <text>`    | (không có)                                | Gửi một thông điệp ban đầu sau khi kết nối.                                         |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Thời gian chờ của tác nhân. Giá trị không hợp lệ sẽ ghi cảnh báo và bị bỏ qua.      |
| `--history-limit <n>` | `200`                                     | Số mục lịch sử cần tải khi gắn vào.                                                 |

Bí danh: `openclaw chat` và `openclaw terminal` gọi cùng lệnh với `--local` được ngầm định.

Ghi chú:

- `chat` và `terminal` là bí danh cho `openclaw tui --local`.
- `--local` không thể kết hợp với `--url`, `--token`, hoặc `--password`.
- `tui` phân giải các SecretRefs xác thực gateway đã cấu hình cho xác thực bằng token/mật khẩu khi có thể (nhà cung cấp `env`/`file`/`exec`).
- Khi được khởi chạy từ bên trong thư mục không gian làm việc của tác nhân đã cấu hình, TUI tự chọn tác nhân đó làm mặc định cho khóa phiên (trừ khi `--session` rõ ràng là `agent:<id>:...`).
- Để hiển thị tên máy chủ Gateway ở chân trang cho các kết nối không cục bộ dựa trên URL, chạy `openclaw config set tui.footer.showRemoteHost true`. Nhãn máy chủ tắt theo mặc định và không bao giờ xuất hiện cho kết nối loopback hoặc kết nối cục bộ nhúng.
- Chế độ cục bộ dùng trực tiếp runtime tác nhân nhúng. Hầu hết công cụ cục bộ hoạt động, nhưng các tính năng chỉ có trên Gateway thì không khả dụng.
- Chế độ cục bộ thêm `/auth [provider]` vào bề mặt lệnh TUI.
- Các cổng phê duyệt Plugin vẫn áp dụng trong chế độ cục bộ. Công cụ cần phê duyệt sẽ nhắc đưa ra quyết định trong terminal; không có gì được tự động phê duyệt âm thầm chỉ vì Gateway không tham gia.
- [Mục tiêu](/vi/tools/goal) phiên xuất hiện ở chân trang và có thể được quản lý bằng `/goal`.

## Ví dụ

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Vòng lặp sửa chữa cấu hình

Dùng chế độ cục bộ khi cấu hình hiện tại đã xác thực thành công và bạn muốn tác nhân nhúng kiểm tra cấu hình đó, so sánh với tài liệu, rồi giúp sửa chữa cấu hình từ cùng một terminal:

Nếu `openclaw config validate` đã thất bại, trước tiên hãy dùng `openclaw configure` hoặc `openclaw doctor --fix`. `openclaw chat` không bỏ qua cơ chế chặn cấu hình không hợp lệ.

```bash
openclaw chat
```

Sau đó bên trong TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Áp dụng các bản sửa có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`, rồi chạy lại `openclaw config validate`. Xem [TUI](/vi/web/tui) và [Cấu hình](/vi/cli/config).

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [TUI](/vi/web/tui)
- [Mục tiêu](/vi/tools/goal)

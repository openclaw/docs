---
read_when:
    - Bạn muốn một giao diện người dùng trong terminal cho Gateway (phù hợp với truy cập từ xa)
    - Bạn muốn truyền url/token/session từ các tập lệnh
    - Bạn muốn chạy TUI ở chế độ nhúng cục bộ mà không cần Gateway
    - Bạn muốn sử dụng openclaw chat hoặc openclaw tui --local
summary: Tài liệu tham khảo CLI cho `openclaw tui` (giao diện người dùng terminal được Gateway hỗ trợ hoặc nhúng cục bộ)
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Mở TUI được kết nối với Gateway, hoặc chạy ở chế độ nhúng cục bộ.

Liên quan:

- Hướng dẫn TUI: [TUI](/vi/web/tui)

## Tùy chọn

| Cờ                    | Mặc định                                 | Mô tả                                                                                                  |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--local`             | `false`                                  | Chạy với runtime tác nhân nhúng cục bộ thay vì Gateway.                                                |
| `--url <url>`         | `gateway.remote.url` từ cấu hình         | URL WebSocket của Gateway.                                                                             |
| `--token <token>`     | (không có)                               | Token Gateway nếu bắt buộc.                                                                            |
| `--password <pass>`   | (không có)                               | Mật khẩu Gateway nếu bắt buộc.                                                                         |
| `--session <key>`     | `main` (hoặc `global` khi phạm vi là toàn cục) | Khóa phiên. Bên trong không gian làm việc của tác nhân, nó tự động chọn tác nhân đó trừ khi có tiền tố. |
| `--deliver`           | `false`                                  | Gửi phản hồi của trợ lý qua các kênh đã cấu hình.                                                      |
| `--thinking <level>`  | (mặc định của mô hình)                   | Ghi đè mức suy nghĩ.                                                                                   |
| `--message <text>`    | (không có)                               | Gửi một thông điệp ban đầu sau khi kết nối.                                                            |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`         | Thời gian chờ của tác nhân. Giá trị không hợp lệ sẽ ghi cảnh báo và bị bỏ qua.                         |
| `--history-limit <n>` | `200`                                    | Số mục lịch sử cần tải khi đính kèm.                                                                   |

Bí danh: `openclaw chat` và `openclaw terminal` gọi cùng lệnh với `--local` được ngụ ý.

Ghi chú:

- `chat` và `terminal` là bí danh cho `openclaw tui --local`.
- `--local` không thể kết hợp với `--url`, `--token`, hoặc `--password`.
- `tui` phân giải SecretRefs xác thực gateway đã cấu hình cho xác thực token/mật khẩu khi có thể (nhà cung cấp `env`/`file`/`exec`).
- Khi khởi chạy từ bên trong thư mục không gian làm việc của tác nhân đã cấu hình, TUI tự động chọn tác nhân đó làm mặc định khóa phiên (trừ khi `--session` là `agent:<id>:...` một cách tường minh).
- Chế độ cục bộ dùng trực tiếp runtime tác nhân nhúng. Hầu hết công cụ cục bộ hoạt động, nhưng các tính năng chỉ có trên Gateway sẽ không khả dụng.
- Chế độ cục bộ thêm `/auth [provider]` bên trong bề mặt lệnh TUI.
- Các cổng phê duyệt Plugin vẫn áp dụng trong chế độ cục bộ. Công cụ yêu cầu phê duyệt sẽ nhắc đưa ra quyết định trong terminal; không có gì được tự động phê duyệt âm thầm chỉ vì Gateway không tham gia.

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

Dùng chế độ cục bộ khi cấu hình hiện tại đã xác thực thành công và bạn muốn tác nhân nhúng kiểm tra cấu hình đó, so sánh với tài liệu, rồi giúp sửa chữa từ cùng terminal:

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

- [Tài liệu tham khảo CLI](/vi/cli)
- [TUI](/vi/web/tui)

---
read_when:
    - Bạn muốn giao diện terminal cho Gateway (phù hợp để dùng từ xa)
    - Bạn muốn truyền url/token/session từ các script
    - Bạn muốn chạy TUI ở chế độ nhúng cục bộ mà không cần Gateway
    - Bạn muốn sử dụng openclaw chat hoặc openclaw tui --local
summary: Tài liệu tham chiếu CLI cho `openclaw tui` (giao diện người dùng terminal dựa trên Gateway hoặc được nhúng cục bộ)
title: TUI
x-i18n:
    generated_at: "2026-04-29T22:35:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Mở UI terminal được kết nối với Gateway, hoặc chạy nó ở chế độ nhúng cục bộ.

Liên quan:

- Hướng dẫn TUI: [TUI](/vi/web/tui)

Ghi chú:

- `chat` và `terminal` là alias cho `openclaw tui --local`.
- Không thể kết hợp `--local` với `--url`, `--token`, hoặc `--password`.
- `tui` phân giải SecretRefs xác thực gateway đã cấu hình cho xác thực token/password khi có thể (các provider `env`/`file`/`exec`).
- Khi khởi chạy từ bên trong một thư mục workspace của agent đã cấu hình, TUI tự động chọn agent đó làm mặc định cho khóa phiên (trừ khi `--session` được đặt rõ ràng là `agent:<id>:...`).
- Chế độ cục bộ dùng trực tiếp runtime agent nhúng. Hầu hết công cụ cục bộ hoạt động, nhưng các tính năng chỉ có ở Gateway sẽ không khả dụng.
- Chế độ cục bộ thêm `/auth [provider]` bên trong bề mặt lệnh TUI.
- Các cổng phê duyệt Plugin vẫn áp dụng trong chế độ cục bộ. Những công cụ yêu cầu phê duyệt sẽ nhắc ra quyết định trong terminal; không có gì được tự động phê duyệt âm thầm chỉ vì Gateway không tham gia.

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

Dùng chế độ cục bộ khi cấu hình hiện tại đã xác thực thành công và bạn muốn agent nhúng kiểm tra nó, so sánh với tài liệu, và hỗ trợ sửa chữa nó từ cùng terminal:

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

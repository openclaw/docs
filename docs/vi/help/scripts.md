---
read_when:
    - Chạy các tập lệnh từ kho lưu trữ
    - Thêm hoặc thay đổi các tập lệnh trong ./scripts
summary: 'Các tập lệnh của kho lưu trữ: mục đích, phạm vi và ghi chú an toàn'
title: Tập lệnh
x-i18n:
    generated_at: "2026-04-29T22:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 16
---

Thư mục `scripts/` chứa các tập lệnh hỗ trợ cho quy trình làm việc cục bộ và các tác vụ vận hành.
Dùng chúng khi một tác vụ rõ ràng gắn với một tập lệnh; nếu không, hãy ưu tiên CLI.

## Quy ước

- Các tập lệnh là **tùy chọn** trừ khi được tham chiếu trong tài liệu hoặc danh sách kiểm tra phát hành.
- Ưu tiên các bề mặt CLI khi chúng tồn tại (ví dụ: giám sát xác thực dùng `openclaw models status --check`).
- Giả định các tập lệnh phụ thuộc vào máy chủ; hãy đọc chúng trước khi chạy trên máy mới.

## Tập lệnh giám sát xác thực

Giám sát xác thực được trình bày trong [Xác thực](/vi/gateway/authentication). Các tập lệnh trong `scripts/` là phần bổ sung tùy chọn cho quy trình làm việc điện thoại systemd/Termux.

## Trình trợ giúp đọc GitHub

Dùng `scripts/gh-read` khi bạn muốn `gh` sử dụng mã thông báo cài đặt GitHub App cho các lệnh đọc trong phạm vi repo, đồng thời vẫn để `gh` thông thường dùng đăng nhập cá nhân của bạn cho các thao tác ghi.

Env bắt buộc:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Env tùy chọn:

- `OPENCLAW_GH_READ_INSTALLATION_ID` khi bạn muốn bỏ qua tra cứu cài đặt dựa trên repo
- `OPENCLAW_GH_READ_PERMISSIONS` làm giá trị ghi đè phân tách bằng dấu phẩy cho tập con quyền đọc cần yêu cầu

Thứ tự phân giải repo:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Ví dụ:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Khi thêm tập lệnh

- Giữ tập lệnh tập trung và có tài liệu.
- Thêm một mục ngắn trong tài liệu liên quan (hoặc tạo mục mới nếu còn thiếu).

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử trực tiếp](/vi/help/testing-live)

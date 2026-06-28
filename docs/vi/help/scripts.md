---
read_when:
    - Chạy các tập lệnh từ kho lưu trữ
    - Thêm hoặc thay đổi các tập lệnh trong ./scripts
summary: 'Các script trong kho lưu trữ: mục đích, phạm vi và ghi chú an toàn'
title: Tập lệnh
x-i18n:
    generated_at: "2026-05-06T09:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Thư mục `scripts/` chứa các script trợ giúp cho quy trình làm việc cục bộ và tác vụ vận hành.
Hãy dùng chúng khi một tác vụ rõ ràng gắn với một script; nếu không, hãy ưu tiên CLI.

## Quy ước

- Các script là **không bắt buộc** trừ khi được tham chiếu trong tài liệu hoặc danh sách kiểm tra phát hành.
- Ưu tiên các bề mặt CLI khi chúng tồn tại (ví dụ: giám sát xác thực dùng `openclaw models status --check`).
- Giả định rằng các script phụ thuộc vào từng máy chủ; hãy đọc chúng trước khi chạy trên máy mới.

## Script giám sát xác thực

Giám sát xác thực được đề cập trong [Xác thực](/vi/gateway/authentication). Các script trong `scripts/` là phần bổ sung tùy chọn cho quy trình làm việc systemd/Termux trên điện thoại.

## Trình trợ giúp đọc GitHub

Dùng `scripts/gh-read` khi bạn muốn `gh` sử dụng token cài đặt GitHub App cho các lệnh đọc trong phạm vi repo, đồng thời giữ `gh` thông thường ở trạng thái đăng nhập cá nhân của bạn cho các thao tác ghi.

Biến môi trường bắt buộc:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Biến môi trường tùy chọn:

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

## Khi thêm script

- Giữ script tập trung và có tài liệu.
- Thêm một mục ngắn trong tài liệu liên quan (hoặc tạo mục nếu chưa có).

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử trực tiếp](/vi/help/testing-live)

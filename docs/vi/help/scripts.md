---
read_when:
    - Chạy tập lệnh từ kho mã nguồn
    - Thêm hoặc thay đổi các tập lệnh trong ./scripts
summary: 'Các tập lệnh trong kho mã: mục đích, phạm vi và lưu ý an toàn'
title: Tập lệnh
x-i18n:
    generated_at: "2026-07-12T07:59:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` chứa các tập lệnh hỗ trợ cho quy trình làm việc cục bộ và các tác vụ vận hành. Hãy sử dụng chúng khi tác vụ rõ ràng gắn với một tập lệnh; nếu không, hãy ưu tiên CLI.

## Quy ước

- Các tập lệnh là **không bắt buộc**, trừ khi được đề cập trong tài liệu hoặc danh sách kiểm tra phát hành.
- Ưu tiên các giao diện CLI khi có sẵn (ví dụ: `openclaw models status --check`).
- Giả định rằng các tập lệnh phụ thuộc vào máy chủ; hãy đọc chúng trước khi chạy trên máy mới.

## Các tập lệnh giám sát xác thực

Việc xác thực mô hình nói chung được trình bày trong [Xác thực](/vi/gateway/authentication). Các tập lệnh dưới đây là một hệ thống riêng biệt, không bắt buộc, dùng để giám sát **mã thông báo đăng ký Claude Code CLI** trên máy chủ từ xa/không giao diện và xác thực lại từ điện thoại:

- `scripts/setup-auth-system.sh` - thiết lập một lần: kiểm tra trạng thái xác thực hiện tại, hỗ trợ tạo `claude setup-token` có thời hạn dài và in các bước cài đặt systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - kiểm tra trạng thái xác thực của Claude Code và OpenClaw.
- `scripts/auth-monitor.sh` - thăm dò trạng thái và gửi thông báo (qua chức năng gửi của OpenClaw và/hoặc ntfy.sh) khi mã thông báo sắp hết hạn. Biến môi trường: `WARN_HOURS` (mặc định `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Chạy theo lịch bằng `scripts/systemd/openclaw-auth-monitor.{service,timer}` đi kèm (30 phút một lần).
- `scripts/mobile-reauth.sh` - chạy lại `claude setup-token` và in các URL để mở trên điện thoại, dùng qua SSH từ Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - các tập lệnh Termux:Widget kết nối SSH tới máy chủ, hiển thị thông báo nhanh về trạng thái và mở bảng điều khiển/hướng dẫn xác thực lại khi thông tin xác thực đã hết hạn.

## Trình hỗ trợ đọc GitHub

Sử dụng `scripts/gh-read` khi bạn muốn `gh` dùng mã thông báo cài đặt GitHub App cho các lệnh gọi đọc trong phạm vi kho lưu trữ, đồng thời vẫn giữ `gh` thông thường đăng nhập bằng tài khoản cá nhân của bạn để thực hiện các thao tác ghi.

Các biến môi trường bắt buộc:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Các biến môi trường không bắt buộc:

- `OPENCLAW_GH_READ_INSTALLATION_ID` khi bạn muốn bỏ qua việc tra cứu bản cài đặt dựa trên kho lưu trữ
- `OPENCLAW_GH_READ_PERMISSIONS` làm giá trị ghi đè được phân tách bằng dấu phẩy cho tập hợp con quyền đọc cần yêu cầu

Thứ tự phân giải kho lưu trữ:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Ví dụ:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Khi thêm tập lệnh

- Giữ cho các tập lệnh tập trung vào một mục đích và có tài liệu hướng dẫn.
- Thêm một mục ngắn vào tài liệu liên quan (hoặc tạo tài liệu nếu chưa có).

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử trực tiếp](/vi/help/testing-live)

---
read_when:
    - Đang cập nhật giao diện cài đặt Skills trên macOS
    - Thay đổi cơ chế kiểm soát Skills hoặc hành vi cài đặt
summary: Giao diện cài đặt Skills trên macOS và trạng thái dựa trên Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:42:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

Ứng dụng macOS hiển thị Skills của OpenClaw thông qua Gateway; ứng dụng không phân tích Skills cục bộ.

## Nguồn dữ liệu

- `skills.status` (Gateway) trả về tất cả Skills cùng với tính đủ điều kiện và các yêu cầu còn thiếu
  (bao gồm cả các chặn bằng danh sách cho phép đối với Skills đi kèm).
- Các yêu cầu được suy ra từ `metadata.openclaw.requires` trong mỗi `SKILL.md`.

## Hành động cài đặt

- `metadata.openclaw.install` định nghĩa các tùy chọn cài đặt (brew/node/go/uv).
- Ứng dụng gọi `skills.install` để chạy trình cài đặt trên máy chủ Gateway.
- `security.installPolicy` do người vận hành sở hữu có thể chặn các lượt cài đặt Skills
  được Gateway hỗ trợ trước khi siêu dữ liệu trình cài đặt chạy. Cơ chế chặn mã nguy hiểm
  tích hợp sẵn tại thời điểm cài đặt không phải là một phần của luồng cài đặt Skills.
- Nếu mọi tùy chọn cài đặt đều là `download`, Gateway sẽ hiển thị tất cả lựa chọn
  tải xuống.
- Nếu không, Gateway chọn một trình cài đặt ưu tiên bằng các tùy chọn cài đặt
  hiện tại và các tệp nhị phân trên máy chủ: Homebrew trước khi
  `skills.install.preferBrew` được bật và `brew` tồn tại, sau đó là `uv`, rồi đến
  trình quản lý node được cấu hình từ `skills.install.nodeManager`, rồi các
  phương án dự phòng sau đó như `go` hoặc `download`.
- Nhãn cài đặt Node phản ánh trình quản lý node đã cấu hình, bao gồm cả `yarn`.

## Khóa env/API

- Ứng dụng lưu khóa trong `~/.openclaw/openclaw.json` dưới `skills.entries.<skillKey>`.
- `skills.update` vá `enabled`, `apiKey`, và `env`.

## Chế độ từ xa

- Các bản cập nhật cài đặt và cấu hình diễn ra trên máy chủ Gateway (không phải máy Mac cục bộ).

## Liên quan

- [Skills](/vi/tools/skills)
- [Ứng dụng macOS](/vi/platforms/macos)

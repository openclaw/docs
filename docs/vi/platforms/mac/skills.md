---
read_when:
    - Cập nhật giao diện cài đặt Skills trên macOS
    - Thay đổi cơ chế kiểm soát Skills hoặc hành vi cài đặt
summary: Giao diện cài đặt Skills trên macOS và trạng thái được Gateway hỗ trợ
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-29T22:57:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 16
---

Ứng dụng macOS hiển thị các Skills của OpenClaw thông qua Gateway; ứng dụng không phân tích Skills cục bộ.

## Nguồn dữ liệu

- `skills.status` (Gateway) trả về tất cả Skills cùng với điều kiện đủ dùng và các yêu cầu còn thiếu
  (bao gồm các chặn allowlist cho Skills được đóng gói sẵn).
- Các yêu cầu được suy ra từ `metadata.openclaw.requires` trong mỗi `SKILL.md`.

## Hành động cài đặt

- `metadata.openclaw.install` định nghĩa các tùy chọn cài đặt (brew/node/go/uv).
- Ứng dụng gọi `skills.install` để chạy trình cài đặt trên máy chủ Gateway.
- Các phát hiện dangerous-code tích hợp sẵn ở mức `critical` chặn `skills.install` theo mặc định; các phát hiện đáng ngờ vẫn chỉ cảnh báo. Ghi đè dangerous tồn tại trên yêu cầu Gateway, nhưng luồng ứng dụng mặc định vẫn fail-closed.
- Nếu mọi tùy chọn cài đặt đều là `download`, Gateway hiển thị tất cả
  lựa chọn tải xuống.
- Nếu không, Gateway chọn một trình cài đặt ưu tiên bằng cách dùng các tùy chọn
  cài đặt hiện tại và các binary trên máy chủ: Homebrew trước khi
  `skills.install.preferBrew` được bật và `brew` tồn tại, sau đó là `uv`, rồi đến
  trình quản lý node được cấu hình từ `skills.install.nodeManager`, rồi các
  phương án dự phòng sau đó như `go` hoặc `download`.
- Nhãn cài đặt Node phản ánh trình quản lý node đã cấu hình, bao gồm `yarn`.

## Khóa môi trường/API

- Ứng dụng lưu khóa trong `~/.openclaw/openclaw.json` dưới `skills.entries.<skillKey>`.
- `skills.update` vá `enabled`, `apiKey`, và `env`.

## Chế độ từ xa

- Cài đặt + cập nhật cấu hình diễn ra trên máy chủ Gateway (không phải máy Mac cục bộ).

## Liên quan

- [Skills](/vi/tools/skills)
- [ứng dụng macOS](/vi/platforms/macos)

---
read_when:
    - Cập nhật giao diện cài đặt Skills trên macOS
    - Thay đổi cơ chế kiểm soát hoặc hành vi cài đặt của Skills
summary: Giao diện cài đặt Skills trên macOS và trạng thái do Gateway cung cấp
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T08:05:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

Ứng dụng macOS cung cấp Skills của OpenClaw thông qua Gateway; ứng dụng không phân tích Skills cục bộ.

## Nguồn dữ liệu

- `skills.status` (Gateway) trả về tất cả Skills cùng trạng thái đủ điều kiện và các yêu cầu còn thiếu, bao gồm cả các trường hợp bị danh sách cho phép chặn đối với Skills đi kèm.
- Các yêu cầu lấy từ `metadata.openclaw.requires` trong mỗi tệp `SKILL.md`.

## Thao tác cài đặt

- `metadata.openclaw.install` xác định các tùy chọn cài đặt (brew/node/go/uv/download).
- Ứng dụng gọi `skills.install` để chạy trình cài đặt trên máy chủ Gateway.
- `security.installPolicy` (`enabled`, `targets`, `exec`) do người vận hành quản lý có thể chặn việc cài đặt Skills thông qua Gateway trước khi siêu dữ liệu của trình cài đặt được xử lý. Tính năng quét mã nguy hiểm tích hợp sẵn (được dùng khi cài đặt Plugin) chưa được kết nối với quy trình cài đặt Skills.
- Nếu mọi tùy chọn cài đặt đều là `download`, Gateway sẽ hiển thị tất cả lựa chọn tải xuống.
- Nếu không, Gateway chọn một trình cài đặt ưu tiên dựa trên các tùy chọn cài đặt hiện tại (`skills.install.preferBrew`, `skills.install.nodeManager`) và các tệp thực thi trên máy chủ: ưu tiên Homebrew trước nếu `preferBrew` được bật và có `brew`, sau đó đến `uv`, trình quản lý Node đã cấu hình, rồi lại đến Homebrew nếu khả dụng (ngay cả khi không có `preferBrew`), tiếp theo là `go` và cuối cùng là `download`.
- Nhãn cài đặt Node phản ánh trình quản lý Node đã cấu hình, bao gồm cả `yarn`.

## Biến môi trường/khóa API

- Ứng dụng lưu các khóa trong `~/.openclaw/openclaw.json` tại `skills.entries.<skillKey>`.
- `skills.update` cập nhật một phần các trường `enabled`, `apiKey` và `env`.

## Chế độ từ xa

- Việc cài đặt và cập nhật cấu hình diễn ra trên máy chủ Gateway, không phải trên máy Mac cục bộ.

## Liên quan

- [Skills](/vi/tools/skills)
- [Ứng dụng macOS](/vi/platforms/macos)

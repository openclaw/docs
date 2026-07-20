---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin clickclack
summary: Bổ sung bề mặt kênh Clickclack để gửi và nhận tin nhắn OpenClaw.
title: Plugin Clickclack
x-i18n:
    generated_at: "2026-07-20T04:29:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e59a11826dfc14a7c6945930547804b10e9cb5144d9cdb75657be9f8f4e9129f
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Plugin Clickclack

Thêm bề mặt kênh Clickclack để gửi và nhận tin nhắn OpenClaw.

## Phân phối

- Gói: `@openclaw/clickclack`
- Phương thức cài đặt: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Bề mặt

kênh: `clickclack`

Plugin có thể tùy chọn tạo một kênh ClickClack được đồng bộ hóa theo vòng đời
cho mỗi phiên OpenClaw. Các kênh thảo luận được quản lý sử dụng một phiên phụ
cùng tác tử để quan sát và chuyển tiếp, trong khi phiên chính được đính kèm nhận
một công cụ `discussion` chỉ cho phép kéo dữ liệu. Xem [Thảo luận phiên ClickClack](/vi/channels/clickclack#session-discussions)
để biết các yêu cầu về cấu hình và khả năng hiển thị công cụ phiên.

## Tài liệu liên quan

- [clickclack](/vi/channels/clickclack)

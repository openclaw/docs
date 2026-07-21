---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin clickclack
summary: Bổ sung bề mặt kênh Clickclack để gửi và nhận tin nhắn OpenClaw.
title: Plugin Clickclack
x-i18n:
    generated_at: "2026-07-21T13:33:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fcb39341009946dc38a12cc24496e65fd704ed3f2f9aff44bb2dd29fdedaef26
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Plugin Clickclack

Thêm bề mặt kênh Clickclack để gửi và nhận tin nhắn OpenClaw.

## Phân phối

- Gói: `@openclaw/clickclack`
- Lộ trình cài đặt: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Bề mặt

các kênh: `clickclack`; các hợp đồng: `tools`

<!-- openclaw-plugin-reference:manual-start -->

Plugin có thể tùy chọn tạo một kênh ClickClack được đồng bộ hóa theo vòng đời
cho mỗi phiên OpenClaw. Các kênh thảo luận được quản lý sử dụng một phiên phụ
cùng agent để quan sát và chuyển tiếp, trong khi phiên chính được đính kèm nhận
một công cụ `discussion` chỉ cho phép kéo dữ liệu. Xem [Các cuộc thảo luận trong phiên ClickClack](/vi/channels/clickclack#session-discussions)
để biết các yêu cầu về cấu hình và khả năng hiển thị công cụ phiên.

<!-- openclaw-plugin-reference:manual-end -->

## Tài liệu liên quan

- [clickclack](/vi/channels/clickclack)

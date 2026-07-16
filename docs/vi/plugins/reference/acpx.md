---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin acpx
summary: Phần phụ trợ runtime ACP của OpenClaw với cơ chế quản lý phiên và truyền tải do plugin sở hữu.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T15:35:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Phần phụ trợ thời gian chạy ACP của OpenClaw với cơ chế quản lý phiên và phương thức truyền tải do Plugin sở hữu.

## Phân phối

- Gói: `@openclaw/acpx`
- Phương thức cài đặt: npm; ClawHub

## Bề mặt

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Phiên Pi gốc

Thời gian chạy đi kèm tự động phát hiện kho phiên của Pi trên Gateway và các
Node đã ghép nối. Các phiên được lưu trữ xuất hiện trong nhóm thanh bên phiên **Pi**, với
khả năng duyệt bản chép lời ở chế độ chỉ đọc từ định dạng phiên JSONL được Pi ghi lại trong tài liệu. Danh mục
hỗ trợ các thư mục phiên `settings.json` của dự án và toàn cục, cùng với
`PI_CODING_AGENT_DIR` và `PI_CODING_AGENT_SESSION_DIR`. Các đường dẫn tương đối được phân giải
từ thư mục chứa tệp `settings.json` tương ứng.

Tắt **Danh mục phiên Pi** trong **Cấu hình > Plugin > Thời gian chạy ACPX** để
tắt tính năng khám phá. Tính năng này được bật theo mặc định.

<!-- openclaw-plugin-reference:manual-end -->

## Tài liệu liên quan

- [acpx](/vi/tools/acp-agents-setup)

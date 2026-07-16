---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin opencode
summary: Bổ sung hỗ trợ nhà cung cấp mô hình OpenCode cho OpenClaw.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T14:48:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Bổ sung hỗ trợ nhà cung cấp mô hình OpenCode cho OpenClaw.

## Phân phối

- Gói: `@openclaw/opencode-provider`
- Phương thức cài đặt: được tích hợp trong OpenClaw

## Bề mặt

nhà cung cấp: `opencode`; hợp đồng: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Phiên gốc

OpenClaw tự động phát hiện CLI `opencode` trên Gateway và các node đã ghép nối. Sau đó, các phiên đã lưu
xuất hiện trong nhóm **OpenCode** của thanh bên phiên, cho phép duyệt bản ghi ở chế độ chỉ đọc
thông qua các lệnh chính thức `opencode --pure db ... --format json`
và `opencode --pure export`. Môi trường bị hạn chế và chế độ `--pure`
ngăn việc duyệt danh mục tải các plugin của dự án hoặc kế thừa thông tin xác thực Gateway
không liên quan.

Tắt **OpenCode Session Catalog** trong **Config > Plugins > OpenCode** để
vô hiệu hóa tính năng khám phá. Tính năng này được bật theo mặc định.

<!-- openclaw-plugin-reference:manual-end -->

## Tài liệu liên quan

- [opencode](/vi/providers/opencode)

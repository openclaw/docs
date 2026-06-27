---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin codex-supervisor
summary: Giám sát các phiên app-server Codex từ OpenClaw.
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T17:51:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin Codex Supervisor

Giám sát các phiên app-server Codex từ OpenClaw.

## Phân phối

- Gói: `@openclaw/codex-supervisor`
- Tuyến cài đặt: được bao gồm trong OpenClaw

## Bề mặt

hợp đồng: công cụ

<!-- openclaw-plugin-reference:manual-start -->

## Liệt kê phiên

`codex_sessions_list` mặc định chỉ liệt kê các phiên Codex đã được tải. Đặt `include_stored` để bao gồm lịch sử đã lưu; plugin sử dụng đường dẫn liệt kê chỉ state-DB của app-server Codex và mặc định giới hạn kết quả đã lưu ở 200. Truyền `max_stored_sessions` để giảm hoặc tăng giới hạn đó, tối đa 1000.

<!-- openclaw-plugin-reference:manual-end -->

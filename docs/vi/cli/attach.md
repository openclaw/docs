---
read_when:
    - Bạn muốn Claude Code sử dụng các công cụ MCP của OpenClaw Gateway
    - Bạn cần một quyền cấp MCP tạm thời, gắn với phiên, cho một bộ kiểm thử bên ngoài
summary: Tài liệu tham khảo CLI cho `openclaw attach` (khởi chạy Claude Code với quyền cấp MCP của Gateway có phạm vi giới hạn)
title: Đính kèm CLI
x-i18n:
    generated_at: "2026-07-12T07:48:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` khởi chạy Claude Code với cấu hình MCP tạm thời nghiêm ngặt được liên kết với một phiên Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Tùy chọn:

- `--session <key>` liên kết quyền cấp với một phiên Gateway. Mặc định là phiên chính.
- `--ttl <ms>` yêu cầu TTL dương cho quyền cấp, tính bằng mili giây. Gateway áp dụng giới hạn tối đa riêng.
- `--bin <path>` chọn tệp thực thi Claude Code. Mặc định: `claude`.
- `--print-config` ghi tệp `.mcp.json` tạm thời, in lệnh khởi chạy và các biến môi trường, đồng thời duy trì quyền cấp cho đến khi TTL hết hạn (tùy chọn này không khởi chạy Claude Code hoặc thu hồi quyền cấp).

Mã thông báo bearer được truyền qua các biến môi trường, không phải argv. OpenClaw khởi chạy Claude Code với `--strict-mcp-config --mcp-config <path>` để các máy chủ Claude MCP có sẵn trong môi trường không tham gia phiên được đính kèm. Các lần khởi chạy thông thường (không có `--print-config`) sẽ thu hồi quyền cấp khi tiến trình Claude Code thoát.

Xem thêm: [CLI Gateway](/vi/cli/gateway), [CLI MCP](/vi/cli/mcp) và [CLI ACP](/vi/cli/acp).

---
read_when:
    - Bạn muốn Claude Code sử dụng các công cụ MCP của OpenClaw Gateway
    - Bạn cần một quyền cấp MCP tạm thời, ràng buộc theo phiên cho một harness bên ngoài
summary: Tham chiếu CLI cho `openclaw attach` (khởi chạy Claude Code với quyền cấp Gateway MCP có phạm vi)
title: Đính kèm CLI
x-i18n:
    generated_at: "2026-07-02T01:01:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` khởi chạy Claude Code với một cấu hình MCP tạm thời nghiêm ngặt được liên kết
với một phiên Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Tùy chọn:

- `--session <key>` liên kết quyền cấp với một phiên Gateway. Mặc định là phiên chính.
- `--ttl <ms>` yêu cầu TTL quyền cấp dương tính bằng mili giây. Gateway áp dụng mức trần riêng.
- `--bin <path>` chọn tệp nhị phân Claude Code. Mặc định là `claude`.
- `--print-config` ghi `.mcp.json` tạm thời, in lệnh khởi chạy và env, đồng thời giữ quyền cấp còn hiệu lực cho đến khi TTL hết hạn.

Token bearer được truyền qua biến môi trường, không phải argv. OpenClaw
khởi chạy Claude Code với `--strict-mcp-config --mcp-config <path>` để các
máy chủ Claude MCP trong môi trường không tham gia phiên đã gắn. Các lần khởi chạy thông thường thu hồi
quyền cấp khi tiến trình Claude Code thoát.

Xem thêm: [Gateway CLI](/vi/cli/gateway), [MCP CLI](/vi/cli/mcp), và [ACP CLI](/vi/cli/acp).

---
read_when:
    - می‌خواهید Claude Code از ابزارهای OpenClaw Gateway MCP استفاده کند
    - برای یک هارنس خارجی به یک مجوز موقت MCP وابسته به جلسه نیاز دارید
summary: مرجع CLI برای `openclaw attach` (اجرای Claude Code با اعطای محدود Gateway MCP)
title: اتصال CLI
x-i18n:
    generated_at: "2026-07-02T01:06:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach`، Claude Code را با یک پیکربندی موقت و سخت‌گیرانه MCP راه‌اندازی می‌کند که
به یک نشست Gateway متصل است.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

گزینه‌ها:

- `--session <key>` مجوز را به یک نشست Gateway متصل می‌کند. پیش‌فرض، نشست اصلی است.
- `--ttl <ms>` یک TTL مثبت برای مجوز، بر حسب میلی‌ثانیه، درخواست می‌کند. Gateway سقف خودش را اعمال می‌کند.
- `--bin <path>` باینری Claude Code را انتخاب می‌کند. پیش‌فرض `claude` است.
- `--print-config` فایل موقت `.mcp.json` را می‌نویسد، فرمان راه‌اندازی و env را چاپ می‌کند، و مجوز را تا پایان TTL فعال نگه می‌دارد.

توکن Bearer از طریق متغیرهای محیطی ارسال می‌شود، نه argv. OpenClaw
Claude Code را با `--strict-mcp-config --mcp-config <path>` راه‌اندازی می‌کند تا سرورهای محیطی
Claude MCP به نشست متصل‌شده نپیوندند. راه‌اندازی‌های عادی، هنگام خروج فرایند
Claude Code، مجوز را لغو می‌کنند.

همچنین ببینید: [CLI Gateway](/fa/cli/gateway)، [CLI MCP](/fa/cli/mcp)، و [CLI ACP](/fa/cli/acp).

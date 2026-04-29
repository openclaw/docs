---
read_when:
    - برای اشکال‌زدایی، باید ترافیک انتقال OpenClaw را به‌صورت محلی ضبط کنید
    - می‌خواهید نشست‌های پراکسی اشکال‌زدایی، بلاب‌ها یا پیش‌تنظیم‌های داخلی پرس‌وجو را بررسی کنید
summary: مرجع CLI برای `openclaw proxy`، پراکسی اشکال‌زدایی محلی و بازرس ضبط
title: پراکسی
x-i18n:
    generated_at: "2026-04-29T22:38:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

پروکسی اشکال‌زدایی صریح محلی را اجرا کنید و ترافیک ضبط‌شده را بررسی کنید.

این یک فرمان اشکال‌زدایی برای بررسی در سطح انتقال است. می‌تواند یک
پروکسی محلی را شروع کند، یک فرمان فرزند را با ضبط فعال اجرا کند، نشست‌های ضبط را فهرست کند،
الگوهای رایج ترافیک را پرس‌وجو کند، blobهای ضبط‌شده را بخواند، و داده‌های ضبط
محلی را پاک‌سازی کند.

## فرمان‌ها

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## پیش‌تنظیم‌های پرس‌وجو

`openclaw proxy query --preset <name>` این موارد را می‌پذیرد:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## نکته‌ها

- `start` به‌صورت پیش‌فرض از `127.0.0.1` استفاده می‌کند، مگر اینکه `--host` تنظیم شده باشد.
- `run` یک پروکسی اشکال‌زدایی محلی را شروع می‌کند و سپس فرمان پس از `--` را اجرا می‌کند.
- ضبط‌ها داده‌های اشکال‌زدایی محلی هستند؛ پس از پایان کار از `openclaw proxy purge` استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [احراز هویت پروکسی مورداعتماد](/fa/gateway/trusted-proxy-auth)

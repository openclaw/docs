---
read_when:
    - می‌خواهید مستندات زندهٔ OpenClaw را از ترمینال جست‌وجو کنید
summary: مرجع CLI برای `openclaw docs` (جست‌وجو در نمایهٔ مستندات زنده)
title: مستندات
x-i18n:
    generated_at: "2026-04-29T22:35:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

در فهرست زندهٔ مستندات جست‌وجو کنید.

آرگومان‌ها:

- `[query...]`: عبارت‌های جست‌وجو برای ارسال به فهرست زندهٔ مستندات

نمونه‌ها:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

نکته‌ها:

- بدون پرس‌وجو، `openclaw docs` نقطهٔ ورود جست‌وجوی مستندات زنده را باز می‌کند.
- پرس‌وجوهای چندکلمه‌ای به‌صورت یک درخواست جست‌وجوی واحد ارسال می‌شوند.

## مرتبط

- [مرجع CLI](/fa/cli)

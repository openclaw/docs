---
read_when:
    - در حال نصب، پیکربندی یا ممیزی Plugin acpx هستید
summary: بک‌اند زمان اجرای ACP در OpenClaw با مدیریت نشست و انتقال تحت مالکیت Plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T17:25:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

بک‌اند زمان‌اجرای ACP در OpenClaw با مدیریت نشست و انتقال تحت مالکیت Plugin.

## توزیع

- بسته: `@openclaw/acpx`
- مسیر نصب: npm؛ ClawHub

## سطح

Skills

<!-- openclaw-plugin-reference:manual-start -->

## نشست‌های بومی Pi

زمان‌اجرای همراه، مخزن نشست Pi را در Gateway و Nodeهای جفت‌شده به‌طور خودکار شناسایی می‌کند. نشست‌های ذخیره‌شده در گروه نوار کناری نشست‌های **Pi** ظاهر می‌شوند و امکان مرور فقط‌خواندنی رونوشت‌ها از قالب مستندشده نشست JSONL در Pi فراهم است. کاتالوگ، دایرکتوری‌های نشست پروژه و سراسری `settings.json` به‌علاوه
`PI_CODING_AGENT_DIR` و `PI_CODING_AGENT_SESSION_DIR` را در نظر می‌گیرد. مسیرهای نسبی
از دایرکتوری حاوی فایل `settings.json` آن‌ها حل می‌شوند.

برای غیرفعال‌کردن شناسایی، **Pi Session Catalog** را در **Config > Plugins > ACPX Runtime** خاموش کنید. این گزینه به‌طور پیش‌فرض فعال است.

<!-- openclaw-plugin-reference:manual-end -->

## مستندات مرتبط

- [acpx](/fa/tools/acp-agents-setup)

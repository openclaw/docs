---
read_when:
    - راه‌اندازی اولیهٔ یک فضای کاری به‌صورت دستی
summary: قالب فضای کاری برای TOOLS.md
title: الگوی TOOLS.md
x-i18n:
    generated_at: "2026-04-29T23:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - یادداشت‌های محلی

Skills تعریف می‌کند ابزارها _چگونه_ کار می‌کنند. این فایل برای جزئیات _شما_ است — چیزهایی که مختص تنظیمات شما هستند.

## چه چیزهایی اینجا قرار می‌گیرند

مواردی مانند:

- نام‌ها و مکان‌های دوربین‌ها
- میزبان‌ها و نام‌های مستعار SSH
- صداهای ترجیحی برای TTS
- نام‌های بلندگو/اتاق
- نام‌های مستعار دستگاه‌ها
- هر چیز وابسته به محیط

## نمونه‌ها

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## چرا جداگانه؟

Skills مشترک هستند. تنظیمات شما متعلق به خودتان است. جدا نگه داشتن آن‌ها یعنی می‌توانید Skills را بدون از دست دادن یادداشت‌هایتان به‌روزرسانی کنید، و Skills را بدون افشای زیرساخت خود به اشتراک بگذارید.

---

هر چیزی را که به انجام کارتان کمک می‌کند اضافه کنید. این برگه تقلب شماست.

## مرتبط

- [فضای کاری عامل](/fa/concepts/agent-workspace)

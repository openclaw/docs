---
read_when:
    - انتشار روح‌ها
    - عیب‌یابی شکست‌های انتشار soul
summary: قالب بستهٔ Soul، فایل‌های موردنیاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-05-12T00:58:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# قالب Soul

## روی دیسک

یک Soul یک فایل واحد است:

- `SOUL.md` (یا `soul.md`)

فعلاً، onlycrabs.ai هر فایل اضافی را رد می‌کند.

## `SOUL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، metadata را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصهٔ Soul در UI/جست‌وجو استفاده می‌شود.

## محدودیت‌ها

- اندازهٔ کل bundle: 50MB.
- متن embedding فقط شامل `SOUL.md` است.

## Slugها

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شوند.
- باید با حروف کوچک و برای URL ایمن باشند: `^[a-z0-9][a-z0-9-]*$`.

## نسخه‌بندی + تگ‌ها

- هر انتشار یک نسخهٔ جدید ایجاد می‌کند (semver).
- تگ‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

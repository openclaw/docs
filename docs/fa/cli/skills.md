---
read_when:
    - می‌خواهید ببینید کدام Skills در دسترس و آمادهٔ اجرا هستند
    - می‌خواهید Skills را از ClawHub جست‌وجو، نصب یا به‌روزرسانی کنید
    - می‌خواهید نبودِ باینری‌ها/محیط/پیکربندی برای Skills را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-29T22:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Skills محلی را بررسی کنید و Skills را از ClawHub نصب/به‌روزرسانی کنید.

مرتبط:

- سیستم Skills: [Skills](/fa/tools/skills)
- پیکربندی Skills: [پیکربندی Skills](/fa/tools/skills-config)
- نصب‌های ClawHub: [ClawHub](/fa/tools/clawhub)

## دستورها

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` مستقیماً از ClawHub استفاده می‌کنند و در دایرکتوری `skills/` فضای کاری فعال نصب می‌کنند. `list`/`info`/`check` همچنان Skills محلیِ قابل مشاهده برای فضای کاری و پیکربندی فعلی را بررسی می‌کنند. دستورهای مبتنی بر فضای کاری، فضای کاری هدف را ابتدا از `--agent <id>`، سپس از دایرکتوری کاری فعلی وقتی داخل یک فضای کاری عاملِ پیکربندی‌شده باشد، و سپس از عامل پیش‌فرض تعیین می‌کنند.

این دستور `install` در CLI پوشه‌های skill را از ClawHub دانلود می‌کند. نصب‌های وابستگی skill که از طریق Gateway و از onboarding یا تنظیمات Skills فعال می‌شوند، به‌جای آن از مسیر درخواست جداگانه `skills.install` استفاده می‌کنند.

نکته‌ها:

- `search [query...]` یک کوئری اختیاری می‌پذیرد؛ برای مرور فید جستجوی پیش‌فرض ClawHub آن را حذف کنید.
- `search --limit <n>` تعداد نتایج بازگردانده‌شده را محدود می‌کند.
- `install --force` پوشه skill موجود در فضای کاری را برای همان slug بازنویسی می‌کند.
- `--agent <id>` یک فضای کاری عاملِ پیکربندی‌شده را هدف قرار می‌دهد و استنتاج از دایرکتوری کاری فعلی را لغو می‌کند.
- `update --all` فقط نصب‌های ClawHub رهگیری‌شده در فضای کاری فعال را به‌روزرسانی می‌کند.
- وقتی هیچ زیردستوری ارائه نشود، `list` عمل پیش‌فرض است.
- `list`، `info` و `check` خروجی رندرشده خود را در stdout می‌نویسند. با `--json`، یعنی payload قابل خواندن برای ماشین برای pipeها و اسکریپت‌ها روی stdout باقی می‌ماند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Skills](/fa/tools/skills)

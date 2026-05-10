---
read_when:
    - می‌خواهید ببینید کدام Skills در دسترس‌اند و آمادهٔ اجرا هستند
    - می‌خواهید Skills را از ClawHub جست‌وجو، نصب یا به‌روزرسانی کنید
    - می‌خواهید باینری‌ها/محیط/پیکربندیِ مفقود برای Skills را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:34:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Skills محلی را بررسی کنید و Skills را از ClawHub نصب/به‌روزرسانی کنید.

مرتبط:

- سیستم Skills: [Skills](/fa/tools/skills)
- پیکربندی Skills: [پیکربندی Skills](/fa/tools/skills-config)
- نصب‌های ClawHub: [ClawHub](/fa/clawhub/cli)

## فرمان‌ها

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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` مستقیماً از ClawHub استفاده می‌کنند و در دایرکتوری
`skills/` فضای کاری فعال نصب می‌شوند. `list`/`info`/`check` همچنان Skills
محلیِ قابل مشاهده برای فضای کاری و پیکربندی فعلی را بررسی می‌کنند. فرمان‌های
متکی بر فضای کاری، فضای کاری هدف را ابتدا از `--agent <id>`، سپس از دایرکتوری
کاری فعلی وقتی داخل یک فضای کاری عاملِ پیکربندی‌شده باشد، و سپس از عامل
پیش‌فرض تشخیص می‌دهند.

این فرمان `install` در CLI پوشه‌های Skill را از ClawHub دانلود می‌کند. نصب‌های
وابستگی Skill مبتنی بر Gateway که از راه‌اندازی اولیه یا تنظیمات Skills آغاز
می‌شوند، به‌جای آن از مسیر درخواست جداگانهٔ `skills.install` استفاده می‌کنند.

نکته‌ها:

- `search [query...]` یک پرس‌وجوی اختیاری می‌پذیرد؛ برای مرور خوراک جست‌وجوی
  پیش‌فرض ClawHub آن را حذف کنید.
- `search --limit <n>` تعداد نتایج بازگردانده‌شده را محدود می‌کند.
- `install --force` پوشهٔ Skill موجود در فضای کاری را برای همان slug بازنویسی
  می‌کند.
- `--agent <id>` یک فضای کاری عاملِ پیکربندی‌شده را هدف می‌گیرد و تشخیص بر اساس
  دایرکتوری کاری فعلی را نادیده می‌گیرد.
- `update --all` فقط نصب‌های ردیابی‌شدهٔ ClawHub را در فضای کاری فعال
  به‌روزرسانی می‌کند.
- `check --agent <id>` فضای کاری عامل انتخاب‌شده را بررسی می‌کند و گزارش می‌دهد
  کدام Skills آماده واقعاً برای prompt یا سطح فرمان آن عامل قابل مشاهده‌اند.
- وقتی هیچ زیرفرمانی ارائه نشود، `list` اقدام پیش‌فرض است.
- `list`، `info` و `check` خروجی رندرشدهٔ خود را در stdout می‌نویسند. با
  `--json`، این یعنی payload قابل خواندن برای ماشین برای pipeها و اسکریپت‌ها
  روی stdout باقی می‌ماند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Skills](/fa/tools/skills)

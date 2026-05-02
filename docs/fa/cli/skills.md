---
read_when:
    - می‌خواهید ببینید کدام Skills در دسترس و آماده اجرا هستند
    - می‌خواهید Skills را از ClawHub جست‌وجو، نصب یا به‌روزرسانی کنید
    - می‌خواهید باینری‌ها/محیط/پیکربندیِ مفقود برای Skills را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:42:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Skills محلی را بررسی کنید و Skills را از ClawHub نصب/به‌روزرسانی کنید.

مرتبط:

- سامانه Skills: [Skills](/fa/tools/skills)
- پیکربندی Skills: [Skills config](/fa/tools/skills-config)
- نصب‌های ClawHub: [ClawHub](/fa/tools/clawhub)

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

`search`/`install`/`update` مستقیماً از ClawHub استفاده می‌کنند و در پوشه
`skills/` فضای کاری فعال نصب می‌کنند. `list`/`info`/`check` همچنان Skills
محلیِ قابل مشاهده برای فضای کاری و پیکربندی فعلی را بررسی می‌کنند. فرمان‌های
متکی به فضای کاری، فضای کاری هدف را ابتدا از `--agent <id>`، سپس وقتی مسیر
کاری فعلی داخل یک فضای کاری عامل پیکربندی‌شده باشد از مسیر کاری فعلی، و سپس از
عامل پیش‌فرض تعیین می‌کنند.

این فرمان `install` در CLI پوشه‌های Skills را از ClawHub دانلود می‌کند. نصب
وابستگی‌های Skills که از طریق Gateway و از onboarding یا تنظیمات Skills راه‌اندازی
می‌شوند، در عوض از مسیر درخواست جداگانه `skills.install` استفاده می‌کنند.

نکته‌ها:

- `search [query...]` یک پرس‌وجوی اختیاری می‌پذیرد؛ برای مرور خوراک جست‌وجوی
  پیش‌فرض ClawHub آن را حذف کنید.
- `search --limit <n>` تعداد نتایج برگشتی را محدود می‌کند.
- `install --force` پوشه موجودِ Skill در فضای کاری را برای همان slug بازنویسی
  می‌کند.
- `--agent <id>` یک فضای کاری عامل پیکربندی‌شده را هدف می‌گیرد و استنتاج از
  مسیر کاری فعلی را نادیده می‌گیرد.
- `update --all` فقط نصب‌های ردیابی‌شده ClawHub را در فضای کاری فعال به‌روزرسانی
  می‌کند.
- `check --agent <id>` فضای کاری عامل انتخاب‌شده را بررسی می‌کند و گزارش می‌دهد
  کدام Skills آماده واقعاً برای prompt یا سطح فرمان آن عامل قابل مشاهده‌اند.
- وقتی هیچ زیرفرمانی ارائه نشود، `list` کنش پیش‌فرض است.
- `list`، `info` و `check` خروجی رندرشده خود را در stdout می‌نویسند. با `--json`،
  یعنی payload قابل خواندن برای ماشین برای pipeها و اسکریپت‌ها روی stdout می‌ماند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Skills](/fa/tools/skills)

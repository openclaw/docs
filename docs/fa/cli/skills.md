---
read_when:
    - می‌خواهید ببینید کدام Skills در دسترس و آمادهٔ اجرا هستند
    - می‌خواهید ClawHub را جست‌وجو کنید یا Skills را از ClawHub، Git، یا دایرکتوری‌های محلی نصب کنید
    - می‌خواهید یک مهارت ClawHub را با ClawHub تأیید کنید
    - می‌خواهید باینری‌ها/env/config مفقود برای Skills را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:29:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Skills محلی را بررسی کنید، در ClawHub جست‌وجو کنید، Skills را از دایرکتوری‌های ClawHub/Git/محلی نصب کنید، Skills مربوط به ClawHub را تأیید کنید، و نصب‌های ردیابی‌شده توسط ClawHub را به‌روزرسانی کنید.

مرتبط:

- سامانه Skills: [Skills](/fa/tools/skills)
- کارگاه Skill: [کارگاه Skill](/fa/tools/skill-workshop)
- پیکربندی Skills: [پیکربندی Skills](/fa/tools/skills-config)
- نصب‌های ClawHub: [ClawHub](/fa/clawhub/cli)

## فرمان‌ها

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
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
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`، `update`، و `verify` مستقیماً از ClawHub استفاده می‌کنند. `install @owner/<slug>` یک Skill از ClawHub نصب می‌کند، `install git:owner/repo[@ref]` یک Skill از Git را کلون می‌کند، و `install ./path` یک دایرکتوری Skill محلی را کپی می‌کند. به‌طور پیش‌فرض، `install`، `update`، و `verify` دایرکتوری `skills/` در فضای کاری فعال را هدف می‌گیرند؛ با `--global`، دایرکتوری Skills مدیریت‌شده و مشترک را هدف می‌گیرند. `list`/`info`/`check` همچنان Skills محلی قابل مشاهده برای فضای کاری و پیکربندی فعلی را بررسی می‌کنند. فرمان‌های پشتیبانی‌شده با فضای کاری، فضای کاری هدف را از `--agent <id>` تشخیص می‌دهند، سپس از دایرکتوری کاری فعلی وقتی داخل یک فضای کاری عامل پیکربندی‌شده باشد، و سپس از عامل پیش‌فرض.

نصب‌های Git و دایرکتوری محلی انتظار دارند `SKILL.md` در ریشه منبع باشد. slug نصب وقتی معتبر باشد از `name` در frontmatter فایل `SKILL.md` می‌آید، سپس از نام دایرکتوری منبع یا مخزن؛ برای بازنویسی آن از `--as <slug>` استفاده کنید. `--version` فقط برای ClawHub است. نصب‌های Skill از مشخصات بسته npm یا مسیرهای zip/archive پشتیبانی نمی‌کنند، و `openclaw skills update` فقط نصب‌های ردیابی‌شده توسط ClawHub را به‌روزرسانی می‌کند.

نصب‌های وابستگی Skill با پشتیبانی Gateway که از راه‌اندازی اولیه یا تنظیمات Skills فعال می‌شوند، به‌جای آن از مسیر درخواست جداگانه `skills.install` استفاده می‌کنند.

نکته‌ها:

- `search [query...]` یک پرس‌وجوی اختیاری می‌پذیرد؛ برای مرور خوراک جست‌وجوی پیش‌فرض ClawHub آن را حذف کنید.
- `search --limit <n>` نتایج برگشتی را محدود می‌کند.
- `install git:owner/repo[@ref]` یک Skill از Git نصب می‌کند. ارجاع‌های شاخه می‌توانند شامل اسلش باشند، مانند `git:owner/repo@feature/foo`.
- `install ./path/to/skill` یک دایرکتوری محلی را نصب می‌کند که ریشه آن شامل `SKILL.md` است.
- `install --as <slug>` مقدار slug استنباط‌شده برای نصب‌های Git و دایرکتوری محلی را بازنویسی می‌کند.
- `install --version <version>` فقط برای ارجاع‌های Skill در ClawHub اعمال می‌شود.
- `install --force` پوشه Skill موجود در فضای کاری را برای همان slug بازنویسی می‌کند.
- نصب‌ها و به‌روزرسانی‌های Skill جامعه در ClawHub پیش از دانلود، اعتماد را بررسی می‌کنند. انتشارهای آرشیوی نسخه‌دار جامعه از فراداده اعتمادِ انتشار دقیق استفاده می‌کنند. Skills مربوط به GitHub با پشتیبانی resolver به resolver نصب ClawHub متکی هستند تا پیش از برگرداندن یک commit سنجاق‌شده، سیاست اسکن و نصب اجباری را اعمال کند. انتشارهای مخرب یا مسدودشده جامعه رد می‌شوند. انتشارهای پرریسک جامعه زمانی که یک فرمان غیرتعاملی باید پس از آن بازبینی ادامه یابد، به بازبینی و `--acknowledge-clawhub-risk` نیاز دارند. ناشران رسمی Skill در ClawHub و منابع Skill همراه OpenClaw از این اعلان اعتماد انتشار عبور می‌کنند.
- `--global` دایرکتوری Skills مدیریت‌شده و مشترک را هدف می‌گیرد و نمی‌تواند با `--agent <id>` ترکیب شود.
- `--agent <id>` یک فضای کاری عامل پیکربندی‌شده را هدف می‌گیرد و استنباط از دایرکتوری کاری فعلی را بازنویسی می‌کند.
- `update @owner/<slug>` یک Skill ردیابی‌شده را به‌روزرسانی می‌کند. برای هدف گرفتن دایرکتوری Skills مدیریت‌شده و مشترک به‌جای فضای کاری، `--global` را اضافه کنید.
- `update --all` نصب‌های ردیابی‌شده ClawHub را در فضای کاری انتخاب‌شده، یا در صورت ترکیب با `--global` در دایرکتوری Skills مدیریت‌شده و مشترک، به‌روزرسانی می‌کند.
- `verify @owner/<slug>` به‌طور پیش‌فرض پوش JSON با نام `clawhub.skill.verify.v1` از ClawHub را چاپ می‌کند. پرچم `--json` وجود ندارد چون JSON از قبل پیش‌فرض است. slugهای بدون مالک برای سازگاری همچنان پذیرفته می‌شوند وقتی Skill از قبل نصب شده یا بدون ابهام باشد، اما ارجاع‌های همراه با مالک از ابهام ناشر جلوگیری می‌کنند.
- وقتی ClawHub منشأ منبعِ حل‌شده توسط سرور را برمی‌گرداند، JSON تأیید همچنین شامل `openclaw.verifiedSourceUrl` سنجاق‌شده به commit است. URLهای منبع ناموجود یا خوداظهارشده فقط در پوش منشأ خام باقی می‌مانند و ارتقا داده نمی‌شوند.
- `verify` برای Skills نصب‌شده از ClawHub از `.clawhub/origin.json` استفاده می‌کند، بنابراین نسخه نصب‌شده را در برابر رجیستری‌ای که از آن آمده تأیید می‌کند. `--version` و `--tag` انتخابگر نسخه را بازنویسی می‌کنند اما وقتی فراداده origin وجود داشته باشد، همان رجیستری نصب‌شده را نگه می‌دارند.
- `verify --card` به‌جای JSON، Markdown تولیدشده Skill Card را چاپ می‌کند. فرمان زمانی با کد غیرصفر خارج می‌شود که ClawHub مقدار `ok: false` یا `decision: "fail"` برگرداند؛ امضاهای امضانشده تا زمانی که سیاست ClawHub تغییر نکند، اطلاع‌رسانی هستند.
- بسته‌های نصب‌شده ClawHub می‌توانند شامل `skill-card.md` تولیدشده باشند. OpenClaw تأیید را تصمیم سرور ClawHub تلقی می‌کند و یک Skill نصب‌شده را صرفاً به این دلیل که آن کارت تولیدشده اثرانگشت بسته را تغییر می‌دهد رد نمی‌کند.
- `check --agent <id>` فضای کاری عامل انتخاب‌شده را بررسی می‌کند و گزارش می‌دهد کدام Skills آماده واقعاً برای prompt یا سطح فرمان آن عامل قابل مشاهده هستند.
- `list` وقتی هیچ زیرفرمانی ارائه نشود، اقدام پیش‌فرض است.
- `list`، `info`، و `check` خروجی رندرشده خود را در stdout می‌نویسند. با `--json`، یعنی payload قابل خواندن برای ماشین برای pipeها و اسکریپت‌ها روی stdout باقی می‌ماند.

## کارگاه Skill

`openclaw skills workshop` پیشنهادهای در انتظار Skill را در فضای کاری انتخاب‌شده مدیریت می‌کند. پیشنهادها تا زمانی که اعمال نشوند Skills فعال نیستند. برای ذخیره‌سازی پیشنهاد، محافظت‌های فایل پشتیبان، روش‌های Gateway، و سیاست تأیید، [کارگاه Skill](/fa/tools/skill-workshop) را ببینید.

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Skills](/fa/tools/skills)

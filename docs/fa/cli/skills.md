---
read_when:
    - می‌خواهید ببینید کدام Skills در دسترس و آماده اجرا هستند
    - می‌خواهید در ClawHub جست‌وجو کنید یا Skills را از ClawHub، Git یا پوشه‌های محلی نصب کنید
    - می‌خواهید یک Skill در ClawHub را با ClawHub تأیید کنید
    - می‌خواهید نبود فایل‌های اجرایی/متغیرهای محیطی/پیکربندی برای Skills را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw skills` (جست‌وجو/نصب/به‌روزرسانی/تأیید/فهرست/اطلاعات/بررسی/کارگاه)
title: Skills
x-i18n:
    generated_at: "2026-07-12T09:54:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Skills محلی را بررسی کنید، در ClawHub جست‌وجو کنید، Skills را از ClawHub، Git یا پوشه‌های محلی نصب کنید، Skills موجود در ClawHub را اعتبارسنجی کنید و نصب‌های ردیابی‌شده توسط ClawHub را به‌روزرسانی کنید.

مطالب مرتبط:

- سامانهٔ Skills: [Skills](/fa/tools/skills)
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
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
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

`search`، `update` و `verify` مستقیماً از ClawHub استفاده می‌کنند. `install @owner/<slug>` یک Skill از ClawHub نصب می‌کند، `install git:owner/repo[@ref]` یک Skill از Git را کلون می‌کند و `install ./path` یک پوشهٔ Skill محلی را کپی می‌کند. به‌طور پیش‌فرض، مقصد `install`، `update` و `verify` پوشهٔ `skills/` فضای کاری فعال است؛ با `--global`، مقصد آن‌ها پوشهٔ مدیریت‌شده و اشتراکی Skills خواهد بود. `list`/`info`/`check` همچنان Skills محلی قابل مشاهده برای فضای کاری و پیکربندی فعلی را بررسی می‌کنند. فرمان‌های مبتنی بر فضای کاری، فضای کاری مقصد را ابتدا از `--agent <id>`، سپس از پوشهٔ کاری فعلی در صورتی که داخل فضای کاری پیکربندی‌شدهٔ یک عامل باشد، و در نهایت از عامل پیش‌فرض تعیین می‌کنند.

نصب از Git و پوشهٔ محلی انتظار دارد `SKILL.md` در ریشهٔ منبع قرار داشته باشد. نامک نصب ابتدا، در صورت معتبر بودن، از مقدار `name` در فرانت‌متر `SKILL.md` و سپس از نام پوشهٔ منبع یا مخزن گرفته می‌شود؛ برای بازنویسی آن از `--as <slug>` استفاده کنید. `--version` فقط مخصوص ClawHub است. نصب Skill از مشخصات بستهٔ npm یا مسیرهای zip/بایگانی پشتیبانی نمی‌کند و `openclaw skills update` فقط نصب‌های ردیابی‌شده توسط ClawHub را به‌روزرسانی می‌کند.

نصب وابستگی‌های Skill با پشتوانهٔ Gateway که از فرایند راه‌اندازی اولیه یا تنظیمات Skills آغاز می‌شود، در عوض از مسیر درخواست جداگانهٔ `skills.install` استفاده می‌کند.

نکات:

| پرچم/رفتار                       | توضیحات                                                                                                                                                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | پرس‌وجوی اختیاری؛ برای مرور خوراک جست‌وجوی پیش‌فرض ClawHub آن را حذف کنید.                                                                                                                                                                                                    |
| `search --limit <n>`             | تعداد نتایج بازگردانده‌شده را محدود می‌کند.                                                                                                                                                                                                                                  |
| `install git:owner/repo[@ref]`   | یک Skill از Git نصب می‌کند. ارجاع‌های شاخه می‌توانند شامل ممیز مورب باشند، مانند `git:owner/repo@feature/foo`.                                                                                                                                                                |
| `install ./path/to/skill`        | پوشه‌ای محلی را نصب می‌کند که ریشهٔ آن حاوی `SKILL.md` است.                                                                                                                                                                                                                   |
| `install --as <slug>`            | نامک استنباط‌شده برای نصب از Git و پوشهٔ محلی را بازنویسی می‌کند.                                                                                                                                                                                                             |
| `install --version <version>`    | فقط برای ارجاع‌های Skill در ClawHub اعمال می‌شود.                                                                                                                                                                                                                             |
| `install --force`                | پوشهٔ Skill موجود در فضای کاری را برای همان نامک بازنویسی می‌کند.                                                                                                                                                                                                             |
| `install/update --force-install` | یک Skill معلق مبتنی بر GitHub در ClawHub را پیش از تکمیل اسکن ClawHub نصب می‌کند.                                                                                                                                                                                            |
| `--global`                       | پوشهٔ مدیریت‌شده و اشتراکی Skills را هدف می‌گیرد؛ نمی‌توان آن را با `--agent <id>` ترکیب کرد.                                                                                                                                                                                 |
| `--agent <id>`                   | یک فضای کاری پیکربندی‌شدهٔ عامل را هدف می‌گیرد و استنباط از پوشهٔ کاری فعلی را بازنویسی می‌کند.                                                                                                                                                                               |
| `update @owner/<slug>`           | یک Skill ردیابی‌شده را به‌روزرسانی می‌کند. برای هدف‌گرفتن پوشهٔ مدیریت‌شده و اشتراکی Skills به‌جای فضای کاری، `--global` را اضافه کنید.                                                                                                                                         |
| `update --all`                   | نصب‌های ردیابی‌شدهٔ ClawHub را در فضای کاری انتخاب‌شده، یا با `--global` در پوشهٔ مدیریت‌شده و اشتراکی Skills، به‌روزرسانی می‌کند.                                                                                                                                             |
| `verify @owner/<slug>`           | به‌طور پیش‌فرض پوش JSON با قالب `clawhub.skill.verify.v1` متعلق به ClawHub را چاپ می‌کند. پرچم `--json` وجود ندارد، زیرا JSON از پیش قالب پیش‌فرض است. برای سازگاری، نامک‌های بدون مالک زمانی پذیرفته می‌شوند که Skill از قبل نصب شده یا بدون ابهام باشد؛ ارجاع‌های همراه با مالک از ابهام دربارهٔ ناشر جلوگیری می‌کنند. |
| منشأ `verify`                    | وقتی ClawHub منشأ منبع تعیین‌شده توسط سرور را بازمی‌گرداند، JSON اعتبارسنجی همچنین شامل `openclaw.verifiedSourceUrl` سنجاق‌شده به یک کامیت است. نشانی‌های منبع ناموجود یا خوداظهاری‌شده فقط در پوش خام منشأ باقی می‌مانند و ارتقا داده نمی‌شوند.                                      |
| انتخابگر نسخهٔ `verify`          | `verify` برای Skills نصب‌شده از ClawHub از `.clawhub/origin.json` استفاده می‌کند، بنابراین نسخهٔ نصب‌شده را در برابر همان رجیستری مبدأ اعتبارسنجی می‌کند. `--version` و `--tag` انتخابگر نسخه را بازنویسی می‌کنند، اما در صورت وجود فرادادهٔ مبدأ، همان رجیستری نصب‌شده را حفظ می‌کنند. |
| `verify --card`                  | به‌جای JSON، Markdown تولیدشدهٔ کارت Skill را چاپ می‌کند. وقتی ClawHub مقدار `ok: false` یا `decision: "fail"` را بازگرداند، با کد خروج غیرصفر پایان می‌یابد؛ امضاهای بدون امضا صرفاً جنبهٔ اطلاع‌رسانی دارند، مگر اینکه سیاست ClawHub تغییر کند.                                      |
| اثرانگشت کارت Skill              | بسته‌های نصب‌شدهٔ ClawHub می‌توانند شامل یک `skill-card.md` تولیدشده باشند. OpenClaw اعتبارسنجی را تصمیم سرور ClawHub می‌داند و صرفاً به‌دلیل تغییر اثرانگشت بسته توسط آن کارت تولیدشده، یک Skill نصب‌شده را رد نمی‌کند.                                                           |
| `check --agent <id>`             | فضای کاری عامل انتخاب‌شده را بررسی و گزارش می‌کند کدام Skills آماده واقعاً در اعلان یا سطح فرمان آن عامل قابل مشاهده‌اند.                                                                                                                                                    |
| `list`                           | وقتی هیچ زیرفرمانی ارائه نشود، عمل پیش‌فرض است.                                                                                                                                                                                                                               |
| خروجی `list`/`info`/`check`      | خروجی رندرشده به stdout می‌رود. با `--json`، دادهٔ ماشین‌خوان برای پایپ‌ها و اسکریپت‌ها روی stdout باقی می‌ماند.                                                                                                                                                               |

نصب و به‌روزرسانی Skills جامعهٔ ClawHub پیش از دانلود، اعتماد را بررسی می‌کند. انتشارهای نسخه‌دار بایگانی جامعه از فرادادهٔ اعتماد مخصوص همان انتشار استفاده می‌کنند. Skills مبتنی بر GitHub که از تفکیک‌گر استفاده می‌کنند، برای اعمال سیاست اسکن و نصب اجباری پیش از بازگرداندن کامیت سنجاق‌شده، به تفکیک‌گر نصب ClawHub متکی هستند؛ برای نصب یک Skill معلق مبتنی بر GitHub پیش از تکمیل آن اسکن، از `--force-install` استفاده کنید. انتشارهای مخرب یا مسدودشدهٔ جامعه رد می‌شوند. انتشارهای پرخطر جامعه به بازبینی و `--acknowledge-clawhub-risk` نیاز دارند تا یک فرمان غیرتعاملی پس از آن بازبینی ادامه یابد. ناشران رسمی Skills در ClawHub و منابع Skills همراه OpenClaw از این اعلان اعتماد به انتشار عبور می‌کنند.

## کارگاه Skill

`openclaw skills workshop` پیشنهادهای معلق Skill را در فضای کاری انتخاب‌شده مدیریت می‌کند. پیشنهادها تا زمانی که اعمال نشوند، Skills فعال نیستند. برای ذخیره‌سازی پیشنهاد، تدابیر حفاظتی فایل‌های پشتیبان، متدهای Gateway و سیاست تأیید، به [کارگاه Skill](/fa/tools/skill-workshop) مراجعه کنید.

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

`propose-create`، `propose-update` و `revise` همچنین گزینه‌های `--goal <text>`
و `--evidence <text>` را می‌پذیرند تا انگیزهٔ پیشنهاد و یادداشت‌های پشتیبان
در کنار محتوای `--proposal`/`--proposal-dir` ثبت شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Skills](/fa/tools/skills)

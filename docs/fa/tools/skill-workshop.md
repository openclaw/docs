---
read_when:
    - می‌خواهید عامل از طریق چت یک مهارت ایجاد یا به‌روزرسانی کند
    - باید پیش‌نویس مهارت تولیدشده را بازبینی، اعمال، رد یا قرنطینه کنید
    - شما در حال پیکربندی تأیید، خودمختاری، ذخیره‌سازی یا محدودیت‌های Skill Workshop هستید
sidebarTitle: Skill Workshop
summary: مهارت‌های فضای کاری را از طریق بازبینی Skill Workshop ایجاد و به‌روزرسانی کنید
title: کارگاه Skills
x-i18n:
    generated_at: "2026-06-27T19:04:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

کارگاه Skills مسیر تحت حاکمیت OpenClaw برای ایجاد و به‌روزرسانی
مهارت‌های فضای کاری است.

عامل‌ها و اپراتورها در این مسیر فایل‌های فعال `SKILL.md` را مستقیما
نمی‌نویسند. آن‌ها ابتدا یک **پیشنهاد** ایجاد می‌کنند. پیشنهاد یک پیش‌نویس در انتظار است که
محتوای پیشنهادی مهارت، اتصال هدف، وضعیت اسکنر، هش‌ها، فراداده فایل‌های پشتیبان
و فراداده بازگشت را در بر دارد. فقط وقتی اعمال شود به یک مهارت زنده تبدیل می‌شود.

کارگاه Skills فقط مهارت‌های فضای کاری را می‌نویسد. مهارت‌های بسته‌بندی‌شده،
Plugin، ClawHub، ریشه اضافی، مدیریت‌شده، عامل شخصی یا سیستمی را تغییر نمی‌دهد.

## نحوه کار

- **اول پیشنهاد:** محتوای تولیدشده مهارت به‌عنوان `PROPOSAL.md` ذخیره می‌شود، نه
  `SKILL.md`.
- **اعمال تنها نوشتن زنده است:** ایجاد، به‌روزرسانی و بازبینی، مهارت‌های
  فعال را تغییر نمی‌دهند.
- **محدود به فضای کاری:** ایجادها ریشه `skills/` فضای کاری را هدف می‌گیرند. به‌روزرسانی‌ها
  فقط برای مهارت‌های قابل نوشتن فضای کاری مجازند.
- **بدون بازنویسی:** اگر مهارت هدف از قبل وجود داشته باشد، ایجاد شکست می‌خورد.
- **وابسته به هش:** پیشنهادهای به‌روزرسانی به هش فعلی هدف متصل می‌شوند و اگر
  مهارت زنده پیش از اعمال تغییر کند، کهنه می‌شوند.
- **پشت دروازه اسکنر:** اعمال، پیش از نوشتن اسکن را دوباره اجرا می‌کند.
- **قابل بازیابی:** اعمال، پیش از تغییر فایل‌های زنده، فراداده بازگشت را می‌نویسد.
- **سطح‌های یکسان:** چت، CLI و Gateway همگی سرویس یکسان کارگاه Skills را
  فراخوانی می‌کنند.

## چرخه عمر

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

فقط پیشنهادهای `pending` می‌توانند بازبینی، اعمال، رد یا قرنطینه شوند.

## چت

از عامل، مهارتی را که می‌خواهید درخواست کنید. عامل `skill_workshop` را فراخوانی می‌کند و
یک شناسه پیشنهاد برمی‌گرداند.

ایجاد:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

به‌روزرسانی یک مهارت موجود فضای کاری:

```text
Update trip-planning to also check seat maps before booking.
```

تکرار روی یک پیشنهاد در انتظار:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

به‌صورت پیش‌فرض، `apply`، `reject` و `quarantine` که عامل آغاز می‌کند، پیش از اجرا
یک اعلان تایید نشان می‌دهند. برای رد شدن از اعلان در محیط‌های مورد اعتماد،
`skills.workshop.approvalPolicy` را روی `"auto"` تنظیم کنید.

## CLI

ایجاد پیشنهاد مهارت جدید:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

ایجاد پیشنهاد به‌روزرسانی برای یک مهارت موجود فضای کاری:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

فهرست و بازرسی:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

بازبینی پیش از تایید:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

بستن پیشنهاد:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## محتوای پیشنهاد

تا زمانی که در انتظار است، پیشنهاد به‌صورت `PROPOSAL.md` با frontmatter مخصوص پیشنهاد
ذخیره می‌شود:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

هنگام اعمال، کارگاه Skills فایل فعال `SKILL.md` را می‌نویسد و فیلدهای مخصوص پیشنهاد
را حذف می‌کند: `status`، `version` پیشنهاد، و `date` پیشنهاد.

## فایل‌های پشتیبان

وقتی مهارت پیشنهادی به فایل‌هایی کنار `PROPOSAL.md` نیاز دارد، از `--proposal-dir` استفاده کنید:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

دایرکتوری باید شامل `PROPOSAL.md` باشد. فایل‌های پشتیبان باید زیر این مسیرها باشند:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

کارگاه Skills فایل‌های پشتیبان را اسکن، هش و همراه پیشنهاد ذخیره می‌کند. آن‌ها
فقط هنگام اعمال، کنار `SKILL.md` زنده نوشته می‌شوند.

مسیرهای ردشده فایل پشتیبان شامل مسیرهای مطلق، بخش‌های مخفی مسیر، پیمایش مسیر،
مسیرهای هم‌پوشان، فایل‌های اجرایی از دایرکتوری‌های پیشنهاد، متن غیر UTF-8،
بایت‌های null، و فایل‌های خارج از پوشه‌های استاندارد پشتیبان است.

## ابزار عامل

مدل از `skill_workshop` استفاده می‌کند:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

عامل‌ها باید برای کار مهارت تولیدشده از `skill_workshop` استفاده کنند. آن‌ها نباید
فایل‌های پیشنهاد را از طریق `write`، `edit`، `exec`، فرمان‌های shell یا عملیات مستقیم
سیستم فایل ایجاد یا تغییر دهند.

<Note>
`skill_workshop` یک ابزار داخلی عامل است و در
`tools.profile: "coding"` گنجانده شده است. اگر یک سیاست سخت‌گیرانه‌تر آن را پنهان کند،
`skill_workshop` را به فهرست فعال `tools.allow` اضافه کنید، یا وقتی محدوده از پروفایلی
بدون `tools.allow` صریح استفاده می‌کند، از
`tools.alsoAllow: ["skill_workshop"]` استفاده کنید. اجراهای sandbox شده ابزار سمت میزبان
کارگاه Skills را نمی‌سازند، بنابراین اقدامات بازبینی پیشنهاد را از یک نشست معمولی
عامل سمت میزبان یا CLI اجرا کنید.
</Note>

## تایید و خودمختاری

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

- `autonomous.enabled`: به OpenClaw اجازه می‌دهد پس از نوبت‌های موفق، از سیگنال‌های پایدار
  گفت‌وگو پیشنهادهای در انتظار ایجاد کند. پیش‌فرض: `false`.
- `allowSymlinkTargetWrites`: به اعمال اجازه می‌دهد از طریق symlinkهای مهارت فضای کاری
  بنویسد، اگر هدف واقعی آن‌ها در `skills.load.allowSymlinkTargets` فهرست شده باشد.
  پیش‌فرض: `false`.
- `approvalPolicy: "pending"`: پیش از `apply`، `reject` یا `quarantine` آغازشده توسط عامل،
  یک اعلان تایید لازم دارد.
- `approvalPolicy: "auto"`: از آن اعلان تایید عبور می‌کند. عامل همچنان باید
  عمل را فراخوانی کند.
- `maxPending`: تعداد پیشنهادهای در انتظار و قرنطینه‌شده را برای هر فضای کاری محدود می‌کند.
- `maxSkillBytes`: اندازه بدنه پیشنهاد را محدود می‌کند. پیش‌فرض: `40000`.

توضیحات پیشنهاد همیشه به ۱۶۰ بایت محدود می‌شوند.

## متدهای Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

متدهای فقط‌خواندنی به `operator.read` نیاز دارند. متدهای تغییردهنده به
`operator.admin` نیاز دارند.

## ذخیره‌سازی

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

دایرکتوری وضعیت پیش‌فرض: `~/.openclaw`.

- `proposal.json`: رکورد کانونی پیشنهاد.
- `proposals.json`: نمایه فهرست‌کردن سریع، قابل بازسازی از پوشه‌های پیشنهاد.
- `PROPOSAL.md`: پیشنهاد مهارت در انتظار.
- `rollback.json`: فراداده بازیابی که پیش از تغییر فایل‌های زنده توسط اعمال نوشته می‌شود.

## محدودیت‌ها

- توضیح: ۱۶۰ بایت.
- بدنه پیشنهاد: `skills.workshop.maxSkillBytes` (پیش‌فرض ۴۰٬۰۰۰).
- فایل‌های پشتیبان: ۶۴ عدد برای هر پیشنهاد.
- اندازه فایل پشتیبان: هرکدام ۲۵۶ KB، در مجموع ۲ MB.
- پیشنهادهای در انتظار و قرنطینه‌شده: `skills.workshop.maxPending` برای هر فضای کاری
  (پیش‌فرض ۵۰).

## عیب‌یابی

| مشکل                                           | راه‌حل                                                                                                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` را به ۱۶۰ بایت یا کمتر کوتاه کنید.                                                                                                                                                            |
| `Skill proposal content is too large`          | بدنه پیشنهاد را کوتاه کنید یا `skills.workshop.maxSkillBytes` را افزایش دهید.                                                                                                                               |
| `Target skill changed after proposal creation` | پیشنهاد را بر اساس هدف فعلی بازبینی کنید، یا یک پیشنهاد جدید بسازید.                                                                                                                                       |
| `Proposal scan failed`                         | یافته‌های اسکنر را بررسی کنید، سپس پیشنهاد را بازبینی یا قرنطینه کنید.                                                                                                                                     |
| `untrusted symlink target`                     | `skills.load.allowSymlinkTargets` را پیکربندی کنید و `skills.workshop.allowSymlinkTargetWrites` را فقط برای ریشه‌های مشترک مهارت که عمدی هستند فعال کنید.                                                 |
| `Support file paths must be under one of...`   | فایل‌های پشتیبان را زیر `assets/`، `examples/`، `references/`، `scripts/` یا `templates/` منتقل کنید.                                                                                                       |
| پیشنهاد در فهرست نمایش داده نمی‌شود            | فضای کاری انتخاب‌شده `--agent` و `OPENCLAW_STATE_DIR` را بررسی کنید.                                                                                                                                        |
| عامل نمی‌تواند `skill_workshop` را فراخوانی کند | سیاست ابزار فعال و حالت اجرا را بررسی کنید. `coding` ابزار را شامل می‌شود؛ سیاست‌های محدودکننده `tools.allow` باید آن را صریحا فهرست کنند، و اجراهای sandbox شده باید از یک نشست معمولی عامل سمت میزبان یا CLI استفاده کنند. |

## مرتبط

- [Skills](/fa/tools/skills) برای ترتیب بارگذاری، تقدم و قابلیت مشاهده
- [ایجاد مهارت‌ها](/fa/tools/creating-skills) برای مبانی `SKILL.md` دست‌نویس
- [پیکربندی Skills](/fa/tools/skills-config) برای طرح‌واره کامل `skills.workshop`
- [CLI مهارت‌ها](/fa/cli/skills) برای فرمان‌های `openclaw skills`

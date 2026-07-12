---
read_when:
    - نخستین بار استفاده از ClawHub
    - نصب یک Skill یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را آغاز کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-07-12T09:41:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

هنگام نصب موارد در OpenClaw، از OpenClaw استفاده کنید. هنگامی که وارد حساب می‌شوید، موارد فهرست‌شدهٔ خود را منتشر یا مدیریت می‌کنید، یا از گردش‌کارهای ویژهٔ رجیستری استفاده می‌کنید، از CLI ‏`clawhub` استفاده کنید.

## یافتن و نصب یک Skill

از OpenClaw جست‌وجو کنید:

```bash
openclaw skills search "calendar"
```

یک Skill نصب کنید:

```bash
openclaw skills install @openclaw/demo
```

Skills نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw skills update --all
```

OpenClaw مبدأ Skill را ثبت می‌کند تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub آن را پیدا کنند.

## یافتن و نصب یک Plugin

از OpenClaw جست‌وجو کنید:

```bash
openclaw plugins search "calendar"
```

یک Plugin میزبانی‌شده در ClawHub را با مبدأ صریح ClawHub نصب کنید:

```bash
openclaw plugins install clawhub:<package>
```

Pluginهای نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw plugins update --all
```

هنگامی که می‌خواهید OpenClaw بسته را به‌جای npm یا مبدأیی دیگر از طریق ClawHub پیدا کند، از پیشوند `clawhub:` استفاده کنید.

## ورود به حساب برای انتشار

CLI ‏ClawHub را نصب کنید:

```bash
npm i -g clawhub
# یا
pnpm add -g clawhub
```

با GitHub وارد حساب شوید:

```bash
clawhub login
clawhub whoami
```

محیط‌های بدون رابط گرافیکی می‌توانند از یک توکن API دریافتی از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک Skill

یک Skill پوشه‌ای است که فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری دارد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان از محتوای بدون تغییر صرف‌نظر می‌کند. Skills جدید از نسخهٔ `1.0.0` آغاز می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخهٔ اصلاحی بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` و برای انتخاب نسخه‌ای مشخص از `--version` استفاده کنید.

پیش از انتشار، فراداده‌های `SKILL.md` را بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب، نیازمندی‌های Skill را درک کنند. [قالب Skill](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چند Skill دارند، گردش‌کار قابل‌استفادهٔ مجدد GitHub برای هر پوشهٔ مستقیم Skill در مسیر `skills/`، فرمان `skill publish` را فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از پوشه‌ای محلی، مخزن GitHub، ارجاع GitHub یا بایگانی موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فراداده‌های نهایی بسته، فیلدهای سازگاری، انتساب مبدأ و برنامهٔ بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کد باید فراداده‌های سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی فراداده‌ها، پیوندهای مبدأ، نسخه‌ها، گزارش‌های تغییرات و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نمایش می‌دهند. نسخه‌هایی که به‌دلیل نظارت در حالت انتظار قرار گرفته یا مسدود شده‌اند، ممکن است تا زمان رفع مشکل از بخش‌های جست‌وجو و نصب پنهان شوند.

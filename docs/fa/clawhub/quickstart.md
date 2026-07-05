---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا plugins را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-07-05T07:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای مهارت‌ها و Pluginهای OpenClaw است.

هنگامی از OpenClaw استفاده کنید که چیزهایی را در OpenClaw نصب می‌کنید. هنگامی از CLI `clawhub`
استفاده کنید که وارد حساب می‌شوید، منتشر می‌کنید، فهرست‌های خودتان را مدیریت می‌کنید، یا از
گردش‌کارهای ویژهٔ رجیستری استفاده می‌کنید.

## یافتن و نصب یک مهارت

از OpenClaw جست‌وجو کنید:

```bash
openclaw skills search "calendar"
```

یک مهارت نصب کنید:

```bash
openclaw skills install @openclaw/demo
```

مهارت‌های نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که مهارت از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان از طریق
ClawHub حل شوند.

## یافتن و نصب یک Plugin

از OpenClaw جست‌وجو کنید:

```bash
openclaw plugins search "calendar"
```

یک Plugin میزبانی‌شده در ClawHub را با منبع صریح ClawHub نصب کنید:

```bash
openclaw plugins install clawhub:<package>
```

Pluginهای نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub، نه npm یا منبعی دیگر، حل کند، از پیشوند
`clawhub:` استفاده کنید.

## ورود برای انتشار

CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

با GitHub وارد شوید:

```bash
clawhub login
clawhub whoami
```

محیط‌های بدون رابط گرافیکی می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک مهارت

یک مهارت پوشه‌ای است با فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را نادیده می‌گیرد. مهارت‌های جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی
به‌طور خودکار نسخهٔ وصلهٔ بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` یا برای انتخاب نسخهٔ
صریح از `--version` استفاده کنید.

پیش از انتشار، فراداده‌ها را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای لازم را
اعلام کنید تا کاربران پیش از نصب، بدانند مهارت به چه چیزهایی نیاز دارد. [قالب مهارت](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چندین مهارت دارند، گردش‌کار قابل استفادهٔ مجدد GitHub فرمان
`skill publish` را برای هر پوشهٔ مهارت مستقیم زیر `skills/` فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از یک پوشهٔ محلی، یک مخزن GitHub، یک ارجاع GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا پیش از انتشار، فراداده‌های بستهٔ حل‌شده، فیلدهای سازگاری،
انتساب منبع و برنامهٔ بارگذاری را پیش‌نمایش کنید.

Pluginهای کد باید فراداده‌های سازگاری OpenClaw را در `package.json` داشته باشند، از جمله
`openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی فراداده‌ها، پیوندهای منبع،
نسخه‌ها، تغییرنامه‌ها و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل بازبینی نگه داشته یا
مسدود شده‌اند، ممکن است تا زمان رفع مشکل از سطوح جست‌وجو و نصب پنهان شوند.

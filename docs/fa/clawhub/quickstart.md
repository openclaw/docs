---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک Skill یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'شروع کار با ClawHub: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-06-28T00:12:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزهایی را داخل OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی در حال ورود به سیستم، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای اختصاصی رجیستری هستید، از CLI به نام `clawhub` استفاده کنید.

## یافتن و نصب یک مهارت

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک مهارت:

```bash
openclaw skills install @openclaw/demo
```

به‌روزرسانی مهارت‌های نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که مهارت از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان از طریق ClawHub حل شوند.

## یافتن و نصب یک Plugin

جست‌وجو از OpenClaw:

```bash
openclaw plugins search "calendar"
```

نصب یک Plugin میزبانی‌شده در ClawHub با منبع صریح ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

به‌روزرسانی Pluginهای نصب‌شده:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub، به‌جای npm یا منبعی دیگر، حل کند، از پیشوند `clawhub:` استفاده کنید.

## ورود برای انتشار

نصب CLI مربوط به ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

ورود با GitHub:

```bash
clawhub login
clawhub whoami
```

محیط‌های بدون واسط گرافیکی می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک مهارت

مهارت یک پوشه با فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری است.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را رد می‌کند. مهارت‌های جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخه patch بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` یا برای انتخاب نسخه‌ای صریح از `--version` استفاده کنید.

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای موردنیاز را اعلام کنید تا کاربران پیش از نصب بفهمند مهارت به چه چیزهایی نیاز دارد. [قالب مهارت](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چند مهارت دارند، گردش‌کار قابل‌استفاده‌مجدد GitHub، `skill publish` را برای هر پوشه مهارت مستقیم زیر `skills/` فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از یک پوشه محلی، یک مخزن GitHub، یک ارجاع GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فراداده بسته حل‌شده، فیلدهای سازگاری، انتساب منبع، و برنامه بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کد باید فراداده سازگاری OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحه وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی فراداده، پیوندهای منبع، نسخه‌ها، تغییرنامه‌ها، و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل بازبینی نگه داشته یا مسدود شده‌اند، ممکن است تا زمان حل‌شدن از سطوح جست‌وجو و نصب پنهان بمانند.

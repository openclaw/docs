---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک skill یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-07-03T09:46:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی وارد حساب می‌شوید، منتشر می‌کنید، فهرست‌های خودتان را مدیریت می‌کنید، یا از گردش‌کارهای مخصوص رجیستری استفاده می‌کنید، از CLI با نام `clawhub` استفاده کنید.

## پیدا کردن و نصب یک skill

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک skill:

```bash
openclaw skills install @openclaw/demo
```

به‌روزرسانی skillهای نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که skill از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub resolve شوند.

## پیدا کردن و نصب یک Plugin

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub resolve کند، نه از npm یا منبعی دیگر، از پیشوند `clawhub:` استفاده کنید.

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

محیط‌های بدون رابط کاربری می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک skill

یک skill پوشه‌ای است با فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را رد می‌کند. skillهای جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخه patch بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` استفاده کنید، یا برای انتخاب نسخه‌ای صریح از `--version`.

پیش از انتشار، metadata را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب بفهمند skill به چه چیزهایی نیاز دارد. [قالب skill](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چندین skill دارند، گردش‌کار قابل‌استفاده‌مجدد GitHub برای هر پوشه skill مستقیم زیر `skills/` فرمان `skill publish` را فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از یک پوشه محلی، مخزن GitHub، ref در GitHub، یا یک archive موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا metadata بسته resolveشده، فیلدهای سازگاری، انتساب منبع، و برنامه بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کدنویسی باید metadata سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحه وب ClawHub یا فرمان‌های جزئیات CLI استفاده کنید تا metadata، پیوندهای منبع، نسخه‌ها، changelogها، و وضعیت اسکن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل moderation نگه داشته یا مسدود شده‌اند، ممکن است تا زمان حل شدن از سطح‌های جست‌وجو و نصب پنهان بمانند.

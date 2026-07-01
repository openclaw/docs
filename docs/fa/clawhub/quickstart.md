---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را آغاز کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-07-01T13:11:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

هنگام نصب چیزها در OpenClaw از OpenClaw استفاده کنید. هنگام ورود، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای ویژهٔ رجیستری، از CLIِ `clawhub` استفاده کنید.

## یافتن و نصب یک skill

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

OpenClaw ثبت می‌کند که skill از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان از طریق ClawHub resolve شوند.

## یافتن و نصب یک plugin

جست‌وجو از OpenClaw:

```bash
openclaw plugins search "calendar"
```

نصب یک plugin میزبانی‌شده در ClawHub با یک منبع صریح ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

به‌روزرسانی pluginهای نصب‌شده:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub به‌جای npm یا منبعی دیگر resolve کند، از پیشوند `clawhub:` استفاده کنید.

## ورود برای انتشار

نصب CLIِ ClawHub:

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

این دستور محتوای بدون تغییر را رد می‌کند. skillهای جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخهٔ patch بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` یا برای انتخاب نسخهٔ صریح از `--version` استفاده کنید.

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب بدانند skill به چه چیزهایی نیاز دارد. [قالب skill](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چندین skill دارند، گردش‌کار قابل استفادهٔ مجدد GitHub برای هر پوشهٔ skill بلافصل زیر `skills/` دستور `skill publish` را فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک plugin

یک plugin را از یک پوشهٔ محلی، یک مخزن GitHub، یک ref در GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فرادادهٔ resolveشدهٔ بسته، فیلدهای سازگاری، انتساب منبع، و برنامهٔ بارگذاری را بدون انتشار پیش‌نمایش کنید.

pluginهای کد باید فرادادهٔ سازگاری OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا دستورهای جزئیات CLI برای بررسی فراداده، پیوندهای منبع، نسخه‌ها، تغییرات، و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که توسط moderation نگه داشته یا مسدود شده‌اند ممکن است تا زمان رفع شدن، از سطوح جست‌وجو و نصب پنهان شوند.

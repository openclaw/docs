---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'شروع کار با ClawHub: Skills یا Plugin را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-06-30T22:24:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

هنگام نصب چیزها در OpenClaw، از OpenClaw استفاده کنید. هنگام ورود، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای ویژهٔ رجیستری، از CLI `clawhub` استفاده کنید.

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

OpenClaw ثبت می‌کند مهارت از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub resolve شوند.

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub و نه npm یا منبعی دیگر resolve کند، از پیشوند `clawhub:` استفاده کنید.

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

محیط‌های بدون واسط می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک مهارت

مهارت پوشه‌ای است که یک فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری دارد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را رد می‌کند. مهارت‌های جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخهٔ patch بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` یا برای انتخاب نسخه‌ای صریح از `--version` استفاده کنید.

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب، نیازهای مهارت را بفهمند. [قالب مهارت](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چندین مهارت دارند، گردش‌کار بازاستفاده‌پذیر GitHub برای هر پوشهٔ مستقیم مهارت زیر `skills/`، `skill publish` را فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از یک پوشهٔ محلی، یک مخزن GitHub، یک ref در GitHub، یا یک بایگانی موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فرادادهٔ resolveشدهٔ بسته، فیلدهای سازگاری، انتساب منبع، و طرح بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کدنویسی باید فرادادهٔ سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا فرمان‌های جزئیات CLI استفاده کنید تا فراداده، پیوندهای منبع، نسخه‌ها، تغییرنامه‌ها، و وضعیت اسکن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که در وضعیت نگه‌داری هستند یا به‌دلیل moderation مسدود شده‌اند، ممکن است تا زمان رفع مشکل از سطح‌های جست‌وجو و نصب پنهان شوند.

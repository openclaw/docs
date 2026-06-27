---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک Skill یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-06-27T17:20:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای مهارت‌ها و Pluginهای OpenClaw است.

هنگام نصب چیزها در OpenClaw از OpenClaw استفاده کنید. هنگام ورود، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از جریان‌های کاری ویژه‌ی رجیستری، از CLI `clawhub` استفاده کنید.

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

OpenClaw ثبت می‌کند که مهارت از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان از طریق ClawHub حل شوند.

## یافتن و نصب یک Plugin

از OpenClaw جست‌وجو کنید:

```bash
openclaw plugins search "calendar"
```

یک Plugin میزبانی‌شده در ClawHub را با منبع ClawHub صریح نصب کنید:

```bash
openclaw plugins install clawhub:<package>
```

Pluginهای نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub، نه npm یا منبعی دیگر، حل کند، از پیشوند `clawhub:` استفاده کنید.

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

## انتشار یک مهارت

یک مهارت پوشه‌ای است که یک فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری دارد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را نادیده می‌گیرد. مهارت‌های جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخه‌ی وصله‌ی بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` یا برای انتخاب یک نسخه‌ی صریح از `--version` استفاده کنید.

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب بفهمند مهارت به چه چیزهایی نیاز دارد. [قالب مهارت](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چند مهارت دارند، جریان کاری قابل‌استفاده‌ی دوباره‌ی GitHub برای هر پوشه‌ی مستقیم مهارت زیر `skills/`، `skill publish` را فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از یک پوشه‌ی محلی، یک مخزن GitHub، یک مرجع GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فراداده‌ی بسته‌ی حل‌شده، فیلدهای سازگاری، انتساب منبع، و طرح بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کد باید فراداده‌ی سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحه‌ی وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی فراداده، پیوندهای منبع، نسخه‌ها، گزارش‌های تغییرات، و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل بازبینی نگه داشته یا مسدود شده‌اند ممکن است تا زمان حل شدن، از سطح‌های جست‌وجو و نصب پنهان شوند.

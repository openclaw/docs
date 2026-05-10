---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-05-10T19:28:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای مهارت‌ها و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی در حال ورود، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای ویژهٔ رجیستری هستید، از CLI `clawhub` استفاده کنید.

## یافتن و نصب یک مهارت

از OpenClaw جست‌وجو کنید:

```bash
openclaw skills search "calendar"
```

یک مهارت نصب کنید:

```bash
openclaw skills install <skill-slug>
```

مهارت‌های نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که مهارت از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub حل‌وفصل شوند.

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

وقتی می‌خواهید OpenClaw بسته را به‌جای npm یا منبعی دیگر از طریق ClawHub حل‌وفصل کند، از پیشوند `clawhub:` استفاده کنید.

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

یک مهارت پوشه‌ای است که یک فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری دارد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

پیش از انتشار، فرادادهٔ داخل `SKILL.md` را بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب بدانند مهارت به چه چیزهایی نیاز دارد. [قالب مهارت](/fa/clawhub/skill-format) را ببینید.

## انتشار یک Plugin

یک Plugin را از یک پوشهٔ محلی، یک مخزن GitHub، یک ref در GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا پیش‌نمایشی از فرادادهٔ بستهٔ حل‌وفصل‌شده، فیلدهای سازگاری، انتساب منبع، و برنامهٔ بارگذاری را بدون انتشار ببینید.

Pluginهای کدنویسی باید فرادادهٔ سازگاری OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی مهارت‌هایی که نگهداری می‌کنید

`sync` پوشه‌های مهارت را اسکن می‌کند و مهارت‌های جدید یا تغییریافته‌ای را منتشر می‌کند که هنوز همگام‌سازی نشده‌اند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد شده باشید، `sync` همچنین ممکن است یک snapshot حداقلی از نصب‌ها را برای شمارش تجمیعی نصب‌ها ارسال کند. برای آنچه گزارش می‌شود و روش انصراف، [دورسنجی](/fa/clawhub/telemetry) را ببینید.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا دستورهای جزئیات CLI استفاده کنید تا فراداده، پیوندهای منبع، نسخه‌ها، changelogها، و وضعیت اسکن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل moderation نگه داشته یا مسدود شده‌اند ممکن است تا زمان حل‌وفصل، از سطوح جست‌وجو و نصب پنهان شوند.

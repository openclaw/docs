---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Plugin‌ها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-05-12T00:57:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. زمانی از CLI `clawhub`
استفاده کنید که می‌خواهید وارد شوید، منتشر کنید، فهرست‌های خودتان را مدیریت کنید، یا از گردش‌کارهای
ویژهٔ رجیستری استفاده کنید.

## پیدا کردن و نصب یک مهارت

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک مهارت:

```bash
openclaw skills install <skill-slug>
```

به‌روزرسانی مهارت‌های نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که مهارت از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان
از طریق ClawHub حل شوند.

## پیدا کردن و نصب یک Plugin

جست‌وجو از OpenClaw:

```bash
openclaw plugins search "calendar"
```

نصب یک Plugin میزبانی‌شده در ClawHub با یک منبع صریح ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

به‌روزرسانی Pluginهای نصب‌شده:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub، نه npm یا منبعی دیگر، حل کند، از پیشوند `clawhub:`
استفاده کنید.

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

محیط‌های بدون رابط کاربری می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک مهارت

یک مهارت پوشه‌ای است با فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای لازم
را اعلام کنید تا کاربران پیش از نصب، بدانند مهارت به چه چیزهایی نیاز دارد. به [قالب مهارت](/fa/clawhub/skill-format) مراجعه کنید.

## انتشار یک Plugin

یک Plugin را از یک پوشهٔ محلی، یک مخزن GitHub، یک ارجاع GitHub، یا یک آرشیو
موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فرادادهٔ بستهٔ حل‌شده، فیلدهای سازگاری،
انتساب منبع، و برنامهٔ بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کد باید فرادادهٔ سازگاری OpenClaw را در `package.json` داشته باشند،
از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی مهارت‌هایی که نگهداری می‌کنید

`sync` پوشه‌های مهارت را اسکن می‌کند و مهارت‌های جدید یا تغییریافته‌ای را که هنوز
همگام‌سازی نشده‌اند منتشر می‌کند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد شده‌اید، `sync` ممکن است یک نماگرفت نصب حداقلی نیز برای شمارش تجمیعی نصب‌ها
ارسال کند. برای اینکه بدانید چه چیزی گزارش می‌شود و چگونه می‌توانید انصراف دهید، به [دورسنجی](/fa/clawhub/telemetry) مراجعه کنید.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا فرمان‌های جزئیات CLI استفاده کنید تا
فراداده، پیوندهای منبع، نسخه‌ها، تغییرنامه‌ها، و وضعیت اسکن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که توسط
بازبینی نگه داشته یا مسدود شده‌اند، ممکن است تا زمان رفع مشکل از سطوح جست‌وجو و نصب پنهان شوند.

---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Plugin‌ها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-05-13T04:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک registry برای skills و plugins در OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی در حال ورود، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای ویژهٔ registry هستید، از CLI `clawhub` استفاده کنید.

## یافتن و نصب یک skill

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک skill:

```bash
openclaw skills install <skill-slug>
```

به‌روزرسانی skills نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که skill از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub انجام شوند.

## یافتن و نصب یک plugin

جست‌وجو از OpenClaw:

```bash
openclaw plugins search "calendar"
```

نصب یک plugin میزبانی‌شده در ClawHub با یک منبع صریح ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

به‌روزرسانی plugins نصب‌شده:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub حل کند، نه npm یا منبعی دیگر، از پیشوند `clawhub:` استفاده کنید.

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

یک skill پوشه‌ای با فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری است.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

پیش از انتشار، metadata را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب بدانند skill به چه چیزهایی نیاز دارد. [قالب skill](/fa/clawhub/skill-format) را ببینید.

## انتشار یک plugin

یک plugin را از یک پوشهٔ محلی، یک مخزن GitHub، یک ref در GitHub، یا یک archive موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا پیش از انتشار، metadata حل‌شدهٔ بسته، فیلدهای سازگاری، انتساب منبع، و برنامهٔ upload را پیش‌نمایش کنید.

Code plugins باید شامل metadata سازگاری OpenClaw در `package.json` باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی skills تحت نگهداری شما

`sync` پوشه‌های skill را scan می‌کند و skills جدید یا تغییریافته‌ای را که هنوز همگام‌سازی نشده‌اند منتشر می‌کند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد شده باشید، `sync` ممکن است یک snapshot نصب حداقلی هم برای شمارش‌های تجمیعی نصب ارسال کند. برای اینکه چه چیزی گزارش می‌شود و چگونه انصراف دهید، [Telemetry](/fa/clawhub/telemetry) را ببینید.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی metadata، پیوندهای منبع، نسخه‌ها، changelogها، و وضعیت scan استفاده کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت scan را نشان می‌دهند. انتشارهایی که توسط moderation نگه داشته یا مسدود شده‌اند، ممکن است تا زمان حل شدن، از سطوح جست‌وجو و نصب پنهان شوند.

---
read_when:
    - استفاده از ClawHub برای اولین بار
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-05-12T12:49:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی در حال ورود، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای مخصوص رجیستری هستید، از CLI مربوط به `clawhub` استفاده کنید.

## یافتن و نصب یک Skill

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک Skill:

```bash
openclaw skills install <skill-slug>
```

به‌روزرسانی Skills نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که Skill از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان از طریق ClawHub resolve شوند.

## یافتن و نصب یک Plugin

جست‌وجو از OpenClaw:

```bash
openclaw plugins search "calendar"
```

نصب یک Plugin میزبانی‌شده در ClawHub با منبع ClawHub صریح:

```bash
openclaw plugins install clawhub:<package>
```

به‌روزرسانی Pluginهای نصب‌شده:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub resolve کند، نه از طریق npm یا منبعی دیگر، از پیشوند `clawhub:` استفاده کنید.

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

محیط‌های headless می‌توانند از یک API token از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک Skill

یک Skill پوشه‌ای است که یک فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری دارد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

پیش از انتشار، metadata را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب بدانند Skill به چه چیزهایی نیاز دارد. [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## انتشار یک Plugin

یک Plugin را از یک پوشه محلی، یک GitHub repo، یک GitHub ref، یا یک archive موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا بدون انتشار، metadata بسته resolve‌شده، فیلدهای سازگاری، انتساب منبع، و برنامه upload را پیش‌نمایش کنید.

Pluginهای کد باید در `package.json` شامل metadata سازگاری OpenClaw باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی Skills که نگه‌داری می‌کنید

`sync` پوشه‌های Skill را اسکن می‌کند و Skills جدید یا تغییریافته‌ای را که هنوز همگام‌سازی نشده‌اند منتشر می‌کند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد شده باشید، `sync` همچنین ممکن است یک snapshot نصب حداقلی برای شمارش‌های نصب تجمیعی ارسال کند. برای اینکه چه چیزی گزارش می‌شود و چگونه می‌توان انصراف داد، [تله‌متری](/fa/clawhub/telemetry) را ببینید.

## بررسی پیش از نصب

پیش از نصب، از صفحه وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی metadata، پیوندهای منبع، نسخه‌ها، changelogها، و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل moderation نگه داشته یا مسدود شده‌اند، ممکن است تا زمان رفع مشکل از سطوح جست‌وجو و نصب پنهان بمانند.

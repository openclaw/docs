---
read_when:
    - استفاده از ClawHub برای اولین بار
    - نصب یک مهارت یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Plugin‌ها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-05-11T20:27:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک فهرست برای Skillsها و Pluginهای OpenClaw است.

وقتی چیزی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی وارد می‌شوید، منتشر می‌کنید، فهرست‌های خودتان را مدیریت می‌کنید، یا از گردش‌کارهای ویژهٔ فهرست استفاده می‌کنید، از CLI‏ `clawhub` استفاده کنید.

## یافتن و نصب یک Skill

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک Skill:

```bash
openclaw skills install <skill-slug>
```

به‌روزرسانی Skillsهای نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که Skill از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub حل شوند.

## یافتن و نصب یک Plugin

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub حل کند، نه npm یا منبعی دیگر، از پیشوند `clawhub:` استفاده کنید.

## ورود برای انتشار

CLI‏ ClawHub را نصب کنید:

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

محیط‌های بدون واسط گرافیکی می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک Skill

یک Skill پوشه‌ای است با فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

پیش از انتشار، فرادادهٔ موجود در `SKILL.md` را بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای موردنیاز را اعلام کنید تا کاربران پیش از نصب بفهمند Skill به چه چیزهایی نیاز دارد. [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## انتشار یک Plugin

یک Plugin را از یک پوشهٔ محلی، یک مخزن GitHub، یک ارجاع GitHub، یا یک بایگانی موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا پیش‌نمایشی از فرادادهٔ حل‌شدهٔ بسته، فیلدهای سازگاری، انتساب منبع و برنامهٔ بارگذاری را بدون انتشار ببینید.

Pluginهای کد باید فرادادهٔ سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی Skillsهایی که نگه‌داری می‌کنید

`sync` پوشه‌های Skill را اسکن می‌کند و Skillsهای جدید یا تغییریافته‌ای را که هنوز همگام‌سازی نشده‌اند منتشر می‌کند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد شده باشید، `sync` ممکن است یک تصویر لحظه‌ای نصب حداقلی را نیز برای شمارش‌های تجمیعی نصب ارسال کند. برای اینکه چه چیزی گزارش می‌شود و چگونه می‌توان انصراف داد، [دورسنجی](/fa/clawhub/telemetry) را ببینید.

## بررسی پیش از نصب

پیش از نصب، از صفحهٔ وب ClawHub یا فرمان‌های جزئیات CLI استفاده کنید تا فراداده، پیوندهای منبع، نسخه‌ها، تغییرنامه‌ها و وضعیت اسکن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. نسخه‌هایی که به‌دلیل بازبینی نگه داشته یا مسدود شده‌اند، ممکن است تا زمان حل شدن از سطح‌های جست‌وجو و نصب پنهان بمانند.

---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک Skill یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-05-12T08:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی وارد حساب می‌شوید، منتشر می‌کنید، فهرست‌های خودتان را مدیریت می‌کنید، یا از جریان‌های کاری مخصوص رجیستری استفاده می‌کنید، از CLI `clawhub` استفاده کنید.

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

OpenClaw ثبت می‌کند که Skill از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub انجام شوند.

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub، نه npm یا منبعی دیگر، حل کند، از پیشوند `clawhub:` استفاده کنید.

## ورود برای انتشار

نصب CLI ClawHub:

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

محیط‌های بدون رابط تعاملی می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

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

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب بدانند Skill به چه چیزهایی نیاز دارد. [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## انتشار یک Plugin

یک Plugin را از یک پوشه محلی، یک مخزن GitHub، یک ارجاع GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا پیش از انتشار، فراداده بسته حل‌شده، فیلدهای سازگاری، انتساب منبع، و برنامه بارگذاری را پیش‌نمایش کنید.

Pluginهای کد باید فراداده سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی Skills تحت نگهداری شما

`sync` پوشه‌های Skill را اسکن می‌کند و Skills جدید یا تغییریافته‌ای را که هنوز همگام‌سازی نشده‌اند منتشر می‌کند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد حساب شده‌اید، `sync` همچنین ممکن است یک نمایه نصب حداقلی برای شمارش‌های نصب تجمیعی ارسال کند. برای اینکه چه چیزی گزارش می‌شود و چگونه می‌توان انصراف داد، [دورسنجی](/fa/clawhub/telemetry) را ببینید.

## بررسی پیش از نصب

پیش از نصب، از صفحه وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی فراداده، پیوندهای منبع، نسخه‌ها، گزارش‌های تغییرات، و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی تازه‌ترین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل نظارت نگه داشته یا مسدود شده‌اند، ممکن است تا زمان رفع مشکل از سطوح جست‌وجو و نصب پنهان بمانند.

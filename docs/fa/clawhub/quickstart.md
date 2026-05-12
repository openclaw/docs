---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک Skills یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'شروع استفاده از ClawHub: یافتن، نصب، به‌روزرسانی، و انتشار Skills یا Pluginها.'
x-i18n:
    generated_at: "2026-05-12T23:29:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی وارد حساب می‌شوید، منتشر می‌کنید، فهرست‌های خودتان را مدیریت می‌کنید، یا از گردش‌کارهای اختصاصی رجیستری استفاده می‌کنید، از CLI `clawhub` استفاده کنید.

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

OpenClaw ثبت می‌کند که Skill از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub resolve شوند.

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub، نه npm یا منبعی دیگر، resolve کند، از پیشوند `clawhub:` استفاده کنید.

## ورود برای انتشار

CLI ClawHub را نصب کنید:

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

## انتشار یک Skill

یک Skill پوشه‌ای است با فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای موردنیاز را اعلام کنید تا کاربران پیش از نصب بدانند Skill به چه چیزهایی نیاز دارد. [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## انتشار یک Plugin

یک Plugin را از یک پوشه محلی، یک مخزن GitHub، یک ref در GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فراداده بسته resolve‌شده، فیلدهای سازگاری، انتساب منبع و برنامه بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کدنویسی باید فراداده سازگاری OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی Skillsی که نگهداری می‌کنید

`sync` پوشه‌های Skill را اسکن می‌کند و Skills جدید یا تغییریافته‌ای را که هنوز همگام‌سازی نشده‌اند منتشر می‌کند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد حساب شده‌اید، `sync` ممکن است یک snapshot حداقلی از نصب را نیز برای شمارش تجمیعی نصب‌ها ارسال کند. برای اینکه چه چیزی گزارش می‌شود و چگونه می‌توانید انصراف دهید، [تله‌متری](/fa/clawhub/telemetry) را ببینید.

## بررسی پیش از نصب

پیش از نصب، از صفحه وب ClawHub یا دستورهای جزئیات CLI برای بررسی فراداده، پیوندهای منبع، نسخه‌ها، تغییرات نسخه‌ها و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که توسط تعدیل محتوا نگه داشته یا مسدود شده‌اند ممکن است تا زمان حل‌شدن، از سطوح جست‌وجو و نصب پنهان شوند.

---
read_when:
    - استفاده از ClawHub برای نخستین بار
    - نصب یک Skill یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-05-13T05:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی در حال ورود به سیستم، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای ویژه‌ی رجیستری هستید، از CLI مربوط به `clawhub` استفاده کنید.

## یافتن و نصب یک skill

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک skill:

```bash
openclaw skills install <skill-slug>
```

به‌روزرسانی Skills نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که skill از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان از طریق ClawHub آن را resolve کنند.

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub resolve کند، نه از طریق npm یا منبعی دیگر، از پیشوند `clawhub:` استفاده کنید.

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

محیط‌های بدون رابط تعاملی می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک skill

یک skill پوشه‌ای است که یک فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری دارد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

پیش از انتشار، metadata را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را declare کنید تا کاربران پیش از نصب بفهمند skill به چه چیزهایی نیاز دارد. [قالب skill](/fa/clawhub/skill-format) را ببینید.

## انتشار یک Plugin

یک Plugin را از یک پوشه‌ی محلی، یک مخزن GitHub، یک ref در GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا metadata بسته‌ی resolveشده، فیلدهای سازگاری، انتساب منبع، و برنامه‌ی upload را بدون انتشار پیش‌نمایش کنید.

Pluginهای کد باید metadata سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## همگام‌سازی Skillsی که نگه‌داری می‌کنید

`sync` پوشه‌های skill را scan می‌کند و Skills جدید یا تغییریافته‌ای را که هنوز همگام‌سازی نشده‌اند منتشر می‌کند.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

وقتی وارد سیستم شده‌اید، `sync` ممکن است یک snapshot حداقلی از نصب را نیز برای شمارش تجمیعی نصب‌ها ارسال کند. برای آنچه گزارش می‌شود و شیوه‌ی انصراف، [Telemetry](/fa/clawhub/telemetry) را ببینید.

## بررسی پیش از نصب

پیش از نصب، از صفحه‌ی وب ClawHub یا دستورهای جزئیات CLI استفاده کنید تا metadata، لینک‌های منبع، نسخه‌ها، changelogها، و وضعیت scan را بررسی کنید:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت scan را نشان می‌دهند. انتشارهایی که توسط moderation نگه داشته یا مسدود شده‌اند ممکن است تا زمان رفع مشکل از سطوح جست‌وجو و نصب پنهان بمانند.

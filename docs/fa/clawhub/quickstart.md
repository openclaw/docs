---
read_when:
    - نخستین بار استفاده از ClawHub
    - نصب یک Skill یا Plugin از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را آغاز کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-07-16T15:40:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

هنگام نصب موارد در OpenClaw، از OpenClaw استفاده کنید. هنگامی که وارد حساب می‌شوید، منتشر می‌کنید، فهرست‌های خود را مدیریت می‌کنید یا از گردش‌کارهای مختص رجیستری استفاده می‌کنید، از CLI ‏`clawhub` استفاده کنید.

## یافتن و نصب یک Skill

از OpenClaw جست‌وجو کنید:

```bash
openclaw skills search "calendar"
```

یک Skill نصب کنید:

```bash
openclaw skills install @openclaw/demo
```

Skills نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw skills update --all
```

OpenClaw مبدأ Skill را ثبت می‌کند تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub انجام شوند.

## یافتن و نصب یک Plugin

از OpenClaw جست‌وجو کنید:

```bash
openclaw plugins search "calendar"
```

یک Plugin میزبانی‌شده در ClawHub را با مبدأ صریح ClawHub نصب کنید:

```bash
openclaw plugins install clawhub:<package>
```

Pluginهای نصب‌شده را به‌روزرسانی کنید:

```bash
openclaw plugins update --all
```

وقتی می‌خواهید OpenClaw بسته را به‌جای npm یا مبدأیی دیگر از طریق ClawHub تفکیک کند، از پیشوند `clawhub:` استفاده کنید.

## ورود برای انتشار

CLI ‏ClawHub را نصب کنید:

```bash
npm i -g clawhub
# یا
pnpm add -g clawhub
```

با GitHub وارد شوید:

```bash
clawhub login
clawhub whoami
```

محیط‌های بدون رابط کاربری می‌توانند از یک توکن API در رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک Skill

Skill پوشه‌ای است که باید فایل `SKILL.md` را داشته باشد و می‌تواند شامل فایل‌های پشتیبان اختیاری نیز باشد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را نادیده می‌گیرد. Skills جدید از `1.0.0` آغاز می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخه وصله‌ای بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` یا برای انتخاب نسخه‌ای صریح از `--version` استفاده کنید.

پیش از انتشار، فراداده موجود در `SKILL.md` را بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب، نیازمندی‌های Skill را درک کنند. [قالب Skill](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که شامل چندین Skill هستند، گردش‌کار قابل‌استفاده مجدد GitHub، ‏`skill publish` را برای هر پوشه مستقیم Skill در `skills/` فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از پوشه‌ای محلی، یک مخزن GitHub، یک ارجاع GitHub یا یک بایگانی موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا بدون انتشار، فراداده تفکیک‌شده بسته، فیلدهای سازگاری، انتساب مبدأ و برنامه بارگذاری را پیش‌نمایش کنید.

Pluginهای کد باید فراداده سازگاری OpenClaw را در `package.json`، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`، داشته باشند.

## بررسی پیش از نصب

پیش از نصب، با استفاده از صفحه وب ClawHub یا فرمان‌های جزئیات CLI، فراداده، پیوندهای مبدأ، نسخه‌ها، گزارش‌های تغییرات و وضعیت اسکن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. نسخه‌هایی که تحت بررسی نگه داشته شده‌اند یا توسط نظارت مسدود شده‌اند، ممکن است تا زمان رفع مشکل از بخش‌های جست‌وجو و نصب پنهان شوند.

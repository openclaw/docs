---
read_when:
    - اولین بار استفاده از ClawHub
    - نصب یک skill یا plugin از رجیستری
    - انتشار در ClawHub
summary: 'شروع به استفاده از ClawHub کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-06-28T05:07:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای Skills و Pluginهای OpenClaw است.

وقتی چیزی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی در حال ورود، انتشار، مدیریت فهرست‌های خودتان، یا استفاده از گردش‌کارهای مخصوص رجیستری هستید، از CLI `clawhub` استفاده کنید.

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

OpenClaw ثبت می‌کند که Skill از کجا آمده است تا به‌روزرسانی‌های بعدی همچنان بتوانند از طریق ClawHub حل شوند.

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub، نه npm یا منبعی دیگر، حل کند، از پیشوند `clawhub:` استفاده کنید.

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

محیط‌های بدون رابط تعاملی می‌توانند از یک توکن API از رابط وب ClawHub استفاده کنند:

```bash
clawhub login --token clh_...
```

## انتشار یک Skill

یک Skill پوشه‌ای است که یک فایل الزامی `SKILL.md` و فایل‌های پشتیبان اختیاری دارد.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را رد می‌کند. Skills جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی به‌صورت خودکار نسخه patch بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` یا برای انتخاب یک نسخه صریح از `--version` استفاده کنید.

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها، و مجوزهای لازم را اعلام کنید تا کاربران پیش از نصب، نیازمندی‌های Skill را بفهمند. [قالب Skill](/fa/clawhub/skill-format) را ببینید.

برای مخازنی که چند Skill دارند، گردش‌کار قابل استفاده مجدد GitHub برای هر پوشه Skill مستقیم زیر `skills/` فرمان `skill publish` را فراخوانی می‌کند:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## انتشار یک Plugin

یک Plugin را از یک پوشه محلی، یک مخزن GitHub، یک ref در GitHub، یا یک آرشیو موجود منتشر کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

ابتدا از `--dry-run` استفاده کنید تا فراداده بسته حل‌شده، فیلدهای سازگاری، انتساب منبع، و برنامه بارگذاری را بدون انتشار پیش‌نمایش کنید.

Pluginهای کد باید فراداده سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحه وب ClawHub یا فرمان‌های جزئیات CLI استفاده کنید تا فراداده، پیوندهای منبع، نسخه‌ها، تغییرات، و وضعیت اسکن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که توسط بازبینی نگه داشته یا مسدود شده‌اند ممکن است تا زمان حل شدن، از سطوح جست‌وجو و نصب پنهان بمانند.

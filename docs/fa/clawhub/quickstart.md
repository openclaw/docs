---
read_when:
    - اولین استفاده از ClawHub
    - نصب یک مهارت یا افزونه از رجیستری
    - انتشار در ClawHub
summary: 'استفاده از ClawHub را شروع کنید: Skills یا Pluginها را پیدا، نصب، به‌روزرسانی و منتشر کنید.'
x-i18n:
    generated_at: "2026-07-01T20:27:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# شروع سریع

ClawHub یک رجیستری برای مهارت‌ها و Pluginهای OpenClaw است.

وقتی چیزهایی را در OpenClaw نصب می‌کنید، از OpenClaw استفاده کنید. وقتی وارد می‌شوید، منتشر می‌کنید، فهرست‌های خودتان را مدیریت می‌کنید، یا از گردش‌کارهای مخصوص رجیستری استفاده می‌کنید، از CLI `clawhub` استفاده کنید.

## یافتن و نصب یک مهارت

جست‌وجو از OpenClaw:

```bash
openclaw skills search "calendar"
```

نصب یک مهارت:

```bash
openclaw skills install @openclaw/demo
```

به‌روزرسانی مهارت‌های نصب‌شده:

```bash
openclaw skills update --all
```

OpenClaw ثبت می‌کند که مهارت از کجا آمده است تا به‌روزرسانی‌های بعدی بتوانند همچنان از طریق ClawHub آن را پیدا کنند.

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

وقتی می‌خواهید OpenClaw بسته را از طریق ClawHub و نه npm یا منبعی دیگر پیدا کند، از پیشوند `clawhub:` استفاده کنید.

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
  --changelog "Initial release"
```

این فرمان محتوای بدون تغییر را نادیده می‌گیرد. مهارت‌های جدید از `1.0.0` شروع می‌شوند؛ تغییرات بعدی به‌طور خودکار نسخه وصله بعدی را منتشر می‌کنند. برای پیش‌نمایش از `--dry-run` استفاده کنید یا برای انتخاب یک نسخه صریح از `--version`.

پیش از انتشار، فراداده را در `SKILL.md` بررسی کنید. متغیرهای محیطی، ابزارها و مجوزهای موردنیاز را اعلام کنید تا کاربران پیش از نصب، بدانند مهارت به چه چیزهایی نیاز دارد. [قالب مهارت](/fa/clawhub/skill-format) را ببینید.

برای مخزن‌هایی که چندین مهارت دارند، گردش‌کار قابل‌استفاده‌مجدد GitHub برای هر پوشه مستقیم مهارت در زیر `skills/`، `skill publish` را فراخوانی می‌کند:

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

ابتدا از `--dry-run` استفاده کنید تا بدون انتشار، فراداده حل‌شده بسته، فیلدهای سازگاری، انتساب منبع و برنامه بارگذاری را پیش‌نمایش کنید.

Pluginهای کد باید فراداده سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`.

## بررسی پیش از نصب

پیش از نصب، از صفحه وب ClawHub یا فرمان‌های جزئیات CLI برای بررسی فراداده، پیوندهای منبع، نسخه‌ها، تغییرات نسخه و وضعیت اسکن استفاده کنید:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

فهرست‌های عمومی آخرین وضعیت اسکن را نشان می‌دهند. انتشارهایی که به‌دلیل نظارت نگه داشته یا مسدود شده‌اند، ممکن است تا زمان رفع مشکل از سطوح جست‌وجو و نصب پنهان بمانند.

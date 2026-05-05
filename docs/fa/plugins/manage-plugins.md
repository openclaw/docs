---
read_when:
    - شما نمونه‌های سریع نصب، فهرست کردن، به‌روزرسانی یا حذف Plugin را می‌خواهید
    - می‌خواهید بین ClawHub و توزیع Plugin از طریق npm انتخاب کنید
    - شما در حال انتشار یک بسته Plugin هستید
sidebarTitle: Manage plugins
summary: نمونه‌های سریع برای نصب، فهرست کردن، حذف نصب، به‌روزرسانی و انتشار Plugin‌های OpenClaw
title: مدیریت Plugin‌ها
x-i18n:
    generated_at: "2026-05-05T01:50:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

بیشتر گردش‌کارهای Plugin چند فرمان هستند: جستجو، نصب، راه‌اندازی دوباره‌ی Gateway،
راستی‌آزمایی، و حذف نصب زمانی که دیگر به Plugin نیاز ندارید.

## فهرست‌کردن Pluginها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

برای اسکریپت‌ها از `--json` استفاده کنید. این خروجی شامل عیب‌یابی‌های رجیستری و
`dependencyStatus` ایستای هر Plugin است، زمانی که بسته‌ی Plugin
`dependencies` یا `optionalDependencies` را اعلام کرده باشد.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` یک بررسی موجودی سرد است. نشان می‌دهد OpenClaw چه چیزهایی را می‌تواند
از پیکربندی، مانیفست‌ها، و رجیستری Plugin کشف کند؛ اما ثابت نمی‌کند که یک فرایند
Gateway که از قبل در حال اجراست، زمان اجرای Plugin را import کرده است.

## نصب Pluginها

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

پس از نصب کد Plugin، Gatewayای را که به کانال‌های شما سرویس می‌دهد دوباره راه‌اندازی کنید:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

زمانی از `inspect --runtime` استفاده کنید که به مدرکی نیاز دارید مبنی بر اینکه Plugin
سطوح زمان اجرا مانند ابزارها، hookها، سرویس‌ها، متدهای Gateway، یا فرمان‌های CLI
متعلق به Plugin را ثبت کرده است.

## به‌روزرسانی Pluginها

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

اگر Plugin از یک dist-tag مربوط به npm مانند `@beta` نصب شده باشد، فراخوانی‌های بعدی
`update <plugin-id>` همان tag ثبت‌شده را دوباره استفاده می‌کنند. عبور دادن یک spec
صریح npm، نصب ردیابی‌شده را برای به‌روزرسانی‌های آینده به همان spec تغییر می‌دهد.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

فرمان دوم یک Plugin را وقتی پیش‌تر به یک نسخه یا tag دقیق سنجاق شده بود، به خط انتشار
پیش‌فرض رجیستری برمی‌گرداند.

وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin مربوط به npm خط
پیش‌فرض و ClawHub ابتدا انتشار `@beta` متناظر Plugin را امتحان می‌کنند. اگر آن انتشار
beta وجود نداشته باشد، OpenClaw به spec پیش‌فرض/آخرینِ ثبت‌شده برمی‌گردد. برای Pluginهای
npm، اگر بسته‌ی beta وجود داشته باشد اما در اعتبارسنجی نصب شکست بخورد، OpenClaw نیز
عقب‌گرد می‌کند. نسخه‌های دقیق و tagهای صریح مانند `@rc` یا `@beta` حفظ می‌شوند.

## حذف نصب Pluginها

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

حذف نصب، ورودی پیکربندی Plugin، رکورد شاخص Plugin، ورودی‌های فهرست مجاز/ممنوع،
و مسیرهای بارگذاری پیوندشده را در صورت کاربرد حذف می‌کند. دایرکتوری‌های نصب مدیریت‌شده
حذف می‌شوند، مگر اینکه `--keep-files` را عبور دهید.

## انتشار Pluginها

می‌توانید Pluginهای خارجی را در [ClawHub](https://clawhub.ai)، npmjs.com، یا هر دو
منتشر کنید.

### انتشار در ClawHub

ClawHub سطح اصلی کشف عمومی برای Pluginهای OpenClaw است. پیش از نصب، فراداده‌ی قابل
جستجو، تاریخچه‌ی نسخه، و نتایج اسکن رجیستری را به کاربران می‌دهد.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

کاربران از ClawHub با این فرمان نصب می‌کنند:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

فرم بدون پیشوند همچنان ابتدا ClawHub را بررسی می‌کند.

### انتشار در npmjs.com

Pluginهای بومی npm باید شامل یک مانیفست Plugin و فراداده‌ی نقطه ورود OpenClaw در
`package.json` باشند.

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
```

کاربران فقط با npm به این شکل نصب می‌کنند:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

اگر همان بسته در ClawHub هم موجود باشد، `npm:` جستجوی ClawHub را رد می‌کند و
تفکیک npm را اجباری می‌کند.

## انتخاب منبع

- **ClawHub**: زمانی استفاده کنید که کشف بومی OpenClaw، خلاصه‌های اسکن،
  نسخه‌ها، و راهنمایی‌های نصب را می‌خواهید.
- **npmjs.com**: زمانی استفاده کنید که از قبل بسته‌های JavaScript منتشر می‌کنید یا به گردش‌کارهای
  dist-tag/رجیستری خصوصی npm نیاز دارید.
- **Git**: زمانی استفاده کنید که می‌خواهید مستقیماً از یک شاخه، tag، یا commit نصب کنید.
- **مسیر محلی**: زمانی استفاده کنید که در حال توسعه یا آزمایش یک Plugin روی همان
  دستگاه هستید.

## مرتبط

- [Pluginها](/fa/tools/plugin) - نمای کلی و عیب‌یابی
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [ClawHub](/fa/tools/clawhub) - عملیات انتشار و رجیستری
- [ساخت Pluginها](/fa/plugins/building-plugins) - ایجاد یک بسته‌ی Plugin
- [مانیفست Plugin](/fa/plugins/manifest) - مانیفست و فراداده‌ی بسته

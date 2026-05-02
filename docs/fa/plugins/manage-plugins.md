---
read_when:
    - نمونه‌های سریع نصب، فهرست‌کردن، به‌روزرسانی یا حذف Plugin را می‌خواهید
    - می‌خواهید بین ClawHub و توزیع Plugin از طریق npm انتخاب کنید
    - شما در حال انتشار یک بسته Plugin هستید
sidebarTitle: Manage plugins
summary: نمونه‌های سریع برای نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی و انتشار Plugin‌های OpenClaw
title: مدیریت Pluginها
x-i18n:
    generated_at: "2026-05-02T22:21:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

بیشتر گردش‌کارهای Plugin چند فرمان هستند: جست‌وجو، نصب، راه‌اندازی دوباره Gateway،
راستی‌آزمایی، و حذف نصب وقتی دیگر به Plugin نیاز ندارید.

## فهرست کردن Pluginها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

برای اسکریپت‌ها از `--json` استفاده کنید. این خروجی شامل عیب‌یابی‌های رجیستری و
`dependencyStatus` ایستای هر Plugin است، وقتی بسته Plugin، `dependencies` یا
`optionalDependencies` را اعلام کرده باشد.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` یک بررسی موجودی سرد است. نشان می‌دهد OpenClaw چه چیزهایی را می‌تواند
از پیکربندی، manifestها و رجیستری Plugin کشف کند؛ اما ثابت نمی‌کند که یک فرایند
Gateway که از قبل در حال اجراست، runtime مربوط به Plugin را import کرده است.

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

پس از نصب کد Plugin، Gatewayای را که کانال‌های شما را ارائه می‌کند دوباره راه‌اندازی کنید:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

وقتی به مدرکی نیاز دارید که نشان دهد Plugin سطح‌های runtime مانند ابزارها، hookها،
سرویس‌ها، متدهای Gateway، یا فرمان‌های CLI متعلق به Plugin را ثبت کرده است، از
`inspect --runtime` استفاده کنید.

## به‌روزرسانی Pluginها

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

اگر Plugin از یک dist-tag متعلق به npm مانند `@beta` نصب شده باشد، فراخوانی‌های بعدی
`update <plugin-id>` از همان tag ثبت‌شده دوباره استفاده می‌کنند. دادن یک spec صریح npm
نصبِ دنبال‌شده را برای به‌روزرسانی‌های آینده به همان spec تغییر می‌دهد.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

فرمان دوم، وقتی Plugin قبلا به یک نسخه یا tag دقیق سنجاق شده باشد، آن را به خط انتشار
پیش‌فرض رجیستری برمی‌گرداند.

وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin مربوط به npm خط
پیش‌فرض و ClawHub ابتدا تلاش می‌کنند نسخه Plugin `@beta` متناظر را بگیرند. اگر آن نسخه
beta وجود نداشته باشد، OpenClaw به spec پیش‌فرض/آخرینِ ثبت‌شده برمی‌گردد. نسخه‌های دقیق
و tagهای صریح مانند `@rc` یا `@beta` حفظ می‌شوند.

## حذف نصب Pluginها

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

حذف نصب، ورودی پیکربندی Plugin، رکورد index Plugin، ورودی‌های فهرست مجاز/مسدود، و در
صورت کاربرد، مسیرهای بارگذاری link‌شده را حذف می‌کند. دایرکتوری‌های نصب مدیریت‌شده
حذف می‌شوند مگر اینکه `--keep-files` را بدهید.

## انتشار Pluginها

می‌توانید Pluginهای خارجی را در [ClawHub](https://clawhub.ai)، npmjs.com، یا هر دو
منتشر کنید.

### انتشار در ClawHub

ClawHub سطح اصلی کشف عمومی برای Pluginهای OpenClaw است. پیش از نصب، metadata قابل
جست‌وجو، تاریخچه نسخه‌ها، و نتایج اسکن رجیستری را به کاربران می‌دهد.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

کاربران با این فرمان‌ها از ClawHub نصب می‌کنند:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

فرم بدون پیشوند همچنان ابتدا ClawHub را بررسی می‌کند.

### انتشار در npmjs.com

Pluginهای بومی npm باید یک manifest مربوط به Plugin و metadata نقطه ورود OpenClaw در
`package.json` داشته باشند.

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

کاربران فقط از npm با این فرمان‌ها نصب می‌کنند:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

اگر همان بسته در ClawHub نیز در دسترس باشد، `npm:` جست‌وجوی ClawHub را رد می‌کند و
resolve شدن از npm را اجباری می‌کند.

## انتخاب منبع

- **ClawHub**: وقتی استفاده کنید که کشف بومی OpenClaw، خلاصه‌های اسکن،
  نسخه‌ها و راهنمایی‌های نصب می‌خواهید.
- **npmjs.com**: وقتی استفاده کنید که از قبل بسته‌های JavaScript منتشر می‌کنید یا به
  dist-tagهای npm/گردش‌کارهای رجیستری خصوصی نیاز دارید.
- **Git**: وقتی استفاده کنید که می‌خواهید مستقیما از یک branch، tag، یا commit نصب کنید.
- **مسیر محلی**: وقتی استفاده کنید که در حال توسعه یا آزمایش یک Plugin روی همان
  دستگاه هستید.

## مرتبط

- [Pluginها](/fa/tools/plugin) - نمای کلی و عیب‌یابی
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [ClawHub](/fa/tools/clawhub) - عملیات انتشار و رجیستری
- [ساخت Pluginها](/fa/plugins/building-plugins) - ایجاد یک بسته Plugin
- [manifest مربوط به Plugin](/fa/plugins/manifest) - metadata مربوط به manifest و بسته

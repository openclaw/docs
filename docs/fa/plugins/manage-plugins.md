---
read_when:
    - نمونه‌های سریعی برای نصب، فهرست‌کردن، به‌روزرسانی یا حذف Plugin می‌خواهید
    - می‌خواهید میان ClawHub و توزیع Plugin از طریق npm انتخاب کنید
    - شما در حال انتشار یک بسته Plugin هستید
sidebarTitle: Manage plugins
summary: نمونه‌های سریع برای نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی و انتشار Plugin‌های OpenClaw
title: مدیریت Plugin‌ها
x-i18n:
    generated_at: "2026-05-10T19:55:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

بیشتر گردش‌کارهای Plugin شامل چند فرمان هستند: جست‌وجو، نصب، راه‌اندازی دوباره Gateway،
راستی‌آزمایی، و حذف نصب وقتی دیگر به Plugin نیاز ندارید.

## فهرست Pluginها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

برای اسکریپت‌ها از `--json` استفاده کنید. این خروجی شامل عیب‌یابی‌های registry و
`dependencyStatus` ایستای هر Plugin است، زمانی که بسته Plugin، `dependencies` یا
`optionalDependencies` را اعلام کند.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` یک بررسی موجودی سرد است. نشان می‌دهد OpenClaw چه چیزهایی را می‌تواند
از پیکربندی، manifestها و registry Plugin کشف کند؛ اما ثابت نمی‌کند که یک فرایند
Gateway که از قبل در حال اجراست، runtime آن Plugin را import کرده است.

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

پس از نصب کد Plugin، Gatewayای را که channelهای شما را سرویس می‌دهد دوباره راه‌اندازی کنید:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

وقتی به اثبات نیاز دارید که Plugin سطح‌های runtime مانند ابزارها، hookها، سرویس‌ها،
متدهای Gateway، یا فرمان‌های CLI متعلق به Plugin را ثبت کرده است، از `inspect --runtime`
استفاده کنید.

## به‌روزرسانی Pluginها

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

اگر یک Plugin از یک dist-tag در npm مانند `@beta` نصب شده باشد، فراخوانی‌های بعدی
`update <plugin-id>` همان tag ثبت‌شده را دوباره استفاده می‌کنند. عبور دادن یک spec
صریح npm، نصب ردیابی‌شده را برای به‌روزرسانی‌های آینده به همان spec تغییر می‌دهد.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

فرمان دوم، وقتی یک Plugin قبلا به یک نسخه دقیق یا tag سنجاق شده باشد، آن را به خط
انتشار پیش‌فرض registry برمی‌گرداند.

وقتی `openclaw update` روی channel بتا اجرا می‌شود، رکوردهای Plugin در خط پیش‌فرض npm
و ClawHub ابتدا انتشار متناظر `@beta` آن Plugin را امتحان می‌کنند. اگر آن انتشار بتا
وجود نداشته باشد، OpenClaw به spec پیش‌فرض/آخرینِ ثبت‌شده برمی‌گردد. برای Pluginهای npm،
OpenClaw همچنین زمانی برمی‌گردد که بسته بتا وجود دارد اما اعتبارسنجی نصب آن شکست می‌خورد.
نسخه‌های دقیق و tagهای صریح مانند `@rc` یا `@beta` حفظ می‌شوند.

## حذف نصب Pluginها

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

حذف نصب، ورودی پیکربندی Plugin، رکورد index Plugin، ورودی‌های فهرست اجازه/رد، و در صورت
کاربرد مسیرهای بارگذاری پیوندشده را حذف می‌کند. دایرکتوری‌های نصب مدیریت‌شده حذف می‌شوند
مگر اینکه `--keep-files` را عبور دهید.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، فرمان‌های نصب، به‌روزرسانی، حذف نصب، فعال‌سازی،
و غیرفعال‌سازی Plugin غیرفعال هستند. به‌جای آن، این انتخاب‌ها را در منبع Nix مربوط به
نصب مدیریت کنید؛ برای nix-openclaw، از
[شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.

## انتشار Pluginها

می‌توانید Pluginهای خارجی را در [ClawHub](https://clawhub.ai)، npmjs.com، یا هر دو
منتشر کنید.

### انتشار در ClawHub

ClawHub سطح اصلی کشف عمومی برای Pluginهای OpenClaw است. پیش از نصب، به کاربران
فراداده قابل جست‌وجو، تاریخچه نسخه‌ها، و نتایج اسکن registry ارائه می‌دهد.

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

Pluginهای native npm باید شامل یک manifest Plugin و فراداده entrypoint مربوط به OpenClaw
در `package.json` باشند.

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

کاربران حالت فقط npm را با این فرمان نصب می‌کنند:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

اگر همان بسته در ClawHub هم موجود باشد، `npm:` جست‌وجوی ClawHub را رد می‌کند و
resolution از npm را اجباری می‌کند.

## انتخاب منبع

- **ClawHub**: زمانی استفاده کنید که کشف native برای OpenClaw، خلاصه‌های اسکن،
  نسخه‌ها، و راهنمایی‌های نصب را می‌خواهید.
- **npmjs.com**: زمانی استفاده کنید که از قبل بسته‌های JavaScript منتشر می‌کنید یا به
  گردش‌کارهای dist-tag/registry خصوصی npm نیاز دارید.
- **Git**: زمانی استفاده کنید که می‌خواهید مستقیما از یک branch، tag، یا commit نصب کنید.
- **مسیر محلی**: زمانی استفاده کنید که در حال توسعه یا آزمایش یک Plugin روی همان
  ماشین هستید.

## مرتبط

- [Pluginها](/fa/tools/plugin) - نمای کلی و عیب‌یابی
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [ClawHub](/fa/clawhub/cli) - عملیات انتشار و registry
- [ساخت Pluginها](/fa/plugins/building-plugins) - ایجاد یک بسته Plugin
- [manifest Plugin](/fa/plugins/manifest) - manifest و فراداده بسته

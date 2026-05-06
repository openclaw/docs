---
read_when:
    - نمونه‌های سریعی برای نصب، فهرست‌کردن، به‌روزرسانی یا حذف Plugin می‌خواهید
    - می‌خواهید بین ClawHub و توزیع Plugin از طریق npm انتخاب کنید
    - در حال انتشار یک بسته Plugin هستید
sidebarTitle: Manage plugins
summary: نمونه‌های سریع برای نصب، فهرست‌کردن، حذف نصب، به‌روزرسانی و انتشار Pluginهای OpenClaw
title: مدیریت Pluginها
x-i18n:
    generated_at: "2026-05-06T18:01:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

بیشتر گردش‌کارهای Plugin با چند فرمان انجام می‌شوند: جست‌وجو، نصب، راه‌اندازی دوباره Gateway،
تأیید، و حذف نصب وقتی دیگر به Plugin نیاز ندارید.

## فهرست Plugin‌ها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

از `--json` برای اسکریپت‌ها استفاده کنید. این خروجی شامل عیب‌یابی‌های رجیستری و
`dependencyStatus` ایستای هر Plugin است، وقتی بسته Plugin مقدار `dependencies` یا
`optionalDependencies` را اعلام کرده باشد.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` یک بررسی موجودی سرد است. نشان می‌دهد OpenClaw از پیکربندی،
مانیفست‌ها، و رجیستری Plugin چه چیزهایی را می‌تواند کشف کند؛ اما ثابت نمی‌کند که
فرآیند Gateway که از قبل در حال اجراست، زمان اجرای Plugin را وارد کرده باشد.

## نصب Plugin‌ها

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

پس از نصب کد Plugin، Gateway را که کانال‌های شما را سرویس می‌دهد دوباره راه‌اندازی کنید:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

وقتی به مدرک نیاز دارید که Plugin سطح‌های زمان اجرا مانند ابزارها، هوک‌ها،
سرویس‌ها، روش‌های Gateway، یا فرمان‌های CLI متعلق به Plugin را ثبت کرده است،
از `inspect --runtime` استفاده کنید.

## به‌روزرسانی Plugin‌ها

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

اگر یک Plugin از یک برچسب انتشار npm مانند `@beta` نصب شده باشد، فراخوانی‌های بعدی
`update <plugin-id>` همان برچسب ثبت‌شده را دوباره استفاده می‌کنند. عبور دادن یک مشخصات npm صریح
نصب رهگیری‌شده را برای به‌روزرسانی‌های آینده به همان مشخصات تغییر می‌دهد.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

فرمان دوم یک Plugin را، وقتی قبلاً به یک نسخه دقیق یا برچسب سنجاق شده باشد،
به خط انتشار پیش‌فرض رجیستری برمی‌گرداند.

وقتی `openclaw update` روی کانال بتا اجرا می‌شود، رکوردهای Plugin خط پیش‌فرض npm و ClawHub
ابتدا انتشار `@beta` متناظر Plugin را امتحان می‌کنند. اگر آن انتشار بتا
وجود نداشته باشد، OpenClaw به مشخصات پیش‌فرض/آخرین ثبت‌شده برمی‌گردد.
برای Plugin‌های npm، وقتی بسته بتا وجود دارد اما در اعتبارسنجی نصب شکست می‌خورد نیز
OpenClaw به حالت جایگزین برمی‌گردد. نسخه‌های دقیق و برچسب‌های صریح مانند `@rc` یا `@beta`
حفظ می‌شوند.

## حذف نصب Plugin‌ها

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

حذف نصب، ورودی پیکربندی Plugin، رکورد شاخص Plugin، ورودی‌های فهرست مجاز/مسدود،
و مسیرهای بارگذاری لینک‌شده را در صورت کاربرد حذف می‌کند. دایرکتوری‌های نصب مدیریت‌شده
حذف می‌شوند، مگر اینکه `--keep-files` را عبور دهید.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، فرمان‌های نصب، به‌روزرسانی، حذف نصب، فعال‌سازی،
و غیرفعال‌سازی Plugin غیرفعال هستند. در عوض این انتخاب‌ها را در منبع Nix مربوط به
نصب مدیریت کنید؛ برای nix-openclaw، از
[شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور استفاده کنید.

## انتشار Plugin‌ها

می‌توانید Plugin‌های بیرونی را در [ClawHub](https://clawhub.ai)، npmjs.com، یا
هر دو منتشر کنید.

### انتشار در ClawHub

ClawHub سطح اصلی کشف عمومی برای Plugin‌های OpenClaw است. پیش از نصب،
فراداده قابل جست‌وجو، تاریخچه نسخه، و نتایج اسکن رجیستری را در اختیار
کاربران می‌گذارد.

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

فرم ساده همچنان ابتدا ClawHub را بررسی می‌کند.

### انتشار در npmjs.com

Plugin‌های بومی npm باید شامل یک مانیفست Plugin و فراداده نقطه ورود OpenClaw در `package.json` باشند.

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

کاربران موردهای فقط npm را با این فرمان نصب می‌کنند:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

اگر همان بسته در ClawHub نیز در دسترس باشد، `npm:` جست‌وجوی ClawHub را رد می‌کند و
حل‌وفصل npm را اجباری می‌کند.

## انتخاب منبع

- **ClawHub**: وقتی می‌خواهید کشف بومی OpenClaw، خلاصه‌های اسکن،
  نسخه‌ها، و راهنمایی‌های نصب داشته باشید، استفاده کنید.
- **npmjs.com**: وقتی از قبل بسته‌های JavaScript منتشر می‌کنید یا به
  گردش‌کارهای برچسب انتشار/رجیستری خصوصی npm نیاز دارید، استفاده کنید.
- **Git**: وقتی می‌خواهید مستقیماً از یک شاخه، برچسب، یا کامیت نصب کنید، استفاده کنید.
- **مسیر محلی**: وقتی در حال توسعه یا آزمایش یک Plugin روی همان
  ماشین هستید، استفاده کنید.

## مرتبط

- [Plugin‌ها](/fa/tools/plugin) - نمای کلی و عیب‌یابی
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [ClawHub](/fa/tools/clawhub) - انتشار و عملیات رجیستری
- [ساخت Plugin‌ها](/fa/plugins/building-plugins) - ایجاد یک بسته Plugin
- [مانیفست Plugin](/fa/plugins/manifest) - مانیفست و فراداده بسته

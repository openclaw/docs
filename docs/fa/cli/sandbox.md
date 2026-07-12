---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: زمان‌های اجرای سندباکس را مدیریت کنید و سیاست مؤثر سندباکس را بررسی کنید
title: CLI سندباکس
x-i18n:
    generated_at: "2026-07-12T09:50:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

مدیریت محیط‌های اجرایی سندباکس برای اجرای ایزولهٔ عامل: کانتینرهای Docker، مقصدهای SSH یا بک‌اندهای OpenShell.

## فرمان‌ها

### `openclaw sandbox list`

فهرست محیط‌های اجرایی سندباکس را همراه با وضعیت، بک‌اند، تطابق پیکربندی، عمر، زمان بیکاری و نشست/عامل مرتبط نمایش می‌دهد.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # فقط کانتینرهای مرورگر
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

محیط‌های اجرایی سندباکس را حذف می‌کند تا ایجاد مجدد آن‌ها با پیکربندی فعلی اجباری شود. دفعهٔ بعد که از عامل استفاده شود، محیط‌های اجرایی به‌طور خودکار دوباره ایجاد می‌شوند.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # شامل زیرنشست‌های agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # فقط کانتینرهای مرورگر
openclaw sandbox recreate --all --force        # رد کردن تأیید
```

گزینه‌ها:

- `--all`: ایجاد مجدد همهٔ کانتینرهای سندباکس
- `--session <key>`: ایجاد مجدد محیط اجرایی با همین کلید دامنهٔ دقیق (همان‌طور که در `sandbox list` نمایش داده می‌شود)؛ نام کوتاه گسترش نمی‌یابد
- `--agent <id>`: ایجاد مجدد محیط‌های اجرایی یک عامل (با `agent:<id>` و `agent:<id>:*` مطابقت دارد)
- `--browser`: فقط کانتینرهای مرورگر را تحت تأثیر قرار می‌دهد
- `--force`: اعلان تأیید را رد می‌کند

دقیقاً یکی از `--all`،‏ `--session` یا `--agent` را ارسال کنید.

برای `ssh` و حالت `remote` در OpenShell، ایجاد مجدد نسبت به Docker اهمیت بیشتری دارد: پس از بذرگذاری اولیه، فضای کاری راه‌دور مرجع اصلی است؛ `recreate` این فضای کاری راه‌دور مرجع را برای دامنهٔ انتخاب‌شده حذف می‌کند و اجرای بعدی آن را از فضای کاری محلی فعلی دوباره بذرگذاری می‌کند.

### `openclaw sandbox explain`

حالت و دامنهٔ مؤثر سندباکس، دسترسی به فضای کاری، خط‌مشی ابزارهای سندباکس و دروازه‌های ابزارهای دارای دسترسی ارتقایافته را بررسی می‌کند (همراه با مسیر کلیدهای پیکربندی برای رفع مشکل).

گزارش، `workspaceRoot` را به‌عنوان ریشهٔ پیکربندی‌شدهٔ سندباکس حفظ می‌کند و فضای کاری مؤثر میزبان، دایرکتوری کاری محیط اجرایی بک‌اند و جدول اتصال‌های Docker را جداگانه نمایش می‌دهد. برای `workspaceAccess: "rw"`، فضای کاری مؤثر میزبان به‌جای دایرکتوری‌ای در زیر `workspaceRoot`، فضای کاری عامل است.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

برخلاف `recreate --session`، این فرمان نام‌های کوتاه نشست (برای مثال `main`) را می‌پذیرد و آن‌ها را بر اساس عامل حل‌شده گسترش می‌دهد.

## چرا ایجاد مجدد لازم است

به‌روزرسانی پیکربندی سندباکس بر کانتینرهای در حال اجرا اثر نمی‌گذارد: محیط‌های اجرایی موجود تنظیمات قدیمی خود را حفظ می‌کنند و محیط‌های اجرایی بیکار فقط پس از `prune.idleHours` (پیش‌فرض ۲۴ ساعت) پاک‌سازی می‌شوند. عامل‌هایی که به‌طور منظم استفاده می‌شوند، می‌توانند محیط‌های اجرایی منسوخ را برای همیشه زنده نگه دارند. `openclaw sandbox recreate` محیط اجرایی قدیمی را حذف می‌کند تا در استفادهٔ بعدی، بر اساس پیکربندی فعلی بازسازی شود.

<Tip>
به‌جای پاک‌سازی دستی و مختص هر بک‌اند، `openclaw sandbox recreate` را ترجیح دهید. این فرمان از رجیستری محیط اجرایی Gateway استفاده می‌کند و هنگام تغییر دامنه یا کلیدهای نشست، از ناهماهنگی جلوگیری می‌کند.
</Tip>

## محرک‌های رایج

| تغییر                                                                                                                                                          | فرمان                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| به‌روزرسانی ایمیج Docker (`agents.defaults.sandbox.docker.image`)                                                                                              | `openclaw sandbox recreate --all`                                   |
| پیکربندی سندباکس (`agents.defaults.sandbox.*`)                                                                                                                 | `openclaw sandbox recreate --all`                                   |
| مقصد/احراز هویت SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| منبع/خط‌مشی/حالت OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                              | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (یا `--agent <id>` برای یک عامل) |

<Note>
محیط‌های اجرایی هنگام استفادهٔ بعدی از عامل، به‌طور خودکار دوباره ایجاد می‌شوند.
</Note>

## مهاجرت رجیستری

فرادادهٔ محیط اجرایی سندباکس در پایگاه‌دادهٔ وضعیت SQLite مشترک نگهداری می‌شود. نصب‌های قدیمی‌تر ممکن است فایل‌های رجیستری قدیمی داشته باشند که خواندن‌های معمول دیگر آن‌ها را بازنویسی نمی‌کنند:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- یک قطعهٔ JSON برای هر کانتینر/مرورگر در `~/.openclaw/sandbox/containers/` یا `~/.openclaw/sandbox/browsers/`

برای مهاجرت ورودی‌های قدیمی معتبر به SQLite،‏ `openclaw doctor --fix` را اجرا کنید. فایل‌های قدیمی نامعتبر قرنطینه می‌شوند تا یک رجیستری قدیمی خراب نتواند ورودی‌های فعلی محیط اجرایی را پنهان کند.

## پیکربندی

تنظیمات سندباکس در `~/.openclaw/openclaw.json` و زیر `agents.defaults.sandbox` قرار دارند (بازنویسی‌های مخصوص هر عامل در `agents.list[].sandbox` قرار می‌گیرند):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (plugin-provided)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... گزینه‌های بیشتر Docker
        },
        "prune": {
          "idleHours": 24, // پاک‌سازی خودکار پس از ۲۴ ساعت بیکاری
          "maxAgeDays": 7, // پاک‌سازی خودکار پس از ۷ روز
        },
      },
    },
  },
}
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [سندباکس‌سازی](/fa/gateway/sandboxing)
- [فضای کاری عامل](/fa/concepts/agent-workspace)
- [Doctor](/fa/gateway/doctor): راه‌اندازی سندباکس را بررسی می‌کند.

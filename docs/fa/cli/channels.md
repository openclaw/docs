---
read_when:
    - می‌خواهید حساب‌های کانال را اضافه یا حذف کنید (Discord، Google Chat، iMessage، Matrix، Signal، Slack، Telegram، WhatsApp و موارد دیگر)
    - می‌خواهید وضعیت کانال را بررسی کنید یا لاگ‌های کانال را به‌صورت زنده دنبال کنید
summary: مرجع CLI برای `openclaw channels` (حساب‌ها، وضعیت، قابلیت‌ها، رفع، گزارش‌ها، ورود/خروج)
title: کانال‌ها
x-i18n:
    generated_at: "2026-07-12T09:44:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

حساب‌های کانال‌های گفت‌وگو و وضعیت زمان اجرای آن‌ها را در Gateway مدیریت کنید.

مستندات مرتبط:

- راهنماهای کانال: [کانال‌ها](/fa/channels)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)

## فرمان‌های رایج

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` فقط کانال‌های گفت‌وگو را نمایش می‌دهد: به‌طور پیش‌فرض حساب‌های پیکربندی‌شده، همراه با برچسب‌های وضعیت `installed`، `configured` و `enabled` برای هر حساب (`--json` برای خروجی قابل‌پردازش توسط ماشین). برای نمایش کانال‌های همراهی که هنوز حساب پیکربندی‌شده‌ای ندارند و کانال‌های کاتالوگی قابل‌نصب که هنوز روی دیسک نیستند، `--all` را نیز وارد کنید. احراز هویت ارائه‌دهنده و میزان استفاده از مدل در بخش‌های دیگری قرار دارند: `openclaw models auth list` برای پروفایل‌های احراز هویت ارائه‌دهنده و `openclaw status` یا `openclaw models list` برای مصرف/سهمیه.

## وضعیت / قابلیت‌ها / تفکیک / گزارش‌ها

- `channels status`: `--channel <name>`، `--probe`، `--timeout <ms>` (پیش‌فرض `10000`)، `--json`
- `channels capabilities`: `--channel <name>`، `--account <id>` (نیازمند `--channel`)، `--target <dest>` (نیازمند `--channel`)، `--timeout <ms>` (پیش‌فرض `10000`، با سقف `30000`)، `--json`
- `channels resolve <entries...>`: `--channel <name>`، `--account <id>`، `--kind <auto|user|group>` (پیش‌فرض `auto`)، `--json`
- `channels logs`: `--channel <name|all>` (پیش‌فرض `all`)، `--lines <n>` (پیش‌فرض `200`)، `--json`

`channels status --probe` مسیر زنده است: در یک Gateway در دسترس، بررسی‌های `probeAccount` و در صورت وجود `auditAccount` را برای هر حساب اجرا می‌کند؛ بنابراین خروجی می‌تواند وضعیت انتقال را همراه با نتایج وارسی مانند `works`، `probe failed`، `audit ok` یا `audit failed` شامل شود. اگر Gateway در دسترس نباشد، `channels status` به‌جای خروجی وارسی زنده، خلاصه‌هایی را صرفاً بر پایه پیکربندی ارائه می‌کند.

از `openclaw sessions`، فرمان `sessions.list` در Gateway یا ابزار `sessions_list` عامل به‌عنوان نشانه سلامت سوکت کانال استفاده نکنید. این سطوح ردیف‌های ذخیره‌شده مکالمه را گزارش می‌کنند، نه وضعیت زمان اجرای ارائه‌دهنده را. پس از راه‌اندازی مجدد ارائه‌دهنده Discord، ممکن است حسابی متصل اما بی‌فعالیت سالم باشد، درحالی‌که تا رویداد ورودی یا خروجی بعدی مکالمه هیچ ردیف نشست Discord ظاهر نشود.

## افزودن / حذف حساب‌ها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` پرچم‌های ویژه هر کانال را نمایش می‌دهد (توکن، کلید خصوصی، توکن برنامه، مسیرهای signal-cli و غیره).
</Tip>

`channels remove` فقط روی Pluginهای کانال نصب‌شده/پیکربندی‌شده عمل می‌کند. برای کانال‌های کاتالوگی قابل‌نصب، ابتدا از `channels add` استفاده کنید. بدون `--delete` از شما می‌پرسد که آیا حساب غیرفعال شود و پیکربندی آن را نگه می‌دارد؛ `--delete` ورودی‌های پیکربندی را بدون درخواست تأیید حذف می‌کند.
برای Pluginهای کانال متکی به زمان اجرا، `channels remove` همچنین پیش از به‌روزرسانی پیکربندی از Gateway در حال اجرا می‌خواهد حساب انتخاب‌شده را متوقف کند؛ بنابراین غیرفعال‌سازی یا حذف حساب باعث نمی‌شود شنونده قدیمی تا راه‌اندازی مجدد فعال بماند.

پرچم‌های افزودن غیرتعاملی مشترک میان کانال‌ها: `--account <id>`، `--name <name>`، `--token`، `--token-file`، `--bot-token`، `--app-token`، `--secret`، `--secret-file`، `--password`، `--cli-path`، `--url`، `--base-url`، `--http-url`، `--auth-dir` و `--use-env` (احراز هویت متکی به متغیر محیطی، فقط برای حساب پیش‌فرض و در صورت پشتیبانی). پرچم‌های ویژه کانال شامل موارد زیر هستند:

| کانال       | پرچم‌ها                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`، `--webhook-url`، `--audience-type`، `--audience`                                   |
| iMessage    | `--cli-path`، `--db-path`، `--service`، `--region`                                                   |
| Matrix      | `--homeserver`، `--user-id`، `--access-token`، `--password`، `--device-name`، `--initial-sync-limit` |
| Nostr       | `--private-key`، `--relay-urls`                                                                      |
| Signal      | `--signal-number`، `--cli-path`، `--http-url`، `--http-host`، `--http-port`                          |
| Tlon        | `--ship`، `--url`، `--code`، `--group-channels`، `--dm-allowlist`، `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

اگر هنگام اجرای فرمان افزودن مبتنی بر پرچم لازم باشد Plugin یک کانال نصب شود، OpenClaw بدون باز کردن اعلان تعاملی نصب Plugin، از منبع نصب پیش‌فرض کانال استفاده می‌کند.

هنگامی که `openclaw channels add` را بدون پرچم اجرا می‌کنید، جادوگر تعاملی می‌تواند موارد زیر را درخواست کند:

- شناسه‌های حساب برای هر کانال انتخاب‌شده
- نام‌های نمایشی اختیاری برای آن حساب‌ها
- `Route these channel accounts to agents now?`

اگر اتصال فوری را تأیید کنید، جادوگر می‌پرسد کدام عامل باید مالک هر حساب کانال پیکربندی‌شده باشد و اتصال‌های مسیریابی مختص حساب را می‌نویسد.

همچنین می‌توانید همین قواعد مسیریابی را بعداً با `openclaw agents bindings`، `openclaw agents bind` و `openclaw agents unbind` مدیریت کنید ([عامل‌ها](/fa/cli/agents) را ببینید).

هنگامی که یک حساب غیراصلی را به کانالی اضافه می‌کنید که هنوز از تنظیمات سطح بالای تک‌حسابی استفاده می‌کند، OpenClaw پیش از نوشتن حساب جدید، آن مقادیر سطح بالا را به نگاشت حساب‌های کانال منتقل می‌کند. اگر کانال دقیقاً یک حساب نام‌گذاری‌شده داشته باشد یا `defaultAccount` به یکی اشاره کند، این انتقال از همان حساب موجود استفاده می‌کند؛ در غیر این صورت، مقادیر در `channels.<channel>.accounts.default` قرار می‌گیرند.

رفتار مسیریابی سازگار باقی می‌ماند:

- اتصال‌های موجودِ فقط‌کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند.
- `channels add` در حالت غیرتعاملی اتصال‌ها را به‌طور خودکار ایجاد یا بازنویسی نمی‌کند.
- راه‌اندازی تعاملی می‌تواند به‌صورت اختیاری اتصال‌های مختص حساب اضافه کند.

اگر پیکربندی شما از قبل در وضعیت ترکیبی بوده است (حساب‌های نام‌گذاری‌شده وجود دارند و مقادیر سطح بالای تک‌حسابی همچنان تنظیم شده‌اند)، `openclaw doctor --fix` را اجرا کنید تا مقادیر مختص حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال منتقل شوند.

## ورود و خروج (تعاملی)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` از `--account <id>` و `--verbose` پشتیبانی می‌کند؛ `channels logout` از `--account <id>` پشتیبانی می‌کند.
- اگر فقط یک کانال پیکربندی‌شده از این عملیات پشتیبانی کند، `channels login` و `logout` می‌توانند کانال را استنباط کنند؛ اگر چند کانال وجود دارد، `--channel` را وارد کنید.
- `channels logout` در صورت دسترسی، مسیر زنده Gateway را ترجیح می‌دهد تا پیش از پاک‌سازی وضعیت احراز هویت کانال، هر شنونده فعال را متوقف کند. اگر Gateway محلی در دسترس نباشد، به پاک‌سازی محلی احراز هویت برمی‌گردد؛ با `gateway.mode: "remote"`، خطای Gateway در عوض باعث شکست فرمان می‌شود.
- پس از ورود موفق، CLI از یک Gateway محلی در دسترس می‌خواهد حساب را راه‌اندازی کند؛ در حالت راه‌دور، احراز هویت را به‌صورت محلی ذخیره می‌کند و یادآور می‌شود که زمان اجرای راه‌دور دوباره راه‌اندازی نشده است.
- `channels login` را از یک پایانه روی میزبان Gateway اجرا کنید. `exec` عامل این جریان ورود تعاملی را مسدود می‌کند؛ در صورت وجود، برای ورود از طریق گفت‌وگو باید از ابزارهای ورود بومی کانال عامل، مانند `whatsapp_login`، استفاده شود.

## عیب‌یابی

- برای یک وارسی گسترده، `openclaw status --deep` را اجرا کنید.
- برای اصلاحات هدایت‌شده از `openclaw doctor` استفاده کنید.
- وقتی Gateway در دسترس نباشد، `openclaw channels status` به خلاصه‌های صرفاً مبتنی بر پیکربندی برمی‌گردد. اگر اعتبارنامه یک کانال پشتیبانی‌شده از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، آن حساب را به‌عنوان پیکربندی‌شده همراه با یادداشت‌های وضعیت تنزل‌یافته گزارش می‌کند، نه اینکه آن را پیکربندی‌نشده نشان دهد.

## وارسی قابلیت‌ها

راهنمای قابلیت‌های ارائه‌دهنده (مجوزهای رویداد/دامنه‌ها، در صورت وجود) را همراه با پشتیبانی ایستای ویژگی‌ها دریافت کنید:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

نکته‌ها:

- `--channel` اختیاری است؛ برای فهرست کردن همه کانال‌ها (از جمله کانال‌های فراهم‌شده توسط Plugin) آن را حذف کنید.
- `--account` فقط همراه با `--channel` معتبر است.
- `--target` مقدار `channel:<id>` یا شناسه عددی خام کانال را می‌پذیرد و فقط برای Discord کاربرد دارد. برای کانال‌های صوتی Discord، بررسی مجوز، نبود `ViewChannel`، `Connect`، `Speak`، `SendMessages` و `ReadMessageHistory` را علامت‌گذاری می‌کند.
- وارسی‌ها ویژه ارائه‌دهنده هستند: هویت ربات Discord و مجوزهای رویداد به‌همراه مجوزهای اختیاری کانال؛ ربات Slack و دامنه‌های کاربر؛ پرچم‌های ربات Telegram و Webhook؛ نسخه سرویس Signal؛ توکن برنامه Microsoft Teams و نقش‌ها/دامنه‌های Graph (در موارد شناخته‌شده همراه با توضیح). کانال‌های بدون وارسی، `Probe: unavailable` را گزارش می‌کنند.

## تبدیل نام‌ها به شناسه‌ها

نام کانال‌ها/کاربران را با استفاده از فهرست ارائه‌دهنده به شناسه تبدیل کنید:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

نکته‌ها:

- برای اجبار نوع مقصد، از `--kind user|group|auto` استفاده کنید.
- هنگامی که چند ورودی نام یکسانی دارند، تفکیک، تطبیق‌های فعال را ترجیح می‌دهد.
- `channels resolve` فقط‌خواندنی است. اگر حساب انتخاب‌شده از طریق SecretRef پیکربندی شده باشد اما آن اعتبارنامه در مسیر فرمان فعلی در دسترس نباشد، فرمان به‌جای لغو کل اجرا، نتایج تفکیک‌نشده با وضعیت تنزل‌یافته و همراه با یادداشت‌ها را بازمی‌گرداند.
- `channels resolve` Pluginهای کانال را نصب نمی‌کند. پیش از تفکیک نام‌ها برای یک کانال کاتالوگی قابل‌نصب، از `channels add --channel <name>` استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی کانال‌ها](/fa/channels)

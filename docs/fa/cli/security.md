---
read_when:
    - می‌خواهید یک ممیزی امنیتی سریع روی پیکربندی/وضعیت اجرا کنید
    - می‌خواهید پیشنهادهای ایمن «اصلاح» را اعمال کنید (مجوزها، سخت‌گیرانه‌تر کردن پیش‌فرض‌ها)
summary: مرجع CLI برای `openclaw security` (ممیزی و رفع خطاهای رایج امنیتی)
title: امنیت
x-i18n:
    generated_at: "2026-05-06T17:55:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

ابزارهای امنیتی (ممیزی + اصلاحات اختیاری).

مرتبط:

- راهنمای امنیت: [امنیت](/fa/gateway/security)

## ممیزی

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

`security audit` ساده روی مسیر سرد پیکربندی/سامانه‌فایل/فقط‌خواندنی باقی می‌ماند. به‌طور پیش‌فرض گردآورنده‌های امنیتی زمان اجرای Plugin را کشف نمی‌کند، بنابراین ممیزی‌های معمول همه زمان‌های اجرای Plugin نصب‌شده را بارگذاری نمی‌کنند. برای گنجاندن پروب‌های زنده Gateway به‌صورت بهترین‌تلاش و گردآورنده‌های ممیزی امنیتی متعلق به Plugin از `--deep` استفاده کنید؛ فراخوان‌های داخلی صریح نیز وقتی از قبل دامنه زمان اجرای مناسبی داشته باشند، می‌توانند این گردآورنده‌های متعلق به Plugin را فعال کنند.

ممیزی وقتی چند فرستنده DM نشست اصلی را به‌اشتراک می‌گذارند هشدار می‌دهد و **حالت DM امن** را توصیه می‌کند: `session.dmScope="per-channel-peer"` (یا `per-account-channel-peer` برای کانال‌های چندحسابی) برای صندوق‌های ورودی مشترک.
این برای سخت‌سازی صندوق‌های ورودی مشارکتی/مشترک است. یک Gateway واحد که توسط متصدیان متقابلاً غیرقابل‌اعتماد/متخاصم به‌اشتراک گذاشته می‌شود، پیکربندی توصیه‌شده‌ای نیست؛ مرزهای اعتماد را با Gatewayهای جداگانه (یا کاربران/میزبان‌های سیستم‌عامل جداگانه) تفکیک کنید.
همچنین وقتی پیکربندی نشان‌دهنده احتمال ورود کاربران مشترک باشد (برای مثال سیاست DM/گروه باز، اهداف گروهی پیکربندی‌شده، یا قواعد فرستنده wildcard)، `security.trust_model.multi_user_heuristic` را منتشر می‌کند و یادآوری می‌کند که OpenClaw به‌طور پیش‌فرض مدل اعتماد دستیار شخصی دارد.
برای پیکربندی‌های عمدی کاربر مشترک، راهنمای ممیزی این است که همه نشست‌ها را sandbox کنید، دسترسی سامانه‌فایل را به workspace محدود نگه دارید، و هویت‌ها یا اعتبارنامه‌های شخصی/خصوصی را از آن زمان اجرا دور نگه دارید.
همچنین وقتی مدل‌های کوچک (`<=300B`) بدون sandboxing و با ابزارهای وب/مرورگر فعال استفاده شوند هشدار می‌دهد.
برای ورود Webhook، وقتی `hooks.token` توکن Gateway را دوباره استفاده می‌کند، وقتی `hooks.token` کوتاه است، وقتی `hooks.path="/"` است، وقتی `hooks.defaultSessionKey` تنظیم نشده است، وقتی `hooks.allowedAgentIds` نامحدود است، وقتی بازنویسی‌های `sessionKey` در درخواست فعال هستند، و وقتی بازنویسی‌ها بدون `hooks.allowedSessionKeyPrefixes` فعال هستند هشدار می‌دهد.
همچنین وقتی تنظیمات Docker مربوط به sandbox پیکربندی شده اما حالت sandbox خاموش است، وقتی `gateway.nodes.denyCommands` از ورودی‌های شبیه الگو/ناشناخته بی‌اثر استفاده می‌کند (فقط تطبیق دقیق نام فرمان node، نه پالایش متن shell)، وقتی `gateway.nodes.allowCommands` به‌صراحت فرمان‌های خطرناک node را فعال می‌کند، وقتی `tools.profile="minimal"` سراسری توسط نمایه‌های ابزار agent بازنویسی می‌شود، وقتی گروه‌های باز ابزارهای زمان اجرا/سامانه‌فایل را بدون محافظ‌های sandbox/workspace افشا می‌کنند، و وقتی ابزارهای Plugin نصب‌شده ممکن است تحت سیاست ابزار آسان‌گیرانه قابل‌دسترسی باشند هشدار می‌دهد.
همچنین `gateway.allowRealIpFallback=true` (خطر جعل header در صورت پیکربندی نادرست proxyها) و `discovery.mdns.mode="full"` (نشت metadata از طریق رکوردهای TXT در mDNS) را علامت‌گذاری می‌کند.
همچنین وقتی مرورگر sandbox از شبکه Docker `bridge` بدون `sandbox.browser.cdpSourceRange` استفاده کند هشدار می‌دهد.
همچنین حالت‌های خطرناک شبکه Docker در sandbox (از جمله `host` و اتصال به namespaceهای `container:*`) را علامت‌گذاری می‌کند.
همچنین وقتی containerهای Docker موجود برای مرورگر sandbox برچسب‌های hash گم‌شده/قدیمی دارند (برای مثال containerهای پیش از مهاجرت که `openclaw.browserConfigEpoch` ندارند) هشدار می‌دهد و `openclaw sandbox recreate --browser --all` را توصیه می‌کند.
همچنین وقتی رکوردهای نصب Plugin/hook مبتنی بر npm pin نشده باشند، metadata یکپارچگی نداشته باشند، یا با نسخه‌های بسته نصب‌شده فعلی drift داشته باشند هشدار می‌دهد.
وقتی allowlistهای کانال به‌جای شناسه‌های پایدار به نام‌ها/ایمیل‌ها/tagهای تغییرپذیر متکی باشند هشدار می‌دهد (Discord، Slack، Google Chat، Microsoft Teams، دامنه‌های Mattermost و IRC در موارد قابل اعمال).
وقتی `gateway.auth.mode="none"` APIهای HTTP مربوط به Gateway را بدون secret مشترک در دسترس می‌گذارد (`/tools/invoke` به‌علاوه هر endpoint فعال‌شده `/v1/*`) هشدار می‌دهد.
تنظیماتی با پیشوند `dangerous`/`dangerously` بازنویسی‌های صریح اضطراری متصدی هستند؛ فعال کردن یکی از آن‌ها به‌تنهایی گزارش آسیب‌پذیری امنیتی نیست.
برای فهرست کامل پارامترهای خطرناک، بخش «خلاصه پرچم‌های ناامن یا خطرناک» را در [امنیت](/fa/gateway/security) ببینید.

رفتار SecretRef:

- `security audit`، SecretRefهای پشتیبانی‌شده را برای مسیرهای هدف خود در حالت فقط‌خواندنی resolve می‌کند.
- اگر یک SecretRef در مسیر فرمان فعلی در دسترس نباشد، ممیزی ادامه می‌یابد و `secretDiagnostics` را گزارش می‌کند (به‌جای crash کردن).
- `--token` و `--password` فقط auth مربوط به deep-probe را برای همان اجرای فرمان بازنویسی می‌کنند؛ آن‌ها پیکربندی یا نگاشت‌های SecretRef را بازنویسی نمی‌کنند.

## خروجی JSON

برای بررسی‌های CI/سیاست از `--json` استفاده کنید:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

اگر `--fix` و `--json` با هم ترکیب شوند، خروجی هم اقدام‌های اصلاحی و هم گزارش نهایی را شامل می‌شود:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## آنچه `--fix` تغییر می‌دهد

`--fix` ترمیم‌های امن و قطعی را اعمال می‌کند:

- `groupPolicy="open"` رایج را به `groupPolicy="allowlist"` تغییر می‌دهد (از جمله گونه‌های account در کانال‌های پشتیبانی‌شده)
- وقتی سیاست گروه WhatsApp به `allowlist` تغییر می‌کند، اگر فهرست ذخیره‌شده وجود داشته باشد و پیکربندی از قبل `allowFrom` را تعریف نکرده باشد، `groupAllowFrom` را از
  فایل ذخیره‌شده `allowFrom` مقداردهی اولیه می‌کند
- `logging.redactSensitive` را از `"off"` به `"tools"` تنظیم می‌کند
- مجوزهای فایل‌های state/config و فایل‌های حساس رایج را سخت‌گیرانه‌تر می‌کند
  (`credentials/*.json`، `auth-profiles.json`، `sessions.json`، نشست
  `*.jsonl`)
- همچنین فایل‌های include پیکربندی ارجاع‌شده از `openclaw.json` را سخت‌گیرانه‌تر می‌کند
- روی میزبان‌های POSIX از `chmod` و روی Windows از resetهای `icacls` استفاده می‌کند

`--fix` این کارها را انجام نمی‌دهد:

- چرخش توکن‌ها/گذرواژه‌ها/API keyها
- غیرفعال کردن ابزارها (`gateway`، `cron`، `exec` و غیره)
- تغییر انتخاب‌های bind/auth/network exposure مربوط به gateway
- حذف یا بازنویسی plugins/Skills

## مرتبط

- [مرجع CLI](/fa/cli)
- [ممیزی امنیتی](/fa/gateway/security)

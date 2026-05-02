---
read_when:
    - می‌خواهید یک ممیزی امنیتی سریع روی پیکربندی/وضعیت اجرا کنید
    - می‌خواهید پیشنهادهای امن «اصلاح» را اعمال کنید (مجوزها، سخت‌گیرانه‌تر کردن پیش‌فرض‌ها)
summary: مرجع CLI برای `openclaw security` (ممیزی و رفع اشتباهات رایج امنیتی)
title: امنیت
x-i18n:
    generated_at: "2026-05-02T11:40:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
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

`security audit` ساده روی مسیر سردِ پیکربندی/فایل‌سیستم/فقط‌خواندنی می‌ماند. به‌طور پیش‌فرض جمع‌کننده‌های امنیتی زمان اجرای Plugin را کشف نمی‌کند، بنابراین ممیزی‌های معمولی زمان اجرای همه Pluginهای نصب‌شده را بارگذاری نمی‌کنند. از `--deep` برای شامل‌کردن کاوش‌های زنده‌ی best-effort برای Gateway و جمع‌کننده‌های ممیزی امنیتی متعلق به Plugin استفاده کنید؛ فراخوان‌های داخلی صریح نیز وقتی از قبل محدوده‌ی زمان اجرای مناسب دارند، می‌توانند این جمع‌کننده‌های متعلق به Plugin را فعال کنند.

ممیزی وقتی چند فرستنده‌ی DM نشست اصلی را به‌اشتراک می‌گذارند هشدار می‌دهد و **حالت DM امن** را پیشنهاد می‌کند: `session.dmScope="per-channel-peer"` (یا `per-account-channel-peer` برای کانال‌های چندحسابی) برای صندوق‌های ورودی مشترک.
این برای سخت‌سازی صندوق‌های ورودی همکاری‌محور/مشترک است. یک Gateway واحد که توسط اپراتورهای متقابلا نامطمئن/خصمانه به‌اشتراک گذاشته شده باشد، چیدمان پیشنهادی نیست؛ مرزهای اعتماد را با Gatewayهای جداگانه (یا کاربران/میزبان‌های جداگانه‌ی سیستم‌عامل) تفکیک کنید.
همچنین وقتی پیکربندی نشان‌دهنده‌ی ورود احتمالی کاربر مشترک باشد (برای مثال سیاست DM/گروه باز، هدف‌های گروهی پیکربندی‌شده، یا قواعد فرستنده‌ی wildcard)، `security.trust_model.multi_user_heuristic` را صادر می‌کند و یادآوری می‌کند که OpenClaw به‌طور پیش‌فرض مدل اعتماد دستیار شخصی دارد.
برای چیدمان‌های کاربر مشترکِ عمدی، راهنمای ممیزی این است که همه نشست‌ها را sandbox کنید، دسترسی فایل‌سیستم را محدود به workspace نگه دارید، و هویت‌ها یا اعتبارنامه‌های شخصی/خصوصی را از آن زمان اجرا دور نگه دارید.
همچنین وقتی مدل‌های کوچک (`<=300B`) بدون sandboxing و با ابزارهای وب/مرورگر فعال استفاده شوند هشدار می‌دهد.
برای ورودی Webhook، وقتی `hooks.token` از توکن Gateway دوباره استفاده کند، وقتی `hooks.token` کوتاه باشد، وقتی `hooks.path="/"` باشد، وقتی `hooks.defaultSessionKey` تنظیم نشده باشد، وقتی `hooks.allowedAgentIds` نامحدود باشد، وقتی بازنویسی‌های `sessionKey` درخواست فعال باشند، و وقتی بازنویسی‌ها بدون `hooks.allowedSessionKeyPrefixes` فعال باشند هشدار می‌دهد.
همچنین وقتی تنظیمات Docker مربوط به sandbox در حالی پیکربندی شده باشند که حالت sandbox خاموش است، وقتی `gateway.nodes.denyCommands` از ورودی‌های شبیه الگو/ناشناخته و بی‌اثر استفاده کند (فقط تطبیق دقیق نام فرمان node، نه فیلترکردن متن shell)، وقتی `gateway.nodes.allowCommands` فرمان‌های خطرناک node را صراحتا فعال کند، وقتی `tools.profile="minimal"` سراسری توسط نمایه‌های ابزار agent بازنویسی شود، وقتی گروه‌های باز ابزارهای زمان اجرا/فایل‌سیستم را بدون محافظ‌های sandbox/workspace در معرض قرار دهند، و وقتی ابزارهای Plugin نصب‌شده ممکن است تحت سیاست ابزار آسان‌گیرانه قابل دسترسی باشند، هشدار می‌دهد.
همچنین `gateway.allowRealIpFallback=true` (خطر جعل header در صورت پیکربندی نادرست proxyها) و `discovery.mdns.mode="full"` (نشت فراداده از طریق رکوردهای mDNS TXT) را علامت‌گذاری می‌کند.
همچنین وقتی مرورگر sandbox از شبکه Docker `bridge` بدون `sandbox.browser.cdpSourceRange` استفاده کند هشدار می‌دهد.
همچنین حالت‌های خطرناک شبکه Docker مربوط به sandbox را علامت‌گذاری می‌کند (از جمله `host` و اتصال‌های namespace به‌شکل `container:*`).
همچنین وقتی کانتینرهای Docker مرورگر sandbox موجود برچسب‌های hash مفقود/قدیمی داشته باشند (برای مثال کانتینرهای پیش از مهاجرت که `openclaw.browserConfigEpoch` را ندارند) هشدار می‌دهد و `openclaw sandbox recreate --browser --all` را پیشنهاد می‌کند.
همچنین وقتی رکوردهای نصب Plugin/hook مبتنی بر npm پین نشده باشند، فراداده‌ی integrity نداشته باشند، یا با نسخه‌های بسته‌های نصب‌شده‌ی فعلی drift داشته باشند هشدار می‌دهد.
وقتی allowlistهای کانال به‌جای IDهای پایدار به نام‌ها/ایمیل‌ها/tagهای تغییرپذیر تکیه کنند هشدار می‌دهد (Discord، Slack، Google Chat، Microsoft Teams، Mattermost، و محدوده‌های IRC در صورت کاربرد).
وقتی `gateway.auth.mode="none"` باعث شود APIهای HTTP مربوط به Gateway بدون راز مشترک در دسترس باشند هشدار می‌دهد (`/tools/invoke` به‌همراه هر endpoint فعال‌شده‌ی `/v1/*`).
تنظیماتی که با `dangerous`/`dangerously` شروع می‌شوند، بازنویسی‌های صریح اپراتور برای شرایط اضطراری هستند؛ فعال‌کردن یکی از آن‌ها، به‌تنهایی، گزارش آسیب‌پذیری امنیتی محسوب نمی‌شود.
برای فهرست کامل پارامترهای خطرناک، بخش «خلاصه‌ی flagهای ناامن یا خطرناک» را در [امنیت](/fa/gateway/security) ببینید.

رفتار SecretRef:

- `security audit`، SecretRefهای پشتیبانی‌شده را برای مسیرهای هدف خود در حالت فقط‌خواندنی resolve می‌کند.
- اگر یک SecretRef در مسیر فرمان فعلی در دسترس نباشد، ممیزی ادامه می‌یابد و `secretDiagnostics` را گزارش می‌کند (به‌جای crash کردن).
- `--token` و `--password` فقط احراز هویت deep-probe را برای همان فراخوانی فرمان بازنویسی می‌کنند؛ پیکربندی یا نگاشت‌های SecretRef را بازنویسی نمی‌کنند.

## خروجی JSON

از `--json` برای بررسی‌های CI/سیاست استفاده کنید:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

اگر `--fix` و `--json` با هم ترکیب شوند، خروجی هم اقدام‌های اصلاحی و هم گزارش نهایی را شامل می‌شود:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` چه چیزهایی را تغییر می‌دهد

`--fix` اصلاحات امن و قطعی را اعمال می‌کند:

- مقدارهای رایج `groupPolicy="open"` را به `groupPolicy="allowlist"` تغییر می‌دهد (شامل گونه‌های account در کانال‌های پشتیبانی‌شده)
- وقتی سیاست گروه WhatsApp به `allowlist` تغییر می‌کند، اگر فهرست وجود داشته باشد و پیکربندی از قبل
  `allowFrom` را تعریف نکرده باشد، `groupAllowFrom` را از فایل ذخیره‌شده‌ی `allowFrom`
  مقداردهی اولیه می‌کند
- `logging.redactSensitive` را از `"off"` به `"tools"` تنظیم می‌کند
- مجوزهای فایل‌های state/config و فایل‌های حساس رایج را سخت‌گیرانه‌تر می‌کند
  (`credentials/*.json`، `auth-profiles.json`، `sessions.json`، نشست
  `*.jsonl`)
- فایل‌های include پیکربندی را که از `openclaw.json` ارجاع شده‌اند نیز سخت‌گیرانه‌تر می‌کند
- روی میزبان‌های POSIX از `chmod` و روی Windows از resetهای `icacls` استفاده می‌کند

`--fix` این کارها را **انجام نمی‌دهد**:

- چرخش توکن‌ها/گذرواژه‌ها/API keyها
- غیرفعال‌کردن ابزارها (`gateway`، `cron`، `exec`، و غیره)
- تغییر انتخاب‌های bind/auth/درمعرض‌بودن شبکه برای gateway
- حذف یا بازنویسی plugins/skills

## مرتبط

- [مرجع CLI](/fa/cli)
- [ممیزی امنیتی](/fa/gateway/security)

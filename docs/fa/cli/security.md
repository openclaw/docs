---
read_when:
    - می‌خواهید یک ممیزی امنیتی سریع روی پیکربندی/وضعیت اجرا کنید
    - می‌خواهید پیشنهادهای امنِ «اصلاح» را اعمال کنید (مجوزها، سخت‌گیرانه‌تر کردن پیش‌فرض‌ها)
summary: مرجع CLI برای `openclaw security` (ممیزی و رفع دام‌های رایج امنیتی)
title: امنیت
x-i18n:
    generated_at: "2026-05-10T19:33:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
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

`security audit` ساده روی مسیر سرد پیکربندی/فایل‌سیستم/فقط‌خواندنی باقی می‌ماند. این دستور به‌صورت پیش‌فرض گردآورنده‌های امنیتی runtime مربوط به Plugin را کشف نمی‌کند، بنابراین ممیزی‌های روتین هر runtime مربوط به Plugin نصب‌شده را بارگذاری نمی‌کنند. از `--deep` برای شامل‌کردن بررسی‌های زنده best-effort مربوط به Gateway و گردآورنده‌های ممیزی امنیتی متعلق به Plugin استفاده کنید؛ فراخوان‌های داخلی صریح نیز می‌توانند وقتی از پیش scope مناسب runtime را دارند، این گردآورنده‌های متعلق به Plugin را فعال کنند.

ممیزی زمانی هشدار می‌دهد که چند فرستنده DM نشست اصلی را به اشتراک می‌گذارند و **حالت DM امن** را توصیه می‌کند: `session.dmScope="per-channel-peer"` (یا `per-account-channel-peer` برای کانال‌های چندحسابی) برای inboxهای مشترک.
این برای مقاوم‌سازی inboxهای همکارانه/مشترک است. یک Gateway واحد که توسط اپراتورهای متقابلاً غیرقابل‌اعتماد/خصمانه به اشتراک گذاشته شده باشد، چیدمان توصیه‌شده‌ای نیست؛ مرزهای اعتماد را با Gatewayهای جداگانه (یا کاربران/میزبان‌های OS جداگانه) تفکیک کنید.
همچنین وقتی پیکربندی نشان‌دهنده ingress احتمالاً کاربر-مشترک باشد (برای مثال سیاست DM/گروه باز، هدف‌های گروه پیکربندی‌شده، یا قواعد فرستنده wildcard)، `security.trust_model.multi_user_heuristic` را منتشر می‌کند و یادآوری می‌کند که OpenClaw به‌صورت پیش‌فرض مدل اعتماد دستیار شخصی است.
برای چیدمان‌های کاربر-مشترک عمدی، راهنمای ممیزی این است که همه نشست‌ها را sandbox کنید، دسترسی فایل‌سیستم را محدود به workspace نگه دارید، و هویت‌ها یا اعتبارنامه‌های شخصی/خصوصی را از آن runtime دور نگه دارید.
همچنین زمانی هشدار می‌دهد که مدل‌های کوچک (`<=300B`) بدون sandboxing و با فعال‌بودن ابزارهای وب/مرورگر استفاده می‌شوند.
برای ingress از طریق Webhook، زمانی هشدار می‌دهد که `hooks.token` از توکن Gateway دوباره استفاده کند، `hooks.token` کوتاه باشد، `hooks.path="/"` باشد، `hooks.defaultSessionKey` تنظیم نشده باشد، `hooks.allowedAgentIds` نامحدود باشد، بازنویسی‌های `sessionKey` در درخواست فعال باشند، و بازنویسی‌ها بدون `hooks.allowedSessionKeyPrefixes` فعال باشند.
همچنین زمانی هشدار می‌دهد که تنظیمات Docker مربوط به sandbox پیکربندی شده باشند در حالی که حالت sandbox خاموش است، `gateway.nodes.denyCommands` از ورودی‌های شبیه الگو/ناشناخته و بی‌اثر استفاده کند (فقط تطبیق دقیق نام دستور node، نه فیلترکردن متن shell)، `gateway.nodes.allowCommands` به‌طور صریح دستورهای خطرناک node را فعال کند، `tools.profile="minimal"` سراسری توسط پروفایل‌های ابزار agent بازنویسی شود، ابزارهای نوشتن/ویرایش غیرفعال باشند اما `exec` همچنان بدون مرز محدودکننده فایل‌سیستم sandbox در دسترس باشد، گروه‌های باز ابزارهای runtime/فایل‌سیستم را بدون محافظ‌های sandbox/workspace در معرض قرار دهند، و ابزارهای Plugin نصب‌شده ممکن است تحت سیاست ابزار permissive قابل دسترسی باشند.
همچنین `gateway.allowRealIpFallback=true` (خطر header-spoofing در صورت پیکربندی نادرست proxyها) و `discovery.mdns.mode="full"` (نشت فراداده از طریق رکوردهای mDNS TXT) را علامت‌گذاری می‌کند.
همچنین زمانی هشدار می‌دهد که مرورگر sandbox از شبکه Docker `bridge` بدون `sandbox.browser.cdpSourceRange` استفاده کند.
همچنین حالت‌های خطرناک شبکه Docker مربوط به sandbox را علامت‌گذاری می‌کند (از جمله `host` و اتصال به namespaceهای `container:*`).
همچنین زمانی هشدار می‌دهد که containerهای Docker موجود برای مرورگر sandbox برچسب‌های hash ناقص/قدیمی داشته باشند (برای مثال containerهای پیش از migration که `openclaw.browserConfigEpoch` را ندارند) و `openclaw sandbox recreate --browser --all` را توصیه می‌کند.
همچنین زمانی هشدار می‌دهد که رکوردهای نصب Plugin/hook مبتنی بر npm بدون pin باشند، فراداده integrity نداشته باشند، یا با نسخه‌های package نصب‌شده فعلی drift داشته باشند.
زمانی هشدار می‌دهد که allowlistهای کانال به‌جای IDهای پایدار به نام‌ها/ایمیل‌ها/tagهای قابل‌تغییر متکی باشند (Discord، Slack، Google Chat، Microsoft Teams، Mattermost، scopeهای IRC در موارد قابل‌اعمال).
زمانی هشدار می‌دهد که `gateway.auth.mode="none"` APIهای HTTP مربوط به Gateway را بدون یک secret مشترک در دسترس بگذارد (`/tools/invoke` به‌علاوه هر endpoint فعال `/v1/*`).
تنظیمات دارای پیشوند `dangerous`/`dangerously` بازنویسی‌های صریح break-glass برای اپراتور هستند؛ فعال‌کردن یکی از آن‌ها، به‌خودی‌خود، گزارش آسیب‌پذیری امنیتی نیست.
برای فهرست کامل پارامترهای خطرناک، بخش «خلاصه پرچم‌های ناامن یا خطرناک» را در [امنیت](/fa/gateway/security) ببینید.

رفتار SecretRef:

- `security audit`، SecretRefهای پشتیبانی‌شده را در حالت فقط‌خواندنی برای مسیرهای هدف خود resolve می‌کند.
- اگر یک SecretRef در مسیر فرمان فعلی در دسترس نباشد، ممیزی ادامه می‌یابد و `secretDiagnostics` را گزارش می‌کند (به‌جای اینکه crash کند).
- `--token` و `--password` فقط auth بررسی عمیق را برای همان invocation فرمان بازنویسی می‌کنند؛ آن‌ها پیکربندی یا mappingهای SecretRef را بازنویسی نمی‌کنند.

## خروجی JSON

از `--json` برای بررسی‌های CI/سیاست استفاده کنید:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

اگر `--fix` و `--json` با هم ترکیب شوند، خروجی هم actionهای اصلاح و هم گزارش نهایی را شامل می‌شود:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## آنچه `--fix` تغییر می‌دهد

`--fix` اصلاحات امن و deterministic را اعمال می‌کند:

- `groupPolicy="open"` رایج را به `groupPolicy="allowlist"` تغییر می‌دهد (از جمله variantهای حساب در کانال‌های پشتیبانی‌شده)
- وقتی سیاست گروه WhatsApp به `allowlist` تغییر می‌کند، در صورتی که آن فهرست وجود داشته باشد و پیکربندی از قبل `allowFrom` را تعریف نکرده باشد، `groupAllowFrom` را از فایل ذخیره‌شده `allowFrom` مقداردهی اولیه می‌کند
- `logging.redactSensitive` را از `"off"` به `"tools"` تنظیم می‌کند
- permissionهای فایل‌های state/config و فایل‌های حساس رایج را سخت‌گیرانه‌تر می‌کند
  (`credentials/*.json`، `auth-profiles.json`، `sessions.json`، session
  `*.jsonl`)
- همچنین فایل‌های include پیکربندی ارجاع‌شده از `openclaw.json` را سخت‌گیرانه‌تر می‌کند
- روی میزبان‌های POSIX از `chmod` و روی Windows از resetهای `icacls` استفاده می‌کند

`--fix` موارد زیر را انجام **نمی‌دهد**:

- rotate کردن توکن‌ها/گذرواژه‌ها/API keyها
- غیرفعال‌کردن ابزارها (`gateway`، `cron`، `exec`، و غیره)
- تغییر انتخاب‌های bind/auth/network exposure مربوط به Gateway
- حذف یا بازنویسی Pluginها/Skills

## مرتبط

- [مرجع CLI](/fa/cli)
- [ممیزی امنیتی](/fa/gateway/security)

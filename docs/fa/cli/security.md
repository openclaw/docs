---
read_when:
    - می‌خواهید یک ممیزی امنیتی سریع روی پیکربندی/وضعیت اجرا کنید
    - می‌خواهید پیشنهادهای امن «اصلاح» را اعمال کنید (مجوزها، سخت‌گیرانه‌تر کردن پیش‌فرض‌ها)
summary: مرجع CLI برای `openclaw security` (ممیزی و رفع خطاهای رایج امنیتی)
title: امنیت
x-i18n:
    generated_at: "2026-06-27T17:28:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

`security audit` ساده روی مسیر سرد پیکربندی/سامانه فایل/فقط-خواندنی می‌ماند. این دستور به‌طور پیش‌فرض گردآورنده‌های امنیتی زمان اجرای Plugin را کشف نمی‌کند، بنابراین ممیزی‌های معمول هر زمان اجرای Plugin نصب‌شده را بارگذاری نمی‌کنند. برای افزودن کاوش‌های زنده Gateway با بهترین تلاش و گردآورنده‌های ممیزی امنیتی متعلق به Plugin از `--deep` استفاده کنید؛ فراخوان‌های داخلی صریح نیز می‌توانند وقتی از قبل دامنه زمان اجرای مناسبی دارند، این گردآورنده‌های متعلق به Plugin را فعال کنند.

ممیزی وقتی چند فرستنده DM نشست اصلی را به اشتراک می‌گذارند هشدار می‌دهد و **حالت DM امن** را توصیه می‌کند: `session.dmScope="per-channel-peer"` (یا `per-account-channel-peer` برای کانال‌های چندحسابی) برای صندوق‌های ورودی مشترک.
این برای سخت‌سازی صندوق ورودی مشارکتی/مشترک است. یک Gateway واحد که میان اپراتورهای متقابلاً نامطمئن/خصمانه مشترک باشد، چیدمان توصیه‌شده‌ای نیست؛ مرزهای اعتماد را با Gatewayهای جداگانه (یا کاربران/میزبان‌های سیستم‌عامل جداگانه) تفکیک کنید.
همچنین وقتی پیکربندی نشان‌دهنده احتمال ورود کاربر مشترک باشد (برای نمونه سیاست DM/گروه باز، اهداف گروه پیکربندی‌شده، یا قواعد فرستنده wildcard)، `security.trust_model.multi_user_heuristic` را صادر می‌کند و یادآوری می‌کند که OpenClaw به‌طور پیش‌فرض مدل اعتماد دستیار شخصی دارد.
برای چیدمان‌های کاربر مشترک عمدی، راهنمای ممیزی این است که همه نشست‌ها را sandbox کنید، دسترسی سامانه فایل را به workspace محدود نگه دارید، و هویت‌ها یا اعتبارنامه‌های شخصی/خصوصی را از آن زمان اجرا دور نگه دارید.
همچنین وقتی مدل‌های کوچک (`<=300B`) بدون sandboxing و با ابزارهای وب/مرورگر فعال استفاده شوند هشدار می‌دهد.
برای ورود Webhook، راه‌اندازی یک هشدار امنیتی غیرکشنده ثبت می‌کند و ممیزی استفاده مجدد `hooks.token` از مقدارهای فعال احراز هویت shared-secret در Gateway را پرچم‌گذاری می‌کند، شامل `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` و `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. همچنین در موارد زیر هشدار می‌دهد:

- `hooks.token` کوتاه است
- `hooks.path="/"`
- `hooks.defaultSessionKey` تنظیم نشده است
- `hooks.allowedAgentIds` نامحدود است
- بازنویسی‌های `sessionKey` در درخواست فعال‌اند
- بازنویسی‌ها بدون `hooks.allowedSessionKeyPrefixes` فعال‌اند

اگر احراز هویت گذرواژه Gateway فقط هنگام راه‌اندازی ارائه شده است، همان مقدار را به `openclaw security audit --auth password --password <password>` بدهید تا ممیزی بتواند آن را با `hooks.token` بررسی کند.
برای چرخاندن یک `hooks.token` پایدارشده و بازاستفاده‌شده، `openclaw doctor --fix` را اجرا کنید، سپس فرستنده‌های hook خارجی را به استفاده از token جدید hook به‌روزرسانی کنید.

همچنین وقتی تنظیمات Docker مربوط به sandbox در حالی پیکربندی شده‌اند که حالت sandbox خاموش است، وقتی `gateway.nodes.denyCommands` از ورودی‌های شبیه الگو/ناشناخته و بی‌اثر استفاده می‌کند (فقط تطبیق دقیق نام دستور node، نه فیلتر کردن متن shell)، وقتی `gateway.nodes.allowCommands` به‌صراحت دستورهای خطرناک node را فعال می‌کند، وقتی `tools.profile="minimal"` سراسری توسط profileهای ابزار agent بازنویسی می‌شود، وقتی ابزارهای نوشتن/ویرایش غیرفعال‌اند اما `exec` همچنان بدون مرز محدودکننده سامانه فایل sandbox در دسترس است، وقتی DMها یا گروه‌های باز ابزارهای زمان اجرا/سامانه فایل را بدون محافظ‌های sandbox/workspace در معرض قرار می‌دهند، و وقتی ابزارهای Plugin نصب‌شده ممکن است تحت سیاست ابزار سهل‌گیرانه در دسترس باشند هشدار می‌دهد.
همچنین `gateway.allowRealIpFallback=true` (خطر جعل header اگر proxyها بد پیکربندی شده باشند) و `discovery.mdns.mode="full"` (نشت metadata از طریق رکوردهای mDNS TXT) را پرچم‌گذاری می‌کند.
همچنین وقتی مرورگر sandbox از شبکه Docker `bridge` بدون `sandbox.browser.cdpSourceRange` استفاده می‌کند هشدار می‌دهد.
همچنین حالت‌های خطرناک شبکه Docker مربوط به sandbox را پرچم‌گذاری می‌کند (شامل `host` و اتصال‌های namespace با `container:*`).
همچنین وقتی containerهای Docker موجود برای مرورگر sandbox دارای labelهای hash گمشده/کهنه هستند (برای نمونه containerهای پیش از migration که `openclaw.browserConfigEpoch` ندارند) هشدار می‌دهد و `openclaw sandbox recreate --browser --all` را توصیه می‌کند.
همچنین وقتی رکوردهای نصب Plugin/hook مبتنی بر npm بدون pin هستند، metadata یکپارچگی ندارند، یا از نسخه‌های package نصب‌شده فعلی فاصله دارند هشدار می‌دهد.
وقتی allowlistهای کانال به‌جای شناسه‌های پایدار به نام‌ها/ایمیل‌ها/tagهای تغییرپذیر متکی باشند هشدار می‌دهد (Discord، Slack، Google Chat، Microsoft Teams، Mattermost، دامنه‌های IRC در صورت کاربرد).
وقتی `gateway.auth.mode="none"` باعث می‌شود APIهای HTTP مربوط به Gateway بدون shared secret قابل دسترسی باشند (`/tools/invoke` به‌همراه هر endpoint فعال `/v1/*`) هشدار می‌دهد.
تنظیماتی که با `dangerous`/`dangerously` آغاز می‌شوند بازنویسی‌های صریح break-glass اپراتور هستند؛ فعال کردن یکی از آن‌ها، به‌تنهایی، گزارش آسیب‌پذیری امنیتی نیست.
برای فهرست کامل پارامترهای خطرناک، بخش «خلاصه flagهای ناامن یا خطرناک» را در [امنیت](/fa/gateway/security) ببینید.

یافته‌های ایستاده عمدی را می‌توان با `security.audit.suppressions` پذیرفت.
هر suppression با یک `checkId` دقیق تطبیق می‌کند و می‌تواند با زیررشته‌های بدون حساسیت به بزرگی/کوچکی حروف
`titleIncludes` و/یا `detailIncludes` محدودتر شود:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

یافته‌های suppressشده از `summary` فعال و فهرست `findings` حذف می‌شوند.
خروجی JSON آن‌ها را برای قابلیت ممیزی زیر `suppressedFindings` نگه می‌دارد.
وقتی suppressionها پیکربندی شده باشند، خروجی فعال همچنین یک یافته اطلاعاتی غیرقابل suppress با عنوان
`security.audit.suppressions.active` نگه می‌دارد تا خوانندگان بتوانند تشخیص دهند ممیزی
فیلتر شده است. flagهای پیکربندی خطرناک به‌صورت یک flag در هر یافته صادر می‌شوند، بنابراین
پذیرفتن یک flag خطرناک، flagهای فعال دیگری را که همان
`config.insecure_or_dangerous_flags` checkId را دارند پنهان نمی‌کند.
از آنجا که suppressionها می‌توانند خطر ایستاده را پنهان کنند، افزودن یا حذف آن‌ها از طریق
دستورهای shell اجرای agent نیازمند تأیید exec است، مگر اینکه exec از قبل برای اتوماسیون محلی مورد اعتماد
با `security="full"` و `ask="off"` اجرا شده باشد.

رفتار SecretRef:

- `security audit`، SecretRefهای پشتیبانی‌شده را در حالت فقط-خواندنی برای مسیرهای هدف خود resolve می‌کند.
- اگر یک SecretRef در مسیر دستور فعلی در دسترس نباشد، ممیزی ادامه می‌دهد و `secretDiagnostics` را گزارش می‌کند (به‌جای crash کردن).
- `--token` و `--password` فقط احراز هویت deep-probe را برای همان اجرای دستور بازنویسی می‌کنند؛ آن‌ها پیکربندی یا نگاشت‌های SecretRef را بازنویسی نمی‌کنند.

## خروجی JSON

برای بررسی‌های CI/سیاست از `--json` استفاده کنید:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

اگر `--fix` و `--json` با هم ترکیب شوند، خروجی هم اقدام‌های اصلاح و هم گزارش نهایی را شامل می‌شود:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## آنچه `--fix` تغییر می‌دهد

`--fix` اصلاحات ایمن و قطعی را اعمال می‌کند:

- مقدارهای رایج `groupPolicy="open"` را به `groupPolicy="allowlist"` تغییر می‌دهد (شامل گونه‌های حساب در کانال‌های پشتیبانی‌شده)
- وقتی سیاست گروه WhatsApp به `allowlist` تغییر کند، در صورتی که فهرست ذخیره‌شده `allowFrom` وجود داشته باشد و پیکربندی از قبل
  `allowFrom` را تعریف نکرده باشد، `groupAllowFrom` را از آن مقداردهی اولیه می‌کند
- `logging.redactSensitive` را از `"off"` به `"tools"` تنظیم می‌کند
- مجوزهای فایل‌های state/config و فایل‌های حساس رایج را سخت‌گیرانه‌تر می‌کند
  (`credentials/*.json`، `auth-profiles.json`، `sessions.json`، نشست
  `*.jsonl`)
- همچنین فایل‌های include پیکربندی ارجاع‌شده از `openclaw.json` را سخت‌گیرانه‌تر می‌کند
- روی میزبان‌های POSIX از `chmod` و روی Windows از resetهای `icacls` استفاده می‌کند

`--fix` این کارها را **انجام نمی‌دهد**:

- tokenها/گذرواژه‌ها/API keyها را نمی‌چرخاند
- ابزارها (`gateway`، `cron`، `exec` و غیره) را غیرفعال نمی‌کند
- انتخاب‌های bind/auth/network exposure مربوط به gateway را تغییر نمی‌دهد
- Pluginها/Skills را حذف یا بازنویسی نمی‌کند

## مرتبط

- [مرجع CLI](/fa/cli)
- [ممیزی امنیتی](/fa/gateway/security)

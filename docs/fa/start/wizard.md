---
read_when:
    - اجرای راه‌اندازی اولیه CLI یا پیکربندی آن
    - راه‌اندازی یک دستگاه جدید
sidebarTitle: 'Onboarding: CLI'
summary: 'آماده‌سازی اولیه CLI: راه‌اندازی هدایت‌شده برای Gateway، فضای کاری، کانال‌ها و Skills'
title: راه‌اندازی اولیه (CLI)
x-i18n:
    generated_at: "2026-05-06T09:43:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding روش **توصیه‌شده** برای راه‌اندازی OpenClaw روی macOS،
Linux یا Windows (از طریق WSL2؛ به‌شدت توصیه می‌شود) است.
این کار یک Gateway محلی یا اتصال به Gateway راه‌دور، به‌همراه کانال‌ها، Skills
و پیش‌فرض‌های فضای کاری را در یک جریان راهنمایی‌شده پیکربندی می‌کند.

```bash
openclaw onboard
```

<Info>
سریع‌ترین نخستین گفت‌وگو: Control UI را باز کنید (نیازی به راه‌اندازی کانال نیست). دستور
`openclaw dashboard` را اجرا کنید و در مرورگر گفت‌وگو کنید. مستندات: [Dashboard](/fa/web/dashboard).
</Info>

برای پیکربندی دوباره در آینده:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` به‌معنای حالت غیرتعاملی نیست. برای اسکریپت‌ها، از `--non-interactive` استفاده کنید.
</Note>

<Tip>
CLI onboarding شامل یک مرحله جست‌وجوی وب است که در آن می‌توانید یک ارائه‌دهنده
مانند Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search،
Ollama Web Search، Perplexity، SearXNG یا Tavily را انتخاب کنید. برخی ارائه‌دهندگان به
کلید API نیاز دارند، در حالی که برخی دیگر بدون کلید هستند. همچنین می‌توانید این مورد را بعدا با
`openclaw configure --section web` پیکربندی کنید. مستندات: [ابزارهای وب](/fa/tools/web).
</Tip>

## شروع سریع در برابر پیشرفته

onboarding با **شروع سریع** (پیش‌فرض‌ها) در برابر **پیشرفته** (کنترل کامل) آغاز می‌شود.

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway محلی (loopback)
    - پیش‌فرض فضای کاری (یا فضای کاری موجود)
    - پورت Gateway **18789**
    - احراز هویت Gateway با **Token** (تولید خودکار، حتی روی loopback)
    - پیش‌فرض سیاست ابزار برای راه‌اندازی‌های محلی جدید: `tools.profile: "coding"` (پروفایل صریح موجود حفظ می‌شود)
    - پیش‌فرض جداسازی DM: onboarding محلی وقتی تنظیم نشده باشد `session.dmScope: "per-channel-peer"` را می‌نویسد. جزئیات: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals)
    - در معرض‌گذاری Tailscale **خاموش**
    - DMهای Telegram + WhatsApp به‌طور پیش‌فرض روی **allowlist** هستند (شماره تلفن از شما پرسیده می‌شود)

  </Tab>
  <Tab title="Advanced (full control)">
    - همه مراحل را در دسترس قرار می‌دهد (حالت، فضای کاری، Gateway، کانال‌ها، دیمون، Skills).

  </Tab>
</Tabs>

## onboarding چه چیزهایی را پیکربندی می‌کند

**حالت محلی (پیش‌فرض)** شما را از این مراحل عبور می‌دهد:

1. **مدل/احراز هویت** — هر ارائه‌دهنده/جریان احراز هویت پشتیبانی‌شده‌ای را انتخاب کنید (کلید API، OAuth یا احراز هویت دستی مخصوص ارائه‌دهنده)، از جمله ارائه‌دهنده سفارشی
   (سازگار با OpenAI، سازگار با Anthropic، یا تشخیص خودکار ناشناخته). یک مدل پیش‌فرض انتخاب کنید.
   نکته امنیتی: اگر این عامل ابزارها را اجرا می‌کند یا محتوای webhook/hooks را پردازش می‌کند، قوی‌ترین مدل نسل جدید موجود را ترجیح دهید و سیاست ابزار را سخت‌گیرانه نگه دارید. رده‌های ضعیف‌تر/قدیمی‌تر آسان‌تر دچار prompt injection می‌شوند.
   برای اجراهای غیرتعاملی، `--secret-input-mode ref` به‌جای مقدارهای کلید API به‌صورت متن ساده، ارجاع‌های مبتنی بر env را در پروفایل‌های احراز هویت ذخیره می‌کند.
   در حالت غیرتعاملی `ref`، متغیر env ارائه‌دهنده باید تنظیم شده باشد؛ ارسال پرچم‌های کلید inline بدون آن متغیر env سریع شکست می‌خورد.
   در اجراهای تعاملی، انتخاب حالت ارجاع محرمانه به شما اجازه می‌دهد به یک متغیر محیطی یا یک ارجاع ارائه‌دهنده پیکربندی‌شده (`file` یا `exec`) اشاره کنید، همراه با اعتبارسنجی preflight سریع پیش از ذخیره‌سازی.
   برای Anthropic، onboarding/configure تعاملی **Anthropic Claude CLI** را به‌عنوان مسیر محلی ترجیحی و **کلید API Anthropic** را به‌عنوان مسیر پیشنهادی تولید ارائه می‌دهد. Anthropic setup-token نیز همچنان به‌عنوان مسیر احراز هویت مبتنی بر توکن پشتیبانی‌شده در دسترس است.
2. **فضای کاری** — مکان فایل‌های عامل (پیش‌فرض `~/.openclaw/workspace`). فایل‌های bootstrap را مقداردهی اولیه می‌کند.
3. **Gateway** — پورت، نشانی bind، حالت احراز هویت، در معرض‌گذاری Tailscale.
   در حالت تعاملی توکن، ذخیره‌سازی پیش‌فرض توکن به‌صورت متن ساده را انتخاب کنید یا SecretRef را فعال کنید.
   مسیر SecretRef توکن غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
4. **کانال‌ها** — کانال‌های گفت‌وگوی داخلی و همراه مانند BlueBubbles، Discord، Feishu، Google Chat، Mattermost، Microsoft Teams، QQ Bot، Signal، Slack، Telegram، WhatsApp و موارد بیشتر.
5. **دیمون** — یک LaunchAgent (macOS)، واحد کاربری systemd (Linux/WSL2)، یا Windows Scheduled Task بومی را با fallback پوشه Startup برای هر کاربر نصب می‌کند.
   اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب دیمون آن را اعتبارسنجی می‌کند اما توکن resolveشده را در فراداده محیط سرویس supervisor پایدار نمی‌کند.
   اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، نصب دیمون با راهنمایی قابل اقدام مسدود می‌شود.
   اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب دیمون تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌ماند.
6. **بررسی سلامت** — Gateway را راه‌اندازی می‌کند و اجرا بودن آن را بررسی می‌کند.
7. **Skills** — Skills توصیه‌شده و وابستگی‌های اختیاری را نصب می‌کند.

<Note>
اجرای دوباره onboarding هیچ چیزی را پاک **نمی‌کند** مگر اینکه به‌صراحت **Reset** را انتخاب کنید (یا `--reset` را ارسال کنید).
`--reset` در CLI به‌طور پیش‌فرض شامل پیکربندی، اعتبارنامه‌ها و نشست‌ها می‌شود؛ برای شامل کردن فضای کاری از `--reset-scope full` استفاده کنید.
اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، onboarding ابتدا از شما می‌خواهد `openclaw doctor` را اجرا کنید.
</Note>

**حالت راه‌دور** فقط کلاینت محلی را برای اتصال به یک Gateway در جای دیگر پیکربندی می‌کند.
این حالت هیچ چیزی را روی میزبان راه‌دور نصب یا تغییر نمی‌دهد.

## افزودن عامل دیگر

از `openclaw agents add <name>` برای ایجاد یک عامل جداگانه با فضای کاری،
نشست‌ها و پروفایل‌های احراز هویت خودش استفاده کنید. اجرا بدون `--workspace`، onboarding را راه‌اندازی می‌کند.

آنچه تنظیم می‌کند:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

نکات:

- فضای کاری پیش‌فرض از `~/.openclaw/workspace-<agentId>` پیروی می‌کند.
- برای مسیریابی پیام‌های ورودی، `bindings` را اضافه کنید (onboarding می‌تواند این کار را انجام دهد).
- پرچم‌های غیرتعاملی: `--model`، `--agent-dir`، `--bind`، `--non-interactive`.

## مرجع کامل

برای شرح‌های گام‌به‌گام دقیق و خروجی‌های پیکربندی، ببینید
[مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference).
برای نمونه‌های غیرتعاملی، ببینید [اتوماسیون CLI](/fa/start/wizard-cli-automation).
برای مرجع فنی عمیق‌تر، شامل جزئیات RPC، ببینید
[مرجع onboarding](/fa/reference/wizard).

## مستندات مرتبط

- مرجع فرمان CLI: [`openclaw onboard`](/fa/cli/onboard)
- نمای کلی onboarding: [نمای کلی onboarding](/fa/start/onboarding-overview)
- onboarding برنامه macOS: [onboarding](/fa/start/onboarding)
- آیین نخستین اجرای عامل: [راه‌اندازی اولیه عامل](/fa/start/bootstrapping)

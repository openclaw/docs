---
read_when:
    - شما openclaw را بدون هیچ فرمانی اجرا می‌کنید و می‌خواهید Crestodian را درک کنید
    - برای بررسی یا تعمیر OpenClaw به روشی ایمن و سازگار با حالت بدون پیکربندی نیاز دارید
    - شما در حال طراحی یا فعال‌سازی حالت نجات کانال پیام‌رسانی هستید
summary: مرجع CLI و مدل امنیتی Crestodian، دستیار راه‌اندازی و تعمیر ایمنِ بدون پیکربندی
title: کرستودین
x-i18n:
    generated_at: "2026-05-02T11:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian ابزار کمکی محلی OpenClaw برای راه‌اندازی، تعمیر و پیکربندی است. این ابزار طوری طراحی شده که وقتی مسیر عادی عامل خراب است، همچنان در دسترس بماند.

اجرای `openclaw` بدون فرمان، Crestodian را در یک ترمینال تعاملی شروع می‌کند. اجرای `openclaw crestodian` همان ابزار کمکی را به‌صورت صریح شروع می‌کند.

## آنچه Crestodian نمایش می‌دهد

هنگام راه‌اندازی، Crestodian تعاملی همان پوسته TUI را باز می‌کند که `openclaw tui` استفاده می‌کند، با یک پشتانه چت Crestodian. گزارش چت با یک خوشامدگویی کوتاه شروع می‌شود:

- چه زمانی Crestodian را شروع کنید
- مدل یا مسیر برنامه‌ریز قطعی که Crestodian واقعا استفاده می‌کند
- اعتبار پیکربندی و عامل پیش‌فرض
- دسترس‌پذیری Gateway از نخستین کاوش راه‌اندازی
- اقدام بعدی اشکال‌زدایی که Crestodian می‌تواند انجام دهد

این ابزار برای شروع، اسرار را تخلیه نمی‌کند یا فرمان‌های CLI مربوط به Plugin را بارگذاری نمی‌کند. TUI همچنان سربرگ عادی، گزارش چت، خط وضعیت، پابرگ، تکمیل خودکار و کنترل‌های ویرایشگر را ارائه می‌دهد.

از `status` برای فهرست موجودی تفصیلی همراه با مسیر پیکربندی، مسیرهای مستندات/منبع، کاوش‌های CLI محلی، وجود کلید API، عامل‌ها، مدل و جزئیات Gateway استفاده کنید.

Crestodian از همان کشف مرجع OpenClaw استفاده می‌کند که عامل‌های عادی استفاده می‌کنند. در یک checkout گیت، خودش را به `docs/` محلی و درخت منبع محلی اشاره می‌دهد. در نصب بسته npm، از مستندات بسته‌بندی‌شده بسته استفاده می‌کند و به [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) پیوند می‌دهد، همراه با راهنمایی صریح برای بازبینی منبع هر زمان که مستندات کافی نباشند.

## نمونه‌ها

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

داخل TUI مربوط به Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## راه‌اندازی ایمن

مسیر راه‌اندازی Crestodian عمدا کوچک است. این ابزار می‌تواند زمانی اجرا شود که:

- `openclaw.json` وجود ندارد
- `openclaw.json` نامعتبر است
- Gateway از کار افتاده است
- ثبت فرمان Plugin در دسترس نیست
- هنوز هیچ عاملی پیکربندی نشده است

`openclaw --help` و `openclaw --version` همچنان از مسیرهای سریع عادی استفاده می‌کنند. `openclaw` غیرتعاملی، به‌جای چاپ راهنمای ریشه، با یک پیام کوتاه خارج می‌شود، چون محصول بدون فرمان Crestodian است.

## عملیات و تأیید

Crestodian به‌جای ویرایش موردی پیکربندی، از عملیات نوع‌دار استفاده می‌کند.

عملیات فقط‌خواندنی می‌توانند بی‌درنگ اجرا شوند:

- نمایش نمای کلی
- فهرست کردن عامل‌ها
- فهرست کردن Pluginهای نصب‌شده
- جست‌وجوی Pluginهای ClawHub
- نمایش وضعیت مدل/پشتانه
- اجرای بررسی‌های وضعیت یا سلامت
- بررسی دسترس‌پذیری Gateway
- اجرای doctor بدون اصلاحات تعاملی
- اعتبارسنجی پیکربندی
- نمایش مسیر گزارش حسابرسی

عملیات پایدار در حالت تعاملی به تأیید گفت‌وگویی نیاز دارند، مگر اینکه برای یک فرمان مستقیم `--yes` را بدهید:

- نوشتن پیکربندی
- اجرای `config set`
- تنظیم مقدارهای پشتیبانی‌شده SecretRef از طریق `config set-ref`
- اجرای راه‌اندازی/بوت‌استرپ onboarding
- تغییر مدل پیش‌فرض
- شروع، توقف یا راه‌اندازی دوباره Gateway
- ایجاد عامل‌ها
- نصب Pluginها از ClawHub یا npm
- حذف نصب Pluginها
- اجرای تعمیرات doctor که پیکربندی یا وضعیت را بازنویسی می‌کنند

نوشتن‌های اعمال‌شده در اینجا ثبت می‌شوند:

```text
~/.openclaw/audit/crestodian.jsonl
```

کشف حسابرسی نمی‌شود. فقط عملیات اعمال‌شده و نوشتن‌ها ثبت می‌شوند.

`openclaw onboard --modern`، Crestodian را به‌عنوان پیش‌نمایش onboarding مدرن شروع می‌کند. `openclaw onboard` ساده همچنان onboarding کلاسیک را اجرا می‌کند.

## بوت‌استرپ راه‌اندازی

`setup` بوت‌استرپ onboarding چت‌محور است. فقط از طریق عملیات پیکربندی نوع‌دار می‌نویسد و ابتدا تأیید می‌گیرد.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

وقتی هیچ مدلی پیکربندی نشده باشد، setup نخستین پشتانه قابل استفاده را با این ترتیب انتخاب می‌کند و به شما می‌گوید چه چیزی را انتخاب کرده است:

- مدل صریح موجود، اگر از قبل پیکربندی شده باشد
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

اگر هیچ‌کدام در دسترس نباشند، setup همچنان فضای کاری پیش‌فرض را می‌نویسد و مدل را تنظیم‌نشده باقی می‌گذارد. Codex/Claude Code را نصب کنید یا وارد آن شوید، یا `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` را در دسترس قرار دهید، سپس setup را دوباره اجرا کنید.

## برنامه‌ریز با کمک مدل

Crestodian همیشه در حالت قطعی شروع می‌شود. برای فرمان‌های مبهمی که تجزیه‌گر قطعی آن‌ها را نمی‌فهمد، Crestodian محلی می‌تواند یک نوبت برنامه‌ریز محدود را از طریق مسیرهای runtime عادی OpenClaw انجام دهد. ابتدا از مدل OpenClaw پیکربندی‌شده استفاده می‌کند. اگر هنوز هیچ مدل پیکربندی‌شده‌ای قابل استفاده نباشد، می‌تواند به runtimeهای محلی که از قبل روی دستگاه وجود دارند fallback کند:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- مهار app-server مربوط به Codex: `openai/gpt-5.5` با `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

برنامه‌ریز با کمک مدل نمی‌تواند پیکربندی را مستقیما تغییر دهد. باید درخواست را به یکی از فرمان‌های نوع‌دار Crestodian ترجمه کند؛ سپس قواعد عادی تأیید و حسابرسی اعمال می‌شوند. Crestodian پیش از اجرای هر چیزی، مدلی را که استفاده کرده و فرمان تفسیرشده را چاپ می‌کند. نوبت‌های fallback برنامه‌ریز بدون پیکربندی موقتی هستند، هرجا runtime پشتیبانی کند ابزارها در آن‌ها غیرفعال‌اند، و از فضای کاری/نشست موقت استفاده می‌کنند.

حالت نجات کانال پیام از برنامه‌ریز با کمک مدل استفاده نمی‌کند. نجات راه‌دور قطعی باقی می‌ماند تا مسیر عادی عاملِ خراب یا در معرض خطر نتواند به‌عنوان ویرایشگر پیکربندی استفاده شود.

## تغییر به یک عامل

برای خروج از Crestodian و باز کردن TUI عادی، از یک گزینشگر زبان طبیعی استفاده کنید:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`، `openclaw chat` و `openclaw terminal` همچنان TUI عادی عامل را مستقیما باز می‌کنند. آن‌ها Crestodian را شروع نمی‌کنند.

پس از تغییر به TUI عادی، برای بازگشت به Crestodian از `/crestodian` استفاده کنید. می‌توانید یک درخواست پیگیری هم بیاورید:

```text
/crestodian
/crestodian restart gateway
```

تغییرهای عامل داخل TUI ردپایی باقی می‌گذارند که نشان می‌دهد `/crestodian` در دسترس است.

## حالت نجات پیام

حالت نجات پیام، نقطه ورود کانال پیام برای Crestodian است. این حالت برای موردی است که عامل عادی شما از کار افتاده، اما یک کانال قابل اعتماد مانند WhatsApp همچنان فرمان‌ها را دریافت می‌کند.

فرمان متنی پشتیبانی‌شده:

- `/crestodian <request>`

جریان اپراتور:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

ایجاد عامل را نیز می‌توان از اعلان محلی یا حالت نجات در صف گذاشت:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

حالت نجات راه‌دور یک سطح مدیریتی است. باید مانند تعمیر پیکربندی راه‌دور با آن برخورد شود، نه مانند چت عادی.

قرارداد امنیتی برای نجات راه‌دور:

- وقتی sandboxing فعال است غیرفعال است. اگر یک عامل/نشست sandbox شده باشد، Crestodian باید نجات راه‌دور را رد کند و توضیح دهد که تعمیر CLI محلی لازم است.
- وضعیت مؤثر پیش‌فرض `auto` است: نجات راه‌دور را فقط در عملیات YOLO قابل اعتماد مجاز کن، جایی که runtime از قبل اختیار محلی بدون sandbox دارد.
- نیازمند هویت صریح مالک است. نجات نباید قواعد فرستنده wildcard، سیاست گروه باز، webhooks احرازهویت‌نشده، یا کانال‌های ناشناس را بپذیرد.
- به‌طور پیش‌فرض فقط DMهای مالک. نجات گروه/کانال به opt-in صریح نیاز دارد.
- جست‌وجو و فهرست Plugin فقط‌خواندنی هستند. نصب Plugin به‌طور پیش‌فرض فقط محلی است، چون کد اجرایی دانلود می‌کند. حذف نصب Plugin می‌تواند وقتی سیاست نجات نوشتن‌های پایدار را مجاز می‌کند، به‌عنوان عملیات تعمیر تأییدشده مجاز باشد.
- نجات راه‌دور نمی‌تواند TUI محلی را باز کند یا به یک نشست تعاملی عامل تغییر دهد. برای تحویل به عامل از `openclaw` محلی استفاده کنید.
- نوشتن‌های پایدار همچنان حتی در حالت نجات به تأیید نیاز دارند.
- هر عملیات نجات اعمال‌شده را حسابرسی کن. نجات کانال پیام، metadata کانال، حساب، فرستنده و نشانی منبع را ثبت می‌کند. عملیات تغییر‌دهنده پیکربندی، hashهای پیکربندی را نیز قبل و بعد ثبت می‌کنند.
- هرگز اسرار را بازتاب ندهید. بازرسی SecretRef باید دسترس‌پذیری را گزارش کند، نه مقدارها را.
- اگر Gateway زنده است، عملیات نوع‌دار Gateway را ترجیح دهید. اگر Gateway از کار افتاده است، فقط از حداقل سطح تعمیر محلی استفاده کنید که به حلقه عادی عامل وابسته نیست.

شکل پیکربندی:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` باید بپذیرد:

- `"auto"`: پیش‌فرض. فقط وقتی runtime مؤثر YOLO است و sandboxing خاموش است اجازه بده.
- `false`: هرگز نجات کانال پیام را مجاز نکن.
- `true`: وقتی بررسی‌های مالک/کانال موفق باشند، نجات را صراحتا مجاز کن. این همچنان نباید رد sandboxing را دور بزند.

وضعیت YOLO پیش‌فرض `"auto"` این است:

- حالت sandbox به `off` resolve شود
- `tools.exec.security` به `full` resolve شود
- `tools.exec.ask` به `off` resolve شود

نجات راه‌دور توسط lane داکر پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-rescue
```

fallback برنامه‌ریز محلی بدون پیکربندی توسط این پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-planner
```

یک smoke سطح فرمان کانال live به‌صورت opt-in، `/crestodian status` را به‌همراه یک رفت‌وبرگشت تأیید پایدار از طریق handler نجات بررسی می‌کند:

```bash
pnpm test:live:crestodian-rescue-channel
```

راه‌اندازی تازه بدون پیکربندی از طریق Crestodian توسط این پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-first-run
```

آن lane با یک dir وضعیت خالی شروع می‌شود، `openclaw` خام را به Crestodian مسیردهی می‌کند، مدل پیش‌فرض را تنظیم می‌کند، یک عامل اضافی ایجاد می‌کند، Discord را از طریق فعال‌سازی Plugin به‌همراه SecretRef توکن پیکربندی می‌کند، پیکربندی را اعتبارسنجی می‌کند و گزارش حسابرسی را بررسی می‌کند. QA Lab نیز برای همان جریان Ring 0 یک سناریوی repo-backed دارد:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Doctor](/fa/cli/doctor)
- [TUI](/fa/cli/tui)
- [سندباکس](/fa/cli/sandbox)
- [امنیت](/fa/cli/security)

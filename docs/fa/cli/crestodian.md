---
read_when:
    - شما openclaw را بدون هیچ فرمانی اجرا می‌کنید و می‌خواهید Crestodian را درک کنید
    - به روشی ایمن برای حالت بدون پیکربندی نیاز دارید تا OpenClaw را بررسی یا تعمیر کنید
    - شما در حال طراحی یا فعال‌سازی حالت نجات کانال پیام هستید
summary: مرجع CLI و مدل امنیتی برای Crestodian، دستیار راه‌اندازی و تعمیرِ ایمن در حالت بدون پیکربندی
title: کرستودین
x-i18n:
    generated_at: "2026-04-29T22:34:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian دستیار محلی OpenClaw برای راه‌اندازی، تعمیر و پیکربندی است. این ابزار
طوری طراحی شده که وقتی مسیر عادی عامل خراب است، همچنان در دسترس بماند.

اجرای `openclaw` بدون هیچ دستور، Crestodian را در یک ترمینال تعاملی شروع می‌کند.
اجرای `openclaw crestodian` همان دستیار را به‌صورت صریح شروع می‌کند.

## آنچه Crestodian نشان می‌دهد

در هنگام شروع، Crestodian تعاملی همان پوسته TUI را باز می‌کند که توسط
`openclaw tui` استفاده می‌شود، با یک بک‌اند گفت‌وگوی Crestodian. گزارش گفت‌وگو با یک
خوشامدگویی کوتاه شروع می‌شود:

- چه زمانی Crestodian را شروع کنید
- مدل یا مسیر برنامه‌ریز قطعی‌ای که Crestodian واقعاً استفاده می‌کند
- اعتبار پیکربندی و عامل پیش‌فرض
- دسترسی‌پذیری Gateway از نخستین بررسی شروع
- اقدام اشکال‌زدایی بعدی که Crestodian می‌تواند انجام دهد

این ابزار برای شروع، اسرار را چاپ نمی‌کند یا دستورهای CLI مربوط به Plugin را بارگذاری نمی‌کند. TUI
همچنان سربرگ عادی، گزارش گفت‌وگو، خط وضعیت، پابرگ، تکمیل خودکار،
و کنترل‌های ویرایشگر را فراهم می‌کند.

برای موجودی دقیق همراه با مسیر پیکربندی، مسیرهای مستندات/منبع،
بررسی‌های CLI محلی، وجود کلید API، عامل‌ها، مدل، و جزئیات Gateway از `status` استفاده کنید.

Crestodian از همان کشف مرجع OpenClaw استفاده می‌کند که عامل‌های عادی استفاده می‌کنند. در یک checkout گیت،
خود را به `docs/` محلی و درخت منبع محلی ارجاع می‌دهد. در نصب بسته npm، از مستندات همراه بسته استفاده می‌کند و به
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) پیوند می‌دهد، همراه با راهنمایی صریح
برای بازبینی منبع هر زمان که مستندات کافی نباشند.

## مثال‌ها

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## شروع ایمن

مسیر شروع Crestodian عمداً کوچک است. می‌تواند اجرا شود وقتی:

- `openclaw.json` وجود ندارد
- `openclaw.json` نامعتبر است
- Gateway خاموش است
- ثبت دستورهای Plugin در دسترس نیست
- هنوز هیچ عاملی پیکربندی نشده است

`openclaw --help` و `openclaw --version` همچنان از مسیرهای سریع عادی استفاده می‌کنند.
`openclaw` غیرتعاملی به‌جای چاپ راهنمای ریشه، با یک پیام کوتاه خارج می‌شود،
زیرا محصول بدون دستور، Crestodian است.

## عملیات و تأیید

Crestodian به‌جای ویرایش موردی پیکربندی، از عملیات تایپ‌شده استفاده می‌کند.

عملیات فقط‌خواندنی می‌توانند فوراً اجرا شوند:

- نمایش نمای کلی
- فهرست کردن عامل‌ها
- نمایش وضعیت مدل/بک‌اند
- اجرای بررسی‌های وضعیت یا سلامت
- بررسی دسترسی‌پذیری Gateway
- اجرای doctor بدون تعمیرهای تعاملی
- اعتبارسنجی پیکربندی
- نمایش مسیر گزارش حسابرسی

عملیات پایدار در حالت تعاملی به تأیید گفت‌وگویی نیاز دارند، مگر اینکه
برای یک دستور مستقیم `--yes` را پاس دهید:

- نوشتن پیکربندی
- اجرای `config set`
- تنظیم مقادیر SecretRef پشتیبانی‌شده از طریق `config set-ref`
- اجرای راه‌اندازی/بوت‌استرپ onboarding
- تغییر مدل پیش‌فرض
- شروع، توقف، یا راه‌اندازی مجدد Gateway
- ایجاد عامل‌ها
- اجرای تعمیرهای doctor که پیکربندی یا وضعیت را بازنویسی می‌کنند

نوشتن‌های اعمال‌شده در اینجا ثبت می‌شوند:

```text
~/.openclaw/audit/crestodian.jsonl
```

کشف، حسابرسی نمی‌شود. فقط عملیات اعمال‌شده و نوشتن‌ها ثبت می‌شوند.

`openclaw onboard --modern`، Crestodian را به‌عنوان پیش‌نمایش onboarding مدرن شروع می‌کند.
`openclaw onboard` ساده همچنان onboarding کلاسیک را اجرا می‌کند.

## بوت‌استرپ راه‌اندازی

`setup` بوت‌استرپ onboarding گفت‌وگومحور است. فقط از طریق عملیات
پیکربندی تایپ‌شده می‌نویسد و ابتدا درخواست تأیید می‌کند.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

وقتی هیچ مدلی پیکربندی نشده باشد، setup نخستین بک‌اند قابل استفاده را با این
ترتیب انتخاب می‌کند و به شما می‌گوید چه چیزی را انتخاب کرده است:

- مدل صریح موجود، اگر از قبل پیکربندی شده باشد
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

اگر هیچ‌کدام در دسترس نباشند، setup همچنان فضای کاری پیش‌فرض را می‌نویسد و
مدل را تنظیم‌نشده باقی می‌گذارد. Codex/Claude Code را نصب کنید یا وارد آن شوید، یا
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` را در دسترس قرار دهید، سپس setup را دوباره اجرا کنید.

## برنامه‌ریز با کمک مدل

Crestodian همیشه در حالت قطعی شروع می‌شود. برای دستورهای مبهمی که
تجزیه‌گر قطعی نمی‌فهمد، Crestodian محلی می‌تواند یک نوبت برنامه‌ریز محدود
را از طریق مسیرهای زمان اجرای عادی OpenClaw انجام دهد. ابتدا از مدل
پیکربندی‌شده OpenClaw استفاده می‌کند. اگر هنوز هیچ مدل پیکربندی‌شده‌ای قابل استفاده نباشد، می‌تواند به
زمان‌های اجرای محلی که از قبل روی ماشین وجود دارند برگردد:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- مهار app-server مربوط به Codex: `openai/gpt-5.5` با `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

برنامه‌ریز با کمک مدل نمی‌تواند پیکربندی را مستقیماً تغییر دهد. باید درخواست را
به یکی از دستورهای تایپ‌شده Crestodian ترجمه کند، سپس قواعد عادی تأیید و
حسابرسی اعمال می‌شوند. Crestodian پیش از اجرای هر چیزی، مدلی را که استفاده کرده و
دستور تفسیرشده را چاپ می‌کند. نوبت‌های برنامه‌ریز جایگزین بدون پیکربندی
موقتی هستند، در جاهایی که زمان اجرا پشتیبانی کند ابزارها در آن‌ها غیرفعال‌اند، و از یک
فضای کاری/نشست موقت استفاده می‌کنند.

حالت نجات کانال پیام از برنامه‌ریز با کمک مدل استفاده نمی‌کند. نجات از راه دور
قطعی باقی می‌ماند تا یک مسیر عادی عاملِ خراب یا به‌خطر‌افتاده نتواند
به‌عنوان ویرایشگر پیکربندی استفاده شود.

## جابه‌جایی به یک عامل

برای خروج از Crestodian و باز کردن TUI عادی، از یک انتخاب‌گر زبان طبیعی استفاده کنید:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`، `openclaw chat`، و `openclaw terminal` همچنان TUI عادی
عامل را مستقیماً باز می‌کنند. آن‌ها Crestodian را شروع نمی‌کنند.

پس از جابه‌جایی به TUI عادی، برای بازگشت به Crestodian از `/crestodian` استفاده کنید.
می‌توانید یک درخواست پیگیری هم اضافه کنید:

```text
/crestodian
/crestodian restart gateway
```

جابه‌جایی‌های عامل داخل TUI یک نشانه باقی می‌گذارند که `/crestodian` در دسترس است.

## حالت نجات پیام

حالت نجات پیام، نقطه ورود کانال پیام برای Crestodian است. برای
حالتی است که عامل عادی شما از کار افتاده، اما یک کانال مورد اعتماد مانند WhatsApp
همچنان دستورها را دریافت می‌کند.

دستور متنی پشتیبانی‌شده:

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

ایجاد عامل همچنین می‌تواند از اعلان محلی یا حالت نجات در صف قرار گیرد:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

حالت نجات از راه دور یک سطح مدیریتی است. باید مانند تعمیر پیکربندی از راه دور
با آن رفتار شود، نه مانند گفت‌وگوی عادی.

قرارداد امنیتی برای نجات از راه دور:

- وقتی sandboxing فعال است غیرفعال می‌شود. اگر یک عامل/نشست sandbox شده باشد،
  Crestodian باید نجات از راه دور را رد کند و توضیح دهد که تعمیر با CLI محلی
  لازم است.
- وضعیت مؤثر پیش‌فرض `auto` است: نجات از راه دور فقط در عملیات YOLO مورد اعتماد
  مجاز است، جایی که زمان اجرا از قبل اختیار محلی بدون sandbox دارد.
- نیازمند هویت مالک صریح است. نجات نباید قواعد فرستنده wildcard،
  سیاست گروه باز، وب‌هوک‌های احراز‌هویت‌نشده، یا کانال‌های ناشناس را بپذیرد.
- به‌صورت پیش‌فرض فقط DMهای مالک. نجات در گروه/کانال به opt-in صریح نیاز دارد.
- نجات از راه دور نمی‌تواند TUI محلی را باز کند یا وارد یک نشست عامل تعاملی شود.
  برای تحویل به عامل از `openclaw` محلی استفاده کنید.
- نوشتن‌های پایدار همچنان حتی در حالت نجات هم به تأیید نیاز دارند.
- هر عملیات نجات اعمال‌شده را حسابرسی کنید. نجات کانال پیام، کانال،
  حساب، فرستنده، و فراداده نشانی منبع را ثبت می‌کند. عملیات تغییردهنده پیکربندی همچنین
  هش‌های پیکربندی قبل و بعد را ثبت می‌کنند.
- هرگز اسرار را بازتاب ندهید. بازرسی SecretRef باید در دسترس بودن را گزارش کند، نه
  مقادیر را.
- اگر Gateway زنده است، عملیات تایپ‌شده Gateway را ترجیح دهید. اگر Gateway
  از کار افتاده است، فقط از سطح تعمیر محلی حداقلی استفاده کنید که به حلقه عادی عامل
  وابسته نیست.

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

- `"auto"`: پیش‌فرض. فقط وقتی اجازه می‌دهد که زمان اجرای مؤثر YOLO باشد و
  sandboxing خاموش باشد.
- `false`: هرگز نجات کانال پیام را مجاز نکن.
- `true`: وقتی بررسی‌های مالک/کانال موفق می‌شوند، نجات را به‌صورت صریح مجاز کن. این
  همچنان نباید رد sandboxing را دور بزند.

وضعیت YOLO پیش‌فرض `"auto"` چنین است:

- حالت sandbox به `off` resolve می‌شود
- `tools.exec.security` به `full` resolve می‌شود
- `tools.exec.ask` به `off` resolve می‌شود

نجات از راه دور توسط lane مربوط به Docker پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-rescue
```

جایگزین برنامه‌ریز محلی بدون پیکربندی توسط این مورد پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-planner
```

یک smoke اختیاری برای سطح دستور کانال زنده، `/crestodian status` به‌علاوه یک
رفت‌وبرگشت تأیید پایدار از طریق هندلر نجات را بررسی می‌کند:

```bash
pnpm test:live:crestodian-rescue-channel
```

راه‌اندازی تازه بدون پیکربندی از طریق Crestodian توسط این مورد پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-first-run
```

آن lane با یک دایرکتوری وضعیت خالی شروع می‌شود، `openclaw` ساده را به Crestodian مسیریابی می‌کند،
مدل پیش‌فرض را تنظیم می‌کند، یک عامل اضافی ایجاد می‌کند، Discord را از طریق
فعال‌سازی یک Plugin به‌علاوه token SecretRef پیکربندی می‌کند، پیکربندی را اعتبارسنجی می‌کند، و گزارش حسابرسی
را بررسی می‌کند. QA Lab همچنین یک سناریوی مبتنی بر مخزن برای همان جریان Ring 0 دارد:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Doctor](/fa/cli/doctor)
- [TUI](/fa/cli/tui)
- [Sandbox](/fa/cli/sandbox)
- [امنیت](/fa/cli/security)

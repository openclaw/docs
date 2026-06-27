---
read_when:
    - پس از راه‌اندازی، openclaw را بدون هیچ دستوری اجرا می‌کنید و می‌خواهید Crestodian را بشناسید
    - به روشی ایمن و بدون نیاز به پیکربندی برای بررسی یا تعمیر OpenClaw نیاز دارید
    - شما در حال طراحی یا فعال‌سازی حالت نجات کانال پیام‌رسانی هستید
summary: مرجع CLI و مدل امنیتی Crestodian، ابزار کمکی راه‌اندازی و تعمیر ایمن بدون نیاز به پیکربندی
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:23:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian دستیار محلی OpenClaw برای راه‌اندازی، تعمیر و پیکربندی است. طوری
طراحی شده است که وقتی مسیر معمول agent خراب است، همچنان در دسترس بماند.

اجرای `openclaw` بدون command، وقتی فایل config فعال وجود ندارد یا هیچ تنظیم
نوشته‌شده‌ای ندارد (خالی یا فقط metadata)، ابتدا onboarding کلاسیک را شروع
می‌کند. پس از آنکه یک فایل config دارای تنظیمات نوشته‌شده شد، اجرای `openclaw`
بدون command، Crestodian را در یک terminal تعاملی شروع می‌کند. اجرای
`openclaw crestodian` همان helper را به‌صورت صریح شروع می‌کند.

## آنچه Crestodian نشان می‌دهد

هنگام startup، Crestodian تعاملی همان پوسته TUI را که `openclaw tui` استفاده
می‌کند، با یک backend چت Crestodian باز می‌کند. لاگ چت با یک خوشامد کوتاه
شروع می‌شود:

- چه زمانی Crestodian را شروع کنید
- model یا مسیر planner قطعی‌ای که Crestodian واقعاً استفاده می‌کند
- اعتبار config و agent پیش‌فرض
- دسترسی‌پذیری Gateway از نخستین probe هنگام startup
- اقدام debug بعدی که Crestodian می‌تواند انجام دهد

فقط برای شروع، secrets را dump نمی‌کند یا commandهای CLI مربوط به Plugin را
load نمی‌کند. TUI همچنان header، لاگ چت، status line، footer، autocomplete و
کنترل‌های editor معمول را فراهم می‌کند.

برای inventory تفصیلی همراه با مسیر config، مسیرهای docs/source، probeهای CLI
محلی، وجود API key، agents، model و جزئیات Gateway از `status` استفاده کنید.

Crestodian از همان کشف reference در OpenClaw استفاده می‌کند که agents معمولی
استفاده می‌کنند. در یک Git checkout، خودش را به `docs/` محلی و source tree
محلی اشاره می‌دهد. در نصب package از npm، از docs همراه package استفاده
می‌کند و به [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)
لینک می‌دهد، همراه با راهنمایی صریح برای بررسی source هر زمان که docs کافی
نباشند.

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

## Startup ایمن

مسیر startup در Crestodian عمداً کوچک است. این ابزار می‌تواند اجرا شود وقتی:

- `openclaw.json` وجود ندارد
- `openclaw.json` نامعتبر است
- Gateway خاموش است
- ثبت command مربوط به Plugin در دسترس نیست
- هنوز هیچ agentی پیکربندی نشده است

`openclaw --help` و `openclaw --version` همچنان از مسیرهای سریع معمول استفاده
می‌کنند. `openclaw` ساده و غیرتعاملی، به‌جای چاپ root help، با یک پیام کوتاه
خارج می‌شود. در نصب تازه، پیام به onboarding غیرتعاملی اشاره می‌کند؛ پس از
راه‌اندازی، به commandهای تک‌مرحله‌ای Crestodian اشاره می‌کند.

## عملیات و تأیید

Crestodian به‌جای ویرایش ad hoc در config، از عملیات typed استفاده می‌کند.

عملیات فقط‌خواندنی می‌توانند فوراً اجرا شوند:

- نمایش overview
- فهرست کردن agents
- فهرست کردن plugins نصب‌شده
- جست‌وجوی plugins در ClawHub
- نمایش وضعیت model/backend
- اجرای بررسی‌های status یا health
- بررسی دسترسی‌پذیری Gateway
- اجرای doctor بدون تعمیرات تعاملی
- اعتبارسنجی config
- نمایش مسیر audit log

عملیات persistent در حالت تعاملی نیازمند تأیید مکالمه‌ای هستند، مگر اینکه برای
یک command مستقیم `--yes` را pass کنید:

- نوشتن config
- اجرای `config set`
- تنظیم مقادیر SecretRef پشتیبانی‌شده از طریق `config set-ref`
- اجرای bootstrap راه‌اندازی/onboarding
- تغییر model پیش‌فرض
- start، stop یا restart کردن Gateway
- ایجاد agents
- نصب plugins از ClawHub یا npm
- uninstall کردن plugins
- اجرای تعمیرات doctor که config یا state را بازنویسی می‌کنند

نوشتن‌های اعمال‌شده در اینجا ثبت می‌شوند:

```text
~/.openclaw/audit/crestodian.jsonl
```

Discovery audit نمی‌شود. فقط عملیات اعمال‌شده و writeها log می‌شوند.

`openclaw onboard --modern`، Crestodian را به‌عنوان پیش‌نمایش onboarding مدرن
شروع می‌کند. `openclaw onboard` ساده همچنان onboarding کلاسیک را اجرا می‌کند.

## Bootstrap راه‌اندازی

`setup`، bootstrap چت‌محور onboarding است. فقط از طریق عملیات typed مربوط به
config می‌نویسد و ابتدا درخواست تأیید می‌کند.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

وقتی هیچ modelی پیکربندی نشده باشد، setup نخستین backend قابل‌استفاده را به
این ترتیب انتخاب می‌کند و به شما می‌گوید چه چیزی را انتخاب کرده است:

- model صریح موجود، اگر از قبل پیکربندی شده باشد
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` از طریق harness app-server مربوط به Codex

اگر هیچ‌کدام در دسترس نباشند، setup همچنان workspace پیش‌فرض را می‌نویسد و
model را unset باقی می‌گذارد. Codex/Claude Code را نصب کنید یا وارد آن شوید،
یا `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` را expose کنید، سپس setup را دوباره
اجرا کنید.

## Planner کمک‌گرفته از Model

Crestodian همیشه در حالت قطعی شروع می‌شود. برای commandهای مبهمی که parser
قطعی نمی‌فهمد، Crestodian محلی می‌تواند یک turn محدود planner را از طریق
مسیرهای runtime معمول OpenClaw انجام دهد. ابتدا از model پیکربندی‌شده OpenClaw
استفاده می‌کند. اگر هنوز هیچ model پیکربندی‌شده‌ای قابل‌استفاده نباشد، می‌تواند
به runtimeهای محلی‌ای که از قبل روی machine وجود دارند fallback کند:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- harness app-server مربوط به Codex: `openai/gpt-5.5`

Planner کمک‌گرفته از model نمی‌تواند مستقیماً config را mutate کند. باید request
را به یکی از commandهای typed در Crestodian ترجمه کند، سپس قوانین معمول approval
و audit اعمال می‌شوند. Crestodian پیش از اجرای هر چیزی، model استفاده‌شده و
command تفسیرشده را چاپ می‌کند. turnهای planner fallback بدون config موقتی
هستند، هرجا runtime پشتیبانی کند tool-disabled هستند، و از یک workspace/session
موقت استفاده می‌کنند.

حالت rescue در message-channel از planner کمک‌گرفته از model استفاده نمی‌کند.
rescue از راه دور قطعی باقی می‌ماند تا مسیر معمول agent که خراب یا compromise
شده است نتواند به‌عنوان editor پیکربندی استفاده شود.

## جابه‌جایی به agent

برای خروج از Crestodian و باز کردن TUI معمول از selector زبان طبیعی استفاده
کنید:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`، `openclaw chat` و `openclaw terminal` همچنان TUI معمول agent را
مستقیماً باز می‌کنند. آن‌ها Crestodian را شروع نمی‌کنند.

پس از جابه‌جایی به TUI معمول، برای بازگشت به Crestodian از `/crestodian` استفاده
کنید. می‌توانید یک درخواست follow-up هم اضافه کنید:

```text
/crestodian
/crestodian restart gateway
```

جابه‌جایی‌های agent داخل TUI یک breadcrumb باقی می‌گذارند که نشان می‌دهد
`/crestodian` در دسترس است.

## حالت rescue پیام

حالت rescue پیام، entrypoint مربوط به message-channel برای Crestodian است. این
حالت برای زمانی است که agent معمول شما dead است، اما یک channel مورداعتماد
مانند WhatsApp همچنان commandها را دریافت می‌کند.

command متنی پشتیبانی‌شده:

- `/crestodian <request>`

جریان operator:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

ایجاد agent همچنین می‌تواند از prompt محلی یا حالت rescue در queue قرار بگیرد:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

حالت rescue از راه دور یک سطح admin است. باید مثل repair پیکربندی از راه دور
با آن برخورد شود، نه مثل چت معمول.

قرارداد امنیتی برای rescue از راه دور:

- وقتی sandboxing فعال است disabled می‌شود. اگر یک agent/session sandboxed باشد،
  Crestodian باید rescue از راه دور را رد کند و توضیح دهد که repair با CLI محلی
  لازم است.
- حالت effective پیش‌فرض `auto` است: rescue از راه دور را فقط در عملیات YOLO
  مورداعتماد مجاز کن، جایی که runtime از قبل authority محلی بدون sandbox دارد.
- یک owner identity صریح لازم است. Rescue نباید sender ruleهای wildcard،
  policy باز group، webhooks احرازهویت‌نشده، یا channels ناشناس را بپذیرد.
- به‌طور پیش‌فرض فقط DMهای owner. Rescue در group/channel نیازمند opt-in صریح
  است.
- جست‌وجو و فهرست Plugin فقط‌خواندنی هستند. نصب Plugin به‌طور پیش‌فرض فقط محلی
  است، چون executable code را download می‌کند. حذف Plugin می‌تواند وقتی rescue
  policy نوشتن‌های persistent را مجاز می‌کند، به‌عنوان یک عملیات repair تأییدشده
  مجاز باشد.
- Rescue از راه دور نمی‌تواند TUI محلی را باز کند یا وارد یک session تعاملی
  agent شود. برای handoff به agent از `openclaw` محلی استفاده کنید.
- نوشتن‌های persistent همچنان حتی در حالت rescue نیازمند approval هستند.
- هر عملیات rescue اعمال‌شده را audit کنید. Rescue در message-channel، metadata
  مربوط به channel، account، sender و source-address را ثبت می‌کند. عملیات
  config-mutating همچنین hashهای config را قبل و بعد ثبت می‌کنند.
- هرگز secrets را echo نکنید. بررسی SecretRef باید availability را گزارش کند،
  نه values را.
- اگر Gateway زنده است، عملیات typed مربوط به Gateway را ترجیح دهید. اگر Gateway
  dead است، فقط از حداقل سطح repair محلی‌ای استفاده کنید که به loop معمول agent
  وابسته نیست.

شکل config:

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

`enabled` باید این موارد را بپذیرد:

- `"auto"`: پیش‌فرض. فقط وقتی runtime مؤثر YOLO است و sandboxing خاموش است مجاز
  کن.
- `false`: هرگز rescue از message-channel را مجاز نکن.
- `true`: وقتی بررسی‌های owner/channel pass می‌شوند، rescue را به‌صورت صریح
  مجاز کن. این همچنان نباید denial مربوط به sandboxing را bypass کند.

وضعیت YOLO پیش‌فرض `"auto"` چنین است:

- sandbox mode به `off` resolve می‌شود
- `tools.exec.security` به `full` resolve می‌شود
- `tools.exec.ask` به `off` resolve می‌شود

Rescue از راه دور توسط Docker lane پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-rescue
```

Fallback محلی planner بدون config توسط این مورد پوشش داده می‌شود:

```bash
pnpm test:docker:crestodian-planner
```

یک smoke اختیاری opt-in برای command-surface در channel زنده، `/crestodian status`
به‌همراه یک roundtrip approval برای persistent از طریق rescue handler را بررسی
می‌کند:

```bash
pnpm test:live:crestodian-rescue-channel
```

راه‌اندازی بدون config از طریق commandهای صریح Crestodian توسط این مورد پوشش
داده می‌شود:

```bash
pnpm test:docker:crestodian-first-run
```

آن lane با یک state dir خالی شروع می‌شود، entrypoint مدرن onboard در Crestodian
را verify می‌کند، model پیش‌فرض را تنظیم می‌کند، یک agent اضافی ایجاد می‌کند،
Discord را از طریق فعال‌سازی Plugin به‌همراه token SecretRef پیکربندی می‌کند،
config را validate می‌کند و audit log را بررسی می‌کند. QA Lab نیز برای همان
جریان Ring 0 یک scenario مبتنی بر repo دارد:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Doctor](/fa/cli/doctor)
- [TUI](/fa/cli/tui)
- [Sandbox](/fa/cli/sandbox)
- [Security](/fa/cli/security)

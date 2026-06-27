---
read_when:
    - می‌خواهید تأییدهای exec را از CLI ویرایش کنید
    - باید فهرست‌های مجاز را روی میزبان‌های Gateway یا Node مدیریت کنید.
summary: مرجع CLI برای `openclaw approvals` و `openclaw exec-policy`
title: تأییدها
x-i18n:
    generated_at: "2026-06-27T17:22:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

تأییدهای exec را برای **میزبان محلی**، **میزبان Gateway**، یا یک **میزبان Node** مدیریت کنید.
به‌طور پیش‌فرض، فرمان‌ها فایل تأییدهای محلی روی دیسک را هدف می‌گیرند. از `--gateway` برای هدف‌گرفتن Gateway، یا از `--node` برای هدف‌گرفتن یک Node مشخص استفاده کنید.

نام مستعار: `openclaw exec-approvals`

مرتبط:

- تأییدهای exec: [تأییدهای exec](/fa/tools/exec-approvals)
- Nodeها: [Nodeها](/fa/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` فرمان کمکی محلی برای هم‌راستا نگه‌داشتن پیکربندی درخواستی
`tools.exec.*` و فایل تأییدهای میزبان محلی در یک مرحله است.

وقتی می‌خواهید این کارها را انجام دهید از آن استفاده کنید:

- بررسی سیاست درخواستی محلی، فایل تأییدهای میزبان، و ادغام مؤثر
- اعمال یک preset محلی مانند YOLO یا deny-all
- همگام‌سازی `tools.exec.*` محلی و فایل تأییدهای میزبان محلی

نمونه‌ها:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

حالت‌های خروجی:

- بدون `--json`: نمای جدولی خوانا برای انسان را چاپ می‌کند
- `--json`: خروجی ساخت‌یافته و قابل‌خواندن برای ماشین را چاپ می‌کند

دامنه فعلی:

- `exec-policy` **فقط محلی** است
- فایل پیکربندی محلی و فایل تأییدهای محلی را با هم به‌روزرسانی می‌کند
- سیاست را به میزبان Gateway یا یک میزبان Node ارسال **نمی‌کند**
- `--host node` در این فرمان رد می‌شود، چون تأییدهای exec مربوط به Node هنگام اجرا از خود Node دریافت می‌شوند و باید در عوض از طریق فرمان‌های تأیید هدف‌گرفته‌شده برای Node مدیریت شوند
- `openclaw exec-policy show` دامنه‌های `host=node` را به‌جای استخراج یک سیاست مؤثر از فایل تأییدهای محلی، هنگام اجرا به‌عنوان مدیریت‌شده توسط Node علامت‌گذاری می‌کند

اگر باید تأییدهای میزبان راه‌دور را مستقیماً ویرایش کنید، همچنان از `openclaw approvals set --gateway`
یا `openclaw approvals set --node <id|name|ip>` استفاده کنید.

## فرمان‌های رایج

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` اکنون سیاست exec مؤثر را برای اهداف محلی، Gateway، و Node نشان می‌دهد:

- سیاست درخواستی `tools.exec`
- سیاست فایل تأییدهای میزبان
- نتیجه مؤثر پس از اعمال قواعد اولویت

اولویت‌دهی عامدانه است:

- فایل تأییدهای میزبان منبع حقیقت قابل‌اعمال است
- سیاست درخواستی `tools.exec` می‌تواند نیت را محدودتر یا گسترده‌تر کند، اما نتیجه مؤثر همچنان از قواعد میزبان استخراج می‌شود
- `--node` فایل تأییدهای میزبان Node را با سیاست `tools.exec` مربوط به Gateway ترکیب می‌کند، چون هر دو همچنان هنگام اجرا اعمال می‌شوند
- اگر پیکربندی Gateway در دسترس نباشد، CLI به snapshot تأییدهای Node برمی‌گردد و یادداشت می‌کند که سیاست نهایی زمان اجرا قابل محاسبه نبوده است

## جایگزینی تأییدها از یک فایل

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` فقط JSON سخت‌گیرانه را نمی‌پذیرد، بلکه JSON5 را هم می‌پذیرد. یا از `--file` استفاده کنید یا از `--stdin`، نه هر دو.

## نمونه «هرگز درخواست نکن» / YOLO

برای میزبانی که هرگز نباید روی تأییدهای exec متوقف شود، مقدارهای پیش‌فرض تأییدهای میزبان را روی `full` + `off` بگذارید:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

گونه Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

این فقط **فایل تأییدهای میزبان** را تغییر می‌دهد. برای هم‌راستا نگه‌داشتن سیاست درخواستی OpenClaw، این موارد را نیز تنظیم کنید:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

دلیل `tools.exec.host=gateway` در این نمونه:

- `host=auto` همچنان یعنی «وقتی sandbox در دسترس است از آن استفاده کن، در غیر این صورت Gateway».
- YOLO درباره تأییدهاست، نه مسیریابی.
- اگر حتی وقتی sandbox پیکربندی شده است exec روی میزبان را می‌خواهید، انتخاب میزبان را با `gateway` یا `/exec host=gateway` صریح کنید.

`askFallback` حذف‌شده به‌طور پیش‌فرض `deny` است. هنگام ارتقای یک میزبان بدون رابط کاربری که باید رفتار بدون درخواست را حفظ کند، `askFallback: "full"`
را صریح تنظیم کنید.

میانبر محلی:

```bash
openclaw exec-policy preset yolo
```

این میانبر محلی هم پیکربندی درخواستی محلی `tools.exec.*` و هم
پیش‌فرض‌های تأیید محلی را با هم به‌روزرسانی می‌کند. از نظر هدف معادل راه‌اندازی دستی دومرحله‌ای
بالاست، اما فقط برای ماشین محلی.

## ابزارهای کمکی allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## گزینه‌های رایج

`get`، `set`، و `allowlist add|remove` همگی از این‌ها پشتیبانی می‌کنند:

- `--node <id|name|ip>`
- `--gateway`
- گزینه‌های مشترک RPC مربوط به Node: `--url`، `--token`، `--timeout`، `--json`

نکات هدف‌گیری:

- نبود پرچم‌های هدف یعنی فایل تأییدهای محلی روی دیسک
- `--gateway` فایل تأییدهای میزبان Gateway را هدف می‌گیرد
- `--node` پس از resolve کردن id، نام، IP، یا پیشوند id، یک میزبان Node را هدف می‌گیرد

`allowlist add|remove` همچنین از این مورد پشتیبانی می‌کند:

- `--agent <id>` (پیش‌فرض `*` است)

## نکات

- `--node` از همان resolver مربوط به `openclaw nodes` استفاده می‌کند (id، نام، ip، یا پیشوند id).
- `--agent` به‌طور پیش‌فرض `"*"` است، که روی همه agentها اعمال می‌شود.
- میزبان Node باید `system.execApprovals.get/set` را اعلام کند (برنامه macOS یا میزبان Node بدون رابط).
- فایل‌های تأیید برای هر میزبان در دایرکتوری state مربوط به OpenClaw ذخیره می‌شوند
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`، یا
  `~/.openclaw/exec-approvals.json` وقتی متغیر تنظیم نشده باشد).

## مرتبط

- [مرجع CLI](/fa/cli)
- [تأییدهای exec](/fa/tools/exec-approvals)

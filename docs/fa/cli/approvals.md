---
read_when:
    - می‌خواهید تأییدیه‌های exec را از CLI ویرایش کنید
    - باید فهرست‌های مجاز را روی میزبان‌های Gateway یا Node مدیریت کنید
summary: مرجع CLI برای `openclaw approvals` و `openclaw exec-policy`
title: تأییدها
x-i18n:
    generated_at: "2026-04-29T22:32:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

تأییدهای اجرا را برای **میزبان محلی**، **میزبان Gateway**، یا یک **میزبان Node** مدیریت کنید.
به‌طور پیش‌فرض، فرمان‌ها فایل تأییدهای محلی روی دیسک را هدف می‌گیرند. برای هدف‌گیری Gateway از `--gateway` استفاده کنید، یا برای هدف‌گیری یک Node مشخص از `--node` استفاده کنید.

نام مستعار: `openclaw exec-approvals`

مرتبط:

- تأییدهای اجرا: [تأییدهای اجرا](/fa/tools/exec-approvals)
- Nodeها: [Nodeها](/fa/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` فرمان کمکی محلی برای همگام نگه داشتن پیکربندی درخواستی
`tools.exec.*` و فایل تأییدهای میزبان محلی در یک مرحله است.

از آن زمانی استفاده کنید که می‌خواهید:

- سیاست درخواستی محلی، فایل تأییدهای میزبان، و ادغام مؤثر را بررسی کنید
- یک پیش‌تنظیم محلی مانند YOLO یا deny-all اعمال کنید
- `tools.exec.*` محلی و `~/.openclaw/exec-approvals.json` محلی را همگام‌سازی کنید

نمونه‌ها:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

حالت‌های خروجی:

- بدون `--json`: نمای جدول خوانا برای انسان را چاپ می‌کند
- `--json`: خروجی ساختاریافته خوانا برای ماشین را چاپ می‌کند

دامنه فعلی:

- `exec-policy` **فقط محلی** است
- فایل پیکربندی محلی و فایل تأییدهای محلی را با هم به‌روزرسانی می‌کند
- سیاست را به میزبان Gateway یا میزبان Node ارسال **نمی‌کند**
- `--host node` در این فرمان رد می‌شود، چون تأییدهای اجرای Node در زمان اجرا از Node دریافت می‌شوند و باید به‌جای آن از طریق فرمان‌های تأییدهای هدف‌گیری‌شده برای Node مدیریت شوند
- `openclaw exec-policy show` دامنه‌های `host=node` را در زمان اجرا به‌عنوان مدیریت‌شده توسط Node علامت‌گذاری می‌کند، نه اینکه یک سیاست مؤثر را از فایل تأییدهای محلی استخراج کند

اگر لازم است تأییدهای میزبان راه‌دور را مستقیم ویرایش کنید، همچنان از `openclaw approvals set --gateway`
یا `openclaw approvals set --node <id|name|ip>` استفاده کنید.

## فرمان‌های رایج

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` اکنون سیاست اجرای مؤثر را برای هدف‌های محلی، Gateway، و Node نشان می‌دهد:

- سیاست درخواستی `tools.exec`
- سیاست فایل تأییدهای میزبان
- نتیجه مؤثر پس از اعمال قواعد تقدم

تقدم عمدی است:

- فایل تأییدهای میزبان منبع حقیقت قابل اجرا است
- سیاست درخواستی `tools.exec` می‌تواند نیت را محدودتر یا گسترده‌تر کند، اما نتیجه مؤثر همچنان از قواعد میزبان استخراج می‌شود
- `--node` فایل تأییدهای میزبان Node را با سیاست `tools.exec` Gateway ترکیب می‌کند، چون هر دو همچنان در زمان اجرا اعمال می‌شوند
- اگر پیکربندی Gateway در دسترس نباشد، CLI به تصویر لحظه‌ای تأییدهای Node بازمی‌گردد و یادداشت می‌کند که سیاست نهایی زمان اجرا قابل محاسبه نبود

## جایگزینی تأییدها از یک فایل

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`، JSON5 را می‌پذیرد، نه فقط JSON سخت‌گیرانه. یا از `--file` استفاده کنید یا از `--stdin`، نه هر دو.

## نمونه «هرگز درخواست نکن» / YOLO

برای میزبانی که هرگز نباید روی تأییدهای اجرا متوقف شود، پیش‌فرض‌های تأییدهای میزبان را روی `full` + `off` تنظیم کنید:

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

این فقط **فایل تأییدهای میزبان** را تغییر می‌دهد. برای هم‌راستا نگه داشتن سیاست درخواستی OpenClaw، این موارد را نیز تنظیم کنید:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

دلیل `tools.exec.host=gateway` در این نمونه:

- `host=auto` همچنان یعنی «در صورت وجود، sandbox؛ در غیر این صورت Gateway».
- YOLO درباره تأییدها است، نه مسیریابی.
- اگر حتی وقتی sandbox پیکربندی شده است اجرای میزبان را می‌خواهید، انتخاب میزبان را با `gateway` یا `/exec host=gateway` صریح کنید.

این با رفتار فعلی YOLO پیش‌فرض میزبان مطابقت دارد. اگر تأییدها را می‌خواهید، آن را سخت‌گیرانه‌تر کنید.

میان‌بر محلی:

```bash
openclaw exec-policy preset yolo
```

آن میان‌بر محلی هم پیکربندی درخواستی محلی `tools.exec.*` و هم
پیش‌فرض‌های تأییدهای محلی را با هم به‌روزرسانی می‌کند. از نظر نیت معادل راه‌اندازی
دومرحله‌ای دستی بالا است، اما فقط برای ماشین محلی.

## کمک‌کننده‌های فهرست مجاز

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## گزینه‌های رایج

`get`، `set`، و `allowlist add|remove` همگی پشتیبانی می‌کنند از:

- `--node <id|name|ip>`
- `--gateway`
- گزینه‌های RPC مشترک Node: `--url`، `--token`، `--timeout`، `--json`

یادداشت‌های هدف‌گیری:

- نبود پرچم هدف یعنی فایل تأییدهای محلی روی دیسک
- `--gateway` فایل تأییدهای میزبان Gateway را هدف می‌گیرد
- `--node` پس از حل کردن شناسه، نام، IP، یا پیشوند شناسه، یک میزبان Node را هدف می‌گیرد

`allowlist add|remove` همچنین پشتیبانی می‌کند از:

- `--agent <id>` (پیش‌فرض `*` است)

## یادداشت‌ها

- `--node` از همان حل‌کننده `openclaw nodes` استفاده می‌کند (شناسه، نام، ip، یا پیشوند شناسه).
- `--agent` به‌طور پیش‌فرض `"*"` است، که روی همه agentها اعمال می‌شود.
- میزبان Node باید `system.execApprovals.get/set` را اعلام کند (برنامه macOS یا میزبان Node بدون واسط گرافیکی).
- فایل‌های تأییدها برای هر میزبان در `~/.openclaw/exec-approvals.json` ذخیره می‌شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [تأییدهای اجرا](/fa/tools/exec-approvals)

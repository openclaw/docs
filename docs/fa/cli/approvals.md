---
read_when:
    - می‌خواهید تأییدیه‌های اجرا را از طریق CLI ویرایش کنید
    - باید فهرست‌های مجاز را روی میزبان‌های Gateway یا Node مدیریت کنید
summary: مرجع CLI برای `openclaw approvals` و `openclaw exec-policy`
title: تأییدها
x-i18n:
    generated_at: "2026-07-12T09:42:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

تأییدهای اجرا را برای **میزبان محلی**، **میزبان Gateway** یا یک **میزبان Node** مدیریت کنید. اگر پرچم مقصدی ارائه نشود، فرمان‌ها فایل تأییدهای محلی روی دیسک را می‌خوانند یا می‌نویسند. برای هدف‌گیری Gateway از `--gateway` و برای هدف‌گیری یک Node مشخص از `--node <id|name|ip>` استفاده کنید.

نام مستعار: `openclaw exec-approvals`

مرتبط: [تأییدهای اجرا](/fa/tools/exec-approvals)، [Nodeها](/fa/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` فرمان کمکی **صرفاً محلی** است که پیکربندی درخواستی `tools.exec.*` و فایل تأییدهای میزبان محلی را در یک مرحله همگام نگه می‌دارد:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

پیش‌تنظیم‌ها (`yolo`، `cautious`، `deny-all`) مقادیر `host`، `security`، `ask` و `askFallback` را با هم اعمال می‌کنند. `set` فقط پرچم‌هایی را اعمال می‌کند که ارائه می‌دهید؛ هر مقدار پذیرفته‌شده اعتبارسنجی می‌شود (`--host auto|sandbox|gateway|node`، `--security deny|allowlist|full`، `--ask off|on-miss|always`، `--ask-fallback deny|allowlist|full`).

دامنه:

- فایل پیکربندی محلی و فایل تأییدهای محلی را با هم به‌روزرسانی می‌کند؛ خط‌مشی را به Gateway یا میزبان Node ارسال نمی‌کند.
- `--host node` رد می‌شود: تأییدهای اجرای Node هنگام اجرا از خود Node دریافت می‌شوند، بنابراین `exec-policy` محلی نمی‌تواند آن‌ها را همگام کند. در عوض از `openclaw approvals set --node <id|name|ip>` استفاده کنید.
- `exec-policy show` دامنه‌های دارای `host=node` را هنگام اجرا تحت مدیریت Node علامت‌گذاری می‌کند، به‌جای آنکه خط‌مشی مؤثری را از فایل تأییدهای محلی استخراج کند.

برای تأییدهای میزبان راه‌دور، مستقیماً از `openclaw approvals set --gateway` یا `openclaw approvals set --node <id|name|ip>` استفاده کنید.

## فرمان‌های رایج

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` خط‌مشی مؤثر اجرا را برای مقصد نشان می‌دهد: خط‌مشی درخواستی `tools.exec`، خط‌مشی فایل تأییدهای میزبان و نتیجه مؤثر ادغام‌شده. Nodeهایی که خط‌مشی بومی میزبان دارند، مانند برنامه همراه Windows، به‌جای اعمال محاسبات خط‌مشی فایل تأییدهای OpenClaw، همان خط‌مشی را مستقیماً نشان می‌دهند.

برای Nodeهای مبتنی بر فایل، نمای ادغام‌شده به یک اسنپ‌شات خط‌مشی تفکیک‌شده توسط میزبان نیاز دارد. Nodeهای قدیمی‌تر، به‌جای فرض اینکه خط‌مشی درخواستی Gateway روی میزبان نیز اعمال می‌شود، خط‌مشی مؤثر را دردسترس‌نبودنی نشان می‌دهند.

<Note>
بازنویسی‌های `/exec` مختص هر نشست در این بخش لحاظ نمی‌شوند. برای بررسی پیش‌فرض‌های فعلی، `/exec` را در نشست مربوط اجرا کنید.
</Note>

ترتیب تقدم:

- فایل تأییدهای میزبان، منبع حقیقت قابل‌اجرا است.
- خط‌مشی درخواستی `tools.exec` می‌تواند دامنه مقصود را محدودتر یا گسترده‌تر کند، اما نتیجه مؤثر از قواعد میزبان استخراج می‌شود.
- `--node` فایل تأییدهای میزبان Node را با خط‌مشی `tools.exec` در Gateway ترکیب می‌کند (هر دو هنگام اجرا اعمال می‌شوند).
- اگر پیکربندی Gateway دردسترس نباشد، CLI به اسنپ‌شات تأییدهای Node بازمی‌گردد و یادآوری می‌کند که خط‌مشی نهایی زمان اجرا قابل محاسبه نبوده است.

## جایگزینی تأییدها از یک فایل

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` علاوه بر JSON سخت‌گیرانه، JSON5 را نیز می‌پذیرد. فقط یکی از `--file` یا `--stdin` را استفاده کنید، نه هر دو را.

Nodeهای Windows با خط‌مشی بومی میزبان، از ساختار خط‌مشی مخصوص خود استفاده می‌کنند:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI ابتدا هش فعلی Node را می‌خواند و آن را همراه به‌روزرسانی ارسال می‌کند تا ویرایش‌های محلی هم‌زمان، به‌جای بازنویسی‌شدن، رد شوند. `rules` الزامی است، زیرا این عملیات فهرست کامل قواعد Node را جایگزین می‌کند؛ `defaultAction` اختیاری است. Nodeای که خط‌مشی بومی خود را غیرفعال گزارش می‌کند، از راه دور قابل پیکربندی نیست؛ ابتدا خط‌مشی را روی آن میزبان فعال یا پیکربندی کنید. خط‌مشی‌های بومی میزبان از ابزارهای کمکی `allowlist add|remove` پشتیبانی نمی‌کنند.

## نمونه «هرگز درخواست نکن» / YOLO

برای میزبانی که نباید هرگز به‌دلیل تأییدهای اجرا متوقف شود، پیش‌فرض‌های تأیید میزبان را روی `full` + `off` تنظیم کنید:

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

برای Nodeهایی که یک فایل تأییدهای OpenClaw ارائه می‌کنند، همین بدنه را با `openclaw approvals set --node <id|name|ip> --stdin` استفاده کنید. Nodeهای بومی میزبان به ساختار مخصوص مالک خود که در بالا نشان داده شد نیاز دارند.

این کار فقط **فایل تأییدهای میزبان** را تغییر می‌دهد. برای هم‌راستا نگه‌داشتن خط‌مشی درخواستی OpenClaw، موارد زیر را نیز تنظیم کنید:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

مقدار `tools.exec.host=gateway` در اینجا صریح است، زیرا `host=auto` همچنان به‌معنای «در صورت دردسترس‌بودن sandbox، از آن استفاده کن؛ در غیر این صورت Gateway» است: YOLO درباره تأییدها است، نه مسیریابی. وقتی حتی با وجود یک sandbox پیکربندی‌شده اجرای میزبان را می‌خواهید، از `gateway` (یا `/exec host=gateway`) استفاده کنید.

اگر `askFallback` حذف شود، مقدار پیش‌فرض آن `deny` است. هنگام ارتقای میزبانی بدون رابط کاربری که باید رفتار بدون درخواست را حفظ کند، `askFallback: "full"` را صریحاً تنظیم کنید.

میان‌بر محلی برای همین مقصود، فقط روی دستگاه محلی:

```bash
openclaw exec-policy preset yolo
```

## ابزارهای کمکی فهرست مجاز

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## گزینه‌های رایج

`get`، `set` و `allowlist add|remove` همگی از موارد زیر پشتیبانی می‌کنند:

- `--node <id|name|ip>` (شناسه، نام، آدرس IP یا پیشوند شناسه را تفکیک می‌کند؛ همان تفکیک‌کننده `openclaw nodes`)
- `--gateway`
- گزینه‌های مشترک RPC مربوط به Node: `--url`، `--token`، `--timeout`، `--json`

نبود پرچم مقصد به‌معنای فایل تأییدهای محلی روی دیسک است.

`allowlist add|remove` همچنین از `--agent <id>` پشتیبانی می‌کند (مقدار پیش‌فرض `"*"` است و برای همه عامل‌ها اعمال می‌شود).

## نکات

- میزبان Node باید `system.execApprovals.get/set` را اعلام کند (برنامه macOS، میزبان Node بدون رابط گرافیکی یا برنامه همراه Windows).
- فایل‌های تأیید برای هر میزبان در پوشه وضعیت OpenClaw ذخیره می‌شوند: `$OPENCLAW_STATE_DIR/exec-approvals.json`، یا اگر متغیر تنظیم نشده باشد، `~/.openclaw/exec-approvals.json`.

## مرتبط

- [مرجع CLI](/fa/cli)
- [تأییدهای اجرا](/fa/tools/exec-approvals)

---
read_when:
    - شما از Plugin voice-call استفاده می‌کنید و همهٔ نقاط ورود CLI را می‌خواهید
    - به جدول‌های پرچم و پیش‌فرض‌ها برای setup، smoke، call، continue، speak، dtmf، end، status، tail، latency، expose و start نیاز دارید
summary: مرجع CLI برای `openclaw voicecall` (سطح فرمان Plugin تماس صوتی)
title: تماس صوتی
x-i18n:
    generated_at: "2026-05-10T19:34:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` یک فرمان ارائه‌شده توسط Plugin است. این فرمان فقط زمانی ظاهر می‌شود که Plugin تماس صوتی نصب و فعال شده باشد.

وقتی Gateway در حال اجراست، فرمان‌های عملیاتی (`call`، `start`، `continue`، `speak`، `dtmf`، `end`، `status`) به runtime تماس صوتی همان Gateway مسیریابی می‌شوند. اگر هیچ Gateway قابل دسترسی نباشد، به runtime مستقل CLI بازمی‌گردند.

## زیرفرمان‌ها

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| زیرفرمان | توضیح                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | بررسی‌های آمادگی provider و Webhook را نشان می‌دهد.                     |
| `smoke`    | بررسی‌های آمادگی را اجرا می‌کند؛ فقط با `--yes` یک تماس آزمایشی زنده برقرار می‌کند. |
| `call`     | یک تماس صوتی خروجی را آغاز می‌کند.                                |
| `start`    | نام مستعار `call` است که در آن `--to` الزامی و `--message` اختیاری است. |
| `continue` | یک پیام را پخش می‌کند و منتظر پاسخ بعدی می‌ماند.                 |
| `speak`    | یک پیام را بدون انتظار برای پاسخ پخش می‌کند.                 |
| `dtmf`     | ارقام DTMF را به یک تماس فعال ارسال می‌کند.                             |
| `end`      | یک تماس فعال را قطع می‌کند.                                         |
| `status`   | تماس‌های فعال را بررسی می‌کند (یا یکی را با `--call-id`).                   |
| `tail`     | `calls.jsonl` را دنبال می‌کند (در آزمون‌های provider مفید است).              |
| `latency`  | معیارهای تأخیر نوبت را از `calls.jsonl` خلاصه می‌کند.              |
| `expose`   | serve/funnel در Tailscale را برای endpoint وب‌هوک روشن یا خاموش می‌کند.         |

## راه‌اندازی و smoke

### `setup`

به‌طور پیش‌فرض بررسی‌های آمادگی خوانا برای انسان را چاپ می‌کند. برای اسکریپت‌ها `--json` را ارسال کنید.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

همان بررسی‌های آمادگی را اجرا می‌کند. مگر اینکه هر دو `--to` و `--yes` وجود داشته باشند، تماس تلفنی واقعی برقرار نمی‌کند.

| پرچم               | پیش‌فرض                           | توضیح                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (هیچ)                            | شماره تلفنی که برای smoke زنده با آن تماس گرفته می‌شود.  |
| `--message <text>` | `OpenClaw voice call smoke test.` | پیامی که در تماس smoke پخش می‌شود. |
| `--mode <mode>`    | `notify`                          | حالت تماس: `notify` یا `conversation`.  |
| `--yes`            | `false`                           | واقعاً تماس خروجی زنده را برقرار می‌کند.  |
| `--json`           | `false`                           | JSON قابل خواندن توسط ماشین را چاپ می‌کند.            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
برای providerهای خارجی (`twilio`، `telnyx`، `plivo`)، `setup` و `smoke` به یک URL عمومی Webhook از `publicUrl`، یک تونل، یا نمایان‌سازی Tailscale نیاز دارند. جایگزین loopback یا serve خصوصی رد می‌شود، زیرا carrierها نمی‌توانند به آن دسترسی داشته باشند.
</Note>

## چرخه عمر تماس

### `call`

یک تماس صوتی خروجی را آغاز می‌کند.

| پرچم                   | الزامی | پیش‌فرض           | توضیح                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | بله      | (هیچ)            | پیامی که هنگام وصل شدن تماس پخش می‌شود.                                   |
| `-t, --to <phone>`     | خیر       | config `toNumber` | شماره تلفن E.164 برای تماس.                                                |
| `--mode <mode>`        | خیر       | `conversation`    | حالت تماس: `notify` (قطع پس از پیام) یا `conversation` (باز بماند). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

نام مستعار `call` با شکل متفاوتی از پرچم‌های پیش‌فرض.

| پرچم               | الزامی | پیش‌فرض        | توضیح                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | بله      | (هیچ)         | شماره تلفنی که باید با آن تماس گرفته شود.                    |
| `--message <text>` | خیر       | (هیچ)         | پیامی که هنگام وصل شدن تماس پخش می‌شود. |
| `--mode <mode>`    | خیر       | `conversation` | حالت تماس: `notify` یا `conversation`.   |

### `continue`

یک پیام را پخش می‌کند و منتظر پاسخ می‌ماند.

| پرچم               | الزامی | توضیح       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | بله      | شناسه تماس.          |
| `--message <text>` | بله      | پیامی که باید پخش شود. |

### `speak`

یک پیام را بدون انتظار برای پاسخ پخش می‌کند.

| پرچم               | الزامی | توضیح       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | بله      | شناسه تماس.          |
| `--message <text>` | بله      | پیامی که باید پخش شود. |

### `dtmf`

ارقام DTMF را به یک تماس فعال ارسال می‌کند.

| پرچم                | الزامی | توضیح                               |
| ------------------- | -------- | ----------------------------------------- |
| `--call-id <id>`    | بله      | شناسه تماس.                                  |
| `--digits <digits>` | بله      | ارقام DTMF (برای مثال `ww123456#` برای مکث‌ها). |

### `end`

یک تماس فعال را قطع می‌کند.

| پرچم             | الزامی | توضیح |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | بله      | شناسه تماس.    |

### `status`

تماس‌های فعال را بررسی می‌کند.

| پرچم             | پیش‌فرض | توضیح                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | (هیچ)  | خروجی را به یک تماس محدود می‌کند. |
| `--json`         | `false` | JSON قابل خواندن توسط ماشین را چاپ می‌کند. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## گزارش‌ها و معیارها

### `tail`

گزارش JSONL تماس صوتی را دنبال می‌کند. هنگام شروع، آخرین `--since` خط را چاپ می‌کند و سپس خط‌های جدید را هنگام نوشته شدن stream می‌کند.

| پرچم            | پیش‌فرض                    | توضیح                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | از store مربوط به Plugin حل می‌شود | مسیر `calls.jsonl`.         |
| `--since <n>`   | `25`                       | خط‌هایی که قبل از دنبال کردن چاپ می‌شوند. |
| `--poll <ms>`   | `250` (حداقل 50)         | بازه polling بر حسب میلی‌ثانیه. |

### `latency`

معیارهای تأخیر نوبت و انتظار شنیدن را از `calls.jsonl` خلاصه می‌کند. خروجی JSON با خلاصه‌های `recordsScanned`، `turnLatency`، و `listenWait` است.

| پرچم            | پیش‌فرض                    | توضیح                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | از store مربوط به Plugin حل می‌شود | مسیر `calls.jsonl`.               |
| `--last <n>`    | `200` (حداقل 1)          | تعداد رکوردهای اخیر برای تحلیل. |

## نمایان‌سازی وب‌هوک‌ها

### `expose`

پیکربندی serve/funnel در Tailscale را برای وب‌هوک صوتی فعال، غیرفعال، یا تغییر می‌دهد.

| پرچم                  | پیش‌فرض                                   | توضیح                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`، `serve` (tailnet)، یا `funnel` (عمومی). |
| `--path <path>`       | config `tailscale.path` یا `--serve-path` | مسیر Tailscale برای نمایان‌سازی.                       |
| `--port <port>`       | config `serve.port` یا `3334`             | پورت محلی Webhook.                             |
| `--serve-path <path>` | config `serve.path` یا `/voice/webhook`   | مسیر محلی Webhook.                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
endpoint وب‌هوک را فقط در شبکه‌هایی که به آن‌ها اعتماد دارید نمایان کنید. در صورت امکان، Tailscale Serve را به Funnel ترجیح دهید.
</Warning>

## مرتبط

- [مرجع CLI](/fa/cli)
- [Plugin تماس صوتی](/fa/plugins/voice-call)

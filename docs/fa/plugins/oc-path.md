---
read_when:
    - می‌خواهید یک گره برگ واحد را درون یک فایل فضای کاری از طریق ترمینال بررسی یا ویرایش کنید
    - شما بر اساس وضعیت فضای کاری اسکریپت‌نویسی می‌کنید و به یک طرح آدرس‌دهی پایدار و مستقل از نوع نیاز دارید.
    - شما در حال تصمیم‌گیری هستید که آیا Plugin اختیاری `oc-path` را روی یک Gateway خودمیزبان فعال کنید
summary: 'Plugin همراه `oc-path`: CLI ‏`openclaw path` را برای طرح آدرس‌دهی فایل‌های فضای کاری `oc://` ارائه می‌کند'
title: Plugin مسیر OC
x-i18n:
    generated_at: "2026-06-27T18:21:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin همراه `oc-path`، CLI [`openclaw path`](/fa/cli/path) را برای طرح آدرس‌دهی فایل‌های فضای کاری `oc://` اضافه می‌کند. این مورد در مخزن OpenClaw زیر
`extensions/oc-path/` ارائه می‌شود، اما اختیاری است؛ install/build آن را تا زمانی که
فعال کنید غیرفعال نگه می‌دارد.

آدرس‌های `oc://` به یک برگ واحد (یا مجموعه‌ای wildcard از برگ‌ها) داخل
یک فایل فضای کاری اشاره می‌کنند. این Plugin امروز چهار نوع فایل را می‌شناسد:

- **markdown** (`.md`, `.mdx`): frontmatter، بخش‌ها، آیتم‌ها، فیلدها
- **jsonc** (`.jsonc`, `.json5`, `.json`): کامنت‌ها و قالب‌بندی حفظ می‌شوند
- **jsonl** (`.jsonl`, `.ndjson`): رکوردهای خط‌محور
- **yaml** (`.yaml`, `.yml`, `.lobster`): گره‌های map/sequence/scalar از طریق
  API سند YAML

خودمیزبان‌ها و افزونه‌های ویرایشگر از CLI برای خواندن یا نوشتن یک برگ واحد
بدون اسکریپت‌نویسی مستقیم روی SDK استفاده می‌کنند؛ agentها و hookها آن را به‌عنوان
یک زیرلایه قطعی در نظر می‌گیرند تا رفت‌وبرگشت‌های byte-fidelity و محافظ sentinel
حذف اطلاعات به‌صورت یکنواخت روی همه نوع‌ها اعمال شوند.

## چرا آن را فعال کنیم

وقتی می‌خواهید اسکریپت‌ها، hookها، یا ابزارهای agent محلی به یک بخش دقیق
از وضعیت فضای کاری اشاره کنند، بدون اینکه برای هر شکل فایل parser بسازند،
`oc-path` را فعال کنید. یک آدرس `oc://` می‌تواند یک کلید frontmatter در markdown،
یک آیتم بخش، یک برگ پیکربندی JSONC، یک فیلد رویداد JSONL، یا یک گام workflow در YAML را نام‌گذاری کند.

این برای workflowهای نگه‌دارنده مهم است، جایی که تغییر باید کوچک،
قابل حسابرسی، و تکرارپذیر باشد: یک مقدار را بررسی کنید، رکوردهای مطابق را بیابید،
نوشتن را dry-run کنید، سپس فقط همان برگ را اعمال کنید و کامنت‌ها، پایان خط‌ها، و
قالب‌بندی اطراف را دست‌نخورده بگذارید. اختیاری نگه داشتن این قابلیت به‌عنوان یک Plugin
به کاربران پیشرفته زیرلایه آدرس‌دهی می‌دهد، بدون اینکه وابستگی‌های parser یا سطح CLI را
برای نصب‌هایی که هرگز به آن نیاز ندارند وارد core کند.

دلایل رایج برای فعال‌سازی آن:

- **اتوماسیون محلی**: اسکریپت‌های shell می‌توانند با `openclaw path … --json`
  یک مقدار فضای کاری را resolve یا update کنند، به‌جای اینکه کدهای جداگانه parsing برای markdown، JSONC،
  JSONL، و YAML حمل کنند.
- **ویرایش‌های قابل مشاهده برای agent**: یک agent می‌تواند پیش از نوشتن، diff مربوط به dry-run
  را برای یک برگ آدرس‌دهی‌شده نشان دهد، که بازبینی آن از بازنویسی آزادانه فایل آسان‌تر است.
- **یکپارچه‌سازی‌های ویرایشگر**: یک ویرایشگر می‌تواند `oc://AGENTS.md/tools/gh` را به
  گره دقیق markdown و شماره خط نگاشت کند، بدون اینکه از متن heading حدس بزند.
- **عیب‌یابی**: `emit` یک فایل را از طریق parser و emitter رفت‌وبرگشت می‌دهد، بنابراین
  می‌توانید بررسی کنید آیا یک نوع فایل پیش از تکیه بر ویرایش‌های خودکار byte-stable است یا نه.

نمونه‌های مشخص:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

این Plugin عمدا مالک معناشناسی سطح بالاتر نیست. Pluginهای memory
همچنان مالک نوشتن‌های memory هستند، commandهای config همچنان مالک مدیریت کامل config هستند،
و منطق LKG همچنان مالک restore/promotion است. `oc-path` لایه باریک
آدرس‌دهی و عملیات فایل با حفظ byte است که آن ابزارهای سطح بالاتر
می‌توانند پیرامون آن ساخته شوند.

## کجا اجرا می‌شود

این Plugin **درون‌فرآیندی داخل CLI `openclaw`** روی میزبانی اجرا می‌شود که
command را در آن فراخوانی می‌کنید. به Gateway در حال اجرا نیاز ندارد و هیچ
socket شبکه‌ای باز نمی‌کند؛ هر verb یک تبدیل خالص روی فایلی است که به آن اشاره می‌کنید.

متادیتای Plugin در `extensions/oc-path/openclaw.plugin.json` قرار دارد:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` این Plugin را از hot path مربوط به Gateway بیرون نگه می‌دارد. `onCommands:
["path"]` به CLI می‌گوید نخستین بار که `openclaw path …` را اجرا می‌کنید،
Plugin را به‌صورت lazy بارگذاری کند، بنابراین نصب‌هایی که هرگز از این verb استفاده نمی‌کنند هزینه‌ای نمی‌پردازند.

## فعال‌سازی

```bash
openclaw plugins enable oc-path
```

Gateway را restart کنید (اگر یکی اجرا می‌کنید) تا snapshot manifest وضعیت جدید را بگیرد.
فراخوانی‌های ساده `openclaw path` بلافاصله روی همان میزبان کار می‌کنند؛
CLI این Plugin را در زمان نیاز بارگذاری می‌کند.

غیرفعال‌سازی با:

```bash
openclaw plugins disable oc-path
```

## وابستگی‌ها

همه وابستگی‌های parser محلیِ Plugin هستند؛ فعال کردن `oc-path` بسته‌های
جدید را وارد runtime اصلی نمی‌کند:

| وابستگی       | هدف                                                                    |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | سیم‌کشی subcommand برای `resolve`, `find`, `set`, `validate`, `emit`.  |
| `jsonc-parser` | parse کردن JSONC + ویرایش برگ‌ها با حفظ کامنت‌ها و trailing commaها.  |
| `markdown-it`  | tokenization در Markdown برای مدل section / item / field.             |
| `yaml`         | parse / emit / edit سند YAML `Document` با حفظ کامنت‌ها و flow style. |

JSONL همچنان دستی پیاده‌سازی شده است؛ parsing خط‌محور از هر
وابستگی‌ای ساده‌تر است، و parse کردن JSONC در هر خط از قبل از مسیر `jsonc-parser` عبور می‌کند.

## چه چیزی فراهم می‌کند

| سطح                            | فراهم‌شده توسط                                          |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| parser / formatter برای `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| parse / emit / edit بر اساس نوع | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| resolve / find / set همگانی    | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| محافظ redaction-sentinel       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI امروز تنها سطح عمومی است. verbهای زیرلایه برای
Plugin خصوصی هستند؛ مصرف‌کنندگان از CLI استفاده می‌کنند (یا Plugin خودشان را بر پایه SDK می‌سازند).

## رابطه با Pluginهای دیگر

- **`memory-*`**: نوشتن‌های memory از مسیر Pluginهای memory انجام می‌شوند، نه `oc-path`.
  `oc-path` یک زیرلایه عمومی فایل است؛ Pluginهای memory معناشناسی خودشان را
  روی آن لایه‌بندی می‌کنند.
- **LKG**: `path` درباره restore پیکربندی Last-Known-Good چیزی نمی‌داند. اگر یک
  فایل تحت رهگیری LKG باشد، فراخوانی بعدی `observe` تصمیم می‌گیرد که promote کند یا
  recover؛ `set --batch` برای multi-set اتمیک از طریق چرخه عمر promote/recover در LKG
  همراه با زیرلایه LKG-recovery برنامه‌ریزی شده است.

## ایمنی

`set` byteهای خام را از طریق مسیر emit زیرلایه می‌نویسد، که محافظ
redaction-sentinel را به‌صورت خودکار اعمال می‌کند. برگی که
`__OPENCLAW_REDACTED__` را حمل کند (عینا یا به‌عنوان substring) در زمان نوشتن
با `OC_EMIT_SENTINEL` رد می‌شود. CLI همچنین sentinel لفظی را از هر
خروجی انسانی یا JSON که چاپ می‌کند پاک می‌کند و آن را با `[REDACTED]` جایگزین می‌کند تا captureهای terminal
و pipelineها هرگز marker را نشت ندهند.

## مرتبط

- [مرجع CLI `openclaw path`](/fa/cli/path)
- [مدیریت Pluginها](/fa/plugins/manage-plugins)
- [ساخت Pluginها](/fa/plugins/building-plugins)
